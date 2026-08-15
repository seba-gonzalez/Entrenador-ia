/**
 * Coherencia entre el documento, el indice y los archivos publicados, mas lo
 * que JSON Schema no puede expresar.
 *
 * Aqui vive la comprobacion de secciones <-> paneles: las claves de un objeto
 * dependen de valores de otro array, y eso no se puede escribir en un esquema.
 */

import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

const F = 'estructura';
const D = 'demo';

export function comprobarEstructura(datos, informe) {
  for (const indice of datos.indices) {
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
    for (const archivo of datos.carpetasDePublicacion.get(carpeta) || []) {
      informe.exigir(F, nombrados.has(archivo), `${carpeta}/${archivo}`,
        'Hay un archivo publicado que el indice no registra.',
        'Un artefacto sin entrada en el indice no tiene hash declarado y nadie puede acreditarlo.');
    }

    // El documento del entrenador y el indice no pueden discrepar sobre cual rige.
    const sesion = datos.porSesionId.get(indice.datos.sesion_id);
    informe.exigir(F, !!sesion, indice.ruta,
      `El indice dice pertenecer a la sesion "${indice.datos.sesion_id}", que no existe.`);

    if (sesion?.datos?.publicaciones) {
      const vigenteEnDocumento = sesion.datos.publicaciones.find((p) => p.vigente === true);
      if (vigenteEnDocumento) {
        informe.exigir(F, vigenteEnDocumento.p === indice.datos.vigente, indice.ruta,
          'El indice y el documento no coinciden en cual publicacion rige.',
          `indice: ${indice.datos.vigente} · documento (${sesion.ruta}): ${vigenteEnDocumento.p}`);
      }
    }
  }

  for (const publicacion of datos.publicaciones) {
    if (!publicacion.datos) continue;

    informe.exigir(F, publicacion.datos.publicacion?.p === publicacion.entrada.p, publicacion.ruta,
      'El archivo dice ser una publicacion distinta de la que el indice registra.',
      `archivo: ${publicacion.datos.publicacion?.p} · indice: ${publicacion.entrada.p}`);

    comprobarSeccionesYPaneles(publicacion, informe);
  }

  if (datos.config.publico === true) comprobarMarcaDemo(datos, informe);
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
 * lleva su marca. Se aplica solo a sesiones, publicaciones y ejecuciones: los
 * esquemas, la configuracion y cualquier otro metadato quedan fuera porque no
 * estan en los conjuntos que la configuracion declara.
 */
function comprobarMarcaDemo(datos, informe) {
  const revisar = [
    ...datos.sesiones.map((a) => [a, 'sesion']),
    ...datos.publicaciones.map((a) => [a, 'publicacion']),
    ...datos.ejecuciones.map((a) => [a, 'ejecucion']),
  ];

  for (const [archivo, tipo] of revisar) {
    if (!archivo.datos) continue;
    informe.exigir(D, archivo.datos.demo === true, archivo.ruta,
      `Este repositorio es publico y esta ${tipo} no esta marcada como demo.`,
      'Un dato sin "demo": true en un repositorio publico o es real —y no puede estar aqui— ' +
      'o es sintetico y podria confundirse con evidencia de una persona.');
  }
}
