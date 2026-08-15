/**
 * repositorio.js — unico punto de acceso a datos (ARQUITECTURA.md 4).
 *
 * Ninguna vista lee archivos directamente. El dia que exista un backend se
 * reemplaza este modulo y nada mas.
 *
 * Este modulo NO conoce el documento interno de la sesion. Solo puede alcanzar
 * los artefactos publicados: la separacion entre lo que ve el entrenador y lo
 * que ve el alumno es de archivos, no de filtros (D-015).
 */

const RAIZ = new URL('../', import.meta.url);

/**
 * La publicacion cargada no es la que el indice acredita, o no se pudo
 * comprobar que lo sea. En ambos casos la sesion no se muestra: una sesion
 * cuya procedencia no se puede acreditar no debe ejecutarse, y mostrarla con
 * una advertencia dejaria la decision en manos de quien menos contexto tiene.
 */
export class IntegridadNoAcreditada extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'IntegridadNoAcreditada';
  }
}

async function leerJson(ruta) {
  const respuesta = await fetch(new URL(ruta, RAIZ));
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (HTTP ${respuesta.status})`);
  }
  return respuesta.json();
}

/** Lee los bytes tal cual llegaron, sin interpretarlos. */
async function leerBytes(ruta) {
  const respuesta = await fetch(new URL(ruta, RAIZ));
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (HTTP ${respuesta.status})`);
  }
  return new Uint8Array(await respuesta.arrayBuffer());
}

async function sha256(bytes) {
  // crypto.subtle solo existe en contextos seguros: HTTPS y localhost. Servir
  // la vista por http:// desde una IP de red la deja sin forma de comprobar
  // nada, y eso no habilita a seguir: habilita a decirlo y detenerse.
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new IntegridadNoAcreditada(
      'No se puede comprobar la integridad de la sesion desde este acceso, porque el ' +
      'navegador solo ofrece funciones de verificacion en conexiones seguras. ' +
      'Abre la sesion por HTTPS o desde localhost. No entrenes con lo que se sirva desde aqui: ' +
      'no hay forma de acreditar que sea la sesion que tu entrenador publico.'
    );
  }
  const resumen = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(resumen))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256:${hex}`;
}

/**
 * Devuelve la publicacion vigente de un caso, junto con su numero y su hash.
 *
 * El numero de publicacion y el hash vienen del indice, no del archivo
 * publicado: es lo que permite que una ejecucion afirme contra que publicacion
 * exacta se ejecuto (D-008) sin que ese dato pueda alterarse desde el contenido.
 */
export async function obtenerPublicacionVigente(casoId) {
  const base = `casos/${casoId}/publicado/`;
  const indice = await leerJson(`${base}indice.json`);

  const entrada = indice.publicaciones.find((p) => p.p === indice.vigente);
  if (!entrada) {
    throw new Error(`El indice de ${casoId} declara vigente la publicacion ${indice.vigente}, que no existe.`);
  }

  // Se leen los bytes y se hashean esos mismos bytes antes de interpretarlos.
  // Leer dos veces —una para el hash, otra para el contenido— dejaria una
  // rendija por la que lo verificado y lo usado podrian no ser lo mismo.
  const bytes = await leerBytes(`${base}${entrada.archivo}`);
  const hashReal = await sha256(bytes);

  if (hashReal !== entrada.hash) {
    throw new IntegridadNoAcreditada(
      'Esta sesion no coincide con lo que el registro dice que se publico. ' +
      'El archivo cambio sin que se registrara la publicacion correspondiente, ' +
      'asi que no se puede acreditar contra que estarias entrenando. ' +
      'No la ejecutes: avisa a tu entrenador. ' +
      `(declarado ${entrada.hash.slice(7, 15)}…, servido ${hashReal.slice(7, 15)}…)`
    );
  }

  const publicado = JSON.parse(new TextDecoder().decode(bytes));

  // Invariante de 6.2: la publicacion servida tiene que ser la que el indice
  // declara vigente. Si no coinciden, se detiene: no se elige una por defecto.
  if (publicado.publicacion.p !== entrada.p) {
    throw new Error(
      `El archivo ${entrada.archivo} contiene la publicacion ${publicado.publicacion.p} ` +
      `pero el indice la registra como ${entrada.p}.`
    );
  }

  return {
    sesion_id: publicado.sesion_id,
    demo: publicado.demo === true,
    aviso_demo: publicado.aviso_demo,
    publicacion: publicado.publicacion,
    hash: entrada.hash,
    contenido: publicado.contenido,
  };
}

/**
 * Devuelve el esquema de ejecucion.
 *
 * La vista lo carga en lugar de repetir sus valores: los resultados posibles de
 * una sesion son parte del contrato, y el contrato lo escribe el entrenador
 * (D-003). Copiarlos dentro del JavaScript los convertiria en dos fuentes que
 * pueden divergir en silencio.
 */
export async function obtenerEsquemaEjecucion() {
  return leerJson('esquemas/ejecucion.schema.json');
}
