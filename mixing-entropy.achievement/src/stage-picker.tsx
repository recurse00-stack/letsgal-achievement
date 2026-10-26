import { useState } from 'react';
import { createListCollection, Menu, Portal, Select } from '@chakra-ui/react';
import type { StageTemplate } from './model';

/** Authoring-only picker: right-click targets the clicked row, not the selected stage. */
export function StagePicker({ value, stages, onChange, removalReason, onRemove, shared = false }: {
  value: string; stages: StageTemplate[]; onChange: (id: string) => void;
  removalReason: (id: string) => string; onRemove: (id: string) => void; shared?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; x: number; y: number } | null>(null);
  const collection = createListCollection({ items: stages.map(s => ({ value: s.id, label: `${s.name}（${s.id}）` })) });
  const pointed = stages.find(s => s.id === target?.id);
  const reason = pointed ? removalReason(pointed.id) : '此阶段已不存在。';
  const colors = { bg: 'var(--bg-canvas)', color: 'var(--fg-primary)', borderColor: 'var(--border-default)' };
  return <>
    <Select.Root collection={collection} value={value ? [value] : []} open={open}
      onOpenChange={e => setOpen(e.open)} onValueChange={e => { if (e.value[0]) onChange(e.value[0]); }} positioning={{ sameWidth: true }}>
      <Select.Trigger {...colors} aria-label={shared ? '编辑默认阶段' : '编辑阶段'}>
        <Select.ValueText placeholder="请选择阶段" /><Select.Indicator />
      </Select.Trigger>
      <Portal><Select.Positioner><Select.Content data-studio-user-content {...colors} maxH="320px" overflowY="auto">
        {collection.items.map(option => <Select.Item key={option.value} item={option} title={option.label}
          color="var(--fg-primary)" _highlighted={{ bg: 'var(--bg-subtle)' }}
          onContextMenu={event => {
            event.preventDefault(); event.stopPropagation();
            setOpen(false); setTarget({ id: option.value, x: event.clientX, y: event.clientY });
          }}>
          <Select.ItemText truncate>{option.label}</Select.ItemText><Select.ItemIndicator />
        </Select.Item>)}
      </Select.Content></Select.Positioner></Portal>
    </Select.Root>
    <Menu.Root open={!!target && !!pointed} onOpenChange={e => { if (!e.open) setTarget(null); }}
      positioning={{ placement: 'bottom-start', getAnchorRect: () => ({ x: target?.x ?? 0, y: target?.y ?? 0, width: 0, height: 0 }) }}
      onSelect={e => { if (e.value === 'remove' && pointed && !removalReason(pointed.id)) onRemove(pointed.id); setTarget(null); }}>
      <Portal><Menu.Positioner><Menu.Content data-studio-user-content {...colors} maxW="360px">
        <div style={{ padding: '6px 10px', color: 'var(--fg-secondary)', overflowWrap: 'anywhere' }}>
          {pointed?.name}（{pointed?.id}）
        </div>
        <Menu.Item value="remove" disabled={!!reason} color="var(--fg-primary)" _highlighted={{ bg: 'var(--bg-subtle)' }}>
          {shared ? '删除默认阶段' : '从此成就删除阶段'}
        </Menu.Item>
        <div style={{ padding: '6px 10px', color: 'var(--fg-secondary)' }}>
          {reason || (shared ? '影响沿用此默认阶段的成就；专用配置保留。' : '只影响当前成就，其他成就不变。')}
        </div>
      </Menu.Content></Menu.Positioner></Portal>
    </Menu.Root>
  </>;
}
