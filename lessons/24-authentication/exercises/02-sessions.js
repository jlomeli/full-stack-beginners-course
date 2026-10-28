import { randomBytes } from 'node:crypto';

// Three small tools that the log-in routes in exercise 3 are built from.

// Read the Cookie request header.
//
// parseCookies(header) turns 'theme=dark; sid=abc123' into { theme: 'dark', sid: 'abc123' }.
// - An undefined or empty header gives {}.
// - Split pairs on ";" and trim the spaces around each pair. Split name from value at the FIRST "=",
//   because a value may contain more "=" characters.
// - A part with no "=" is ignored.
// - Decode each value with decodeURIComponent. A value that can't be decoded (for example "%") is kept as it is,
//   and never throws: a stranger controls this header.
// - When a name appears twice, the first one wins.
export function parseCookies(header) {
	// TODO
}

// Build a Set-Cookie response header.
//
// serializeCookie(name, value, options) starts with `name=value`, with the value passed through encodeURIComponent.
// Then it adds these parts, in this order, each separated by "; ", and only when the option is given:
//
//   path       -> Path=<path>
//   maxAge     -> Max-Age=<seconds>   (0 is allowed: it tells the browser to delete the cookie)
//   httpOnly   -> HttpOnly            (when true)
//   secure     -> Secure              (when true)
//   sameSite   -> SameSite=<value>
//
// serializeCookie('sid', 'abc', { path: '/', httpOnly: true, sameSite: 'Lax' })
//   returns 'sid=abc; Path=/; HttpOnly; SameSite=Lax'
export function serializeCookie(name, value, options = {}) {
	// TODO
}

// Keep track of who is logged in.
//
// createSessionStore({ ttlMs, now }) returns an object with three methods. ttlMs is how long a session lasts
// (default 7 days, in milliseconds). now is a function that returns the current time in milliseconds
// (default Date.now). Tests pass their own `now` to move the clock.
//
// - create(userId) makes a new session and returns its id. The id is 32 random bytes written as hex
//   (64 characters), made with randomBytes. It must be unguessable, so never build it from a counter or the date.
// - get(id) returns the userId stored for that id, or undefined when the id is unknown or the session has
//   expired. An expired session is removed when you find it.
// - destroy(id) removes the session. Destroying an unknown id does nothing and doesn't throw.
export function createSessionStore({ ttlMs = 7 * 24 * 60 * 60 * 1000, now = Date.now } = {}) {
	const sessions = new Map();

	return {
		create(userId) {
			// TODO
		},
		get(id) {
			// TODO
		},
		destroy(id) {
			// TODO
		},
	};
}
