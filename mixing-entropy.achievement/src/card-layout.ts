import { cardAppearance } from './card-style.ts';
import { ownedStyles, cssUrl, backgroundPaint, bindElementEffects } from './element-appearance.ts';
import type { Entry } from './model.ts';
import type { TemplatePart } from './template-contract.ts';
import type { CardSizeMeasurement } from './card-size-reference.ts';
import { bindElementCss } from './element-css-runtime.ts';
import { targetCssProperties } from './element-css.ts';

// A narrowly scoped 2.8 native-template DOM adapter. No host internals or template clones.
// Native pagination has no scroll-container attribute; its allocated grid is inline.
const GRID = '[data-visual-ui-scroll-container="true"], [style*="grid-template-columns"]';
const SCOPE = '--achievement-card-scope';
const ROLE = '--achievement-card-role';
let sequence = 0;
type Part = { box: HTMLElement; content: HTMLElement };
type Undo = () => void;

function partsOf(cell: HTMLElement, contract: readonly TemplatePart[] = []): Map<string, Part> {
  const parts = new Map<string, Part>();
  const children = Array.from(cell.children);
  if (contract.length && children.length !== contract.length) return parts;
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    if (!(child instanceof HTMLElement) || !(child.firstElementChild instanceof HTMLElement)) continue;
    const content = child.firstElementChild;
    const expected = contract[index];
    if (expected && ((expected.type === 'image' && !content.matches('[data-visual-ui-image]')) || (expected.type === 'text' && !content.querySelector('[data-visual-ui-text-paint]')))) return new Map();
    const authoredRole = expected?.role || getComputedStyle(content).getPropertyValue(ROLE).trim();
    const role = authoredRole === 'stage' ? 'stageName' : authoredRole;
    if (role && !parts.has(role)) parts.set(role, { box: child, content });
    if (expected?.id) parts.set(`element:${expected.id}`, { box: child, content });
  }
  return parts;
}
function imageSource(part?: Part): string {
  const img = part?.content.querySelector<HTMLImageElement>('img[data-active="true"], img');
  return img?.currentSrc || img?.src || '';
}


export interface CardLayoutAdapter { css: string; refresh(): void; dispose(): void }
export function bindCardLayout(read: () => Entry[], contract: readonly TemplatePart[] = [], onSize?: (size: CardSizeMeasurement) => void): CardLayoutAdapter {
  const token = `card-${++sequence}-${Date.now()}`;
  const css = `${SCOPE}: ${token};`;
  if (typeof document === 'undefined') return { css, refresh() {}, dispose() {} };
  let disposed = false, frame = 0;
  const cells = new Map<HTMLElement, { key: string; parts: Map<string, Part>; stop: Undo; resize: ResizeObserver }>();
  const queue = () => { if (!disposed && !frame) frame = requestAnimationFrame(scan); };
  const mutation = new MutationObserver(queue);
  mutation.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['src', 'data-active'] });

  function configure(cell: HTMLElement, entry: Entry, parts: Map<string, Part>): Undo {
    const style = ownedStyles();
    const set = style.set;
    const appearance = cardAppearance(entry.appearance ?? {});
    const bg = parts.get('background'), bgImage = parts.get('backgroundImage'), border = parts.get('frame');
    const props = (role: string, baseOnly = false) => targetCssProperties(entry.elementCss ?? [], 'card', role, contract.find(p => p.role === role)?.id, baseOnly);
    const bgCss = props('background', true), imageCss = props('backgroundImage'), frameCss = props('frame');
    if (bg && appearance.backgroundMode !== 'template') {
      set(bg.content, 'background', backgroundPaint(appearance));
    }
    if (bgImage && appearance.backgroundMode !== 'template') {
      set(bgImage.box, 'display', appearance.backgroundMode === 'image' && !!appearance.backgroundImage ? 'block' : 'none');
      const img = bgImage.content.querySelector<HTMLElement>('img');
      if (appearance.backgroundFit === 'tile' && imageSource(bgImage)) {
        set(bgImage.content, 'background-image', cssUrl(imageSource(bgImage)));
        set(bgImage.content, 'background-repeat', 'repeat');
        if (img) set(img, 'visibility', 'hidden');
        set(bgImage.content, 'background-position', `${appearance.backgroundX}% ${appearance.backgroundY}%`);
      } else if (img) {
        set(img, 'object-fit', appearance.backgroundFit);
        set(img, 'object-position', `${appearance.backgroundX}% ${appearance.backgroundY}%`);
      }
    }
    if (border && appearance.frameMode !== 'template') {
      set(border.box, 'display', appearance.frameMode === 'none' ? 'none' : 'block');
      const img = border.content.querySelector<HTMLElement>('img');
      if (img) set(img, 'visibility', 'hidden');
      set(border.content, 'box-sizing', 'border-box');
      // Track individual edges so removing a shorthand cannot leave residual styles.
      for (const side of ['top', 'right', 'bottom', 'left']) {
        set(border.content, `border-${side}-width`, `${appearance.frameWidth}px`);
        set(border.content, `border-${side}-style`, 'solid');
        set(border.content, `border-${side}-color`, appearance.frameColor || 'currentColor');
      }
      set(border.content, 'color', appearance.frameColor || 'inherit');
      set(border.content, 'border-radius', appearance.frameMode === 'nineSlice' ? '0' : `${appearance.frameRadius}px`);
      if (appearance.frameMode === 'nineSlice' && appearance.frameImage && imageSource(border)) {
        set(border.content, 'border-image-source', cssUrl(imageSource(border)));
        set(border.content, 'border-image-slice', `${appearance.sliceTop} ${appearance.sliceRight} ${appearance.sliceBottom} ${appearance.sliceLeft}`);
        set(border.content, 'border-image-width', String(1));
        set(border.content, 'border-image-repeat', appearance.frameRepeat);
      }
    }
    if (bgImage && (bgCss.has('background') || bgCss.has('background-image')) && !imageCss.size) set(bgImage.box, 'display', 'none');
    if (bgImage && imageCss.size) set(bgImage.box, 'display', 'block');
    if (border && frameCss.size) {
      set(border.box, 'display', 'block');
      const img = border.content.querySelector<HTMLElement>('img');
      if (img && [...props('frame', true)].some(p => p === 'border' || /^border-(?:image|color|style|width|top|bottom|left|right)/.test(p))) set(img, 'visibility', 'hidden');
    }
    const paints = new Map([...parts].map(([role, p]) => [role, p.content]));
    const css = bindElementCss(paints, entry.elementCss ?? [], 'card', appearance);
    const stopEffects = bindElementEffects(cell, paints, css.effects);
    return () => { stopEffects(); css.dispose(); style.restore(); };
  }

  function scan() {
    frame = 0; if (disposed) return;
    const entries = read();
    const byId = new Map(entries.map(e => [e.id, e]));
    const seen = new Set<HTMLElement>();
    const grids = Array.from(document.querySelectorAll<HTMLElement>(GRID)).filter(grid => getComputedStyle(grid).getPropertyValue(SCOPE).trim() === token);
    for (const grid of grids) {
      let reported = false;
      for (const child of Array.from(grid.children)) {
        if (!(child instanceof HTMLElement)) continue;
        const parts = partsOf(child, contract), id = parts.get('key')?.content.textContent?.trim();
        const entry = id ? byId.get(id) : undefined;
        if (!entry) continue;
        if (!reported && onSize && child.clientWidth > 0 && child.clientHeight > 0) {
          const computed = getComputedStyle(child), layout = getComputedStyle(grid);
          // Use layout pixels, not viewport-scaled getBoundingClientRect coordinates.
          const width = parseFloat(computed.width), height = parseFloat(computed.height);
          onSize({ width: Number.isFinite(width) && width > 0 ? width : child.offsetWidth || child.clientWidth,
            height: Number.isFinite(height) && height > 0 ? height : child.offsetHeight || child.clientHeight,
            contentWidth: child.clientWidth, contentHeight: child.clientHeight, gridWidth: grid.clientWidth, gridHeight: grid.clientHeight,
            mode: layout.gridAutoFlow.startsWith('column') ? 'horizontal' : grid.hasAttribute('data-visual-ui-scroll-container') ? 'vertical' : 'pagination' });
          reported = true;
        }
        seen.add(child);
        const key = JSON.stringify([entry, child.clientWidth, child.clientHeight, imageSource(parts.get('frame')), imageSource(parts.get('backgroundImage'))]);
        const existing = cells.get(child);
        if (existing?.key === key && parts.size === existing.parts.size && [...parts].every(([role, part]) => existing.parts.get(role)?.content === part.content)) continue;
        existing?.stop(); existing?.resize.disconnect();
        const stop = configure(child, entry, parts), resize = new ResizeObserver(queue);
        resize.observe(child); cells.set(child, { key, parts, stop, resize });
      }
    }
    for (const [cell, state] of cells) if (!seen.has(cell)) { state.stop(); state.resize.disconnect(); cells.delete(cell); }
  }
  queue();
  return { css, refresh: queue, dispose() {
    if (disposed) return; disposed = true; cancelAnimationFrame(frame); mutation.disconnect();
    for (const state of cells.values()) { state.stop(); state.resize.disconnect(); } cells.clear();
  } };
}
