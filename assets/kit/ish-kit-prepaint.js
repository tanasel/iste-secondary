/* ISH tool kit v1.0.0: apply reading modes and the Style choice before first paint.
   Load in <head> as a plain external script (works under strict CSPs that forbid inline scripts).
   Keys (shared with ISH Academy): ishacademy:contrast = high, ishacademy:font = dyslexic, ish:style = <name>.
   A link may hand over preferences across domains with #ish-prefs=contrast,font (applied once).
   Add data-ish-storage="none" to <html> for tools that must not store anything: modes then live in memory only. */
(function () {
  var root = document.documentElement;
  var noStore = root.getAttribute('data-ish-storage') === 'none';
  var get = function (k) { if (noStore) return null; try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { if (noStore) return; try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
  var m = /(?:^#|&)ish-prefs=([a-z,]*)/.exec(location.hash || '');
  if (m) {
    var p = m[1].split(',');
    set('ishacademy:contrast', p.indexOf('contrast') > -1 ? 'high' : 'default');
    set('ishacademy:font', p.indexOf('font') > -1 ? 'dyslexic' : 'default');
    if (noStore) { if (p.indexOf('contrast') > -1) root.setAttribute('data-contrast', 'high'); if (p.indexOf('font') > -1) root.setAttribute('data-font', 'dyslexic'); }
  }
  if (get('ishacademy:contrast') === 'high') root.setAttribute('data-contrast', 'high');
  if (get('ishacademy:font') === 'dyslexic') root.setAttribute('data-font', 'dyslexic');
  var style = get('ish:style');
  if (style && style !== 'ish' && /^[a-z-]{1,20}$/.test(style)) root.setAttribute('data-style', style);
}());
