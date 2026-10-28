-- Sample data at a size where a missing index hurts: 500 books, 200 members, 20,000 loans. Do not edit it.
INSERT INTO books (title, author, year)
SELECT 'Book ' || n, 'Author ' || (n % 50), 1950 + (n % 70) FROM generate_series(1, 500) AS n;

INSERT INTO members (name, email)
SELECT 'Member ' || n, 'member' || n || '@example.com' FROM generate_series(1, 200) AS n;

-- 100 loans per member. Every tenth one is still out (returned_at is NULL), so each member has 10 open loans.
INSERT INTO loans (book_id, member_id, borrowed_at, returned_at)
SELECT 1 + (n * 7) % 500,
       1 + (n % 200),
       timestamptz '2026-01-01 12:00:00+00' + (n || ' minutes')::interval,
       CASE WHEN (n / 200) % 10 = 0 THEN NULL ELSE timestamptz '2026-02-01 12:00:00+00' + (n || ' minutes')::interval END
FROM generate_series(1, 20000) AS n;
