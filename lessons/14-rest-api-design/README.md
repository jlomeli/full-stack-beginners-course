# 14. REST API design, validation, and errors

In this lesson you take the Notes API from lesson 13 and make it safe to put in front of strangers. It rejects bad input with a clear error, answers every failure in the same JSON shape, and has a test suite that is checked against broken versions of your API.

## What you will be able to do

- Design resource URLs and pick status codes
- Validate request bodies at the boundary
- Return consistent error responses

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-14
```

Run the tests for this lesson:

```sh
npm test 14
```

You see 54 failing tests. Your job this lesson is to make them pass. Here is where they come from:

- 31 tests check the API you finish in exercise 1.
- 23 tests check the tests you write in exercise 2.

You also see 12 `todo` tests. They are the ideas in your own test file. They are not failures, and they disappear as you replace them with real tests.

## Designing the URLs

A REST API is a set of URLs that stand for things, plus HTTP methods that say what to do with them. The things are called resources. You name a resource with a noun, in the plural, and the method supplies the verb:

| Request | Meaning | Success status |
| --- | --- | --- |
| `GET /notes` | List the notes | `200 OK` |
| `POST /notes` | Create a note | `201 Created` |
| `GET /notes/7` | Read note 7 | `200 OK` |
| `PUT /notes/7` | Replace note 7 | `200 OK` |
| `DELETE /notes/7` | Delete note 7 | `204 No Content` |

Avoid verbs in URLs. `POST /createNote` repeats in the URL what the method already says. `GET /deleteNote?id=7` is worse: a link or a web crawler can delete data, because browsers and crawlers send `GET` freely.

A resource that belongs to another one nests inside it: `GET /notes/7/comments` lists the comments on note 7. Stop at one level of nesting. Deeper URLs are hard to read.

`PUT` replaces the whole note. If a client leaves out `body`, the new note has an empty body. It does not keep the old one. Some APIs use `PATCH` to change only the fields a client sends. This lesson uses `PUT` only.

## Picking status codes

The status code is the first thing a client reads. It says whether the request worked, and if it didn't, whose fault it was. Learn the groups first:

- `2xx` means it worked.
- `4xx` means the client did something wrong. Fixing the request can fix the problem.
- `5xx` means the server failed. Sending the same request again may or may not work.

The codes you use here:

| Code | Use it when |
| --- | --- |
| `200 OK` | A `GET` or `PUT` worked, and you send a body. |
| `201 Created` | A `POST` made something new. Send the new thing. |
| `204 No Content` | It worked and there is nothing to send, such as after a `DELETE`. |
| `400 Bad Request` | The request is malformed: bad JSON, an invalid field, an id that is not a number. |
| `404 Not Found` | The URL is fine, but nothing lives there: no such route, or no note with that id. |
| `413 Content Too Large` | The body is bigger than the server accepts. |
| `500 Internal Server Error` | Your code broke in a way you didn't plan for. |

Two choices cause most arguments. A missing note is `404`, but an id like `abc` is `400`. The first is a well-formed question with the answer "none". The second is not a question at all. And any `5xx` is your fault, never the client's, so never answer `500` for something the client sent wrong.

Read more: [MDN on HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status).

## Try the starter by hand

The starter you get is the lesson 13 Notes API without a web page, plus a replaceable in-memory store. The routes work but trust every input. Start it:

```sh
node lessons/14-rest-api-design/server.js
```

In a second terminal, send it bad data:

```sh
curl -i -X POST http://localhost:3000/notes -H 'Content-Type: application/json' -d '{"title":42}'
```

You see `201 Created`, and a note whose title is the number `42`. Anything a client sends goes straight into your data. Try a few more:

```sh
curl -i http://localhost:3000/notes/abc
curl -i http://localhost:3000/nothing-here
curl -i -X POST http://localhost:3000/notes -H 'Content-Type: application/json' -d '{"title":'
```

The first answers `404 Note not found`, because `Number('abc')` is `NaN` and no note matches it. But `abc` is not a missing note. It is a bad request. The second returns an HTML page, and the third returns an HTML error page with a stack trace. By the end of this lesson, all three answer with the right status and a JSON error. Stop the server with Ctrl+C. Restart it each time you change `01-notes-api.js`.

## The boundary

Your server's inside is code you trust. Its edge is where requests arrive, and everything there is untrusted: a browser bug, a typo, or a person trying to break in can send anything. Check data once, at the edge. After that, the routes can assume a note has a title string of the right length.

You could write that check with a chain of `if` statements. It would grow long and you would forget a case. Instead, describe the shape you accept and let a library check it. zod is that library. This course uses zod 4.

```js
import { z } from 'zod';

const person = z.object({
	name: z.string().trim().min(1).max(20),
	age: z.number().int().min(0).default(18),
});
```

A schema is a description. Run data through it with `safeParse`, which never throws. It returns an object that says whether it worked:

```js
person.safeParse({ name: '  Ada  ', age: 36 });
// { success: true, data: { name: 'Ada', age: 36 } }

person.safeParse({ name: 'Ada' });
// { success: true, data: { name: 'Ada', age: 18 } }

person.safeParse({ name: '', age: 'old', admin: true });
// { success: false, error: ZodError }
```

Try these. Create `lessons/14-rest-api-design/scratch.js`, paste the schema and calls inside `console.log(...)`, and run `node lessons/14-rest-api-design/scratch.js`. Three things to see:

- A success returns `data`, which is not the input. `trim()` removed the spaces, `default(18)` filled in the missing age, and `admin: true` is gone. By default, an object schema drops keys it doesn't list. That protects you from a client that sets `id` or `createdAt`.
- A failure returns every problem at once, not only the first. Print `result.error.issues`. You see an array. Each issue has a `path`, such as `['name']`, and a `message`.
- Order matters inside a chain. `z.string().trim().min(1)` trims first, so a title of three spaces fails `min(1)`.

Read more: [the zod docs](https://zod.dev/).

## One error shape

A client that talks to your API has to handle failures. If every failure looks different, it needs a special case for each. Pick one shape and use it everywhere:

```json
{ "error": "Note not found" }
```

`error` is a short sentence a person can read. When there is more to say, as in validation, add `details`:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "Too small: expected string to have >=1 characters" },
    { "field": "body", "message": "Invalid input: expected string, received number" }
  ]
}
```

Every response in the error range is JSON, with an `error` key. The client can check `res.status` and read `res.body.error` no matter what went wrong.

Never put internals in an error. A stack trace or a database message tells an attacker how your server works. For a failure you didn't plan for, send a generic message, and log the real error on the server where you can read it.

## Exercise 1: validation and error handling

Open `exercises/01-notes-api.js`. The five routes and the memory store are done. You fill in the `// TODO` parts. Work from the top, and run `npm test 14` after each step.

### Step 1: the schema

`noteInput` is an empty `z.object({})`. Replace it with the schema the comment describes: a `title` that is trimmed and 1 to 100 characters long, and a `body` of at most 1000 characters that defaults to `''`. Nothing else is accepted. Nothing uses the schema until you finish `validateBody`, so little changes in the test results yet.

### Step 2: `validateBody`

`validateBody(schema)` returns a middleware. Recall from lesson 13 that a middleware gets `req`, `res`, and `next`. This one runs `schema.safeParse(req.body)`:

- On success, put `result.data` in `req.body` and call `next()`. The route now sees cleaned data.
- On failure, answer `400` with `error: 'Validation failed'` and a `details` array, then `return` without calling `next()`. Build `details` from `result.error.issues`. For each issue, `field` is `issue.path.join('.')` and `message` is `issue.message`.

When a client sends no JSON, `req.body` is `undefined` and the schema fails with an empty path. That gives a `field` of `''`, as the spec says.

Run the tests. The validation group goes green. Run `curl` on the earlier title `42` request: it now answers `400`.

### Step 3: reject bad ids

Every route with `:id` has to refuse an id like `abc`, `0`, `1.5`, or `007`. Don't paste the check into three routes. Express has `app.param`, which runs a function whenever a route has that parameter in its path:

```js
app.param('id', (req, res, next, id) => {
	// check id; either respond or call next()
});
```

Use the `noteId` schema that is already in the file. It takes the id as a string, because that is how it arrives in the URL. If `noteId.safeParse(id).success` is false, answer `400` with `{ error: 'Invalid note id' }`. If it passes, call `next()`.

### Step 4: unknown URLs

A request that no route matches reaches the end of the app. Add one middleware after all the routes to answer `404` with `{ error: 'Route not found' }`. It has no path and no method, so it catches everything that fell through. Without it, Express sends an HTML page. The position matters. Express tries middleware in order, so a catch-all placed above a route would answer requests that route should have handled.

### Step 5: the error handler

Express 5 sends any error from a route, including a rejected promise in an `async` route, to the error-handling middleware. This is a function with four parameters, placed after everything else:

```js
app.use((err, req, res, next) => {
	// choose a status and respond
});
```

`express.json()` also reports problems this way. It gives its errors a `type`:

- `err.type === 'entity.parse.failed'` means the client sent malformed JSON. Answer `400` with `{ error: 'Request body is not valid JSON' }`.
- `err.type === 'entity.too.large'` means the body is over the limit. Answer `413` with `{ error: 'Request body is too large' }`.
- Anything else is a bug or an outage. Call `console.error(err)` to keep the details, and answer `500` with `{ error: 'Internal server error' }`. Send the client nothing else.

When all 31 tests in `01-notes-api.test.js` pass, run the `curl` commands from earlier again. Every response is JSON now.

## Testing the whole API with Supertest

A unit test checks one function. An integration test checks that the pieces work together. Here it sends a real request through the whole app (routing, middleware, validation, the store) and checks what a client would see. Supertest does this without a running server. Install nothing; it is already in the repo.

```js
import request from 'supertest';
import { createApp } from './01-notes-api.js';

test('GET /notes starts empty', async () => {
	const app = createApp();
	const res = await request(app).get('/notes');

	expect(res.status).toBe(200);
	expect(res.body).toEqual([]);
});
```

`request(app)` wraps the app. `.get(url)`, `.post(url)`, `.put(url)`, and `.delete(url)` choose the request. `.send(object)` adds a JSON body. `await` gives you the response with `res.status`, `res.body` (parsed JSON), `res.text` (raw text), and `res.headers`.

Give every test a new app, so tests don't see each other's notes. A `beforeEach` does that:

```js
let app;
beforeEach(() => {
	app = createApp();
});
```

A test that needs a note first creates it through the API, the way a real client would:

```js
test('GET /notes/:id answers with the note that has that id', async () => {
	const created = await request(app).post('/notes').send({ title: 'Groceries', body: 'Milk' });

	const res = await request(app).get(`/notes/${created.body.id}`);

	expect(res.status).toBe(200);
	expect(res.body).toEqual(created.body);
});
```

Read this test as three steps: set up, act, check. Check what the client sees. Don't peek inside the store.

To test the `500` path you need a store that fails. The file exports `createMemoryStore`, and `createApp` accepts `{ store }`. Break one method and pass the store in:

```js
const store = createMemoryStore();
store.list = async () => {
	throw new Error('connection lost');
};
const brokenApp = createApp({ store });
```

Silence the logging in that test with `vi.spyOn(console, 'error').mockImplementation(() => {})`, imported from `vitest`, so your test output stays readable. `vi.restoreAllMocks()` in an `afterEach` puts it back.

Read more: [the Supertest README](https://github.com/forwardemail/supertest#readme).

## Exercise 2: write integration tests

Open `exercises/02-integration-tests.test.js`. It has a `beforeEach` and a list of `test.todo` ideas. Replace each idea with a real test and add your own.

The file `02-integration-tests.mutants.test.js` checks your tests. It builds 22 broken versions of your API, each with one bug, such as `POST /notes` answering `200` instead of `201`, `DELETE` that doesn't delete, validation errors that drop `details`, or a `500` that leaks the error message. It runs your test file against your real API and against each broken copy.

You pass when your tests pass on your API, and each broken version fails at least one of your tests. Run `npm test 14` and read the red lines named `your tests catch the bug: ...`. Each name says what a client would see wrong. Write a test that sees that wrong thing.

Some guidance:

- Check the status and the body. A test that checks only the status misses a bug that sends the wrong body.
- Check a failure left no trace. After a rejected `POST`, `GET /notes` is still empty. After a rejected `PUT`, the note is unchanged.
- Check the edges of each rule. A title of exactly 100 characters is fine, and 101 is not.
- Check the error shape, not only that an error happened.
- Your tests must pass on your API, so finish exercise 1 first. The mutants tests tell you that when you try earlier.

Do not edit `mutants.js` or the mutants test file.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add `GET /notes?search=milk`, which returns notes whose title or body contains the text, ignoring case. Validate the query with a zod schema and answer `400` with the same error shape when it is wrong.
- Add pagination: `GET /notes?limit=10&offset=20` returns at most 10 notes starting after the first 20. Cap `limit` at 100, and return the total count in a `X-Total-Count` header.
- Add `PATCH /notes/:id`, which changes only the fields the client sends. Build its schema from `noteInput.partial()`.
- Write the tests for your new routes first, then the code.

## Exercises

Open each file in `exercises/` and read the comment at the top.

1. `01-notes-api.js` adds validation and error handling to the Notes API. Its tests are in `01-notes-api.test.js`.
2. `02-integration-tests.test.js` holds your integration tests for the API. `02-integration-tests.mutants.test.js` and `mutants.js` check them and stay unchanged.

Run `npm test 14` after each change.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/14-rest-api-design
git commit -m "Complete lesson 14 exercises"
git push -u origin lesson-14
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Validation happens in one place, at the edge, and routes use `req.body` as already cleaned
- Every error response has the same JSON shape, and none leak a message or a stack trace
- Status codes mean what they should: `400` for a bad request, `404` for a missing thing, `500` only for your own failures
- Integration tests check status and body, and they do not depend on each other
- Test names read as sentences about what a client sees
- No `scratch.js` left behind, and no leftover `console.log` calls
