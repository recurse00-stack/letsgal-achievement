import { useState } from 'react';
import { Button, Select, Switch } from '@avg-studio/studio-ui';
import { DEFAULT_FIELDS, MAX_TIER, bindingOf, detachGroup, membersOf, orderedGroups, resolveTiers, sourceKey, updateBinding, type DefaultField, type GroupRow, type TierRow } from './groups';
import { DEFAULT_LEVELS, type Achievement, type Level, type StageTemplate } from './model';
import type { AppearancePreset } from './appearance-presets';
import { EditorScope, useSetting } from './editor-session';
import { useSelection, useNavigation } from './editor-navigation';
import { FieldRow, TextInput, ObjectList, Section, Workspace } from './editor-primitives';

const labels = {level:'等级', card:'卡片方案', popup:'浮现方案'};
function useGroups() {
  const [saved, save] = useSetting<GroupRow[]>('main.groupCatalog');
  const [levels] = useSetting<Level[]>('main.levels');
  const [appearances] = useSetting<AppearancePreset[]>('main.appearances');
  const rows = saved ?? [];
  function choices(field: DefaultField) {
    return (field === 'level' ? levels?.length ? levels : DEFAULT_LEVELS : (appearances ?? []).filter(p => !p.surface || p.surface === field))
      .map(row => ({value:row.id,label:row.name}));
  }
  return {rows,save,groups:orderedGroups(rows),choices};
}
function addMember(rows: GroupRow[], group:string, achievement:string): GroupRow[] {
  const members = membersOf(rows,group);
  if (members.some(row => row.achievement === achievement)) return rows;
  return [...rows,{id:'member:' + group + ':' + achievement,kind:'member',group,achievement,order:(members[members.length-1]?.order ?? -1)+1}];
}
function reorder(rows: GroupRow[], sorted: GroupRow[], id: string, delta:number) {
  const from = sorted.findIndex(row => row.id === id), to = from + delta;
  if (from < 0 || to < 0 || to >= sorted.length) return rows;
  const order = [...sorted];
  [order[from],order[to]] = [order[to],order[from]];
  const rank = new Map(order.map((row,i) => [row.id,i]));
  return rows.map(row => rank.has(row.id) ? {...row,order:rank.get(row.id)} : row);
}
function useDetach(rows:GroupRow[], save:(value:GroupRow[])=>boolean, choices:ReturnType<typeof useGroups>['choices']) {
  const [items] = useSetting<Achievement[]>('main.achievements');
  const [pending,setPending] = useState<{group:string; achievement?:string; clear?:DefaultField}>();
  const group = rows.find(row => row.kind === 'group' && row.id === pending?.group);
  const detach = (g:GroupRow, achievement?:string, clear?:DefaultField) => {
    const used = rows.some(row => row.kind === 'binding' && (!achievement || row.achievement === achievement)
      && DEFAULT_FIELDS.some(field => (!clear || clear === field) && row[sourceKey(field)] === g.id));
    if (used || (!achievement && !clear)) setPending({group:g.id,achievement,clear});
    else save(detachGroup(rows,g,{achievement,clear}));
  };
  const links = group && pending ? rows.flatMap(row => row.kind === 'binding' && (!pending.achievement || row.achievement === pending.achievement)
    ? DEFAULT_FIELDS.filter(field => (!pending.clear || field === pending.clear) && row[sourceKey(field)] === group.id)
      .map(field => {
        const name = items?.find(item => item.id === row.achievement)?.name ?? row.achievement;
        const value = choices(field).find(option => option.value === group[field])?.label ?? group[field];
        return <div key={JSON.stringify([row.id,field])}>{name} · {labels[field]} → {value}</div>;
      }) : []) : [];
  const confirmation = group && pending && <div role="alert">
    <p>{pending.clear ? '清空组默认值' : pending.achievement ? '移出成员' : '删除分组'}「{group.name}」？</p>
    {!!links.length && <details open><summary>以下成就将保留当前值</summary>{links}</details>}
    <Button onClick={() => {if (save(detachGroup(rows,group,pending))) setPending(undefined);}}>确认</Button>
    <Button onClick={() => setPending(undefined)}>取消</Button></div>;
  return {detach,confirmation};
}
export function GroupEditor() {
  const {rows,groups,save,choices} = useGroups();
  const [items] = useSetting<Achievement[]>('main.achievements');
  const [selected,select] = useSelection('group');
  const [query,setQuery] = useState('');
  const group = groups.find(g => g.id === selected) ?? groups[0];
  const {detach,confirmation} = useDetach(rows,save,choices);
  const members = group ? membersOf(rows,group.id) : [];
  const patch = (change:Partial<GroupRow>) => save(rows.map(row => row.id === group.id ? {...row,...change} : row));
  const add = () => {
    const id = 'group_' + crypto.randomUUID();
    if (save([...rows,{id,kind:'group',name:'新分组',visible:true,order:(groups[groups.length-1]?.order ?? -1)+1}])) select(id);
  };
  const itemNames = new Map((items ?? []).map(a => [a.id,a.name]));
  return <Workspace selected={!!group} list={<ObjectList title="分组" items={groups.map(g => ({id:g.id,name:g.name ?? g.id}))}
    selected={group?.id ?? ''} onSelect={select} actions={<Button onClick={add}>＋ 新建分组</Button>} />}>
    {group && <EditorScope key={group.id} id={'group:'+group.id}><h2>{group.name}</h2>
      <FieldRow label="组名"><TextInput required value={group.name ?? ''} onChange={name => patch({name})}/></FieldRow>
      <FieldRow label="初始显示"><Switch checked={group.visible !== false} onChange={visible => patch({visible})}/></FieldRow>
      <div className="aw-actions"><Button disabled={groups[0] === group} onClick={() => save(reorder(rows,groups,group.id,-1))}>分组上移</Button>
        <Button disabled={groups[groups.length-1] === group} onClick={() => save(reorder(rows,groups,group.id,1))}>分组下移</Button></div>
      {DEFAULT_FIELDS.map(field => <FieldRow key={field} label={'默认'+labels[field]}><Select value={group[field] || ''}
        options={[{value:'',label:'未指定'},...choices(field)]} onChange={value => value ? patch({[field]:value}) : detach(group,undefined,field)} /></FieldRow>)}
      <Section title="组内成员">{members.map((row,i) => <div key={row.id} className="aw-actions"><span>{itemNames.get(row.achievement!) ?? row.achievement}</span>
        <Button disabled={!i} onClick={() => save(reorder(rows,members,row.id,-1))}>上移</Button><Button disabled={i+1 === members.length} onClick={() => save(reorder(rows,members,row.id,1))}>下移</Button>
        <Button onClick={() => detach(group,row.achievement)}>移出</Button></div>)}
        <input aria-label="搜索可加入的成就" placeholder="搜索名称或编号" value={query} onChange={e => setQuery(e.target.value)}/>
        <Select value="" placeholder="选择成就加入" options={(items ?? []).filter(a => !members.some(m => m.achievement === a.id) && (a.name+' '+a.id).toLowerCase().includes(query.toLowerCase())).map(a => ({value:a.id,label:a.name}))}
          onChange={id => save(addMember(rows,group.id,id))}/></Section>
      <Button onClick={() => detach(group)}>删除分组…</Button>{confirmation}</EditorScope>}
  </Workspace>;
}
export function AchievementGroups({item}:{item:Achievement}) {
  const {rows,groups,save,choices} = useGroups();
  const binding = bindingOf(rows,item.id);
  const {detach,confirmation} = useDetach(rows,save,choices);
  const joined = groups.filter(group => membersOf(rows,group.id).some(row => row.achievement === item.id));
  if (!groups.length && !binding) return null;
  return <Section title="所属分组">{groups.map(group => <label key={group.id}><input type="checkbox" checked={joined.includes(group)}
    onChange={e => e.target.checked ? save(addMember(rows,group.id,item.id)) : detach(group,item.id)}/>{group.name}</label>)}
    {DEFAULT_FIELDS.map(field => {
      const opts = choices(field), key = sourceKey(field);
      const value = binding?.[key] ? 'g:'+binding[key] : binding?.[field] ? 'v:'+binding[field] : '';
      return <FieldRow key={field} label={labels[field]+'来源'}><Select value={value}
        options={[{value:'',label:field === 'level' ? '使用基础等级' : '使用通用默认方案'},...joined.filter(g => g[field]).map(g => ({value:'g:'+g.id,label:'沿用「'+g.name+'」 · '+(opts.find(v => v.value === g[field])?.label ?? g[field])})),
          ...opts.map(v => ({value:'v:'+v.value,label:'指定 · '+v.label}))]}
        onChange={v => save(updateBinding(rows,item.id,{[key]:v.startsWith('g:') ? v.slice(2) : '',[field]:v.startsWith('v:') ? v.slice(2) : ''}))}/></FieldRow>;
    })}{confirmation}</Section>;
}
export function GroupSourceSummary({achievement}:{achievement:string}) {
  const {rows,groups} = useGroups();
  const nav = useNavigation(), binding = bindingOf(rows,achievement);
  if (!binding) return null;
  return <div className="aw-actions">{DEFAULT_FIELDS.map(field => {
    const group = groups.find(g => g.id === binding[sourceKey(field)]);
    return group && <Button key={field} onClick={() => nav?.jump({area:'attributes',sub:'groups'},'group',group.id)}>{labels[field]} · {group.name}</Button>;
  })}</div>;
}
export function TierEditor({achievement,stages}:{achievement:string;stages:StageTemplate[]}) {
  const [saved,save] = useSetting<TierRow[]>('main.stageTiers');
  const rows = saved ?? [];
  const own = resolveTiers(achievement,rows.filter(row => row.achievementId === achievement),stages);
  const other = rows.filter(row => row.achievementId !== achievement);
  return <Section title="阶段层级" collapsible defaultOpen={false}>
    <FieldRow label="按层级获得"><Switch checked={!!own.length} onChange={enable => save(enable ? [...other,...stages.map((s,i) => ({achievementId:achievement,stageId:s.id,tier:i+1}))] : other)}/></FieldRow>
    {!!own.length && <><p>新阶段自动追加到最高层。同层先到者保留，更高层可直接获得。</p>
      <ol aria-label="当前阶段层序">{Array.from(new Set(own.map(row => row.tier))).sort((a,b) => a-b).map(tier => {
        const names = own.filter(row => row.tier === tier).map(row => stages.find(stage => stage.id === row.stageId)?.name).filter(Boolean);
        return names.length > 0 && <li key={tier}>第 {tier} 层 · {names.join(' ／ ')}</li>;
      })}</ol>
      {stages.map(stage => <EditorScope key={stage.id} id={stage.id}><FieldRow label={stage.name}><TextInput value={String(own.find(row => row.stageId === stage.id)!.tier)} validate={v => /^[1-9]\d{0,4}$/.test(v) && Number(v)<=MAX_TIER ? '' : `请输入 1 至 ${MAX_TIER} 之间的整数。`}
        onChange={v => save([...other,...own.map(row => row.stageId === stage.id ? {...row,tier:Number(v)} : row)])}/></FieldRow></EditorScope>)}</>}
  </Section>;
}
