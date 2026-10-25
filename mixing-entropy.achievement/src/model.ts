export interface Level { id: string; name: string }
export interface Achievement { id: string; name: string; icon: string; levelId: string }
export interface Activation { id: string; active: boolean }
export interface Entry extends Achievement { levelName: string; active: boolean; status: string }
export interface Catalog { levels: Level[]; achievements: Achievement[] }

export class AchievementError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'AchievementError'; }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AchievementError('INVALID_DATA', '需要结构化对象');
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > 1000) throw new AchievementError('INVALID_DATA', `${label}无效`);
  return value;
}
function id(value: unknown): string {
  const result = text(value, '编号');
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(result)) throw new AchievementError('INVALID_ID', '编号使用字母、数字、点、横线或下划线，最长 128 个字符');
  return result;
}
function rows(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 10000) throw new AchievementError('INVALID_DATA', '记录应为不超过 10000 行的数组');
  return value;
}
function unique<T extends { id: string }>(values: T[], label: string): T[] {
  if (new Set(values.map(value => value.id)).size !== values.length) throw new AchievementError('DUPLICATE_ID', `${label}编号重复`);
  return values;
}

export const DEFAULT_LEVELS: Level[] = [{ id: 'bronze', name: '铜' }, { id: 'silver', name: '银' }, { id: 'gold', name: '金' }];

export function catalog(levelValues: unknown, achievementValues: unknown): Catalog {
  const levels = unique(rows(levelValues).map(value => { const row = object(value); return { id: id(row.id), name: text(row.name, '等级名称') }; }), '等级');
  const achievements = unique(rows(achievementValues).map(value => {
    const row = object(value);
    const achievement = { id: id(row.id), name: text(row.name, '成就名称'), icon: text(row.icon ?? '', '图标', true), levelId: id(row.levelId) };
    if (!levels.some(level => level.id === achievement.levelId)) throw new AchievementError('LEVEL_NOT_FOUND', `成就 ${achievement.id} 的等级不存在`);
    return achievement;
  }), '成就');
  return { levels, achievements };
}

export function activations(value: unknown): Activation[] {
  return unique(rows(value).map(value => {
    const row = object(value);
    if (typeof row.active !== 'boolean') throw new AchievementError('INVALID_DATA', '激活状态必须为布尔值');
    return { id: id(row.id), active: row.active };
  }), '激活记录');
}

export function entries(definitions: Catalog, records: readonly Activation[]): Entry[] {
  const active = new Map(records.map(row => [row.id, row.active]));
  const names = new Map(definitions.levels.map(level => [level.id, level.name]));
  return definitions.achievements.map(row => ({ ...row, levelName: names.get(row.levelId)!, active: active.get(row.id) ?? false, status: active.get(row.id) ? '已激活' : '未激活' }));
}

export function setActivation(definitions: Catalog, records: readonly Activation[], achievementId: string, active: boolean) {
  if (typeof active !== 'boolean') throw new AchievementError('INVALID_DATA', '激活状态必须为布尔值');
  const item = definitions.achievements.find(row => row.id === achievementId);
  if (!item) throw new AchievementError('NOT_FOUND', `找不到成就：${achievementId}`);
  const previous = records.find(row => row.id === achievementId)?.active ?? false;
  if (previous === active) return { changed: false, activated: false, records: records.map(row => ({ ...row })) };
  // Preserve records for temporarily removed definitions; never rename identities from labels.
  const next = records.filter(row => row.id !== achievementId).map(row => ({ ...row }));
  next.push({ id: achievementId, active });
  return { changed: true, activated: active, records: next };
}
