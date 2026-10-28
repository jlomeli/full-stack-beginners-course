import express from 'express';
import { fileURLToPath } from 'node:url';
import { hashPassword, verifyPassword } from './01-passwords.js';
import { createSessionStore, parseCookies, serializeCookie } from './02-sessions.js';

// The folder with index.html, as a path on your computer. express.static needs it.
const publicDir = fileURLToPath(new URL('../public', import.meta.url));

const COOKIE_NAME = 'sid';
const SESSION_SECONDS = 7 * 24 * 60 * 60;

// Build the library API with sign-up, log-in, and log-out. Don't call listen here: server.js does that.
//
// Each call starts with its own empty members and loans, and the three books below.
//
// Shapes:
// - A book is { id, title, author, year }.
// - A member is { id, name, email }. Inside the server it also has passwordHash. The hash NEVER appears in a response.
// - A loan is { id, bookId, memberId, borrowedAt, returnedAt }. borrowedAt is new Date().toISOString(), returnedAt is null.
//
// Middleware: parse JSON bodies, and serve the files in publicDir.
//
// Sessions:
// - A session cookie is named "sid". Set it with serializeCookie and these options:
//   path "/", maxAge SESSION_SECONDS, httpOnly true, sameSite "Lax", and secure true when
//   process.env.NODE_ENV === 'production'.
// - Log in by creating a session in the store and sending the cookie.
// - Log out by destroying the session and sending the same cookie with maxAge 0.
// - A request is logged in when its "sid" cookie names a session that is in the store.
// - Member ids come from the session, never from the request body.
//
// Routes:
// - POST /signup  body { name, email, password }
//     400 { error } when name, email, or password is missing or not a string, when email has no "@",
//         or when password is shorter than 8 characters.
//     409 { error: 'Email already in use' } when a member has that email.
//     201 with the new member { id, name, email }, and the member is logged in (the session cookie is set).
// - POST /login   body { email, password }
//     401 { error: 'Invalid email or password' } when the email is unknown OR the password is wrong.
//         Use the same message for both, so an attacker can't learn which emails have accounts.
//     200 with the member { id, name, email }, and the session cookie is set.
// - POST /logout  204 with no body. Destroys the session if there is one. Works when nobody is logged in too.
// - GET  /me      200 with the logged-in member, or 401 { error: 'Log in first' }.
// - GET  /books   200 with every book. Open to everyone.
// - POST /loans   body { bookId }. Needs a log-in (401 { error: 'Log in first' }).
//     404 { error: 'Book not found' } when no book has that id.
//     409 { error: 'Book is already on loan' } when a loan for that book has returnedAt null.
//     201 with the new loan. Its memberId is the logged-in member.
// - GET  /loans   Needs a log-in. 200 with the logged-in member's loans only.
//
// Email addresses are not case sensitive: trim them and lowercase them before you store or compare them.
export function createApp() {
	const sessionStore = createSessionStore();
	const books = [
		{ id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 },
		{ id: 2, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969 },
		{ id: 3, title: 'Beloved', author: 'Toni Morrison', year: 1987 },
	];
	const members = [];
	const loans = [];
	let nextMemberId = 1;
	let nextLoanId = 1;

	const app = express();

	// TODO: parse JSON bodies and serve publicDir. In Express 5, req.body is undefined when a request has no JSON
	// body, so read it as `req.body ?? {}`.

	// TODO: a function that finds the logged-in member from the cookie, and a middleware that answers 401
	// when there isn't one.

	// TODO: the routes

	return app;
}
