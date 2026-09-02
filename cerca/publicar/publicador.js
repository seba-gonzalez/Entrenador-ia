/* ==========================================================================
   CERCA · Publicador de sesiones (interno)
   --------------------------------------------------------------------------
   Pegar una sesion, revisarla, publicarla y llevarse el enlace. Sin commit,
   sin Vercel, sin computador.

   El revisor de abajo es la red que se pierde al sacar las sesiones del
   repositorio: alli las comprobaciones corrian en CI. Aqui corren en el
   momento de publicar, que es cuando todavia se puede arreglar.
   ========================================================================== */

const $ = s => document.querySelector(s);
let CLAVE = '';

const cab = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
});

async function rpc(nombre, cuerpo) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
    method: 'POST', headers: cab(), body: JSON.stringify(cuerpo)
  });
  const texto = await r.text();
  if (!r.ok) {
    if (texto.includes('clave incorrecta')) throw new Error('La clave de publicación no es correcta.');
    if (texto.includes('cerca_entregas') && texto.includes('does not exist')) {
      throw new Error('Falta correr el SQL de instalación (cerca/sql/001-entregas.sql) en Supabase.');
    }
    throw new Error('Supabase respondió con un error. ' + texto.slice(0, 180));
  }
  return texto ? JSON.parse(texto) : null;
}

/* --- Revisor -------------------------------------------------------------
   Comprueba estructura, no criterio de entrenamiento. Nunca opina sobre si
   una carga es alta o si faltan ejercicios: eso es del entrenador. */
function revisar(s) {
  const mal = [], bien = [];
  const exigir = (cond, texto) => { (cond ? bien : mal).push(texto); return cond; };

  if (!exigir(s && typeof s === 'object', 'La sesión es un objeto')) return { mal, bien };
  exigir(s.formato === 1, 'Declara "formato": 1');
  exigir(typeof s.alumno === 'string' && s.alumno, 'Tiene nombre de alumno');
  exigir(/^[a-z0-9_-]+$/.test(s.alumno_slug || ''), 'El alumno_slug es simple (minúsculas, sin tildes ni espacios)');
  if (!exigir(Array.isArray(s.dias) && s.dias.length, 'Tiene al menos un día')) return { mal, bien };

  const sesionIds = new Set();
  let bloques = 0, ejercicios = 0, casilleros = 0;

  s.dias.forEach((d, i) => {
    const donde = `día ${i + 1}`;
    exigir(typeof d.id === 'string' && d.id, `${donde}: tiene id`);
    exigir(typeof d.nav === 'string' && d.nav, `${donde}: tiene rótulo de pestaña`);
    exigir(typeof d.titulo === 'string' && d.titulo, `${donde}: tiene título`);
    if (exigir(typeof d.sesion_id === 'string' && d.sesion_id, `${donde}: tiene sesion_id`)) {
      exigir(!sesionIds.has(d.sesion_id), `${donde}: su sesion_id no se repite («${d.sesion_id}»)`);
      sesionIds.add(d.sesion_id);
    }
    if (!Array.isArray(d.bloques) || !d.bloques.length) { mal.push(`${donde}: no tiene bloques`); return; }

    const idsBloque = new Set(), codigos = new Set();
    d.bloques.forEach(b => {
      bloques++;
      if (!b.id) { mal.push(`${donde}: hay un bloque sin id`); return; }
      if (idsBloque.has(b.id)) mal.push(`${donde}: el bloque «${b.id}» está dos veces`);
      idsBloque.add(b.id);
      if (b.tipo === 'mision' && (!Array.isArray(b.opciones) || !b.opciones.length)) {
        mal.push(`${donde} · ${b.id}: es una misión y no tiene opciones`);
      }
      (b.ejercicios || []).forEach(e => {
        ejercicios++;
        if (!e.nombre) mal.push(`${donde} · ${b.id}: hay un ejercicio sin nombre`);
        if (e.codigo) {
          if (codigos.has(e.codigo)) mal.push(`${donde}: el código «${e.codigo}» está dos veces`);
          codigos.add(e.codigo);
        }
      });
      [b, ...(b.ejercicios || [])].forEach(x => {
        if (!x.registro) return;
        const quien = `${donde} · ${x.codigo || x.id || x.nombre}`;
        if (!Array.isArray(x.registro.campos) || !x.registro.campos.length) {
          mal.push(`${quien}: tiene registro sin campos`); return;
        }
        x.registro.campos.forEach(c => {
          casilleros++;
          if (!c.campo || !c.etiqueta || !c.unidad) mal.push(`${quien}: un casillero no dice campo, etiqueta o unidad`);
          if (typeof c.prescrito !== 'boolean') { mal.push(`${quien} · ${c.campo}: no dice si el valor venía prescrito`); return; }
          // Lo prescrito tiene que poder mostrarse al lado del casillero, y lo
          // no prescrito tiene que decir POR QUE no lo esta. Un desconocido sin
          // motivo se lee despues como un olvido.
          if (c.prescrito && !c.texto) mal.push(`${quien} · ${c.campo}: dice que venía prescrito pero no trae el valor`);
          if (!c.prescrito && !c.motivo) mal.push(`${quien} · ${c.campo}: no venía prescrito y no explica por qué`);
          if (c.prescrito && (typeof c.min === 'number') !== (typeof c.max === 'number')) {
            mal.push(`${quien} · ${c.campo}: tiene solo uno de los dos extremos del rango`);
          }
          if (typeof c.min === 'number' && typeof c.max === 'number' && c.min > c.max) {
            mal.push(`${quien} · ${c.campo}: el mínimo es mayor que el máximo`);
          }
        });
      });
      if (!Array.isArray(b.ejercicios) && b.tipo !== 'mision') {
        mal.push(`${donde} · ${b.id}: no tiene ejercicios`);
      }
    });
    if (!d.feedback || !d.feedback.titulo) mal.push(`${donde}: no tiene la pregunta de feedback`);
  });

  bien.push(`${s.dias.length} día(s) · ${bloques} bloques · ${ejercicios} ejercicios · ${casilleros} casilleros de registro`);
  return { mal, bien };
}

async function huella(objeto) {
  const bytes = new TextEncoder().encode(JSON.stringify(objeto));
  const r = await crypto.subtle.digest('SHA-256', bytes);
  return 'sha256:' + [...new Uint8Array(r)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function token() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decir(nodo, texto, clase) {
  const n = $(nodo);
  n.textContent = texto;
  n.className = 'estado' + (clase ? ' ' + clase : '');
}

/* --- Puerta --------------------------------------------------------------- */
function entrar() {
  const v = $('#clave').value.trim();
  if (!v) { decir('#estadoPuerta', 'Escribe la clave.', 'mal'); return; }
  CLAVE = v;
  try { sessionStorage.setItem('cerca-publicar', v); } catch (e) {}
  $('#puerta').classList.add('oculto');
  $('#app').classList.remove('oculto');
}
$('#entrar').onclick = entrar;
$('#clave').onkeydown = e => { if (e.key === 'Enter') entrar(); };
try {
  const g = sessionStorage.getItem('cerca-publicar');
  if (g) { $('#clave').value = g; entrar(); }
} catch (e) {}

/* --- Revisar -------------------------------------------------------------- */
let SESION = null;

function leerJson() {
  try { return JSON.parse($('#json').value); }
  catch (e) { throw new Error('El texto no es un JSON válido. ' + e.message); }
}

$('#revisar').onclick = () => {
  const lista = $('#chequeo');
  lista.classList.remove('oculto');
  lista.replaceChildren();
  let s;
  try { s = leerJson(); }
  catch (e) { SESION = null; $('#publicar').disabled = true; $('#publicar').textContent = 'Revisa primero'; decir('#estadoPub', e.message, 'mal'); return; }

  const { mal, bien } = revisar(s);
  [...mal.map(t => ['mal', '✕ ' + t]), ...bien.map(t => ['', '✓ ' + t])].forEach(([c, t]) => {
    const li = document.createElement('li');
    li.className = c; li.textContent = t;
    lista.appendChild(li);
  });

  if (mal.length) {
    SESION = null;
    $('#publicar').disabled = true;
    $('#publicar').textContent = 'Arregla lo marcado';
    decir('#estadoPub', `${mal.length} cosa(s) por arreglar antes de publicar.`, 'mal');
  } else {
    SESION = s;
    $('#publicar').disabled = false;
    $('#publicar').textContent = 'Publicar y darme el enlace';
    decir('#estadoPub', 'La sesión está lista para publicarse.', 'bien');
  }
};

$('#ordenar').onclick = () => {
  try { $('#json').value = JSON.stringify(leerJson(), null, 2); decir('#estadoPub', 'Texto ordenado.', 'bien'); }
  catch (e) { decir('#estadoPub', e.message, 'mal'); }
};

/* --- Traer la ultima ------------------------------------------------------ */
$('#traer').onclick = async () => {
  const alumno = $('#alumno').value.trim();
  if (!alumno) { decir('#estadoTraer', 'Escribe primero de quién es.', 'mal'); return; }
  decir('#estadoTraer', 'Buscando…');
  try {
    const filas = await rpc('cerca_entregas_de', { p_clave: CLAVE, p_alumno: alumno });
    if (!filas || !filas.length) { decir('#estadoTraer', 'Todavía no hay nada publicado para ' + alumno + '.', 'mal'); return; }
    const ultima = filas[0];
    $('#json').value = JSON.stringify(ultima.sesion, null, 2);
    if (ultima.plan) $('#plan').value = ultima.plan;
    decir('#estadoTraer', `Traída la del ${new Date(ultima.publicado_en).toLocaleDateString('es-CL')}. Cámbiale lo que haga falta y revisa.`, 'bien');
  } catch (e) { decir('#estadoTraer', e.message, 'mal'); }
};

/* Arranque en frio: la primera vez no hay nada publicado que traer, y el
   archivo vive en GitHub. Este boton lo carga desde el propio sitio para no
   tener que ir a buscarlo. Cuando ya haya historia en Supabase sobra: lo
   cubre "Traer la ultima entrega". */
$('#molde').onclick = async () => {
  decir('#estadoTraer', 'Cargando…');
  try {
    const r = await fetch('/sesiones/kecJVd0cI2VQVobjAof6xg.json');
    if (!r.ok) throw new Error('No encontré la sesión de ejemplo en este sitio.');
    $('#json').value = JSON.stringify(await r.json(), null, 2);
    $('#alumno').value = 'nico';
    $('#plan').value = 'nico-v1';
    decir('#estadoTraer', 'Lista. Aprieta Revisar y después Publicar.', 'bien');
  } catch (e) { decir('#estadoTraer', e.message, 'mal'); }
};

/* --- Publicar ------------------------------------------------------------- */
$('#publicar').onclick = async () => {
  if (!SESION) return;
  const alumno = $('#alumno').value.trim();
  const plan = $('#plan').value.trim() || null;
  if (!alumno) { decir('#estadoPub', 'Falta de quién es.', 'mal'); return; }
  if (SESION.alumno_slug !== alumno) {
    decir('#estadoPub', `La sesión dice que es de «${SESION.alumno_slug}» y arriba escribiste «${alumno}». Deben coincidir.`, 'mal');
    return;
  }

  const boton = $('#publicar');
  boton.disabled = true;
  boton.textContent = 'Publicando…';
  try {
    const t = token();
    await rpc('cerca_publicar', {
      p_clave: CLAVE, p_token: t, p_alumno: alumno, p_plan: plan,
      p_sesion: SESION, p_hash: await huella(SESION), p_nota: $('#nota').value.trim() || null
    });
    const url = BASE_ALUMNO + '?e=' + t;
    $('#url').textContent = url;
    $('#abrir').href = url;
    $('#enlace').classList.add('on');
    decir('#estadoPub', 'Publicada. La entrega anterior quedó jubilada, no borrada.', 'bien');
    // Queda cerrado a proposito: publicar dos veces seguidas por un doble
    // toque crearia dos entregas y jubilaria la que se acaba de mandar.
    // Para publicar otra vez hay que volver a revisar.
    boton.textContent = 'Publicada ✓';
    SESION = null;
    listar();
  } catch (e) {
    decir('#estadoPub', e.message, 'mal');
    boton.disabled = false;
    boton.textContent = 'Publicar y darme el enlace';
  }
};

$('#copiar').onclick = async () => {
  try { await navigator.clipboard.writeText($('#url').textContent); decir('#estadoPub', 'Enlace copiado.', 'bien'); }
  catch (e) { decir('#estadoPub', 'No pude copiar. Selecciónalo a mano.', 'mal'); }
};

/* --- Listar --------------------------------------------------------------- */
async function listar() {
  const caja = $('#tabla');
  caja.textContent = 'Cargando…';
  try {
    const filas = await rpc('cerca_entregas_de', { p_clave: CLAVE, p_alumno: $('#alumno').value.trim() || null });
    if (!filas || !filas.length) { caja.textContent = 'Todavía no hay nada publicado.'; return; }
    const t = document.createElement('table');
    const thead = t.createTHead().insertRow();
    ['Alumno', 'Plan', 'Publicada', 'Estado', 'Nota', 'Enlace'].forEach(h => {
      const th = document.createElement('th'); th.textContent = h; thead.appendChild(th);
    });
    const tb = t.createTBody();
    filas.forEach(f => {
      const r = tb.insertRow();
      if (!f.vigente) r.className = 'jub';
      [f.alumno_slug, f.plan || '—', new Date(f.publicado_en).toLocaleDateString('es-CL'),
       f.vigente ? 'vigente' : 'jubilada', f.nota || '—'].forEach(v => r.insertCell().textContent = v);
      const c = r.insertCell();
      if (f.vigente) {
        const a = document.createElement('a');
        a.href = BASE_ALUMNO + '?e=' + f.token; a.target = '_blank'; a.rel = 'noopener';
        a.style.color = '#9af9fb'; a.textContent = 'abrir';
        c.appendChild(a);
      } else c.textContent = '—';
    });
    caja.replaceChildren(t);
  } catch (e) { caja.textContent = e.message; }
}
$('#listar').onclick = listar;
