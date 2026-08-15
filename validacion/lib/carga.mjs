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

export function cargar(raiz, config) {
  const sesiones = buscarVarios(raiz, config.sesiones).map((r) => leerJson(raiz, r));
  const indices = buscarVarios(raiz, config.indices).map((r) => leerJson(raiz, r));
  const ejecuciones = buscarVarios(raiz, config.ejecuciones).map((r) => leerJson(raiz, r));

  // Las publicaciones no se declaran: viven junto a su indice, que las nombra.
  const publicaciones = [];
  for (const indice of indices) {
    if (!indice.datos) continue;
    const carpeta = dirname(indice.ruta);
    for (const entrada of indice.datos.publicaciones || []) {
      if (!entrada.archivo) continue;
      const relativa = `${carpeta}/${entrada.archivo}`;
      try {
        publicaciones.push({ ...leerJson(raiz, relativa), entrada, indice });
      } catch {
        // El archivo que el indice nombra no existe. Lo registra 'estructura'.
        publicaciones.push({ ruta: relativa, bytes: null, datos: null, entrada, indice });
      }
    }
  }

  // Archivos que viven en una carpeta de publicaciones, para detectar huerfanos.
  const carpetasDePublicacion = new Map();
  for (const indice of indices) {
    const carpeta = dirname(indice.ruta);
    carpetasDePublicacion.set(
      carpeta,
      archivosDe(raiz, carpeta).filter((n) => n !== 'indice.json')
    );
  }

  return {
    raiz,
    config,
    sesiones,
    indices,
    ejecuciones,
    publicaciones,
    carpetasDePublicacion,
    porSesionId: new Map(sesiones.filter((s) => s.datos).map((s) => [s.datos.id, s])),
  };
}
