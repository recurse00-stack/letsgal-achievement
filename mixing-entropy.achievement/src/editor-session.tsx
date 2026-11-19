import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useSetting as useOfficialSetting, type UseSettingResult } from '@avg-studio/studio-ui';
import { DraftStore, rebaseSetting } from './editor-drafts';

import { validateGroups, type GroupRow } from './groups';
class Session extends DraftStore {
  settings = new Map<string, { raw: unknown; latest: unknown }>();
  observeSetting(name: string, raw: unknown) {
    const found = this.settings.get(name);
    if (!found || JSON.stringify(found.raw) !== JSON.stringify(raw)) this.settings.set(name, { raw, latest: raw });
  }
}
const Context = createContext<Session | null>(null);
const Scope = createContext('workbench');
export function EditorSession({ children }: { children: ReactNode }) {
  const [store] = useState(() => new Session());
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function EditorScope({ id, children }: { id: string; children: ReactNode }) {
  const parent = useContext(Scope); return <Scope.Provider value={parent + '/' + id}>{children}</Scope.Provider>;
}
export function useSession() { return useContext(Context); }
export function useEditorState<T>(key: string, initial: T): [T, (value: T | ((previous: T) => T)) => void] {
  const store = useContext(Context), scope = useContext(Scope), id = scope + '/' + key;
  const [local, setLocal] = useState<T>(initial);
  useSyncExternalStore(store?.subscribe ?? noopSubscribe, store?.snapshot ?? zero);
  const value = store ? store.ui.has(id) ? store.ui.get(id) as T : initial : local;
  return [value, next => {
    const v = typeof next === 'function' ? (next as (p: T) => T)(value) : next;
    if (store) { store.ui.set(id, v); store.emit(); } else setLocal(v);
  }];
}
export function useSetting<T = unknown>(name: string): UseSettingResult<T> {
  const [value, setter, info] = useOfficialSetting<T>(name), store = useContext(Context);
  store?.observeSetting(name, value);
  return [value, next => {
    try {
      const rebased = next === undefined ? undefined : rebaseSetting(value, next, store?.settings.get(name)?.latest ?? value) as T;
      if (name === 'main.groupCatalog' && rebased !== undefined) validateGroups(rebased as GroupRow[]);
      const ok = info.isEnabled && setter(rebased);
      if (store) {
        if (ok) { store.settings.set(name, { raw: value, latest: rebased }); store.rejected = ''; }
        else store.rejected = '保存被拒绝，请检查输入或当前编辑权限。';
        store.emit();
      }
      return ok;
    } catch (e) { if (store) { store.rejected = String(e); store.emit(); } return false; }
  }, { ...info, reset: () => { setter(undefined); } }];
}
const noopSubscribe = () => () => {};
const zero = () => 0;
export function SaveStatus() {
  const store = useContext(Context);
  useSyncExternalStore(store?.subscribe ?? noopSubscribe, store?.snapshot ?? zero);
  if (!store) return null;
  const dirty = store.drafts.size;
  const rejected = store.rejected || [...store.drafts.values()].some(d => d.state === 'rejected');
  return <div className="aw-save" role="status"><strong>{rejected ? '保存被拒绝' : dirty ? '尚有未保存输入' : '自动保存'}</strong>
    {!!dirty && <span>{dirty} 项输入未保存，关闭工作台后会丢失。</span>}
    {store.rejected && <span role="alert">{store.rejected}</span>}
    {!!dirty && <details><summary>查看未保存输入</summary>{[...store.drafts].map(([key,d]) => <div key={key} className="aw-draft-row"><span>{key.replace(/^workbench\//,'')} · {d.message || '待提交'}</span><button type="button" onClick={() => store.acceptCurrent(key)}>放弃此项草稿</button></div>)}</details>}
  </div>;
}
export function useDraft(value: string, save: (v: string) => boolean | void, validate: (v: string) => string = () => '', field = 'value') {
  const context = useContext(Context), scope = useContext(Scope);
  const [local] = useState(() => new Session()); const store = context ?? local, key = scope + '/' + field;
  useSyncExternalStore(store.subscribe, store.snapshot);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const current = useMemo(() => ({ value, save, validate }), [store, key]);
  Object.assign(current, {value, save, validate});
  const commit = () => { clearTimeout(timer.current); return store.commit(key, current.value, current.validate, current.save); };
  useEffect(() => { store.observe(key, value); }, [store, key, value]);
  // A valid pending field is flushed before its object unmounts. Invalid drafts stay in the session.
  useEffect(() => () => { clearTimeout(timer.current); if (store.drafts.get(key)?.state === 'pending') store.commit(key, current.value, current.validate, current.save); }, [store, key, current]);
  const draft = store.drafts.get(key);
  return { value: draft?.value ?? value, draft, commit,
    edit: (next: string) => { store.edit(key, next, current.value); clearTimeout(timer.current); timer.current = setTimeout(commit, 500); },
    useLatest: () => store.acceptCurrent(key),
    keepDraft: () => { store.keepDraft(key, current.value); commit(); } };
}
