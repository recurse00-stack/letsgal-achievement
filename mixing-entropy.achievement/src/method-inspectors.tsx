import { useState } from 'react';
import { Button, FieldRow, ParamField, Select, useInspectorEnvironment, useParam, useSetting } from '@avg-studio/studio-ui';
import { resolveStages, type Achievement, type DisplayStage, type StageTemplate } from './model';

function useStages(id: string | undefined) {
  const [items] = useSetting<Achievement[]>('main.achievements');
  const [saved] = useSetting<DisplayStage[]>('main.displayStages');
  const [defaults] = useSetting<StageTemplate[]>('main.defaultStages');
  if (!id || !items?.some(item => item.id === id)) return [];
  return resolveStages(id, defaults, saved);
}

function AchievementChoice() {
  const [items] = useSetting<Achievement[]>('main.achievements');
  const [id, setId, info] = useParam<string>('achievementId');
  const { readOnly } = useInspectorEnvironment();
  const [manual, setManual] = useState(false);
  return <>
    <FieldRow label="选择成就" description={!items?.length ? '先在局内成就系统配置页添加成就。' : undefined}>
      <Select value={info.isVariable ? '' : id ?? ''} disabled={readOnly} onChange={setId}
        options={[{ value: '', label: info.isVariable ? '当前使用变量' : '请选择成就', disabled: true }, ...(id && !items?.some(a => a.id === id) ? [{ value: id, label: `未找到：${id}` }] : []), ...(items ?? []).map(a => ({ value: a.id, label: `${a.name || '未命名'}（${a.id}）` }))]} />
    </FieldRow>
    <Button variant="ghost" onClick={() => setManual(!manual)}>{manual ? '收起编号／变量输入' : '按编号或变量指定'}</Button>
    {(manual || info.isVariable) && <ParamField name="achievementId" />}
  </>;
}

function StageChoice({ name, optional = false }: { name: string; optional?: boolean }) {
  const [achievementId, , achievementInfo] = useParam<string>('achievementId');
  const [value, setValue, info] = useParam<string>(name);
  const { readOnly } = useInspectorEnvironment();
  const [manual, setManual] = useState(false);
  const stages = useStages(achievementId);
  if (achievementInfo.isVariable || !achievementId || info.isVariable || manual) return <>
    <ParamField name={name} />
    {manual && <Button variant="ghost" onClick={() => setManual(false)}>返回阶段选择</Button>}
  </>;
  const missing = !!value && !stages.some(stage => stage.id === value);
  return <>
    <FieldRow label={optional ? '仅在此阶段执行' : '目标展示阶段'}
      description={!stages.length ? '请先选择配置中存在的成就。' : missing ? `原阶段编号 ${value} 不属于此成就或已被移除，请重新选择。原参数尚未修改。` : '只列出所选成就的阶段。'}>
      <Select value={value ?? ''} placeholder="请选择有效阶段" disabled={readOnly || !stages.length} onChange={setValue} options={[
        { value: '', label: optional ? '不限制' : '请选择阶段', disabled: !optional },
        ...stages.map(s => ({ value: s.id, label: `${s.name}（${s.id}）` })),
      ]} />
    </FieldRow>
    <Button variant="ghost" onClick={() => setManual(true)}>按阶段编号或变量指定</Button>
  </>;
}

export function OperationInspector() {
  const [expected, , expectedInfo] = useParam<string>('expectedStageId');
  const [advanced, setAdvanced] = useState(false);
  return <>
    <AchievementChoice />
    <StageChoice name="stageId" />
    <ParamField name="notify" />
    <Button variant="ghost" onClick={() => setAdvanced(!advanced)}>{advanced ? '收起阶段限制' : '设置执行前的阶段限制（可选）'}</Button>
    {(advanced || expected || expectedInfo.isVariable) && <StageChoice name="expectedStageId" optional />}
    <p>只切换当前展示阶段；相同阶段不重复浮现。阶段限制不匹配时跳过，界面通常自动刷新。</p>
  </>;
}

export function ReadInspector() {
  return <><AchievementChoice /><ParamField name="field" /><p>返回当前阶段或等级的文本。条件建议比较稳定编号；当前等级由本阶段配置决定。</p></>;
}
