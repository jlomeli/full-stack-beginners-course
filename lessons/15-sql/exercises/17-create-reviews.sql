-- Challenge 17: Create a reviews table
-- Create a table named reviews with these columns:
--   id           integer primary key, generated always as identity
--   book_id      integer, required, references books (id)
--   customer_id  integer, required, references customers (id)
--   rating       integer, required, must be between 1 and 5 (use a CHECK constraint)
--   comment      text, optional
--
-- Write your SQL below this line. End each statement with a semicolon.

