// We need to
//
// * Take an update containing changed homescreen icon positions
//   The first update will be _all_.
// * Update positions of changed elements using a distribute logic.
//   All slots use `transition: transform`. Layouting is done with
//   `translate3d()`.