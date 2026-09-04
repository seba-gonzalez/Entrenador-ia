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
     no rellena un casillero con lo prescrito salvo que la sesion lo pida
       explicitamente, y en ese caso el silencio NO confirma nada;
     no interpreta lo que el alumno anota.
   ========================================================================== */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const CABECERAS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};
const ESCRITURA = { ...CABECERAS, Prefer: 'return=minimal,resolution=ignore-duplicates' };

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

  // Previsualizacion: la pantalla de publicar necesita mostrarle a Sebastian
  // exactamente lo que va a ver el alumno. Se alimenta por mensaje, desde el
  // mismo origen, en vez de duplicar el dibujado en otro archivo: una copia
  // se desviaria del original y lo previsto dejaria de ser lo entregado.
  if (p.get('p') === 'vista') {
    const sesion = await new Promise(resolve => {
      window.addEventListener('message', e => {
        if (e.origin !== location.origin) return;
        if (e.data && e.data.cerca === 'sesion') resolve(e.data.sesion);
      });
      parent.postMessage({ cerca: 'lista' }, location.origin);
    });
    return { sesion, hash: await huella(sesion), declarado: null, entrega: null };
  }

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
  return { sesion: fila.sesion, hash: servido, declarado: fila.hash || null, entrega: token };
}

/* ==========================================================================
   2. Estado vivo
   ========================================================================== */

/* La captura deliberada de informacion de salud esta BLOQUEADA por
   cerca/MATRIZ_DE_DATOS.md hasta que cierre la revision juridica. La misma
   matriz permite construir la arquitectura con la captura desactivada, y eso
   es lo que hay aqui: la tercera pregunta se muestra, el aviso del entrenador
   se muestra, y la respuesta NO se guarda.

   Ponerlo en true es una decision del entrenador y su abogado, no del codigo.
   Mientras sea false, la ejecucion declara que se pregunto y que no se guardo,
   sin dejar rastro de cual fue la respuesta: escribir "se mostro el aviso"
   seria decir cual fue por la puerta de atras. */
const CAPTURA_VIGILANCIA = false;   // C-19

/* El texto de ejemplo del comentario final. Vive aqui y no copiado en cada
   sesion: es el mismo para todos los alumnos, y copiarlo garantiza que en
   algun momento dos alumnos tengan textos distintos sin que nadie lo decida.

   Pregunta por el ENTRENAMIENTO, no por el cuerpo. No se pregunta por
   molestias ni por dolor: si el alumno decide contar algo suyo, lo cuenta por
   su cuenta. Una sesion puede poner el suyo, pero no hace falta. */
/* CONVENCION DE SEBASTIAN, y no se deduce de ningun sitio:
     tabata        = 4 minutos · 8 rondas
     tabata doble  = 8 minutos · 16 rondas
   Siempre 20 s de trabajo y 10 de descanso.
   La sesion declara los segundos; esto esta aqui para que quien lea el codigo
   sepa de donde salen los numeros y no los cambie por su cuenta. */
const TABATA = { trabajo: 20, descanso: 10, simple: 240, doble: 480 };   // C-22

const MARCADOR_FEEDBACK =   // C-26 · C-18
  'Cuéntame cómo te fue: qué pesos usaste, qué ejercicio no te acomodó, qué te costó más de lo que esperabas, y cualquier cosa que quieras que sepa antes de armarte la próxima.';

/* Las tres preguntas se responden comparando con lo habitual. Es lo que un
   entrenador que conoce a la persona puede leer, y evita pedir una escala de
   severidad, que seria pedir otra cosa. */
const OPCIONES_CHECKIN = [
  { id: 'peor',  texto: 'Peor',  detalle: 'que lo habitual' },
  { id: 'igual', texto: 'Igual', detalle: 'que siempre' },
  { id: 'mejor', texto: 'Mejor', detalle: 'que lo habitual' }
];

const S = { sesion: null, hash: null, declarado: null, entrega: null, dias: {} };
const D = id => S.dias[id];

/* ==========================================================================
   3. Dibujar
   ========================================================================== */

function dibujar() {
  const s = S.sesion;
  const app = $('#app');
  app.replaceChildren();
  document.title = `CERCA · ${s.alumno}`;

  const top = el('header', 'top');
  const marca = el('div', 'marca');
  marca.appendChild(el('span', 'isotipo'));
  marca.appendChild(el('span', null, 'CERCA'));
  top.appendChild(marca);
  top.appendChild(el('span', 'pastilla r-apunte', s.alumno));
  app.appendChild(top);

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
    // La barra existe si algun dia se pliega, y se esconde en los que no.
    // En un dia plano se ven todos los bloques a la vez: la barra no dice nada
    // que la pantalla no diga ya.
    if (s.dias.some(esAcordeon)) {
      const pr = el('div', 'progreso');
      const cab = el('div', 'progreso-cab r-etiqueta');
      cab.appendChild(el('span', null, 'Tu sesión'));
      cab.appendChild(el('b', 'progreso-n', '0 / 0'));
      pr.appendChild(cab);
      const barra = el('div', 'barra');
      barra.appendChild(el('i', 'progreso-i'));
      pr.appendChild(barra);
      p.appendChild(pr);
    }
    app.appendChild(p);
  }

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
      refrescarProgreso(dia.id);
      scrollTo({ top: 0, behavior: 'smooth' });
    };
    riel.appendChild(b);
  });
  if (s.dias.length > 1) app.appendChild(riel);
  S.diaVisible = s.dias[0].id;

  s.dias.forEach((dia, i) => app.appendChild(dibujarDia(dia, i === 0)));

  if (s.seguridad) app.appendChild(el('div', 'seguridad r-apunte', s.seguridad));

  s.dias.forEach(d => { refrescarEnvio(d.id); refrescarProgreso(d.id); });
}

/* Un dia largo se pliega; uno corto se ve entero. Cinco bloques es donde deja
   de caber en pantalla y scrollear con las manos ocupadas empieza a molestar.
   No lo declara la sesion: si lo declarara, dos alumnos con dias del mismo
   largo acabarian viendose distinto sin que nadie lo hubiera decidido. */
const esAcordeon = dia => dia.bloques.length >= 5;   // C-23

/* C-28 · El audio dura lo que dura lo que tiene que decir. Un comentario de
   sesion son 90 segundos: se graba con las manos cansadas, justo al terminar, y
   lo que hay que contar cabe. La historia de entrada de alguien nuevo no cabe,
   y por eso /hola/ declara veinte minutos. Los dos topes son deliberados y
   distintos; estaba escrito a mano en cuatro sitios y ahora se declara una vez. */
const TOPE_AUDIO_FEEDBACK = 90;

function dibujarDia(dia, visible) {
  // El identificador de la ejecucion sobrevive a una recarga dentro de la
  // misma pestana: recargar en mitad del entrenamiento no puede crear una
  // segunda ejecucion. Cerrar la pestana si empieza una nueva.
  const llave = `cerca_envio_${dia.sesion_id}`;
  let envio;
  try {
    envio = sessionStorage.getItem(llave) || nuevoId();
    sessionStorage.setItem(llave, envio);
  } catch (e) { envio = nuevoId(); }

  S.dias[dia.id] = {
    bloques: {}, valores: {}, tocados: {}, series: {},
    mision: null, envio, llave, enviado: false, esfuerzo: null, audio: null,
    checkin: { sueno: null, energia: null, vigilancia: null },
    checkinPedidas: dia.checkin ? 2 + (dia.checkin.vigilancia ? 1 : 0) : 0
  };

  const seccion = el('section', 'dia' + (visible ? ' activo' : ''));
  seccion.dataset.dia = dia.id;

  const caja = el('div', 'sesion');
  const cab = el('div', 'sesion-cab');
  cab.appendChild(el('h2', 'r-sesion', dia.titulo));
  if (dia.bajada) cab.appendChild(el('p', 'r-apunte', dia.bajada));
  caja.appendChild(cab);

  const acordeon = esAcordeon(dia);
  const cuerpo = el('div', 'sesion-cuerpo');
  // Antes de todo, porque es lo que se responde antes de entrenar.
  if (dia.checkin) cuerpo.appendChild(dibujarCheckin(dia));
  dia.bloques.forEach((b, i) => cuerpo.appendChild(dibujarBloque(dia, b, i, acordeon)));
  if (dia.feedback) cuerpo.appendChild(dibujarFeedback(dia));
  caja.appendChild(cuerpo);

  seccion.appendChild(caja);
  return seccion;
}

function dibujarCheckin(dia) {
  const est = D(dia.id);
  const c = dia.checkin;
  const caja = el('div', 'checkin');
  caja.appendChild(el('h3', 'r-bloque', c.titulo || 'Antes de empezar'));
  if (c.texto) caja.appendChild(el('p', 'r-apunte', c.texto));

  /* Devuelve la fila de una pregunta. `alResponder` recibe el id elegido; lo
     que se hace con el lo decide quien llama, no esta funcion. */
  function pregunta(texto, alResponder) {
    const fila = el('div', 'checkin-pregunta');
    fila.appendChild(el('span', 'r-lectura', texto));
    const grid = el('div', 'checkin-opciones');
    OPCIONES_CHECKIN.forEach(op => {
      const b = el('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.dataset.opcion = op.id;
      b.appendChild(el('b', null, op.texto));
      b.appendChild(el('small', null, op.detalle));
      b.onclick = () => {
        $$('button', grid).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        alResponder(op.id);
        refrescarEnvio(dia.id);
      };
      grid.appendChild(b);
    });
    fila.appendChild(grid);
    caja.appendChild(fila);
    return fila;
  }

  // Las dos de siempre.
  pregunta(c.sueno || '¿Cómo dormiste?',   v => { est.checkin.sueno = v; });
  pregunta(c.energia || '¿Cómo está tu energía?', v => { est.checkin.energia = v; });

  // La tercera solo existe si esta sesión la declara.
  if (c.vigilancia) {
    const fila = pregunta(c.vigilancia.pregunta, v => {
      est.checkin.vigilancia = v;
      // El código no interpreta la respuesta: muestra el texto que escribió el
      // entrenador cuando ella dice que está peor, y nada más. No cambia la
      // sesión, no sugiere, no avisa a nadie.
      aviso.hidden = !(v === 'peor' && c.vigilancia.aviso);
    });
    const aviso = el('div', 'checkin-aviso r-lectura');
    aviso.hidden = true;
    if (c.vigilancia.aviso) {
      aviso.appendChild(el('b', null, 'Seba te dejó dicho: '));
      aviso.appendChild(document.createTextNode(c.vigilancia.aviso));
    }
    fila.appendChild(aviso);
  }

  return caja;
}

function dibujarBloque(dia, bloque, indice, acordeon) {
  const est = D(dia.id);
  est.bloques[bloque.id] = false;

  const rotulo = bloque.titulo ? `${bloque.id} · ${bloque.titulo}` : bloque.id;
  const n = el(acordeon ? 'details' : 'div', 'bloque');
  n.dataset.bloque = bloque.id;
  n.dataset.rotulo = rotulo;

  let cuerpo = n;
  if (acordeon) {
    if (indice === 0) n.open = true;
    const sum = el('summary');
    sum.appendChild(el('span', 'orden', String(indice + 1).padStart(2, '0')));
    const res = el('span', 'resumen-bloque');
    res.appendChild(el('b', 'r-ejercicio', bloque.titulo || bloque.id));
    if (bloque.intro) res.appendChild(el('small', null, bloque.intro));
    sum.appendChild(res);
    sum.appendChild(el('span', 'flecha', '›'));
    n.appendChild(sum);
    // La bitacora anota el bloque que estaba abierto, no el dia entero.
    n.addEventListener('toggle', () => { if (n.open) S.bloqueVisible = rotulo; });
    cuerpo = el('div', 'cuerpo-bloque');
    n.appendChild(cuerpo);
  } else {
    cuerpo.appendChild(el('h3', 'r-bloque', rotulo));
    if (bloque.intro) cuerpo.appendChild(el('p', 'bloque-intro r-lectura', bloque.intro));
  }

  if (bloque.recorrido) {
    const r = el('div', 'recorrido r-lectura');
    r.appendChild(rico(bloque.recorrido));
    cuerpo.appendChild(r);
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
    cuerpo.appendChild(grid);
    if (bloque.cierre) cuerpo.appendChild(el('div', 'descanso r-lectura', bloque.cierre));
  }

  (bloque.ejercicios || []).forEach(ej => cuerpo.appendChild(dibujarEjercicio(dia, bloque, ej)));

  if (bloque.descanso) {
    const d = el('div', 'descanso r-lectura');
    d.appendChild(rico(bloque.descanso));
    cuerpo.appendChild(d);
  }

  // Un registro puede colgar del bloque (la mision, la carga compartida de un
  // circuito) o de un ejercicio.
  if (bloque.registro) cuerpo.appendChild(dibujarRegistro(dia, `${bloque.id}::${bloque.id}`, bloque.registro));

  // Un bloque puede traer su propio cronometro: el tabata, o el descanso entre
  // vueltas, que es tiempo prescrito igual que una plancha.
  (Array.isArray(bloque.crono) ? bloque.crono : bloque.crono ? [bloque.crono] : []).forEach(c => {
    if (c.tipo === 'tabata') { cuerpo.appendChild(dibujarTabata(c)); return; }
    const b = el('button', 'crono');
    b.type = 'button';
    b.appendChild(el('i', null, '⏱'));
    b.appendChild(document.createTextNode(' ' + (c.rotulo || `${c.segundos} s`)));
    b.onclick = () => abrirCrono(c);
    cuerpo.appendChild(b);
  });

  // Marcar el bloque como listo es el acto explicito que confirma. Mientras
  // no se marca esta disponible, no activo: por eso nace neutro.
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
    refrescarProgreso(dia.id);
  };
  cuerpo.appendChild(listo);

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

  // Una precaucion no es un consejo. Es lo que el entrenador dejo escrito para
  // este ejercicio en concreto, y por eso lleva el color del aviso y no el de
  // la lectura corriente. No pregunta nada y no guarda nada: se lee.
  if (ej.precaucion) {
    const p = el('div', 'precaucion r-lectura');
    p.appendChild(el('b', null, 'Ojo aquí: '));
    p.appendChild(document.createTextNode(ej.precaucion));
    n.appendChild(p);
  }

  (Array.isArray(ej.crono) ? ej.crono : ej.crono ? [ej.crono] : []).forEach(c => {
    if (c.tipo === 'tabata') { n.appendChild(dibujarTabata(c)); return; }
    const b = el('button', 'crono');
    b.type = 'button';
    b.appendChild(el('i', null, '⏱'));
    b.appendChild(document.createTextNode(' ' + (c.rotulo || `${c.segundos} s`)));
    b.onclick = () => abrirCrono(c);
    n.appendChild(b);
  });

  if (ej.registro) n.appendChild(dibujarRegistro(dia, `${bloque.id}::${ej.codigo || ej.nombre}`, ej.registro));
  return n;
}

/* ==========================================================================
   4. Casilleros
   ========================================================================== */

/* Un casillero, con su rastro. `tocado` se enciende en el primer `input` y no
   se apaga nunca: haber movido el campo y haberlo devuelto al valor prescrito
   es una observacion, y perderla seria borrar evidencia. */
function casillero(dia, clave, campo, { prellenado, marcador }) {
  const est = D(dia.id);
  // `r-campo` no es decoracion: es el rol tipografico aprobado a 16px, y la
  // razon es funcional -por debajo, Safari en iOS hace zoom al enfocar-. Se
  // perdio al reescribir esto para Panchi, y el CSS lo respalda ademas.
  const input = el('input', 'r-campo');
  input.dataset.clave = clave;      // deja el casillero localizable desde fuera
  input.dataset.campo = campo.campo;
  input.type = 'number';
  input.inputMode = 'decimal';
  input.min = '0';
  input.step = campo.campo === 'carga' ? '0.5' : '1';
  input.setAttribute('aria-label', campo.etiqueta);

  if (prellenado) {
    input.value = campo.texto;
    est.valores[clave] = Number(campo.texto);
  } else {
    input.placeholder = marcador ?? '—';
  }

  input.oninput = () => {
    est.tocados[clave] = true;
    if (prellenado) input.classList.add('tocado');
    const v = input.value.trim();
    est.valores[clave] = v === '' ? null : Number(v);
    refrescarEnvio(dia.id);
  };
  return input;
}

function dibujarRegistro(dia, base, registro) {
  const tipo = registro.tipo || 'simple';
  const caja = el('div', 'registro');
  caja.appendChild(el('div', 'registro-cab', 'Anota lo que hiciste'));
  if (registro.nota) caja.appendChild(el('div', 'registro-nota r-apunte', registro.nota));

  if (tipo === 'por_serie')          dibujarSeries(dia, base, registro, caja);
  else if (tipo === 'carga_compartida') dibujarCargaCompartida(dia, base, registro, caja);
  else                                dibujarSimple(dia, base, registro, caja);

  const est = D(dia.id);
  if (!est.pieDicho) {
    caja.appendChild(el('div', 'registro-pie r-apunte', registro.pie ||
      'Si no lo anotaste, déjalo en blanco. En blanco significa «no sabemos», y eso es más útil que un número inventado.'));
    est.pieDicho = true;
  }
  return caja;
}

function dibujarSimple(dia, base, registro, caja) {
  registro.campos.forEach(campo => {
    const fila = el('label', 'registro-fila');
    const et = el('span', 'registro-et r-etiqueta', campo.etiqueta);
    const pre = el('em', 'registro-pre');
    pre.textContent = campo.prescrito ? `Seba mandó ${campo.texto}` : 'Todavía no hay referencia';
    et.appendChild(pre);
    fila.appendChild(et);
    fila.appendChild(casillero(dia, `${base}::${campo.campo}`, campo, { prellenado: false }));
    fila.appendChild(el('span', 'registro-un r-etiqueta', campo.unidad));
    caja.appendChild(fila);
    if (!campo.prescrito && campo.motivo) {
      caja.appendChild(el('div', 'registro-motivo r-apunte', campo.motivo));
    }
  });
}

function dibujarCargaCompartida(dia, base, registro, caja) {
  const campo = registro.campo;
  const fila = el('div', 'carga-compartida');
  const et = el('span', 'registro-et r-etiqueta', campo.etiqueta);
  const pre = el('em', 'registro-pre');
  pre.textContent = campo.prescrito
    ? `Seba mandó ${campo.texto} ${campo.unidad} · se confirma al marcar el bloque listo`
    : 'Todavía no hay referencia';
  et.appendChild(pre);
  fila.appendChild(et);
  fila.appendChild(casillero(dia, `${base}::${campo.campo}`, campo, { prellenado: !!campo.prellenado }));
  fila.appendChild(el('span', 'registro-un r-etiqueta', campo.unidad));
  caja.appendChild(fila);
}

function dibujarSeries(dia, base, registro, caja) {
  const est = D(dia.id);
  est.series[base] = [];

  const grid = el('div', 'registro-series');
  ['Serie', ...registro.columnas.map(c => c.etiqueta)].forEach(t =>
    grid.appendChild(el('span', 'cab', t)));
  caja.appendChild(grid);

  const filas = el('div');
  filas.className = 'registro-series';
  caja.appendChild(filas);

  // Agregar series es opcional. Si el entrenador no declara un maximo mayor que
  // las series previstas, el boton no existe: ocupa sitio y no se usa.
  const permiteAgregar = (registro.maximo || 0) > (registro.series || 1);
  const sumar = el('button', 'sumar-serie', '+ AGREGAR SERIE');
  sumar.type = 'button';

  function renumerar() {
    est.series[base].forEach((s, i) => { s.n = i + 1; s.nodo.textContent = 'S' + (i + 1); });
    sumar.disabled = est.series[base].length >= (registro.maximo || 0);
  }

  function agregar(anadida) {
    const n = est.series[base].length + 1;
    const sn = el('span', 'sn', 'S' + n);
    filas.appendChild(sn);
    const serie = { n, anadida, nodo: sn, claves: {} };
    registro.columnas.forEach(col => {
      // Una serie anadida no estaba prevista: ninguno de sus campos viene
      // prescrito, asi que ninguno nace con valor escrito.
      const prellenado = !anadida && !!col.prellenado;
      const clave = `${base}::S${n}::${col.campo}`;
      serie.claves[col.campo] = clave;
      filas.appendChild(casillero(dia, clave, col, { prellenado, marcador: col.texto || '—' }));
    });
    if (anadida) {
      const quitar = el('button', 'quitar-serie', 'QUITAR SERIE');
      quitar.type = 'button';
      quitar.onclick = () => {
        // Solo se puede quitar mientras esta vacia: con datos escritos,
        // borrarla seria destruir un registro sin dejar constancia.
        const conDatos = Object.values(serie.claves).some(k =>
          est.valores[k] !== null && est.valores[k] !== undefined);
        if (conDatos) { quitar.textContent = 'TIENE DATOS ANOTADOS'; return; }
        Object.values(serie.claves).forEach(k => { delete est.valores[k]; delete est.tocados[k]; });
        serie.nodos.forEach(x => x.remove());
        est.series[base] = est.series[base].filter(x => x !== serie);
        renumerar(); refrescarEnvio(dia.id);
      };
      filas.appendChild(quitar);
    }
    // Guardamos los nodos de la fila para poder retirarla entera.
    const total = 1 + registro.columnas.length + (anadida ? 1 : 0);
    serie.nodos = [...filas.children].slice(-total);
    est.series[base].push(serie);
    renumerar();
    refrescarEnvio(dia.id);
  }

  for (let i = 0; i < (registro.series || 1); i++) agregar(false);
  if (permiteAgregar) {
    sumar.onclick = () => { if (!sumar.disabled) agregar(true); };
    caja.appendChild(sumar);
  }
}

/* ==========================================================================
   5. Feedback
   ========================================================================== */

function dibujarFeedback(dia) {
  const est = D(dia.id);
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
  nota.maxLength = 1000;
  nota.placeholder = dia.feedback.marcador || MARCADOR_FEEDBACK;
  caja.appendChild(nota);

  if (dia.feedback.audio) caja.appendChild(dibujarAudio(dia));

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
  const b = D(id).bloques;
  const claves = Object.keys(b);
  return { listos: claves.filter(k => b[k]).length, total: claves.length };
}

function refrescarProgreso(id) {
  if (id !== S.diaVisible) return;
  const caja = $('.progreso');
  if (!caja) return;
  const dia = S.sesion.dias.find(d => d.id === id);
  caja.hidden = !esAcordeon(dia);
  if (caja.hidden) return;
  const { listos, total } = cuentaBloques(id);
  const n = $('.progreso-n');
  if (!n) return;
  n.textContent = `${listos} / ${total}`;
  $('.progreso-i').style.width = total ? (listos / total * 100) + '%' : '0';
}

function refrescarEnvio(id) {
  const caja = $(`.feedback[data-fb="${id}"]`);
  if (!caja) return;
  const est = D(id);
  if (est.enviado) return;

  const { listos, total } = cuentaBloques(id);
  const anotados = Object.values(est.valores).filter(v => v !== null && v !== undefined).length;
  const acepta = $(`#consent-${id}`).checked;

  const ck = est.checkin;
  const dadas = [ck.sueno, ck.energia, ck.vigilancia].filter(v => v !== null).length;

  $('.resumen', caja).textContent =
    (est.checkinPedidas ? `Check-in: ${dadas} de ${est.checkinPedidas} · ` : '') +
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
   6. Lo ejecutado
   --------------------------------------------------------------------------
   desconocido                  no se anoto, o el campo venia escrito y nadie
                                confirmo nada. No es cero ni es lo prescrito.
   confirmado                   se anoto y coincide con lo que se mando, o el
                                alumno marco el bloque como listo.
   modificado                   se anoto y no coincide con lo que se mando.
   registrado_sin_prescripcion  se anoto, pero nunca hubo numero que confirmar
                                ni modificar. Este dato crea la referencia.

   La regla que cubre los dos casos: LA CONFIRMACION NUNCA PUEDE VENIR DE UN
   NUMERO QUE PUSO EL SISTEMA. Si el campo nace vacio, escribirlo es el acto.
   Si nace con lo prescrito escrito, hace falta un acto aparte: marcar el
   bloque como listo, o mover el campo.
   ========================================================================== */

function estadoDeCampo(campo, valor, tocado, bloqueListo, anadida) {
  const vacio = valor === null || valor === undefined || valor === '' || Number.isNaN(valor);

  if (anadida) {
    return vacio
      ? { estado: 'desconocido', motivo: 'serie_anadida_sin_anotar' }
      : { estado: 'registrado_sin_prescripcion', evidencia: 'serie_anadida_en_ejecucion' };
  }

  if (campo.prellenado) {
    if (vacio) return { estado: 'desconocido', motivo: tocado ? 'campo_vaciado' : 'no_anotado' };
    const igual = String(valor) === String(campo.texto);
    // Haberlo movido y haberlo dejado igual NO es lo mismo que no haberlo
    // tocado. Las dos cosas dan "confirmado", pero por evidencias distintas.
    if (tocado) return igual
      ? { estado: 'confirmado', evidencia: 'campo_movido_y_devuelto_al_valor_prescrito' }
      : { estado: 'modificado', evidencia: 'campo_cambiado' };
    if (bloqueListo) return { estado: 'confirmado', evidencia: 'bloque_marcado_listo' };
    return { estado: 'desconocido', motivo: 'bloque_no_marcado_listo' };
  }

  if (vacio) return { estado: 'desconocido', motivo: 'no_anotado' };
  if (!campo.prescrito) return { estado: 'registrado_sin_prescripcion', evidencia: 'anotado_por_el_alumno' };
  if (typeof campo.min === 'number' && typeof campo.max === 'number') {
    return (valor >= campo.min && valor <= campo.max)
      ? { estado: 'confirmado', evidencia: 'anotado_dentro_del_rango' }
      : { estado: 'modificado', evidencia: 'anotado_fuera_del_rango' };
  }
  return { estado: 'confirmado', evidencia: 'anotado_por_el_alumno' };
}

function campoPayload(campo, valor, tocado, bloqueListo, anadida) {
  const r = estadoDeCampo(campo, valor, tocado, bloqueListo, anadida);
  return {
    campo: campo.campo,
    etiqueta: campo.etiqueta,
    unidad: campo.unidad || null,
    prescrito: (anadida || !campo.prescrito)
      ? { declarado: false, motivo: anadida ? 'serie no prevista en la prescripción' : (campo.motivo || null) }
      : { declarado: true, valor: campo.texto, min: campo.min ?? null, max: campo.max ?? null,
          prellenado: !!campo.prellenado },
    registrado: (valor === null || valor === undefined)
      ? { declarado: false }
      : { declarado: true, valor },
    tocado: !!tocado,
    estado: r.estado,
    evidencia: r.evidencia || null,
    motivo: r.motivo || null
  };
}

function construirEjecucion(dia) {
  const est = D(dia.id);
  const seccion = $(`.dia[data-dia="${dia.id}"]`);

  const bloques = Object.entries(est.bloques).map(([id, confirmado]) => ({
    id,
    titulo: $(`.bloque[data-bloque="${id}"]`, seccion)?.dataset.rotulo || null,
    confirmado
  }));

  const registros = [];
  dia.bloques.forEach(bloque => {
    const listo = !!est.bloques[bloque.id];
    const juntar = (ref, nombre, registro) => {
      if (!registro) return;
      const tipo = registro.tipo || 'simple';
      // La clave lleva el bloque delante: el codigo de un ejercicio identifica
      // dentro de SU bloque, no dentro del dia. Sin esto, el "1" del
      // calentamiento y el "1" de la zona media se pisan los valores.
      const base = `${bloque.id}::${ref}`;

      if (tipo === 'por_serie') {
        registros.push({
          bloque: bloque.id, ref, nombre, captura: 'por_serie',
          series: (est.series[base] || []).map(s => ({
            serie: s.n,
            anadida_en_ejecucion: s.anadida,
            campos: registro.columnas.map(col => campoPayload(
              col, est.valores[s.claves[col.campo]] ?? null,
              est.tocados[s.claves[col.campo]], listo, s.anadida))
          }))
        });
        return;
      }

      const campos = tipo === 'carga_compartida' ? [registro.campo] : registro.campos;
      registros.push({
        bloque: bloque.id, ref, nombre,
        // Una entrada por ejercicio, no una por vuelta. Decirlo importa: "las
        // tres vueltas iguales" y "anote cada vuelta" son evidencias distintas.
        captura: tipo === 'carga_compartida' ? 'carga_compartida' : 'en_conjunto',
        campos: campos.map(c => campoPayload(
          c, est.valores[`${base}::${c.campo}`] ?? null,
          est.tocados[`${base}::${c.campo}`], listo, false))
      });
    };
    juntar(bloque.id, bloque.titulo, bloque.registro);
    (bloque.ejercicios || []).forEach(ej => juntar(ej.codigo || ej.nombre, ej.nombre, ej.registro));
  });

  const ejecucion = {
    dia: dia.id,
    sesion_id: dia.sesion_id,
    entrega: S.entrega,
    checkin: construirCheckin(dia),
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

/* Un check-in sin responder no se lee como conformidad: se escribe como lo que
   es. Por eso cada respuesta declara si se registro, y el conjunto declara si
   se respondio entero, a medias o nada. */
function construirCheckin(dia) {
  if (!dia.checkin) return { solicitado: false, motivo: 'esta sesión no pide check-in' };
  const est = D(dia.id).checkin;
  const c = dia.checkin;

  const responde = v => v === null
    ? { registrado: false, motivo: 'no_respondida' }
    : { registrado: true, valor: v };

  // Se cuentan solo las preguntas que de verdad se hicieron. La version
  // anterior metia un centinela para la tercera cuando no existia, y ese
  // centinela se contaba: dos de dos respondidas salian como "parcial".
  const respuestas = [est.sueno, est.energia];
  if (c.vigilancia) respuestas.push(est.vigilancia);
  const pedidas = respuestas.length;
  const dadas = respuestas.filter(v => v !== null).length;

  const salida = {
    solicitado: true,
    estado_respuesta: dadas === 0 ? 'sin_respuesta' : dadas === pedidas ? 'respondido' : 'parcial',
    comparado_con: 'lo habitual',
    sueno: responde(est.sueno),
    energia: responde(est.energia)
  };

  if (c.vigilancia) {
    salida.vigilancia = CAPTURA_VIGILANCIA
      ? { id: c.vigilancia.id, preguntada: true, ...responde(est.vigilancia),
          aviso_mostrado: est.vigilancia === 'peor' && !!c.vigilancia.aviso }
      : { id: c.vigilancia.id, preguntada: true, registrado: false,
          motivo: 'captura de información de salud desactivada (MATRIZ_DE_DATOS)' };
  }
  return salida;
}

function completionDe(id) {
  const { listos, total } = cuentaBloques(id);
  if (listos === 0) return 'no';
  if (listos === total) return 'si';
  return 'casi';
}

/* ==========================================================================
   7. Audio
   ========================================================================== */

function dibujarAudio(dia) {
  const est = D(dia.id);
  const caja = el('div', 'audio');
  const botones = el('div', 'audio-botones');
  const grabar = el('button', 'audio-btn', '● GRABAR AUDIO');
  grabar.type = 'button';
  const borrar = el('button', 'audio-btn', 'BORRAR AUDIO');
  borrar.type = 'button';
  borrar.hidden = true;
  botones.appendChild(grabar);
  botones.appendChild(borrar);
  caja.appendChild(botones);
  const rotulo = el('div', 'audio-estado', `Opcional · máximo ${TOPE_AUDIO_FEEDBACK} segundos.`);
  caja.appendChild(rotulo);
  const oir = el('audio');
  oir.controls = true;
  oir.hidden = true;
  caja.appendChild(oir);

  let rec = null, pista = null, trozos = [], reloj = null, seg = 0;

  const mime = () => {
    const c = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    return (window.MediaRecorder && MediaRecorder.isTypeSupported)
      ? (c.find(x => MediaRecorder.isTypeSupported(x)) || '') : '';
  };
  const ext = t => {
    t = (t || '').toLowerCase();
    if (t.includes('mp4')) return 'm4a';
    if (t.includes('ogg')) return 'ogg';
    if (t.includes('mpeg')) return 'mp3';
    return 'webm';
  };
  const soltar = () => { if (pista) { pista.getTracks().forEach(t => t.stop()); pista = null; } };

  borrar.onclick = () => {
    clearInterval(reloj); soltar();
    est.audio = null; trozos = []; seg = 0;
    if (oir.src) URL.revokeObjectURL(oir.src);
    oir.removeAttribute('src'); oir.hidden = true;
    borrar.hidden = true;
    grabar.textContent = '● GRABAR AUDIO';
    grabar.classList.remove('grabando');
    rotulo.textContent = `Opcional · máximo ${TOPE_AUDIO_FEEDBACK} segundos.`;
  };

  grabar.onclick = async () => {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      rotulo.textContent = 'Este navegador no permite grabar aquí. Puedes escribir tu feedback.';
      return;
    }
    try {
      pista = await navigator.mediaDevices.getUserMedia({ audio: true });
      trozos = []; seg = 0;
      const m = mime();
      rec = m ? new MediaRecorder(pista, { mimeType: m }) : new MediaRecorder(pista);
      rec.ondataavailable = e => { if (e.data && e.data.size) trozos.push(e.data); };
      rec.onstop = () => {
        clearInterval(reloj); soltar();
        est.audio = new Blob(trozos, { type: rec.mimeType || m || 'audio/webm' });
        est.audioExt = ext(est.audio.type);
        oir.src = URL.createObjectURL(est.audio);
        oir.hidden = false;
        borrar.hidden = false;
        grabar.textContent = '● GRABAR DE NUEVO';
        grabar.classList.remove('grabando');
        rotulo.textContent = `Audio listo · ${seg} s. Puedes escucharlo antes de enviar.`;
      };
      rec.start();
      grabar.textContent = '■ DETENER';
      grabar.classList.add('grabando');
      rotulo.textContent = `Grabando… 0 s / ${TOPE_AUDIO_FEEDBACK} s`;
      reloj = setInterval(() => {
        seg++;
        rotulo.textContent = `Grabando… ${seg} s / ${TOPE_AUDIO_FEEDBACK} s`;
        if (seg >= TOPE_AUDIO_FEEDBACK && rec?.state === 'recording') rec.stop();
      }, 1000);
    } catch (e) {
      soltar();
      rotulo.textContent = 'No pude acceder al micrófono. Puedes escribir tu feedback.';
    }
  };
  return caja;
}

async function subirAudio(dia) {
  const est = D(dia.id);
  if (!est.audio) return null;
  const ruta = `${S.sesion.alumno_slug}/${dia.sesion_id}/feedback/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${est.audioExt}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/cerca-feedback-audio/${ruta}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': est.audio.type || 'audio/webm', 'x-upsert': 'false'
    },
    body: est.audio
  });
  if (!r.ok) throw new Error('No pude guardar el audio.');
  return ruta;
}

/* ==========================================================================
   8. Enviar
   ========================================================================== */

const PREVISUALIZANDO = new URLSearchParams(location.search).get('p') === 'vista';

async function enviarDia(dia, caja) {
  const est = D(dia.id);
  const boton = $('.btn-primario', caja);
  if (boton.disabled) return;
  if (PREVISUALIZANDO) {
    $('.estado', caja).textContent = 'Esto es una vista previa: no se envía nada.';
    return;
  }
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
    if (!r1.ok) throw new Error('No pude guardar el registro de la sesión.');

    const audio = await subirAudio(dia);

    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/cerca_workout_feedback`, {
      method: 'POST', headers: ESCRITURA,
      body: JSON.stringify({
        ...comun,
        completion: completionDe(dia.id),
        effort: est.esfuerzo,
        comment: nota,
        audio_path: audio,
        execution_submission_id: est.envio
      })
    });
    if (!r2.ok) throw new Error('No pude guardar el feedback.');

    est.enviado = true;
    rotulo.textContent = 'Enviado a Seba ✓';
    boton.textContent = 'ENVIADO ✓';
    try { sessionStorage.removeItem(est.llave); } catch (e) {}
  } catch (e) {
    rotulo.textContent = e.message || 'No se pudo enviar ahora. Intenta de nuevo.';
    rotulo.classList.add('mal');
    boton.disabled = false;
    boton.textContent = 'ENVIAR A SEBA';
  }
}

/* ==========================================================================
   9. Cronometros
   ========================================================================== */

const crono = { restante: 30, tic: null, corriendo: false, vueltas: null, vuelta: 0, rotulos: [] };
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

let audioCtx = null;
function pitar(hz = 880, dur = .12) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = hz;
    g.gain.setValueAtTime(.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* sin sonido, el numero sigue estando */ }
}

function pintarCrono() { $('#cronoTiempo').textContent = mmss(crono.restante); }
function pararCrono() { clearInterval(crono.tic); crono.tic = null; crono.corriendo = false; $('#cronoVa').textContent = 'INICIAR'; }
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

/* --- Tabata: vive dentro del bloque, no en la hoja ------------------------ */
function dibujarTabata(c) {
  const trabajo = c.trabajo || 20, descanso = c.descanso || 10, total = c.total || 480;
  const nombres = c.ejercicios || ['Trabajo'];
  const caja = el('div', 'tabata');
  caja.appendChild(el('small', 'fase r-etiqueta', c.rotulo || 'TABATA'));
  const fase = el('strong', 'fase r-etiqueta', 'LISTO');
  caja.appendChild(fase);
  const cuenta = el('div', 'cuenta', String(trabajo));
  caja.appendChild(cuenta);
  const quien = el('b', 'quien', nombres[0]);
  caja.appendChild(quien);
  const reloj = el('em', 'reloj');
  caja.appendChild(reloj);

  const mandos = el('div', 'tabata-mandos');
  const va = el('button', 'va', 'INICIAR'); va.type = 'button';
  const pausa = el('button', null, 'PAUSA'); pausa.type = 'button'; pausa.disabled = true;
  const cero = el('button', null, 'REINICIAR'); cero.type = 'button';
  mandos.appendChild(cero); mandos.appendChild(pausa); mandos.appendChild(va);
  caja.appendChild(mandos);
  const aviso = el('div', 'aviso', 'CERCA avisa con sonido al cambiar trabajo y descanso.');
  caja.appendChild(aviso);

  let corriendo = false, tic = null, en = 'trabajo', queda = trabajo, ido = 0, i = 0, lock = null;

  async function pedirPantalla() {
    try { if ('wakeLock' in navigator && !lock) lock = await navigator.wakeLock.request('screen'); }
    catch (e) { aviso.textContent = 'El cronómetro seguirá sonando, pero este dispositivo no permitió mantener la pantalla encendida.'; }
  }
  async function soltarPantalla() { try { if (lock) await lock.release(); } catch (e) {} lock = null; }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && corriendo) pedirPantalla();
  });

  function pintar() {
    fase.textContent = ido >= total ? 'TERMINADO' : en === 'trabajo' ? 'TRABAJO' : 'DESCANSO';
    cuenta.textContent = ido >= total ? '✓' : String(queda);
    quien.textContent = nombres[i % nombres.length];
    reloj.textContent = `${Math.floor(ido / 60)}:${String(ido % 60).padStart(2, '0')} / ${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    pausa.disabled = !corriendo;
    va.textContent = corriendo ? 'CORRIENDO' : 'INICIAR';
  }
  function tick() {
    if (ido >= total) { clearInterval(tic); corriendo = false; pitar(1100, .28); soltarPantalla(); pintar(); return; }
    queda--; ido++;
    if (queda <= 0) {
      if (en === 'trabajo') { en = 'descanso'; queda = descanso; pitar(520, .15); }
      else { en = 'trabajo'; queda = trabajo; i++; pitar(980, .15); }
    }
    pintar();
  }
  va.onclick = async () => {
    if (corriendo) return;
    corriendo = true; pitar(980, .12); await pedirPantalla(); pintar();
    tic = setInterval(tick, 1000);
  };
  pausa.onclick = () => { clearInterval(tic); corriendo = false; soltarPantalla(); pintar(); };
  cero.onclick = () => { clearInterval(tic); corriendo = false; en = 'trabajo'; queda = trabajo; ido = 0; i = 0; soltarPantalla(); pintar(); };
  pintar();
  return caja;
}

/* ==========================================================================
   10. Chat / bitacora
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
  if (PREVISUALIZANDO) { rotulo.textContent = 'Vista previa: los mensajes no se guardan.'; return; }
  rotulo.textContent = 'Guardando…';
  const dia = S.sesion.dias.find(d => d.id === S.diaVisible) || S.sesion.dias[0];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cerca_session_questions`, {
      method: 'POST', headers: ESCRITURA,
      body: JSON.stringify({
        session_id: dia.sesion_id,
        student_slug: S.sesion.alumno_slug,
        block_id: S.bloqueVisible || `dia_${dia.id}`,
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
   11. Arranque
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
