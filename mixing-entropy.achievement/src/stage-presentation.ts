import { optionalAppearance, CARD_DEFAULTS, type CardAppearance } from './card-style.ts';
import { parseAppearanceBinding, presentationPreset, resolveAppearance, type AppearancePreset, type AppearanceBinding } from './appearance-presets.ts';
import { parseElementCss, resolveElementCss, type CssOwner, type ElementCssRecord } from './element-css.ts';
import type { Achievement, Catalog, Entry, StageTemplate } from './model.ts';

export type Surface = 'card' | 'popup';
export type PresentationMode = 'stage' | 'custom' | 'none';
export interface StagePresentation extends Partial<CardAppearance>, AppearanceBinding {
  achievementId: string; stageId: string; surface: Surface; mode: 'custom' | 'inherit';
  contentOverride?: boolean;
  enabled: boolean; nameMode: PresentationMode; displayName: string;
  descriptionMode: PresentationMode; description: string;
  iconMode: PresentationMode | 'unknown'; icon: string;
  showLevel: boolean; showStageName: boolean;
  ui: string; durationMs: number;
}
export function presentationKey(p: Pick<StagePresentation, 'achievementId' | 'stageId' | 'surface'>): string {
  return JSON.stringify([p.achievementId, p.stageId, p.surface]);
}
export function parsePresentations(value: unknown): StagePresentation[] {
  if (!Array.isArray(value) || value.length > 10000) throw Error('阶段表现需要结构化列表，最多 10000 项。');
  const keys = new Set<string>();
  const identifier = (v: unknown, empty = false) => typeof v === 'string' && ((empty && v === '') || /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(v));
  return value.map(raw => {
    if (!raw || typeof raw !== 'object') throw Error('阶段表现配置无效。');
    const row = raw as StagePresentation;
    if (!identifier(row.achievementId, true) || !identifier(row.stageId) || !['card', 'popup'].includes(row.surface) || !['custom', 'inherit'].includes(row.mode)) throw Error('阶段表现的所属成就、阶段或位置无效。');
    if (row.contentOverride !== undefined && typeof row.contentOverride !== 'boolean') throw Error('内容覆盖选项无效');
    const key = presentationKey(row);
    if (keys.has(key)) throw Error('同一阶段的卡片或浮现只能配置一份。');
    keys.add(key);
    for (const k of ['enabled', 'showLevel', 'showStageName'] as const) if (typeof row[k] !== 'boolean') throw Error('阶段表现开关必须为布尔值。');
    for (const k of ['nameMode', 'descriptionMode', 'iconMode'] as const) if (!['stage', 'custom', 'none', ...(k === 'iconMode' ? ['unknown'] : [])].includes(row[k])) throw Error('阶段表现的内容方式无效。');
    for (const k of ['displayName', 'description', 'icon', 'ui'] as const) if (typeof row[k] !== 'string' || row[k].length > 1000) throw Error('阶段表现内容无效或超过 1000 字符。');
    if (row.ui && !/^(?:ui:)?(?:@?[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(row.ui)) throw Error('浮现界面引用无效。');
    if (!Number.isFinite(row.durationMs) || (row.durationMs !== 0 && (row.durationMs < 300 || row.durationMs > 60000))) throw Error('浮现时长应为 300～60000 毫秒；0 表示沿用全局。');
    return { ...(row.contentOverride !== undefined ? { contentOverride: row.contentOverride } : {}), ...optionalAppearance({ ...row }), ...parseAppearanceBinding({ ...row }), achievementId: row.achievementId, stageId: row.stageId, surface: row.surface, mode: row.mode,
      enabled: row.enabled, nameMode: row.nameMode, displayName: row.displayName, descriptionMode: row.descriptionMode, description: row.description,
      iconMode: row.iconMode, icon: row.icon, showLevel: row.showLevel, showStageName: row.showStageName, ui: row.ui, durationMs: row.durationMs };
  });
}
/** Existing stage contents/looks remain the fallback; no player records are migrated. */
export function legacyPresentation(stage: StageTemplate, surface: Surface): StagePresentation {
  return { ...optionalAppearance({ ...stage }), ...parseAppearanceBinding(stage as unknown as Record<string, unknown>),
    achievementId: '', stageId: stage.id, surface, mode: 'custom', enabled: stage.visible,
    nameMode: 'stage', displayName: '', descriptionMode: 'stage', description: '', iconMode: 'stage', icon: '',
    showLevel: stage.showLevel, showStageName: stage.showStageName, ui: '', durationMs: 0 };
}
export function resolvePresentation(rows: readonly StagePresentation[], defaults: readonly StageTemplate[], stage: StageTemplate, achievementId: string, surface: Surface): StagePresentation {
  const own = achievementId ? rows.find(p => p.achievementId === achievementId && p.stageId === stage.id && p.surface === surface) : undefined;
  if (own?.mode === 'custom') return own;
  const shared = rows.find(p => !p.achievementId && p.stageId === stage.id && p.surface === surface);
  if (shared?.mode === 'custom') return shared;
  const base = own?.mode === 'inherit' ? defaults.find(s => s.id === stage.id) ?? stage : stage;
  const result = legacyPresentation(base, surface);
  const authored = (base.appearanceSource && base.appearanceSource !== 'local') || Object.entries(optionalAppearance({ ...base })).some(([k, v]) => v !== CARD_DEFAULTS[k as keyof CardAppearance]);
  return { ...result, contentOverride: false, ...(authored ? {} : { appearanceSource: 'default' }) };
}
export function levelPresetId(level: Catalog['levels'][number] | undefined, surface: Surface): string {
  return (surface === 'popup' ? level?.popupAppearanceId ?? level?.appearanceId : level?.appearanceId) ?? '';
}
export function materializePresentation(p: StagePresentation, presets: readonly AppearancePreset[], levelId = ''): StagePresentation {
  const scheme = presentationPreset(p, presets, levelId, p.surface);
  if (!scheme) return p;
  return { ...p,
    ...(p.contentOverride === false ? { nameMode: scheme.nameMode ?? 'stage', descriptionMode: scheme.descriptionMode ?? 'stage', iconMode: scheme.iconMode ?? 'stage',
      showLevel: !scheme.levelVisibility || scheme.levelVisibility === 'stage' ? p.showLevel : scheme.levelVisibility === 'show',
      showStageName: !scheme.stageNameVisibility || scheme.stageNameVisibility === 'stage' ? p.showStageName : scheme.stageNameVisibility === 'show' } : {}),
    ui: p.ui || scheme.ui || '', durationMs: p.durationMs || scheme.durationMs || 0 };
}
export function presentationCssOwners(p: StagePresentation, stage: StageTemplate, item: Pick<Achievement, 'id' | 'levelId'> | undefined, levels: Catalog['levels'], presets?: readonly AppearancePreset[]): CssOwner[] {
  const levelId = stage.levelMode === 'custom' ? stage.levelId : item?.levelId;
  const levelAppearanceId = levelPresetId(levels.find(l => l.id === levelId), p.surface);
  const appearanceId = presets ? presentationPreset(p, presets, levelAppearanceId, p.surface)?.id : (p.appearanceSource === 'preset' ? p.appearanceId : p.appearanceSource === 'level' ? levelAppearanceId : '');
  return [...(appearanceId ? [{ ownerKind: 'appearance' as const, ownerId: appearanceId, achievementId: '' }] : []),
    { ownerKind: 'defaultStage', ownerId: stage.id, achievementId: '' },
    ...(item ? [{ ownerKind: 'stage' as const, ownerId: stage.id, achievementId: item.id }] : [])];
}
/** Restoring one surface preserves the other's CSS, including formerly shared rows. */
export function resetSurfaceCss(rows: readonly ElementCssRecord[], achievementId: string, stageId: string, surface: Surface): ElementCssRecord[] {
  const matches = (r: ElementCssRecord) => r.ownerKind === 'stage' && r.achievementId === achievementId && r.ownerId === stageId;
  const other = surface === 'card' ? 'popup' as const : 'card' as const;
  const own = rows.filter(matches);
  const result = rows.filter(r => !matches(r));
  for (const target of new Set(own.map(r => r.target))) {
    const shared = own.find(r => r.target === target && r.surface === 'both');
    const specific = own.find(r => r.target === target && r.surface === other);
    if (specific?.replace || !shared) { if (specific) result.push(specific); continue; }
    if (!specific) { result.push({ ...shared, surface: other }); continue; }
    // Keep the other surface's both -> specific cascade without duplicate record keys.
    const root = parseElementCss(shared.css).clone(), frames = new Map<string, string>();
    root.walkAtRules('keyframes', r => { frames.set(r.params, `inherited-${shared.id.replace(/[^\w-]/g, '-')}-${r.params}`); r.params = frames.get(r.params)!; });
    root.walkDecls(d => { if (/^(?:-webkit-)?animation(?:-name)?$/.test(d.prop)) d.value = d.value.replace(/[A-Za-z_][\w-]*/g, name => frames.get(name) ?? name); });
    result.push({ ...specific, css: root.toString() + '\n' + specific.css, replace: shared.replace });
  }
  return result;
}
export function projectPresentation(definitions: Catalog, item: Achievement, stage: StageTemplate, surface: Surface): Entry | undefined {
  const raw = resolvePresentation(definitions.presentations ?? [], definitions.defaultStages, stage, item.id, surface);
  const level = definitions.levels.find(l => l.id === (stage.levelMode === 'custom' ? stage.levelId : item.levelId));
  const p = materializePresentation(raw, definitions.appearances ?? [], levelPresetId(level, surface));
  if (!p.enabled) return undefined;
  const content = (mode: string, base: string, custom: string) => mode === 'base' ? base : mode === 'custom' ? custom : '';
  const stageName = content(stage.nameMode, item.name, stage.displayName);
  const stageDescription = content(stage.descriptionMode, item.description, stage.description);
  const select = (mode: PresentationMode, shared: string, own: string) => mode === 'stage' ? shared : mode === 'custom' ? own : '';
  const iconMode = p.iconMode === 'stage' ? stage.iconMode : p.iconMode;
  const levelId = stage.levelMode === 'custom' ? stage.levelId : item.levelId;
  return { id: item.id, stageId: stage.id,
    name: select(p.nameMode, stageName, p.displayName), description: select(p.descriptionMode, stageDescription, p.description),
    iconMode, icon: p.iconMode === 'stage' ? content(stage.iconMode, item.icon, stage.icon) : p.iconMode === 'custom' ? p.icon : '',
    levelId: p.showLevel ? levelId : '', levelName: p.showLevel ? level?.name ?? '' : '', stageName: p.showStageName ? stage.name : '',
    appearance: resolveAppearance(p, definitions.appearances ?? [], levelPresetId(level, surface), surface),
    elementCss: resolveElementCss(definitions.elementCss ?? [], presentationCssOwners(p, stage, item, definitions.levels, definitions.appearances)).filter(r => r.surface === surface),
    ...(surface === 'popup' ? { popupUI: p.ui, popupDurationMs: p.durationMs } : {}) };
}
