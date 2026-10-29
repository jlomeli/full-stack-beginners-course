// Exhaustive model of concurrent borrowBook and returnBook requests for ONE book, under PostgreSQL READ COMMITTED.
// Each SQL statement is one atomic step, because Postgres runs each statement against its own snapshot.
// Every interleaving of every request is explored (breadth-first), so a violation comes with its shortest trace.
//
// Shape of borrowBook it models (lessons/17-node-and-postgres/project/library.js):
//   lock    SELECT id FROM books WHERE id = $1 FOR UPDATE      (skipped when config.lock is false)
//   check   SELECT 1 FROM loans WHERE book_id = $1 AND returned_at IS NULL   -> BOOK_UNAVAILABLE if a row
//   insert  INSERT INTO loans ...                               (the partial unique index may block or reject it)
//   commit  end of withTransaction                              (when config.tx is false, insert commits at once)
// returnBook is one autocommit UPDATE ... WHERE id = $1 AND returned_at IS NULL, which sees only committed loans.
// The member lookup is left out: it reads members only and cannot change what happens to the book.

export function check({ tx, lock, index, borrowers = 3, returns = 2 }) {
	const initial = { pcs: Array(borrowers).fill('lock'), results: Array(borrowers).fill(null), pending: Array(borrowers).fill(false), holder: -1, open: 0, returned: 0 };
	const key = (s) => JSON.stringify(s);
	const name = (i) => String.fromCharCode(65 + i);

	function steps(s) {
		const out = [];
		s.pcs.forEach((pc, i) => {
			const next = structuredClone(s);
			const finish = (result) => {
				next.pcs[i] = 'done';
				next.results[i] = result;
				next.pending[i] = false;
				if (next.holder === i) next.holder = -1;
			};
			if (pc === 'lock') {
				if (!lock || !tx) {
					next.pcs[i] = 'check';
					out.push([`${name(i)}: ${lock ? 'SELECT ... FOR UPDATE outside a transaction (lock released at once)' : 'no row lock'}`, next]);
				} else if (s.holder === -1) {
					next.holder = i;
					next.pcs[i] = 'check';
					out.push([`${name(i)}: SELECT ... FOR UPDATE locks the book`, next]);
				}
			} else if (pc === 'check') {
				if (s.open > 0) {
					finish('BOOK_UNAVAILABLE');
					out.push([`${name(i)}: sees an open loan, throws BOOK_UNAVAILABLE (409)`, next]);
				} else {
					next.pcs[i] = 'insert';
					out.push([`${name(i)}: sees no open loan`, next]);
				}
			} else if (pc === 'insert') {
				const otherPending = s.pending.some((p, j) => p && j !== i);
				if (index && otherPending) return; // Postgres makes the insert wait for the other transaction's uncommitted row.
				if (index && s.open > 0) {
					finish('UNIQUE_VIOLATION');
					out.push([`${name(i)}: INSERT hits one_open_loan_per_book, error 23505 escapes borrowBook (500)`, next]);
				} else if (!tx) {
					next.open++;
					finish('OK');
					out.push([`${name(i)}: INSERT commits at once (no transaction)`, next]);
				} else {
					next.pending[i] = true;
					next.pcs[i] = 'commit';
					out.push([`${name(i)}: INSERT INTO loans (uncommitted)`, next]);
				}
			} else if (pc === 'commit') {
				next.open++;
				finish('OK');
				out.push([`${name(i)}: COMMIT, loan created (201)`, next]);
			}
		});
		if (s.returned < returns && s.open > 0) {
			const next = structuredClone(s);
			next.open--;
			next.returned++;
			out.push(['returnBook: UPDATE loans SET returned_at = now() on an open loan', next]);
		}
		return out;
	}

	const properties = [
		['OneOpenLoanPerBook', 'A book never has two open loans at once.', (s) => s.open <= 1],
		['NoRawUniqueViolation', 'No borrow fails with an untranslated unique-index error (a 500 instead of a 409).', (s) => !s.results.includes('UNIQUE_VIOLATION')],
		['NoStuckRequest', 'Every request can always finish: no state where a borrow is unfinished and nothing can move.', (s, next) => next.length > 0 || s.pcs.every((pc) => pc === 'done')],
	];

	const parent = new Map([[key(initial), null]]);
	const queue = [initial];
	let states = 0;
	while (queue.length) {
		const s = queue.shift();
		states++;
		const next = steps(s);
		for (const [id, statement, holds] of properties) {
			if (!holds(s, next)) {
				const trace = [];
				for (let k = key(s); parent.get(k); k = parent.get(k).from) trace.unshift(parent.get(k).label);
				return { ok: false, states, property: id, statement, trace };
			}
		}
		for (const [label, n] of next) {
			const k = key(n);
			if (!parent.has(k)) {
				parent.set(k, { from: key(s), label });
				queue.push(n);
			}
		}
	}
	return { ok: true, states };
}
