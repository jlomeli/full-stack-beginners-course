// Small text helpers for a blog. They work, but nobody wrote tests for them.
// Don't change this file. Write your tests in 01-text-utils.test.js.

// Turn a title into a URL slug.
// - Lowercase everything.
// - Each run of characters that are not a-z or 0-9 becomes a single "-".
// - No "-" at the start or the end.
// slugify('  Hello, World! ') returns 'hello-world'
export function slugify(title) {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// Shorten text to at most maxLength characters.
// - Text that already fits comes back unchanged.
// - Longer text is cut and ends with "...". The result, dots included, is exactly maxLength long.
// truncate('Hello world', 8) returns 'Hello...'
export function truncate(text, maxLength) {
	if (text.length <= maxLength) {
		return text;
	}
	return text.slice(0, maxLength - 3) + '...';
}

// Put a count in front of a word, using the plural form for every count except 1.
// The plural defaults to the singular plus "s". Pass a third argument for irregular words.
// pluralize(1, 'cat') returns '1 cat'
// pluralize(3, 'cat') returns '3 cats'
// pluralize(2, 'mouse', 'mice') returns '2 mice'
export function pluralize(count, singular, plural = singular + 's') {
	const word = count === 1 ? singular : plural;
	return `${count} ${word}`;
}

// Format a price given in cents as dollars with exactly two decimal places.
// formatPrice(1250) returns '$12.50'
// formatPrice(5) returns '$0.05'
export function formatPrice(cents) {
	return '$' + (cents / 100).toFixed(2);
}

// Split an array into smaller arrays of `size` items. The last one holds whatever is left.
// chunk([1, 2, 3, 4, 5], 2) returns [[1, 2], [3, 4], [5]]
// chunk([], 3) returns []
export function chunk(items, size) {
	const chunks = [];
	for (let start = 0; start < items.length; start += size) {
		chunks.push(items.slice(start, start + size));
	}
	return chunks;
}
