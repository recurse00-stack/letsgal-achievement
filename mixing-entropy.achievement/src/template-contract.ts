/** Read only the authored public UI resource, never Studio's private editor state. */
export interface TemplatePart { role: string; type: string; id?: string }
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
/** Navigation remains readable even when the card has unsupported nested/conditional layers. */
export function authoredNavigation(document: unknown): 'pagination' | 'scroll' | undefined {
  const found: Record<string, unknown>[] = [];
  const visit = (elements: unknown) => {
    if (!Array.isArray(elements)) return;
    for (const value of elements) {
      const element = object(value);
      if (element.refId === 'achievement-list' && element.type === 'data-list') found.push(element);
      else visit(element.children);
    }
  };
  visit(object(document).elements);
  if (found.length !== 1) return undefined;
  const mode = object(found[0].props).navigationMode;
  return mode === 'pagination' || mode === 'scroll' ? mode : undefined;
}
export function templateParts(document: unknown): TemplatePart[] {
  const root = object(document);
  if (!Array.isArray(root.elements)) throw Error('成就页缺少元素列表');
  const list = root.elements.map(object).find(e => e.refId === 'achievement-list' && e.type === 'data-list');
  if (!list || !Array.isArray(list.children) || object(list.props).layout !== 'card') throw Error('需要顶层 achievement-list 卡片列表');
  const card = list.children.map(object).find(e => object(e.props).__dataListTemplateKind === 'card');
  if (!card || !Array.isArray(card.children)) throw Error('请先在官方编辑器保存卡片模板');
  const result: TemplatePart[] = [];
  for (const child of card.children.map(object)) {
    if (child.hidden === true) continue;
    if (child.type === 'group' || child.visibleIf) throw Error('外观与尺寸参考需要直接位于卡片下的基础元素；分组或条件图层请使用原生自由模板');
    if (!['rect', 'text', 'image', 'button', 'line'].includes(String(child.type))) throw Error('卡片包含不支持的元素类型');
    const css = String(object(child.style).customCss || '');
    const role = /(?:^|[;\n])\s*--achievement-card-role\s*:\s*([A-Za-z]+)\s*(?:;|$)/.exec(css)?.[1] || '';
    result.push({ role, type: String(child.type), id: typeof child.id === 'string' ? child.id : undefined });
  }
  const roles = result.map(p => p.role).filter(Boolean);
  if (!roles.includes('key') || new Set(roles).size !== roles.length) throw Error('卡片数据标识缺失或元素角色重复');
  return result;
}
export function localTemplatePath(document: string): string | undefined {
  const match = /^@mixing-entropy\.achievement\/([A-Za-z0-9_-]+)$/.exec(document);
  return match ? `ui/${match[1]}.json` : undefined;
}
