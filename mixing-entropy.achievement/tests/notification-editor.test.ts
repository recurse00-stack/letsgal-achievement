import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

test('notification ordering editor writes structured priorities, preserves failure state and never writes on mount', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  const prefix = fileURLToPath(new URL('../.notification-editor-test-', import.meta.url));
  const temp = await mkdtemp(prefix);
  const React = await import('react'); const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await writeFile(`${temp}/kit.jsx`, `import React from 'react';
export const store={values:{'main.achievements':[{id:'a',name:'甲'}]},writes:0,reject:false};const listeners=new Set();
export function useSetting(key){const [,update]=React.useState(0);React.useEffect(()=>{const fn=()=>update(x=>x+1);listeners.add(fn);return()=>listeners.delete(fn)},[]);return [store.values[key],v=>{if(store.reject)return false;store.values[key]=v;store.writes++;listeners.forEach(f=>f());return true},{isEnabled:true,isModified:false,reset(){}}];}
export function Section({title,children,defaultOpen=true}){const [open,setOpen]=React.useState(defaultOpen);return <section><button onClick={()=>setOpen(!open)}>{title}</button>{open&&children}</section>}
export function FieldRow({label,children}){return <label data-field={label}>{label}{children}</label>}
export function Button({children,onClick,disabled}){return <button disabled={disabled} onClick={onClick}>{children}</button>}
export function Select({value,options,onChange}){return <select value={value} onChange={e=>onChange(e.target.value)}><option value="">选择</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}
export const SettingField=()=>null,NumberSlider=()=>null,Switch=()=>null,UIRefPicker=()=>null;
`);
    await writeFile(`${temp}/entry.ts`, "export {NotificationOrdering} from '../src/notification-editor';export {store} from './kit';");
    await build({ entryPoints: [`${temp}/entry.ts`], outfile: `${temp}/compiled.mjs`, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react', 'react-dom', 'postcss'], alias: { '@avg-studio/studio-ui': `${temp}/kit.jsx` }, logLevel: 'silent' });
    const { NotificationOrdering, store } = await import(pathToFileURL(`${temp}/compiled.mjs`).href);
    await React.act(async () => root.render(React.createElement(NotificationOrdering)));
    const click = async (text: string) => { const button = [...dom.window.document.querySelectorAll('button')].find(x => x.textContent === text); assert.ok(button, text); await React.act(async () => button.click()); };
    const choose = async (field: string, value: string) => { const select = dom.window.document.querySelector(`[data-field="${field}"] select`) as HTMLSelectElement; assert.ok(select, field); await React.act(async () => { select.value = value; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); }); };
    assert.equal(store.writes, 0);
    await choose('添加排序规则', 'level'); await choose('添加优先值', 'gold'); await choose('添加优先值', 'silver');
    assert.deepEqual(store.values['main.notificationSort'], [{ field: 'level', value: 'gold' }, { field: 'level', value: 'silver' }]);
    await click('下移'); assert.equal(store.values['main.notificationSort'][0].value, 'silver');
    const handles = () => [...dom.window.document.querySelectorAll<HTMLButtonElement>('button[aria-label="拖动优先值"]')];
    await React.act(async () => handles()[1].dispatchEvent(new dom.window.Event('dragstart', {bubbles:true})));
    await React.act(async () => handles()[0].dispatchEvent(new dom.window.Event('drop', {bubbles:true,cancelable:true})));
    assert.equal(store.values['main.notificationSort'][0].value,'gold');
    await choose('添加排序规则','stage');
    const ruleHandles = () => [...dom.window.document.querySelectorAll<HTMLButtonElement>('button[aria-label="拖动排序规则"]')];
    await React.act(async () => ruleHandles()[1].dispatchEvent(new dom.window.Event('dragstart',{bubbles:true})));
    await React.act(async () => ruleHandles()[0].dispatchEvent(new dom.window.Event('drop',{bubbles:true,cancelable:true})));
    assert.equal(store.values['main.notificationSort'][0].field,'stage');
    await click('移除规则');
    const saved = structuredClone(store.values['main.notificationSort']); store.reject = true;
    await click('移除规则'); assert.deepEqual(store.values['main.notificationSort'], saved);
    assert.match(dom.window.document.querySelector('[role="alert"]')!.textContent!, /保存失败/);
    store.reject = false; await click('移除规则'); assert.deepEqual(store.values['main.notificationSort'], []);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, value] of previous) { if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key); }
    assert.ok(resolve(temp).startsWith(resolve(prefix)), 'cleanup must stay inside the generated test directory');
    await rm(temp, { recursive: true, force: true });
  }
});
