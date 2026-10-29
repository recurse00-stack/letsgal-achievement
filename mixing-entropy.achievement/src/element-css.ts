import postcss, { type Root, type Declaration } from 'postcss';

export const CSS_TARGETS = { background: '背景', backgroundImage: '背景图片', frame: '边框', icon: '图标', name: '名称', description: '说明', level: '等级文字', stageName: '阶段名称' } as const;
export type CssSurface = 'both' | 'card' | 'popup';
export interface CssOwner { ownerKind: 'appearance' | 'defaultStage' | 'stage'; ownerId: string; achievementId: string }
export interface ElementCssRecord extends CssOwner { id: string; target: string; surface: CssSurface; css: string; replace: boolean }
export interface ElementCssLayer { target: string; surface: CssSurface; css: string }
const targetOk = (s: string) => s in CSS_TARGETS || /^element:[A-Za-z0-9_.:-]{1,160}$/.test(s);
export const sameOwner = (a: CssOwner, b: CssOwner) => a.ownerKind === b.ownerKind && a.ownerId === b.ownerId && a.achievementId === b.achievementId;
export function cssOwnerKey(row: CssOwner): string { return `${row.ownerKind}/${row.achievementId}/${row.ownerId}`; }

/** Parse declarations, element-local states and keyframes; never accept a global rule. */
export function parseElementCss(css: string): Root {
  if (typeof css !== 'string' || css.length > 20000) throw Error('每份元素 CSS 最多 20000 字符。');
  const root = postcss.parse(css);
  root.walkAtRules(rule => {
    if (rule.name !== 'keyframes' || rule.parent !== root || !/^[A-Za-z_][\w-]*$/.test(rule.params)) throw rule.error('这里只支持元素内样式和 @keyframes 动画。');
  });
  root.walkRules(rule => {
    if (rule.parent?.type === 'atrule') {
      if (!rule.selector.split(',').every(v => /^(from|to|(?:\d+(?:\.\d+)?)%)$/.test(v.trim()))) throw rule.error('关键帧位置需要 from、to 或百分比。');
    } else if (rule.parent !== root || !rule.selector.split(',').every(s => /^&(?:(?::(?:hover|active|focus|focus-visible|focus-within|disabled))|(?:::?(?:before|after)))*(?:\s+img)?$/.test(s.trim()))) {
      throw rule.error('元素状态请使用 &:hover、&::before 等写法；图片子层使用 & img，不支持全局选择器或规则嵌套。');
    }
  });
  root.walkDecls(decl => {
    if (!/^(?:--[\w-]+|[a-zA-Z-]+)$/.test(decl.prop) || /^--achievement-/i.test(decl.prop)) throw decl.error('CSS 属性无效，不能修改成就系统的内部标记。');
    const decoded = decl.value.replace(/\\([\da-f]{1,6})\s?/gi, (_, n: string) => String.fromCodePoint(Math.min(parseInt(n, 16), 0x10ffff))).replace(/\\(.)/g, '$1').replace(/\/\*[\s\S]*?\*\//g, '');
    if (/expression\s*\(|javascript:|(?:image-set|src)\s*\(/i.test(decoded)) throw decl.error('不支持此 CSS 资源或表达式。');
    for (const match of decoded.matchAll(/url\s*\(\s*([\s\S]*?)\s*\)/gi)) {
      const url = match[1].replace(/^(['"])([\s\S]*)\1$/, '$2');
      if (!/^(?:data:image\/|#)/i.test(url)) throw decl.error('CSS 图片仅支持 data:image 或 #片段；工程图片请用素材选择器。');
    }
    if (decl.parent?.type !== 'root' && decl.parent?.type !== 'rule') throw decl.error('CSS 属性必须位于元素样式或关键帧中。');
  });
  return root;
}
export function parseCssRecords(value: unknown): ElementCssRecord[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 10000) throw Error('元素 CSS 需要结构化列表，最多 10000 项。');
  const seen = new Set<string>();
  return value.map(raw => {
    if (!raw || typeof raw !== 'object') throw Error('元素 CSS 配置无效。');
    const r = raw as ElementCssRecord;
    if (!['appearance', 'defaultStage', 'stage'].includes(r.ownerKind) || !r.ownerId || typeof r.ownerId !== 'string' || typeof r.achievementId !== 'string' || (r.ownerKind === 'stage' && !r.achievementId)) throw Error('元素 CSS 所属外观或阶段无效。');
    if (typeof r.target !== 'string' || !targetOk(r.target) || !['both', 'card', 'popup'].includes(r.surface) || typeof r.replace !== 'boolean' || typeof r.id !== 'string') throw Error('元素 CSS 的元素、用途或编号无效。');
    const key = `${cssOwnerKey(r)}/${r.target}/${r.surface}`;
    if (seen.has(key)) throw Error('同一元素和用途只能配置一份专用 CSS。');
    seen.add(key); parseElementCss(r.css);
    return { id: r.id, ownerKind: r.ownerKind, ownerId: r.ownerId, achievementId: r.achievementId, target: r.target, surface: r.surface, css: r.css, replace: r.replace };
  });
}
/** Ownership precedence, then per-surface resolution. A replace row can also suppress inherited CSS. */
export function resolveElementCss(rows: readonly ElementCssRecord[], owners: readonly CssOwner[]): ElementCssLayer[] {
  const result: ElementCssLayer[] = [];
  for (const surface of ['card', 'popup'] as const) {
    const layers = new Map<string, string[]>();
    for (const owner of owners) for (const scope of ['both', surface] as const) {
      for (const row of rows.filter(r => sameOwner(r, owner) && r.surface === scope)) {
        const list = row.replace ? [] : layers.get(row.target) ?? [];
        if (row.css.trim()) list.push(row.css);
        layers.set(row.target, list);
      }
    }
    for (const [target, blocks] of layers) for (const css of blocks) result.push({ target, surface, css });
  }
  return result;
}
export function cssProperties(blocks: readonly string[]): Set<string> {
  const props = new Set<string>();
  for (const text of blocks) parseElementCss(text).walkDecls(d => { props.add(d.prop.toLowerCase()); });
  return props;
}
export function cssStopsEffect(properties: ReadonlySet<string>, effect: string): boolean {
  if (effect === 'none') return false;
  if ([...properties].some(p => p === 'all' || p.startsWith('animation') || p.startsWith('transition'))) return true;
  return (effect === 'float' || effect === 'rotate') ? ['transform', 'translate', 'rotate', 'scale'].some(p => properties.has(p))
    : effect === 'pulse' ? properties.has('opacity') : effect === 'glow' && properties.has('filter');
}
export function targetCssProperties(layers: readonly ElementCssLayer[], surface: 'card' | 'popup', role: string, id?: string, baseOnly = false): Set<string> {
  const blocks = layers.filter(r => (r.surface === 'both' || r.surface === surface) && (r.target === role || !!id && r.target === `element:${id}`)).map(r => r.css);
  if (!baseOnly) return cssProperties(blocks);
  const props = new Set<string>();
  for (const css of blocks) { const root = parseElementCss(css); root.walkDecls(d => { if (d.parent === root) props.add(d.prop.toLowerCase()); }); }
  return props;
}
export function rewriteCss(css: string, selector: string, prefix: string): { text: string; properties: Set<string>; base: Declaration[] } {
  const root = parseElementCss(css).clone(), frames = new Map<string, string>(), properties = new Set<string>();
  root.walkAtRules('keyframes', r => { frames.set(r.params, `${prefix}-${r.params}`); r.params = frames.get(r.params)!; });
  root.walkDecls(d => {
    properties.add(d.prop.toLowerCase());
    if (/^(?:-webkit-)?animation(?:-name)?$/.test(d.prop)) d.value = d.value.replace(/[A-Za-z_][\w-]*/g, name => frames.get(name) ?? name);
  });
  const base = root.nodes.filter((node): node is Declaration => node.type === 'decl');
  const initial = postcss.rule({ selector });
  for (const decl of base) initial.append(decl.clone());
  for (const decl of base) decl.remove();
  root.walkRules(rule => { if (rule.parent?.type === 'root') rule.selector = rule.selector.split(',').map(s => s.trim().replace(/^&/, selector)).join(','); });
  root.prepend(initial);
  return { text: root.toString(), properties, base };
}
