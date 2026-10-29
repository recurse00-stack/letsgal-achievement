import { Panel, Section, SettingField, useSetting } from '@avg-studio/studio-ui';
import { catalog, DEFAULT_LEVELS } from './model';
import { DefaultStageEditor } from './stage-editor';
import { AchievementEditor } from './achievement-editor';
import { OperationInspector, ReadInspector } from './method-inspectors';
import { CardLayoutEditor } from './card-editor';
import { SharedPresentationEditor, LevelAppearanceEditor } from './appearance-editor';
export const inspectors = { 'change-stage': OperationInspector, 'stage-info': ReadInspector };
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
    <p style={{ color: 'var(--fg-secondary)' }}>默认翻页／滚动只在官方编辑器设置：打开成就页，单击“双击编辑卡片 · 成就列表”，关闭“滚动模式”就是翻页，开启就是滚动。保存后重新打开游戏中的成就页生效。</p>
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
      <p style={{ color: 'var(--fg-secondary)' }}>官方页面的默认方式始终可用；勾选项仅增加可选方式。只有两种以上方式时才显示切换按钮，玩家已有且仍开放的选择优先。</p>
    </>}
    <p style={{ color: 'var(--fg-secondary)' }}>行、列、间距和列表大小也在官方编辑器设置。这里仅补充滚动方向和玩家切换权限。</p>
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
  let message: string;
  let invalid = false;
  try { const value = catalog(levels?.length ? levels : DEFAULT_LEVELS, items ?? [], stages ?? [], defaults ?? [], appearances ?? [], elementCss ?? [], presentations ?? []); message = `${value.achievements.length} 个成就，${value.levels.length} 个等级。`; }
  catch (error) { invalid = true; message = error instanceof Error ? error.message : String(error); }
  return <p role={invalid ? 'alert' : 'status'} style={{ color: invalid ? 'var(--warn)' : 'var(--fg-secondary)' }}>{message}</p>;
}
export function settingsPage() {
  return <Panel>
    <Section title="成就管理" collapsible description="点击成就展开基础内容与展示阶段；每条成就可独立收起。游戏中只记录当前阶段。">
      <Validation /><AchievementEditor />
    </Section>
    <Section title="通用配置" collapsible defaultOpen={false} description="统一维护等级、默认阶段，以及通用卡片展示和通用浮现方案。">
    <Section title="成就等级" collapsible defaultOpen={false} description="统一配置可供成就和阶段选择的等级。未配置时使用铜、银、金。">
      <LevelAppearanceEditor />
    </Section>
    <SharedPresentationEditor surface="card" /><SharedPresentationEditor surface="popup" />
    <Section title="默认阶段配置" collapsible defaultOpen={false} description="共用的阶段配置。成就默认沿用这里；在单个成就下修改后，仅该成就使用专用配置。">
      <DefaultStageEditor />
    </Section>
    </Section>
    <Section title="界面与播放" collapsible defaultOpen={false} description="成就页的编排、浏览方式和全局浮现播放开关；通用表现到通用配置管理。">
    <Section title="成就页与卡片编排" collapsible defaultOpen={false} description="默认翻页／滚动与页面编排统一在官方 UI 编辑器设置；这里补充滚动方向和玩家切换权限。通过“打开成就页”进入游戏界面。">
      <SettingField name="main.page" />
      <Browsing />
      <CardLayoutEditor />
    </Section>
    <Section title="浮现播放" collapsible defaultOpen={false} description="全局允许播放后，各阶段自行决定是否浮现。连续通知内置排队，依次播放；相同阶段不重复播放。">
      <SettingField name="main.notifications" />
    </Section>
    </Section>
  </Panel>;
}
