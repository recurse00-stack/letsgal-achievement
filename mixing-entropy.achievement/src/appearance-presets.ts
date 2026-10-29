import { cardAppearance, type CardAppearance } from './card-style.ts';

export type AppearanceSurface = 'card' | 'popup';
export interface AppearancePreset extends Partial<CardAppearance> {
  id: string; name: string; surface?: AppearanceSurface; isDefault?: boolean;
  nameMode?: 'stage' | 'none'; descriptionMode?: 'stage' | 'none'; iconMode?: 'stage' | 'none' | 'unknown';
  levelVisibility?: 'stage' | 'show' | 'hide'; stageNameVisibility?: 'stage' | 'show' | 'hide';
  ui?: string; durationMs?: number;
}
export function parsePresetOptions(row: Record<string, unknown>): Partial<AppearancePreset> {
  const result: Record<string, unknown> = {};
  for (const [key, values] of Object.entries({ surface: ['card', 'popup'], nameMode: ['stage', 'none'], descriptionMode: ['stage', 'none'], iconMode: ['stage', 'none', 'unknown'], levelVisibility: ['stage', 'show', 'hide'], stageNameVisibility: ['stage', 'show', 'hide'] })) {
    if (row[key] !== undefined) { if (!values.includes(String(row[key]))) throw Error('通用表现方案选项无效'); result[key] = row[key]; }
  }
  if (row.isDefault !== undefined) { if (typeof row.isDefault !== 'boolean') throw Error('默认方案标记无效'); result.isDefault = row.isDefault; }
  if (row.ui !== undefined) { if (typeof row.ui !== 'string' || (row.ui && !/^(?:ui:)?(?:@?[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(row.ui))) throw Error('通用浮现界面引用无效'); result.ui = row.ui; }
  if (row.durationMs !== undefined) { if (typeof row.durationMs !== 'number' || !Number.isFinite(row.durationMs) || (row.durationMs !== 0 && (row.durationMs < 300 || row.durationMs > 60000))) throw Error('通用浮现时长无效'); result.durationMs = row.durationMs; }
  return result;
}
export function presentationPreset(binding: AppearanceBinding, presets: readonly AppearancePreset[], levelId = '', surface?: AppearanceSurface): AppearancePreset | undefined {
  const allowed = presets.filter(p => !surface || !p.surface || p.surface === surface);
  if (binding.appearanceSource === 'default') return allowed.find(p => p.isDefault);
  const id = binding.appearanceSource === 'level' ? levelId : binding.appearanceSource === 'preset' ? binding.appearanceId : '';
  return id ? allowed.find(p => p.id === id) : undefined;
}
export interface AppearanceBinding {
  appearanceSource?: 'local' | 'preset' | 'level' | 'default';
  appearanceId?: string;
  overrideBackground?: boolean; overrideFrame?: boolean; overrideEffects?: boolean;
}
export const APPEARANCE_GROUPS = {
  background: ['backgroundMode', 'backgroundColor', 'backgroundImage', 'backgroundFit', 'backgroundColorEnd', 'backgroundAngle', 'backgroundX', 'backgroundY'],
  frame: ['frameMode', 'frameImage', 'frameColor', 'frameWidth', 'frameRadius', 'sliceTop', 'sliceRight', 'sliceBottom', 'sliceLeft', 'frameRepeat'],
  effects: ['iconEffect', 'frameEffect', 'effectTrigger', 'effectDuration'],
} as const satisfies Record<string, readonly (keyof CardAppearance)[]>;

/** Resolve before projecting to the player. No preset catalogue or inactive stage is exposed. */
export function resolveAppearance(stage: Partial<CardAppearance> & AppearanceBinding, presets: readonly AppearancePreset[], levelAppearanceId = '', surface?: AppearanceSurface): CardAppearance {
  if (!stage.appearanceSource || stage.appearanceSource === 'local') return cardAppearance(stage);
  const base = cardAppearance(presentationPreset(stage, presets, levelAppearanceId, surface) ?? {});
  const own = cardAppearance(stage);
  for (const [group, enabled] of [['background', stage.overrideBackground], ['frame', stage.overrideFrame], ['effects', stage.overrideEffects]] as const) {
    if (enabled) for (const key of APPEARANCE_GROUPS[group]) Object.assign(base, { [key]: own[key] });
  }
  return base;
}

/** Capture the currently inherited section when a creator first enables its override. */
export function copyAppearanceGroup(value: Partial<CardAppearance>, group: keyof typeof APPEARANCE_GROUPS): Partial<CardAppearance> {
  const full = cardAppearance(value);
  return Object.fromEntries(APPEARANCE_GROUPS[group].map(key => [key, full[key]]));
}
export function parseAppearanceBinding(row: Record<string, unknown>): AppearanceBinding {
  const result: AppearanceBinding = {};
  if (row.appearanceSource !== undefined) {
    if (!['local', 'preset', 'level', 'default'].includes(String(row.appearanceSource))) throw Error('阶段外观来源无效');
    result.appearanceSource = row.appearanceSource as AppearanceBinding['appearanceSource'];
  }
  if (row.appearanceId !== undefined) {
    if (typeof row.appearanceId !== 'string' || (row.appearanceId && !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(row.appearanceId))) throw Error('共用外观编号无效');
    result.appearanceId = row.appearanceId;
  }
  for (const key of ['overrideBackground', 'overrideFrame', 'overrideEffects'] as const) if (row[key] !== undefined) {
    if (typeof row[key] !== 'boolean') throw Error('外观覆盖开关必须为布尔值');
    result[key] = row[key];
  }
  return result;
}
export function appearanceInUse(id: string, levels: readonly { appearanceId?: string; popupAppearanceId?: string }[], stages: readonly AppearanceBinding[]): boolean {
  return levels.some(l => l.appearanceId === id || l.popupAppearanceId === id) || stages.some(s => s.appearanceSource === 'preset' && s.appearanceId === id);
}
