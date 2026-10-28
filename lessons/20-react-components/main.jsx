// Connects the page to your components. You do not need to change this file.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProductApp } from './product-app.jsx';
import { products } from './products.js';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<ProductApp products={products} />
	</StrictMode>,
);
