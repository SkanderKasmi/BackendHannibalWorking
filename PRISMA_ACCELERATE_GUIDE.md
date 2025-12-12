# Prisma Accelerate Setup Guide

## Overview

This project now uses **Prisma Accelerate** for enhanced database performance through:
- ✅ **Connection Pooling** - Efficient database connection management
- ✅ **Global Caching** - Reduced database load and faster queries
- ✅ **Edge Deployment** - Low-latency database access from anywhere

## Configuration

### Schema Configuration

The `prisma/schema.prisma` has been updated with:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

- **`url`**: Prisma Accelerate connection (for queries)
- **`directUrl`**: Direct PostgreSQL connection (for migrations)

### Environment Variables

Two database URLs are required:

#### 1. DATABASE_URL (Prisma Accelerate)
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```
- Used for all database queries
- Provides connection pooling and caching
- Format: `prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY`

#### 2. DIRECT_DATABASE_URL (Direct Connection)
```env
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/database"
```
- Used for migrations and schema changes
- Direct connection to your PostgreSQL database
- Format: Standard PostgreSQL connection string

## Setup Steps

### 1. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

Update the following in `.env`:
- Replace `DATABASE_URL` with your Prisma Accelerate URL (already configured)
- Update `DIRECT_DATABASE_URL` with your actual PostgreSQL connection string

### 2. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client with Accelerate support.

### 3. Run Migrations

For migrations, Prisma will automatically use the `DIRECT_DATABASE_URL`:

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy
```

### 4. Test the Connection

```bash
# Open Prisma Studio
npx prisma studio
```

## Usage in Code

No code changes needed! Use Prisma Client as normal:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All queries automatically use Prisma Accelerate
const users = await prisma.user.findMany();
```

## Docker Configuration

### Development Mode

The `docker-compose.dev.yml` uses local PostgreSQL:

```yaml
environment:
  DATABASE_URL: "prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY"
  DIRECT_DATABASE_URL: "postgresql://user:password@postgres:5432/devsecops"
```

### Production Mode

Update `docker-compose.yml` with your Prisma Accelerate credentials:

```yaml
environment:
  DATABASE_URL: ${DATABASE_URL}
  DIRECT_DATABASE_URL: ${DIRECT_DATABASE_URL}
```

## Benefits

### 🚀 Performance
- **Connection Pooling**: Reuses database connections efficiently
- **Query Caching**: Frequently accessed data served from cache
- **Reduced Latency**: Edge network for global low-latency access

### 🔒 Security
- **API Key Authentication**: Secure access to your database
- **Encrypted Connections**: All traffic encrypted in transit
- **No Direct Exposure**: Database not directly exposed to the internet

### 📊 Scalability
- **Auto-scaling**: Handles traffic spikes automatically
- **Global Distribution**: Serve users from nearest edge location
- **Connection Limits**: No more "too many connections" errors

## Troubleshooting

### Migration Errors

If migrations fail, ensure `DIRECT_DATABASE_URL` is correct:

```bash
# Test direct connection
npx prisma db push --skip-generate
```

### Connection Issues

Check your Prisma Accelerate API key:

```bash
# Validate schema
npx prisma validate
```

### Cache Issues

To bypass cache for specific queries:

```typescript
// Disable caching for a specific query
const users = await prisma.user.findMany({
  cacheStrategy: { ttl: 0 }
});
```

## Important Notes

⚠️ **API Key Security**
- Never commit `.env` to version control
- Use environment variables in production
- Rotate API keys regularly

⚠️ **Migrations**
- Always use `DIRECT_DATABASE_URL` for migrations
- Test migrations in development first
- Backup database before production migrations

⚠️ **Caching**
- Be aware of cache TTL for time-sensitive data
- Use cache invalidation strategies when needed
- Monitor cache hit rates

## Resources

- [Prisma Accelerate Documentation](https://www.prisma.io/docs/accelerate)
- [Connection Pooling Guide](https://www.prisma.io/docs/accelerate/connection-pooling)
- [Caching Strategies](https://www.prisma.io/docs/accelerate/caching)

## Support

For issues related to:
- **Prisma Accelerate**: Check [Prisma Support](https://www.prisma.io/support)
- **Database Connection**: Verify `DIRECT_DATABASE_URL` settings
- **API Key**: Regenerate in Prisma Cloud Console
