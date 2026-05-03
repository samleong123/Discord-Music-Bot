import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '@/config/config';
import logger from '@/config/logger';
import { SocketManager } from '@/web/sockets/socket.manager';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Compiled file: dist/web/web.server.js  →  two levels up = package root
// Public assets: src/web/public/index.html
const PUBLIC_DIR = path.join(__dirname, '../../src/web/public');

export class WebServer {
  private app: Express;
  private httpServer: Server;
  private socketManager: SocketManager;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.socketManager = new SocketManager(this.httpServer);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Disable CSP so the dashboard can load Bootstrap / Socket.IO from CDN
    this.app.use(helmet({ contentSecurityPolicy: false }));
    this.app.use(
      cors({
        origin: config.env === 'production' ? config.web.baseUrl : '*',
        credentials: true,
      }),
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use((req, _res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Guild / bot API routes
    import('@/web/routes/guild.routes').then((module) => {
      this.app.use('/api', module.default);
    }).catch((error) => {
      logger.error('Failed to load guild routes', error);
    });

    // Static dashboard files
    logger.debug(`Serving static files from: ${PUBLIC_DIR}`);
    this.app.use(express.static(PUBLIC_DIR));

    // SPA fallback — only for non-API routes
    this.app.get(/^(?!\/api).*$/, (_req: Request, res: Response) => {
      res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
    });

    // Express error handler — MUST have exactly 4 parameters
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Express error', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }

  start(port: number = config.web.port): void {
    this.httpServer.listen(port, () => {
      logger.info(`Web server listening on port ${port}`);
    });
  }

  getApp(): Express { return this.app; }
  getSocketManager(): SocketManager { return this.socketManager; }
}
