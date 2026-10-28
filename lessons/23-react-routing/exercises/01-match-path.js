// Decide whether a URL path matches a route pattern, and pull the dynamic parts out of it.
//
// A pattern is a path whose segments are either fixed text or a parameter that starts with a colon.
// `:id` matches any one segment and captures it under the name "id".
//
// matchPath(pattern, pathname) returns an object of the captured parameters, or null when the path doesn't match.
//
//   matchPath('/books', '/books')                       → {}
//   matchPath('/books', '/authors')                     → null
//   matchPath('/books/:id', '/books/42')                → { id: '42' }
//   matchPath('/books/:id/edit', '/books/42/edit')      → { id: '42' }
//   matchPath('/books/:id', '/books/42/edit')           → null     (the whole path must match)
//
// - Compare whole segments. Every segment of the path must match, and the counts must be equal.
// - Ignore a trailing slash on either side: '/books/42/' matches '/books/:id'.
// - Captured values are strings. Decode them with decodeURIComponent: '/search/dune%20messiah' captures 'dune messiah'.
// - '/' matches only '/'.
export function matchPath(pattern, pathname) {
	// TODO
}
