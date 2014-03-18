/*
n-vector.js

Copyright (c) 2014 Gordon Brander
Released under the MIT license
http://opensource.org/licenses/MIT

Generic, efficient JavaScript vector math using ordinary arrays
or indexed objects.

n-vector supports:

* Arrays
* Custom indexed (arraylike) objects
* Typed arrays

Vectors can be of any length.

For functions that return a vector, the first argument `into` is a vector object
that will be mutated with the result. If you want to return a new vector, simply
supply a new array. Example:

    addV([], [1, 2, 3], [1, 2, 3])
    // [2, 4, 6]
*/

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

function assignAdd(into, n0, n1, i) {
  return assignV(into, i, n0 + n1);
}

// Add v1 to v0, returning mutated vector `into`.
function addV(into, v0, v1) {
  return cofold(v0, v1, assignAdd, into);
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

function assignDiv(into, n0, n1, i) {
  return assignV(into, i, n0 / n1);
}

// Divide a vector by another vector.
function divV(into, v0, v1) {
  return cofold(v0, v1, assignDiv, into);
}

function sumOfProduct(sum, n0, n1) {
  return sum + (n0 * n1);
}

// Calculates the dot product of two vectors.
function dotV(v0, v1) {
  return cofold(v0, v1, sumOfProduct, 0);
}

// Fold a value by zipping `a` and `b`, where:
// `a` is any indexed object.  
// `b` is any indexed object or any other value.
function fold(indexed, step, folded) {
  for (var i = 0, length = indexed.length; i < length; i++)
    folded = step(folded, indexed[i], i);
  return folded;
}

function sum(n0, n1) {
  return n0 + n1;
}

// Sum all the numbers in a vector.
// vector -> Number
function sumV(v) {
  return fold(v, sum, 0);
}

// Square `number`, add to `sum`. Used with reduce for `magSq`.
function sumOfSquares(sum, n) {
  return sum + (n * n);
}

// Calculate the square magnitude of a vector.
// Returns a Number
// v -> Number
function magSqV(v) {
  return fold(v, sumOfSquares, 0);
}

// Calculate the mangitude of a vector (length)
// Returns a Number
// v -> Number
function magV(v) {
  return Math.sqrt(magSqV(v));
}

// Calculates the Euclidean distance between two points (considering a
// point as a vector object).
function distV(v0, v1) {
  return magV(subV([], v0, v1));
}
