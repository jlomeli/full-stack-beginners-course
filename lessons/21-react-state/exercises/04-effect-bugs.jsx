import { useEffect, useState } from 'react';

// Each component below misuses useEffect. Read the comment above it, run the tests,
// find the bug, and fix it. Do not change what a component shows or its props.
// Above each fix, write a one-sentence comment that says what was wrong.

// Shows a heading, and the browser tab should say "<name>'s library".
// BUG 1: the tab does not change when `name` changes.
export function PageTitle({ name }) {
	useEffect(() => {
		document.title = `${name}'s library`;
	}, []);

	return <h2>{name}'s library</h2>;
}

// Calls onKey(key) each time the user presses a key anywhere on the page.
// BUG 2: it keeps listening after the component is gone, and after the parent passes a new onKey.
export function KeyLogger({ onKey }) {
	useEffect(() => {
		function handleKeyDown(event) {
			onKey(event.key);
		}
		window.addEventListener('keydown', handleKeyDown);
	}, [onKey]);

	return <p>Press any key.</p>;
}

// Shows a search box and the titles of the books whose title contains the text.
// `books` is an array of { id, title }. It can change while the component is on the page.
// BUG 3: when `books` changes, the list still shows the old books.
export function BookSearch({ books }) {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState(books);

	useEffect(() => {
		setResults(books.filter((book) => book.title.toLowerCase().includes(query.toLowerCase())));
	}, [query]);

	return (
		<div>
			<label>
				Search books
				<input value={query} onChange={(event) => setQuery(event.target.value)} />
			</label>
			<ul>
				{results.map((book) => (
					<li key={book.id}>{book.title}</li>
				))}
			</ul>
		</div>
	);
}
