#!/bin/bash

# Prisma migration initialization script
# Run this after setting up environment variables

set -e

echo "🗄️  Initializing database schema..."

# Generate Prisma Client
npx prisma generate

# Create initial migration
echo "Creating initial migration..."
npx prisma migrate dev --name init

# Seed database (optional)
# npx prisma db seed

echo "✅ Database initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Check the database: npx prisma studio"
echo "2. Start the bot: npm run dev"
