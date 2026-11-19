import type { GroupRow } from './groups';
import { ImagePreview, Select } from '@avg-studio/studio-ui';
import { useSetting, useEditorState } from './editor-session';
import { catalog, DEFAULT_LEVELS, resolveStages, type Achievement, type StageTemplate, type DisplayStage, type Level } from './model';
import { projectPresentation, type StagePresentation, type Surface } from './stage-presentation';
import type { AppearancePreset } from './appearance-presets';
import type { ElementCssRecord } from './element-css';
export function ContentPreview({ item, stage, surface = 'card', scheme }: { item?: Achievement; stage?: StageTemplate; surface?: Surface; scheme?: AppearancePreset }) {
  const [items] = useSetting<Achievement[]>('main.achievements'), [levels] = useSetting<Level[]>('main.levels');
  const [defaults] = useSetting<StageTemplate[]>('main.defaultStages'), [overrides] = useSetting<DisplayStage[]>('main.displayStages');
  const [presets] = useSetting<AppearancePreset[]>('main.appearances'), [css] = useSetting<ElementCssRecord[]>('main.elementCss'), [surfaces] = useSetting<StagePresentation[]>('main.stagePresentations');
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const [refId, setRef] = useEditorState('preview-achievement', ''), [stageId, setStage] = useEditorState('preview-stage', '');
  const reference = item ?? items?.find(a => a.id === refId) ?? items?.[0];
  const stages = reference ? resolveStages(reference.id, defaults, overrides) : [];
  const chosen = stage ?? stages.find(s => s.id === stageId) ?? stages[0];
  let view: ReturnType<typeof projectPresentation>, error = '';
  try {
    if (reference && chosen) {
      const defs = catalog(levels?.length ? levels : DEFAULT_LEVELS, items ?? [], overrides ?? [], defaults ?? [], presets ?? [], css ?? [], surfaces ?? [], groups ?? []);
      if (scheme) defs.presentations = [...(defs.presentations ?? []).filter(p => !(p.achievementId === reference.id && p.stageId === chosen.id && p.surface === surface)), { achievementId: reference.id, stageId: chosen.id, surface, mode: 'custom', enabled: true, contentOverride: false, appearanceSource: 'preset', appearanceId: scheme.id } as StagePresentation];
      view = projectPresentation(defs, defs.achievements.find(a => a.id === reference.id) ?? reference, chosen, surface);
    }
  } catch (e) { error = String(e); }
  return <><h3>有效内容示意</h3>{!item && <><p className="aw-note">参考成就</p><Select value={reference?.id ?? ''} options={(items ?? []).map(a => ({ value: a.id, label: a.name }))} onChange={setRef} />
    {!stage && <Select value={chosen?.id ?? ''} options={stages.map(s => ({ value: s.id, label: s.name }))} onChange={setStage} />}</>}
    {error ? <p role="alert">{error}</p> : view! ? <div className="aw-preview-card"><ImagePreview layers={view!.icon ? [view!.icon] : []} alt="当前有效图标" fallback={view!.iconMode === 'unknown' ? '？' : '无图标'} /><h3>{view!.name || '名称不显示'}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{view!.description || '说明不显示'}</p><small>{view!.levelName || '等级不显示'}</small></div> : <p className="aw-note">{reference ? '本阶段不输出此项。' : '添加成就后可选择参考内容。'}</p>}
    <p className="aw-note">排版、CSS 与动画请在官方预览查看。</p></>;
}
