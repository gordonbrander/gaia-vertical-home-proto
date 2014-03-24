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

function each(indexed, step, a, b, c, d) {
  for (var i = 0; i < indexed.length; i++) step(indexed[i], i, a, b, c, d);
  return indexed;
}

function tween(scale, min, max) {
  return min + ((max - min) * scale);
}

// Calculate scaling factor from current, min and max values.
function toScale(curr, min, max) {
  return (curr - min) / (max - min);
}

function constrain(n, min, max) {
  return Math.max(Math.min(n, max), min);
}

function invertScale(scale) {
  return 1 - scale;
}

function calcGridLeft(i, cols, w) {
  return (i % cols) * w;
}

function calcGridTop(i, cols, h) {
  return Math.floor(i / cols) * h;
}

function layoutEl(el, l, t, f) {
  el.style.transform = 'translate3d(' + l + 'px, ' + t + 'px, 0px) scale(' + f + ')';
  return el;
}

function tweenGridLayout(gridEl, fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols, factor) {
  // Units are assumed to be direct children of grid for now.
  var unitEls = gridEl.children;

  // Calculate unit width from desired grid width.
  var fromUnitW = (fromGridW / fromCols);
  var toUnitW = (toGridW / toCols);

  var unitW = tween(factor, fromUnitW, toUnitW);
  var unitH = tween(factor, fromUnitH, toUnitH);

  // Derive scaling factor from current unit width vs largest unit width.
  var scaleF = unitW / fromUnitW;

  // Unit offset makes up for scale offset.
  var unitLOffset;
  var unitTOffset;

  // Calc desired static height of grid.
  var gridH = tween(
    factor,
    calcGridTop(unitEls.length - 1, fromCols, fromUnitH) + fromUnitH,
    calcGridTop(unitEls.length - 1, toCols, toUnitH) + toUnitH
  );

  // Set static height for `gridEl`.
  gridEl.style.height = gridH + 'px';

  each(unitEls, function(el, i) {
    var elL = tween(
      factor,
      calcGridLeft(i, fromCols, fromUnitW),
      calcGridLeft(i, toCols, toUnitW)
    );

    var elT = tween(
      factor,
      calcGridTop(i, fromCols, fromUnitH),
      calcGridTop(i, toCols, toUnitH)
    );

    layoutEl(el, elL, elT, scaleF);
  });

  return unitEls;
}

function gridLayoutTweener(gridEl, fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols) {
  return (function (factor) {
    return tweenGridLayout(gridEl, fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols, factor);
  });
}

// Map a custom "transform" event from GestureDetector to absolute scale factor.
function event2AbsoluteScale(event) {
  return event.detail.absolute.scale;
}

// `gridEl` is the element who's children should be layed out.
// 
// `pinchRange` is a 2-array containing the pinch scale range within which
// scaling occurs.
function setupPinchScale(gridEl) {
  // Turn on GestureDetector for `gridEl`. Fires custom "transform"
  // (pinch/scale) gestures.
  (new GestureDetector(gridEl)).startDetecting();

  // This is our pinching sensitivity range. Making the distance between 0 and 1
  // smaller will make the pinch more sensitive. Pass this to `setupPinchScale`
  // on invocation.
  var pinchMin = 0.4;
  var pinchMax = 1;

  // Capture custom "transform" events from GestureDetector.
  var transforms = on(gridEl, 'transform');

  var absScales = map(transforms, event2AbsoluteScale);
  var absScale = stepper(absScales, pinchMax);
  var constrainedScale = lift3(constrain, absScale, pinchMin, pinchMax);

  // Calculate factor representing distance traveled between min and max.
  var adjustedInverseScale = lift3(toScale, constrainedScale, pinchMin, pinchMax);
  // 0..1
  var scale = lift(invertScale, adjustedInverseScale);

  var tweenGrid = gridLayoutTweener(gridEl, 300, 120, 3, 300, 110, 4);

  var render = check(scale, animationFrames);
  render(tweenGrid);
}