import { catalog, defaultsFor, resolveStages, type Achievement, type DisplayStage, type Level, type StageTemplate } from './model.ts';

export function localRemovalReason(item: Achievement, stages: DisplayStage[], id: string): string {
  if (!stages.some(s => s.id === id)) return '此阶段已不存在。';
  if (stages.length <= 1) return '至少保留一个可用阶段。';
  if ((item.initialStageId || 'unknown') === id) return '这是初始阶段，请先更换初始阶段。';
  return '';
}

export function removeLocalStage(item: Achievement, configured: StageTemplate[] | undefined, saved: DisplayStage[] | undefined, id: string): DisplayStage[] {
  const stages = resolveStages(item.id, configured, saved);
  const reason = localRemovalReason(item, stages, id);
  if (reason) throw new Error(reason);
  const next = (saved ?? []).filter(s => !(s.achievementId === item.id && s.id === id));
  if (defaultsFor(configured).some(s => s.id === id)) next.push({ ...stages.find(s => s.id === id)!, disabled: true });
  return next;
}

export function defaultRemovalReason(stages: StageTemplate[], items: Achievement[], overrides: DisplayStage[], id: string): string {
  if (!stages.some(s => s.id === id)) return '此阶段已不存在。';
  if (stages.length <= 1) return '至少保留一个默认阶段。';
  const count = items.filter(a => (a.initialStageId || 'unknown') === id && !overrides.some(s => s.achievementId === a.id && s.id === id && !s.disabled)).length;
  return count ? `${count} 个成就将它作为初始阶段，请先更换这些成就的初始阶段。` : '';
}

export function removeDefaultStage(stages: StageTemplate[], items: Achievement[], overrides: DisplayStage[], levels: Level[], id: string): StageTemplate[] {
  const reason = defaultRemovalReason(stages, items, overrides, id);
  if (reason) throw new Error(reason);
  const next = stages.filter(s => s.id !== id);
  catalog(levels, items, overrides, next);
  return next;
}
