import { createContext, useContext, useEffect, useState } from 'react';
import { matchPath } from './01-match-path.js';

// A small router built on the browser's history API. It has the same shape as the one in React Router,
// so the code you write in the rest of the lesson looks the same with either.
//
//   <Router routes={[{ path: '/', element: <Home /> }, { path: '/books/:id', element: <Book /> }]} />
//
// <Router routes notFound>
// - Reads the current path from window.location.pathname and renders the element of the FIRST route
//   whose path matches (use matchPath). If none match, render `notFound`. When no notFound is given,
//   render <p>Page not found.</p>.
// - Re-renders when the user presses the browser's back or forward button (the "popstate" event on window).
//   Remove the listener when the Router unmounts.
// - Gives everything inside the page access to navigate() and the route's params through RouterContext.
//
// navigate(to, { replace })
// - Changes the URL without reloading the page: window.history.pushState, or window.history.replaceState
//   when replace is true. Then re-renders the Router with the new path.
// - `to` can include a query string, like '/books/3?tab=notes'. Route matching uses only the path part.
//
// <Link to="/books/1">Kindred</Link>
// - Renders a real <a href="/books/1">, so it can be opened in a new tab and read by screen readers.
// - On a plain left click, stops the browser from loading the page and calls navigate(to) instead.
// - Leaves the click alone when another key is held (Ctrl, Cmd, Shift, Alt) or a different mouse
//   button was used, so "open in new tab" still works.
//
// useNavigate() returns the navigate function. useParams() returns the params of the matched route,
// like { id: '42' }, or {} when the route has none.
// Both throw an Error whose message is 'useNavigate must be used inside <Router>' (or 'useParams must ...')
// when they're called outside a <Router>.
const RouterContext = createContext(null);

export function Router({ routes, notFound }) {
	// TODO
}

export function Link({ to, children }) {
	// TODO
}

export function useNavigate() {
	// TODO
}

export function useParams() {
	// TODO
}
