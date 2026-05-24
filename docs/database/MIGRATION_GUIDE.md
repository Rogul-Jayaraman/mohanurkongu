# Migration Guide

## Prerequisites
- PostgreSQL 16 running
- `DATABASE_URL` set in environment or `.env`
- Prisma CLI installed (`npx prisma`)

## Common Commands

### Create a migration (dev)
```bash
cd backend/
npx prisma migrate dev --name describe_change
```
This creates a new migration file in `prisma/migrations/` and applies it.

### Apply pending migrations (production)
```bash
cd backend/
npx prisma migrate deploy
```

### Reset database
```bash
cd backend/
npx prisma migrate reset
```
WARNING: Drops all data, recreates from migrations, runs seed.

### Generate Prisma client
```bash
cd backend/
npx prisma generate
```
Required after schema changes, before running the app.

### Check migration status
```bash
cd backend/
npx prisma migrate status
```

### Create seed data
```bash
cd backend/
npx prisma db seed
```

## Migration Workflow

```
1. Edit prisma/schema.prisma
2. npx prisma migrate dev --name my_change
     → generates migration SQL
     → applies to local DB
     → regenerates Prisma client
3. Test application
4. Commit migration files + schema + generated client
5. On deployment: npx prisma migrate deploy
```

## Adding New Tables

1. Define model in `schema.prisma`
2. Run `npx prisma migrate dev --name add_<table_name>`
3. Generate client
4. Add repository/service layer code
5. Mount routes in `app.ts`

## Adding New Columns

1. Edit model in `schema.prisma`
2. For nullable columns without defaults: no special handling
3. For non-nullable columns: provide a `@default` value
4. Run `npx prisma migrate dev --name add_<column>_to_<table>`
5. Update service layer as needed

## Adding Indexes

1. Add `@@index([column])` or `@@unique([columns])` to model
2. Run migration
3. Generated migration will include `CREATE INDEX CONCURRENTLY` or `CREATE UNIQUE INDEX`

## Production Migration Guidelines

- Always backup the database before running `prisma migrate deploy`
- For large tables, add indexes with `CONCURRENTLY` manually
- Test migration on staging before production
- Never edit existing migration files (treat as immutable after commit)
- Use `prisma migrate resolve` if a migration was manually applied

## Rollback

Prisma does not support "down" migrations. To revert:
1. Create a new migration that reverses the schema changes
2. Apply via `prisma migrate deploy`

For data-only reverts, write a custom SQL script.

## Current Migration State

All migrations have been applied. The schema version matches the migration files in `prisma/migrations/`. No pending migrations.
