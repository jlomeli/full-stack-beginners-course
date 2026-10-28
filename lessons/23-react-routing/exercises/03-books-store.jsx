import { createContext, useContext, useEffect, useState } from 'react';

// Books shared by every page. The provider loads the list once and keeps it in state, so moving
// between routes doesn't fetch again, and an edit made on one page shows up on all the others.
// The API is in ../server.js:
//   GET /api/books      → 200 with an array of { id, title, author, year }
//   PUT /api/books/:id  with a JSON body { title, author, year }
//                       → 200 with the saved book, or 400 / 404 with { error: 'a message' }
//
// <BooksProvider>{children}</BooksProvider>
// - When it first renders, fetch the books once. Drop the response if the provider has unmounted.
// - Provide { status, books, updateBook } to everything inside it.
//   status is 'loading' until the request finishes, then 'ready', or 'error' when fetch rejects
//   or the response isn't ok. books is [] until they arrive.
//
// updateBook(id, changes)
// - Sends a PUT to /api/books/:id with `changes` as a JSON body (and the Content-Type header).
// - On success, replaces that book in the list with the book from the response, keeps the order of
//   the others, and resolves to the saved book. Don't fetch the list again.
// - On failure, throws an Error with the API's message and leaves the list as it was.
//
// useBooks() returns what the provider provides. Outside a provider it throws an Error whose message
// is 'useBooks must be used inside <BooksProvider>'.
const BooksContext = createContext(null);

export function BooksProvider({ children }) {
	// TODO
}

export function useBooks() {
	// TODO
}
