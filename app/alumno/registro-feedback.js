/**
 * registro-feedback.js — lo que el alumno cuenta despues (ARQUITECTURA.md 5.6).
 *
 * Se emite aparte de la ejecucion, y no por comodidad: son dos momentos y dos
 * cosas distintas. La ejecucion es lo que paso mientras entrenaba; el feedback
 * es lo que piensa de ello cuando ya termino. Juntarlos en un archivo obligaria
 * a decidir cual de las dos fechas vale, y ninguna respuesta seria cierta.
 *
 * Lo que este modulo NO hace: resumir, clasificar ni normalizar lo que el
 * alumno escribe. Sale tal cual lo tecleo. Interpretarlo es trabajo del
 * entrenador y vive en otra entidad, la devolucion, con otro autor y otra fecha.
 */

const ETIQUETAS = {
  titulo: 'Cuentame como fue',
  intro: 'Responde lo que quieras y deja en blanco lo que no. Al terminar copias el registro y me lo pasas: nada se envia desde esta pagina.',
  libre: 'Cualquier otra cosa que quieras contarme',
  librePlaceholder: 'Lo que sea — lo que te sobro, lo que te falto, lo que cambiaste…',
  boton: 'Copiar mi feedback',
  vacio: 'No has escrito nada todavia. Si no quieres responder ahora, no pasa nada: cierra la pagina y ya esta. Prefiero eso a un registro que diga que respondiste cuando no lo hiciste.',
  copiado: 'Copiado. Pasaselo a tu entrenador.',
  sinPortapapeles: 'El navegador no dejo copiar. El registro quedo impreso en la consola para copiarlo a mano.',
};

const MOTIVOS = {
  sinRespuesta: 'La dejo en blanco.',
  sinComentario: 'No escribio comentario libre.',
};

function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function texto(valor, motivo) {
  const limpio = (valor || '').trim();
  return limpio ? { registrado: true, texto: limpio } : { registrado: false, motivo };
}

export function construirFeedback({ publicacion, preguntas, comentario, ahora }) {
  const respuestas = preguntas.map((p) => ({
    pregunta_id: p.id,
    // La pregunta viaja con la respuesta. El dia que se reescriba la pregunta,
    // esta respuesta seguira siendo legible.
    pregunta: p.texto,
    respuesta: texto(p.entrada.value, MOTIVOS.sinRespuesta),
  }));

  const libre = texto(comentario, MOTIVOS.sinComentario);
  const algo = respuestas.some((r) => r.respuesta.registrado) || libre.registrado;
  const todas = respuestas.every((r) => r.respuesta.registrado) && libre.registrado;

  const feedback = {
    id: `fb-${publicacion.sesion_id}-${ahora.replace(/[-:.]/g, '').replace('T', '-').slice(0, 15)}`,
    schema_version: 1,
    sesion_id: publicacion.sesion_id,
    // 'parcial' no es un juicio sobre el alumno: es la diferencia entre "conteste
    // todo" y "conteste algo", que al leerlo despues significan cosas distintas.
    estado_respuesta: todas ? 'respondido' : 'parcial',
    contenido: { respuestas, comentario_libre: libre },
    fecha: ahora,
    generado_por: 'app/alumno',
    generado_en: ahora,
  };

  if (publicacion.demo) {
    feedback.demo = true;
    feedback.aviso_demo = publicacion.aviso_demo;
  }

  return algo ? feedback : null;
}

/**
 * Convierte una tarjeta de preguntas en una tarjeta que se puede contestar.
 * Solo cuando la publicacion lo pide: si no trae 'respondible', la tarjeta se
 * queda como estaba y esta funcion no se llama.
 */
export function montarFeedback({ publicacion, tarjeta, card }) {
  card.appendChild(el('div', 'note-inline', ETIQUETAS.intro));

  const preguntas = tarjeta.items.map((item) => {
    const campo = el('div', 'cierre-campo');
    campo.appendChild(el('span', 'sf-l', item.texto));
    const entrada = el('textarea', 'sf-t');
    campo.appendChild(entrada);
    card.appendChild(campo);
    return { id: item.id, texto: item.texto, entrada };
  });

  const campoLibre = el('div', 'cierre-campo');
  campoLibre.appendChild(el('span', 'sf-l', ETIQUETAS.libre));
  const comentario = el('textarea', 'sf-t');
  comentario.placeholder = ETIQUETAS.librePlaceholder;
  campoLibre.appendChild(comentario);
  card.appendChild(campoLibre);

  const boton = el('button', 'btn-emitir', ETIQUETAS.boton);
  boton.type = 'button';
  card.appendChild(boton);

  const estado = el('p', 'emitir-estado');
  card.appendChild(estado);

  boton.addEventListener('click', async () => {
    estado.classList.remove('error');

    const feedback = construirFeedback({
      publicacion,
      preguntas,
      comentario: comentario.value,
      ahora: new Date().toISOString(),
    });

    // Sin nada escrito no se emite un archivo que afirme que respondio. El
    // silencio es un dato, y su forma correcta es que no exista este archivo
    // (principio 1.5).
    if (!feedback) {
      estado.textContent = ETIQUETAS.vacio;
      estado.classList.add('error');
      return;
    }

    const json = JSON.stringify(feedback, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      estado.textContent = ETIQUETAS.copiado;
    } catch {
      console.log(json);
      estado.textContent = ETIQUETAS.sinPortapapeles;
      estado.classList.add('error');
    }
  });
}
