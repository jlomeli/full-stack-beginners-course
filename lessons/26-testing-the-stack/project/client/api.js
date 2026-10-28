// Thin wrappers around fetch. Every function rejects with an Error whose message is safe to show the user.
async function request(method, path, body) {
	const response = await fetch(path, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
	if (response.status === 204) return null;
	const data = await response.json().catch(() => null);
	if (!response.ok) throw new Error(data?.error ?? `Request failed with status ${response.status}`);
	return data;
}

export const getBooks = () => request('GET', '/api/books');
export const getMe = () => request('GET', '/api/me');
export const logIn = ({ email, password }) => request('POST', '/api/login', { email, password });
export const logOut = () => request('POST', '/api/logout');
export const addBook = ({ title, author, year }) => request('POST', '/api/books', { title, author, year });
export const borrowBook = (bookId) => request('POST', '/api/loans', { bookId });
