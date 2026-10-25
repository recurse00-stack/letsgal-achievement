import test from 'node:test';
import assert from 'node:assert/strict';
import { wheelDistance } from '../src/horizontal-cards.ts';

test('horizontal wheel accepts either axis without doubling diagonal deltas', () => {
  assert.equal(wheelDistance(120, 0, 0, 400), 120);
  assert.equal(wheelDistance(0, -80, 0, 400), -80);
  assert.equal(wheelDistance(60, 40, 0, 400), 60);
  assert.equal(wheelDistance(0, 3, 1, 400), 48);
  assert.equal(wheelDistance(-1, 0, 2, 400), -400);
});
