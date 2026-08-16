/**
 * Ninguna referencia apunta al vacio.
 *
 * Es la comprobacion que da sentido a D-008: si una ejecucion puede nombrar una
 * publicacion que no existe, o un ejercicio que nunca se publico, la evidencia
 * apunta a un blanco movil y toda la trazabilidad posterior es decorativa.
 */

const F = 'referencias';

export function comprobarReferencias(datos, informe) {
  for (const sesion of datos.sesiones) {
    if (!sesion.datos) continue;
    const versiones = new Set((sesion.datos.versiones || []).map((v) => v.v));

    if (sesion.datos.version_aprobada !== undefined) {
      informe.exigir(F, versiones.has(sesion.datos.version_aprobada), sesion.ruta,
        `version_aprobada apunta a la version ${sesion.datos.version_aprobada}, que no existe.`,
        `versiones presentes: ${[...versiones].join(', ') || 'ninguna'}`);
    }

    for (const p of sesion.datos.publicaciones || []) {
      informe.exigir(F, versiones.has(p.de_version), sesion.ruta,
        `La publicacion ${p.p} deriva de la version ${p.de_version}, que no existe.`);
    }

    for (const [i, o] of (sesion.datos.observaciones || []).entries()) {
      informe.exigir(F, versiones.has(o.sobre_version), sesion.ruta,
        `La observacion ${i + 1} es sobre la version ${o.sobre_version}, que no existe.`);
      if (o.resuelta_en !== undefined) {
        informe.exigir(F, versiones.has(o.resuelta_en), sesion.ruta,
          `La observacion ${i + 1} dice resolverse en la version ${o.resuelta_en}, que no existe.`);
      }
    }

    for (const v of sesion.datos.versiones || []) {
      if (v.deriva_de === undefined) continue;
      informe.exigir(F, versiones.has(v.deriva_de), sesion.ruta,
        `La version ${v.v} deriva de la ${v.deriva_de}, que no existe.`);
    }
  }

  for (const ejecucion of datos.ejecuciones) {
    if (!ejecucion.datos) continue;
    const e = ejecucion.datos;

    const sesion = datos.porSesionId.get(e.sesion_id);
    if (!informe.exigir(F, !!sesion, ejecucion.ruta,
      `Referencia la sesion "${e.sesion_id}", que no existe.`)) continue;

    const registro = (sesion.datos.publicaciones || []).find((p) => p.p === e.publicacion_ejecutada);
    if (!informe.exigir(F, !!registro, ejecucion.ruta,
      `Dice ejecutar la publicacion ${e.publicacion_ejecutada}, que la sesion no registra.`,
      `publicaciones de la sesion: ${(sesion.datos.publicaciones || []).map((p) => p.p).join(', ') || 'ninguna'}`
    )) continue;

    // El hash de la ejecucion tiene que ser el de esa publicacion, no el de otra.
    const publicacion = datos.publicaciones.find(
      (p) => p.datos?.sesion_id === e.sesion_id && p.entrada.p === e.publicacion_ejecutada
    );
    if (publicacion) {
      informe.exigir(F, e.publicacion_hash === publicacion.entrada.hash, ejecucion.ruta,
        'El hash registrado no es el de la publicacion que dice haber ejecutado.',
        `en la ejecucion: ${e.publicacion_hash}\nen el indice:    ${publicacion.entrada.hash}`);

      comprobarEjercicios(e, publicacion, ejecucion.ruta, informe);
    }
  }

  for (const archivo of datos.feedback) {
    if (!archivo.datos) continue;
    informe.exigir(F, datos.porSesionId.has(archivo.datos.sesion_id), archivo.ruta,
      `Referencia la sesion "${archivo.datos.sesion_id}", que no existe.`);
  }

  comprobarDevoluciones(datos, informe);
}

/**
 * Una devolucion cita al alumno y se apoya en su ejecucion. Las dos cosas tienen
 * que poder comprobarse, porque son justamente las que no se pueden reconstruir
 * si se pierden: si la cita apunta a un archivo que no existe, o una referencia
 * dice salir de un ejercicio que nunca se ejecuto, lo que queda es la opinion
 * del entrenador con aspecto de evidencia.
 */
function comprobarDevoluciones(datos, informe) {
  const porRuta = new Map(datos.ejecuciones.filter((e) => e.datos).map((e) => [e.ruta, e]));

  for (const archivo of datos.devoluciones) {
    if (!archivo.datos) continue;
    const d = archivo.datos;

    if (!informe.exigir(F, datos.porSesionId.has(d.sesion_id), archivo.ruta,
      `Referencia la sesion "${d.sesion_id}", que no existe.`)) continue;

    // El indice y el archivo no pueden discrepar sobre de quien es esta devolucion.
    informe.exigir(F, d.sesion_id === archivo.indice.datos?.sesion_id, archivo.ruta,
      'La devolucion y su indice no coinciden en a que sesion pertenecen.',
      `archivo: ${d.sesion_id} · indice (${archivo.indice.ruta}): ${archivo.indice.datos?.sesion_id}`);

    const fuente = d.contenido?.dijo?.fuente;
    if (fuente !== undefined) {
      informe.exigir(F, datos.feedback.some((f) => f.ruta === fuente), archivo.ruta,
        `La cita del alumno dice salir de "${fuente}", que no esta entre el feedback de este repositorio.`,
        'Sin el archivo original no hay forma de comprobar que la cita sea literal.');
    }

    for (const [i, referencia] of (d.contenido?.referencias || []).entries()) {
      const { ejecucion: ruta, ejercicio_id: ejercicioId, series } = referencia.derivado_de;

      const ejecucion = porRuta.get(ruta);
      if (!informe.exigir(F, !!ejecucion, archivo.ruta,
        `La referencia ${i + 1} deriva de "${ruta}", que no existe o no es una ejecucion valida.`
      )) continue;

      informe.exigir(F, ejecucion.datos.sesion_id === d.sesion_id, archivo.ruta,
        `La referencia ${i + 1} deriva de una ejecucion de otra sesion.`,
        `devolucion: ${d.sesion_id} · ejecucion: ${ejecucion.datos.sesion_id}`);

      const registradas = (ejecucion.datos.series || []).filter((s) => s.ejercicio_id === ejercicioId);
      if (!informe.exigir(F, registradas.length > 0, archivo.ruta,
        `La referencia ${i + 1} deriva del ejercicio "${ejercicioId}", que esa ejecucion no registra.`,
        `ejercicios registrados: ${[...new Set((ejecucion.datos.series || []).map((s) => s.ejercicio_id))].join(', ') || 'ninguno'}`
      )) continue;

      const numeros = new Set(registradas.map((s) => s.serie));
      for (const serie of series || []) {
        informe.exigir(F, numeros.has(serie), archivo.ruta,
          `La referencia ${i + 1} cita la serie ${serie} de "${ejercicioId}", que no esta registrada.`,
          `series registradas: ${[...numeros].sort((a, b) => a - b).join(', ')}`);
      }
    }
  }
}

/** Una ejecucion no puede registrar un ejercicio que no se publico. */
function comprobarEjercicios(ejecucion, publicacion, ruta, informe) {
  const publicados = new Set();
  for (const panel of Object.values(publicacion.datos?.contenido?.paneles || {})) {
    for (const tarjeta of panel.tarjetas || []) {
      for (const ejercicio of tarjeta.ejercicios || []) publicados.add(ejercicio.id);
    }
  }
  if (publicados.size === 0) return;

  const registrados = [...new Set((ejecucion.series || []).map((s) => s.ejercicio_id))];
  for (const id of registrados) {
    informe.exigir(F, publicados.has(id), ruta,
      `Registra series del ejercicio "${id}", que no esta en la publicacion ejecutada.`,
      `ejercicios publicados: ${[...publicados].join(', ')}`);
  }
}
