import { useState } from 'react';
import { AssetPicker, Button, FieldRow, Section, Select, TextInput, useSetting } from '@avg-studio/studio-ui';
import { DEFAULT_LEVELS, resolveStages, type Achievement, type DisplayStage, type Level, type StageTemplate } from './model';
import { AchievementStageEditor } from './stage-editor';

export function AchievementEditor() {
  const [saved, setSaved] = useSetting<Achievement[]>('main.achievements');
  const [configuredLevels] = useSetting<Level[]>('main.levels');
  const [configuredStages] = useSetting<StageTemplate[]>('main.defaultStages');
  const [stageOverrides] = useSetting<DisplayStage[]>('main.displayStages');
  const items = saved ?? [];
  const levels = configuredLevels?.length ? configuredLevels : DEFAULT_LEVELS;
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [newId, setNewId] = useState('');
  const [removeId, setRemoveId] = useState('');
  const [error, setError] = useState('');
  const save = (next: Achievement[]) => { const ok = setSaved(next); setError(ok ? '' : '保存失败，请检查填写内容。'); return ok; };
  const patch = (item: Achievement, changes: Partial<Achievement>) => save(items.map(a => a.id === item.id ? { ...a, ...changes } : a));
  const toggle = (id: string) => setOpen(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return <>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      <span>{items.length} 个成就</span>
      <Button variant="ghost" onClick={() => setOpen(new Set(items.map(a => a.id)))}>全部展开</Button>
      <Button variant="ghost" onClick={() => setOpen(new Set())}>全部收起</Button>
    </div>
    {items.map(item => <div key={item.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, marginBottom: 8, overflow: 'hidden' }}>
      <button type="button" aria-expanded={open.has(item.id)} onClick={() => toggle(item.id)}
        style={{ width: '100%', border: 0, padding: '14px 12px', cursor: 'pointer', background: 'var(--bg-subtle)', color: 'var(--fg-primary)', font: 'inherit', textAlign: 'left', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span aria-hidden="true">{open.has(item.id) ? '▾' : '▸'}</span>
        <strong style={{ flex: 1 }}>{item.name || '未命名成就'}</strong>
        <span style={{ color: 'var(--fg-secondary)', overflowWrap: 'anywhere' }}>{item.id}</span>
        <span>{levels.find(l => l.id === item.levelId)?.name ?? item.levelId}</span>
      </button>
      {open.has(item.id) && <div style={{ padding: 14 }}>
        <Section title="基础配置" collapsible defaultOpen={false} description="各阶段可沿用这里的名称、说明、图标和等级，也可单独设置。">
        <p style={{ color: 'var(--fg-secondary)' }}>成就编号：{item.id}（供剧情调用，修改名称不会改变编号）</p>
        <FieldRow label="名称"><TextInput value={item.name} onChange={name => patch(item, { name })} /></FieldRow>
        <FieldRow label="说明"><TextInput multiline value={item.description ?? ''} onChange={description => patch(item, { description })} /></FieldRow>
        <FieldRow label="图标"><AssetPicker accepts={['image']} value={item.icon ?? ''} onChange={icon => patch(item, { icon })} /></FieldRow>
        <FieldRow label="基础等级"><Select value={item.levelId} options={levels.map(l => ({ value: l.id, label: l.name }))} onChange={levelId => patch(item, { levelId })} /></FieldRow>
        </Section>
        <Section title="展示阶段" collapsible defaultOpen={false}>
        <AchievementStageEditor item={item} setInitial={initialStageId => patch(item, { initialStageId })} />
        </Section>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {removeId === item.id ? <>
            <span>移除成就配置？已有玩家阶段记录会保留。</span>
            <Button variant="danger" onClick={() => { if (save(items.filter(a => a.id !== item.id))) setRemoveId(''); }}>确认移除</Button>
            <Button onClick={() => setRemoveId('')}>取消</Button>
          </> : <Button variant="ghost" onClick={() => setRemoveId(item.id)}>移除成就</Button>}
        </div>
      </div>}
    </div>)}
    <FieldRow label="新成就编号（可留空）" description="留空自动生成。自填时使用字母、数字、点、横线或下划线；创建后保持稳定。">
      <TextInput value={newId} onChange={setNewId} placeholder="例如 first_step" />
    </FieldRow>
    <Button disabled={items.length >= 10000} onClick={() => {
      const id = newId.trim() || 'achievement_' + crypto.randomUUID();
      if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(id)) { setError('成就编号格式无效。'); return; }
      if (items.some(a => a.id === id)) { setError('这个成就编号已经存在。'); return; }
      const stages = resolveStages(id, configuredStages, stageOverrides);
      if (!stages.length) { setError('此编号保留的阶段配置没有可用阶段，请使用新编号或先恢复阶段配置。'); return; }
      const next: Achievement = { id, name: '新成就', description: '', icon: '', levelId: levels[0].id, initialStageId: stages.find(s => s.id === 'unknown')?.id ?? stages[0].id };
      if (save([...items, next])) { setOpen(previous => new Set([...previous, id])); setNewId(''); }
    }}>添加成就</Button>
    {error && <p role="alert">{error}</p>}
  </>;
}
