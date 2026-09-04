/* ==========================================================================
   CERCA · Pantalla de bienvenida
   --------------------------------------------------------------------------
   Una persona nueva abre su enlace, lee el texto que escribio Seba y contesta
   contando su historia: hablando, escribiendo, o las dos cosas.

   Lo que esta pantalla NO hace, a proposito:
     no parte la respuesta en campos por pregunta —objetivo, experiencia,
       equipamiento— porque la gracia es que hable suelto y una cajita por
       pregunta convierte una conversacion en un formulario;
     no obliga a nada: se puede enviar solo el audio, solo el texto, o los dos;
     no resume, no transcribe y no interpreta. Lo escucha una persona.
   ========================================================================== */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const CABECERAS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

/* La version del consentimiento viaja con cada respuesta. Si el texto cambia,
   cambia la version, y dentro de un ano se puede saber a que dijo que si cada
   persona en vez de suponerlo. */
const CONSENTIMIENTO = {   // C-20
  version: 'bienvenida-2026-09-04',
  texto: 'Acepto enviarle esto a Seba para que prepare mi entrenamiento. Entiendo que si cuento algo sobre mi salud —una lesión, un dolor, una operación— queda guardado en lo que envío, y que puedo pedirle que lo borre cuando quiera.'
};

/* Diez minutos es el minimo que pidio direccion. El tope son veinte: alguien
   contando su historia no cabe en noventa segundos, y quedarse sin tiempo a
   mitad de una frase es peor que cualquier limite. */
const TOPE_SEGUNDOS = 20 * 60;   // C-28

const B = { entrega: null, datos: null, audio: null, audioExt: null, audioSegundos: 0 };

function el(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto != null) n.textContent = texto;
  return n;
}

function rico(texto) {
  const frag = document.createDocumentFragment();
  String(texto ?? '').split(/(\*[^*]+\*)/).forEach(p => {
    if (/^\*[^*]+\*$/.test(p)) frag.appendChild(el('b', null, p.slice(1, -1)));
    else if (p) frag.appendChild(document.createTextNode(p));
  });
  return frag;
}

const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function detener(titulo, detalle) {
  const caja = el('div', 'fallo');
  caja.appendChild(el('h1', null, titulo));
  caja.appendChild(el('p', 'r-lectura', detalle));
  $('#app').replaceChildren(caja);
}

/* ==========================================================================
   1. Cargar la invitacion
   ========================================================================== */

async function cargar() {
  const p = new URLSearchParams(location.search);

  if (p.get('p') === 'vista') {
    const datos = await new Promise(resolve => {
      window.addEventListener('message', e => {
        if (e.origin !== location.origin) return;
        if (e.data && e.data.cerca === 'sesion') resolve(e.data.sesion);
      });
      parent.postMessage({ cerca: 'lista' }, location.origin);
    });
    return { datos, entrega: null };
  }

  const archivo = p.get('f');
  if (archivo) {
    if (!/^[a-zA-Z0-9_-]+$/.test(archivo)) throw new Error('archivo');
    const r = await fetch(`../sesiones/${archivo}.json`);
    if (!r.ok) throw new Error('archivo');
    return { datos: await r.json(), entrega: archivo };
  }

  const token = p.get('e');
  if (!token) throw new Error('sin_token');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cerca_entrega`, {
    method: 'POST', headers: CABECERAS, body: JSON.stringify({ p_token: token })
  });
  if (!r.ok) throw new Error('red');
  const filas = await r.json();
  const fila = Array.isArray(filas) ? filas[0] : filas;
  if (!fila || !fila.sesion) throw new Error('no_existe');
  return { datos: fila.sesion, entrega: token };
}

/* ==========================================================================
   2. El texto de Seba, tal cual
   --------------------------------------------------------------------------
   Se guarda verbatim y se dibuja verbatim. Lo unico que hace el codigo es
   decidir donde empieza un parrafo y donde una lista: no toca una palabra.
   ========================================================================== */

function dibujarTexto(texto) {
  const caja = el('div', 'invitacion');
  const bloques = String(texto).split(/\n{2,}/);
  bloques.forEach(bloque => {
    const lineas = bloque.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lineas.length) return;
    if (lineas.every(l => /^[•\-–]\s/.test(l))) {
      const ul = el('ul', 'invitacion-lista');
      lineas.forEach(l => {
        const li = el('li', 'r-lectura');
        li.appendChild(rico(l.replace(/^[•\-–]\s*/, '')));
        ul.appendChild(li);
      });
      caja.appendChild(ul);
      return;
    }
    const p = el('p', 'r-lectura');
    p.appendChild(rico(lineas.join(' ')));
    caja.appendChild(p);
  });
  return caja;
}

/* ==========================================================================
   3. El audio
   ========================================================================== */

function dibujarAudio() {
  const caja = el('div', 'audio-larga');
  caja.appendChild(el('h3', 'r-bloque', 'Cuéntanoslo hablando'));
  caja.appendChild(el('p', 'r-apunte',
    `Puedes pausar cuando quieras, escucharlo antes de enviarlo y volver a grabar si no te gustó. Hasta ${TOPE_SEGUNDOS / 60} minutos.`));

  // El reloj no existe hasta que hay algo que contar: un 00:00 antes de
  // apretar nada solo empuja el boton hacia abajo.
  const reloj = el('div', 'audio-reloj', '00:00');
  reloj.hidden = true;
  caja.appendChild(reloj);
  const rotulo = el('div', 'audio-estado r-apunte', 'Sin grabar todavía.');

  const botones = el('div', 'audio-botones');
  const grabar  = el('button', 'btn audio-principal', '● GRABAR');
  const pausar  = el('button', 'btn', '⏸ PAUSA');
  const parar   = el('button', 'btn', '■ TERMINAR');
  const borrar  = el('button', 'btn', 'BORRAR Y GRABAR DE NUEVO');
  [grabar, pausar, parar, borrar].forEach(b => { b.type = 'button'; botones.appendChild(b); });
  pausar.hidden = parar.hidden = borrar.hidden = true;
  caja.appendChild(botones);
  caja.appendChild(rotulo);

  const oir = el('audio');
  oir.controls = true;
  oir.hidden = true;
  caja.appendChild(oir);

  let rec = null, pista = null, trozos = [], tic = null, seg = 0;

  const mime = () => {
    const c = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
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
  const contar = () => {
    tic = setInterval(() => {
      seg++;
      reloj.textContent = mmss(seg);
      if (seg >= TOPE_SEGUNDOS && rec && rec.state !== 'inactive') {
        rotulo.textContent = `Llegaste al máximo de ${TOPE_SEGUNDOS / 60} minutos. Guardé lo que llevabas.`;
        rec.stop();
      }
    }, 1000);
  };

  grabar.onclick = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      rotulo.textContent = 'Este navegador no permite grabar aquí. Puedes escribirlo más abajo.';
      return;
    }
    try {
      pista = await navigator.mediaDevices.getUserMedia({ audio: true });
      trozos = []; seg = 0; reloj.textContent = '00:00';
      const m = mime();
      rec = m ? new MediaRecorder(pista, { mimeType: m }) : new MediaRecorder(pista);
      rec.ondataavailable = e => { if (e.data && e.data.size) trozos.push(e.data); };
      rec.onstop = () => {
        clearInterval(tic); soltar();
        B.audio = new Blob(trozos, { type: rec.mimeType || m || 'audio/webm' });
        B.audioExt = ext(B.audio.type);
        B.audioSegundos = seg;
        oir.src = URL.createObjectURL(B.audio);
        oir.hidden = false;
        grabar.hidden = pausar.hidden = parar.hidden = true;
        borrar.hidden = false;
        reloj.textContent = mmss(seg);
        rotulo.textContent = `Listo · ${mmss(seg)}. Escúchalo antes de enviarlo si quieres.`;
        refrescar();
      };
      rec.start(1000);   // trozos de 1 s: una grabacion larga no se pierde entera
      contar();
      reloj.hidden = false;
      grabar.hidden = true;
      pausar.hidden = parar.hidden = false;
      rotulo.textContent = 'Grabando. Tómate el tiempo que necesites.';
    } catch (e) {
      soltar();
      rotulo.textContent = 'No pude acceder al micrófono. Puedes escribirlo más abajo.';
    }
  };

  pausar.onclick = () => {
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause(); clearInterval(tic);
      pausar.textContent = '▶ SEGUIR';
      rotulo.textContent = 'En pausa. Sigue cuando quieras.';
    } else if (rec.state === 'paused') {
      rec.resume(); contar();
      pausar.textContent = '⏸ PAUSA';
      rotulo.textContent = 'Grabando. Tómate el tiempo que necesites.';
    }
  };

  parar.onclick = () => { if (rec && rec.state !== 'inactive') rec.stop(); };

  borrar.onclick = () => {
    clearInterval(tic); soltar();
    B.audio = null; B.audioSegundos = 0; trozos = []; seg = 0;
    if (oir.src) URL.revokeObjectURL(oir.src);
    oir.removeAttribute('src'); oir.hidden = true;
    borrar.hidden = true; grabar.hidden = false;
    pausar.textContent = '⏸ PAUSA';
    reloj.textContent = '00:00';
    reloj.hidden = true;
    rotulo.textContent = 'Sin grabar todavía.';
    refrescar();
  };

  return caja;
}

/* ==========================================================================
   4. Enviar
   ========================================================================== */

function refrescar() {
  const boton = $('#enviar');
  if (!boton || boton.dataset.enviado) return;
  const acepta = $('#consent').checked;
  const hay = !!B.audio || $('#texto').value.trim().length > 0;

  $('#resumen').textContent = !hay
    ? 'Todavía no has grabado ni escrito nada. Con una de las dos cosas basta.'
    : [B.audio ? `audio de ${mmss(B.audioSegundos)}` : null,
       $('#texto').value.trim() ? 'lo que escribiste' : null].filter(Boolean).join(' y ')
       .replace(/^./, c => 'Vas a enviar ' + c.toLowerCase());

  boton.disabled = !(hay && acepta);
  boton.textContent = !hay ? 'GRABA O ESCRIBE ALGO' : !acepta ? 'ACEPTA PARA ENVIAR' : 'ENVIAR A SEBA';
}

async function subirAudio() {
  if (!B.audio) return null;
  // Misma forma que el audio de feedback: la persona primero. Todo lo de
  // alguien cuelga de su nombre corto, que es lo que hace posible atender un
  // «borrame lo que mandé» sin ir a buscar archivo por archivo.
  const ruta = `${B.datos.alumno_slug}/bienvenida/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${B.audioExt}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/cerca-feedback-audio/${ruta}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': B.audio.type || 'audio/webm', 'x-upsert': 'false'
    },
    body: B.audio
  });
  if (!r.ok) throw new Error('No pude guardar el audio. Revisa tu conexión e inténtalo otra vez.');
  return ruta;
}

async function enviar() {
  const boton = $('#enviar');
  if (boton.disabled) return;
  const estado = $('#estado');

  if (PREVISUALIZANDO) {
    estado.textContent = 'Esto es una vista previa: no se envía nada.';
    return;
  }

  boton.disabled = true;
  estado.classList.remove('mal');
  estado.textContent = B.audio ? 'Enviando tu audio… puede tardar un poco.' : 'Enviando…';
  boton.textContent = 'ENVIANDO…';

  try {
    const audio = await subirAudio();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cerca_bienvenidas`, {
      method: 'POST',
      headers: { ...CABECERAS, Prefer: 'return=minimal' },
      body: JSON.stringify({
        token: B.entrega,
        alumno_slug: B.datos.alumno_slug,
        texto: $('#texto').value.trim() || null,
        audio_path: audio,
        audio_segundos: B.audio ? B.audioSegundos : null,
        consentimiento_version: CONSENTIMIENTO.version,
        // Se marca por lo que PUEDE contener, no por lo que contiene: nadie lo
        // ha escuchado todavia. Es lo que permitira borrarlo el dia que haya
        // politica de retencion.
        contiene_salud_posible: true,
        procesado_por_ia: false,
        client_version: VERSION_CLIENTE,
        source: FUENTE
      })
    });
    if (!r.ok) throw new Error('No pude enviar tu respuesta. Revisa tu conexión e inténtalo otra vez.');

    boton.dataset.enviado = '1';
    $('#formulario').hidden = true;
    $('#gracias').hidden = false;
    $('#gracias').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {
    estado.textContent = e.message || 'No pude enviar. Inténtalo otra vez.';
    estado.classList.add('mal');
    boton.disabled = false;
    boton.textContent = 'ENVIAR A SEBA';
  }
}

/* ==========================================================================
   5. Dibujar
   ========================================================================== */

const PREVISUALIZANDO = new URLSearchParams(location.search).get('p') === 'vista';

function dibujar() {
  const d = B.datos;
  const app = $('#app');
  app.replaceChildren();
  document.title = 'CERCA';

  const top = el('header', 'top');
  const marca = el('div', 'marca');
  marca.appendChild(el('span', 'isotipo'));
  marca.appendChild(el('span', null, 'CERCA'));
  top.appendChild(marca);
  app.appendChild(top);

  if (d.portada) {
    const p = el('section', 'portada');
    if (d.portada.kicker) p.appendChild(el('div', 'kicker', d.portada.kicker));
    const h1 = el('h1', 'r-portada');
    String(d.portada.titulo || '').split('\n').forEach((l, i) => {
      if (i) h1.appendChild(el('br'));
      h1.appendChild(document.createTextNode(l));
    });
    p.appendChild(h1);
    if (d.portada.bajada) p.appendChild(el('p', 'bajada r-lectura', d.portada.bajada));
    app.appendChild(p);
  }

  app.appendChild(dibujarTexto(d.texto));

  const form = el('section', 'responder');
  form.id = 'formulario';
  form.appendChild(dibujarAudio());

  const escribir = el('div', 'escribir');
  escribir.appendChild(el('h3', 'r-bloque', 'O cuéntanoslo escribiendo'));
  escribir.appendChild(el('p', 'r-apunte', 'Puedes usar las dos cosas, o solo una. Lo que te acomode.'));
  const ta = el('textarea');
  ta.id = 'texto';
  ta.rows = 10;
  ta.placeholder = 'Escribe aquí, con tus palabras y sin orden…';
  ta.oninput = refrescar;
  escribir.appendChild(ta);
  form.appendChild(escribir);

  form.appendChild(el('div', 'resumen r-apunte')).id = 'resumen';

  const consent = el('div', 'consent');
  const check = el('input');
  check.type = 'checkbox';
  check.id = 'consent';
  check.onchange = refrescar;
  const lab = el('label', 'r-apunte', CONSENTIMIENTO.texto);
  lab.setAttribute('for', 'consent');
  consent.appendChild(check);
  consent.appendChild(lab);
  form.appendChild(consent);

  const enviarBtn = el('button', 'btn btn-primario');
  enviarBtn.id = 'enviar';
  enviarBtn.type = 'button';
  enviarBtn.disabled = true;
  enviarBtn.onclick = enviar;
  form.appendChild(enviarBtn);
  form.appendChild(el('div', 'estado r-apunte')).id = 'estado';
  app.appendChild(form);

  const gracias = el('section', 'gracias');
  gracias.id = 'gracias';
  gracias.hidden = true;
  const c = d.cierre || {};
  gracias.appendChild(el('h2', 'r-sesion', c.titulo || 'Listo. Ya lo tenemos.'));
  gracias.appendChild(el('p', 'r-lectura', c.texto ||
    'Vamos a escucharte con calma y te vamos a devolver lo que entendimos, para que nos digas si es eso. Recién después armamos tu entrenamiento.'));
  app.appendChild(gracias);

  refrescar();
}

async function arrancar() {
  try {
    const { datos, entrega } = await cargar();
    if (datos.formato !== 1 || datos.tipo !== 'bienvenida') throw new Error('formato');
    if (!datos.texto) throw new Error('formato');
    B.datos = datos; B.entrega = entrega;
  } catch (e) {
    const razones = {
      sin_token: ['Falta el enlace completo', 'Este enlace está incompleto. Pídele a Seba que te lo mande otra vez.'],
      no_existe: ['Este enlace ya no está vigente', 'Puede que Seba haya publicado uno nuevo. Escríbele y te lo manda al día.'],
      formato:   ['No puedo mostrar esta página', 'Está escrita en un formato que esta pantalla no entiende. Avísale a Seba.'],
      archivo:   ['No encontré esta página', 'Revisa el enlace o pídeselo a Seba de nuevo.']
    };
    const [t, x] = razones[e.message] || ['No pude cargar la página', 'Puede ser tu conexión. Inténtalo en un momento; si sigue igual, avísale a Seba.'];
    detener(t, x);
    return;
  }
  dibujar();
}

arrancar();
