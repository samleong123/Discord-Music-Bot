# 🎵 Discord Music Bot

A fully-featured TypeScript Discord music bot with a web dashboard, built with discord.js, yt-dlp, FFmpeg, and Docker.

## ✨ Features

- **Slash Commands**: Modern Discord command interface
- **Music Playback**: Play YouTube videos, search results, and playlists
- **Queue Management**: Add, remove, reorder tracks in the queue
- **Playback Control**: Pause, resume, skip, stop with easy-to-use commands
- **Repeat Modes**: Off, track repeat, or queue repeat
- **Web Dashboard**: Bootstrap 5.3 web interface for queue management
- **Real-time Updates**: Socket.IO for live queue updates
- **Persistent Storage**: PostgreSQL for settings and saved playlists
- **Temporary Queue**: Redis for fast queue and player state
- **Fully Dockerized**: Easy deployment with Docker Compose

## 📋 Prerequisites

- Node.js 22.12+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))
- FFmpeg (installed in Docker automatically)
- yt-dlp (installed in Docker automatically)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd /path/to/discord-music-bot
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your values:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID_DEV=your_dev_guild_id_here
OWNER_DISCORD_IDS=your_discord_id
PORT=3000
DASHBOARD_BASE_URL=http://localhost:3000
```

See [SETUP.md](SETUP.md) for detailed configuration instructions.

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL**: Database on `localhost:5432`
- **Redis**: Cache on `localhost:6379`
- **Discord Bot + Web API**: Dashboard on `http://localhost:3000`

### 4. Access Dashboard

**Local Access:**
- Dashboard: http://localhost:3000
- API: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health

**Remote Access (from another device):**
- Get your IP: `ipconfig` (Windows) or `ifconfig` (Linux)
- Access: `http://your_local_ip:3000`
- Update `.env`: `DASHBOARD_BASE_URL=http://your_local_ip:3000`
- Restart: `docker-compose restart app`

## 🛠️ Local Development

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Start Development

```bash
# Terminal 1: Start the bot and API
npm run dev

# Terminal 2 (optional): Watch TypeScript
npx tsc --watch
```

## 📖 Commands

### Music Playback

| Command | Description |
|---------|-------------|
| `/play <url-or-search>` | Add a track or playlist to queue |
| `/queue [page]` | Show current queue |
| `/nowplaying` | Show current track |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/skip` | Skip to next track |
| `/stop` | Stop and clear queue |
| `/remove <position>` | Remove track at position |
| `/clear` | Clear entire queue |
| `/repeat <off/track/queue>` | Set repeat mode |

### Connection

| Command | Description |
|---------|-------------|
| `/join` | Join your voice channel |
| `/leave` | Disconnect from voice channel |
| `/ping` | Check bot latency |

## 🗄️ API Endpoints

Base URL: `http://localhost:3000/api`

### Queue Management

```bash
# Get queue
GET /guilds/{guildId}/queue

# Add track
POST /guilds/{guildId}/play
Body: { "url": "..." }

# Playback control
POST /guilds/{guildId}/pause
POST /guilds/{guildId}/resume
POST /guilds/{guildId}/skip
POST /guilds/{guildId}/stop

# Queue operations
DELETE /guilds/{guildId}/queue/{trackIndex}
DELETE /guilds/{guildId}/queue

# Repeat mode
POST /guilds/{guildId}/repeat
Body: { "mode": "off|track|queue" }
```

## 📦 Project Structure

```
discord-music-bot/
├── apps/bot-api/
│   └── src/
│       ├── bot/              # Discord bot
│       │   ├── commands/      # Slash commands
│       │   ├── command.manager.ts
│       │   └── discord.bot.ts
│       ├── audio/            # Audio pipeline
│       │   ├── ytdlp.service.ts
│       │   ├── ffmpeg.service.ts
│       │   └── player.service.ts
│       ├── queue/            # Queue management
│       ├── web/              # Express API & Dashboard
│       ├── config/           # Configuration
│       └── main.ts
├── prisma/                   # Database schema
├── docker/                   # Docker files
├── docker-compose.yml        # Service orchestration
└── .env.example              # Environment template
```

## 🔒 Security

- Secure slash commands only (no prefix commands)
- Input validation on all API endpoints
- Helmet for HTTP headers
- CORS configured
- No secrets in code
- Non-root user in Docker

## 📝 Roadmap

- [ ] Socket.IO realtime dashboard updates
- [ ] Saved playlists (PostgreSQL integration)
- [ ] Audit logs
- [ ] Vote skip feature
- [ ] DJ role mode
- [ ] Dashboard authentication
- [ ] Support for multiple sources (SoundCloud, etc.)
- [ ] Seek functionality
- [ ] Settings management

## 🐛 Troubleshooting

### Bot not responding
1. Check `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` in `.env`
2. Ensure bot has "applications.commands" and "bot" scopes
3. Add bot to server with `applications.commands` and `guild.join_voice` permissions

### Audio not playing
1. Check FFmpeg is installed: `ffmpeg -version`
2. Check yt-dlp is installed: `yt-dlp --version`
3. Verify bot is connected to voice channel with `/join`

### Docker issues
```bash
# View logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Rebuild
docker-compose up --build
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please ensure code follows TypeScript strict mode and includes proper error handling.

---

Built with ❤️ using discord.js, FFmpeg, and yt-dlp
