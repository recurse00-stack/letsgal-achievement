import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, DEFAULT_LEVELS, entries, setDisplayStage, presetStages, readInfo } from '../src/model.ts';
const item={id:'a',name:'旅人',levelId:'bronze',initialStageId:'hidden'};
const upgraded={...presetStages('a')[2],id:'master',name:'大师',levelMode:'custom',levelId:'gold'};
const defs=catalog(DEFAULT_LEVELS,[item],[upgraded]);
test('stage transition is guarded and idempotent; there is no extra active state',()=>{
 const rejected=setDisplayStage(defs,[],'a','master','unknown');assert.equal(rejected.matched,false);assert.deepEqual(rejected.records,[]);
 const done=setDisplayStage(defs,[],'a','master','hidden');assert.deepEqual(done.records,[{id:'a',stageId:'master'}]);
 assert.equal(setDisplayStage(defs,done.records,'a','master').changed,false);
});
test('current custom stage determines level; stage ordering creates no implicit records',()=>{
 const saved=setDisplayStage(defs,[],'a','master').records;
 assert.equal(readInfo(defs,saved,'a','stageId'),'master');assert.equal(readInfo(defs,saved,'a','stageName'),'大师');
 assert.equal(readInfo(defs,saved,'a','levelId'),'gold');assert.equal(readInfo(defs,saved,'a','levelName'),'金');
 assert.deepEqual(saved,[{id:'a',stageId:'master'}]);assert.equal(entries(defs,saved)[0].levelName,'金');
 const previous=setDisplayStage(defs,saved,'a','unknown').records;
 assert.equal(readInfo(defs,previous,'a','stageId'),'unknown');assert.equal(readInfo(defs,previous,'a','levelId'),'bronze');
});
test('hidden or unexposed levels remain queryable without leaking into player projection',()=>{
 const saved=[{id:'a',stageId:'master'}];const hidden=catalog(DEFAULT_LEVELS,[item],[{...upgraded,visible:false}]);
 assert.deepEqual(entries(hidden,saved),[]);assert.equal(readInfo(hidden,saved,'a','levelId'),'gold');
 const masked=catalog(DEFAULT_LEVELS,[item],[{...upgraded,showLevel:false}]);assert.equal(entries(masked,saved)[0].levelId,'');
 assert.equal(readInfo(masked,saved,'a','levelId'),'gold');
});
test('legacy stage config defaults base; invalid custom levels and unsupported fields fail',()=>{
 const {levelMode,levelId,...legacy}=presetStages('a')[2];const old=catalog(DEFAULT_LEVELS,[item],[legacy]);
 assert.equal(readInfo(old,[{id:'a',stageId:'revealed'}],'a','levelId'),'bronze');
 assert.throws(()=>catalog(DEFAULT_LEVELS,[item],[{...upgraded,levelId:'missing'}]),/等级不存在/);
 assert.equal(readInfo(old,[{id:'a',stageId:'removed'}],'a','levelId'),'');
 assert.throws(()=>readInfo(old,[],'a','active' as any),/读取项目无效/);
});
