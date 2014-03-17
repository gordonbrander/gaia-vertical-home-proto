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

// Access index in an indexed value using the repeat-last-item rule.
// This makes it easy to zip 2 different-sized arrays together, for example.
function at(indexed, i) {
  // If item is not indexed, treat value as itself.
  if (indexed == null || indexed.length == null) return indexed;
  // If i is within range, treat this as standard property access.
  else if (i < indexed.length) return indexed[i];
  // Otherwise, use the "repeat last item" rule.
  else return indexed[len - 1];
}

// Fold a value by zipping `a` and `b`, where:
// `a` is any indexed object.  
// `b` is any indexed object or any other value.
function cofold(a, b, step, folded) {
  for (var i = 0, length = a.length; i < length; i++)
    folded = step(folded, at(a, i), at(b, i), i);
  return folded;
}

function append(indexed, item) {
  var length = indexed.length;
  indexed.length = length + 1;
  indexed[length] = item;
  return indexed;
}

function appendSub(into, n0, n1) {
  return append(into, n0 - n1);
}

// Subtract v2 from v1, returning a vector.
function subV(v0, v1, into) {
  return cofold(v0, v1, appendSub, into || []);
}

function appendMult(into, n0, n1) {
  return append(into, n0 * n1);
}

function multV(v0, v1, into) {
  // Multiply a vector by another vector.
  return cofold(v0, v1, appendMult, into || []);
}

function tweenV(from, to, factor, into) {
  return multV(subV(to, from, into), factor, into);
}

// Find the column this item belongs to.
function calcGridCol(i, cols) {
  return (i % cols);
}

// Find the row this item belongs to.
function calcGridRow(i, cols) {
  return Math.floor(i / cols);
}

function makeUnitStats(i, w, h, grid, cols) {
  var colW = gridW / cols;
  var adjustmentLeft = ((colW - w) / 2);
  return [
    w,
    h,
    (calcGridCol(i, cols) * w) + adjustmentLeft,
    (calcGridRow(i, cols) * h)
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

function placeEachInGrid(elements, w, h, gridW, cols) {
  fold4(elements, foldIntoGrid_, 0, w, h, gridW, cols);
  return elements;
}

function setupGrid(gridEl, unitEls, w, h, cols) {
  var gridW = gridEl.innerWidth;
  var gridH = (calcGridRow(i, cols) * h)
  fold4(elements, foldIntoGrid_, 0, w, h, gridW, cols);  
}

function setupDemo(gridEl, unitEls) {
  var isThreeUp = true;

  placeEachInGrid(unitEls, 100, 120, 300, 3);

  gridEl.addEventListener('click', function (event) {
    // Toggle state
    isThreeUp = !isThreeUp;

    if (isThreeUp) placeEachInGrid(unitEls, 100, 120, 300, 3);
    else placeEachInGrid(unitEls, 75, 100, 300, 4);
  });
}