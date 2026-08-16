/**
 * Coherencia entre el documento, el indice y los archivos publicados, mas lo
 * que JSON Schema no puede expresar.
 *
 * Aqui vive la comprobacion de secciones <-> paneles: las claves de un objeto
 * dependen de valores de otro array, y eso no se puede escribir en un esquema.
 */

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const F = 'estructura';
const D = 'demo';

export function comprobarEstructura(datos, informe) {
  comprobarFamilia(datos, informe, {
    indices: datos.indices,
    carpetas: datos.carpetasDePublicacion,
    artefactos: datos.publicaciones,
    // Solo las sesiones tienen un documento interno que tambien declara cual
    // publicacion rige. Las devoluciones no, y exigirselo seria inventarles una
    // entidad que no existe.
    contrastaConDocumento: true,
    revisarContenido: true,
  });

  comprobarFamilia(datos, informe, {
    indices: datos.indicesDevolucion,
    carpetas: datos.carpetasDeDevolucion,
    artefactos: datos.devoluciones,
    contrastaConDocumento: false,
    revisarContenido: false,
  });

  if (datos.config.publico === true) comprobarMarcaDemo(datos, informe);
}

function comprobarFamilia(datos, informe, familia) {
  for (const indice of familia.indices) {
    if (!indice.datos) continue;
    const entradas = indice.datos.publicaciones || [];

    // Exactamente una vigente (ARQUITECTURA.md 12).
    const vigentes = entradas.filter((e) => e.vigente === true);
    informe.exigir(F, vigentes.length === 1, indice.ruta,
      'El indice no declara exactamente una publicacion vigente.',
      `vigentes: ${vigentes.length} (${vigentes.map((v) => v.p).join(', ') || 'ninguna'})`);

    // El numero vigente apunta a una entrada que existe y esta marcada vigente.
    const apuntada = entradas.find((e) => e.p === indice.datos.vigente);
    informe.exigir(F, !!apuntada, indice.ruta,
      `El indice declara vigente la publicacion ${indice.datos.vigente}, que no esta listada.`);
    if (apuntada) {
      informe.exigir(F, apuntada.vigente === true, indice.ruta,
        `La publicacion ${apuntada.p} es la vigente segun el indice, pero su entrada no lo dice.`);
    }

    // Cada archivo nombrado existe.
    const carpeta = dirname(indice.ruta);
    for (const entrada of entradas) {
      informe.exigir(F, existsSync(join(datos.raiz, carpeta, entrada.archivo || '')), indice.ruta,
        `El indice nombra "${entrada.archivo}", que no existe.`);
    }

    // Y ningun archivo publicado se queda fuera del indice.
    const nombrados = new Set(entradas.map((e) => e.archivo));
    for (const archivo of familia.carpetas.get(carpeta) || []) {
      informe.exigir(F, nombrados.has(archivo), `${carpeta}/${archivo}`,
        'Hay un archivo publicado que el indice no registra.',
        'Un artefacto sin entrada en el indice no tiene hash declarado y nadie puede acreditarlo.');
    }

    // Todo indice pertenece a una sesion que existe, sea de la familia que sea.
    const sesion = datos.porSesionId.get(indice.datos.sesion_id);
    informe.exigir(F, !!sesion, indice.ruta,
      `El indice dice pertenecer a la sesion "${indice.datos.sesion_id}", que no existe.`);

    // El documento del entrenador y el indice no pueden discrepar sobre cual rige.
    if (familia.contrastaConDocumento && sesion?.datos?.publicaciones) {
      const vigenteEnDocumento = sesion.datos.publicaciones.find((p) => p.vigente === true);
      if (vigenteEnDocumento) {
        informe.exigir(F, vigenteEnDocumento.p === indice.datos.vigente, indice.ruta,
          'El indice y el documento no coinciden en cual publicacion rige.',
          `indice: ${indice.datos.vigente} · documento (${sesion.ruta}): ${vigenteEnDocumento.p}`);
      }
    }
  }

  for (const artefacto of familia.artefactos) {
    if (!artefacto.datos) continue;

    informe.exigir(F, artefacto.datos.publicacion?.p === artefacto.entrada.p, artefacto.ruta,
      'El archivo dice ser una publicacion distinta de la que el indice registra.',
      `archivo: ${artefacto.datos.publicacion?.p} · indice: ${artefacto.entrada.p}`);

    if (familia.revisarContenido) comprobarSeccionesYPaneles(artefacto, informe);
  }
}

/**
 * Cada seccion declarada tiene su panel, y cada panel su seccion.
 * Sin lo primero la vista se detiene; lo segundo es dato muerto que nadie ve.
 */
function comprobarSeccionesYPaneles(publicacion, informe) {
  const contenido = publicacion.datos.contenido;
  if (!contenido?.secciones || !contenido?.paneles) return;

  const declaradas = contenido.secciones.map((s) => s.id);
  const conPanel = Object.keys(contenido.paneles);

  for (const id of declaradas) {
    informe.exigir(F, conPanel.includes(id), publicacion.ruta,
      `La seccion "${id}" esta declarada pero no trae su panel.`,
      'La vista se detiene sin mostrar la sesion.');
  }
  for (const id of conPanel) {
    informe.exigir(F, declaradas.includes(id), publicacion.ruta,
      `El panel "${id}" no corresponde a ninguna seccion declarada.`,
      'Es contenido que nadie puede abrir.');
  }
}

/**
 * En un repositorio publico, toda entidad que pueda representar a una persona
 * lleva su marca. Se aplica a las entidades que la configuracion declara —lo que
 * incluye la ficha del alumno, su feedback y las devoluciones— y deja fuera los
 * esquemas, la configuracion y cualquier otro metadato.
 */
function comprobarMarcaDemo(datos, informe) {
  const revisar = [
    ...datos.sesiones.map((a) => [a, 'sesion']),
    ...datos.publicaciones.map((a) => [a, 'publicacion']),
    ...datos.ejecuciones.map((a) => [a, 'ejecucion']),
    ...datos.alumnos.map((a) => [a, 'ficha de alumno']),
    ...datos.feedback.map((a) => [a, 'respuesta de feedback']),
    ...datos.devoluciones.map((a) => [a, 'devolucion']),
  ];

  for (const [archivo, tipo] of revisar) {
    if (!archivo.datos) continue;
    informe.exigir(D, archivo.datos.demo === true, archivo.ruta,
      `Este repositorio es publico y esta ${tipo} no esta marcada como demo.`,
      'Un dato sin "demo": true en un repositorio publico o es real —y no puede estar aqui— ' +
      'o es sintetico y podria confundirse con evidencia de una persona.');
  }
}
