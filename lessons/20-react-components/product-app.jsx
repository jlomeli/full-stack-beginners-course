// Joins your three components into the page. You do not need to change this file.
// It is the only place that remembers the filters. Lesson 21 explains useState.
import { useState } from 'react';
import { ProductFilters } from './exercises/03-product-filters.jsx';
import { ProductList, categoriesOf } from './exercises/02-product-list.jsx';

export function ProductApp({ products }) {
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState('all');
	const [inStockOnly, setInStockOnly] = useState(false);
	const [cartCount, setCartCount] = useState(0);

	return (
		<main>
			<ProductFilters
				categories={categoriesOf(products)}
				search={search}
				category={category}
				inStockOnly={inStockOnly}
				onSearchChange={setSearch}
				onCategoryChange={setCategory}
				onInStockOnlyChange={setInStockOnly}
			/>
			<p>Cart: {cartCount} items</p>
			<ProductList
				products={products}
				search={search}
				category={category}
				inStockOnly={inStockOnly}
				onAdd={() => setCartCount(cartCount + 1)}
			/>
		</main>
	);
}
