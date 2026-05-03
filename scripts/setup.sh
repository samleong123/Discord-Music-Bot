#!/bin/bash
# Quick start script for development

set -e

echo "🎵 Discord Music Bot - Development Setup"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js 22.12+ required (you have Node $NODE_VERSION)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check for Docker (optional, but recommended)
if command -v docker &> /dev/null; then
    echo "✅ Docker detected"
else
    echo "⚠️  Docker not found - you'll need to set up PostgreSQL and Redis manually"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔑 Environment Configuration"
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Discord credentials"
else
    echo "✅ .env already exists"
fi

echo ""
echo "🐳 Starting Docker services (PostgreSQL, Redis)..."
docker-compose up postgres redis -d 2>/dev/null || echo "⚠️  Docker services not available"

echo ""
echo "🔧 Setting up Prisma..."
npm run prisma:generate

# Check if database is accessible
echo ""
echo "Waiting for database to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if npm run prisma:migrate 2>/dev/null; then
        echo "✅ Database ready"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "⚠️  Could not connect to database. Continuing anyway..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Start development with:"
echo "   npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - Setup: https://github.com/your-repo/SETUP.md"
echo "   - Commands: https://github.com/your-repo/README.md"
