import type { ExtensionContext, VisualUIViewHandle } from '@avg-studio/sdk';
import { AchievementError, catalog, currentStage, DEFAULT_LEVELS, entries, setDisplayStage, readInfo, type ReadField, type Entry, type StageRecord, type SteamStageBinding } from './model.ts';
import { StageProgress, type ProgressEnvelope } from './stage-progress.ts';
import { NotificationBatcher, delay } from './notification-queue.ts';
import { boundedNumber, notificationDuration, orderNotifications, parseNotificationRules, publishNotificationPreference, type NotificationOptions, type NotificationRequest, type NotificationMode } from './notification-policy.ts';
import { bindBrowseMode } from './browse-mode.ts';
import { createHorizontalCards } from './horizontal-cards.ts';
import { bindCardLayout, type CardLayoutAdapter } from './card-layout.ts';
import { authoredNavigation, localTemplatePath, templateParts, type TemplatePart } from './template-contract.ts';
import { bindPopupAppearance, type PopupAppearance } from './popup-appearance.ts';
import { makeCardSizeReference, sizeReferenceKey } from './card-size-reference.ts';

import { orderedGroups, groupEntries, isGroupVisible, type GroupRow, type GroupVisibility } from './groups.ts';
export const PAGE = '@mixing-entropy.achievement/achievements';
export const POPUP = '@mixing-entropy.achievement/achievement-popup';
export const SUMMARY = '@mixing-entropy.achievement/achievement-summary';
interface ViewSink {
  get(key: 'groupVisibility'): GroupVisibility[];
  set(key: 'groupVisibility', value: GroupVisibility[]): void;
  get(key: 'stageProgress'): unknown;
  get(key: 'browseMode' | 'notificationPreference'): string;
  set(key: 'stageProgress', value: ProgressEnvelope[]): void;
  set(key: 'browseMode' | 'notificationPreference' | 'notificationMode' | 'notificationModeLabel', value: string): void;
  set(key: 'entries' | 'notificationEntries', value: readonly Entry[]): void;
  set(key: 'notificationCount', value: number): void;
  set(key: 'notificationCanSwitch', value: boolean): void;
}
const runs = new WeakMap<AbortSignal, AchievementController>();
export function controller(ctx: ExtensionContext, sink: ViewSink): AchievementController {
  const signal = ctx.flow.signal;
  let result = runs.get(signal);
  if (!result) { result = new AchievementController(ctx, sink, signal); runs.set(signal, result); }
  else result.bindInvocation(ctx, sink);
  return result;
}
export class AchievementController {
  private readonly progress: StageProgress;
  private readonly notifications: NotificationBatcher<NotificationRequest, NotificationOptions>;
  private readonly generations = new Map<string, number>();
  private selectedGroup = '';
  private renderedGroup = '';
  private resetListPosition?: () => void;
  private groupChoices: GroupRow[] = [];
  private latest: Entry[] = [];
  private latestPopups: Entry[] = [];
  private updatePopup?: (list: Entry[]) => void;
  private tail: Promise<unknown> = Promise.resolve();
  private readonly cleanups: Array<() => void> = [];
  private page?: VisualUIViewHandle;
  private cardLayout?: CardLayoutAdapter;
  // A restored call can share the flow signal with subsequent gameplay, but its
  // save proxy retains replay write restrictions. Use the current invocation.
  bindInvocation(ctx: ExtensionContext, sink: ViewSink) {
    this.ctx = ctx;
    this.sink = sink;
  }
  constructor(private ctx: ExtensionContext, private sink: ViewSink, private readonly signal: AbortSignal) {
    this.progress = new StageProgress({
      get: key => this.sink.get(key),
      set: (key, value) => this.sink.set(key, value),
    }, () => this.assertLive(), () => this.ctx.flow.isRestoring);
    this.notifications = new NotificationBatcher(() => ({
      windowMs: boundedNumber(ctx.settings.get('notificationWindowMs'), 500, 50, 5000),
      options: {
        mode: this.publishPreference(),
        durationPercent: boundedNumber(ctx.settings.get('notificationDurationPercent'), 67, 10, 100),
        rules: parseNotificationRules(ctx.settings.get('notificationSort')),
        summaryUI: this.document('summaryUI', SUMMARY),
        summaryDurationMs: boundedNumber(ctx.settings.get('summaryDurationMs'), 3000, 300, 60000),
      },
    }), (items, options, abort) => this.playBatch(items, options, abort), error => console.error('[成就] 浮现失败，阶段记录已保留', error));
    const refresh = () => { if (!signal.aborted) void this.refresh().catch(error => console.error('[成就] 刷新失败', error)); };
    let observedGroups = JSON.stringify(sink.get('groupVisibility'));
    this.cleanups.push(ctx.subscribe('variable:changed', () => {
      const visibility = JSON.stringify(this.sink.get('groupVisibility'));
      const changed = this.progress.changed() || visibility !== observedGroups;
      observedGroups = visibility;
      if (changed) refresh();
    }));
    this.cleanups.push(...['groupCatalog','allowGroupFilter','stageTiers'].map(key => ctx.settings.subscribe(key,refresh)));
    this.cleanups.push(ctx.settings.subscribe('levels', refresh), ctx.settings.subscribe('achievements', refresh), ctx.settings.subscribe('displayStages', refresh), ctx.settings.subscribe('defaultStages', refresh), ctx.settings.subscribe('appearances', refresh), ctx.settings.subscribe('elementCss', refresh), ctx.settings.subscribe('stagePresentations', refresh), ctx.settings.subscribe('notifications', refresh), ctx.settings.subscribe('popup', refresh), ctx.settings.subscribe('durationMs', refresh));
    this.cleanups.push(ctx.settings.subscribe('notificationMode', () => this.publishPreference()), ctx.settings.subscribe('allowNotificationModeSwitch', () => this.publishPreference()));
    this.publishPreference();
    const dispose = () => { this.notifications.stop(); this.page?.close(); this.sink.set('notificationEntries', []); this.sink.set('notificationCount', 0); this.cleanups.splice(0).forEach(fn => fn()); };
    if (signal.aborted) dispose(); else signal.addEventListener('abort', dispose, { once: true });
  }
  private assertLive(): void {
    if (this.signal.aborted || this.ctx.flow.signal !== this.signal) throw new AchievementError('RUN_ENDED', '本次游戏运行已结束');
  }
  private publishPreference(): NotificationMode {
    return publishNotificationPreference(key => this.ctx.settings.get(key), {
      get: () => this.sink.get('notificationPreference'),
      set: (key, value) => {
        if (key === 'notificationCanSwitch') this.sink.set(key, value === true);
        else this.sink.set(key as 'notificationMode' | 'notificationModeLabel', String(value));
      },
    });
  }
  notificationMode(action = 'read'): NotificationMode {
    this.assertLive();
    if (!['read', 'sequential', 'merged', 'toggle', 'default'].includes(action)) throw new AchievementError('INVALID_DATA', '浮现方式操作无效');
    const current = this.publishPreference();
    if (action !== 'read' && !this.ctx.flow.isRestoring && this.ctx.settings.get('allowNotificationModeSwitch') === true) {
      this.sink.set('notificationPreference', action === 'default' ? '' : action === 'toggle' ? (current === 'merged' ? 'sequential' : 'merged') : action);
    }
    return this.publishPreference();
  }
  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const task = this.tail.then(() => { this.assertLive(); return fn(); });
    this.tail = task.catch(() => undefined);
    return task;
  }
  private definitions() {
    const levels = this.ctx.settings.get<unknown[]>('levels') ?? [];
    return catalog(levels.length ? levels : DEFAULT_LEVELS, this.ctx.settings.get('achievements') ?? [], this.ctx.settings.get('displayStages') ?? [], this.ctx.settings.get('defaultStages') ?? [], this.ctx.settings.get('appearances') ?? [], this.ctx.settings.get('elementCss') ?? [], this.ctx.settings.get('stagePresentations') ?? [], this.ctx.settings.get('groupCatalog') ?? [], this.ctx.settings.get('stageTiers') ?? []);
  }
  private async read() {
    const definitions = this.definitions();
    const records = await this.progress.read();
    this.assertLive();
    return { definitions, records };
  }
  private publish(definitions: ReturnType<typeof catalog>, records: StageRecord[]): Entry[] {
    this.assertLive();
    const prepare = (surface: 'card' | 'popup') => entries(definitions, records, surface).map(item => ({ ...item,
      icon: item.iconMode === 'unknown' ? 'extension-asset://mixing-entropy.achievement/assets/achievement-unknown.svg' : item.iconMode === 'base' ? item.icon || 'extension-asset://mixing-entropy.achievement/assets/achievement.svg' : item.icon,
      frame: item.appearance?.frameMode === 'nineSlice' && item.appearance.frameImage ? item.appearance.frameImage : `extension-asset://mixing-entropy.achievement/assets/frame-${['bronze', 'silver', 'gold'].includes(item.levelId) ? item.levelId : 'neutral'}.svg`,
      cardBackground: item.appearance?.backgroundMode === 'image' && item.appearance.backgroundImage ? item.appearance.backgroundImage : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E',
    }));
    const result = prepare('card');
    this.latest = this.filterCards(result, definitions.groups ?? []);
    this.latestPopups = prepare('popup');
    this.sink.set('entries', this.latest);
    this.updatePopup?.(this.latestPopups);
    this.cardLayout?.refresh();
    return result;
  }
  private filterCards(cards: Entry[], rows: GroupRow[]) {
    const button = this.page?.get('achievement-group-filter');
    const enabled = this.ctx.settings.get('allowGroupFilter') === true;
    this.groupChoices = enabled && button ? orderedGroups(rows).filter(g => isGroupVisible(g,this.sink.get('groupVisibility') ?? [])) : [];
    const group = this.groupChoices.find(g => g.id === this.selectedGroup);
    this.selectedGroup = group?.id ?? '';
    if (this.selectedGroup !== this.renderedGroup) {
      this.renderedGroup = this.selectedGroup;
      this.resetListPosition?.();
    }
    button?.setHidden(!this.groupChoices.length);
    button?.setProps({text:'分组 · ' + (group?.name ?? '全部')});
    return groupEntries(cards,rows,this.selectedGroup);
  }
  setGroupVisible(id:string, visible:boolean): Promise<void> {
    return this.serial(async () => {
      if (this.ctx.flow.isRestoring) return;
      const {definitions, records} = await this.read();
      const group = definitions.groups?.find(row => row.kind === 'group' && row.id === id);
      if (!group || typeof visible !== 'boolean') throw new AchievementError('INVALID_DATA','请选择有效分组及可见性。');
      const state = this.sink.get('groupVisibility') ?? [];
      const previous = state.find(row => row.id === id);
      const unlocked = visible || (previous?.unlocked ?? (group.visible !== false));
      if (!previous || previous.visible !== visible || previous.unlocked !== unlocked)
        this.sink.set('groupVisibility',[...state.filter(row => row.id !== id),{id,visible,unlocked}]);
      this.publish(definitions,records);
    });
  }
  refresh(): Promise<void> {
    return this.serial(async () => { const { definitions, records } = await this.read(); this.publish(definitions, records); });
  }
  readInfo(id: string, field: ReadField): Promise<string> {
    return this.serial(async () => { const { definitions, records } = await this.read(); return readInfo(definitions, records, id, field); });
  }
  setStage(id: string, target: string, expected = '', notify = false, steam?: ExtensionContext['steam']): Promise<boolean> {
    const invocation = this.ctx;
    const restoring = invocation.flow.isRestoring;
    return this.serial(async () => {
      if (typeof expected !== 'string' || typeof notify !== 'boolean') throw new AchievementError('INVALID_DATA', '阶段方法参数无效');
      const { definitions, records } = await this.read();
      if (restoring || invocation.flow.isRestoring || this.ctx.flow.isRestoring) { this.publish(definitions, records); return false; }
      const change = setDisplayStage(definitions, records, id, target, expected);
      if (!change.matched) return false;
      // Persist even an equal default stage once, so later author default edits cannot move it.
      const gained = change.changed || !records.some(r => r.id === id);
      if (gained) this.progress.replace(records, change.records);
      if (change.changed) this.generations.set(id, (this.generations.get(id) ?? 0) + 1);
      this.publish(definitions, change.records);
      if (change.changed && notify && this.ctx.settings.get('notifications') !== false && this.latestPopups.some(r => r.id === id)) this.notifications.enqueue({ id, stageId: target, generation: this.generations.get(id)! });
      if (gained && steam) {
        const bindings = invocation.settings.get<SteamStageBinding[]>('steamAchievements') ?? [];
        const binding = Array.isArray(bindings) && bindings.find(row => row?.achievementId === id && row.stageId === target);
        const apiName = binding && typeof binding.apiName === 'string' ? binding.apiName.trim() : '';
        if (apiName) void this.unlockSteam(steam, apiName);
      }
      return true;
    });
  }
  private async unlockSteam(steam: ExtensionContext['steam'], apiName: string): Promise<void> {
    try {
      if (!steam.isAvailable()) return;
      const result = await steam.achievements.unlock(apiName);
      if (!result.ok && result.reason !== 'unavailable')
        console.warn('[成就] Steam 解锁失败', apiName, result.reason, result.message ?? '');
    } catch (error) {
      console.warn('[成就] Steam 解锁失败', apiName, error);
    }
  }
  getStage(id: string): Promise<string> {
    return this.serial(async () => { const { definitions, records } = await this.read(); return currentStage(definitions, records, id); });
  }
  async openPage(): Promise<void> {
    await this.refresh();
    this.assertLive();
    if (this.page) return;
    const name = this.document('page', PAGE);
    const document = await this.authoredPage(name);
    this.assertLive();
    const page = await this.ctx.visualUI.open(name, { modal: true });
    if (this.signal.aborted) { page.close(); return; }
    this.page = page;
    this.selectedGroup = '';
    this.renderedGroup = '';
    // Remount just the native result list so its pagination and both scroll axes start fresh.
    const list = page.get('achievement-list');
    let resetFrame = 0;
    this.resetListPosition = () => {
      if (!list || typeof requestAnimationFrame !== 'function' || resetFrame) return;
      list.setHidden(true);
      resetFrame = requestAnimationFrame(() => {
        resetFrame = requestAnimationFrame(() => {
          resetFrame = 0;
          if (this.page === page) list.setHidden(false);
        });
      });
    };
    const detachGroupFilter = page.get('achievement-group-filter')?.on('click', () => {
      const options = ['', ...this.groupChoices.map(group => group.id)];
      this.selectedGroup = options[(options.indexOf(this.selectedGroup) + 1) % options.length];
      void this.refresh().catch(error => console.error('[成就] 分组筛选失败',error));
    });
    let template: TemplatePart[] = [];
    if (document) {
      try { template = templateParts(document); }
      catch (error) { console.warn('[成就] 卡片外观与尺寸参考未接入，保留原生模板：', error); }
    }
    let sizeKey = '', sizeTimer: ReturnType<typeof setTimeout> | undefined;
    const cardLayout = bindCardLayout(() => this.latest, template, size => {
      const reference = makeCardSizeReference(document, name, size);
      if (!reference || sizeReferenceKey(reference) === sizeKey) return;
      sizeKey = sizeReferenceKey(reference);
      clearTimeout(sizeTimer);
      sizeTimer = setTimeout(() => {
        if (this.signal.aborted || this.page !== page) return;
        try { this.ctx.settings.set('cardSizeReference', [reference]); }
        catch (error) { console.warn('[成就] 尺寸参考保存失败，页面仍可正常使用：', error); }
      }, 250);
    });
    this.cardLayout = cardLayout;
    const stopBrowsing = bindBrowseMode(page, {
      read: () => this.sink.get('browseMode'),
      write: mode => { this.assertLive(); this.sink.set('browseMode', mode); },
    }, {
      authoredMode: authoredNavigation(document),
      scrollDirection: this.ctx.settings.get('scrollDirection'),
      allowPlayerSwitch: this.ctx.settings.get('allowPlayerSwitch'),
      allowPagination: this.ctx.settings.get('allowPagination'),
      allowVertical: this.ctx.settings.get('allowVertical'),
      allowHorizontal: this.ctx.settings.get('allowHorizontal'),
    }, createHorizontalCards(page.get('achievement-list'), cardLayout.css));
    page.onClose(() => {
      detachGroupFilter?.();
      if (resetFrame) cancelAnimationFrame(resetFrame);
      clearTimeout(sizeTimer);
      cardLayout.dispose();
      stopBrowsing();
      if (this.cardLayout === cardLayout) this.cardLayout = undefined;
      if (this.page === page) {
        this.page = undefined;
        this.resetListPosition = undefined;
        this.selectedGroup = '';
        this.renderedGroup = '';
        if (!this.signal.aborted) void this.refresh().catch(error => console.error('[成就] 页面关闭后刷新失败',error));
      }
    });
    await this.refresh();
  }
  private async authoredPage(name: string): Promise<unknown> {
    const path = localTemplatePath(name);
    if (!path || !this.ctx.extensionResource) return undefined;
    try {
      const response = await fetch(this.ctx.extensionResource.url(path), { signal: AbortSignal.any([this.signal, AbortSignal.timeout(3000)]), cache: 'no-store' });
      if (!response.ok) throw Error(`模板资源读取失败：${response.status}`);
      return await response.json();
    } catch (error) {
      if (!this.signal.aborted) console.warn('[成就] 无法读取页面配置，保留官方页面原有编排和浏览方式：', error);
      return undefined;
    }
  }
  private document(key: string, fallback: string, override = ''): string {
    let value = (override || this.ctx.settings.get<string>(key) || fallback).replace(/^ui:/, '');
    if (value.includes('/') && !value.startsWith('@')) value = '@' + value;
    if (!/^(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(value)) throw new AchievementError('INVALID_UI', `${key} 需要可视化界面的文件名或 @扩展编号/文件名`);
    return value;
  }
  private eligible(request: NotificationRequest, list: Entry[]): Entry | undefined {
    return this.ctx.settings.get('notifications') === false || request.generation !== this.generations.get(request.id)
      ? undefined : list.find(row => row.id === request.id && row.stageId === request.stageId);
  }
  private async playBatch(requests: readonly NotificationRequest[], options: NotificationOptions, abort: AbortSignal): Promise<void> {
    if (abort.aborted || this.signal.aborted) return;
    await this.refresh();
    const definitions = this.definitions();
    const batch = orderNotifications(requests.filter(item => this.eligible(item, this.latestPopups)).map(item => ({
      ...item, levelId: readInfo(definitions, [{ id: item.id, stageId: item.stageId }], item.id, 'levelId'),
    })), options.rules);
    if (abort.aborted || !batch.length) return;
    // Membership, ordering, mode and shortening factor are fixed before any view opens.
    if (options.mode === 'merged' && batch.length > 1) { await this.summary(batch, options, abort); return; }
    for (const item of batch) {
      if (abort.aborted || this.signal.aborted) return;
      try { await this.popup(item, abort, batch.length, options.durationPercent); }
      catch (error) { if (!abort.aborted) console.error('[成就] 浮现失败，继续播放下一条', error); }
    }
  }
  private async summary(batch: readonly NotificationRequest[], options: NotificationOptions, abort: AbortSignal): Promise<void> {
    let view: VisualUIViewHandle | undefined;
    let ended = false;
    let finish = () => {};
    const closed = new Promise<void>(resolve => { finish = resolve; });
    const timer = new AbortController();
    const update = (list: Entry[]) => {
      const items = batch.flatMap(request => { const row = this.eligible(request, list); return row ? [row] : []; });
      this.sink.set('notificationEntries', items);
      this.sink.set('notificationCount', items.length);
      if (!items.length) { ended = true; if (view) view.close(); else finish(); }
    };
    this.updatePopup = update;
    let detach = () => {};
    const end = () => { ended = true; view?.close(); finish(); };
    abort.addEventListener('abort', end, { once: true });
    try {
      update(this.latestPopups);
      if (ended || abort.aborted) return;
      view = await this.ctx.visualUI.open(options.summaryUI, { modal: false, interactable: false, pointerEventsPassthrough: true, closeOnContextMenu: false });
      if (ended || abort.aborted || this.signal.aborted) return;
      detach = view.onClose(() => { ended = true; finish(); });
      await Promise.race([delay(options.summaryDurationMs, timer.signal), closed]);
      if (!ended) view.close();
      if (!abort.aborted) await closed;
    } finally {
      timer.abort(); abort.removeEventListener('abort', end); detach();
      if (this.updatePopup === update) this.updatePopup = undefined;
      view?.close();
      if (this.ctx.flow.signal === this.signal) { this.sink.set('notificationEntries', []); this.sink.set('notificationCount', 0); }
    }
  }
  private async popup(request: NotificationRequest, abort: AbortSignal, batchSize: number, percent: number): Promise<void> {
    if (abort.aborted || this.signal.aborted) return;
    // Read current content at playback; discard stale stage notifications.
    await this.refresh();
    const eligible = (list: Entry[]) => this.eligible(request, list);
    if (abort.aborted || !eligible(this.latestPopups) || this.ctx.settings.get('notifications') === false) return;
    const name = this.document('popup', POPUP, eligible(this.latestPopups)?.popupUI);
    const requestedDuration = eligible(this.latestPopups)?.popupDurationMs || this.ctx.settings.get<number>('durationMs');
    const popupDocument = await this.authoredPage(name);
    if (abort.aborted || this.signal.aborted || !eligible(this.latestPopups)) return;
    let appearance: PopupAppearance | undefined;
    let appearanceView: VisualUIViewHandle | undefined;
    const bind = (view: VisualUIViewHandle) => {
      const item = eligible(this.latestPopups);
      if (!item) return;
      view.get('achievement-label')?.setProps({ text: '成就展示已更新' });
      view.get('achievement-name')?.setProps({ text: item.name });
      // Stage content is shared by default; popup overrides never alter cards.
      view.get('achievement-description')?.setProps({ text: item.description });
      view.get('achievement-level')?.setProps({ text: item.levelName });
      view.get('achievement-stage')?.setProps({ text: item.stageName });
      view.get('achievement-icon')?.setProps({ asset: item.icon });
      if (appearanceView !== view) {
        appearance?.dispose(); appearanceView = view;
        appearance = bindPopupAppearance(view, popupDocument, () => eligible(this.latestPopups), asset => this.ctx.asset.resolve(asset).url);
      } else appearance?.refresh();
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
      if (!eligible(list) || this.document('popup', POPUP, eligible(list)?.popupUI) !== name || (eligible(list)?.popupDurationMs || this.ctx.settings.get<number>('durationMs')) !== requestedDuration) { suppressed = true; if (view) view.close(); else end(); }
      else if (view && !suppressed) bind(view);
    };
    this.updatePopup = update;
    abort.addEventListener('abort', end, { once: true });
    try {
      view = await this.ctx.visualUI.open(name, { modal: false, interactable: false, pointerEventsPassthrough: true, closeOnContextMenu: false });
      if (abort.aborted || this.signal.aborted || suppressed || !eligible(this.latestPopups)) return;
      bind(view);
      detachClose = view.onClose(() => { closed = true; resolveClosed(); });
      const duration = notificationDuration(requestedDuration, batchSize, percent);
      await Promise.race([delay(duration, timerAbort.signal), closedPromise]);
      if (!closed) view.close();
      if (!abort.aborted) await closedPromise;
    } finally {
      // This instance is closing/discarded. Remove DOM ownership without calling
      // setStyle on a closed official handle; the next instance reads its resource.
      appearance?.dispose(false);
      timerAbort.abort();
      if (this.updatePopup === update) this.updatePopup = undefined;
      detach(); detachClose(); abort.removeEventListener('abort', end);
      if (!closed) view?.close();
    }
  }
}
