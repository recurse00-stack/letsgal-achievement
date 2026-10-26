import { useState } from 'react';
import { AssetPicker, Button, FieldRow, Section, Select, Switch, TextInput, useSetting } from '@avg-studio/studio-ui';
import { catalog, DEFAULT_LEVELS, defaultsFor, presetStages, resolveStages, type Level, type Achievement, type ContentMode, type DisplayStage, type StageTemplate } from './model';
import { StagePicker } from './stage-picker';
import { defaultRemovalReason, localRemovalReason, removeDefaultStage, removeLocalStage } from './stage-removal';

const contentOptions = [{ value: 'base', label: '使用成就基础配置' }, { value: 'custom', label: '本阶段自定义' }, { value: 'none', label: '不显示' }];
const noteStyle = { color: 'var(--fg-secondary)' };
const actionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, margin: '8px 0' };

/** Shared defaults and achievement overrides use the same content form. */
function StageFields({ stage, patch, levels, item }: { stage: StageTemplate; patch: (value: Partial<StageTemplate>) => void; levels: Level[]; item?: Achievement }) {
  return <>
    <Section title="阶段信息" collapsible defaultOpen={false}>
    <FieldRow label="阶段名称"><TextInput value={stage.name} onChange={name => patch({ name })} /></FieldRow>
    <FieldRow label="向玩家显示本阶段内容"><Switch checked={stage.visible} onChange={visible => patch({ visible })} /></FieldRow>
    {stage.visible && <FieldRow label="向玩家提供阶段名称" description="自制卡片使用 item.stageName；浮现使用 achievement-stage 文字控件。"><Switch checked={stage.showStageName} onChange={showStageName => patch({ showStageName })} /></FieldRow>}
    <p style={noteStyle}>阶段编号：{stage.id}。修改名称不改变编号。</p>
    </Section>
    <Section title="等级与边框" collapsible defaultOpen={false}>
    <FieldRow label="本阶段等级" description="使用基础等级时，每个成就读取自己的基础配置，不继承上一阶段。">
      <Select value={stage.levelMode ?? 'base'} options={[{ value: 'base', label: '使用成就基础等级' }, { value: 'custom', label: '指定本阶段等级' }]}
        onChange={value => patch({ levelMode: value as StageTemplate['levelMode'], ...(value === 'custom' && !levels.some(l => l.id === stage.levelId) ? { levelId: item?.levelId || levels[0]?.id || 'bronze' } : {}) })} />
    </FieldRow>
    {stage.levelMode === 'custom' && <FieldRow label="选择等级"><Select value={stage.levelId} options={levels.map(l => ({ value: l.id, label: l.name + '（' + l.id + '）' }))} onChange={levelId => patch({ levelId })} /></FieldRow>}
    {stage.visible && <FieldRow label="展示等级与边框"><Switch checked={stage.showLevel} onChange={showLevel => patch({ showLevel })} /></FieldRow>}
    </Section>
    {stage.visible ? <>
      <p style={noteStyle}>“使用成就基础配置”读取对应成就的名称、说明或图标，不继承上一阶段。</p>
      <Section title="名称显示" collapsible defaultOpen={false}>
      <FieldRow label="名称显示方式"><Select value={stage.nameMode} options={contentOptions} onChange={value => patch({ nameMode: value as ContentMode })} /></FieldRow>
      {stage.nameMode === 'custom' && <FieldRow label="显示名称"><TextInput value={stage.displayName} onChange={displayName => patch({ displayName })} /></FieldRow>}
      </Section>
      <Section title="说明显示" collapsible defaultOpen={false}>
      <FieldRow label="说明显示方式"><Select value={stage.descriptionMode} options={contentOptions} onChange={value => patch({ descriptionMode: value as ContentMode })} /></FieldRow>
      {stage.descriptionMode === 'custom' && <FieldRow label="显示说明"><TextInput multiline value={stage.description} onChange={description => patch({ description })} /></FieldRow>}
      </Section>
      <Section title="图标显示" collapsible defaultOpen={false}>
      <FieldRow label="图标显示方式"><Select value={stage.iconMode} options={[...contentOptions, { value: 'unknown', label: '默认未知图标' }]} onChange={value => patch({ iconMode: value as StageTemplate['iconMode'] })} /></FieldRow>
      {stage.iconMode === 'custom' && <FieldRow label="显示图标"><AssetPicker accepts={['image']} value={stage.icon} onChange={icon => patch({ icon })} /></FieldRow>}
      </Section>
      <Section title="内容预览" collapsible defaultOpen={false}>
      <div style={{ padding: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
        <strong>{stage.nameMode === 'base' ? item?.name || '（对应成就的基础名称）' : stage.nameMode === 'custom' ? stage.displayName : '（不显示名称）'}</strong>
        <p style={{ whiteSpace: 'pre-wrap' }}>{stage.descriptionMode === 'base' ? item ? item.description : '（对应成就的基础说明）' : stage.descriptionMode === 'custom' ? stage.description : '（不显示说明）'}</p>
        {stage.showStageName && <small>{stage.name}</small>}
      </div>
      </Section>
    </> : <p style={noteStyle}>此阶段不会出现在成就页，也不会浮现。</p>}
  </>;
}

export function DefaultStageEditor() {
  const [configured, setConfigured] = useSetting<StageTemplate[]>('main.defaultStages');
  const [items] = useSetting<Achievement[]>('main.achievements');
  const [overrides] = useSetting<DisplayStage[]>('main.displayStages');
  const [configuredLevels] = useSetting<Level[]>('main.levels');
  const levels = configuredLevels?.length ? configuredLevels : DEFAULT_LEVELS;
  const defaults = defaultsFor(configured);
  const [selected, select] = useState('unknown');
  const [error, setError] = useState('');
  const stage = defaults.find(s => s.id === selected) ?? defaults[0];
  const save = (next: StageTemplate[], structural = false) => {
    if (structural) try { catalog(levels, items ?? [], overrides ?? [], next); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    const ok = setConfigured(next); setError(ok ? '' : '保存失败，请检查内容。'); return ok;
  };
  const removalReason = (id: string) => defaultRemovalReason(defaults, items ?? [], overrides ?? [], id);
  const remove = (id: string) => {
    try {
      const next = removeDefaultStage(defaults, items ?? [], overrides ?? [], levels, id);
      if (save(next) && stage.id === id) select(next[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  return <>
    <FieldRow label="编辑默认阶段" description="展开列表，右键阶段可删除；影响沿用该默认阶段的成就。"><StagePicker value={stage.id} stages={defaults} onChange={select} removalReason={removalReason} onRemove={remove} shared /></FieldRow>
    <div style={actionsStyle}>
      <Button onClick={() => { const next = { ...defaultsFor()[1], id: 'stage_' + crypto.randomUUID(), name: '新默认阶段' }; if (save([...defaults, next], true)) select(next.id); }}>添加默认阶段</Button>
      <Button disabled={!!removalReason(stage.id)} title={removalReason(stage.id) || undefined} onClick={() => remove(stage.id)}>移除此默认阶段</Button>
    </div>
    {removalReason(stage.id) && <p style={noteStyle}>{removalReason(stage.id)}</p>}
    <StageFields stage={stage} levels={levels} patch={changes => save(defaults.map(s => s.id === stage.id ? { ...s, ...changes } : s))} />
    {error && <p role="alert">{error}</p>}
  </>;
}

/** Inline under the owning achievement, without a second achievement selector. */
export function AchievementStageEditor({ item, setInitial }: { item: Achievement; setInitial: (id: string) => void }) {
  const [configured] = useSetting<StageTemplate[]>('main.defaultStages');
  const [saved, setSaved] = useSetting<DisplayStage[]>('main.displayStages');
  const [configuredLevels] = useSetting<Level[]>('main.levels');
  const levels = configuredLevels?.length ? configuredLevels : DEFAULT_LEVELS;
  const defaults = defaultsFor(configured);
  const all = resolveStages(item.id, configured, saved);
  const [selected, select] = useState(item.initialStageId || 'unknown');
  const [error, setError] = useState('');
  const stage = all.find(s => s.id === selected) ?? all[0];
  const own = saved?.find(s => s.achievementId === item.id && s.id === stage?.id && !s.disabled);
  const shared = defaults.find(s => s.id === stage?.id);
  const removed = defaults.filter(s => saved?.some(o => o.achievementId === item.id && o.id === s.id && o.disabled));
  const save = (next: DisplayStage[]) => { const ok = setSaved(next); setError(ok ? '' : '保存失败，请检查内容。'); return ok; };
  const without = (id: string) => (saved ?? []).filter(s => !(s.achievementId === item.id && s.id === id));
  const saveStage = (next: DisplayStage) => save([...without(next.id), next]);
  const removalReason = (id: string) => localRemovalReason(item, all, id);
  const remove = (id: string) => {
    try {
      const next = removeLocalStage(item, configured, saved, id);
      if (save(next) && stage?.id === id) select(all.find(s => s.id !== id)!.id);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  return <>
    <FieldRow label="初始展示阶段" description="只用于尚无阶段记录的新成就，已有记录不会改变。">
      <Select value={item.initialStageId || 'unknown'} placeholder="请选择有效的初始阶段" options={all.map(s => ({ value: s.id, label: s.name }))} onChange={setInitial} />
    </FieldRow>
    <FieldRow label="编辑阶段" description="展开列表，右键阶段可删除；只影响当前成就。"><StagePicker value={stage?.id ?? ''} stages={all} onChange={select} removalReason={removalReason} onRemove={remove} /></FieldRow>
    {stage && <p style={noteStyle}>{own ? '此阶段使用本成就专用配置，不随默认配置修改。' : '此阶段沿用默认配置；在此处修改仅影响当前成就。'}</p>}
    <div style={actionsStyle}>
      <Button onClick={() => { const next = { ...presetStages(item.id)[1], id: 'stage_' + crypto.randomUUID(), name: '新阶段' }; if (saveStage(next)) select(next.id); }}>添加本成就阶段</Button>
      {stage && own && shared && <Button onClick={() => save(without(stage.id))}>恢复使用默认配置</Button>}
      {stage && <Button disabled={!!removalReason(stage.id)} title={removalReason(stage.id) || undefined} onClick={() => remove(stage.id)}>从此成就移除阶段</Button>}
    </div>
    {removed.length > 0 && <FieldRow label="恢复已移除的默认阶段"><Select value="" options={[{ value: '', label: '选择要恢复的阶段', disabled: true }, ...removed.map(s => ({ value: s.id, label: s.name }))]}
      onChange={id => { if (save(without(id))) select(id); }} /></FieldRow>}
    {stage && <StageFields stage={stage} item={item} levels={levels} patch={changes => saveStage({ ...stage, ...changes, disabled: false })} />}
    {error && <p role="alert">{error}</p>}
  </>;
}
