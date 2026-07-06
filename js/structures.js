// ===== Data Structures Visualizer =====
// Three modes share one page: Stack, Queue and Binary Search Tree.

const msgEl = document.getElementById('msg');
const seqEl = document.getElementById('seq');
let busy = false; // animation lock

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function setMsg(text, cls) { msgEl.textContent = text; msgEl.className = 'msg' + (cls ? ' ' + cls : ''); }
function clearSeq() { seqEl.innerHTML = ''; }
function pushSeq(v) {
  const s = document.createElement('div');
  s.className = 's';
  s.textContent = v;
  seqEl.appendChild(s);
}
function parseVal(input) {
  const v = parseInt(input.value, 10);
  return Number.isNaN(v) ? null : v;
}

// ========================================================
// Stack (LIFO)
// ========================================================
const stack = [];
const stackArea = document.getElementById('stackArea');
const stackVal = document.getElementById('stackVal');

function renderStack(activeIdx) {
  stackArea.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'stack';
  if (stack.length === 0) {
    const e = document.createElement('div');
    e.className = 'empty-note';
    e.textContent = 'スタックは空です。Push で要素を積みましょう。';
    box.appendChild(e);
  } else {
    stack.forEach((v, i) => {
      const item = document.createElement('div');
      item.className = 'ds-item';
      if (i === stack.length - 1) item.classList.add('top');
      if (i === activeIdx) item.classList.add('active');
      item.innerHTML = (i === stack.length - 1 ? '<span class="tagpos">← top</span>' : '') + v;
      box.appendChild(item);
    });
  }
  const base = document.createElement('div');
  base.className = 'stack-base';
  box.appendChild(base);
  stackArea.appendChild(box);
}

async function stackPush() {
  if (busy) return;
  const v = parseVal(stackVal);
  if (v === null) { setMsg('数値を入力してください', 'warn'); return; }
  if (stack.length >= 8) { setMsg('この可視化では最大8要素までです', 'warn'); return; }
  busy = true;
  stack.push(v);
  renderStack(stack.length - 1);
  setMsg(`push(${v}) — top に ${v} を積みました`, 'ok');
  stackVal.value = '';
  await sleep(400);
  renderStack();
  busy = false;
}
async function stackPop() {
  if (busy) return;
  if (stack.length === 0) { setMsg('スタックが空のため pop できません', 'warn'); return; }
  busy = true;
  renderStack(stack.length - 1);
  const items = stackArea.querySelectorAll('.ds-item');
  const topEl = items[items.length - 1];
  if (topEl) topEl.classList.add('leaving');
  await sleep(320);
  const v = stack.pop();
  renderStack();
  setMsg(`pop() → ${v} を取り出しました`, 'ok');
  busy = false;
}
function stackPeek() {
  if (busy) return;
  if (stack.length === 0) { setMsg('スタックが空です', 'warn'); return; }
  renderStack(stack.length - 1);
  setMsg(`peek() → top は ${stack[stack.length - 1]}（取り出しません）`, 'ok');
  setTimeout(() => { if (!busy) renderStack(); }, 900);
}

// ========================================================
// Queue (FIFO)
// ========================================================
const queue = [];
const queueArea = document.getElementById('queueArea');
const queueVal = document.getElementById('queueVal');

function renderQueue(activeIdx) {
  queueArea.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'queue';
  if (queue.length === 0) {
    const e = document.createElement('div');
    e.className = 'empty-note';
    e.textContent = 'キューは空です。Enqueue で要素を追加しましょう。';
    box.appendChild(e);
  } else {
    queue.forEach((v, i) => {
      const item = document.createElement('div');
      item.className = 'ds-item';
      if (i === 0) item.classList.add('front');
      if (i === queue.length - 1) item.classList.add('rear');
      if (i === activeIdx) item.classList.add('active');
      let tag = '';
      if (i === 0) tag = '<span class="tagpos">front</span>';
      else if (i === queue.length - 1) tag = '<span class="tagpos">rear</span>';
      item.innerHTML = tag + v;
      box.appendChild(item);
    });
  }
  queueArea.appendChild(box);
}

async function queueEnq() {
  if (busy) return;
  const v = parseVal(queueVal);
  if (v === null) { setMsg('数値を入力してください', 'warn'); return; }
  if (queue.length >= 9) { setMsg('この可視化では最大9要素までです', 'warn'); return; }
  busy = true;
  queue.push(v);
  renderQueue(queue.length - 1);
  setMsg(`enqueue(${v}) — 末尾(rear)に追加しました`, 'ok');
  queueVal.value = '';
  await sleep(400);
  renderQueue();
  busy = false;
}
async function queueDeq() {
  if (busy) return;
  if (queue.length === 0) { setMsg('キューが空のため dequeue できません', 'warn'); return; }
  busy = true;
  renderQueue(0);
  const first = queueArea.querySelector('.ds-item');
  if (first) first.classList.add('leaving');
  await sleep(320);
  const v = queue.shift();
  renderQueue();
  setMsg(`dequeue() → 先頭(front)の ${v} を取り出しました`, 'ok');
  busy = false;
}

// ========================================================
// Binary Search Tree
// ========================================================
const bstArea = document.getElementById('bstArea');
const bstVal = document.getElementById('bstVal');
let bstRoot = null;

function bstInsertNode(root, val) {
  if (!root) return { val, left: null, right: null };
  if (val < root.val) root.left = bstInsertNode(root.left, val);
  else if (val > root.val) root.right = bstInsertNode(root.right, val);
  return root; // ignore duplicates
}
function bstContains(root, val) {
  while (root) { if (val === root.val) return true; root = val < root.val ? root.left : root.right; }
  return false;
}

// layout: in-order index -> x column, depth -> y row
const XSTEP = 62, LEVEL_H = 72, PAD_X = 36, PAD_Y = 34, R = 20;
function layout(root) {
  let i = 0, maxDepth = 0;
  (function assign(node, depth) {
    if (!node) return;
    assign(node.left, depth + 1);
    node._x = i++; node._depth = depth;
    maxDepth = Math.max(maxDepth, depth);
    assign(node.right, depth + 1);
  })(root, 0);
  return { count: i, maxDepth };
}

function renderBST(opts = {}) {
  const { active = new Set(), visit = new Set(), found = new Set() } = opts;
  bstArea.innerHTML = '';
  if (!bstRoot) {
    const e = document.createElement('div');
    e.className = 'empty-note';
    e.style.padding = '60px 0';
    e.textContent = '木が空です。値を挿入するか「生成」でランダムな木を作りましょう。';
    bstArea.appendChild(e);
    return;
  }
  const { count, maxDepth } = layout(bstRoot);
  const W = PAD_X * 2 + Math.max(0, count - 1) * XSTEP;
  const H = PAD_Y * 2 + maxDepth * LEVEL_H;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tree-svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  const px = n => PAD_X + n._x * XSTEP;
  const py = n => PAD_Y + n._depth * LEVEL_H;

  // edges first
  (function edges(n) {
    if (!n) return;
    for (const c of [n.left, n.right]) {
      if (c) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', px(n)); line.setAttribute('y1', py(n));
        line.setAttribute('x2', px(c)); line.setAttribute('y2', py(c));
        svg.appendChild(line);
        edges(c);
      }
    }
  })(bstRoot);

  // nodes
  (function draw(n) {
    if (!n) return;
    draw(n.left);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', px(n)); circle.setAttribute('cy', py(n)); circle.setAttribute('r', R);
    if (found.has(n.val)) circle.classList.add('found');
    else if (active.has(n.val)) circle.classList.add('active');
    else if (visit.has(n.val)) circle.classList.add('visit');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', px(n)); text.setAttribute('y', py(n) + 1);
    text.textContent = n.val;
    g.appendChild(circle); g.appendChild(text);
    svg.appendChild(g);
    draw(n.right);
  })(bstRoot);

  bstArea.appendChild(svg);
}

async function bstInsert() {
  if (busy) return;
  const v = parseVal(bstVal);
  if (v === null) { setMsg('数値を入力してください', 'warn'); return; }
  if (bstContains(bstRoot, v)) { setMsg(`${v} は既に存在します（重複は挿入しません）`, 'warn'); return; }
  busy = true;
  clearSeq();
  // animate the descent to the insertion point
  const active = new Set();
  let node = bstRoot;
  while (node) {
    active.clear(); active.add(node.val);
    renderBST({ active });
    setMsg(`${v} と ${node.val} を比較 → ${v < node.val ? '左' : '右'}へ`, '');
    await sleep(420);
    node = v < node.val ? node.left : node.right;
  }
  bstRoot = bstInsertNode(bstRoot, v);
  renderBST({ found: new Set([v]) });
  setMsg(`${v} を挿入しました`, 'ok');
  bstVal.value = '';
  await sleep(600);
  renderBST();
  busy = false;
}

async function bstSearch() {
  if (busy) return;
  const v = parseVal(bstVal);
  if (v === null) { setMsg('数値を入力してください', 'warn'); return; }
  busy = true;
  clearSeq();
  let node = bstRoot, steps = 0;
  const visit = new Set();
  while (node) {
    steps++;
    visit.add(node.val);
    renderBST({ active: new Set([node.val]), visit });
    if (v === node.val) {
      renderBST({ found: new Set([v]), visit });
      setMsg(`✅ ${v} を発見しました（比較 ${steps} 回）`, 'ok');
      busy = false;
      return;
    }
    setMsg(`${v} と ${node.val} を比較 → ${v < node.val ? '左' : '右'}へ`, '');
    await sleep(480);
    node = v < node.val ? node.left : node.right;
  }
  renderBST({ visit });
  setMsg(`❌ ${v} は見つかりませんでした（比較 ${steps} 回）`, 'warn');
  busy = false;
}

function bstDeleteNode(root, val) {
  if (!root) return null;
  if (val < root.val) root.left = bstDeleteNode(root.left, val);
  else if (val > root.val) root.right = bstDeleteNode(root.right, val);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = bstDeleteNode(root.right, succ.val);
  }
  return root;
}
async function bstDelete() {
  if (busy) return;
  const v = parseVal(bstVal);
  if (v === null) { setMsg('数値を入力してください', 'warn'); return; }
  if (!bstContains(bstRoot, v)) { setMsg(`${v} は木に存在しません`, 'warn'); return; }
  busy = true;
  clearSeq();
  renderBST({ active: new Set([v]) });
  await sleep(500);
  bstRoot = bstDeleteNode(bstRoot, v);
  renderBST();
  setMsg(`${v} を削除しました`, 'ok');
  bstVal.value = '';
  busy = false;
}

function traverseOrder(kind) {
  const out = [];
  (function go(n) {
    if (!n) return;
    if (kind === 'pre') out.push(n);
    go(n.left);
    if (kind === 'in') out.push(n);
    go(n.right);
    if (kind === 'post') out.push(n);
  })(bstRoot);
  if (kind === 'level') {
    out.length = 0;
    const q = bstRoot ? [bstRoot] : [];
    while (q.length) { const n = q.shift(); out.push(n); if (n.left) q.push(n.left); if (n.right) q.push(n.right); }
  }
  return out;
}
async function bstTraverse(kind, label) {
  if (busy) return;
  if (!bstRoot) { setMsg('木が空です', 'warn'); return; }
  busy = true;
  clearSeq();
  const order = traverseOrder(kind);
  const visit = new Set();
  setMsg(`${label}で巡回中…`, '');
  for (const n of order) {
    visit.add(n.val);
    renderBST({ active: new Set([n.val]), visit });
    pushSeq(n.val);
    await sleep(500);
  }
  renderBST({ visit });
  setMsg(`${label}の結果: ${order.map(n => n.val).join(' → ')}`, 'ok');
  busy = false;
}

function bstRandom() {
  if (busy) return;
  bstRoot = null;
  clearSeq();
  const set = new Set();
  const target = 7 + Math.floor(Math.random() * 3);
  while (set.size < target) set.add(Math.floor(Math.random() * 99) + 1);
  for (const v of set) bstRoot = bstInsertNode(bstRoot, v);
  renderBST();
  setMsg(`ランダムな二分探索木を生成しました（${set.size} ノード）`, 'ok');
}

// ========================================================
// Mode switching + info
// ========================================================
const INFO = {
  stack: {
    name: 'スタック (Stack)',
    desc: '後入れ先出し (LIFO) のデータ構造。最後に入れた要素が最初に取り出されます。関数呼び出しの管理(コールスタック)や「元に戻す」機能などに使われます。',
    rows: [['push / pop', 'O(1)'], ['peek', 'O(1)'], ['探索', 'O(n)'], ['方式', 'LIFO']],
    code: `push(x): 一番上に x を積む\npop():   一番上を取り出す\npeek():  一番上を見る（取らない）\n\n# 皿の山をイメージ：\n# 上から積み、上から取る`
  },
  queue: {
    name: 'キュー (Queue)',
    desc: '先入れ先出し (FIFO) のデータ構造。最初に入れた要素が最初に取り出されます。順番待ちの行列そのもの。タスクの順次処理や幅優先探索(BFS)の内部で使われます。',
    rows: [['enqueue / dequeue', 'O(1)'], ['探索', 'O(n)'], ['方式', 'FIFO']],
    code: `enqueue(x): 末尾(rear)に追加\ndequeue():  先頭(front)を取り出す\n\n# 行列をイメージ：\n# 後ろに並び、前から抜ける`
  },
  bst: {
    name: '二分探索木 (BST)',
    desc: '各ノードで「左の子 < 自分 < 右の子」を満たす木構造。この性質により、探索・挿入・削除を平均O(log n)で行えます。ただし偏るとO(n)まで悪化します。中間順巡回すると昇順に並びます。',
    rows: [['探索 / 挿入 / 削除', 'O(log n) 平均'], ['最悪(偏り時)', 'O(n)'], ['中間順巡回', '昇順で出力']],
    code: `insert(x):\n  x < node なら左、x > node なら右へ再帰\n\nsearch(x):\n  比較して左右どちらかへ降りる\n\n巡回:\n  中間順 = 左 → 自分 → 右 (昇順)\n  前順   = 自分 → 左 → 右\n  後順   = 左 → 右 → 自分`
  },
};

function setMode(mode) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.querySelectorAll('.mode-panel').forEach(p => { p.hidden = p.dataset.mode !== mode; });
  document.querySelectorAll('.ds-area, .tree-wrap').forEach(a => { a.hidden = a.dataset.mode !== mode; });
  clearSeq();
  setMsg('');
  const info = INFO[mode];
  document.getElementById('infoName').textContent = info.name;
  document.getElementById('infoDesc').textContent = info.desc;
  document.getElementById('pseudo').textContent = info.code;
  document.getElementById('infoTable').innerHTML =
    info.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
  if (mode === 'stack') renderStack();
  else if (mode === 'queue') renderQueue();
  else renderBST();
}

// ---- Events ----
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { if (!busy) setMode(t.dataset.mode); }));

document.getElementById('stackPush').addEventListener('click', stackPush);
document.getElementById('stackPop').addEventListener('click', stackPop);
document.getElementById('stackPeek').addEventListener('click', stackPeek);
document.getElementById('stackRand').addEventListener('click', () => { stackVal.value = Math.floor(Math.random() * 99) + 1; });
document.getElementById('stackClear').addEventListener('click', () => { if (!busy) { stack.length = 0; renderStack(); setMsg('スタックをクリアしました'); } });
stackVal.addEventListener('keydown', e => { if (e.key === 'Enter') stackPush(); });

document.getElementById('queueEnq').addEventListener('click', queueEnq);
document.getElementById('queueDeq').addEventListener('click', queueDeq);
document.getElementById('queueRand').addEventListener('click', () => { queueVal.value = Math.floor(Math.random() * 99) + 1; });
document.getElementById('queueClear').addEventListener('click', () => { if (!busy) { queue.length = 0; renderQueue(); setMsg('キューをクリアしました'); } });
queueVal.addEventListener('keydown', e => { if (e.key === 'Enter') queueEnq(); });

document.getElementById('bstInsert').addEventListener('click', bstInsert);
document.getElementById('bstSearch').addEventListener('click', bstSearch);
document.getElementById('bstDelete').addEventListener('click', bstDelete);
document.getElementById('bstIn').addEventListener('click', () => bstTraverse('in', '中間順 (In-order)'));
document.getElementById('bstPre').addEventListener('click', () => bstTraverse('pre', '前順 (Pre-order)'));
document.getElementById('bstPost').addEventListener('click', () => bstTraverse('post', '後順 (Post-order)'));
document.getElementById('bstLevel').addEventListener('click', () => bstTraverse('level', 'レベル順 (BFS)'));
document.getElementById('bstRand').addEventListener('click', bstRandom);
document.getElementById('bstClear').addEventListener('click', () => { if (!busy) { bstRoot = null; clearSeq(); renderBST(); setMsg('木をクリアしました'); } });
bstVal.addEventListener('keydown', e => { if (e.key === 'Enter') bstInsert(); });

// ---- Init ----
setMode('stack');
bstRandom(); // pre-populate a tree so the BST tab isn't empty on first view
setMode('stack');
