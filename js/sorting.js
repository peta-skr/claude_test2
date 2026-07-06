// ===== Sorting Visualizer =====
// Each algorithm records a list of operations (steps) against a working copy
// of the array. A player then animates those steps, so animation stays
// completely decoupled from the algorithm logic.

const OPS = {
  COMPARE: 'compare',   // [i, j]        highlight two bars being compared
  SWAP: 'swap',         // [i, j]        swap two bars
  OVERWRITE: 'set',     // [i, value]    write a value into position i
  PIVOT: 'pivot',       // [i]           mark pivot
  SORTED: 'sorted',     // [i]           mark index as finalized
};

// ---- Algorithms: each returns { steps } and mutates a copy ----
function bubbleSort(a) {
  const steps = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push([OPS.COMPARE, j, j + 1]);
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push([OPS.SWAP, j, j + 1]);
        swapped = true;
      }
    }
    steps.push([OPS.SORTED, n - 1 - i]);
    if (!swapped) { for (let k = 0; k <= n - 2 - i; k++) steps.push([OPS.SORTED, k]); break; }
  }
  steps.push([OPS.SORTED, 0]);
  return steps;
}

function selectionSort(a) {
  const steps = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      steps.push([OPS.COMPARE, min, j]);
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      steps.push([OPS.SWAP, i, min]);
    }
    steps.push([OPS.SORTED, i]);
  }
  steps.push([OPS.SORTED, n - 1]);
  return steps;
}

function insertionSort(a) {
  const steps = [];
  const n = a.length;
  steps.push([OPS.SORTED, 0]);
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push([OPS.COMPARE, i, j]);
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      steps.push([OPS.OVERWRITE, j + 1, a[j]]);
      j--;
      if (j >= 0) steps.push([OPS.COMPARE, i, j]);
    }
    a[j + 1] = key;
    steps.push([OPS.OVERWRITE, j + 1, key]);
  }
  for (let k = 0; k < n; k++) steps.push([OPS.SORTED, k]);
  return steps;
}

function mergeSort(a) {
  const steps = [];
  const aux = a.slice();
  function merge(lo, mid, hi) {
    for (let k = lo; k <= hi; k++) aux[k] = a[k];
    let i = lo, j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      if (i > mid) { a[k] = aux[j++]; }
      else if (j > hi) { a[k] = aux[i++]; }
      else {
        steps.push([OPS.COMPARE, i, j]);
        if (aux[i] <= aux[j]) a[k] = aux[i++];
        else a[k] = aux[j++];
      }
      steps.push([OPS.OVERWRITE, k, a[k]]);
    }
  }
  function sort(lo, hi) {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  }
  sort(0, a.length - 1);
  for (let k = 0; k < a.length; k++) steps.push([OPS.SORTED, k]);
  return steps;
}

function quickSort(a) {
  const steps = [];
  function partition(lo, hi) {
    const pivot = a[hi];
    steps.push([OPS.PIVOT, hi]);
    let i = lo;
    for (let j = lo; j < hi; j++) {
      steps.push([OPS.COMPARE, j, hi]);
      if (a[j] < pivot) {
        [a[i], a[j]] = [a[j], a[i]];
        steps.push([OPS.SWAP, i, j]);
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    steps.push([OPS.SWAP, i, hi]);
    return i;
  }
  function sort(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) { steps.push([OPS.SORTED, lo]); return; }
    const p = partition(lo, hi);
    steps.push([OPS.SORTED, p]);
    sort(lo, p - 1);
    sort(p + 1, hi);
  }
  sort(0, a.length - 1);
  return steps;
}

function heapSort(a) {
  const steps = [];
  const n = a.length;
  function siftDown(start, end) {
    let root = start;
    while (2 * root + 1 <= end) {
      let child = 2 * root + 1;
      if (child + 1 <= end) {
        steps.push([OPS.COMPARE, child, child + 1]);
        if (a[child] < a[child + 1]) child++;
      }
      steps.push([OPS.COMPARE, root, child]);
      if (a[root] < a[child]) {
        [a[root], a[child]] = [a[child], a[root]];
        steps.push([OPS.SWAP, root, child]);
        root = child;
      } else return;
    }
  }
  for (let start = (n - 2) >> 1; start >= 0; start--) siftDown(start, n - 1);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    steps.push([OPS.SWAP, 0, end]);
    steps.push([OPS.SORTED, end]);
    siftDown(0, end - 1);
  }
  steps.push([OPS.SORTED, 0]);
  return steps;
}

const ALGOS = {
  bubble: {
    fn: bubbleSort, name: 'バブルソート',
    desc: '隣り合う要素を比較し、大小が逆なら交換する操作を繰り返します。1周ごとに最大値が右端に「浮かび上がる」のが名前の由来です。実装は単純ですが効率は良くありません。',
    c: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)', '安定'],
    code:
`for i in 0..n-1:
  for j in 0..n-1-i:
    if a[j] > a[j+1]:
      swap(a[j], a[j+1])`
  },
  selection: {
    fn: selectionSort, name: '選択ソート',
    desc: '未ソート部分から最小値を選び、その先頭と交換します。交換回数が少ない(最大n-1回)一方、比較は常にn²回行うため、どんなデータでも計算量は変わりません。',
    c: ['O(n²)', 'O(n²)', 'O(n²)', 'O(1)', '不安定'],
    code:
`for i in 0..n-1:
  min = i
  for j in i+1..n:
    if a[j] < a[min]: min = j
  swap(a[i], a[min])`
  },
  insertion: {
    fn: insertionSort, name: '挿入ソート',
    desc: 'ソート済み部分に対し、次の要素を正しい位置へ挿入していきます。ほぼ整列済みのデータに非常に強く、小規模データでは高速。トランプの手札を並べる動作に似ています。',
    c: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)', '安定'],
    code:
`for i in 1..n:
  key = a[i]; j = i-1
  while j >= 0 and a[j] > key:
    a[j+1] = a[j]; j--
  a[j+1] = key`
  },
  merge: {
    fn: mergeSort, name: 'マージソート',
    desc: '配列を半分に分割し、それぞれをソートしてから併合(マージ)します。分割統治法の代表例。常にO(n log n)で安定という強みがある一方、追加メモリを必要とします。',
    c: ['O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', '安定'],
    code:
`sort(lo, hi):
  if lo >= hi: return
  mid = (lo+hi)/2
  sort(lo, mid); sort(mid+1, hi)
  merge(lo, mid, hi)`
  },
  quick: {
    fn: quickSort, name: 'クイックソート',
    desc: 'ピボットを基準に「小さい群」「大きい群」へ分割し、再帰的にソートします。平均的に非常に高速で実用でよく使われます。ピボット選択が偏ると最悪O(n²)になります。',
    c: ['O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', '不安定'],
    code:
`sort(lo, hi):
  if lo >= hi: return
  p = partition(lo, hi)   # ピボット確定
  sort(lo, p-1)
  sort(p+1, hi)`
  },
  heap: {
    fn: heapSort, name: 'ヒープソート',
    desc: '配列を二分ヒープに構築し、最大値を末尾へ取り出す操作を繰り返します。追加メモリ不要でO(n log n)を保証。安定ではありませんが最悪計算量が優れています。',
    c: ['O(n log n)', 'O(n log n)', 'O(n log n)', 'O(1)', '不安定'],
    code:
`build_max_heap(a)
for end in n-1..1:
  swap(a[0], a[end])   # 最大値を確定
  sift_down(0, end-1)`
  },
};

// ---- DOM & state ----
const barsEl = document.getElementById('bars');
const algoSel = document.getElementById('algo');
const sizeSlider = document.getElementById('size');
const speedSlider = document.getElementById('speed');
const runBtn = document.getElementById('run');
const stopBtn = document.getElementById('stop');
const shuffleBtn = document.getElementById('shuffle');
const cmpEl = document.getElementById('cmp');
const swpEl = document.getElementById('swp');
const elapsedEl = document.getElementById('elapsed');

let arr = [];
let bars = [];
let running = false;
let stopReq = false;

function delay() {
  // speed 1..100 -> ms 120..2
  const s = +speedSlider.value;
  return Math.max(2, 120 - s * 1.18);
}
function speedLabel() {
  const s = +speedSlider.value;
  return s < 30 ? '遅' : s < 70 ? '中' : '速';
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildArray(n) {
  arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 5);
  render();
}
function render() {
  barsEl.innerHTML = '';
  bars = arr.map(v => {
    const b = document.createElement('div');
    b.className = 'bar';
    b.style.height = v + '%';
    barsEl.appendChild(b);
    return b;
  });
}
function clearClasses() { bars.forEach(b => b.className = 'bar'); }

async function play(steps) {
  let cmp = 0, swp = 0;
  const start = performance.now();
  let lastHi = [];
  for (const step of steps) {
    if (stopReq) break;
    const [op, x, y] = step;
    // clear previous transient highlights (not sorted/pivot)
    lastHi.forEach(b => { if (!b.classList.contains('sorted') && !b.classList.contains('pivot')) b.className = 'bar'; });
    lastHi = [];

    if (op === OPS.COMPARE) {
      cmp++;
      bars[x].classList.add('compare'); bars[y].classList.add('compare');
      lastHi = [bars[x], bars[y]];
    } else if (op === OPS.SWAP) {
      swp++;
      [arr[x], arr[y]] = [arr[y], arr[x]];
      bars[x].style.height = arr[x] + '%';
      bars[y].style.height = arr[y] + '%';
      bars[x].classList.add('swap'); bars[y].classList.add('swap');
      lastHi = [bars[x], bars[y]];
    } else if (op === OPS.OVERWRITE) {
      swp++;
      arr[x] = y;
      bars[x].style.height = y + '%';
      bars[x].classList.add('swap');
      lastHi = [bars[x]];
    } else if (op === OPS.PIVOT) {
      bars[x].classList.add('pivot');
    } else if (op === OPS.SORTED) {
      bars[x].classList.remove('pivot');
      bars[x].classList.add('sorted');
    }
    cmpEl.textContent = cmp;
    swpEl.textContent = swp;
    elapsedEl.textContent = ((performance.now() - start) / 1000).toFixed(1) + 's';
    if (op !== OPS.SORTED && op !== OPS.PIVOT) await sleep(delay());
  }
}

async function run() {
  if (running) return;
  running = true; stopReq = false;
  setControls(true);
  clearClasses();
  const algo = ALGOS[algoSel.value];
  const work = arr.slice();
  const steps = algo.fn(work);
  await play(steps);
  if (!stopReq) bars.forEach(b => b.classList.add('sorted'));
  running = false;
  setControls(false);
}

function setControls(on) {
  runBtn.disabled = on;
  stopBtn.disabled = !on;
  shuffleBtn.disabled = on;
  algoSel.disabled = on;
  sizeSlider.disabled = on;
}

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
  if (!running) buildArray(+sizeSlider.value);
});
speedSlider.addEventListener('input', () => {
  document.getElementById('speedVal').textContent = speedLabel();
});
algoSel.addEventListener('change', updateInfo);
shuffleBtn.addEventListener('click', () => { if (!running) buildArray(+sizeSlider.value); });
runBtn.addEventListener('click', run);
stopBtn.addEventListener('click', () => { stopReq = true; });

// ---- Init ----
document.getElementById('sizeVal').textContent = sizeSlider.value;
document.getElementById('speedVal').textContent = speedLabel();
updateInfo();
buildArray(+sizeSlider.value);
