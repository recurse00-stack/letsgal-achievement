import test from 'node:test';
import assert from 'node:assert/strict';
import { AchievementController } from '../src/runtime.ts';
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

test('current popup follows stage changes; hidden removes it and suppresses queued content',async()=>{
 const f=fixture();try{
  f.config.durationMs=60000;
  await f.subject.setStage('a','revealed','',true);await f.subject.setStage('b','revealed','',true);await new Promise(setImmediate);
  await f.subject.setStage('a','unknown');assert.equal(f.views[0].fields.get('achievement-name')!.props.text,'？？？');
  await f.subject.setStage('b','hidden');await f.subject.setStage('a','hidden');await new Promise(setImmediate);await new Promise(setImmediate);
  assert.equal(f.closed.length,1);assert.equal(f.views.length,1);assert.deepEqual(f.projected.at(-1),[]);
 }finally{f.abort.abort();}
});

test('global notifications and silent changes suppress popups; ending run releases handles',async()=>{
 const f=fixture();
 await f.subject.openPage();f.config.notifications=false;await f.subject.setStage('a','revealed','',true);
 f.config.notifications=true;await f.subject.setStage('a','unknown');assert.equal(f.opened.length,1);
 await f.subject.setStage('a','revealed','',true);await new Promise(setImmediate);f.abort.abort();await new Promise(setImmediate);
 assert.equal(f.closed.length,2);assert.equal(f.stats().cleanup,5);assert.equal(f.stats().callbacks,0);assert.equal(f.settingCallbacks.size,0);
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
