// ===== Pathfinding Visualizer =====
const boardEl = document.getElementById('board');
const algoSel = document.getElementById('algo');
const speedSlider = document.getElementById('speed');
const runBtn = document.getElementById('run');
const mazeBtn = document.getElementById('maze');
const clearBtn = document.getElementById('clearWalls');
const resetBtn = document.getElementById('reset');
const brushSel = document.getElementById('brush');
const visitedEl = document.getElementById('visited');
const pathLenEl = document.getElementById('pathLen');
const pathCostEl = document.getElementById('pathCost');
const optimalEl = document.getElementById('optimal');
const msgEl = document.getElementById('msg');

const WEIGHT_COST = 5;  // cost to enter a weighted ("terrain") cell
let COLS = 35, ROWS = 21;
let grid = [];          // grid[r][c] = { wall, weight }
let nodes = [];         // DOM refs
let start = { r: 10, c: 6 };
let end = { r: 10, c: 28 };
let running = false;
let mouseDown = false;
let dragMode = null;    // 'wall' | 'erase' | 'weight' | 'unweight' | 'start' | 'end'

const INFO = {
  bfs: {
    name: '幅優先探索 (BFS)',
    desc: 'スタートから近い順に波紋のように探索を広げます。キューを使い、重みなしグリッドでは常に最短経路を発見します。重み地形は無視して「距離」だけで進むため、重み地帯を平気で突っ切ります。',
    ds: 'キュー (FIFO)', time: 'O(V + E)', opt: '距離のみ', weight: '非対応（無視）',
    code:
`queue = [start]
while queue:
  node = queue.pop_front()
  for next in neighbors(node):
    if not visited:
      visited.add(next)
      queue.push(next)`
  },
  dfs: {
    name: '深さ優先探索 (DFS)',
    desc: '行けるところまで一方向に進み、行き止まりで引き返します。スタックを使用。実装は単純ですが、最短経路である保証はなく、遠回りな経路を返すことがあります。重みも無視します。',
    ds: 'スタック (LIFO)', time: 'O(V + E)', opt: 'なし', weight: '非対応（無視）',
    code:
`stack = [start]
while stack:
  node = stack.pop()
  for next in neighbors(node):
    if not visited:
      visited.add(next)
      stack.push(next)`
  },
  dijkstra: {
    name: 'ダイクストラ法',
    desc: 'スタートからの累積コストが小さいノードを優先的に探索します。優先度付きキューを使い、重み付きグラフでも最短経路を保証。BFSを重み対応に一般化したものと言えます。',
    ds: '優先度付きキュー', time: 'O(E log V)', opt: '保証あり', weight: '対応',
    code:
`dist[start] = 0
pq = [(0, start)]
while pq:
  d, node = pq.pop_min()
  for next, w in neighbors(node):
    if d + w < dist[next]:
      dist[next] = d + w
      pq.push((dist[next], next))`
  },
  astar: {
    name: 'A* (エースター)',
    desc: 'ダイクストラ法に「ゴールまでの推定距離(ヒューリスティック)」を加え、ゴール方向を優先して探索します。無駄な探索が少なく高速。適切なヒューリスティックなら最短経路を保証します。',
    ds: '優先度付きキュー', time: 'O(E log V)', opt: '保証あり', weight: '対応',
    code:
`g[start] = 0
f[start] = h(start, goal)
pq = [(f[start], start)]
while pq:
  node = pq.pop_min()   # f = g + h 最小
  for next in neighbors(node):
    tentative = g[node] + 1
    if tentative < g[next]:
      g[next] = tentative
      f[next] = tentative + h(next, goal)
      pq.push((f[next], next))`
  },
};

function speedLabel() {
  const s = +speedSlider.value;
  return s < 30 ? '遅' : s < 70 ? '中' : '速';
}
function delay() { return Math.max(2, 60 - +speedSlider.value * 0.58); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fitGrid() {
  // adapt columns to viewport width (24px cells + 1px gap)
  const avail = Math.min(boardEl.parentElement.clientWidth, 1120);
  COLS = Math.max(15, Math.min(45, Math.floor(avail / 25)));
  ROWS = 21;
  start = { r: Math.floor(ROWS / 2), c: Math.floor(COLS * 0.18) };
  end = { r: Math.floor(ROWS / 2), c: Math.floor(COLS * 0.82) };
}

function build() {
  fitGrid();
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, 24px)`;
  boardEl.innerHTML = '';
  grid = []; nodes = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = []; nodes[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = { wall: false, weight: 1 };
      const d = document.createElement('div');
      d.className = 'node';
      d.dataset.r = r; d.dataset.c = c;
      boardEl.appendChild(d);
      nodes[r][c] = d;
    }
  }
  paintTerminals();
  attachMouse();
}

function paintTerminals() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const el = nodes[r][c];
      el.classList.remove('start', 'end');
      if (r === start.r && c === start.c) el.classList.add('start');
      if (r === end.r && c === end.c) el.classList.add('end');
    }
}

function isTerminal(r, c) {
  return (r === start.r && c === start.c) || (r === end.r && c === end.c);
}

function clearSearch() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      nodes[r][c].classList.remove('visited', 'frontier', 'path');
  visitedEl.textContent = '0';
  pathLenEl.textContent = '-';
  pathCostEl.textContent = '-';
  optimalEl.textContent = '-';
  msgEl.textContent = '';
  msgEl.className = 'msg';
}

function clearWalls() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      grid[r][c].wall = false;
      grid[r][c].weight = 1;
      nodes[r][c].classList.remove('wall', 'weight');
    }
  clearSearch();
}

// ---- Mouse interaction ----
function attachMouse() {
  boardEl.addEventListener('mousedown', onDown);
  boardEl.addEventListener('mouseover', onOver);
  document.addEventListener('mouseup', () => { mouseDown = false; dragMode = null; });
  // touch support
  boardEl.addEventListener('touchstart', onTouch, { passive: false });
  boardEl.addEventListener('touchmove', onTouch, { passive: false });
}
function cellFrom(el) {
  if (!el || !el.dataset || el.dataset.r === undefined) return null;
  return { r: +el.dataset.r, c: +el.dataset.c };
}
function brushDragMode(r, c) {
  if (brushSel.value === 'weight') return grid[r][c].weight > 1 ? 'unweight' : 'weight';
  return grid[r][c].wall ? 'erase' : 'wall';
}
function onDown(e) {
  if (running) return;
  const cell = cellFrom(e.target);
  if (!cell) return;
  mouseDown = true;
  if (cell.r === start.r && cell.c === start.c) dragMode = 'start';
  else if (cell.r === end.r && cell.c === end.c) dragMode = 'end';
  else { dragMode = brushDragMode(cell.r, cell.c); applyDrag(cell); }
}
function onOver(e) {
  if (!mouseDown || running) return;
  const cell = cellFrom(e.target);
  if (cell) applyDrag(cell);
}
function onTouch(e) {
  if (running) return;
  e.preventDefault();
  const t = e.touches[0];
  const el = document.elementFromPoint(t.clientX, t.clientY);
  const cell = cellFrom(el);
  if (!cell) return;
  if (e.type === 'touchstart') {
    if (isTerminal(cell.r, cell.c)) dragMode = (cell.r === start.r && cell.c === start.c) ? 'start' : 'end';
    else dragMode = brushDragMode(cell.r, cell.c);
  }
  applyDrag(cell);
}
function applyDrag(cell) {
  const { r, c } = cell;
  const g = grid[r][c], el = nodes[r][c];
  if (dragMode === 'wall' && !isTerminal(r, c)) { g.wall = true; g.weight = 1; el.classList.add('wall'); el.classList.remove('weight'); }
  else if (dragMode === 'erase' && !isTerminal(r, c)) { g.wall = false; el.classList.remove('wall'); }
  else if (dragMode === 'weight' && !isTerminal(r, c)) { g.weight = WEIGHT_COST; g.wall = false; el.classList.add('weight'); el.classList.remove('wall'); }
  else if (dragMode === 'unweight' && !isTerminal(r, c)) { g.weight = 1; el.classList.remove('weight'); }
  else if (dragMode === 'start' && !g.wall && !(r === end.r && c === end.c)) { start = { r, c }; paintTerminals(); }
  else if (dragMode === 'end' && !g.wall && !(r === start.r && c === start.c)) { end = { r, c }; paintTerminals(); }
}

// ---- Search algorithms (generator-style: yield frames) ----
const key = (r, c) => r * COLS + c;
function neighbors(r, c) {
  // 4-directional; order gives a clean visual expansion
  const out = [];
  const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc].wall)
      out.push([nr, nc]);
  }
  return out;
}
function heuristic(r, c) { return Math.abs(r - end.r) + Math.abs(c - end.c); }

// Simple binary-heap-free priority queue (array + scan). Grid is small enough.
class PQ {
  constructor() { this.items = []; }
  push(node, priority) { this.items.push({ node, priority }); }
  popMin() {
    let bi = 0;
    for (let i = 1; i < this.items.length; i++)
      if (this.items[i].priority < this.items[bi].priority) bi = i;
    return this.items.splice(bi, 1)[0].node;
  }
  get size() { return this.items.length; }
}

async function search() {
  const algo = algoSel.value;
  const prev = new Map();
  const visited = new Set();
  let visitCount = 0;
  let found = false;

  const markVisited = async (r, c) => {
    if (!isTerminal(r, c)) nodes[r][c].classList.add('visited');
    nodes[r][c].classList.remove('frontier');
    visitCount++; visitedEl.textContent = visitCount;
    await sleep(delay());
  };
  const markFrontier = (r, c) => { if (!isTerminal(r, c)) nodes[r][c].classList.add('frontier'); };

  if (algo === 'bfs' || algo === 'dfs') {
    const stack = [[start.r, start.c]];
    visited.add(key(start.r, start.c));
    while (stack.length) {
      const [r, c] = algo === 'bfs' ? stack.shift() : stack.pop();
      if (r === end.r && c === end.c) { found = true; break; }
      await markVisited(r, c);
      for (const [nr, nc] of neighbors(r, c)) {
        if (!visited.has(key(nr, nc))) {
          visited.add(key(nr, nc));
          prev.set(key(nr, nc), key(r, c));
          markFrontier(nr, nc);
          stack.push([nr, nc]);
        }
      }
    }
  } else {
    // dijkstra / astar — per-cell weight as edge cost, A* adds heuristic
    const dist = new Map();
    const pq = new PQ();
    dist.set(key(start.r, start.c), 0);
    pq.push([start.r, start.c], algo === 'astar' ? heuristic(start.r, start.c) : 0);
    while (pq.size) {
      const [r, c] = pq.popMin();
      const k = key(r, c);
      if (visited.has(k)) continue;
      visited.add(k);
      if (r === end.r && c === end.c) { found = true; break; }
      await markVisited(r, c);
      for (const [nr, nc] of neighbors(r, c)) {
        const nk = key(nr, nc);
        const nd = dist.get(k) + grid[nr][nc].weight;
        if (nd < (dist.get(nk) ?? Infinity)) {
          dist.set(nk, nd);
          prev.set(nk, k);
          const pri = algo === 'astar' ? nd + heuristic(nr, nc) : nd;
          markFrontier(nr, nc);
          pq.push([nr, nc], pri);
        }
      }
    }
  }

  // reconstruct path
  if (found) {
    const path = [];
    let cur = key(end.r, end.c);
    const sk = key(start.r, start.c);
    while (cur !== sk && prev.has(cur)) {
      path.push(cur);
      cur = prev.get(cur);
    }
    path.reverse();
    let cost = 0;
    for (const k of path) {
      const r = Math.floor(k / COLS), c = k % COLS;
      cost += grid[r][c].weight; // cost to enter each cell along the path
      if (!isTerminal(r, c)) nodes[r][c].classList.add('path');
      await sleep(Math.max(8, delay() * 0.8));
    }
    pathLenEl.textContent = path.length + 1;
    pathCostEl.textContent = cost;
    const ignoresWeight = (algo === 'bfs' || algo === 'dfs');
    const opt = (algo === 'dfs') ? '×（最短でない場合あり）'
      : ignoresWeight ? '△（距離のみ・重み無視）' : '○（コスト最小）';
    optimalEl.textContent = opt;
    const note = ignoresWeight ? '（このアルゴリズムは重みを無視します）' : '';
    msgEl.textContent = `✅ ゴールに到達！ 経路長 ${path.length + 1}・総コスト ${cost}、訪問 ${visitCount} ノード ${note}`;
    msgEl.className = 'msg ok';
  } else {
    pathLenEl.textContent = '到達不可';
    pathCostEl.textContent = '-';
    optimalEl.textContent = '-';
    msgEl.textContent = '❌ 壁に囲まれていてゴールに到達できませんでした';
    msgEl.className = 'msg warn';
  }
}

async function run() {
  if (running) return;
  running = true;
  setControls(true);
  clearSearch();
  await search();
  running = false;
  setControls(false);
}

function setControls(on) {
  runBtn.disabled = on;
  mazeBtn.disabled = on;
  clearBtn.disabled = on;
  resetBtn.disabled = on;
  algoSel.disabled = on;
}

// ---- Maze generation (randomized) ----
function generateMaze() {
  if (running) return;
  clearWalls();
  // recursive-division style: fill borders randomly then carve
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (isTerminal(r, c)) continue;
      if (Math.random() < 0.28) { grid[r][c].wall = true; nodes[r][c].classList.add('wall'); }
    }
  // ensure area around start/end is open
  [start, end].forEach(t => {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const r = t.r + dr, c = t.c + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          grid[r][c].wall = false; nodes[r][c].classList.remove('wall');
        }
      }
    paintTerminals();
  });
}

function updateInfo() {
  const a = INFO[algoSel.value];
  document.getElementById('infoName').textContent = a.name;
  document.getElementById('infoDesc').textContent = a.desc;
  document.getElementById('cDs').textContent = a.ds;
  document.getElementById('cTime').textContent = a.time;
  document.getElementById('cOpt').textContent = a.opt;
  document.getElementById('cWeight').textContent = a.weight;
  document.getElementById('pseudo').textContent = a.code;
}

// Events
speedSlider.addEventListener('input', () => {
  document.getElementById('speedVal').textContent = speedLabel();
});
algoSel.addEventListener('change', updateInfo);
runBtn.addEventListener('click', run);
mazeBtn.addEventListener('click', generateMaze);
clearBtn.addEventListener('click', () => { if (!running) clearWalls(); });
resetBtn.addEventListener('click', () => { if (!running) { build(); clearSearch(); } });
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (!running) build(); }, 250);
});

// Init
document.getElementById('speedVal').textContent = speedLabel();
updateInfo();
build();
