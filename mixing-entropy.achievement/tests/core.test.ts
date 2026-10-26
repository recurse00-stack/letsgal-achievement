import test from 'node:test';
import assert from 'node:assert/strict';
import { NotificationQueue } from '../src/notification-queue.ts';

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
