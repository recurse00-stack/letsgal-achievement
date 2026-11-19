export type NotificationMode = 'sequential' | 'merged';
export type SortField = 'level' | 'stage' | 'achievement';
/** Flat structured rows: first occurrence orders rules; row order orders values. */
export interface NotificationSortRow { field: SortField; value: string }
export interface NotificationSortRule { field: SortField; values: string[] }
export interface NotificationOptions {
  mode: NotificationMode;
  durationPercent: number;
  rules: NotificationSortRule[];
  summaryUI: string;
  summaryDurationMs: number;
}
export interface NotificationRequest { id: string; stageId: string; generation: number }
export interface NotificationCandidate extends NotificationRequest { levelId: string }
export const NOTIFICATION_MODES = ['sequential', 'merged'] as const;
export const MODE_LABELS = { sequential: '连续浮现', merged: '合并浮现' };
export const SORT_LABELS = { level: '阶段等级', stage: '目标阶段', achievement: '成就' };
export function notificationMode(value: unknown): NotificationMode {
  return value === 'merged' ? 'merged' : 'sequential';
}
export function effectiveNotificationMode(defaultMode: unknown, allowSwitch: unknown, preference: unknown): NotificationMode {
  return allowSwitch === true && NOTIFICATION_MODES.includes(preference as NotificationMode)
    ? preference as NotificationMode : notificationMode(defaultMode);
}
export function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}
export function parseNotificationRules(value: unknown): NotificationSortRule[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 30000) throw Error('浮现排序规则需要结构化列表，最多 30000 项');
  const rules = new Map<SortField, NotificationSortRule>();
  for (const row of value) {
    if (!row || typeof row !== 'object' || !Object.prototype.hasOwnProperty.call(SORT_LABELS, row.field) || typeof row.value !== 'string' || row.value.length > 128) throw Error('浮现排序规则无效');
    let rule = rules.get(row.field);
    if (!rule) { rule = { field: row.field, values: [] }; rules.set(row.field, rule); }
    if (row.value && !rule.values.includes(row.value)) rule.values.push(row.value);
  }
  return [...rules.values()];
}
export function flattenNotificationRules(rules: readonly NotificationSortRule[]): NotificationSortRow[] {
  return rules.flatMap(rule => (rule.values.length ? rule.values : ['']).map(value => ({ field: rule.field, value })));
}
export function orderNotifications<T extends NotificationCandidate>(items: readonly T[], rules: readonly NotificationSortRule[]): T[] {
  const unique = new Map<string, T>();
  items.forEach(item => unique.set(item.id, item));
  const ranks = rules.map(rule => ({ field: rule.field, values: new Map(rule.values.map((id, i) => [id, i])) }));
  return [...unique.values()].map((item, index) => ({ item, index })).sort((a, b) => {
    for (const rule of ranks) {
      const key = rule.field === 'level' ? 'levelId' : rule.field === 'stage' ? 'stageId' : 'id';
      const diff = (rule.values.get(a.item[key]) ?? Infinity) - (rule.values.get(b.item[key]) ?? Infinity);
      if (diff < 0 || diff > 0) return diff;
    }
    return a.index - b.index;
  }).map(row => row.item);
}
export function notificationDuration(original: unknown, count: number, percent: number): number {
  const duration = boundedNumber(original, 3000, 300, 60000);
  return Math.max(30, Math.round(duration * (count > 1 ? boundedNumber(percent, 67, 10, 100) / 100 : 1)));
}

export interface NotificationPreferenceStore { get(key: string): unknown; set(key: string, value: string | boolean): void }
/** Public variables make a creator's settings button reflect the effective choice. */
export function publishNotificationPreference(getSetting: (key: string) => unknown, store: NotificationPreferenceStore): NotificationMode {
  const mode = effectiveNotificationMode(getSetting('notificationMode'), getSetting('allowNotificationModeSwitch'), store.get('notificationPreference'));
  store.set('notificationMode', mode);
  store.set('notificationModeLabel', MODE_LABELS[mode]);
  store.set('notificationCanSwitch', getSetting('allowNotificationModeSwitch') === true);
  return mode;
}
