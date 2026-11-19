import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { presetStages } from '../src/model.ts';

test('method inspectors preserve parameter state and report editor feedback', async t => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  const temp = await mkdtemp(fileURLToPath(new URL('../.inspector-test-', import.meta.url)));
  const React = await import('react'); const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await writeFile(`${temp}/kit.jsx`, `import React from 'react';
export const store={settings:{},raw:{},defaults:{achievementId:'',stageId:'revealed',expectedStageId:''},variables:{},environment:{},reject:false,writes:[],attempts:[]};const listeners=new Set();
export function useSetting(key){return [store.settings[key]];}
export function useInspectorEnvironment(){return store.environment;}
export function useParam(name){
  const [,update]=React.useState(0);React.useEffect(()=>{const f=()=>update(x=>x+1);listeners.add(f);return()=>listeners.delete(f)},[]);
  const raw=store.raw[name],variable=store.variables[name],invalid=!variable&&raw!==undefined&&typeof raw!=='string';
  const value=variable?undefined:invalid||raw===undefined?store.defaults[name]:raw;
  const set=next=>{store.attempts.push({name,next});if(store.reject||store.environment.readOnly)return false;
    // Match Studio's no-op rule for writing a displayed fallback back.
    if(next!==undefined&&next===value)return true;
    if(next===undefined)delete store.raw[name];else store.raw[name]=next;
    delete store.variables[name];store.writes.push({name,next});listeners.forEach(f=>f());return true;};
  return [value,set,{isSet:raw!==undefined,isVariable:!!variable,variable,isInvalid:invalid,reason:invalid?'Expected a string':undefined,rawValue:variable?undefined:raw,defaultValue:store.defaults[name],reset:()=>set()}];
}
export function FieldRow({label,description,children}){return <div data-field={label}><span>{label}</span><small>{description}</small>{children}</div>}
export function Button({children,onClick,disabled}){return <button disabled={disabled} onClick={onClick}>{children}</button>}
export function Select({value,options,onChange,disabled,placeholder}){return <select disabled={disabled} value={options.some(o=>o.value===value)?value:'__placeholder__'} onChange={e=>onChange(e.target.value)}><option disabled value="__placeholder__">{placeholder}</option>{options.map(o=><option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select>}
export function ParamField({name}){return <div data-param={name}>官方参数：{name}</div>}
`);
    await writeFile(`${temp}/entry.ts`, `export {OperationInspector,ReadInspector} from '../src/method-inspectors';export {store} from './kit';`);
    await build({ entryPoints: [`${temp}/entry.ts`], outfile: `${temp}/compiled.mjs`, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react', 'react-dom', 'postcss'], alias: { '@avg-studio/studio-ui': `${temp}/kit.jsx` }, logLevel: 'silent' });
    const { OperationInspector, ReadInspector, store } = await import(pathToFileURL(`${temp}/compiled.mjs`).href);
    const doc = dom.window.document;
    let renderKey = 0;
    const reset = () => {
      store.settings = { 'main.achievements': [{ id: 'a', name: 'A' }], 'main.defaultStages': presetStages('').filter(s => s.id !== 'hidden') };
      store.raw = { achievementId: 'a', stageId: 'unknown' }; store.variables = {};
      store.environment = { placement: 'inspector', canUseVariables: true, readOnly: false };
      store.reject = false; store.writes = []; store.attempts = [];
    };
    const render = async (component = OperationInspector) => React.act(async () => root.render(React.createElement(component, { key: ++renderKey })));
    const click = async (text: string) => {
      const button = [...doc.querySelectorAll('button')].find(b => b.textContent === text); assert.ok(button, text);
      await React.act(async () => button.click());
    };
    const select = (label: string) => doc.querySelector<HTMLSelectElement>(`[data-field="${label}"] select`)!;
    const choose = async (label: string, value: string) => React.act(async () => { const el = select(label); assert.ok(el); el.value = value; el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });

    await t.test('wording follows variable capability in all three placements', async () => {
      for (const placement of ['inspector', 'dialog', 'ui-editor']) {
        reset(); store.environment = { placement, canUseVariables: placement !== 'ui-editor', readOnly: false };
        await render();
        const allow = store.environment.canUseVariables;
        await click(allow ? '按编号或变量指定' : '按编号指定');
        assert.ok(doc.querySelector('[data-param="achievementId"]'));
        await click(allow ? '收起编号／变量输入' : '收起编号输入');
        await click(allow ? '按阶段编号或变量指定' : '按阶段编号指定');
        assert.ok(doc.querySelector('[data-param="stageId"]'));
        if (!allow) assert.doesNotMatch(doc.body.textContent!, /变量/);
        assert.equal(store.writes.length, 0);
      }
    });
    await t.test('invalid raw values remain visible and unchanged on opening and folding', async () => {
      reset(); store.raw = { achievementId: { old: 'a' }, stageId: 123, expectedStageId: false };
      const before = JSON.stringify(store.raw); await render();
      assert.equal(doc.querySelectorAll('[role="alert"]').length, 3);
      for (const text of ['Expected a string', '{"old":"a"}', '123', 'false']) assert.ok(doc.body.textContent!.includes(text));
      assert.ok(doc.querySelector('[data-param="expectedStageId"]'), 'invalid optional condition must not disappear behind collapsed advanced settings');
      await click('按编号或变量指定');
      assert.equal(JSON.stringify(store.raw), before); assert.equal(store.attempts.length, 0);
      await render(ReadInspector);
      assert.match(doc.body.textContent!, /原参数无效/); assert.equal(JSON.stringify(store.raw), before);
    });
    await t.test('explicitly choosing the displayed default repairs invalid raw state; rejection preserves it', async () => {
      reset(); store.raw.stageId = 123; await render();
      assert.equal(select('目标展示阶段').value, '__placeholder__');
      store.reject = true; await choose('目标展示阶段', 'revealed');
      assert.equal(store.raw.stageId, 123); assert.match(doc.body.textContent!, /参数保存失败/);
      store.reject = false; await choose('目标展示阶段', 'revealed');
      assert.equal(Object.hasOwn(store.raw, 'stageId'), false, 'reset is required rather than writing the fallback back');
      assert.deepEqual(store.writes, [{ name: 'stageId', next: undefined }]);
      assert.equal(select('目标展示阶段').value, 'revealed'); assert.equal(doc.querySelector('[role="alert"]'), null);
      reset(); store.raw.expectedStageId = false; await render();
      await choose('仅在此阶段执行', '');
      assert.equal(Object.hasOwn(store.raw, 'expectedStageId'), false); assert.equal(doc.querySelector('[role="alert"]'), null);
    });
    await t.test('achievement selection reports refusal and clears feedback after successful retry', async () => {
      reset(); store.raw.achievementId = 42; await render();
      store.reject = true; await choose('选择成就', 'a');
      assert.equal(store.raw.achievementId, 42); assert.match(doc.body.textContent!, /参数保存失败/);
      store.reject = false; await choose('选择成就', 'a');
      assert.equal(store.raw.achievementId, 'a'); assert.equal(doc.querySelector('[role="alert"]'), null);
      assert.deepEqual([...select('目标展示阶段').options].filter(o => !o.disabled).map(o => o.value), ['unknown', 'revealed']);
    });
    await t.test('variable bindings and readonly parameters are never initialized or overwritten on render', async () => {
      reset(); store.variables = { achievementId: '成就编号', stageId: '阶段编号' }; await render();
      assert.ok(doc.querySelector('[data-param="achievementId"]')); assert.ok(doc.querySelector('[data-param="stageId"]'));
      assert.deepEqual(store.variables, { achievementId: '成就编号', stageId: '阶段编号' }); assert.equal(store.attempts.length, 0);
      reset(); store.environment.readOnly = true; await render();
      assert.equal(select('选择成就').disabled, true); assert.equal(select('目标展示阶段').disabled, true);
      await click('按编号或变量指定'); assert.equal(store.attempts.length, 0);
    });
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, value] of saved) { if (value) Object.defineProperty(globalThis, key, value); else delete (globalThis as any)[key]; }
    await rm(temp, { recursive: true, force: true });
  }
});
