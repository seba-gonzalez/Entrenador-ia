#!/usr/bin/env node
/**
 * validar.mjs — comprueba que los datos de un repositorio no se contradigan.
 *
 *   node validacion/validar.mjs
 *   node validacion/validar.mjs --raiz /ruta/al/repo-de-datos
 *   node validacion/validar.mjs --base origin/main        (anade inmutabilidad)
 *
 * El validador no conoce ninguna disposicion de archivos: la lee de la
 * configuracion del repositorio que valida. Por eso el repositorio privado
 * puede consumir esta misma implementacion sin duplicar nada.
 *
 * Lo que este archivo NO hace, y no debe hacer nunca: opinar sobre
 * entrenamiento. Comprobar si una sesion "tiene calentamiento" seria meter una
 * regla metodologica en el codigo (principio 1.2). Eso es el checklist, y el
 * checklist es un documento del entrenador.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { cargar } from './lib/carga.mjs';
import { Informe } from './lib/informe.mjs';
import { comprobarEsquemas } from './comprobaciones/esquemas.mjs';
import { comprobarIntegridad } from './comprobaciones/integridad.mjs';
import { comprobarEstructura } from './comprobaciones/estructura.mjs';
import { comprobarReferencias } from './comprobaciones/referencias.mjs';
import { comprobarInmutabilidad } from './comprobaciones/inmutabilidad.mjs';

function argumentos(argv) {
  const opciones = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    opciones[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
  }
  return opciones;
}

const opciones = argumentos(process.argv.slice(2));
const raiz = resolve(opciones.raiz || process.cwd());
const rutaConfig = join(raiz, opciones.config || 'validacion.config.json');

if (!existsSync(rutaConfig)) {
  console.error(`No hay configuracion de validacion en ${rutaConfig}.`);
  console.error('Cada repositorio de datos declara donde vive cada cosa en su propio archivo.');
  process.exit(2);
}

const config = JSON.parse(readFileSync(rutaConfig, 'utf8'));
const datos = cargar(raiz, config);

console.log(`Validando ${raiz}`);
console.log(
  `  ${datos.alumnos.length} ficha(s) · ${datos.sesiones.length} sesion(es) · ` +
  `${datos.publicaciones.length} publicacion(es) · ${datos.ejecuciones.length} ejecucion(es) · ` +
  `${datos.feedback.length} feedback · ${datos.devoluciones.length} devolucion(es)\n`
);

if (datos.sesiones.length === 0 && datos.ejecuciones.length === 0) {
  console.error('La configuracion no encontro ningun dato. Revisa las rutas declaradas.');
  process.exit(2);
}

const informe = new Informe();
comprobarEsquemas(datos, informe, opciones.esquemas ? resolve(opciones.esquemas) : undefined);
comprobarIntegridad(datos, informe);
comprobarEstructura(datos, informe);
comprobarReferencias(datos, informe);
if (opciones.base) comprobarInmutabilidad(datos, informe, opciones.base);

console.log('');
informe.imprimir();
process.exit(informe.hayFallos ? 1 : 0);
