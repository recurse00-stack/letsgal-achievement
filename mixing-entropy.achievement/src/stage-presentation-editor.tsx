import { useState } from 'react';
import { AssetPicker, Button, FieldRow, Section, Select, Switch, TextInput, UIRefPicker, NumberSlider, useSetting } from '@avg-studio/studio-ui';
import { defaultsFor, type Achievement, type Level, type StageTemplate } from './model';
import { parsePresentations, presentationKey, resetSurfaceCss, resolvePresentation, materializePresentation, levelPresetId, type StagePresentation, type Surface } from './stage-presentation';
import { optionalAppearance } from './card-style';
import { parseAppearanceBinding, type AppearancePreset } from './appearance-presets';
import { StageAppearanceEditor } from './appearance-editor';
import type { ElementCssRecord } from './element-css';

const note = { color: 'var(--fg-secondary)', fontSize: '0.9em' };
const contentOptions = [{ value: 'stage', label: '使用本阶段内容' }, { value: 'custom', label: '单独填写' }, { value: 'none', label: '不显示' }];
export function StagePresentationEditor({ stage, item, levels }: { stage: StageTemplate; item?: Achievement; levels: Level[] }) {
  return <Section title="阶段表现" collapsible defaultOpen={false} description="卡片和浮现分别配置；默认使用本阶段内容，位置与大小在各自官方界面里编排。">
    <SurfaceEditor key={`${item?.id ?? ''}/${stage.id}/card`} stage={stage} item={item} levels={levels} surface="card" />
    <SurfaceEditor key={`${item?.id ?? ''}/${stage.id}/popup`} stage={stage} item={item} levels={levels} surface="popup" />
  </Section>;
}
function SurfaceEditor({ stage, item, levels, surface }: { stage: StageTemplate; item?: Achievement; levels: Level[]; surface: Surface }) {
  const [stored, setStored] = useSetting<StagePresentation[]>('main.stagePresentations');
  const [configured] = useSetting<StageTemplate[]>('main.defaultStages');
  const [css, setCss] = useSetting<ElementCssRecord[]>('main.elementCss');
  const [presets] = useSetting<AppearancePreset[]>('main.appearances');
  const [contentEditing, setContentEditing] = useState(false);
  const [timingEditing, setTimingEditing] = useState(false);
  const [globalUI] = useSetting<string>('main.popup');
  const [globalDuration] = useSetting<number>('main.durationMs');
  const [globalNotifications] = useSetting<boolean>('main.notifications');
  const [error, setError] = useState('');
  const rows = stored ?? [];
  const defaults = defaultsFor(configured);
  const owner = { achievementId: item?.id ?? '', stageId: stage.id, surface };
  const key = presentationKey(owner);
  const own = rows.find(r => presentationKey(r) === key);
  const effective = resolvePresentation(rows, defaults, stage, owner.achievementId, surface);
  const effectiveView = materializePresentation(effective, presets ?? [], levelPresetId(levels.find(l => l.id === (stage.levelMode === 'custom' ? stage.levelId : item?.levelId)), surface));
  const shared = item && defaults.some(s => s.id === stage.id);
  const save = (value: StagePresentation) => {
    try {
      const next = parsePresentations([...rows.filter(r => presentationKey(r) !== key), value]);
      if (!setStored(next)) throw Error('保存失败，请检查配置。');
      setError(''); return true;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
  };
  const patch = (changes: Partial<StagePresentation>) => save({ ...effective, ...owner, mode: 'custom', ...changes });
  const patchContent = (changes: Partial<StagePresentation>) => patch({ contentOverride: true, nameMode: effectiveView.nameMode, displayName: effectiveView.displayName, descriptionMode: effectiveView.descriptionMode, description: effectiveView.description, iconMode: effectiveView.iconMode, icon: effectiveView.icon, showLevel: effectiveView.showLevel, showStageName: effectiveView.showStageName, ...changes });
  const restore = () => {
    // Leave the opposite surface's CSS intact, including previously shared CSS.
    const nextCss = resetSurfaceCss(css ?? [], item!.id, stage.id, surface);
    if (!setCss(nextCss)) { setError('CSS 恢复失败，请重试。'); return; }
    if (!save({ ...effective, ...owner, mode: 'inherit' })) setCss(css ?? []);
  };
  const legacyCss = (css ?? []).filter(r => r.ownerKind === (item ? 'stage' : 'defaultStage') && r.achievementId === owner.achievementId && r.ownerId === stage.id && r.surface === 'both');
  return <Section title={surface === 'card' ? '卡片展示' : '阶段浮现'} collapsible defaultOpen={false}
    description={surface === 'card' ? '决定这个阶段在成就页里的内容和外观。' : '进入这个阶段时播放；相同阶段不重复播放，连续通知依次排队。'}>
    <p style={note}>{!item ? '这是共用默认配置；成就可分别覆盖卡片或浮现。' : own?.mode === 'custom' ? '本项使用当前成就的专用配置。' : own?.mode === 'inherit' ? '本项沿用默认阶段，默认修改会同步生效。' : '当前沿用已有阶段配置；在这里修改只影响当前成就的本项。'}</p>
    {shared && <div style={{ display: 'flex', gap: 8 }}>
      {own?.mode === 'custom' && <Button onClick={restore}>恢复默认阶段的本项表现</Button>}
    </div>}
    {surface === 'card' ? <FieldRow label="成就页收录"><Select value={effective.enabled ? 'show' : 'omit'} options={[{ value: 'show', label: '显示卡片' }, { value: 'omit', label: '不生成卡片' }]} onChange={value => patch({ enabled: value === 'show' })} /></FieldRow>
      : <FieldRow label="进入此阶段时浮现" description="还需全局允许播放；方法块可让本次切换静默。"><Switch checked={effective.enabled} onChange={enabled => patch({ enabled })} /></FieldRow>}
    {surface === 'popup' && globalNotifications === false && <p style={note}>全局已关闭浮现；可在“界面与播放 → 浮现播放”开启。</p>}
    {effective.enabled && <>
      {surface === 'popup' && <>
        <p style={note}>当前浮现界面：{(effectiveView.ui || globalUI || 'ui:@mixing-entropy.achievement/achievement-popup').replace(/^ui:@?/, '')}；时长：{(effectiveView.durationMs || globalDuration || 3000) / 1000} 秒。</p>
        <Button onClick={() => setTimingEditing(!timingEditing)}>{timingEditing ? '收起界面与时长' : '单独设置界面与时长'}</Button>
        {timingEditing && <Section title="界面与时长" collapsible>
        <FieldRow label="浮现界面"><Select value={effective.ui ? 'custom' : 'default'} options={[{ value: 'default', label: '沿用通用方案' }, { value: 'custom', label: '为此阶段选择界面' }]} onChange={value => patch({ ui: value === 'custom' ? effectiveView.ui || globalUI || 'ui:@mixing-entropy.achievement/achievement-popup' : '' })} /></FieldRow>
        {!!effective.ui && <FieldRow label="选择界面"><UIRefPicker value={effective.ui.replace(/^ui:@?/, '').replace(/^@/, '')} onChange={ui => patch({ ui: ui ? 'ui:@' + (ui.includes('/') ? ui : 'mixing-entropy.achievement/' + ui) : '' })} /></FieldRow>}
        {!effective.ui && <FieldRow label="当前默认界面"><UIRefPicker ariaLabel="当前沿用的浮现界面" value={(effectiveView.ui || globalUI || 'ui:@mixing-entropy.achievement/achievement-popup').replace(/^ui:@?/, '').replace(/^@/, '')} disabled onChange={() => {}} /></FieldRow>}
        <FieldRow label="浮现时长"><Select value={effective.durationMs ? 'custom' : 'default'} options={[{ value: 'default', label: '沿用通用方案' }, { value: 'custom', label: '单独设置时长' }]} onChange={value => patch({ durationMs: value === 'custom' ? effectiveView.durationMs || globalDuration || 3000 : 0 })} /></FieldRow>
        {!effective.durationMs && <p style={note}>当前默认时长：{(effectiveView.durationMs || globalDuration || 3000) / 1000} 秒</p>}
        {!!effective.durationMs && <FieldRow label="时长（毫秒）"><NumberSlider ariaLabel="阶段浮现时长" value={effective.durationMs} min={300} max={60000} step={100} unit="ms" onChange={durationMs => patch({ durationMs })} /></FieldRow>}
        <p style={note}>进场、退场动画和元素排版，在所选浮现界面的官方编辑器设置。</p>
        <Button onClick={() => patch({ ui: '', durationMs: 0 })}>恢复沿用界面与时长</Button>
      </Section>}</>}
      <p style={note}>内容：{effective.contentOverride === false ? '沿用本阶段内容与通用方案的显示方式' : '本处已有单独显示配置'}。</p>
      <Button onClick={() => setContentEditing(!contentEditing)}>{contentEditing ? '收起内容设置' : '单独设置内容'}</Button>
      {contentEditing && <Section title="单独内容" collapsible description="只影响本处；卡片和浮现都从当前阶段读取，不互相继承。">
        <FieldRow label="名称"><Select value={effectiveView.nameMode} options={contentOptions} onChange={nameMode => patchContent({ nameMode: nameMode as StagePresentation['nameMode'] })} /></FieldRow>
        {effective.nameMode === 'custom' && <FieldRow label="显示名称"><TextInput value={effective.displayName} onChange={displayName => patchContent({ displayName })} /></FieldRow>}
        <FieldRow label="说明"><Select value={effectiveView.descriptionMode} options={contentOptions} onChange={descriptionMode => patchContent({ descriptionMode: descriptionMode as StagePresentation['descriptionMode'] })} /></FieldRow>
        {effective.descriptionMode === 'custom' && <FieldRow label="显示说明"><TextInput multiline value={effective.description} onChange={description => patchContent({ description })} /></FieldRow>}
        <FieldRow label="图标"><Select value={effectiveView.iconMode} options={[...contentOptions, { value: 'unknown', label: '默认未知图标' }]} onChange={iconMode => patchContent({ iconMode: iconMode as StagePresentation['iconMode'] })} /></FieldRow>
        {effective.iconMode === 'custom' && <FieldRow label="显示图标"><AssetPicker accepts={['image']} value={effective.icon} onChange={icon => patchContent({ icon })} /></FieldRow>}
        <FieldRow label="显示等级"><Switch checked={effectiveView.showLevel} onChange={showLevel => patchContent({ showLevel })} /></FieldRow>
        <FieldRow label="显示阶段名称"><Switch checked={effectiveView.showStageName} onChange={showStageName => patchContent({ showStageName })} /></FieldRow>
        <Button onClick={() => { patch({ contentOverride: false, nameMode: 'stage', descriptionMode: 'stage', iconMode: 'stage', displayName: '', description: '', icon: '', showLevel: stage.showLevel, showStageName: stage.showStageName }); setContentEditing(false); }}>恢复沿用内容</Button>
      </Section>}
      <StageAppearanceEditor stage={{ ...stage, ...optionalAppearance({ ...effective }), ...parseAppearanceBinding(effective as unknown as Record<string, unknown>) }} patch={changes => patch(changes as Partial<StagePresentation>)} levels={levels} item={item} surface={surface} presentation={effective} />
      {legacyCss.length > 0 && <details><summary style={note}>已有卡片与浮现共用 CSS</summary><pre style={{ ...note, whiteSpace: 'pre-wrap' }}>{legacyCss.map(r => `${r.target}\n${r.css}`).join('\n')}</pre><p style={note}>原配置继续生效；下方的逐元素 CSS 可单独覆盖本项。</p></details>}
    </>}
    {error && <p role="alert">{error}</p>}
  </Section>;
}
