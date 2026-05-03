import { spawn } from 'child_process';
import logger from '@/config/logger';

export interface YtDlpMetadata {
  id: string;
  title: string;
  webpage_url: string;
  duration: number | null;
  thumbnail: string | null;
  uploader: string | null;
  extractor: string;
  requested_by?: string;
}

export interface YtDlpPlaylistItem extends YtDlpMetadata {
  entries?: YtDlpPlaylistItem[];
}

export class YtDlpService {
  private static readonly YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
  private static readonly PLAYLIST_URL_REGEX = /[?&]list=/;

  /**
   * Extract metadata for a single track or detect playlist
   */
  async extractMetadata(url: string): Promise<YtDlpMetadata | YtDlpPlaylistItem> {
    const args = [
      '--dump-json',
      '--no-warnings',
      '--socket-timeout',
      '30',
      '--match-filter',
      '!is_live', // Skip live streams
      url,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          logger.error(`yt-dlp metadata extraction failed: ${stderr}`);
          reject(new Error(`yt-dlp failed: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          resolve(data);
        } catch (error) {
          logger.error('Failed to parse yt-dlp output', error);
          reject(new Error('Invalid yt-dlp output'));
        }
      });

      proc.on('error', (error) => {
        logger.error('yt-dlp process error', error);
        reject(error);
      });
    });
  }

  /**
   * Check if URL is a playlist
   */
  isPlaylist(url: string): boolean {
    return YtDlpService.PLAYLIST_URL_REGEX.test(url);
  }

  /**
   * Extract playlist items
   */
  async extractPlaylist(url: string, maxItems: number = 100): Promise<YtDlpMetadata[]> {
    const args = [
      '--flat-playlist',
      '--dump-single-json',
      '--no-warnings',
      '--socket-timeout',
      '30',
      '--playlist-items',
      `1-${maxItems}`,
      url,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          logger.error(`yt-dlp playlist extraction failed: ${stderr}`);
          reject(new Error(`yt-dlp failed: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout.trim());
          const items: YtDlpMetadata[] = (data.entries || []).map((entry: any) => {
            const rawUrl = entry.webpage_url || entry.url || '';
            let webpageUrl = rawUrl;

            if (webpageUrl && !/^https?:\/\//i.test(webpageUrl)) {
              const extractor = String(entry.extractor || entry.ie_key || '').toLowerCase();
              if (extractor.includes('youtube') && entry.id) {
                webpageUrl = `https://www.youtube.com/watch?v=${entry.id}`;
              }
            }

            return {
              id: entry.id || '',
              title: entry.title || 'Unknown',
              webpage_url: webpageUrl,
              duration: entry.duration || null,
              thumbnail: entry.thumbnail || null,
              uploader: entry.uploader || null,
              extractor: entry.extractor || entry.ie_key || 'unknown',
            };
          });

          resolve(items);
        } catch (error) {
          logger.error('Failed to parse yt-dlp playlist output', error);
          reject(new Error('Invalid yt-dlp output'));
        }
      });

      proc.on('error', (error) => {
        logger.error('yt-dlp process error', error);
        reject(error);
      });
    });
  }

  /**
   * Get direct audio URL for playback
   */
  async getAudioUrl(url: string): Promise<string> {
    const args = ['-f', 'bestaudio/best', '-g', '--no-warnings', '--socket-timeout', '30', url];

    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          logger.error(`yt-dlp audio URL extraction failed: ${stderr}`);
          reject(new Error(`Failed to extract audio URL: ${stderr}`));
          return;
        }

        const audioUrl = stdout.trim().split('\n')[0];
        if (!audioUrl) {
          reject(new Error('No audio URL found'));
          return;
        }

        resolve(audioUrl);
      });

      proc.on('error', (error) => {
        logger.error('yt-dlp process error', error);
        reject(error);
      });
    });
  }
}

export const ytDlpService = new YtDlpService();
