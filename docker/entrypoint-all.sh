#!/bin/bash
set -e

# Run chown as root first before we do anything else
mkdir -p /var/lib/postgresql/data /run/postgresql
chown -R app:nodejs /var/lib/postgresql /var/lib/postgresql/data /run/postgresql
chmod 700 /var/lib/postgresql/data

echo "======================================"
echo "Starting Discord Music Bot (All-in-One)"
echo "======================================"

# Initialize PostgreSQL database if not already done
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
  echo "[1/4] Initializing PostgreSQL database..."
  su app -s /bin/bash -c "initdb -D /var/lib/postgresql/data \
    --username=musicbot \
    --pwfile=<(echo \"$POSTGRES_PASSWORD\") \
    --auth=trust"
fi

# Clean up any stale PID file just in case
rm -f /var/lib/postgresql/data/postmaster.pid

# Start PostgreSQL in background
echo "[2/4] Starting PostgreSQL..."
su app -s /bin/bash -c "postgres -D /var/lib/postgresql/data -k /run/postgresql" > /tmp/postgres.log 2>&1 &
PG_PID=$!

# Wait for PostgreSQL to be ready on template1 database
echo "Waiting for PostgreSQL to accept connections..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U musicbot -d template1 -c "\q" 2>/dev/null; do
  sleep 1
done
echo "OK PostgreSQL is ready"

# Create the database if it doesn't exist
if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U musicbot -lqt | cut -d \| -f 1 | grep -qw musicbot_db; then
  echo "Creating database musicbot_db..."
  PGPASSWORD=$POSTGRES_PASSWORD createdb -h localhost -U musicbot musicbot_db
fi

# Start Redis in background
echo "[3/4] Starting Redis..."
redis-server --port 6379 --daemonize yes --logfile /tmp/redis.log
sleep 1
echo "OK Redis is ready"

# Run Prisma migrations
echo "[4/4] Running Prisma migrations..."
cd /app
npx prisma migrate deploy

# Start Node.js app
echo ""
echo "======================================"
echo "Starting Discord Music Bot"
echo "======================================"
npm start
