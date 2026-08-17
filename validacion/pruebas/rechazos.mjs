import Ajv from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';
const R = process.env.REPO || new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const ajv = new Ajv({ allErrors: true, strict: false });
const validar = ajv.compile(JSON.parse(readFileSync(`${R}/esquemas/ejecucion.schema.json`, 'utf8')));
// Por defecto usa la ejecucion demo versionada en el repo; con EJECUCION=<ruta>
// se puede apuntar a una recien generada por verificar.mjs.
const base = JSON.parse(readFileSync(process.env.EJECUCION || `${R}/casos/demo-001/ejecuciones/demo-ejecucion-de-prueba.json`, 'utf8'));
const clon = () => JSON.parse(JSON.stringify(base));

const pruebas = [
  ['acepta la ejecucion real emitida', clon(), true],
  ['rechaza check_in = null', (() => { const e = clon(); e.check_in = null; return e; })(), false],
  ['rechaza "no_solicitado" dentro del enum de respuesta', (() => { const e = clon(); e.check_in = { solicitado: true, estado_respuesta: 'no_solicitado' }; return e; })(), false],
  ['rechaza estado_respuesta cuando no se solicito', (() => { const e = clon(); e.check_in = { solicitado: false, motivo: 'x', estado_respuesta: 'sin_respuesta' }; return e; })(), false],
  ['rechaza no solicitado sin motivo', (() => { const e = clon(); e.check_in = { solicitado: false }; return e; })(), false],
  ['acepta un check-in real sin responder (H4)', (() => { const e = clon(); e.check_in = { solicitado: true, estado_respuesta: 'sin_respuesta' }; return e; })(), true],
  ['rechaza rellenar una serie no registrada', (() => { const e = clon(); e.series[2].ejecutado = { registrado: false, motivo: 'x', campos: { reps: '0' } }; return e; })(), false],
  ['rechaza una serie registrada sin ningun campo', (() => { const e = clon(); e.series[0].ejecutado = { registrado: true, campos: {}, campos_sin_registrar: [] }; return e; })(), false],
  ['rechaza inicio como fecha suelta (sin declarar si se observo)', (() => { const e = clon(); e.inicio = '2027-03-12T18:00:00-04:00'; return e; })(), false],
  ['rechaza un resultado fuera del enum', (() => { const e = clon(); e.resultado = 'casi'; return e; })(), false],
  ['rechaza hash con formato invalido', (() => { const e = clon(); e.publicacion_hash = 'abc'; return e; })(), false],
  ['rechaza publicacion_ejecutada ausente', (() => { const e = clon(); delete e.publicacion_ejecutada; return e; })(), false],
];

let mal = 0;
for (const [nombre, dato, esperado] of pruebas) {
  const ok = validar(dato);
  const bien = ok === esperado;
  if (!bien) mal++;
  console.log(`${bien ? 'PASA ' : 'FALLA'} ${nombre}  ->  ${ok ? 'valida' : 'rechaza'}`);
}
console.log(mal === 0 ? `\n${pruebas.length}/${pruebas.length} correctas` : `\n${mal} incorrectas`);
// Sin esto, una prueba en rojo se imprimia y CI seguia en verde.
process.exitCode = mal === 0 ? 0 : 1;
