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
const DEV = `${CASO}/devoluciones/sesion-piloto-001/2.json`;
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
const shaPublicacion = sha(`${CASO}/publicado/1.json`);

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
  casillas: document.querySelectorAll('.serie-row input[type=checkbox]').length,
  campos: document.querySelectorAll('.serie-row .sf-i').length,
  aviso: document.getElementById('aviso')?.textContent || '',
  cuerpo: document.body.innerText,
}));

ok('B: 5 ejercicios', base.ejercicios === 5, `=${base.ejercicios}`);
// Cinco filas para quince series: el registro se abre compacto.
ok('B: 5 filas de registro, una por ejercicio', base.series === 5, `=${base.series}`);
ok('B: sin ninguna casilla que marcar', base.casillas === 0, `=${base.casillas}`);
ok('B: 13 campos en lugar de 39 + 15 casillas', base.campos === 13, `=${base.campos}`);
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
// Una sola vez, porque el registro se abre compacto: esa entrada representa
// las tres series.
ok('K: pero si tiene donde registrar la carga',
  sentadilla.etiquetasDeSerie.filter((e) => e === 'Carga').length === 1,
  sentadilla.etiquetasDeSerie.join(','));
ok('K: los campos de carga llegan vacios, sin sugerencia',
  sentadilla.valoresDeSerie.every((v) => v === ''));
ok('K: la sesion explica como encontrarla', /Como encontrar tu carga hoy/.test(base.cuerpo));

/* ---------- EJECUCION: la carga nace de la sesion ---------- */
const ejercicios = page.locator('article.ex');

// La sentadilla se abre por serie porque el RIR de la tercera fue distinto.
await ejercicios.nth(0).locator('.sf-i').nth(0).fill('70');
await ejercicios.nth(0).locator('.sf-i').nth(1).fill('8');
await ejercicios.nth(0).locator('.sf-i').nth(2).fill('3');
await ejercicios.nth(0).getByRole('button', { name: 'Registrar series por separado' }).click();
await ejercicios.nth(0).locator('.serie-row').nth(2).locator('.sf-i').nth(2).fill('2');

// El resto salio parejo: una entrada por ejercicio.
const compactos = [null, ['14', '10', '3'], ['40', '10', '3'], ['2×16 kg', '30 m'], ['peso corporal', '10/lado']];
for (let i = 1; i < compactos.length; i += 1) {
  for (let j = 0; j < compactos[i].length; j += 1) {
    await ejercicios.nth(i).locator('.sf-i').nth(j).fill(compactos[i][j]);
  }
}

// Solo el primer bloque recibe sensacion: el segundo queda sin marcar a proposito.
await page.locator('.sensacion').nth(0).locator('.sens-btn[data-valor=muy_facil]').click();

const trasElegir = await page.evaluate(() => ({
  elegidas: document.querySelectorAll('.sens-btn.elegida').length,
  cargas: [...document.querySelectorAll('article.ex .serie-row .sf-i')].filter((i) => i.value !== '').length,
}));
ok('S: marcar una sensacion la deja marcada', trasElegir.elegidas === 1, `=${trasElegir.elegidas}`);
ok('S: marcar "muy facil" no cambia ningun valor registrado',
  trasElegir.cargas === 19, `campos con valor=${trasElegir.cargas}`);

await page.selectOption('#cierre .sf-s', 'completada');
await page.fill('#cierre .sf-t', 'La fuerza me quedo corta: hice una cuarta serie de sentadilla a 70 kg que no estaba escrita.');
await page.locator('#cierre .btn-emitir').first().click();

const sinPendientes = await page.evaluate(() => ({
  preguntas: document.querySelectorAll('.zona-pendientes .sensacion').length,
  resumen: !document.querySelector('.zona-resumen').hidden,
}));
ok('C: sin filas en blanco no se pregunta nada', sinPendientes.preguntas === 0, `=${sinPendientes.preguntas}`);
ok('C: se pasa directo al resumen', sinPendientes.resumen === true);

await page.locator('#cierre .btn-emitir').nth(1).click();
await page.waitForFunction(() => /Copiado/.test(document.querySelector('#cierre .emitir-estado').textContent));

const eje = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));

ok('E: se registran las 15 series', eje.series.length === 15, `=${eje.series.length}`);
const sentadillas = eje.series.filter((s) => s.ejercicio_id === 's1-a');
ok('E: la carga registrada es la que se escribio',
  sentadillas.every((s) => s.ejecutado.campos?.carga === '70'));
ok('E: el detalle conserva el RIR distinto de la tercera',
  sentadillas.map((s) => s.ejecutado.campos.rir).join(',') === '3,3,2',
  sentadillas.map((s) => s.ejecutado.campos.rir).join(','));
ok('E: lo programado conserva que la carga NO estaba prescrita',
  sentadillas.every((s) => s.programado.find((c) => c.campo === 'carga').prescrito === false));
ok('E: y conserva por que no lo estaba',
  sentadillas.every((s) => typeof s.programado.find((c) => c.campo === 'carga').motivo_no_prescrito === 'string'));
ok('E: ninguna serie inventa una carga que no se escribio',
  eje.series.every((s) => !s.ejecutado.registrado || 'carga' in s.ejecutado.campos || s.ejecutado.campos_sin_registrar.includes('carga')));
ok('E: sin casilla, los datos bastan como evidencia',
  eje.series.every((s) => s.realizada === true));

/* ---------- CAP: como se observo cada serie ---------- */
ok('CAP: la sentadilla se anoto serie a serie',
  sentadillas.every((s) => s.capturado === 'por_serie'));
ok('CAP: el remo se declaro en conjunto',
  eje.series.filter((s) => s.ejercicio_id === 's1-c').every((s) => s.capturado === 'en_conjunto'));
ok('CAP: declarar en conjunto no pierde series',
  eje.series.filter((s) => s.ejercicio_id === 's1-c').length === 3);
ok('CAP: y no se lee como si cada una se hubiera observado',
  eje.series.filter((s) => s.capturado === 'en_conjunto').length === 12,
  `=${eje.series.filter((s) => s.capturado === 'en_conjunto').length}`);

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

/* ---------- A: agregar una serie durante la ejecucion ---------- */
{
  const p = await ctx.newPage();
  await p.goto(VISTA, { waitUntil: 'networkidle' });

  const antes = await p.evaluate(() => ({
    botones: [...document.querySelectorAll('.btn-anadir')].filter((b) => b.textContent.startsWith('+')).length,
    filas: document.querySelectorAll('.serie-row').length,
  }));
  ok('A: hay un "agregar serie" por ejercicio', antes.botones === 5, `=${antes.botones}`);

  const sentadilla = p.locator('article.ex').first();
  await sentadilla.getByRole('button', { name: '+ Agregar serie' }).click();

  const tras = await p.evaluate(() => {
    const nueva = document.querySelector('.serie-row.anadida');
    return {
      filas: document.querySelectorAll('.serie-row').length,
      anadidas: document.querySelectorAll('.serie-row.anadida').length,
      rotulo: nueva?.querySelector('.serie-marca')?.textContent || '',
      numero: nueva?.querySelector('.serie-head span')?.textContent || '',
      campos: [...nueva.querySelectorAll('.sf-l')].map((n) => n.textContent),
      vacios: [...nueva.querySelectorAll('.sf-i')].every((i) => i.value === ''),
      quitar: nueva.querySelectorAll('.btn-quitar').length,
    };
  });
  // Anadir abre el detalle: no tiene sentido decir "asi fueron las 3" y colgarle
  // una cuarta distinta. 5 compactas -> 3 de la sentadilla + 1 anadida + 4 compactas.
  ok('A: agregar abre el detalle del ejercicio', tras.filas === 8, `=${tras.filas}`);
  ok('A: y se distingue de las programadas', tras.anadidas === 1 && /anadida|añadida/.test(tras.rotulo), tras.rotulo);
  ok('A: continua la numeracion', tras.numero === 'Serie 4', tras.numero);
  ok('A: permite registrar carga, reps y RIR', tras.campos.join(',') === 'Carga,Reps,RIR real', tras.campos.join(','));
  ok('A: llega vacia, sin copiar lo programado', tras.vacios === true);

  // se puede quitar mientras este vacia, y deja de poder quitarse en cuanto hay dato
  await sentadilla.locator('.serie-row.anadida .sf-i').first().fill('70');
  await p.locator('.serie-row.anadida .btn-quitar').click();
  ok('A: con datos escritos, quitar no borra la fila',
    await p.locator('.serie-row.anadida').count() === 1);
  await sentadilla.locator('.serie-row.anadida .sf-i').first().fill('');
  await p.locator('.serie-row.anadida .btn-quitar').click();
  ok('A: vacia si se puede quitar', await p.locator('.serie-row.anadida').count() === 0);

  // y ahora se registra de verdad
  await sentadilla.getByRole('button', { name: '+ Agregar serie' }).click();
  const fila = p.locator('.serie-row.anadida');
  await fila.locator('.sf-i').nth(0).fill('70');
  await fila.locator('.sf-i').nth(1).fill('8');
  await fila.locator('.sf-i').nth(2).fill('2');
  // el resto de la sentadilla, que quedo abierta al anadir
  for (const n of [0, 1, 2]) {
    const f = sentadilla.locator('.serie-row').nth(n);
    await f.locator('.sf-i').nth(0).fill('70');
    await f.locator('.sf-i').nth(1).fill('8');
    await f.locator('.sf-i').nth(2).fill('3');
  }
  const resto = [null, ['14', '10', '3'], ['40', '10', '3'], ['2×16 kg', '30 m'], ['peso corporal', '10/lado']];
  for (let i = 1; i < resto.length; i += 1) {
    for (let j = 0; j < resto[i].length; j += 1) {
      await p.locator('article.ex').nth(i).locator('.sf-i').nth(j).fill(resto[i][j]);
    }
  }
  await p.selectOption('#cierre .sf-s', 'completada');
  await p.locator('#cierre .btn-emitir').first().click();
  await p.locator('#cierre .btn-emitir').nth(1).click();
  await p.waitForFunction(() => /Copiado/.test(document.querySelector('#cierre .emitir-estado').textContent));
  const eje2 = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
  await p.close();

  const extra = eje2.series.find((s) => s.anadida_en_ejecucion);
  ok('AE: la serie anadida llega al registro', !!extra);
  ok('AE: con lo que se escribio', extra?.ejecutado.campos.carga === '70' && extra?.ejecutado.campos.rir === '2');
  ok('AE: declarando que no estaba programada', extra?.anadida_en_ejecucion === true);
  ok('AE: y que nada estaba prescrito para ella',
    extra?.programado.every((c) => c.prescrito === false && c.motivo_no_prescrito));
  ok('AE: las series programadas no se marcan como anadidas',
    eje2.series.filter((s) => s.anadida_en_ejecucion).length === 1);
  ok('AE: el total sube en una', eje2.series.length === 16, `=${eje2.series.length}`);
  ok('AE: la serie anadida se anota por serie, nunca en conjunto',
    extra?.capturado === 'por_serie', extra?.capturado);
}

/* ---------- M: comodo en una pantalla pequena ---------- */
for (const ancho of [320, 390]) {
  const ctxM = await navegador.newContext({ viewport: { width: ancho, height: 900 } });
  const p = await ctxM.newPage();
  await p.goto(VISTA, { waitUntil: 'networkidle' });
  const m = await p.evaluate(() => {
    const doc = document.documentElement;
    const i = document.querySelector('.sf-i');
    const px = (n, prop) => parseFloat(getComputedStyle(n)[prop]);
    return {
      desborda: doc.scrollWidth > doc.clientWidth,
      fuenteCampo: px(i, 'fontSize'),
      fuenteArea: px(document.querySelector('.sf-t'), 'fontSize'),
      altoCampo: i.getBoundingClientRect().height,
      altoBotonSensacion: document.querySelector('.sens-btn').getBoundingClientRect().height,
      altoAnadir: document.querySelector('.btn-anadir').getBoundingClientRect().height,
      autocorrige: i.getAttribute('autocapitalize') !== 'off',
    };
  });
  await ctxM.close();
  ok(`M(${ancho}): la pagina no se desplaza a lo ancho`, m.desborda === false);
  // Safari hace zoom al enfocar cualquier campo de menos de 16px, y tras el zoom
  // ya no cabe: por eso esta es LA comprobacion del desplazamiento horizontal.
  ok(`M(${ancho}): los campos no disparan el zoom de Safari`, m.fuenteCampo >= 16 && m.fuenteArea >= 16,
    `campo ${m.fuenteCampo}px area ${m.fuenteArea}px`);
  ok(`M(${ancho}): se pueden tocar sin apuntar`,
    m.altoCampo >= 44 && m.altoBotonSensacion >= 44 && m.altoAnadir >= 44,
    `campo ${Math.round(m.altoCampo)} sens ${Math.round(m.altoBotonSensacion)} anadir ${Math.round(m.altoAnadir)}`);
  ok(`M(${ancho}): el teclado no corrige lo que se escribe`, m.autocorrige === false);
}

/* ---------- FEEDBACK: la devolucion corregida ---------- */


/* ---------- MG: el margen lo escribe el entrenador; el codigo lo muestra ----------
   La sesion 2 lo declara, pero es borrador y no se renderiza. Para probar el
   camino de codigo se republica temporalmente la sesion 1 con el margen puesto
   y se restaura al terminar: no queda nada tocado en el repositorio.        */
{
  const PUB = `${CASO}/publicado/1.json`;
  const IND = `${CASO}/publicado/indice.json`;
  const pubOriginal = readFileSync(PUB, 'utf8');
  const indOriginal = readFileSync(IND, 'utf8');
  const MARGEN = 'Puedes anadir 1 serie si terminas el bloque muy facil y mantienes RIR ≥ 2.';

  const j = JSON.parse(pubOriginal);
  for (const tarjeta of j.contenido.paneles.rutina.tarjetas) {
    for (const e of tarjeta.ejercicios || []) if (e.id === 's1-a') e.margen = { texto: MARGEN };
  }
  writeFileSync(PUB, JSON.stringify(j, null, 2) + '\n');
  const indice = JSON.parse(indOriginal);
  indice.publicaciones.find((x) => x.p === indice.vigente).hash =
    `sha256:${crypto.createHash('sha256').update(readFileSync(PUB)).digest('hex')}`;
  writeFileSync(IND, JSON.stringify(indice, null, 2) + '\n');

  let visto;
  let emitido;
  try {
    const p = await ctx.newPage();
    const c = await ctx.newCDPSession(p);
    await c.send('Network.enable');
    await c.send('Network.setCacheDisabled', { cacheDisabled: true });
    await p.goto(VISTA, { waitUntil: 'networkidle' });

    const primero = p.locator('article.ex').first();
    visto = await p.evaluate((texto) => ({
      enSentadilla: [...document.querySelectorAll('article.ex')][0].innerText.includes(texto),
      enOtros: [...document.querySelectorAll('article.ex')].slice(1).some((a) => a.innerText.includes(texto)),
      bloquea: document.querySelector('article.ex .btn-anadir').disabled,
    }), MARGEN);

    await primero.getByRole('button', { name: '+ Agregar serie' }).click();
    await primero.getByRole('button', { name: '+ Agregar serie' }).click();
    for (const n of [0, 1, 2, 3, 4]) {
      const f = primero.locator('.serie-row').nth(n);
      await f.locator('.sf-i').nth(0).fill('70');
      await f.locator('.sf-i').nth(1).fill('8');
      await f.locator('.sf-i').nth(2).fill('3');
    }
    const resto = [null, ['14', '10', '3'], ['40', '10', '3'], ['2×16 kg', '30 m'], ['peso corporal', '10/lado']];
    for (let i = 1; i < resto.length; i += 1) {
      for (let k = 0; k < resto[i].length; k += 1) {
        await p.locator('article.ex').nth(i).locator('.sf-i').nth(k).fill(resto[i][k]);
      }
    }
    await p.selectOption('#cierre .sf-s', 'completada');
    await p.locator('#cierre .btn-emitir').first().click();
    await p.locator('#cierre .btn-emitir').nth(1).click();
    await p.waitForFunction(() => /Copiado/.test(document.querySelector('#cierre .emitir-estado').textContent));
    emitido = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
    await p.close();
  } finally {
    writeFileSync(PUB, pubOriginal);
    writeFileSync(IND, indOriginal);
  }

  ok('MG: el margen aparece junto al ejercicio que lo declara', visto.enSentadilla === true);
  ok('MG: y no aparece donde no se declaro', visto.enOtros === false);
  ok('MG: el codigo no bloquea al llegar al margen', visto.bloquea === false);
  const anadidas = emitido.series.filter((s) => s.anadida_en_ejecucion);
  ok('MG: se pueden anadir mas series de las autorizadas — el codigo registra, no decide',
    anadidas.length === 2, `=${anadidas.length}`);
  ok('MG: y cada una conserva el margen declarado, literal',
    anadidas.every((s) => s.margen_declarado === MARGEN),
    anadidas.map((s) => s.margen_declarado).join(' | ').slice(0, 60));
  ok('MG: las programadas no llevan margen', emitido.series.filter((s) => !s.anadida_en_ejecucion)
    .every((s) => !('margen_declarado' in s)));
  ok('MG: la publicacion quedo restaurada', sha(`${CASO}/publicado/1.json`) === shaPublicacion);
}

/* ---------- BL: una fila en blanco se pregunta, y solo esa ---------- */
{
  const p = await ctx.newPage();
  await p.goto(VISTA, { waitUntil: 'networkidle' });
  const ex = p.locator('article.ex');

  // Todo registrado menos el remo, que queda entero en blanco.
  const v = [['70', '8', '3'], ['14', '10', '3'], null, ['2×16 kg', '30 m'], ['peso corporal', '10/lado']];
  for (let i = 0; i < v.length; i += 1) {
    if (!v[i]) continue;
    for (let k = 0; k < v[i].length; k += 1) await ex.nth(i).locator('.sf-i').nth(k).fill(v[i][k]);
  }
  await p.selectOption('#cierre .sf-s', 'parcial');
  await p.evaluate(() => navigator.clipboard.writeText('PORTAPAPELES-INTACTO'));
  await p.locator('#cierre .btn-emitir').first().click();

  const estado1 = await p.evaluate(() => ({
    preguntas: [...document.querySelectorAll('.zona-pendientes .sf-l')].map((n) => n.textContent),
    resumen: !document.querySelector('.zona-resumen').hidden,
    mensaje: document.querySelector('#cierre .emitir-estado').textContent,
  }));
  const papel1 = await p.evaluate(() => navigator.clipboard.readText());
  ok('BL: pregunta solo por el ejercicio en blanco', estado1.preguntas.length === 1,
    estado1.preguntas.join(' / '));
  ok('BL: y lo nombra con cuantas series cubre',
    /Remo/.test(estado1.preguntas[0]) && /3 series/.test(estado1.preguntas[0]), estado1.preguntas[0]);
  ok('BL: no emite nada mientras no se responda', papel1 === 'PORTAPAPELES-INTACTO');
  ok('BL: no muestra resumen todavia', estado1.resumen === false);
  ok('BL: dice que no lo decide por el alumno', /no lo elijo por ti/.test(estado1.mensaje));

  await p.locator('.zona-pendientes .sens-btn[data-respuesta=hecha_sin_datos]').click();
  await p.locator('#cierre .btn-emitir').nth(1).click();
  await p.waitForFunction(() => /Copiado/.test(document.querySelector('#cierre .emitir-estado').textContent));
  const e = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
  await p.close();

  const remo = e.series.filter((s) => s.ejercicio_id === 's1-c');
  ok('BL: las 3 series del remo siguen existiendo', remo.length === 3, `=${remo.length}`);
  ok('BL: "la hice sin anotar" -> realizada, sin datos',
    remo.every((s) => s.realizada === true && s.ejecutado.registrado === false));
  ok('BL: con su motivo, no en blanco',
    remo.every((s) => /no anoto ningun valor/i.test(s.ejecutado.motivo)), remo[0].ejecutado.motivo);
  ok('BL: y sin inventarle ningun campo', remo.every((s) => !('campos' in s.ejecutado)));
}


/* ---------- AG: se agrupa cuando una respuesta representa lo ocurrido ---------- */
{
  const p = await ctx.newPage();
  await p.goto(VISTA, { waitUntil: 'networkidle' });
  const ex = p.locator('article.ex');

  // Sentadilla: abierta por serie y entera en blanco -> una sola pregunta.
  await ex.nth(0).getByRole('button', { name: 'Registrar series por separado' }).click();
  // Press: abierto por serie, con las dos primeras registradas -> solo falta la 3.
  await ex.nth(1).getByRole('button', { name: 'Registrar series por separado' }).click();
  for (const n of [0, 1]) {
    const f = ex.nth(1).locator('.serie-row').nth(n);
    await f.locator('.sf-i').nth(0).fill('14');
    await f.locator('.sf-i').nth(1).fill('10');
    await f.locator('.sf-i').nth(2).fill('3');
  }
  // Remo: compacto y en blanco. Los dos ultimos, registrados.
  for (const [i, v] of [[3, ['2×16 kg', '30 m']], [4, ['peso corporal', '10/lado']]]) {
    for (let j = 0; j < v.length; j += 1) await ex.nth(i).locator('.sf-i').nth(j).fill(v[j]);
  }

  await p.selectOption('#cierre .sf-s', 'parcial');
  await p.locator('#cierre .btn-emitir').first().click();

  const agrupado = await p.evaluate(() => ({
    preguntas: [...document.querySelectorAll('.zona-pendientes .sf-l')].map((n) => n.textContent),
    separables: document.querySelectorAll('.zona-pendientes .btn-quitar').length,
  }));
  ok('AG: tres ejercicios en blanco -> tres preguntas, no siete',
    agrupado.preguntas.length === 3, `=${agrupado.preguntas.length}`);
  ok('AG: un ejercicio entero abierto por serie se pregunta una sola vez',
    /Sentadilla.*las 3 series quedaron en blanco/.test(agrupado.preguntas[0]), agrupado.preguntas[0]);
  ok('AG: si solo falta una serie, se pregunta por esa',
    /Press.*la serie 3 quedo en blanco/.test(agrupado.preguntas[1]), agrupado.preguntas[1]);
  ok('AG: un ejercicio compacto en blanco sigue siendo una pregunta',
    /Remo.*las 3 series quedaron en blanco/.test(agrupado.preguntas[2]), agrupado.preguntas[2]);
  ok('AG: solo se ofrece separar donde hay mas de una serie agrupada',
    agrupado.separables === 1, `=${agrupado.separables}`);

  // Separar cuando a cada serie le paso algo distinto.
  await p.locator('.zona-pendientes .btn-quitar').first().click();
  const separado = await p.evaluate(() =>
    [...document.querySelectorAll('.zona-pendientes .sf-l')].map((n) => n.textContent));
  ok('AG: separar abre una pregunta por serie', separado.length === 5, `=${separado.length}`);
  ok('AG: y solo del ejercicio que se separo',
    separado.filter((s) => /Sentadilla/.test(s)).length === 3
    && separado.filter((s) => /Remo/.test(s)).length === 1,
    separado.join(' / '));

  // Se responden distinto, que es para lo que sirve separarlas.
  const cajas = p.locator('.zona-pendientes .sensacion');
  await cajas.nth(0).locator('.sens-btn[data-respuesta=hecha_sin_datos]').click();
  await cajas.nth(1).locator('.sens-btn[data-respuesta=hecha_sin_datos]').click();
  await cajas.nth(2).locator('.sens-btn[data-respuesta=no_hecha]').click();
  await cajas.nth(3).locator('.sens-btn[data-respuesta=no_hecha]').click();
  await cajas.nth(4).locator('.sens-btn[data-respuesta=hecha_sin_datos]').click();
  await p.locator('#cierre .btn-emitir').nth(1).click();
  await p.waitForFunction(() => /Copiado/.test(document.querySelector('#cierre .emitir-estado').textContent));
  const e = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
  await p.close();

  const sent = e.series.filter((s) => s.ejercicio_id === 's1-a');
  ok('AGJ: el JSON guarda una respuesta por serie, no una por pregunta',
    sent.map((s) => s.realizada).join(',') === 'true,true,false',
    sent.map((s) => s.realizada).join(','));
  ok('AGJ: cada una con su motivo, no con uno comun',
    /no anoto ningun valor/i.test(sent[0].ejecutado.motivo) && /No la hizo/.test(sent[2].ejecutado.motivo),
    `${sent[0].ejecutado.motivo.slice(0, 30)} | ${sent[2].ejecutado.motivo.slice(0, 30)}`);
  const remo = e.series.filter((s) => s.ejercicio_id === 's1-c');
  ok('AGJ: una respuesta agrupada se escribe en las 3 series que cubria',
    remo.length === 3 && remo.every((s) => s.realizada === true && s.ejecutado.registrado === false));
  ok('AGJ: las 15 series siguen estando', e.series.length === 15, `=${e.series.length}`);
  ok('AGJ: y el press conserva las dos que si se registraron',
    e.series.filter((s) => s.ejercicio_id === 's1-b' && s.ejecutado.registrado).length === 2);
}

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

/* ---------- H: el historial y el formulario no se confunden ---------- */
const hitos = await page.evaluate(() => {
  const nodos = [...document.querySelectorAll('#tab-feedback .hito, #tab-feedback .card')];
  return {
    rotulos: [...document.querySelectorAll('#tab-feedback .hito-texto')].map((n) => n.textContent),
    fecha: document.querySelector('#tab-feedback .hito-fecha')?.textContent || '',
    orden: nodos.map((n) => n.classList.contains('hito')
      ? `HITO:${n.querySelector('.hito-texto').textContent}`
      : `tarjeta:${n.querySelector('h2')?.textContent || '?'}`),
    puntos: [...document.querySelectorAll('#tab-feedback .puntos li')].map((n) => n.textContent),
    parrafosLargos: [...document.querySelectorAll('#tab-feedback .card p')]
      .filter((n) => !n.classList.contains('cita') && n.textContent.length > 400).length,
  };
});
ok('H: la pestana separa el historial del formulario de hoy',
  hitos.rotulos.length === 2 && /historial/i.test(hitos.rotulos[0]) && /hoy/i.test(hitos.rotulos[1]),
  hitos.rotulos.join(' | '));
ok('H: el historial va primero y el formulario despues',
  hitos.orden.indexOf('HITO:' + hitos.rotulos[0]) === 0
  && hitos.orden.indexOf('HITO:' + hitos.rotulos[1]) === hitos.orden.length - 2,
  hitos.orden.join(' > '));
ok('H: el historial dice de cuando es', /^\d{4}-\d{2}-\d{2}$/.test(hitos.fecha), hitos.fecha);

/* ---------- L: la lectura del entrenador se puede recorrer con la vista ---------- */
ok('L: "Lo que entendi" viene en puntos', hitos.puntos.length >= 3, `=${hitos.puntos.length}`);
ok('L: ningun punto es un parrafo disfrazado', hitos.puntos.every((p) => p.length < 260),
  `mas largo=${Math.max(...hitos.puntos.map((p) => p.length))}`);
ok('L: no queda ningun muro de texto en la pestana', hitos.parrafosLargos === 0, `=${hitos.parrafosLargos}`);
ok('L: sigue diciendo que la cuarta serie no quedo registrada',
  hitos.puntos.some((p) => /cuarta serie/i.test(p) && /no la tengo registrada|no quedo registrada/i.test(p)),
  hitos.puntos.find((p) => /cuarta serie/i.test(p))?.slice(0, 70) || '(no aparece)');

/* ---------- LUMBAR: una sesion sin molestia no es una conclusion ---------- */
{
  const texto = await page.evaluate(() => document.body.innerText);
  ok('LU: no se afirma que la lumbar sea "un tema de estar sentada, no de entrenar"',
    !/no de entrenar/i.test(texto));
  ok('LU: se dice que no aparecio y que se sigue observando',
    /no aparecio durante esta sesion/i.test(texto) && /seguimos observando/i.test(texto));
}

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
    `${CASO}/devoluciones/sesion-piloto-001/1.json`,
    DEV,
    `${REPO}/app/alumno/registro-feedback.js`,
  ];
  const encontrados = [];
  for (const f of archivos) {
    const t = readFileSync(f, 'utf8').toLowerCase();
    prohibidos.forEach((p) => { if (t.includes(p.toLowerCase())) encontrados.push(`${f.split('/').pop()}:${p}`); });
  }
  ok('P8: el piloto no arrastra datos del caso real', encontrados.length === 0, encontrados.join(' '));

  const marcados = archivos.slice(0, 8).filter((f) => {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    return j.demo === true && typeof j.aviso_demo === 'string';
  });
  ok('P8: los ocho archivos del caso se declaran ficticios', marcados.length === 8, `=${marcados.length}`);
  ok('P8: y el aviso dice que la alumna no existe',
    JSON.parse(readFileSync(`${CASO}/alumno.json`, 'utf8')).aviso_demo.includes('no existe'));
}

await navegador.close();

console.log('\n============ RESULTADOS PILOTO ============');
resultados.forEach(([e, n, x]) => console.log(`${e.padEnd(5)} ${n}${x ? '  (' + x + ')' : ''}`));
console.log(`\n${resultados.filter((r) => r[0] === 'PASA').length}/${resultados.length} pruebas pasan`);
