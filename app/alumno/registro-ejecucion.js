/**
 * registro-ejecucion.js — lo que ocurrio, separado de lo que estaba programado
 * (ARQUITECTURA.md 5.5, D-008).
 *
 * Cuatro reglas gobiernan este modulo, y las cuatro son la misma regla:
 *
 *   1. Nada se rellena. Una serie sin registrar no vale cero ni vale lo
 *      programado: vale "no registrada", con su motivo escrito.
 *   2. Nada se deduce. El resultado de la sesion lo elige una persona; el
 *      codigo no lo infiere de cuantas casillas quedaron marcadas.
 *   3. Nada se resuelve por cuenta propia. Si los datos de una serie se
 *      contradicen entre si, el registro se detiene y la persona decide.
 *   4. Nada se toca. Emitir una ejecucion no modifica la publicacion: la
 *      publicacion es un archivo, y este modulo solo lee.
 */

const ETIQUETAS = {
  titulo: 'Cierre de la sesion',
  intro: 'Cuando termines, elige como resulto la sesion y copia el registro. Lo pegas en el repositorio: nada se envia desde esta pagina.',
  resultado: 'Resultado de la sesion',
  resultadoVacio: '— elegir —',
  notas: 'Diferencias respecto a lo programado (opcional)',
  notasPlaceholder: 'Que cambio y por que…',
  boton: 'Copiar registro de ejecucion',
  faltaResultado: 'Elige primero como resulto la sesion. No se elige solo.',
  copiado: 'Copiado. Pegalo en el repositorio como un archivo nuevo.',
  sinPortapapeles: 'El navegador no dejo copiar. El registro quedo impreso en la consola para copiarlo a mano.',
  contradiccion: (lista) =>
    `Hay datos escritos en series que no marcaste como realizadas: ${lista}. ` +
    'Marca la casilla si la hiciste, o borra los valores si no la hiciste. ' +
    'No lo resuelvo por ti: cualquiera de las dos opciones cambia lo que queda registrado.',
};

const MOTIVOS = {
  sinCheckIn:
    'H1 no implementa check-in. No se solicito ninguno para esta sesion, de modo que no hay respuesta que registrar (D-020).',
  sinInicio:
    'Esta vista no observa el inicio real de la sesion. Registrar la hora en que se abrio la pagina seria presentar una inferencia como un hecho.',
  sinFin:
    'Esta vista no observa el fin real de la sesion. La hora en que se copio el registro se guarda aparte, en generado_en.',
  serieVacia: 'La serie no se marco como realizada y no se registro ningun valor.',
  serieMarcadaSinValores: 'La serie se marco como realizada pero no se registro ningun valor.',
  sinMotivoPorSerie: 'Esta vista no captura un motivo por serie.',
  sinNotas: 'No se escribio ninguna nota.',
  sinSensacion: 'No se marco ninguna percepcion para este bloque.',
};

function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

/** Serie con valores escritos que nadie declaro realizada. */
export class ContradiccionDeRegistro extends Error {
  constructor(conflictos) {
    super('Hay series con datos escritos que no estan marcadas como realizadas.');
    this.name = 'ContradiccionDeRegistro';
    this.conflictos = conflictos;
  }
}

/**
 * Busca series cuyos datos se contradicen: hay valores escritos, pero la casilla
 * de "realizada" esta sin marcar.
 *
 * Las dos lecturas posibles —se hizo y falto marcar, o se anoto y no se hizo—
 * producen registros distintos, y ninguna se deduce de la otra. Marcar la
 * casilla porque hay numeros, o descartar los numeros porque no esta marcada,
 * serian las dos formas de que el sistema decida algo que no le toca (1.4).
 */
/**
 * Los campos que se registran en una fila. Una serie anadida durante la sesion
 * tiene los mismos campos que las programadas, pero ninguno prescrito.
 */
function contratoDe(registro, fila) {
  return fila.anadida ? registro.por_serie_anadida : registro.por_serie;
}

export function detectarContradicciones(ejercicios) {
  const conflictos = [];
  ejercicios.forEach((registro) => {
    registro.filas.forEach((fila) => {
      const hayValores = contratoDe(registro, fila).some(
        (campo) => fila.entradas[campo.campo].value.trim() !== ''
      );
      if (hayValores && !fila.marca.checked) {
        conflictos.push({
          ejercicio_id: registro.ejercicio_id,
          ejercicio_nombre: registro.ejercicio_nombre,
          serie: fila.serie,
          fila,
        });
      }
    });
  });
  return conflictos;
}

/**
 * Lee una fila de serie y devuelve su registro.
 * Es la funcion donde se juega la regla 1: si no hay valor, no se inventa uno.
 */
function leerFila(registro, fila) {
  const campos = {};
  const sinRegistrar = [];
  const contrato = contratoDe(registro, fila);

  contrato.forEach((campo) => {
    const valor = fila.entradas[campo.campo].value.trim();
    if (valor === '') sinRegistrar.push(campo.campo);
    else campos[campo.campo] = valor;
  });

  const realizada = fila.marca.checked;
  const hayAlgo = Object.keys(campos).length > 0;

  let ejecutado;
  if (hayAlgo) {
    ejecutado = { registrado: true, campos, campos_sin_registrar: sinRegistrar };
  } else {
    ejecutado = {
      registrado: false,
      motivo: realizada ? MOTIVOS.serieMarcadaSinValores : MOTIVOS.serieVacia,
    };
  }

  const serie = {
    ejercicio_id: registro.ejercicio_id,
    ejercicio_nombre: registro.ejercicio_nombre,
    serie: fila.serie,
    realizada,
    // Copia literal de lo prescrito. No se recalcula, no se completa, no se
    // compara: la comparacion la hace quien lea el registro despues.
    programado: contrato.map((campo) => ({ ...campo })),
    ejecutado,
    motivo_diferencia: { registrado: false, motivo: MOTIVOS.sinMotivoPorSerie },
  };

  // Solo se declara cuando es cierto. Una serie programada no necesita afirmar
  // que no fue anadida: eso se comprueba mirando la publicacion.
  if (fila.anadida) serie.anadida_en_ejecucion = true;

  return serie;
}

export function construirEjecucion({ publicacion, registro, resultado, notas, ahora }) {
  // Se comprueba aqui y no solo en la interfaz: ningun camino —incluido el de
  // otro programa que importe esta funcion— puede producir un registro a partir
  // de un estado contradictorio.
  const conflictos = detectarContradicciones(registro.ejercicios);
  if (conflictos.length) throw new ContradiccionDeRegistro(conflictos);

  const series = [];
  registro.ejercicios.forEach((ejercicio) => {
    ejercicio.filas.forEach((fila) => series.push(leerFila(ejercicio, fila)));
  });

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

export function montarCierre({ publicacion, registro, esquema }) {
  const card = el('div', 'card');
  card.id = 'cierre';
  card.appendChild(el('h2', null, ETIQUETAS.titulo));
  card.appendChild(el('div', 'note-inline', ETIQUETAS.intro));

  const campoResultado = el('div', 'cierre-campo');
  campoResultado.appendChild(el('span', 'sf-l', ETIQUETAS.resultado));
  const select = el('select', 'sf-s');
  const vacia = el('option', null, ETIQUETAS.resultadoVacio);
  vacia.value = '';
  select.appendChild(vacia);
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

  const boton = el('button', 'btn-emitir', ETIQUETAS.boton);
  boton.type = 'button';
  card.appendChild(boton);

  const estado = el('p', 'emitir-estado');
  card.appendChild(estado);

  boton.addEventListener('click', async () => {
    estado.classList.remove('error');

    // El resultado no tiene valor por defecto: sin eleccion no se emite nada.
    if (!select.value) {
      estado.textContent = ETIQUETAS.faltaResultado;
      estado.classList.add('error');
      return;
    }

    let ejecucion;
    try {
      ejecucion = construirEjecucion({
        publicacion,
        registro,
        resultado: select.value,
        notas: textarea.value.trim(),
        ahora: new Date().toISOString(),
      });
    } catch (error) {
      if (!(error instanceof ContradiccionDeRegistro)) throw error;
      const lista = error.conflictos
        .map((c) => `${c.ejercicio_nombre} · serie ${c.serie}`)
        .join('; ');
      estado.textContent = ETIQUETAS.contradiccion(lista);
      estado.classList.add('error');
      error.conflictos[0].fila.marca.scrollIntoView({ block: 'center' });
      return;
    }

    const texto = JSON.stringify(ejecucion, null, 2);

    try {
      await navigator.clipboard.writeText(texto);
      estado.textContent = ETIQUETAS.copiado;
    } catch (error) {
      console.log(texto);
      estado.textContent = ETIQUETAS.sinPortapapeles;
      estado.classList.add('error');
    }
  });

  return card;
}
