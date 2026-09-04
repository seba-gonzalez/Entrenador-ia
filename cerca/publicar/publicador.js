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
const $$ = s => [...document.querySelectorAll(s)];
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
  const mal = [];
  const exigir = (cond, texto) => { if (!cond) mal.push(texto); return cond; };

  if (!exigir(s && typeof s === 'object', 'Esto no es una sesión.')) return { mal, resumen: '' };
  exigir(s.formato === 1, 'La sesión no dice en qué formato está escrita.');
  exigir(typeof s.alumno === 'string' && s.alumno, 'Falta el nombre del alumno.');
  exigir(/^[a-z0-9_-]+$/.test(s.alumno_slug || ''), 'El nombre corto del alumno debe ir en minúsculas, sin tildes ni espacios.');
  if (!exigir(Array.isArray(s.dias) && s.dias.length, 'La sesión no tiene ningún día.')) return { mal, resumen: '' };

  const sesionIds = new Set();
  let bloques = 0, ejercicios = 0, casilleros = 0, conCheckin = 0;

  s.dias.forEach((d, i) => {
    const donde = `día ${i + 1}`;
    exigir(typeof d.id === 'string' && d.id, `${donde}: le falta el identificador.`);
    exigir(typeof d.nav === 'string' && d.nav, `${donde}: le falta el rótulo de la pestaña.`);
    exigir(typeof d.titulo === 'string' && d.titulo, `${donde}: le falta el título.`);
    if (exigir(typeof d.sesion_id === 'string' && d.sesion_id, `${donde}: le falta el identificador de sesión.`)) {
      exigir(!sesionIds.has(d.sesion_id), `${donde}: repite el identificador de sesión «${d.sesion_id}». Cada día necesita el suyo o después no se pueden distinguir.`);
      sesionIds.add(d.sesion_id);
    }
    if (!Array.isArray(d.bloques) || !d.bloques.length) { mal.push(`${donde}: no tiene ningún bloque.`); return; }

    const idsBloque = new Set();
    d.bloques.forEach(b => {
      // Los codigos identifican dentro de SU bloque, no dentro del dia. Que el
      // calentamiento numere 1..6 y la zona media vuelva a numerar 1..4 no es
      // un error: cada recorrido vive dentro de su bloque y ahi no hay
      // ambiguedad, y los datos ya van separados por bloque.
      const codigos = new Set();
      bloques++;
      if (!b.id) { mal.push(`${donde}: hay un bloque sin identificador.`); return; }
      if (idsBloque.has(b.id)) mal.push(`${donde}: el bloque «${b.id}» aparece dos veces.`);
      idsBloque.add(b.id);
      if (b.tipo === 'mision' && (!Array.isArray(b.opciones) || !b.opciones.length)) {
        mal.push(`${donde}, bloque ${b.id}: es una misión pero no ofrece ninguna opción para elegir.`);
      }
      (b.ejercicios || []).forEach(e => {
        ejercicios++;
        if (!e.nombre) mal.push(`${donde}, bloque ${b.id}: hay un ejercicio sin nombre.`);
        if (e.codigo) {
          if (codigos.has(e.codigo)) mal.push(`${donde}, ${b.titulo || 'bloque ' + b.id}: el código «${e.codigo}» está en dos ejercicios del mismo bloque.`);
          codigos.add(e.codigo);
        }
      });
      [b, ...(b.ejercicios || [])].forEach(x => {
        if (!x.registro) return;
        const quien = `${donde}, ${x.nombre || 'bloque ' + x.id}`;
        // Tres formas de registrar, y cada una guarda sus campos en otro sitio:
        // una lista suelta, una columna por serie, o un solo valor compartido.
        const tipo = x.registro.tipo || 'simple';
        const lista = tipo === 'por_serie' ? x.registro.columnas
                    : tipo === 'carga_compartida' ? (x.registro.campo ? [x.registro.campo] : null)
                    : x.registro.campos;
        if (!Array.isArray(lista) || !lista.length) {
          mal.push(`${quien}: pide anotar algo pero no dice qué.`); return;
        }
        if (tipo === 'por_serie' && !(x.registro.series > 0)) {
          mal.push(`${quien}: registra por serie pero no dice cuántas series son.`);
        }
        lista.forEach(c => {
          casilleros++;
          if (!c.campo || !c.etiqueta || !c.unidad) mal.push(`${quien}: un casillero está incompleto (le falta el nombre o la unidad).`);
          if (typeof c.prescrito !== 'boolean') { mal.push(`${quien}, casillero «${c.etiqueta || c.campo}»: no dice si el valor venía prescrito o no.`); return; }
          // Lo prescrito tiene que poder mostrarse al lado del casillero, y lo
          // no prescrito tiene que decir POR QUE no lo esta. Un desconocido sin
          // motivo se lee despues como un olvido.
          if (c.prescrito && !c.texto) mal.push(`${quien}, casillero «${c.etiqueta || c.campo}»: dice que lo prescribiste pero no trae el número.`);
          // Un casillero solo puede nacer con el valor escrito si ese valor
          // existe. Y prellenarlo cambia de donde sale la confirmacion, asi
          // que no puede colarse por descuido en algo no prescrito.
          if (c.prellenado && !c.prescrito) mal.push(`${quien}, casillero «${c.etiqueta || c.campo}»: aparece con un número ya escrito pero no dice cuál prescribiste.`);
          if (!c.prescrito && !c.motivo) mal.push(`${quien}, casillero «${c.etiqueta || c.campo}»: no lleva número prescrito y no explica por qué. Sin motivo, después se lee como un olvido.`);
          if (c.prescrito && (typeof c.min === 'number') !== (typeof c.max === 'number')) {
            mal.push(`${quien}, casillero «${c.etiqueta || c.campo}»: el rango tiene solo uno de sus dos extremos.`);
          }
          if (typeof c.min === 'number' && typeof c.max === 'number' && c.min > c.max) {
            mal.push(`${quien}, casillero «${c.etiqueta || c.campo}»: el mínimo del rango es mayor que el máximo.`);
          }
        });
      });
      if (!Array.isArray(b.ejercicios) && b.tipo !== 'mision') {
        mal.push(`${donde}, bloque ${b.id}: no tiene ejercicios.`);
      }
    });
    if (!d.feedback || !d.feedback.titulo) mal.push(`${donde}: no le pregunta nada al alumno al terminar.`);

    // El check-in es estandar. Que falte no es un error -puede haber sesiones
    // que no lo pidan- pero la tercera pregunta, si se declara, tiene que
    // estar entera: declarar algo que vigilar sin escribir que mostrarle
    // cuando este peor deja la pregunta sin para que.
    if (d.checkin) {
      conCheckin++;
      const v = d.checkin.vigilancia;
      if (v) {
        exigir(typeof v.id === 'string' && v.id, `${donde}: lo que se vigila no tiene nombre corto.`);
        exigir(typeof v.pregunta === 'string' && v.pregunta, `${donde}: falta la pregunta de lo que se vigila.`);
        exigir(typeof v.aviso === 'string' && v.aviso.trim(),
          `${donde}: se le pregunta por «${v.id || 'algo'}» pero no escribiste qué mostrarle si contesta que está peor.`);
      }
    }
  });

  const dias = s.dias.length;
  const ck = conCheckin === 0 ? 'sin check-in'
           : conCheckin === dias ? (dias === 1 ? 'con check-in' : 'todos con check-in')
           : `check-in en ${conCheckin} de ${dias}`;
  return { mal, resumen:
    `${dias} ${dias === 1 ? 'día' : 'días'} (${ck}) · ${bloques} bloques · ${ejercicios} ejercicios · ` +
    `${casilleros} ${casilleros === 1 ? 'casillero' : 'casilleros'} para anotar.` };
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

/* --- La vista previa ------------------------------------------------------
   No es una imitacion de la pantalla del alumno: es la pantalla del alumno.
   El mismo archivo que ella abre, cargado aqui dentro y alimentado por
   mensaje. Una copia se habria desviado del original, y entonces lo revisado
   no seria lo entregado. */

let SESION = null;      // la ultima sesion valida
let PENDIENTE = null;   // la que espera a que el marco diga que esta listo

window.addEventListener('message', e => {
  if (e.origin !== location.origin) return;
  if (e.data?.cerca === 'lista' && PENDIENTE) {
    $('#vista').contentWindow.postMessage({ cerca: 'sesion', sesion: PENDIENTE }, location.origin);
  }
});

function mostrar(sesion) {
  PENDIENTE = sesion;
  // Recargar el marco es lo que provoca el saludo al que respondemos arriba.
  $('#vista').src = '/s/index.html?p=vista&t=' + Date.now();
}

function veredicto(clase, marca, texto, problemas = []) {
  const caja = $('#veredicto');
  caja.className = 'veredicto' + (clase ? ' ' + clase : '');
  $('#veredictoTexto').textContent = texto;
  caja.querySelector('.marca').textContent = marca;
  const lista = $('#problemas');
  lista.replaceChildren();
  problemas.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    lista.appendChild(li);
  });
}

function leerJson() {
  try { return JSON.parse($('#json').value); }
  catch (e) { throw new Error('lectura'); }
}

/* Una sola frase, y los problemas solo cuando los hay. La lista de todo lo que
   esta bien no le dice nada a nadie. */
function comprobar({ mostrarVista = true } = {}) {
  const boton = $('#publicar');
  if (!$('#json').value.trim()) {
    SESION = null; boton.disabled = true; boton.textContent = 'Trae una sesión';
    veredicto('', '·', 'Trae una sesión arriba para verla aquí.');
    return;
  }

  let s;
  try { s = leerJson(); }
  catch (e) {
    SESION = null; boton.disabled = true; boton.textContent = 'Trae una sesión';
    veredicto('', '·', 'Todavía no puedo leer este texto. Si lo estás editando, sigue: reviso solo cuando pares.');
    return;
  }

  const { mal, resumen } = revisar(s);
  if (mal.length) {
    SESION = null;
    boton.disabled = true;
    boton.textContent = 'Arregla lo de arriba';
    veredicto('mal', '✕',
      mal.length === 1 ? 'Hay una cosa que arreglar antes de publicar:'
                       : `Hay ${mal.length} cosas que arreglar antes de publicar:`, mal);
  } else {
    SESION = s;
    boton.disabled = false;
    boton.textContent = 'Publicar y darme el enlace';
    veredicto('bien', '✓', 'Todo bien. ' + resumen);
  }
  if (mostrarVista) mostrar(s);
}

/* Mientras escribe no se le grita: se espera a que pare. */
let reloj = null;
$('#json').addEventListener('input', () => {
  clearTimeout(reloj);
  reloj = setTimeout(() => comprobar(), 700);
});

$('#ordenar').onclick = () => {
  try { $('#json').value = JSON.stringify(leerJson(), null, 2); comprobar(); }
  catch (e) { veredicto('mal', '✕', 'No puedo ordenar este texto porque todavía no se puede leer.'); }
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
    decir('#estadoTraer', `Traída la del ${new Date(ultima.publicado_en).toLocaleDateString('es-CL')}. Mírala abajo y cámbiale lo que haga falta.`, 'bien');
    comprobar();
  } catch (e) { decir('#estadoTraer', e.message, 'mal'); }
};

/* Arranque en frio: la primera vez no hay nada publicado que traer, y el
   archivo vive en GitHub. Estos botones lo cargan desde el propio sitio para
   no tener que ir a buscarlo. Cuando ya haya historia en Supabase sobran: lo
   cubre "Traer la ultima entrega". */
const MOLDES = {
  nico:   { archivo: 'kecJVd0cI2VQVobjAof6xg', plan: 'nico-v1',           nombre: 'la semana de Nico' },
  pancha: { archivo: 'r5GvuG0A6UDfxXw3_EViKA', plan: 'pancha-piernas-v4', nombre: 'la sesión de Panchi' },
  lili:   { archivo: '0l9VuCJCN-XzXYS4HUF4JA', plan: 'lili-semana1-v1',   nombre: 'la semana de Lili' }
};

$$('[data-molde]').forEach(boton => {
  boton.onclick = async () => {
    const m = MOLDES[boton.dataset.molde];
    decir('#estadoTraer', 'Cargando…');
    try {
      const r = await fetch(`/sesiones/${m.archivo}.json`);
      if (!r.ok) throw new Error(`No encontré ${m.nombre} en este sitio.`);
      $('#json').value = JSON.stringify(await r.json(), null, 2);
      $('#alumno').value = boton.dataset.molde;
      $('#plan').value = m.plan;
      decir('#estadoTraer', `Cargada ${m.nombre}. Mírala abajo y edítale lo que haga falta.`, 'bien');
      comprobar();
    } catch (e) { decir('#estadoTraer', e.message, 'mal'); }
  };
});

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

/* Estado inicial de la vista. Va al final: antes de aqui, SESION todavia no
   existe y llamarlo arriba reventaba la pagina entera. */
comprobar();
