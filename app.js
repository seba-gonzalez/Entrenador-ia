const screens = ['welcome', 'profile', 'summary', 'pending', 'plan'];
const labels = ['Bienvenida', 'Conocerte', 'Confirmar', 'Aclarar', 'Tu propuesta'];
const $ = (selector) => document.querySelector(selector);
const value = (id) => document.getElementById(id).value.trim();
let profile = {};

function showScreen(name) { const index=screens.indexOf(name); document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name)); $('#stepLabel').textContent=labels[index]; $('#stepCount').textContent=`${index+1} de ${screens.length}`; window.scrollTo({top:0,behavior:'smooth'}); sessionStorage.setItem('entrenador-screen',name); }
function collectProfile(){const checkedDays=document.querySelector('input[name="days"]:checked');return{goal:value('goal'),experience:value('experience'),days:checkedDays?.value||'',duration:value('duration'),equipment:value('equipment'),preferences:value('preferences'),likes:value('likes'),dislikes:value('dislikes'),limitations:value('limitations'),extra:value('extra')}}
function validateProfile(){let valid=true;[['goal',value('goal')],['experience',value('experience')],['days',document.querySelector('input[name="days"]:checked')]].forEach(([id,answer])=>{const field=document.getElementById(id).closest('.question');field.classList.toggle('invalid',!answer);if(!answer)valid=false});if(!valid)document.querySelector('.invalid').scrollIntoView({behavior:'smooth',block:'center'});return valid}

// Estado manual para validar ambos recorridos sin fingir una decisión de IA.
const clarificationPrototype = {
  needsClarification: false,
  question: '¿Hay algún día o momento de la semana en el que entrenar te resulte especialmente difícil?',
  placeholder: 'Cuéntame brevemente qué suele interponerse…'
};

// Lectura editorial fija: valida el contenedor y no concatena las respuestas.
const manualCoachReading = [
  'Lo que me cuentas dibuja a una persona que no busca simplemente completar entrenamientos, sino encontrar una forma de avanzar que pueda convivir con su vida. Antes de pensar en ejercicios concretos, quiero que construyamos una base que se sienta posible, clara y suficientemente flexible.',
  'La primera propuesta no intentará demostrar todo lo que puedes hacer desde el primer día. Nos servirá para conocerte en movimiento: ver qué ritmos te resultan sostenibles, dónde aparece confianza y qué situaciones necesitan más margen o una alternativa diferente.',
  'A partir de ahí, cada sesión aportará información. El esfuerzo percibido, tus sensaciones, el cumplimiento real y cualquier molestia nos ayudarán a decidir el siguiente paso. La rutina es una primera hipótesis; el acompañamiento y la capacidad de adaptarla son el verdadero proceso.'
];

function buildTechnicalProfile() {
  return {
    goal: profile.goal,
    experience: profile.experience,
    availability: `${profile.days} días por semana · ${profile.duration} por sesión`,
    equipment: profile.equipment || 'Pendiente de confirmar',
    preferences: [profile.preferences, profile.likes, profile.dislikes && `Prefiere evitar: ${profile.dislikes}`].filter(Boolean).join(' · ') || 'Pendientes de conocer',
    constraints: profile.limitations || 'Ninguna indicada',
    mainBarrier: null,
    supportingResources: null,
    uncertainties: 'pending',
    missingInformation: 'pending'
  };
}

function renderSummary() {
  const technicalProfile = buildTechnicalProfile();
  const cards = [
    ['◎', 'Objetivo', technicalProfile.goal],
    ['↗', 'Experiencia', technicalProfile.experience],
    ['◷', 'Disponibilidad', technicalProfile.availability],
    ['◇', 'Equipamiento', technicalProfile.equipment],
    ['♡', 'Preferencias', technicalProfile.preferences],
    ['+', 'Cosas a cuidar', technicalProfile.constraints]
  ];
  $('#coachReading').innerHTML = manualCoachReading.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  $('#summaryCards').innerHTML = cards.map(([icon,title,text]) => `<article class="summary-card"><span class="icon">${icon}</span><small>${title}</small><p>${escapeHtml(text)}</p></article>`).join('');
}

function preparePending() {
  $('#pendingForm').hidden = !clarificationPrototype.needsClarification;
  $('#enoughInformation').hidden = clarificationPrototype.needsClarification;
  $('#pendingIntro').textContent = clarificationPrototype.needsClarification
    ? 'Solo necesito entender un detalle importante antes de preparar la propuesta.'
    : 'No hace falta preguntar por preguntar. Podemos avanzar y seguir aprendiendo durante el proceso.';
  $('#pendingQuestion').textContent = clarificationPrototype.question;
  $('#pendingAnswer').placeholder = clarificationPrototype.placeholder;
  $('#enoughInformation [data-prepare-plan]').onclick = () => {
    renderPlan();
    showScreen('plan');
  };
}

const blocks=[{name:'Calentamiento',time:'8 min',exercises:[['Respiración y movilidad articular','2 rondas','Sin prisa','Movimientos cómodos y progresivos'],['Sentadilla a banco + alcance','8 repeticiones','RPE 3','Controla la bajada']]},{name:'Fuerza principal',time:'24 min',exercises:[['Sentadilla goblet o a banco','3 × 8','90 s · RPE 7','Termina con 3 repeticiones posibles'],['Remo con mancuerna o banda','3 × 10/lado','75 s · RPE 7','Hombro lejos de la oreja'],['Peso muerto rumano','3 × 8','90 s · RPE 6–7','Cadera atrás, espalda estable']]},{name:'Transferencia y potencia',time:'6 min',exercises:[['Lanzamiento de balón o subida rápida','4 × 5','60 s · RPE 6','Rápido, siempre con control']]},{name:'Acondicionamiento',time:'6 min',exercises:[['Bici, caminata con pendiente o marcha','6 × 30/30 s','RPE 7','Ritmo vivo / ritmo suave']]},{name:'Vuelta a la calma',time:'4 min',exercises:[['Movilidad suave y respiración','4 minutos','RPE 2','Respira lento, sin forzar']]}];
function renderPlan(){ $('#planMeta').textContent=`${profile.days} días por semana · ${profile.duration} por sesión · Intensidad progresiva`; $('#planIntent').textContent=`Construir una base sólida para ${profile.goal.toLowerCase()}, aprendiendo cómo responde tu cuerpo sin perseguir fatiga innecesaria.`; $('#workoutBlocks').innerHTML=blocks.map((block,i)=>`<article class="workout-block"><header class="block-head"><div><span class="block-index">0${i+1}</span><h3>${block.name}</h3></div><small>${block.time}</small></header>${block.exercises.map(ex=>`<div class="exercise"><div><strong>${ex[0]}</strong><p>${ex[3]}</p></div><div class="exercise-stat"><small>Volumen</small><b>${ex[1]}</b></div><div class="exercise-stat"><small>Descanso / esfuerzo</small><b>${ex[2]}</b></div></div>`).join('')}</article>`).join('') }
function escapeHtml(text){const div=document.createElement('div');div.textContent=text||'';return div.innerHTML}
document.addEventListener('click',event=>{const next=event.target.closest('[data-next]');const back=event.target.closest('[data-back]');if(next){if(next.dataset.next==='pending')preparePending();showScreen(next.dataset.next)}if(back)showScreen(back.dataset.back);if(event.target.closest('[data-restart]')){sessionStorage.clear();$('#profileForm').reset();showScreen('welcome')}});
$('#profileForm').addEventListener('submit',event=>{event.preventDefault();if(!validateProfile())return;profile=collectProfile();sessionStorage.setItem('entrenador-profile',JSON.stringify(profile));renderSummary();showScreen('summary')});
$('#pendingForm').addEventListener('submit',event=>{event.preventDefault();const field=$('#pendingAnswer').closest('.pending-card');field.classList.toggle('invalid',!value('pendingAnswer'));if(!value('pendingAnswer'))return;renderPlan();showScreen('plan')});
$('#finishButton').addEventListener('click',()=>{const toast=$('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600)});document.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('input',()=>el.closest('.question,.pending-card')?.classList.remove('invalid')));try{const saved=JSON.parse(sessionStorage.getItem('entrenador-profile'));if(saved)profile=saved}catch(_){sessionStorage.removeItem('entrenador-profile')}