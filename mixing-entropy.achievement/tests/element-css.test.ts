import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseCssRecords, parseElementCss, resolveElementCss, rewriteCss, cssStopsEffect, cssProperties, type CssOwner, type ElementCssRecord } from '../src/element-css.ts';
import { bindElementCss } from '../src/element-css-runtime.ts';
import { cardAppearance } from '../src/card-style.ts';
import { catalog, DEFAULT_LEVELS, entries, presetStages } from '../src/model.ts';

const shared: CssOwner = {ownerKind:'appearance',ownerId:'style',achievementId:''};
const defaults: CssOwner = {ownerKind:'defaultStage',ownerId:'revealed',achievementId:''};
const local: CssOwner = {ownerKind:'stage',ownerId:'revealed',achievementId:'a'};
const row=(owner:CssOwner, css:string, extra:Partial<ElementCssRecord>={}):ElementCssRecord=>({...owner,id:'css',target:'frame',surface:'both',css,replace:false,...extra});

test('CSS owners resolve shared, default and local overrides independently for each surface',()=>{
 const rows=[row(shared,'border:2px solid red;'),row(defaults,'border-radius:5px;'),row(local,'border-color:blue;'),row(local,'border-color:green;',{surface:'popup'})];
 const resolved=resolveElementCss(rows,[shared,defaults,local]);
 assert.deepEqual(resolved.filter(x=>x.surface==='card').map(x=>x.css),rows.slice(0,3).map(x=>x.css));
 assert.deepEqual(resolved.filter(x=>x.surface==='popup').map(x=>x.css),rows.map(x=>x.css));
 rows[2].replace=true; rows[2].css='';
 assert.deepEqual(resolveElementCss(rows,[shared,defaults,local]),[{target:'frame',surface:'popup',css:'border-color:green;'}]);
});

test('stage projection includes only current stage CSS, never another achievement or future stage',()=>{
 const stages=presetStages('').map(({achievementId,...s})=>({...s,appearanceSource:'preset' as const,appearanceId:'style'}));
 const rows=[row(shared,'border:1px solid;'),row(defaults,'border-radius:3px;'),row(local,'color:red;'),row({...local,achievementId:'b'},'color:blue;'),row({...local,ownerId:'future'},'background:green;')];
 const c=catalog(DEFAULT_LEVELS,[{id:'a',name:'A',levelId:'bronze',initialStageId:'revealed'}],[],stages,[{id:'style',name:'Style'}],rows);
 const e=entries(c,[])[0];
 assert.equal(e.elementCss?.filter(x=>x.surface==='card').length,3);
 assert.ok(!JSON.stringify(e).includes('blue'));assert.ok(!JSON.stringify(e).includes('green'));
 assert.deepEqual(entries(c,[{id:'a',stageId:'hidden'}]),[]);
});

test('CSS validation accepts local states and keyframes, rejects global rules, unsafe resources and duplicates',()=>{
 for(const css of ['color:red; &:hover {color:blue}', '&::before {content:"hi"}', '& img {object-fit:contain}', '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} animation:spin 2s linear infinite;', 'background:url("data:image/png;base64,AA==")']) assert.doesNotThrow(()=>parseElementCss(css));
 for(const css of ['body{color:red}', '@import "x";', '&{ & img{color:red}}', 'background:url(https://bad.test/x)', 'background:u\\72l(https://bad.test/x)', '--achievement-card-role:icon;', '@media(all){color:red}']) assert.throws(()=>parseElementCss(css));
 assert.throws(()=>parseCssRecords([row(shared,'color:red'),row(shared,'color:blue')]),/只能/);
 assert.throws(()=>parseCssRecords([row(shared,'', {target:'element:<x>'})]),/无效/);
});

test('keyframe names are scoped per binding; only conflicting builtin effects stop',()=>{
 const css='opacity:.8;animation:pulse 2s infinite; @keyframes pulse{to{opacity:.4}} &:hover{color:red}';
 const a=rewriteCss(css,'[data-a]','first'),b=rewriteCss(css,'[data-b]','second');
 assert.match(a.text,/@keyframes first-pulse/); assert.match(a.text,/animation:first-pulse/);
 assert.ok(!b.text.includes('first-pulse'));assert.match(a.text,/\[data-a\]:hover/);
 assert.equal(cssStopsEffect(cssProperties(['color:red']),'float'),false);
 assert.equal(cssStopsEffect(cssProperties(['opacity:.4']),'float'),false);
 assert.equal(cssStopsEffect(cssProperties(['opacity:.4']),'pulse'),true);
 assert.equal(cssStopsEffect(cssProperties(['transform:rotate(10deg)']),'float'),true);
});

test('element overlays scope text, retain resting styles, separate surfaces and dispose cleanly',()=>{
 const dom=new JSDOM('<head></head><body><div id="a" style="color:green;opacity:.9"><span data-visual-ui-text-paint style="color:blue">A</span></div><div id="b">B</div></body>');
 const a=dom.window.document.getElementById('a')!,b=dom.window.document.getElementById('b')!;
 const styles=[{target:'name',surface:'card' as const,css:'color:red; &:hover {opacity:.4;}'},{target:'name',surface:'popup' as const,css:'color:purple;'}];
 const binding=bindElementCss(new Map([['name',a],['element:custom',a]]),styles,'card',cardAppearance({}));
 const sheet=dom.window.document.querySelector('style')!;
 assert.match(sheet.textContent!,/color:red\s*!important/);assert.ok(!sheet.textContent!.includes('purple'));
 assert.equal(a.style.color,'green');assert.equal(a.style.opacity,'0.9');
 assert.equal(dom.window.getComputedStyle(a.querySelector('span')!).color,'rgb(255, 0, 0)');
 assert.equal(b.hasAttribute('data-achievement-element-css'),false);
 binding.dispose();assert.equal(dom.window.document.querySelectorAll('style').length,0);assert.equal(a.hasAttribute('data-achievement-element-css'),false);
 assert.equal(dom.window.getComputedStyle(a.querySelector('span')!).color,'rgb(0, 0, 255)');dom.window.close();
});

test('CSS keyframes are not frozen by generated important base properties and custom IDs can suppress builtin motion',()=>{
 const dom=new JSDOM('<head></head><body><div></div></body>'),node=dom.window.document.querySelector('div')!;
 const binding=bindElementCss(new Map([['icon',node],['element:icon-id',node]]),[{target:'element:icon-id',surface:'both',css:'opacity:1;transform:scale(1);animation:wave 2s infinite;@keyframes wave{to{opacity:.4;transform:scale(.8)}}'}],'card',cardAppearance({iconEffect:'rotate',frameEffect:'glow'}));
 const css=dom.window.document.querySelector('style')!.textContent!;
 assert.ok(!/opacity:1\s*!important/.test(css));assert.ok(!/opacity:.4\s*!important/.test(css));
 assert.equal(binding.effects.iconEffect,'none');assert.equal(binding.effects.frameEffect,'glow');binding.dispose();dom.window.close();
});
