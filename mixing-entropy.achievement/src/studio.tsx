import { GroupEditor } from './group-editor';
import { GroupVisibilityInspector } from './method-inspectors';
import type { GroupRow, TierRow } from './groups';
import { Button } from '@avg-studio/studio-ui';
import { Section, Tabs } from './editor-primitives';
import { SettingField } from './editor-setting-field';
import { EditorSession, EditorScope, SaveStatus, useSetting } from './editor-session';
import { EditorNavigation, useNavigation } from './editor-navigation';
import { workbenchStyle } from './workbench-style';
import { WorkbenchScale } from './workbench-scale';
import { RelationGraph, RelationInterface } from './relation-graph';
import { catalog, DEFAULT_LEVELS } from './model';
import { DefaultStageEditor } from './stage-editor';
import { AchievementEditor } from './achievement-editor';
import { OperationInspector, ReadInspector, NotificationModeInspector, OpenPageInspector, RefreshInspector } from './method-inspectors';
import { SharedPresentationEditor, LevelAppearanceEditor } from './appearance-editor';
export const inspectors = { 'group-visibility':GroupVisibilityInspector, 'change-stage': OperationInspector, 'stage-info': ReadInspector, 'notification-mode': NotificationModeInspector, 'open-page': OpenPageInspector, refresh: RefreshInspector };
function Browsing() {
  const [playerChoice] = useSetting<boolean>('main.allowPlayerSwitch');
  const [paged, setPaged] = useSetting<boolean>('main.allowPagination');
  const [vertical, setVertical] = useSetting<boolean>('main.allowVertical');
  const [horizontal, setHorizontal] = useSetting<boolean>('main.allowHorizontal');
  const modes = [
    { label: '翻页', value: paged === true, set: setPaged },
    { label: '纵向滚动', value: vertical === true, set: setVertical },
    { label: '横向滚动', value: horizontal === true, set: setHorizontal },
  ];
  return <>
    <p style={{ color: 'var(--fg-secondary)' }}>官方编辑器 → 成就页 → 单击成就列表：设置行列、间距和大小。“滚动模式”关闭为翻页，开启为滚动。</p>
    <SettingField name="main.scrollDirection" />
    <SettingField name="main.allowPlayerSwitch" />
    {playerChoice === true && <>
      <p>额外开放给玩家的方式：</p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '8px 0' }}>
        {modes.map(mode => <label key={mode.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={mode.value}
            onChange={event => mode.set(event.target.checked)} />{mode.label}
        </label>)}
      </div>
      <p style={{ color: 'var(--fg-secondary)' }}>页面默认方式始终可用；有两种以上方式时显示切换按钮。</p>
    </>}
  </>;
}
function Validation() {
  const [levels] = useSetting<unknown[]>('main.levels');
  const [items] = useSetting<unknown[]>('main.achievements');
  const [stages] = useSetting<unknown[]>('main.displayStages');
  const [defaults] = useSetting<unknown[]>('main.defaultStages');
  const [appearances] = useSetting<unknown[]>('main.appearances');
  const [elementCss] = useSetting<unknown[]>('main.elementCss');
  const [presentations] = useSetting<unknown[]>('main.stagePresentations');
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const [tiers] = useSetting<TierRow[]>('main.stageTiers');
  let message: string;
  let invalid = false;
  try { const value = catalog(levels?.length ? levels : DEFAULT_LEVELS, items ?? [], stages ?? [], defaults ?? [], appearances ?? [], elementCss ?? [], presentations ?? [], groups ?? [], tiers ?? []); message = `${value.achievements.length} 个成就，${value.levels.length} 个等级。`; }
  catch (error) { invalid = true; message = error instanceof Error ? error.message : String(error); }
  return <p role={invalid ? 'alert' : 'status'} style={{ color: invalid ? 'var(--warn)' : 'var(--fg-secondary)' }}>{message}</p>;
}
function Workbench() {
  const nav = useNavigation()!;
  const { area, sub } = nav.route;
  const section = area === 'attributes' ? (['defaults','groups'].includes(sub) ? sub : 'levels') : (['page','cards','popups'].includes(sub) ? sub : 'page');
  return <div className="aw-root"><style>{workbenchStyle}</style><header className="aw-top"><h2>局内成就系统 · 创作工作台</h2>
    <Tabs value={area} onChange={next => nav.go({area:next,sub:next === 'attributes' ? 'levels' : 'page'})} items={[{id:'achievements',name:'成就'},{id:'attributes',name:'属性配置'},{id:'interfaces',name:'界面与浮现'}]} />
    <SaveStatus />{nav.canBack && <Button onClick={nav.back}>{nav.backLabel}</Button>}
  </header><Validation />
    {area !== 'achievements' && <Tabs value={section} onChange={next => nav.go({area,sub:next})} items={area === 'attributes' ? [{id:'levels',name:'等级'},{id:'defaults',name:'默认阶段'},{id:'groups',name:'分组'}] : [{id:'page',name:'成就页'},{id:'cards',name:'卡片'},{id:'popups',name:'浮现'}]} />}
    <EditorScope key={area + section} id={area + '/' + section}>
    {area === 'achievements' ? sub === 'graph' ? <RelationGraph /> : <AchievementEditor /> : area === 'attributes' ? section === 'groups' ? <GroupEditor /> : section === 'defaults' ? <DefaultStageEditor /> : <LevelAppearanceEditor /> : sub === 'reference' ? <RelationInterface /> : section === 'page' ? <Section title="成就页" description="页面与卡片几何由官方 UI 编辑器管理。"><SettingField name="main.page" /><SettingField name="main.allowGroupFilter" /><Browsing /></Section> : <SharedPresentationEditor surface={section === 'cards' ? 'card' : 'popup'} />}
    </EditorScope>
  </div>;
}
export function settingsPage() { return <EditorSession><EditorNavigation><style>{workbenchStyle}</style><WorkbenchScale><Workbench /></WorkbenchScale></EditorNavigation></EditorSession>; }
