/* ═══════════════════════════════════════════
   FADE-UP — IntersectionObserver
═══════════════════════════════════════════ */
(function initFadeUp() {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;

  const io = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
  );

  els.forEach(function(el) { io.observe(el); });
})();


/* ═══════════════════════════════════════════
   FAQ — Accordion
═══════════════════════════════════════════ */
(function initFAQ() {
  var items = document.querySelectorAll('.faq__item');
  if (!items.length) return;

  items.forEach(function(item) {
    var btn   = item.querySelector('.faq__btn');
    var panel = item.querySelector('.faq__panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function() {
      var isOpen = item.classList.contains('is-open');

      /* Fecha todos */
      items.forEach(function(i) {
        i.classList.remove('is-open');
        var b = i.querySelector('.faq__btn');
        var p = i.querySelector('.faq__panel');
        if (b) b.setAttribute('aria-expanded', 'false');
        if (p) p.hidden = true;
      });

      /* Abre o clicado (se estava fechado) */
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }
    });
  });
})();


/* ═══════════════════════════════════════════
   COUNTDOWN — 24h reiniciando via localStorage
═══════════════════════════════════════════ */
(function initCountdown() {
  var hoursEl   = document.getElementById('cd-hours');
  var minutesEl = document.getElementById('cd-minutes');
  var secondsEl = document.getElementById('cd-seconds');
  if (!hoursEl || !minutesEl || !secondsEl) return;

  var KEY      = 'tirz_deadline';
  var DURATION = 24 * 60 * 60 * 1000; /* 24h em ms */

  function getDeadline() {
    var stored = localStorage.getItem(KEY);
    var now    = Date.now();

    if (!stored || parseInt(stored, 10) <= now) {
      var next = now + DURATION;
      localStorage.setItem(KEY, String(next));
      return next;
    }
    return parseInt(stored, 10);
  }

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, '0');
  }

  function tick() {
    var deadline = getDeadline();
    var diff     = deadline - Date.now();

    if (diff <= 0) {
      /* Reinicia */
      localStorage.removeItem(KEY);
      tick();
      return;
    }

    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);

    hoursEl.textContent   = pad(h);
    minutesEl.textContent = pad(m);
    secondsEl.textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();


/* ═══════════════════════════════════════════
   CARROSSEL DE DEPOIMENTOS
   - Mobile: snap scroll com setas
   - Desktop: marquee infinito (CSS animation)
     Os cards são clonados via JS para fechar o loop
═══════════════════════════════════════════ */
(function initCarousel() {
  var track   = document.getElementById('depoTrack');
  var btnPrev = document.getElementById('depoPrev');
  var btnNext = document.getElementById('depoNext');
  if (!track) return;

  /* Clona todos os cards originais e adiciona ao final
     Os clones ficam ocultos no mobile (via CSS data-clone)
     e visíveis no desktop para o loop infinito */
  var originals = Array.from(track.querySelectorAll('.depo-card'));
  originals.forEach(function(card) {
    var clone = card.cloneNode(true);
    clone.setAttribute('data-clone', '');
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  /* ---- Mobile: setas de navegação ---- */
  if (btnPrev && btnNext) {
    function cardW() {
      var card = track.querySelector('.depo-card');
      if (!card) return 0;
      var gap = parseInt(getComputedStyle(track).gap) || 14;
      return card.offsetWidth + gap;
    }

    btnNext.addEventListener('click', function() {
      track.scrollBy({ left: cardW(), behavior: 'smooth' });
    });

    btnPrev.addEventListener('click', function() {
      track.scrollBy({ left: -cardW(), behavior: 'smooth' });
    });
  }
})();


/* ═══════════════════════════════════════════
   WHATSAPP FAB — aparece após 400px de scroll
═══════════════════════════════════════════ */
(function initFab() {
  var fab = document.getElementById('wpp-fab');
  if (!fab) return;

  var visible = false;

  function update() {
    var shouldShow = window.scrollY > 400;
    if (shouldShow === visible) return;
    visible = shouldShow;
    fab.style.opacity    = visible ? '1' : '0';
    fab.style.transform  = visible ? 'scale(1)' : 'scale(0.8)';
    fab.style.pointerEvents = visible ? 'auto' : 'none';
  }

  /* Estilo inicial (invisível no topo, sem flash) */
  fab.style.transition   = 'opacity 0.3s ease, transform 0.3s ease';
  fab.style.opacity      = '0';
  fab.style.transform    = 'scale(0.8)';
  fab.style.pointerEvents = 'none';

  window.addEventListener('scroll', update, { passive: true });
  update();
})();
