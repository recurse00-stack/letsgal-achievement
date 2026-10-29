import { useRef, useState } from 'react';
import { createListCollection, Menu, Portal, Select } from '@chakra-ui/react';
import type { StageTemplate } from './model';

/** Authoring-only picker: right-click targets the clicked row, not the selected stage. */
export function StagePicker({ value, stages, onChange, removalReason, onRemove, shared = false }: {
  value: string; stages: StageTemplate[]; onChange: (id: string) => void;
  removalReason: (id: string) => string; onRemove: (id: string) => void; shared?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; row: HTMLElement } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const returnToList = () => requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
  const collection = createListCollection({ items: stages.map(s => ({ value: s.id, label: `${s.name}（${s.id}）` })) });
  const pointed = stages.find(s => s.id === target?.id);
  const reason = pointed ? removalReason(pointed.id) : '此阶段已不存在。';
  const colors = { bg: 'var(--bg-canvas)', color: 'var(--fg-primary)', borderColor: 'var(--border-default)' };
  const optionFrame = { borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-subtle, var(--border-default))', borderRadius: '4px' };
  return <>
    <Select.Root collection={collection} value={value ? [value] : []} open={open}
      onOpenChange={e => { setOpen(e.open); if (!e.open) setTarget(null); }}
      onInteractOutside={event => {
        // The menu is portalled: its focus and pointer events still belong to this picker.
        if (menuRef.current?.contains(event.detail.target as Node)) event.preventDefault();
      }}
      onValueChange={e => { if (e.value[0]) onChange(e.value[0]); }} positioning={{ sameWidth: true }}>
      <Select.Trigger {...colors} aria-label={shared ? '编辑默认阶段' : '编辑阶段'}>
        <Select.ValueText placeholder="请选择阶段" /><Select.Indicator />
      </Select.Trigger>
      <Portal><Select.Positioner><Select.Content ref={listRef} data-studio-user-content {...colors} borderWidth="1px" borderStyle="solid" maxH="320px" overflowY="auto">
        {collection.items.map(option => <Select.Item key={option.value} item={option} title={option.label}
          {...optionFrame} my="2px" color="var(--fg-primary)" bg={target?.id === option.value ? 'var(--bg-subtle)' : undefined}
          _highlighted={{ bg: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}
          onContextMenu={event => {
            event.preventDefault(); event.stopPropagation();
            setTarget({ id: option.value, row: event.currentTarget });
          }}>
          <Select.ItemText truncate>{option.label}</Select.ItemText><Select.ItemIndicator />
        </Select.Item>)}
      </Select.Content></Select.Positioner></Portal>
    </Select.Root>
    <Menu.Root open={open && !!target && !!pointed} onOpenChange={e => { if (!e.open) setTarget(null); }}
      onEscapeKeyDown={returnToList}
      positioning={{ strategy: 'fixed', placement: 'right-start', gutter: 4, overflowPadding: 8,
        flip: ['left-start', 'bottom-end', 'top-end'], slide: true, fitViewport: true, hideWhenDetached: true,
        getAnchorElement: () => target?.row ?? null }}
      onSelect={e => {
        if (e.value === 'remove' && pointed && !removalReason(pointed.id)) onRemove(pointed.id);
        setTarget(null); returnToList();
      }}>
      <Portal><Menu.Positioner><Menu.Content ref={menuRef} data-studio-user-content {...colors}
        borderWidth="1px" borderStyle="solid" width="320px" maxW="calc(100vw - 16px)" maxH="var(--available-height)" overflowY="auto">
        <div style={{ padding: '6px 10px', color: 'var(--fg-secondary)' }}>
          <div style={{ overflowWrap: 'anywhere' }}>{pointed?.name}</div>
          <div title={pointed?.id} style={{ fontSize: '0.85em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pointed?.id}</div>
        </div>
        <Menu.Item value="remove" disabled={!!reason} {...optionFrame} color="var(--fg-primary)"
          _highlighted={{ bg: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}>
          {shared ? '删除默认阶段' : '从此成就删除阶段'}
        </Menu.Item>
        <div style={{ padding: '6px 10px', color: 'var(--fg-secondary)', fontSize: '0.8em', lineHeight: 1.5 }}>
          {reason || (shared ? '影响沿用此默认阶段的成就；专用配置保留。' : '只影响当前成就，其他成就不变。')}
        </div>
      </Menu.Content></Menu.Positioner></Portal>
    </Menu.Root>
  </>;
}
