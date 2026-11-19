import { SettingField } from './editor-setting-field';
import { FieldRow, Section, DraftFeedback } from './editor-primitives';
import { useDraft, useSetting } from './editor-session';
import { useState } from 'react';
import { Button, NumberSlider, Select } from '@avg-studio/studio-ui';
import { DEFAULT_LEVELS, resolveStages, type Achievement, type Level, type DisplayStage, type StageTemplate } from './model';
import { flattenNotificationRules, parseNotificationRules, SORT_LABELS, type NotificationSortRow, type NotificationSortRule, type SortField } from './notification-policy';
import { RemovalContext } from './removal-context';

const note = { color: 'var(--fg-secondary)', fontSize: '0.9em' };
function moved<T>(values: readonly T[], index: number, offset: number): T[] {
  const next = [...values]; const other = index + offset;
  if (other >= 0 && other < next.length) [next[index], next[other]] = [next[other], next[index]];
  return next;
}
export function NotificationOrdering() {
  const [rows, setRows] = useSetting<NotificationSortRow[]>('main.notificationSort');
  const [levels] = useSetting<Level[]>('main.levels');
  const [items] = useSetting<Achievement[]>('main.achievements');
  const [stages] = useSetting<DisplayStage[]>('main.displayStages');
  const [defaults] = useSetting<StageTemplate[]>('main.defaultStages');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<{field: string; value?: string} | null>(null);
  let rules: NotificationSortRule[];
  try { rules = parseNotificationRules(rows); } catch (e) { return <p role="alert">{String(e)}；请通过此设置的官方重置入口恢复后重新编排。</p>; }
  const save = (next: NotificationSortRule[]) => { const ok = setRows(flattenNotificationRules(next)); setError(ok ? '' : '排序保存失败，原规则未修改。'); };
  const change = (index: number, rule: NotificationSortRule) => save(rules.map((r, i) => i === index ? rule : r));
  const stageChoices = new Map<string, string>();
  (items ?? []).forEach(item => resolveStages(item.id, defaults, stages).forEach(stage => stageChoices.set(stage.id, stage.name)));
  const choices = (field: SortField) => field === 'level' ? (levels?.length ? levels : DEFAULT_LEVELS).map(r => ({ value: r.id, label: `${r.name}（${r.id}）` }))
    : field === 'achievement' ? (items ?? []).map(r => ({ value: r.id, label: `${r.name}（${r.id}）` }))
      : [...stageChoices].map(([id, name]) => ({ value: id, label: `${name}（${id}）` }));
  return <Section title="展示顺序" collapsible defaultOpen={false} description="按下面规则从上到下比较；每项优先值也是从上到下。结果相同按接收顺序，留空即不改变原顺序。">
    {error && <p role="alert">{error}</p>}
    {rules.map((rule, index) => <RemovalContext key={rule.field} title={`${index + 1}. ${SORT_LABELS[rule.field]}`} label="移除规则"
      detail="移除此规则及其优先值。" onRemove={() => save(rules.filter(r => r.field !== rule.field))}>
      <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!dragging || dragging.value || dragging.field === rule.field) return; const next = [...rules]; const from = next.findIndex(r => r.field === dragging.field); if (from < 0) return; next.splice(index,0,next.splice(from,1)[0]); save(next); setDragging(null); }}>
      <Section title={`${index + 1}. ${SORT_LABELS[rule.field]}`}>
      <button type="button" className="aw-drag" draggable aria-label="拖动排序规则" title="拖动排序，也可使用上移、下移" onDragStart={() => setDragging({field:rule.field})} onDragEnd={() => setDragging(null)}>⠿ 拖动规则</button>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button disabled={index === 0} onClick={() => save(moved(rules, index, -1))}>规则上移</Button>
        <Button disabled={index === rules.length - 1} onClick={() => save(moved(rules, index, 1))}>规则下移</Button>
        <Button onClick={() => save(rules.filter((_, i) => i !== index))}>移除规则</Button>
      </div>
      {rule.values.map((value, i) => <RemovalContext key={value} title={choices(rule.field).find(c => c.value === value)?.label ?? value} label="移除此优先值"
        detail="从本规则中移除此优先值。"
        onRemove={() => change(index, { ...rule, values: rule.values.filter(v => v !== value) })}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, marginTop: 8, border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
        <button type="button" className="aw-drag" draggable aria-label="拖动优先值" onDragStart={e => { e.stopPropagation(); setDragging({field:rule.field,value}); }} onDragEnd={() => setDragging(null)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.stopPropagation(); if (dragging?.field !== rule.field || !dragging.value) return; const next = [...rule.values]; const from = next.indexOf(dragging.value); if (from < 0) return; next.splice(i,0,next.splice(from,1)[0]); change(index,{...rule,values:next}); setDragging(null); }}>⠿</button>
        <span style={{ flex: 1, overflowWrap: 'anywhere' }}>{i + 1}. {choices(rule.field).find(c => c.value === value)?.label ?? `已移除或未知：${value}`}</span>
        <Button disabled={i === 0} onClick={() => change(index, { ...rule, values: moved(rule.values, i, -1) })}>上移</Button>
        <Button disabled={i === rule.values.length - 1} onClick={() => change(index, { ...rule, values: moved(rule.values, i, 1) })}>下移</Button>
        <Button onClick={() => change(index, { ...rule, values: rule.values.filter(v => v !== value) })}>移除</Button>
      </RemovalContext>)}
      <FieldRow label="添加优先值"><Select value="" placeholder="选择要优先的值" options={choices(rule.field).filter(c => !rule.values.includes(c.value))}
        onChange={value => { if (value) change(index, { ...rule, values: [...rule.values, value] }); }} /></FieldRow>
      <p style={note}>未列出的值并列靠后，再比较下一条规则。阶段按编号匹配；不同成就的同编号阶段属于同一优先值。</p>
    </Section></div></RemovalContext>)}
    {rules.length < 3 && <FieldRow label="添加排序规则"><Select value="" placeholder="选择成就属性" options={(Object.keys(SORT_LABELS) as SortField[]).filter(field => !rules.some(r => r.field === field)).map(field => ({ value: field, label: SORT_LABELS[field] }))}
      onChange={field => { if (Object.prototype.hasOwnProperty.call(SORT_LABELS, field)) save([...rules, { field: field as SortField, values: [] }]); }} /></FieldRow>}
  </Section>;
}
function DurationRatio() {
  const [value, setValue] = useSetting<number>('main.notificationDurationPercent');
  const d = useDraft(String(value ?? 67), raw => setValue(Number(raw)), raw => Number(raw) >= 10 && Number(raw) <= 100 ? '' : '请输入 10—100。', 'notification-percent');
  return <>
    <FieldRow label="停留时长为原来的"><div onBlur={d.commit}><NumberSlider ariaLabel="连续浮现停留时长比例" value={Number(d.value)} min={10} max={100} step={1} unit="%" onChange={v => d.edit(String(v))} /><DraftFeedback {...d}/></div></FieldRow>
    <p style={note}>本批超过一个成就才应用，包括第一条。原来 3 秒 → 约 {(3 * (value ?? 67) / 100).toFixed(2)} 秒；每条按自身原时长换算，进场、退场动画不变。100% 为原时长。</p>
  </>;
}
export function NotificationSettings() {
  return <Section title="批次与播放规则" collapsible defaultOpen={false} description="收集结束后，按本批规则连续或合并播放。">
    <SettingField name="main.notifications" />
    <SettingField name="main.notificationMode" />
    <SettingField name="main.allowNotificationModeSwitch" />
    <p style={note}>自制设置页的按钮可调用“浮现方式 → 切换到另一种方式”；按钮文字可绑定当前方式名称。关闭玩家切换后只用创作者默认值。</p>
    <SettingField name="main.notificationWindowMs" />
    <Section title="连续浮现规则" collapsible defaultOpen={false}><DurationRatio /></Section>
    <NotificationOrdering />
  </Section>;
}

export function SummarySettings() {
  return <Section title="合并浮现" collapsible defaultOpen={false} description="本批两个以上成就使用汇总界面，只有一个时使用该阶段原浮现。">
      <SettingField name="main.summaryUI" /><SettingField name="main.summaryDurationMs" />
      <p style={note}>在官方界面编辑器编排汇总文字和动画。默认文字为“解锁了 N 个成就”，N 统计本批不同成就，不额外判断解锁状态。</p>
    </Section>;
}
