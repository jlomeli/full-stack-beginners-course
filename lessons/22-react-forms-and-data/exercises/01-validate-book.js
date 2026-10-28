// Check the values from the add-book form. Each value is the string the user typed.
// Return an object with one message per invalid field, or an empty object when every field is valid.
// Trim spaces from each value before you check it.
//
//   title   'Title is required' when it's empty
//   author  'Author is required' when it's empty
//   year    'Year is required' when it's empty
//           'Year must be a whole number' when it isn't only digits, like '19x4' or '1.5'
//           'Year cannot be in the future' when it's after the current year
//
// validateBook({ title: 'Kindred', author: 'Octavia E. Butler', year: '1979' })  → {}
// validateBook({ title: '', author: 'Ann', year: 'soon' })
//   → { title: 'Title is required', year: 'Year must be a whole number' }
export function validateBook(values) {
	// TODO
}
