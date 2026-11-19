import { useEffect, useId, useRef } from 'react';
import { useEditorState } from './editor-session';
import { RemovalContext } from './removal-context';

/** Folding and filtering are editor state, never stage configuration. */
export function StagePicker({ value, stages, initialStageId, onChange, removalReason, onRemove }: {
  value: string; stages: { id: string; name: string }[]; initialStageId?: string;
  onChange: (id: string) => void; removalReason: (id: string) => string; onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useEditorState('stages-expanded', false);
  const [query, setQuery] = useEditorState('stage-query', '');
  const many = stages.length > 8, collapsed = many && !expanded;
  const listId = useId(), listRef = useRef<HTMLDivElement>(null);
  const visible = many && expanded && query.trim()
    ? stages.filter(s => `${s.name} ${s.id}`.toLowerCase().includes(query.trim().toLowerCase())) : stages;
  useEffect(() => {
    const list = listRef.current;
    if (!list || !collapsed) return;
    const revealSelected = () => {
      const button = list.querySelector<HTMLElement>('[aria-current]');
      if (!button) return;
      const box = button.getBoundingClientRect(), viewport = list.getBoundingClientRect();
      const zoom = list.clientWidth ? viewport.width / list.clientWidth : 1;
      if (box.left < viewport.left) list.scrollLeft -= (viewport.left - box.left) / zoom;
      else if (box.right > viewport.right) list.scrollLeft += (box.right - viewport.right) / zoom;
    };
    revealSelected();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(revealSelected);
    observer?.observe(list);
    return () => observer?.disconnect();
  }, [collapsed, value, stages.length]);
  return <div className="aw-stage-picker">
    {many && expanded && <input className="aw-input" placeholder="搜索阶段名称或编号" aria-label="搜索阶段" value={query} onChange={e => setQuery(e.target.value)} />}
    <div className="aw-stage-strip" data-collapsed={collapsed}>
      <div id={listId} ref={listRef} className="aw-tabs aw-stage-blocks" role="group" aria-label="选择阶段">
        {visible.map(s => <RemovalContext key={s.id} title={`${s.name}（${s.id}）`} label="移除阶段" detail="从当前成就移除此阶段。" reason={removalReason(s.id)} onRemove={() => onRemove(s.id)}>
          <button type="button" data-stage-id={s.id} title={`${s.name}（${s.id}）`} aria-current={value === s.id ? 'page' : undefined} onClick={() => onChange(s.id)}>{s.name}{s.id === initialStageId ? ' · 初始' : ''}</button>
        </RemovalContext>)}
        {!visible.length && <span className="aw-note">没有匹配的阶段</span>}
      </div>
      {many && <button type="button" className="aw-stage-toggle" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(!expanded)}>{expanded ? '收起' : `展开（${stages.length}）`}</button>}
    </div>
  </div>;
}
