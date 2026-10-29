import type { VisualUIViewHandle } from '@avg-studio/sdk';
import type { Entry } from './model.ts';
import { cardAppearance } from './card-style.ts';
import { backgroundPaint, bindElementEffects, cssUrl, ownedStyles } from './element-appearance.ts';
import { bindElementCss } from './element-css-runtime.ts';

interface Part { role: string; refId: string; css: string; elementId?: string }
const MARK = '--achievement-popup-part';
let sequence = 0;
/** Only explicitly named, unconditional basic elements are enhanced. */
export function popupParts(document: unknown): Part[] {
  const found: Part[] = [];
  const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const roles: Record<string, string> = { 'achievement-background': 'background', 'achievement-frame': 'frame', 'achievement-icon': 'icon', 'achievement-name': 'name', 'achievement-description': 'description', 'achievement-level': 'level', 'achievement-stage': 'stageName' };
  const visit = (elements: unknown) => {
    if (!Array.isArray(elements)) return;
    for (const value of elements) {
      const element = object(value);
      if (element.hidden || element.visibleIf) continue;
      if (element.type === 'group') { visit(element.children); continue; }
      const refId = typeof element.refId === 'string' ? element.refId : '';
      const elementId = typeof element.id === 'string' ? element.id : undefined;
      const role = roles[refId] || (elementId ? `element:${elementId}` : '');
      const css = object(element.style).customCss;
      if (refId && role && ['rect', 'image', 'text', 'button', 'line'].includes(String(element.type))) found.push({ role, refId, css: typeof css === 'string' ? css : '', elementId });
    }
  };
  visit(object(document).elements);
  return found.filter(p => found.filter(x => x.role === p.role).length === 1);
}

export interface PopupAppearance { refresh(): void; dispose(restoreView?: boolean): void }
export function bindPopupAppearance(view: VisualUIViewHandle, documentResource: unknown, read: () => Entry | undefined, resolve: (asset: string) => string): PopupAppearance {
  const contract = popupParts(documentResource), token = `popup-${++sequence}-${Date.now()}`;
  if (typeof document === 'undefined' || !contract.length) return { refresh() {}, dispose() {} };
  for (const part of contract) view.get(part.refId)?.setStyle({ customCss: `${part.css}\n${MARK}: ${token}-${part.role};` });
  let disposed = false, frame = 0, key = '', stop = () => {};
  let previous = new Map<string, HTMLElement>();
  const queue = () => { if (!disposed && !frame) frame = requestAnimationFrame(scan); };
  const mutations = new MutationObserver(queue);
  mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  const resolveAsset = (asset: string) => { try { return asset ? resolve(asset) : ''; } catch { return ''; } };
  function scan() {
    frame = 0; if (disposed) return;
    const item = read();
    if (!item) { stop(); stop = () => {}; key = ''; previous.clear(); return; }
    const parts = new Map<string, HTMLElement>();
    const wanted = new Map(contract.map(p => [`${token}-${p.role}`, p.role]));
    for (const node of document.querySelectorAll<HTMLElement>('div')) {
      const value = getComputedStyle(node).getPropertyValue(MARK).trim(), role = wanted.get(value);
      // The marker belongs to the public custom-CSS wrapper. In Studio 2.8 its
      // first child paints the rect/image; keep the wrapper and entrance intact.
      if (!role || (node.parentElement && getComputedStyle(node.parentElement).getPropertyValue(MARK).trim() === value)) continue;
      const content = node.firstElementChild;
      if (content instanceof HTMLElement && content.tagName === 'DIV') parts.set(role, content);
    }
    const nextKey = JSON.stringify([item.id, item.stageId, item.appearance, item.elementCss]);
    if (key === nextKey && parts.size === previous.size && [...parts].every(([role, node]) => previous.get(role) === node)) return;
    stop(); key = nextKey; previous = parts;
    const appearance = cardAppearance(item.appearance ?? {}), style = ownedStyles(), set = style.set;
    const border = parts.get('frame'), background = parts.get('background') ?? border;
    if (background && appearance.backgroundMode !== 'template') {
      set(background, 'background-color', appearance.backgroundColor || 'transparent');
      set(background, 'background-image', appearance.backgroundMode === 'gradient' ? backgroundPaint(appearance) : 'none');
      if (appearance.backgroundMode === 'image') {
        const url = resolveAsset(appearance.backgroundImage);
        if (url) set(background, 'background-image', cssUrl(url));
        set(background, 'background-size', appearance.backgroundFit === 'tile' ? 'auto' : appearance.backgroundFit === 'fill' ? '100% 100%' : appearance.backgroundFit);
        set(background, 'background-repeat', appearance.backgroundFit === 'tile' ? 'repeat' : 'no-repeat');
        set(background, 'background-position', `${appearance.backgroundX}% ${appearance.backgroundY}%`);
      }
      const img = background.querySelector<HTMLElement>('img');
      if (img && background !== border) set(img, 'visibility', 'hidden');
    }
    if (border && appearance.frameMode !== 'template') {
      const img = border.querySelector<HTMLElement>('img');
      if (img) set(img, 'visibility', 'hidden');
      set(border, 'box-sizing', 'border-box');
      for (const side of ['top', 'right', 'bottom', 'left']) {
        set(border, `border-${side}-width`, `${appearance.frameMode === 'none' ? 0 : appearance.frameWidth}px`);
        set(border, `border-${side}-style`, appearance.frameMode === 'none' ? 'none' : 'solid');
        set(border, `border-${side}-color`, appearance.frameColor || 'currentColor');
      }
      set(border, 'border-image-source', 'none');
      if (appearance.frameMode !== 'none') set(border, 'border-radius', appearance.frameMode === 'nineSlice' ? '0' : `${appearance.frameRadius}px`);
      if (appearance.frameMode === 'nineSlice') {
        const url = resolveAsset(appearance.frameImage);
        if (url) {
          set(border, 'border-image-source', cssUrl(url));
          set(border, 'border-image-slice', `${appearance.sliceTop} ${appearance.sliceRight} ${appearance.sliceBottom} ${appearance.sliceLeft}`);
          set(border, 'border-image-width', '1'); set(border, 'border-image-repeat', appearance.frameRepeat);
        }
      }
    }
    const surface = background ?? border ?? parts.get('icon');
    const cssParts = new Map(parts);
    for (const part of contract) if (part.elementId && parts.has(part.role)) cssParts.set(`element:${part.elementId}`, parts.get(part.role)!);
    // The default popup combines background and border in the same base plate.
    if (!cssParts.has('background') && border) cssParts.set('background', border);
    const css = bindElementCss(cssParts, item.elementCss ?? [], 'popup', appearance);
    const stopEffects = surface ? bindElementEffects(surface, parts, css.effects, false) : () => {};
    stop = () => { stopEffects(); css.dispose(); style.restore(); };
  }
  queue();
  return { refresh: queue, dispose(restoreView = true) {
    if (disposed) return; disposed = true;
    cancelAnimationFrame(frame); mutations.disconnect(); stop(); previous.clear();
    if (restoreView) for (const part of contract) view.get(part.refId)?.setStyle({ customCss: part.css });
  } };
}
