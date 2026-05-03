# 🌐 Access Guide - Discord Music Bot

## Quick Access

### Local Machine (localhost)
```
Dashboard:  http://localhost:3000
API:        http://localhost:3000/api
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

---

## Network Access (from other devices)

### Find Your Local IP

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your network adapter.  
Example output: `192.168.1.100`

**Linux/Mac:**
```bash
ifconfig
# or
hostname -I
```

### Configure for Network Access

1. **Get your local IP** (e.g., `192.168.1.100`)

2. **Edit `.env`:**
   ```env
   DASHBOARD_BASE_URL=http://192.168.1.100:3000
   ```

3. **Restart the bot:**
   ```bash
   docker-compose restart app
   ```

4. **Access from other device:**
   ```
   http://192.168.1.100:3000
   ```

### If Behind Router/NAT

For access outside your local network, you'll need:
1. Port forwarding on your router (forward port 3000 to your machine)
2. Your public IP address
3. Update `DASHBOARD_BASE_URL=http://your_public_ip:3000`

---

## Custom Port Configuration

### Change to Port 8080

1. **Edit `.env`:**
   ```env
   PORT=8080
   DASHBOARD_BASE_URL=http://localhost:8080
   ```

2. **Edit `docker-compose.yml` (app service):**
   ```yaml
   ports:
     - "8080:3000"  # Changed from 3000:3000
   ```

3. **Restart:**
   ```bash
   docker-compose up -d
   ```

4. **Access:**
   - Local: http://localhost:8080
   - Network: http://192.168.x.x:8080

### Multiple Instances on Different Ports

Running bot on port 3000 AND 3001:

```yaml
# docker-compose.yml
services:
  app-1:
    build: .
    ports:
      - "3000:3000"
    environment:
      PORT: "3000"
      DASHBOARD_BASE_URL: "http://localhost:3000"

  app-2:
    build: .
    ports:
      - "3001:3000"
    environment:
      PORT: "3000"  # Internal port still 3000
      DASHBOARD_BASE_URL: "http://localhost:3001"
```

---

## Service Port Reference

| Service | Port | Connection String |
|---------|------|-------------------|
| Dashboard | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | postgresql://localhost:5432/musicbot_db |
| Redis | 6379 | redis://localhost:6379 |

---

## Troubleshooting Access Issues

### Can't connect on localhost:3000

1. **Check if bot is running:**
   ```bash
   docker-compose ps
   ```
   All services should show "Up"

2. **Check logs:**
   ```bash
   docker-compose logs app
   ```

3. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Verify port is not in use:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

### Can't access from other device on network

1. **Verify bot is accessible locally first:**
   ```bash
   http://localhost:3000
   ```

2. **Get correct local IP:**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

3. **Update DASHBOARD_BASE_URL:**
   ```bash
   # In .env
   DASHBOARD_BASE_URL=http://192.168.1.YOUR_IP:3000
   ```

4. **Restart bot:**
   ```bash
   docker-compose restart app
   ```

5. **Try from other device:**
   ```
   http://192.168.1.YOUR_IP:3000
   ```

### Firewall blocking access

- **Windows Firewall**: Allow Docker Desktop in firewall settings
- **Linux**: Check with `sudo ufw status` and allow port: `sudo ufw allow 3000`
- **Mac**: System Preferences → Security & Privacy → Firewall

---

## Production Access

### Via Caddy Reverse Proxy (HTTPS)

1. **Edit `docker/Caddyfile`:**
   ```
   musicbot.yourdomain.com {
       reverse_proxy app:3000
   }
   ```

2. **Uncomment Caddy in `docker-compose.yml`**

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access securely:**
   ```
   https://musicbot.yourdomain.com
   ```

---

## API Endpoints

All endpoints are accessible at your dashboard URL + `/api`

### Examples

**Local:**
```
GET http://localhost:3000/api/guilds/{guildId}/queue
POST http://localhost:3000/api/guilds/{guildId}/play
```

**Network:**
```
GET http://192.168.1.100:3000/api/guilds/{guildId}/queue
POST http://192.168.1.100:3000/api/guilds/{guildId}/play
```

**Production:**
```
GET https://musicbot.yourdomain.com/api/guilds/{guildId}/queue
POST https://musicbot.yourdomain.com/api/guilds/{guildId}/play
```

---

## Environment Variables Reference

### Web Server
- `PORT` - Server port (default: 3000)
- `DASHBOARD_BASE_URL` - URL for dashboard access
- `NODE_ENV` - Environment (development/production)

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Discord
- `DISCORD_TOKEN` - Bot token
- `DISCORD_CLIENT_ID` - Application ID

---

For more help, see:
- [SETUP.md](SETUP.md) - Complete setup guide
- [README.md](README.md) - Main documentation
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Full reference
