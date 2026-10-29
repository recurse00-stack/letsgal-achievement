import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCardSizeReference, readCardSizeReference, sizeReferenceKey, type CardSizeMeasurement } from '../src/card-size-reference.ts';

const page = '@mixing-entropy.achievement/achievements';
const document = { elements: [{ type: 'data-list', refId: 'achievement-list', rect: { w: 1440, h: 600 }, props: { layout: 'card', cols: 2, rows: 2, gap: 24 }, children: [{ props: { __dataListTemplateKind: 'card' }, rect: { w: 240, h: 280 } }] }] };
const size: CardSizeMeasurement = { width: 708.003, height: 260.009, contentWidth: 707, contentHeight: 259, gridWidth: 1440, gridHeight: 544, mode: 'pagination' };

test('uses measured cell allocation including navigation space, leaving author geometry intact', () => {
  const before = structuredClone(document);
  const reference = makeCardSizeReference(document, page, size, 1000)!;
  assert.deepEqual([reference.width, reference.height], [708, 260]);
  assert.deepEqual([reference.templateWidth, reference.templateHeight], [240, 280]);
  assert.equal(reference.gridHeight, 544);
  assert.equal(reference.listHeight, 600);
  assert.deepEqual(document, before);
  const tall = makeCardSizeReference(document, page, { ...size, width: 10, height: 1000 }, 2000)!;
  assert.deepEqual([tall.width, tall.height], [10, 1000]);
});

test('a cached measurement never masquerades as another selected page or malformed data', () => {
  const reference = makeCardSizeReference(document, page, size, 1000)!;
  assert.deepEqual(readCardSizeReference([reference], 'ui:' + page), reference);
  assert.equal(readCardSizeReference([reference], '@mixing-entropy.achievement/other'), undefined);
  for (const value of [null, [], [reference, reference], [{ ...reference, width: 0 }], [{ ...reference, height: Infinity }], [{ ...reference, mode: 'unknown' }]]) {
    assert.equal(readCardSizeReference(value, page), undefined);
  }
});

test('invalid/ambiguous templates and invisible cells cannot create usable references', () => {
  assert.equal(makeCardSizeReference({}, page, size), undefined);
  assert.equal(makeCardSizeReference({ elements: [...document.elements, ...document.elements] }, page, size), undefined);
  assert.equal(makeCardSizeReference(document, page, { ...size, contentWidth: 0 }), undefined);
  assert.equal(makeCardSizeReference(document, page, { ...size, gridHeight: NaN }), undefined);
});

test('dedupe ignores timestamp but preserves size, mode and authored layout changes', () => {
  const first = makeCardSizeReference(document, page, size, 1000)!;
  const later = makeCardSizeReference(document, page, size, 2000)!;
  assert.equal(sizeReferenceKey(first), sizeReferenceKey(later));
  assert.notEqual(sizeReferenceKey(first), sizeReferenceKey({ ...later, width: 1440, height: 544 }));
  assert.notEqual(sizeReferenceKey(first), sizeReferenceKey({ ...later, mode: 'vertical' }));
});
