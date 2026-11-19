import test from 'node:test';
import assert from 'node:assert/strict';
import { DraftStore, rebaseSetting } from '../src/editor-drafts.ts';
test('drafts validate before writing, survive navigation, and retry a refused write', () => {
  const s = new DraftStore(); let value = 'Original', writes = 0;
  s.edit('a/name', '', value);
  assert.equal(s.commit('a/name', value, v => v.trim() ? '' : 'Required', () => { writes++; }), false);
  assert.equal(writes, 0); assert.equal(s.drafts.get('a/name')?.state, 'invalid');
  s.edit('b/name', 'B', 'Other'); assert.equal(s.drafts.get('a/name')?.value, '');
  s.edit('a/name', 'New', value); s.commit('a/name', value, () => '', () => false);
  assert.equal(s.drafts.get('a/name')?.state, 'rejected');
  s.commit('a/name', value, () => '', v => { value = v; writes++; return true; });
  assert.equal(value, 'New'); assert.equal(writes, 1); assert.ok(!s.drafts.has('a/name')); assert.ok(s.drafts.has('b/name'));
});
test('external same-field updates block automatic writes until explicitly resolved', () => {
  const s = new DraftStore(); let writes = 0;
  s.edit('name', 'Mine', 'Old'); s.observe('name', 'Theirs');
  assert.equal(s.commit('name', 'Theirs', () => '', () => { writes++; }), false);
  assert.equal(writes, 0); assert.equal(s.drafts.get('name')?.state, 'conflict');
  s.keepDraft('name', 'Theirs'); s.commit('name', 'Theirs', () => '', () => { writes++; return true; });
  assert.equal(writes, 1);
});
test('rebase preserves unrelated row fields and rejects deleted or concurrently edited targets', () => {
  const base = [{id:'a',name:'A',description:'old'},{id:'b',name:'B'}];
  const next = [{...base[0], name:'New'},base[1]];
  const latest = [{...base[0],description:'external'},base[1],{id:'c',name:'C'}];
  assert.deepEqual(rebaseSetting(base,next,latest), [{id:'a',name:'New',description:'external'},base[1],{id:'c',name:'C'}]);
  assert.throws(() => rebaseSetting(base,next,[base[1]]), /移除/);
  assert.throws(() => rebaseSetting(base,next,[{...base[0],name:'Theirs'},base[1]]), /外部/);
});
test('stage presentation composite identities keep card, popup and owners isolated', () => {
  const a={achievementId:'a',stageId:'s',surface:'card',enabled:true};
  const b={...a,surface:'popup'},c={...a,achievementId:'b'};
  assert.deepEqual(rebaseSetting([a,b],[{...a,enabled:false},b],[a,{...b,enabled:false},c]), [{...a,enabled:false},{...b,enabled:false},c]);
});
