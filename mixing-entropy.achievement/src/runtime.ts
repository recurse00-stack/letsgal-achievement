import type { DatabaseCollectionAPI, DatabaseDocument, ExtensionContext, VisualUIViewHandle } from '@avg-studio/sdk';
import { AchievementError, stageRecords, catalog, currentStage, DEFAULT_LEVELS, entries, setDisplayStage, readInfo, type ReadField, type Entry, type StageRecord } from './model.ts';
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
interface StateDocument extends DatabaseDocument { achievementId: string }
const runs = new WeakMap<AbortSignal, AchievementController>();
export function controller(ctx: ExtensionContext, sink: ViewSink): AchievementController {
  const signal = ctx.flow.signal;
  let result = runs.get(signal);
  if (!result) { result = new AchievementController(ctx, sink, signal); runs.set(signal, result); }
  return result;
}
export class AchievementController {
  private readonly table: DatabaseCollectionAPI<StateDocument>;
  private readonly notifications: NotificationQueue<{ id: string }>;
  private latest: Entry[] = [];
  private updatePopup?: (list: Entry[]) => void;
  private tail: Promise<unknown> = Promise.resolve();
  private readonly cleanups: Array<() => void> = [];
  private page?: VisualUIViewHandle;
  constructor(private readonly ctx: ExtensionContext, private readonly sink: ViewSink, private readonly signal: AbortSignal) {
    this.table = ctx.database.collection<StateDocument>('states');
    this.notifications = new NotificationQueue((item, abort) => this.popup(item, abort), error => console.error('[成就] 浮现失败，阶段记录已保留', error));
    const refresh = () => { if (!signal.aborted) void this.refresh().catch(error => console.error('[成就] 刷新失败', error)); };
    this.cleanups.push(this.table.watch(refresh));
    this.cleanups.push(ctx.settings.subscribe('levels', refresh), ctx.settings.subscribe('achievements', refresh), ctx.settings.subscribe('displayStages', refresh), ctx.settings.subscribe('defaultStages', refresh));
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
    return catalog(levels.length ? levels : DEFAULT_LEVELS, this.ctx.settings.get('achievements') ?? [], this.ctx.settings.get('displayStages') ?? [], this.ctx.settings.get('defaultStages') ?? []);
  }
  private async read() {
    const definitions = this.definitions();
    const documents = await this.table.find();
    this.assertLive();
    const records = stageRecords(documents.map(row => ({ id: row.achievementId, stageId: row.stageId })));
    return { definitions, documents, records };
  }
  private publish(definitions: ReturnType<typeof catalog>, records: ReturnType<typeof stageRecords>): Entry[] {
    this.assertLive();
    const result = entries(definitions, records).map(item => ({ ...item,
      icon: item.iconMode === 'unknown' ? 'extension-asset://mixing-entropy.achievement/assets/achievement-unknown.svg' : item.iconMode === 'base' ? item.icon || 'extension-asset://mixing-entropy.achievement/assets/achievement.svg' : item.icon,
      frame: `extension-asset://mixing-entropy.achievement/assets/frame-${['bronze', 'silver', 'gold'].includes(item.levelId) ? item.levelId : 'neutral'}.svg` }));
    this.latest = result;
    this.sink.set('entries', result);
    this.updatePopup?.(result);
    return result;
  }
  refresh(): Promise<void> {
    return this.serial(async () => { const { definitions, records } = await this.read(); this.publish(definitions, records); });
  }
  readInfo(id: string, field: ReadField): Promise<string> {
    return this.serial(async () => { const { definitions, records } = await this.read(); return readInfo(definitions, records, id, field); });
  }
  private async write(documents: StateDocument[], record: StageRecord): Promise<void> {
    const existing = documents.find(row => row.achievementId === record.id);
    const fields = { stageId: record.stageId };
    this.assertLive();
    if (existing) {
      const written = await this.table.updateOne({ id: existing.id }, { $set: fields });
      if (written.matchedCount !== 1) throw new AchievementError('WRITE_CONFLICT', '成就记录已变化，请重新操作');
    } else await this.table.insertOne({ achievementId: record.id, ...fields });
    this.assertLive();
  }
  setStage(id: string, target: string, expected = '', notify = false): Promise<boolean> {
    return this.serial(async () => {
      if (typeof expected !== 'string' || typeof notify !== 'boolean') throw new AchievementError('INVALID_DATA', '阶段方法参数无效');
      const { definitions, documents, records } = await this.read();
      if (this.ctx.flow.isRestoring) { this.publish(definitions, records); return false; }
      const change = setDisplayStage(definitions, records, id, target, expected);
      if (!change.matched) return false;
      // Persist even an equal default stage once, so later author default edits cannot move it.
      if (change.changed || !records.find(r => r.id === id)?.stageId) await this.write(documents, change.records.find(r => r.id === id)!);
      const list = this.publish(definitions, change.records);
      if (change.changed && notify && this.ctx.settings.get('notifications') !== false && list.some(r => r.id === id)) this.notifications.enqueue({ id });
      return true;
    });
  }
  getStage(id: string): Promise<string> {
    return this.serial(async () => { const { definitions, records } = await this.read(); return currentStage(definitions, records, id); });
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
  private async popup(request: { id: string }, abort: AbortSignal): Promise<void> {
    if (abort.aborted || this.signal.aborted) return;
    // Resolve at playback time, not enqueue time. A queued popup must not reveal old content.
    await this.refresh();
    const eligible = (list: Entry[]) => list.find(row => row.id === request.id);
    if (abort.aborted || !eligible(this.latest) || this.ctx.settings.get('notifications') === false) return;
    const name = this.document('popup', POPUP);
    const bind = (view: VisualUIViewHandle) => {
      const item = eligible(this.latest);
      if (!item) return;
      view.get('achievement-frame')?.setStyle({ borderColor: ({ bronze: '#b38a55', silver: '#b9c2cc', gold: '#d4b04c' } as Record<string, string>)[item.levelId] ?? '#697888' });
      view.get('achievement-label')?.setProps({ text: '成就展示已更新' });
      view.get('achievement-name')?.setProps({ text: item.name });
      // Content comes from the same definition as the card; visibility/layout remain authored.
      view.get('achievement-description')?.setProps({ text: item.description });
      view.get('achievement-level')?.setProps({ text: item.levelName });
      view.get('achievement-stage')?.setProps({ text: item.stageName });
      view.get('achievement-icon')?.setProps({ asset: item.icon });
    };
    const detach = this.ctx.visualUI.onOpen(name, bind);
    let view: VisualUIViewHandle | undefined;
    let detachClose = () => {};
    let resolveClosed = () => {};
    let closed = false;
    const timerAbort = new AbortController();
    const closedPromise = new Promise<void>(resolve => { resolveClosed = resolve; });
    const end = () => resolveClosed();
    let suppressed = false;
    const update = (list: Entry[]) => {
      if (!eligible(list)) { suppressed = true; view?.close(); end(); }
      else if (view && !suppressed) bind(view);
    };
    this.updatePopup = update;
    abort.addEventListener('abort', end, { once: true });
    try {
      view = await this.ctx.visualUI.open(name, { modal: false, interactable: false, pointerEventsPassthrough: true });
      if (abort.aborted || this.signal.aborted || suppressed || !eligible(this.latest)) return;
      bind(view);
      detachClose = view.onClose(() => { closed = true; resolveClosed(); });
      const configured = this.ctx.settings.get<number>('durationMs');
      const duration = typeof configured === 'number' && Number.isFinite(configured) ? Math.max(300, Math.min(60000, configured)) : 3000;
      await Promise.race([delay(duration, timerAbort.signal), closedPromise]);
      if (!closed) view.close();
      if (!abort.aborted) await closedPromise;
    } finally {
      timerAbort.abort();
      if (this.updatePopup === update) this.updatePopup = undefined;
      detach(); detachClose(); abort.removeEventListener('abort', end);
      if (!closed) view?.close();
    }
  }
}
