import { useEffect, useState } from 'react';
import { Button, FieldRow, Section, Select, Switch, TextInput, useSetting } from '@avg-studio/studio-ui';
import { CSS_TARGETS, cssOwnerKey, cssProperties, cssStopsEffect, parseCssRecords, parseElementCss, resolveElementCss, sameOwner, type CssOwner, type CssSurface, type ElementCssRecord } from './element-css';
import type { CardAppearance } from './card-style';

const note = { color: 'var(--fg-secondary)', fontSize: '0.9em' };
export function ElementCssEditor({ owner, inheritedOwners = [], appearance, surface }: { owner: CssOwner; inheritedOwners?: CssOwner[]; appearance?: Partial<CardAppearance>; surface?: Exclude<CssSurface, 'both'> }) {
  return <Section title="元素进阶 CSS" collapsible defaultOpen={false} description="普通配置打底，CSS 覆盖同名样式；只影响当前元素，切换阶段自动清理。">
    <CssEditor key={cssOwnerKey(owner)} owner={owner} inheritedOwners={inheritedOwners} appearance={appearance} fixedSurface={surface} />
  </Section>;
}
function CssEditor({ owner, inheritedOwners, appearance, fixedSurface }: { owner: CssOwner; inheritedOwners: CssOwner[]; appearance?: Partial<CardAppearance>; fixedSurface?: Exclude<CssSurface, 'both'> }) {
  const [stored, setRows] = useSetting<ElementCssRecord[]>('main.elementCss');
  const rows = stored ?? [];
  const [target, setTarget] = useState('background');
  const [elementId, setElementId] = useState('');
  const [surface, setSurface] = useState<CssSurface>(fixedSurface ?? 'both');
  const selectedTarget = target === 'custom' ? `element:${elementId.trim()}` : target;
  const row = rows.find(r => sameOwner(r, owner) && r.target === selectedTarget && r.surface === surface);
  const [draft, setDraft] = useState(row?.css ?? '');
  const [replace, setReplace] = useState(row?.replace ?? false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setDraft(row?.css ?? ''); setReplace(row?.replace ?? false); setMessage(''); setError(''); }, [selectedTarget, surface, row?.css, row?.replace]);
  const savedTargets = [...new Set(rows.filter(r => sameOwner(r, owner)).map(r => r.target))];
  const save = (remove = false) => {
    try {
      const remaining = rows.filter(r => !(sameOwner(r, owner) && r.target === selectedTarget && r.surface === surface));
      const next = remove ? remaining : [...remaining, { ...owner, id: row?.id ?? 'css_' + crypto.randomUUID(), target: selectedTarget, surface, css: draft, replace }];
      parseCssRecords(next);
      if (!setRows(next)) throw Error('保存失败，请检查配置。');
      setError(''); setMessage(remove ? '已恢复继承。' : 'CSS 已应用。'); return true;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
  };
  const inherited = resolveElementCss(rows.filter(r => !(sameOwner(r, owner) && r.surface === surface)), [...inheritedOwners, ...(fixedSurface ? [owner] : [])]).filter(r => r.target === selectedTarget && (surface === 'both' || r.surface === surface));
  let props = new Set<string>();
  try { parseElementCss(draft); props = cssProperties([...(replace ? [] : inherited.map(r => r.css)), draft]); } catch { /* incomplete drafts remain editable */ }
  const effect = selectedTarget === 'icon' ? appearance?.iconEffect : selectedTarget === 'frame' ? appearance?.frameEffect : undefined;
  const conflict = effect && cssStopsEffect(props, effect);
  const dirty = draft !== (row?.css ?? '') || replace !== (row?.replace ?? false);
  return <>
    <FieldRow label="配置元素"><Select value={target} options={[...Object.entries(CSS_TARGETS).map(([value, label]) => ({ value, label })), ...savedTargets.filter(t => t.startsWith('element:')).map(value => ({ value, label: `自建元素 ${value.slice(8)}` })), { value: 'custom', label: '添加自建元素（按编号）' }]}
      onChange={value => { if (dirty && !save()) return; setTarget(value); }} /></FieldRow>
    {target === 'custom' && <FieldRow label="元素编号" description="填写官方源码中的元素 id；卡片使用模板直属基础元素，浮现元素还需在官方编辑器填写唯一标识符。"><TextInput value={elementId} onChange={value => { if (dirty && !save()) return; setElementId(value); }} placeholder="例如 image-… 或 rect-…" /></FieldRow>}
    {!fixedSurface && <FieldRow label="使用位置"><Select value={surface} options={[{ value: 'both', label: '卡片与浮现共用' }, { value: 'card', label: '仅卡片' }, { value: 'popup', label: '仅浮现' }]}
      onChange={value => { if (dirty && !save()) return; setSurface(value as CssSurface); }} /></FieldRow>}
    {savedTargets.length > 0 && <p style={note}>本处已配置：{savedTargets.map(t => CSS_TARGETS[t as keyof typeof CSS_TARGETS] ?? t).join('、')}</p>}
    <FieldRow label="替换此元素的上级 CSS" description="关闭时补充共用样式；开启并留空可停用继承的 CSS。普通配置仍保留。"><Switch checked={replace} onChange={setReplace} /></FieldRow>
    <textarea aria-label="元素 CSS" spellCheck={false} value={draft} onChange={e => { setDraft(e.target.value); setMessage(''); }}
      placeholder={'border-radius: 20px;\nbox-shadow: 0 4px 16px currentColor;'}
      style={{ width: '100%', minHeight: 160, padding: 12, fontFamily: 'monospace', color: 'var(--fg-primary)', background: 'var(--bg-sunken)', border: '1px solid var(--border-default)', borderRadius: 6 }} />
    <p style={note}>直接填写属性；状态可写 &:hover {'{ … }'}，动画可用 @keyframes。无需 !important。不支持全局选择器、@import、嵌套规则或外部图片地址；工程图片用素材选择器。</p>
    {props.size > 0 && <p style={note}>由 CSS 管理：{[...props].join('、')}。对应普通设置保留原值；移除此覆盖后恢复。</p>}
    {conflict && <p style={{ ...note, color: 'var(--warn)' }}>CSS 接管了动效相关属性，此元素的内置附加动效暂停。</p>}
    <div style={{ display: 'flex', gap: 8 }}>
      <Button onClick={() => save()}>应用 CSS</Button>
      <Button disabled={!row} onClick={() => save(true)}>恢复继承</Button>
    </div>
    {inherited.length > 0 && <details><summary>查看继承的 CSS</summary><pre style={{ ...note, whiteSpace: 'pre-wrap' }}>{[...new Set(inherited.map(r => r.css))].join('\n')}</pre></details>}
    {error && <p role="alert" style={{ color: 'var(--warn)' }}>{error}</p>}
    {message && <p role="status" style={note}>{message}</p>}
  </>;
}
