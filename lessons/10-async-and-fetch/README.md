# 10. Asynchronous JavaScript and fetch

In this lesson you build a weather widget that loads live data from a public API, and a retry helper that survives a flaky network. Along the way you learn why JavaScript can wait for things without freezing the page.

## What you will be able to do

- Explain the event loop at a whiteboard level
- Use promises and async/await
- Fetch JSON from an API and handle loading and error states

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-10
```

Run the tests for this lesson:

```sh
npm test 10
```

You see 43 failing tests. Your job this lesson is to make them pass. The tests never touch the real network. They replace `fetch` with a fake, so they run the same way every time, offline or not.

## Why code has to wait

Some things take time: a request to a server, a timer, reading a file. JavaScript runs your code on one thread, one thing at a time. If it stopped to wait for a server, the whole page would freeze: no clicks, no scrolling.

So JavaScript doesn't wait. It starts the slow thing, moves on, and comes back when the result is ready.

## The event loop

Four pieces explain how this works. Draw them on paper as you read.

- **The call stack** holds the function that is running now. JavaScript finishes it before doing anything else.
- **Web APIs** (in the browser) or the runtime (in Node) do the slow work for you: timers, network requests.
- **The task queue** holds callbacks that are ready to run, such as a finished timer.
- **The microtask queue** holds promise callbacks that are ready to run.

The **event loop** is a loop with one rule. When the call stack is empty, run every microtask. Then take one task from the task queue and run it. Repeat forever.

Predict what this prints before you run it:

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');
```

Save it as `scratch.js` outside the `lessons/` folder, or paste it into `node` and check. You see `A`, `C`, `B`. The timer delay is 0, yet `B` comes last. `setTimeout` hands the callback to the timer, and the callback waits in the task queue until the call stack is empty. `console.log('C')` is still on the stack, so it goes first.

Now the part that surprises people. Promise callbacks run before timer callbacks:

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
```

You see `1`, `4`, `3`, `2`. The promise callback sits in the microtask queue, and the loop empties that queue before it takes the next task.

Open `exercises/event-loop.md`. It has three more snippets. Write your prediction for each one before you run it, then explain why.

## Promises

A promise is an object that stands for a value you don't have yet. It is in one of three states: pending, fulfilled (it has a value), or rejected (it has an error).

```js
const wait = new Promise((resolve) => {
	setTimeout(() => resolve('done'), 1000);
});

wait.then((value) => console.log(value));   // prints "done" after one second
```

`resolve(value)` fulfills the promise. `reject(error)` rejects it. `.then(callback)` runs the callback when the promise is fulfilled. `.catch(callback)` runs it when the promise is rejected. `.finally(callback)` runs it either way.

`.then` returns a new promise, so you can chain steps:

```js
fetch('/api/books')
	.then((response) => response.json())
	.then((books) => console.log(books.length))
	.catch((error) => console.log('Something failed:', error.message));
```

One `.catch` at the end handles a rejection from any step above it.

Three helpers combine promises. Each takes an array of promises and returns one promise:

```js
Promise.all([a, b, c]);    // fulfills with [a, b, c] results once all are done; rejects as soon as one rejects
Promise.race([a, b, c]);   // settles the same way as the first promise to settle
Promise.allSettled([a, b]); // always fulfills, with a {status, value or reason} entry for each
```

`Promise.all` is how you run requests at the same time instead of one after another. You need it in `loadAll`. `Promise.race` is how you build a timeout. You need it in `withTimeout`.

## async and await

`async`/`await` is a calmer way to write the same promises. Mark a function `async` and it always returns a promise. Inside it, `await` pauses that function until a promise settles and gives you the value:

```js
async function bookCount() {
	const response = await fetch('/api/books');
	const books = await response.json();
	return books.length;
}

bookCount().then((count) => console.log(count));
```

A rejected promise becomes a thrown error at the `await`, so you handle failures with `try`/`catch`, the same as in synchronous code:

```js
async function safeBookCount() {
	try {
		return await bookCount();
	} catch (error) {
		return 0;
	}
}
```

Two things to remember:

- `await` only pauses its own function. The rest of the program keeps running. Everything after an `await` runs later, as a microtask.
- Awaiting in a loop runs requests one at a time. To run them together, start them all and await them together:

```js
// One after another: slow
for (const url of urls) {
	results.push(await fetchJson(url));
}

// All at once: fast
const results = await Promise.all(urls.map((url) => fetchJson(url)));
```

Try it. Paste the `wait` promise from the previous section into `node`. Add `await wait` on its own line. Node lets you use `await` at the top level of the prompt.

## fetch

`fetch(url)` asks a server for something and returns a promise for a `Response`:

```js
const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m');
console.log(response.ok);       // true for status 200 to 299
console.log(response.status);   // 200
const data = await response.json();
console.log(data.current.temperature_2m);
```

Run it in `node` (use `await` in the prompt) and you see a real temperature for Berlin. [Open-Meteo](https://open-meteo.com) is a free weather API that needs no account and no key.

Two kinds of failure look different, and you must handle both:

- **The network fails.** No connection, or the server is down. The promise from `fetch` rejects with a `TypeError`.
- **The server answers with an error.** A 404 or a 500. The promise from `fetch` still fulfills. `response.ok` is `false`. Nothing throws unless you check.

That second case catches everyone once. Always check `response.ok`:

```js
async function fetchJson(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}
	return response.json();
}
```

## Loading and error states

Any screen that shows remote data is in one of three states: loading, showing the data, or showing an error. A widget that handles only the happy path leaves the user staring at a blank page when something goes wrong.

The pattern is the same every time:

```js
async function showBooks(root) {
	root.textContent = 'Loading...';
	try {
		const books = await fetchJson('/api/books');
		root.textContent = `${books.length} books`;
	} catch (error) {
		root.textContent = error.message;
	}
}
```

Set the loading state first, before the first `await`. Catch the error and show it, so the user knows what happened.

When you put text from the network or from the user into the page, use `textContent`, not `innerHTML`. `innerHTML` turns text into live HTML, so a hostile value like `<img src=x onerror=...>` would run code on your page.

## Testing code that waits

Your tests need to control time and the network, because real ones are slow and unreliable. Vitest gives you two tools.

`vi.stubGlobal('fetch', ...)` replaces `fetch` with a function you control:

```js
vi.stubGlobal('fetch', async () => Response.json({ title: 'Dune' }));
```

`Response.json(data, { status })` builds a real `Response`, so `response.ok` and `response.json()` work like they do in production.

Fake timers let a test jump forward in time without waiting:

```js
vi.useFakeTimers();
const result = delay(1000, 'done');
await vi.advanceTimersByTimeAsync(1000);   // jumps one second ahead, instantly
```

Read the test files before you write each exercise. They show exactly what the fakes return.

## Exercises

Open each file in `exercises/`, read the comments, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-async-basics.js` has four helpers: `delay`, `fetchJson`, `loadAll`, and `withTimeout`. They are the building blocks for the other two exercises.
2. `02-weather.js` is the weather widget. `getWeather(city)` looks a city up and loads its current weather from Open-Meteo. `showWeather(root, city)` draws a loading state, the result, or an error.
3. `03-retry.js` retries a failing request with exponential backoff: wait 100 ms, then 200 ms, then 400 ms between attempts.
4. `event-loop.md` holds three predict-the-output snippets. You answer them in writing and your reviewer reads them. No test checks this one.

Run `npm test 10` after each change. When every test passes, you're ready to submit.

### Try the widget by hand

The tests use a fake `fetch`. To see your widget talk to the real API, start a dev server:

```sh
npx vite lessons/10-async-and-fetch/demo
```

Open the address it prints, type a city, and press Search. The page in `demo/` calls your `showWeather`. Open the browser's Network tab and watch the two requests go out. Switch your computer to airplane mode, search again, and check that your error state appears.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Use `Promise.allSettled` to show the weather for three cities, with a failed city shown as an error and the others still displayed.
- Add random jitter to `retry` so that many clients don't all retry at the same instant. Why does that help the server?
- Type quickly into the widget and search two cities one after the other. What if the first response arrives after the second? How would you make sure the page shows the newest search?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/10-async-and-fetch
git commit -m "Complete lesson 10 exercises"
git push -u origin lesson-10
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Your `event-loop.md` predictions, including the wrong ones, and an explanation that uses the words "call stack", "microtask", and "task queue" correctly
- `async`/`await` with `try`/`catch`, not a pile of nested `.then` callbacks
- Requests that can run together run together (`Promise.all`), not one after another
- Every `fetch` checks `response.ok`
- Text from the network goes into the page with `textContent`, never `innerHTML`
