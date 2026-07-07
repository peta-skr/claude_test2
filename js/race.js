// ===== Sorting Race =====
// Runs several sorting algorithms on identical data simultaneously.
// Each algorithm advances one operation per tick, so the one with the fewest
// total operations finishes first. Reuses the shared SortCore step generators.

const OPS = SortCore.OPS;
const ALGOS = SortCore.ALGOS;

const pickerEl = document.getElementById('picker');
const gridEl = document.getElementById('raceGrid');
const sizeSlider = document.getElementById('size');
const speedSlider = document.getElementById('speed');
const shuffleBtn = document.getElementById('shuffle');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const msgEl = document.getElementById('msg');

const DEFAULT = ['bubble', 'insertion', 'quick', 'merge'];
let original = [];
let panels = [];
let running = false;
let timer = null;
let finishOrder = 0;

// ---- Build algorithm picker ----
Object.keys(ALGOS).forEach(key => {
  const label = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.value = key;
  cb.checked = DEFAULT.includes(key);
  label.appendChild(cb);
  label.appendChild(document.createTextNode(ALGOS[key].name));
  pickerEl.appendChild(label);
});
function selectedAlgos() {
  return [...pickerEl.querySelectorAll('input:checked')].map(cb => cb.value);
}

function speedLabel() { const s = +speedSlider.value; return s < 30 ? '遅' : s < 70 ? '中' : '速'; }
function delay() { return Math.max(1, 60 - +speedSlider.value * 0.58); }

function newData() {
  const n = +sizeSlider.value;
  original = Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 5);
  buildPanels();
}

// ---- Race panel ----
function buildPanels() {
  stopRace();
  finishOrder = 0;
  gridEl.innerHTML = '';
  panels = selectedAlgos().map(key => {
    const meta = ALGOS[key];
    const panel = document.createElement('div');
    panel.className = 'race-panel';
    panel.innerHTML = `
      <div class="rp-head">
        <span class="rp-name">${meta.name}</span>
        <span class="race-badge" data-badge>待機中</span>
      </div>
      <div class="mbars" data-bars></div>
      <div class="rp-stats">
        <span>比較 <b data-cmp>0</b></span>
        <span>交換 <b data-swp>0</b></span>
        <span>ステップ <b data-step>0</b></span>
      </div>`;
    gridEl.appendChild(panel);

    const barsWrap = panel.querySelector('[data-bars]');
    const bars = original.map(v => {
      const b = document.createElement('div');
      b.className = 'mbar';
      b.style.height = v + '%';
      barsWrap.appendChild(b);
      return b;
    });

    return {
      key, meta, panel, bars,
      a: original.slice(),
      steps: meta.fn(original.slice()),
      cursor: 0, cmp: 0, swp: 0, done: false, lastHi: [],
      badgeEl: panel.querySelector('[data-badge]'),
      cmpEl: panel.querySelector('[data-cmp]'),
      swpEl: panel.querySelector('[data-swp]'),
      stepEl: panel.querySelector('[data-step]'),
    };
  });
  if (panels.length) {
    const totals = panels.map(p => `${p.meta.name}: ${p.steps.length}`).join(' / ');
    msgEl.textContent = `準備完了 — 総ステップ数 ${totals}`;
    msgEl.className = 'msg';
  }
}

function stepPanel(p) {
  if (p.done) return;
  // clear previous transient highlight
  p.lastHi.forEach(b => { if (!b.classList.contains('sorted')) b.className = 'mbar'; });
  p.lastHi = [];

  const [op, x, y] = p.steps[p.cursor];
  if (op === OPS.COMPARE) {
    p.cmp++;
    p.bars[x].classList.add('compare'); p.bars[y].classList.add('compare');
    p.lastHi = [p.bars[x], p.bars[y]];
  } else if (op === OPS.SWAP) {
    p.swp++;
    [p.a[x], p.a[y]] = [p.a[y], p.a[x]];
    p.bars[x].style.height = p.a[x] + '%';
    p.bars[y].style.height = p.a[y] + '%';
    p.bars[x].classList.add('swap'); p.bars[y].classList.add('swap');
    p.lastHi = [p.bars[x], p.bars[y]];
  } else if (op === OPS.OVERWRITE) {
    p.swp++;
    p.a[x] = y;
    p.bars[x].style.height = y + '%';
    p.bars[x].classList.add('swap');
    p.lastHi = [p.bars[x]];
  } else if (op === OPS.SORTED) {
    p.bars[x].classList.remove('pivot');
    p.bars[x].classList.add('sorted');
  }

  p.cursor++;
  p.cmpEl.textContent = p.cmp;
  p.swpEl.textContent = p.swp;
  p.stepEl.textContent = p.cursor;

  if (p.cursor >= p.steps.length) {
    p.done = true;
    p.bars.forEach(b => b.classList.add('sorted'));
    finishOrder++;
    p.rank = finishOrder;
    const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}位`;
    p.badgeEl.textContent = `${medal} 完了 (${p.cursor}手)`;
    p.badgeEl.className = 'race-badge' + (p.rank === 1 ? ' gold' : '');
    if (p.rank === 1) p.panel.classList.add('winner');
  } else {
    p.badgeEl.textContent = '実行中…';
    p.badgeEl.className = 'race-badge run';
  }
}

function tick() {
  if (!running) return;
  let anyActive = false;
  for (const p of panels) {
    if (!p.done) { stepPanel(p); anyActive = true; }
  }
  if (!anyActive) { finishRace(); return; }
  timer = setTimeout(tick, delay());
}

function startRace() {
  if (running) return;
  if (!selectedAlgos().length) { msgEl.textContent = '少なくとも1つのアルゴリズムを選択してください'; msgEl.className = 'msg warn'; return; }
  buildPanels();
  running = true;
  setControls(true);
  msgEl.textContent = 'レース中…';
  msgEl.className = 'msg';
  tick();
}
function stopRace() {
  running = false;
  clearTimeout(timer);
}
function finishRace() {
  stopRace();
  setControls(false);
  const ranked = [...panels].filter(p => p.rank).sort((a, b) => a.rank - b.rank);
  if (ranked.length) {
    const winner = ranked[0];
    const summary = ranked.map(p => `${p.rank}. ${p.meta.name} (${p.steps.length}手)`).join('  ·  ');
    msgEl.textContent = `🏁 ゴール！ 優勝: ${winner.meta.name} — ${summary}`;
    msgEl.className = 'msg ok';
  }
}

function setControls(on) {
  startBtn.disabled = on;
  stopBtn.disabled = !on;
  shuffleBtn.disabled = on;
  sizeSlider.disabled = on;
  pickerEl.querySelectorAll('input').forEach(cb => cb.disabled = on);
}

// ---- Events ----
sizeSlider.addEventListener('input', () => {
  document.getElementById('sizeVal').textContent = sizeSlider.value;
  if (!running) newData();
});
speedSlider.addEventListener('input', () => {
  document.getElementById('speedVal').textContent = speedLabel();
});
pickerEl.addEventListener('change', () => { if (!running) buildPanels(); });
shuffleBtn.addEventListener('click', () => { if (!running) newData(); });
startBtn.addEventListener('click', startRace);
stopBtn.addEventListener('click', () => { stopRace(); setControls(false); msgEl.textContent = '停止しました'; msgEl.className = 'msg warn'; });

// ---- Init ----
document.getElementById('sizeVal').textContent = sizeSlider.value;
document.getElementById('speedVal').textContent = speedLabel();
newData();
