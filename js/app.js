/*
  zainkhan.me - single page behavior
  Native <details> catalog (works without JS). JS adds:
  one-open-at-a-time, view transitions, a draggable star that snaps back,
  session memory, and a palette shuffle from the logo.
*/
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasVT = typeof document.startViewTransition === 'function';
  if (hasVT && !reduced) document.body.classList.add('vt');

  function vt(fn) {
    if (hasVT && !reduced) { try { document.startViewTransition(fn); return; } catch (e) {} }
    fn();
  }
  function store(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  var star = document.getElementById('next');
  var items = Array.prototype.slice.call(document.querySelectorAll('.catalog li[data-id]'));
  var TITLES = {};
  items.forEach(function (li) {
    var d = li.querySelector('.desc');
    TITLES[li.dataset.id] = d ? d.textContent.trim() : li.dataset.id;
  });
  var ORDER = items.map(function (li) { return li.dataset.id; });
  var current = null;

  /* ---- Palette: random on first load, shuffled by the logo ---- */
  var PALETTE = ['23,20,17', '92,64,32', '184,60,16', '15,118,110', '21,122,58', '67,56,202', '159,18,57', '190,18,60', '109,40,217', '51,65,85'];
  var STATE_INDEX = { home: 0, s00: 1, s01: 2, s02: 3, s03: 4, s04: 5, s05: 6, s06: 7, s07: 8, timeline: 9 };
  var savedShift = load('zk:shift');
  var shift = savedShift === null ? Math.floor(Math.random() * PALETTE.length) : (parseInt(savedShift, 10) || 0);
  if (savedShift === null) store('zk:shift', String(shift));

  function applyTheme() {
    var base = STATE_INDEX[document.body.dataset.state] || 0;
    var rgb = PALETTE[((base + shift) % PALETTE.length + PALETTE.length) % PALETTE.length];
    document.body.style.setProperty('--rgb-theme', rgb);
  }

  function setStar(state) {
    if (!star) return;
    if (state === 'timeline') {
      star.dataset.next = 'home';
      star.setAttribute('aria-label', 'Back to start');
      return;
    }
    var nextId = current === null ? ORDER[0] : (ORDER[ORDER.indexOf(current) + 1] || null);
    if (!nextId) { star.dataset.next = 'home'; star.setAttribute('aria-label', 'Back to start'); }
    else { star.dataset.next = nextId; star.setAttribute('aria-label', 'Next: ' + (TITLES[nextId] || nextId)); }
  }

  function closeAll() {
    items.forEach(function (li) { var d = li.querySelector('details'); if (d && d.open) d.open = false; });
  }

  function clear(skipStore) {
    current = null;
    closeAll();
    document.body.dataset.state = 'home';
    applyTheme();
    setStar(null);
    if (!skipStore) store('zk:state', 'home');
  }

  function select(id, scroll) {
    var li = items.filter(function (x) { return x.dataset.id === id; })[0];
    if (!li) { clear(); return; }
    current = id;
    items.forEach(function (x) {
      var d = x.querySelector('details');
      var on = x.dataset.id === id;
      if (d && d.open !== on) d.open = on;
    });
    document.body.dataset.state = id;
    applyTheme();
    setStar(id);
    store('zk:state', id);
    if (scroll) li.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }

  /* Intercept the summary click so the change can run inside a view transition. */
  items.forEach(function (li) {
    var d = li.querySelector('details');
    var sum = li.querySelector('summary');
    if (!d || !sum) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      var id = li.dataset.id;
      if (d.open) vt(function () { clear(); });
      else vt(function () { select(id, false); });
    });
    d.addEventListener('toggle', function () {
      if (d.open) { if (current !== li.dataset.id) select(li.dataset.id, false); }
      else if (current === li.dataset.id) { clear(); }
    });
  });

  /* ---- View switch: home (catalog) and timeline ---- */
  function showView(name) {
    vt(function () {
      var sections = document.querySelectorAll('.view');
      for (var i = 0; i < sections.length; i++) {
        sections[i].classList.toggle('is-active', sections[i].id === 'view-' + name);
      }
      if (name === 'timeline') {
        document.body.dataset.state = 'timeline';
        applyTheme();
        setStar('timeline');
        store('zk:state', 'timeline');
      } else {
        clear();
      }
    });
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var v = e.target.closest('[data-view]');
    if (v) { e.preventDefault(); showView(v.getAttribute('data-view')); }
  });

  var logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', function () {
      // ZK always returns home, and gives the palette a nudge on the way.
      shift = (shift + 1) % PALETTE.length;
      store('zk:shift', String(shift));
      showView('home');
    });
  }

  /* ---- Star: click to advance, drag anywhere and it stays put ---- */
  var dragMoved = false;
  var starTx = 0, starTy = 0;

  function applyStar() {
    if (!star) return;
    star.style.setProperty('--tx', starTx + 'px');
    star.style.setProperty('--ty', starTy + 'px');
  }
  function clampStar() {
    if (!star) return;
    var m = 8, size = star.offsetWidth || 40;
    var r = star.getBoundingClientRect();
    var baseL = r.left - starTx, baseT = r.top - starTy;
    var left = Math.max(m, Math.min(window.innerWidth - size - m, baseL + starTx));
    var top = Math.max(m, Math.min(window.innerHeight - size - m, baseT + starTy));
    starTx = left - baseL;
    starTy = top - baseT;
    applyStar();
  }

  if (star) {
    try {
      var savedPos = localStorage.getItem('zk:star');
      if (savedPos) { var pp = savedPos.split(','); starTx = parseFloat(pp[0]) || 0; starTy = parseFloat(pp[1]) || 0; }
    } catch (e) {}
    applyStar();
    clampStar();
    // Place it instantly on load, no fly-in from the corner.
    star.style.transition = 'none';
    applyStar();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { star.style.transition = ''; });
    });

    star.addEventListener('click', function () {
      if (dragMoved) { dragMoved = false; return; }
      var nextId = star.dataset.next;
      if (nextId === 'home') { showView('home'); return; }
      select(nextId, true);
    });

    (function () {
      var sx = 0, sy = 0, dragging = false, baseL = 0, baseT = 0;
      function move(e) {
        if (!dragging) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragMoved = true;
        var m = 8, size = star.offsetWidth || 40;
        var left = Math.max(m, Math.min(window.innerWidth - size - m, baseL + dx));
        var top = Math.max(m, Math.min(window.innerHeight - size - m, baseT + dy));
        starTx = left - baseL;
        starTy = top - baseT;
        applyStar();
      }
      function up() {
        if (!dragging) return;
        dragging = false;
        star.classList.remove('dragging');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        try { localStorage.setItem('zk:star', starTx + ',' + starTy); } catch (e) {}
        window.requestAnimationFrame(function () { star.style.transition = ''; });
      }
      function down(e) {
        if (e.button && e.button !== 0) return;
        dragging = true; dragMoved = false;
        sx = e.clientX; sy = e.clientY;
        var r = star.getBoundingClientRect();
        baseL = r.left - starTx;
        baseT = r.top - starTy;
        star.classList.add('dragging');
        star.style.transition = 'none';
        applyStar();
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        e.preventDefault();
      }
      star.addEventListener('pointerdown', down);
      window.addEventListener('resize', clampStar);
      window.addEventListener('blur', function () { if (dragging) up(); });
    })();
  }

  /* ---- Mobile menu ---- */
  var menuBtn = document.getElementById('menuBtn');
  var siteMenu = document.getElementById('site-menu');
  function closeMenu() {
    if (!menuBtn) return;
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
  }
  if (menuBtn && siteMenu) {
    var openMenu = function () {
      document.body.classList.add('menu-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.textContent = 'Close';
    };
    menuBtn.addEventListener('click', function () {
      if (document.body.classList.contains('menu-open')) closeMenu(); else openMenu();
    });
    siteMenu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a, button')) closeMenu();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { closeMenu(); return; }
    if (e.key === 'ArrowRight') {
      var nextId = star ? star.dataset.next : null;
      if (nextId === 'home') showView('home');
      else if (nextId) select(nextId, true);
    } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      var tl = document.getElementById('view-timeline');
      if (tl && tl.classList.contains('is-active')) showView('home');
      else clear();
    }
  });

  /* ---- Rotating greeting ---- */
  var hello = document.getElementById('hello');
  if (hello) {
    var words = hello.querySelectorAll('.g');
    if (reduced || words.length < 2) {
      words.forEach(function (w, i) { w.classList.toggle('is-on', i === 0); });
    } else {
      var idx = 0, timer = null;
      var tickWord = function () {
        words[idx].classList.remove('is-on');
        idx = (idx + 1) % words.length;
        words[idx].classList.add('is-on');
      };
      var start = function () { if (!timer) timer = setInterval(tickWord, 2600); };
      var stop = function () { clearInterval(timer); timer = null; };
      hello.addEventListener('mouseenter', stop);
      hello.addEventListener('mouseleave', start);
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
      start();
    }
  }

  /* ---- Countdown to turning 40 ---- */
  var el = document.querySelector('.countdown');
  if (el) {
    var target = new Date(el.dataset.target).getTime();
    var ids = ['cd-d', 'cd-h', 'cd-m', 'cd-s'];
    var pad = function (n, w) { return String(n).padStart(w || 2, '0'); };
    var tick = function () {
      if (document.hidden) return;
      var ms = target - Date.now();
      if (ms < 0) { ids.forEach(function (id) { document.getElementById(id).textContent = '00'; }); return; }
      var s = Math.floor(ms / 1000);
      var d = Math.floor(s / 86400);
      var h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      s = s % 60;
      document.getElementById('cd-d').textContent = pad(d, 3);
      document.getElementById('cd-h').textContent = pad(h);
      document.getElementById('cd-m').textContent = pad(m);
      document.getElementById('cd-s').textContent = pad(s);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---- Restore last position (session) ---- */
  var savedState = items.length ? load('zk:state') : null;
  if (savedState === 'timeline') { showView('timeline'); }
  else if (savedState && TITLES[savedState]) { select(savedState, false); }
  else if (items.length) { applyTheme(); }
})();
