import { useEffect, useState } from 'react';
import * as api from './api.js';
import { AddBookForm } from './AddBookForm.jsx';
import { BookList } from './BookList.jsx';
import { LoginForm } from './LoginForm.jsx';

export function App() {
	const [member, setMember] = useState(null);
	const [books, setBooks] = useState([]);

	async function refreshBooks() {
		setBooks(await api.getBooks());
	}

	useEffect(() => {
		refreshBooks();
		api.getMe().then(setMember, () => setMember(null));
	}, []);

	async function handleLogin(credentials) {
		setMember(await api.logIn(credentials));
	}

	async function handleLogout() {
		await api.logOut();
		setMember(null);
	}

	async function handleAdd(book) {
		await api.addBook(book);
		await refreshBooks();
	}

	async function handleBorrow(book) {
		await api.borrowBook(book.id);
		await refreshBooks();
	}

	return (
		<main>
			<h1>Library</h1>
			{member ? (
				<>
					<p>
						Signed in as {member.name} <button onClick={handleLogout}>Log out</button>
					</p>
					<AddBookForm onAdd={handleAdd} />
				</>
			) : (
				<LoginForm onLogin={handleLogin} />
			)}
			<BookList books={books} onBorrow={member ? handleBorrow : undefined} />
		</main>
	);
}
