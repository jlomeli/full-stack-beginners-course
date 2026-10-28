import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BooksPage } from './exercises/03-books-page.jsx';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<BooksPage />
	</StrictMode>,
);
