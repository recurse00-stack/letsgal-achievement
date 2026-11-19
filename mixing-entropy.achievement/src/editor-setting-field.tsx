import { Button, Select, Switch, UIRefPicker } from '@avg-studio/studio-ui';
import { useSetting } from './editor-session';
import { FieldRow, Numeric } from './editor-primitives';
const settings: Record<string, { label: string; kind: 'ui' | 'boolean' | 'enum' | 'number'; min?: number; max?: number; options?: {value:string;label:string}[] }> = {
  page:{label:'成就页界面',kind:'ui'}, popup:{label:'默认浮现界面',kind:'ui'}, summaryUI:{label:'合并汇总界面',kind:'ui'},
  notifications:{label:'允许播放浮现',kind:'boolean'}, allowPlayerSwitch:{label:'允许玩家切换浏览方式',kind:'boolean'}, allowNotificationModeSwitch:{label:'允许玩家切换浮现方式',kind:'boolean'},
  scrollDirection:{label:'滚动方向',kind:'enum',options:[{value:'vertical',label:'纵向滚动'},{value:'horizontal',label:'横向滚动'}]},
  notificationMode:{label:'默认浮现方式',kind:'enum',options:[{value:'sequential',label:'连续浮现'},{value:'merged',label:'合并浮现'}]},
  durationMs:{label:'默认停留时长（毫秒）',kind:'number',min:300,max:60000}, summaryDurationMs:{label:'汇总停留时长（毫秒）',kind:'number',min:300,max:60000}, notificationWindowMs:{label:'批次收集窗口（毫秒）',kind:'number',min:50,max:5000},
};
export function SettingField({name}: {name:string}) {
  const [value,setValue,info] = useSetting<string|number|boolean>(name), definition = settings[name.replace(/^main\./,'')];
  if (!definition) return <p role="alert">未映射配置：{name}</p>;
  return <FieldRow label={definition.label} disabled={!info.isEnabled}>
    {definition.kind === 'ui' ? <UIRefPicker value={String(value ?? '').replace(/^ui:@?/, '')} onChange={v => setValue(v ? 'ui:@' + (v.includes('/') ? v : 'mixing-entropy.achievement/' + v) : '')} />
      : definition.kind === 'boolean' ? <Switch checked={value === true} onChange={setValue} />
      : definition.kind === 'enum' ? <Select value={String(value)} options={definition.options!} onChange={setValue} />
      : <Numeric value={Number(value)} min={definition.min} max={definition.max} onChange={setValue} />}
    {info.isModified && <Button variant="ghost" onClick={() => setValue(undefined)}>恢复此项默认</Button>}
  </FieldRow>;
}
