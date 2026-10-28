import { useState } from 'react';
import { validateBook } from './01-validate-book.js';

// A form for adding a book.
//
// - Show three labelled text inputs, "Title", "Author", and "Year", and an "Add book" submit button.
// - Keep every input's value in state (a controlled input).
// - Submitting with invalid values shows the messages from validateBook and does not call onSubmit.
//   After the first submit, the messages update as the user types.
// - Submitting with valid values calls onSubmit({ title, author, year }) with trimmed strings
//   and year as a number.
// - onSubmit can return a promise. While it's pending, the button reads "Adding..." and is disabled.
//   When it resolves, clear the inputs. When it rejects, show the error's message
//   and keep what the user typed.
export function BookForm({ onSubmit }) {
	// TODO
}
