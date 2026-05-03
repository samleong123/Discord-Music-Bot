#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U musicbot -d musicbot_db -c "\q" 2>/dev/null; do
  sleep 1
done

echo "PostgreSQL is ready!"

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting bot..."
exec "$@"
