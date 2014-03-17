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

function translate3d(element, x, y, z) {
  element.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px)';
  return element;
}

function each(indexed, step, a, b, c, d) {
  for (var i = 0; i < indexed.length; i++) step(indexed[i], i, a, b, c, d);
  return indexed;
}

function tween(from, to, factor) {
  return from + ((to - from) * factor);
}

function calcGridLeft(i, cols, w) {
  return (i % cols) * w;
}

function calcGridTop(i, cols, h) {
  return Math.floor(i / cols) * h;
}

function layoutEl(el, w, h, l, t) {
  el.style.width = w + 'px';
  translate3d(el, l, t, 0);
  return el;
}

function tweenGridLayout(gridEl, fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols, factor) {
  // Units are assumed to be direct children of grid for now.
  var unitEls = gridEl.children;

  // Calculate unit width from desired grid width.
  var fromUnitW = (fromGridW / fromCols);
  var toUnitW = (toGridW / toCols);

  var unitW = tween(fromUnitW, toUnitW, factor);
  var unitH = tween(fromUnitH, toUnitH, factor);

  // Calc desired static height of grid.
  var gridH = tween(
    calcGridTop(unitEls.length - 1, fromCols, fromUnitH) + fromUnitH,
    calcGridTop(unitEls.length - 1, toCols, toUnitH) + toUnitH,
    factor
  );

  var gridW = tween(
    fromGridW,
    toGridW,
    factor
  );

  // Set static dimensions for `gridEl`.
  gridEl.style.width = gridW + 'px';
  gridEl.style.height = gridH + 'px';  

  each(unitEls, function(el, i) {
    var elL = tween(
      calcGridLeft(i, fromCols, fromUnitW),
      calcGridLeft(i, toCols, toUnitW),
      factor
    );

    var elT = tween(
      calcGridTop(i, fromCols, fromUnitH),
      calcGridTop(i, toCols, toUnitH),
      factor
    );

    layoutEl(el, unitW, unitH, elL, elT);
  });

  return unitEls;
}

function gridLayoutTweener(fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols) {
  return (function tweenGridLayout_(gridEl, factor) {
    return tweenGridLayout(gridEl, fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols, factor);
  });
}

function setupDemo(gridEl) {
  var isThreeUp = true;

  var tweenGrid = gridLayoutTweener(300, 120, 3, 300, 110, 4);

  tweenGrid(gridEl, 0);

  gridEl.addEventListener('click', function (event) {
    // Toggle state
    isThreeUp = !isThreeUp;

    if (isThreeUp) tweenGrid(gridEl, 0);
    else tweenGrid(gridEl, 1);
  });
}