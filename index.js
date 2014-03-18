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

  var gridW = tween(fromGridW, toGridW, factor);

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

function gridLayoutTweener(gridEl, fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols) {
  return (function (factor) {
    return tweenGridLayout(gridEl, fromGridW, fromUnitH, fromCols, toGridW, toUnitH, toCols, factor);
  });
}

function isEvent2Finger(event) {
  return event.touches.length === 2;
}

function event2Touch0Coords(event) {
  return [event.touches[0].screenX, event.changedTouches[0].screenY];
}

function event2Touch1Coords(event) {
  return [event.touches[1].screenX, event.changedTouches[1].screenY];
}

function bound(n, min, max) {
  return Math.max(Math.min(n, max), 0);
}

function calcFactorFromPinchCoords(maxDist, start0Coord, move0Coord, start1Coord, move1Coord) {
  // All I care about is euclidian distance from origin.  
  // The distance is considered the sum total distance of the pinch/zoom.
  var dist0 = distV(start0Coord, move0Coord);
  var dist1 = distV(start1Coord, move1Coord);
  return bound((dist0 + dist1) / maxDist, 0, 1);
}

// Will need to calculate euclidian distance covered from start position for
// each finger. Then we map that distance to a distance range of probably around
// 100px...
function setupPinchScale(gridEl) {
  var touchstarts = on(gridEl, 'touchstart');
  var touchmoves = on(gridEl, 'touchmove');
  var frames = animationFrames();

  var touchstarts2Finger = hub(filter(touchstarts, isEvent2Finger));
  var touchmoves2Finger = hub(filter(touchmoves, isEvent2Finger));

  var start0Coord = stepper(map(touchstarts2Finger, event2Touch0Coords), [0, 0]);
  var start1Coord = stepper(map(touchstarts2Finger, event2Touch1Coords), [0, 0]);

  var move0Coord = stepper(map(touchmoves2Finger, event2Touch0Coords), [0, 0]);
  var move1Coord = stepper(map(touchmoves2Finger, event2Touch1Coords), [0, 0]);

  var factor = lift5(
    calcFactorFromPinchCoords,
    200,
    start0Coord,
    move0Coord,
    start1Coord,
    move1Coord
  );

  var tweenGrid = gridLayoutTweener(gridEl, 300, 120, 3, 300, 110, 4);

  var render = check(factor, frames);

  render(tweenGrid);
}

function calcFactorFromDragCoords(maxDist, start0Coord, move0Coord) {
  var dist = start0Coord[1] - move0Coord[1];
  return bound(dist / maxDist, 0, 1);
}

function setupDemoScale(gridEl) {
  var touchstarts = on(gridEl, 'touchstart');
  var touchmoves = on(gridEl, 'touchmove');
  var frames = animationFrames();

  var start0Coord = stepper(map(touchstarts, event2Touch0Coords), [0, 0]);
  var move0Coord = stepper(map(touchmoves, event2Touch0Coords), [0, 0]);

  var factor = lift5(
    calcFactorFromDragCoords,
    200,
    start0Coord,
    move0Coord
  );

  var tweenGrid = gridLayoutTweener(gridEl, 300, 120, 3, 300, 110, 4);

  var render = check(factor, frames);

  render(tweenGrid);
}