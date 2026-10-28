import { useState } from 'react';
import { TodoForm } from './01-todo-form.jsx';
import { TodoList } from './02-todo-list.jsx';

// The to-do app. It owns the list of todos, and the two components above only show them.
// This is "lifting state up": the data lives in the closest parent of everything that needs it.
//
// - `initialTodos` (default: an empty array) is the list the app starts with.
//   Keep the todos in state. Never change the array in state or the objects in it; build new ones.
// - Render <TodoForm> and <TodoList>.
// - Adding a task puts a new todo at the end of the list: { id, text, done: false }.
//   The id is one more than the biggest id in the list (1 for an empty list).
// - Toggling a todo flips its `done`. Deleting removes it. Other todos stay as they are.
// - Under the list, show a summary <p>: "1 of 3 done". It is the number of done todos,
//   then the total. Compute it while rendering; do not keep it in state.
//   With no todos, show no summary.
// - When at least one todo is done, show a button "Clear completed" that removes
//   every done todo. With none done, the button is not on the page.
export function TodoApp({ initialTodos = [] }) {
	// TODO
}
