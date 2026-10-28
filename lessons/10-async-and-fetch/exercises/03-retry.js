// Networks fail for a moment and then work again. These helpers try a request more than once,
// waiting longer after each failure so a struggling server gets room to recover.

// Wait `ms` milliseconds. Already written for you.
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Call an async function until it succeeds or you run out of retries.
//
// retry(task, { retries, baseDelay, shouldRetry })
// - task: a function that returns a promise. Call it again for each attempt.
// - retries: how many times to try again after the first failure. Default 3,
//   so a task that always fails runs 4 times in total.
// - baseDelay: milliseconds to wait before the first retry. Default 100.
//   Double the wait before each later retry: 100, 200, 400 with the defaults.
//   Do not wait after the last failure.
// - shouldRetry: a function that gets the error and returns true to try again.
//   Default: retry every error. When it returns false, give up and reject with that error right away.
//
// Resolve with the first successful result. When every attempt fails, reject with the last error.
export async function retry(task, { retries = 3, baseDelay = 100, shouldRetry = () => true } = {}) {
	// TODO
}

// Fetch `url` and return the parsed JSON, using retry with the default settings.
// Retry when fetch itself fails (no network) and when the server answers with a 5xx status.
// Do not retry a 4xx status: the request is wrong, and asking again will not fix it.
// When you give up, the error says "Request failed with status 503", using the real status.
export async function fetchJsonWithRetry(url) {
	// TODO
}

// A fetch that throws on a bad status. The error carries the status so shouldRetry can read it.
// Already written for you.
export async function fetchJson(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw Object.assign(new Error(`Request failed with status ${response.status}`), { status: response.status });
	}
	return response.json();
}
