const navCta = document.querySelector('.nav-cta');
if (navCta) {
  navCta.style.background = 'linear-gradient(90deg, #10e7ef, #38f2f1)';
  navCta.style.color = '#041111';
  navCta.style.border = '1px solid rgba(16,231,239,.55)';
  navCta.style.boxShadow = '0 0 24px rgba(16,231,239,.12)';
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
