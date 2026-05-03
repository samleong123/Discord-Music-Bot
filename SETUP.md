# Discord Music Bot - Setup Guide

## 📋 Prerequisites

- Node.js 22.12+ installed locally (for development)
- Docker & Docker Compose installed
- A Discord Server (for testing)
- Discord Developer Account

## 🔑 Step 1: Create Discord Bot & Get Credentials

### 1.1 Create Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Give it a name (e.g., "Music Bot")
4. Accept terms and click **"Create"**

### 1.2 Create Bot User

1. Go to **"Bot"** tab in the left sidebar
2. Click **"Add Bot"**
3. Under the bot name, you'll see a token. Click **"Copy"** to copy it
4. Save this as your `DISCORD_TOKEN`

### 1.3 Enable Gateway Intents

1. Still in the **"Bot"** tab
2. Scroll to **"Gateway Intents"**
3. Enable these intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### 1.4 Get Client ID

1. Go to **"General Information"** tab
2. Copy the **"Application ID"** and save as `DISCORD_CLIENT_ID`

### 1.5 Create Test Guild (Optional)

1. Create a new Discord server for testing
2. Get its ID: Enable Developer Mode in Discord settings, right-click server, copy ID
3. Save as `DISCORD_GUILD_ID_DEV` for instant command registration

## 🎯 Step 2: Add Bot to Your Server

### 2.1 Generate OAuth2 URL

1. Go to **"OAuth2"** tab
2. Click **"URL Generator"**
3. Select scopes: `bot`, `applications.commands`
4. Select permissions:
   - Read Messages/View Channels
   - Send Messages
   - Connect (to voice channels)
   - Speak

### 2.2 Invite Bot

1. Copy the generated URL at the bottom
2. Open it in your browser
3. Select your server and authorize

## 🚀 Step 3: Environment Setup

### 3.1 Copy Environment File

```bash
cp .env.example .env
```

### 3.2 Edit .env for Your Setup

**For Local Development (Node.js directly):**

```env
# Required
DISCORD_TOKEN=your_bot_token_from_step_1_2
DISCORD_CLIENT_ID=your_client_id_from_step_1_4
DISCORD_GUILD_ID_DEV=your_guild_id_from_step_1_5

# PostgreSQL (running locally on your machine)
DATABASE_URL=postgresql://musicbot:password@localhost:5432/musicbot_db
POSTGRES_USER=musicbot
POSTGRES_PASSWORD=password
POSTGRES_DB=musicbot_db

# Redis (running locally on your machine)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Web Server
PORT=3000
DASHBOARD_BASE_URL=http://localhost:3000
SESSION_SECRET=dev_secret_key_change_in_production

# Optional
OWNER_DISCORD_IDS=your_user_id
DEFAULT_VOLUME=0.5
MAX_PLAYLIST_ITEMS=100
IDLE_DISCONNECT_SECONDS=300

# Local Development
NODE_ENV=development
```

**For Docker Deployment:**

```env
# Required
DISCORD_TOKEN=your_bot_token_from_step_1_2
DISCORD_CLIENT_ID=your_client_id_from_step_1_4
DISCORD_GUILD_ID_DEV=your_guild_id_from_step_1_5

# PostgreSQL & Redis (Docker manages these internally)
# Keep these as is - Docker Compose uses internal networking
DATABASE_URL=postgresql://musicbot:musicbot_secure_password@postgres:5432/musicbot_db
REDIS_URL=redis://redis:6379

# Web Server
PORT=3000
DASHBOARD_BASE_URL=http://localhost:3000
SESSION_SECRET=your_session_secret_here_change_in_production

# Optional
OWNER_DISCORD_IDS=your_user_id
DEFAULT_VOLUME=0.5
MAX_PLAYLIST_ITEMS=100
IDLE_DISCONNECT_SECONDS=300

NODE_ENV=production
```

### 3.3 Access the Dashboard

**Local Machine:**
- http://localhost:3000
- http://127.0.0.1:3000

**From Other Devices on Network:**
- Get your local IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
- Use: `http://192.168.x.x:3000`

**Change Port:**
- Edit `.env`: `PORT=4000`
- Access: `http://localhost:4000`
- Update `DASHBOARD_BASE_URL=http://localhost:4000`

## 🐳 Step 4: Docker Deployment

### 4.1 Build and Start

**Windows PowerShell:**

```powershell
# Build Docker image
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f app
```

**Quick test on Windows:**
1. Install Docker Desktop and make sure it is running.
2. Open PowerShell in the project folder.
3. Run `docker compose up -d`.
4. Open `http://localhost:3000` in your browser.
5. Check `http://localhost:3000/api/health` if the dashboard does not load.

### 4.2 Access the Services

**Local Machine:**
```
Dashboard: http://localhost:3000
API:       http://localhost:3000/api
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

**From Another Device on Network:**

1. Find your local IP address:
   - **Windows**: `ipconfig` → Look for "IPv4 Address"
   - **Linux/Mac**: `ifconfig` or `hostname -I`
   - Example: `192.168.1.100`

2. Update `.env`:
   ```env
   DASHBOARD_BASE_URL=http://192.168.1.100:3000
   ```

3. Restart containers:
   ```bash
   docker-compose restart app
   ```

4. Access from other device:
   ```
   Dashboard: http://192.168.1.100:3000
   API:       http://192.168.1.100:3000/api
   ```

### 4.3 Use Different Port

To run on a different port (e.g., 8080):

1. Edit `.env`:
   ```env
   PORT=8080
   DASHBOARD_BASE_URL=http://localhost:8080
   ```

2. Edit `docker-compose.yml` - change the app service ports:
   ```yaml
   ports:
     - "8080:3000"
   ```

3. Restart:
   ```bash
   docker-compose up -d
   ```

4. Access at: `http://localhost:8080`

### 4.4 Verify All Services

```bash
# Check if all services are healthy
docker-compose ps

# Test health endpoint
curl http://localhost:3000/api/health

# Check PostgreSQL connection
docker exec musicbot-postgres psql -U musicbot -d musicbot_db -c "\dt"

# Check Redis connection
docker exec musicbot-redis redis-cli ping
```

## 💻 Step 5: Local Development

### 5.1 Install Dependencies

```bash
npm install
```

### 5.2 Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (requires PostgreSQL connection)
npm run prisma:migrate
```

### 5.3 Start Services

**Option A: Using Docker for DB only**

```powershell
# Start just PostgreSQL and Redis
docker compose up -d postgres redis

# In another terminal, start the bot
npm run dev
```

**Option B: Full local setup**

Ensure PostgreSQL and Redis are running locally, then:

```bash
npm run dev
```

## 🧪 Step 6: Test the Bot

### 6.1 Discord Commands

1. Go to your Discord server
2. Type `/ping` to test bot response
3. Type `/join` to make bot join your voice channel
4. Type `/play https://www.youtube.com/watch?v=...` to play a song

### 6.2 Web Dashboard

1. Open http://localhost:3000
2. You should see the dashboard
3. Add a track URL and test playback

## 🔧 Troubleshooting

### Bot doesn't respond to commands

**Solution:**
1. Verify bot token is correct
2. Check bot has "applications.commands" scope
3. Ensure slash commands are registered (check Discord dev portal)
4. Restart bot: `docker-compose restart app` or `Ctrl+C` and re-run

### Audio not playing

**Solutions:**
1. Verify FFmpeg is installed in Docker: `docker exec musicbot-app ffmpeg -version`
2. Check yt-dlp: `docker exec musicbot-app yt-dlp --version`
3. Ensure bot is connected to voice channel: Use `/join` command
4. Check logs: `docker compose logs app | Select-String -Pattern "error"`

### Database connection failed

**Solutions:**
1. Ensure PostgreSQL is running: `docker compose ps postgres`
2. Check connection string in `.env`
3. Verify database exists: `docker exec musicbot-postgres psql -U musicbot -d musicbot_db -c "\dt"`
4. Reset database: `docker compose down -v` (removes volumes)

### Port already in use

**Solution:**
```bash
# Change port in docker-compose.yml, then rebuild and restart:
docker compose down
docker compose up -d
```

## 📖 Documentation

- [discord.js Documentation](https://discord.js.org/)
- [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

For more help, check the main [README.md](README.md)
