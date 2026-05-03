FROM node:22-alpine AS builder

# Install basic build tools and python for yt-dlp
RUN apk add --no-cache python3 py3-pip build-base opus-dev pkgconf
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

WORKDIR /app

# Copy package manifests and workspace package
COPY package.json package-lock.json* yarn.lock* ./
COPY apps/bot-api/package.json ./apps/bot-api/

# Install all deps (dev + prod) so we can build (no lockfile present)
RUN npm install

# Copy source and build
COPY apps/bot-api/tsconfig.json ./apps/bot-api/tsconfig.json
COPY tsconfig.json ./tsconfig.json
COPY apps/bot-api/src ./apps/bot-api/src
COPY prisma ./prisma
RUN npm --workspace=bot-api run build


FROM node:22-alpine

# Runtime dependencies: FFmpeg, Python for yt-dlp, PostgreSQL client, Redis, curl, supervisor
RUN apk add --no-cache ffmpeg python3 py3-pip curl postgresql postgresql-client redis bash supervisor build-base openssl opus-dev pkgconf
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

# Create non-root user and data directories
RUN addgroup -g 1001 -S nodejs && adduser -S app -u 1001
RUN mkdir -p /var/lib/postgresql/data && chown app:nodejs /var/lib/postgresql/data
RUN mkdir -p /run/postgresql && chown app:nodejs /run/postgresql

WORKDIR /app

# Copy package manifests and install only production deps (no lockfile)
COPY package.json package-lock.json* yarn.lock* ./
COPY apps/bot-api/package.json ./apps/bot-api/
RUN npm install --omit=dev --no-audit --no-fund

# Copy built artifacts from builder
COPY --from=builder /app/apps/bot-api/dist ./apps/bot-api/dist

# Copy static web assets (HTML/CSS/JS — not compiled by tsc, must be copied explicitly)
COPY apps/bot-api/src/web/public ./apps/bot-api/src/web/public

COPY prisma ./prisma

# Copy entrypoint script
COPY docker/entrypoint-all.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["/entrypoint.sh"]
