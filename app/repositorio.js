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

async function leerJson(ruta) {
  const respuesta = await fetch(new URL(ruta, RAIZ));
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (HTTP ${respuesta.status})`);
  }
  return respuesta.json();
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

  const publicado = await leerJson(`${base}${entrada.archivo}`);

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
