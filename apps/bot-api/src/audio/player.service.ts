import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} from '@discordjs/voice';
import { EventEmitter } from 'events';
import logger from '@/config/logger';
import { ffmpegService } from '@/audio/ffmpeg.service';

export interface QueueTrack {
  id: string;
  source: string;
  title: string;
  originalUrl: string;
  webpageUrl: string;
  durationSec: number | null;
  thumbnailUrl?: string;
  uploader?: string;
  requestedByUserId: string;
  addedAt: string;
}

export interface PlayerState {
  currentTrack: QueueTrack | null;
  queue: QueueTrack[];
  isPlaying: boolean;
  isPaused: boolean;
  repeatMode: 'off' | 'track' | 'queue';
  position: number;
  volume: number;
  voiceChannelId: string | null;
  voiceChannelName: string | null;
}

export class MusicPlayer extends EventEmitter {
  private audioPlayer: AudioPlayer;
  private voiceConnection: VoiceConnection | null = null;
  private voiceChannelId: string | null = null;
  private voiceChannelName: string | null = null;

  private queue: QueueTrack[] = [];
  private currentTrack: QueueTrack | null = null;
  private currentResource: AudioResource | null = null;
  private repeatMode: 'off' | 'track' | 'queue' = 'off';
  private volume: number = 1.0;
  private isPaused: boolean = false;
  private guildId: string;

  // Accurate position tracking
  private trackStartTime: number | null = null; // wall-clock ms when playback started
  private seekOffset: number = 0;               // seconds already played before latest start
  private pauseElapsed: number = 0;             // position (secs) frozen at pause

  constructor(guildId: string) {
    super();
    this.guildId = guildId;
    this.audioPlayer = createAudioPlayer();
    this.setupAudioPlayerListeners();
  }

  private setupAudioPlayerListeners(): void {
    this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
      logger.debug(`Player started playing in guild ${this.guildId}`);
      this.emit('playing', this.currentTrack);
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      logger.debug(`Player idle in guild ${this.guildId}`);
      if (this.currentTrack) {
        this.emit('trackEnd', this.currentTrack);
        void this.handleTrackEnd();
      }
    });

    this.audioPlayer.on(AudioPlayerStatus.Paused, () => {
      this.isPaused = true;
      this.emit('paused');
    });

    this.audioPlayer.on('error', (error) => {
      logger.error(`Audio player error in guild ${this.guildId}`, error);
      this.emit('error', error);
    });
  }

  private async handleTrackEnd(): Promise<void> {
    if (this.repeatMode === 'track') {
      if (this.currentTrack) await this.playTrack(this.currentTrack);
    } else if (this.repeatMode === 'queue' && this.currentTrack) {
      this.queue.push(this.currentTrack);
      await this.playNext();
    } else {
      await this.playNext();
    }
  }

  // ── Voice connection ────────────────────────────────────────────────────────

  async setVoiceConnection(
    connection: VoiceConnection,
    channelId?: string,
    channelName?: string,
  ): Promise<void> {
    this.voiceConnection = connection;
    this.voiceChannelId = channelId ?? connection.joinConfig.channelId;
    this.voiceChannelName = channelName ?? null;

    if (connection.state.status !== VoiceConnectionStatus.Ready) {
      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      } catch (err) {
        logger.error(`Voice connection failed for guild ${this.guildId}`, err);
        connection.destroy();
        this.voiceConnection  = null;
        this.voiceChannelId   = null;
        this.voiceChannelName = null;
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`Voice connection failed: ${reason}`);
      }
    }

    connection.subscribe(this.audioPlayer);
    logger.info(`Voice connection ready in "${channelName ?? channelId}" for guild ${this.guildId}`);
    this.emit('voiceChannelChanged', { id: this.voiceChannelId, name: this.voiceChannelName });
  }

  // ── Queue management ────────────────────────────────────────────────────────

  async addTrackToQueue(track: QueueTrack): Promise<void> {
    this.queue.push(track);
    this.emit('queueUpdate', this.queue);
  }

  async addTracksToQueue(tracks: QueueTrack[]): Promise<void> {
    this.queue.push(...tracks);
    this.emit('queueUpdate', this.queue);
  }

  removeFromQueue(index: number): QueueTrack | null {
    if (index < 0 || index >= this.queue.length) return null;
    const [removed] = this.queue.splice(index, 1);
    this.emit('queueUpdate', this.queue);
    return removed ?? null;
  }

  moveInQueue(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 || fromIndex >= this.queue.length ||
      toIndex   < 0 || toIndex   >= this.queue.length
    ) return false;
    const [track] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, track!);
    this.emit('queueUpdate', this.queue);
    return true;
  }

  clearQueue(): void {
    this.queue = [];
    this.emit('queueUpdate', this.queue);
  }

  /** Fisher-Yates shuffle of the upcoming queue (does not affect current track) */
  shuffle(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j]!, this.queue[i]!];
    }
    this.emit('queueUpdate', this.queue);
    logger.info(`Shuffled ${this.queue.length} tracks in guild ${this.guildId}`);
  }

  // ── Playback ────────────────────────────────────────────────────────────────

  async playTrack(track: QueueTrack, seekSeconds: number = 0): Promise<void> {
    try {
      logger.info(`Playing track: "${track.title}" from ${track.source}`);

      const stream = ffmpegService.createStreamFromYtDlp(track.webpageUrl, seekSeconds);
      const resource = createAudioResource(stream, {
        metadata: track,
        inlineVolume: true,
        inputType: StreamType.Raw,
      });

      if (resource.volume) resource.volume.setVolume(this.volume);

      this.currentTrack   = track;
      this.currentResource = resource;
      this.isPaused       = false;

      // Position tracking
      this.seekOffset      = seekSeconds;
      this.trackStartTime  = Date.now();
      this.pauseElapsed    = seekSeconds;

      this.audioPlayer.play(resource);
      this.emit('trackStart', track);
    } catch (error) {
      logger.error(`Failed to play track "${track.title}"`, error);
      this.emit('playError', { track, error });
      await this.playNext();
    }
  }

  async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.currentTrack    = null;
      this.currentResource = null;
      this.trackStartTime  = null;
      this.audioPlayer.stop();
      this.emit('queueEmpty');
      return;
    }
    const next = this.queue.shift()!;
    await this.playTrack(next);
  }

  async playFromQueue(index: number): Promise<void> {
    if (index < 0 || index >= this.queue.length) throw new Error('Invalid queue index');
    const [track] = this.queue.splice(index, 1);
    await this.playTrack(track!);
  }

  pause(): void {
    if (this.isPaused) return;
    // Freeze position
    if (this.trackStartTime !== null) {
      this.pauseElapsed = this.seekOffset + Math.floor((Date.now() - this.trackStartTime) / 1000);
    }
    this.audioPlayer.pause(true);
    this.isPaused = true;
    this.emit('paused');
  }

  resume(): void {
    if (!this.isPaused) return;
    // Resume counting from the frozen position
    this.seekOffset     = this.pauseElapsed;
    this.trackStartTime = Date.now();
    this.audioPlayer.unpause();
    this.isPaused = false;
    this.emit('resumed');
  }

  stop(): void {
    this.queue           = [];
    this.currentTrack    = null;
    this.currentResource = null;
    this.trackStartTime  = null;
    this.audioPlayer.stop();
    this.emit('stopped');
  }

  /** Seek to absolute position in seconds by restarting the FFmpeg pipe */
  async seek(seconds: number): Promise<void> {
    if (!this.currentTrack) return;
    logger.info(`Seeking to ${seconds}s in guild ${this.guildId}`);
    await this.playTrack(this.currentTrack, seconds);
    this.emit('seeked', seconds);
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  setRepeatMode(mode: 'off' | 'track' | 'queue'): void {
    this.repeatMode = mode;
    this.emit('repeatModeChanged', mode);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(this.volume);
    }
    this.emit('volumeChanged', this.volume);
  }

  // ── State ───────────────────────────────────────────────────────────────────

  getState(): PlayerState {
    // Compute accurate live position
    let position = 0;
    if (this.currentTrack) {
      if (this.isPaused) {
        position = this.pauseElapsed;
      } else if (this.trackStartTime !== null) {
        position = this.seekOffset + Math.floor((Date.now() - this.trackStartTime) / 1000);
      }
    }

    return {
      currentTrack:    this.currentTrack,
      queue:           [...this.queue],
      isPlaying:       this.audioPlayer.state.status === AudioPlayerStatus.Playing,
      isPaused:        this.isPaused,
      repeatMode:      this.repeatMode,
      position,
      volume:          this.volume,
      voiceChannelId:  this.voiceChannelId,
      voiceChannelName: this.voiceChannelName,
    };
  }

  async disconnect(): Promise<void> {
    if (this.voiceConnection) this.voiceConnection.destroy();
    this.audioPlayer.stop();
    this.queue            = [];
    this.currentTrack     = null;
    this.currentResource  = null;
    this.trackStartTime   = null;
    this.voiceChannelId   = null;
    this.voiceChannelName = null;
  }
}
