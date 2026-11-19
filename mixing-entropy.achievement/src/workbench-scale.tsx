import type { CSSProperties, ReactNode } from 'react';
import { useEditorState } from './editor-session';

export function WorkbenchScale({ children }: { children: ReactNode }) {
  const [scale, setScale] = useEditorState('workbench-scale', 100);
  const change = (value: number) => setScale(Math.min(150, Math.max(75, value)));
  return <>
    <div className="aw-scale-controls" role="group" aria-label="工作台缩放">
      <span>工作台缩放</span>
      <button type="button" aria-label="缩小工作台" disabled={scale <= 75} onClick={() => change(scale - 5)}>−</button>
      <input type="range" aria-label="工作台缩放比例" min={75} max={150} step={5} value={scale} onChange={e => change(Number(e.target.value))} />
      <button type="button" aria-label="放大工作台" disabled={scale >= 150} onClick={() => change(scale + 5)}>＋</button>
      <output>{scale}%</output><button type="button" disabled={scale === 100} onClick={() => setScale(100)}>还原</button>
    </div>
    <div data-workbench-scale={scale} style={{ zoom: scale / 100 } as CSSProperties}>{children}</div>
  </>;
}
