// ===== Recursion Visualizer =====
// Two modes: Fibonacci call tree and Tower of Hanoi.

const msgEl = document.getElementById('msg');
const legendEl = document.getElementById('legend');
const stat1 = document.getElementById('stat1'), stat1k = document.getElementById('stat1k');
const stat2 = document.getElementById('stat2'), stat2k = document.getElementById('stat2k');
const stat3 = document.getElementById('stat3'), stat3k = document.getElementById('stat3k');
let busy = false, stopReq = false;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function setMsg(t, cls) { msgEl.textContent = t; msgEl.className = 'msg' + (cls ? ' ' + cls : ''); }
const SVGNS = 'http://www.w3.org/2000/svg';

// ========================================================
// Fibonacci call tree
// ========================================================
const fibArea = document.getElementById('fibArea');
const fibNSlider = document.getElementById('fibN');
const fibSpeed = document.getElementById('fibSpeed');
const fibMemo = document.getElementById('fibMemo');
const fibRunBtn = document.getElementById('fibRun');
const fibStopBtn = document.getElementById('fibStop');

let fibTree = null;

// build the call tree; with memo, already-computed values become leaves
function buildFibTree(n, useMemo) {
  let calls = 0;
  const memo = {};
  function build(k) {
    calls++;
    const node = { n: k, children: [], type: 'call', value: null };
    if (k <= 1) { node.type = 'base'; node.value = k; return node; }
    if (useMemo && memo[k] !== undefined) { node.type = 'memo'; node.value = memo[k]; return node; }
    const l = build(k - 1), r = build(k - 2);
    node.children = [l, r];
    node.value = l.value + r.value;
    if (useMemo) memo[k] = node.value;
    return node;
  }
  const root = build(n);
  return { root, calls };
}

const FR = 17, F_XSTEP = 40, F_LEVEL = 62, F_PAD = 28;
function layoutFib(root) {
  let i = 0, maxDepth = 0;
  (function assign(node, depth) {
    if (node.children[0]) assign(node.children[0], depth + 1);
    node._x = i++; node._depth = depth;
    maxDepth = Math.max(maxDepth, depth);
    if (node.children[1]) assign(node.children[1], depth + 1);
  })(root, 0);
  return { count: i, maxDepth };
}

function renderFib(root) {
  fibArea.innerHTML = '';
  if (!root) return;
  const { count, maxDepth } = layoutFib(root);
  const W = F_PAD * 2 + Math.max(1, count - 1) * F_XSTEP;
  const H = F_PAD * 2 + maxDepth * F_LEVEL;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'rec-svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  const px = n => F_PAD + n._x * F_XSTEP;
  const py = n => F_PAD + n._depth * F_LEVEL;

  (function edges(n) {
    for (const c of n.children) {
      if (!c) continue;
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', px(n)); line.setAttribute('y1', py(n));
      line.setAttribute('x2', px(c)); line.setAttribute('y2', py(c));
      svg.appendChild(line);
      edges(c);
    }
  })(root);

  (function draw(n) {
    if (n.children[0]) draw(n.children[0]);
    const g = document.createElementNS(SVGNS, 'g');
    const circle = document.createElementNS(SVGNS, 'circle');
    circle.setAttribute('cx', px(n)); circle.setAttribute('cy', py(n)); circle.setAttribute('r', FR);
    const label = document.createElementNS(SVGNS, 'text');
    label.setAttribute('x', px(n)); label.setAttribute('y', py(n) - 3);
    label.textContent = `f(${n.n})`;
    const val = document.createElementNS(SVGNS, 'text');
    val.setAttribute('x', px(n)); val.setAttribute('y', py(n) + 8);
    val.setAttribute('class', 'sub');
    g.appendChild(circle); g.appendChild(label); g.appendChild(val);
    svg.appendChild(g);
    n._circle = circle; n._val = val;
    if (n.children[1]) draw(n.children[1]);
  })(root);

  fibArea.appendChild(svg);
}

function fibDelay() { return Math.max(30, 620 - +fibSpeed.value * 6); }

async function animateFib(node, shownRef) {
  if (stopReq) return;
  node._circle.classList.add('calling');
  shownRef.n++;
  stat1.textContent = shownRef.n;
  await sleep(fibDelay());
  if (stopReq) return;
  for (const c of node.children) { await animateFib(c, shownRef); if (stopReq) return; }
  node._circle.classList.remove('calling');
  node._circle.classList.add(node.type === 'base' ? 'base' : node.type === 'memo' ? 'memo' : 'returned');
  node._val.textContent = '=' + node.value;
  await sleep(fibDelay() * 0.4);
}

async function runFib() {
  if (busy) return;
  busy = true; stopReq = false;
  fibSetControls(true);
  const n = +fibNSlider.value;
  const useMemo = fibMemo.checked;
  const { root, calls } = buildFibTree(n, useMemo);
  fibTree = root;
  renderFib(root);
  const memoCalls = buildFibTree(n, true).calls;
  const naiveCalls = buildFibTree(n, false).calls;
  stat3.textContent = useMemo ? `${naiveCalls}（メモ化なし）` : `${memoCalls}（メモ化あり）`;
  setMsg(`fib(${n}) を${useMemo ? 'メモ化ありで' : ''}計算中… 呼び出し順にたどります`, '');
  const shownRef = { n: 0 };
  await animateFib(root, shownRef);
  if (!stopReq) {
    stat2.textContent = root.value;
    setMsg(`✅ fib(${n}) = ${root.value} — 関数呼び出し ${calls} 回` +
      (useMemo ? `（メモ化なしなら ${naiveCalls} 回）` : `（メモ化すれば ${memoCalls} 回で済みます）`), 'ok');
  } else {
    setMsg('停止しました', 'warn');
  }
  busy = false;
  fibSetControls(false);
}

function fibSetControls(on) {
  fibRunBtn.disabled = on; fibStopBtn.disabled = !on;
  fibNSlider.disabled = on; fibMemo.disabled = on;
}

function previewFib() {
  const n = +fibNSlider.value;
  const { root, calls } = buildFibTree(n, fibMemo.checked);
  fibTree = root;
  renderFib(root);
  stat1.textContent = '0';
  stat2.textContent = '-';
  const naiveCalls = buildFibTree(n, false).calls;
  const memoCalls = buildFibTree(n, true).calls;
  stat3.textContent = fibMemo.checked ? `${naiveCalls}（メモ化なし）` : `${memoCalls}（メモ化あり）`;
  setMsg(`fib(${n}) の呼び出し木（${calls} ノード）。「実行」で呼び出し順にアニメーションします。`, '');
}

// ========================================================
// Tower of Hanoi
// ========================================================
const hanoiArea = document.getElementById('hanoiArea');
const hanoiNSlider = document.getElementById('hanoiN');
const hanoiSpeed = document.getElementById('hanoiSpeed');
const hanoiRunBtn = document.getElementById('hanoiRun');
const hanoiResetBtn = document.getElementById('hanoiReset');
const hanoiStopBtn = document.getElementById('hanoiStop');

let pegs = [[], [], []];
const DISK_COLORS = ['#6c8cff', '#4fd1c5', '#ffb454', '#ff6b6b', '#c88cff', '#51cf66'];

function resetHanoi() {
  const n = +hanoiNSlider.value;
  pegs = [[], [], []];
  for (let s = n; s >= 1; s--) pegs[0].push(s); // bottom = n (largest) ... top = 1
  renderHanoi();
  stat1.textContent = '0';
  stat2.textContent = '-';
  stat3.textContent = Math.pow(2, n) - 1;
  setMsg(`円盤 ${n} 枚。「実行」で最短手順（${Math.pow(2, n) - 1} 手）を再生します。`, '');
}

function renderHanoi(movingDisk) {
  const n = +hanoiNSlider.value;
  hanoiArea.innerHTML = '';
  const board = document.createElement('div');
  board.className = 'hanoi';
  const names = ['A', 'B', 'C'];
  pegs.forEach((peg, pi) => {
    const pegEl = document.createElement('div');
    pegEl.className = 'peg';
    peg.forEach(size => {
      const disk = document.createElement('div');
      disk.className = 'disk' + (size === movingDisk ? ' moving' : '');
      disk.style.width = (28 + (size / n) * 72) + '%';
      disk.style.background = DISK_COLORS[(size - 1) % DISK_COLORS.length];
      disk.textContent = size;
      pegEl.appendChild(disk);
    });
    const lbl = document.createElement('div');
    lbl.className = 'peg-label';
    lbl.textContent = names[pi];
    pegEl.appendChild(lbl);
    board.appendChild(pegEl);
  });
  hanoiArea.appendChild(board);
}

function hanoiMoves(n, from, to, aux, moves) {
  if (n === 0) return;
  hanoiMoves(n - 1, from, aux, to, moves);
  moves.push([from, to]);
  hanoiMoves(n - 1, aux, to, from, moves);
}
function hanoiDelay() { return Math.max(60, 900 - +hanoiSpeed.value * 8.6); }

async function runHanoi() {
  if (busy) return;
  busy = true; stopReq = false;
  hanoiSetControls(true);
  resetHanoi();
  const n = +hanoiNSlider.value;
  const moves = [];
  hanoiMoves(n, 0, 2, 1, moves);
  const names = ['A', 'B', 'C'];
  let count = 0;
  for (const [from, to] of moves) {
    if (stopReq) break;
    const disk = pegs[from][pegs[from].length - 1];
    pegs[to].push(pegs[from].pop());
    count++;
    stat1.textContent = count;
    renderHanoi(disk);
    setMsg(`手順 ${count}/${moves.length}: 円盤 ${disk} を ${names[from]} → ${names[to]}`, '');
    await sleep(hanoiDelay());
  }
  renderHanoi();
  if (!stopReq) {
    stat2.textContent = count + ' 手';
    setMsg(`✅ 完成！ ${n} 枚を ${count} 手で移動しました（最短手数 = 2^${n} − 1 = ${Math.pow(2, n) - 1}）`, 'ok');
  } else {
    setMsg('停止しました', 'warn');
  }
  busy = false;
  hanoiSetControls(false);
}

function hanoiSetControls(on) {
  hanoiRunBtn.disabled = on; hanoiStopBtn.disabled = !on;
  hanoiResetBtn.disabled = on; hanoiNSlider.disabled = on;
}

// ========================================================
// Mode + info
// ========================================================
const INFO = {
  fib: {
    name: 'フィボナッチ数列（素朴な再帰）',
    desc: 'f(n) = f(n-1) + f(n-2) をそのまま再帰で計算します。同じ部分問題を何度も計算するため、呼び出し回数が指数的に増えるのが木を見るとよく分かります。メモ化で結果を再利用すると、木が劇的に小さくなります。',
    rows: [['素朴な再帰', 'O(2ⁿ)'], ['メモ化(動的計画法)', 'O(n)'], ['木の深さ', 'n']],
    legend: [['calling', 'rgba(255,180,84,.25)', 'var(--accent-warm)', '呼び出し中'],
             ['returned', 'rgba(108,140,255,.22)', 'var(--accent)', '計算完了'],
             ['base', 'rgba(81,207,102,.2)', 'var(--success)', 'ベースケース(n≤1)'],
             ['memo', 'rgba(200,140,255,.22)', '#c88cff', 'メモから再利用']],
    code: `fib(n):\n  if n <= 1: return n\n  return fib(n-1) + fib(n-2)\n\n# メモ化版\nfib(n):\n  if n in memo: return memo[n]\n  memo[n] = fib(n-1) + fib(n-2)\n  return memo[n]`
  },
  hanoi: {
    name: 'ハノイの塔',
    desc: '3本の杭を使い、大きい円盤を小さい円盤の上に置かないという規則で、全ての円盤を別の杭へ移す問題。「n-1枚を退避 → 最大の1枚を移動 → n-1枚を戻す」という再帰で解け、最短手数は 2ⁿ−1 手になります。',
    rows: [['最短手数', '2ⁿ − 1'], ['時間計算量', 'O(2ⁿ)'], ['再帰の深さ', 'n']],
    legend: [],
    code: `hanoi(n, from, to, aux):\n  if n == 0: return\n  hanoi(n-1, from, aux, to)   # n-1枚を退避\n  move(from -> to)            # 最大の1枚\n  hanoi(n-1, aux, to, from)   # n-1枚を戻す`
  },
};

function renderLegend(items) {
  legendEl.innerHTML = items.map(it =>
    `<div class="item"><span class="sw" style="background:${it[1]};border:2px solid ${it[2]}"></span>${it[3]}</div>`
  ).join('');
  legendEl.style.display = items.length ? 'flex' : 'none';
}

function setMode(mode) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.querySelectorAll('.mode-panel').forEach(p => { p.hidden = p.dataset.mode !== mode; });
  document.querySelectorAll('#fibArea, #hanoiArea').forEach(a => { a.hidden = a.dataset.mode !== mode; });
  const info = INFO[mode];
  document.getElementById('infoName').textContent = info.name;
  document.getElementById('infoDesc').textContent = info.desc;
  document.getElementById('pseudo').textContent = info.code;
  document.getElementById('infoTable').innerHTML = info.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
  renderLegend(info.legend);
  if (mode === 'fib') {
    stat1k.textContent = '呼び出し回数'; stat2k.textContent = '結果'; stat3k.textContent = '別モードの呼び出し';
    previewFib();
  } else {
    stat1k.textContent = '移動回数'; stat2k.textContent = '結果'; stat3k.textContent = '最短手数(2ⁿ−1)';
    resetHanoi();
  }
}

// ---- Events ----
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { if (!busy) setMode(t.dataset.mode); }));
fibNSlider.addEventListener('input', () => { document.getElementById('fibNVal').textContent = fibNSlider.value; if (!busy) previewFib(); });
fibSpeed.addEventListener('input', () => { document.getElementById('fibSpeedVal').textContent = spd(fibSpeed.value); });
fibMemo.addEventListener('change', () => { if (!busy) previewFib(); });
fibRunBtn.addEventListener('click', runFib);
fibStopBtn.addEventListener('click', () => { stopReq = true; });

hanoiNSlider.addEventListener('input', () => { document.getElementById('hanoiNVal').textContent = hanoiNSlider.value; if (!busy) resetHanoi(); });
hanoiSpeed.addEventListener('input', () => { document.getElementById('hanoiSpeedVal').textContent = spd(hanoiSpeed.value); });
hanoiRunBtn.addEventListener('click', runHanoi);
hanoiResetBtn.addEventListener('click', () => { if (!busy) resetHanoi(); });
hanoiStopBtn.addEventListener('click', () => { stopReq = true; });

function spd(v) { v = +v; return v < 30 ? '遅' : v < 70 ? '中' : '速'; }

// ---- Init ----
document.getElementById('fibNVal').textContent = fibNSlider.value;
document.getElementById('hanoiNVal').textContent = hanoiNSlider.value;
document.getElementById('fibSpeedVal').textContent = spd(fibSpeed.value);
document.getElementById('hanoiSpeedVal').textContent = spd(hanoiSpeed.value);
setMode('fib');
