// Four small helpers for working with promises. Each one is a tool you reach for again and again.

// Return a promise that resolves with `value` after `ms` milliseconds.
// delay(1000, 'done') resolves with 'done' one second from now.
export function delay(ms, value) {
	// TODO
}

// Fetch `url` and return the parsed JSON body.
// If the response is not ok (response.ok is false), throw an Error with the message
// "Request failed with status 404", using the real status code.
// If fetch itself fails (no network), let that error through unchanged.
export async function fetchJson(url) {
	// TODO
}

// Fetch every URL at the same time and return an array with each URL's JSON, in the same
// order as `urls`, even when the responses arrive in a different order.
// Start every request before you wait for any of them.
// If any request fails, the returned promise rejects with that error.
export async function loadAll(urls) {
	// TODO
}

// Wait for `promise`, but give up after `ms` milliseconds.
// - If the promise settles first, settle the same way (same value, or same error).
// - If the time runs out first, reject with an Error that says "Timed out after 500ms",
//   using the real number of milliseconds.
// - Clear the timer once the promise settles, so nothing is left waiting.
export function withTimeout(promise, ms) {
	// TODO
}
