import { cssStopsEffect, parseElementCss, rewriteCss, type ElementCssLayer } from './element-css.ts';
import { ownedStyles } from './element-appearance.ts';
import type { CardAppearance } from './card-style.ts';
import postcss from 'postcss';

let sequence = 0;
const ATTR = 'data-achievement-element-css';
const sides = ['top', 'right', 'bottom', 'left'];
const backgrounds = ['background-color', 'background-image', 'background-position', 'background-size', 'background-repeat', 'background-origin', 'background-clip', 'background-attachment'];
const borderImages = ['border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset', 'border-image-repeat'];
function longhands(property: string): string[] {
  if (property === 'background') return backgrounds;
  if (property === 'border') return [...borderImages, ...sides.flatMap(side => ['width', 'style', 'color'].map(v => `border-${side}-${v}`))];
  if (/^border-(width|style|color)$/.test(property)) return sides.map(side => `border-${side}-${property.slice(7)}`);
  if (sides.some(side => property === `border-${side}`)) return ['width', 'style', 'color'].map(v => `${property}-${v}`);
  if (property === 'border-image') return borderImages;
  if (property === 'border-radius') return ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map(v => `border-${v}-radius`);
  if (property === 'font') return ['font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'font-stretch', 'line-height'];
  return [property];
}
const textProperty = /^(?:color|font(?:-|$)|line-height|letter-spacing|word-spacing|text-(?:align|decoration|transform|shadow|indent|overflow)|white-space|word-break|overflow-wrap)/;

/** Apply one element's merged CSS to its native paint layer, with a reversible overlay. */
export function bindElementCss(parts: ReadonlyMap<string, HTMLElement>, layers: readonly ElementCssLayer[], surface: 'card' | 'popup', appearance: CardAppearance) {
  const cleanup: Array<() => void> = [], overridden = new Set<string>();
  const byNode = new Map<HTMLElement, string[]>();
  for (const layer of layers) {
    if (layer.surface !== 'both' && layer.surface !== surface) continue;
    const node = parts.get(layer.target);
    if (!node || !layer.css.trim()) continue;
    byNode.set(node, [...byNode.get(node) ?? [], layer.css]);
  }
  for (const [node, blocks] of byNode) {
    const token = `achcss-${++sequence}`, attribute = node.getAttribute(ATTR);
    const selector = `[${ATTR}="${token}"]:not(#${token}-reserved):not(#${token}-reserved-2)`;
    const root = parseElementCss(blocks.join('\n'));
    const animated = new Set<string>();
    root.walkAtRules('keyframes', rule => { rule.walkDecls(d => { for (const p of longhands(d.prop)) animated.add(p); }); });
    // Normal settings are lower priority. Preserve authored keyframe participation.
    root.walkDecls(d => {
      if (d.parent?.parent?.type === 'atrule') return;
      if (!longhands(d.prop).some(p => animated.has(p))) d.important = true;
    });
    const compiled = rewriteCss(root.toString(), selector, token);
    const undo = ownedStyles();
    const properties = [...compiled.properties].flatMap(longhands);
    // Keep the normal inline base: hover-only rules must not erase the resting style.
    // CSS animations already outrank normal inline styles; only important inline
    // declarations would prevent a keyframe from taking ownership.
    for (const key of animated) if (node.style.getPropertyPriority(key) === 'important') undo.set(node, key, '');
    // Native text may have its own paint span, so text properties target that span too.
    const textPaint = node.querySelector<HTMLElement>('[data-visual-ui-text-paint]');
    let textCss = '';
    if (textPaint) {
      const textRoot = postcss.parse(compiled.text);
      textRoot.walkAtRules(rule => { rule.remove(); });
      textRoot.walkRules(rule => {
        rule.selector = rule.selector.split(',').map(s => `${s} [data-visual-ui-text-paint]`).join(',');
        rule.walkDecls(d => { if (!textProperty.test(d.prop)) d.remove(); });
      });
      textCss = textRoot.toString();
      const animatedText = [...animated].filter(p => textProperty.test(p));
      if (animatedText.length) textCss += `\n${selector} [data-visual-ui-text-paint]{${animatedText.map(p => `${p}:inherit!important`).join(';')}}`;
    }
    const sheet = node.ownerDocument.createElement('style');
    sheet.dataset.achievementCss = token;
    sheet.textContent = compiled.text + '\n' + textCss + `\n@media(prefers-reduced-motion:reduce){${selector}{animation:none!important;transition:none!important;}}`;
    node.setAttribute(ATTR, token); node.ownerDocument.head.append(sheet);
    for (const [role, effect] of [['icon', appearance.iconEffect], ['frame', appearance.frameEffect]] as const) {
      if (parts.get(role) === node && cssStopsEffect(compiled.properties, effect)) overridden.add(role);
    }
    cleanup.push(() => { sheet.remove(); undo.restore(); if (node.getAttribute(ATTR) === token) { if (attribute === null) node.removeAttribute(ATTR); else node.setAttribute(ATTR, attribute); } });
  }
  return { effects: { ...appearance, ...(overridden.has('icon') ? { iconEffect: 'none' as const } : {}), ...(overridden.has('frame') ? { frameEffect: 'none' as const } : {}) },
    dispose() { cleanup.reverse().forEach(stop => stop()); } };
}
