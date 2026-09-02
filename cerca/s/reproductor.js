/* ==========================================================================
   CERCA · Reproductor de sesiones
   --------------------------------------------------------------------------
   Una sola pagina para todos los alumnos. No sabe nada de Nico ni de Panchi:
   sabe dibujar bloques, circuitos, ejercicios, casilleros, cronometros y
   feedback. El alumno numero diez es un dato mas, no una pagina mas.

   De donde saca la sesion:
     ?e=<token>    la entrega publicada, desde Supabase
     ?f=<archivo>  un archivo del repositorio, para probar y para el puente

   Lo que este archivo NO hace, a proposito:
     no decide donde va un casillero  — eso lo escribe el entrenador;
     no deduce lo que se registra a partir de lo que se muestra;
     no rellena un casillero con lo prescrito;
     no interpreta lo que el alumno anota.
   ========================================================================== */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const CABECERAS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};
const ESCRITURA = { ...CABECERAS, Prefer: 'return=minimal' };

/* --- Utilidades ---------------------------------------------------------- */

function el(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto != null) n.textContent = texto;
  return n;
}

/* Un solo destacado, *asi*. Se escapa primero: el texto de una sesion es
   contenido, no marcado, y nunca se inyecta como HTML. */
function rico(texto) {
  const frag = document.createDocumentFragment();
  String(texto ?? '').split(/(\*[^*]+\*)/).forEach(parte => {
    if (/^\*[^*]+\*$/.test(parte)) frag.appendChild(el('b', null, parte.slice(1, -1)));
    else if (parte) frag.appendChild(document.createTextNode(parte));
  });
  return frag;
}

function nuevoId() {
  return crypto.randomUUID ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function huella(objeto) {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(objeto));
    const r = await crypto.subtle.digest('SHA-256', bytes);
    return 'sha256:' + [...new Uint8Array(r)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Sin crypto.subtle no se puede acreditar nada. Se dice; no se inventa.
    return 'sin_verificar';
  }
}

function detener(titulo, detalle) {
  const caja = el('div', 'fallo');
  caja.appendChild(el('h1', null, titulo));
  caja.appendChild(el('p', 'r-lectura', detalle));
  $('#app').replaceChildren(caja);
}

/* ==========================================================================
   1. Cargar la sesion
   ========================================================================== */

async function cargarSesion() {
  const p = new URLSearchParams(location.search);
  const token = p.get('e');
  const archivo = p.get('f');

  if (archivo) {
    if (!/^[a-zA-Z0-9_-]+$/.test(archivo)) throw new Error('ruta no permitida');
    const r = await fetch(`../sesiones/${archivo}.json`);
    if (!r.ok) throw new Error('archivo');
    const sesion = await r.json();
    // Servido como archivo: no hay huella declarada contra la que comparar.
    return { sesion, hash: await huella(sesion), declarado: null, entrega: archivo };
  }

  if (!token) throw new Error('sin_token');

  // Se lee por funcion, no por tabla: sin token no hay forma de listar las
  // entregas de nadie. La tabla no tiene permiso de lectura directa.
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cerca_entrega`, {
    method: 'POST', headers: CABECERAS, body: JSON.stringify({ p_token: token })
  });
  if (!r.ok) throw new Error('red');
  const filas = await r.json();
  const fila = Array.isArray(filas) ? filas[0] : filas;
  if (!fila || !fila.sesion) throw new Error('no_existe');

  // La huella se recalcula sobre lo que de verdad llego, y se compara con la
  // que la entrega declara. Si alguien editara una entrega ya publicada, las
  // dos dejarian de coincidir y la ejecucion se lleva la discrepancia.
  //
  // No se detiene la sesion: dejar a alguien mirando una pantalla en blanco
  // en mitad del gimnasio es un dano seguro para evitar uno hipotetico. Se
  // registra, que es lo que permite darse cuenta despues.
  const servido = await huella(fila.sesion);
  return {
    sesion: fila.sesion,
    hash: servido,
    declarado: fila.hash || null,
    entrega: token
  };
}

/* ==========================================================================
   2. Estado vivo
   ========================================================================== */

const S = { sesion: null, hash: null, declarado: null, entrega: null, dias: {} };

function estadoDia(id) { return S.dias[id]; }

/* ==========================================================================
   3. Dibujar
   ========================================================================== */

function dibujar() {
  const s = S.sesion;
  const app = $('#app');
  app.replaceChildren();
  document.title = `CERCA · ${s.alumno}`;

  // --- Cabecera
  const top = el('header', 'top');
  const marca = el('div', 'marca');
  marca.appendChild(el('span', 'isotipo'));
  marca.appendChild(el('span', null, 'CERCA'));
  top.appendChild(marca);
  top.appendChild(el('span', 'pastilla r-apunte', s.alumno));
  app.appendChild(top);

  // --- Portada
  if (s.portada) {
    const p = el('section', 'portada');
    if (s.portada.kicker) p.appendChild(el('div', 'kicker', s.portada.kicker));
    const h1 = el('h1', 'r-portada');
    String(s.portada.titulo || '').split('\n').forEach((linea, i) => {
      if (i) h1.appendChild(el('br'));
      h1.appendChild(document.createTextNode(linea));
    });
    p.appendChild(h1);
    if (s.portada.bajada) p.appendChild(el('p', 'bajada r-lectura', s.portada.bajada));
    if (s.portada.pastillas?.length) {
      const fila = el('div', 'pastillas');
      s.portada.pastillas.forEach(t => fila.appendChild(el('span', 'pastilla r-apunte', t)));
      p.appendChild(fila);
    }
    app.appendChild(p);
  }

  // --- Riel de dias
  const riel = el('nav', 'dias');
  riel.setAttribute('role', 'tablist');
  s.dias.forEach((dia, i) => {
    const b = el('button', 'dia-nav', dia.nav);
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(i === 0));
    b.onclick = () => {
      $$('.dia-nav', riel).forEach(x => x.setAttribute('aria-selected', String(x === b)));
      $$('.dia').forEach(x => x.classList.toggle('activo', x.dataset.dia === dia.id));
      S.diaVisible = dia.id;
      scrollTo({ top: 0, behavior: 'smooth' });
    };
    riel.appendChild(b);
  });
  if (s.dias.length > 1) app.appendChild(riel);
  S.diaVisible = s.dias[0].id;

  // --- Dias
  s.dias.forEach((dia, i) => app.appendChild(dibujarDia(dia, i === 0)));

  if (s.seguridad) app.appendChild(el('div', 'seguridad r-apunte', s.seguridad));

  $$('.dia').forEach(n => refrescarEnvio(n.dataset.dia));
}

function dibujarDia(dia, visible) {
  S.dias[dia.id] = { bloques: {}, valores: {}, mision: null, envio: nuevoId(), enviado: false, esfuerzo: null };

  const seccion = el('section', 'dia' + (visible ? ' activo' : ''));
  seccion.dataset.dia = dia.id;

  const caja = el('div', 'sesion');
  const cab = el('div', 'sesion-cab');
  cab.appendChild(el('h2', 'r-sesion', dia.titulo));
  if (dia.bajada) cab.appendChild(el('p', 'r-apunte', dia.bajada));
  caja.appendChild(cab);

  const cuerpo = el('div', 'sesion-cuerpo');
  dia.bloques.forEach(bloque => cuerpo.appendChild(dibujarBloque(dia, bloque)));
  if (dia.feedback) cuerpo.appendChild(dibujarFeedback(dia));
  caja.appendChild(cuerpo);

  seccion.appendChild(caja);
  return seccion;
}

function dibujarBloque(dia, bloque) {
  const est = estadoDia(dia.id);
  est.bloques[bloque.id] = false;

  const n = el('div', 'bloque');
  n.dataset.bloque = bloque.id;
  const rotulo = bloque.titulo ? `${bloque.id} · ${bloque.titulo}` : bloque.id;
  n.dataset.rotulo = rotulo;
  n.appendChild(el('h3', 'r-bloque', rotulo));
  if (bloque.intro) n.appendChild(el('p', 'bloque-intro r-lectura', bloque.intro));

  if (bloque.recorrido) {
    const r = el('div', 'recorrido r-lectura');
    r.appendChild(rico(bloque.recorrido));
    n.appendChild(r);
  }

  if (bloque.tipo === 'mision') {
    const grid = el('div', 'misiones');
    bloque.opciones.forEach(op => {
      const b = el('button', 'mision', op.texto);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.onclick = () => {
        est.mision = op.id;
        $$('.mision', grid).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        refrescarEnvio(dia.id);
      };
      grid.appendChild(b);
    });
    n.appendChild(grid);
    if (bloque.cierre) n.appendChild(el('div', 'descanso r-lectura', bloque.cierre));
  }

  (bloque.ejercicios || []).forEach(ej => n.appendChild(dibujarEjercicio(dia, bloque, ej)));

  if (bloque.descanso) {
    const d = el('div', 'descanso r-lectura');
    d.appendChild(rico(bloque.descanso));
    n.appendChild(d);
  }

  // Un registro puede colgar del bloque (la mision) o de un ejercicio.
  if (bloque.registro) n.appendChild(dibujarRegistro(dia, bloque.id, bloque.registro));

  // Marcar el bloque como listo es el acto explicito que confirma. Mientras no
  // se marca esta disponible, no activo: por eso nace neutro.
  const listo = el('button', 'btn listo', 'MARCAR BLOQUE LISTO');
  listo.type = 'button';
  listo.setAttribute('aria-pressed', 'false');
  listo.onclick = () => {
    const v = !est.bloques[bloque.id];
    est.bloques[bloque.id] = v;
    listo.setAttribute('aria-pressed', String(v));
    listo.textContent = v ? 'BLOQUE LISTO ✓' : 'MARCAR BLOQUE LISTO';
    n.classList.toggle('hecho', v);
    refrescarEnvio(dia.id);
  };
  n.appendChild(listo);

  return n;
}

function dibujarEjercicio(dia, bloque, ej) {
  const n = el('div', 'ejercicio');
  const cab = el('div', 'ejercicio-cab');
  if (ej.codigo) cab.appendChild(el('span', 'codigo', ej.codigo));
  cab.appendChild(el('b', 'r-ejercicio', ej.nombre));
  if (ej.dosis) cab.appendChild(el('span', 'dosis r-dosis', ej.dosis));
  n.appendChild(cab);

  if (ej.descripcion) n.appendChild(el('div', 'descripcion r-lectura', ej.descripcion));
  if (ej.consejo) n.appendChild(el('div', 'consejo r-lectura', ej.consejo));

  (Array.isArray(ej.crono) ? ej.crono : ej.crono ? [ej.crono] : []).forEach(c => {
    const b = el('button', 'crono');
    b.type = 'button';
    b.appendChild(el('i', null, '⏱'));
    b.appendChild(document.createTextNode(' ' + (c.rotulo || `${c.segundos} s`)));
    b.onclick = () => abrirCrono(c);
    n.appendChild(b);
  });

  if (ej.registro) n.appendChild(dibujarRegistro(dia, ej.codigo || ej.nombre, ej.registro));
  return n;
}

function dibujarRegistro(dia, refId, registro) {
  const est = estadoDia(dia.id);
  const caja = el('div', 'registro');
  caja.appendChild(el('div', 'registro-cab', 'Anota lo que hiciste'));
  if (registro.nota) caja.appendChild(el('div', 'registro-nota r-apunte', registro.nota));

  registro.campos.forEach(campo => {
    const fila = el('label', 'registro-fila');

    const et = el('span', 'registro-et r-etiqueta', campo.etiqueta);
    const pre = el('em', 'registro-pre');
    pre.textContent = campo.prescrito ? `Seba mandó ${campo.texto}` : 'Todavía no hay referencia';
    et.appendChild(pre);
    fila.appendChild(et);

    const input = el('input', 'r-campo');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.min = '0';
    input.step = campo.campo === 'carga' ? '0.5' : '1';
    input.placeholder = '—';          // vacio: el numero prescrito nunca va dentro
    input.dataset.ref = refId;
    input.dataset.campo = campo.campo;
    input.oninput = () => {
      const v = input.value.trim();
      est.valores[`${refId}.${campo.campo}`] = v === '' ? null : Number(v);
      refrescarEnvio(dia.id);
    };
    fila.appendChild(input);
    fila.appendChild(el('span', 'registro-un r-etiqueta', campo.unidad));
    caja.appendChild(fila);

    if (!campo.prescrito && campo.motivo) {
      caja.appendChild(el('div', 'registro-motivo r-apunte', campo.motivo));
    }
  });

  // La explicacion va una sola vez por dia, en el primer casillero que aparece.
  if (!est.pieDicho) {
    caja.appendChild(el('div', 'registro-pie r-apunte',
      'Si no lo anotaste, déjalo en blanco. En blanco significa «no sabemos», y eso es más útil que un número inventado.'));
    est.pieDicho = true;
  }
  return caja;
}

/* ==========================================================================
   4. Feedback
   ========================================================================== */

function dibujarFeedback(dia) {
  const est = estadoDia(dia.id);
  const caja = el('div', 'feedback');
  caja.dataset.fb = dia.id;
  caja.appendChild(el('h3', 'r-sesion', dia.feedback.titulo));
  if (dia.feedback.texto) caja.appendChild(el('p', 'r-lectura', dia.feedback.texto));

  const escala = el('div', 'escala');
  for (let i = 1; i <= 10; i++) {
    const b = el('button', null, String(i));
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.onclick = () => {
      est.esfuerzo = i;
      $$('button', escala).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      refrescarEnvio(dia.id);
    };
    escala.appendChild(b);
  }
  caja.appendChild(escala);

  const nota = el('textarea');
  nota.maxLength = 800;
  nota.placeholder = dia.feedback.marcador || '';
  caja.appendChild(nota);

  caja.appendChild(el('div', 'resumen r-apunte'));

  const consent = el('div', 'consent');
  const check = el('input');
  check.type = 'checkbox';
  check.id = `consent-${dia.id}`;
  const lab = el('label', 'r-apunte', 'Acepto enviar este registro y mi feedback a Seba para revisar esta sesión y preparar las próximas decisiones de entrenamiento.');
  lab.setAttribute('for', check.id);
  check.onchange = () => refrescarEnvio(dia.id);
  consent.appendChild(check);
  consent.appendChild(lab);
  caja.appendChild(consent);

  const enviar = el('button', 'btn btn-primario');
  enviar.type = 'button';
  enviar.disabled = true;
  enviar.onclick = () => enviarDia(dia, caja);
  caja.appendChild(enviar);

  caja.appendChild(el('div', 'estado r-apunte'));
  return caja;
}

function cuentaBloques(id) {
  const b = estadoDia(id).bloques;
  const claves = Object.keys(b);
  return { listos: claves.filter(k => b[k]).length, total: claves.length };
}

function refrescarEnvio(id) {
  const caja = $(`.feedback[data-fb="${id}"]`);
  if (!caja) return;
  const est = estadoDia(id);
  if (est.enviado) return;

  const { listos, total } = cuentaBloques(id);
  const anotados = Object.values(est.valores).filter(v => v !== null && v !== undefined).length;
  const acepta = $(`#consent-${id}`).checked;

  $('.resumen', caja).textContent =
    `Se va a guardar: ${listos} de ${total} bloque${total === 1 ? '' : 's'} marcado${listos === 1 ? '' : 's'}` +
    (anotados ? ` · ${anotados} dato${anotados === 1 ? '' : 's'} anotado${anotados === 1 ? '' : 's'}` : ' · sin datos anotados') +
    (est.esfuerzo ? ` · esfuerzo ${est.esfuerzo}/10` : ' · falta tu esfuerzo');

  const boton = $('.btn-primario', caja);
  boton.disabled = !(est.esfuerzo && acepta);
  boton.textContent = !est.esfuerzo ? 'ELIGE TU ESFUERZO'
    : !acepta ? 'ACEPTA PARA ENVIAR'
    : 'ENVIAR A SEBA';
}

/* ==========================================================================
   5. Lo ejecutado
   --------------------------------------------------------------------------
   desconocido                  no se anoto. No es cero ni es lo prescrito.
   confirmado                   se anoto y cae dentro de lo que se mando.
   modificado                   se anoto y no coincide con lo que se mando.
   registrado_sin_prescripcion  se anoto, pero nunca hubo numero que confirmar
                                ni modificar. Este dato crea la referencia.
   ========================================================================== */

function estadoDeCampo(campo, valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return 'desconocido';
  if (!campo.prescrito) return 'registrado_sin_prescripcion';
  if (typeof campo.min === 'number' && typeof campo.max === 'number') {
    return (valor >= campo.min && valor <= campo.max) ? 'confirmado' : 'modificado';
  }
  return 'confirmado';
}

function construirEjecucion(dia) {
  const est = estadoDia(dia.id);
  const seccion = $(`.dia[data-dia="${dia.id}"]`);

  const bloques = Object.entries(est.bloques).map(([id, confirmado]) => ({
    id,
    titulo: $(`.bloque[data-bloque="${id}"]`, seccion)?.dataset.rotulo || null,
    confirmado
  }));

  const registros = [];
  dia.bloques.forEach(bloque => {
    const juntar = (refId, nombre, registro) => {
      if (!registro) return;
      registros.push({
        ref: refId,
        nombre,
        campos: registro.campos.map(campo => {
          const valor = est.valores[`${refId}.${campo.campo}`] ?? null;
          return {
            campo: campo.campo,
            etiqueta: campo.etiqueta,
            unidad: campo.unidad,
            prescrito: campo.prescrito
              ? { declarado: true, valor: campo.texto, min: campo.min ?? null, max: campo.max ?? null }
              : { declarado: false, motivo: campo.motivo || null },
            registrado: valor === null
              ? { declarado: false, motivo: 'el alumno no anotó este dato' }
              : { declarado: true, valor },
            estado: estadoDeCampo(campo, valor)
          };
        })
      });
    };
    juntar(bloque.id, bloque.titulo, bloque.registro);
    (bloque.ejercicios || []).forEach(ej => juntar(ej.codigo || ej.nombre, ej.nombre, ej.registro));
  });

  const ejecucion = {
    dia: dia.id,
    sesion_id: dia.sesion_id,
    entrega: S.entrega,
    // Se registro una entrada por ejercicio, no una por vuelta del circuito.
    // Decirlo importa: "las tres vueltas iguales" y "anote cada vuelta" son
    // dos evidencias distintas y no se pueden leer como la misma.
    capturado: 'en_conjunto',
    fuente_confirmacion: 'boton_bloque_listo',
    // Contra que se entreno, acreditado. `coincide: false` significa que la
    // entrega cambio despues de publicarse.
    integridad: {
      declarado: S.declarado,
      servido: S.hash,
      coincide: S.declarado === null ? null : S.declarado === S.hash
    },
    bloques,
    registros
  };
  if (est.mision !== null) ejecucion.mision = { elegida: est.mision, registrada: true };
  return ejecucion;
}

function completionDe(id) {
  const { listos, total } = cuentaBloques(id);
  if (listos === 0) return 'no';
  if (listos === total) return 'si';
  return 'casi';
}

async function enviarDia(dia, caja) {
  const est = estadoDia(dia.id);
  const boton = $('.btn-primario', caja);
  if (boton.disabled) return;
  const rotulo = $('.estado', caja);
  const nota = $('textarea', caja).value.trim() || null;
  const { listos } = cuentaBloques(dia.id);

  boton.disabled = true;
  boton.textContent = 'ENVIANDO…';
  rotulo.textContent = '';
  rotulo.classList.remove('mal');

  const comun = {
    session_id: dia.sesion_id,
    student_slug: S.sesion.alumno_slug,
    client_version: VERSION_CLIENTE,
    source: FUENTE,
    blocks_completed: listos,
    snapshot_hash: S.hash
  };

  try {
    // La ejecucion primero: si el feedback falla, lo que ocurrio ya quedo.
    const r1 = await fetch(`${SUPABASE_URL}/rest/v1/cerca_session_executions`, {
      method: 'POST', headers: ESCRITURA,
      body: JSON.stringify({ ...comun, submission_id: est.envio, execution: construirEjecucion(dia) })
    });
    if (!r1.ok && !(await r1.text()).includes('duplicate key')) {
      throw new Error('No pude guardar el registro de la sesión.');
    }

    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/cerca_workout_feedback`, {
      method: 'POST', headers: ESCRITURA,
      body: JSON.stringify({
        ...comun,
        completion: completionDe(dia.id),
        effort: est.esfuerzo,
        comment: nota,
        audio_path: null,
        execution_submission_id: est.envio
      })
    });
    if (!r2.ok) throw new Error('No pude guardar el feedback.');

    est.enviado = true;
    rotulo.textContent = 'Enviado a Seba ✓';
    boton.textContent = 'ENVIADO ✓';
    // El boton queda cerrado: un envio por dia y por visita. Otra semana se
    // abre la pagina de nuevo y esa vez nace con su propio identificador.
    est.envio = nuevoId();
  } catch (e) {
    rotulo.textContent = e.message || 'No se pudo enviar ahora. Intenta de nuevo.';
    rotulo.classList.add('mal');
    boton.disabled = false;
    boton.textContent = 'ENVIAR A SEBA';
  }
}

/* ==========================================================================
   6. Cronometro
   ========================================================================== */

const crono = { restante: 30, tic: null, corriendo: false, vueltas: null, vuelta: 0, rotulos: [] };
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function pintarCrono() { $('#cronoTiempo').textContent = mmss(crono.restante); }
function pitar() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); g.gain.value = .1; o.start(); o.stop(c.currentTime + .12);
  } catch (e) { /* sin sonido, el numero sigue estando */ }
}
function pararCrono() {
  clearInterval(crono.tic); crono.tic = null; crono.corriendo = false;
  $('#cronoVa').textContent = 'INICIAR';
}
function abrirCrono(c) {
  pararCrono();
  if (c && c.tipo === 'emom') {
    crono.vueltas = c.rotulos.length; crono.vuelta = 0; crono.rotulos = c.rotulos;
    crono.restante = c.segundos || 60;
    $('#cronoRotulo').textContent = c.rotulos[0];
  } else {
    crono.vueltas = null; crono.rotulos = [];
    crono.restante = (c && c.segundos) || 30;
    $('#cronoRotulo').textContent = (c && c.rotulo) || 'PAUSA';
  }
  pintarCrono();
  $('#hojaCrono').classList.add('abierta');
}
function correrCrono() {
  if (crono.corriendo) return;
  crono.corriendo = true;
  $('#cronoVa').textContent = 'CORRIENDO';
  const inicio = Date.now(), desde = crono.restante;
  crono.tic = setInterval(() => {
    crono.restante = Math.max(0, desde - Math.floor((Date.now() - inicio) / 1000));
    pintarCrono();
    if (crono.restante > 0) return;
    pararCrono(); pitar();
    if (crono.vueltas && crono.vuelta < crono.vueltas - 1) {
      crono.vuelta++;
      crono.restante = 60;
      $('#cronoRotulo').textContent = crono.rotulos[crono.vuelta];
      pintarCrono();
      setTimeout(correrCrono, 250);
    } else {
      $('#cronoRotulo').textContent = 'LISTO ✓';
    }
  }, 250);
}

/* ==========================================================================
   7. Chat / bitacora
   ========================================================================== */

const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function responder(q) {
  const s = norm(q);
  if (s.includes('video') || s.includes('youtube')) return 'Dime el nombre del ejercicio en el mismo mensaje y te mando a buscarlo en YouTube.';
  if (s.includes('circuito') || s.includes('vuelta') || s.includes('ronda')) return 'Haz los ejercicios en el orden indicado, sin descanso entre ellos. El descanso aparece al final de la ronda; después vuelves al primero.';
  if (s.includes('descanso') || s.includes('pausa')) return 'Cada bloque dice exactamente dónde descansar. También puedes usar el botón ⏱ sin salir de CERCA.';
  if (s.includes('anot') || s.includes('registr') || s.includes('casiller')) return 'Anota solo donde aparece el casillero: son los números que pudiste elegir tú. Si no lo anotaste, déjalo en blanco.';
  if (s.includes('esfuerzo') || s.includes('1 al 10')) return '1 = muy fácil; 10 = extremadamente difícil, casi no podías hacer nada más. No hay una respuesta correcta.';
  if (s.includes('dolor') || s.includes('molest')) return 'No fuerces ese movimiento. Detén el ejercicio y deja anotado qué pasó para que Seba lo revise.';
  return 'Tu mensaje quedó anotado. Si es una duda que todavía no sé responder bien, Seba la podrá revisar.';
}

function buscarVideo(q) {
  const n = norm(q);
  for (const [clave, busqueda] of (S.sesion.chat?.videos || [])) {
    if (n.includes(clave)) return `https://www.youtube.com/results?search_query=${encodeURIComponent(busqueda)}`;
  }
  return null;
}

function burbuja(texto, quien) {
  const d = el('div', 'msg ' + quien, texto);
  const log = $('#chatLog');
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}

async function guardarBitacora(texto) {
  const rotulo = $('#bitEstado');
  rotulo.textContent = 'Guardando…';
  const dia = S.sesion.dias.find(d => d.id === S.diaVisible) || S.sesion.dias[0];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cerca_session_questions`, {
      method: 'POST', headers: ESCRITURA,
      body: JSON.stringify({
        session_id: dia.sesion_id,
        student_slug: S.sesion.alumno_slug,
        block_id: `dia_${dia.id}`,
        question_text: texto,
        input_mode: 'text',
        audio_path: null,
        client_version: VERSION_CLIENTE,
        source: FUENTE,
        entry_kind: texto.includes('?') ? 'question' : 'note'
      })
    });
    if (!r.ok) throw new Error();
    rotulo.textContent = 'Guardado para Seba ✓';
  } catch (e) {
    rotulo.textContent = 'No se pudo sincronizar; copia tu nota si es importante.';
  }
}

function enviarChat(texto) {
  const input = $('#chatInput');
  texto = (texto || input.value).trim();
  if (!texto) return;
  burbuja(texto, 'tuyo');
  input.value = '';
  guardarBitacora(texto);
  setTimeout(() => {
    const d = burbuja(responder(texto), 'cerca');
    const v = buscarVideo(texto);
    if (v && (norm(texto).includes('video') || norm(texto).includes('youtube'))) {
      const a = el('a', 'video', '▶ BUSCAR EN YOUTUBE');
      a.href = v; a.target = '_blank'; a.rel = 'noopener';
      d.appendChild(el('br'));
      d.appendChild(a);
    }
  }, 120);
}

/* ==========================================================================
   8. Arranque
   ========================================================================== */

function conectarHojas() {
  $('#fabCrono').onclick = () => abrirCrono(null);
  $('#fabChat').onclick = () => $('#hojaChat').classList.add('abierta');
  $$('[data-cerrar]').forEach(b => b.onclick = () => $('#' + b.dataset.cerrar).classList.remove('abierta'));
  $$('.hoja').forEach(h => h.addEventListener('click', e => { if (e.target === h) h.classList.remove('abierta'); }));
  $$('[data-preset]').forEach(b => b.onclick = () => abrirCrono({ segundos: +b.dataset.preset }));
  $('#cronoVa').onclick = correrCrono;
  $('#cronoPausa').onclick = pararCrono;
  $('#cronoCero').onclick = () => { pararCrono(); abrirCrono(null); };
  $('#chatEnviar').onclick = () => enviarChat();
  $('#chatInput').onkeydown = e => { if (e.key === 'Enter') enviarChat(); };
}

async function arrancar() {
  try {
    const { sesion, hash, declarado, entrega } = await cargarSesion();
    if (sesion.formato !== 1) throw new Error('formato');
    S.sesion = sesion; S.hash = hash; S.declarado = declarado; S.entrega = entrega;
  } catch (e) {
    const razones = {
      sin_token: ['Falta el enlace completo', 'Este enlace está incompleto. Pídele a Seba que te mande el enlace otra vez.'],
      no_existe: ['Esta sesión ya no está vigente', 'Puede que Seba haya publicado una versión nueva. Escríbele y te manda el enlace al día.'],
      formato:   ['No puedo mostrar esta sesión', 'La sesión está escrita en un formato que esta pantalla no entiende. Avísale a Seba.'],
      archivo:   ['No encontré esta sesión', 'Revisa el enlace o pídeselo a Seba de nuevo.']
    };
    const [t, d] = razones[e.message] || ['No pude cargar tu sesión', 'Puede ser tu conexión. Inténtalo de nuevo en un momento; si sigue igual, avísale a Seba.'];
    detener(t, d);
    return;
  }
  dibujar();
  conectarHojas();
  $('#flotantes').hidden = false;
  const primero = $('#chatLog').dataset.saludo;
  if (primero) burbuja(primero, 'cerca');
  (S.sesion.chat?.atajos || []).forEach(t => {
    const b = el('button', null, t);
    b.type = 'button';
    b.onclick = () => enviarChat(t);
    $('#atajos').appendChild(b);
  });
}

arrancar();
