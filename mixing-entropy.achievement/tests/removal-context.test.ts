import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

test('right-click removals target the pointed item, preserve guards and drafts, and never collapse their owner', async () => {
  const dom = new JSDOM('<div id="root"></div><button id="outside">Outside</button>', { pretendToBeVisual: true, url: 'http://localhost/' });
  const win = dom.window, previous = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string, value: unknown) => { previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); };
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Document', 'ShadowRoot', 'MutationObserver', 'CustomEvent', 'Event', 'KeyboardEvent', 'MouseEvent']) install(key, key === 'window' ? win : (win as any)[key]);
  install('getComputedStyle', win.getComputedStyle.bind(win)); install('requestAnimationFrame', win.requestAnimationFrame.bind(win)); install('cancelAnimationFrame', win.cancelAnimationFrame.bind(win)); install('IS_REACT_ACT_ENVIRONMENT', true);
  const ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }; install('ResizeObserver', ResizeObserver); (win as any).ResizeObserver = ResizeObserver;
  win.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true, onchange: null });
  win.HTMLElement.prototype.scrollIntoView = () => {}; win.HTMLElement.prototype.scrollTo = () => {};
  const prefix = fileURLToPath(new URL('../.removal-context-test-', import.meta.url)), temp = await mkdtemp(prefix);
  const React = await import('react'), { createRoot } = await import('react-dom/client');
  const { ChakraProvider, defaultSystem } = await import('@chakra-ui/react');
  const root = createRoot(win.document.getElementById('root')!);
  try {
    await writeFile(`${temp}/kit.jsx`, `import React from 'react';
export const store={values:{},writes:0,reject:false};const listeners=new Set();
export function useSetting(key){const [,update]=React.useState(0);React.useEffect(()=>{const f=()=>update(x=>x+1);listeners.add(f);return()=>listeners.delete(f)},[]);return [store.values[key],v=>{if(store.reject)return false;store.values[key]=v;store.writes++;listeners.forEach(f=>f());return true},{isEnabled:true,isModified:false,reset(){}}];}
export function Section({title,children,defaultOpen=true}){const [open,setOpen]=React.useState(defaultOpen);return <section><button aria-expanded={open} onClick={()=>setOpen(!open)}>{title}</button>{open&&children}</section>}
export function FieldRow({label,children}){return <div data-field={label}>{label}{children}</div>}
export function Button({children,onClick,disabled}){return <button disabled={disabled} onClick={onClick}>{children}</button>}
export function Select({value,options,onChange}){return <select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}
export function TextInput({value,onChange}){return <input value={value} onChange={e=>onChange(e.target.value)}/>}
export function Switch({checked,onChange}){return <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>}
export const AssetPicker=TextInput,UIRefPicker=TextInput,ColorPicker=TextInput,NumberSlider=TextInput,SettingField=()=>null,ImagePreview=()=>null;
`);
    await writeFile(`${temp}/entry.ts`, `export {NotificationOrdering} from '../src/notification-editor';export {LevelAppearanceEditor,SharedPresentationEditor} from '../src/appearance-editor';export {AchievementEditor} from '../src/achievement-editor';export {ElementCssEditor} from '../src/element-css-editor';export {store} from './kit';`);
    await build({ entryPoints: [`${temp}/entry.ts`], outfile: `${temp}/compiled.mjs`, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react', 'react-dom', '@chakra-ui/react', 'postcss'], alias: { '@avg-studio/studio-ui': `${temp}/kit.jsx` }, logLevel: 'silent' });
    const { NotificationOrdering, LevelAppearanceEditor, SharedPresentationEditor, AchievementEditor, ElementCssEditor, store } = await import(pathToFileURL(`${temp}/compiled.mjs`).href);
    const settle = async (fn: () => void) => { await React.act(async () => fn()); await React.act(async () => { await new Promise(r => setTimeout(r, 60)); }); };
    const render = (component: any, props = {}) => settle(() => root.render(React.createElement(ChakraProvider, { value: defaultSystem }, React.createElement(component, props))));
    const button = (label: string) => [...win.document.querySelectorAll('button')].find(e => e.textContent === label)!;
    const menu = () => win.document.querySelector<HTMLElement>('[role="menu"][data-state="open"]');
    const option = (id: string) => [...win.document.querySelectorAll<HTMLElement>('.aw-object')].find(e => e.querySelector('small')?.textContent === id)!;
    const pointer = (el: HTMLElement, button = 0) => el.dispatchEvent(new win.MouseEvent('pointerdown', { bubbles: true, button }));
    const click = async (el: HTMLElement) => { assert.ok(el); const hover = new win.MouseEvent('pointermove', { bubbles: true }); Object.defineProperty(hover, 'pointerType', { value: 'mouse' }); await settle(() => { el.dispatchEvent(hover); pointer(el); }); await settle(() => el.click()); };
    const context = async (el: HTMLElement) => { assert.ok(el); await settle(() => { pointer(el, 2); el.dispatchEvent(new win.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 300, clientY: 250 })); }); };
    const item = () => menu()!.querySelector<HTMLElement>('[role="menuitem"]')!;
    const escape = () => settle(() => menu()!.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));

    store.values['main.notificationSort'] = [{ field: 'level', value: 'gold' }, { field: 'level', value: 'silver' }, { field: 'stage', value: 'unknown' }];
    await render(NotificationOrdering); assert.equal(store.writes, 0);
    const silver = [...win.document.querySelectorAll<HTMLElement>('[data-removal-context]')].find(e => e.dataset.removalContext?.includes('silver'))!;
    await context(silver); assert.equal(win.document.querySelectorAll('[role="menu"][data-state="open"]').length, 1, 'nested priority must not open the parent rule menu');
    await escape(); assert.equal(menu(), null); assert.equal(store.values['main.notificationSort'].length, 3);
    await context(silver); await click(item());
    assert.deepEqual(store.values['main.notificationSort'], [{ field: 'level', value: 'gold' }, { field: 'stage', value: 'unknown' }]);
    assert.ok(win.document.querySelector('[data-field="添加优先值"]'),'priority editing remains visible');
    store.reject = true; await context([...win.document.querySelectorAll<HTMLElement>('h3')].find(e=>e.textContent==='1. 阶段等级')!); await click(item());
    assert.equal(store.values['main.notificationSort'].length, 2); assert.match(win.document.querySelector('[role="alert"]')!.textContent!, /保存失败/);
    store.reject = false; await context([...win.document.querySelectorAll<HTMLElement>('h3')].find(e=>e.textContent==='1. 阶段等级')!); await click(item());
    assert.deepEqual(store.values['main.notificationSort'], [{ field: 'stage', value: 'unknown' }]);

    store.values['main.levels'] = [{ id: 'bronze', name: '铜' }, { id: 'silver', name: '银' }, { id: 'gold', name: '金' }];
    store.values['main.achievements'] = [{ id: 'a', name: '甲', levelId: 'bronze' }];
    await render(LevelAppearanceEditor);
    await context(option('gold')); await click(item());
    assert.deepEqual(store.values['main.levels'].map((r: any) => r.id), ['bronze', 'silver'], 'right click removes the pointed level, not the selected bronze');
    assert.ok(option('bronze'));
    await context(option('bronze')); assert.equal(item().getAttribute('aria-disabled'), 'true'); await escape();
    await context(option('silver')); await click(item());
    await context(option('bronze')); assert.equal(item().getAttribute('aria-disabled'), 'true'); await escape();

    store.values['main.appearances'] = [{ id: 'a', name: '默认方案', surface: 'card', isDefault: true }, { id: 'b', name: '备用方案', surface: 'card', isDefault: false }];
    store.values['main.elementCss'] = [{ id: 'owner-b', ownerKind: 'appearance', ownerId: 'b', achievementId: '', target: 'frame', surface: 'card', replace: false, css: 'color: red;' }, { id: 'other-b', ownerKind: 'stage', ownerId: 'b', achievementId: 'a', target: 'frame', surface: 'card', replace: false, css: 'color: blue;' }];
    await render(SharedPresentationEditor, { surface: 'card' });
    await context(option('a')); assert.equal(item().getAttribute('aria-disabled'), 'true'); await escape();
    await context(option('b')); await click(item());
    assert.deepEqual(store.values['main.appearances'].map((r: any) => r.id), ['a']);
    assert.deepEqual(store.values['main.elementCss'].map((r: any) => r.id), ['other-b'], 'only the removed scheme CSS owner is cleaned');

    store.values['main.achievements'].push({ id: 'b', name: '乙', levelId: 'bronze' });
    const oldRecords = JSON.stringify(store.values['main.elementCss']);
    await render(AchievementEditor);
    const achievement = [...win.document.querySelectorAll<HTMLElement>('[data-removal-context]')].find(e => e.dataset.removalContext?.includes('乙'))!;
    assert.ok(achievement.querySelector('.aw-object'));
    await context(achievement); await click(item());
    assert.equal(store.values['main.achievements'].length, 2, 'achievement context action must keep the existing confirmation step');
    await click(button('确认移除')); assert.deepEqual(store.values['main.achievements'].map((r: any) => r.id), ['a']);
    assert.equal(JSON.stringify(store.values['main.elementCss']), oldRecords);

    store.values['main.elementCss'].push({ id: 'local-css', ownerKind: 'appearance', ownerId: 'a', achievementId: '', target: 'background', surface: 'card', replace: false, css: 'color: red;' });
    await render(ElementCssEditor, { owner: { ownerKind: 'appearance', ownerId: 'a', achievementId: '' }, surface: 'card' });

    const textarea = win.document.querySelector('textarea')!;
    const event = new win.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    await settle(() => textarea.dispatchEvent(event)); assert.equal(event.defaultPrevented, false); assert.equal(menu(), null, 'text editing retains its native context menu');
    await context(win.document.querySelector<HTMLElement>('[data-removal-context]')!); await click(item());
    assert.deepEqual(store.values['main.elementCss'].map((r: any) => r.id), ['other-b']);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, value] of previous) { if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key); }
    assert.ok(temp.startsWith(prefix)); await rm(temp, { recursive: true, force: true });
  }
});
