/**
 * Una publicacion no cambia (ARQUITECTURA.md 12, D-007).
 *
 * Corregir crea; no reemplaza. Si una publicacion ya servida se edita en su
 * sitio, toda la evidencia que la referencia pasa a apuntar a algo que ya no
 * existe — en silencio, porque el hash se actualiza junto con el archivo y todo
 * lo demas sigue cuadrando.
 *
 * Solo tiene sentido comparando contra una rama base, asi que corre en PR.
 */

import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';

const F = 'inmutabilidad';

export function comprobarInmutabilidad(datos, informe, base) {
  const carpetas = [...datos.carpetasDePublicacion.keys()];
  if (carpetas.length === 0) return;

  let salida;
  try {
    salida = execFileSync('git', ['diff', '--name-status', `${base}...HEAD`], {
      cwd: datos.raiz,
      encoding: 'utf8',
    });
  } catch (error) {
    informe.fallo(F, '(git)', `No se pudo comparar con la base "${base}".`, error.message);
    return;
  }

  for (const linea of salida.split('\n').filter(Boolean)) {
    const [estado, ruta] = linea.split('\t');
    if (!ruta) continue;

    const enCarpetaDePublicacion = carpetas.includes(dirname(ruta));
    const esIndice = ruta.endsWith('/indice.json');
    if (!enCarpetaDePublicacion || esIndice) continue;

    // Anadir una publicacion nueva es como se republica. Modificar o borrar una
    // existente es reescribir lo que alguien ya pudo haber entrenado.
    informe.exigir(F, estado === 'A', ruta,
      estado === 'D'
        ? 'Se borro una publicacion ya existente.'
        : 'Se modifico una publicacion ya existente en vez de crear una nueva.',
      'Las publicaciones son inmutables (D-007). Para cambiar lo publicado se anade ' +
      'una publicacion nueva y se marca vigente; la anterior se conserva.');
  }
}
