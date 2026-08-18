export const SVELTEKIT_PROBE_KEY = '__DNDGEM_META_SVELTEKIT' as const;

export interface CompatProbe {
  ready: boolean;
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  spaceWidth?: number;
  cancelCount: number;
  proposalUnplaced?: number;
  sessionsCreated: number;
  sessionsDisposed: number;
  liveObservers: number;
}

function emptyProbe(): CompatProbe {
  return {
    ready: false,
    cancelCount: 0,
    sessionsCreated: 0,
    sessionsDisposed: 0,
    liveObservers: 0,
  };
}

export function ensureProbe(): CompatProbe {
  if (typeof window === 'undefined') {
    return emptyProbe();
  }
  const holder = window as unknown as Record<typeof SVELTEKIT_PROBE_KEY, CompatProbe | undefined>;
  holder[SVELTEKIT_PROBE_KEY] ??= emptyProbe();
  return holder[SVELTEKIT_PROBE_KEY];
}

export function createCountingResizeObserver():
  (new (callback: ResizeObserverCallback) => ResizeObserver) | undefined {
  if (typeof ResizeObserver === 'undefined') {
    return undefined;
  }
  return class CountingResizeObserver extends ResizeObserver {
    #tracked = true;
    constructor(callback: ResizeObserverCallback) {
      super(callback);
      const probe = ensureProbe();
      probe.sessionsCreated += 1;
      probe.liveObservers += 1;
    }
    override disconnect(): void {
      if (this.#tracked) {
        this.#tracked = false;
        const probe = ensureProbe();
        probe.sessionsDisposed += 1;
        probe.liveObservers = Math.max(0, probe.liveObservers - 1);
      }
      super.disconnect();
    }
  };
}
