# 24. Authentication and sessions

In this lesson you add sign-up, log-in, and log-out to the library API. You store passwords so that a stolen database doesn't reveal them, remember who is logged in with a cookie, and make the server refuse requests from people who haven't logged in.

## What you will be able to do

- Hash passwords
- Log users in with cookie sessions
- Protect routes on the server and the client

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-24
```

Run the tests for this lesson:

```sh
npm test 24
```

You see 62 failing tests. Your job this lesson is to make them pass.

## Two questions: who are you, and what may you do?

**Authentication** answers "who is making this request?" **Authorization** answers "may they do this?" This lesson is mostly about the first. The second shows up in the routes: any logged-in member can borrow a book, but only sees their own loans.

HTTP has no memory. Each request arrives alone, and the server can't tell that two requests came from the same person. Logging in solves that in three steps:

1. The member sends an email and a password.
2. The server checks them, then makes a random **session id** and remembers "this id belongs to member 7".
3. The server sends the id back in a cookie. The browser attaches that cookie to every later request, and the server looks the id up.

The cookie carries no information about the member. It is a random ticket, and the server holds the meaning. You build each piece in the three exercises.

## Never store a password

If your database holds `password = 'hunter2'`, anyone who steals a copy of it, or any developer with read access, knows every member's password. Many people reuse passwords, so you'd leak their other accounts too.

Store a **hash** instead. A hash function turns any input into a fixed-size scramble, and it can't be run backwards. To check a log-in, you hash the attempt and compare it with the stored hash.

A plain fast hash such as SHA-256 isn't enough. Attackers compute billions of guesses per second against it. And two members with the same password would have the same hash. Passwords need two extra things:

- A **salt**: random bytes, different for every password, mixed in before hashing. Two members with the same password get different hashes, and precomputed tables of common passwords are useless.
- A **slow** hash on purpose. `scrypt` takes tens of milliseconds and a lot of memory per guess. That's invisible when one person logs in, and ruinous for an attacker trying billions of guesses.

Node ships `scrypt` in the `node:crypto` module. Try it in a scratch file, `lessons/24-authentication/scratch.js`:

```js
import { randomBytes, scrypt } from 'node:crypto';

const salt = randomBytes(16);
scrypt('hunter2', salt, 64, (error, key) => {
	console.log(salt.toString('hex'));
	console.log(key.toString('hex'));
});
```

Run it with `node lessons/24-authentication/scratch.js` twice. You see two lines of hex each time, and different values on every run, because the salt is new each time. The key is 64 bytes, which is 128 hex characters.

`scrypt` takes a callback. Wrap it in a promise so that you can `await` it:

```js
function deriveKey(password, salt) {
	return new Promise((resolve, reject) => {
		scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key)));
	});
}
```

You must keep the salt, because you need it to check a password later. The convention is to store everything in one string: `scrypt$<salt>$<hash>`. The first part names the algorithm, so you can change it someday without breaking old accounts.

### Compare without leaking timing

To check a password, derive the key again from the stored salt and compare it with the stored key. Don't use `===`. It stops at the first byte that differs, so a guess that's "more right" takes slightly longer to reject. With enough requests, an attacker can measure the difference. `timingSafeEqual` takes the same time however many bytes match:

```js
import { timingSafeEqual } from 'node:crypto';

timingSafeEqual(actualKey, expectedKey); // true or false
```

It has one trap: it throws when the two buffers have different lengths. A stored value can come from a damaged row, so check the length first and return `false`.

Convert hex text back to bytes with `Buffer.from(text, 'hex')`.

## Exercise 1: passwords

Open `exercises/01-passwords.js`. Write `hashPassword` and `verifyPassword`, then run `npm test 24`. The tests in `01-passwords.test.js` pass.

One test checks `verifyPassword` against a stored string that was made elsewhere. If it fails while the others pass, look at how you pass the salt to `scrypt`: use the decoded bytes, not the hex text.

## Cookies by hand

Express can parse JSON for you, but not cookies. Real projects use a package such as `cookie-parser`. Your course repo doesn't have it, and the format is small enough to write yourself. It also shows you what the packages do.

A cookie travels in two headers:

- The server sets one with `Set-Cookie: sid=abc123; Path=/; HttpOnly`.
- The browser sends all the cookies it holds for the site in one `Cookie: theme=dark; sid=abc123` header on every request.

The part after the first `;` in `Set-Cookie` is **attributes**. Three of them matter for security:

| Attribute | What it does |
| --- | --- |
| `HttpOnly` | JavaScript on the page can't read the cookie. If an attacker injects a script into your page (lesson 25), they still can't steal the session id. |
| `SameSite=Lax` | The browser doesn't send the cookie on requests that other websites trigger, except plain link clicks. This blocks most cross-site request forgery. Lesson 25 covers it. |
| `Secure` | The browser only sends the cookie over HTTPS. Turn it on in production. Browsers treat `localhost` as secure enough for it, but in this lesson you switch it on when `NODE_ENV` is `production`. |

Also set `Path=/` so that the cookie goes to every route, and `Max-Age` (in seconds) so that it expires. Setting `Max-Age=0` tells the browser to delete the cookie. That is how log-out works on the browser's side.

Open your browser's developer tools on any site you're logged in to. In the Application tab (Storage in Firefox), open Cookies. You see the same columns: name, value, path, expiry, `HttpOnly`, `Secure`, `SameSite`.

## Exercise 2: sessions

Open `exercises/02-sessions.js`. It has three tools:

- `parseCookies` reads the `Cookie` header. A stranger controls that header, so it must never throw on strange input.
- `serializeCookie` builds a `Set-Cookie` header.
- `createSessionStore` makes the random session ids and remembers who they belong to.

Session ids must be impossible to guess. Anyone who learns a valid id can act as that member, which is why you use `randomBytes(32)` and not a counter. A counter would make ids `1`, `2`, `3`, and an attacker would try them all.

Sessions also expire. The store records an expiry time with each session and treats an expired one as missing. The store takes a `now` function so that the tests can move the clock without waiting a week.

Run `npm test 24` after each function.

## Where sessions live

Your store is a `Map` in memory. That's fine for learning, and it has two limits. Restarting the server logs everybody out, and two servers behind a load balancer wouldn't share sessions. Real apps keep sessions in a database table or a store such as Redis, with the same three operations: create, get, destroy.

Many apps use **JWTs** instead: the session data is signed and put in the cookie itself, so the server stores nothing. That has a cost. You can't end a JWT before it expires, because the server has no list to remove it from. Server-side sessions let you log someone out, or everyone out, by deleting rows. Use sessions until you have a reason not to.

## Exercise 3: the auth API

Open `exercises/03-auth-api.js`. It builds the library API with `createApp`, the same pattern as lesson 13. The comment above the function lists every route and its status codes. Read it all before you write anything. The pieces:

**Finding the logged-in member.** Read the `Cookie` header with `parseCookies`, look the session id up in the store, and find the member. Put this in one function so that every route uses it.

**Requiring a log-in.** Middleware that does the check once, so that routes don't repeat it:

```js
function requireLogin(req, res, next) {
	const member = currentMember(req);
	if (!member) {
		res.status(401).json({ error: 'Log in first' });
		return;
	}
	req.member = member;
	next();
}

app.get('/loans', requireLogin, (req, res) => {
	// req.member is the logged-in member here
});
```

Express runs the functions you list after the path in order. `requireLogin` either answers `401` and stops, or calls `next()` and the route runs.

`401` means "I don't know who you are." A different code, `403`, means "I know who you are, and you may not do this." Lesson 25 uses `403`.

**Never take the member id from the request.** `POST /loans` reads `bookId` from the body, but `memberId` comes from the session. If the route read `memberId` from the body, any member could borrow books as someone else by changing one number. Whatever the client sends, treat it as a claim, not a fact.

**Saying the same thing for two failures.** When a log-in fails, the response is identical whether the email doesn't exist or the password is wrong. If the messages differed, an attacker could test a list of emails and learn which ones have accounts.

**Never send the hash.** Return `{ id, name, email }`, built field by field. Don't return the stored member object with `passwordHash` still on it.

The tests use a Supertest **agent**. Unlike a bare `request(app)`, an agent keeps cookies between requests, the way a browser does:

```js
const agent = request.agent(app);
await agent.post('/login').send({ email: 'ada@example.com', password: 'analytical-engine' });
const res = await agent.get('/me'); // the agent sends the cookie by itself
```

Run `npm test 24` after each route.

### Try it in the browser

When all the tests pass, run the real server:

```sh
node lessons/24-authentication/server.js
```

Open <http://localhost:3000>. You see a sign-up form and a log-in form. Sign up. The page switches to a list of books with Borrow buttons. Borrow one, and it appears under Your loans.

Open the developer tools, find the `sid` cookie, and look at its attributes. Reload the page: you're still logged in, because the browser sends the cookie. Click Log out. The cookie disappears. Log in again, copy the cookie value, log out, and put the old value back by hand in the developer tools. The page treats you as logged out, because logging out destroyed the session on the server. Deleting the cookie in the browser alone wouldn't do that.

Stop the server and start it again, then reload. You're logged out and your account is gone, because everything lives in memory.

## Protecting routes on the client

The page above hides the log-in forms from logged-in members and the book list from everyone else. In React apps, you do the same with a **protected route**: a component that checks who is logged in, and sends everyone else to the log-in page.

```jsx
function RequireLogin({ member, children }) {
	if (member === undefined) return <p>Loading...</p>; // still asking the server
	if (member === null) return <Navigate to="/login" />;
	return children;
}
```

Three states matter: still loading, logged out, and logged in. Skipping the loading state makes the page flash the log-in screen at members who are logged in. The app fills `member` by calling `GET /me` when it starts, and the `401` answer means "logged out".

This protects the user experience, not your data. Anyone can open the developer tools, change the JavaScript, or send a request with `curl` and skip your component. A hidden button hides nothing from someone who calls the API directly. **Only the server can protect data.** That's why `requireLogin` sits on the routes, and why `GET /loans` filters by the session's member. Add client-side checks for a smoother app, and never count on them for security.

## Exercises

Open each file in `exercises/`, read the comment at the top, and replace `// TODO` with your code. Each file has a matching `.test.js` file. Read the tests too. They are the exact spec.

1. `01-passwords.js` hashes passwords with `scrypt` and a random salt, and checks them with `timingSafeEqual`.
2. `02-sessions.js` parses and builds cookies, and keeps a store of random session ids that expire.
3. `03-auth-api.js` builds the library API with sign-up, log-in, log-out, a `/me` route, and routes that need a log-in.

Run `npm test 24` after each change.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Log-in is faster when the email doesn't exist, because no hash runs. An attacker can measure that. Hash a dummy value when the email isn't found, so that both paths take about the same time.
- Limit log-in attempts: after five failures for one email, answer `429` for a minute.
- Add `POST /logout-everywhere`, which destroys every session of the logged-in member. What does the store need for that?
- Sign-up logs the member in. List the reasons a real site might send a confirmation email first.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/24-authentication
git commit -m "Complete lesson 24 exercises"
git push -u origin lesson-24
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- No password or hash is ever logged or sent in a response
- Comparisons of secrets use `timingSafeEqual`, not `===`
- The session id comes from `randomBytes`, and the member id comes from the session, not the request body
- The login-required check lives in one middleware that routes share
- No leftover `console.log` calls, and `scratch.js` is deleted
