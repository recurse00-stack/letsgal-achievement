import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { presetStages, DEFAULT_LEVELS } from '../src/model.ts';

test('stage editor keeps inherited parameters collapsed and stores a card override without touching popup', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  const temp = await mkdtemp(fileURLToPath(new URL('../.presentation-test-', import.meta.url)));
  const React = await import('react'); const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await writeFile(`${temp}/kit.jsx`, `import React from 'react';
export const store={values:{},writes:[],reject:{}};const listeners=new Set();
export function useSetting(key){const [,update]=React.useState(0);React.useEffect(()=>{const f=()=>update(x=>x+1);listeners.add(f);return()=>listeners.delete(f)},[]);return [store.values[key],value=>{if(store.reject[key]>0){store.reject[key]--;return false;}store.values[key]=value;store.writes.push(key);listeners.forEach(f=>f());return true}];}
export function Section({title,children,defaultOpen=true}){const [open,setOpen]=React.useState(defaultOpen);return <section><button onClick={()=>setOpen(!open)}>{title}</button>{open&&children}</section>}
export function FieldRow({label,children}){return <label>{label}{children}</label>}
export function Button({children,onClick,disabled}){return <button disabled={disabled} onClick={onClick}>{children}</button>}
export function Select({value,options,onChange}){return <select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}
export function Switch({checked,onChange}){return <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>}
export function TextInput({value,onChange}){return <input type="text" value={value} onChange={e=>onChange(e.target.value)}/>}
export const AssetPicker=TextInput,UIRefPicker=TextInput,ColorPicker=TextInput,NumberSlider=TextInput;
export const SettingField=()=>null;
`);
    await writeFile(`${temp}/entry.ts`, `export {StagePresentationEditor} from '../src/stage-presentation-editor';export {SharedPresentationEditor} from '../src/appearance-editor';export {store} from './kit';`);
    await build({ entryPoints: [`${temp}/entry.ts`], outfile: `${temp}/compiled.mjs`, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react', 'react-dom', 'postcss'], alias: { '@avg-studio/studio-ui': `${temp}/kit.jsx` }, logLevel: 'silent' });
    const { StagePresentationEditor, SharedPresentationEditor, store } = await import(pathToFileURL(`${temp}/compiled.mjs`).href);
    store.values['main.appearances'] = [{ id: 'card', name: '卡片通用', surface: 'card', isDefault: true, backgroundMode: 'color', backgroundColor: 'red' }];
    const stage = presetStages('')[2];
    await React.act(async () => root.render(React.createElement(StagePresentationEditor, { stage, item: { id: 'a', name: 'A', description: '', icon: '', levelId: 'gold' }, levels: DEFAULT_LEVELS })));
    const button = (text: string) => [...dom.window.document.querySelectorAll('button')].find(n => n.textContent === text)!;
    const click = async (text: string) => { assert.ok(button(text), text); await React.act(async () => button(text).click()); };
    await click('阶段表现'); await click('卡片展示');
    assert.match(dom.window.document.body.textContent!, /卡片通用/);
    assert.equal(dom.window.document.querySelectorAll('input').length, 0, 'inherited values must not expose another full editable form');
    assert.equal(store.writes.length, 0, 'opening folded panels must never write settings');
    await click('单独设置内容');
    const select = [...dom.window.document.querySelectorAll('label')].find(n => n.firstChild?.textContent === '名称')!.querySelector('select')!;
    await React.act(async () => { select.value = 'custom'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    assert.equal(store.values['main.stagePresentations'].length, 1);
    assert.equal(store.values['main.stagePresentations'][0].surface, 'card');
    assert.equal(store.values['main.stagePresentations'][0].contentOverride, true);
    assert.ok(dom.window.document.querySelector('input[type="text"]'));
    await click('恢复沿用内容');
    assert.equal(store.values['main.stagePresentations'][0].contentOverride, false);
    assert.equal(dom.window.document.querySelectorAll('input[type="text"]').length, 0);
    await click('单独调整外观或 CSS');
    const toggle = [...dom.window.document.querySelectorAll('label')].find(n => n.firstChild?.textContent === '单独配置背景')!.querySelector('input')!;
    await React.act(async () => toggle.click());
    const record = store.values['main.stagePresentations'][0];
    assert.equal(record.overrideBackground, true); assert.equal(record.backgroundColor, 'red');
    assert.equal(store.values['main.stagePresentations'].some((p: any) => p.surface === 'popup'), false);
    store.values['main.appearances'].push({ id: 'popup', name: '浮现通用', surface: 'popup', isDefault: true, ui: '', durationMs: 0 });
    store.values['main.popup'] = 'ui:@mixing-entropy.achievement/custom-popup';
    store.values['main.durationMs'] = 4700;
    const writesBefore = store.writes.length;
    await React.act(async () => root.render(React.createElement(SharedPresentationEditor, { surface: 'popup' })));
    await click('通用浮现'); await click('界面与时长');
    const fieldValue = (label: string) => [...dom.window.document.querySelectorAll('label')].find(n => n.firstChild?.textContent === label)!.querySelector('input')!.value;
    assert.equal(fieldValue('浮现界面'), 'mixing-entropy.achievement/custom-popup');
    assert.equal(fieldValue('时长（毫秒）'), '4700', 'inherited popup values must show the actual fallback');
    assert.equal(store.writes.length, writesBefore);
    // Removing either kind of scheme clears all of its own CSS surfaces only.
    for (const surface of ['card', 'popup']) {
      const own = { ownerKind: 'appearance', ownerId: 'remove_me', achievementId: '', target: 'frame', css: 'color: red;', replace: false };
      const disposableCss = ['card', 'popup', 'both'].map(s => ({ ...own, id: 'remove_' + s, surface: s }));
      const retainedCss = [
        { ...own, id: 'other_scheme', ownerId: 'keep', surface },
        { ...own, id: 'same_id_stage', ownerKind: 'stage', achievementId: 'a', surface },
        { ...own, id: 'same_id_default', ownerKind: 'defaultStage', surface },
        { ...own, id: 'other_owner', achievementId: 'a', surface },
      ];
      const retained = { id: 'keep', name: '保留方案', surface, isDefault: true };
      const disposable = { id: 'remove_me', name: '待删方案', surface, isDefault: false };
      const stageRecords = JSON.stringify(store.values['main.stagePresentations']);
      for (const rejection of ['', 'main.appearances', 'main.elementCss']) {
        store.values['main.appearances'] = [disposable, retained];
        store.values['main.elementCss'] = [...disposableCss, ...retainedCss];
        store.reject = rejection ? { [rejection]: 1 } : {};
        const start = store.writes.length;
        await React.act(async () => root.render(React.createElement(SharedPresentationEditor, { key: surface + rejection, surface })));
        await click(surface === 'card' ? '通用卡片展示' : '通用浮现');
        await click('删除此方案');
        assert.deepEqual(store.values['main.appearances'], rejection ? [disposable, retained] : [retained]);
        assert.deepEqual(store.values['main.elementCss'], rejection ? [...disposableCss, ...retainedCss] : retainedCss);
        assert.equal(JSON.stringify(store.values['main.stagePresentations']), stageRecords);
        assert.ok(store.writes.slice(start).every((key: string) => ['main.appearances', 'main.elementCss'].includes(key)));
        if (rejection) assert.ok(dom.window.document.querySelector('[role="alert"]'));
        else assert.equal(button('删除此方案').disabled, true, 'remaining default stays protected');
      }
    }
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, value] of saved) { if (value) Object.defineProperty(globalThis, key, value); else delete (globalThis as any)[key]; }
    await rm(temp, { recursive: true, force: true });
  }
});
