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

const SUPABASE_URL = 'https://lggygnieziilvquvttby.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YWZ6fII-dO-jpDlZwFE47A_97hMqPpC';

const form = document.getElementById('signupForm');

if (form) {
  const yesGroup = document.getElementById('trainsYes');
  const noGroup = document.getElementById('trainsNo');
  const status = document.getElementById('formStatus');
  const submitButton = form.querySelector('button[type="submit"]');
  const barrierHint = document.getElementById('barrierHint');
  const perfilCta = document.getElementById('perfilCta');
  let registrado = false;
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

      // Contexto que puede viajar al perfil. Lista blanca estricta: solo campos
      // cerrados y no sensibles. training_challenge y start_comment son texto
      // libre y NO viajan — estan pendientes de revision (MATRIZ_DE_DATOS.md §6).
      try {
        window.sessionStorage.setItem('cerca_contexto_landing', JSON.stringify({
          name: payload.name,
          trains_now: payload.trains_now,
          training_type: payload.training_type,
          training_support: payload.training_support,
          start_barriers: payload.start_barriers
        }));
      } catch (error) {
        // Sin sessionStorage el perfil funciona igual, entrando sin contexto.
      }

      setStatus('¡Listo! Ya quedaste registrado para el pre-lanzamiento de CERCA.', 'success');
      // El registro ya esta hecho: la accion primaria pasa a ser el perfil.
      // Dos botones primarios compitiendo no dicen cual es el siguiente paso.
      registrado = true;
      submitButton.hidden = true;
      if (perfilCta) perfilCta.hidden = false;
      form.reset();
      yesGroup.classList.remove('is-visible');
      noGroup.classList.remove('is-visible');
      updateBarrierHint();
    } catch (error) {
      console.error('CERCA signup error', error);
      setStatus('No pudimos guardar tu registro. Inténtalo nuevamente en un momento.', 'error');
    } finally {
      if (!registrado) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Quiero sumarme <span>→</span>';
      }
    }
  });
}
