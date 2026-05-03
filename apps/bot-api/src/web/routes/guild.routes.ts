import { Request, Response, Router } from 'express';
import { queueManager } from '@/queue/queue.manager';
import { ytDlpService } from '@/audio/ytdlp.service';
import { botState } from '@/bot/bot-state';
import logger from '@/config/logger';

const router = Router();

// ── Bot info ────────────────────────────────────────────────────────────────

router.get('/guilds', (_req: Request, res: Response) => {
  try {
    res.json({ guilds: botState.getGuilds(), botTag: botState.getBotTag() });
  } catch (error) {
    logger.error('Failed to get guilds', error);
    res.status(500).json({ error: 'Failed to get guilds' });
  }
});

// ── Queue / state ───────────────────────────────────────────────────────────

router.get('/guilds/:guildId/queue', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const state = queueManager.getPlayer(guildId).getState();
    res.json({
      currentTrack:     state.currentTrack,
      queue:            state.queue,
      count:            state.queue.length,
      isPlaying:        state.isPlaying,
      isPaused:         state.isPaused,
      repeatMode:       state.repeatMode,
      position:         state.position,
      volume:           state.volume,
      voiceChannelId:   state.voiceChannelId,
      voiceChannelName: state.voiceChannelName,
    });
  } catch (error) {
    logger.error('Failed to get queue', error);
    res.status(500).json({ error: 'Failed to get queue' });
  }
});

// ── Playback ────────────────────────────────────────────────────────────────

router.post('/guilds/:guildId/play', async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const { url } = req.body;
    if (!url) { res.status(400).json({ error: 'URL is required' }); return; }

    const metadata = await ytDlpService.extractMetadata(url);
    const track = {
      id:                metadata.id,
      source:            metadata.extractor,
      title:             metadata.title,
      originalUrl:       metadata.webpage_url,
      webpageUrl:        metadata.webpage_url,
      durationSec:       metadata.duration,
      thumbnailUrl:      metadata.thumbnail   ?? undefined,
      uploader:          metadata.uploader    ?? undefined,
      requestedByUserId: 'web-dashboard',
      addedAt:           new Date().toISOString(),
    };

    await queueManager.addTrack(guildId, track);
    await queueManager.play(guildId);
    res.json({ success: true, track });
  } catch (error) {
    logger.error('Failed to add track', error);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

router.post('/guilds/:guildId/pause', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    queueManager.pause(guildId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to pause', error);
    res.status(500).json({ error: 'Failed to pause' });
  }
});

router.post('/guilds/:guildId/resume', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    queueManager.resume(guildId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to resume', error);
    res.status(500).json({ error: 'Failed to resume' });
  }
});

router.post('/guilds/:guildId/skip', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    queueManager.skip(guildId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to skip', error);
    res.status(500).json({ error: 'Failed to skip' });
  }
});

router.post('/guilds/:guildId/stop', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    queueManager.stop(guildId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to stop', error);
    res.status(500).json({ error: 'Failed to stop' });
  }
});

router.post('/guilds/:guildId/seek', async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const { position } = req.body;
    const secs = parseFloat(position);
    if (isNaN(secs) || secs < 0) {
      res.status(400).json({ error: 'position must be a non-negative number (seconds)' });
      return;
    }
    await queueManager.seek(guildId, secs);
    res.json({ success: true, position: secs });
  } catch (error) {
    logger.error('Failed to seek', error);
    res.status(500).json({ error: 'Failed to seek' });
  }
});

router.post('/guilds/:guildId/shuffle', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    queueManager.shuffle(guildId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to shuffle', error);
    res.status(500).json({ error: 'Failed to shuffle' });
  }
});

router.post('/guilds/:guildId/volume', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const { volume } = req.body;
    const vol = parseFloat(volume);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      res.status(400).json({ error: 'Volume must be 0–100' });
      return;
    }
    queueManager.setVolume(guildId, vol / 100);
    res.json({ success: true, volume: vol });
  } catch (error) {
    logger.error('Failed to set volume', error);
    res.status(500).json({ error: 'Failed to set volume' });
  }
});

router.post('/guilds/:guildId/repeat', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const { mode } = req.body;
    if (!['off', 'track', 'queue'].includes(mode)) {
      res.status(400).json({ error: 'Invalid repeat mode' });
      return;
    }
    queueManager.setRepeatMode(guildId, mode);
    res.json({ success: true, mode });
  } catch (error) {
    logger.error('Failed to set repeat mode', error);
    res.status(500).json({ error: 'Failed to set repeat mode' });
  }
});

// ── Queue item management ───────────────────────────────────────────────────

router.delete('/guilds/:guildId/queue/:trackIndex', (req: Request, res: Response) => {
  try {
    const { guildId, trackIndex } = req.params;
    const index = parseInt(trackIndex, 10) - 1;
    const removed = queueManager.removeTrack(guildId, index);
    if (!removed) { res.status(404).json({ error: 'Track not found' }); return; }
    res.json({ success: true, removed });
  } catch (error) {
    logger.error('Failed to remove track', error);
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

router.delete('/guilds/:guildId/queue', (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    queueManager.clearQueue(guildId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to clear queue', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

export default router;
