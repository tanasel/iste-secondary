/* ISH tool kit v1.0.0: reading switches and the Style menu. No network calls.
   Markup: <button class="ish-switch" type="button" data-ish-toggle="contrast">Contrast: <span>Default</span></button>
           <button class="ish-switch" type="button" data-ish-toggle="font">Font: <span>Default</span></button>
           <label class="ish-style">Style <select data-ish-style><option value="ish">ISH</option><option value="classic">Classic</option></select></label>
           <p class="ish-sr-only" role="status" data-ish-status></p>
   Labels can be translated with data-on / data-off on the <span> (defaults: High / Dyslexia, Default). */
(function () {
  var root = document.documentElement;
  var noStore = root.getAttribute('data-ish-storage') === 'none';
  var store = function (k, v) { if (noStore) return; try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
  var MODES = {
    contrast: { key: 'ishacademy:contrast', attr: 'data-contrast', on: 'high', label: 'High' },
    font: { key: 'ishacademy:font', attr: 'data-font', on: 'dyslexic', label: 'Dyslexia' }
  };
  function announce(text) { var s = document.querySelector('[data-ish-status]'); if (s) { s.textContent = ''; setTimeout(function () { s.textContent = text; }, 30); } }
  function paint() {
    document.querySelectorAll('[data-ish-toggle]').forEach(function (b) {
      var m = MODES[b.getAttribute('data-ish-toggle')]; if (!m) return;
      var on = root.getAttribute(m.attr) === m.on; var span = b.querySelector('span');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (span) span.textContent = on ? (span.getAttribute('data-on') || m.label) : (span.getAttribute('data-off') || 'Default');
    });
    var current = root.getAttribute('data-style') || 'ish';
    document.querySelectorAll('select[data-ish-style]').forEach(function (s) { s.value = current; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-ish-toggle]') : null; if (!b) return;
    var m = MODES[b.getAttribute('data-ish-toggle')]; if (!m) return;
    var on = root.getAttribute(m.attr) === m.on;
    if (on) root.removeAttribute(m.attr); else root.setAttribute(m.attr, m.on);
    store(m.key, on ? 'default' : m.on);
    paint(); announce(b.textContent.replace(/\s+/g, ' ').trim());
  });
  document.addEventListener('change', function (e) {
    var s = e.target; if (!s.matches || !s.matches('select[data-ish-style]')) return;
    var v = /^[a-z-]{1,20}$/.test(s.value) ? s.value : 'ish';
    if (v === 'ish') root.removeAttribute('data-style'); else root.setAttribute('data-style', v);
    store('ish:style', v); announce('Style: ' + s.options[s.selectedIndex].text);
  });
  window.addEventListener('storage', function (e) {
    if (noStore) return;
    if (e.key === 'ishacademy:contrast') { if (e.newValue === 'high') root.setAttribute('data-contrast', 'high'); else root.removeAttribute('data-contrast'); }
    if (e.key === 'ishacademy:font') { if (e.newValue === 'dyslexic') root.setAttribute('data-font', 'dyslexic'); else root.removeAttribute('data-font'); }
    paint();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
  window.ISHKit = { version: '1.0.0', paint: paint };
}());
