import { useState, type CSSProperties, type ReactNode } from 'react';
import { Menu, Portal } from '@chakra-ui/react';

/** A shortcut to the owning editor's existing removal operation, never a separate delete path. */
export function RemovalContext({ children, title, label = '删除', detail, reason = '', onRemove, style }: {
  children: ReactNode; title: string; label?: string; detail: string; reason?: string;
  onRemove: () => void; style?: CSSProperties;
}) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  return <div style={style} data-removal-context={title} onContextMenu={event => {
    // Portalled child menus must not open a second ancestor menu.
    if (!event.currentTarget.contains(event.target as Node)) return;
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"], [role="listbox"], [role="menu"]')) return;
    event.preventDefault(); setAnchor({ x: event.clientX, y: event.clientY });
  }}>
    {children}
    {anchor && <Menu.Root open onOpenChange={e => { if (!e.open) setAnchor(null); }}
      positioning={{ strategy: 'fixed', placement: 'bottom-start', overflowPadding: 8, slide: true, fitViewport: true,
        getAnchorRect: () => ({ x: anchor.x, y: anchor.y, width: 0, height: 0 }) }}
      onSelect={e => { if (e.value === 'remove' && !reason) onRemove(); setAnchor(null); }}>
      <Portal><Menu.Positioner><Menu.Content data-studio-user-content bg="var(--bg-canvas)" color="var(--fg-primary)"
        border="1px solid var(--border-default)" width="300px" maxW="calc(100vw - 16px)" maxH="var(--available-height)" overflowY="auto">
        <div style={{ padding: '6px 10px', overflowWrap: 'anywhere' }}>{title}</div>
        <Menu.Item value="remove" disabled={!!reason} border="1px solid var(--border-subtle, var(--border-default))" borderRadius="4px"
          color="var(--fg-primary)" _highlighted={{ bg: 'var(--bg-subtle)' }}>{label}</Menu.Item>
        <div style={{ padding: '6px 10px', color: 'var(--fg-secondary)', fontSize: '0.8em', lineHeight: 1.5 }}>{reason || detail}</div>
      </Menu.Content></Menu.Positioner></Portal>
    </Menu.Root>}
  </div>;
}
