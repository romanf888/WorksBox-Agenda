// Service de gestion des notifications (Web Notifications API & Web Audio Synthesizer)

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private notifiedSet: Set<string> = new Set();

  constructor() {
    // Load previously notified IDs in this session
    try {
      const saved = sessionStorage.getItem('agenda_notified_keys');
      if (saved) {
        this.notifiedSet = new Set(JSON.parse(saved));
      }
      const soundPref = localStorage.getItem('agenda_sound_enabled');
      if (soundPref !== null) {
        this.soundEnabled = soundPref === 'true';
      }
    } catch {
      // Ignore storage errors
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return Notification.permission;
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('agenda_sound_enabled', enabled ? 'true' : 'false');
    } catch {}
  }

  // Synthesize a pleasant chime using Web Audio API
  public playChime(isUrgent = false): void {
    if (!this.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;
      const gainNode = this.audioCtx.createGain();
      gainNode.connect(this.audioCtx.destination);
      gainNode.gain.setValueAtTime(0.12, now);

      if (isUrgent) {
        // Urgent alert: two higher-pitch pulses
        const osc1 = this.audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.setValueAtTime(880, now + 0.12); // A5
        osc1.connect(gainNode);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc1.start(now);
        osc1.stop(now + 0.45);
      } else {
        // Calming school reminder chime
        const osc1 = this.audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
        osc1.connect(gainNode);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc1.start(now);
        osc1.stop(now + 0.55);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  public sendNotification(title: string, body: string, key?: string, isUrgent = false): boolean {
    if (key && this.notifiedSet.has(key)) {
      return false;
    }

    // Play chime sound
    this.playChime(isUrgent);

    // Save key to prevent duplicate notification
    if (key) {
      this.notifiedSet.add(key);
      try {
        sessionStorage.setItem('agenda_notified_keys', JSON.stringify(Array.from(this.notifiedSet)));
      } catch {}
    }

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: key,
        });
        return true;
      } catch (err) {
        console.warn('Failed to dispatch browser notification:', err);
      }
    }

    return false;
  }
}

export const notificationService = new NotificationService();
