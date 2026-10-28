// The books API for this lesson. It keeps books in memory, so they reset when you restart it.
// Run it with: node lessons/23-react-routing/server.js
import express from 'express';
import * as z from 'zod';

const BookFields = z.object({
	title: z.string().trim().min(1, 'Title is required'),
	author: z.string().trim().min(1, 'Author is required'),
	year: z.number().int('Year must be a whole number').max(new Date().getFullYear(), 'Year cannot be in the future'),
});

const books = [
	{ id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 },
	{ id: 2, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969 },
	{ id: 3, title: 'Beloved', author: 'Toni Morrison', year: 1987 },
];

const app = express();
app.use(express.json());

app.get('/api/books', (req, res) => {
	res.json(books);
});

app.put('/api/books/:id', (req, res) => {
	const book = books.find((candidate) => candidate.id === Number(req.params.id));
	if (!book) return res.status(404).json({ error: 'Book not found' });
	const result = BookFields.safeParse(req.body);
	if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
	const title = result.data.title.toLowerCase();
	if (books.some((other) => other.id !== book.id && other.title.toLowerCase() === title)) {
		return res.status(400).json({ error: 'That book is already in the library' });
	}
	Object.assign(book, result.data);
	res.json(book);
});

app.listen(3000, () => console.log('Books API on http://localhost:3000/api/books'));
