---
name: postgresql
description: PostgreSQL database design, queries, performance tuning, and administration.
globs: ["**/*.sql", "**/prisma/**", "**/drizzle/**", "**/migrations/**"]
priority: 85
tags: ["database"]
---

# PostgreSQL Best Practices

## Schema Design
- Use UUIDs or BIGSERIAL for primary keys
- Always add `created_at` and `updated_at` timestamps
- Use `JSONB` for flexible data, not `JSON`
- Use enums for fixed sets of values
- Add NOT NULL constraints by default
- Use foreign keys with proper ON DELETE behavior

## Indexing
- Index columns used in WHERE, JOIN, ORDER BY
- Use partial indexes for filtered queries
- Use composite indexes (leftmost prefix rule)
- Use GIN indexes for JSONB and full-text search
- Use BRIN indexes for time-series data
- Monitor with `pg_stat_user_indexes`

## Queries
- Use CTEs for readability (WITH clauses)
- Use window functions over self-joins
- Use EXPLAIN ANALYZE to profile queries
- Use prepared statements to prevent SQL injection
- Use RETURNING clause for INSERT/UPDATE/DELETE
- Paginate with keyset pagination, not OFFSET

## Performance
- Use connection pooling (PgBouncer)
- Vacuum and analyze regularly
- Use COPY for bulk inserts
- Partition large tables
- Monitor slow queries with `pg_stat_statements`
