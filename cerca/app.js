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

const heroCopy = document.querySelector('.hero-copy');
if (heroCopy) {
  const heroStyle = document.createElement('style');
  heroStyle.textContent = `
    .hero-signature,.hero-mobile-proof{display:none}
    @media(max-width:560px){
      .nav-cta{display:none!important}
      .hero{position:relative;overflow:hidden;padding-top:18px!important}
      .hero:before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;right:-155px;top:30px;background:radial-gradient(circle,rgba(16,231,239,.16),rgba(85,119,255,.06) 42%,transparent 70%);pointer-events:none;filter:blur(2px)}
      .hero-copy{position:relative;z-index:1;padding-top:0!important}
      .eyebrow-row{margin-bottom:15px!important}
      .eyebrow-row>a{display:none}
      .hero-signature{display:flex;align-items:center;gap:12px;margin:0 0 18px;padding:12px 14px;border:1px solid rgba(16,231,239,.17);border-radius:16px;background:linear-gradient(120deg,rgba(16,231,239,.065),rgba(85,119,255,.035));box-shadow:0 14px 34px rgba(0,0,0,.16);width:max-content;max-width:100%}
      .hero-c-mark{position:relative;display:grid;place-items:center;width:43px;height:43px;border-radius:50%;border:1px solid rgba(16,231,239,.55);color:#eaffff;font-size:1.55rem;font-weight:500;box-shadow:inset 0 0 22px rgba(16,231,239,.07),0 0 25px rgba(16,231,239,.08)}
      .hero-c-mark:after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;right:-3px;top:8px;background:#10e7ef;box-shadow:0 0 12px rgba(16,231,239,.8)}
      .hero-signature-copy{display:grid;gap:1px}
      .hero-signature-copy strong{font-size:.98rem;letter-spacing:.16em;color:#f5ffff}
      .hero-signature-copy small{font-size:.61rem;letter-spacing:.12em;color:#78a3a3;font-weight:800}
      .hero h1{font-size:clamp(2.72rem,12.8vw,3.85rem)!important;line-height:.93!important;margin-bottom:20px!important}
      .lead{font-size:1.04rem!important;line-height:1.45!important;margin-bottom:14px!important;max-width:340px}
      .hero-mobile-proof{display:grid;margin:18px 0 16px;border:1px solid rgba(16,231,239,.18);border-radius:16px;overflow:hidden;background:rgba(3,14,14,.78);box-shadow:0 15px 34px rgba(0,0,0,.18)}
      .hero-proof-row{display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;padding:12px 13px}
      .hero-proof-row+ .hero-proof-row{border-top:1px solid rgba(255,255,255,.07)}
      .hero-proof-row span{font-size:.62rem;letter-spacing:.14em;color:#758b8b;font-weight:900}
      .hero-proof-row b{font-size:.78rem;letter-spacing:.035em;color:#dff7f7}
      .hero-proof-row i{font-style:normal;color:#10e7ef;font-size:1rem}
      .actions{display:grid!important;grid-template-columns:1fr;margin:16px 0 13px!important;gap:8px!important}
      .actions .btn-primary{display:flex!important;width:100%;min-height:54px;font-size:.94rem}
      .actions .btn-ghost{width:100%;min-height:46px!important;font-size:.86rem!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(7,16,16,.72)!important}
      .mobile-quick{grid-template-columns:repeat(3,1fr)!important;margin:10px 0 24px!important;gap:7px!important}
      .mobile-quick a{min-height:42px!important;font-size:.76rem!important;padding:6px!important;border-color:rgba(16,231,239,.16)!important;background:rgba(16,231,239,.022)!important}
      .mobile-quick a:last-child{display:none!important}
      .conversation-card{margin-top:0!important}
    }
  `;
  document.head.appendChild(heroStyle);

  const eyebrow = heroCopy.querySelector('.eyebrow-row');
  if (eyebrow) {
    const signature = document.createElement('div');
    signature.className = 'hero-signature';
    signature.setAttribute('aria-label', 'CERCA, entrenamiento que recuerda');
    signature.innerHTML = `
      <span class="hero-c-mark" aria-hidden="true">C</span>
      <span class="hero-signature-copy"><strong>CERCA</strong><small>ENTRENAMIENTO QUE RECUERDA</small></span>
    `;
    eyebrow.insertAdjacentElement('afterend', signature);
  }

  const lead = heroCopy.querySelector('.lead');
  if (lead) {
    const proof = document.createElement('div');
    proof.className = 'hero-mobile-proof';
    proof.setAttribute('aria-label', 'Cómo acompaña CERCA entre sesiones');
    proof.innerHTML = `
      <div class="hero-proof-row"><span>HOY</span><b>NOS CUENTAS QUÉ PASÓ</b><i>↗</i></div>
      <div class="hero-proof-row"><span>MAÑANA</span><b>CERCA ADAPTA LA DECISIÓN</b><i>✦</i></div>
    `;
    lead.insertAdjacentElement('afterend', proof);
  }
}

const SUPABASE_URL = 'https://lggygnieziilvquvttby.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YWZ6fII-dO-jpDlZwFE47A_97hMqPpC';

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
    .selection-note{margin:9px 0 0!important;font-size:.78rem!important;color:#83a0a0!important}
    .selection-note.limit{color:#6ff8fc!important;font-weight:750}
    .consent-row{display:flex!important;align-items:flex-start;gap:10px;margin:20px 0 0!important;padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.025);color:#aebaba!important;font-size:.78rem!important;font-weight:500!important;line-height:1.45}
    .consent-row input{width:18px!important;height:18px!important;min-width:18px;margin:1px 0 0!important;accent-color:#10e7ef}
    .privacy-note{margin:12px 0 0!important;font-size:.74rem!important;line-height:1.45;color:#6f7e7e!important}
    .form-status{min-height:24px}
    .form-status.is-error{color:#ffb2b2!important}
    .form-status.is-success{color:#75f8fb!important}
    .signup-card button[disabled]{opacity:.55;cursor:wait}
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

    <label class="consent-row">
      <input type="checkbox" name="consentContact" required />
      <span>Acepto que CERCA guarde estas respuestas y mi correo para contactarme sobre el pre-lanzamiento y la beta.</span>
    </label>

    <button class="btn btn-primary" type="submit">Quiero sumarme <span>→</span></button>
    <p id="formStatus" class="form-status" role="status" aria-live="polite"></p>
    <p class="privacy-note">Usaremos estos datos solo para gestionar el pre-lanzamiento de CERCA. Antes de la apertura pública incorporaremos la política de privacidad completa.</p>
  `;

  const yesGroup = document.getElementById('trainsYes');
  const noGroup = document.getElementById('trainsNo');
  const status = document.getElementById('formStatus');
  const submitButton = form.querySelector('button[type="submit"]');
  const barrierHint = document.getElementById('barrierHint');
  const trainRadios = Array.from(form.querySelectorAll('input[name="trainsNow"]'));
  const startBarriers = Array.from(form.querySelectorAll('input[name="startBarrier"]'));

  const selectedBarriers = () => startBarriers.filter((input) => input.checked);

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.classList.toggle('is-error', type === 'error');
    status.classList.toggle('is-success', type === 'success');
  };

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
      setStatus('');
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
    setStatus('');
  };

  trainRadios.forEach((radio) => radio.addEventListener('change', syncTrainingPath));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    syncTrainingPath();

    if (!form.reportValidity()) return;

    const trainsNow = form.querySelector('input[name="trainsNow"]:checked')?.value || '';
    if (trainsNow === 'No' && selectedBarriers().length === 0) {
      setStatus('Elige al menos una de las cosas que hoy te faltan para empezar.', 'error');
      return;
    }

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      country: String(data.get('country') || '').trim(),
      city: String(data.get('city') || '').trim() || null,
      trains_now: trainsNow === 'Sí',
      training_type: trainsNow === 'Sí' ? String(data.get('trainingType') || '').trim() || null : null,
      training_support: trainsNow === 'Sí' ? String(data.get('trainingSupport') || '').trim() || null : null,
      training_challenge: trainsNow === 'Sí' ? String(data.get('trainingChallenge') || '').trim() || null : null,
      start_barriers: trainsNow === 'No' ? data.getAll('startBarrier').map((value) => String(value)) : [],
      start_comment: trainsNow === 'No' ? String(data.get('startComment') || '').trim() || null : null,
      consent_contact: data.get('consentContact') === 'on',
      source: 'landing_prelaunch'
    };

    submitButton.disabled = true;
    submitButton.innerHTML = 'Guardando…';
    setStatus('Enviando tu registro…');

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/cerca_prelaunch_signups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Signup failed with status ${response.status}`);
      }

      setStatus('¡Listo! Ya quedaste registrado para el pre-lanzamiento de CERCA.', 'success');
      form.reset();
      yesGroup.classList.remove('is-visible');
      noGroup.classList.remove('is-visible');
      updateBarrierHint();
    } catch (error) {
      console.error('CERCA signup error', error);
      setStatus('No pudimos guardar tu registro. Inténtalo nuevamente en un momento.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Quiero sumarme <span>→</span>';
    }
  });
}
