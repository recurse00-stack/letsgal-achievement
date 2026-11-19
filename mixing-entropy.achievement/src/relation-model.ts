import { resolveStages, type Catalog, type Achievement, type DisplayStage } from './model.ts';
import { presentationPreset } from './appearance-presets.ts';
import { applyGroupScheme, resolvePresentation, materializePresentation, levelPresetId, type Surface } from './stage-presentation.ts';
import type { EditorTarget } from './editor-navigation';

export type RelationKind = 'achievement' | 'stage' | 'card' | 'popup' | 'default' | 'level-part' | 'level' | 'scheme' | 'interface' | 'template';
export interface RelationNode { id: string; label: string; kind: RelationKind; badge: string; detail: string[]; target: EditorTarget; x: number; y: number; ui?: string; stageId?: string; depth?: number; expandLabel?: string }
export interface RelationEdge { from: string; to: string; type: 'owns' | 'ref'; label: string }
export interface RelationData { nodes: RelationNode[]; edges: RelationEdge[] }
export interface RelationInput { catalog: Catalog; page: string; popup: string; notifications: boolean }
export interface Referrer { achievementId: string; stageId: string; name: string; stageName: string }
export const relationId = (...parts: string[]) => JSON.stringify(parts);
export const normalizeUI = (value: string) => { const v = value.replace(/^ui:/, '').replace(/^@/, ''); return v.includes('/') ? v : 'mixing-entropy.achievement/' + v; };
export const interfaceName = (ref: string) => ({'mixing-entropy.achievement/achievements':'成就页','mixing-entropy.achievement/achievement-popup':'成就浮现','mixing-entropy.achievement/achievement-summary':'成就汇总浮现'}[normalizeUI(ref)] ?? normalizeUI(ref).split('/').pop()!);
export const stageTarget = (achievementId: string, stageId: string, surface = 'content'): EditorTarget => ({route:{area:'achievements',sub:''},selections:{achievement:achievementId,['detail:' + achievementId]:'stages',['stage:' + achievementId]:stageId,['surface:' + achievementId + ':' + stageId]:surface}});
const sharedTarget = (kind: 'level' | 'default-stage', id: string, surface='content'): EditorTarget => ({route:{area:'attributes',sub:kind === 'level' ? 'levels' : 'defaults'},selections:{[kind]:id,...kind==='default-stage'?{['surface::'+id]:surface}:{}}});
const schemeTarget = (id: string, surface: Surface): EditorTarget => ({route:{area:'interfaces',sub:surface === 'card' ? 'cards' : 'popups'},selections:{['appearance:' + surface]:id}});
export const interfaceTarget = (ref: string, template = false): EditorTarget => ({route:{area:'interfaces',sub:'reference'},selections:{'interface-ref':normalizeUI(ref),'interface-template':template ? 'yes' : ''}});

/** Use the same effective presentation resolver as the player and existing editors. */
function stageLinks(input: RelationInput, item: Achievement, stage: DisplayStage) {
  const c = input.catalog, own = c.stages.some(s => s.achievementId === item.id && s.id === stage.id && !s.disabled);
  const shared = c.defaultStages.find(s => s.id === stage.id);
  const level = c.levels.find(l => l.id === (stage.levelMode === 'custom' ? stage.levelId : item.levelId));
  const surfaces = (['card','popup'] as const).map(surface => {
    const p = applyGroupScheme(resolvePresentation(c.presentations ?? [], c.defaultStages, stage, item.id, surface), c.groups ?? [], item.id);
    const scheme = presentationPreset(p, c.appearances ?? [], levelPresetId(level,surface),surface);
    const material = materializePresentation(p,c.appearances ?? [],levelPresetId(level,surface));
    const ownP = c.presentations?.find(r => r.achievementId === item.id && r.stageId === stage.id && r.surface === surface);
    const sharedP = c.presentations?.find(r => !r.achievementId && r.stageId === stage.id && r.surface === surface && r.mode === 'custom');
    const css = (c.elementCss ?? []).filter(r => r.ownerId === stage.id && (r.surface === surface || r.surface === 'both'));
    const sharedCss = css.some(r => r.ownerKind === 'defaultStage');
    const localCss = css.filter(r => r.ownerKind === 'stage' && r.achievementId === item.id);
    const sharedUsed = !!shared && (ownP?.mode !== 'custom' && (!!sharedP || ownP?.mode === 'inherit' || !own) || sharedCss);
    const inherited=!!shared&&ownP?.mode!=='custom'&&!localCss.length&&(ownP?.mode==='inherit'||!!sharedP||!own);
    return {surface,p,scheme,ownP,sharedUsed,localCss,inherited,ui: normalizeUI(surface === 'card' ? input.page : material.ui || input.popup)};
  });
  return {own, shared, level, surfaces};
}
export function relationStageStructure(input:RelationInput,item:Achievement,stage:DisplayStage){
  const links=stageLinks(input,item,stage);
  return {...links,fullyInherited:!!links.shared&&!links.own&&links.surfaces.every(p=>p.inherited)};
}
export function referencedIds(input: RelationInput, item: Achievement, stage: DisplayStage): string[] {
  const s=stageLinks(input,item,stage), result:string[]=[];
  if(s.shared && (!s.own || s.surfaces.some(p=>p.sharedUsed)))result.push(relationId('default',stage.id));
  if(s.level){result.push(relationId('level',s.level.id)); for(const surface of ['card','popup'] as const){const id=levelPresetId(s.level,surface);if(id)result.push(relationId('scheme',id,surface));}}
  for(const p of s.surfaces){if(p.scheme)result.push(relationId('scheme',p.scheme.id,p.surface)); result.push(relationId('interface',p.ui));if(p.surface==='card')result.push(relationId('template',p.ui));}
  return result;
}
export function relationReferrers(input: RelationInput, nodeId: string): Referrer[] {
  const result:Referrer[]=[];
  for(const item of input.catalog.achievements) for(const stage of resolveStages(item.id,input.catalog.defaultStages,input.catalog.stages))
    if(referencedIds(input,item,stage).includes(nodeId))result.push({achievementId:item.id,stageId:stage.id,name:item.name,stageName:stage.name});
  return result;
}
/** Initial radial layout only. Dragging and returning to the graph preserve session positions. */
function radialLayout(nodes: RelationNode[], edges: RelationEdge[], root: string) {
  const tau=Math.PI*2, wrap=(a:number)=>(a%tau+tau)%tau;
  const stages=nodes.filter(n=>n.kind==='stage'), angles=new Map<string,number>([[root,0]]);
  const center=nodes.find(n=>n.id===root)!;center.x=0;center.y=0;
  stages.forEach((n,i)=>angles.set(n.id,wrap(-Math.PI/2+i*tau/Math.max(1,stages.length))));
  const ring=(n:RelationNode)=>n.id===root?0:n.depth??(n.kind==='stage'?1:4);
  const stageRadius=Math.max(210,stages.length*175/tau);
  for(let depth=1;depth<=Math.max(1,...nodes.map(ring));depth++) {
    const group=nodes.filter(n=>ring(n)===depth), radius=Math.max(stageRadius+(depth-1)*170,group.length*180/tau);
    group.forEach((n,i)=>{
      if(angles.has(n.id))return;
      const sources=edges.filter(e=>e.to===n.id&&angles.has(e.from)).map(e=>angles.get(e.from)!);
      const stage=stages.find(s=>s.stageId===n.stageId);if(stage)sources.push(angles.get(stage.id)!);
      const x=sources.reduce((v,a)=>v+Math.cos(a),0),y=sources.reduce((v,a)=>v+Math.sin(a),0);
      let angle=sources.length&&Math.hypot(x,y)>.01?Math.atan2(y,x):-Math.PI/2+i*tau/Math.max(1,group.length);
      if(n.kind==='card')angle-=.22;if(n.kind==='popup')angle+=.22;
      angles.set(n.id,wrap(angle));
    });
    // Separate nearby labels on the same ring without losing their owning branch.
    if(depth>1)for(let iteration=0;iteration<80;iteration++)for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
      const a=group[i].id,b=group[j].id,d=((angles.get(b)!-angles.get(a)!+Math.PI+tau)%tau)-Math.PI,min=Math.min(175/radius,tau/Math.max(1,group.length)*.85);
      if(Math.abs(d)>=min)continue;const push=(min-Math.abs(d))*.26*(Math.sign(d)||1);
      angles.set(a,wrap(angles.get(a)!-push));angles.set(b,wrap(angles.get(b)!+push));
    }
    for(const n of group){const a=angles.get(n.id)!;n.x=Math.cos(a)*radius*1.2;n.y=Math.sin(a)*radius;}
  }
}
export function buildRelations(input: RelationInput, focusId: string, expanded: readonly string[] = [], page = 0, references: readonly Referrer[] = [], referenceNode = ''): RelationData {
  const c=input.catalog, item=c.achievements.find(a=>a.id===focusId), nodes=new Map<string,RelationNode>(), edges:RelationEdge[]=[];
  if(!item)return {nodes:[],edges};
  const add=(n:RelationNode)=>{const existing=nodes.get(n.id);if(!existing)nodes.set(n.id,n);else existing.depth=Math.min(existing.depth??99,n.depth??99);return n.id;};
  const edge=(from:string,to:string,type:RelationEdge['type'],label:string)=>{if(!edges.some(e=>e.from===from&&e.to===to&&e.label===label))edges.push({from,to,type,label});};
  const all=resolveStages(item.id,c.defaultStages,c.stages), shown=all.slice(page*50,page*50+50);
  const aid=add({id:relationId('achievement',item.id),kind:'achievement',label:item.name,badge:'成就',detail:[item.id,item.description||'未填写说明'],target:{route:{area:'achievements',sub:''},selections:{achievement:item.id,['detail:'+item.id]:'base'}},x:0,y:0,depth:0});
  const addScheme=(id:string,surface:Surface,depth:number)=>{
    const scheme=c.appearances?.find(s=>s.id===id&&(!s.surface||s.surface===surface));if(!scheme)return '';
    return add({id:relationId('scheme',id,surface),kind:'scheme',label:scheme.name,badge:surface==='card'?'通用卡片方案':'通用浮现方案',detail:[id,scheme.isDefault?'本组默认方案':'可复用方案'],target:schemeTarget(id,surface),x:0,y:0,depth});
  };
  const addParts=(stage:DisplayStage,parent:string,shared:boolean)=>{
    const links=relationStageStructure(input,item,stage),depth=shared?3:2;
    const target=(surface='content')=>shared?sharedTarget('default-stage',stage.id,surface):stageTarget(item.id,stage.id,surface);
    const partId=(part:string)=>shared?relationId('default-part',stage.id,part):relationId(part,item.id,stage.id);
    for(const part of ['card','level','popup'] as const){
      if(part==='level'){
        const l=links.level,id=partId('level-part'),inherit=!!links.shared&&!links.own;
        const label=shared?'等级':'等级'+(l?' · '+l.name:'');
        const badge=shared?(stage.levelMode==='custom'?'指定等级':'成就基础等级'):inherit?'沿用默认':stage.levelMode==='custom'?'指定等级':'成就基础等级';
        const detail=[stage.levelMode==='custom'?'指定：'+(l?.name??stage.levelId):'使用所属成就的基础等级',...(shared?['当前参考成就：'+item.name+' · '+(l?.name??'无等级')]:[])];
        add({id,kind:'level-part',label,badge,detail,target:target(),stageId:stage.id,depth,x:0,y:0,expandLabel:'等级来源'});edge(parent,id,'owns','等级');
        if(!expanded.includes(id)||!l)continue;
        const lid=add({id:relationId('level',l.id),kind:'level',label:l.name,badge:'等级配置',detail:[l.id],target:sharedTarget('level',l.id),depth:depth+1,x:0,y:0});edge(id,lid,'ref',shared&&stage.levelMode!=='custom'?'本成就解析为':'使用等级');
        for(const surface of ['card','popup'] as const){const preset=levelPresetId(l,surface),pid=preset&&addScheme(preset,surface,depth+2);if(pid)edge(lid,pid,'ref','等级关联');}
        continue;
      }
      const p=links.surfaces.find(p=>p.surface===part)!,id=partId(part);
      const status=shared?'默认配置':p.inherited?'沿用默认':p.ownP?.mode==='custom'||p.localCss.length?'单独配置':'本阶段配置';
      const detail=[shared?'共用默认阶段：'+stage.name:item.name+' / '+stage.name,status,
        ...p.localCss.length?['含本阶段 CSS 调整']:[],
        ...part==='popup'&&!input.notifications?['全局浮现已关闭']:[],
        ...part==='card'?['编排位置：'+interfaceName(p.ui)+' → 双击成就列表 → 网格项模板']:[]];
      add({id,kind:part,label:part==='card'?'卡片':'浮现',badge:(p.p.enabled?'':'不输出 · ')+status,detail,target:target(part),stageId:stage.id,depth,x:0,y:0,expandLabel:part==='card'?'卡片来源':'浮现来源'});edge(parent,id,'owns',part==='card'?'卡片':'浮现');
      if(!expanded.includes(id))continue;
      if(p.scheme){const pid=addScheme(p.scheme.id,part,depth+1);edge(id,pid,'ref',p.p.appearanceSource==='level'?'跟随等级':p.p.appearanceSource==='default'?'默认方案':'指定方案');}
      const uiid=add({id:relationId('interface',p.ui),kind:'interface',label:interfaceName(p.ui),badge:'界面',ui:p.ui,detail:[p.ui,'个性化 → 所属扩展 → 对应界面'],target:interfaceTarget(p.ui),depth:depth+2,x:0,y:0});
      if(part==='card'){
        const tid=add({id:relationId('template',p.ui),kind:'template',label:'卡片模板',badge:interfaceName(p.ui),ui:p.ui,detail:[p.ui,'打开对应成就页 → 双击成就列表 → 网格项模板'],target:interfaceTarget(p.ui,true),depth:depth+1,x:0,y:0});
        edge(id,tid,'ref',p.p.enabled?'编排':'已配置 · 不输出');edge(tid,uiid,'ref','所属页面');
      }else edge(id,uiid,'ref',p.p.enabled?'浮现界面':'已配置 · 不输出');
    }
  };
  for(const stage of shown){
    const links=relationStageStructure(input,item,stage),sid=relationId('stage',item.id,stage.id);
    const name=stage.nameMode==='base'?item.name:stage.nameMode==='custom'?stage.displayName:'不显示';
    const description=stage.descriptionMode==='base'?item.description:stage.descriptionMode==='custom'?stage.description:'不显示';
    add({id:sid,kind:'stage',stageId:stage.id,label:stage.name,badge:stage.id===item.initialStageId?'初始阶段':links.fullyInherited?'沿用默认':'有单独配置',detail:[stage.id,links.fullyInherited?'完整沿用默认阶段':'本阶段有单独配置','名称：'+name,'说明：'+(description||'未填写')],target:stageTarget(item.id,stage.id),depth:1,x:0,y:0});edge(aid,sid,'owns','阶段');
    if(links.fullyInherited){
      const did=add({id:relationId('default',stage.id),kind:'default',label:links.shared!.name,badge:'默认阶段',stageId:stage.id,detail:['共用配置',stage.id],target:sharedTarget('default-stage',stage.id),depth:2,x:0,y:0,expandLabel:'卡片、等级、浮现'});edge(sid,did,'ref','沿用默认');
      if(expanded.includes(did))addParts(stage,did,true);
    }else addParts(stage,sid,false);
  }
  // Do not leave unrelated reference nodes floating after their source is collapsed.
  if(nodes.has(referenceNode)){
    const grouped=new Map<string,Referrer[]>();for(const r of references){if(r.achievementId===focusId)continue;const g=grouped.get(r.achievementId)??[];g.push(r);grouped.set(r.achievementId,g);}
    for(const [id,refs] of grouped){const r=refs[0],rid=add({id:relationId('achievement',id),kind:'achievement',label:r.name,badge:`${refs.length} 个关联阶段`,detail:refs.map(s=>s.stageName+' · '+s.stageId),target:stageTarget(id,r.stageId),depth:2,x:0,y:0});edge(rid,referenceNode,'ref','引用');}
  }
  const result=[...nodes.values()];radialLayout(result,edges,aid);
  return {nodes:result,edges};
}
