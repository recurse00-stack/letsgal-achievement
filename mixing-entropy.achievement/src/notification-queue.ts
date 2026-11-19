/** A run owns one queue. Persisted stages never depend on animation success. */
export class NotificationQueue<T> {
  private readonly pending: T[] = [];
  private running = false;
  private stopped = false;
  private current?: AbortController;
  constructor(private readonly play: (item: T, signal: AbortSignal) => Promise<void>, private readonly report: (error: unknown) => void) {}
  enqueue(item: T): void {
    if (this.stopped) return;
    this.pending.push(item);
    void this.drain();
  }
  stop(): void {
    this.stopped = true;
    this.pending.length = 0;
    this.current?.abort();
  }
  private async drain(): Promise<void> {
    if (this.running || this.stopped) return;
    this.running = true;
    try {
      while (this.pending.length && !this.stopped) {
        this.current = new AbortController();
        try { await this.play(this.pending.shift()!, this.current.signal); }
        catch (error) { if (!this.stopped) this.report(error); }
        finally { this.current = undefined; }
      }
    } finally { this.running = false; }
  }
}

export interface BatchClock {
  schedule(fn: () => void, ms: number): unknown;
  cancel(timer: unknown): void;
}
const clock: BatchClock = {
  schedule: (fn, ms) => setTimeout(fn, ms),
  cancel: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

/** A fixed collection window closes BEFORE its first popup can start. */
export class NotificationBatcher<T, Options> {
  private collecting?: { items: T[]; options: Options; timer: unknown };
  private stopped = false;
  private readonly queue: NotificationQueue<{ items: T[]; options: Options }>;
  constructor(
    private readonly settings: () => { windowMs: number; options: Options },
    play: (items: readonly T[], options: Options, signal: AbortSignal) => Promise<void>,
    private readonly report: (error: unknown) => void,
    private readonly timers: BatchClock = clock,
  ) {
    this.queue = new NotificationQueue((batch, signal) => play(batch.items, batch.options, signal), report);
  }
  enqueue(item: T): void {
    if (this.stopped) return;
    if (!this.collecting) {
      let settings: ReturnType<typeof this.settings>;
      try { settings = this.settings(); } catch (error) { this.report(error); return; }
      const batch = { items: [] as T[], options: settings.options, timer: undefined as unknown };
      this.collecting = batch;
      batch.timer = this.timers.schedule(() => {
        if (this.stopped || this.collecting !== batch) return;
        this.collecting = undefined;
        this.queue.enqueue({ items: batch.items.slice(), options: batch.options });
      }, settings.windowMs);
    }
    this.collecting.items.push(item);
  }
  stop(): void {
    this.stopped = true;
    if (this.collecting) this.timers.cancel(this.collecting.timer);
    this.collecting = undefined;
    this.queue.stop();
  }
}

export function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const timer = setTimeout(done, ms);
    function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
    signal.addEventListener('abort', done, { once: true });
  });
}
