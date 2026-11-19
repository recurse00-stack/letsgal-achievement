export type DefaultField = 'level' | 'card' | 'popup';
export const DEFAULT_FIELDS: DefaultField[] = ['level', 'card', 'popup'];
export type Defaults = Partial<Record<DefaultField, string>>;

// All three row kinds share one Studio setting so detach and delete commit atomically.
export interface GroupRow extends Defaults {
  id: string;
  kind: 'group' | 'member' | 'binding';
  name?: string;
  visible?: boolean;
  group?: string;
  achievement?: string;
  order?: number;
  levelGroup?: string;
  cardGroup?: string;
  popupGroup?: string;
}
export interface GroupVisibility { id: string; visible: boolean; unlocked: boolean }
export function sourceKey(field: DefaultField): 'levelGroup' | 'cardGroup' | 'popupGroup' {
  return field === 'level' ? 'levelGroup' : field === 'card' ? 'cardGroup' : 'popupGroup';
}
export function orderedGroups(rows: readonly GroupRow[]) {
  return rows.filter(row => row.kind === 'group').sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
}
export function membersOf(rows: readonly GroupRow[], group: string) {
  return rows.filter(row => row.kind === 'member' && row.group === group).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
}
export function bindingOf(rows: readonly GroupRow[], achievement: string) {
  return rows.find(row => row.kind === 'binding' && row.achievement === achievement);
}
export function effectiveDefaults(rows: readonly GroupRow[], achievement: string): Defaults {
  const binding = bindingOf(rows, achievement);
  const result: Defaults = {};
  if (binding) for (const field of DEFAULT_FIELDS) {
    const source = binding[sourceKey(field)];
    result[field] = source ? rows.find(row => row.kind === 'group' && row.id === source)?.[field] : binding[field];
  }
  return result;
}
export function updateBinding(rows: GroupRow[], achievement: string, change: Partial<GroupRow>) {
  const binding = bindingOf(rows, achievement);
  return binding ? rows.map(row => row === binding ? {...row, ...change} : row)
    : [...rows, {id:'binding:' + achievement, kind:'binding' as const, achievement, ...change}];
}
/** Freeze the current reference, not a copy of the referenced appearance. */
export function detachGroup(rows: GroupRow[], group: GroupRow, options: {achievement?:string; clear?:DefaultField} = {}) {
  return rows.flatMap((row): GroupRow[] => {
    if (options.achievement && row.achievement !== options.achievement) return [row];
    if (row.kind === 'binding') {
      const next = {...row};
      for (const field of options.clear ? [options.clear] : DEFAULT_FIELDS) {
        if (next[sourceKey(field)] !== group.id) continue;
        next[field] = group[field] ?? '';
        next[sourceKey(field)] = '';
      }
      return [next];
    }
    if (options.clear) return [row === group ? {...row,[options.clear]:''} : row];
    return row.id === group.id || (row.kind === 'member' && row.group === group.id) ? [] : [row];
  });
}
export function isGroupVisible(group: GroupRow, state: readonly GroupVisibility[]) {
  return state.find(row => row.id === group.id)?.visible ?? (group.visible !== false);
}
export function groupEntries<T extends {id:string}>(entries: T[], rows: GroupRow[], group: string) {
  if (!group) return entries;
  const index = new Map(entries.map(entry => [entry.id,entry]));
  return membersOf(rows,group).flatMap(row => {
    const entry = index.get(row.achievement ?? '');
    return entry ? [entry] : [];
  });
}
/** Validate the whole membership/source transaction after concurrent edits are rebased. */
export function validateGroups(rows: GroupRow[]) {
  if (!Array.isArray(rows)) throw Error('分组配置需要结构化列表。');
  const groups = new Map(rows.filter(g => g.kind === 'group').map(g => [g.id,g]));
  const ids = new Set<string>(), memberships = new Set<string>(), bindings = new Set<string>();
  for (const row of rows) {
    if (!row.id || ids.has(row.id)) throw Error('分组记录编号无效或重复。');
    ids.add(row.id);
    if (row.kind === 'group') continue;
    if (!row.achievement) throw Error('分组记录缺少所属成就。');
    if (row.kind === 'member') {
      const key = JSON.stringify([row.achievement,row.group]);
      if (!groups.has(row.group ?? '') || memberships.has(key)) throw Error('成员关系重复或所属分组已删除。');
      memberships.add(key);
    } else if (row.kind === 'binding' && !bindings.has(row.achievement)) bindings.add(row.achievement);
    else throw Error('来源配置无效或重复。');
  }
  for (const row of rows.filter(r => r.kind === 'binding')) for (const field of DEFAULT_FIELDS) {
    const source = row[sourceKey(field)];
    if (source && (!memberships.has(JSON.stringify([row.achievement,source])) || !groups.get(source)?.[field]))
      throw Error('成员关系或默认来源已变化，请重新选择来源组。');
  }
}
export interface TierRow { achievementId:string; stageId:string; tier:number }
export const MAX_TIER = 50000;

/** Keep saved ranks, including temporarily removed stages. Complete partial configurations on read. */
export function resolveTiers(achievementId: string, configured: TierRow[], stages: readonly { id: string }[]): TierRow[] {
  if (!configured.length) return configured;
  const known = new Set(configured.map(row => row.stageId));
  const added = stages.filter(stage => !known.has(stage.id));
  if (!added.length) return configured;
  let highest = configured.reduce((max, row) => Math.max(max, row.tier), 0);
  let result = configured;
  if (highest + added.length > MAX_TIER) {
    const ordered = [...new Set(configured.map(row => row.tier))].sort((a,b) => a-b);
    const ranks = new Map(ordered.map((tier,index) => [tier,index+1]));
    result = configured.map(row => ({...row,tier:ranks.get(row.tier)!}));
    highest = ordered.length;
  }
  return [...result, ...added.map((stage,index) => ({achievementId,stageId:stage.id,tier:highest+index+1}))];
}
export function canGainStage(configured: readonly TierRow[], target: string, acquired?: string) {
  if (!configured.length) return true;
  const next = configured.find(row => row.stageId === target);
  if (!next) return false;
  if (!acquired) return true;
  const current = configured.find(row => row.stageId === acquired);
  return !!current && next.tier > current.tier;
}
