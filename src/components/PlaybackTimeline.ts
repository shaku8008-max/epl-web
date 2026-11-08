export type PlaybackListener = () => void;

export type PlaybackTimeline = {
  dates: string[];
  getPosition: () => number;
  getDateTimestamp: () => number;
  getDate: () => string | null;
  isPlaying: () => boolean;
  getSnapshot: () => number;
  getPlayingSnapshot: () => boolean;
  subscribe: (listener: PlaybackListener) => () => void;
  playPause: () => void;
  restart: () => void;
  setPosition: (position: number) => void;
  setReducedMotion: (reduced: boolean) => void;
};

const PLAYBACK_MS = 8000;

export function createPlaybackTimeline(dates: string[]): PlaybackTimeline {
  let position = Math.max(dates.length - 1, 0);
  let playing = false;
  let reducedMotion = false;
  let frame: number | null = null;
  let lastFrame: number | null = null;
  const listeners = new Set<PlaybackListener>();

  const notify = () => listeners.forEach((listener) => listener());
  const stopFrame = () => {
    if (frame !== null && typeof window !== "undefined") window.cancelAnimationFrame(frame);
    frame = null;
    lastFrame = null;
  };
  const finish = () => {
    stopFrame();
    playing = false;
    position = Math.max(dates.length - 1, 0);
    notify();
  };
  const tick = (now: number) => {
    if (!playing) return;
    if (lastFrame === null) lastFrame = now;
    position += ((now - lastFrame) / PLAYBACK_MS) * Math.max(dates.length - 1, 1);
    lastFrame = now;
    if (position >= dates.length - 1) {
      finish();
      return;
    }
    notify();
    frame = window.requestAnimationFrame(tick);
  };

  return {
    dates,
    getPosition: () => position,
    getDateTimestamp: () => {
      if (dates.length === 0) return 0;
      const index = Math.min(Math.floor(position), dates.length - 1);
      const fraction = position - index;
      const start = new Date(dates[index]).getTime();
      const end = new Date(dates[Math.min(index + 1, dates.length - 1)]).getTime();
      return start + (end - start) * fraction;
    },
    getDate: () => dates[Math.round(position)] ?? null,
    isPlaying: () => playing,
    getSnapshot: () => Math.round(position * 1000),
    getPlayingSnapshot: () => playing,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    playPause: () => {
      if (reducedMotion || dates.length < 2) return;
      if (playing) {
        playing = false;
        stopFrame();
        notify();
        return;
      }
      if (position >= dates.length - 1) position = 0;
      playing = true;
      lastFrame = null;
      notify();
      frame = window.requestAnimationFrame(tick);
    },
    restart: () => {
      stopFrame();
      playing = false;
      position = Math.max(dates.length - 1, 0);
      notify();
    },
    setPosition: (next) => {
      stopFrame();
      playing = false;
      position = Math.max(0, Math.min(Math.max(dates.length - 1, 0), next));
      notify();
    },
    setReducedMotion: (reduced) => {
      reducedMotion = reduced;
      if (reduced && playing) {
        stopFrame();
        playing = false;
        notify();
      }
    },
  };
}
