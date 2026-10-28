import { ProductCard } from './01-product-card.jsx';

// Return the category names in `products`, each once, in alphabetical order.
// categoriesOf([mouse, lamp, mug]) returns ['Electronics', 'Home'].
export function categoriesOf(products) {
	// TODO
}

// Show the products that match every filter, in their original order.
//
// - search: keep products whose name contains this text. Ignore upper and lower case
//   and spaces at the ends. An empty search (the default) keeps everything.
// - category: keep products in this category. 'all' (the default) keeps every category.
// - inStockOnly: when true, keep only products that are in stock. The default is false.
//
// What to render:
// - A <p> that says "Showing 3 of 8 products." (shown, then total).
// - A <ul> with one <li> per matching product. Each <li> holds a <ProductCard>.
//   Pass onAdd through to each card. Give each <li> a key.
// - When nothing matches, no <ul>. The <p> says "No products match your filters." instead.
export function ProductList({ products, search = '', category = 'all', inStockOnly = false, onAdd }) {
	// TODO
}
