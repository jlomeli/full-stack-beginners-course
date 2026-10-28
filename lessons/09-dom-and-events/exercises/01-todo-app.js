// The whole to-do app lives in one state object:
//   { todos: [{ id: 1, text: 'Buy milk', done: false }], nextId: 2 }
// `nextId` is the id the next new task gets. Ids are never reused.
//
// The three state functions never change the state they're given.
// They return a new state object instead.

// Return a new state with one more task at the end of the list.
// - The task is { id: state.nextId, text, done: false }, and `nextId` goes up by 1.
// - Remove spaces from both ends of `text` first.
// - If `text` is empty after that, return `state` unchanged.
export function addTodo(state, text) {
	// TODO
}

// Return a new state where the task with this id has `done` flipped.
// If no task has this id, return a state with the same contents.
export function toggleTodo(state, id) {
	// TODO
}

// Return a new state without the task that has this id.
// Do not change `nextId`. If no task has this id, return a state with the same contents.
export function deleteTodo(state, id) {
	// TODO
}

// Connect the to-do app in index.html to the state functions above.
// `root` is the <section id="todo-app"> element. Look inside it for:
//   #todo-form (a form), #todo-text (its text input), #todo-list (a <ul>), #todo-summary (a <p>)
//
// Keep the state in one variable and write one render function that draws the whole
// page from it. Every event handler changes the state, then calls render.
//
// Rendering rules:
// - Each task is an <li> in #todo-list, in state order. Add the class "done" to the <li>
//   when the task is done.
// - Inside the <li>: a <label> that holds a checkbox and the task text, then a
//   <button type="button"> with the text "Delete" and the attribute
//   aria-label="Delete <task text>". The checkbox is checked when the task is done.
// - #todo-summary says "No tasks yet." when the list is empty. Otherwise it says
//   "<done> of <total> done", for example "1 of 3 done".
// - Show task text as text. A task named "<b>hi</b>" appears with its angle brackets.
//
// Behavior:
// - Submitting the form (the Add button or the Enter key) adds a task with the text input's
//   value, then empties the input. It must not reload the page.
// - Checking or unchecking a checkbox toggles that task.
// - Clicking a Delete button deletes that task. Two tasks can have the same text,
//   so find the task by its id, not its text.
//
// `initialState` is the starting state. The default is an empty list.
export function setupTodoApp(root, initialState = { todos: [], nextId: 1 }) {
	// TODO
}
