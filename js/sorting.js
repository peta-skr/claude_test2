// ===== Sorting Visualizer (timeline model) =====
// Each algorithm records a list of operations against a working copy of the
// array. The player keeps a cursor into that list and can render the exact
// state at any step by replaying operations from the original array — which
// makes full scrubbing (play / pause / step forward / step back) possible.

// Algorithm step generators + metadata come from the shared core (js/sortcore.js),
// which the Race page also uses. Include sortcore.js before this file.
const OPS = SortCore.OPS;
const ALGOS = SortCore.ALGOS;

// ---- DOM ----
const barsEl = document.getElementById('bars');
const algoSel = document.getElementById('algo');
const sizeSlider = document.getElementById('size');
const speedSlider = document.getElementById('speed');
const runBtn = document.getElementById('run');
const shuffleBtn = document.getElementById('shuffle');
const stepBackBtn = document.getElementById('stepBack');
const stepFwdBtn = document.getElementById('stepFwd');
const playPauseBtn = document.getElementById('playPause');
const scrub = document.getElementById('scrub');
const stepLabel = document.getElementById('stepLabel');
const cmpEl = document.getElementById('cmp');
const swpEl = document.getElementById('swp');
const elapsedEl = document.getElementById('elapsed');

// ---- State ----
let original = [];   // the array as first shown (never mutated during playback)
let bars = [];
let steps = [];
let cursor = 0;      // number of steps applied (0 .. steps.length)
let playing = false;
let timer = null;
let playStart = 0;
let elapsedAcc = 0;

function delay() { const s = +speedSlider.value; return Math.max(2, 120 - s * 1.18); }
function speedLabel() { const s = +speedSlider.value; return s < 30 ? '遅' : s < 70 ? '中' : '速'; }

function buildArray(n) {
  original = Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 5);
  renderBars();
  regenSteps();
}
function renderBars() {
  barsEl.innerHTML = '';
  bars = original.map(v => {
    const b = document.createElement('div');
    b.className = 'bar';
    b.style.height = v + '%';
    barsEl.appendChild(b);
    return b;
  });
}
function regenSteps() {
  steps = ALGOS[algoSel.value].fn(original.slice());
  scrub.max = steps.length;
  cursor = 0;
  elapsedAcc = 0;
  pause();
  renderAt(0);
}

// Reconstruct exact visual state after applying the first n operations.
function computeState(n) {
  const a = original.slice();
  const sorted = new Set();
  let pivot = -1, cmp = 0, swp = 0;
  for (let k = 0; k < n; k++) {
    const [op, x, y] = steps[k];
    if (op === OPS.COMPARE) cmp++;
    else if (op === OPS.SWAP) { [a[x], a[y]] = [a[y], a[x]]; swp++; }
    else if (op === OPS.OVERWRITE) { a[x] = y; swp++; }
    else if (op === OPS.PIVOT) pivot = x;
    else if (op === OPS.SORTED) { sorted.add(x); if (x === pivot) pivot = -1; }
  }
  return { a, sorted, pivot, cmp, swp, last: n > 0 ? steps[n - 1] : null };
}

function renderAt(n) {
  const s = computeState(n);
  bars.forEach((b, i) => {
    b.className = 'bar';
    b.style.height = s.a[i] + '%';
    if (s.sorted.has(i)) b.classList.add('sorted');
  });
  if (s.pivot >= 0 && bars[s.pivot]) bars[s.pivot].classList.add('pivot');
  if (s.last) {
    const [op, x, y] = s.last;
    if (op === OPS.COMPARE) { bars[x] && bars[x].classList.add('compare'); bars[y] && bars[y].classList.add('compare'); }
    else if (op === OPS.SWAP) { bars[x] && bars[x].classList.add('swap'); bars[y] && bars[y].classList.add('swap'); }
    else if (op === OPS.OVERWRITE) { bars[x] && bars[x].classList.add('swap'); }
  }
  cmpEl.textContent = s.cmp;
  swpEl.textContent = s.swp;
  cursor = n;
  scrub.value = n;
  stepLabel.textContent = `${n} / ${steps.length}`;
  updateButtons();
}

function updateButtons() {
  playPauseBtn.textContent = playing ? '⏸ 一時停止' : (cursor >= steps.length ? '↻ 最初から' : '▶ 再生');
  stepBackBtn.disabled = playing || cursor <= 0;
  stepFwdBtn.disabled = playing || cursor >= steps.length;
}

// ---- Playback ----
function tick() {
  if (!playing) return;
  if (cursor >= steps.length) { finishPlay(); return; }
  // skip instantaneous marker steps without a delay so animation feels smooth
  renderAt(cursor + 1);
  const instant = steps[cursor - 1] && (steps[cursor - 1][0] === OPS.SORTED || steps[cursor - 1][0] === OPS.PIVOT);
  timer = setTimeout(tick, instant ? 0 : delay());
  elapsedEl.textContent = ((elapsedAcc + performance.now() - playStart) / 1000).toFixed(1) + 's';
}
function play() {
  if (playing) return;
  if (cursor >= steps.length) { renderAt(0); elapsedAcc = 0; }
  playing = true;
  playStart = performance.now();
  updateButtons();
  tick();
}
function pause() {
  if (!playing) { updateButtons(); return; }
  playing = false;
  clearTimeout(timer);
  elapsedAcc += performance.now() - playStart;
  updateButtons();
}
function finishPlay() {
  playing = false;
  clearTimeout(timer);
  elapsedAcc += performance.now() - playStart;
  bars.forEach(b => b.classList.add('sorted'));
  updateButtons();
}

function setInputs(disabled) {
  algoSel.disabled = disabled;
  sizeSlider.disabled = disabled;
  shuffleBtn.disabled = disabled;
  runBtn.disabled = disabled;
}

// ---- Info ----
function updateInfo() {
  const a = ALGOS[algoSel.value];
  document.getElementById('infoName').textContent = a.name;
  document.getElementById('infoDesc').textContent = a.desc;
  document.getElementById('cBest').textContent = a.c[0];
  document.getElementById('cAvg').textContent = a.c[1];
  document.getElementById('cWorst').textContent = a.c[2];
  document.getElementById('cSpace').textContent = a.c[3];
  document.getElementById('cStable').textContent = a.c[4];
  document.getElementById('pseudo').textContent = a.code;
}

// ---- Events ----
sizeSlider.addEventListener('input', () => {
  document.getElementById('sizeVal').textContent = sizeSlider.value;
  pause();
  buildArray(+sizeSlider.value);
});
speedSlider.addEventListener('input', () => {
  document.getElementById('speedVal').textContent = speedLabel();
});
algoSel.addEventListener('change', () => { updateInfo(); regenSteps(); });
shuffleBtn.addEventListener('click', () => { pause(); buildArray(+sizeSlider.value); });
runBtn.addEventListener('click', () => { renderAt(0); play(); });
playPauseBtn.addEventListener('click', () => { playing ? pause() : play(); });
stepFwdBtn.addEventListener('click', () => { if (!playing && cursor < steps.length) renderAt(cursor + 1); });
stepBackBtn.addEventListener('click', () => { if (!playing && cursor > 0) renderAt(cursor - 1); });
scrub.addEventListener('input', () => { pause(); renderAt(+scrub.value); });

// ---- Init ----
document.getElementById('sizeVal').textContent = sizeSlider.value;
document.getElementById('speedVal').textContent = speedLabel();
updateInfo();
buildArray(+sizeSlider.value);
