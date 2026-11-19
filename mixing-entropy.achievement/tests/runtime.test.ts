import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { AchievementController, controller } from '../src/runtime.ts';
import { legacyPresentation } from '../src/stage-presentation.ts';
import { presetStages } from '../src/model.ts';

function fixture(descriptionMode: 'visible' | 'hidden' | 'missing' = 'visible') {
  const abort = new AbortController();
  const config: Record<string, any> = { achievements: [{id:'a', name:'A', icon:'',levelId:'bronze',initialStageId:'unknown'},{id:'b',name:'B',icon:'',levelId:'silver',initialStageId:'unknown'}], durationMs:300, notificationWindowMs:50 };
  const projected: any[] = []; const opened: string[] = []; const closed: string[] = [];
  const views: Array<{fields: Map<string, {props: any; hidden: boolean;click?:()=>void}>; close: () => void}> = [];
  const callbacks = new Map(); const settingCallbacks = new Map<string, () => void>();
  const listeners = new Set<() => void>();
  let failures = false, writes = 0, cleanup = 0;
  const ctx:any={
    flow:{signal:abort.signal,isRestoring:false},
    subscribe:(event:string, fn:()=>void)=>{assert.equal(event,'variable:changed');listeners.add(fn);return()=>{listeners.delete(fn);cleanup++;};},
    settings:{get:(key:string)=>config[key],subscribe:(key:string,fn:()=>void)=>{settingCallbacks.set(key,fn);return()=>{settingCallbacks.delete(key);cleanup++;};}},
    visualUI:{
      onOpen:(name:string,fn:any)=>{callbacks.set(name,fn);return()=>callbacks.delete(name);},
      open:async(name:string)=>{
        opened.push(name);let onClose=()=>{};let done=false;
        const fields=new Map<string,{props:any;hidden:boolean;click?:()=>void}>();
        const v={get:(id:string)=>{
          if(id==='achievement-description' && descriptionMode==='missing')return undefined;
          if(!fields.has(id))fields.set(id,{props:{},hidden:id==='achievement-description' && descriptionMode==='hidden'});
          const field=fields.get(id)!;
          return {setProps:(props:any)=>Object.assign(field.props,props),setHidden:(hidden:boolean)=>{field.hidden=hidden;},setStyle:()=>{},on:(_event:string,callback:()=>void)=>{field.click=callback;return()=>{delete field.click;}}};
        },close:()=>{if(!done){done=true;closed.push(name);if(config.closeDelayMs)setTimeout(()=>onClose(),config.closeDelayMs);else onClose();}},onClose:(fn:any)=>{onClose=fn;return()=>{onClose=()=>{};};}};
        views.push({fields,close:v.close});callbacks.get(name)?.(v);return v;
      },
    },
  };
  const preferences: Record<string, any> = { browseMode: 'pagination', notificationPreference: '', stageProgress: [{schemaVersion:1,records:[]}] };
  const sink = {
    get:(key:string)=>preferences[key],
    set:(key:string,v:unknown)=>{
      if (key==='stageProgress') { if(failures) throw Error('disk'); writes++; }
      if (key==='entries') projected.push(structuredClone(v)); else preferences[key]=structuredClone(v);
      listeners.forEach(fn=>fn());
    },
  };
  const subject=new AchievementController(ctx,sink,abort.signal);
  return {subject,ctx,abort,get rows(){return preferences.stageProgress[0].records;},sink,config,projected,opened,closed,views,settingCallbacks,preferences,fail:()=>{failures=true;},stats:()=>({writes,cleanup,callbacks:callbacks.size})};
}

// Load the actual SDK method so tests cover the host's three distinct entry points.
async function loadStageMethod() {
  const output = await build({entryPoints:[fileURLToPath(new URL('../src/index.tsx',import.meta.url))],
    bundle:true, platform:'browser', format:'esm', target:'es2022', write:false, logLevel:'silent'});
  const extension = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
  return extension.default.changeStage;
}
const stageMethod = loadStageMethod();
function steamFixture() {
  const f = fixture();
  const ids = ['unknown','hidden','revealed','final'];
  f.config.displayStages = [{...presetStages('a')[2],id:'final'}];
  f.config.stageTiers = ids.map((stageId,i) => ({achievementId:'a',stageId,tier:[1,2,2,3][i]}));
  f.config.steamAchievements = ids.map(stageId => ({achievementId:'a',stageId,apiName:'ACH_'+stageId}));
  const calls: string[] = [];
  const submittedStages: string[] = [];
  f.ctx.steam = { isAvailable:() => true, achievements:{unlock:async (apiName:string) => {
    submittedStages.push(f.rows.find((row:any) => row.achievementId === 'a')?.stageId);
    calls.push(apiName);
    return {ok:true,data:'unlocked'};
  }}};
  const play = async (stageId:string, entry:'run'|'skip'|'runImmediately'='run', expectedStageId='', achievementId='a') =>
    (await stageMethod)[entry].call({save:f.sink},f.ctx,{achievementId,stageId,expectedStageId,notify:false});
  return {...f, calls, submittedStages, play};
}
test('Steam follows only the first winner of a tier, including simultaneous story operations in either order',async () => {
  for (const [first,other] of [['hidden','revealed'],['revealed','hidden']]) {
    const f=steamFixture();
    try {
      await f.play('unknown');
      await Promise.all([f.play(first,'skip'), f.play(other)]);
      await f.play(first); await f.play('unknown');
      assert.deepEqual(f.calls,['ACH_unknown','ACH_'+first]);
      await f.play('final','run',other);
      assert.deepEqual(f.calls,['ACH_unknown','ACH_'+first]);
      await f.play('final','run',first);
      assert.deepEqual(f.calls,['ACH_unknown','ACH_'+first,'ACH_final']);
    } finally {f.abort.abort();}
  }
});
test('jump directly to the top and repeat earlier plot blocks without backfilling Steam achievements',async () => {
  const f=steamFixture();
  try {
    await f.play('final','skip');
    for (const stage of ['unknown','hidden','revealed','final']) await f.play(stage);
    assert.deepEqual(f.calls,['ACH_final']);
    assert.deepEqual(f.submittedStages,['final']);
    assert.deepEqual(f.preferences.stageProgress[0].records,[{achievementId:'a',stageId:'final'}]);
  } finally {f.abort.abort();}
});
test('restoring, immediate replay, reopening an older save and a cold start do not resubmit to Steam',async () => {
  const f=steamFixture(), restart=steamFixture();
  try {
    await f.play('hidden');
    f.ctx.flow.isRestoring=true;
    for (const entry of ['run','skip','runImmediately'] as const) await f.play('final',entry);
    assert.equal(f.preferences.stageProgress[0].records[0].stageId,'hidden');
    f.ctx.flow.isRestoring=false;
    await f.play('revealed'); await f.play('hidden'); await f.subject.refresh();
    assert.deepEqual(f.calls,['ACH_hidden']);
    restart.preferences.stageProgress=structuredClone(f.preferences.stageProgress);
    restart.ctx.flow.isRestoring=true;
    await restart.play('unknown','runImmediately');
    restart.ctx.flow.isRestoring=false;
    await restart.subject.openPage();
    await restart.play('revealed'); await restart.play('hidden');
    assert.deepEqual(restart.calls,[]);
    await restart.play('final');
    assert.deepEqual(restart.calls,['ACH_final']);
    // The host may also invoke immediate mode outside a restore.
    await f.play('final','runImmediately');
    assert.deepEqual(f.calls,['ACH_hidden']);
  } finally {f.abort.abort();restart.abort.abort();}
});
test('unbound or unavailable stages and a rejected local save produce zero Steam submissions',async () => {
  const f=steamFixture();
  try {
    await f.play('revealed','run','','b');
    f.ctx.steam.isAvailable=()=>false;
    await f.play('hidden');
    f.ctx.steam.isAvailable=()=>true;
    f.fail();
    await assert.rejects(f.play('final'),/disk/);
    assert.deepEqual(f.calls,[]);
    assert.equal(await f.subject.getStage('a'),'hidden');
  } finally {f.abort.abort();}
});
test('a shared Steam API Name is allowed on alternative stages and an initial stage needs explicit acquisition',async () => {
  const f=steamFixture();
  try {
    f.config.steamAchievements.forEach((row:any) => { row.apiName='  Branch_End  '; });
    await f.subject.refresh(); await f.subject.getStage('a');
    assert.deepEqual(f.calls,[]);
    await f.play('hidden'); await f.play('revealed');
    assert.deepEqual(f.calls,['Branch_End']);
    f.config.steamAchievements.push({achievementId:'b',stageId:'unknown',apiName:'START_B'});
    await f.play('unknown','run','','b'); await f.play('unknown','run','','b');
    assert.deepEqual(f.calls,['Branch_End','START_B']);
  } finally {f.abort.abort();}
});
test('local story progress continues while Steam is pending or the optional binding is malformed',async () => {
  const f=steamFixture();
  let finish!: () => void;
  try {
    f.ctx.steam.achievements.unlock=(apiName:string) => {
      f.calls.push(apiName);
      return new Promise(resolve => { finish=()=>resolve({ok:true,data:'queued'}); });
    };
    await f.play('hidden');
    f.config.steamAchievements=[null,{achievementId:'a',stageId:'final',apiName:42}];
    await f.play('final');
    assert.equal(await f.subject.getStage('a'),'final');
    assert.deepEqual(f.calls,['ACH_hidden']);
  } finally { finish?.(); f.abort.abort(); }
});
test('Steam queued, already unlocked and error outcomes leave local progress usable without a replay retry',async t => {
  const warning=t.mock.method(console,'warn',()=>{});
  for (const outcome of ['queued','already-unlocked','failed','throw']) {
    const f=steamFixture();
    try {
      f.ctx.steam.achievements.unlock=async (id:string) => {
        f.calls.push(id);
        if (outcome==='throw') throw Error('bridge');
        return outcome==='failed' ? {ok:false,reason:'failed',message:'test'} : {ok:true,data:outcome};
      };
      await f.play('final'); await f.play('final'); await f.subject.refresh();
      assert.deepEqual(f.calls,['ACH_final']);
      assert.equal(await f.subject.getStage('a'),'final');
    } finally {f.abort.abort();}
  }
  assert.equal(warning.mock.callCount(),2);
});

test('group filter and shared visibility use the player projection while advances survive replay',async () => {
  const frames = new Map<number, FrameRequestCallback>();
  let sequence = 0;
  const originalRequest = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const originalCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  Object.defineProperty(globalThis, 'requestAnimationFrame', {configurable:true, value:(callback: FrameRequestCallback) => { frames.set(++sequence, callback); return sequence; }});
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {configurable:true, value:(id: number) => frames.delete(id)});
  function drawFrame() {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(0));
  }
  const f = fixture();
  try {
    f.config.allowGroupFilter = true;
    f.config.groupCatalog = [{id:'secret',kind:'group',name:'秘密',visible:false},{id:'member',kind:'member',group:'secret',achievement:'b'}];
    f.config.stageTiers = ['unknown','hidden','revealed'].map((stageId,i) => ({achievementId:'a',stageId,tier:[1,1,2][i]}));
    await f.subject.openPage();
    const control = f.views[0].fields.get('achievement-group-filter')!;
    assert.equal(control.hidden,true);
    await f.subject.setGroupVisible('secret',true);
    assert.equal(control.hidden,false);
    control.click!(); await f.subject.refresh();
    assert.deepEqual(f.projected.at(-1).map((e:any)=>e.id),['b']);
    const list = f.views[0].fields.get('achievement-list')!;
    assert.equal(list.hidden,true);
    drawFrame(); drawFrame();
    assert.equal(list.hidden,false);
    assert.equal(f.preferences.browseMode,'pagination');
    await f.subject.setStage('b','hidden');
    assert.deepEqual(f.projected.at(-1),[]);
    assert.match(control.props.text,/秘密/);
    await f.subject.setGroupVisible('secret',false);
    assert.deepEqual(f.projected.at(-1).map((e:any)=>e.id),['a']);
    assert.deepEqual(f.preferences.groupVisibility,[{id:'secret',visible:false,unlocked:true}]);
    assert.equal(await f.subject.setStage('a','unknown'),true);
    assert.equal(await f.subject.setStage('a','hidden'),false);
    assert.equal(await f.subject.setStage('a','revealed'),true);
    const saved = structuredClone(f.preferences.stageProgress), writes = f.stats().writes;
    f.ctx.flow.isRestoring = true;
    assert.equal(await f.subject.setStage('a','unknown'),false);
    f.ctx.flow.isRestoring = false;
    assert.equal(await f.subject.setStage('a','unknown','',true),false);
    const restarted = fixture();
    try {
      restarted.config.stageTiers = f.config.stageTiers;
      restarted.preferences.stageProgress = structuredClone(saved);
      assert.equal(await restarted.subject.setStage('a','hidden','',true),false);
      assert.equal(await restarted.subject.getStage('a'),'revealed');
      assert.equal(restarted.stats().writes,0);
    } finally {restarted.abort.abort();}
    assert.deepEqual(f.preferences.stageProgress,saved);
    assert.equal(f.stats().writes,writes);
  } finally {
    f.abort.abort();
    if (originalRequest) Object.defineProperty(globalThis, 'requestAnimationFrame', originalRequest);
    else Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
    if (originalCancel) Object.defineProperty(globalThis, 'cancelAnimationFrame', originalCancel);
    else Reflect.deleteProperty(globalThis, 'cancelAnimationFrame');
  }
});

test('a restored method and the next gameplay method can share a signal but have different write proxies', async () => {
  const f = fixture();
  try {
    f.ctx.flow.isRestoring = true;
    const replaySink = {...f.sink, set() {}};
    const replay = controller(f.ctx, replaySink);
    await replay.refresh();
    assert.equal(f.projected.length, 0);
    f.ctx.flow.isRestoring = false;
    const live = controller(f.ctx, f.sink);
    assert.equal(live, replay);
    await live.setStage('a', 'revealed');
    assert.equal(f.projected.at(-1)[0].stageId, 'revealed');
    assert.deepEqual(f.rows, [{achievementId:'a',stageId:'revealed'}]);
  } finally { f.abort.abort(); }
});

test('fresh progress initializes and switches stages without a database API', async () => {
  const f = fixture();
  try {
    f.preferences.stageProgress = [];
    assert.equal(await f.subject.getStage('a'), 'unknown');
    assert.deepEqual(f.rows, []);
    await f.subject.setStage('a', 'revealed');
    assert.equal(await f.subject.getStage('a'), 'revealed');
    assert.deepEqual(f.rows, [{ achievementId: 'a', stageId: 'revealed' }]);
  } finally { f.abort.abort(); }
});

test('batch sorting and duration shortening apply before the first visible popup', async t => {
  const f = fixture(); const durations: number[] = [];
  const timeout = globalThis.setTimeout;
  t.mock.method(globalThis, 'setTimeout', ((fn: any, ms: number, ...args: any[]) => { durations.push(ms); return timeout(fn, ms, ...args); }) as typeof setTimeout);
  try {
    f.config.notificationSort = [{ field: 'level', value: 'silver' }, { field: 'level', value: 'bronze' }];
    f.config.notificationDurationPercent = 67;
    await f.subject.setStage('a', 'revealed', '', true);
    await f.subject.setStage('b', 'revealed', '', true);
    assert.equal(f.views.length, 0, 'even the first notification must wait until collection finishes');
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.equal(f.views.length, 1); assert.equal(f.views[0].fields.get('achievement-name')?.props.text, 'B');
    assert.ok(durations.includes(201), 'the first popup must use 67 percent of its 300 ms duration');
    f.views[0].close(); await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(f.views[1].fields.get('achievement-name')?.props.text, 'A');
    assert.equal(durations.filter(ms => ms === 201).length, 2);
  } finally { f.abort.abort(); }
});
test('merged batch counts distinct achievements, keeps only the final phase and clears session projection', async () => {
  const f = fixture();
  try {
    f.config.notificationMode = 'merged';
    f.config.displayStages = [{ ...presetStages('a')[2], id: 'master', name: '大师', levelMode: 'custom', levelId: 'gold' }];
    f.config.notificationSort = [{ field: 'level', value: 'gold' }];
    await f.subject.setStage('a', 'revealed', '', true);
    await f.subject.setStage('b', 'revealed', '', true);
    await f.subject.setStage('a', 'master', '', true);
    assert.equal(f.views.length, 0);
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.equal(f.views.length, 1); assert.match(f.opened[0], /achievement-summary$/);
    assert.equal(f.preferences.notificationCount, 2);
    assert.deepEqual(f.preferences.notificationEntries.map((x: any) => [x.id, x.stageId]), [['a', 'master'], ['b', 'revealed']]);
    f.views[0].close(); await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(f.preferences.notificationCount, 0); assert.deepEqual(f.preferences.notificationEntries, []);
  } finally { f.abort.abort(); }
});
test('merged mode falls back to ordinary single popup if all but one notification become invalid', async () => {
  const f = fixture();
  try {
    f.config.notificationMode = 'merged';
    await f.subject.setStage('a', 'revealed', '', true);
    await f.subject.setStage('b', 'revealed', '', true);
    await f.subject.setStage('b', 'hidden');
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.match(f.opened[0], /achievement-popup$/);
    assert.equal(f.views[0].fields.get('achievement-name')?.props.text, 'A');
  } finally { f.abort.abort(); }
});
test('returning silently to an earlier stage never revives an outdated notification', async () => {
  const f = fixture();
  try {
    await f.subject.setStage('a', 'revealed', '', true);
    await f.subject.setStage('a', 'unknown');
    await f.subject.setStage('a', 'revealed');
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.equal(f.views.length, 0);
  } finally { f.abort.abort(); }
});
test('player mode changes affect the next batch, respect permission and do not replay during restore', async () => {
  const f = fixture();
  try {
    assert.equal(f.subject.notificationMode('merged'), 'sequential');
    assert.equal(f.preferences.notificationPreference, '');
    f.config.allowNotificationModeSwitch = true;
    assert.equal(f.subject.notificationMode('merged'), 'merged');
    await f.subject.setStage('a', 'revealed', '', true);
    f.subject.notificationMode('sequential');
    await f.subject.setStage('b', 'revealed', '', true);
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.match(f.opened[0], /achievement-summary$/, 'a batch keeps the mode captured at collection start');
    assert.equal(f.preferences.notificationMode, 'sequential');
    assert.equal(f.preferences.notificationModeLabel, '连续浮现');
    f.ctx.flow.isRestoring = true;
    assert.equal(f.subject.notificationMode('toggle'), 'sequential');
    f.ctx.flow.isRestoring = false; f.config.notificationMode = 'merged';
    assert.equal(f.subject.notificationMode('default'), 'merged');
    assert.equal(f.preferences.notificationPreference, '');
    assert.throws(() => f.subject.notificationMode('invalid'), /无效/);
  } finally { f.abort.abort(); }
});
test('active summary removes newly hidden content and closes when no valid items remain', async () => {
  const f = fixture();
  try {
    f.config.notificationMode = 'merged';
    await f.subject.setStage('a', 'revealed', '', true); await f.subject.setStage('b', 'revealed', '', true);
    await new Promise(resolve => setTimeout(resolve, 65));
    await f.subject.setStage('a', 'hidden');
    assert.equal(f.preferences.notificationCount, 1);
    assert.deepEqual(f.preferences.notificationEntries.map((x: any) => x.id), ['b']);
    await f.subject.setStage('b', 'hidden'); await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(f.closed.length, 1); assert.equal(f.preferences.notificationCount, 0);
  } finally { f.abort.abort(); }
});


test('invalidated popup waits for the host close callback before the next popup opens', async () => {
  const f = fixture();
  try {
    f.config.closeDelayMs = 100;
    await f.subject.setStage('a', 'revealed', '', true); await f.subject.setStage('b', 'revealed', '', true);
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.equal(f.views.length, 1);
    await f.subject.setStage('a', 'hidden');
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(f.views.length, 1, 'closing animation must not overlap the next notification');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(f.views.length, 2);
  } finally { f.abort.abort(); }
});

test('new records contain only identity and stage; concurrent repeats serialize',async()=>{
 const f=fixture();try{
  await Promise.all([f.subject.setStage('a','revealed'),f.subject.setStage('a','revealed'),f.subject.setStage('b','hidden')]);
  assert.equal(f.rows.length,2);assert.equal(f.stats().writes,2);
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
  const next=new AchievementController(f.ctx,f.sink,f.abort.signal);
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

test('external shared-stage change refreshes once and session writes never feed back after abort', async () => {
  const f = fixture();
  try {
    f.sink.set('stageProgress', [{schemaVersion: 1, records: [{achievementId:'a',stageId:'revealed'}]}]);
    await f.subject.getStage('a');
    assert.equal(f.projected.length, 1);
    assert.equal(f.projected[0].find((entry:any) => entry.id==='a').stageId, 'revealed');
    f.sink.set('notificationCount', 1);
    await f.subject.getStage('a');
    assert.equal(f.projected.length, 1);
    f.abort.abort();
    f.sink.set('stageProgress', [{schemaVersion:1, records:[]}]);
    await Promise.resolve();
    assert.equal(f.projected.length, 1);
  } finally { f.abort.abort(); }
});

test('custom stage level updates card and popup; names never infer activation',async()=>{
 const f=fixture();try{
  f.config.displayStages=[{...presetStages('a')[2],id:'master',name:'自定义阶段',levelMode:'custom',levelId:'gold'}];
  await f.subject.setStage('a','master','unknown',true);await new Promise(resolve => setTimeout(resolve, 65));
  assert.equal(await f.subject.readInfo('a','levelName'),'金');assert.equal(await f.subject.readInfo('a','stageName'),'自定义阶段');
  assert.match(f.projected.at(-1)[0].frame,/frame-gold/);assert.equal(f.views[0].fields.get('achievement-level')!.props.text,'金');
  assert.equal(f.views[0].fields.get('achievement-label')!.props.text,'成就展示已更新');
  await assert.rejects(f.subject.readInfo('a','active' as any),/读取项目无效/);
  await f.subject.setStage('a','master','',true);f.views[0].close();await new Promise(resolve => setTimeout(resolve, 65));assert.equal(f.views.length,1);
 }finally{f.abort.abort();}
});

for(const mode of ['visible','hidden','missing'] as const){
 test(`sequential stage popups preserve ${mode} author controls and share card descriptions`,async()=>{
  const f=fixture(mode);try{
   f.config.achievements[0].description='故事从此时开始';
   await f.subject.setStage('a','revealed','',true);await f.subject.setStage('b','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));
   assert.equal(f.views.length,1);
   const first=f.views[0].fields.get('achievement-description');
   if(mode==='missing')assert.equal(first,undefined);else{assert.equal(first!.props.text,'故事从此时开始');assert.equal(first!.hidden,mode==='hidden');}
   f.views[0].close();await new Promise(resolve => setTimeout(resolve, 65));assert.equal(f.views.length,2);
   const second=f.views[1].fields.get('achievement-description');if(second)assert.equal(second.props.text,'');
  }finally{f.abort.abort();}
 });
}

test('stage changes close the old popup and discard stale queued content',async()=>{
 const f=fixture();try{
  f.config.durationMs=60000;
  await f.subject.setStage('a','revealed','',true);await f.subject.setStage('b','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));
  await f.subject.setStage('b','hidden');await f.subject.setStage('a','unknown');
  assert.equal(f.closed.length,1);
  await f.subject.setStage('a','hidden');await new Promise(resolve => setTimeout(resolve, 65));await new Promise(resolve => setTimeout(resolve, 65));
  assert.equal(f.closed.length,1);assert.equal(f.views.length,1);assert.deepEqual(f.projected.at(-1),[]);
 }finally{f.abort.abort();}
});

test('global notifications and silent changes suppress popups; ending run releases handles',async()=>{
 const f=fixture();
 await f.subject.openPage();f.config.notifications=false;await f.subject.setStage('a','revealed','',true);
 f.config.notifications=true;await f.subject.setStage('a','unknown');assert.equal(f.opened.length,1);
 await f.subject.setStage('a','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));f.abort.abort();await new Promise(resolve => setTimeout(resolve, 65));
 assert.equal(f.closed.length,2);assert.equal(f.stats().cleanup,16);assert.equal(f.stats().callbacks,0);assert.equal(f.settingCallbacks.size,0);
 await assert.rejects(f.subject.setStage('b','revealed'),/已结束/);
});

test('shared edits refresh cards and the current popup without rewriting player stages',async()=>{
 const f=fixture();try{
  f.config.durationMs=60000;
  await f.subject.setStage('a','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));
  const before=structuredClone(f.rows);
  f.config.defaultStages=presetStages('').map(s=>({...s,nameMode:'custom',displayName:'共用标题'}));
  f.settingCallbacks.get('defaultStages')!();await new Promise(resolve => setTimeout(resolve, 65));await new Promise(resolve => setTimeout(resolve, 65));
  assert.equal(f.projected.at(-1)[0].name,'共用标题');
  assert.equal(f.views[0].fields.get('achievement-name')!.props.text,'共用标题');
  assert.deepEqual(f.rows,before);
  f.config.displayStages=[{...presetStages('a')[2],disabled:true}];
  f.settingCallbacks.get('displayStages')!();await new Promise(resolve => setTimeout(resolve, 65));await new Promise(resolve => setTimeout(resolve, 65));
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
  await f.subject.setStage('a','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));
  assert.equal(f.opened[0],'my-popup');assert.equal(f.views[0].fields.get('achievement-name')!.props.text,'POPUP');
  assert.equal(f.views[0].fields.get('achievement-description')!.props.text,'ONLY POPUP');
  assert.equal(f.projected.at(-1)[0].name,'A');
  await new Promise(r=>setTimeout(r,350));assert.equal(f.closed.length,1);
 }finally{f.abort.abort();}
});
test('disabled stage popup, repeat, restore, and page opening never trigger a notification', async () => {
 const f=fixture();try{
  f.config.stagePresentations=[{...legacyPresentation(presetStages('')[2], 'popup'),achievementId:'a',enabled:false}];
  await f.subject.setStage('a','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));assert.equal(f.opened.length,0);
  f.config.stagePresentations[0].enabled=true;
  await f.subject.setStage('a','revealed','',true);await f.subject.openPage();await new Promise(resolve => setTimeout(resolve, 65));
  assert.equal(f.views.length,1);assert.match(f.opened[0],/achievements$/);
  f.ctx.flow.isRestoring=true;await f.subject.setStage('a','unknown','',true);assert.equal(f.views.length,1);
 }finally{f.abort.abort();}
});
test('changing the live popup UI or disabling global notifications closes it without replay', async () => {
 const f=fixture();try{
  f.config.durationMs=60000;
  await f.subject.setStage('a','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));
  f.config.stagePresentations=[{...legacyPresentation(presetStages('')[2],'popup'),achievementId:'a',ui:'another-popup'}];
  f.settingCallbacks.get('stagePresentations')!();await new Promise(resolve => setTimeout(resolve, 65));await new Promise(resolve => setTimeout(resolve, 65));
  assert.equal(f.closed.length,1);assert.equal(f.views.length,1);
  await f.subject.setStage('b','revealed','',true);await new Promise(resolve => setTimeout(resolve, 65));
  f.config.notifications=false;f.settingCallbacks.get('notifications')!();await new Promise(resolve => setTimeout(resolve, 65));await new Promise(resolve => setTimeout(resolve, 65));
  assert.equal(f.closed.length,2);assert.equal(f.views.length,2);
 }finally{f.abort.abort();}
});
