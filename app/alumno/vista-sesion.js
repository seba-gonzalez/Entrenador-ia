/**
 * vista-sesion.js — Vista Alumno (ARQUITECTURA.md 10).
 *
 * Funcion de datos a HTML. Este archivo no sabe que existe el padel, ni el
 * tobillo, ni el RIR: no hay un solo titulo, umbral, progresion ni criterio de
 * dosificacion escrito aqui. Todo lo que se ve sale del artefacto publicado
 * (principio 1.2).
 *
 * Lo unico que este modulo decide es como se dibuja cada tipo de tarjeta. Eso
 * es presentacion, y es exactamente lo que H1 quiere separar del dato.
 */

import {
  obtenerPublicacionVigente,
  obtenerDevolucionVigente,
  obtenerEsquemaEjecucion,
} from '../repositorio.js';
import { montarCierre } from './registro-ejecucion.js';
import { montarFeedback } from './registro-feedback.js';

const CASO_POR_DEFECTO = 'demo-001';

/* ---------- utilidades de DOM ---------- */

function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

/**
 * Un parrafo con una parte destacada opcional.
 * El texto entra siempre por textContent: el contenido publicado es dato, y un
 * dato nunca se interpreta como marcado.
 */
function parrafo(etiqueta, clase, contenido) {
  const nodo = el(etiqueta, clase);
  if (contenido.destacado) nodo.appendChild(el('strong', null, contenido.destacado));
  if (contenido.texto) nodo.appendChild(document.createTextNode(contenido.texto));
  return nodo;
}

/* ---------- mapas de presentacion ---------- */

const CLASE_ETIQUETA = {
  tolerancia: 'tag-knee',
  precaucion: 'tag-elbow',
  opcional: 'tag-optional',
};

const CLASE_DIA = {
  base: '',
  fuerza: 'chip-strength',
  competencia: 'chip-comp',
};

/* ---------- ejercicio ---------- */

const ETIQUETAS_SERIE = {
  anadir: '+ Agregar serie',
  quitar: 'Quitar',
  marca: 'añadida',
  motivoNoPrescrito: 'Esta serie no estaba programada: la anadio el alumno durante la sesion, asi que no hay nada prescrito contra que compararla.',
};

/**
 * Dibuja una fila de registro por serie.
 *
 * Las series programadas y las anadidas usan esta misma funcion, y no por
 * ahorrar codigo: se registran con los mismos campos porque son el mismo tipo
 * de dato. Lo unico que cambia es que la anadida no tiene nada prescrito
 * detras, y eso se dice en el propio registro en vez de deducirse despues.
 */
function pintarFila(porSerie, numero, anadida) {
  const fila = el('div', anadida ? 'serie-row anadida' : 'serie-row');

  const cabecera = el('label', 'serie-head');
  const marca = document.createElement('input');
  marca.type = 'checkbox';
  cabecera.appendChild(marca);
  cabecera.appendChild(el('span', null, `Serie ${numero}`));
  if (anadida) cabecera.appendChild(el('span', 'serie-marca', ETIQUETAS_SERIE.marca));
  fila.appendChild(cabecera);

  const campos = el('div', porSerie.length === 2 ? 'serie-fields f2' : 'serie-fields');
  const entradas = {};
  porSerie.forEach((campo) => {
    const celda = el('div');
    celda.appendChild(el('span', 'sf-l', campo.etiqueta));
    const entrada = document.createElement('input');
    entrada.className = 'sf-i';
    entrada.type = 'text';
    entrada.placeholder = '—';
    // Nada de correccion automatica: aqui se escriben cosas como "2×16 kg" o
    // "peso corporal", y el teclado del movil las "arregla" hasta dejarlas
    // irreconocibles.
    entrada.autocapitalize = 'off';
    entrada.autocomplete = 'off';
    entrada.spellcheck = false;
    celda.appendChild(entrada);
    campos.appendChild(celda);
    entradas[campo.campo] = entrada;
  });
  fila.appendChild(campos);

  return { nodo: fila, registro: { serie: numero, marca, entradas, anadida } };
}

function pintarEjercicio(ejercicio, registro) {
  const art = el('article', 'ex');

  const top = el('div', 'ex-top');
  top.appendChild(el('span', 'ex-code', ejercicio.codigo));
  top.appendChild(el('h4', 'ex-name', ejercicio.nombre));
  (ejercicio.etiquetas || []).forEach((etiqueta) => {
    const clase = CLASE_ETIQUETA[etiqueta.estilo];
    top.appendChild(el('span', `tag ${clase}`, etiqueta.texto));
  });
  art.appendChild(top);

  const datos = el('div', 'ex-data');
  ejercicio.programado.presentacion.forEach((campo) => {
    const celda = el('div');
    celda.appendChild(el('span', 'dl', campo.etiqueta));
    celda.appendChild(el('span', 'dv', campo.valor));
    datos.appendChild(celda);
  });
  art.appendChild(datos);

  if (ejercicio.precaucion) {
    art.appendChild(parrafo('p', 'caution-text', ejercicio.precaucion));
  }

  // Registro por serie. Las filas se generan desde programado.por_serie: los
  // campos que se registran son los que el entrenador declaro, no una lista
  // fija del codigo.
  const porSerie = ejercicio.programado.por_serie;
  const conjunto = el('div', 'serieset');
  const filas = [];

  for (let n = 1; n <= ejercicio.programado.series; n += 1) {
    const { nodo, registro: fila } = pintarFila(porSerie, n, false);
    conjunto.appendChild(nodo);
    filas.push(fila);
  }
  art.appendChild(conjunto);

  // Lo que estaba prescrito para una serie anadida: nada, y con su motivo. No
  // se copian los valores de las series programadas, porque nadie los prescribio
  // para esta.
  const sinPrescribir = porSerie.map((campo) => ({
    campo: campo.campo,
    etiqueta: campo.etiqueta,
    prescrito: false,
    motivo_no_prescrito: ETIQUETAS_SERIE.motivoNoPrescrito,
  }));

  /**
   * "+ Agregar serie" no recomienda hacer mas series ni sugiere que falten.
   * Existe porque el alumno a veces se desvia, y sin este boton lo que hizo de
   * mas solo podia llegar contado en texto libre — que es exactamente como se
   * perdio la cuarta sentadilla del piloto.
   *
   * Tampoco hay tope de series anadidas. Un limite seria una regla de
   * entrenamiento escrita en el codigo (principio 1.2), y el codigo no sabe
   * cuanto es demasiado para esta persona en este dia.
   */
  const zonaAnadir = el('div', 'fila-anadir');
  const anadir = el('button', 'btn-anadir', ETIQUETAS_SERIE.anadir);
  anadir.type = 'button';
  anadir.addEventListener('click', () => {
    const numero = filas.length + 1;
    const { nodo, registro: fila } = pintarFila(sinPrescribir, numero, true);

    // Quitar solo esta disponible mientras la fila siga vacia. Con datos
    // escritos, borrarla seria destruir un registro sin dejar constancia (1.3).
    const quitar = el('button', 'btn-quitar', ETIQUETAS_SERIE.quitar);
    quitar.type = 'button';
    quitar.addEventListener('click', () => {
      const hayAlgo = Object.values(fila.entradas).some((e) => e.value.trim() !== '');
      if (hayAlgo || fila.marca.checked) return;
      nodo.remove();
      filas.splice(filas.indexOf(fila), 1);
    });
    nodo.querySelector('.serie-head').appendChild(quitar);

    conjunto.appendChild(nodo);
    filas.push(fila);
    nodo.querySelector('.sf-i').focus();
  });
  zonaAnadir.appendChild(anadir);
  art.appendChild(zonaAnadir);

  registro.ejercicios.push({
    ejercicio_id: ejercicio.id,
    ejercicio_nombre: ejercicio.nombre,
    por_serie: porSerie,
    por_serie_anadida: sinPrescribir,
    filas,
  });

  const plegables = pintarDetalles(ejercicio.detalles);
  if (plegables) art.appendChild(plegables);

  return art;
}

/**
 * Bloques plegados: lo accionable queda a la vista y el porque a un toque.
 * Lo usan los ejercicios y las tarjetas de programa, con el mismo aspecto,
 * porque para el alumno es el mismo gesto.
 */
function pintarDetalles(detalles) {
  if (!detalles || !detalles.length) return null;
  const toggles = el('div', 'ex-toggles');
  detalles.forEach((detalle) => {
    const det = el('details', 'micro');
    det.appendChild(el('summary', null, detalle.resumen));
    det.appendChild(el('div', 'micro-body', detalle.cuerpo));
    toggles.appendChild(det);
  });
  return toggles;
}

function pintarEnCuerpo(ejercicio, cuerpo, registro) {
  cuerpo.appendChild(pintarEjercicio(ejercicio, registro));
  if (ejercicio.transicion) {
    cuerpo.appendChild(el('p', 'transition', ejercicio.transicion));
  }
}

/**
 * Cuatro opciones, ninguna preseleccionada, y una vez marcada se puede cambiar.
 *
 * Lo que NO hace: nada. Marcar "muy exigente" no baja la carga de mañana. La
 * sensacion se registra y alguien la lee. Convertirla en una adaptacion
 * automatica seria meter una regla de entrenamiento en el codigo (principio 1.2)
 * y ademas decidir por el entrenador con menos contexto del que el tiene.
 */
const PERCEPCIONES = [
  { valor: 'muy_facil', etiqueta: 'Muy fácil' },
  { valor: 'adecuado', etiqueta: 'Adecuado' },
  { valor: 'muy_exigente', etiqueta: 'Muy exigente' },
  { valor: 'molestia_dolor', etiqueta: 'Molestia o dolor' },
];

function pintarSensacion(bloque, sensaciones) {
  const caja = el('div', 'sensacion');
  caja.appendChild(el('span', 'sf-l', bloque.pregunta_sensacion));

  const fila = el('div', 'sensacion-opciones');
  const estado = { bloque_id: bloque.id, etiqueta: bloque.etiqueta, elegida: null };

  PERCEPCIONES.forEach((opcion) => {
    const boton = el('button', 'sens-btn', opcion.etiqueta);
    boton.type = 'button';
    boton.dataset.valor = opcion.valor;
    boton.addEventListener('click', () => {
      fila.querySelectorAll('.sens-btn').forEach((b) => b.classList.remove('elegida'));
      boton.classList.add('elegida');
      estado.elegida = opcion.valor;
    });
    fila.appendChild(boton);
  });

  caja.appendChild(fila);
  sensaciones.push(estado);
  return caja;
}

function pintarPorBloques(tarjeta, cuerpo, registro) {
  const sinBloque = tarjeta.ejercicios.filter((e) => !e.bloque);
  if (sinBloque.length) {
    if (tarjeta.titulo_bloques) cuerpo.appendChild(el('h3', 'block-title', tarjeta.titulo_bloques));
    sinBloque.forEach((ejercicio) => pintarEnCuerpo(ejercicio, cuerpo, registro));
  }

  tarjeta.bloques.forEach((bloque) => {
    const suyos = tarjeta.ejercicios.filter((e) => e.bloque === bloque.id);
    if (!suyos.length) {
      throw new Error(`La publicacion declara el bloque "${bloque.id}" pero ningun ejercicio le pertenece.`);
    }
    cuerpo.appendChild(el('h3', 'block-title', bloque.etiqueta));
    suyos.forEach((ejercicio) => pintarEnCuerpo(ejercicio, cuerpo, registro));
    if (bloque.pregunta_sensacion) {
      cuerpo.appendChild(pintarSensacion(bloque, registro.sensaciones));
    }
  });
}

/* ---------- tarjetas ---------- */

function tarjetaBase(tarjeta, clase) {
  const card = el('div', clase ? `card ${clase}` : 'card');
  if (tarjeta.id) card.id = tarjeta.id;
  if (tarjeta.titulo) card.appendChild(el('h2', null, tarjeta.titulo));
  return card;
}

const TARJETAS = {
  notas(tarjeta) {
    const card = tarjetaBase(tarjeta);
    tarjeta.parrafos.forEach((p) => card.appendChild(parrafo('p', 'objective', p)));
    return card;
  },

  objetivos(tarjeta) {
    const card = tarjetaBase(tarjeta);
    tarjeta.parrafos.forEach((p) => card.appendChild(parrafo('p', 'objective', p)));
    return card;
  },

  competencia(tarjeta) {
    const card = tarjetaBase(tarjeta, 'comp-card');
    tarjeta.parrafos.forEach((p) => card.appendChild(parrafo('p', null, p)));
    return card;
  },

  programa(tarjeta) {
    const card = tarjetaBase(tarjeta);
    if (tarjeta.intro) {
      const intro = el('p', null, tarjeta.intro);
      intro.setAttribute('style', 'color:var(--muted);font-size:14px;margin:0 0 10px;');
      card.appendChild(intro);
    }
    if (tarjeta.lista && tarjeta.lista.length) {
      const lista = el('ul', 'warmup');
      lista.setAttribute('style', 'margin-bottom:12px;');
      tarjeta.lista.forEach((item) => lista.appendChild(el('li', null, item)));
      card.appendChild(lista);
    }
    if (tarjeta.destacado) {
      card.appendChild(parrafo('div', 'highlight-rest', tarjeta.destacado));
    }
    const plegables = pintarDetalles(tarjeta.detalles);
    if (plegables) card.appendChild(plegables);
    return card;
  },

  contexto(tarjeta) {
    const card = tarjetaBase(tarjeta);
    const lista = el('ul', 'context-list');
    tarjeta.items.forEach((item) => lista.appendChild(parrafo('li', null, item)));
    card.appendChild(lista);
    return card;
  },

  argumentos(tarjeta) {
    const card = tarjetaBase(tarjeta, 'why');
    tarjeta.parrafos.forEach((p) => card.appendChild(parrafo('p', null, p)));
    return card;
  },

  mapa(tarjeta) {
    const card = tarjetaBase(tarjeta, 'roadmap');
    tarjeta.fases.forEach((fase) => {
      const bloque = el('div', 'phase');
      bloque.appendChild(el('span', 'phase-num', fase.numero));
      const cuerpo = el('div', 'phase-body');
      cuerpo.appendChild(el('h3', null, fase.titulo));
      cuerpo.appendChild(el('span', 'phase-dates', fase.fechas));
      cuerpo.appendChild(el('p', null, fase.texto));
      bloque.appendChild(cuerpo);
      card.appendChild(bloque);
    });
    return card;
  },

  preguntas(tarjeta, registro) {
    const card = tarjetaBase(tarjeta, 'feedback');

    if (tarjeta.respondible) {
      registro.preguntas.push({ tarjeta, card });
      return card;
    }

    const lista = el('ul');
    tarjeta.items.forEach((item) => lista.appendChild(el('li', null, item)));
    card.appendChild(lista);
    return card;
  },

  sesion(tarjeta, registro) {
    const card = el('div', 'card');
    card.id = tarjeta.id;

    const det = el('details', 'session');
    if (tarjeta.abierta) det.open = true;

    const resumen = el('summary');
    const envoltura = el('span');
    envoltura.appendChild(el('span', 'session-label', tarjeta.etiqueta));
    envoltura.appendChild(el('span', 'session-date', tarjeta.cuando));
    resumen.appendChild(envoltura);
    det.appendChild(resumen);

    const cuerpo = el('div', 'session-body');

    if (tarjeta.calentamiento) {
      cuerpo.appendChild(el('h3', 'block-title', tarjeta.calentamiento.titulo));
      const pasos = el('ol', 'warmup');
      tarjeta.calentamiento.pasos.forEach((paso) => pasos.appendChild(el('li', null, paso)));
      cuerpo.appendChild(pasos);
      if (tarjeta.calentamiento.nota) {
        cuerpo.appendChild(el('div', 'note-inline', tarjeta.calentamiento.nota));
      }
    }

    // Con bloques declarados, cada uno lleva su titulo y su pregunta de
    // sensacion al final. Sin bloques, la sesion se dibuja como una lista —
    // que es exactamente como se dibujaba antes de que los bloques existieran.
    if (tarjeta.bloques && tarjeta.bloques.length) {
      pintarPorBloques(tarjeta, cuerpo, registro);
    } else {
      if (tarjeta.titulo_bloques) {
        cuerpo.appendChild(el('h3', 'block-title', tarjeta.titulo_bloques));
      }
      tarjeta.ejercicios.forEach((ejercicio) => pintarEnCuerpo(ejercicio, cuerpo, registro));
    }

    if (tarjeta.nota_cierre) {
      cuerpo.appendChild(el('div', 'note-inline', tarjeta.nota_cierre));
    }

    det.appendChild(cuerpo);
    card.appendChild(det);
    return card;
  },
};

/* ---------- devolucion ---------- */

const PERCEPCION_LEGIBLE = {
  muy_facil: 'muy fácil',
  adecuado: 'adecuado',
  muy_exigente: 'muy exigente',
  molestia_dolor: 'molestia o dolor',
};

/**
 * Las tres capas, en tarjetas separadas y en este orden: primero lo que dijo el
 * alumno, despues lo que se entendio, despues lo que se hara.
 *
 * El orden no es estetico. Poner la interpretacion antes que la cita haria que
 * el alumno leyera sus propias palabras ya filtradas por las del entrenador, y
 * entonces no podria decir "no era eso" — que es justo lo mas valioso que puede
 * decir aqui.
 */
const HITOS = {
  historial: 'Tu historial · respuesta del entrenador',
  ahora: 'Cuentame como fue hoy',
};

/**
 * Un rotulo con una linea, para separar dos cosas que viven en la misma
 * pestana. Sin el, la respuesta que el alumno ya recibio y el formulario que
 * tiene que rellenar se leen como una sola pantalla larga y no queda claro que
 * es lo que hay que contestar.
 */
function pintarHito(texto, fecha) {
  const hito = el('div', 'hito');
  hito.appendChild(el('span', 'hito-texto', texto));
  hito.appendChild(el('span', 'hito-linea'));
  if (fecha) hito.appendChild(el('span', 'hito-fecha', fecha));
  return hito;
}

/** Solo la fecha, sin hora: al alumno le importa el dia, no el minuto. */
function soloFecha(iso) {
  return typeof iso === 'string' ? iso.slice(0, 10) : undefined;
}

function pintarDevolucion(contenido) {
  const panel = document.querySelector('.card.feedback')?.closest('main');
  if (!panel) {
    throw new Error('Hay una devolucion publicada pero la sesion no trae panel de feedback donde mostrarla.');
  }

  const bloque = document.createDocumentFragment();
  bloque.appendChild(pintarHito(HITOS.historial, soloFecha(contenido.entendido.fecha)));

  const dijo = el('div', 'card');
  dijo.appendChild(el('h2', null, 'Lo que contaste'));
  if (contenido.dijo.verbatim) {
    dijo.appendChild(el('p', 'cita', contenido.dijo.verbatim));
  }
  (contenido.dijo.sensaciones || []).forEach((s) => {
    dijo.appendChild(parrafo('p', 'objective', {
      destacado: `${s.etiqueta}:`,
      texto: ` ${PERCEPCION_LEGIBLE[s.percepcion] || s.percepcion}`,
    }));
  });
  bloque.appendChild(dijo);

  const entendido = el('div', 'card');
  entendido.appendChild(el('h2', null, 'Lo que entendí'));
  // Rotulado como lectura, no como hecho. Es una interpretacion y el alumno
  // tiene que poder discutirla (principio 1.4).
  entendido.appendChild(el('div', 'note-inline',
    'Esto es mi lectura de lo que me contaste, no un hecho. Si me equivoqué, dímelo.'));
  if (contenido.entendido.texto) {
    entendido.appendChild(el('p', null, contenido.entendido.texto));
  }
  // En puntos y no en un parrafo largo: para poder decir "eso no fue asi" hay
  // que poder encontrar primero la frase con la que no se esta de acuerdo.
  if (contenido.entendido.puntos && contenido.entendido.puntos.length) {
    const lista = el('ul', 'puntos');
    contenido.entendido.puntos.forEach((p) => lista.appendChild(parrafo('li', null, p)));
    entendido.appendChild(lista);
  }
  bloque.appendChild(entendido);

  const proxima = el('div', 'card');
  proxima.appendChild(el('h2', null, 'Para la próxima'));
  const lista = el('ul', 'context-list');
  contenido.para_la_proxima.forEach((p) => {
    lista.appendChild(parrafo('li', null, {
      destacado: p.tipo === 'decision' ? 'Decidido: ' : 'A mirar: ',
      texto: p.punto,
    }));
  });
  proxima.appendChild(lista);
  bloque.appendChild(proxima);

  if (contenido.referencias && contenido.referencias.length) {
    const memoria = el('div', 'card');
    memoria.appendChild(el('h2', null, 'Lo que vamos sabiendo de ti'));
    const refs = el('ul', 'context-list');
    contenido.referencias.forEach((r) => refs.appendChild(el('li', null, r.texto)));
    memoria.appendChild(refs);
    bloque.appendChild(memoria);
  }

  // Antes de las preguntas: lo primero que ve al abrir la pestaña es la
  // respuesta a lo que escribio, no un formulario en blanco otra vez.
  panel.prepend(bloque);

  // Y el corte entre lo que ya pasó y lo que toca ahora. Solo se dibuja cuando
  // hay devolución: sin ella no hay dos cosas que separar, y un rótulo sobre la
  // única tarjeta de la pantalla sería ruido.
  const formulario = panel.querySelector('.card.feedback');
  if (formulario) formulario.before(pintarHito(HITOS.ahora));
}

/* ---------- montaje ---------- */

function pintarCabecera(cabecera) {
  const contenedor = document.querySelector('#cabecera .coach-inner');
  contenedor.appendChild(el('p', 'coach-eyebrow', cabecera.eyebrow));
  contenedor.appendChild(el('h1', 'coach-title', cabecera.titulo));
  contenedor.appendChild(parrafo('p', 'coach-msg', cabecera.mensaje));
  if (cabecera.nota) contenedor.appendChild(parrafo('div', 'coach-note', cabecera.nota));
  document.getElementById('cabecera').hidden = false;
}

function pintarDias(dias) {
  const rail = el('nav', 'day-rail');
  rail.setAttribute('aria-label', 'Dias de la semana');
  dias.forEach((dia) => {
    const clase = CLASE_DIA[dia.estilo || 'base'];
    const chip = el('a', clase ? `chip ${clase}` : 'chip');
    chip.href = `#${dia.ancla}`;
    chip.appendChild(el('span', 'chip-day', dia.dia));
    chip.appendChild(el('span', 'chip-date', dia.fecha));
    chip.appendChild(el('span', 'chip-tag', dia.etiqueta));
    rail.appendChild(chip);
  });
  return rail;
}

function pintarPaneles(contenido, registro) {
  const barra = document.getElementById('tabbar');
  const zona = document.getElementById('paneles');
  let panelConSesiones = null;

  contenido.secciones.forEach((seccion, indice) => {
    const boton = el('button', indice === 0 ? 'tab-btn active' : 'tab-btn', seccion.etiqueta);
    boton.dataset.tab = seccion.id;
    barra.appendChild(boton);

    const panel = el('section', 'tab-panel');
    panel.id = `tab-${seccion.id}`;
    if (indice !== 0) panel.hidden = true;

    const cuerpo = el('main');
    const datos = contenido.paneles[seccion.id];

    // Que cada seccion declarada tenga su panel es un invariante entre dos
    // campos, y el esquema no puede expresarlo: las claves de 'paneles'
    // dependen de valores de 'secciones'. Se comprueba aqui para que el fallo
    // sea una frase que nombra el problema, y no un TypeError a media pantalla.
    if (!datos) {
      throw new Error(`La publicacion declara la seccion "${seccion.id}" pero no trae su panel.`);
    }

    if (datos.dias && datos.dias.length) cuerpo.appendChild(pintarDias(datos.dias));

    datos.tarjetas.forEach((tarjeta) => {
      const pintar = TARJETAS[tarjeta.tipo];
      if (!pintar) {
        throw new Error(`La publicacion usa un tipo de tarjeta que la vista no sabe dibujar: "${tarjeta.tipo}".`);
      }
      cuerpo.appendChild(pintar(tarjeta, registro));
      if (tarjeta.tipo === 'sesion' && !panelConSesiones) panelConSesiones = cuerpo;
    });

    panel.appendChild(cuerpo);
    zona.appendChild(panel);
  });

  barra.hidden = false;

  barra.querySelectorAll('.tab-btn').forEach((boton) => {
    boton.addEventListener('click', () => {
      barra.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      zona.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = true; });
      boton.classList.add('active');
      document.getElementById(`tab-${boton.dataset.tab}`).hidden = false;
      barra.scrollIntoView({ block: 'start' });
    });
  });

  return panelConSesiones;
}

async function montar() {
  const caso = new URLSearchParams(location.search).get('caso') || CASO_POR_DEFECTO;
  const aviso = document.getElementById('aviso');

  try {
    const publicacion = await obtenerPublicacionVigente(caso);
    const contenido = publicacion.contenido;

    document.title = contenido.titulo_documento;

    const registro = { ejercicios: [], sensaciones: [], preguntas: [] };
    pintarCabecera(contenido.cabecera);
    const panelConSesiones = pintarPaneles(contenido, registro);

    const pie = document.getElementById('pie');
    pie.appendChild(el('p', null, contenido.pie));
    pie.hidden = false;

    if (registro.ejercicios.length && panelConSesiones) {
      const esquema = await obtenerEsquemaEjecucion();
      panelConSesiones.appendChild(montarCierre({ publicacion, registro, esquema }));
    }

    registro.preguntas.forEach(({ tarjeta, card }) =>
      montarFeedback({ publicacion, tarjeta, card })
    );

    // La devolucion llega despues, y muchas veces no ha llegado todavia.
    const devolucion = await obtenerDevolucionVigente(caso, publicacion.sesion_id);
    if (devolucion) pintarDevolucion(devolucion.contenido);

    aviso.remove();
  } catch (error) {
    // Media sesion dibujada es peor que ninguna: alguien podria entrenar
    // siguiendo lo que alcanzo a pintarse antes del fallo. Se borra todo y
    // queda unicamente el motivo.
    document.querySelector('#cabecera .coach-inner').replaceChildren();
    document.getElementById('cabecera').hidden = true;
    document.getElementById('tabbar').replaceChildren();
    document.getElementById('tabbar').hidden = true;
    document.getElementById('paneles').replaceChildren();
    document.getElementById('pie').replaceChildren();
    document.getElementById('pie').hidden = true;

    aviso.textContent = `No se pudo mostrar la sesion: ${error.message}`;
    aviso.classList.add('emitir-estado', 'error');
  }
}

montar();
