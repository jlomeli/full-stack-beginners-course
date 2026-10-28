// Finished code from lesson 22. You don't change this file.
// Checks the values from the book form. Returns one message per invalid field, or {} when all are valid.
export function validateBook(values) {
	const errors = {};
	const title = values.title.trim();
	const author = values.author.trim();
	const year = values.year.trim();

	if (title === '') errors.title = 'Title is required';
	if (author === '') errors.author = 'Author is required';

	if (year === '') {
		errors.year = 'Year is required';
	} else if (!/^\d+$/.test(year)) {
		errors.year = 'Year must be a whole number';
	} else if (Number(year) > new Date().getFullYear()) {
		errors.year = 'Year cannot be in the future';
	}

	return errors;
}
