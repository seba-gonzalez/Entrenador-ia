/**
 * Todo archivo de datos valida contra su esquema (ARQUITECTURA.md 12).
 *
 * Los esquemas viajan con el validador, no con los datos: el contrato es uno
 * solo, y el repositorio privado usara exactamente el mismo que el publico.
 */

import Ajv from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ESQUEMAS = join(AQUI, '..', '..', 'esquemas');

function resumirErrores(errores) {
  return (errores || [])
    .slice(0, 6)
    .map((e) => `  ${e.instancePath || '(raiz)'} ${e.message}`)
    .join('\n');
}

export function comprobarEsquemas(datos, informe, rutaEsquemas = ESQUEMAS) {
  const ajv = new Ajv({ allErrors: true, strict: false });

  const esqSesion = JSON.parse(readFileSync(join(rutaEsquemas, 'sesion.schema.json'), 'utf8'));
  const esqEjecucion = JSON.parse(readFileSync(join(rutaEsquemas, 'ejecucion.schema.json'), 'utf8'));

  const validarSesion = ajv.compile(esqSesion);
  const validarEjecucion = ajv.compile(esqEjecucion);
  const validarContenido = ajv.compile({
    $schema: esqSesion.$schema,
    ...esqSesion.$defs.contenido,
    $defs: esqSesion.$defs,
  });

  const F = 'esquema';

  for (const grupo of [datos.sesiones, datos.ejecuciones, datos.publicaciones]) {
    for (const archivo of grupo) {
      if (archivo.errorDeFormato) {
        informe.fallo(F, archivo.ruta, 'No es JSON valido.', archivo.errorDeFormato);
      }
    }
  }

  for (const sesion of datos.sesiones) {
    if (!sesion.datos) continue;
    informe.exigir(F, validarSesion(sesion.datos), sesion.ruta,
      'No valida contra sesion.schema.json.', resumirErrores(validarSesion.errors));
  }

  for (const ejecucion of datos.ejecuciones) {
    if (!ejecucion.datos) continue;
    informe.exigir(F, validarEjecucion(ejecucion.datos), ejecucion.ruta,
      'No valida contra ejecucion.schema.json.', resumirErrores(validarEjecucion.errors));
  }

  for (const publicacion of datos.publicaciones) {
    if (!publicacion.datos) continue;
    if (!publicacion.datos.contenido) {
      informe.fallo(F, publicacion.ruta, 'El artefacto publicado no trae contenido.');
      continue;
    }
    informe.exigir(F, validarContenido(publicacion.datos.contenido), publicacion.ruta,
      'El contenido publicado no valida contra $defs/contenido.',
      resumirErrores(validarContenido.errors));
  }
}
