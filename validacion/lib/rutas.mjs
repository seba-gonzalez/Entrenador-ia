/**
 * Recorrido de directorios y coincidencia de patrones.
 *
 * Escrito a mano en vez de usar fs.globSync o una dependencia: son treinta
 * lineas, no dependen de la version de Node y no hay magia que se rompa cuando
 * Actions cambie su version por defecto.
 *
 * El patron admite '*' como comodin de un segmento. No hay '**': si algun dia
 * hiciera falta, es mejor declararlo en la configuracion que adivinarlo.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * '*' dentro de un segmento coincide con cualquier cosa menos una barra, asi
 * que 'casos', '*' y '*.json' funcionan igual. No hay '**' a proposito: si
 * hiciera falta descender por profundidad variable, es mejor declararlo en la
 * configuracion que adivinarlo.
 */
function coincide(segmentoPatron, segmentoReal) {
  if (segmentoPatron === '*') return true;
  if (!segmentoPatron.includes('*')) return segmentoPatron === segmentoReal;
  const expresion = segmentoPatron
    .split('*')
    .map((parte) => parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${expresion}$`).test(segmentoReal);
}

/**
 * Devuelve las rutas relativas a 'raiz' que coinciden con el patron.
 * El resultado va ordenado para que un fallo se reporte siempre igual.
 */
export function buscar(raiz, patron) {
  const segmentos = patron.split('/').filter(Boolean);
  const encontrados = [];

  function descender(prefijo, indice) {
    if (indice === segmentos.length) return;
    const esUltimo = indice === segmentos.length - 1;
    const directorio = prefijo ? join(raiz, prefijo) : raiz;

    let entradas;
    try {
      entradas = readdirSync(directorio);
    } catch {
      return; // el directorio no existe: no es un fallo, simplemente no hay nada
    }

    for (const entrada of entradas) {
      if (!coincide(segmentos[indice], entrada)) continue;
      const relativa = prefijo ? `${prefijo}/${entrada}` : entrada;
      const completa = join(raiz, relativa);
      const esDirectorio = statSync(completa).isDirectory();

      if (esUltimo && !esDirectorio) encontrados.push(relativa);
      else if (!esUltimo && esDirectorio) descender(relativa, indice + 1);
    }
  }

  descender('', 0);
  return encontrados.sort();
}

/** Todas las rutas de una lista de patrones, sin repetir. */
export function buscarVarios(raiz, patrones) {
  const vistas = new Set();
  for (const patron of patrones || []) {
    for (const ruta of buscar(raiz, patron)) vistas.add(ruta);
  }
  return [...vistas].sort();
}

/** Archivos directos de un directorio, sin descender. */
export function archivosDe(raiz, directorioRelativo) {
  try {
    return readdirSync(join(raiz, directorioRelativo))
      .filter((n) => statSync(join(raiz, directorioRelativo, n)).isFile())
      .sort();
  } catch {
    return [];
  }
}

/** Normaliza separadores para que los mensajes se lean igual en cualquier SO. */
export function comoRuta(...partes) {
  return partes.join('/').split(sep).join('/');
}
