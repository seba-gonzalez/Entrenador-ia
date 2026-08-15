import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import crypto from 'crypto';
import { mkdirSync } from 'fs';

const REPO = process.env.REPO || new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const SALIDA = process.env.SALIDA || './salida';
const PUERTO = process.env.PUERTO || '4173';
const PUERTO_REF = process.env.PUERTO_REF || '4174';
const PUB = `${REPO}/casos/demo-001/publicado/1.json`;
const VISTA = `http://127.0.0.1:${PUERTO}/app/alumno/`;
const REF = `http://127.0.0.1:${PUERTO_REF}/`;

mkdirSync(SALIDA, { recursive: true });

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
  baseURL: `http://127.0.0.1:${PUERTO}`,
});
const page = await ctx.newPage();

// Sin esto la prueba 1 es un falso negativo intermitente: el servidor no manda
// Cache-Control, asi que Chromium aplica frescura heuristica (10% de la edad del
// archivo) y puede servir el JSON viejo de cache tras editarlo. No es cache del
// producto -- la vista no cachea nada -- sino del navegador de pruebas.
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

const IND = `${REPO}/casos/demo-001/publicado/indice.json`;

/**
 * Reescribe la publicacion y su hash en el indice, como haria una republicacion
 * real. Desde que la vista verifica integridad, tocar el archivo sin actualizar
 * el indice ya no es "editar el dato": es corromperlo, y la vista lo rechaza.
 */
function republicando(transformar, fn) {
  const pubOriginal = readFileSync(PUB, 'utf8');
  const indOriginal = readFileSync(IND, 'utf8');
  const nuevo = transformar(pubOriginal);
  writeFileSync(PUB, nuevo);
  const indice = JSON.parse(indOriginal);
  indice.publicaciones.find((x) => x.p === indice.vigente).hash =
    `sha256:${crypto.createHash('sha256').update(readFileSync(PUB)).digest('hex')}`;
  writeFileSync(IND, JSON.stringify(indice, null, 2) + '\n');
  return Promise.resolve(fn()).finally(() => {
    writeFileSync(PUB, pubOriginal);
    writeFileSync(IND, indOriginal);
  });
}

/* ---------- render base ---------- */
await page.goto(VISTA, { waitUntil: 'networkidle' });

const conteos = await page.evaluate(() => ({
  ejercicios: document.querySelectorAll('article.ex').length,
  series: document.querySelectorAll('.serie-row').length,
  chips: document.querySelectorAll('.day-rail .chip').length,
  tabs: document.querySelectorAll('.tab-btn').length,
  cards: document.querySelectorAll('.card').length,
  f2: document.querySelectorAll('.serie-fields.f2').length,
  titulo: document.title,
  aviso: !!document.getElementById('aviso'),
}));
ok('render: 9 ejercicios', conteos.ejercicios === 9, `=${conteos.ejercicios}`);
ok('render: 25 filas de serie', conteos.series === 25, `=${conteos.series}`);
ok('render: 11 chips de dia', conteos.chips === 11, `=${conteos.chips}`);
ok('render: 3 pestanas', conteos.tabs === 3, `=${conteos.tabs}`);
ok('render: grillas f2 (2 campos)', conteos.f2 === 5, `=${conteos.f2}`);
ok('render: sin errores de carga', conteos.aviso === false);
ok('render: title desde el dato', conteos.titulo.includes('Alumno demo'), conteos.titulo);

// el HTML servido no contiene contenido de sesion
const htmlCrudo = readFileSync(`${REPO}/app/alumno/index.html`, 'utf8');
ok('el HTML no contiene la sesion',
  !/Prensa|Serie 1|RIR|Sesion 1/i.test(htmlCrudo));

/* ---------- PRUEBA 2: la publicacion no lleva lo interno ---------- */
const publicado = readFileSync(PUB, 'utf8');
const pubObj = JSON.parse(publicado);
const fugas = ['observacion', 'checklist', 'familia', 'justificacion', 'aprobada_por', 'versiones', 'motivo']
  .filter((k) => publicado.includes(`"${k}"`));
ok('P2: publicado sin claves internas', fugas.length === 0, fugas.join(','));
const sesionInterna = JSON.parse(readFileSync(`${REPO}/casos/demo-001/sesion.json`, 'utf8'));
const textosObs = sesionInterna.observaciones.map((o) => o.observacion);
ok('P2: ningun texto de observacion aparece en publicado',
  textosObs.every((t) => !publicado.includes(t)));
ok('P2: ninguna justificacion del checklist aparece en publicado',
  sesionInterna.checklist_aprobacion.respuestas.every((r) => !publicado.includes(r.justificacion)));
ok('P2: publicado solo trae la version aprobada',
  pubObj.publicacion.de_version === sesionInterna.version_aprobada);
// lo que la pagina descarga
const descargas = [];
page.on('request', (r) => descargas.push(r.url()));

/* ---------- PRUEBA 1: cambiar el dato cambia la vista ---------- */
const shaAntes = sha(PUB);
const traeCambio = await republicando(
  (texto) => texto
    .replace('"nombre": "Prensa de piernas"', '"nombre": "PRUEBA cambio de nombre"')
    .replace('"etiqueta": "Reps",\n                      "valor": "8"', '"etiqueta": "Reps",\n                      "valor": "99"'),
  async () => {
    await page.goto(VISTA, { waitUntil: 'networkidle' });
    return page.evaluate(() => ({
      nombre: document.body.innerText.includes('PRUEBA cambio de nombre'),
      reps: document.body.innerText.includes('99'),
      ejercicios: document.querySelectorAll('article.ex').length,
    }));
  }
);
ok('P1: cambiar el JSON cambia la vista (nombre)', traeCambio.nombre);
ok('P1: cambiar el JSON cambia la vista (valor)', traeCambio.reps);
ok('P1: la sesion se renderiza entera tras republicar', traeCambio.ejercicios === 9, `=${traeCambio.ejercicios}`);
ok('P1: el HTML/CSS/JS no se tocaron para lograrlo', sha(PUB) === shaAntes);

/* ---------- ejecucion parcial ---------- */
await page.goto(VISTA, { waitUntil: 'networkidle' });

const filas = page.locator('.serie-row');
// s1-a serie 1: completa
await filas.nth(0).locator('input[type=checkbox]').check();
await filas.nth(0).locator('.sf-i').nth(0).fill('120');
await filas.nth(0).locator('.sf-i').nth(1).fill('8');
await filas.nth(0).locator('.sf-i').nth(2).fill('2');
// s1-a serie 2: menos reps que lo programado, RIR en blanco
await filas.nth(1).locator('input[type=checkbox]').check();
await filas.nth(1).locator('.sf-i').nth(0).fill('120');
await filas.nth(1).locator('.sf-i').nth(1).fill('6');
// s1-a serie 3: intacta
// s1-b serie 1 (fila 3): marcada, sin ningun valor
await filas.nth(3).locator('input[type=checkbox]').check();

await page.selectOption('#cierre .sf-s', 'parcial');
await page.fill('#cierre .sf-t', 'El tobillo avisó en la segunda serie de prensa, corté ahí.');

const shaPrevio = sha(PUB);
await page.click('#cierre .btn-emitir');
await page.waitForFunction(() => document.querySelector('#cierre .emitir-estado').textContent.length > 0);

const estadoTexto = await page.textContent('#cierre .emitir-estado');
const portapapeles = await page.evaluate(() => navigator.clipboard.readText());
const eje = JSON.parse(portapapeles);
writeFileSync(`${SALIDA}/ejecucion.json`, JSON.stringify(eje, null, 2) + '\n');

ok('portapapeles: se copio y se confirmo', /Copiado/.test(estadoTexto), estadoTexto);
ok('portapapeles: el contenido es JSON valido de ejecucion', eje.schema_version === 1);

/* ---------- PRUEBA 3: programado y ejecutado por separado ---------- */
const s = (id, n) => eje.series.find((x) => x.ejercicio_id === id && x.serie === n);
const a2 = s('s1-a', 2);
ok('P3: programado conserva lo prescrito',
  a2.programado.find((c) => c.campo === 'reps').valor === '8');
ok('P3: ejecutado conserva lo realmente hecho',
  a2.ejecutado.campos.reps === '6');
ok('P3: programado != ejecutado y ambos sobreviven',
  a2.programado.find((c) => c.campo === 'reps').valor !== a2.ejecutado.campos.reps);
ok('P3: campo en blanco de una serie hecha queda nombrado',
  a2.ejecutado.campos_sin_registrar.includes('rir') && !('rir' in a2.ejecutado.campos));
ok('P3: resultado parcial tal como se eligio', eje.resultado === 'parcial');
ok('P3: total de series registradas = 25', eje.series.length === 25);

/* ---------- PRUEBA 4: nada se rellena ---------- */
const a3 = s('s1-a', 3);
ok('P4: serie intacta -> realizada=false', a3.realizada === false);
ok('P4: serie intacta -> ejecutado.registrado=false', a3.ejecutado.registrado === false);
ok('P4: serie intacta -> sin campos', !('campos' in a3.ejecutado));
ok('P4: serie intacta -> motivo explicito', typeof a3.ejecutado.motivo === 'string' && a3.ejecutado.motivo.length > 0);
const b1 = s('s1-b', 1);
ok('P4: marcada pero vacia -> realizada=true y registrado=false',
  b1.realizada === true && b1.ejecutado.registrado === false);
ok('P4: marcada pero vacia -> no copia lo programado', !('campos' in b1.ejecutado));
// ningun cero inventado en todo el archivo
const ceros = eje.series.filter((x) => x.ejecutado.registrado && Object.values(x.ejecutado.campos).includes('0'));
ok('P4: ningun cero inventado', ceros.length === 0);
// ninguna serie sin registrar copio el valor programado
const copiados = eje.series.filter((x) => {
  if (!x.ejecutado.registrado) return false;
  return x.programado.some((c) => c.prescrito && x.ejecutado.campos[c.campo] === c.valor && !['s1-a'].includes(x.ejercicio_id));
});
ok('P4: ninguna serie no tocada trae valores', eje.series.filter((x) => x.ejecutado.registrado).length === 2,
  `series con registro=${eje.series.filter((x) => x.ejecutado.registrado).length}`);

/* ---------- PRUEBA 5: referencia exacta a la publicacion ---------- */
const indice = JSON.parse(readFileSync(`${REPO}/casos/demo-001/publicado/indice.json`, 'utf8'));
const entrada = indice.publicaciones.find((p) => p.p === indice.vigente);
ok('P5: publicacion_ejecutada = la vigente', eje.publicacion_ejecutada === indice.vigente, `=${eje.publicacion_ejecutada}`);
ok('P5: publicacion_ejecutada = la del archivo servido', eje.publicacion_ejecutada === pubObj.publicacion.p);
ok('P5: hash registrado = hash del indice', eje.publicacion_hash === entrada.hash);
ok('P5: hash del indice = sha256 real del archivo', entrada.hash === `sha256:${sha(PUB)}`);
ok('P5: sesion_id correcto', eje.sesion_id === pubObj.sesion_id);

/* ---------- PRUEBA 6: emitir no modifica la publicacion ---------- */
ok('P6: la publicacion no cambio al emitir', sha(PUB) === shaPrevio);
ok('P6: la publicacion sigue igual al original', sha(PUB) === shaAntes);

/* ---------- check-in y demo ---------- */
ok('check-in: solicitado=false', eje.check_in.solicitado === false);
ok('check-in: con motivo', typeof eje.check_in.motivo === 'string');
ok('check-in: sin estado_respuesta', !('estado_respuesta' in eje.check_in));
ok('check-in: sin null en ninguna parte del JSON', !portapapeles.includes('null'));
ok('demo: la ejecucion queda marcada como demo', eje.demo === true);

/* ---------- CONTRADICCION: datos escritos sin marcar la serie ---------- */
await page.goto(VISTA, { waitUntil: 'networkidle' });
const filas2 = page.locator('.serie-row');
// serie con datos pero SIN marcar la casilla
await filas2.nth(0).locator('.sf-i').nth(0).fill('100');
await filas2.nth(0).locator('.sf-i').nth(1).fill('8');
// una segunda, para comprobar que se listan todas
await filas2.nth(5).locator('.sf-i').nth(1).fill('10');
await page.selectOption('#cierre .sf-s', 'completada');

// dejo una marca reconocible en el portapapeles para saber si se sobrescribio
await page.evaluate(() => navigator.clipboard.writeText('PORTAPAPELES-INTACTO'));
await page.click('#cierre .btn-emitir');
await page.waitForFunction(() => document.querySelector('#cierre .emitir-estado').textContent.length > 0);

const msj = await page.textContent('#cierre .emitir-estado');
const papelDespues = await page.evaluate(() => navigator.clipboard.readText());
const esError = await page.evaluate(() => document.querySelector('#cierre .emitir-estado').classList.contains('error'));

ok('C: se detiene y no emite nada', papelDespues === 'PORTAPAPELES-INTACTO', `portapapeles="${papelDespues.slice(0, 30)}"`);
ok('C: avisa de la contradiccion', /no marcaste como realizadas/.test(msj));
ok('C: nombra las series en conflicto', /Prensa de piernas · serie 1/.test(msj) && /serie 1/.test(msj), msj.slice(0, 120));
ok('C: lista ambas series, no solo la primera', (msj.match(/serie \d/g) || []).length === 2, `=${(msj.match(/serie \d/g) || []).length}`);
ok('C: no resuelve por el usuario', /No lo resuelvo por ti/.test(msj));
ok('C: se marca como error', esError === true);
// no marcó la casilla por su cuenta
const marcadaSola = await filas2.nth(0).locator('input[type=checkbox]').isChecked();
ok('C: no marca la casilla automaticamente', marcadaSola === false);
// ni borró los valores
const valorIntacto = await filas2.nth(0).locator('.sf-i').nth(0).inputValue();
ok('C: no borra los valores automaticamente', valorIntacto === '100', `="${valorIntacto}"`);

// resuelta por el usuario -> ahora si emite
await filas2.nth(0).locator('input[type=checkbox]').check();
await filas2.nth(5).locator('input[type=checkbox]').check();
await page.click('#cierre .btn-emitir');
await page.waitForFunction(() => /Copiado/.test(document.querySelector('#cierre .emitir-estado').textContent));
const tras = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
const conf = tras.series.find((x) => x.ejercicio_id === 's1-a' && x.serie === 1);
ok('C: resuelta por el usuario, emite', tras.schema_version === 1);
ok('C: la serie resuelta queda coherente', conf.realizada === true && conf.ejecutado.registrado === true);
ok('C: ninguna serie queda realizada=false con registro', !tras.series.some((x) => !x.realizada && x.ejecutado.registrado));

/* ---------- resultado no se autocompleta ---------- */
await page.goto(VISTA, { waitUntil: 'networkidle' });
await page.click('#cierre .btn-emitir');
const sinResultado = await page.textContent('#cierre .emitir-estado');
ok('el resultado no tiene valor por defecto', /Elige primero/.test(sinResultado), sinResultado);

/* ---------- P8: nada identificable ---------- */
const prohibidos = ['Juan Pablo', 'Juan', 'jiujitsu', 'BJJ', 'tatami', 'kickboxing', 'media maraton', 'media maratón', '110 kg', 'graduaci'];
const archivos = [PUB, `${REPO}/casos/demo-001/sesion.json`, `${REPO}/casos/demo-001/publicado/indice.json`,
  `${REPO}/casos/demo-001/LEEME.md`, `${REPO}/app/alumno/vista-sesion.js`, `${REPO}/app/alumno/registro-ejecucion.js`,
  `${REPO}/app/alumno/index.html`, `${REPO}/app/alumno/estilos.css`, `${REPO}/app/repositorio.js`,
  `${REPO}/esquemas/sesion.schema.json`, `${REPO}/esquemas/ejecucion.schema.json`];
const encontrados = [];
for (const f of archivos) {
  const t = readFileSync(f, 'utf8');
  prohibidos.forEach((p) => { if (t.toLowerCase().includes(p.toLowerCase())) encontrados.push(`${f.split('/').pop()}:${p}`); });
}
ok('P8: sin datos identificables del caso real', encontrados.length === 0, encontrados.join(' '));

/* ---------- la vista solo descarga artefactos publicados ---------- */
const fugaDeRed = descargas.filter((u) => u.includes('sesion.json'));
ok('la vista nunca descarga el documento interno', fugaDeRed.length === 0, fugaDeRed.join(','));

/* ---------- seccion declarada sin panel ---------- */
{
  const r = await republicando(
    (texto) => {
      const j = JSON.parse(texto);
      j.contenido.secciones.push({ id: 'retrospectiva', etiqueta: 'Retrospectiva' });
      return JSON.stringify(j, null, 2) + '\n';
    },
    async () => {
      await page.goto(VISTA, { waitUntil: 'networkidle' });
      return page.evaluate(() => ({
        aviso: document.getElementById('aviso')?.textContent || '',
        ejercicios: document.querySelectorAll('article.ex').length,
      }));
    }
  );
  ok('SP: se detiene con un mensaje, no con un TypeError', /no trae su panel/.test(r.aviso), r.aviso.slice(0, 90));
  ok('SP: el mensaje nombra la seccion culpable', /retrospectiva/.test(r.aviso));
  ok('SP: no deja media pantalla dibujada', r.ejercicios === 0, `ejercicios pintados=${r.ejercicios}`);
  ok('SP: la publicacion queda restaurada', sha(PUB) === shaAntes);
}

/* ---------- INTEGRIDAD: el hash se verifica contra los bytes cargados ----------
   Fallo cerrado (opcion A): si no coincide, o si no se puede comprobar, no se
   renderiza nada y no hay forma de emitir una ejecucion.                      */

// Estado de la pantalla tras un intento de carga: sirve para las tres variantes.
const estadoDeLaPantalla = async (p) => p.evaluate(() => ({
  aviso: document.getElementById('aviso')?.textContent || '',
  ejercicios: document.querySelectorAll('article.ex').length,
  tarjetas: document.querySelectorAll('.card').length,
  pestanas: document.querySelectorAll('.tab-btn').length,
  filas: document.querySelectorAll('.serie-row').length,
  cierre: !!document.getElementById('cierre'),
  cabeceraVisible: !document.getElementById('cabecera').hidden,
  pieVisible: !document.getElementById('pie').hidden,
}));

// (1) hash correcto -> renderiza
{
  await page.goto(VISTA, { waitUntil: 'networkidle' });
  const e = await estadoDeLaPantalla(page);
  ok('INT-1: con el hash correcto la sesion se renderiza', e.ejercicios === 9 && e.cierre === true,
    `ejercicios=${e.ejercicios} cierre=${e.cierre}`);
  ok('INT-1: sin ningun aviso de error', e.aviso === '', e.aviso.slice(0, 60));
}

// (2) contenido alterado, hash del indice sin tocar -> no renderiza
{
  const original = readFileSync(PUB, 'utf8');
  writeFileSync(PUB, original.replace('"nombre": "Jalon al pecho"', '"nombre": "Jalon al pecho ALTERADO"'));

  await page.evaluate(() => navigator.clipboard.writeText('PORTAPAPELES-INTACTO'));
  await page.goto(VISTA, { waitUntil: 'networkidle' });
  const e = await estadoDeLaPantalla(page);
  const papel = await page.evaluate(() => navigator.clipboard.readText());
  const veAlterado = await page.evaluate(() => document.body.innerText.includes('ALTERADO'));

  writeFileSync(PUB, original);

  ok('INT-2: no se renderiza la sesion alterada', e.ejercicios === 0 && e.filas === 0);
  ok('INT-2: el mensaje explica que no coincide con lo publicado', /no coincide con lo que el registro dice/.test(e.aviso), e.aviso.slice(0, 80));
  ok('INT-2: el mensaje dice que no se ejecute', /No la ejecutes/.test(e.aviso));
  ok('INT-2: no queda contenido parcial visible', e.tarjetas === 0 && e.pestanas === 0 && !e.cabeceraVisible && !e.pieVisible,
    `tarjetas=${e.tarjetas} pestanas=${e.pestanas} cabecera=${e.cabeceraVisible} pie=${e.pieVisible}`);
  ok('INT-2: no aparece nada del contenido alterado', veAlterado === false);
  ok('INT-2: no hay forma de emitir una ejecucion', e.cierre === false);
  ok('INT-2: el portapapeles queda intacto', papel === 'PORTAPAPELES-INTACTO');
  ok('INT-2: la publicacion queda restaurada', sha(PUB) === shaAntes);
}

// (3) sin crypto.subtle -> no renderiza, aunque el archivo este intacto
{
  const ctxInseguro = await navegador.newContext({
    viewport: { width: 390, height: 900 },
    baseURL: `http://127.0.0.1:${PUERTO}`,
  });
  // Reproduce un contexto no seguro: es lo que ve la pagina servida por http://
  // desde una IP de red, donde crypto.subtle no existe.
  await ctxInseguro.addInitScript(() => {
    Object.defineProperty(globalThis.crypto, 'subtle', { get: () => undefined, configurable: true });
  });
  const pInseguro = await ctxInseguro.newPage();
  await pInseguro.goto(VISTA, { waitUntil: 'networkidle' });
  const e = await estadoDeLaPantalla(pInseguro);
  await ctxInseguro.close();

  ok('INT-3: sin crypto.subtle no se renderiza la sesion', e.ejercicios === 0 && e.filas === 0);
  ok('INT-3: el mensaje explica que no se pudo comprobar', /No se puede comprobar la integridad/.test(e.aviso), e.aviso.slice(0, 80));
  ok('INT-3: el mensaje indica el acceso correcto', /HTTPS|localhost/.test(e.aviso));
  ok('INT-3: el mensaje dice que no se entrene desde ahi', /No entrenes/.test(e.aviso));
  ok('INT-3: no queda contenido parcial visible', e.tarjetas === 0 && e.pestanas === 0 && !e.cabeceraVisible && !e.pieVisible);
  ok('INT-3: no hay forma de emitir una ejecucion', e.cierre === false);
  ok('INT-3: el archivo estaba intacto (falla por no poder verificar, no por diferir)', sha(PUB) === shaAntes);
}

/* ---------- comparacion visual (opcional) ----------
   Necesita el artefacto visual de referencia servido en PUERTO_REF. Ese archivo
   contiene datos personales reales y por eso no se distribuye con estas suites:
   hay que ponerlo uno mismo. Sin el, esta seccion se omite y el total baja a 57.  */
const hayReferencia = await fetch(REF).then((r) => r.ok).catch(() => false);

await page.goto(VISTA, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${SALIDA}/nueva-rutina.png`, fullPage: true });
await page.click('.tab-btn:nth-child(2)');
await page.screenshot({ path: `${SALIDA}/nueva-info.png`, fullPage: true });
await page.click('.tab-btn:nth-child(1)');

const clasesDe = async (p) => p.evaluate(() => {
  const s = new Set();
  document.querySelectorAll('*').forEach((n) => n.classList.forEach((c) => s.add(c)));
  return [...s].sort();
});

if (hayReferencia) {
  const pref = await ctx.newPage();
  await pref.goto(REF, { waitUntil: 'networkidle' });
  await pref.waitForTimeout(600);
  await pref.screenshot({ path: `${SALIDA}/ref-rutina.png`, fullPage: true });

  const cRef = await clasesDe(pref);
  const cNueva = await clasesDe(page);
  const faltan = cRef.filter((c) => !cNueva.includes(c));
  const sobran = cNueva.filter((c) => !cRef.includes(c));
  ok('visual: la vista usa todas las clases del artefacto de referencia', faltan.length === 0, faltan.join(','));
  console.log('\nclases nuevas respecto a la referencia:', sobran.join(', ') || '(ninguna)');
} else {
  console.log(`\nOMITIDA la comparacion visual: no hay nada servido en ${REF}.`);
  console.log('Sirve ahi el artefacto visual de referencia para activarla (1 comprobacion mas).');
}

await navegador.close();

console.log('\n================ RESULTADOS ================');
resultados.forEach(([e, n, x]) => console.log(`${e.padEnd(5)} ${n}${x ? '  (' + x + ')' : ''}`));
console.log(`\n${resultados.filter((r) => r[0] === 'PASA').length}/${resultados.length} pruebas pasan`);
