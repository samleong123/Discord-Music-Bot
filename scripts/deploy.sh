#!/bin/bash
# Deploy script for production

set -e

echo "🚀 Deploying Discord Music Bot..."

# Build Docker image
echo "Building Docker image..."
docker-compose build --no-cache

# Pull latest base images
echo "Pulling latest images..."
docker-compose pull

# Start services
echo "Starting services..."
docker-compose up -d

# Run migrations
echo "Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
docker-compose ps

echo ""
echo "View logs:"
echo "  docker-compose logs -f app"
echo ""
echo "Stop services:"
echo "  docker-compose down"
