import type { GroupRow } from './groups';
import { GroupSourceSummary } from './group-editor';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, UIRefPicker } from '@avg-studio/studio-ui';
import { catalog, DEFAULT_LEVELS, resolveStages } from './model';
import { EditorScope, useEditorState, useSetting } from './editor-session';
import { useNavigation } from './editor-navigation';
import { ObjectList } from './editor-primitives';
import { buildRelations, interfaceName, relationId, relationReferrers, type RelationInput, type RelationNode } from './relation-model';
import { fitGraph, graphPositions, stepGraph, zoomGraph, type GraphCamera, type GraphPositions } from './relation-physics';
import { relationStyle } from './relation-style';

export function RelationGraph() {
  const [groups] = useSetting<GroupRow[]>('main.groupCatalog');
  const [levels]=useSetting<unknown[]>('main.levels'),[items]=useSetting<unknown[]>('main.achievements'),[stages]=useSetting<unknown[]>('main.displayStages'),[defaults]=useSetting<unknown[]>('main.defaultStages'),[schemes]=useSetting<unknown[]>('main.appearances'),[css]=useSetting<unknown[]>('main.elementCss'),[presentations]=useSetting<unknown[]>('main.stagePresentations');
  const [page]=useSetting<string>('main.page'),[popup]=useSetting<string>('main.popup'),[notifications]=useSetting<boolean>('main.notifications');
  const nav=useNavigation()!;
  const parsed=useMemo(()=>{try{return {input:{catalog:catalog(levels?.length?levels:DEFAULT_LEVELS,items??[],stages??[],defaults??[],schemes??[],css??[],presentations??[],groups??[]),page:page||'ui:@mixing-entropy.achievement/achievements',popup:popup||'ui:@mixing-entropy.achievement/achievement-popup',notifications:notifications!==false} as RelationInput};}catch(e){return {error:String(e)};}},[levels,items,stages,defaults,schemes,css,presentations,groups,page,popup,notifications]);
  if(!parsed.input)return <p role="alert">无法读取关联：{parsed.error}</p>;
  const input=parsed.input, item=input.catalog.achievements.find(a=>a.id===nav.selections['graph-achievement']);
  return <><h2>成就关联图{item?' · '+item.name:''}</h2><details className="aw-graph-root-picker"><summary>选择成就</summary><ObjectList title="关联图成就" items={input.catalog.achievements} selected={item?.id??''} onSelect={id=>nav.select('graph-achievement',id)} /></details>
    {item?<EditorScope key={item.id} id={'relations:'+item.id}><GroupSourceSummary achievement={item.id} /><GraphView input={input} achievementId={item.id} initialStage={nav.selections['stage:'+item.id]||item.initialStageId} /></EditorScope>:<p>选择一个成就查看关联。</p>}</>;
}
type ViewState={positions:GraphPositions;camera:GraphCamera};
const noExpandedNodes:string[]=[];
function GraphView({input,achievementId,initialStage}:{input:RelationInput;achievementId:string;initialStage:string}) {
  const nav=useNavigation()!, [expanded,setExpanded]=useEditorState<string[]>('expanded',noExpandedNodes),[selected,setSelected]=useEditorState('selected',relationId('achievement',achievementId));
  const [referenceNode,setReferenceNode]=useEditorState('reference-node',''),[refPage,setRefPage]=useEditorState('ref-page',0);
  const stages=useMemo(()=>resolveStages(achievementId,input.catalog.defaultStages,input.catalog.stages),[input,achievementId]);
  const [savedPage,setPage]=useEditorState('stage-page',Math.floor(Math.max(0,stages.findIndex(s=>s.id===initialStage))/50));
  const page=Math.min(savedPage,Math.max(0,Math.ceil(stages.length/50)-1));
  const references=useMemo(()=>referenceNode?relationReferrers(input,referenceNode):[],[input,referenceNode]);
  const pages=Math.max(1,Math.ceil(references.length/20)),effectiveRefPage=Math.min(refPage,pages-1),shownRefs=references.slice(effectiveRefPage*20,effectiveRefPage*20+20);
  const data=useMemo(()=>buildRelations(input,achievementId,expanded,page,shownRefs,referenceNode),[input,achievementId,expanded,page,references,effectiveRefPage,referenceNode]);
  const [savedView,setSavedView]=useEditorState<ViewState|undefined>('view',undefined);
  const positions=useRef<GraphPositions>(savedView?.positions??{}),camera=useRef<GraphCamera>(savedView?.camera??{x:0,y:0,scale:1}),mounted=useRef(false),svg=useRef<SVGSVGElement>(null);
  const [,render]=useState(0),frame=useRef(0),ticks=useRef(0),lastTime=useRef(0),settled=useRef(0),suppressDouble=useRef(0);
  const drag=useRef<{id:string;pointer:number;startX:number;startY:number;px:number;py:number;cam:GraphCamera;offsetX:number;offsetY:number;moved:boolean}|null>(null);
  const persist=useRef(()=>{});persist.current=()=>setSavedView({positions:Object.fromEntries(Object.entries(positions.current).map(([id,p])=>[id,{...p}])),camera:{...camera.current}});
  const currentData=useRef(data);currentData.current=data;
  const wake=()=>{ticks.current=0;settled.current=0;if(frame.current||typeof requestAnimationFrame==='undefined')return;
    const tick=(time:number)=>{frame.current=0;const dt=lastTime.current?Math.min(2,(time-lastTime.current)/16.67):1;lastTime.current=time;
      const speed=stepGraph(currentData.current,positions.current,drag.current?.id,dt);render(v=>v+1);ticks.current++;settled.current=speed<.025?settled.current+1:0;
      if(drag.current||settled.current<12&&ticks.current<400)frame.current=requestAnimationFrame(tick);else{lastTime.current=0;persist.current();}};
    frame.current=requestAnimationFrame(tick);
  };
  useEffect(()=>{positions.current={...positions.current,...graphPositions(data,positions.current)};if(!mounted.current){if(!savedView)camera.current=fitGraph(Object.fromEntries(data.nodes.map(n=>[n.id,positions.current[n.id]])));mounted.current=true;}wake();render(v=>v+1);},[data]);
  useEffect(()=>()=>{if(frame.current)cancelAnimationFrame(frame.current);persist.current();},[]);
  const point=(clientX:number,clientY:number)=>{const matrix=svg.current?.getScreenCTM?.();if(matrix){const p=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());return {x:p.x,y:p.y};}const box=svg.current?.getBoundingClientRect();return {x:(clientX-(box?.left??0))*1000/(box?.width||1000),y:(clientY-(box?.top??0))*620/(box?.height||620)};};
  const start=(e:React.PointerEvent<SVGSVGElement>)=>{if(e.button!==0)return;const p=point(e.clientX,e.clientY),target=(e.target as Element).closest<SVGGElement>('[data-graph-node]'),id=target?.getAttribute('data-graph-node')??'';if(id){setSelected(id);target?.focus();}
    const n=positions.current[id];drag.current={id,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,px:p.x,py:p.y,cam:{...camera.current},offsetX:n?n.x-(p.x-camera.current.x)/camera.current.scale:0,offsetY:n?n.y-(p.y-camera.current.y)/camera.current.scale:0,moved:false};e.preventDefault();};
  const move=(e:React.PointerEvent<SVGSVGElement>)=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;const p=point(e.clientX,e.clientY);if(!d.moved&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>4){d.moved=true;svg.current?.setPointerCapture?.(e.pointerId);}if(!d.moved)return;
    if(d.id){const n=positions.current[d.id];n.x=(p.x-camera.current.x)/camera.current.scale+d.offsetX;n.y=(p.y-camera.current.y)/camera.current.scale+d.offsetY;wake();}else camera.current={...d.cam,x:d.cam.x+p.x-d.px,y:d.cam.y+p.y-d.py};render(v=>v+1);};
  const end=(e:React.PointerEvent<SVGSVGElement>)=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;if(d.id&&d.moved){const n=positions.current[d.id];n.hx=n.x;n.hy=n.y;}if(d.moved)suppressDouble.current=Date.now()+350;drag.current=null;if(svg.current?.hasPointerCapture?.(e.pointerId))svg.current.releasePointerCapture(e.pointerId);persist.current();if(d.moved)wake();};
  const open=(node:RelationNode)=>{persist.current();nav.locate(node.target);};
  const zoom=(factor:number,x=500,y=310)=>{camera.current=zoomGraph(camera.current,factor,x,y);render(v=>v+1);persist.current();};
  useEffect(()=>{
    const canvas=svg.current;if(!canvas)return;
    const wheel=(e:WheelEvent)=>{
      if(!e.ctrlKey)return;
      e.preventDefault();e.stopPropagation();
      const p=point(e.clientX,e.clientY);zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.006),p.x,p.y);
    };
    canvas.addEventListener('wheel',wheel,{passive:false});
    return ()=>canvas.removeEventListener('wheel',wheel);
  },[]);
  const node=data.nodes.find(n=>n.id===selected),activeEdges=data.edges.filter(e=>e.from===selected||e.to===selected),neighbors=new Set(activeEdges.flatMap(e=>[e.from,e.to]));
  const canRefs=node&&['default','level','scheme','interface','template'].includes(node.kind);
  const referenceVisible=data.nodes.some(n=>n.id===referenceNode);
  return <div className="aw-graph"><style>{relationStyle}</style><div className="aw-actions aw-graph-toolbar">
    <Button onClick={()=>zoom(1/1.2)}>缩小图</Button><output aria-label="关联图缩放">{Math.round(camera.current.scale*100)}%</output><Button onClick={()=>zoom(1.2)}>放大图</Button>
    <Button onClick={()=>{camera.current=fitGraph(Object.fromEntries(data.nodes.map(n=>[n.id,positions.current[n.id]??{...n,vx:0,vy:0,hx:n.x,hy:n.y}])));render(v=>v+1);persist.current();}}>适应全图</Button>
    <Button onClick={()=>{positions.current=graphPositions(data);camera.current=fitGraph(positions.current);persist.current();wake();}}>整理布局</Button>
    <span className="aw-note">拖动节点或空白处 · Ctrl + 滚轮缩放 · 双击定位</span>
  </div>{stages.length>50&&<div className="aw-actions"><Button disabled={!page} onClick={()=>setPage(page-1)}>上一组阶段</Button><span>阶段 {page*50+1}—{Math.min(stages.length,(page+1)*50)} / {stages.length}</span><Button disabled={(page+1)*50>=stages.length} onClick={()=>setPage(page+1)}>下一组阶段</Button></div>}
    <svg className="aw-graph-canvas" ref={svg} viewBox="0 0 1000 620" aria-label="成就关联图画布" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <g transform={`translate(${camera.current.x} ${camera.current.y}) scale(${camera.current.scale})`}>
        {data.edges.map(e=>{const a=positions.current[e.from],b=positions.current[e.to];if(!a||!b)return null;const active=e.from===selected||e.to===selected;return <g key={JSON.stringify(e)} className={'aw-graph-edge '+e.type} data-active={active}><path d={`M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${(a.y+b.y)/2+Math.min(28,Math.abs(b.x-a.x)*.06)} ${b.x} ${b.y}`} />{active&&<text x={(a.x+b.x)/2} y={(a.y+b.y)/2-10}>{e.label}</text>}</g>;})}
        {data.nodes.map(n=>{const p=positions.current[n.id]??n;return <g key={n.id} role="button" tabIndex={0} aria-label={`${n.badge}：${n.label}`} data-graph-node={n.id} data-kind={n.kind} data-selected={selected===n.id} data-related={neighbors.has(n.id)} transform={`translate(${p.x} ${p.y})`} onDoubleClick={()=>{if(Date.now()>suppressDouble.current)open(n);}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();open(n);}if(e.key===' '){e.preventDefault();setSelected(n.id);}}} onFocus={()=>setSelected(n.id)}><title>{[n.label,n.badge,...n.detail].join('\n')}</title><rect x="-82" y="-32" width="164" height="64" rx="16" /><text y="-3" className="aw-graph-name">{n.label.length>11?n.label.slice(0,10)+'…':n.label}</text><text y="19" className="aw-graph-badge">{n.badge}</text></g>;})}
      </g>
    </svg><div className="aw-graph-legend"><span>━ 归属</span><span>┄ 引用 / 沿用</span><span>{data.nodes.length} 个节点</span></div>
    {node&&<aside className="aw-graph-detail"><div><h3>{node.label} <small>{node.badge}</small></h3>{node.detail.map((d,i)=><p className="aw-note" key={i}>{d}</p>)}</div><div className="aw-actions"><Button onClick={()=>open(node)}>定位编辑</Button>
      {node.expandLabel&&<Button onClick={()=>setExpanded(expanded.includes(node.id)?expanded.filter(id=>id!==node.id):[...expanded,node.id])}>{(expanded.includes(node.id)?'收起':'展开')+node.expandLabel}</Button>}
      {canRefs&&<Button onClick={()=>{setReferenceNode(referenceNode===node.id?'':node.id);setRefPage(0);}}>{referenceNode===node.id?'收起引用成就':'查看引用成就'}</Button>}
      {node.kind==='achievement'&&node.id!==relationId('achievement',achievementId)&&<Button onClick={()=>nav.select('graph-achievement',JSON.parse(node.id)[1])}>以此成就为中心</Button>}
    </div></aside>}
    {referenceNode&&referenceVisible&&<section className="aw-section"><h3>引用情况（{references.length} 个阶段）</h3><div className="aw-actions">{shownRefs.map(r=><Button key={r.achievementId+'/'+r.stageId} onClick={()=>{nav.locate({route:{area:'achievements',sub:''},selections:{achievement:r.achievementId,['detail:'+r.achievementId]:'stages',['stage:'+r.achievementId]:r.stageId,['surface:'+r.achievementId+':'+r.stageId]:'content'}});}}>{r.name} / {r.stageName}</Button>)}</div>{!references.length&&<p className="aw-note">没有成就引用此配置。</p>}{pages>1&&<div className="aw-actions"><Button disabled={!effectiveRefPage} onClick={()=>setRefPage(effectiveRefPage-1)}>上一页引用</Button><span>{effectiveRefPage+1} / {pages}</span><Button disabled={effectiveRefPage+1>=pages} onClick={()=>setRefPage(effectiveRefPage+1)}>下一页引用</Button></div>}</section>}
  </div>;
}
export function RelationInterface() {
  const nav=useNavigation()!,ref=nav.selections['interface-ref']??'',template=nav.selections['interface-template']==='yes';
  return <section className="aw-section"><h2>{template?'卡片模板 · ':''}{interfaceName(ref)}</h2><UIRefPicker value={ref} disabled onChange={()=>{}} ariaLabel="关联界面" /><p className="aw-note">{ref}</p><h3>编排位置</h3><p>个性化 → {ref.split('/')[0]} → {interfaceName(ref)}{template?' → 双击成就列表 → 网格项模板':''}</p><p className="aw-note">在官方编辑器中打开此界面，调整位置与动画。</p>
    {template&&<Button onClick={()=>nav.jump({area:'interfaces',sub:'cards'},'appearance:card','$template')}>查看模板与尺寸</Button>}
  </section>;
}
