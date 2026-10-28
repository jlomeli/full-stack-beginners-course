// The library REST API. createApp(db) builds an Express app that talks to `db`. It never calls listen.
// Put the SQL in library.js and keep the routes thin: validate the request with zod, call a library function,
// send the response.
//
// Every response is JSON, except the 204 ones, which have no body. Errors look like { error: 'message' }.
// A request that fails validation is 400 { error: 'Validation failed', details: [{ field, message }, ...] },
// with one entry per bad field. `field` is the name of the field, for example 'title' or 'year'.
// An id in the URL must be a positive whole number. Anything else, such as /books/abc, is a 400.
//
// Books
//   GET    /books               200 and an array of books. Query: ?available=true|false and ?search=text, both optional.
//                               Any other value for available is a 400.
//   GET    /books/:id           200 and the book, or 404.
//   POST   /books               Body { title, author, year }. 201 and the new book.
//                               title and author: text with something other than spaces in it. Save them trimmed.
//                               year: a whole number from 1450 to 2100. A string like "1979" is a 400.
//   DELETE /books/:id           204. 404 when there is no such book. 409 when the book has loans.
//
// Members
//   GET    /members             200 and an array of members.
//   POST   /members             Body { name, email }. 201 and the new member.
//                               name: text with something other than spaces in it. email: a valid email address.
//                               409 when the email is already taken.
//   GET    /members/:id/loans   200 and the member's loans, newest first. Query: ?active=true keeps open loans only.
//                               404 when there is no such member.
//
// Loans
//   POST   /loans               Body { bookId, memberId }, both positive whole numbers. 201 and the new loan.
//                               404 when the book or member does not exist. 409 when the book is already out.
//   POST   /loans/:id/return    200 and the updated loan. 404 when there is no such loan. 409 when it was already returned.
//
// Everywhere else
//   A route that does not exist is 404 { error }.
//   A request body that is not valid JSON is 400 { error }.
//   Anything unexpected is 500 { error: 'Internal server error' } with no details from the error.
import express from 'express';
import { z } from 'zod';
import * as library from './library.js';

export function createApp(db) {
	const app = express();
	app.use(express.json());

	// TODO routes

	// TODO 404 handler

	// TODO error handler

	return app;
}
