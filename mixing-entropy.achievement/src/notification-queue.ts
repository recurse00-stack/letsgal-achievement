/** A run owns one queue. Persisted activation never depends on animation success. */
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

export function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const timer = setTimeout(done, ms);
    function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
    signal.addEventListener('abort', done, { once: true });
  });
}
