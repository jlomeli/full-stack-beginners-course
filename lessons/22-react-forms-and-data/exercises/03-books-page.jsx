import { useEffect, useState } from 'react';
import { BookForm } from './02-book-form.jsx';

// The library's books page. It talks to the API in ../server.js:
//   GET  /api/books  → 200 with an array of { id, title, author, year }
//   POST /api/books  with a JSON body { title, author, year }
//                    → 201 with the new book, or 400 with { error: 'a message' }
//
// - On first render, fetch the books. While you wait, show "Loading books...".
// - When the request fails (fetch rejects, or the status isn't ok), show "Could not load books."
//   and a "Try again" button that fetches the books again.
// - When the books arrive, show a list with one item per book: "Kindred by Octavia E. Butler (1979)".
//   With no books, show "No books yet." instead of the list.
// - Once the books have loaded, render <BookForm> below them. When it submits, POST the book.
//   On success, add the new book from the response to the end of the list. Don't fetch the list again.
//   On failure, throw an Error with the API's message so BookForm shows it.
export function BooksPage() {
	// TODO
}
