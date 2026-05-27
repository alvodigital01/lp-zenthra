/* ═══════════════════════════════════════════
   SCROLL REVEAL: fade-up / fade-left / fade-right / fade-scale
═══════════════════════════════════════════ */
(function initScrollReveal() {
  var els = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .fade-scale');
  if (!els.length) return;

  var io = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(function(el) { io.observe(el); });
})();


/* ═══════════════════════════════════════════
   FAQ: Accordion
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
   COUNTDOWN: 24h reiniciando via localStorage
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
      var card = track.querySelector('.depo-card:not([data-clone])');
      if (!card) return 0;
      var gap = parseInt(getComputedStyle(track).gap) || 14;
      return card.offsetWidth + gap;
    }

    btnNext.addEventListener('click', function() {
      if (track._depoPauseAuto) track._depoPauseAuto();
      track.scrollBy({ left: cardW(), behavior: 'smooth' });
    });

    btnPrev.addEventListener('click', function() {
      if (track._depoPauseAuto) track._depoPauseAuto();
      track.scrollBy({ left: -cardW(), behavior: 'smooth' });
    });
  }

  /* ---- Mobile: troca automática dos depoimentos ---- */
  (function initMobileAutoScroll() {
    var mobileMq = window.matchMedia('(max-width: 899px)');
    var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var timer = null;
    var resumeTimer = null;

    function isEnabled() {
      return mobileMq.matches && !reduceMq.matches;
    }

    function stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }

    function step() {
      if (!isEnabled()) return;
      var distance = 0;
      var card = track.querySelector('.depo-card:not([data-clone])');
      if (card) {
        var gap = parseInt(getComputedStyle(track).gap) || 14;
        distance = card.offsetWidth + gap;
      }
      if (!distance) return;

      var maxScroll = track.scrollWidth - track.clientWidth - 2;
      if (track.scrollLeft >= maxScroll) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      track.scrollBy({ left: distance, behavior: 'smooth' });
    }

    function start() {
      stop();
      if (isEnabled()) timer = setInterval(step, 3600);
    }

    function pauseAndResume() {
      stop();
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(start, 6500);
    }

    track._depoPauseAuto = pauseAndResume;
    track.addEventListener('touchstart', pauseAndResume, { passive: true });
    track.addEventListener('pointerdown', pauseAndResume, { passive: true });
    track.addEventListener('wheel', pauseAndResume, { passive: true });

    if (mobileMq.addEventListener) {
      mobileMq.addEventListener('change', start);
      reduceMq.addEventListener('change', start);
    } else if (mobileMq.addListener) {
      mobileMq.addListener(start);
      reduceMq.addListener(start);
    }

    start();
  })();
})();


/* ═══════════════════════════════════════════
   TILT 3D NOS CARDS
═══════════════════════════════════════════ */
(function initTilt() {
  var cards = document.querySelectorAll('.tilt');
  if (!cards.length) return;

  cards.forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      card.style.transition = 'transform 0.08s ease';
    });

    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width  - 0.5;
      var y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform =
        'perspective(700px) rotateX(' + (-y * 8).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg) translateZ(6px) translateY(-4px)';
    });

    card.addEventListener('mouseleave', function() {
      card.style.transition = 'transform 0.45s cubic-bezier(.22,1,.36,1)';
      card.style.transform  = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0) translateY(0)';
    });
  });
})();


/* ═══════════════════════════════════════════
   MAGNETIC GLOW NOS BOTÕES
═══════════════════════════════════════════ */
(function initMagneticGlow() {
  var btns = document.querySelectorAll('.btn-magnetic');
  btns.forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
      var rect = btn.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      var y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      btn.style.setProperty('--mx', x + '%');
      btn.style.setProperty('--my', y + '%');
    });
  });
})();


/* ═══════════════════════════════════════════
   HAMBURGER + MOBILE NAV
═══════════════════════════════════════════ */
(function initHamburger() {
  var btn = document.getElementById('hamburgerBtn');
  var nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;

  function toggle(open) {
    btn.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.setAttribute('aria-hidden',   open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', function() {
    toggle(!nav.classList.contains('is-open'));
  });

  nav.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() { toggle(false); });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) toggle(false);
  });
})();


/* ═══════════════════════════════════════════
   STAR POP (estrelas dos depoimentos)
═══════════════════════════════════════════ */
(function initStarPop() {
  var containers = document.querySelectorAll('.depo-card__stars, .google-summary__stars');
  if (!containers.length) return;

  containers.forEach(function(cont) {
    var text = cont.textContent;
    var stars = text.split('').filter(function(c) { return c === '★' || c.trim() === '★' || c.charCodeAt(0) === 9733; });
    var count = stars.length || 5;
    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<span class="star-item" style="--star-delay:' + (i * 0.07) + 's">★</span>';
    }
    cont.innerHTML = html;
  });

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.star-item').forEach(function(s) {
        s.classList.add('is-popped');
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  containers.forEach(function(c) { io.observe(c); });
})();


/* ═══════════════════════════════════════════
   HEADER: estado ao rolar a página
═══════════════════════════════════════════ */
(function initHeader() {
  var header = document.querySelector('.site-header');
  if (!header) return;
  var ticking = false;

  function update() {
    header.classList.toggle('is-scrolled', window.scrollY > 50);
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  update();
})();


/* ═══════════════════════════════════════════
   SCROLL PROGRESS BAR
═══════════════════════════════════════════ */
(function initScrollProgress() {
  var bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.appendChild(bar);

  function update() {
    var scrolled = window.scrollY;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    bar.style.transform = 'scaleX(' + (scrolled / total) + ')';
  }

  var ticking = false;
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      update();
      ticking = false;
    });
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  update();
})();


/* ═══════════════════════════════════════════
   RIPPLE NOS BOTÕES
═══════════════════════════════════════════ */
(function initRipple() {
  function onRipple(e) {
    var btn = e.currentTarget;
    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 2;
    var x = e.clientX - rect.left - size / 2;
    var y = e.clientY - rect.top - size / 2;

    var r = document.createElement('span');
    r.className = 'ripple';
    r.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px;';
    btn.appendChild(r);
    r.addEventListener('animationend', function() { r.remove(); });
  }

  document.querySelectorAll('.btn, .site-header__cta').forEach(function(btn) {
    btn.addEventListener('click', onRipple);
  });
})();


/* ═══════════════════════════════════════════
   STAGGER FADE-UP NOS GRIDS
═══════════════════════════════════════════ */
(function initStagger() {
  var grids = document.querySelectorAll('.beneficios__grid, .dores__grid, .passos');
  grids.forEach(function(grid) {
    var items = grid.querySelectorAll('.fade-up');
    items.forEach(function(item, i) {
      item.style.transitionDelay = (i * 0.04) + 's';
    });
  });
})();


/* ═══════════════════════════════════════════
   COUNTDOWN: flip animation ao trocar dígito
═══════════════════════════════════════════ */
(function initCountdownFlip() {
  var hoursEl   = document.getElementById('cd-hours');
  var minutesEl = document.getElementById('cd-minutes');
  var secondsEl = document.getElementById('cd-seconds');
  if (!hoursEl) return;

  var prev = { h: '', m: '', s: '' };

  function triggerFlip(el) {
    var num = el.closest('.countdown__num');
    if (!num) return;
    num.classList.remove('is-flipping');
    void num.offsetWidth;
    num.classList.add('is-flipping');
    num.addEventListener('animationend', function() {
      num.classList.remove('is-flipping');
    }, { once: true });
  }

  var observer = new MutationObserver(function() {
    var h = hoursEl.textContent;
    var m = minutesEl.textContent;
    var s = secondsEl.textContent;
    if (h !== prev.h) { triggerFlip(hoursEl);   prev.h = h; }
    if (m !== prev.m) { triggerFlip(minutesEl); prev.m = m; }
    if (s !== prev.s) { triggerFlip(secondsEl); prev.s = s; }
  });

  [hoursEl, minutesEl, secondsEl].forEach(function(el) {
    observer.observe(el, { characterData: true, childList: true, subtree: true });
  });
})();


/* ═══════════════════════════════════════════
   WHATSAPP FAB: aparece após 400px de scroll
═══════════════════════════════════════════ */
(function initFab() {
  var fab = document.getElementById('wpp-fab');
  if (!fab) return;

  var visible = false;
  var ticking = false;

  function update() {
    var shouldShow = window.scrollY > 400;
    ticking = false;
    if (shouldShow === visible) return;
    visible = shouldShow;
    fab.style.opacity    = visible ? '1' : '0';
    fab.style.transform  = visible ? 'scale(1)' : 'scale(0.8)';
    fab.style.pointerEvents = visible ? 'auto' : 'none';
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  /* Estilo inicial (invisível no topo, sem flash) */
  fab.style.transition   = 'opacity 0.3s ease, transform 0.3s ease';
  fab.style.opacity      = '0';
  fab.style.transform    = 'scale(0.8)';
  fab.style.pointerEvents = 'none';

  window.addEventListener('scroll', requestUpdate, { passive: true });
  update();
})();
