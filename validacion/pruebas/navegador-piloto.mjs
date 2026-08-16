/**
 * El circuito del piloto, en un navegador real y sobre el caso piloto-001.
 *
 * Va aparte de navegador.mjs a proposito: esa suite vigila demo-001 y no debe
 * cambiar por el piloto. Que siga pasando sin tocarla es parte de la prueba.
 *
 *   node validacion/pruebas/navegador-piloto.mjs
 *
 * Necesita el repositorio servido (por defecto en 127.0.0.1:4173).
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import crypto from 'crypto';

const REPO = process.env.REPO || new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const PUERTO = process.env.PUERTO || '4173';
const CASO = `${REPO}/casos/piloto-001`;
const DEV = `${CASO}/devoluciones/sesion-piloto-001/1.json`;
const VISTA = `http://127.0.0.1:${PUERTO}/app/alumno/?caso=piloto-001`;
const VISTA_DEMO = `http://127.0.0.1:${PUERTO}/app/alumno/`;

const sha = (p) => crypto.createHash('sha256').update(readFileSync(p)).digest('hex');
const resultados = [];
const ok = (n, cond, extra = '') => {
  resultados.push([cond ? 'PASA' : 'FALLA', n, extra]);
  if (!cond) process.exitCode = 1;
};

const navegador = await chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) });
const ctx = await navegador.newContext({
  viewport: { width: 390, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();

// Misma razon que en navegador.mjs: sin Cache-Control, Chromium aplica frescura
// heuristica y puede servir un JSON viejo despues de editarlo.
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

const shaDevolucion = sha(DEV);

/* ---------- B: bloques y sensaciones ---------- */
await page.goto(VISTA, { waitUntil: 'networkidle' });

const base = await page.evaluate(() => ({
  ejercicios: document.querySelectorAll('article.ex').length,
  series: document.querySelectorAll('.serie-row').length,
  pestanas: document.querySelectorAll('.tab-btn').length,
  bloques: [...document.querySelectorAll('.block-title')].map((n) => n.textContent),
  sensaciones: document.querySelectorAll('.sensacion').length,
  opciones: document.querySelectorAll('.sensacion .sens-btn').length,
  elegidas: document.querySelectorAll('.sens-btn.elegida').length,
  aviso: document.getElementById('aviso')?.textContent || '',
  cuerpo: document.body.innerText,
}));

ok('B: 5 ejercicios', base.ejercicios === 5, `=${base.ejercicios}`);
ok('B: 15 filas de serie', base.series === 15, `=${base.series}`);
ok('B: 3 pestanas', base.pestanas === 3, `=${base.pestanas}`);
ok('B: los bloques se dibujan con su titulo',
  base.bloques.join('|') === 'Calentamiento (8 min)|Fuerza|Acondicionamiento', base.bloques.join('|'));
ok('B: una pregunta de sensacion por bloque declarado', base.sensaciones === 2, `=${base.sensaciones}`);
ok('B: cuatro opciones por bloque', base.opciones === 8, `=${base.opciones}`);
ok('B: ninguna sensacion viene preseleccionada', base.elegidas === 0, `=${base.elegidas}`);
ok('B: sin errores de carga', base.aviso === '', base.aviso.slice(0, 60));

/* ---------- CARGA: lo desconocido no se rellena ---------- */
const sentadilla = await page.evaluate(() => {
  const art = [...document.querySelectorAll('article.ex')]
    .find((a) => a.querySelector('.ex-name').textContent.includes('Sentadilla'));
  return {
    presentacion: [...art.querySelectorAll('.ex-data .dl')].map((n) => n.textContent),
    etiquetasDeSerie: [...art.querySelectorAll('.serie-row .sf-l')].map((n) => n.textContent),
    valoresDeSerie: [...art.querySelectorAll('.serie-row .sf-i')].map((n) => n.value),
  };
});
ok('K: la sentadilla no muestra una carga prescrita',
  !sentadilla.presentacion.includes('Carga'), sentadilla.presentacion.join(','));
ok('K: pero si tiene donde registrar la carga',
  sentadilla.etiquetasDeSerie.filter((e) => e === 'Carga').length === 3,
  sentadilla.etiquetasDeSerie.join(','));
ok('K: los campos de carga llegan vacios, sin sugerencia',
  sentadilla.valoresDeSerie.every((v) => v === ''));
ok('K: la sesion explica como encontrarla', /Como encontrar tu carga hoy/.test(base.cuerpo));

/* ---------- EJECUCION: la carga nace de la sesion ---------- */
const filas = page.locator('.serie-row');
for (const [i, rir] of [['0', '3'], ['1', '3'], ['2', '2']]) {
  await filas.nth(Number(i)).locator('input[type=checkbox]').check();
  await filas.nth(Number(i)).locator('.sf-i').nth(0).fill('70');
  await filas.nth(Number(i)).locator('.sf-i').nth(1).fill('8');
  await filas.nth(Number(i)).locator('.sf-i').nth(2).fill(rir);
}

// Solo el primer bloque recibe sensacion: el segundo queda sin marcar a proposito.
await page.locator('.sensacion').nth(0).locator('.sens-btn[data-valor=muy_facil]').click();

const trasElegir = await page.evaluate(() => ({
  elegidas: document.querySelectorAll('.sens-btn.elegida').length,
  cargas: [...document.querySelectorAll('article.ex .serie-row .sf-i')].filter((i) => i.value !== '').length,
}));
ok('S: marcar una sensacion la deja marcada', trasElegir.elegidas === 1, `=${trasElegir.elegidas}`);
ok('S: marcar "muy facil" no cambia ningun valor programado ni registrado',
  trasElegir.cargas === 9, `campos con valor=${trasElegir.cargas}`);

await page.selectOption('#cierre .sf-s', 'completada');
await page.fill('#cierre .sf-t', 'La fuerza me quedo corta: hice una cuarta serie de sentadilla a 70 kg que no estaba escrita.');
await page.click('#cierre .btn-emitir');
await page.waitForFunction(() => /Copiado/.test(document.querySelector('#cierre .emitir-estado').textContent));

const eje = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));

ok('E: se registran las 15 series', eje.series.length === 15, `=${eje.series.length}`);
const sentadillas = eje.series.filter((s) => s.ejercicio_id === 's2a' || s.ejercicio_id === 's1-a');
ok('E: la carga registrada es la que se escribio',
  sentadillas.every((s) => s.ejecutado.campos?.carga === '70'));
ok('E: lo programado conserva que la carga NO estaba prescrita',
  sentadillas.every((s) => s.programado.find((c) => c.campo === 'carga').prescrito === false));
ok('E: y conserva por que no lo estaba',
  sentadillas.every((s) => typeof s.programado.find((c) => c.campo === 'carga').motivo_no_prescrito === 'string'));
ok('E: ninguna serie inventa una carga que no se escribio',
  eje.series.every((s) => !s.ejecutado.registrado || 'carga' in s.ejecutado.campos || s.ejecutado.campos_sin_registrar.includes('carga')));

ok('E: se emiten las dos sensaciones', eje.sensaciones.length === 2, `=${eje.sensaciones.length}`);
const marcada = eje.sensaciones.find((s) => s.registrado === true);
const sinMarcar = eje.sensaciones.find((s) => s.registrado === false);
ok('E: la sensacion marcada sale tal cual', marcada?.percepcion === 'muy_facil', marcada?.percepcion);
ok('E: el bloque sin marcar NO se lee como "adecuado"',
  sinMarcar !== undefined && !('percepcion' in sinMarcar));
ok('E: el bloque sin marcar dice por que esta vacio',
  typeof sinMarcar?.motivo === 'string' && sinMarcar.motivo.length > 0);
ok('E: cada sensacion nombra su bloque',
  eje.sensaciones.every((s) => typeof s.bloque_id === 'string' && typeof s.etiqueta === 'string'));
ok('E: la ejecucion queda marcada como demo', eje.demo === true);
ok('E: sin ningun null', !JSON.stringify(eje).includes('null'));

/* ---------- FEEDBACK: no responder no es responder ---------- */
await page.goto(VISTA, { waitUntil: 'networkidle' });
await page.click('.tab-btn:nth-child(3)');

const formulario = page.locator('#post');
await page.evaluate(() => navigator.clipboard.writeText('PORTAPAPELES-INTACTO'));
await formulario.locator('.btn-emitir').click();
await page.waitForFunction(() => document.querySelector('#post .emitir-estado').textContent.length > 0);

const vacio = await formulario.locator('.emitir-estado').textContent();
const papel = await page.evaluate(() => navigator.clipboard.readText());
ok('F: sin escribir nada no se emite archivo', papel === 'PORTAPAPELES-INTACTO');
ok('F: y lo dice en vez de emitir un feedback vacio', /No has escrito nada/.test(vacio), vacio.slice(0, 60));

const textareas = formulario.locator('textarea');
const cuantas = await textareas.count();
await textareas.nth(0).fill('70 kg en sentadilla, 14 por lado en press, 40 en remo.');
await formulario.locator('.btn-emitir').click();
await page.waitForFunction(() => /Copiado/.test(document.querySelector('#post .emitir-estado').textContent));
const parcial = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));

ok('F: hay un campo por pregunta mas el comentario libre', cuantas === 5, `=${cuantas}`);
ok('F: contestar una sola pregunta se registra como parcial',
  parcial.estado_respuesta === 'parcial', parcial.estado_respuesta);
ok('F: las preguntas sin contestar llevan motivo, no vacio',
  parcial.contenido.respuestas.slice(1).every((r) => r.respuesta.registrado === false && r.respuesta.motivo));
ok('F: cada respuesta viaja con su pregunta literal',
  parcial.contenido.respuestas.every((r) => typeof r.pregunta === 'string' && r.pregunta.length > 0));
ok('F: el feedback apunta a la sesion correcta', parcial.sesion_id === 'sesion-piloto-001');
ok('F: el feedback queda marcado como demo', parcial.demo === true);

for (let i = 1; i < cuantas; i += 1) await textareas.nth(i).fill(`respuesta ${i}`);
await formulario.locator('.btn-emitir').click();
await page.waitForFunction(() => /Copiado/.test(document.querySelector('#post .emitir-estado').textContent));
const completo = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
ok('F: contestarlo todo se registra como respondido',
  completo.estado_respuesta === 'respondido', completo.estado_respuesta);

/* ---------- DEVOLUCION: tres capas, y la cita primero ---------- */
const devolucion = await page.evaluate(() => {
  const titulos = [...document.querySelectorAll('#tab-feedback .card h2')].map((n) => n.textContent);
  return {
    titulos,
    cita: document.querySelector('#tab-feedback .cita')?.textContent || '',
    avisoInterpretacion: [...document.querySelectorAll('#tab-feedback .note-inline')]
      .map((n) => n.textContent).join(' '),
    puntos: [...document.querySelectorAll('#tab-feedback .card')]
      .filter((c) => c.querySelector('h2')?.textContent.includes('Para la próxima'))
      .flatMap((c) => [...c.querySelectorAll('li')].map((l) => l.textContent)),
  };
});

ok('D: se muestran las tres capas mas la memoria',
  devolucion.titulos.slice(0, 4).join('|') === 'Lo que contaste|Lo que entendí|Para la próxima|Lo que vamos sabiendo de ti',
  devolucion.titulos.join('|'));
ok('D: la devolucion va antes del formulario de preguntas',
  devolucion.titulos.indexOf('Lo que contaste') < devolucion.titulos.indexOf('Despues de entrenar, cuentame'),
  devolucion.titulos.join('|'));
ok('D: la cita del alumno sale literal',
  devolucion.cita.includes('La fuerza estuvo demasiado facil'), devolucion.cita.slice(0, 50));
ok('D: la lectura del entrenador va rotulada como interpretacion',
  /no un hecho/.test(devolucion.avisoInterpretacion), devolucion.avisoInterpretacion.slice(0, 80));
ok('D: las decisiones y lo que solo se observa no se mezclan',
  devolucion.puntos.some((p) => p.startsWith('Decidido:')) && devolucion.puntos.some((p) => p.startsWith('A mirar:')),
  devolucion.puntos.join(' / ').slice(0, 90));
ok('D: la memoria incluye lo que funciono, no solo problemas',
  devolucion.titulos.includes('Lo que vamos sabiendo de ti'));

/* ---------- la ausencia de devolucion no es un error ---------- */
{
  const p = await ctx.newPage();
  await p.goto(VISTA_DEMO, { waitUntil: 'networkidle' });
  const e = await p.evaluate(() => ({
    aviso: document.getElementById('aviso')?.textContent || '',
    ejercicios: document.querySelectorAll('article.ex').length,
    capas: [...document.querySelectorAll('.card h2')].map((n) => n.textContent),
  }));
  await p.close();
  ok('A: demo-001 sigue renderizando igual', e.ejercicios === 9 && e.aviso === '', `ejercicios=${e.ejercicios} ${e.aviso.slice(0, 40)}`);
  ok('A: sin devolucion publicada no se muestra ninguna capa',
    !e.capas.includes('Lo que contaste'), e.capas.join('|'));
}

/* ---------- INTEGRIDAD de la devolucion: fallo cerrado ---------- */
{
  const original = readFileSync(DEV, 'utf8');
  writeFileSync(DEV, original.replace('"titulo": "Despues de tu primera sesion"', '"titulo": "ALTERADO"'));

  const p = await ctx.newPage();
  const cdp2 = await ctx.newCDPSession(p);
  await cdp2.send('Network.enable');
  await cdp2.send('Network.setCacheDisabled', { cacheDisabled: true });
  await p.goto(VISTA, { waitUntil: 'networkidle' });
  const e = await p.evaluate(() => ({
    aviso: document.getElementById('aviso')?.textContent || '',
    ejercicios: document.querySelectorAll('article.ex').length,
    cierre: !!document.getElementById('cierre'),
    cabeceraVisible: !document.getElementById('cabecera').hidden,
    veAlterado: document.body.innerText.includes('ALTERADO'),
  }));
  await p.close();

  writeFileSync(DEV, original);

  ok('ID: una devolucion alterada detiene toda la vista', e.ejercicios === 0 && e.cierre === false);
  ok('ID: el mensaje explica que no coincide con lo publicado',
    /devolucion de esta sesion no coincide/.test(e.aviso), e.aviso.slice(0, 90));
  ok('ID: el mensaje dice que podria atribuirle palabras que no dijo',
    /palabras que no dijiste/.test(e.aviso));
  ok('ID: no queda nada de la devolucion alterada en pantalla', e.veAlterado === false && e.cabeceraVisible === false);
  ok('ID: la devolucion queda restaurada', sha(DEV) === shaDevolucion);
}

/* ---------- nada real, ni de la alumna ni del caso original ---------- */
{
  const prohibidos = ['Juan Pablo', 'jiujitsu', 'BJJ', 'tatami', 'kickboxing', 'media maraton', 'media maratón'];
  const archivos = [
    `${CASO}/alumno.json`,
    `${CASO}/sesiones/sesion-piloto-001.json`,
    `${CASO}/sesiones/sesion-piloto-002.json`,
    `${CASO}/publicado/1.json`,
    `${CASO}/ejecuciones/sesion-piloto-001.json`,
    `${CASO}/feedback/sesion-piloto-001.json`,
    DEV,
    `${REPO}/app/alumno/registro-feedback.js`,
  ];
  const encontrados = [];
  for (const f of archivos) {
    const t = readFileSync(f, 'utf8').toLowerCase();
    prohibidos.forEach((p) => { if (t.includes(p.toLowerCase())) encontrados.push(`${f.split('/').pop()}:${p}`); });
  }
  ok('P8: el piloto no arrastra datos del caso real', encontrados.length === 0, encontrados.join(' '));

  const marcados = archivos.slice(0, 7).filter((f) => {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    return j.demo === true && typeof j.aviso_demo === 'string';
  });
  ok('P8: los siete archivos del caso se declaran ficticios', marcados.length === 7, `=${marcados.length}`);
  ok('P8: y el aviso dice que la alumna no existe',
    JSON.parse(readFileSync(`${CASO}/alumno.json`, 'utf8')).aviso_demo.includes('no existe'));
}

await navegador.close();

console.log('\n============ RESULTADOS PILOTO ============');
resultados.forEach(([e, n, x]) => console.log(`${e.padEnd(5)} ${n}${x ? '  (' + x + ')' : ''}`));
console.log(`\n${resultados.filter((r) => r[0] === 'PASA').length}/${resultados.length} pruebas pasan`);
