/**
 * Carga los datos que la configuracion declara y los deja listos para
 * comprobar, sin interpretarlos.
 *
 * Una decision de diseno gobierna este archivo: las entidades se relacionan
 * por 'sesion_id', nunca por su ubicacion en el disco. Es lo que permite que el
 * repositorio publico use 'casos/…' y el privado 'alumnos/…' sin que el
 * validador sepa cual es cual.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buscarVarios, archivosDe } from './rutas.mjs';

function leerJson(raiz, relativa) {
  const bytes = readFileSync(join(raiz, relativa));
  try {
    return { ruta: relativa, bytes, datos: JSON.parse(bytes.toString('utf8')) };
  } catch (error) {
    return { ruta: relativa, bytes, datos: null, errorDeFormato: error.message };
  }
}

/**
 * Una familia publicada: indices que nombran artefactos con su hash.
 *
 * Hay dos —las sesiones publicadas y las devoluciones publicadas— y comparten
 * forma exacta: indice con 'vigente', archivos numerados, un hash por archivo.
 * Se cargan con el mismo codigo a proposito: el dia que una de las dos deje de
 * comprobarse igual que la otra, sera porque alguien lo decidio, no porque se
 * duplico la implementacion y solo se actualizo una copia.
 */
function cargarFamiliaPublicada(raiz, patrones) {
  const indices = buscarVarios(raiz, patrones).map((r) => leerJson(raiz, r));

  // Los artefactos no se declaran: viven junto a su indice, que los nombra.
  const artefactos = [];
  for (const indice of indices) {
    if (!indice.datos) continue;
    const carpeta = dirname(indice.ruta);
    for (const entrada of indice.datos.publicaciones || []) {
      if (!entrada.archivo) continue;
      const relativa = `${carpeta}/${entrada.archivo}`;
      try {
        artefactos.push({ ...leerJson(raiz, relativa), entrada, indice });
      } catch {
        // El archivo que el indice nombra no existe. Lo registra 'estructura'.
        artefactos.push({ ruta: relativa, bytes: null, datos: null, entrada, indice });
      }
    }
  }

  // Archivos que viven en una carpeta de publicaciones, para detectar huerfanos.
  const carpetas = new Map();
  for (const indice of indices) {
    const carpeta = dirname(indice.ruta);
    carpetas.set(carpeta, archivosDe(raiz, carpeta).filter((n) => n !== 'indice.json'));
  }

  return { indices, artefactos, carpetas };
}

export function cargar(raiz, config) {
  const sesiones = buscarVarios(raiz, config.sesiones).map((r) => leerJson(raiz, r));
  const ejecuciones = buscarVarios(raiz, config.ejecuciones).map((r) => leerJson(raiz, r));
  const alumnos = buscarVarios(raiz, config.alumnos).map((r) => leerJson(raiz, r));
  const feedback = buscarVarios(raiz, config.feedback).map((r) => leerJson(raiz, r));

  const sesionesPublicadas = cargarFamiliaPublicada(raiz, config.indices);
  const devolucionesPublicadas = cargarFamiliaPublicada(raiz, config.indices_devolucion);

  return {
    raiz,
    config,
    sesiones,
    ejecuciones,
    alumnos,
    feedback,

    indices: sesionesPublicadas.indices,
    publicaciones: sesionesPublicadas.artefactos,
    carpetasDePublicacion: sesionesPublicadas.carpetas,

    indicesDevolucion: devolucionesPublicadas.indices,
    devoluciones: devolucionesPublicadas.artefactos,
    carpetasDeDevolucion: devolucionesPublicadas.carpetas,

    porSesionId: new Map(sesiones.filter((s) => s.datos).map((s) => [s.datos.id, s])),
  };
}
