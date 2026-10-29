import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { templateParts, localTemplatePath, authoredNavigation } from '../src/template-contract.ts';

const native = () => JSON.parse(readFileSync(new URL('../ui/achievements.json', import.meta.url), 'utf8'));
const children = (doc: any) => doc.elements.find((e: any) => e.refId === 'achievement-list').children.find((e: any) => e.props?.__dataListTemplateKind === 'card').children;
test('saved official template contract excludes hidden layers and keeps author layer order', () => {
  const doc = native(), parts = templateParts(doc);
  assert.equal(parts.length, 9);
  assert.deepEqual(parts.filter(p => p.role).map(p => p.role), ['background','backgroundImage','icon','name','level','frame','description','key']);
  children(doc).reverse();
  assert.deepEqual(templateParts(doc), [...parts].reverse());
});
test('ambiguous or grouped contracts fail closed instead of styling a wrong layer', () => {
  const doc = native(); children(doc).push({type:'text',style:{customCss:'--achievement-card-role: key;'}});
  assert.throws(() => templateParts(doc), /重复/);
  const grouped = native(); children(grouped).push({type:'group',children:[]});
  assert.throws(() => templateParts(grouped), /分组/);
  const conditional = native(); children(conditional)[0].visibleIf = 'item.enabled';
  assert.throws(() => templateParts(conditional), /条件/);
});
test('template resource lookup is restricted to our extension UI documents', () => {
  assert.equal(localTemplatePath('@mixing-entropy.achievement/achievements'), 'ui/achievements.json');
  for (const name of ['achievements','@other/page','@mixing-entropy.achievement/../secrets','https://example.com']) assert.equal(localTemplatePath(name), undefined);
});

test('navigation reads the official list independently of unsupported card layouts', () => {
  const doc = native(), list = doc.elements.find((e: any) => e.refId === 'achievement-list');
  for (const mode of ['pagination', 'scroll']) {
    list.props.navigationMode = mode;
    children(doc).push({ type: 'group', children: [] });
    assert.equal(authoredNavigation(doc), mode);
    assert.throws(() => templateParts(doc), /分组/);
  }
  assert.equal(authoredNavigation({ elements: [{ type: 'group', children: [list] }] }), 'scroll');
  assert.equal(authoredNavigation({ elements: [list, list] }), undefined);
  list.props.navigationMode = 'invalid';
  assert.equal(authoredNavigation(doc), undefined);
  delete list.props.navigationMode;
  assert.equal(authoredNavigation(doc), undefined);
  assert.equal(authoredNavigation(undefined), undefined);
});
