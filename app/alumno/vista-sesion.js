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

import { obtenerPublicacionVigente, obtenerEsquemaEjecucion } from '../repositorio.js';
import { montarCierre } from './registro-ejecucion.js';

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

function pintarEjercicio(ejercicio, registros) {
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
    const fila = el('div', 'serie-row');

    const cabecera = el('label', 'serie-head');
    const marca = document.createElement('input');
    marca.type = 'checkbox';
    cabecera.appendChild(marca);
    cabecera.appendChild(el('span', null, `Serie ${n}`));
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
      celda.appendChild(entrada);
      campos.appendChild(celda);
      entradas[campo.campo] = entrada;
    });
    fila.appendChild(campos);

    conjunto.appendChild(fila);
    filas.push({ serie: n, marca, entradas });
  }
  art.appendChild(conjunto);

  registros.push({
    ejercicio_id: ejercicio.id,
    ejercicio_nombre: ejercicio.nombre,
    por_serie: porSerie,
    filas,
  });

  if (ejercicio.detalles && ejercicio.detalles.length) {
    const toggles = el('div', 'ex-toggles');
    ejercicio.detalles.forEach((detalle) => {
      const det = el('details', 'micro');
      det.appendChild(el('summary', null, detalle.resumen));
      det.appendChild(el('div', 'micro-body', detalle.cuerpo));
      toggles.appendChild(det);
    });
    art.appendChild(toggles);
  }

  return art;
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

  preguntas(tarjeta) {
    const card = tarjetaBase(tarjeta, 'feedback');
    const lista = el('ul');
    tarjeta.items.forEach((item) => lista.appendChild(el('li', null, item)));
    card.appendChild(lista);
    return card;
  },

  sesion(tarjeta, registros) {
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

    if (tarjeta.titulo_bloques) {
      cuerpo.appendChild(el('h3', 'block-title', tarjeta.titulo_bloques));
    }

    tarjeta.ejercicios.forEach((ejercicio) => {
      cuerpo.appendChild(pintarEjercicio(ejercicio, registros));
      if (ejercicio.transicion) {
        cuerpo.appendChild(el('p', 'transition', ejercicio.transicion));
      }
    });

    if (tarjeta.nota_cierre) {
      cuerpo.appendChild(el('div', 'note-inline', tarjeta.nota_cierre));
    }

    det.appendChild(cuerpo);
    card.appendChild(det);
    return card;
  },
};

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

function pintarPaneles(contenido, registros) {
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
      cuerpo.appendChild(pintar(tarjeta, registros));
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

    const registros = [];
    pintarCabecera(contenido.cabecera);
    const panelConSesiones = pintarPaneles(contenido, registros);

    const pie = document.getElementById('pie');
    pie.appendChild(el('p', null, contenido.pie));
    pie.hidden = false;

    if (registros.length && panelConSesiones) {
      const esquema = await obtenerEsquemaEjecucion();
      panelConSesiones.appendChild(montarCierre({ publicacion, registros, esquema }));
    }

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
