# Docker Setup Guide

This project includes Docker configurations for both development and production environments.

## Files Created

### Dockerfiles
- `Dockerfile.api-gateway` - API Gateway service
- `Dockerfile.infrastructure-service` - Infrastructure service
- `Dockerfile.agents-service` - Agents service
- `Dockerfile.monitor-service` - Monitor service

### Docker Compose Files
- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration with hot-reloading

## Key Features

### Development Setup (`docker-compose.dev.yml`)
✅ **Volume Mounts** - Source code and `libs` folder are mounted for hot-reloading
✅ **Watch Mode** - Services run with `--watch` flag for automatic restarts
✅ **Network** - All services communicate via `devsecops-network`
✅ **Environment Variables** - Pre-configured for development

### Production Setup (`docker-compose.yml`)
✅ **Optimized Builds** - Only production dependencies installed
✅ **Prisma Generation** - Automatic Prisma client generation
✅ **Shared Libraries** - `libs` folder properly included in all builds

## Usage

### Development Mode (Recommended for development)
```bash
# Start all services with hot-reloading
docker-compose -f docker-compose.dev.yml up --build

# Start specific service
docker-compose -f docker-compose.dev.yml up api-gateway

# View logs
docker-compose -f docker-compose.dev.yml logs -f api-gateway

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

### Production Mode
```bash
# Start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# Stop all services
docker-compose down
```

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 5000 | Main API entry point |
| Infrastructure Service | 3002 | Infrastructure management |
| Agents Service | 3003 | Agent operations |
| Monitor Service | 3004 | Monitoring & metrics |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & sessions |
| Kafka | 9092 | Message broker |
| RabbitMQ | 5672, 15672 | Message queue & management UI |
| Zookeeper | 2181 | Kafka coordination |

## Important Notes

### Libs Folder
The `libs` folder is **automatically mounted** in development mode, so changes to shared libraries will trigger hot-reloading across all services.

### Database Migrations
Run Prisma migrations before starting:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npx prisma migrate dev
```

### Environment Variables
Update the environment variables in the docker-compose files as needed:
- `DATABASE_URL`
- `REDIS_HOST`
- `KAFKA_BROKERS`
- `RABBITMQ_URL`

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs [service-name]

# Rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache [service-name]
```

### Hot-reloading not working
Ensure volumes are properly mounted:
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### Database connection issues
```bash
# Check if PostgreSQL is ready
docker-compose -f docker-compose.dev.yml exec postgres pg_isready

# Access PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U user -d devsecops
```

## Clean Up

```bash
# Remove all containers, networks, and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove all images
docker-compose -f docker-compose.dev.yml down --rmi all
```
