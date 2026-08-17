/**
 * Los contratos que el piloto anadio: ficha de alumno, feedback y devolucion,
 * mas la regla de estado que el borrador de la sesion 2 ejercita.
 *
 * Las pruebas se escriben contra los archivos reales del caso, no contra
 * ejemplos inventados aqui: si el caso deja de valer, esto tiene que romperse.
 */

import Ajv from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const R = process.env.REPO || new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const ajv = new Ajv({ allErrors: true, strict: false });

const esquema = (n) => ajv.compile(JSON.parse(readFileSync(`${R}/esquemas/${n}.schema.json`, 'utf8')));
const caso = (ruta) => JSON.parse(readFileSync(`${R}/casos/piloto-001/${ruta}`, 'utf8'));

const validarAlumno = esquema('alumno');
const validarFeedback = esquema('feedback');
const validarDevolucion = esquema('devolucion');
const validarSesion = esquema('sesion');
const validarEjecucion = esquema('ejecucion');

const alumno = caso('alumno.json');
const feedback = caso('feedback/sesion-piloto-001.json');
const devolucion = caso('devoluciones/sesion-piloto-001/1.json');
const devolucion2 = caso('devoluciones/sesion-piloto-001/2.json');
const sesion1 = caso('sesiones/sesion-piloto-001.json');
const sesion2 = caso('sesiones/sesion-piloto-002.json');

const ejecucion = caso('ejecuciones/sesion-piloto-001.json');

const clon = (o) => JSON.parse(JSON.stringify(o));

/** Una cuarta serie de sentadilla que no estaba en la publicacion. */
const serieAnadida = () => ({
  ejercicio_id: 's1-a',
  ejercicio_nombre: 'Sentadilla con barra',
  serie: 4,
  realizada: true,
  anadida_en_ejecucion: true,
  programado: [
    { campo: 'carga', etiqueta: 'Carga', prescrito: false, motivo_no_prescrito: 'no estaba programada' },
    { campo: 'reps', etiqueta: 'Reps', prescrito: false, motivo_no_prescrito: 'no estaba programada' },
    { campo: 'rir', etiqueta: 'RIR real', prescrito: false, motivo_no_prescrito: 'no estaba programada' },
  ],
  ejecutado: { registrado: true, campos: { carga: '70', reps: '8', rir: '2' }, campos_sin_registrar: [] },
  motivo_diferencia: { registrado: false, motivo: 'Esta vista no captura un motivo por serie.' },
});
const con = (base, cambiar) => { const c = clon(base); cambiar(c); return c; };

const pruebas = [
  // --- ficha de alumno: lo desconocido no se rellena ---
  [validarAlumno, 'acepta la ficha real de la alumna', alumno, true],
  [validarAlumno, 'rechaza un desconocido que trae valor', con(alumno, (a) => {
    a.campos.carga_sentadilla = { estado: 'desconocido', por_que_se_desconoce: 'x', valor: '70 kg' };
  }), false],
  [validarAlumno, 'rechaza un desconocido sin decir que falta para saberlo', con(alumno, (a) => {
    a.campos.carga_sentadilla = { estado: 'desconocido' };
  }), false],
  [validarAlumno, 'rechaza un confirmado sin fuente', con(alumno, (a) => {
    a.campos.objetivo = { valor: 'volver a entrenar', estado: 'confirmado' };
  }), false],
  [validarAlumno, 'rechaza un confirmado con valor nulo', con(alumno, (a) => {
    a.campos.objetivo = { valor: null, estado: 'confirmado', fuente: 'onboarding' };
  }), false],
  [validarAlumno, 'rechaza un estado que no existe', con(alumno, (a) => {
    a.campos.objetivo.estado = 'probable';
  }), false],

  // --- feedback: no responder es un dato, no un silencio ---
  [validarFeedback, 'acepta el feedback real emitido por la vista', feedback, true],
  [validarFeedback, 'rechaza sin_respuesta con contenido', con(feedback, (f) => {
    f.estado_respuesta = 'sin_respuesta';
  }), false],
  [validarFeedback, 'acepta sin_respuesta cuando no hay contenido', con(feedback, (f) => {
    f.estado_respuesta = 'sin_respuesta'; delete f.contenido;
  }), true],
  [validarFeedback, 'rechaza respondido sin contenido', con(feedback, (f) => {
    delete f.contenido;
  }), false],
  [validarFeedback, 'rechaza una respuesta que perdio la pregunta', con(feedback, (f) => {
    delete f.contenido.respuestas[0].pregunta;
  }), false],
  [validarFeedback, 'rechaza una respuesta en blanco sin motivo', con(feedback, (f) => {
    f.contenido.respuestas[0].respuesta = { registrado: false };
  }), false],
  [validarFeedback, 'rechaza una respuesta que esta registrada y vacia a la vez', con(feedback, (f) => {
    f.contenido.respuestas[0].respuesta = { registrado: true, texto: '' };
  }), false],

  // --- devolucion: la interpretacion no puede disfrazarse de hecho ---
  [validarDevolucion, 'acepta la devolucion real publicada', devolucion, true],
  [validarDevolucion, 'acepta la devolucion corregida, escrita en puntos', devolucion2, true],
  [validarDevolucion, 'rechaza una lectura que no dice nada, ni texto ni puntos', con(devolucion2, (d) => {
    delete d.contenido.entendido.puntos;
  }), false],
  [validarDevolucion, 'rechaza un punto de la lectura sin texto', con(devolucion2, (d) => {
    d.contenido.entendido.puntos[0] = { destacado: 'Solo el titular:' };
  }), false],
  [validarDevolucion, 'rechaza declarar la lectura del entrenador como no interpretacion', con(devolucion, (d) => {
    d.contenido.entendido.es_interpretacion = false;
  }), false],
  [validarDevolucion, 'rechaza omitir que la lectura es una interpretacion', con(devolucion, (d) => {
    delete d.contenido.entendido.es_interpretacion;
  }), false],
  [validarDevolucion, 'rechaza una cita del alumno sin decir de donde sale', con(devolucion, (d) => {
    delete d.contenido.dijo.fuente;
  }), false],
  [validarDevolucion, 'rechaza una referencia sin respaldo en una ejecucion', con(devolucion, (d) => {
    delete d.contenido.referencias[0].derivado_de;
  }), false],
  [validarDevolucion, 'rechaza una referencia que no nombra el ejercicio', con(devolucion, (d) => {
    delete d.contenido.referencias[0].derivado_de.ejercicio_id;
  }), false],
  [validarDevolucion, 'rechaza un punto que no dice si es decision o algo a observar', con(devolucion, (d) => {
    delete d.contenido.para_la_proxima[0].tipo;
  }), false],
  [validarDevolucion, 'rechaza una percepcion fuera de las cuatro', con(devolucion, (d) => {
    d.contenido.dijo.sensaciones[0].percepcion = 'regular';
  }), false],

  // --- serie anadida durante la ejecucion ---
  [validarEjecucion, 'acepta una serie anadida sin nada prescrito', con(ejecucion, (e) => {
    e.series.push(serieAnadida());
  }), true],
  [validarEjecucion, 'rechaza una serie anadida que dice traer algo prescrito', con(ejecucion, (e) => {
    const s = serieAnadida();
    s.programado[0] = { campo: 'carga', etiqueta: 'Carga', prescrito: true, valor: '70 kg' };
    e.series.push(s);
  }), false],
  [validarEjecucion, 'rechaza una serie anadida sin decir por que no habia nada prescrito', con(ejecucion, (e) => {
    const s = serieAnadida();
    delete s.programado[0].motivo_no_prescrito;
    e.series.push(s);
  }), false],
  [validarEjecucion, 'rechaza declarar anadida_en_ejecucion en false', con(ejecucion, (e) => {
    e.series[0].anadida_en_ejecucion = false;
  }), false],

  // --- como se capturo cada serie, y el margen ---
  [validarEjecucion, 'acepta declarar que una serie se anoto en conjunto', con(ejecucion, (e) => {
    e.series.forEach((s) => { s.capturado = 'en_conjunto'; });
  }), true],
  [validarEjecucion, 'acepta declarar que se anoto serie a serie', con(ejecucion, (e) => {
    e.series.forEach((s) => { s.capturado = 'por_serie'; });
  }), true],
  [validarEjecucion, 'rechaza una forma de captura que no existe', con(ejecucion, (e) => {
    e.series[0].capturado = 'de_memoria';
  }), false],
  [validarEjecucion, 'acepta el margen copiado en una serie anadida', con(ejecucion, (e) => {
    const s = serieAnadida();
    s.margen_declarado = 'Puedes anadir 1 serie si terminas muy facil.';
    e.series.push(s);
  }), true],
  [validarEjecucion, 'rechaza un margen vacio', con(ejecucion, (e) => {
    const s = serieAnadida();
    s.margen_declarado = '';
    e.series.push(s);
  }), false],

  // --- sesiones del piloto: bloques, preguntas respondibles y estado borrador ---
  [validarSesion, 'acepta la sesion 1 publicada', sesion1, true],
  [validarSesion, 'acepta el borrador de la sesion 2', sesion2, true],
  [validarSesion, 'acepta una tarjeta de programa con su porque plegado', sesion2, true],
  [validarSesion, 'acepta un margen de series extra escrito por el entrenador', sesion2, true],
  [validarSesion, 'rechaza un margen sin texto', con(sesion2, (s) => {
    const ses = s.versiones[0].contenido.paneles.rutina.tarjetas.find((x) => x.tipo === 'sesion');
    ses.ejercicios[0].margen = {};
  }), false],
  [validarSesion, 'rechaza un margen con un numero que el codigo tendria que evaluar', con(sesion2, (s) => {
    const ses = s.versiones[0].contenido.paneles.rutina.tarjetas.find((x) => x.tipo === 'sesion');
    ses.ejercicios[0].margen = { texto: 'una serie', series_extra: 1 };
  }), false],
  [validarSesion, 'rechaza un plegable sin resumen', con(sesion2, (s) => {
    const t2 = s.versiones[0].contenido.paneles.rutina.tarjetas.find((x) => x.id === 'aproximacion');
    delete t2.detalles[0].resumen;
  }), false],
  [validarSesion, 'rechaza un borrador que ya trae version aprobada', con(sesion2, (s) => {
    s.version_aprobada = 1;
  }), false],
  [validarSesion, 'rechaza un borrador que ya trae publicaciones', con(sesion2, (s) => {
    s.publicaciones = [{ p: 1, de_version: 1, fecha: '2027-04-09T09:00:00-04:00', hash: `sha256:${'0'.repeat(64)}`, vigente: true }];
  }), false],
  [validarSesion, 'rechaza un borrador que ya trae checklist de aprobacion', con(sesion2, (s) => {
    s.checklist_aprobacion = clon(sesion1.checklist_aprobacion);
  }), false],
  [validarSesion, 'rechaza un bloque sin etiqueta', con(sesion2, (s) => {
    const t2 = s.versiones[0].contenido.paneles.rutina.tarjetas.find((x) => x.tipo === 'sesion');
    delete t2.bloques[0].etiqueta;
  }), false],
  [validarSesion, 'rechaza preguntas respondibles escritas como texto suelto', con(sesion1, (s) => {
    s.versiones[1].contenido.paneles.feedback.tarjetas[0].items = ['¿Como te fue?'];
  }), false],
  [validarSesion, 'rechaza una pregunta respondible sin id', con(sesion1, (s) => {
    delete s.versiones[1].contenido.paneles.feedback.tarjetas[0].items[0].id;
  }), false],
  [validarSesion, 'acepta preguntas no respondibles como texto suelto', con(sesion1, (s) => {
    const t = s.versiones[1].contenido.paneles.feedback.tarjetas[0];
    delete t.respondible;
    t.items = ['¿Como te fue?'];
  }), true],
];

let mal = 0;
for (const [validar, nombre, dato, esperado] of pruebas) {
  const ok = validar(dato);
  const bien = ok === esperado;
  if (!bien) {
    mal += 1;
    console.log(`FALLA ${nombre} -> ${ok ? 'valida' : 'rechaza'} (esperado ${esperado ? 'valida' : 'rechaza'})`);
  } else {
    console.log(`PASA  ${nombre} -> ${ok ? 'valida' : 'rechaza'}`);
  }
}
console.log(mal === 0 ? `\n${pruebas.length}/${pruebas.length} correctas` : `\n${mal} incorrectas`);
process.exitCode = mal === 0 ? 0 : 1;
