// The query behind GET /api/members/:id/loans/open: the books a member still has out, oldest first.
// Do not change this file. The problem is in the database, not in the SQL text.
export const OPEN_LOANS_FOR_MEMBER_SQL = `
	SELECT l.id, l.book_id AS "bookId", b.title, l.borrowed_at AS "borrowedAt"
	FROM loans l
	JOIN books b ON b.id = l.book_id
	WHERE l.member_id = $1 AND l.returned_at IS NULL
	ORDER BY l.borrowed_at
`;
