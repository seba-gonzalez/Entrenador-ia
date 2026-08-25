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
const status = document.getElementById('formStatus');

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();

    if (!email || !email.includes('@')) {
      status.textContent = 'Déjanos un correo válido para poder contactarte.';
      return;
    }

    const record = {
      name: String(data.get('name') || '').trim(),
      email,
      city: String(data.get('city') || '').trim(),
      training: String(data.get('training') || '').trim(),
      challenge: String(data.get('challenge') || '').trim(),
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('cerca-prelaunch-signups') || '[]');
    existing.push(record);
    localStorage.setItem('cerca-prelaunch-signups', JSON.stringify(existing));

    status.textContent = 'Listo. Esta prueba quedó guardada en este dispositivo. Antes de lanzar conectaremos el formulario a nuestro backend propio.';
    form.reset();
  });
}
