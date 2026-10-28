// Return a middleware that logs one line for every request, after the response is sent:
//
//   GET /notes 200 3ms
//
// The line is the method, the URL the client asked for (with any query string),
// the status code the response went out with, and how long the request took
// in whole milliseconds.
//
// Write the line with the `log` function you're given. It defaults to console.log.
// The middleware must call next() so the routes after it still run.
export function requestLogger(log = console.log) {
	// TODO
}
