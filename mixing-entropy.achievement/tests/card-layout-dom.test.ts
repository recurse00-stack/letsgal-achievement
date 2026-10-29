import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { bindCardLayout } from '../src/card-layout.ts';
import type { Entry } from '../src/model.ts';
import type { CardSizeMeasurement } from '../src/card-size-reference.ts';

async function fixture(run: (f: ReturnType<typeof setup>) => Promise<void>, nativeContract = false) {
  const f = setup(nativeContract);
  try { await run(f); } finally { f.close(); }
}
function setup(nativeContract = false) {
  const dom = new JSDOM('<body><main></main></body>', { pretendToBeVisual: true });
  const win = dom.window;
  const keys = ['document','HTMLElement','getComputedStyle','MutationObserver','ResizeObserver','IntersectionObserver','requestAnimationFrame','cancelAnimationFrame','matchMedia'] as const;
  const previous = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const observers: Array<{ kind: string; connected: boolean; fire: (visible?: boolean) => void }> = [];
  const animations: Array<{ playState: string; plays: number; cancelled: boolean; onfinish: (() => void) | null; play():void; pause():void; cancel():void }> = [];
  class Resize {
    record: typeof observers[number];
    constructor(callback: () => void) { this.record={kind:'resize',connected:true,fire:callback}; observers.push(this.record); }
    observe() {} disconnect() { this.record.connected=false; }
  }
  class Intersection {
    record: typeof observers[number];
    constructor(callback: (items: Array<{ isIntersecting: boolean }>) => void) { this.record={kind:'intersection',connected:true,fire:v=>callback([{isIntersecting:!!v}])}; observers.push(this.record); }
    observe() {} disconnect() { this.record.connected=false; }
  }
  Object.assign(globalThis, {
    document: win.document, HTMLElement: win.HTMLElement, getComputedStyle: win.getComputedStyle.bind(win), MutationObserver: win.MutationObserver,
    ResizeObserver: Resize, IntersectionObserver: Intersection,
    requestAnimationFrame: win.requestAnimationFrame.bind(win), cancelAnimationFrame: win.cancelAnimationFrame.bind(win),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
  Object.defineProperty(win.HTMLElement.prototype, 'animate', { value() {
    const a = { playState: 'running', plays:0, cancelled:false, onfinish: null as (() => void)|null,
      play() { this.playState='running';this.plays++; }, pause() { this.playState='paused'; }, cancel() { this.cancelled=true;this.playState='idle'; } };
    animations.push(a);return a;
  } });
  const entries: Entry[] = [{ id:'a', name:'Name', description:'Description', icon:'ui/icon.png', iconMode:'custom', levelId:'bronze', levelName:'Copper', stageId:'one', stageName:'', appearance:{frameMode:'line',frameWidth:7,frameColor:'red',iconEffect:'float'} }];
  const roles = ['key','background','backgroundImage','frame','icon','name','description','level'];
  const roleType = (role: string) => ['icon','frame','backgroundImage'].includes(role) ? 'image' : role === 'background' ? 'rect' : 'text';
  const measurements: CardSizeMeasurement[] = [];
  const adapter = bindCardLayout(()=>entries, nativeContract ? roles.map(role => ({role,type:roleType(role)})) : [], size => measurements.push(size));
  const grid = win.document.createElement('div');grid.dataset.visualUiScrollContainer='true';grid.style.cssText=adapter.css;win.document.body.append(grid);
  const cell = win.document.createElement('div');grid.append(cell);
  let width=300,height=280;
  Object.defineProperties(cell,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});
  const part=(role:string,text='')=>{
    const wrapper=win.document.createElement('div');wrapper.style.cssText='position:absolute;left:8%;top:12%;width:80%;height:15%';
    const content=win.document.createElement('div');if (!nativeContract) content.style.setProperty('--achievement-card-role',role);
    if (nativeContract && roleType(role)==='image') content.dataset.visualUiImage='true';
    if(role==='icon'||role==='frame'||role==='backgroundImage') { const img=win.document.createElement('img'); img.src='data:image/svg+xml,<svg/>';content.append(img); }
    else if (nativeContract && roleType(role)==='text') { const paint=win.document.createElement('span');paint.dataset.visualUiTextPaint='true';paint.textContent=text;content.append(paint); }
    else content.textContent=text;
    wrapper.append(content);cell.append(wrapper);return {wrapper,content};
  };
  const parts=new Map(['key','background','backgroundImage','frame','icon','name','description','level'].map(role=>[role,part(role,role==='key'?'a':role==='name'?'Name':role==='description'?'Description':role==='level'?'Copper':'')]));
  const flush=async()=>{await new Promise(r=>setTimeout(r,70));};
  return { entries,adapter,cell,grid,parts,animations,observers,flush,part,measurements,
    resize(w:number,h:number){width=w;height=h;observers.filter(o=>o.kind==='resize'&&o.connected).forEach(o=>o.fire());},
    close(){adapter.dispose();dom.window.close();for(const [key,value] of previous){if(value)Object.defineProperty(globalThis,key,value);else Reflect.deleteProperty(globalThis,key);}},
  };
}
test('authored geometry and text layout survive resize; foreign lists remain untouched',()=>fixture(async f=>{
  const geometry=()=>[...f.parts.values()].map(p=>['left','top','width','height'].map(k=>p.wrapper.style.getPropertyValue(k)));
  const original=geometry();
  const text=f.parts.get('description')!.content;
  text.style.whiteSpace='pre-wrap';text.style.fontSize='27px';
  await f.flush();
  assert.deepEqual(geometry(),original);
  for (const side of ['top','right','bottom','left']) assert.equal(f.parts.get('frame')!.content.style.getPropertyValue(`border-${side}-width`),'7px');
  f.resize(600,180);await f.flush();assert.deepEqual(geometry(),original);
  assert.equal(text.style.whiteSpace,'pre-wrap');assert.equal(text.style.fontSize,'27px');assert.equal(text.style.webkitLineClamp,'');
  const foreign=f.grid.cloneNode(true) as HTMLElement;foreign.style.removeProperty('--achievement-card-scope');document.body.append(foreign);
  const foreignOriginal=foreign.innerHTML;f.resize(300,300);await f.flush();assert.equal(foreign.innerHTML,foreignOriginal);assert.deepEqual(geometry(),original);
}));
test('stage changes preserve authored geometry and stop earlier effects',()=>fixture(async f=>{
  await f.flush();const first=f.animations[0];assert.ok(first.plays>0);
  f.entries[0]={...f.entries[0],stageId:'two',appearance:{frameMode:'none'}};f.adapter.refresh();await f.flush();
  assert.equal(first.cancelled,true);assert.equal(f.parts.get('icon')!.wrapper.style.left,'8%');
  assert.equal(f.parts.get('frame')!.wrapper.style.display,'none');
  f.entries[0]={...f.entries[0],stageId:'three',appearance:{}};f.adapter.refresh();await f.flush();
  assert.equal(f.parts.get('frame')!.wrapper.style.display,'');assert.equal(f.parts.get('frame')!.content.style.border,'');
}));
test('CSS can replace disabled frame and background paint, then cleans up on stage change',()=>fixture(async f=>{
  f.entries[0].appearance={backgroundMode:'image',backgroundImage:'ui/bg.png',frameMode:'none',iconEffect:'rotate'};
  f.entries[0].elementCss=[{target:'background',surface:'card',css:'background:linear-gradient(red,blue);'}, {target:'frame',surface:'card',css:'border:8px solid purple;'}, {target:'icon',surface:'card',css:'transform:scale(.8)'}];
  await f.flush();assert.equal(f.parts.get('backgroundImage')!.wrapper.style.display,'none');assert.equal(f.parts.get('frame')!.wrapper.style.display,'block');
  assert.equal(f.animations.length,0);assert.equal(document.querySelectorAll('style[data-achievement-css]').length,3);
  f.entries[0]={...f.entries[0],stageId:'other',elementCss:[],appearance:{}};f.adapter.refresh();await f.flush();
  assert.equal(document.querySelectorAll('style[data-achievement-css]').length,0);
  assert.equal(f.parts.get('frame')!.wrapper.style.display,'');assert.equal(f.parts.get('backgroundImage')!.wrapper.style.display,'');
  assert.equal(f.parts.get('frame')!.content.querySelector('img')!.style.visibility,'');
}));
test('offscreen pauses, entry animation finishes once, disposal removes observers and effects',()=>fixture(async f=>{
  f.entries[0].appearance={iconEffect:'rotate',effectTrigger:'enter'};await f.flush();const a=f.animations[0];
  const observer=f.observers.find(o=>o.kind==='intersection'&&o.connected)!;
  observer.fire(false);assert.equal(a.playState,'paused');observer.fire(true);assert.equal(a.playState,'running');
  a.playState='finished';a.onfinish!();const plays=a.plays;observer.fire(false);observer.fire(true);assert.equal(a.plays,plays);
  f.adapter.dispose();assert.ok(a.cancelled);assert.ok(f.observers.every(o=>!o.connected));
}));
test('native replacement of template children is rebound even when data and size are unchanged',()=>fixture(async f=>{
  await f.flush();f.parts.get('frame')!.wrapper.remove();const replacement=f.part('frame');await f.flush();
  assert.equal(replacement.content.style.borderTopWidth,'7px');
}));
test('nine slice uses rendered image source and independent destination width',()=>fixture(async f=>{
  f.entries[0].appearance={frameMode:'nineSlice',frameImage:'ui/frame.png',frameWidth:9,sliceTop:24,sliceRight:20,sliceBottom:18,sliceLeft:16};await f.flush();
  const frame=f.parts.get('frame')!.content;
  assert.equal(frame.style.borderTopWidth,'9px');assert.equal(frame.style.borderImageSlice,'24 20 18 16');
  assert.ok(frame.style.borderImageSource.startsWith('url('));assert.equal(frame.querySelector('img')!.style.visibility,'hidden');
}));
test('pagination grid without a scroll marker still receives scoped appearance',()=>fixture(async f=>{
  delete f.grid.dataset.visualUiScrollContainer;f.grid.style.gridTemplateColumns='repeat(5, 1fr)';
  await f.flush();assert.equal(f.parts.get('icon')!.wrapper.style.width,'80%');assert.equal(f.parts.get('frame')!.content.style.borderTopWidth,'7px');
}));
test('resource contract binds native layers when the host omits child CSS metadata',()=>fixture(async f=>{
  await f.flush();assert.equal(f.parts.get('icon')!.wrapper.style.width,'80%');assert.equal(f.parts.get('frame')!.content.style.borderTopWidth,'7px');
  assert.equal(f.parts.get('frame')!.content.style.borderTopWidth,'7px');
  f.parts.get('icon')!.content.removeAttribute('data-visual-ui-image');f.adapter.refresh();await f.flush();
  for (const side of ['top','right','bottom','left']) assert.equal(f.parts.get('frame')!.content.style.getPropertyValue(`border-${side}-width`),'');
},true));

test('size reference reports allocation separately from content, updates after resizing and stops on disposal',()=>fixture(async f=>{
  delete f.grid.dataset.visualUiScrollContainer; f.grid.style.gridTemplateColumns='repeat(2, 1fr)';
  f.cell.style.width='708px'; f.cell.style.height='260px';
  f.resize(707,259); await f.flush();
  assert.equal(f.measurements.at(-1)!.width,708); assert.equal(f.measurements.at(-1)!.contentWidth,707);
  assert.equal(f.measurements.at(-1)!.height,260); assert.equal(f.measurements.at(-1)!.contentHeight,259);
  assert.equal(f.measurements.at(-1)!.mode,'pagination');
  assert.equal(f.parts.get('icon')!.wrapper.style.left,'8%');
  f.cell.style.width='1440px'; f.cell.style.height='544px'; f.resize(1439,543); await f.flush();
  assert.equal(f.measurements.at(-1)!.width,1440); assert.equal(f.measurements.at(-1)!.height,544);
  f.adapter.dispose(); const count=f.measurements.length; f.resize(20,20); await f.flush();
  assert.equal(f.measurements.length,count);
}));
