// The list of tasks. It has no state: it shows the todos it is given
// and reports clicks to its parent.
//
// A todo looks like this: { id: 1, text: 'Read the lesson', done: false }
//
// - When `todos` is empty, show the text "Nothing to do." and no list.
// - Otherwise show a <ul> with one <li> per todo, in the order given. Give each <li> a key.
// - Each <li> has a checkbox labelled with the todo's text. The checkbox is checked when
//   the todo is done. Checking or unchecking it calls onToggle(todo.id).
// - Each <li> also has a button with the text "Delete". Its accessible name must say which
//   task it deletes: "Delete Read the lesson". Clicking it calls onDelete(todo.id).
//   (Hint: aria-label.)
export function TodoList({ todos, onToggle, onDelete }) {
	// TODO
}
