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
  // Las devoluciones se acreditan igual que las sesiones y por el mismo motivo:
  // una devolucion alterada pone en boca del alumno palabras que no dijo.
  for (const artefacto of [...datos.publicaciones, ...datos.devoluciones]) {
    if (!artefacto.bytes) continue; // la ausencia del archivo la reporta 'estructura'

    informe.exigir(F, artefacto.entrada.hash === sha256(artefacto.bytes), artefacto.ruta,
      'El hash declarado en el indice no corresponde al archivo.',
      `declarado en el indice: ${artefacto.entrada.hash}\n` +
      `hash real del archivo:  ${sha256(artefacto.bytes)}\n` +
      'Si el cambio del archivo es intencionado, este es el hash que hay que escribir.');
  }

  for (const publicacion of datos.publicaciones) {
    if (!publicacion.bytes) continue;
    const real = sha256(publicacion.bytes);

    // Segunda declaracion, solo para las sesiones: el documento del entrenador,
    // si registra esa publicacion. Las devoluciones no tienen documento interno
    // que las registre, asi que ahi no hay nada que contrastar.
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
