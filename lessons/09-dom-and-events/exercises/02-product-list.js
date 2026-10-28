// A product looks like this:
// { id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 2499, inStock: true }
// Prices are whole cents: 2499 means $24.99.
//
// The product list keeps its filters in one state object:
//   { products, search: '', category: 'all', inStockOnly: false }

// Return the products that match every filter, in their original order.
// `filters` is { search, category, inStockOnly }. Every key is optional.
// - search: keep products whose name contains this text. Ignore upper and lower case,
//   and ignore spaces at the ends of the search. An empty search keeps everything.
// - category: keep products in this category. 'all' (the default) keeps every category.
// - inStockOnly: when true, keep only products that are in stock. The default is false.
// Do not change the `products` array.
export function filterProducts(products, filters = {}) {
	// TODO
}

// Connect the product list in index.html to filterProducts.
// `root` is the <section id="product-app"> element. Look inside it for:
//   #product-search (text input), #product-category (a <select>),
//   #product-in-stock (checkbox), #product-count (a <p>), #product-list (a <ul>)
//
// Keep the state in one variable and write one render function that draws the list and
// the count from it. Every event handler changes the state, then calls render.
//
// Setup, once:
// - Add one <option> to #product-category for each category in `products`, after the
//   existing "All categories" option. List each category once, in alphabetical order.
//   The option's value and text are both the category name.
//
// Rendering rules:
// - Each matching product is an <li> in #product-list, in the original order. Add the
//   class "out-of-stock" to the <li> when the product is not in stock.
// - Inside the <li>, in this order:
//     <span class="name">     the product name
//     <span class="category"> the category
//     <span class="price">    "$" and the price in dollars with two decimals, "$24.99"
//     <span class="badge">    the text "Out of stock", only for products not in stock
// - #product-count says "Showing <shown> of <total> products." If nothing matches,
//   it says "No products match your filters."
// - Show product text as text, never as HTML.
//
// Behavior:
// - The list updates on every keystroke in the search box.
// - Choosing a category, or checking "In stock only", updates the list.
// - Only the list and the count are redrawn. Do not rebuild the search box, the select,
//   or the checkbox, or typing would stop after one character.
export function setupProductList(root, products) {
	// TODO
}
