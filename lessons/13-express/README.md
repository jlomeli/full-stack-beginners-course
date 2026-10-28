# 13. HTTP servers with Express

In this lesson you build a Notes API: a server that creates, lists, updates, and deletes notes over HTTP, with a small web page that uses it. You also write a middleware that logs every request.

## What you will be able to do

- Create routes for each HTTP method
- Write and order middleware
- Serve static files and JSON

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-13
```

Run the tests for this lesson:

```sh
npm test 13
```

You see 22 failing tests. Your job this lesson is to make them pass.

## A server in six lines

Express is a library that receives HTTP requests, runs your functions on them, and sends back responses. You read about requests and responses in lesson 02. Express 5 is the current version, and this course uses it.

Create `lessons/13-express/scratch.js` with this code:

```js
import express from 'express';

const app = express();

app.get('/hello', (req, res) => {
	res.send('Hello from Express');
});

app.listen(3000, () => {
	console.log('Listening on http://localhost:3000');
});
```

Run it from the repo root:

```sh
node lessons/13-express/scratch.js
```

Open <http://localhost:3000/hello> in your browser. You see `Hello from Express`. Open <http://localhost:3000/nothing-here>. You see `Cannot GET /nothing-here`. Express answers 404 for any path you haven't written a route for. Press Ctrl+C to stop the server.

Read the code once more, piece by piece:

- `express()` creates an app.
- `app.get('/hello', handler)` says: when a `GET` request for `/hello` arrives, call `handler`.
- The handler gets `req`, the request, and `res`, the response. It must send a response, or the browser waits forever.
- `app.listen(3000, ...)` starts accepting connections on port 3000.

## One method per verb

Each HTTP method has a matching function on `app`: `app.get`, `app.post`, `app.put`, `app.delete`. Replace the route in `scratch.js` with these:

```js
app.get('/greeting', (req, res) => {
	res.json({ message: 'Hello' });
});

app.post('/greeting', (req, res) => {
	res.status(201).json({ message: 'Created' });
});

app.delete('/greeting', (req, res) => {
	res.status(204).end();
});
```

Restart the server (Ctrl+C, then run it again). In a second terminal, call each route with `curl`. The `-i` flag prints the status line and headers, and `-X` picks the method:

```sh
curl -i http://localhost:3000/greeting
curl -i -X POST http://localhost:3000/greeting
curl -i -X DELETE http://localhost:3000/greeting
```

You see `200 OK` with a JSON body, then `201 Created` with a JSON body, then `204 No Content` with no body.

Three response methods cover almost everything:

- `res.json(value)` sends `value` as JSON and sets the `Content-Type` header to match.
- `res.status(code)` sets the status code and returns `res`, so you can chain `res.status(404).json({ ... })`. The default is `200`.
- `res.end()` sends a response with no body. Use it with `204`.

A handler sends one response. If a branch sends a response, `return` right after it so the rest of the function doesn't run:

```js
if (!note) {
	res.status(404).json({ error: 'Note not found' });
	return;
}
```

## Reading the request

Put values in the URL with a `:name` segment. Express stores them in `req.params`, always as strings:

```js
app.get('/notes/:id', (req, res) => {
	res.json({ id: req.params.id, type: typeof req.params.id });
});
```

Restart and run `curl http://localhost:3000/notes/7`. You see `{"id":"7","type":"string"}`. Compare numbers with `Number(req.params.id)`, because `7 === '7'` is `false`.

Anything after `?` in the URL is in `req.query`. For `/search?term=ada`, `req.query.term` is `'ada'`.

A JSON request body arrives in `req.body`, but only after you add middleware that reads it. Without that middleware, `req.body` is `undefined`. The next section adds it.

## Middleware

Middleware is a function that runs between the request arriving and your route handler. It receives `req`, `res`, and `next`. It does its work, then does one of two things:

- Calls `next()` to pass the request to the next function in line.
- Sends a response, which ends the request.

Register middleware with `app.use`. Here is one that prints each request:

```js
app.use((req, res, next) => {
	console.log(req.method, req.url);
	next();
});
```

If you forget `next()`, the request stops there and the browser waits forever. That is the most common middleware bug.

Express ships with two middleware you need in this lesson:

```js
app.use(express.json());
```

reads a JSON request body and puts the result in `req.body`. It only acts on requests with a `Content-Type: application/json` header.

```js
app.use(express.static(publicDir));
```

serves the files in the folder `publicDir`. A request for `/` returns `index.html` from that folder, and a request for `/style.css` returns `style.css`. If no file matches, it calls `next()`, so your routes still get their turn.

### Order matters

Express runs middleware and routes in the order you registered them. Add this to `scratch.js` and test it:

```js
app.use(express.json());

app.post('/echo', (req, res) => {
	res.json({ you_sent: req.body });
});
```

```sh
curl -X POST http://localhost:3000/echo -H 'Content-Type: application/json' -d '{"title":"Hi"}'
```

You see `{"you_sent":{"title":"Hi"}}`. Now move `app.use(express.json())` below the `/echo` route and run the same command. You see `{}`: the route ran before the body was read, so `req.body` was `undefined`. Put middleware that every route needs above the routes.

A logger has the opposite problem. It must run first to see every request, and it needs a way to run code after the response is sent. A response object emits events, and `finish` fires once the response has gone out:

```js
app.use((req, res, next) => {
	res.on('finish', () => {
		console.log(req.method, req.originalUrl, res.statusCode);
	});
	next();
});
```

By the time `finish` fires, the route has chosen its status code, so `res.statusCode` is the real one. Use `req.originalUrl` rather than `req.url`: inside nested apps and routers, Express shortens `req.url`, and `originalUrl` always has what the client asked for.

## Errors, and what changed in Express 5

When a handler throws, Express catches the error and skips ahead to the error-handling middleware. That is a function with four parameters. The fourth, `err`, is what makes Express treat it as an error handler. It goes last, after all your routes:

```js
app.get('/boom', (req, res) => {
	throw new Error('Something broke');
});

app.use((err, req, res, next) => {
	res.status(500).json({ error: 'Internal server error' });
});
```

Add both to `scratch.js`, restart, and run `curl -i http://localhost:3000/boom`. You see `500` and the JSON error.

Express 5 handles `async` handlers the same way. An `async` function that throws, or awaits a promise that rejects, sends its error to the error handler. Express 4 never did this: the request hung until a timeout unless you wrapped every handler by hand. Try it:

```js
app.get('/boom-later', async (req, res) => {
	await new Promise((resolve) => setTimeout(resolve, 100));
	throw new Error('Something broke later');
});
```

Restart and run `curl -i http://localhost:3000/boom-later`. You see the same `500` and JSON error after a short wait. You write `async` handlers all the time once you talk to a database, so you don't need `try/catch` around each `await` just to forward errors. Lesson 14 builds on this.

Delete `scratch.js` when you finish experimenting.

## `createApp` and `server.js`

Your tests don't start a real server. They import your app and use Supertest, a library that sends requests straight to an Express app and returns the response:

```js
const res = await request(app).post('/notes').send({ title: 'Hi', body: 'There' });
res.status; // 201
res.body;   // { id: 1, ... }
```

For that to work, your code must export the app without calling `listen`. And because each test needs a fresh, empty list of notes, you export a function that builds a new app each time you call it:

```js
export function createApp() {
	const app = express();
	// ... middleware and routes ...
	return app;
}
```

State such as the list of notes lives inside `createApp`. Two apps never share it. The file `server.js` imports `createApp`, calls it once, and calls `listen` so you can use the API by hand. This pattern shows up in real projects because it makes the app testable.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-notes-api.js` builds the Notes API: JSON parsing, static files, and five routes for creating, listing, reading, replacing, and deleting notes. Notes live in an array in memory, so they disappear when the server stops.
2. `02-request-logger.js` returns the logging middleware you saw above.

Run `npm test 13` after each change.

### Try it in the browser

When exercise 1 passes, run the real server:

```sh
node lessons/13-express/server.js
```

Open <http://localhost:3000>. You see a page titled Notes with a form. Add a few notes. Reload the page and they are still there, because the server holds them. Stop the server and start it again, and they are gone.

Now wire in exercise 2. Edit `server.js`: import `requestLogger` from `./exercises/02-request-logger.js`, and mount it before the Notes API:

```js
const app = express();
app.use(requestLogger());
app.use(createApp());
```

You also need `import express from 'express';` at the top. Restart the server and use the page. Every request prints a line such as `GET /notes 200 2ms` in the terminal. Move `app.use(requestLogger())` below `app.use(createApp())` and try again. Nothing prints. Explain to yourself why. The answer is in the Order matters section.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add `GET /notes?search=milk` that returns only the notes whose title or body contains the search text. Read it from `req.query.search`.
- Make the logger color the status: green for 2xx, red for 4xx and 5xx. Search for "ANSI escape codes".
- Add an error-handling middleware to `createApp` that answers `500` with `{ error: 'Internal server error' }`. Make `GET /notes` throw on purpose and check that you get the JSON error.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/13-express
git commit -m "Complete lesson 13 exercises"
git push -u origin lesson-13
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- One place finds a note by id, not the same `find` call pasted into three routes
- Every branch that sends a response returns right after it
- Ids are compared as numbers, not as strings
- Middleware sits in an order that works, and each one calls `next()` or sends a response
- No leftover `console.log` calls, and `scratch.js` is deleted
