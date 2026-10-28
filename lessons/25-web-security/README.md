# 25. Web security basics

In this lesson you attack a small library app, then fix it. The app has six security holes, and the tests exploit each one. You close them one at a time until no attack works, and write down what you found.

## What you will be able to do

- Prevent XSS, CSRF, and SQL injection
- Configure CORS correctly
- Keep secrets out of Git

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-25
```

Run the tests for this lesson:

```sh
npm test 25
```

You see 16 failing tests. Your job this lesson is to make them pass.

Each failing test is an attack, not a normal feature test. It does what an attacker does, and it fails while the attack still works. Many tests also check that the normal use of the app keeps working, so a fix that breaks the app doesn't pass either.

## The rule behind every hole

Almost every web vulnerability is the same mistake: **the app trusts something it shouldn't.** It trusts text a user typed, a header a browser sent, a website that asked nicely, or a number in a URL. Security work is deciding what you trust, and checking it on the server.

The sample app has these routes:

| Request | What it does |
| --- | --- |
| `POST /login` | Logs a member in by email and sets the `sid` cookie. (A real app also checks a password, as in lesson 24.) |
| `GET /books` | Lists books. `?author=` filters by author. |
| `GET /books/:id/page` | An HTML page for one book, with its reviews. |
| `POST /books/:id/reviews` | Adds a review. Needs a log-in. |
| `POST /me/email` | Changes the logged-in member's email. Needs a log-in. |
| `DELETE /books/:id` | Deletes a book. Needs the admin key. |
| `GET /loans/:id` | Shows one loan. |

Read `exercises/01-vulnerable-app.js` from top to bottom before you change anything. Try to spot the holes first. Then read the six sections below. The tests are grouped into six `describe` blocks, numbered like the sections, so you can work through them in order.

Run the server when you want to poke at the app by hand:

```sh
ADMIN_KEY=change-me node lessons/25-web-security/server.js
```

## 1. XSS: cross-site scripting

HTML mixes text and code in one string. If you put a stranger's text into a page without care, the browser can't tell their text from your code. A review that says `<script>alert(1)</script>` becomes a script that runs for everyone who opens the page.

That script runs as your site. It can read the page, call your API with the visitor's cookie, and send the results to the attacker. `HttpOnly` cookies (lesson 24) stop the script reading the session id, but it can still act as the visitor.

The fix is **escaping**: before you put text into HTML, replace the characters that mean something with their entities.

| Character | Write |
| --- | --- |
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#39;` |

Start with `&`, or you will escape the `&` in the entities you just wrote. In JavaScript, `text.replaceAll('&', '&amp;')` does one replacement for every match.

```js
function escapeHtml(text) {
	return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;') /* ...and so on */;
}
```

Try it. Run the server, log in with `curl -c jar.txt -H 'Content-Type: application/json' -d '{"email":"ada@example.com"}' localhost:3000/login`, and post a review with `curl -b jar.txt -H 'Content-Type: application/json' -d '{"body":"<b>bold</b>"}' localhost:3000/books/1/reviews`. Open `/books/1/page`. You see **bold** in bold, not the text you typed. After your fix, you see the tags as plain text.

Escape on output, every time, for every value that came from a user. That includes values you think are safe, such as titles and names: they came from a user once. React escapes text for you, which is why the React lessons never needed this. The danger returns when you reach for `dangerouslySetInnerHTML`, or `innerHTML` in plain JavaScript. The name of that React prop is the warning.

## 2. CSRF: cross-site request forgery

Browsers attach your cookies to every request to a site, even a request that another website triggered. Suppose you are logged in to the library, and in another tab you open `evil.example`. That page contains a form whose action is `http://localhost:3000/me/email`, and it submits itself. Your browser sends the form to the library with your session cookie. The library sees a logged-in member asking to change their email, and does it. The attacker sets the email to their own, requests a password reset, and owns the account.

The attacker never read your cookie. They only made your browser use it. Two defenses work together:

**`SameSite` cookies.** With `SameSite=Lax`, the browser leaves the cookie off cross-site `POST` requests. Add `HttpOnly; SameSite=Lax` to the cookie the app sets at log-in. The tests check both.

**Check the `Origin` header.** Browsers add an `Origin` header to cross-site `POST` requests, and a web page can't change it. Refuse state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) whose `Origin` isn't one you trust. The app already has a list, `ALLOWED_ORIGINS`.

You need the second defense because `SameSite` is about **sites**, and `localhost:5173` and `localhost:3000` are the same site even though they are different origins. Another page on `localhost`, say a dev tool, wouldn't be stopped by `SameSite` alone. In production the same applies to subdomains of your own site.

A request with no `Origin` header, such as `curl`, can pass: it doesn't come from a browser, so there is no ambient cookie for an attacker to ride.

Many frameworks use a **CSRF token** instead: a secret value in each form that an attacker's page can't know. It works too, and the Origin check plus `SameSite` is the simpler approach for an API.

Write the Origin check as middleware, above the routes. It answers `403`. That's the status for "I understood the request, and I refuse it."

## 3. SQL injection

Lesson 17 covers placeholders. Here is why they matter. Look at how `GET /books` builds its query:

```js
`SELECT id, title, author, year FROM books WHERE author = '${author}' ORDER BY id`
```

If `author` is `Octavia E. Butler`, the query works. If it is `' OR '1'='1`, the query becomes:

```sql
SELECT id, title, author, year FROM books WHERE author = '' OR '1'='1' ORDER BY id
```

`'1'='1'` is always true, so the `WHERE` matches every row. It gets worse. With `' UNION SELECT id, email, name, 0 FROM members --`, the attacker adds a second `SELECT` that reads a different table, and the `--` turns the rest of the query into a comment. The member emails come back in the `title` field.

The text in the string stopped being data and became SQL. Escaping quotes by hand is a losing game. The fix is to never build SQL from user text. Send the SQL and the values separately:

```js
await db.query('SELECT id, title, author, year FROM books WHERE author = $1 ORDER BY id', [author]);
```

The database parses the query first and slots the value in afterwards, as a plain value. No value can change the shape of the query. An author named `Madeleine L'Engle` also works, which the broken version couldn't do.

Placeholders work for **values**. They can't stand in for a table name, a column name, or `ASC` and `DESC`. If you need to pick one of those from user input, compare it against a fixed list in your code and use the list's own string.

## 4. CORS

By default, a web page on `evil.example` can send a request to your API, but the browser won't let its script **read the response**. That rule is the **same-origin policy**. CORS (cross-origin resource sharing) lets a server relax it for sites it names, by sending response headers.

Your front end at `http://localhost:5173` needs to call your API at `http://localhost:3000`, so the API must say so:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

`Allow-Credentials: true` lets the page send cookies and read the answer. The browser refuses `Allow-Credentials` together with `Allow-Origin: *`, so developers who hit that error are tempted to "fix" it by copying whatever `Origin` arrives into `Allow-Origin`. Look at the first middleware in the app: it does that. It trusts every website with your logged-in visitors' data. Any page can now call `/me/email` as the visitor and read what comes back.

Fix it with an **allowlist**:

- Send `Access-Control-Allow-Origin` only when the request's `Origin` is in `ALLOWED_ORIGINS`.
- Otherwise send none of the CORS headers. The browser then blocks the response.
- Add `Vary: Origin`, because the response changes with the `Origin` header, and caches must not hand one site's answer to another. In Express: `res.vary('Origin')`.

Browsers also send a **preflight**: before a `POST` with a JSON body, or a request with custom headers such as `x-admin-key`, they send `OPTIONS` to ask permission. Your answer to `OPTIONS` needs the same allowlist. The `Allow-Methods` and `Allow-Headers` headers in the starter list what you permit.

Two things to remember. CORS protects the visitor's browser, and does nothing about `curl`: anyone can call your API directly, so your server checks must hold without it. And an `Origin` of `null` (sent from sandboxed iframes and local files) is not a site you listed, so it gets nothing.

You may know the `cors` npm package. It does what you just wrote, and your repo doesn't have it installed. Write it by hand here, so you know what it does.

## 5. Secrets in Git

Look at the top of `01-vulnerable-app.js`. The admin key is a string in the source. The code is in Git, so the key is in Git: in every clone, on every laptop, and in every fork. Deleting the line later doesn't remove it from the history, and bots scan public repos for keys within minutes.

The rule: **secrets live in the environment, not in the code.** The code reads them when it starts:

```js
const adminKey = process.env.ADMIN_KEY;
```

Where does the value come from? On your laptop, a `.env` file that Git ignores. In production, the hosting service's settings page. The app in this lesson takes its settings as the `env` argument, so tests can hand it any value. `server.js` passes `process.env`.

For this lesson:

1. Change the admin route to read `env.ADMIN_KEY`.
2. When `ADMIN_KEY` isn't set, **nobody** is an admin. Be careful: if the header is missing and the setting is missing, `undefined !== undefined` is `false`, and a check written as `header !== key` lets the request through. Fail closed: if there is no configured key, refuse.
3. Copy `.env.example` to `.env`, set a real value, and add `lessons/25-web-security/.env` to the `.gitignore` at the top of the repo. Run `git status` and check that `.env` isn't listed.
4. Run `node --env-file=lessons/25-web-security/.env lessons/25-web-security/server.js`. Node reads the file for you.

The `.env.example` file holds only placeholders and stays in Git, so a teammate knows which variables to set.

**A secret that was committed is burned.** Removing it from the code is not enough. Treat it as public: change it at the source (generate a new key, tell the service to revoke the old one), then use the new one through the environment. The tests use the old key to check that it no longer works. Rewriting Git history is a last resort and doesn't help against copies you can't reach.

## 6. Missing access control (IDOR)

`GET /loans/:id` returns the loan for any id, to anyone. An attacker requests `/loans/1`, `/loans/2`, `/loans/3`, and reads every member's borrowing history. This is an **insecure direct object reference** (IDOR): the app trusts the id in the URL.

Two checks fix it, and both come from lesson 24:

1. **Authentication:** require a log-in. Answer `401` for an anonymous request.
2. **Authorization:** check that this loan belongs to this member. Answer `403` if not.

Some apps answer `404` for someone else's record, so that the response doesn't confirm that the id exists. That's a good choice when ids are sensitive. This lesson's tests expect `403` so that the difference is visible.

A hard-to-guess id (a UUID instead of `1, 2, 3`) slows an attacker down, and is not a fix: ids leak through logs, links, and screenshots. Every route that reads or changes something owned by a member checks ownership on the server.

## How you know it's fixed

An exploit test passes when the attack fails and the normal use still works. After each fix, run `npm test 25` and watch which tests turn green. When all 16 pass, no attack in this lesson works.

Passing tests don't mean "secure." They prove six specific attacks fail. A real review asks what the tests didn't think of, and that is what your last section in `findings.md` is for.

## Exercises

1. `exercises/01-vulnerable-app.js` is the app with six holes. Fix all six. Keep the routes and their normal behavior. The tests are grouped by hole.
2. `exercises/findings.md` is a template. For each hole, write where it was, how an attacker uses it, and your fix. Your reviewer reads this file. It is the only part of the lesson that tests can't check.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add a `Content-Security-Policy` header to the book page, such as `default-src 'none'; style-src 'unsafe-inline'`. It tells the browser which sources of scripts it may run, so XSS that slips past your escaping still does nothing. Try posting a review after you remove your escaping, and see what the browser does.
- Compare the admin key with `crypto.timingSafeEqual`, as you did in lesson 24. Why does it need buffers of the same length?
- Rate-limit `POST /login` so that one address can't try thousands of emails.
- Search the repo history with `git log -p -S'library-admin'`. You still find the old key. Write down what you would do in a real project.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/25-web-security .gitignore
git commit -m "Complete lesson 25 exercises"
git push -u origin lesson-25
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Escaping happens in one function that every user-controlled value passes through, not copied into each template
- No SQL string contains a value from the request
- The CORS check compares against an allowlist and doesn't use a pattern such as `endsWith` or `includes`, which `http://localhost:5173.evil.example` would pass
- The real `.env` isn't committed, and the old key doesn't appear in your final code
- `findings.md` explains each hole in your own words, including what an attacker gains
