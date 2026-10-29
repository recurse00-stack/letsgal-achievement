import { effectFrames, type CardAppearance } from './card-style.ts';

export function ownedStyles() {
  const values = new Map<HTMLElement, Map<string, { before: string; priority: string; written: string }>>();
  return {
    set(node: HTMLElement, property: string, value: string) {
      let properties = values.get(node);
      if (!properties) { properties = new Map(); values.set(node, properties); }
      if (!properties.has(property)) properties.set(property, { before: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property), written: '' });
      const previous = properties.get(property)!;
      if (node.style.getPropertyValue(property) !== value) node.style.setProperty(property, value);
      previous.written = node.style.getPropertyValue(property);
    },
    restore() {
      for (const [node, properties] of values) for (const [key, v] of properties) {
        if (node.style.getPropertyValue(key) !== v.written) continue;
        if (v.before) node.style.setProperty(key, v.before, v.priority); else node.style.removeProperty(key);
      }
      values.clear();
    },
  };
}
export function cssUrl(url: string): string { return `url("${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, '')}")`; }
export function backgroundPaint(a: CardAppearance): string {
  return a.backgroundMode === 'gradient' ? `linear-gradient(${a.backgroundAngle}deg, ${a.backgroundColor || 'transparent'}, ${a.backgroundColorEnd || 'transparent'})` : a.backgroundColor || 'transparent';
}

/** Content layer only: official wrapper geometry and entrance/exit animation remain authored. */
export function bindElementEffects(container: HTMLElement, parts: ReadonlyMap<string, HTMLElement>, appearance: CardAppearance, allowHover = true): () => void {
  const animations: Animation[] = [], finished = new Set<Animation>();
  let onScreen = true, hovered = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => {
    const allowed = onScreen && !document.hidden && !reduced.matches && (appearance.effectTrigger !== 'hover' || (allowHover && hovered));
    for (const a of animations) {
      if (finished.has(a) || a.playState === 'finished') continue;
      if (allowed) a.play(); else a.pause();
    }
  };
  for (const [role, effect] of [['icon', appearance.iconEffect], ['frame', appearance.frameEffect]] as const) {
    const content = parts.get(role), frames = effectFrames(effect);
    if (!content || !frames.length || typeof content.animate !== 'function' || (!allowHover && appearance.effectTrigger === 'hover')) continue;
    const a = content.animate(frames, { duration: appearance.effectDuration, iterations: appearance.effectTrigger === 'enter' ? 1 : Infinity, easing: effect === 'rotate' ? 'linear' : 'ease-in-out' });
    a.onfinish = () => { finished.add(a); }; a.pause(); animations.push(a);
  }
  const enter = () => { hovered = true; update(); }, leave = () => { hovered = false; update(); };
  const intersection = new IntersectionObserver(items => { onScreen = items[0]?.isIntersecting ?? false; update(); });
  intersection.observe(container);
  container.addEventListener('mouseenter', enter); container.addEventListener('mouseleave', leave);
  document.addEventListener('visibilitychange', update); reduced.addEventListener('change', update); update();
  return () => {
    intersection.disconnect(); container.removeEventListener('mouseenter', enter); container.removeEventListener('mouseleave', leave);
    document.removeEventListener('visibilitychange', update); reduced.removeEventListener('change', update);
    animations.forEach(a => { a.onfinish = null; a.cancel(); }); finished.clear();
  };
}
