import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './exercises/04-library-app.jsx';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
