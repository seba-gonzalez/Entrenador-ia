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

  const leer = (nombre) => JSON.parse(readFileSync(join(rutaEsquemas, nombre), 'utf8'));
  const esqSesion = leer('sesion.schema.json');

  const validarSesion = ajv.compile(esqSesion);
  const validarEjecucion = ajv.compile(leer('ejecucion.schema.json'));
  const validarAlumno = ajv.compile(leer('alumno.schema.json'));
  const validarFeedback = ajv.compile(leer('feedback.schema.json'));
  const validarDevolucion = ajv.compile(leer('devolucion.schema.json'));
  const validarContenido = ajv.compile({
    $schema: esqSesion.$schema,
    ...esqSesion.$defs.contenido,
    $defs: esqSesion.$defs,
  });

  const F = 'esquema';

  const grupos = [
    [datos.sesiones, validarSesion, 'sesion.schema.json'],
    [datos.ejecuciones, validarEjecucion, 'ejecucion.schema.json'],
    [datos.alumnos, validarAlumno, 'alumno.schema.json'],
    [datos.feedback, validarFeedback, 'feedback.schema.json'],
    [datos.devoluciones, validarDevolucion, 'devolucion.schema.json'],
  ];

  for (const grupo of [...grupos.map(([g]) => g), datos.publicaciones]) {
    for (const archivo of grupo) {
      if (archivo.errorDeFormato) {
        informe.fallo(F, archivo.ruta, 'No es JSON valido.', archivo.errorDeFormato);
      }
    }
  }

  for (const [grupo, validar, nombre] of grupos) {
    for (const archivo of grupo) {
      if (!archivo.datos) continue;
      informe.exigir(F, validar(archivo.datos), archivo.ruta,
        `No valida contra ${nombre}.`, resumirErrores(validar.errors));
    }
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
