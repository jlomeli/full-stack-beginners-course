import { useState } from 'react';

// The form that adds a task. It keeps what the user is typing in its own state,
// and it hands a finished task to its parent through the onAdd prop.
//
// - Show a text input labelled "New task" and a submit button with the text "Add".
// - Keep the input's value in state (a controlled input).
// - Submitting the form (click "Add" or press Enter) calls onAdd(text) with the text
//   trimmed of spaces at both ends, then empties the input.
// - If the trimmed text is empty, do not call onAdd and leave the input as it is.
// - Submitting must not reload the page.
export function TodoForm({ onAdd }) {
	// TODO
}
