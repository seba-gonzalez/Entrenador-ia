/* CERCA · Perfil V0
   ==================================================================
   PRIVACIDAD (Fase C, decision explicita)
   Las respuestas del perfil viven UNICAMENTE en el objeto `estado` de
   memoria. No hay localStorage, no hay sessionStorage para respuestas,
   no hay Supabase, no hay API, no hay URL, no hay servicio externo.
   Al cerrar o recargar la pestana se pierden. Es deliberado: mientras la
   revision juridica de la Ley 21.719 siga abierta, un campo de texto libre
   puede recibir informacion de salud y no existe forma fiable de
   descartarlo en el navegador. Ver cerca/MATRIZ_DE_DATOS.md §7.

   DATOS DE SALUD
   La afirmacion correcta es acotada, y la distincion importa:

     CERCA NO SOLICITA DELIBERADAMENTE INFORMACION DE SALUD EN ESTE
     PROTOTIPO Y NO REPREGUNTA SOBRE ELLA.

   No es lo mismo NO SOLICITAR que NO PODER RECIBIR. Un campo libre puede
   recibir espontaneamente "me operaron la rodilla" aunque nunca se haya
   pedido, y ese texto entra al objeto `estado` mientras viva la pestana.
   Decir "no se capturan datos de salud" seria falso.

   Lo que si esta garantizado: no se persisten; no se envian a ningun
   servidor, ni a Supabase, ni a Core, ni a servicios de IA; y no se
   intenta inferir diagnostico ni causa medica.

   El guardia `PATRONES_CAUSA` se aplica a NUESTRO banco de preguntas al
   cargar. Filtramos lo que preguntamos, nunca lo que la persona escribe:
   clasificar su texto seria justamente el tratamiento que estamos
   evitando.
   ================================================================== */
'use strict';

/* ---------- utilidades ---------- */
const $ = (sel) => document.querySelector(sel);
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hay = (t, re) => re.test(norm(t));
const esNegativa = (t) => hay(t, /^\s*(no|ninguno|ninguna|nada|nop|no se me ocurre|nada en particular|todo bien)\b/);

/* ---------- estado: unica fuente, solo en memoria ---------- */
const estado = {
  contexto: {},              // heredado de la landing, campos permitidos
  respuestas: {},            // id -> { texto, omitida }
  aclaraciones: [],          // { id, pregunta, respuesta, resuelta, conservadora }
  preguntadas: [],           // ids de incertidumbre ya preguntadas (no se repite ninguna)
  traza: [],                 // por que se pregunto o no se pregunto cada una
  interpretacion: null,      // PENDIENTE — no existe motor real
  decision_propuesta: null   // PENDIENTE — no existe motor real
};

/* ==================================================================
   1. HERENCIA DESDE LA LANDING
   Lista blanca estricta. training_challenge y start_comment son texto
   libre y NO viajan: estan pendientes de revision (MATRIZ §6).
   ================================================================== */
const CLAVE_CONTEXTO = 'cerca_contexto_landing';
const HEREDABLES = ['name', 'trains_now', 'training_type', 'training_support', 'start_barriers'];

function leerContexto() {
  let crudo = null;
  try { crudo = window.sessionStorage.getItem(CLAVE_CONTEXTO); } catch (e) { return {}; }
  if (!crudo) return {};
  // Se consume una sola vez y se borra: el traslado es transporte, no archivo.
  try { window.sessionStorage.removeItem(CLAVE_CONTEXTO); } catch (e) { /* sin efecto */ }
  let datos;
  try { datos = JSON.parse(crudo); } catch (e) { return {}; }
  if (!datos || typeof datos !== 'object') return {};
  const limpio = {};
  HEREDABLES.forEach((clave) => {
    if (datos[clave] !== undefined && datos[clave] !== null && datos[clave] !== '') limpio[clave] = datos[clave];
  });
  return limpio;
}

/* ==================================================================
   2. LOS CINCO BLOQUES
   El texto de las preguntas es el aprobado en la Fase C.
   ================================================================== */
function construirTurnos(ctx) {
  const turnos = [];
  const nombre = typeof ctx.name === 'string' ? ctx.name.trim().split(/\s+/)[0] : '';

  /* Saludo. Con nombre heredado, CERCA no vuelve a preguntarlo. */
  turnos.push({
    tipo: 'mensaje',
    paso: 'INICIO',
    texto: nombre
      ? `Hola, ${nombre}. Antes de proponerte nada quiero entender cómo entrenas.`
      : 'Antes de proponerte nada quiero entender cómo entrenas.'
  });

  /* 1 · OBJETIVO */
  turnos.push({
    tipo: 'pregunta', id: 'objetivo', paso: 'OBJETIVO',
    pregunta: '¿Qué te gustaría conseguir entrenando? Cuéntamelo como lo pensarías tú; no hace falta que suene técnico.',
    marcador: 'Lo que quiero conseguir es…'
  });

  /* 2 · EXPERIENCIA — se adapta al contexto heredado */
  if (ctx.trains_now === true && (ctx.training_type || ctx.training_support)) {
    const partes = [];
    if (ctx.training_type) partes.push(`entrenas <b>${escapar(ctx.training_type)}</b>`);
    if (ctx.training_support) partes.push(`normalmente <b>${escapar(String(ctx.training_support).toLowerCase())}</b>`);
    turnos.push({ tipo: 'mensaje', paso: 'EXPERIENCIA', html: `Del formulario ya sé que ${partes.join(' y ')}. No hace falta que me lo repitas.` });
    turnos.push({
      tipo: 'pregunta', id: 'experiencia', paso: 'EXPERIENCIA', opcional: true,
      pregunta: '¿Quieres agregar algo sobre tu experiencia — cuánto llevas, o algo que ya hagas bien?',
      marcador: 'Opcional.',
      omitirTexto: 'Nada que agregar'
    });
  } else {
    if (Array.isArray(ctx.start_barriers) && ctx.start_barriers.length) {
      const lista = ctx.start_barriers.map((b) => `<b>${escapar(String(b).toLowerCase())}</b>`).join(', ');
      turnos.push({ tipo: 'mensaje', paso: 'EXPERIENCIA', html: `Del formulario ya sé que hoy te falta ${lista}. Lo tengo presente.` });
    }
    turnos.push({
      tipo: 'pregunta', id: 'experiencia', paso: 'EXPERIENCIA',
      pregunta: '¿Qué has hecho antes? Gimnasio, algún deporte, clases —o nada todavía. Cualquiera de las tres me sirve.',
      marcador: 'Gimnasio, deporte, clases, o nada todavía.'
    });
  }

  /* 3 · DISPONIBILIDAD Y CONTEXTO */
  turnos.push({
    tipo: 'pregunta', id: 'disponibilidad', paso: 'DISPONIBILIDAD',
    pregunta: '¿Cuántos días a la semana quieres entrenar con CERCA, y cuánto tiempo tienes en cada sesión?',
    marcador: 'Por ejemplo: tres días, una hora.'
  });

  /* 4 · LUGAR Y EQUIPAMIENTO */
  turnos.push({
    tipo: 'pregunta', id: 'lugar', paso: 'LUGAR',
    pregunta: '¿Dónde vas a entrenar? Si es un gimnasio, con decirme cómo es me basta. Si es en casa o al aire libre, cuéntame qué tienes a mano.',
    marcador: 'Gimnasio, casa, parque…'
  });

  /* 5 · PREFERENCIAS Y RESTRICCIONES FUNCIONALES (dos turnos) */
  turnos.push({
    tipo: 'pregunta', id: 'preferencias', paso: 'LO QUE PREFIERES',
    pregunta: '¿Hay algo que te guste especialmente entrenando, o algo que definitivamente no soportes?',
    marcador: 'Lo que disfrutas y lo que no.'
  });
  turnos.push({
    tipo: 'pregunta', id: 'restricciones', paso: 'LO QUE DEJAMOS FUERA', opcional: true,
    pregunta: '¿Hay algún movimiento, ejercicio o tipo de esfuerzo que prefieras que no incluyamos por ahora?',
    apunte: 'En esta etapa no necesitamos que nos cuentes diagnósticos, lesiones ni antecedentes médicos.',
    marcador: 'Por ejemplo: prefiero no hacer saltos.',
    omitirTexto: 'No hay nada'
  });

  /* CIERRE OPCIONAL */
  turnos.push({
    tipo: 'pregunta', id: 'cierre', paso: 'ALGO MAS', opcional: true,
    pregunta: '¿Hay algo más que crees que debería saber antes de empezar?',
    apunte: 'Evita incluir diagnósticos, lesiones o información médica en esta etapa del prototipo.',
    marcador: 'Opcional.',
    omitirTexto: 'Nada más'
  });

  return turnos;
}

/* ==================================================================
   3. BANCO DE INCERTIDUMBRES
   Una incertidumbre solo justifica una repregunta cuando podemos declarar
   ANTES de preguntar: decision afectada, rama A, rama B y la pregunta
   minima que las distingue. Si A y B producen la misma decision, no se
   pregunta — y eso lo comprueba el motor, no el criterio de quien escribe.
   ================================================================== */
const DIAS_SEMANA = /lunes|martes|miercoles|jueves|viernes|sabado|domingo/;
const ACTIVIDADES = /futbol|correr|running|trotar|padel|tenis|natacion|nadar|bici|ciclismo|yoga|pilates|crossfit|escalada|basquet|box|karate|baile|surf/;

const BANCO = [
  {
    id: 'dias-fijos',
    decision_afectada: 'Estructura del microciclo',
    rama_a: 'Días fijos: progresión numerada, la sesión 2 continúa a la sesión 1',
    rama_b: 'Días variables: sesiones intercambiables A/B/C, cualquiera sirve cualquier día',
    pregunta: '¿Esos días son más o menos siempre los mismos, o cambian según la semana?',
    conservadora: 'sesiones intercambiables, que funcionan en ambos casos',
    presente(e) {
      const t = e.respuestas.disponibilidad && e.respuestas.disponibilidad.texto;
      if (!t) return false;
      if (!hay(t, /\bdias?\b|\bveces\b/)) return false;
      return !hay(t, /fijo|mismos|siempre|varia|cambia|depende|flexible|distint/) && !hay(t, DIAS_SEMANA);
    },
    resuelta_por(t) { return hay(t, /fijo|mismos|siempre|varia|cambia|depende|flexible|distint/) || hay(t, DIAS_SEMANA); }
  },
  {
    id: 'duracion-sesion',
    decision_afectada: 'Cuánto cabe dentro de una sesión',
    rama_a: '45 minutos o más: estructura completa, con accesorios y trabajo complementario',
    rama_b: '30 minutos o menos: sesión comprimida, solo el trabajo principal',
    pregunta: '¿Cuánto tiempo tienes en cada sesión, más o menos?',
    conservadora: 'la sesión corta, que cabe en los dos escenarios',
    presente(e) {
      const t = e.respuestas.disponibilidad && e.respuestas.disponibilidad.texto;
      if (!t) return false;
      return !hay(t, /minuto|\bmins?\b|hora|\bhrs?\b|\d\s*h\b/);
    },
    resuelta_por(t) { return hay(t, /minuto|\bmins?\b|hora|\bhrs?\b|\d/); }
  },
  {
    id: 'material-disponible',
    decision_afectada: 'Qué ejercicios son ejecutables',
    rama_a: 'Con carga externa: la progresión es por peso',
    rama_b: 'Sin material: la progresión es por dificultad del propio peso corporal',
    pregunta: '¿Tienes algo a mano para entrenar ahí —mancuernas, bandas, una barra— o contamos con tu propio peso?',
    conservadora: 'solo peso corporal, que se puede hacer en cualquier caso',
    presente(e) {
      const t = e.respuestas.lugar && e.respuestas.lugar.texto;
      if (!t) return false;
      // Un gimnasio ya implica material: preguntarlo seria completar una ficha.
      if (hay(t, /gimnasio|gym|\bbox\b|club/)) return false;
      if (!hay(t, /casa|depto|departamento|piso|patio|parque|plaza|aire libre|calle|cerro|jardin/)) return false;
      return !hay(t, /mancuerna|banda|elastic|pesa|barra|kettlebell|disco|maquina|colchoneta|barra fija|dominadas|nada|sin nada|peso corporal|cuerda/);
    },
    resuelta_por(t) { return norm(t).trim().length > 0; }
  },
  {
    id: 'frecuencia-otra-actividad',
    decision_afectada: 'Carga semanal total',
    rama_a: 'Una vez por semana: no ajustamos el volumen de CERCA',
    rama_b: 'Tres o más veces: bajamos volumen para no sumar carga sobre carga',
    pregunta: '¿Cuántas veces por semana haces esa otra actividad?',
    conservadora: 'frecuencia alta, y bajamos volumen por precaución',
    presente(e) {
      const campos = ['objetivo', 'experiencia', 'disponibilidad', 'preferencias'];
      const texto = campos.map((c) => (e.respuestas[c] && e.respuestas[c].texto) || '').join(' ');
      if (!hay(texto, ACTIVIDADES)) return false;
      const disp = (e.respuestas.disponibilidad && e.respuestas.disponibilidad.texto) || '';
      // Si la frecuencia de esa actividad ya se menciona, no hay incertidumbre.
      return !hay(disp, ACTIVIDADES) || !hay(disp, /\bveces\b|\d\s*(dias?|x)\b/);
    },
    resuelta_por(t) { return hay(t, /\d|una|dos|tres|cuatro|cinco|diario|todos los dias|nunca/); }
  },
  {
    id: 'alcance-restriccion',
    decision_afectada: 'Qué queda fuera del catálogo de ejercicios',
    rama_a: 'Solo ese movimiento: excluimos exactamente lo que nombraste',
    rama_b: 'La familia completa: excluimos también lo que comparte el mismo patrón',
    // Pregunta por el ALCANCE de la exclusion, nunca por su causa.
    pregunta: 'Para no incluirlo por error: ¿dejamos fuera solo eso, o también los ejercicios que se le parecen?',
    conservadora: 'la familia completa, que es la opción que excluye más',
    presente(e) {
      const r = e.respuestas.restricciones;
      if (!r || r.omitida) return false;
      const t = r.texto;
      return Boolean(t) && !esNegativa(t);
    },
    resuelta_por(t) { return norm(t).trim().length > 0; }
  },
  {
    /* Candidata que el propio motor descarta. Se conserva a proposito: es la
       demostracion de que la regla se aplica sola. Ambas ramas producen la
       misma decision, porque la primera propuesta es una hipotesis que se
       calibra con feedback real, venga de donde venga la persona. */
    id: 'detalle-experiencia',
    decision_afectada: 'Carga de la primera sesión',
    rama_a: 'La primera sesión es una hipótesis que se calibra con tu feedback',
    rama_b: 'La primera sesión es una hipótesis que se calibra con tu feedback',
    pregunta: '¿Cuántos años llevas entrenando exactamente?',
    conservadora: 'no aplica',
    presente(e) {
      const t = e.respuestas.experiencia && e.respuestas.experiencia.texto;
      return Boolean(t) && norm(t).trim().length < 40;
    },
    resuelta_por() { return true; }
  }
];

/* --- Guardia de salud: se aplica a NUESTRAS preguntas, nunca al texto de
       la persona. Una pregunta que roce la causa corporal no llega a existir. */
/* Raices, no palabras cerradas: con \b de cierre, \bdiagnostic\b no llegaba a
   ver "diagnostico" ni \bmedic\b a "medico". Se detecto probando el guardia
   contra preguntas que debia rechazar, no leyendolo. Sin \b final, la raiz
   cubre todas las flexiones. Un falso positivo solo retira una pregunta
   nuestra: el error cae del lado seguro. */
const PATRONES_CAUSA = /\b(por que|porque|causa|motivo|salud|molestia|dolor|duele|dolia|lesion|diagnostic|oper|cirug|quirurg|medic|enferm|patolog|traum|kinesi|rehabilit|tendin|hernia|fractur|esguince|desgarr|protesis|sintoma|tratamiento)/;
const BANCO_RECHAZADO = [];
const BANCO_SEGURO = BANCO.filter((inc) => {
  if (PATRONES_CAUSA.test(norm(inc.pregunta))) {
    BANCO_RECHAZADO.push(inc.id);
    return false;
  }
  return true;
});
if (BANCO_RECHAZADO.length) {
  console.warn('CERCA · preguntas retiradas por rozar causa corporal:', BANCO_RECHAZADO);
}

const ramasDistintas = (inc) => norm(inc.rama_a).trim() !== norm(inc.rama_b).trim();

/* ==================================================================
   4. MOTOR DE REPREGUNTA
   interpretar → detectar → test de decision → preguntar UNA → reevaluar.
   Sin cuota. El numero de aclaraciones es emergente.
   Termina porque ninguna incertidumbre se pregunta dos veces y el banco
   es finito; si una aclaracion no resuelve, se declara no resuelta y se
   avanza por la rama conservadora.
   ================================================================== */
function evaluar() {
  const decisivas = [];
  estado.traza = BANCO_SEGURO.map((inc) => {
    const fila = {
      id: inc.id,
      decision: inc.decision_afectada,
      rama_a: inc.rama_a,
      rama_b: inc.rama_b
    };
    if (estado.preguntadas.indexOf(inc.id) !== -1) {
      fila.resultado = 'no se pregunta';
      fila.motivo = 'ya se preguntó una vez';
    } else if (!ramasDistintas(inc)) {
      fila.resultado = 'no se pregunta';
      fila.motivo = 'las dos ramas producen la misma decisión';
    } else if (!inc.presente(estado)) {
      fila.resultado = 'no se pregunta';
      fila.motivo = 'no aparece en lo que contaste, o ya está respondido';
    } else {
      fila.resultado = 'decisiva';
      fila.motivo = 'la respuesta elige entre A y B';
      decisivas.push(inc);
    }
    return fila;
  });
  return decisivas;
}

/* ==================================================================
   5. RENDER
   ================================================================== */
const hilo = $('#hilo');
const turno = $('#turno');
const elPregunta = $('#pregunta');
const elApunte = $('#apunte');
const elCampo = $('#respuesta');
const elAviso = $('#aviso');
const elEnviar = $('#enviar');
const elOmitir = $('#omitir');
const elPaso = $('#paso');

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function burbuja(quien, html) {
  const div = document.createElement('div');
  div.className = `burbuja burbuja-${quien} burbuja-entra`;
  div.innerHTML = html;
  hilo.appendChild(div);
  return div;
}

function tarjeta(html) {
  const art = document.createElement('article');
  art.className = 'tarjeta burbuja-entra';
  art.innerHTML = html;
  hilo.appendChild(art);
  return art;
}

function alFinal() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
}

function ocultarTurno() {
  turno.hidden = true;
}

function pedir(cfg) {
  turno.hidden = false;
  elPaso.textContent = cfg.paso || '';
  elPregunta.textContent = cfg.pregunta;
  if (cfg.apunte) { elApunte.textContent = cfg.apunte; elApunte.hidden = false; }
  else { elApunte.textContent = ''; elApunte.hidden = true; }
  elCampo.value = cfg.valor || '';
  elCampo.placeholder = cfg.marcador || '';
  elCampo.classList.remove('es-invalido');
  elAviso.hidden = true;
  elEnviar.textContent = cfg.accion || 'Continuar';
  if (cfg.opcional) { elOmitir.hidden = false; elOmitir.textContent = cfg.omitirTexto || 'Prefiero no responder'; }
  else { elOmitir.hidden = true; }
  pendiente = cfg;
  alFinal();
  // Sin autofocus a proposito. En Safari/iPhone el teclado que abre el foco
  // automatico puede empujar la pregunta fuera de vista, y Playwright con
  // viewport movil no reproduce ese comportamiento: la comodidad de escritorio
  // no justifica romper la composicion en el dispositivo real. La persona toca
  // el campo cuando quiere responder.
}

/* ==================================================================
   6. FLUJO
   ================================================================== */
let turnos = [];
let indice = 0;
let pendiente = null;
let modo = 'bloques';       // bloques | correccion | aclaracion | fin
let correccionId = null;

function arrancar() {
  estado.contexto = leerContexto();
  turnos = construirTurnos(estado.contexto);
  siguienteTurno();
}

function siguienteTurno() {
  while (indice < turnos.length && turnos[indice].tipo === 'mensaje') {
    const m = turnos[indice];
    elPaso.textContent = m.paso || '';
    burbuja('cerca', m.html || escapar(m.texto));
    indice += 1;
  }
  if (indice >= turnos.length) { ocultarTurno(); confirmar(); return; }
  const t = turnos[indice];
  burbuja('cerca', escapar(t.pregunta));
  pedir({
    paso: t.paso, pregunta: t.pregunta, apunte: t.apunte,
    marcador: t.marcador, opcional: t.opcional, omitirTexto: t.omitirTexto
  });
}

function guardar(id, texto, omitida) {
  estado.respuestas[id] = { texto: texto, omitida: Boolean(omitida) };
}

function enviar(omitida) {
  if (!pendiente) return;
  const texto = elCampo.value.trim();
  if (!omitida && !texto) {
    elCampo.classList.add('es-invalido');
    elAviso.textContent = 'Escribe algo, o usa la opción de omitir si prefieres no responder.';
    elAviso.hidden = false;
    elCampo.focus();
    return;
  }

  if (modo === 'aclaracion') {
    const inc = pendiente.incertidumbre;
    const resuelta = !omitida && inc.resuelta_por(texto, estado);
    burbuja('persona', escapar(omitida ? elOmitir.textContent : texto));
    estado.preguntadas.push(inc.id);   // nunca se pregunta dos veces
    estado.aclaraciones.push({
      id: inc.id, pregunta: inc.pregunta,
      respuesta: omitida ? null : texto,
      resuelta: resuelta,
      conservadora: resuelta ? null : inc.conservadora
    });
    if (!resuelta) {
      burbuja('cerca', `Lo dejo como <b>no resuelto</b> y avanzo con ${escapar(inc.conservadora)}.`);
    }
    siguienteAclaracion();
    return;
  }

  if (modo === 'correccion') {
    guardar(correccionId, omitida ? '' : texto, omitida);
    burbuja('persona', escapar(omitida ? elOmitir.textContent : texto));
    modo = 'bloques';
    correccionId = null;
    ocultarTurno();
    confirmar();
    return;
  }

  const t = turnos[indice];
  guardar(t.id, omitida ? '' : texto, omitida);
  burbuja('persona', escapar(omitida ? elOmitir.textContent : texto));
  indice += 1;
  siguienteTurno();
}

/* ---------- confirmacion: "Esto me contaste" ---------- */
const ROTULOS = {
  objetivo: 'LO QUE QUIERES CONSEGUIR',
  experiencia: 'TU EXPERIENCIA',
  disponibilidad: 'DISPONIBILIDAD',
  lugar: 'DÓNDE ENTRENAS',
  preferencias: 'LO QUE PREFIERES',
  restricciones: 'LO QUE DEJAMOS FUERA',
  cierre: 'ALGO MÁS'
};

function filasHeredadas() {
  const c = estado.contexto;
  const filas = [];
  if (c.name) filas.push(['NOMBRE', c.name]);
  if (c.trains_now !== undefined) filas.push(['ENTRENAS HOY', c.trains_now ? 'Sí' : 'No']);
  if (c.training_type) filas.push(['TIPO', c.training_type]);
  if (c.training_support) filas.push(['ACOMPAÑAMIENTO', c.training_support]);
  if (Array.isArray(c.start_barriers) && c.start_barriers.length) filas.push(['TE FALTA', c.start_barriers.join(' · ')]);
  return filas;
}

function confirmar() {
  elPaso.textContent = 'CONFIRMACION';
  const decisivas = evaluar();

  const heredadas = filasHeredadas().map(([r, v]) => `
      <li><span class="de">${escapar(r)} · del formulario</span>
        <p class="texto heredado">${escapar(v)}</p></li>`).join('');

  const propias = Object.keys(ROTULOS)
    .filter((id) => estado.respuestas[id])
    .map((id) => {
      const r = estado.respuestas[id];
      const cuerpo = r.omitida || !r.texto
        ? '<p class="texto heredado">Preferiste no responder. Queda así.</p>'
        : `<p class="texto">${escapar(r.texto)}</p>`;
      return `<li><span class="de">${escapar(ROTULOS[id])}</span>${cuerpo}
        <button class="btn-texto" type="button" data-corregir="${id}">Corregir</button></li>`;
    }).join('');

  const bloqueAclarar = decisivas.length
    ? `<p class="rotulo">LO QUE TODAVÍA NECESITO ACLARAR</p>
       <ul class="pendientes">${decisivas.map((inc) => `
         <li>${escapar(inc.pregunta)}
           <span class="porque">Cambia una decisión: ${escapar(inc.decision_afectada)}.</span></li>`).join('')}</ul>`
    : bloqueSuficiente();

  tarjeta(`
    <h2>Esto me contaste</h2>
    <p>Son tus palabras, sin resumir. Si algo no quedó bien, corrígelo antes de seguir.</p>
    <p class="rotulo">LO QUE ME DIJISTE</p>
    <ul class="dicho">${heredadas}${propias}</ul>
    <div class="ranura">
      <b>MI LECTURA COMO ENTRENADOR · PENDIENTE</b>
      <p>Todavía no hay motor de interpretación, así que no voy a escribir una
         lectura que aparente haber entendido algo que no he inferido. Este
         espacio queda reservado y vacío a propósito.</p>
    </div>
    ${bloqueAclarar}`);

  hilo.querySelectorAll('[data-corregir]').forEach((boton) => {
    boton.addEventListener('click', () => corregir(boton.getAttribute('data-corregir')));
  });

  ocultarTurno();
  if (decisivas.length) {
    pedir({
      paso: 'CONFIRMACION',
      pregunta: '¿Esto te representa?',
      marcador: 'Si quieres agregar algo, escríbelo. Si no, continúa.',
      opcional: true, omitirTexto: 'Sí, continuemos',
      accion: 'Agregar y continuar'
    });
    modo = 'confirmar';
  } else {
    finalizar();
  }
  alFinal();
}

function corregir(id) {
  const turnoOrigen = turnos.filter((t) => t.id === id)[0];
  if (!turnoOrigen) return;
  modo = 'correccion';
  correccionId = id;
  burbuja('cerca', escapar(turnoOrigen.pregunta));
  pedir({
    paso: turnoOrigen.paso, pregunta: turnoOrigen.pregunta, apunte: turnoOrigen.apunte,
    marcador: turnoOrigen.marcador, valor: (estado.respuestas[id] || {}).texto || '',
    opcional: turnoOrigen.opcional, omitirTexto: turnoOrigen.omitirTexto,
    accion: 'Guardar corrección'
  });
}

/* ---------- bucle de aclaraciones ---------- */
function siguienteAclaracion() {
  const decisivas = evaluar();
  if (!decisivas.length) { ocultarTurno(); finalizar(); return; }
  const inc = decisivas[0];
  modo = 'aclaracion';
  burbuja('cerca', escapar(inc.pregunta));
  pedir({
    paso: 'ACLARACION', pregunta: inc.pregunta,
    apunte: `Te lo pregunto porque cambia una decisión: ${inc.decision_afectada.toLowerCase()}.`,
    marcador: 'Con una línea me basta.',
    opcional: true, omitirTexto: 'Prefiero no responder'
  });
  pendiente.incertidumbre = inc;
  alFinal();
}

/* ---------- estado final: informacion suficiente ---------- */
function bloqueSuficiente() {
  const noResueltas = estado.aclaraciones.filter((a) => !a.resuelta);
  const nota = noResueltas.length
    ? `<p>${noResueltas.length === 1 ? 'Queda un punto sin resolver' : `Quedan ${noResueltas.length} puntos sin resolver`}: avanzo por la opción que asume menos.</p>`
    : '';
  return `<div class="suficiente">
      <b>INFORMACION SUFICIENTE</b>
      <p>Con esto puedo decidir con criterio. No voy a preguntarte más por ahora:
         lo que falta se aprende entrenando, no llenando una ficha.</p>
      ${nota}
    </div>`;
}

function finalizar() {
  modo = 'fin';
  elPaso.textContent = 'SUFICIENTE';
  ocultarTurno();
  if (estado.aclaraciones.length) {
    tarjeta(`<h2>Ya no necesito preguntarte más</h2>${bloqueSuficiente()}`);
  }
  burbuja('cerca',
    'Hasta aquí llega el prototipo. La propuesta de entrenamiento todavía no está construida, ' +
    'y prefiero decírtelo antes que mostrarte una rutina de ejemplo como si fuera tuya.');
  alFinal();
}

/* ==================================================================
   7. EVENTOS
   ================================================================== */
elEnviar.addEventListener('click', () => {
  if (modo === 'confirmar') {
    const texto = elCampo.value.trim();
    if (texto) {
      const previo = estado.respuestas.cierre;
      guardar('cierre', previo && previo.texto ? `${previo.texto}\n${texto}` : texto, false);
      burbuja('persona', escapar(texto));
    }
    modo = 'aclaracion';
    siguienteAclaracion();
    return;
  }
  enviar(false);
});

elOmitir.addEventListener('click', () => {
  if (modo === 'confirmar') { modo = 'aclaracion'; siguienteAclaracion(); return; }
  enviar(true);
});

elCampo.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter' && (evento.metaKey || evento.ctrlKey)) elEnviar.click();
});

/* Traza de decisiones, para QA. Solo lectura, en memoria, nunca sale de aqui. */
window.CERCA_PERFIL = {
  traza: () => estado.traza,
  estado: () => estado,
  bancoRechazado: () => BANCO_RECHAZADO
};

arrancar();
