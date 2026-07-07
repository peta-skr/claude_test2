// ===== Shared sorting core =====
// Algorithm step generators + metadata, shared by the Sorting page and the
// Race page. Each algorithm records a list of operations against a working
// copy of the array (see OPS). Exposed on window.SortCore.
(function () {
  const OPS = {
    COMPARE: 'compare',   // [i, j]        compare two bars
    SWAP: 'swap',         // [i, j]        swap two bars
    OVERWRITE: 'set',     // [i, value]    write a value into position i
    PIVOT: 'pivot',       // [i]           mark pivot
    SORTED: 'sorted',     // [i]           finalize an index
  };

  function bubbleSort(a) {
    const steps = [], n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - 1 - i; j++) {
        steps.push([OPS.COMPARE, j, j + 1]);
        if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; steps.push([OPS.SWAP, j, j + 1]); swapped = true; }
      }
      steps.push([OPS.SORTED, n - 1 - i]);
      if (!swapped) { for (let k = 0; k <= n - 2 - i; k++) steps.push([OPS.SORTED, k]); break; }
    }
    steps.push([OPS.SORTED, 0]);
    return steps;
  }

  function cocktailSort(a) {
    const steps = [], n = a.length;
    let start = 0, end = n - 1, swapped = true;
    while (swapped) {
      swapped = false;
      for (let i = start; i < end; i++) {
        steps.push([OPS.COMPARE, i, i + 1]);
        if (a[i] > a[i + 1]) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; steps.push([OPS.SWAP, i, i + 1]); swapped = true; }
      }
      steps.push([OPS.SORTED, end]);
      end--;
      if (!swapped) break;
      swapped = false;
      for (let i = end; i > start; i--) {
        steps.push([OPS.COMPARE, i - 1, i]);
        if (a[i - 1] > a[i]) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; steps.push([OPS.SWAP, i - 1, i]); swapped = true; }
      }
      steps.push([OPS.SORTED, start]);
      start++;
    }
    for (let k = start; k <= end; k++) steps.push([OPS.SORTED, k]);
    return steps;
  }

  function selectionSort(a) {
    const steps = [], n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) { steps.push([OPS.COMPARE, min, j]); if (a[j] < a[min]) min = j; }
      if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; steps.push([OPS.SWAP, i, min]); }
      steps.push([OPS.SORTED, i]);
    }
    steps.push([OPS.SORTED, n - 1]);
    return steps;
  }

  function insertionSort(a) {
    const steps = [], n = a.length;
    steps.push([OPS.SORTED, 0]);
    for (let i = 1; i < n; i++) {
      const key = a[i]; let j = i - 1;
      steps.push([OPS.COMPARE, i, j]);
      while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j]; steps.push([OPS.OVERWRITE, j + 1, a[j]]); j--;
        if (j >= 0) steps.push([OPS.COMPARE, i, j]);
      }
      a[j + 1] = key; steps.push([OPS.OVERWRITE, j + 1, key]);
    }
    for (let k = 0; k < n; k++) steps.push([OPS.SORTED, k]);
    return steps;
  }

  function shellSort(a) {
    const steps = [], n = a.length;
    for (let gap = n >> 1; gap > 0; gap = gap >> 1) {
      for (let i = gap; i < n; i++) {
        const temp = a[i]; let j = i;
        steps.push([OPS.COMPARE, i, i - gap]);
        while (j >= gap && a[j - gap] > temp) {
          const v = a[j - gap];
          a[j] = v; steps.push([OPS.OVERWRITE, j, v]); j -= gap;
          if (j >= gap) steps.push([OPS.COMPARE, j, j - gap]);
        }
        a[j] = temp; steps.push([OPS.OVERWRITE, j, temp]);
      }
    }
    for (let k = 0; k < n; k++) steps.push([OPS.SORTED, k]);
    return steps;
  }

  function mergeSort(a) {
    const steps = [], aux = a.slice();
    function merge(lo, mid, hi) {
      for (let k = lo; k <= hi; k++) aux[k] = a[k];
      let i = lo, j = mid + 1;
      for (let k = lo; k <= hi; k++) {
        if (i > mid) a[k] = aux[j++];
        else if (j > hi) a[k] = aux[i++];
        else { steps.push([OPS.COMPARE, i, j]); if (aux[i] <= aux[j]) a[k] = aux[i++]; else a[k] = aux[j++]; }
        steps.push([OPS.OVERWRITE, k, a[k]]);
      }
    }
    function sort(lo, hi) {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      sort(lo, mid); sort(mid + 1, hi); merge(lo, mid, hi);
    }
    sort(0, a.length - 1);
    for (let k = 0; k < a.length; k++) steps.push([OPS.SORTED, k]);
    return steps;
  }

  function quickSort(a) {
    const steps = [];
    function partition(lo, hi) {
      const pivot = a[hi]; steps.push([OPS.PIVOT, hi]);
      let i = lo;
      for (let j = lo; j < hi; j++) {
        steps.push([OPS.COMPARE, j, hi]);
        if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; steps.push([OPS.SWAP, i, j]); i++; }
      }
      [a[i], a[hi]] = [a[hi], a[i]]; steps.push([OPS.SWAP, i, hi]);
      return i;
    }
    function sort(lo, hi) {
      if (lo > hi) return;
      if (lo === hi) { steps.push([OPS.SORTED, lo]); return; }
      const p = partition(lo, hi);
      steps.push([OPS.SORTED, p]);
      sort(lo, p - 1); sort(p + 1, hi);
    }
    sort(0, a.length - 1);
    return steps;
  }

  function heapSort(a) {
    const steps = [], n = a.length;
    function siftDown(start, end) {
      let root = start;
      while (2 * root + 1 <= end) {
        let child = 2 * root + 1;
        if (child + 1 <= end) { steps.push([OPS.COMPARE, child, child + 1]); if (a[child] < a[child + 1]) child++; }
        steps.push([OPS.COMPARE, root, child]);
        if (a[root] < a[child]) { [a[root], a[child]] = [a[child], a[root]]; steps.push([OPS.SWAP, root, child]); root = child; }
        else return;
      }
    }
    for (let start = (n - 2) >> 1; start >= 0; start--) siftDown(start, n - 1);
    for (let end = n - 1; end > 0; end--) {
      [a[0], a[end]] = [a[end], a[0]]; steps.push([OPS.SWAP, 0, end]); steps.push([OPS.SORTED, end]);
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
      code: `for i in 0..n-1:\n  for j in 0..n-1-i:\n    if a[j] > a[j+1]:\n      swap(a[j], a[j+1])`
    },
    cocktail: {
      fn: cocktailSort, name: 'カクテルソート',
      desc: 'バブルソートを双方向にしたもの（シェーカーソート）。左→右で最大値を、右→左で最小値を確定させながら両端から範囲を狭めます。バブルより折り返しが少なく、やや効率的です。',
      c: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)', '安定'],
      code: `while swapped:\n  # 左→右: 最大を右へ\n  for i in start..end: bubble_up\n  # 右→左: 最小を左へ\n  for i in end..start: bubble_down`
    },
    selection: {
      fn: selectionSort, name: '選択ソート',
      desc: '未ソート部分から最小値を選び、その先頭と交換します。交換回数が少ない(最大n-1回)一方、比較は常にn²回行うため、どんなデータでも計算量は変わりません。',
      c: ['O(n²)', 'O(n²)', 'O(n²)', 'O(1)', '不安定'],
      code: `for i in 0..n-1:\n  min = i\n  for j in i+1..n:\n    if a[j] < a[min]: min = j\n  swap(a[i], a[min])`
    },
    insertion: {
      fn: insertionSort, name: '挿入ソート',
      desc: 'ソート済み部分に対し、次の要素を正しい位置へ挿入していきます。ほぼ整列済みのデータに非常に強く、小規模データでは高速。トランプの手札を並べる動作に似ています。',
      c: ['O(n)', 'O(n²)', 'O(n²)', 'O(1)', '安定'],
      code: `for i in 1..n:\n  key = a[i]; j = i-1\n  while j >= 0 and a[j] > key:\n    a[j+1] = a[j]; j--\n  a[j+1] = key`
    },
    shell: {
      fn: shellSort, name: 'シェルソート',
      desc: '離れた間隔(ギャップ)の要素同士で挿入ソートを行い、徐々にギャップを縮めます。挿入ソートを高速化した改良版で、大きく離れた要素を早期に移動できるのが特徴です。',
      c: ['O(n log n)', 'O(n^1.25)', 'O(n²)', 'O(1)', '不安定'],
      code: `gap = n/2\nwhile gap > 0:\n  for i in gap..n:\n    # gap間隔で挿入ソート\n  gap = gap/2`
    },
    merge: {
      fn: mergeSort, name: 'マージソート',
      desc: '配列を半分に分割し、それぞれをソートしてから併合(マージ)します。分割統治法の代表例。常にO(n log n)で安定という強みがある一方、追加メモリを必要とします。',
      c: ['O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', '安定'],
      code: `sort(lo, hi):\n  if lo >= hi: return\n  mid = (lo+hi)/2\n  sort(lo, mid); sort(mid+1, hi)\n  merge(lo, mid, hi)`
    },
    quick: {
      fn: quickSort, name: 'クイックソート',
      desc: 'ピボットを基準に「小さい群」「大きい群」へ分割し、再帰的にソートします。平均的に非常に高速で実用でよく使われます。ピボット選択が偏ると最悪O(n²)になります。',
      c: ['O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', '不安定'],
      code: `sort(lo, hi):\n  if lo >= hi: return\n  p = partition(lo, hi)\n  sort(lo, p-1)\n  sort(p+1, hi)`
    },
    heap: {
      fn: heapSort, name: 'ヒープソート',
      desc: '配列を二分ヒープに構築し、最大値を末尾へ取り出す操作を繰り返します。追加メモリ不要でO(n log n)を保証。安定ではありませんが最悪計算量が優れています。',
      c: ['O(n log n)', 'O(n log n)', 'O(n log n)', 'O(1)', '不安定'],
      code: `build_max_heap(a)\nfor end in n-1..1:\n  swap(a[0], a[end])\n  sift_down(0, end-1)`
    },
  };

  window.SortCore = { OPS, ALGOS };
})();
