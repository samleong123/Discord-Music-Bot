# 🎵 Discord Music Bot

A fully featured **TypeScript Discord music bot** with slash commands, playlist support, temporary queues, playback controls, and a Bootstrap-powered web dashboard.

The bot uses **discord.js**, **yt-dlp**, **FFmpeg**, **Express**, **Socket.IO**, **PostgreSQL**, **Redis**, and **Docker** to provide a deployable music playback system for Discord servers.

> [!NOTE]
> This project is intended for educational and self-hosted use. Please make sure your use of third-party media sources follows the relevant platform terms, copyright rules, and local laws.

---

## ✨ Features

- **Modern Discord Slash Commands**  
  Control the bot using Discord slash commands such as `/play`, `/pause`, `/skip`, `/queue`, and more.

- **Music Playback with yt-dlp**  
  Supports YouTube URLs, search queries, playlists, and other sources supported by `yt-dlp`.

- **Temporary Queue System**  
  Queue tracks for the current session using Redis for fast access to queue and player state.

- **Playlist Support**  
  Add YouTube playlists directly into the queue.

- **Playback Controls for Voice Channel Users**  
  Users in voice channels can pause, resume, skip, stop, remove tracks, clear the queue, and set repeat mode.

- **Repeat Modes**  
  Supports repeat off, repeat current track, and repeat queue.

- **Web Dashboard**  
  Bootstrap 5.3 dashboard for viewing and managing the queue from a browser.

- **Real-Time Updates**  
  Socket.IO support for live queue and playback state updates.

- **Persistent Storage**  
  PostgreSQL stores settings, saved playlists, and future dashboard-related data.

- **Docker Deployment**  
  Docker Compose setup for the bot, API, database, and cache.

---

## 📸 Screenshots

Add your screenshots here after deploying or running the dashboard.

### Dashboard Home
<img width="2216" height="1183" alt="image" src="https://github.com/user-attachments/assets/4a223ee6-388f-4985-964f-028e2c2f358a" />

### Queue Management
<img width="1303" height="1118" alt="image" src="https://github.com/user-attachments/assets/a7fd3824-2b1b-4dd9-befd-f1120d108c00" />


### Discord Slash Commands
<img width="348" height="321" alt="image" src="https://github.com/user-attachments/assets/9c14b1ee-9859-4e1e-9cb6-a104d60c1bdb" />



### Playback Controls
<img width="930" height="378" alt="image" src="https://github.com/user-attachments/assets/76ef637a-c873-4c27-92ed-7be8895bdfd2" />




---

## 🧰 Tech Stack

| Area | Technology |
| --- | --- |
| Language | TypeScript |
| Discord Bot | discord.js |
| Audio Source Extraction | yt-dlp |
| Audio Processing | FFmpeg |
| Web Server | Express |
| Real-Time Communication | Socket.IO |
| Dashboard UI | HTML5, Bootstrap 5.3 |
| Database | PostgreSQL |
| Cache / Temporary Queue | Redis |
| ORM | Prisma |
| Deployment | Docker, Docker Compose |

---

## 📋 Prerequisites

For local development:

- Node.js `22.12+`
- npm
- PostgreSQL
- Redis
- FFmpeg
- yt-dlp

For Docker deployment:

- Docker
- Docker Compose
- Discord bot token

You also need a Discord application and bot account from the [Discord Developer Portal](https://discord.com/developers/applications).

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/discord-music-bot.git
cd discord-music-bot
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` with your own values:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID_DEV=your_dev_guild_id_here
OWNER_DISCORD_IDS=your_discord_user_id_here
PORT=3000
DASHBOARD_BASE_URL=http://localhost:3000
```

> [!IMPORTANT]
> Never commit your `.env` file or Discord bot token to a public repository.

For detailed setup instructions, see [`SETUP.md`](SETUP.md).

---

## 🐳 Run with Docker Compose

Start all services:

```bash
docker-compose up -d
```

This starts:

| Service | Default Address |
| --- | --- |
| Discord Bot + Web API | `http://localhost:3000` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

View logs:

```bash
docker-compose logs -f app
```

Restart services:

```bash
docker-compose restart
```

Rebuild containers:

```bash
docker-compose up --build
```

---

## 💻 Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

Start development server:

```bash
npm run dev
```

Optional TypeScript watch mode:

```bash
npx tsc --watch
```

---

## 🌐 Dashboard Access

### Local Access

| Page | URL |
| --- | --- |
| Dashboard | `http://localhost:3000` |
| API Base | `http://localhost:3000/api` |
| Health Check | `http://localhost:3000/api/health` |

### Access from Another Device on the Same Network

1. Find your local IP address:

```bash
ipconfig
```

On Linux or macOS:

```bash
ifconfig
```

2. Open the dashboard from another device:

```text
http://your-local-ip:3000
```

3. Update `.env` if needed:

```env
DASHBOARD_BASE_URL=http://your-local-ip:3000
```

4. Restart the app:

```bash
docker-compose restart app
```

---

## 📖 Discord Commands

### Music Playback

| Command | Description |
| --- | --- |
| `/play <url-or-search>` | Add a track, search result, or playlist to the queue |
| `/queue [page]` | Show the current queue |
| `/nowplaying` | Show the currently playing track |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/skip` | Skip to the next track |
| `/stop` | Stop playback and clear the queue |
| `/remove <position>` | Remove a track from the queue |
| `/clear` | Clear the entire queue |
| `/repeat <off/track/queue>` | Set repeat mode |

### Voice Connection

| Command | Description |
| --- | --- |
| `/join` | Join your current voice channel |
| `/leave` | Disconnect from the voice channel |
| `/ping` | Check bot latency |

---

## 🗄️ API Endpoints

Base URL:

```text
http://localhost:3000/api
```

### Queue Management

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/guilds/{guildId}/queue` | Get the current queue |
| `POST` | `/guilds/{guildId}/play` | Add a track or playlist |
| `POST` | `/guilds/{guildId}/pause` | Pause playback |
| `POST` | `/guilds/{guildId}/resume` | Resume playback |
| `POST` | `/guilds/{guildId}/skip` | Skip current track |
| `POST` | `/guilds/{guildId}/stop` | Stop playback |
| `DELETE` | `/guilds/{guildId}/queue/{trackIndex}` | Remove a track by index |
| `DELETE` | `/guilds/{guildId}/queue` | Clear the queue |
| `POST` | `/guilds/{guildId}/repeat` | Set repeat mode |

Example request body for adding a track:

```json
{
  "url": "https://www.youtube.com/watch?v=example"
}
```

Example request body for repeat mode:

```json
{
  "mode": "off"
}
```

Supported repeat modes:

```text
off | track | queue
```

---

## 📦 Project Structure

```text
discord-music-bot/
├── apps/bot-api/
│   └── src/
│       ├── bot/
│       │   ├── commands/
│       │   ├── command.manager.ts
│       │   └── discord.bot.ts
│       ├── audio/
│       │   ├── ytdlp.service.ts
│       │   ├── ffmpeg.service.ts
│       │   └── player.service.ts
│       ├── queue/
│       ├── web/
│       ├── config/
│       └── main.ts
├── prisma/
├── docker/
├── docs/
│   └── screenshots/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔒 Security Notes

- Do not commit `.env` files, tokens, API keys, or database passwords.
- Use Discord slash commands instead of unsafe prefix command parsing.
- Validate all dashboard and API inputs.
- Keep `yt-dlp`, FFmpeg, Node.js, and dependencies updated.
- Restrict dashboard access when exposing it outside a trusted network.
- Use HTTPS and authentication before deploying the dashboard publicly.
- Review CORS settings before production use.
- Run Docker containers with least-privilege configuration where possible.

---

## 🐛 Troubleshooting

### Bot Is Not Responding

1. Check that `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` are correct.
2. Make sure the bot was invited with the correct scopes:
   - `bot`
   - `applications.commands`
3. Make sure the bot has permission to view channels, send messages, and join voice channels.
4. Restart the app after updating `.env`.

### Slash Commands Are Not Showing

1. Confirm that the bot registered commands successfully in the logs.
2. For development, check that `DISCORD_GUILD_ID_DEV` is correct.
3. Reinvite the bot if command permissions were changed.

### Audio Is Not Playing

1. Check FFmpeg:

```bash
ffmpeg -version
```

2. Check yt-dlp:

```bash
yt-dlp --version
```

3. Make sure the bot is connected to a voice channel.
4. Make sure the bot has permission to speak in the voice channel.
5. Check app logs for extraction or playback errors.

### Docker Issues

View logs:

```bash
docker-compose logs -f app
```

Restart services:

```bash
docker-compose restart
```

Rebuild services:

```bash
docker-compose up --build
```

---

## 🤝 Contributing

Contributions are welcome.

Before submitting a pull request:

1. Fork the repository.
2. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Test your changes locally.
5. Commit with a clear message.
6. Open a pull request with a short explanation of what changed.

Please keep code readable, typed, and consistent with the existing TypeScript structure.

---

## 🧾 Issues and Support

If you encounter any problem, please create a GitHub issue.

When opening an issue, include:

- A clear title
- Steps to reproduce the problem
- Expected behavior
- Actual behavior
- Error logs or screenshots, if available
- Your environment details:
  - OS
  - Node.js version
  - Docker version
  - Bot deployment method

Example issue title:

```text
Bug: Bot joins voice channel but does not play audio
```

---


## 🙏 Acknowledgements

Built with:

- [discord.js](https://discord.js.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg](https://ffmpeg.org/)
- [Bootstrap](https://getbootstrap.com/)
- [Socket.IO](https://socket.io/)
- [Prisma](https://www.prisma.io/)

---

Made with ❤️ for self-hosted Discord music playback.
