import type { VisualUIElementHandle } from '@avg-studio/sdk';
import type { HorizontalCards } from './browse-mode';

// Isolated adapter for the native 2.8 data-list DOM. No template parsing,
// cloning, private host object or changes to authored card styles/events.
const GRID = '[data-visual-ui-scroll-container="true"]';
const MARKER = '--achievement-layout-instance';
let sequence = 0;

export function horizontalCss(token: string, cols: number, rows: number, gap: number): string {
  return `${MARKER}: ${token};
& ${GRID} {
  grid-auto-flow: column !important;
  grid-template-columns: none !important;
  grid-template-rows: repeat(${rows}, minmax(0, 1fr)) !important;
  grid-auto-rows: auto !important;
  grid-auto-columns: calc((100% - ${gap * (cols - 1)}px) / ${cols}) !important;
  overflow-x: auto !important; overflow-y: hidden !important;
  scrollbar-width: thin !important; scrollbar-color: #a89779 #202833;
  overscroll-behavior: contain; touch-action: pan-x;
}
& ${GRID}::-webkit-scrollbar { display: block !important; height: 12px; }
& ${GRID}::-webkit-scrollbar-thumb { background: #a89779; border-radius: 6px; }
& ${GRID}::-webkit-scrollbar-track { background: #202833; }
& ${GRID} ~ * { display: none !important; }`;
}

export function wheelDistance(x: number, y: number, unit: number, width: number): number {
  return (Math.abs(x) >= Math.abs(y) ? x : y) * (unit === 1 ? 16 : unit === 2 ? width : 1);
}

/** Only the list container's advanced CSS is managed here.
 * Internal card templates retain all authored styles, CSS, events and bindings.
 * Keep the list top-level: Studio 2.8 cannot edit smart templates inside groups.
 */
export function createHorizontalCards(layout: VisualUIElementHandle | null): HorizontalCards {
  const token = `achievement-${Date.now()}-${++sequence}`;
  const marker = `${MARKER}: ${token};`;
  let enabled = false, disposed = false, owned = false, frame = 0, attempts = 0;
  let grid: HTMLElement | undefined;
  let detach = () => {};
  let observer: MutationObserver | undefined;
  const clear = () => {
    if (frame) cancelAnimationFrame(frame);
    observer?.disconnect(); observer = undefined;
    detach(); detach = () => {}; grid = undefined;
  };
  const fail = (message: string) => {
    clear(); layout?.setStyle({ customCss: '' });
    console.error('[成就] 横向卡片布局未接入：' + message + '。当前保留原生纵向列表。');
  };
  const attach = () => {
    if (disposed || !enabled) return;
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(GRID)).filter(node =>
      getComputedStyle(node).getPropertyValue(MARKER).trim() === token);
    if (!candidates.length) {
      // Empty lists have no grid. The observer also handles future additions.
      if (++attempts < 120) frame = requestAnimationFrame(attach);
      return;
    }
    if (candidates.length !== 1) { fail('布局容器内必须只有一个成就列表'); return; }
    const target = candidates[0];
    if (grid === target) return;
    detach();
    const original = getComputedStyle(target);
    const cols = /^repeat\((\d+),/.exec(target.style.gridTemplateColumns)?.[1];
    const cell = target.firstElementChild;
    const gap = parseFloat(original.rowGap) || 0;
    const cellHeight = cell instanceof HTMLElement ? cell.offsetHeight : 0;
    const rows = Math.round((target.clientHeight + gap) / (cellHeight + gap));
    if (!cols || rows < 1 || rows > 100 || !cellHeight) { fail('当前列表结构或尺寸不适用，请使用卡片布局'); return; }
    grid = target;
    const oldTabIndex = target.getAttribute('tabindex');
    const oldLabel = target.getAttribute('aria-label');
    target.setAttribute('tabindex', '0'); target.setAttribute('aria-label', '成就卡片，左右滚动');
    target.scrollTop = 0; target.scrollLeft = 0;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || target.scrollWidth <= target.clientWidth) return;
      event.preventDefault(); event.stopPropagation();
      target.scrollLeft += wheelDistance(event.deltaX, event.deltaY, event.deltaMode, target.clientWidth);
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== target) return;
      const distance = Math.max(1, target.clientWidth * 0.8);
      const positions: Record<string, number> = { ArrowLeft: target.scrollLeft - distance, ArrowRight: target.scrollLeft + distance, Home: 0, End: target.scrollWidth };
      if (!(event.key in positions)) return;
      event.preventDefault(); event.stopPropagation(); target.scrollLeft = positions[event.key];
    };
    target.addEventListener('wheel', wheel, { passive: false, capture: true });
    target.addEventListener('keydown', key);
    detach = () => {
      target.removeEventListener('wheel', wheel, true); target.removeEventListener('keydown', key);
      if (oldTabIndex === null) target.removeAttribute('tabindex'); else target.setAttribute('tabindex', oldTabIndex);
      if (oldLabel === null) target.removeAttribute('aria-label'); else target.setAttribute('aria-label', oldLabel);
      target.scrollLeft = 0; target.scrollTop = 0;
    };
    layout!.setStyle({ customCss: horizontalCss(token, Number(cols), rows, parseFloat(original.columnGap) || 0) });
  };
  return {
    setEnabled(next) {
      if (disposed || enabled === next) return;
      enabled = next; clear();
      if (!next) { layout?.setStyle({ customCss: '' }); return; }
      if (!layout) { fail('缺少 achievement-list 卡片列表'); return; }
      owned = true; layout.setStyle({ customCss: marker }); attempts = 0;
      frame = requestAnimationFrame(attach);
      observer = new MutationObserver(() => {
        if (grid?.isConnected) return;
        cancelAnimationFrame(frame); attempts = 0; frame = requestAnimationFrame(attach);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    },
    dispose() {
      if (disposed) return;
      disposed = true; clear(); if (owned) layout?.setStyle({ customCss: '' });
    },
  };
}
