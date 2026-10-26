export interface Level { id: string; name: string }
export interface Achievement { id: string; name: string; description: string; icon: string; levelId: string; initialStageId: string }
export type ContentMode = 'base' | 'custom' | 'none';
export interface StageTemplate {
  id: string; name: string; visible: boolean;
  nameMode: ContentMode; displayName: string;
  descriptionMode: ContentMode; description: string;
  iconMode: ContentMode | 'unknown'; icon: string;
  levelMode: 'base' | 'custom'; levelId: string;
  showLevel: boolean; showStageName: boolean;
}
export interface DisplayStage extends StageTemplate { achievementId: string; disabled?: boolean }
export interface StageRecord { id: string; stageId: string }
// A whitelist, not a spread of author data: no unrevealed fields/stage definitions reach cards.
export interface Entry { id: string; name: string; description: string; icon: string; iconMode: DisplayStage['iconMode']; levelId: string; levelName: string; stageId: string; stageName: string }
export interface Catalog { levels: Level[]; achievements: Achievement[]; stages: DisplayStage[]; defaultStages: StageTemplate[] }

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

export function presetStages(achievementId: string): DisplayStage[] {
  const base: DisplayStage = { achievementId, id: 'unknown', name: '未激活', visible: true, nameMode: 'custom', displayName: '？？？', descriptionMode: 'custom', description: '？？？', iconMode: 'unknown', icon: '', levelMode: 'base', levelId: '', showLevel: false, showStageName: false };
  return [{ ...base, id: 'hidden', name: '隐藏', visible: false }, base,
    { ...base, id: 'revealed', name: '已激活', nameMode: 'base', descriptionMode: 'base', iconMode: 'base', showLevel: true }];
}
function bool(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new AchievementError('INVALID_DATA', '阶段开关必须为布尔值');
  return value;
}
function mode(value: unknown, icon = false): ContentMode | 'unknown' {
  const result = value ?? 'none';
  if (result === 'base' || result === 'custom' || result === 'none' || (icon && result === 'unknown')) return result;
  throw new AchievementError('INVALID_DATA', '阶段内容来源无效');
}
export function catalog(levelValues: unknown, achievementValues: unknown, stageValues: unknown = [], defaultStageValues: unknown = []): Catalog {
  const levels = unique(rows(levelValues).map(value => { const row = object(value); return { id: id(row.id), name: text(row.name, '等级名称') }; }), '等级');
  const achievements = unique(rows(achievementValues).map(value => {
    const row = object(value);
    const achievement: Achievement = { id: id(row.id), name: text(row.name, '成就名称'), description: text(row.description ?? '', '成就说明', true), icon: text(row.icon ?? '', '图标', true), levelId: id(row.levelId), initialStageId: row.initialStageId ? id(row.initialStageId) : 'unknown' };
    if (!levels.some(level => level.id === achievement.levelId)) throw new AchievementError('LEVEL_NOT_FOUND', `成就 ${achievement.id} 的等级不存在`);
    return achievement;
  }), '成就');
  const parseStage = (value: unknown): StageTemplate => {
    const row = object(value);
    const levelMode = row.levelMode ?? 'base';
    if (levelMode !== 'base' && levelMode !== 'custom') throw new AchievementError('INVALID_DATA', '阶段等级方式无效');
    const levelId = row.levelId ? id(row.levelId) : '';
    if (levelMode === 'custom' && !levels.some(level => level.id === levelId)) throw new AchievementError('LEVEL_NOT_FOUND', `阶段 ${row.id} 的等级不存在`);
    return { id: id(row.id), name: text(row.name, '阶段名称'), visible: bool(row.visible, true),
      nameMode: mode(row.nameMode) as ContentMode, displayName: text(row.displayName ?? '', '阶段显示名称', true),
      descriptionMode: mode(row.descriptionMode) as ContentMode, description: text(row.description ?? '', '阶段说明', true),
      iconMode: mode(row.iconMode, true), icon: text(row.icon ?? '', '阶段图标', true), levelMode: levelMode as DisplayStage['levelMode'], levelId, showLevel: bool(row.showLevel, false), showStageName: bool(row.showStageName, false) };
  };
  const defaultStages = unique(defaultsFor(rows(defaultStageValues).map(parseStage)), '默认阶段');
  const stages = rows(stageValues).map(value => {
    const row = object(value);
    const achievementId = id(row.achievementId);
    const disabled = bool(row.disabled, false);
    // A removal marker has no display contents or level dependency.
    if (disabled) return { ...presetStages(achievementId)[1], id: id(row.id), disabled: true };
    return { ...parseStage(row), achievementId, disabled: false };
  });
  if (new Set(stages.map(s => s.achievementId + '/' + s.id)).size !== stages.length) throw new AchievementError('DUPLICATE_ID', '同一成就的阶段编号重复');
  const result = { levels, achievements, stages, defaultStages };
  for (const item of achievements) if (item.initialStageId && !stagesFor(result, item.id).some(s => s.id === item.initialStageId)) throw new AchievementError('STAGE_NOT_FOUND', `成就 ${item.id} 的初始阶段不存在`);
  // Orphan stage definitions are retained for temporarily removed achievements.
  return result;
}

/** Empty shared configuration uses the shipped presets, just like default levels. */
export function defaultsFor(configured: readonly StageTemplate[] = []): StageTemplate[] {
  return configured.length ? [...configured] : presetStages('').map(({ achievementId: _owner, ...stage }) => stage);
}

/** Shared by runtime and both editor selectors; local removal wins over defaults. */
export function resolveStages(achievementId: string, configured: readonly StageTemplate[] = [], overrides: readonly DisplayStage[] = []): DisplayStage[] {
  const all = new Map(defaultsFor(configured).map(s => [s.id, { ...s, achievementId }]));
  for (const stage of overrides) if (stage.achievementId === achievementId) {
    if (stage.disabled) all.delete(stage.id);
    else all.set(stage.id, stage);
  }
  return [...all.values()];
}
export function stagesFor(definitions: Catalog, achievementId: string): DisplayStage[] {
  if (!definitions.achievements.some(item => item.id === achievementId)) return [];
  return resolveStages(achievementId, definitions.defaultStages, definitions.stages);
}
export function currentStage(definitions: Catalog, records: readonly StageRecord[], achievementId: string): string {
  const item = definitions.achievements.find(row => row.id === achievementId);
  if (!item) throw new AchievementError('NOT_FOUND', `找不到成就：${achievementId}`);
  const saved = records.find(row => row.id === achievementId);
  return saved?.stageId ?? item.initialStageId;
}

export function stageRecords(value: unknown): StageRecord[] {
  return unique(rows(value).map(value => {
    const row = object(value);
    if (typeof row.stageId !== 'string' || !row.stageId.trim()) throw new AchievementError('INVALID_DATA', '记录缺少展示阶段编号，请使用新版阶段记录表');
    return { id: id(row.id), stageId: id(row.stageId) };
  }), '阶段记录');
}

export function entries(definitions: Catalog, records: readonly StageRecord[]): Entry[] {
  const names = new Map(definitions.levels.map(level => [level.id, level.name]));
  return definitions.achievements.flatMap(row => {
    const stageId = currentStage(definitions, records, row.id);
    const stage = stagesFor(definitions, row.id).find(s => s.id === stageId);
    // Deleted/unknown saved stages fail closed, never fall back to the full definition.
    if (!stage?.visible) return [];
    const levelId = stage.levelMode === 'custom' ? stage.levelId : row.levelId;
    const content = (source: ContentMode, base: string, custom: string) => source === 'base' ? base : source === 'custom' ? custom : '';
    return [{ id: row.id, name: content(stage.nameMode, row.name, stage.displayName), description: content(stage.descriptionMode, row.description, stage.description),
      icon: stage.iconMode === 'base' ? row.icon : stage.iconMode === 'custom' ? stage.icon : '', iconMode: stage.iconMode,
      levelId: stage.showLevel ? levelId : '', levelName: stage.showLevel ? names.get(levelId)! : '',
      stageId, stageName: stage.showStageName ? stage.name : '' }];
  });
}

export function setDisplayStage(definitions: Catalog, records: readonly StageRecord[], achievementId: string, target: string, expected = '') {
  if (typeof expected !== 'string') throw new AchievementError('INVALID_DATA', '预期阶段必须为文本');
  const previous = currentStage(definitions, records, achievementId);
  if (!stagesFor(definitions, achievementId).some(s => s.id === target)) throw new AchievementError('STAGE_NOT_FOUND', `找不到展示阶段：${target}`);
  if (expected && previous !== expected) return { changed: false, matched: false, records: records.map(r => ({ ...r })) };
  const next = records.filter(r => r.id !== achievementId).map(r => ({ ...r }));
  next.push({ id: achievementId, stageId: target });
  return { changed: previous !== target, matched: true, records: next };
}

export type ReadField = 'stageId' | 'stageName' | 'levelId' | 'levelName';

/** Author query. Unlike player projection, this can read a deliberately hidden level. */
export function readInfo(definitions: Catalog, records: readonly StageRecord[], achievementId: string, field: ReadField): string {
  const stageId = currentStage(definitions, records, achievementId);
  const stage = stagesFor(definitions, achievementId).find(s => s.id === stageId);
  const item = definitions.achievements.find(a => a.id === achievementId)!;
  const levelId = stage ? (stage.levelMode === 'custom' ? stage.levelId : item.levelId) : '';
  switch (field) {
    case 'stageId': return stageId;
    case 'stageName': return stage?.name ?? '';
    case 'levelId': return levelId;
    case 'levelName': return definitions.levels.find(l => l.id === levelId)?.name ?? '';
    default: throw new AchievementError('INVALID_DATA', '读取项目无效');
  }
}
