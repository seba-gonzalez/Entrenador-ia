/* CERCA · Laboratorio tipográfico — herramienta interna de decisión.
   Cada muestra se escribe UNA vez como <template> y se clona en las dos
   columnas: así el marcado es idéntico y la única variable es la familia. */

const SAMPLES = [
  { id:'s-hero',  t:'A · Hero',
    spec:'72px / 49.92px · peso 700 · interl .98 / .93 · tracking −0.055em · columna 599px / 366px',
    note:'El titular lleva un salto de línea escrito a mano. Mira en cuántas líneas cae realmente cada familia y si el subrayado sigue acompañando a “acompaña.”.' },
  { id:'s-firma', t:'B · Firma y descriptor',
    spec:'CERCA 15.68px / peso 700 / +0.16em · descriptor 9.76px / peso 800 / +0.12em · solo móvil',
    note:'El punto más exigente de la página. El descriptor vive a 9.76px sobre negro: aquí se decide si una familia aguanta o no.' },
  { id:'s-caps',  t:'C · Caja alta en español',
    spec:'16.32px/900 · 16px/800 · 16px/700 · 18.88px/800 · tracking de +0.05em a +0.16em',
    note:'Mira la Ñ, la É y la Ó dentro de las versales: altura del acento, choque con la línea de arriba, y si el tracking abierto las separa bien.' },
  { id:'s-chat',  t:'D · Conversación',
    spec:'burbujas 16px / 14.4px · interl 1.5 / 1.45 · peso 400 con <b> a 700',
    note:'Aquí la tipografía debe desaparecer. Lee las dos burbujas enteras y compara velocidad, naturalidad y fatiga, no belleza.' },
  { id:'s-form',  t:'E · Formulario',
    spec:'título 32px/700 · label 16px/700 · campo 16px/400 · píldora 14.08px/650',
    note:'Donde se gana o se pierde un registro. Fíjate en el correo: legibilidad de la arroba, el punto y las minúsculas seguidas.' },
  { id:'s-faq',   t:'F · Texto largo',
    spec:'16px / 14.88px · interl 1.5 · peso 400',
    note:'Párrafo de la longitud real de una respuesta del FAQ. Compara el color del bloque de texto y si cansa.' },
  { id:'s-cards', t:'G · Tarjetas',
    spec:'título 25.6px/700 · badge 12.16px/400/+0.12em · ítems 16px/400',
    note:'“Un plan personalizado” cae en dos líneas en el diseño actual. Comprueba dónde parte cada familia.' },
  { id:'s-btn',   t:'H · Botones',
    spec:'16px / 15.04px · peso 800 · texto oscuro sobre cyan',
    note:'Peso alto sobre fondo claro: mira si el trazo se engorda o se come el contraste.' },
];

const lab = document.getElementById('lab');
const root = document.documentElement;

/* ── construcción ── */
SAMPLES.forEach(s => {
  const tpl = document.getElementById(s.id);
  if (!tpl) return;
  const sec = document.createElement('section');
  sec.className = 'sample';
  sec.dataset.sample = s.id;
  sec.innerHTML = `<div class="sample-head"><h2>${s.t}</h2><span class="sample-spec">${s.spec}</span></div>
    <p class="sample-note">${s.note}</p>
    <div class="panes"></div><div class="delta"></div>`;
  const panes = sec.querySelector('.panes');
  ['inter','archivo'].forEach(fam => {
    const pane = document.createElement('div');
    pane.className = 'pane';
    pane.dataset.family = fam;
    pane.innerHTML = `<div class="pane-label">${fam === 'inter' ? 'Inter' : 'Archivo'}</div>`;
    pane.appendChild(tpl.content.cloneNode(true));
    pane.insertAdjacentHTML('beforeend', '<div class="readout"></div>');
    panes.appendChild(pane);
  });
  lab.appendChild(sec);
});

/* ── medición: líneas reales y ancho de la línea más ancha ── */
function lineBoxes(el){
  const r = document.createRange();
  r.selectNodeContents(el);
  const rects = Array.from(r.getClientRects()).filter(x => x.width > 0 && x.height > 0);
  if (!rects.length) { const b = el.getBoundingClientRect(); return { lines:1, w:Math.round(b.width) }; }
  const tops = [...new Set(rects.map(x => Math.round(x.top)))];
  return { lines: tops.length, w: Math.round(Math.max(...rects.map(x => x.width))) };
}

function measure(){
  document.querySelectorAll('.sample').forEach(sec => {
    const [a,b] = sec.querySelectorAll('.pane');
    const out = [];
    [a,b].forEach(pane => {
      const rows = [];
      pane.querySelectorAll('.measure').forEach(el => {
        const m = lineBoxes(el);
        const label = (el.innerText || el.textContent || '').trim().replace(/\s+/g,' ').slice(0,22);
        rows.push({ label, ...m });
      });
      pane.querySelector('.readout').innerHTML = rows.length
        ? rows.map(r => `<b>${r.lines}</b> ${r.lines===1?'línea':'líneas'} · <b>${r.w}px</b> · “${r.label}…”`).join('<br>')
        : '—';
      out.push(rows);
    });
    const [ra, rb] = out;
    const fa = a.dataset.family, fb = b.dataset.family;
    const diffs = [];
    ra.forEach((r,i) => {
      const o = rb[i]; if (!o) return;
      if (r.lines !== o.lines) diffs.push(`“${r.label}…” cae en ${r.lines} vs ${o.lines} líneas`);
      else if (Math.abs(r.w - o.w) >= 4) {
        const pct = ((o.w - r.w) / r.w * 100);
        diffs.push(`“${r.label}…” ${Math.abs(o.w-r.w)}px ${pct>0?'más ancho':'más estrecho'} en ${fb} (${pct>0?'+':''}${pct.toFixed(1)}%)`);
      }
    });
    const d = sec.querySelector('.delta');
    d.textContent = diffs.length ? `Δ ${fa} → ${fb}:  ` + diffs.join('  ·  ') : `Δ ${fa} → ${fb}: sin diferencias medibles`;
    d.classList.toggle('sig', diffs.some(x => x.includes('líneas')));
  });
}

/* ── ¿cargaron de verdad las dos fuentes? ──
   document.fonts.check() da falsos positivos, así que comparamos el ancho
   real de una cadena contra un fallback que sabemos distinto. */
function reallyLoaded(family){
  const probe = 'MAÑANA NO PARTES DE CERO — Camila 40';
  const mk = ff => {
    const s = document.createElement('span');
    s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:96px;font-family:${ff}`;
    s.textContent = probe; document.body.appendChild(s);
    const w = s.getBoundingClientRect().width; s.remove(); return w;
  };
  return Math.abs(mk(`"${family}", monospace`) - mk('monospace')) > 1;
}

function checkFonts(){
  const el = document.getElementById('fontstatus');
  const i = reallyLoaded('Inter'), a = reallyLoaded('Archivo');
  if (i && a){
    el.className = 'fontstatus ok';
    el.textContent = '✓ Inter y Archivo cargadas. La comparación es válida.';
  } else {
    el.className = 'fontstatus bad';
    const falta = [!i && 'Inter', !a && 'Archivo'].filter(Boolean).join(' y ');
    el.textContent = `⚠ No cargó ${falta}. Las columnas se están dibujando con la fuente de respaldo del sistema: NO compares todavía, el resultado no significa nada. Revisa la conexión a fonts.gstatic.com.`;
  }
}

/* ── controles ── */
document.querySelectorAll('[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('is-on', b === btn));
    root.dataset.mode = btn.dataset.mode;
    requestAnimationFrame(measure);
  });
});
document.getElementById('swap').addEventListener('click', () => {
  document.querySelectorAll('.panes').forEach(p => p.appendChild(p.firstElementChild));
  requestAnimationFrame(measure);
});
document.getElementById('blind').addEventListener('click', e => {
  const on = document.body.classList.toggle('blind');
  e.target.textContent = on ? 'Mostrar etiquetas' : 'Ocultar etiquetas';
  e.target.classList.toggle('is-on', on);
});

root.dataset.mode = 'desktop';
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => { checkFonts(); measure(); });
  setTimeout(() => { checkFonts(); measure(); }, 2500);
} else {
  window.addEventListener('load', () => { checkFonts(); measure(); });
}
