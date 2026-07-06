// ===== Searching Visualizer =====
const cellsEl = document.getElementById('cells');
const algoSel = document.getElementById('algo');
const sizeSlider = document.getElementById('size');
const speedSlider = document.getElementById('speed');
const targetInput = document.getElementById('target');
const runBtn = document.getElementById('run');
const stopBtn = document.getElementById('stop');
const regenBtn = document.getElementById('regen');
const cmpEl = document.getElementById('cmp');
const rangeEl = document.getElementById('rangeSize');
const resultEl = document.getElementById('result');
const msgEl = document.getElementById('msg');

let arr = [];
let cells = [];
let running = false;
let stopReq = false;

const INFO = {
  linear: {
    name: '線形探索 (Linear Search)',
    desc: '配列の先頭から順に1つずつ値を確認していく、最も基本的な探索法です。ソートされていない配列でも使え、実装も単純。ただし要素数に比例して時間がかかります。',
    c: ['O(1)', 'O(n)', 'O(n)', 'ソート不要'],
    code:
`for i in 0..n:
  if a[i] == target:
    return i        # 発見
return -1            # 見つからず`
  },
  binary: {
    name: '二分探索 (Binary Search)',
    desc: 'ソート済み配列の中央値と比較し、探索範囲を毎回半分に絞り込みます。1回の比較で候補が半減するため非常に高速。ただし配列が昇順に整列済みであることが前提です。',
    c: ['O(1)', 'O(log n)', 'O(log n)', 'ソート必須'],
    code:
`lo = 0; hi = n-1
while lo <= hi:
  mid = (lo+hi)/2
  if a[mid] == target: return mid
  elif a[mid] < target: lo = mid+1
  else: hi = mid-1
return -1`
  },
};

function speedLabel() {
  const s = +speedSlider.value;
  return s < 30 ? '遅' : s < 70 ? '中' : '速';
}
function delay() { return Math.max(80, 900 - +speedSlider.value * 8.2); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function generate() {
  const n = +sizeSlider.value;
  const binary = algoSel.value === 'binary';
  const set = new Set();
  while (set.size < n) set.add(Math.floor(Math.random() * 99) + 1);
  arr = [...set];
  if (binary) arr.sort((a, b) => a - b);
  // Pick a target: usually present, sometimes absent
  if (Math.random() < 0.75) {
    targetInput.value = arr[Math.floor(Math.random() * arr.length)];
  } else {
    let t; do { t = Math.floor(Math.random() * 99) + 1; } while (set.has(t));
    targetInput.value = t;
  }
  render();
  reset();
}

function render() {
  cellsEl.innerHTML = '';
  cells = arr.map((v, i) => {
    const c = document.createElement('div');
    c.className = 'cell';
    c.innerHTML = `${v}<span class="idx">${i}</span>`;
    cellsEl.appendChild(c);
    return c;
  });
}
function reset() {
  cells.forEach(c => c.className = 'cell');
  cmpEl.textContent = '0';
  rangeEl.textContent = arr.length;
  resultEl.textContent = '-';
  msgEl.textContent = '';
  msgEl.className = 'msg';
}

async function linearSearch(target) {
  let cmp = 0;
  for (let i = 0; i < arr.length; i++) {
    if (stopReq) return;
    cells[i].classList.add('active');
    cmp++; cmpEl.textContent = cmp;
    rangeEl.textContent = arr.length - i;
    msgEl.textContent = `a[${i}] = ${arr[i]} と ${target} を比較…`;
    await sleep(delay());
    if (arr[i] === target) {
      cells[i].classList.remove('active');
      cells[i].classList.add('found');
      finish(i, cmp);
      return;
    }
    cells[i].classList.remove('active');
    cells[i].classList.add('excluded');
  }
  finish(-1, cmp);
}

async function binarySearch(target) {
  let cmp = 0, lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    if (stopReq) return;
    // show current range
    cells.forEach((c, i) => {
      c.classList.remove('range', 'mid', 'active');
      if (i < lo || i > hi) c.classList.add('excluded');
      else c.classList.add('range');
    });
    const mid = (lo + hi) >> 1;
    cells[mid].classList.add('mid');
    cmp++; cmpEl.textContent = cmp;
    rangeEl.textContent = hi - lo + 1;
    msgEl.textContent = `範囲[${lo}..${hi}] の中央 a[${mid}] = ${arr[mid]} と ${target} を比較…`;
    await sleep(delay());
    if (arr[mid] === target) {
      cells[mid].classList.remove('mid');
      cells[mid].classList.add('found');
      finish(mid, cmp);
      return;
    } else if (arr[mid] < target) {
      cells[mid].classList.add('excluded');
      lo = mid + 1;
      msgEl.textContent = `${arr[mid]} < ${target} → 右半分を探索`;
    } else {
      cells[mid].classList.add('excluded');
      hi = mid - 1;
      msgEl.textContent = `${arr[mid]} > ${target} → 左半分を探索`;
    }
    await sleep(delay() * 0.6);
  }
  finish(-1, cmp);
}

function finish(idx, cmp) {
  if (idx >= 0) {
    resultEl.textContent = `index ${idx}`;
    msgEl.textContent = `✅ ${targetInput.value} を index ${idx} で発見しました（比較 ${cmp} 回）`;
    msgEl.className = 'msg ok';
  } else {
    resultEl.textContent = '見つからず';
    msgEl.textContent = `❌ ${targetInput.value} は配列内に存在しません（比較 ${cmp} 回）`;
    msgEl.className = 'msg warn';
  }
}

async function run() {
  if (running) return;
  const target = parseInt(targetInput.value, 10);
  if (Number.isNaN(target)) { msgEl.textContent = '探す値を入力してください'; msgEl.className = 'msg warn'; return; }
  running = true; stopReq = false;
  setControls(true);
  reset();
  if (algoSel.value === 'linear') await linearSearch(target);
  else await binarySearch(target);
  running = false;
  setControls(false);
}

function setControls(on) {
  runBtn.disabled = on;
  stopBtn.disabled = !on;
  regenBtn.disabled = on;
  algoSel.disabled = on;
  sizeSlider.disabled = on;
  targetInput.disabled = on;
}

function updateInfo() {
  const a = INFO[algoSel.value];
  document.getElementById('infoName').textContent = a.name;
  document.getElementById('infoDesc').textContent = a.desc;
  document.getElementById('cBest').textContent = a.c[0];
  document.getElementById('cAvg').textContent = a.c[1];
  document.getElementById('cWorst').textContent = a.c[2];
  document.getElementById('cPre').textContent = a.c[3];
  document.getElementById('pseudo').textContent = a.code;
}

// Events
sizeSlider.addEventListener('input', () => {
  document.getElementById('sizeVal').textContent = sizeSlider.value;
  if (!running) generate();
});
speedSlider.addEventListener('input', () => {
  document.getElementById('speedVal').textContent = speedLabel();
});
algoSel.addEventListener('change', () => { updateInfo(); if (!running) generate(); });
regenBtn.addEventListener('click', () => { if (!running) generate(); });
runBtn.addEventListener('click', run);
stopBtn.addEventListener('click', () => { stopReq = true; });

// Init
document.getElementById('sizeVal').textContent = sizeSlider.value;
document.getElementById('speedVal').textContent = speedLabel();
updateInfo();
generate();
