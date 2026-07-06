// ===== Shared theme toggle (light / dark) =====
// Loaded in <head> (no defer) so the stored theme applies before first paint.
(function () {
  var KEY = 'algoviz-theme';
  var stored = localStorage.getItem(KEY);
  if (stored) document.documentElement.setAttribute('data-theme', stored);

  function current() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
  function icon(t) { return t === 'light' ? '☀️' : '🌙'; }
  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(KEY, t);
    var btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = icon(t);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.textContent = icon(current());
    btn.addEventListener('click', function () {
      apply(current() === 'light' ? 'dark' : 'light');
    });
  });
})();
