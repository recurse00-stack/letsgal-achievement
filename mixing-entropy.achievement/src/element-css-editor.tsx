import { Button, Select, Switch } from '@avg-studio/studio-ui';
import { CSS_TARGETS, cssOwnerKey, cssProperties, cssStopsEffect, parseCssRecords, parseElementCss, resolveElementCss, sameOwner, type CssOwner, type CssSurface, type ElementCssRecord } from './element-css';
import type { CardAppearance } from './card-style';
import { RemovalContext } from './removal-context';
import { EditorScope, useDraft, useEditorState, useSetting } from './editor-session';
import { DraftFeedback, FieldRow, Section } from './editor-primitives';
export function ElementCssEditor({ owner, inheritedOwners = [], appearance, surface }: { owner: CssOwner; inheritedOwners?: CssOwner[]; appearance?: Partial<CardAppearance>; surface?: Exclude<CssSurface, 'both'> }) {
  return <EditorScope id={'css:' + cssOwnerKey(owner)}><Section title="元素 CSS" description="普通配置打底，CSS 覆盖同名样式；只影响当前元素。"><CssEditor owner={owner} inheritedOwners={inheritedOwners} appearance={appearance} fixedSurface={surface} /></Section></EditorScope>;
}
function CssEditor({ owner, inheritedOwners, appearance, fixedSurface }: { owner: CssOwner; inheritedOwners: CssOwner[]; appearance?: Partial<CardAppearance>; fixedSurface?: Exclude<CssSurface, 'both'> }) {
  const [stored] = useSetting<ElementCssRecord[]>('main.elementCss');
  const [target, setTarget] = useEditorState('target', 'background'), [elementId, setElementId] = useEditorState('new-element', '');
  const [surface, setSurface] = useEditorState<CssSurface>('surface', fixedSurface ?? 'both');
  const savedTargets = [...new Set((stored ?? []).filter(r => sameOwner(r, owner)).map(r => r.target))];
  const targets = [...Object.entries(CSS_TARGETS).map(([id, name]) => ({id,name})), ...savedTargets.filter(t => t.startsWith('element:')).map(id => ({id,name:'自建元素 ' + id.slice(8)}))];
  return <><p className="aw-note">所属：{owner.ownerKind} / {owner.achievementId ? owner.achievementId + ' / ' : ''}{owner.ownerId} · {surface === 'card' ? '卡片' : surface === 'popup' ? '浮现' : '两处共用'}</p>
    {!fixedSurface && <FieldRow label="使用位置"><Select value={surface} options={[{value:'both',label:'两处共用'},{value:'card',label:'卡片'},{value:'popup',label:'浮现'}]} onChange={v => setSurface(v as CssSurface)} /></FieldRow>}
    <div className="aw-css-grid"><div className="aw-list">{targets.map(t => <button key={t.id} className="aw-object" aria-current={target === t.id ? 'true' : undefined} onClick={() => setTarget(t.id)}>{t.name}{savedTargets.includes(t.id) ? ' · 已配置' : ''}</button>)}
      <input className="aw-input" aria-label="自建元素编号" placeholder="官方元素编号" value={elementId} onChange={e => setElementId(e.target.value)} /><Button disabled={!elementId.trim()} onClick={() => setTarget('element:' + elementId.trim())}>配置自建元素</Button></div>
      <EditorScope key={target + surface} id={target + '/' + surface}><CssField owner={owner} inheritedOwners={inheritedOwners} appearance={appearance} surface={surface} target={target} /></EditorScope>
    </div></>;
}
function CssField({ owner, inheritedOwners, appearance, surface, target }: { owner: CssOwner; inheritedOwners: CssOwner[]; appearance?: Partial<CardAppearance>; surface: CssSurface; target: string }) {
  const [stored, setRows] = useSetting<ElementCssRecord[]>('main.elementCss'); const rows = stored ?? [];
  const row = rows.find(r => sameOwner(r, owner) && r.target === target && r.surface === surface);
  const remaining = rows.filter(r => !(sameOwner(r, owner) && r.target === target && r.surface === surface));
  const record = (raw: string): ElementCssRecord => ({ ...owner, id: row?.id ?? 'css_' + crypto.randomUUID(), target, surface, ...JSON.parse(raw) });
  const d = useDraft(JSON.stringify({ css: row?.css ?? '', replace: row?.replace ?? false }), raw => setRows([...remaining, record(raw)]), raw => {
    try { parseCssRecords([...remaining, record(raw)]); return ''; } catch (e) { return String(e); }
  }, 'code');
  const draft = JSON.parse(d.value) as { css: string; replace: boolean };
  const inherited = resolveElementCss(remaining, [...inheritedOwners, owner]).filter(r => r.target === target && (surface === 'both' || r.surface === surface));
  let props = new Set<string>(); try { parseElementCss(draft.css); props = cssProperties([...(draft.replace ? [] : inherited.map(r => r.css)), draft.css]); } catch { /* Incomplete CSS remains a draft. */ }
  const effect = target === 'icon' ? appearance?.iconEffect : target === 'frame' ? appearance?.frameEffect : undefined;
  const remove = () => { if (setRows(remaining)) d.useLatest(); };
  return <RemovalContext title={'元素 CSS：' + target} label="移除此处 CSS" detail="只移除此元素当前使用位置的 CSS，保留界面元素与其他位置。" reason={row ? '' : '当前元素没有本地 CSS。'} onRemove={remove}>
    <h3>{CSS_TARGETS[target as keyof typeof CSS_TARGETS] ?? target}</h3><p className="aw-note">{row ? '已单独配置' : '沿用上级'} · {inherited.length ? '存在继承的 CSS' : '没有上级 CSS'}</p>
    <FieldRow label="替换上级 CSS" description="开启并留空可停用继承 CSS，普通配置仍保留。"><Switch checked={draft.replace} onChange={replace => { d.edit(JSON.stringify({...draft,replace})); d.commit(); }} /></FieldRow>
    <textarea className="aw-input aw-css-code" aria-label="元素 CSS" spellCheck={false} value={draft.css} onChange={e => d.edit(JSON.stringify({...draft,css:e.target.value}))} onBlur={d.commit} placeholder="border-radius: 20px;" />
    <DraftFeedback {...d} /><p className="aw-note">停止输入 0.5 秒后提交。支持属性、&:hover 与 @keyframes；不支持全局选择器、@import、外部图片地址。自建元素使用官方元素编号。</p>
    {!!props.size && <p className="aw-note">CSS 管理：{[...props].join('、')}。</p>}
    {effect && cssStopsEffect(props, effect) && <p className="aw-note">CSS 接管动效属性，此元素的内置附加动效暂停。</p>}
    <Button disabled={!row} onClick={remove}>恢复此元素继承</Button>
    {!!inherited.length && <details><summary>查看上级 CSS</summary><pre>{[...new Set(inherited.map(r => r.css))].join('\n')}</pre></details>}
  </RemovalContext>;
}
