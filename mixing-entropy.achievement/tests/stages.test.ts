import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, DEFAULT_LEVELS, presetStages, entries, currentStage, setDisplayStage, stageRecords } from '../src/model.ts';
const row={id:'a',name:'真名',description:'真相',icon:'secret.svg',levelId:'gold'};
const clue={...presetStages('a')[1],id:'clue',name:'线索',displayName:'远方来信',description:'找向导聊聊',iconMode:'custom' as const,icon:'clue.svg'};
test('stage projection whitelists allowed contents and contains no activation fact',()=>{
 const defs=catalog(DEFAULT_LEVELS,[row],[clue]);const saved=setDisplayStage(defs,[],'a','clue').records;const view=entries(defs,saved)[0];
 assert.equal(view.name,'远方来信');assert.equal(view.description,'找向导聊聊');assert.equal(view.icon,'clue.svg');assert.equal(view.stageName,'');assert.equal(view.levelName,'');
 assert.ok(!JSON.stringify(view).includes('真相'));assert.ok(!('active' in view));assert.ok(!('status' in view));
});
test('stage is required and saved identity wins over initial stage',()=>{
 const defs=catalog(DEFAULT_LEVELS,[{...row,initialStageId:'hidden'}]);
 assert.throws(()=>stageRecords([{id:'a',active:true}]),/缺少展示阶段/);
 assert.equal(currentStage(defs,[],'a'),'hidden');
 assert.equal(currentStage(defs,stageRecords([{id:'a',stageId:'unknown'}]),'a'),'unknown');
 assert.deepEqual(entries(defs,stageRecords([{id:'a',stageId:'removed'}])),[]);
});
test('empty custom content stays blank; hidden and deleted stages fail closed',()=>{
 const defs=catalog(DEFAULT_LEVELS,[row],[{...clue,displayName:'',description:'',icon:''}]);const saved=setDisplayStage(defs,[],'a','clue').records;
 assert.equal(entries(defs,saved)[0].name,'');assert.equal(entries(defs,saved)[0].icon,'');
 assert.deepEqual(entries(catalog(DEFAULT_LEVELS,[row]),saved),[]);
});
test('renaming the activated preset does not change behavior; labels only display when requested',()=>{
 const stage={...clue,id:'revealed',name:'旅程中',showStageName:true,showLevel:true};
 const defs=catalog(DEFAULT_LEVELS,[row],[stage]);const saved=setDisplayStage(defs,[],'a','revealed').records;
 assert.equal(entries(defs,saved)[0].stageName,'旅程中');assert.equal(entries(defs,saved)[0].levelName,'金');
 assert.deepEqual(Object.keys(saved[0]).sort(),['id','stageId']);
});
test('invalid definitions, malformed records and unknown targets fail without mutation',()=>{
 assert.throws(()=>catalog(DEFAULT_LEVELS,[row],[clue,clue]),/重复/);
 assert.throws(()=>catalog(DEFAULT_LEVELS,[{...row,initialStageId:'missing'}]),/初始阶段不存在/);
 assert.throws(()=>catalog(DEFAULT_LEVELS,[row],[{...clue,nameMode:'invalid'}]),/内容来源无效/);
 assert.throws(()=>stageRecords([{id:'a',active:'false'}]),/缺少展示阶段/);
 assert.throws(()=>stageRecords([{id:'a',stageId:'hidden'},{id:'a',stageId:'unknown'}]),/重复/);
 const saved=Object.freeze([{id:'a',stageId:'clue'}]);assert.throws(()=>setDisplayStage(catalog(DEFAULT_LEVELS,[row],[clue]),saved,'a','missing'),/找不到展示阶段/);
 assert.deepEqual(saved,[{id:'a',stageId:'clue'}]);
});
