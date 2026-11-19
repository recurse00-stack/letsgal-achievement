import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, entries, presetStages, setDisplayStage, readInfo } from '../src/model.ts';
import { effectiveDefaults, detachGroup, groupEntries, isGroupVisible, resolveTiers, MAX_TIER, type GroupRow } from '../src/groups.ts';

const item = {id:'a',name:'旅行',levelId:'bronze',initialStageId:'one'};
const stages = ['one','two','three','four'].map(id => ({...presetStages('a')[2],id}));
const tiers = stages.map((s,i) => ({stageId:s.id,achievementId:'a',tier:[1,2,2,3][i]}));
const levels = [{id:'bronze',name:'铜'},{id:'silver',name:'银'}];
const schemes = [{id:'note',name:'信件',surface:'popup',ui:'my-note',durationMs:850}];
const groups: GroupRow[] = [
  {id:'A',kind:'group',visible:true,level:'silver'},
  {id:'B',kind:'group',visible:false,popup:'note'},
  {id:'ma',kind:'member',group:'A',achievement:'a'},
  {id:'mb',kind:'member',group:'B',achievement:'a'},
  {id:'ba',kind:'binding',achievement:'a',levelGroup:'A',popupGroup:'B'},
];

test('tier gains count initial first acquisition, skip peers and lower targets and never backfill', () => {
  const defs = catalog(levels,[item],stages,[],[],[],[],[],tiers);
  for (const first of ['two','three']) {
    let result = setDisplayStage(defs,[],'a','one');
    assert.equal(result.changed,true);
    assert.equal(setDisplayStage(defs,result.records,'a','one').matched,false);
    result = setDisplayStage(defs,result.records,'a',first);
    const peer = setDisplayStage(defs,result.records,'a',first === 'two' ? 'three' : 'two');
    assert.equal(peer.matched,false);
    assert.equal(peer.records[0].stageId,first);
    assert.equal(setDisplayStage(defs,result.records,'a','four').records[0].stageId,'four');
  }
  const direct = setDisplayStage(defs,[],'a','four');
  for (const target of ['one','two','three','four']) {
    const skip = setDisplayStage(defs,direct.records,'a',target);
    assert.equal(skip.matched,false);
    assert.deepEqual(skip.records,[{id:'a',stageId:'four'}]);
  }
});
test('group sources resolve independently and freeze on member removal, clear and group deletion', () => {
  const defs = catalog(levels,[item],stages,[],schemes,[],[],groups);
  assert.equal(readInfo(defs,[],'a','levelId'),'silver');
  assert.equal(entries(defs,[],'popup')[0].popupUI,'my-note');
  for (const op of [{achievement:'a'},{clear:'popup' as const},{}]) {
    const after = detachGroup(groups,groups[1],op);
    assert.deepEqual(effectiveDefaults(after,'a'),{level:'silver',card:undefined,popup:'note'});
    assert.equal(after.find(r=>r.kind==='binding')?.popupGroup,'');
    assert.equal(groups[4].popupGroup,'B');
  }
});
test('card and level can follow group A while the popup follows group B', () => {
  const rows = groups.map(row => row.id === 'A' ? {...row,card:'night'} : row.id === 'ba' ? {...row,cardGroup:'A'} : row);
  const presets = [...schemes,{id:'night',name:'夜色',surface:'card',backgroundMode:'color',backgroundColor:'#123456'}];
  const definitions = catalog(levels,[item],stages,[],presets,[],[],rows);
  assert.equal(entries(definitions,[])[0].appearance?.backgroundColor,'#123456');
  assert.equal(readInfo(definitions,[],'a','levelId'),'silver');
  assert.equal(entries(definitions,[],'popup')[0].popupUI,'my-note');
  const detached = detachGroup(rows,rows[1],{achievement:'a'});
  const updated = detached.map(row => row.id === 'B' ? {...row,popup:''} : row);
  assert.deepEqual(effectiveDefaults(updated,'a'),{level:'silver',card:'night',popup:'note'});
});
test('a newly available stage is immediately above each achievement’s previous highest tier', () => {
  const shared = [...stages, {...stages[0], id:'ending'}];
  const second = {...item, id:'b'};
  const configured = [...tiers, ...tiers.map(row => ({...row, achievementId:'b', tier:row.tier + 3}))];
  const defs = catalog(levels,[item,second],[],shared,[],[],[],[],configured);
  for (const id of ['a','b']) {
    const oldSave = [{id,stageId:'four'}];
    const gain = setDisplayStage(defs,oldSave,id,'ending');
    assert.equal(gain.changed,true);
    assert.equal(setDisplayStage(defs,gain.records,id,'ending').matched,false);
    assert.equal(setDisplayStage(defs,gain.records,id,'four').matched,false);
    assert.equal(oldSave[0].stageId,'four');
  }
});
test('legacy gaps, restored stage IDs and tier number limits preserve peers and previous winners', () => {
  const saved = tiers.map(row => ({...row, tier:row.tier===3 ? MAX_TIER : row.tier}));
  const added = {id:'added'};
  const active = stages.filter(s=>s.id !== 'three');
  const complete = resolveTiers('a',saved,[...active,added]);
  assert.deepEqual(complete.map(row=>row.tier),[1,2,2,3,4]);
  assert.equal(resolveTiers('a',complete,[...stages,added]),complete);
  assert.deepEqual(resolveTiers('b',[],stages),[]);
  assert.equal(saved.at(-1)!.tier,MAX_TIER);
});
test('group projection preserves per-group order, hides omitted cards and leaves the all view intact', () => {
  const cards = [{id:'a'},{id:'c'},{id:'b'}];
  const rows:GroupRow[] = [...groups,{id:'bb',kind:'member',group:'A',achievement:'b',order:-1},{id:'hidden',kind:'member',group:'A',achievement:'h'}];
  assert.deepEqual(groupEntries(cards,rows,'A'),[{id:'b'},{id:'a'}]);
  assert.equal(groupEntries(cards,rows,''),cards);
  assert.equal(isGroupVisible(groups[1],[]),false);
  assert.equal(isGroupVisible(groups[1],[{id:'B',visible:true,unlocked:true}]),true);
});
