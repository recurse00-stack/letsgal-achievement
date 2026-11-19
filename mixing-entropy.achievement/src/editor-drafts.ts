/** Editor-session drafts only. Never serialized into settings or player saves. */
export type DraftState = 'pending' | 'invalid' | 'rejected' | 'conflict';
export interface EditorDraft { base: string; value: string; state: DraftState; message: string }
export class DraftStore {
  readonly drafts = new Map<string, EditorDraft>();
  readonly ui = new Map<string, unknown>();
  private listeners = new Set<() => void>();
  version = 0;
  rejected = '';
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.version;
  emit() { this.version++; this.listeners.forEach(fn => fn()); }
  edit(key: string, value: string, current: string) {
    const previous = this.drafts.get(key);
    if (value === current && previous?.state !== 'conflict') this.drafts.delete(key);
    else this.drafts.set(key, { base: previous?.base ?? current, value, state: previous?.state === 'conflict' ? 'conflict' : 'pending', message: previous?.state === 'conflict' ? previous.message : '' });
    this.emit();
  }
  observe(key: string, current: string) {
    const draft = this.drafts.get(key);
    if (!draft) return;
    if (current === draft.value) { this.drafts.delete(key); this.emit(); }
    else if (current !== draft.base && draft.state !== 'conflict') { draft.state = 'conflict'; draft.message = '此项已在外部更新；请核对后选择保留草稿或使用最新值。'; this.emit(); }
  }
  commit(key: string, current: string, validate: (value: string) => string, save: (value: string) => boolean | void) {
    this.observe(key, current);
    const draft = this.drafts.get(key);
    if (!draft || draft.state === 'conflict') return false;
    const error = validate(draft.value);
    if (error) { draft.state = 'invalid'; draft.message = error; this.emit(); return false; }
    try {
      this.rejected = '';
      const ok = save(draft.value);
      if (ok === false || this.rejected) { draft.state = 'rejected'; draft.message = this.rejected || '保存被拒绝，草稿仍保留。'; }
      else this.drafts.delete(key);
      this.emit(); return ok !== false && !this.rejected;
    } catch (error) { draft.state = 'invalid'; draft.message = String(error); this.emit(); return false; }
  }
  acceptCurrent(key: string) { this.drafts.delete(key); this.emit(); }
  keepDraft(key: string, current: string) { const d = this.drafts.get(key); if (d) { d.base = current; d.state = 'pending'; d.message = ''; this.emit(); } }
  discardScope(prefix: string) { for (const key of this.drafts.keys()) if (key.startsWith(prefix + '/')) this.drafts.delete(key); this.emit(); }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function rowKey(v: unknown): string | undefined {
  if (!object(v)) return undefined;
  if ('stageId' in v && 'surface' in v) return JSON.stringify([v.achievementId, v.stageId, v.surface]);
  if ('stageId' in v && ('tier' in v || 'apiName' in v)) return JSON.stringify([v.achievementId,v.stageId]);
  if ('id' in v) return JSON.stringify([v.achievementId, v.id]);
  return undefined;
}
/** Rebase a targeted edit on latest observed settings; never clobber unrelated edits. */
export function rebaseSetting(base: unknown, next: unknown, latest: unknown): unknown {
  if (same(base, latest) || same(next, latest)) return next;
  if (same(base, next)) return latest;
  if (object(base) && object(next) && object(latest)) {
    const result = { ...latest };
    for (const key of new Set([...Object.keys(base), ...Object.keys(next)])) if (!same(base[key], next[key])) {
      if (!(key in next)) { if (!same(latest[key], base[key])) throw Error('此项已在外部更新，请核对后重试。'); delete result[key]; }
      else result[key] = rebaseSetting(base[key], next[key], latest[key]);
    }
    return result;
  }
  if (Array.isArray(base) && Array.isArray(next) && Array.isArray(latest) && [...base, ...next, ...latest].every(v => rowKey(v) !== undefined)) {
    const result = [...latest];
    for (const old of base) if (!next.some(v => rowKey(v) === rowKey(old))) {
      const index = result.findIndex(v => rowKey(v) === rowKey(old));
      if (index >= 0) { if (!same(result[index], old)) throw Error('要删除的对象已在外部修改，请核对后重试。'); result.splice(index, 1); }
    }
    for (const value of next) {
      const old = base.find(v => rowKey(v) === rowKey(value));
      if (same(old, value)) continue;
      const index = result.findIndex(v => rowKey(v) === rowKey(value));
      if (index < 0) { if (old) throw Error('编辑对象已被移除；草稿保留。'); result.push(value); }
      else result[index] = rebaseSetting(old, value, result[index]);
    }
    return result;
  }
  throw Error('此项已在外部更新，请核对后重试。');
}
