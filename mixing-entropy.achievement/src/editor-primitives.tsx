import { createContext, useContext, type ReactNode } from 'react';
import { Button, type FieldRowProps, type SectionProps, type TextInputProps } from '@avg-studio/studio-ui';
import { EditorScope, useDraft, useEditorState } from './editor-session';
import { RemovalContext } from './removal-context';
import { useNavigation, useSelection } from './editor-navigation';
const Label = createContext('输入');
export function FieldRow({ label, description, disabled, children }: FieldRowProps) {
  return <EditorScope id={label}><Label.Provider value={label}><div className="aw-field" data-field={label} aria-disabled={disabled || undefined}>
    <div className="aw-label">{label}{description && <p className="aw-note">{description}</p>}</div><fieldset aria-label={label} disabled={disabled}>{children}</fieldset>
  </div></Label.Provider></EditorScope>;
}
export function Section({ title, description, children, actions }: SectionProps) {
  return <EditorScope id={title}><section className="aw-section"><header><h3>{title}</h3>{actions}</header>{description && <p className="aw-note">{description}</p>}{children}</section></EditorScope>;
}
export function DraftFeedback({ draft, useLatest, keepDraft }: ReturnType<typeof useDraft>) {
  return draft ? <div className="aw-note" role="status">{draft.message || '待提交…'}{draft.state === 'conflict' && <div className="aw-actions"><Button onClick={useLatest}>使用最新值</Button><Button onClick={keepDraft}>核对后保留草稿</Button></div>}</div> : null;
}
export function TextInput({ value, onChange, multiline, ariaLabel, required, validate, ...props }: TextInputProps & { required?: boolean; validate?: (v: string) => string }) {
  const label = useContext(Label);
  const d = useDraft(value ?? '', onChange, validate ?? (v => v.length > 1000 ? '最多 1000 个字符。' : required && !v.trim() ? '请填写内容；草稿尚未提交。' : ''), ariaLabel ?? 'value');
  const common = { ...props, className: 'aw-input', 'aria-label': ariaLabel ?? label, value: d.value, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => d.edit(e.target.value), onBlur: d.commit };
  return <>{multiline ? <textarea {...common} rows={4} /> : <input {...common} type="text" />}<DraftFeedback {...d} /></>;
}
export function Numeric({ value, onChange, min = 0, max = 4096, step = 1, ariaLabel }: { value: number; onChange: (n: number) => boolean | void; min?: number; max?: number; step?: number; ariaLabel?: string }) {
  const label = useContext(Label);
  const d = useDraft(String(value), raw => onChange(Number(raw)), raw => raw.trim() && Number.isFinite(Number(raw)) && Number(raw) >= min && Number(raw) <= max ? '' : `请输入 ${min}—${max} 之间的数值。`, ariaLabel ?? 'number');
  return <><input className="aw-input" aria-label={ariaLabel ?? label} type="number" min={min} max={max} step={step} value={d.value} onChange={e => d.edit(e.target.value)} onBlur={d.commit} /><DraftFeedback {...d} /></>;
}
export function Tabs({ value, onChange, items, label = '工作区' }: { value: string; onChange: (id: string) => void; items: { id: string; name: string }[]; label?: string }) {
  return <nav className="aw-tabs" aria-label={label}>{items.map((item, index) => <button type="button" key={item.id} aria-current={value === item.id ? 'page' : undefined}
    onClick={() => onChange(item.id)} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length; onChange(items[n].id); (e.currentTarget.parentElement?.children[n] as HTMLElement)?.focus(); } }}>{item.name}</button>)}</nav>;
}
export function ObjectList({ items, selected, onSelect, title, actions, onRemove, removalReason, extra }: { items: { id: string; name: string }[]; selected: string; onSelect: (id: string) => void; title: string; actions?: ReactNode; extra?: ReactNode; onRemove?: (id: string) => void; removalReason?: (id: string) => string }) {
  const [query, setQuery] = useEditorState('search:' + title, ''), [page, setPage] = useEditorState('page:' + title, 0);
  const found = items.filter(i => `${i.name} ${i.id}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const pages = Math.max(1, Math.ceil(found.length / 50)), shownPage = Math.min(page, pages - 1);
  return <aside className="aw-object-list"><h3>{title} <small>{items.length}</small></h3>{extra}
    <input className="aw-input" aria-label={'搜索' + title} value={query} placeholder="搜索名称或编号" onChange={e => { setQuery(e.target.value); setPage(0); }} />
    <div className="aw-actions">{actions}</div><div className="aw-list" aria-label={title}>
      {found.slice(shownPage * 50, (shownPage + 1) * 50).map(i => <RemovalContext key={i.id} title={`${i.name}（${i.id}）`} label="删除" detail="按当前对象的删除保护处理。" reason={onRemove ? removalReason?.(i.id) : '此入口不可删除。'} onRemove={() => onRemove?.(i.id)}>
        <button className="aw-object" aria-current={selected === i.id ? 'true' : undefined} onClick={() => onSelect(i.id)}><strong>{i.name || '未命名'}</strong><small>{i.id}</small></button>
      </RemovalContext>)}
      {!found.length && <p className="aw-note">没有匹配项；当前编辑对象保持不变。</p>}
    </div>{pages > 1 && <div className="aw-actions"><Button disabled={!shownPage} onClick={() => setPage(shownPage - 1)}>上一页</Button><span>{shownPage + 1} / {pages}</span><Button disabled={shownPage + 1 >= pages} onClick={() => setPage(shownPage + 1)}>下一页</Button></div>}
  </aside>;
}
export function Workspace({ list, children, preview, selected = true }: { list: ReactNode; children: ReactNode; preview?: ReactNode; selected?: boolean }) {
  const nav = useNavigation();
  const [mobile, setMobile] = useSelection('mobile:' + (nav ? nav.route.area + '/' + nav.route.sub : 'local'));
  const detail = mobile === 'detail', setDetail = (value: boolean) => setMobile(value ? 'detail' : 'list');
  return <div className={`aw-workspace ${detail ? 'aw-show-detail' : ''} ${preview ? 'aw-has-preview' : ''}`}>
    <div className="aw-list-column" onClick={e => { const button = (e.target as HTMLElement).closest('button'); const text = button?.textContent ?? ''; if (button && (button.matches('.aw-object') || text === '创建' || text.includes('＋') && !text.includes('新建成就'))) setDetail(true); }}>{list}</div>
    <main className="aw-editor"><div className="aw-mobile"><Button onClick={() => setDetail(false)}>← 返回列表</Button></div>{selected ? children : <p>从左侧选择一个对象，或新建一个。</p>}</main>
    {preview && <aside className="aw-preview">{preview}</aside>}
  </div>;
}
