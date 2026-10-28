// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Router, useNavigate, useParams } from './02-router.jsx';

beforeEach(() => {
	window.history.replaceState(null, '', '/');
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function Home() {
	return (
		<>
			<h1>Home</h1>
			<Link to="/books/7">Open book 7</Link>
		</>
	);
}

function Book() {
	const { id } = useParams();
	return <h1>Book {id}</h1>;
}

function JumpButton({ to, replace }) {
	const navigate = useNavigate();
	return <button onClick={() => navigate(to, { replace })}>Jump</button>;
}

const routes = [
	{ path: '/', element: <Home /> },
	{ path: '/books/:id', element: <Book /> },
	{ path: '/jump', element: <JumpButton to="/books/3" /> },
	{ path: '/jump-replace', element: <JumpButton to="/books/3" replace /> },
	{ path: '/jump-query', element: <JumpButton to="/books/3?tab=notes" /> },
];

// Clicks a link and reports whether the router had already stopped the browser from loading the page.
// The listener on document also stops jsdom from trying to load a new page.
function clickLink(link, init) {
	let routerStoppedTheBrowser;
	document.addEventListener(
		'click',
		(event) => {
			routerStoppedTheBrowser = event.defaultPrevented;
			event.preventDefault();
		},
		{ once: true },
	);
	fireEvent.click(link, init);
	return routerStoppedTheBrowser;
}

describe('Router', () => {
	test('renders the route that matches the current URL', () => {
		render(<Router routes={routes} />);
		expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy();
	});

	test('renders the route for a URL that is already something other than the root', () => {
		window.history.replaceState(null, '', '/books/12');
		render(<Router routes={routes} />);
		expect(screen.getByRole('heading', { name: 'Book 12' })).toBeTruthy();
	});

	test('renders the first matching route when more than one matches', () => {
		window.history.replaceState(null, '', '/books/new');
		const overlapping = [
			{ path: '/books/:id', element: <p>Dynamic route</p> },
			{ path: '/books/new', element: <p>Fixed route</p> },
		];
		render(<Router routes={overlapping} />);
		expect(screen.getByText('Dynamic route')).toBeTruthy();
		expect(screen.queryByText('Fixed route')).toBeNull();
	});

	test('renders "Page not found." when no route matches and no notFound is given', () => {
		window.history.replaceState(null, '', '/nowhere');
		render(<Router routes={routes} />);
		expect(screen.getByText('Page not found.')).toBeTruthy();
	});

	test('renders the notFound element when no route matches', () => {
		window.history.replaceState(null, '', '/nowhere');
		render(<Router routes={routes} notFound={<p>Nothing here</p>} />);
		expect(screen.getByText('Nothing here')).toBeTruthy();
		expect(screen.queryByText('Page not found.')).toBeNull();
	});

	test('shows the new page when the browser goes back', async () => {
		render(<Router routes={routes} />);
		clickLink(screen.getByRole('link', { name: 'Open book 7' }));
		expect(await screen.findByRole('heading', { name: 'Book 7' })).toBeTruthy();

		window.history.back();

		expect(await screen.findByRole('heading', { name: 'Home' })).toBeTruthy();
	});
});

describe('Link', () => {
	test('renders an anchor whose href is the destination', () => {
		render(<Router routes={routes} />);
		expect(screen.getByRole('link', { name: 'Open book 7' }).getAttribute('href')).toBe('/books/7');
	});

	test('a plain click stops the browser from loading the page', () => {
		render(<Router routes={routes} />);
		const stopped = clickLink(screen.getByRole('link', { name: 'Open book 7' }));
		expect(stopped).toBe(true);
	});

	test('a plain click changes the URL and shows the destination page', async () => {
		render(<Router routes={routes} />);
		clickLink(screen.getByRole('link', { name: 'Open book 7' }));
		expect(await screen.findByRole('heading', { name: 'Book 7' })).toBeTruthy();
		expect(window.location.pathname).toBe('/books/7');
	});

	test.each([
		['Ctrl', { ctrlKey: true }],
		['Cmd', { metaKey: true }],
		['Shift', { shiftKey: true }],
		['Alt', { altKey: true }],
		['the middle mouse button', { button: 1 }],
	])('leaves the click to the browser when it is made with %s', (name, init) => {
		render(<Router routes={routes} />);
		const stopped = clickLink(screen.getByRole('link', { name: 'Open book 7' }), init);
		expect(stopped).toBe(false);
		expect(window.location.pathname).toBe('/');
		expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy();
	});
});

describe('useNavigate', () => {
	test('changes the URL and shows the destination page', async () => {
		window.history.replaceState(null, '', '/jump');
		const user = userEvent.setup();
		render(<Router routes={routes} />);

		await user.click(screen.getByRole('button', { name: 'Jump' }));

		expect(await screen.findByRole('heading', { name: 'Book 3' })).toBeTruthy();
		expect(window.location.pathname).toBe('/books/3');
	});

	test('adds an entry to the browser history', async () => {
		window.history.replaceState(null, '', '/jump');
		const entriesBefore = window.history.length;
		const user = userEvent.setup();
		render(<Router routes={routes} />);

		await user.click(screen.getByRole('button', { name: 'Jump' }));

		expect(window.history.length).toBe(entriesBefore + 1);
	});

	test('replaces the current history entry when replace is true', async () => {
		window.history.replaceState(null, '', '/jump-replace');
		const entriesBefore = window.history.length;
		const user = userEvent.setup();
		render(<Router routes={routes} />);

		await user.click(screen.getByRole('button', { name: 'Jump' }));

		expect(await screen.findByRole('heading', { name: 'Book 3' })).toBeTruthy();
		expect(window.location.pathname).toBe('/books/3');
		expect(window.history.length).toBe(entriesBefore);
	});

	test('matches routes on the path only when the destination has a query string', async () => {
		window.history.replaceState(null, '', '/jump-query');
		const user = userEvent.setup();
		render(<Router routes={routes} />);

		await user.click(screen.getByRole('button', { name: 'Jump' }));

		expect(await screen.findByRole('heading', { name: 'Book 3' })).toBeTruthy();
		expect(window.location.search).toBe('?tab=notes');
	});

	test('throws a helpful error outside a Router', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(<JumpButton to="/" />)).toThrow('useNavigate must be used inside <Router>');
	});
});

describe('useParams', () => {
	test('returns an empty object on a route without parameters', () => {
		function Probe() {
			return <p>params: {JSON.stringify(useParams())}</p>;
		}
		render(<Router routes={[{ path: '/', element: <Probe /> }]} />);
		expect(screen.getByText('params: {}')).toBeTruthy();
	});

	test('returns the parameters of the matched route', () => {
		function Probe() {
			return <p>params: {JSON.stringify(useParams())}</p>;
		}
		window.history.replaceState(null, '', '/authors/3/books/9');
		render(<Router routes={[{ path: '/authors/:authorId/books/:bookId', element: <Probe /> }]} />);
		expect(screen.getByText('params: {"authorId":"3","bookId":"9"}')).toBeTruthy();
	});

	test('throws a helpful error outside a Router', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(<Book />)).toThrow('useParams must be used inside <Router>');
	});
});
