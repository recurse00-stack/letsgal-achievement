import type { VisualUIViewHandle } from '@avg-studio/sdk';

export type BrowseMode = 'pagination' | 'scroll' | 'horizontal';
export const BROWSE_MODES: readonly BrowseMode[] = ['pagination', 'scroll', 'horizontal'];
export const BROWSE_LABELS = { pagination: '翻页', scroll: '纵向滚动', horizontal: '横向滚动' };
export interface BrowsePreference {
  read(): unknown;
  write(mode: BrowseMode): void;
}
export interface BrowseOptions {
  policy?: unknown;
  defaultMode?: unknown;
  allowPagination?: unknown;
  allowVertical?: unknown;
  allowHorizontal?: unknown;
}
export interface HorizontalCards { setEnabled(enabled: boolean): void; dispose(): void }

export function browseChoices(options: BrowseOptions): BrowseMode[] {
  if (options.policy !== 'player') return [options.policy === 'scroll' || options.policy === 'horizontal' ? options.policy : 'pagination'];
  const allowed = BROWSE_MODES.filter(mode => mode === 'pagination' ? options.allowPagination !== false
    : mode === 'scroll' ? options.allowVertical !== false : options.allowHorizontal === true);
  return allowed.length ? allowed : ['pagination'];
}

/** Every mode keeps the same native list, data bindings and authored card template. */
export function bindBrowseMode(view: VisualUIViewHandle, preference: BrowsePreference, options: BrowseOptions = {}, horizontal?: HorizontalCards): () => void {
  const list = view.get('achievement-list');
  if (!list) { horizontal?.dispose(); return () => {}; }
  const choices = browseChoices(options);
  const playerChoice = options.policy === 'player' && choices.length > 1;
  const fallback = choices.includes(options.defaultMode as BrowseMode) ? options.defaultMode as BrowseMode : choices[0];
  const saved = playerChoice ? preference.read() : undefined;
  let mode = playerChoice && choices.includes(saved as BrowseMode) ? saved as BrowseMode : fallback;
  const buttons = BROWSE_MODES.map(key => ({ key, handle: view.get('achievement-mode-' + key) }));
  let live = true;
  const render = () => {
    list.setProps({ navigationMode: mode === 'horizontal' ? 'scroll' : mode });
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
