// Each of these takes a function and returns a new function that wraps it.

// Return a new function that calls `fn` the first time it's called and returns fn's result.
// Every later call returns that same first result without calling `fn` again.
// Pass every argument the new function receives along to `fn`.
//
//   const init = once(() => console.log('starting'));
//   init();   // logs "starting"
//   init();   // logs nothing
export function once(fn) {
	// TODO
}

// Return a new function that remembers the results of `fn`, a function of one argument.
// - The first call with an argument calls `fn` and remembers the result.
// - A later call with the same argument returns the remembered result without calling `fn`.
// - Results like 0, '', false, null, and undefined get remembered too.
//
//   const slowSquare = (n) => { ...takes a second... return n * n; };
//   const fastSquare = memoize(slowSquare);
//   fastSquare(9);   // 81, after a second
//   fastSquare(9);   // 81, right away
export function memoize(fn) {
	// TODO
}

// Return a new function that waits until it hasn't been called for `wait` milliseconds,
// then calls `fn` once, with the arguments from the most recent call.
// Each new call restarts the wait.
//
//   const save = debounce((text) => saveDraft(text), 500);
//   save('H'); save('Hi'); save('Hi!');
//   // 500ms after the last call, saveDraft('Hi!') runs once
export function debounce(fn, wait) {
	// TODO
}
