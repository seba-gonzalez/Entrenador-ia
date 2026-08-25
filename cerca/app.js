const conversation = document.querySelector('.conversation-card');
if (conversation) {
  const chatObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        conversation.classList.add('is-visible');
        observer.disconnect();
      }
    });
  }, { threshold: 0.35 });
  chatObserver.observe(conversation);
}

const loopSteps = Array.from(document.querySelectorAll('.loop-step'));
const mobileLoop = document.querySelector('.mobile-loop');
if (mobileLoop && loopSteps.length) {
  const loopObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loopSteps.forEach((step, index) => {
        window.setTimeout(() => step.classList.add('is-active'), index * 280);
      });
      observer.disconnect();
    });
  }, { threshold: 0.45 });
  loopObserver.observe(mobileLoop);
}

const form = document.getElementById('signupForm');

if (form) {
  const style = document.createElement('style');
  style.textContent = `
    .prelaunch-intro{margin:-4px 0 20px!important;font-size:.95rem!important;color:#8fa0a0!important}
    .form-question{margin:22px 0 8px;color:#dce3e3;font-weight:800}
    .form-question small{display:block;margin-top:4px;color:#7f8f8f;font-weight:500;font-size:.8rem}
    .option-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}
    .option-grid.compact{grid-template-columns:repeat(3,minmax(0,1fr))}
    .option-pill{position:relative;display:flex!important;align-items:center;justify-content:center;min-height:48px;margin:0!important;padding:10px 12px!important;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#0b1514;color:#d7e0e0!important;text-align:center;font-weight:650!important;font-size:.88rem;cursor:pointer;transition:.2s ease}
    .option-pill input{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important}
    .option-pill:has(input:checked){border-color:#10e7ef;background:rgba(16,231,239,.12);color:#e9ffff!important;box-shadow:0 0 0 1px rgba(16,231,239,.1),0 0 22px rgba(16,231,239,.06)}
    .conditional-group{display:none;margin-top:20px;padding-top:4px;border-top:1px solid rgba(255,255,255,.07)}
    .conditional-group.is-visible{display:block;animation:formReveal .28s ease both}
    @keyframes formReveal{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .signup-card select{width:100%;background:#111918;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:14px;font:inherit;outline:none}
    .signup-card select:focus{border-color:#10e7ef;box-shadow:0 0 0 3px rgba(16,231,239,.08)}
    .privacy-note{margin:16px 0 0!important;font-size:.76rem!important;line-height:1.45;color:#6f7e7e!important}
    .selection-note{margin:9px 0 0!important;font-size:.78rem!important;color:#83a0a0!important}
    .selection-note.limit{color:#6ff8fc!important;font-weight:750}
    @media(max-width:560px){.option-grid,.option-grid.compact{grid-template-columns:1fr 1fr}.option-pill{font-size:.84rem;min-height:46px}.signup-card{padding:22px!important}}
  `;
  document.head.appendChild(style);

  form.innerHTML = `
    <h3>Quiero probar CERCA.</h3>
    <p class="prelaunch-intro">Son pocas preguntas. Queremos conocerte lo justo para invitarte al beta correcto.</p>

    <label>Nombre *<input name="name" autocomplete="name" required placeholder="Cómo te llamas" /></label>
    <label>Correo *<input name="email" type="email" autocomplete="email" required placeholder="tucorreo@..." /></label>

    <div class="option-grid">
      <label>País *<input name="country" required autocomplete="country-name" placeholder="Chile" /></label>
      <label>Ciudad<input name="city" autocomplete="address-level2" placeholder="Santiago" /></label>
    </div>

    <div class="form-question">¿Entrenas actualmente?</div>
    <div class="option-grid" id="trainingStatusOptions">
      <label class="option-pill"><input type="radio" name="trainsNow" value="Sí" required />Sí, entreno</label>
      <label class="option-pill"><input type="radio" name="trainsNow" value="No" required />No, quiero empezar</label>
    </div>

    <div id="trainsYes" class="conditional-group">
      <div class="form-question">¿Qué entrenas principalmente?</div>
      <select name="trainingType" id="trainingType">
        <option value="">Elige una opción</option>
        <option>Gimnasio / pesas</option>
        <option>Running</option>
        <option>Funcional / CrossFit</option>
        <option>Deporte</option>
        <option>Yoga / Pilates</option>
        <option>Otro / mixto</option>
      </select>

      <div class="form-question">¿Cómo entrenas normalmente?</div>
      <div class="option-grid compact">
        <label class="option-pill"><input type="radio" name="trainingSupport" value="Solo/a" />Solo/a</label>
        <label class="option-pill"><input type="radio" name="trainingSupport" value="Con profesor/a" />Con profesor/a</label>
        <label class="option-pill"><input type="radio" name="trainingSupport" value="Ambas" />Ambas</label>
      </div>

      <label>¿Qué es lo que más te cuesta hoy con tu entrenamiento?
        <textarea name="trainingChallenge" rows="3" placeholder="Ej: ser constante, saber qué hacer, ajustar cuando ando cansado... (opcional)"></textarea>
      </label>
    </div>

    <div id="trainsNo" class="conditional-group">
      <div class="form-question">¿Qué sientes que te falta para empezar?<small>Puedes elegir hasta 3 alternativas.</small></div>
      <div class="option-grid">
        <label class="option-pill"><input type="checkbox" name="startBarrier" value="Saber qué hacer" />Saber qué hacer</label>
        <label class="option-pill"><input type="checkbox" name="startBarrier" value="Tiempo" />Tiempo</label>
        <label class="option-pill"><input type="checkbox" name="startBarrier" value="Constancia / motivación" />Constancia</label>
        <label class="option-pill"><input type="checkbox" name="startBarrier" value="Acompañamiento" />Acompañamiento</label>
        <label class="option-pill"><input type="checkbox" name="startBarrier" value="Lugar / equipo" />Lugar / equipo</label>
        <label class="option-pill"><input type="checkbox" name="startBarrier" value="Otro" />Otra cosa</label>
      </div>
      <p id="barrierHint" class="selection-note">Elige una, dos o tres. La idea es entender tu realidad, no encasillarte.</p>

      <label>Si quieres, cuéntanos un poco más
        <textarea name="startComment" rows="3" placeholder="Opcional. Una línea basta."></textarea>
      </label>
    </div>

    <button class="btn btn-primary" type="submit">Quiero sumarme <span>→</span></button>
    <p id="formStatus" class="form-status" role="status" aria-live="polite"></p>
    <p class="privacy-note">Esta versión sigue siendo un preview. Antes de abrir el pre-lanzamiento públicamente conectaremos el registro a nuestra base y dejaremos clara la política de privacidad.</p>
  `;

  const yesGroup = document.getElementById('trainsYes');
  const noGroup = document.getElementById('trainsNo');
  const status = document.getElementById('formStatus');
  const barrierHint = document.getElementById('barrierHint');
  const trainRadios = Array.from(form.querySelectorAll('input[name="trainsNow"]'));
  const startBarriers = Array.from(form.querySelectorAll('input[name="startBarrier"]'));

  const selectedBarriers = () => startBarriers.filter((input) => input.checked);

  const updateBarrierHint = () => {
    const count = selectedBarriers().length;
    barrierHint.classList.toggle('limit', count === 3);
    barrierHint.textContent = count === 3
      ? 'Ya elegiste 3. Si quieres cambiar una, desmárcala y elige otra.'
      : `Puedes elegir hasta 3 alternativas${count ? ` · ${count} seleccionada${count === 1 ? '' : 's'}` : ''}.`;
  };

  startBarriers.forEach((input) => {
    input.addEventListener('change', () => {
      if (selectedBarriers().length > 3) input.checked = false;
      updateBarrierHint();
      status.textContent = '';
    });
  });

  const syncTrainingPath = () => {
    const selected = form.querySelector('input[name="trainsNow"]:checked')?.value || '';
    yesGroup.classList.toggle('is-visible', selected === 'Sí');
    noGroup.classList.toggle('is-visible', selected === 'No');

    const trainingType = form.querySelector('[name="trainingType"]');
    const trainingSupport = Array.from(form.querySelectorAll('[name="trainingSupport"]'));

    trainingType.required = selected === 'Sí';
    trainingSupport.forEach((input) => { input.required = selected === 'Sí'; });
    status.textContent = '';
  };

  trainRadios.forEach((radio) => radio.addEventListener('change', syncTrainingPath));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    syncTrainingPath();

    if (!form.reportValidity()) return;

    const trainsNow = form.querySelector('input[name="trainsNow"]:checked')?.value || '';
    if (trainsNow === 'No' && selectedBarriers().length === 0) {
      status.textContent = 'Elige al menos una de las cosas que hoy te faltan para empezar.';
      return;
    }

    const data = new FormData(form);
    const record = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      country: String(data.get('country') || '').trim(),
      city: String(data.get('city') || '').trim(),
      trainsNow: String(data.get('trainsNow') || '').trim(),
      trainingType: String(data.get('trainingType') || '').trim(),
      trainingSupport: String(data.get('trainingSupport') || '').trim(),
      trainingChallenge: String(data.get('trainingChallenge') || '').trim(),
      startBarriers: data.getAll('startBarrier').map((value) => String(value)),
      startComment: String(data.get('startComment') || '').trim(),
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('cerca-prelaunch-signups') || '[]');
    existing.push(record);
    localStorage.setItem('cerca-prelaunch-signups', JSON.stringify(existing));

    status.textContent = 'Listo. Ya tenemos tu registro de prueba.';
    form.reset();
    yesGroup.classList.remove('is-visible');
    noGroup.classList.remove('is-visible');
    updateBarrierHint();
  });
}
