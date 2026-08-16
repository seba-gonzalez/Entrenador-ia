/**
 * El hash declarado corresponde al archivo publicado (D-025, gemela en CI).
 *
 * Dos reglas que no son negociables:
 *
 *   1. Se hashean los BYTES del archivo, nunca el JSON reserializado. Si CI
 *      canonicalizara y el navegador no, los dos hashes divergirian sin que
 *      nada estuviera corrupto — y con el fallo cerrado de D-025 eso deja al
 *      alumno sin sesion.
 *
 *   2. La unica fuente de verdad es el archivo. El indice y sesion.json son
 *      declaraciones SOBRE el archivo, y se comprueban las dos contra el, nunca
 *      una contra la otra. Una declaracion que no exista no se inventa.
 */

import { createHash } from 'node:crypto';

const F = 'integridad del hash';

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

export function comprobarIntegridad(datos, informe) {
  for (const publicacion of datos.publicaciones) {
    if (!publicacion.bytes) continue; // la ausencia del archivo la reporta 'estructura'

    const real = sha256(publicacion.bytes);

    // Declaracion 1: el indice.
    informe.exigir(F, publicacion.entrada.hash === real, publicacion.ruta,
      'El hash declarado en el indice no corresponde al archivo.',
      `declarado en el indice: ${publicacion.entrada.hash}\n` +
      `hash real del archivo:  ${real}\n` +
      'Si el cambio del archivo es intencionado, este es el hash que hay que escribir.');

    // Declaracion 2: el documento del entrenador, si registra esa publicacion.
    const sesion = datos.porSesionId.get(publicacion.datos?.sesion_id);
    const registro = sesion?.datos?.publicaciones?.find((p) => p.p === publicacion.entrada.p);
    if (!registro) continue;

    informe.exigir(F, registro.hash === real, sesion.ruta,
      `El hash de la publicacion ${publicacion.entrada.p} en el documento no corresponde al archivo.`,
      `declarado en sesion.json: ${registro.hash}\n` +
      `hash real del archivo:    ${real}\n` +
      'El registro de lo publicado quedo desactualizado respecto a lo que se sirve.');
  }
}
