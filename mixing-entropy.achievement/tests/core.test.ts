import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, activations, entries, setActivation, DEFAULT_LEVELS } from '../src/model.ts';
import { NotificationQueue } from '../src/notification-queue.ts';

const definitions = catalog(DEFAULT_LEVELS, [{id:'a',name:'第一步',icon:'',levelId:'bronze'},{id:'b',name:'再一步',icon:'',levelId:'gold'}]);
test('activation is idempotent, cancellation is explicit, and reactivation is a new transition', () => {
  const first = setActivation(definitions, [], 'a', true);
  assert.equal(first.activated,true);
  const repeated = setActivation(definitions,first.records,'a',true);
  assert.equal(repeated.changed,false); assert.equal(repeated.activated,false);
  const cancelled = setActivation(definitions,first.records,'a',false);
  assert.equal(cancelled.activated,false);
  assert.equal(setActivation(definitions,cancelled.records,'a',true).activated,true);
});
test('invalid inputs and missing references fail without mutation', () => {
  const records = Object.freeze([{id:'a',active:true}]);
  assert.throws(()=>setActivation(definitions,records,'missing',true),/找不到/);
  assert.throws(()=>activations([{id:'a',active:'false'}]),/布尔值/);
  assert.throws(()=>activations([{id:'a',active:true},{id:'a',active:false}]),/重复/);
  assert.throws(()=>catalog(DEFAULT_LEVELS,[{id:'a',name:'A',levelId:'missing'}]),/等级不存在/);
  assert.deepEqual(records,[{id:'a',active:true}]);
});
test('renaming/regrading retains activation and restoration does not produce notification events', () => {
  const saved = JSON.stringify(setActivation(definitions,[],'a',true).records);
  const edited = catalog([{id:'custom',name:'星级'}],[{id:'a',name:'新的名称',icon:'x.svg',levelId:'custom'}]);
  const view = entries(edited,activations(JSON.parse(saved)));
  assert.equal(view[0].active,true); assert.equal(view[0].name,'新的名称'); assert.equal(view[0].levelName,'星级');
  assert.equal(setActivation(edited,activations(JSON.parse(saved)),'a',true).activated,false);
});
test('projection is disposable and unknown retained records are preserved',()=>{
  const records=[{id:'retired',active:true}];const view=entries(definitions,records);view[0].active=true;
  assert.equal(entries(definitions,records)[0].active,false);
  assert.deepEqual(setActivation(definitions,records,'a',true).records[0],{id:'retired',active:true});
});
test('rapid notifications are sequential and one display failure does not block the next',async()=>{
  const started:number[]=[];const release:(()=>void)[]=[];const errors:unknown[]=[];
  const q=new NotificationQueue<number>(async n=>{started.push(n);await new Promise<void>(r=>release.push(r));if(n===2)throw Error('display');},e=>errors.push(e));
  q.enqueue(1);q.enqueue(2);q.enqueue(3);assert.deepEqual(started,[1]);
  release.shift()!();await new Promise(setImmediate);assert.deepEqual(started,[1,2]);
  release.shift()!();await new Promise(setImmediate);assert.deepEqual(started,[1,2,3]);
  release.shift()!();await new Promise(setImmediate);assert.equal(errors.length,1);
});
test('ending a run aborts the current popup and discards pending popups',async()=>{
  const started:number[]=[];let aborted=false;
  const q=new NotificationQueue<number>(async(n,signal)=>{started.push(n);await new Promise<void>(resolve=>signal.addEventListener('abort',()=>{aborted=true;resolve();},{once:true}));},()=>{});
  q.enqueue(1);q.enqueue(2);q.stop();q.enqueue(3);await new Promise(setImmediate);
  assert.equal(aborted,true);assert.deepEqual(started,[1]);
});
