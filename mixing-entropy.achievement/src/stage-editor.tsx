import { useState } from 'react';
import { AssetPicker, Button, Select, Switch } from '@avg-studio/studio-ui';
import { catalog, DEFAULT_LEVELS, defaultsFor, presetStages, resolveStages, type Level, type Achievement, type DisplayStage, type StageTemplate, type SteamStageBinding } from './model';
import { SurfaceEditor } from './stage-presentation-editor';
import { defaultRemovalReason, localRemovalReason, removeDefaultStage, removeLocalStage } from './stage-removal';
import { EditorScope, useEditorState, useSetting } from './editor-session';
import { FieldRow, Section, TextInput, ObjectList, Workspace, Tabs } from './editor-primitives';
import { useNavigation, useSelection } from './editor-navigation';
import { ContentPreview } from './editor-preview';
import { TierEditor } from './group-editor';
import { StagePicker } from './stage-picker';
import { resolveTiers, type TierRow } from './groups';

// Pin existing implicit ranks before editing the stage lists. If the subsequent stage
// write is refused, this preparation still describes exactly the previous configuration.
function usePreserveTiers(defaults?: StageTemplate[], overrides?: DisplayStage[], onlyAchievement?: string) {
  const [saved, save] = useSetting<TierRow[]>('main.stageTiers');
  return () => {
    const byAchievement = new Map<string,TierRow[]>();
    for (const row of saved ?? []) {
      if (onlyAchievement && row.achievementId !== onlyAchievement) continue;
      const own = byAchievement.get(row.achievementId);
      if (own) own.push(row);
      else byAchievement.set(row.achievementId,[row]);
    }
    const changed = new Map<string,TierRow[]>();
    for (const [id,own] of byAchievement) {
      const resolved = resolveTiers(id,own,resolveStages(id,defaults,overrides));
      if (resolved !== own) changed.set(id,resolved);
    }
    if (!changed.size) return true;
    return save([...(saved ?? []).filter(row => !changed.has(row.achievementId)), ...Array.from(changed.values()).flat()]);
  };
}
const contentOptions = [{ value: 'base', label: '使用成就基础配置' }, { value: 'custom', label: '本阶段自定义' }, { value: 'none', label: '不显示' }];
function SteamAchievementField({ achievementId, stageId }: { achievementId: string; stageId: string }) {
  const [bindings, save] = useSetting<SteamStageBinding[]>('main.steamAchievements');
  const rows = bindings ?? [];
  const matches = (row: SteamStageBinding) => row.achievementId === achievementId && row.stageId === stageId;
  const update = (raw: string) => {
    const apiName = raw.trim();
    const next = rows.filter(row => !matches(row));
    if (apiName) next.push({ achievementId, stageId, apiName });
    return save(next);
  };
  return <FieldRow label="关联 Steam 成就" description="选填 Steamworks 中的 API Name。剧情获得本阶段时解锁。">
    <TextInput value={rows.find(matches)?.apiName ?? ''} onChange={update} />
  </FieldRow>;
}
function StageFields({ stage, patch, levels, item }: { stage: StageTemplate; patch: (value: Partial<StageTemplate>) => boolean; levels: Level[]; item?: Achievement }) {
  const [tab, setTab] = useSelection('surface:' + (item?.id ?? '') + ':' + stage.id, 'content');
  return <><Tabs label="阶段编辑区" value={tab} onChange={setTab} items={[{ id: 'content', name: '阶段内容' }, { id: 'card', name: '卡片' }, { id: 'popup', name: '浮现' }]} />
    <div className="aw-stage-grid"><div>{tab === 'content' ? <Section title="阶段内容">
      <FieldRow label="阶段名称"><TextInput required value={stage.name} onChange={name => patch({ name })} /></FieldRow>
      {item && <SteamAchievementField achievementId={item.id} stageId={stage.id} />}
      <FieldRow label="本阶段等级"><Select value={stage.levelMode ?? 'base'} options={[{ value: 'base', label: '使用成就基础等级' }, { value: 'custom', label: '指定本阶段等级' }]} onChange={value => patch({ levelMode: value as StageTemplate['levelMode'], ...(value === 'custom' && !levels.some(l => l.id === stage.levelId) ? { levelId: item?.levelId || levels[0]?.id || 'bronze' } : {}) })} />
        {stage.levelMode === 'custom' && <Select value={stage.levelId} options={levels.map(l => ({ value: l.id, label: l.name }))} onChange={levelId => patch({ levelId })} />}</FieldRow>
      {(['name', 'description', 'icon'] as const).map(field => {
        const modeKey = field === 'name' ? 'nameMode' : field === 'description' ? 'descriptionMode' : 'iconMode', valueKey = field === 'name' ? 'displayName' : field;
        return <FieldRow key={field} label={{ name: '名称显示', description: '说明显示', icon: '图标显示' }[field]}>
          <Select value={stage[modeKey]} options={[...contentOptions, ...(field === 'icon' ? [{ value: 'unknown', label: '默认未知图标' }] : [])]} onChange={value => patch({ [modeKey]: value })} />
          {stage[modeKey] === 'base' && <p className="aw-note">来源：成就基础配置 · {item?.[field] || '对应成就的基础内容'}</p>}
          {stage[modeKey] === 'custom' && (field === 'icon' ? <AssetPicker accepts={['image']} value={stage.icon} onChange={icon => patch({ icon })} /> : <TextInput multiline={field === 'description'} value={stage[valueKey]} onChange={value => patch({ [valueKey]: value })} />)}
        </FieldRow>;
      })}
      <FieldRow label="显示等级"><Switch checked={stage.showLevel} onChange={showLevel => patch({ showLevel })} /></FieldRow>
      <FieldRow label="显示阶段名称"><Switch checked={stage.showStageName} onChange={showStageName => patch({ showStageName })} /></FieldRow>
    </Section> : <SurfaceEditor stage={stage} item={item} levels={levels} surface={tab === 'popup' ? 'popup' : 'card'} />}</div>
      <aside className="aw-preview"><ContentPreview item={item} stage={stage} surface={tab === 'popup' ? 'popup' : 'card'} /></aside>
    </div></>;
}
export function DefaultStageEditor() {
  const [configured, setConfigured] = useSetting<StageTemplate[]>('main.defaultStages'), [items] = useSetting<Achievement[]>('main.achievements'), [overrides] = useSetting<DisplayStage[]>('main.displayStages'), [configuredLevels] = useSetting<Level[]>('main.levels');
  const levels = configuredLevels?.length ? configuredLevels : DEFAULT_LEVELS, defaults = defaultsFor(configured);
  const [selected, select] = useSelection('default-stage', 'unknown'), [error, setError] = useState('');
  const nav = useNavigation(), stage = defaults.find(s => s.id === selected) ?? defaults[0];
  const preserveTiers = usePreserveTiers(configured,overrides);
  const save = (next: StageTemplate[]) => { try { catalog(levels, items ?? [], overrides ?? [], next); const ok = preserveTiers() && setConfigured(next); setError(ok ? '' : '保存被拒绝。'); return ok; } catch (e) { setError(String(e)); return false; } };
  const removalReason = (id: string) => defaultRemovalReason(defaults, items ?? [], overrides ?? [], id);
  const remove = (id: string) => { try { const next = removeDefaultStage(defaults, items ?? [], overrides ?? [], levels, id); if (save(next) && stage.id === id) select(next[0].id); } catch (e) { setError(String(e)); } };
  const references = (items ?? []).filter(a => !overrides?.some(o => o.achievementId === a.id && o.id === stage.id));
  return <Workspace list={<ObjectList title="默认阶段" items={defaults} selected={stage.id} onSelect={select} onRemove={remove} removalReason={removalReason} actions={<Button onClick={() => { const next = { ...defaultsFor()[1], id: 'stage_' + crypto.randomUUID(), name: '新默认阶段' }; if (save([...defaults, next])) select(next.id); }}>＋ 默认阶段</Button>} />}>
    <EditorScope key={stage.id} id={'default-stage:' + stage.id}><div className="aw-scope"><strong>共用配置 · {stage.name}</strong><p className="aw-note">{stage.id} · 修改会影响沿用它的成就，各成就的专用覆盖保持。</p></div>
      <details><summary>沿用阶段内容的成就（{references.length}）</summary><div className="aw-actions">{references.map(a => <Button key={a.id} onClick={() => { nav?.select('stage:' + a.id, stage.id); nav?.jump({ area: 'achievements', sub: '' }, 'achievement', a.id); }}>{a.name}</Button>)}</div></details>
      <StageFields stage={stage} levels={levels} patch={v => save(defaults.map(s => s.id === stage.id ? { ...s, ...v } : s))} />
      <Button disabled={!!removalReason(stage.id)} title={removalReason(stage.id)} onClick={() => remove(stage.id)}>移除此默认阶段</Button><p className="aw-note">{removalReason(stage.id)}</p>
    </EditorScope>{error && <p role="alert">{error}</p>}
  </Workspace>;
}
export function AchievementStageEditor({ item, setInitial }: { item: Achievement; setInitial: (id: string) => void }) {
  const [configured] = useSetting<StageTemplate[]>('main.defaultStages'), [saved, setSaved] = useSetting<DisplayStage[]>('main.displayStages'), [configuredLevels] = useSetting<Level[]>('main.levels');
  const levels = configuredLevels?.length ? configuredLevels : DEFAULT_LEVELS, defaults = defaultsFor(configured), all = resolveStages(item.id, configured, saved);
  const [selected, select] = useSelection('stage:' + item.id, item.initialStageId || 'unknown'), [error, setError] = useState('');
  const stage = all.find(s => s.id === selected) ?? all[0], nav = useNavigation();
  const own = saved?.find(s => s.achievementId === item.id && s.id === stage?.id && !s.disabled), shared = defaults.find(s => s.id === stage?.id);
  const removed = defaults.filter(s => saved?.some(o => o.achievementId === item.id && o.id === s.id && o.disabled));
  const preserveTiers = usePreserveTiers(configured,saved,item.id);
  const save = (next: DisplayStage[]) => { const ok = preserveTiers() && setSaved(next); setError(ok ? '' : '保存被拒绝。'); return ok; };
  const without = (id: string) => (saved ?? []).filter(s => !(s.achievementId === item.id && s.id === id));
  const saveStage = (next: DisplayStage) => save([...without(next.id), next]);
  const reason = (id: string) => localRemovalReason(item, all, id);
  const remove = (id: string) => { try { const next = removeLocalStage(item, configured, saved, id); if (save(next) && stage?.id === id) select(all.find(s => s.id !== id)!.id); } catch (e) { setError(String(e)); } };
  return <><FieldRow label="初始阶段" description="尚无记录时使用的起始阶段；已有玩家记录不变。"><Select value={item.initialStageId || 'unknown'} options={all.map(s => ({ value: s.id, label: s.name }))} onChange={setInitial} /></FieldRow>
    <TierEditor achievement={item.id} stages={all}/>
    <StagePicker value={stage?.id ?? ''} stages={all} initialStageId={item.initialStageId} onChange={select} removalReason={reason} onRemove={remove} />
    <div className="aw-actions"><Button onClick={() => { const next = { ...presetStages(item.id)[1], id: 'stage_' + crypto.randomUUID(), name: '新阶段' }; if (saveStage(next)) select(next.id); }}>＋ 本成就阶段</Button>
      {stage && own && shared && <Button onClick={() => save(without(stage.id))}>恢复阶段信息与内容</Button>}
      {stage && <Button disabled={!!reason(stage.id)} title={reason(stage.id)} onClick={() => remove(stage.id)}>移除此阶段</Button>}
      {shared && <Button onClick={() => nav?.jump({ area: 'attributes', sub: 'defaults' }, 'default-stage', shared.id)}>查看默认来源</Button>}
    </div>
    {removed.length > 0 && <FieldRow label="恢复已移除的默认阶段"><Select value="" options={removed.map(s => ({ value: s.id, label: s.name }))} placeholder="选择要恢复的阶段" onChange={id => { if (save(without(id))) select(id); }} /></FieldRow>}
    {stage && <EditorScope key={stage.id} id={'stage:' + stage.id}><div className="aw-scope"><strong>{item.name} / {stage.name}{stage.id === item.initialStageId ? ' · 初始阶段' : ''}</strong><p className="aw-note">{stage.id} · {own ? '本成就专用内容' : '沿用默认内容'}</p></div><StageFields stage={stage} item={item} levels={levels} patch={v => saveStage({ ...stage, ...v, disabled: false })} /></EditorScope>}
    {error && <p role="alert">{error}</p>}
  </>;
}
