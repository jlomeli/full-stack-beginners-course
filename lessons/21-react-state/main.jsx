// Connects the page to your components. You do not need to change this file.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TodoApp } from './exercises/03-todo-app.jsx';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<TodoApp
			initialTodos={[
				{ id: 1, text: 'Read the lesson', done: true },
				{ id: 2, text: 'Build the to-do app', done: false },
			]}
		/>
	</StrictMode>,
);
