// We need to
//
// * Take an update containing changed homescreen icon positions
//   The first update will be _all_.
// * Update positions of changed elements using a distribute logic.
// * All slots use `transition: transform`. Layouting is done with
//   `translate3d()`, icon scaling with `scale()`.

// What does the data look like?
// Home grid width
// Number of columns
// Icon order
// Icon width
// Total height of icons per group

// Handle element sorting by an array of weight changes.

// [{ weight: 200.2, value: 'foo' }]

// Access a value at index `i`.
function at(indexed, i) {
  // If `indexed` is a value, not an indexed object, return value itself.
  if (indexed == null || indexed.length == null) return indexed;
  // If i is within range, treat this as standard property access.
  else if (i < indexed.length) return indexed[i];
  // If `i` is greater than length, use the "repeat last item" rule.
  // This makes it easy to zip 2 items of different length, for example.
  else return indexed[len - 1];
}

// Fold a value by zipping `a` and `b`, where:
// `a` is an indexed object.  
// `b` is an indexed object or any other value.
function cofold(a, b, step, folded) {
  // We use `a` as the driver for iteration.
  for (var i = 0, length = a.length; i < length; i++)
    // Note that since `b` is accessed via `at()`, it can be a plain value.
    folded = step(folded, a[i], at(b, i), i);
  return folded;
}

// Assign a new `item` to vector `v` at index `i`.
// Mutates and returns vector `v`.
function assignV(v, i, item) {
  // Assign item to property.
  v[i] = item;
  // If length is not properly handled by this datatype, update it manually.
  if (!v.length || i >= v.length) v.length = i + 1;
  return v;
}

function assignSub(into, n0, n1, i) {
  return assignV(into, i, n0 - n1);
}

// Subtract v1 from v0, returning mutated vector `into`.
function subV(into, v0, v1) {
  return cofold(v0, v1, assignSub, into);
}

function assignMult(into, n0, n1, i) {
  return assignV(into, i, n0 * n1);
}

// Multiply `v0` by `v1`, returning mutated vector `into`.
function multV(into, v0, v1) {
  return cofold(v0, v1, assignMult, into);
}

function tweenV(into, from, to, factor) {
  return multV(into, subV(into, to, from), factor);
}

// Find the column this item belongs to.
function calcGridCol(i, cols) {
  return (i % cols);
}

// Find the row this item belongs to.
function calcGridRow(i, cols) {
  return Math.floor(i / cols);
}

function calGridLeft(i, cols, w) {
  return calcGridCol(i, cols) * w;
}

function calcGridTop(i, cols, h) {
  return calcGridRow(i, cols) * h;
}

function makeUnitStats(i, w, h, grid, cols) {
  var colW = gridW / cols;
  return [
    w,
    h,
    calcGridLeft(i, cols, w) + ((colW - w) / 2),
    calcGridTop(i, cols, h)
  ];
}

function translate3d(element, x, y, z) {
  element.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px)';
  return element;
}

function fold4(indexed, step, initial, a, b, c, d) {
  var folded = initial;
  for (var i = 0; i < indexed.length; i++)
    folded = step(indexed[i], folded, a, b, c, d);
  return folded;
}

function foldIntoGrid_(element, i, w, h, gridW, cols) {
  // Find the column slot width.
  var colW = (gridW / cols);

  // Left offset = position over to column, then add additional "padding"
  // to center content in slot.
  var offsetLeft = (calcGridCol(i, cols) * colW) + ((colW - w) / 2);
  var offsetTop = (calcGridRow(i, cols) * h);

  element.style.width = w + 'px';

  translate3d(element, offsetLeft, offsetTop, 0)

  return i + 1;
}

function layoutEachInGrid(elements, w, h, gridW, cols) {
  fold4(elements, foldIntoGrid_, 0, w, h, gridW, cols);
  return elements;
}

// Significant dimensions:
// 
// Column width
// Unit width
// Unit height
// Number of columns
// Grid width
// 
// The most useful driving dimensions are:
// 
// Grid width
// Number of columns
// Unit height

function layoutGrid(gridEl, gridW, unitH, cols) {
  // Any child of `gridEl` is treated as the element to be layed out, for now.
  var unitEls = gridEl.children;

  // Calc desired static height of grid.
  var gridH = calcGridTop(unitEls.length - 1, cols, unitH) + unitH;

  // Set dimensions of `gridEl`.
  gridEl.style.width = gridW + 'px';
  gridEl.style.height = gridH + 'px';

  // Layout children in grid.
  layoutEachInGrid(unitEls, (gridW / cols), unitH, gridW, cols);
}

function setupDemo(gridEl, unitEls) {
  var isThreeUp = true;

  layoutGrid(gridEl, 300, 120, 3);

  gridEl.addEventListener('click', function (event) {
    // Toggle state
    isThreeUp = !isThreeUp;

    if (isThreeUp) layoutGrid(gridEl, 300, 120, 3);
    else layoutGrid(gridEl, 300, 110, 4);
  });
}