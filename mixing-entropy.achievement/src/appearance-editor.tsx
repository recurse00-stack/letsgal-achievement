import { SettingField } from './editor-setting-field';
import { ObjectList, Workspace } from './editor-primitives';
import { useNavigation, useSelection } from './editor-navigation';
import { ContentPreview } from './editor-preview';
import { CardLayoutEditor } from './card-editor';
import { NotificationSettings, SummarySettings } from './notification-editor';
import { FieldRow, Section, TextInput, Tabs, Numeric } from './editor-primitives';
import { EditorScope, useEditorState, useSetting } from './editor-session';
import { useState } from 'react';
import { Button, Select, Switch, UIRefPicker } from '@avg-studio/studio-ui';
import { CardAppearanceEditor } from './card-editor';
import { appearanceInUse, copyAppearanceGroup, presentationPreset, resolveAppearance, type AppearancePreset } from './appearance-presets';
import { DEFAULT_LEVELS, resolveStages, type StageTemplate, type Level, type Achievement, type DisplayStage } from './model';
import { levelPresetId, presentationCssOwners, type StagePresentation, type Surface } from './stage-presentation';
import { ElementCssEditor } from './element-css-editor';
import { sameOwner, type ElementCssRecord } from './element-css';

const note = { color: 'var(--fg-secondary)', fontSize: '0.9em' };
const choices = (presets: AppearancePreset[], surface: Surface) => presets.filter(p => !p.surface || p.surface === surface).map(p => ({ value: p.id, label: p.name }));
import { applyGroupScheme } from './stage-presentation';
import type { GroupRow } from './groups';
export function SharedPresentationEditor({ surface }: { surface: Surface }) {
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const [stored, setStored] = useSetting<AppearancePreset[]>('main.appearances');
  const [levels] = useSetting<Level[]>('main.levels');
  const [defaults] = useSetting<StageTemplate[]>('main.defaultStages');
  const [stages] = useSetting<DisplayStage[]>('main.displayStages');
  const [presentations] = useSetting<StagePresentation[]>('main.stagePresentations');
  const [css, setCss] = useSetting<ElementCssRecord[]>('main.elementCss');
  const [globalUI] = useSetting<string>('main.popup');
  const [globalDuration] = useSetting<number>('main.durationMs');
  const presets = stored ?? [], available = presets.filter(p => p.surface === surface);
  const [selected, select] = useSelection('appearance:' + surface); const [error, setError] = useState('');
  const current = available.find(p => p.id === selected) ?? available[0];
  const fallback = available.find(p => p.isDefault);
  const removalReason = (id: string) => {
    const value = available.find(p => p.id === id);
    if (!value) return '此方案已不存在。';
    return groups?.some(row => row.card === id || row.popup === id) || value.isDefault || appearanceInUse(id, levels ?? [], [...defaults ?? [], ...stages ?? [], ...(presentations ?? []).filter(p => p.mode === 'custom')])
      ? '先更换默认方案或解除等级、阶段引用。' : '';
  };
  const used = !!current && !!removalReason(current.id);
  const save = (next: AppearancePreset[]) => { const ok = setStored(next); setError(ok ? '' : '方案保存失败，请检查内容。'); return ok; };
  const patch = (v: Partial<AppearancePreset>) => save(presets.map(p => p.id === current.id ? { ...p, ...v } : p));
  const remove = (id: string) => {
    if (removalReason(id)) return;
    const owner = { ownerKind: 'appearance' as const, ownerId: id, achievementId: '' };
    const nextCss = (css ?? []).filter(row => !sameOwner(row, owner));
    if (!save(presets.filter(p => p.id !== id))) return;
    if (nextCss.length !== (css ?? []).length && !setCss(nextCss)) {
      // Keep the CSS intact on rejection and restore its owning scheme if possible.
      const restored = setStored(presets);
      setError(restored ? '专属 CSS 清理失败，已恢复方案，请重试。' : '方案已移除，但专属 CSS 清理失败且方案未能恢复；请撤销本次删除。');
    }
  };
  const add = () => { const p: AppearancePreset = { id: 'look_' + crypto.randomUUID(), name: surface === 'card' ? '新卡片方案' : '新浮现方案', surface, isDefault: available.length === 0,
    nameMode: 'stage', descriptionMode: 'stage', iconMode: 'stage', levelVisibility: 'stage', stageNameVisibility: 'stage', durationMs: surface === 'popup' ? 3000 : 0, ui: surface === 'popup' ? 'ui:@mixing-entropy.achievement/achievement-popup' : '' };
    if (save([...presets, p])) select(p.id); };
  const special = selected.startsWith('$') || (!current && !selected);
  return <Workspace list={<ObjectList title={surface === 'card' ? '卡片方案' : '浮现方案'} items={available} selected={special ? '' : current?.id ?? ''} onSelect={select} onRemove={remove} removalReason={removalReason}
    actions={<Button onClick={add}>＋ 添加方案</Button>}
    extra={<div className="aw-list">{(surface === 'card' ? [{id:'$template',name:'模板与尺寸'}] : [{id:'$rules',name:'播放规则'},{id:'$summary',name:'合并汇总'}]).map(i => <button key={i.id} className="aw-object" aria-current={selected === i.id ? 'true' : undefined} onClick={() => select(i.id)}>{i.name}</button>)}</div>} />}
    preview={!special && current && <ContentPreview surface={surface} scheme={current} />}>
    <FieldRow label="默认方案"><Select value={fallback?.id ?? ''} options={[{ value: '', label: '使用官方界面原样' }, ...choices(available, surface)]}
      onChange={id => save(presets.map(p => p.surface === surface ? { ...p, isDefault: p.id === id } : p))} /></FieldRow>
    {surface === 'popup' && !fallback && <details><summary>官方浮现界面与时长</summary><SettingField name="main.popup" /><SettingField name="main.durationMs" /></details>}
    {surface === 'card' && <p style={note}>卡片排版：在官方编辑器打开成就页，双击列表进入卡片模板。</p>}
    {special ? surface === 'card' ? <CardLayoutEditor /> : selected === '$summary' ? <SummarySettings /> : <NotificationSettings /> : <EditorScope key={current?.id} id={'scheme:' + current?.id}>
    {current ? <>
      <h2>{current.name}</h2><p className="aw-note">{current.id} · {current.isDefault ? '本组默认方案' : '可复用方案'}</p>
      <FieldRow label="方案名称"><TextInput required value={current.name} onChange={name => patch({ name })} /></FieldRow>
      <Section title="内容显示方式" collapsible defaultOpen={false} description="只决定是否显示；名称、说明和图标始终读取当前阶段，不在这里填写某个成就的内容。">
        {(['nameMode', 'descriptionMode', 'iconMode'] as const).map((key, n) => <FieldRow key={key} label={['名称', '说明', '图标'][n]}><Select value={current[key] ?? 'stage'} options={[{ value: 'stage', label: '使用当前阶段内容' }, { value: 'none', label: '不显示' }, ...(key === 'iconMode' ? [{ value: 'unknown', label: '默认未知图标' }] : [])]} onChange={value => patch({ [key]: value })} /></FieldRow>)}
        {(['levelVisibility', 'stageNameVisibility'] as const).map((key, n) => <FieldRow key={key} label={['等级', '阶段名称'][n]}><Select value={current[key] ?? 'stage'} options={[{ value: 'stage', label: '沿用阶段设置' }, { value: 'show', label: '显示' }, { value: 'hide', label: '不显示' }]} onChange={value => patch({ [key]: value })} /></FieldRow>)}
      </Section>
      {surface === 'popup' && <Section title="界面与时长" collapsible defaultOpen={false}>
        <FieldRow label="浮现界面"><UIRefPicker value={(current.ui || globalUI || 'ui:@mixing-entropy.achievement/achievement-popup').replace(/^ui:@?/, '')} onChange={ui => patch({ ui: ui ? 'ui:@' + (ui.includes('/') ? ui : 'mixing-entropy.achievement/' + ui) : '' })} /></FieldRow>
        <FieldRow label="时长（毫秒）"><Numeric ariaLabel="通用浮现时长" value={current.durationMs || globalDuration || 3000} min={300} max={60000} step={100} onChange={durationMs => patch({ durationMs })} /></FieldRow>
      </Section>}
      <CardAppearanceEditor value={current} patch={patch} />
      <ElementCssEditor key={current.id} owner={{ ownerKind: 'appearance', ownerId: current.id, achievementId: '' }} appearance={current} surface={surface} />
      <Button disabled={used} title={used ? '先更换默认方案或解除等级、阶段引用' : undefined} onClick={() => remove(current.id)}>删除此方案</Button>
      {used && <p style={note}>默认方案或仍被引用的方案不能直接删除。</p>}
    </> : <p style={note}>尚无方案，默认保留官方界面原样。</p>}
    </EditorScope>}{error && <p role="alert">{error}</p>}
  </Workspace>;
}
export function LevelAppearanceEditor() {
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const [stored, setLevels] = useSetting<Level[]>('main.levels'); const [presets] = useSetting<AppearancePreset[]>('main.appearances');
  const [items] = useSetting<Achievement[]>('main.achievements'); const [defaults] = useSetting<StageTemplate[]>('main.defaultStages'); const [stages] = useSetting<DisplayStage[]>('main.displayStages');
  const levels = stored?.length ? stored : DEFAULT_LEVELS;
  const [selected, select] = useSelection('level'); const [error, setError] = useState(''); const current = levels.find(l => l.id === selected) ?? levels[0];
  const removalReason = (id: string) => !levels.some(l => l.id === id) ? '此等级已不存在。' : levels.length <= 1 ? '至少保留一个等级。'
    : groups?.some(row => row.level === id) || items?.some(a => a.levelId === id) || [...defaults ?? [], ...stages ?? []].some(s => s.levelMode === 'custom' && s.levelId === id) ? '此等级仍被成就或阶段引用，请先解除引用。' : '';
  const save = (next: Level[]) => { const ok = setLevels(next); setError(ok ? '' : '等级保存失败'); return ok; };
  const remove = (id: string) => { if (!removalReason(id)) save(levels.filter(l => l.id !== id)); };
  const nav = useNavigation();
  const references = (items ?? []).filter(a => a.levelId === current.id || resolveStages(a.id, defaults, stages).some(s => s.levelMode === 'custom' && s.levelId === current.id));
  const sharedReferences = (defaults ?? []).filter(s => s.levelMode === 'custom' && s.levelId === current.id);
  return <Workspace list={<ObjectList title="等级" items={levels} selected={current.id} onSelect={select} onRemove={remove} removalReason={removalReason} actions={<Button onClick={() => { const l = { id: 'level_' + crypto.randomUUID(), name: '新等级' }; if (save([...levels, l])) select(l.id); }}>＋ 添加等级</Button>} />}>
    <EditorScope key={current.id} id={'level:' + current.id}><h2>{current.name}</h2><p className="aw-note">{current.id}</p>
    <FieldRow label="等级名称"><TextInput required value={current.name} onChange={name => save(levels.map(l => l.id === current.id ? { ...l, name } : l))} /></FieldRow>
    {(['card', 'popup'] as const).map(surface => <FieldRow key={surface} label={surface === 'card' ? '通用卡片方案' : '通用浮现方案'}><Select value={(surface === 'popup' ? current.popupAppearanceId : current.appearanceId) ?? ''} options={[{ value: '', label: '未关联' }, ...choices(presets ?? [], surface)]}
      onChange={id => save(levels.map(l => l.id === current.id ? { ...l, [surface === 'card' ? 'appearanceId' : 'popupAppearanceId']: id } : l))} /></FieldRow>)}
    <p style={note}>阶段选用“跟随本阶段等级”时使用这些方案。</p>
    <Button disabled={!!removalReason(current.id)} title={removalReason(current.id) || undefined} onClick={() => remove(current.id)}>删除此等级</Button>
    <Section title="引用情况"><p className="aw-note">{references.length} 个成就引用此等级；共用默认阶段引用也受到删除保护。</p><div className="aw-actions">{references.map(a => <Button key={a.id} onClick={() => nav?.jump({area:'achievements',sub:''},'achievement',a.id)}>{a.name}</Button>)}{sharedReferences.map(s => <Button key={'default:' + s.id} onClick={() => nav?.jump({area:'attributes',sub:'defaults'},'default-stage',s.id)}>默认阶段：{s.name}</Button>)}</div></Section>
    </EditorScope>{error && <p role="alert">{error}</p>}
  </Workspace>;
}
export function StageAppearanceEditor({ stage, patch, levels, item, surface = 'card', presentation }: { stage: StageTemplate; patch: (v: Partial<StageTemplate>) => void; levels: Level[]; item?: Achievement; surface?: Surface; presentation: StagePresentation }) {
  const [presets] = useSetting<AppearancePreset[]>('main.appearances');
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const resolved = applyGroupScheme(presentation,groups ?? [],item?.id ?? '');
  const source = stage.appearanceSource ?? 'default';
  const level = levels.find(l => l.id === (stage.levelMode === 'custom' ? stage.levelId : item?.levelId));
  const inherited = resolveAppearance(resolved, presets ?? [], levelPresetId(level, surface), surface);
  const scheme = presentationPreset(resolved, presets ?? [], levelPresetId(level, surface), surface);
  const missing = source === 'preset' && !scheme;
  const owners = presentationCssOwners(resolved, stage, item, levels, presets ?? []);
  const [editing, setEditing] = useEditorState('appearance-editing:' + surface, source === 'local' || !!(stage.overrideBackground || stage.overrideFrame || stage.overrideEffects));
  const nav = useNavigation();
  return <>
    <FieldRow label="表现方案"><Select value={source} options={[{ value: 'default', label: '沿用成就的默认方案' }, { value: 'global', label: '直接沿用通用默认方案' }, { value: 'preset', label: '选择通用方案' }, { value: 'level', label: '跟随本阶段等级' }, { value: 'local', label: '完全单独配置' }]}
      onChange={value => { patch({ appearanceSource: value as StageTemplate['appearanceSource'] }); setEditing(value === 'local'); }} /></FieldRow>
    {source === 'preset' && <FieldRow label="选择方案"><Select value={stage.appearanceId ?? ''} options={[{ value: '', label: '请选择方案' }, ...choices(presets ?? [], surface)]} onChange={appearanceId => patch({ appearanceId })} /></FieldRow>}
    <p style={note}>{source === 'local' ? '使用本阶段单独配置。' : `当前沿用：${scheme?.name ?? '官方界面原样'}。`}{missing ? '所选方案已失效，请重新选择。' : ''}</p>
    {scheme && <Button onClick={() => nav?.jump({ area: 'interfaces', sub: surface === 'card' ? 'cards' : 'popups' }, 'appearance:' + surface, scheme.id)}>编辑来源方案：{scheme.name}</Button>}
    {source !== 'local' && <Button onClick={() => setEditing(!editing)}>{editing ? '收起单独调整' : '单独调整外观或 CSS'}</Button>}
    {(editing || source === 'local') && <Section title="外观与元素 CSS" collapsible>
      {source !== 'local' && <>
        {([['background', 'overrideBackground', '背景'], ['frame', 'overrideFrame', '边框'], ['effects', 'overrideEffects', '动效']] as const).map(([group, key, label]) => <FieldRow key={key} label={'单独配置' + label}><Switch checked={stage[key] === true} onChange={enabled => patch({ ...(enabled ? copyAppearanceGroup(inherited, group) : {}), [key]: enabled })} /></FieldRow>)}
        <p style={note}>只展开单独配置的部分；关闭后继续沿用方案。</p>
      </>}
      <CardAppearanceEditor value={stage} patch={patch} groups={source === 'local' ? undefined : [stage.overrideBackground && 'background', stage.overrideFrame && 'frame', stage.overrideEffects && 'effects'].filter(Boolean) as string[]} />
      <ElementCssEditor owner={owners[owners.length - 1]} inheritedOwners={owners.slice(0, -1)} appearance={inherited} surface={surface} />
    </Section>}
  </>;
}
