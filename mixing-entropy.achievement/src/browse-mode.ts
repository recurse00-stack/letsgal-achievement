import type { VisualUIViewHandle } from '@avg-studio/sdk';

export type BrowseMode = 'pagination' | 'scroll' | 'horizontal';
export const BROWSE_MODES: readonly BrowseMode[] = ['pagination', 'scroll', 'horizontal'];
export const BROWSE_LABELS = { pagination: '翻页', scroll: '纵向滚动', horizontal: '横向滚动' };
export interface BrowsePreference {
  read(): unknown;
  write(mode: BrowseMode): void;
}
export interface BrowseOptions {
  /** Read from the saved official UI document, never an extension setting. */
  authoredMode?: unknown;
  scrollDirection?: unknown;
  allowPlayerSwitch?: unknown;
  allowPagination?: unknown;
  allowVertical?: unknown;
  allowHorizontal?: unknown;
}
export interface HorizontalCards { setEnabled(enabled: boolean): void; dispose(): void }

export function browseChoices(options: BrowseOptions): BrowseMode[] {
  if (options.authoredMode !== 'pagination' && options.authoredMode !== 'scroll') return [];
  const initial = options.authoredMode === 'scroll' && options.scrollDirection === 'horizontal' ? 'horizontal' : options.authoredMode;
  if (options.allowPlayerSwitch !== true) return [initial];
  // The official default is always available. Checkboxes add optional player choices.
  return [initial, ...BROWSE_MODES.filter(mode => mode !== initial && (mode === 'pagination' ? options.allowPagination === true
    : mode === 'scroll' ? options.allowVertical === true : options.allowHorizontal === true))];
}

/** Every mode keeps the same native list, data bindings and authored card template. */
export function bindBrowseMode(view: VisualUIViewHandle, preference: BrowsePreference, options: BrowseOptions = {}, horizontal?: HorizontalCards): () => void {
  const list = view.get('achievement-list');
  if (!list) { horizontal?.dispose(); return () => {}; }
  const choices = browseChoices(options);
  const playerChoice = options.allowPlayerSwitch === true && choices.length > 1;
  const fallback = choices[0];
  const saved = playerChoice ? preference.read() : undefined;
  let mode = playerChoice && choices.includes(saved as BrowseMode) ? saved as BrowseMode : fallback;
  const buttons = BROWSE_MODES.map(key => ({ key, handle: view.get('achievement-mode-' + key) }));
  if (!fallback) {
    // Unreadable/custom documents keep native navigation instead of guessing a default.
    buttons.forEach(({ handle }) => handle?.setHidden(true));
    horizontal?.dispose();
    return () => {};
  }
  let nativeMode = options.authoredMode;
  let live = true;
  const render = () => {
    const nextNative = mode === 'horizontal' ? 'scroll' : mode;
    if (nativeMode !== nextNative) { list.setProps({ navigationMode: nextNative }); nativeMode = nextNative; }
    horizontal?.setEnabled(mode === 'horizontal');
    for (const { key, handle } of buttons) {
      handle?.setHidden(!playerChoice || !choices.includes(key));
      handle?.setProps({ text: BROWSE_LABELS[key] + (key === mode ? ' ✓' : '') });
    }
  };
  const detach = buttons.filter(({ key }) => playerChoice && choices.includes(key)).map(({ key, handle }) =>
    handle?.on('click', () => {
      if (!live || mode === key) return;
      preference.write(key); mode = key; render();
    }));
  render();
  return () => {
    if (!live) return;
    live = false;
    detach.forEach(stop => stop?.());
    horizontal?.dispose();
  };
}
