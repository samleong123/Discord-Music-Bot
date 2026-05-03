import { spawn } from 'child_process';
import { Readable } from 'stream';
import logger from '@/config/logger';

export class FFmpegService {
  /**
   * Create a piped stream: yt-dlp stdout → FFmpeg stdin → FFmpeg stdout (raw s16le PCM).
   * This avoids the CDN URL expiry / missing-header issue that causes FFmpeg exit code 152.
   */
  createStreamFromYtDlp(webpageUrl: string, seekSeconds: number = 0): Readable {
    const ytdlpArgs = [
      '-f', 'bestaudio/best',
      '-o', '-',
      '--no-warnings',
      '--socket-timeout', '30',
      webpageUrl,
    ];

    // -ss must come AFTER -i pipe:0 for piped input (pre-input seek doesn't work on pipes)
    const ffmpegArgs: string[] = ['-i', 'pipe:0'];

    if (seekSeconds > 0) {
      ffmpegArgs.push('-ss', String(seekSeconds));
    }

    ffmpegArgs.push('-f', 's16le', '-ac', '2', '-ar', '48000', '-loglevel', 'error', 'pipe:1');

    logger.debug(`Starting yt-dlp → FFmpeg pipeline for ${webpageUrl}`);

    const ytdlp = spawn('yt-dlp', ytdlpArgs);
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    // Pipe yt-dlp → FFmpeg
    ytdlp.stdout.pipe(ffmpeg.stdin);

    // Suppress EPIPE when FFmpeg closes before yt-dlp finishes
    ffmpeg.stdin.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code !== 'EPIPE') {
        logger.error('FFmpeg stdin error', err);
      }
    });

    ytdlp.stderr.on('data', (data) => {
      logger.debug(`yt-dlp: ${data.toString().trim()}`);
    });

    ytdlp.on('error', (error) => {
      logger.error('yt-dlp process error', error);
    });

    ytdlp.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logger.warn(`yt-dlp exited with code ${code}`);
      }
      ffmpeg.stdin.end();
    });

    ffmpeg.stderr.on('data', (data) => {
      logger.debug(`FFmpeg: ${data.toString().trim()}`);
    });

    ffmpeg.on('error', (error) => {
      logger.error('FFmpeg error', error);
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logger.warn(`FFmpeg exited with code ${code}`);
      }
    });

    return ffmpeg.stdout;
  }

  /**
   * Create a stream from a direct URL (for non-YouTube or pre-resolved URLs).
   */
  createStream(url: string, seekSeconds: number = 0): NodeJS.ReadableStream {
    const args: string[] = ['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '5'];

    if (seekSeconds > 0) {
      args.push('-ss', String(seekSeconds));
    }

    args.push('-i', url, '-f', 's16le', '-ac', '2', '-ar', '48000', '-loglevel', 'error', 'pipe:1');

    logger.debug(`Starting FFmpeg stream from direct URL at position ${seekSeconds}s`);

    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.stderr.on('data', (data) => {
      logger.debug(`FFmpeg: ${data.toString().trim()}`);
    });

    ffmpeg.on('error', (error) => {
      logger.error('FFmpeg error', error);
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logger.warn(`FFmpeg exited with code ${code}`);
      }
    });

    return ffmpeg.stdout;
  }

  /**
   * Get duration of audio file
   */
  async getDuration(url: string): Promise<number | null> {
    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1:noinv=1',
        url,
      ]);

      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', () => {
        try {
          const duration = parseFloat(output.trim());
          resolve(isNaN(duration) ? null : Math.floor(duration));
        } catch {
          resolve(null);
        }
      });

      ffprobe.on('error', () => {
        resolve(null);
      });

      setTimeout(() => {
        ffprobe.kill();
        resolve(null);
      }, 30000);
    });
  }
}

export const ffmpegService = new FFmpegService();
