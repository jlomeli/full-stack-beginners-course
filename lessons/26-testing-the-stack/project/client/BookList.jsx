// BookList({ books, onBorrow })
// books is an array of { id, title, author, year, available }.
// With no books, render the text "No books yet." and nothing else.
// Otherwise render a <ul> with one <li> per book, in the order given. Each <li> shows
//   the title, the author, the year, and the word "Available" or "On loan".
// onBorrow is optional. When it is given and the book is available, the <li> also has a button
//   labelled "Borrow <title>" (use aria-label) that calls onBorrow(book). On-loan books never get the button,
//   and nobody gets one when onBorrow is missing.
export function BookList({ books, onBorrow }) {
	// TODO
	return null;
}
