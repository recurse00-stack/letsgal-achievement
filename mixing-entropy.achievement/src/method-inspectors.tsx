import { FieldRow } from './editor-primitives';
import { EditorSession, SaveStatus, useSession } from './editor-session';
import { workbenchStyle } from './workbench-style';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button, ParamField, Select, useInspectorEnvironment, useParam, useSetting, type ParamInfo } from '@avg-studio/studio-ui';
import { resolveStages, type Achievement, type DisplayStage, type StageTemplate } from './model';

function useChoiceParam(name: string) {
  const [value, setValue, info] = useParam<string>(name);
  const session = useSession();
  const [error, setError] = useState('');
  useEffect(() => setError(''), [value, info.rawValue, info.isVariable]);
  const choose = (next: string) => {
    // Writing the displayed fallback back is a no-op in Studio. Explicitly
    // choosing that default must clear the invalid stored value instead.
    const ok = setValue(info.isInvalid && next === value ? undefined : next);
    if (session) { session.rejected = ok ? '' : '参数保存被拒绝。'; session.emit(); }
    setError(ok ? '' : '参数保存失败，原参数未修改。请检查输入或当前编辑权限后重试。');
  };
  return { value, choose, info, error };
}

function ParamFeedback({ info, error }: { info: ParamInfo; error: string }) {
  return <>
    {info.isInvalid && <p role="alert" style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
      原参数无效，尚未修改。{info.reason || '存储内容不符合参数要求。'}<br />
      原值：{JSON.stringify(info.rawValue) ?? String(info.rawValue)}
    </p>}
    {error && <p role="alert">{error}</p>}
  </>;
}

function useStages(id: string | undefined) {
  const [items] = useSetting<Achievement[]>('main.achievements');
  const [saved] = useSetting<DisplayStage[]>('main.displayStages');
  const [defaults] = useSetting<StageTemplate[]>('main.defaultStages');
  if (!id || !items?.some(item => item.id === id)) return [];
  return resolveStages(id, defaults, saved);
}

function AchievementChoice() {
  const [items] = useSetting<Achievement[]>('main.achievements');
  const { value: id, choose, info, error } = useChoiceParam('achievementId');
  const { readOnly, canUseVariables } = useInspectorEnvironment();
  const [manual, setManual] = useState(false);
  return <>
    <FieldRow label="选择成就" description={!items?.length ? '先在局内成就系统配置页添加成就。' : undefined}>
      <Select value={info.isInvalid ? '\u0000' : info.isVariable ? '' : id ?? ''} placeholder="原参数无效，请重新选择" disabled={readOnly} onChange={choose}
        options={[{ value: '', label: info.isVariable ? '当前使用变量' : '请选择成就', disabled: true }, ...(id && !items?.some(a => a.id === id) ? [{ value: id, label: `未找到：${id}` }] : []), ...(items ?? []).map(a => ({ value: a.id, label: `${a.name || '未命名'}（${a.id}）` }))]} />
    </FieldRow>
    <ParamFeedback info={info} error={error} />
    <Button variant="ghost" onClick={() => setManual(!manual)}>{manual ? (canUseVariables ? '收起编号／变量输入' : '收起编号输入') : (canUseVariables ? '按编号或变量指定' : '按编号指定')}</Button>
    {(manual || info.isVariable) && <ParamField name="achievementId" />}
  </>;
}

function StageChoice({ name, optional = false }: { name: string; optional?: boolean }) {
  const [achievementId, , achievementInfo] = useParam<string>('achievementId');
  const { value, choose, info, error } = useChoiceParam(name);
  const { readOnly, canUseVariables } = useInspectorEnvironment();
  const [manual, setManual] = useState(false);
  const stages = useStages(achievementInfo.isInvalid ? undefined : achievementId);
  if (achievementInfo.isVariable || achievementInfo.isInvalid || !achievementId || info.isVariable || manual) return <>
    <ParamField name={name} />
    <ParamFeedback info={info} error={error} />
    {manual && <Button variant="ghost" onClick={() => setManual(false)}>返回阶段选择</Button>}
  </>;
  const missing = !!value && !stages.some(stage => stage.id === value);
  return <>
    <FieldRow label={optional ? '仅在此阶段执行' : '目标展示阶段'}
      description={!stages.length ? '请先选择配置中存在的成就。' : missing ? `原阶段编号 ${value} 不属于此成就或已被移除，请重新选择。原参数尚未修改。` : optional ? '当前阶段不匹配时跳过操作。' : undefined}>
      <Select value={info.isInvalid ? '\u0000' : value ?? ''} placeholder={info.isInvalid ? '原参数无效，请重新选择' : '请选择有效阶段'} disabled={readOnly || !stages.length} onChange={choose} options={[
        { value: '', label: optional ? '不限制' : '请选择阶段', disabled: !optional },
        ...stages.map(s => ({ value: s.id, label: `${s.name}（${s.id}）` })),
      ]} />
    </FieldRow>
    <ParamFeedback info={info} error={error} />
    <Button variant="ghost" onClick={() => setManual(true)}>{canUseVariables ? '按阶段编号或变量指定' : '按阶段编号指定'}</Button>
  </>;
}

function OperationFields() {
  const [expected, , expectedInfo] = useParam<string>('expectedStageId');
  const [advanced, setAdvanced] = useState(false);
  return <>
    <AchievementChoice />
    <StageChoice name="stageId" />
    <ParamField name="notify" />
    <Button variant="ghost" onClick={() => setAdvanced(!advanced)}>{advanced ? '收起阶段限制' : '设置执行前的阶段限制（可选）'}</Button>
    {(advanced || expected || expectedInfo.isVariable || expectedInfo.isInvalid) && <StageChoice name="expectedStageId" optional />}
  </>;
}

export function GroupVisibilityInspector() {
  return <InspectorFrame><GroupVisibilityFields /></InspectorFrame>;
}
function GroupVisibilityFields() {
  const [rows] = useSetting<import('./groups').GroupRow[]>('main.groupCatalog');
  const {value,choose,info,error} = useChoiceParam('groupId');
  const {readOnly} = useInspectorEnvironment();
  return <><FieldRow label="分组"><Select value={value ?? ''} disabled={readOnly} options={(rows ?? []).filter(r => r.kind === 'group').map(r => ({value:r.id,label:r.name || r.id}))} placeholder="选择分组" onChange={choose}/></FieldRow>
    <ParamFeedback info={info} error={error}/><details><summary>使用编号或变量</summary><ParamField name="groupId"/></details><ParamField name="visible"/></>;
}
function ReadFields() {
  return <><AchievementChoice /><ParamField name="field" /><p>返回所选信息的文本值。</p></>;
}

function InspectorFrame({children}:{children:ReactNode}) { return <EditorSession><div className="aw-root"><style>{workbenchStyle}</style>{children}<SaveStatus /></div></EditorSession>; }
export function OperationInspector() { return <InspectorFrame><OperationFields /></InspectorFrame>; }
export function ReadInspector() { return <InspectorFrame><ReadFields /></InspectorFrame>; }
function NotificationModeFields() {
  const {value,choose,info,error} = useChoiceParam('action');
  const {readOnly,canUseVariables} = useInspectorEnvironment();
  const [manual,setManual] = useState(false);
  const options = [{value:'read',label:'读取当前方式'},{value:'toggle',label:'切换到另一种方式'},{value:'sequential',label:'使用连续浮现'},{value:'merged',label:'使用合并浮现'},{value:'default',label:'恢复创作者默认方式'}];
  return <><FieldRow label="浮现方式操作"><Select value={info.isVariable || info.isInvalid ? '' : value ?? ''} disabled={readOnly} placeholder="请选择操作" options={options} onChange={choose} /></FieldRow>
    <ParamFeedback info={info} error={error} /><p className="aw-note">返回当前方式编号；切换需在播放规则中允许玩家切换。</p>
    <Button onClick={()=>setManual(!manual)}>{canUseVariables ? '编号／变量输入' : '编号输入'}</Button>{(manual || info.isVariable) && <ParamField name="action" />}
  </>;
}
export function NotificationModeInspector() { return <InspectorFrame><NotificationModeFields /></InspectorFrame>; }
export function OpenPageInspector() { return <p>准备成就数据并打开所配置的成就页，接入创作者允许的浏览方式。此方法无须参数。</p>; }
export function RefreshInspector() { return <p>重新生成界面数据。阶段切换和常规配置变化通常自动刷新；此方法供需要主动同步的场合使用。</p>; }
