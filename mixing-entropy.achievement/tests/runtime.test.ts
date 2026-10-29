import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AchievementController } from '../src/runtime.ts';
import { legacyPresentation } from '../src/stage-presentation.ts';
import { presetStages } from '../src/model.ts';

function fixture(descriptionMode: 'visible' | 'hidden' | 'missing' = 'visible') {
  const abort = new AbortController();
  const rows: any[] = [];
  const config: Record<string, any> = { achievements: [{id:'a', name:'A', icon:'',levelId:'bronze',initialStageId:'unknown'},{id:'b',name:'B',icon:'',levelId:'silver',initialStageId:'unknown'}], durationMs:300 };
  const projected: any[] = []; const opened: string[] = []; const closed: string[] = [];
  const views: Array<{fields: Map<string, {props: any; hidden: boolean}>; close: () => void}> = [];
  const callbacks = new Map(); const settingCallbacks = new Map<string, () => void>(); let failures = false; let writing = 0; let maxWriting = 0; let cleanup = 0;
  const table = {
    find:async()=>structuredClone(rows),
    insertOne:async(row:any)=>{writing++;maxWriting=Math.max(maxWriting,writing);await new Promise(r=>setTimeout(r,2));writing--;if(failures)throw Error('disk');const result={...row,id:'row-'+rows.length};rows.push(result);return result;},
    updateOne:async(filter:any, patch:any)=>{if(failures)throw Error('disk');const row=rows.find(r=>r.id===filter.id);if(row)Object.assign(row,patch.$set);return {matchedCount:row?1:0,modifiedCount:row?1:0};},
    watch:()=>()=>{cleanup++;},
  };
  const ctx:any={
    flow:{signal:abort.signal,isRestoring:false},database:{collection:()=>table},
    settings:{get:(key:string)=>config[key],subscribe:(key:string,fn:()=>void)=>{settingCallbacks.set(key,fn);return()=>{settingCallbacks.delete(key);cleanup++;};}},
    visualUI:{
      onOpen:(name:string,fn:any)=>{callbacks.set(name,fn);return()=>callbacks.delete(name);},
      open:async(name:string)=>{
        opened.push(name);let onClose=()=>{};let done=false;
        const fields=new Map<string,{props:any;hidden:boolean}>();
        const v={get:(id:string)=>{
          if(id==='achievement-description' && descriptionMode==='missing')return undefined;
          if(!fields.has(id))fields.set(id,{props:{},hidden:id==='achievement-description' && descriptionMode==='hidden'});
          const field=fields.get(id)!;
          return {setProps:(props:any)=>Object.assign(field.props,props),setHidden:(hidden:boolean)=>{field.hidden=hidden;},setStyle:()=>{},on:()=>()=>{}};
        },close:()=>{if(!done){done=true;closed.push(name);onClose();}},onClose:(fn:any)=>{onClose=fn;return()=>{onClose=()=>{};};}};
        views.push({fields,close:v.close});callbacks.get(name)?.(v);return v;
      },
    },
  };
  let browseMode='pagination';
  const subject=new AchievementController(ctx,{get:()=>browseMode,set:(key,v)=>{if(key==='entries')projected.push(structuredClone(v));else browseMode=v as string;}},abort.signal);
  return {subject,ctx,abort,rows,config,projected,opened,closed,views,settingCallbacks,fail:()=>{failures=true;},stats:()=>({maxWriting,cleanup,callbacks:callbacks.size})};
}


test('new records contain only identity and stage; concurrent repeats serialize',async()=>{
 const f=fixture();try{
  await Promise.all([f.subject.setStage('a','revealed'),f.subject.setStage('a','revealed'),f.subject.setStage('b','hidden')]);
  assert.equal(f.rows.length,2);assert.equal(f.stats().maxWriting,1);
  assert.equal(await f.subject.getStage('a'),'revealed');
  assert.ok(f.rows.every(r=>!('active' in r)));
  assert.ok(f.projected.at(-1).every((r:any)=>!('active' in r)&&!('status' in r)));
 }finally{f.abort.abort();}
});

test('stage guard and invalid target never write or notify',async()=>{
 const f=fixture();try{
  assert.equal(await f.subject.setStage('a','revealed','hidden',true),false);
  await assert.rejects(f.subject.setStage('a','missing'),/找不到展示阶段/);
  await assert.rejects(f.subject.setStage('missing','revealed'),/找不到成就/);
  assert.equal(f.rows.length,0);assert.equal(f.opened.length,0);
 }finally{f.abort.abort();}
});

test('equal initial stage freezes a record without notification; write failures do not publish',async()=>{
 const f=fixture();try{
  await f.subject.setStage('a','unknown','',true);assert.equal(f.rows[0].stageId,'unknown');assert.equal(f.opened.length,0);
  const before=structuredClone(f.projected);f.fail();
  await assert.rejects(f.subject.setStage('a','revealed','',true),/disk/);
  assert.deepEqual(f.projected,before);assert.equal(f.opened.length,0);
 }finally{f.abort.abort();}
});

test('persisted stage survives controller recreation and ignores extra fields',async()=>{
 const f=fixture();try{
  f.rows.push({id:'saved',achievementId:'a',stageId:'revealed'});
  assert.equal(await f.subject.getStage('a'),'revealed');
  await f.subject.setStage('a','hidden');
  assert.ok(!('active' in f.rows[0]));assert.equal(await f.subject.getStage('a'),'hidden');
  assert.ok(!f.projected.at(-1).some((r:any)=>r.id==='a'));
  const next=new AchievementController(f.ctx,{get:()=>'',set:()=>{}},f.abort.signal);
  assert.equal(await next.getStage('a'),'hidden');
 }finally{f.abort.abort();}
});

test('restore replay rebuilds projection without changing persisted stage',async()=>{
 const f=fixture();try{
  await f.subject.setStage('a','revealed');const before=structuredClone(f.rows);f.ctx.flow.isRestoring=true;
  assert.equal(await f.subject.setStage('a','hidden','',true),false);
  assert.deepEqual(f.rows,before);assert.equal(f.projected.at(-1)[0].stageId,'revealed');assert.equal(f.opened.length,0);
 }finally{f.abort.abort();}
});

test('custom stage level updates card and popup; names never infer activation',async()=>{
 const f=fixture();try{
  f.config.displayStages=[{...presetStages('a')[2],id:'master',name:'自定义阶段',levelMode:'custom',levelId:'gold'}];
  await f.subject.setStage('a','master','unknown',true);await new Promise(setImmediate);
  assert.equal(await f.subject.readInfo('a','levelName'),'金');assert.equal(await f.subject.readInfo('a','stageName'),'自定义阶段');
  assert.match(f.projected.at(-1)[0].frame,/frame-gold/);assert.equal(f.views[0].fields.get('achievement-level')!.props.text,'金');
  assert.equal(f.views[0].fields.get('achievement-label')!.props.text,'成就展示已更新');
  await assert.rejects(f.subject.readInfo('a','active' as any),/读取项目无效/);
  await f.subject.setStage('a','master','',true);f.views[0].close();await new Promise(setImmediate);assert.equal(f.views.length,1);
 }finally{f.abort.abort();}
});

for(const mode of ['visible','hidden','missing'] as const){
 test(`sequential stage popups preserve ${mode} author controls and share card descriptions`,async()=>{
  const f=fixture(mode);try{
   f.config.achievements[0].description='故事从此时开始';
   await f.subject.setStage('a','revealed','',true);await f.subject.setStage('b','revealed','',true);await new Promise(setImmediate);
   assert.equal(f.views.length,1);
   const first=f.views[0].fields.get('achievement-description');
   if(mode==='missing')assert.equal(first,undefined);else{assert.equal(first!.props.text,'故事从此时开始');assert.equal(first!.hidden,mode==='hidden');}
   f.views[0].close();await new Promise(setImmediate);assert.equal(f.views.length,2);
   const second=f.views[1].fields.get('achievement-description');if(second)assert.equal(second.props.text,'');
  }finally{f.abort.abort();}
 });
}

test('stage changes close the old popup and discard stale queued content',async()=>{
 const f=fixture();try{
  f.config.durationMs=60000;
  await f.subject.setStage('a','revealed','',true);await f.subject.setStage('b','revealed','',true);await new Promise(setImmediate);
  await f.subject.setStage('b','hidden');await f.subject.setStage('a','unknown');
  assert.equal(f.closed.length,1);
  await f.subject.setStage('a','hidden');await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(f.closed.length,1);assert.equal(f.views.length,1);assert.deepEqual(f.projected.at(-1),[]);
 }finally{f.abort.abort();}
});

test('global notifications and silent changes suppress popups; ending run releases handles',async()=>{
 const f=fixture();
 await f.subject.openPage();f.config.notifications=false;await f.subject.setStage('a','revealed','',true);
 f.config.notifications=true;await f.subject.setStage('a','unknown');assert.equal(f.opened.length,1);
 await f.subject.setStage('a','revealed','',true);await new Promise(setImmediate);f.abort.abort();await new Promise(setImmediate);
 assert.equal(f.closed.length,2);assert.equal(f.stats().cleanup,11);assert.equal(f.stats().callbacks,0);assert.equal(f.settingCallbacks.size,0);
 await assert.rejects(f.subject.setStage('b','revealed'),/已结束/);
});

test('shared edits refresh cards and the current popup without rewriting player stages',async()=>{
 const f=fixture();try{
  f.config.durationMs=60000;
  await f.subject.setStage('a','revealed','',true);await new Promise(setImmediate);
  const before=structuredClone(f.rows);
  f.config.defaultStages=presetStages('').map(s=>({...s,nameMode:'custom',displayName:'共用标题'}));
  f.settingCallbacks.get('defaultStages')!();await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(f.projected.at(-1)[0].name,'共用标题');
  assert.equal(f.views[0].fields.get('achievement-name')!.props.text,'共用标题');
  assert.deepEqual(f.rows,before);
  f.config.displayStages=[{...presetStages('a')[2],disabled:true}];
  f.settingCallbacks.get('displayStages')!();await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(f.closed.length,1);assert.ok(!f.projected.at(-1).some((a:any)=>a.id==='a'));
  assert.deepEqual(f.rows,before);
 }finally{f.abort.abort();}
});

test('duplicate or malformed saved records fail before projection; definition edits preserve stage',async()=>{
 const f=fixture();try{
  await f.subject.setStage('a','revealed');const before=structuredClone(f.rows);
  f.config.achievements[0].name='新名称';await f.subject.refresh();assert.equal(f.projected.at(-1)[0].name,'新名称');assert.deepEqual(f.rows,before);
  f.rows.push({...f.rows[0],id:'duplicate'});await assert.rejects(f.subject.refresh(),/重复/);
 }finally{f.abort.abort();}
});

test('each page open reads fresh official navigation and ignores conflicting legacy settings', async t => {
  const f = fixture();
  const doc = JSON.parse(readFileSync(new URL('../ui/achievements.json', import.meta.url), 'utf8'));
  const list = doc.elements.find((e: any) => e.refId === 'achievement-list');
  const requests: Array<{ path: string; cache: unknown }> = [];
  f.ctx.extensionResource = { url: (path: string) => 'https://extension.invalid/' + path };
  t.mock.method(globalThis, 'fetch', async (path: string, options: RequestInit) => {
    requests.push({ path, cache: options.cache });
    return new Response(JSON.stringify(doc));
  });
  f.config.browsePolicy = 'pagination'; f.config.browseDefault = 'pagination';
  try {
    for (const mode of ['scroll', 'pagination']) {
      list.props.navigationMode = mode;
      await f.subject.openPage();
      const view = f.views.at(-1)!;
      assert.equal(view.fields.get('achievement-mode-' + mode)!.props.text, (mode === 'scroll' ? '纵向滚动' : '翻页') + ' ✓');
      assert.equal(view.fields.get('achievement-list')!.props.navigationMode, undefined);
      assert.equal(view.fields.get('achievement-mode-pagination')!.hidden, true);
      view.close();
    }
    assert.equal(requests.length, 2);
    assert.ok(requests.every(r => r.path.endsWith('/ui/achievements.json') && r.cache === 'no-store'));
  } finally { f.abort.abort(); }
});

test('resource failures and pages outside this extension retain native navigation', async t => {
  const f = fixture(); let fetches = 0;
  f.ctx.extensionResource = { url: (path: string) => 'https://extension.invalid/' + path };
  t.mock.method(globalThis, 'fetch', async () => { fetches++; throw Error('unavailable'); });
  t.mock.method(console, 'warn', () => {});
  f.config.allowPlayerSwitch = true; f.config.allowHorizontal = true;
  try {
    for (const page of [undefined, 'my-page', '@other/page']) {
      f.config.page = page;
      await f.subject.openPage();
      const view = f.views.at(-1)!;
      assert.equal(view.fields.get('achievement-list')!.props.navigationMode, undefined);
      assert.equal(view.fields.get('achievement-mode-pagination')!.hidden, true);
      assert.equal(view.fields.get('achievement-mode-horizontal')!.hidden, true);
      view.close();
    }
    assert.equal(fetches, 1);
  } finally { f.abort.abort(); }
});


test('stage popup can use separate content/template/duration while the card remains unchanged', async () => {
 const f=fixture();try{
  const p={...legacyPresentation(presetStages('')[2], 'popup'),achievementId:'a',nameMode:'custom',displayName:'POPUP',descriptionMode:'custom',description:'ONLY POPUP',ui:'my-popup',durationMs:300};
  f.config.durationMs=60000;f.config.stagePresentations=[p];
  await f.subject.setStage('a','revealed','',true);await new Promise(setImmediate);
  assert.equal(f.opened[0],'my-popup');assert.equal(f.views[0].fields.get('achievement-name')!.props.text,'POPUP');
  assert.equal(f.views[0].fields.get('achievement-description')!.props.text,'ONLY POPUP');
  assert.equal(f.projected.at(-1)[0].name,'A');
  await new Promise(r=>setTimeout(r,350));assert.equal(f.closed.length,1);
 }finally{f.abort.abort();}
});
test('disabled stage popup, repeat, restore, and page opening never trigger a notification', async () => {
 const f=fixture();try{
  f.config.stagePresentations=[{...legacyPresentation(presetStages('')[2], 'popup'),achievementId:'a',enabled:false}];
  await f.subject.setStage('a','revealed','',true);await new Promise(setImmediate);assert.equal(f.opened.length,0);
  f.config.stagePresentations[0].enabled=true;
  await f.subject.setStage('a','revealed','',true);await f.subject.openPage();await new Promise(setImmediate);
  assert.equal(f.views.length,1);assert.match(f.opened[0],/achievements$/);
  f.ctx.flow.isRestoring=true;await f.subject.setStage('a','unknown','',true);assert.equal(f.views.length,1);
 }finally{f.abort.abort();}
});
test('changing the live popup UI or disabling global notifications closes it without replay', async () => {
 const f=fixture();try{
  f.config.durationMs=60000;
  await f.subject.setStage('a','revealed','',true);await new Promise(setImmediate);
  f.config.stagePresentations=[{...legacyPresentation(presetStages('')[2],'popup'),achievementId:'a',ui:'another-popup'}];
  f.settingCallbacks.get('stagePresentations')!();await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(f.closed.length,1);assert.equal(f.views.length,1);
  await f.subject.setStage('b','revealed','',true);await new Promise(setImmediate);
  f.config.notifications=false;f.settingCallbacks.get('notifications')!();await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(f.closed.length,2);assert.equal(f.views.length,2);
 }finally{f.abort.abort();}
});
