// Minimal FRP Behaviors and Events.

// An event function is any function of shape `function (next) { ... }` where
// `next(value)` is a callback to be called by event function. Transformations
// of event are accomplished by wrapping event with another event function,
// and consuming original event within (CPS).

// A behavior is any zero-argument function that returns a vlaue.
// Behaviors must always return a value, but value may
// change over time.

// Get snapshot value of behavior (any 0-arity function) at "now" in program
// execution time.
function snapshot(behave) {
  // If behavior is a function, invoke it and return value.
  // All other values are treated as constant behaviors. Return them as-is.
  return typeof behave === 'function' ? behave() : behave;
}

// Create a behavior function from an events function and an initial value.
// Returns a behavior who's value changes whenever event occurs.
// events, initial -> behavior
function stepper(events, initial) {
  var valueAtLastStep = initial;

  events(function nextStep(value) {
    valueAtLastStep = value;
  });

  return (function behaveAtLastStep() {
    return valueAtLastStep;
  });
}

// Lift a function `f` to become a of discrete value arguments, invoking it with snapshot
// value of a behavior.
// 
// Returns a behavior representing return value of function applied with
// current behavior value.
function lift(f, behave) {
  return (function behaveLift(now) {
    return f(snapshot(behave));
  });
}

// Lift a function `f` of 2 arguments. Returns a behavior.
function lift2(f, behaveA, behaveB) {
  return (function behaveLift(now) {
    return f(snapshot(behaveA), snapshot(behaveB));
  });
}

// Lift a function `f` of 3 arguments. Returns a behavior.
function lift3(f, behaveA, behaveB, behaveC) {
  return (function behaveLift(now) {
    return f(snapshot(behaveA), snapshot(behaveB), snapshot(behaveC));
  });
}

// Lift a function `f` of 4 arguments. Returns a behavior.
function lift4(f, behaveA, behaveB, behaveC, behaveD) {
  return (function behaveLift(now) {
    return f(snapshot(behaveA), snapshot(behaveB), snapshot(behaveC), snapshot(behaveD));
  });
}

// Lift a function `f` of 5 arguments. Returns a behavior.
function lift5(f, behaveA, behaveB, behaveC, behaveD, behaveE) {
  return (function behaveLift(now) {
    return f(snapshot(behaveA), snapshot(behaveB), snapshot(behaveC), snapshot(behaveD), snapshot(behaveE));
  });
}

// Lift a function of `n` arguments, invoking it with current values of an array
// of behaviors. Returns a behavior.
function liftN(f, behaviors) {
  return (function behaveLiftN(now) {
    return f.apply(null, behaviors.map(snapshot));
  });
}

function map(events, a2b) {
  return (function eventsMapped(next) {
    events(function nextMap(value) {
      next(a2b(value));
    });
  });
}

function filter(events, predicate) {
  return (function eventsFiltered(next) {
    events(function nextFilter(value) {
      if (predicate(value)) next(value);
    });
  });
}

function reject(events, predicate) {
  return (function eventsRejected(next) {
    events(function nextReject(value) {
      if (!predicate(value)) next(value);
    });
  });
}

// Past-dependant reduction.
// Returns an event function containing result of each step of reduction.
function foldp(events, step, initial) {
  return (function eventsFoldp(next) {
    // Note: reductions is stateful, so we make sure to re-capture accumulated
    // state every time `eventsReductions` is called.
    var accumulated = initial;
    events(function nextReduction(value) {
      next(accumulated = step(accumulated, value));
    });
  });
}

// Accumulate a value as a behavior. Initial value is treated as "step 0".
function reduced(events, step, initial) {
  return stepper(foldp(events, step, initial), initial);
}

function id(thing) {
  return thing;
}

// Sample value of `behave` every time an event happens in `events`.
// An optional `assemble` function allows you to generate value from behavior
// value and event value. Returns new event function.
// behavior, event, assemble -> event
function sample(behave, events, assemble) {
  assemble = assemble || id;
  return (function eventsSampled(next) {
    events(function nextSample(value) {
      // Assemble value from sampled behavior and current event value.
      next(assemble(snapshot(behave), value));
    });
  });
}

// Check if something is nullish.
// Returns boolean.
function isNothing(thing) {
  return thing == null;
}

function maybeDifferent(a, b) {
  return a !== b ? b : null;
}

function rejectRepeats(events) {
  return reject(foldp(events, maybeDifferent, null), isNothing);
}

// Check for changes in `behave` whenever an event occurs in `events`.
// Returns an events function that will trigger `next` every time value of
// `behave` has changed since last event in `trigger`.
function check(behave, events) {
  return rejectRepeats(sample(behave, events));
}

// Delay an event by one event, essentially shifting events "forward".
// Returns an events function.
function prior(events) {
  return (function eventsPrior(next) {
    // Use eventsPrevious as token to represent "hasn't any value yet".
    var prev = eventsPrior;

    events(function nextCurrent(value) {
      if (prev !== eventsPrior) next(prev);
      prev = value;
    });
  });
}

// Return an events function containing events from `eventsLeft`, while behavior
// function `isLeft` is true and events from `eventsRight` while `isLeft`
// is false.
function multiplex(isLeft, eventsLeft, eventsRight) {
  return (function eventsMultiplexed(next) {
    eventsLeft(function nextLeft(value) {
      if (snapshot(isLeft)) next(value);
    });

    eventsRight(function nextRight(value) {
      if (!snapshot(isLeft)) next(value);
    });
  });
}

// Call function with value as a side-effect. Returns value.
function callWith(value, f) {
  f(value);
  return value;
}

// Merge array of event functions into a single event, with discrete event
// occurances ordered by time.
function merge(arrayOfEvents) {
  return (function eventsMerged(next) {
    arrayOfEvents.reduce(callWith, next);
  });
}

// Zip 2 events functions by order of events, returning a new events function
// that contains the results of `assemble`.
// Returns an events function.
function zipWith(eventsLeft, eventsRight, assemble) {
  return (function eventsZippedWith(next) {
    // Create 2 buffer arrays to manage older items.
    var bufferLeft = [];
    var bufferRight = [];

    // Assemble will always be called with a `valueLeft` and a `valueRight`
    // argument. If one is missing, the other will be kept buffered until
    // the next event comes in.

    eventsLeft(function nextBufferLeft(valueLeft) {
      // If there are any buffered right values, shift off the first one in,
      // and assemble it with left.
      if (bufferRight.length) next(assemble(valueLeft, bufferRight.shift()));
      // Otherwise buffer until its mate comes along.
      else bufferLeft.push(valueLeft);
    });

    eventsRight(function nextBufferRight(valueRight) {
      if (bufferLeft.length) next(assemble(bufferLeft.shift(), valueRight));
      else bufferRight.push(valueRight);
    });
  });
}

// Return a new behavior function that will act as `behaveLeft` until an event
// occurs in events function `events`. From then on, behavior will act
// as `behaveRight`.
function until(events, behaveLeft, behaveRight) {
  var isFired = false;

  events(function nextEvent() {
    isFired = true;
  });

  return (function behaveUntil() {
    return snapshot(!isFired ? behaveLeft : behaveRight);
  });
}

// Return a new behavior function that will toggle between `behaveLeft` and
// `behaveRight` every time an event occurs in event function `events`.
function toggle(events, behaveLeft, behaveRight) {
  var isLeft = true;

  events(function nextEvent() {
    isLeft = !isLeft;
  });

  return (function behaveToggled() {
    return snapshot(isLeft ? behaveLeft : behaveRight);
  });
}

// Create a behavior from 2 events functions. Events occuring in `onEvents`
// will switch behavior state to true. Events occuring in `offEvents` will
// switch behavior state to false. 
function switcher(onEvents, offEvents, initial) {
  var isOn = !!initial;

  onEvents(function nextOnEvent() {
    isOn = true;
  });

  offEvents(function nextOffEvent() {
    isOn = false;
  });

  return (function behaveSwitch() {
    return isOn;
  });
}

// Create a behavior containing times since last reset triggered by
// `resetEvents`.
function timer(resetEvents) {
  var begin = 0;

  resetEvents(function nextReset() {
    begin = Date.now();
  });

  return (function behaveTimer() {
    return Date.now() - begin;
  });
}

// Transform an events function, ensuring it will fire no more than once every
// given `ms`. Returns a throttled events function.
function throttle(events, ms) {
  return (function eventsThrottled(next) {
    var last = -Infinity;
    events(function nextThrottle(value) {
      if ((Date.now() - last) < ms) next(value);
    });
  });
}

// Turn an array of behaviors into a behavior of arrays of values.
function all(arrayOfBehaviors) {
  return (function behaveAll(time) {
    return arrayOfBehaviors.map(snapshot);
  });
}

// Create a behavior containing a series of interpolated "echoes" between
// [0..1]. Every time an event occurs in `events`, the resulting behavior will
// be reset to `0`, then ease back to `1` within given `duration`. An easing
// curve may be defined via `ease` function.
// 
// Returns a behavior function of values `[0..1]`.
function interpolate(resetEvents, duration) {
  // Initialize reset variable. Last time reset is `-Infinity` (never).
  var reset = -Infinity;

  resetEvents(function nextReset() {
    // Reset at time of event occurance.
    reset = Date.now();
  });

  return (function behaveInterpolated() {
    var time = Date.now();
    if (time > (reset + duration)) return 1;
    if (time < reset) return 0;
    return (time - reset) / duration;
  });
}

// Power-based easing functions for numbers in range [0..1].
// 
// Here's how to recreate Robert Penner's easing curves:
// 
// easeInQuad: `easeIn(factor, 2)`
// easeOutQuad: `easeOut(factor, 2)`
// easeInOutQuad: `easeInOut(factor, 2)`
// Cubic: 3
// Quart: 4
// Quint: 5
// 
// Tip: use these functions with `lift2()` to ease behaviors created
// with `interpolate()`. For example, here's a 2000ms behavior eased w/ Quart:
//
//     var y = interpolate(x, 2000);
//     var z = lift2(easeIn, y, 4);

// easeIn is just a nice pseudonym for `Math.pow`.
var easeIn = Math.pow;

// easeOut is an inverse power.
function easeOut(factor, power) {
  return 1 - Math.pow(1 - factor, power);  
}

// easeInOut creates a bell curve.
function easeInOut(factor, power) {
  return factor < 0.5 ?
    Math.pow(factor * 2, power) / 2 :
    1 - (Math.pow((1 - factor) * 2, power) / 2);
}


// Scale range `from` - `to`, via `factor`.
function tween(scale, min, max) {
  return min + ((max - min) * scale);
}

// Calculate scaling factor from current, min and max values.
function toScale(curr, min, max) {
  return (curr - min) / (max - min);
}

// Event and behavior sources
// -----------------------------------------------------------------------------

// Hub a source event so it is only consumed once. Occurances of original event
// will be dispatched to every callback.
// 
// Note that callbacks added after event consumption starts will miss
// earlier events.
//
// You can use this for events that get consumed a number of times. It can save
// a bit of overhead since closures down the chain from hub will only be
// created once.
function hub(events) {
  var nexts = [];
  var isStarted = false;

  return (function eventsHubbed(next) {
    nexts.push(next);

    // Kick off source event if not done yet.
    if (!isStarted) {
      events(function nextDispatchToHub(value) {
        nexts.reduce(callWith, value);
      });

      isStarted = true;
    }
  });
}

// Create an events function containing all DOM events of `name` on `element`.
// Returns an event function.
function on(element, name, useCapture) {
  // Note that each call to resulting event function will attach a new listener.
  // If you want to share a single listener between multiple consumers,
  // transform `eventsOnDomEvents` with `hub()`.
  return (function eventsOnDomEvents(next) {
    element.addEventListener(name, next, !!useCapture);
  });
}

// Select any available requestAnimationFrame.
// [raf]: https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame
var requestAnimationFrame = (
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame
);

// An events function containing occurances of animation frames.
// Useful for sheduling writes to DOM using something like `changes`.
// Because this is an event function you can pass it directly to `map`,
// `filter`, et al.
function animationFrames(next) {
  // Kick off animation frame loop.
  requestAnimationFrame(function nextFrame(time) {
    // Call `next()` with time.
    next(time);
    requestAnimationFrame(nextFrame);
  });
}
