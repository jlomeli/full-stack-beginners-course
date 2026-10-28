-- Bug 1: the open-loans page got slow as the loans table grew.
-- Find out why with EXPLAIN (see the lesson), then write the fix here as one or more CREATE INDEX statements.
-- The tests load schema.sql and seed.sql, run this file, then EXPLAIN the query in 01-slow-query.js.
-- Postgres creates an index for PRIMARY KEY and UNIQUE on its own. It does not create one for a plain REFERENCES column.

