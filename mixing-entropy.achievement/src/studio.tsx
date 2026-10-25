import { Panel, Section, SettingField, useSetting } from '@avg-studio/studio-ui';
import { catalog, DEFAULT_LEVELS } from './model';
function Browsing() {
  const [policy] = useSetting<string>('main.browsePolicy');
  const [paged, setPaged] = useSetting<boolean>('main.allowPagination');
  const [vertical, setVertical] = useSetting<boolean>('main.allowVertical');
  const [horizontal, setHorizontal] = useSetting<boolean>('main.allowHorizontal');
  const modes = [
    { label: '翻页', value: paged !== false, set: setPaged },
    { label: '纵向滚动', value: vertical !== false, set: setVertical },
    { label: '横向滚动', value: horizontal === true, set: setHorizontal },
  ];
  const count = modes.filter(m => m.value).length;
  return <>
    <SettingField name="main.browsePolicy" />
    {policy === 'player' && <>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '8px 0' }}>
        {modes.map(mode => <label key={mode.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={mode.value} disabled={mode.value && count === 1}
            onChange={event => mode.set(event.target.checked)} />{mode.label}
        </label>)}
      </div>
      <p style={{ color: 'var(--fg-secondary)' }}>{count > 1 ? '只显示已开放方式的切换按钮。' : '只开放一种方式时，不显示切换按钮。'}</p>
      {count === 0 && <p role="alert">至少开放一种方式；当前将使用翻页。</p>}
      <SettingField name="main.browseDefault" />
    </>}
    <p style={{ color: 'var(--fg-secondary)' }}>行列数与间距在可视化列表中设置。双击列表自由设计卡片；列表容器的高级 CSS 由浏览模块管理，卡片内样式不受影响。</p>
  </>;
}
function Validation() {
  const [levels] = useSetting<unknown[]>('main.levels');
  const [items] = useSetting<unknown[]>('main.achievements');
  let message: string;
  let invalid = false;
  try { const value = catalog(levels?.length ? levels : DEFAULT_LEVELS, items ?? []); message = `${value.achievements.length} 个成就，${value.levels.length} 个等级。`; }
  catch (error) { invalid = true; message = error instanceof Error ? error.message : String(error); }
  return <p role={invalid ? 'alert' : 'status'} style={{ color: invalid ? 'var(--warn)' : 'var(--fg-secondary)' }}>{message}</p>;
}
export function settingsPage() {
  return <Panel>
    <Section title="成就配置" description="填写定义；游戏中的激活记录由成就状态表保存。改名称或图标时保留原编号。">
      <Validation /><SettingField name="main.levels" /><SettingField name="main.achievements" />
    </Section>
    <Section title="玩家界面" description="选择向玩家提供的浏览方式；固定模式隐藏切换按钮。页面、卡片和翻页控件可在 UI 编辑器中编排，通过“打开成就页”进入。">
      <SettingField name="main.page" />
      <Browsing />
    </Section>
    <Section title="浮现动画" description="激活时依次播放；重复激活不重复通知。可编辑默认浮现界面中的进场、退场动画。">
      <SettingField name="main.notifications" /><SettingField name="main.popup" /><SettingField name="main.durationMs" />
    </Section>
  </Panel>;
}
