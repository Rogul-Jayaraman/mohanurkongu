# Rollback Guide

## Application Rollback

### Docker Rollback
```bash
# Revert to previous image tag
docker-compose -f docker-compose.prod.yml down
# Edit docker-compose.prod.yml to use previous image tag
docker-compose -f docker-compose.prod.yml up -d
```

### Database Migration Rollback

Prisma does NOT support "down" migrations. The rollback strategy is:

1. **Create a new migration** that reverses the schema changes
2. **Apply it** via `prisma migrate deploy`

Example: If migration `add_user_preferences` added a column:
```bash
cd backend
# Edit schema.prisma → remove the column
npx prisma migrate dev --name revert_add_user_preferences
npx prisma migrate deploy  # on production
```

### Data-Only Revert
Write a custom SQL script to restore data and execute directly on the database.

## Quick Rollback (for critical bugs)

```bash
# 1. Stop current version
docker-compose -f docker-compose.prod.yml down

# 2. Restart with previous (if using tags)
docker-compose -f docker-compose.prod.yml up -d

# OR redeploy from git
git checkout <last-known-good-commit>
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify health
curl http://localhost:4000/api/health
```
