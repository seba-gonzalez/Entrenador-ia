/**
 * registro-ejecucion.js — lo que ocurrio, separado de lo que estaba programado
 * (ARQUITECTURA.md 5.5, D-008).
 *
 * Cuatro reglas gobiernan este modulo, y las cuatro son la misma regla:
 *
 *   1. Nada se rellena. Una serie sin registrar no vale cero ni vale lo
 *      programado: vale "no registrada", con su motivo escrito.
 *   2. Nada se deduce. El resultado de la sesion lo elige una persona; el
 *      codigo no lo infiere de cuantos campos quedaron llenos.
 *   3. Nada se resuelve por cuenta propia. Cuando un dato admite dos lecturas
 *      distintas, el registro se detiene y la persona decide.
 *   4. Nada se toca. Emitir una ejecucion no modifica la publicacion: la
 *      publicacion es un archivo, y este modulo solo lee.
 *
 * Lo que cambio respecto a H1: ya no hay casilla de "serie realizada". Si hay
 * datos escritos, la serie ocurrio — los datos SON la evidencia. La casilla
 * solo llevaba informacion en un caso, el de la fila en blanco, y cobraba una
 * confirmacion por serie para resolverlo. Ahora se pregunta al cerrar, y solo
 * por las filas que de verdad quedaron en blanco.
 */

const ETIQUETAS = {
  titulo: 'Cierre de la sesion',
  intro: 'Cuando termines, elige como resulto la sesion y copia el registro. Lo pegas en el repositorio: nada se envia desde esta pagina.',
  resultado: 'Resultado de la sesion',
  resultadoVacio: '— elegir —',
  notas: 'Diferencias respecto a lo programado (opcional)',
  notasPlaceholder: 'Que cambio y por que…',
  revisar: 'Revisar y copiar',
  confirmar: 'Confirmar y copiar',
  resumen: 'Vas a registrar',
  faltaResultado: 'Elige primero como resulto la sesion. No se elige solo.',
  faltaResponder: 'Falta decir que paso con lo que quedo en blanco. Cualquiera de las dos respuestas registra algo distinto, asi que no lo elijo por ti.',
  copiado: 'Copiado. Pegalo en el repositorio como un archivo nuevo.',
  sinPortapapeles: 'El navegador no dejo copiar. El registro quedo impreso en la consola para copiarlo a mano.',
  tituloPendientes: 'Quedo algo en blanco',
  separarPregunta: 'A cada serie le paso algo distinto',
  hechaSinDatos: 'La hice, no anote los valores',
  noHecha: 'No la hice',
  sinRegistrar: 'sin registrar',
  anadidaCorta: 'añadida',
};

const MOTIVOS = {
  sinCheckIn:
    'H1 no implementa check-in. No se solicito ninguno para esta sesion, de modo que no hay respuesta que registrar (D-020).',
  sinInicio:
    'Esta vista no observa el inicio real de la sesion. Registrar la hora en que se abrio la pagina seria presentar una inferencia como un hecho.',
  sinFin:
    'Esta vista no observa el fin real de la sesion. La hora en que se copio el registro se guarda aparte, en generado_en.',
  hechaSinDatos: 'La hizo pero no anoto ningun valor. Lo declaro al cerrar la sesion.',
  noHecha: 'No la hizo. Lo declaro al cerrar la sesion.',
  sinMotivoPorSerie: 'Esta vista no captura un motivo por serie.',
  sinNotas: 'No se escribio ninguna nota.',
  sinSensacion: 'No se marco ninguna percepcion para este bloque.',
};

const RESPUESTAS = {
  hecha: 'hecha_sin_datos',
  noHecha: 'no_hecha',
};

function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

/** Se intento emitir sin decir que paso con alguna fila en blanco. */
export class RegistroIncompleto extends Error {
  constructor(pendientes) {
    super('Hay registros en blanco sin resolver.');
    this.name = 'RegistroIncompleto';
    this.pendientes = pendientes;
  }
}

const contratoDe = (estado, fila) => (fila.anadida ? estado.por_serie_anadida : estado.por_serie);

const vacia = (estado, fila) =>
  contratoDe(estado, fila).every((campo) => fila.entradas[campo.campo].value.trim() === '');

/**
 * Las filas que quedaron en blanco, una por una.
 *
 * Es el unico caso que los datos no resuelven: una fila vacia puede significar
 * "no la hice" o "la hice y no anote nada", y las dos registran cosas distintas.
 * Cada fila necesita su respuesta en el archivo emitido, aunque la pregunta que
 * se haga en pantalla cubra varias a la vez.
 */
export function clavesEnBlanco(ejercicios) {
  const claves = [];
  ejercicios.forEach((estado) => {
    if (estado.modo === 'compacto') {
      if (vacia(estado, estado.compacta)) {
        claves.push({
          clave: `${estado.ejercicio_id}#conjunto`,
          estado,
          series: estado.series,
          anadida: false,
        });
      }
      return;
    }
    estado.filas.forEach((fila) => {
      if (!vacia(estado, fila)) return;
      claves.push({
        clave: `${estado.ejercicio_id}#${fila.serie}`,
        estado,
        serie: fila.serie,
        anadida: fila.anadida,
      });
    });
  });
  return claves;
}

/** "la serie 3", "las series 2 y 3", "las series 1, 2 y 4". */
function listaDeSeries(numeros) {
  if (numeros.length === 1) return `la serie ${numeros[0]}`;
  const ultimo = numeros[numeros.length - 1];
  return `las series ${numeros.slice(0, -1).join(', ')} y ${ultimo}`;
}

/**
 * Las preguntas que se muestran en pantalla.
 *
 * Se agrupa cuando una sola respuesta representa fielmente lo ocurrido: si un
 * ejercicio entero quedo en blanco, preguntarlo tres veces no aporta nada y solo
 * cansa. Se detalla cuando puede haber diferencias — y como el codigo no puede
 * saber si las hay, la separacion la pide la persona: cada grupo de mas de una
 * serie ofrece responderlas por separado.
 *
 * Agrupar es una decision de pantalla. El archivo emitido sigue guardando una
 * respuesta por serie: 'claves' es la lista a la que se escribe la respuesta.
 */
export function pendientesDe(ejercicios, separados = new Set()) {
  const porEjercicio = new Map();
  clavesEnBlanco(ejercicios).forEach((c) => {
    const lista = porEjercicio.get(c.estado.ejercicio_id) || [];
    lista.push(c);
    porEjercicio.set(c.estado.ejercicio_id, lista);
  });

  const preguntas = [];
  porEjercicio.forEach((enBlanco, ejercicioId) => {
    const { estado } = enBlanco[0];

    // Una serie anadida no pertenece al grupo de las programadas: no estaba
    // prevista, y meterla en la misma respuesta seria decidir por el alumno que
    // le paso lo mismo que a las demas.
    const anadidas = enBlanco.filter((c) => c.anadida);
    const programadas = enBlanco.filter((c) => !c.anadida);

    if (programadas.length) {
      const primera = programadas[0];
      const todoElEjercicio = primera.series !== undefined || programadas.length === estado.series;
      const describe = () => {
        if (primera.series !== undefined) {
          return primera.series === 1 ? 'la serie quedo en blanco' : `las ${primera.series} series quedaron en blanco`;
        }
        const numeros = programadas.map((c) => c.serie);
        return todoElEjercicio && numeros.length > 1
          ? `las ${numeros.length} series quedaron en blanco`
          : `${listaDeSeries(numeros)} quedo${numeros.length > 1 ? 'aron' : ''} en blanco`;
      };

      if (programadas.length > 1 && separados.has(ejercicioId)) {
        programadas.forEach((c) => preguntas.push({
          clave: c.clave,
          claves: [c.clave],
          ejercicio_id: ejercicioId,
          ejercicio_nombre: estado.ejercicio_nombre,
          descripcion: `la serie ${c.serie} quedo en blanco`,
        }));
      } else {
        preguntas.push({
          clave: programadas.map((c) => c.clave).join('+'),
          claves: programadas.map((c) => c.clave),
          ejercicio_id: ejercicioId,
          ejercicio_nombre: estado.ejercicio_nombre,
          descripcion: describe(),
          // Solo tiene sentido separar lo que esta agrupado y viene de filas
          // distintas. La fila compacta es una sola: no hay nada que separar
          // sin abrir antes el detalle del ejercicio.
          separable: programadas.length > 1 && primera.series === undefined,
        });
      }
    }

    anadidas.forEach((c) => preguntas.push({
      clave: c.clave,
      claves: [c.clave],
      ejercicio_id: ejercicioId,
      ejercicio_nombre: estado.ejercicio_nombre,
      descripcion: `la serie ${c.serie} (anadida) quedo en blanco`,
    }));
  });

  return preguntas;
}

/**
 * Lee una fila y devuelve el registro de UNA serie.
 * Es la funcion donde se juega la regla 1: si no hay valor, no se inventa uno.
 */
function leerSerie(estado, fila, numero, capturado, respuestas, clave) {
  const contrato = contratoDe(estado, fila);
  const campos = {};
  const sinRegistrar = [];

  contrato.forEach((campo) => {
    const valor = fila.entradas[campo.campo].value.trim();
    if (valor === '') sinRegistrar.push(campo.campo);
    else campos[campo.campo] = valor;
  });

  const hayAlgo = Object.keys(campos).length > 0;
  let realizada;
  let ejecutado;

  if (hayAlgo) {
    // Los datos son la evidencia. Nadie tiene que confirmar ademas que ocurrio
    // algo que acaba de anotar.
    realizada = true;
    ejecutado = { registrado: true, campos, campos_sin_registrar: sinRegistrar };
  } else {
    realizada = respuestas[clave] === RESPUESTAS.hecha;
    ejecutado = {
      registrado: false,
      motivo: realizada ? MOTIVOS.hechaSinDatos : MOTIVOS.noHecha,
    };
  }

  const serie = {
    ejercicio_id: estado.ejercicio_id,
    ejercicio_nombre: estado.ejercicio_nombre,
    serie: numero,
    realizada,
    // Copia literal de lo prescrito. No se recalcula, no se completa, no se
    // compara: la comparacion la hace quien lea el registro despues.
    programado: contrato.map((campo) => ({ ...campo })),
    ejecutado,
    // "Las tres iguales" y "anote cada serie y coincidieron" no son lo mismo:
    // en el primer caso se observo el conjunto. Se registran las tres series,
    // pero diciendo como se capturaron (principio 1.4).
    capturado,
    motivo_diferencia: { registrado: false, motivo: MOTIVOS.sinMotivoPorSerie },
  };

  if (fila.anadida) {
    serie.anadida_en_ejecucion = true;
    // El margen lo escribio el entrenador en la sesion. Se copia literal para
    // que despues se pueda comparar lo autorizado con lo que paso; el codigo no
    // lo evalua ni lo aplica.
    if (estado.margen) serie.margen_declarado = estado.margen;
  }

  return serie;
}

/** Todas las series de un ejercicio, sea cual sea el modo en que se registro. */
function leerEjercicio(estado, respuestas) {
  if (estado.modo === 'compacto') {
    const clave = `${estado.ejercicio_id}#conjunto`;
    const series = [];
    for (let n = 1; n <= estado.series; n += 1) {
      series.push(leerSerie(estado, estado.compacta, n, 'en_conjunto', respuestas, clave));
    }
    return series;
  }
  return estado.filas.map((fila) =>
    leerSerie(estado, fila, fila.serie, 'por_serie', respuestas, `${estado.ejercicio_id}#${fila.serie}`)
  );
}

export function construirEjecucion({ publicacion, registro, resultado, notas, ahora, respuestas = {} }) {
  // Se comprueba aqui y no solo en la interfaz: ningun camino —incluido el de
  // otro programa que importe esta funcion— puede producir un registro con una
  // fila en blanco sin resolver.
  const pendientes = clavesEnBlanco(registro.ejercicios).filter((c) => !respuestas[c.clave]);
  if (pendientes.length) throw new RegistroIncompleto(pendientes);

  const series = [];
  registro.ejercicios.forEach((estado) => series.push(...leerEjercicio(estado, respuestas)));

  const ejecucion = {
    id: `ejec-${publicacion.sesion_id}-${ahora.replace(/[-:.]/g, '').replace('T', '-').slice(0, 15)}`,
    schema_version: 1,
    sesion_id: publicacion.sesion_id,

    // Congela contra que se ejecuto. Ambos valores vienen del indice de
    // publicaciones, no del contenido que se esta mostrando.
    publicacion_ejecutada: publicacion.publicacion.p,
    publicacion_hash: publicacion.hash,

    check_in: { solicitado: false, motivo: MOTIVOS.sinCheckIn },
    inicio: { registrado: false, motivo: MOTIVOS.sinInicio },
    fin: { registrado: false, motivo: MOTIVOS.sinFin },

    series,

    // No marcar un bloque no significa "adecuado": significa que no lo marco.
    sensaciones: registro.sensaciones.map((s) =>
      s.elegida
        ? { bloque_id: s.bloque_id, etiqueta: s.etiqueta, registrado: true, percepcion: s.elegida }
        : { bloque_id: s.bloque_id, etiqueta: s.etiqueta, registrado: false, motivo: MOTIVOS.sinSensacion }
    ),

    resultado,
    notas_de_ejecucion: notas
      ? { registrado: true, texto: notas }
      : { registrado: false, motivo: MOTIVOS.sinNotas },

    generado_por: 'app/alumno',
    generado_en: ahora,
  };

  // Una ejecucion registrada sobre un caso demo queda marcada como demo en el
  // propio archivo. Asi un dato sintetico no puede circular despues como
  // evidencia de una persona.
  if (publicacion.demo) {
    ejecucion.demo = true;
    ejecucion.aviso_demo = publicacion.aviso_demo;
  }

  return ejecucion;
}

/**
 * Lo que se va a guardar, en una lectura de tres segundos.
 *
 * Sustituye a la casilla por serie como red de seguridad: en vez de confirmar
 * quince veces algo ya demostrado, se confirma una vez lo que de verdad va a
 * quedar escrito. Un 700 donde iban 70 salta a la vista aqui.
 */
export function resumenDe(registro, respuestas = {}) {
  return registro.ejercicios.map((estado) => {
    const series = leerEjercicio(estado, respuestas);
    const legible = (s) => {
      if (!s.ejecutado.registrado) {
        const que = s.realizada ? ETIQUETAS.hechaSinDatos : ETIQUETAS.noHecha;
        return `${ETIQUETAS.sinRegistrar} — ${que.toLowerCase()}`;
      }
      return s.programado.map((c) => s.ejecutado.campos[c.campo] || '—').join(' · ');
    };

    if (estado.modo === 'compacto') {
      const s = series[0];
      const cuantas = estado.series === 1 ? '1 serie' : `${estado.series} series`;
      return { ejercicio: estado.ejercicio_nombre, lineas: [`${cuantas} · ${legible(s)}`] };
    }

    return {
      ejercicio: estado.ejercicio_nombre,
      lineas: series.map((s) => {
        const marca = s.anadida_en_ejecucion ? ` (${ETIQUETAS.anadidaCorta})` : '';
        return `serie ${s.serie}${marca} · ${legible(s)}`;
      }),
    };
  });
}

/* ---------- interfaz ---------- */

function pintarPendientes(zona, pendientes, respuestas, alResponder, alSeparar) {
  zona.replaceChildren();
  if (!pendientes.length) return;

  zona.appendChild(el('h3', 'block-title', ETIQUETAS.tituloPendientes));

  pendientes.forEach((p) => {
    const caja = el('div', 'sensacion');
    caja.appendChild(el('span', 'sf-l', `${p.ejercicio_nombre} — ${p.descripcion}`));
    const fila = el('div', 'sensacion-opciones');

    [[RESPUESTAS.hecha, ETIQUETAS.hechaSinDatos], [RESPUESTAS.noHecha, ETIQUETAS.noHecha]]
      .forEach(([valor, texto]) => {
        const boton = el('button', 'sens-btn', texto);
        boton.type = 'button';
        boton.dataset.respuesta = valor;
        if (p.claves.every((clave) => respuestas[clave] === valor)) boton.classList.add('elegida');
        boton.addEventListener('click', () => {
          fila.querySelectorAll('.sens-btn').forEach((b) => b.classList.remove('elegida'));
          boton.classList.add('elegida');
          // Una pregunta agrupada responde por todas las series que cubre. El
          // archivo sigue guardando una respuesta por serie.
          p.claves.forEach((clave) => { respuestas[clave] = valor; });
          alResponder();
        });
        fila.appendChild(boton);
      });

    caja.appendChild(fila);

    // Agrupar es fiel mientras a todas las series les haya pasado lo mismo.
    // El codigo no puede saberlo, asi que lo ofrece y decide la persona.
    if (p.separable) {
      const separar = el('button', 'btn-quitar', ETIQUETAS.separarPregunta);
      separar.type = 'button';
      separar.addEventListener('click', () => alSeparar(p.ejercicio_id));
      caja.appendChild(separar);
    }

    zona.appendChild(caja);
  });
}

function pintarResumen(zona, resumen) {
  zona.replaceChildren();
  zona.appendChild(el('h3', 'block-title', ETIQUETAS.resumen));

  const lista = el('ul', 'puntos');
  resumen.forEach((bloque) => {
    const item = el('li');
    item.appendChild(el('strong', null, bloque.ejercicio));
    bloque.lineas.forEach((linea) => item.appendChild(el('div', 'resumen-linea', linea)));
    lista.appendChild(item);
  });
  zona.appendChild(lista);
}

export function montarCierre({ publicacion, registro, esquema }) {
  const card = el('div', 'card');
  card.id = 'cierre';
  card.appendChild(el('h2', null, ETIQUETAS.titulo));
  card.appendChild(el('div', 'note-inline', ETIQUETAS.intro));

  const campoResultado = el('div', 'cierre-campo');
  campoResultado.appendChild(el('span', 'sf-l', ETIQUETAS.resultado));
  const select = el('select', 'sf-s');
  const vacio = el('option', null, ETIQUETAS.resultadoVacio);
  vacio.value = '';
  select.appendChild(vacio);
  // Los resultados posibles vienen del contrato, no de una lista repetida aqui.
  esquema.properties.resultado.enum.forEach((valor) => {
    const opcion = el('option', null, valor);
    opcion.value = valor;
    select.appendChild(opcion);
  });
  campoResultado.appendChild(select);
  card.appendChild(campoResultado);

  const campoNotas = el('div', 'cierre-campo');
  campoNotas.appendChild(el('span', 'sf-l', ETIQUETAS.notas));
  const textarea = el('textarea', 'sf-t');
  textarea.placeholder = ETIQUETAS.notasPlaceholder;
  campoNotas.appendChild(textarea);
  card.appendChild(campoNotas);

  const zonaPendientes = el('div', 'zona-pendientes');
  card.appendChild(zonaPendientes);

  const revisar = el('button', 'btn-emitir', ETIQUETAS.revisar);
  revisar.type = 'button';
  card.appendChild(revisar);

  const zonaResumen = el('div', 'zona-resumen');
  zonaResumen.hidden = true;
  card.appendChild(zonaResumen);

  const confirmar = el('button', 'btn-emitir', ETIQUETAS.confirmar);
  confirmar.type = 'button';
  confirmar.hidden = true;
  card.appendChild(confirmar);

  const estado = el('p', 'emitir-estado');
  card.appendChild(estado);

  const respuestas = {};
  const separados = new Set();

  function ocultarResumen() {
    zonaResumen.hidden = true;
    zonaResumen.replaceChildren();
    confirmar.hidden = true;
  }

  // Cualquier cambio en el registro invalida el resumen: confirmar tiene que
  // significar "confirmo esto", no "confirmo algo parecido a esto".
  document.addEventListener('input', (evento) => {
    if (evento.target.classList && evento.target.classList.contains('sf-i')) ocultarResumen();
  });
  document.addEventListener('click', (evento) => {
    const boton = evento.target.closest && evento.target.closest('.btn-anadir, .btn-quitar');
    if (boton) ocultarResumen();
  });

  function revisarAhora() {
    estado.classList.remove('error');
    estado.textContent = '';
    ocultarResumen();

    // El resultado no tiene valor por defecto: sin eleccion no se emite nada.
    if (!select.value) {
      estado.textContent = ETIQUETAS.faltaResultado;
      estado.classList.add('error');
      return;
    }

    const pendientes = pendientesDe(registro.ejercicios, separados);
    pintarPendientes(zonaPendientes, pendientes, respuestas, revisarAhora, (id) => {
      separados.add(id);
      revisarAhora();
    });

    const sinResponder = clavesEnBlanco(registro.ejercicios).filter((c) => !respuestas[c.clave]);
    if (sinResponder.length) {
      estado.textContent = ETIQUETAS.faltaResponder;
      estado.classList.add('error');
      return;
    }

    pintarResumen(zonaResumen, resumenDe(registro, respuestas));
    zonaResumen.hidden = false;
    confirmar.hidden = false;
  }

  revisar.addEventListener('click', revisarAhora);

  confirmar.addEventListener('click', async () => {
    estado.classList.remove('error');

    let ejecucion;
    try {
      ejecucion = construirEjecucion({
        publicacion,
        registro,
        resultado: select.value,
        notas: textarea.value.trim(),
        ahora: new Date().toISOString(),
        respuestas,
      });
    } catch (error) {
      if (!(error instanceof RegistroIncompleto)) throw error;
      estado.textContent = ETIQUETAS.faltaResponder;
      estado.classList.add('error');
      ocultarResumen();
      return;
    }

    const texto = JSON.stringify(ejecucion, null, 2);

    try {
      await navigator.clipboard.writeText(texto);
      estado.textContent = ETIQUETAS.copiado;
    } catch {
      console.log(texto);
      estado.textContent = ETIQUETAS.sinPortapapeles;
      estado.classList.add('error');
    }
  });

  return card;
}
