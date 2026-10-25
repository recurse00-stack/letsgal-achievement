import type { DatabaseCollectionAPI, DatabaseDocument, ExtensionContext, VisualUIViewHandle } from '@avg-studio/sdk';
import { AchievementError, activations, catalog, DEFAULT_LEVELS, entries, setActivation, type Entry } from './model.ts';
import { NotificationQueue, delay } from './notification-queue.ts';
import { bindBrowseMode } from './browse-mode.ts';
import { createHorizontalCards } from './horizontal-cards.ts';

export const PAGE = '@mixing-entropy.achievement/achievements';
export const POPUP = '@mixing-entropy.achievement/achievement-popup';
interface ViewSink {
  get(key: 'browseMode'): string;
  set(key: 'browseMode', value: string): void;
  set(key: 'entries', value: readonly Entry[]): void;
}
interface StateDocument extends DatabaseDocument { achievementId: string; active: boolean }
const runs = new WeakMap<AbortSignal, AchievementController>();
export function controller(ctx: ExtensionContext, sink: ViewSink): AchievementController {
  const signal = ctx.flow.signal;
  let result = runs.get(signal);
  if (!result) { result = new AchievementController(ctx, sink, signal); runs.set(signal, result); }
  return result;
}
export class AchievementController {
  private readonly table: DatabaseCollectionAPI<StateDocument>;
  private readonly notifications: NotificationQueue<Entry>;
  private tail: Promise<unknown> = Promise.resolve();
  private readonly cleanups: Array<() => void> = [];
  private page?: VisualUIViewHandle;
  constructor(private readonly ctx: ExtensionContext, private readonly sink: ViewSink, private readonly signal: AbortSignal) {
    this.table = ctx.database.collection<StateDocument>('states');
    this.notifications = new NotificationQueue((item, abort) => this.popup(item, abort), error => console.error('[成就] 浮现失败，激活记录已保留', error));
    const refresh = () => { if (!signal.aborted) void this.refresh().catch(error => console.error('[成就] 刷新失败', error)); };
    this.cleanups.push(this.table.watch(refresh));
    this.cleanups.push(ctx.settings.subscribe('levels', refresh), ctx.settings.subscribe('achievements', refresh));
    const dispose = () => { this.notifications.stop(); this.page?.close(); this.cleanups.splice(0).forEach(fn => fn()); };
    if (signal.aborted) dispose(); else signal.addEventListener('abort', dispose, { once: true });
  }
  private assertLive(): void {
    if (this.signal.aborted || this.ctx.flow.signal !== this.signal) throw new AchievementError('RUN_ENDED', '本次游戏运行已结束');
  }
  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const task = this.tail.then(() => { this.assertLive(); return fn(); });
    this.tail = task.catch(() => undefined);
    return task;
  }
  private definitions() {
    const levels = this.ctx.settings.get<unknown[]>('levels') ?? [];
    return catalog(levels.length ? levels : DEFAULT_LEVELS, this.ctx.settings.get('achievements') ?? []);
  }
  private async read() {
    const definitions = this.definitions();
    const documents = await this.table.find();
    this.assertLive();
    const records = activations(documents.map(row => ({ id: row.achievementId, active: row.active })));
    return { definitions, documents, records };
  }
  private publish(definitions: ReturnType<typeof catalog>, records: ReturnType<typeof activations>): Entry[] {
    this.assertLive();
    const result = entries(definitions, records).map(item => ({ ...item, icon: item.icon || 'extension-asset://mixing-entropy.achievement/assets/achievement.svg', frame: `extension-asset://mixing-entropy.achievement/assets/frame-${['bronze', 'silver', 'gold'].includes(item.levelId) ? item.levelId : 'neutral'}.svg` }));
    this.sink.set('entries', result);
    return result;
  }
  refresh(): Promise<void> {
    return this.serial(async () => { const { definitions, records } = await this.read(); this.publish(definitions, records); });
  }
  set(id: string, active: boolean, notify: boolean): Promise<void> {
    return this.serial(async () => {
      const { definitions, documents, records } = await this.read();
      // Restore replays control flow; persisted facts must not be settled twice.
      if (this.ctx.flow.isRestoring) { this.publish(definitions, records); return; }
      const change = setActivation(definitions, records, id, active);
      if (change.changed) {
        const existing = documents.find(row => row.achievementId === id);
        this.assertLive();
        if (existing) {
          const written = await this.table.updateOne({ id: existing.id }, { $set: { active } });
          if (written.matchedCount !== 1) throw new AchievementError('WRITE_CONFLICT', '激活记录已变化，请重新操作');
        } else await this.table.insertOne({ achievementId: id, active });
        this.assertLive();
      }
      const list = this.publish(definitions, change.records);
      if (change.activated && notify && this.ctx.settings.get('notifications') !== false) this.notifications.enqueue(list.find(row => row.id === id)!);
    });
  }
  isActive(id: string): Promise<boolean> {
    return this.serial(async () => {
      const { definitions, records } = await this.read();
      if (!definitions.achievements.some(row => row.id === id)) throw new AchievementError('NOT_FOUND', `找不到成就：${id}`);
      return records.find(row => row.id === id)?.active ?? false;
    });
  }
  async openPage(): Promise<void> {
    await this.refresh();
    this.assertLive();
    if (this.page) return;
    const page = await this.ctx.visualUI.open(this.document('page', PAGE), { modal: true });
    if (this.signal.aborted) { page.close(); return; }
    this.page = page;
    const stopBrowsing = bindBrowseMode(page, {
      read: () => this.sink.get('browseMode'),
      write: mode => { this.assertLive(); this.sink.set('browseMode', mode); },
    }, {
      policy: this.ctx.settings.get('browsePolicy'),
      defaultMode: this.ctx.settings.get('browseDefault'),
      allowPagination: this.ctx.settings.get('allowPagination'),
      allowVertical: this.ctx.settings.get('allowVertical'),
      allowHorizontal: this.ctx.settings.get('allowHorizontal'),
    }, createHorizontalCards(page.get('achievement-list')));
    page.onClose(() => { stopBrowsing(); if (this.page === page) this.page = undefined; });
  }
  private document(key: string, fallback: string): string {
    const value = (this.ctx.settings.get<string>(key) || fallback).replace(/^ui:/, '');
    if (!/^(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(value)) throw new AchievementError('INVALID_UI', `${key} 需要可视化界面的文件名或 @扩展编号/文件名`);
    return value;
  }
  private async popup(item: Entry, abort: AbortSignal): Promise<void> {
    if (abort.aborted || this.signal.aborted) return;
    const name = this.document('popup', POPUP);
    const bind = (view: VisualUIViewHandle) => {
      view.get('achievement-frame')?.setStyle({ borderColor: ({ bronze: '#b38a55', silver: '#b9c2cc', gold: '#d4b04c' } as Record<string, string>)[item.levelId] ?? '#697888' });
      view.get('achievement-name')?.setProps({ text: item.name });
      view.get('achievement-level')?.setProps({ text: item.levelName });
      view.get('achievement-icon')?.setProps({ asset: item.icon });
      view.get('achievement-icon')?.setHidden(!item.icon);
    };
    const detach = this.ctx.visualUI.onOpen(name, bind);
    let view: VisualUIViewHandle | undefined;
    let detachClose = () => {};
    let resolveClosed = () => {};
    let closed = false;
    const closedPromise = new Promise<void>(resolve => { resolveClosed = resolve; });
    const end = () => resolveClosed();
    abort.addEventListener('abort', end, { once: true });
    try {
      view = await this.ctx.visualUI.open(name, { modal: false, interactable: false, pointerEventsPassthrough: true });
      if (abort.aborted || this.signal.aborted) return;
      bind(view);
      detachClose = view.onClose(() => { closed = true; resolveClosed(); });
      const configured = this.ctx.settings.get<number>('durationMs');
      const duration = typeof configured === 'number' && Number.isFinite(configured) ? Math.max(300, Math.min(60000, configured)) : 3000;
      await Promise.race([delay(duration, abort), closedPromise]);
      if (!closed) view.close();
      if (!abort.aborted) await closedPromise;
    } finally {
      detach(); detachClose(); abort.removeEventListener('abort', end);
      if (!closed) view?.close();
    }
  }
}
