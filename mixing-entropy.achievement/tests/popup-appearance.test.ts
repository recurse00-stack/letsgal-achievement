import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { bindPopupAppearance, popupParts } from '../src/popup-appearance.ts';
import type { Entry } from '../src/model.ts';

test('popup contract skips authored hidden, conditional and ambiguous elements', () => {
  const el = (refId:string, extra={}) => ({refId,type:'rect', ...extra});
  assert.deepEqual(popupParts({elements:[el('achievement-frame'),el('achievement-frame'),el('achievement-icon',{hidden:true}),el('achievement-background',{visibleIf:'x'})]}),[]);
  assert.equal(popupParts({elements:[{type:'group',hidden:true,children:[el('achievement-frame')]}]}).length,0);
});

test('popup uses current stage surfaces without changing geometry; clearing and disposal restore native styles', async () => {
  const dom = new JSDOM('<body><div id="wrapper" style="transform:translateX(5px)"><div id="frame-css" style="width:100%;height:100%"><div id="frame" style="background:navy;border:2px solid gray"><span>text</span></div></div><div id="icon-css"><div id="icon"><img /></div></div></div><div id="foreign" style="background:red"></div></body>',{pretendToBeVisual:true});
  const win = dom.window;
  const keys = ['document','HTMLElement','getComputedStyle','MutationObserver','IntersectionObserver','requestAnimationFrame','cancelAnimationFrame','matchMedia'] as const;
  const old = keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
  const animations: any[] = [];
  Object.assign(globalThis,{document:win.document,HTMLElement:win.HTMLElement,getComputedStyle:win.getComputedStyle.bind(win),MutationObserver:win.MutationObserver,
    requestAnimationFrame:win.requestAnimationFrame.bind(win),cancelAnimationFrame:win.cancelAnimationFrame.bind(win),
    IntersectionObserver:class {observe(){}disconnect(){}},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})});
  Object.defineProperty(win.HTMLElement.prototype,'animate',{value(){const a={playState:'paused',cancelled:false,play(){this.playState='running';},pause(){this.playState='paused';},cancel(){this.cancelled=true;},onfinish:null};animations.push(a);return a;}});
  const frame = win.document.getElementById('frame')!, icon = win.document.getElementById('icon')!;
  const view:any = {get:(id:string)=>({setStyle:({customCss}:{customCss:string})=>{
    const node=id==='achievement-frame'?frame.parentElement!:icon.parentElement!;
    const token=/--achievement-popup-part: ([^;]+);/.exec(customCss)?.[1];
    if(token)node.style.setProperty('--achievement-popup-part',token);else node.style.removeProperty('--achievement-popup-part');
  }})};
  let entry:Entry|undefined={id:'a',name:'A',description:'',icon:'icon.png',iconMode:'base',levelId:'',levelName:'',stageId:'first',stageName:'',appearance:{backgroundMode:'gradient',backgroundColor:'blue',backgroundColorEnd:'green',frameMode:'nineSlice',frameImage:'frame.png',frameWidth:9,frameRepeat:'round',iconEffect:'rotate'}};
  const adapter=bindPopupAppearance(view,{elements:[{refId:'achievement-frame',type:'rect'},{refId:'achievement-icon',type:'image'}]},()=>entry,asset=>'https://assets.test/'+asset);
  const flush=()=>new Promise(r=>setTimeout(r,80));
  try {
    await flush();
    assert.equal(frame.style.borderTopWidth,'9px');assert.equal(frame.style.borderImageRepeat,'round');
    assert.ok(frame.style.borderImageSource.includes('frame.png'));assert.ok(frame.style.backgroundImage.includes('linear-gradient'));
    assert.equal(win.document.getElementById('wrapper')!.style.transform,'translateX(5px)');
    assert.equal(frame.parentElement!.style.backgroundImage,'','native CSS wrapper must not receive a second background');
    assert.equal(win.document.getElementById('foreign')!.style.background,'red');assert.equal(animations.length,1);
    entry={...entry!,elementCss:[{target:'background',surface:'popup',css:'background:purple;'}, {target:'icon',surface:'popup',css:'transform:scale(.8);'}, {target:'frame',surface:'card',css:'border-color:red;'}]};
    adapter.refresh();await flush();
    assert.equal(document.querySelectorAll('style[data-achievement-css]').length,2);assert.ok(animations[0].cancelled);
    assert.ok(![...document.querySelectorAll('style')].some(s=>s.textContent?.includes('border-color:red')));
    entry={...entry!,stageId:'second',elementCss:[],appearance:{backgroundMode:'image',backgroundImage:'bg.webp',backgroundFit:'contain',backgroundX:15,backgroundY:85,frameMode:'none',iconEffect:'rotate',effectTrigger:'hover'}};
    adapter.refresh();await flush();
    assert.ok(animations[0].cancelled);assert.equal(animations.length,1,'passthrough popups do not start hover-only effects');
    assert.equal(document.querySelectorAll('style[data-achievement-css]').length,0);
    assert.equal(frame.style.borderTopWidth,'0px');assert.ok(frame.style.backgroundImage.includes('bg.webp'));
    assert.equal(frame.style.backgroundPosition,'15% 85%');assert.equal(frame.style.display,'');
    entry={...entry,stageId:'native',appearance:{}};adapter.refresh();await flush();
    assert.equal(frame.style.background,'navy');assert.equal(frame.style.borderTopWidth,'2px');assert.equal(frame.style.borderImageSource,'');
    adapter.dispose();assert.equal(frame.style.getPropertyValue('--achievement-popup-part'),'');
  } finally {
    adapter.dispose();dom.window.close();for(const [key,value]of old){if(value)Object.defineProperty(globalThis,key,value);else Reflect.deleteProperty(globalThis,key);}
  }
});
