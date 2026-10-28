import { BookForm } from './book-form.jsx';
import { BooksProvider, useBooks } from './03-books-store.jsx';
import { Link, Router, useNavigate, useParams } from './02-router.jsx';

// The library app with three pages. All of them read the books from useBooks(), so the list is
// fetched once and an edit shows up everywhere.
//
//   /                  BooksListPage
//   /books/:id         BookDetailPage
//   /books/:id/edit    BookEditPage
//
// While the books load, every page shows "Loading books...". When they fail to load, it shows
// "Could not load books.". Write that part once and reuse it.
//
// BooksListPage
// - A heading "Books", then a list with one item per book: a link to /books/<id> whose text is the
//   title, followed by " by <author>". With no books, show "No books yet." instead of the list.
//
// BookDetailPage
// - Finds the book whose id matches the :id parameter. Parameters are strings, so compare numbers.
// - Shows the title in a heading, then "Author: <author>" and "Year: <year>".
// - Has an "Edit" link to /books/<id>/edit and a "Back to books" link to /.
// - When no book has that id, shows "Book not found." and a "Back to books" link.
//
// BookEditPage
// - Shows a heading "Edit <title>" and a <BookForm> filled in with the book's values and the
//   button label "Save changes". Render the form only once the book exists.
// - Saving calls updateBook(book.id, values), then goes to /books/<id> with navigate.
//   When updateBook throws, don't navigate. BookForm shows the error for you, so let it reach the form.
// - When no book has that id, shows "Book not found." and a "Back to books" link.
//
// App
// - Wraps a <Router> in a <BooksProvider>, with a route for each page above, in that order.
// - A URL that matches no route shows "Page not found." and a "Back to books" link.
export function BooksListPage() {
	// TODO
}

export function BookDetailPage() {
	// TODO
}

export function BookEditPage() {
	// TODO
}

export function App() {
	// TODO
}
