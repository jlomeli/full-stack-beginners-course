// The controls above the product list. This component has no state of its own.
// Its parent owns the values and passes them in, so every input is controlled.
//
// Props:
//   categories           an array of category names
//   search               the text in the search box
//   category             the chosen category: a name from `categories`, or 'all'
//   inStockOnly          whether the checkbox is checked
//   onSearchChange       called with the new text when the user types in the search box
//   onCategoryChange     called with the chosen value when the user picks a category
//   onInStockOnlyChange  called with true or false when the user toggles the checkbox
//
// What to render, inside a <form>:
// - A text input labelled "Search" that shows `search`.
// - A <select> labelled "Category". Its first <option> has the value "all" and the text
//   "All categories". After it comes one <option> per category, with the name as value and text.
//   The select shows `category`.
// - A checkbox labelled "In stock only" that is checked when `inStockOnly` is true.
// - Pressing Enter in the search box must not reload the page.
export function ProductFilters({
	categories,
	search,
	category,
	inStockOnly,
	onSearchChange,
	onCategoryChange,
	onInStockOnlyChange,
}) {
	// TODO
}
