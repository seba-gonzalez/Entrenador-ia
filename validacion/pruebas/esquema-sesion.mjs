import Ajv from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const R = process.env.REPO || new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const ajv = new Ajv({ allErrors: true, strict: false });
const validar = ajv.compile(JSON.parse(readFileSync(`${R}/esquemas/sesion.schema.json`, 'utf8')));

const real = JSON.parse(readFileSync(`${R}/casos/demo-001/sesion.json`, 'utf8'));
const clon = () => JSON.parse(JSON.stringify(real));

// Un borrador se construye quitando todo lo que la aprobacion agrega.
const borrador = () => {
  const s = clon();
  s.estado = 'borrador';
  s.versiones = [s.versiones[0]];
  s.observaciones = [];
  delete s.version_aprobada;
  delete s.aprobada_por;
  delete s.fecha_aprobacion;
  delete s.checklist_aprobacion;
  delete s.publicaciones;
  return s;
};

const aprobada = () => {
  const s = clon();
  s.estado = 'aprobada';
  delete s.publicaciones;
  return s;
};

const pruebas = [
  // --- lo que debe aceptar ---
  ['borrador sin aprobacion ni publicacion', borrador(), true],
  ['borrador con una sola version y sin observaciones', borrador(), true],
  ['en_revision con observaciones y sin aprobacion', (() => { const s = borrador(); s.estado = 'en_revision'; s.observaciones = real.observaciones; return s; })(), true],
  ['aprobada con version, autor, fecha y checklist', aprobada(), true],
  ['publicada con publicacion vigente (el caso demo real)', clon(), true],
  ['descartada queda sin restriccion (V1-B abierto)', (() => { const s = borrador(); s.estado = 'descartada'; return s; })(), true],

  // --- lo que debe rechazar: aprobacion incompleta ---
  ['aprobada sin version_aprobada', (() => { const s = aprobada(); delete s.version_aprobada; return s; })(), false],
  ['aprobada sin aprobada_por', (() => { const s = aprobada(); delete s.aprobada_por; return s; })(), false],
  ['aprobada sin fecha_aprobacion', (() => { const s = aprobada(); delete s.fecha_aprobacion; return s; })(), false],
  ['aprobada sin checklist_aprobacion', (() => { const s = aprobada(); delete s.checklist_aprobacion; return s; })(), false],
  ['publicada sin checklist_aprobacion', (() => { const s = clon(); delete s.checklist_aprobacion; return s; })(), false],

  // --- lo que debe rechazar: estado y datos incoherentes ---
  ['borrador que ya trae version_aprobada', (() => { const s = borrador(); s.version_aprobada = 2; return s; })(), false],
  ['borrador que ya trae checklist respondido', (() => { const s = borrador(); s.checklist_aprobacion = real.checklist_aprobacion; return s; })(), false],
  ['borrador que ya trae publicaciones', (() => { const s = borrador(); s.publicaciones = real.publicaciones; return s; })(), false],
  ['en_revision con aprobada_por', (() => { const s = borrador(); s.estado = 'en_revision'; s.aprobada_por = 'entrenador'; return s; })(), false],
  ['aprobada que ya trae publicaciones (publicar es posterior)', (() => { const s = clon(); s.estado = 'aprobada'; return s; })(), false],

  // --- lo que debe rechazar: invariante de publicacion vigente ---
  ['publicada sin publicaciones', (() => { const s = clon(); delete s.publicaciones; return s; })(), false],
  ['publicada con cero vigentes', (() => { const s = clon(); s.publicaciones[0].vigente = false; return s; })(), false],
  ['publicada con dos vigentes', (() => {
    const s = clon();
    s.publicaciones.push({ ...s.publicaciones[0], p: 2, vigente: true });
    return s;
  })(), false],
  ['publicada con una vigente entre dos publicaciones', (() => {
    const s = clon();
    s.publicaciones[0].vigente = false;
    s.publicaciones[0].sustituida_por = 2;
    s.publicaciones.push({ ...s.publicaciones[0], p: 2, vigente: true, sustituida_por: undefined });
    delete s.publicaciones[1].sustituida_por;
    return s;
  })(), true],
];

let mal = 0;
for (const [nombre, dato, esperado] of pruebas) {
  const ok = validar(dato);
  const bien = ok === esperado;
  if (!bien) {
    mal++;
    console.log(`FALLA ${nombre} -> ${ok ? 'valida' : 'rechaza'} (esperado ${esperado ? 'valida' : 'rechaza'})`);
    if (validar.errors) console.log('  ', JSON.stringify(validar.errors.slice(0, 3)));
  } else {
    console.log(`PASA  ${nombre} -> ${ok ? 'valida' : 'rechaza'}`);
  }
}
console.log(mal === 0 ? `\n${pruebas.length}/${pruebas.length} correctas` : `\n${mal} incorrectas`);
process.exitCode = mal === 0 ? 0 : 1;
