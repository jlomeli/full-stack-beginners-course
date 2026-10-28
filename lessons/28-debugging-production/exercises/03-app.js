// The sample library API. It has three planted bugs: this file holds the third.
// createApp(db, { sendReceipt }) takes the database and a function that emails a receipt, so tests can swap both.
import express from 'express';
import { OPEN_LOANS_FOR_MEMBER_SQL } from './01-slow-query.js';
import { daysOverdue, dueDate } from './02-dates.js';
import { sendReturnReceipt } from './notify.js';

export function createApp(db, { sendReceipt = sendReturnReceipt } = {}) {
	const app = express();
	app.use(express.json());

	// GET /api/members/:id/loans/open -> 200 with the member's open loans, each with its dueDate.
	app.get('/api/members/:id/loans/open', async (req, res) => {
		const { rows } = await db.query(OPEN_LOANS_FOR_MEMBER_SQL, [Number(req.params.id)]);
		res.json(rows.map((loan) => ({ ...loan, dueDate: dueDate(loan.borrowedAt) })));
	});

	// POST /api/loans/:id/return -> marks the loan returned and tells the member by email.
	//   404 { error } when no open loan has that id.
	//   200 { id, returnedAt, daysOverdue } otherwise.
	// The response must not wait for the email, and a failed email must never take the server down.
	app.post('/api/loans/:id/return', async (req, res) => {
		const { rows } = await db.query(
			'UPDATE loans SET returned_at = now() WHERE id = $1 AND returned_at IS NULL RETURNING id, member_id, borrowed_at, returned_at',
			[Number(req.params.id)],
		);
		if (rows.length === 0) return res.status(404).json({ error: 'No open loan with that id' });
		const loan = rows[0];

		const { rows: members } = await db.query('SELECT id, name, email FROM members WHERE id = $1', [loan.member_id]);
		sendReceipt(members[0], loan);

		res.json({ id: loan.id, returnedAt: loan.returned_at, daysOverdue: daysOverdue(loan.borrowed_at, loan.returned_at) });
	});

	app.use((error, req, res, next) => {
		console.error(error);
		res.status(500).json({ error: 'Something went wrong' });
	});

	return app;
}
