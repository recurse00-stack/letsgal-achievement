import test from 'node:test';
import assert from 'node:assert/strict';
import { AchievementController } from '../src/runtime.ts';

function fixture() {
  const abort = new AbortController();
  const rows: any[] = [];
  const config: Record<string, any> = { achievements: [{id:'a', name:'A', icon:'',levelId:'bronze'},{id:'b',name:'B',icon:'',levelId:'silver'}], durationMs:300 };
  const projected: any[] = []; const opened: string[] = []; const closed: string[] = [];
  const callbacks = new Map(); let failures = false; let writing = 0; let maxWriting = 0; let cleanup = 0;
  const table = {
    find:async()=>structuredClone(rows),
    insertOne:async(row:any)=>{writing++;maxWriting=Math.max(maxWriting,writing);await new Promise(r=>setTimeout(r,2));writing--;if(failures)throw Error('disk');const result={...row,id:'row-'+rows.length};rows.push(result);return result;},
    updateOne:async(filter:any, patch:any)=>{if(failures)throw Error('disk');const row=rows.find(r=>r.id===filter.id);if(row)Object.assign(row,patch.$set);return {matchedCount:row?1:0,modifiedCount:row?1:0};},
    watch:()=>()=>{cleanup++;},
  };
  const ctx:any={
    flow:{signal:abort.signal,isRestoring:false},database:{collection:()=>table},
    settings:{get:(key:string)=>config[key],subscribe:()=>()=>{cleanup++;}},
    visualUI:{
      onOpen:(name:string,fn:any)=>{callbacks.set(name,fn);return()=>callbacks.delete(name);},
      open:async(name:string)=>{opened.push(name);let onClose=()=>{};let done=false;const v={get:()=>({setProps:()=>{},setHidden:()=>{},setStyle:()=>{},on:()=>()=>{}}),close:()=>{if(!done){done=true;closed.push(name);onClose();}},onClose:(fn:any)=>{onClose=fn;return()=>{onClose=()=>{};};}};callbacks.get(name)?.(v);return v;},
    },
  };
  let browseMode='pagination';
  const subject=new AchievementController(ctx,{get:()=>browseMode,set:(key,v)=>{if(key==='entries')projected.push(structuredClone(v));else browseMode=v as string;}},abort.signal);
  return {subject,ctx,abort,rows,config,projected,opened,closed,fail:()=>{failures=true;},stats:()=>({maxWriting,cleanup,callbacks:callbacks.size})};
}

test('concurrent calls serialize; one fact per id; idempotent activation',async()=>{
 const f=fixture();await Promise.all([f.subject.set('a',true,false),f.subject.set('a',true,false),f.subject.set('b',true,false)]);
 assert.equal(f.rows.length,2);assert.equal(f.stats().maxWriting,1);assert.equal(await f.subject.isActive('a'),true);f.abort.abort();
});
test('write failure never publishes success or notification',async()=>{
 const f=fixture();f.fail();await assert.rejects(f.subject.set('a',true,true),/disk/);assert.equal(f.rows.length,0);assert.equal(f.projected.length,0);assert.equal(f.opened.length,0);f.abort.abort();
});
test('restoration rebuilds view without writing replayed activation',async()=>{
 const f=fixture();f.ctx.flow.isRestoring=true;await f.subject.set('a',true,true);assert.equal(f.rows.length,0);assert.equal(f.projected.at(-1)[0].active,false);assert.equal(f.opened.length,0);f.abort.abort();
});
test('duplicates and missing ids fail before a write',async()=>{
 const f=fixture();await assert.rejects(f.subject.set('unknown',true,false),/找不到/);f.rows.push({id:'1',achievementId:'a',active:true},{id:'2',achievementId:'a',active:false});await assert.rejects(f.subject.refresh(),/重复/);assert.equal(f.projected.length,0);f.abort.abort();
});
test('UI and notifications release handles when the run ends',async()=>{
 const f=fixture();await f.subject.openPage();await f.subject.set('a',true,true);await new Promise(r=>setTimeout(r,10));f.abort.abort();await new Promise(r=>setTimeout(r,10));assert.equal(f.opened.length,2);assert.equal(f.closed.length,2);assert.equal(f.stats().cleanup,3);assert.equal(f.stats().callbacks,0);await assert.rejects(f.subject.set('b',true,false),/已结束/);assert.equal(f.rows.length,1);
});
test('rename/regrade and custom page selection use the same stable record',async()=>{
 const f=fixture();await f.subject.set('a',true,false);f.config.achievements[0].name='Renamed';f.config.achievements[0].levelId='gold';f.config.page='ui:my-achievements';await f.subject.openPage();assert.equal(f.projected.at(-1)[0].active,true);assert.equal(f.projected.at(-1)[0].levelName,'金');assert.equal(f.opened[0],'my-achievements');f.abort.abort();
});
