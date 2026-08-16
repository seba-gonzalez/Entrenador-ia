import Ajv from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const R = process.env.REPO || new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const ajv = new Ajv({ allErrors: true, strict: false });
const esq = JSON.parse(readFileSync(`${R}/esquemas/sesion.schema.json`, 'utf8'));
const validar = ajv.compile({ $schema: esq.$schema, ...esq.$defs.contenido, $defs: esq.$defs });

const real = JSON.parse(readFileSync(`${R}/casos/demo-001/publicado/1.json`, 'utf8')).contenido;
const clon = () => JSON.parse(JSON.stringify(real));

// Reemplaza la primera tarjeta de un tipo dado por la version mutada.
const conTarjeta = (tipo, mutar) => {
  const c = clon();
  for (const panel of Object.values(c.paneles)) {
    const i = panel.tarjetas.findIndex((t) => t.tipo === tipo);
    if (i >= 0) { panel.tarjetas[i] = mutar(JSON.parse(JSON.stringify(panel.tarjetas[i]))); return c; }
  }
  throw new Error(`el caso demo no tiene ninguna tarjeta de tipo ${tipo}`);
};
const sinCampo = (tipo, campo) => conTarjeta(tipo, (t) => { delete t[campo]; return t; });
const vacio = (tipo, campo) => conTarjeta(tipo, (t) => { t[campo] = []; return t; });

const pruebas = [
  ['el contenido publicado real valida', clon(), true],

  // --- campos que el renderizador recorre sin comprobar ---
  ['notas sin parrafos', sinCampo('notas', 'parrafos'), false],
  ['objetivos sin parrafos', sinCampo('objetivos', 'parrafos'), false],
  ['competencia sin parrafos', sinCampo('competencia', 'parrafos'), false],
  ['argumentos sin parrafos', sinCampo('argumentos', 'parrafos'), false],
  ['contexto sin items', sinCampo('contexto', 'items'), false],
  ['preguntas sin items', sinCampo('preguntas', 'items'), false],
  ['mapa sin fases', sinCampo('mapa', 'fases'), false],
  ['sesion sin ejercicios', sinCampo('sesion', 'ejercicios'), false],

  // --- presentes pero vacios: la tarjeta se dibujaria hueca ---
  ['notas con parrafos vacios', vacio('notas', 'parrafos'), false],
  ['contexto con items vacios', vacio('contexto', 'items'), false],
  ['mapa con fases vacias', vacio('mapa', 'fases'), false],
  ['preguntas con items vacios', vacio('preguntas', 'items'), false],

  // --- estructura interna de cada elemento ---
  ['parrafo sin texto', conTarjeta('notas', (t) => { delete t.parrafos[0].texto; return t; }), false],
  ['fase del mapa sin fechas', conTarjeta('mapa', (t) => { delete t.fases[0].fechas; return t; }), false],
  ['fase del mapa sin numero', conTarjeta('mapa', (t) => { delete t.fases[0].numero; return t; }), false],
  ['pregunta que no es texto', conTarjeta('preguntas', (t) => { t.items[0] = { texto: 'x' }; return t; }), false],
  ['programa con lista vacia', conTarjeta('programa', (t) => { t.lista = []; return t; }), false],
  ['programa sin intro ni lista (el codigo los comprueba)', conTarjeta('programa', (t) => { delete t.intro; delete t.lista; return t; }), true],

  // --- tipo desconocido ---
  ['tipo que la vista no sabe dibujar', conTarjeta('notas', (t) => { t.tipo = 'grafico'; return t; }), false],

  // --- correspondencia secciones <-> paneles ---
  ['seccion declarada sin panel (el esquema NO puede verlo)', (() => {
    const c = clon();
    c.secciones.push({ id: 'retrospectiva', etiqueta: 'Retrospectiva' });
    return c;
  })(), true],
];

let mal = 0;
for (const [nombre, dato, esperado] of pruebas) {
  const ok = validar(dato);
  const bien = ok === esperado;
  if (!bien) { mal++; console.log(`FALLA ${nombre} -> ${ok ? 'valida' : 'rechaza'} (esperado ${esperado ? 'valida' : 'rechaza'})`); }
  else console.log(`PASA  ${nombre} -> ${ok ? 'valida' : 'rechaza'}`);
}
console.log(mal === 0 ? `\n${pruebas.length}/${pruebas.length} correctas` : `\n${mal} incorrectas`);
process.exitCode = mal === 0 ? 0 : 1;
