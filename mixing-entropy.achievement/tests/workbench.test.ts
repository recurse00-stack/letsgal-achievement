import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

test('workbench autosaves, retains invalid scoped drafts, detects conflicts and navigates without writes', async () => {
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}), saved=new Map();
 for(const [k,v] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})) {saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,value:v});}
 const temp=await mkdtemp(fileURLToPath(new URL('../.workbench-test-',import.meta.url)));
 const React=await import('react'),{createRoot}=await import('react-dom/client'); const root=createRoot(dom.window.document.getElementById('root')!);
 try {
 await writeFile(`${temp}/kit.jsx`, `import React from 'react';
export const store={values:{},writes:[],reject:{},external(key,value){this.values[key]=value;listeners.forEach(f=>f())}};const listeners=new Set();
export function useSetting(key){const [,update]=React.useState(0);React.useEffect(()=>{const f=()=>update(x=>x+1);listeners.add(f);return()=>listeners.delete(f)},[]);return [store.values[key],value=>{if(store.reject[key]>0){store.reject[key]--;return false;}store.values[key]=value;store.writes.push(key);listeners.forEach(f=>f());return true},{isEnabled:true,isModified:false,reset(){}}];}
export function Section({title,children,defaultOpen=true}){const [open,setOpen]=React.useState(defaultOpen);return <section><button onClick={()=>setOpen(!open)}>{title}</button>{open&&children}</section>}
export function FieldRow({label,children}){return <label>{label}{children}</label>}
export function Button({children,onClick,disabled}){return <button disabled={disabled} onClick={onClick}>{children}</button>}
export function Select({value,options,onChange}){return <select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}
export function Switch({checked,onChange}){return <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>}
export function TextInput({value,onChange}){return <input type="text" value={value} onChange={e=>onChange(e.target.value)}/>}
export const AssetPicker=TextInput,UIRefPicker=TextInput,ColorPicker=TextInput,NumberSlider=TextInput;
export const SettingField=()=>null,ImagePreview=()=>null;

export const ParamField=()=>null;export const useInspectorEnvironment=()=>({readOnly:false});export const useParam=()=>[undefined,()=>true,{}];`);
 await writeFile(`${temp}/entry.tsx`, `export {settingsPage} from '../src/studio';export {store} from './kit';
 import React from 'react';import {EditorSession,EditorScope,useSetting,useEditorState,SaveStatus} from '../src/editor-session';import {TextInput,Numeric,ObjectList} from '../src/editor-primitives';
 export function Harness(){const [id,setId]=React.useState('a');return <EditorSession><button onClick={()=>setId(id==='a'?'b':'a')}>switch</button><EditorScope id={id}><Fields id={id}/></EditorScope><SaveStatus/></EditorSession>}
 function Fields({id}){const [v,set]=useSetting(id),[tab,tabSet]=useEditorState('tab','first');return <><TextInput ariaLabel="name" required value={v.name} onChange={name=>set({...v,name})}/><Numeric ariaLabel="size" min={1} max={100} value={v.size} onChange={size=>set({...v,size})}/><button onClick={()=>tabSet('second')}>tab</button><output>{tab}</output></>}
 export function ListHarness(){const [id,set]=React.useState('id1');return <EditorSession><ObjectList title="objects" items={Array.from({length:105},(_,i)=>({id:'id'+i,name:'Object '+i}))} selected={id} onSelect={set}/><output>{id}</output></EditorSession>}
 `);
 await build({entryPoints:[`${temp}/entry.tsx`],outfile:`${temp}/bundle.mjs`,bundle:true,platform:'node',format:'esm',jsx:'automatic',external:['react','react-dom','postcss','@chakra-ui/react'],alias:{'@avg-studio/studio-ui':`${temp}/kit.jsx`},logLevel:'silent'});
 const {Harness,ListHarness,settingsPage,store}=await import(pathToFileURL(`${temp}/bundle.mjs`).href);
 const act=React.act,doc=dom.window.document;
 const click=async(text:string)=>{const b=[...doc.querySelectorAll('button')].find(b=>b.textContent===text)!;assert.ok(b,text);await act(async()=>b.click())};
 const input=(label:string)=>doc.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
 const type=async(label:string,value:string)=>{await act(async()=>{const e=input(label);assert.ok(e,label);Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(e,value);e.dispatchEvent(new dom.window.Event('input',{bubbles:true}))})};
 const settle=async()=>act(async()=>{await new Promise(r=>setTimeout(r,560))});
 store.values.a={name:'A',size:10};store.values.b={name:'B',size:20};
 await act(async()=>root.render(React.createElement(Harness)));
 assert.equal(store.writes.length,0);
 await type('name','A changed');assert.equal(store.writes.length,0);await settle();assert.equal(store.values.a.name,'A changed');
 await type('name','');await settle();assert.equal(store.values.a.name,'A changed');assert.match(doc.body.textContent!,/尚有未保存/);
 await click('tab');await click('switch');assert.equal(input('name').value,'B');assert.equal(doc.querySelector('output')!.textContent,'first');
 await click('switch');assert.equal(input('name').value,'');assert.equal(doc.querySelector('output')!.textContent,'second');
 await type('name','flush A');await click('switch');assert.equal(store.values.a.name,'flush A');assert.equal(store.values.b.name,'B','key changes flush to old owner');
 await type('name','mine');await act(async()=>store.external('b',{name:'external',size:21}));await settle();assert.equal(store.values.b.name,'external');assert.match(doc.body.textContent!,/外部更新/);
 await click('使用最新值');assert.equal(input('name').value,'external');
 store.reject.b=1;await type('name','retry');await settle();assert.equal(store.values.b.name,'external');assert.match(doc.body.textContent!,/保存被拒绝/);
 await type('name','retried');await settle();assert.equal(store.values.b.name,'retried');
 await type('size','0');await settle();assert.equal(store.values.b.size,21);assert.equal(input('size').value,'0');
 await act(async()=>root.render(React.createElement(ListHarness)));
 assert.equal(doc.querySelectorAll('.aw-object').length,50);await click('下一页');assert.equal(doc.querySelector('output')!.textContent,'id1');
 await type('搜索objects','id104');assert.equal(doc.querySelectorAll('.aw-object').length,1);assert.equal(doc.querySelector('output')!.textContent,'id1','search never changes selection');
 store.values['main.achievements']=[{id:'a',name:'A',description:'Desc',levelId:'bronze',icon:'',initialStageId:'unknown'},{id:'b',name:'B',description:'',levelId:'silver',icon:'',initialStageId:'unknown'}];
 const start=store.writes.length;await act(async()=>root.render(React.createElement(settingsPage)));
 const zoomButton=(name:string)=>doc.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
 const zoom=()=>doc.querySelector('[data-workbench-scale]')!;
 assert.equal(zoom().getAttribute('data-workbench-scale'),'100');
 for(let i=0;i<8;i++)await act(async()=>zoomButton('缩小工作台').click());
 assert.equal(zoom().getAttribute('data-workbench-scale'),'75');assert.equal(zoomButton('缩小工作台').disabled,true);
 assert.equal(zoom().contains(zoomButton('放大工作台')),false,'zoom control is outside the scaled editor');
 for(let i=0;i<18;i++)await act(async()=>zoomButton('放大工作台').click());
 assert.equal(zoom().getAttribute('data-workbench-scale'),'150');assert.equal(zoomButton('放大工作台').disabled,true);
 await click('还原');assert.equal(zoom().getAttribute('data-workbench-scale'),'100');
 assert.equal(store.writes.length,start,'zoom does not write game configuration');

 await click('基础资料');assert.equal(input('名称').value,'A');
 await click('属性配置');await click('默认阶段');await click('界面与浮现');await click('卡片');await click('浮现');await click('合并汇总');await click('成就');
 assert.equal(input('名称').value,'A');assert.equal(store.writes.length,start,'navigation and previews do not save');
 await type('名称','New A');await settle();assert.equal(store.values['main.achievements'][0].name,'New A');
 await click('阶段');
 const steamLabel='关联 Steam 成就', bindings='main.steamAchievements';
 assert.equal(input(steamLabel).value,'');
 const stageOverrides=structuredClone(store.values['main.displayStages']);
 await type(steamLabel,'  Intro_A  ');await settle();
 assert.deepEqual(store.values[bindings],[{achievementId:'a',stageId:'unknown',apiName:'Intro_A'}]);
 assert.deepEqual(store.values['main.displayStages'],stageOverrides);
 await click('查看默认来源');assert.match(doc.body.textContent!,/共用配置/);assert.equal(input(steamLabel),null);
 await click('← 返回原编辑位置');assert.match(doc.querySelector('.aw-editor')!.textContent!,/New A/);
 assert.equal(input(steamLabel).value,'Intro_A');
 // The read-only graph uses real navigation and keeps its view after visiting editors.
 const graphWrites=store.writes.length;
 await click('查看关联图');assert.ok(doc.querySelector('svg[aria-label="成就关联图画布"]'));
 const wheelCanvas=doc.querySelector('svg')!,wheelCamera=()=>doc.querySelector('svg > g')!.getAttribute('transform');
 let outerWheels=0;const outerWheel=()=>outerWheels++;doc.body.addEventListener('wheel',outerWheel);
 const beforeWheel=wheelCamera(),plainWheel=new dom.window.WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-80});
 await act(async()=>wheelCanvas.dispatchEvent(plainWheel));
 assert.equal(wheelCamera(),beforeWheel);assert.equal(plainWheel.defaultPrevented,false);assert.equal(outerWheels,1,'ordinary wheel remains page scrolling');
 const ctrlWheel=new dom.window.WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-80,clientX:400,clientY:250});
 await act(async()=>wheelCanvas.dispatchEvent(ctrlWheel));
 assert.notEqual(wheelCamera(),beforeWheel);assert.equal(ctrlWheel.defaultPrevented,true);assert.equal(outerWheels,1,'Ctrl wheel is consumed by graph, not outer scroll or browser zoom');
 doc.body.removeEventListener('wheel',outerWheel);
 const graphNode=(id:string)=>[...doc.querySelectorAll<SVGGElement>('[data-graph-node]')].find(n=>n.getAttribute('data-graph-node')===id)!;
 const defaultId=JSON.stringify(['default','unknown']);
 await act(async()=>graphNode(defaultId).dispatchEvent(new dom.window.FocusEvent('focusin',{bubbles:true})));
 await click('展开卡片、等级、浮现');
 const popupId=JSON.stringify(['default-part','unknown','popup']);
 assert.ok(graphNode(popupId));
 await click('收起卡片、等级、浮现');assert.equal(graphNode(popupId),undefined);
 await click('展开卡片、等级、浮现');
 await act(async()=>graphNode(popupId).dispatchEvent(new dom.window.MouseEvent('dblclick',{bubbles:true})));
 assert.match(doc.querySelector('.aw-editor')!.textContent!,/阶段浮现/);assert.equal(input('阶段名称'),null,'surface target opens popup instead of content');
 await click('← 返回关联图');
 await act(async()=>graphNode(popupId).dispatchEvent(new dom.window.FocusEvent('focusin',{bubbles:true})));
 await click('展开浮现来源');await click('放大图');
 const cameraBefore=doc.querySelector('svg > g')!.getAttribute('transform');
 const stageIdForGraph=JSON.stringify(['stage','a','unknown']);
 const beforeDrag=graphNode(stageIdForGraph).getAttribute('transform');
 let captures=0;Object.defineProperty(doc.querySelector('svg')!,'setPointerCapture',{value:()=>captures++,configurable:true});
 await act(async()=>{graphNode(stageIdForGraph).dispatchEvent(new dom.window.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:100,clientY:100}));doc.querySelector('svg')!.dispatchEvent(new dom.window.MouseEvent('pointerup',{bubbles:true,clientX:100,clientY:100}));});
 assert.equal(captures,0,'a click must not be retargeted to the canvas before the native double click');
 await act(async()=>{graphNode(stageIdForGraph).dispatchEvent(new dom.window.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:100,clientY:100}));doc.querySelector('svg')!.dispatchEvent(new dom.window.MouseEvent('pointermove',{bubbles:true,clientX:220,clientY:170}));doc.querySelector('svg')!.dispatchEvent(new dom.window.MouseEvent('pointerup',{bubbles:true,clientX:220,clientY:170}));});
 assert.equal(captures,1,'capture starts only with an actual drag');
 const positionBefore=graphNode(stageIdForGraph).getAttribute('transform');
 assert.notEqual(positionBefore,beforeDrag,'pointer movement actually moves the graph node');
 await act(async()=>graphNode(stageIdForGraph).dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
 assert.equal(input('阶段名称').value,'未激活');await click('← 返回关联图');
 assert.equal(doc.querySelector('svg > g')!.getAttribute('transform'),cameraBefore);assert.equal(graphNode(stageIdForGraph).getAttribute('transform'),positionBefore);
 const uiNode=graphNode(JSON.stringify(['interface','mixing-entropy.achievement/achievement-popup']));
 await act(async()=>uiNode.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true})));assert.match(doc.body.textContent!,/编排位置/);await click('← 返回关联图');
 assert.equal(store.writes.length,graphWrites,'graph drag, zoom, references and navigation never write settings');
 await click('← 返回原编辑位置');
 // Exercise the complete creator path against real editor components, not direct setting mutations.
 await click('＋ 新建成就');await click('创建');
 const created=store.values['main.achievements'].at(-1), createdId=created.id;
 assert.match(createdId,/^achievement_/);assert.equal(created.initialStageId,'unknown');
 await click('基础资料');await type('名称','初次启程');await settle();
 const choose=async(label:string,value:string,index=0)=>act(async()=>{const el=doc.querySelectorAll<HTMLSelectElement>(`[data-field="${label}"] select`)[index];assert.ok(el,label);el.value=value;el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
 await choose('基础等级','silver');
 await act(async()=>{const el=doc.querySelector<HTMLTextAreaElement>('textarea[aria-label="说明"]')!;Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value')!.set!.call(el,'故事从此时开始');el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});await settle();
 assert.equal(store.values['main.achievements'].at(-1).description,'故事从此时开始');
 await click('阶段');assert.equal(input(steamLabel).value,'');await click('＋ 本成就阶段');
 const stageId=store.values['main.displayStages'].at(-1).id;
 store.reject[bindings]=1;await type(steamLabel,'TRAVEL');await settle();
 assert.equal(store.values[bindings].length,1);
 await type(steamLabel,'TRAVEL_1');await settle();
 assert.deepEqual(store.values[bindings][1],{achievementId:createdId,stageId,apiName:'TRAVEL_1'});
 await type(steamLabel,'');await settle();
 assert.deepEqual(store.values[bindings],[{achievementId:'a',stageId:'unknown',apiName:'Intro_A'}]);
 await type('阶段名称','启程');await settle();await choose('本阶段等级','custom');await choose('本阶段等级','gold',1);
 assert.equal(store.values['main.displayStages'].find(s=>s.id===stageId).levelId,'gold');
 assert.equal(store.values['main.achievements'].at(-1).initialStageId,'unknown','creating or editing a stage never changes the initial stage');
 await click('卡片');await choose('成就页收录','omit');
 await click('浮现');await click('单独设置界面与时长');await choose('浮现时长','custom');await type('阶段浮现时长','1500');await settle();
 const rows=store.values['main.stagePresentations'].filter(p=>p.achievementId===createdId&&p.stageId===stageId);
 assert.equal(rows.find(p=>p.surface==='card').enabled,false);
 assert.equal(rows.find(p=>p.surface==='popup').durationMs,1500,'popup timing and card output stay independent');
 await click('恢复沿用界面与时长');assert.equal(store.values['main.stagePresentations'].find(p=>p.achievementId===createdId&&p.surface==='popup').durationMs,0);
 await click('移除成就…');await click('取消');assert.ok(store.values['main.achievements'].some(a=>a.id===createdId));
 await click('属性配置'); await click('分组'); await click('＋ 新建分组');
 const groupId = store.values['main.groupCatalog'][0].id;
 await type('组名','旅行'); await settle(); await choose('默认等级','gold');
 await click('成就'); await click('基础资料');
 const member = [...doc.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find(e=>e.parentElement?.textContent === '旅行');
 assert.ok(member); await act(async()=>member.click());
 await choose('等级来源','g:'+groupId);
 assert.equal(store.values['main.groupCatalog'].find(r=>r.kind==='binding').levelGroup,groupId);
 await act(async()=>member.click()); assert.match(doc.body.textContent!,/将保留当前值/);
 assert.match(doc.querySelector('[role="alert"] details')!.textContent!,/初次启程 · 等级 → 金/);
 await click('取消'); assert.equal(store.values['main.groupCatalog'].find(r=>r.kind==='binding').levelGroup,groupId);
 await act(async()=>member.click()); store.reject['main.groupCatalog']=1; await click('确认');
 assert.equal(store.values['main.groupCatalog'].find(r=>r.kind==='binding').levelGroup,groupId);
 await click('确认');
 assert.equal(store.values['main.groupCatalog'].find(r=>r.kind==='binding').level,'gold');
 assert.equal(store.values['main.groupCatalog'].some(r=>r.kind==='member'),false);
 await click('阶段');
 const tierSwitch=doc.querySelector<HTMLInputElement>('[data-field="按层级获得"] input');
 assert.ok(tierSwitch); await act(async()=>tierSwitch.click());
 assert.ok(store.values['main.stageTiers'].every(row=>row.achievementId===createdId));
 const highest = Math.max(...store.values['main.stageTiers'].map(r=>r.tier));
 await click('＋ 本成就阶段');
 const localId = store.values['main.displayStages'].at(-1).id;
 assert.match(doc.querySelector('[aria-label="当前阶段层序"]')!.textContent!,new RegExp('第 '+(highest+1)+' 层 · 新阶段'));
 await click('属性配置'); await click('默认阶段');
 const before = structuredClone(store.values['main.defaultStages']);
 store.reject['main.stageTiers']=1; await click('＋ 默认阶段');
 assert.deepEqual(store.values['main.defaultStages'],before);
 store.reject['main.defaultStages']=1; await click('＋ 默认阶段');
 assert.deepEqual(store.values['main.defaultStages'],before);
 assert.equal(store.values['main.stageTiers'].find(r=>r.stageId===localId).tier,highest+1);
 await click('＋ 默认阶段');
 await click('成就'); await click('阶段');
 if(!doc.querySelector('[aria-label="当前阶段层序"]')) await click('阶段层级');
 assert.match(doc.querySelector('[aria-label="当前阶段层序"]')!.textContent!,new RegExp('第 '+(highest+2)+' 层 · 新默认阶段'));
 } finally {await React.act(async()=>root.unmount());dom.window.close();for(const [k,v] of saved){if(v)Object.defineProperty(globalThis,k,v);else delete (globalThis as any)[k]}await rm(temp,{recursive:true,force:true});}
});
