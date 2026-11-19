import { AchievementGroups } from './group-editor';
import { membersOf, orderedGroups, effectiveDefaults, type GroupRow } from './groups';
import { useState } from 'react';
import { AssetPicker, Button, Select, TextInput as ImmediateInput } from '@avg-studio/studio-ui';
import { DEFAULT_LEVELS, resolveStages, type Achievement, type DisplayStage, type Level, type StageTemplate } from './model';
import { AchievementStageEditor } from './stage-editor';
import { EditorScope, useEditorState, useSetting } from './editor-session';
import { FieldRow, Section, TextInput, ObjectList, Workspace, Tabs } from './editor-primitives';
import { useNavigation, useSelection } from './editor-navigation';
export function AchievementEditor() {
  const [saved, setSaved] = useSetting<Achievement[]>('main.achievements');
  const [configuredLevels] = useSetting<Level[]>('main.levels'), [configuredStages] = useSetting<StageTemplate[]>('main.defaultStages'), [stageOverrides] = useSetting<DisplayStage[]>('main.displayStages');
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const [filter,setFilter] = useEditorState('group-filter','');
  const groupList = orderedGroups(groups ?? []);
  const items = saved ?? [], levels = configuredLevels?.length ? configuredLevels : DEFAULT_LEVELS;
  const [selected, select] = useSelection('achievement'), [newId, setNewId] = useEditorState('new-id', ''), [creating, setCreating] = useEditorState('creating', false);
  const [removeId, setRemoveId] = useState(''), [error, setError] = useState('');
  const shown = groupList.some(g => g.id === filter) ? membersOf(groups ?? [],filter).flatMap(m => items.find(a => a.id === m.achievement) ?? []) : items;
  const item = shown.find(a => a.id === selected) ?? shown[0];
  const save = (next: Achievement[]) => { const ok = setSaved(next); setError(ok ? '' : '保存被拒绝，原配置保持。'); return ok; };
  const add = () => {
    const id = newId.trim() || 'achievement_' + crypto.randomUUID();
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(id)) { setError('编号格式无效。'); return; }
    if (items.some(a => a.id === id)) { setError('这个成就编号已经存在。'); return; }
    const stages = resolveStages(id, configuredStages, stageOverrides);
    if (!stages.length) { setError('此编号没有可用阶段，请使用新编号。'); return; }
    if (save([...items, { id, name: '新成就', description: '', icon: '', levelId: levels[0].id, initialStageId: stages.find(s => s.id === 'unknown')?.id ?? stages[0].id }])) { setFilter(''); select(id); setCreating(false); setNewId(''); }
  };
  return <Workspace selected={!!item} list={<ObjectList title="成就" items={shown} selected={item?.id ?? ''} onSelect={select} onRemove={id => { select(id); setRemoveId(id); }}
    actions={<Button disabled={items.length >= 10000} onClick={() => setCreating(!creating)}>＋ 新建成就</Button>}
    extra={<>{!!groupList.length && <Select value={filter} options={[{value:'',label:'全部成就'},...groupList.map(g => ({value:g.id,label:g.name ?? g.id}))]} onChange={setFilter}/>} {creating && <div className="aw-section"><p className="aw-note">稳定编号，可留空自动生成。</p><ImmediateInput value={newId} onChange={setNewId} placeholder="first_step" /><Button onClick={add}>创建</Button></div>}</>} />}>
    {error && <p role="alert">{error}</p>}
    {item && <EditorScope key={item.id} id={'achievement:' + item.id}><AchievementDetail item={item} levels={levels} patch={changes => save(items.map(a => a.id === item.id ? { ...a, ...changes } : a))} />
      <div className="aw-actions">{removeId === item.id ? <><span>移除成就配置？已有玩家阶段记录保留。</span><Button variant="danger" onClick={() => { if (save(items.filter(a => a.id !== item.id))) setRemoveId(''); }}>确认移除</Button><Button onClick={() => setRemoveId('')}>取消</Button></> : <Button onClick={() => setRemoveId(item.id)}>移除成就…</Button>}</div>
    </EditorScope>}
  </Workspace>;
}
function AchievementDetail({ item, levels, patch }: { item: Achievement; levels: Level[]; patch: (v: Partial<Achievement>) => boolean }) {
  const [tab, setTab] = useSelection('detail:' + item.id, 'stages'), nav = useNavigation();
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const resolved = effectiveDefaults(groups ?? [],item.id);
  return <><h2>{item.name}</h2><div className="aw-actions"><span className="aw-note">成就编号：{item.id}</span><Button onClick={() => nav?.jump({area:'achievements',sub:'graph'}, 'graph-achievement', item.id)}>查看关联图</Button></div>
    <Tabs value={tab} onChange={setTab} items={[{ id: 'stages', name: '阶段' }, { id: 'base', name: '基础资料' }]} />
    {tab === 'base' ? <Section title="基础资料" description="供阶段沿用的名称、说明、图标和等级。">
      <FieldRow label="名称"><TextInput required value={item.name} onChange={name => patch({ name })} /></FieldRow>
      <FieldRow label="说明"><TextInput multiline value={item.description ?? ''} onChange={description => patch({ description })} /></FieldRow>
      <FieldRow label="图标"><AssetPicker accepts={['image']} value={item.icon ?? ''} onChange={icon => patch({ icon })} /></FieldRow>
      <FieldRow label="基础等级"><Select disabled={!!resolved.level} value={resolved.level || item.levelId} options={levels.map(l => ({ value: l.id, label: l.name }))} onChange={levelId => patch({ levelId })} /></FieldRow>
      <AchievementGroups item={item}/>
    </Section> : <AchievementStageEditor item={resolved.level ? {...item,levelId:resolved.level} : item} setInitial={initialStageId => patch({ initialStageId })} />}
  </>;
}
