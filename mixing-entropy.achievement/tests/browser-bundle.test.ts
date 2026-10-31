import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build, loadConfigFromFile } from 'vite';

// Use the real Vite configuration, not Node's direct import of PostCSS:
// direct imports have process available and miss browser-only failures.
for (const mode of ['production', 'studio']) {
  test(`${mode} CSS bundle parses, scopes animations and reports errors without Node globals`, async () => {
    const loaded = await loadConfigFromFile({ command: 'build', mode }, fileURLToPath(new URL('../vite.config.ts', import.meta.url)));
    assert.ok(loaded);
    const result = await build({
      ...loaded.config,
      root: fileURLToPath(new URL('../', import.meta.url)),
      configFile: false,
      mode,
      logLevel: 'silent',
      build: {
        ...loaded.config.build,
        write: false,
        sourcemap: false,
        lib: {
          entry: fileURLToPath(new URL('../src/element-css.ts', import.meta.url)),
          name: 'CssProbe',
          formats: ['iife'],
        },
      },
    });
    assert.ok(!('on' in result));
    const outputs = Array.isArray(result) ? result : [result];
    const chunk = outputs.flatMap(output => output.output).find(output => output.type === 'chunk');
    assert.ok(chunk && chunk.type === 'chunk');
    const css = runInNewContext(`${chunk.code}\nCssProbe;`, {}, { timeout: 2000 });
    assert.equal(css.parseElementCss('color:red; &:hover{opacity:.5}').nodes.length, 2);
    const rewritten = css.rewriteCss('animation:spin 1s; @keyframes spin{to{transform:rotate(1turn)}}', '[data-card]', 'scope');
    assert.match(rewritten.text, /animation:scope-spin/);
    assert.match(rewritten.text, /@keyframes scope-spin/);
    for (const invalid of ['color: "unterminated', '&:hover{color:red', '/* unclosed']) {
      assert.throws(() => css.parseElementCss(invalid), (error: any) => error.name === 'CssSyntaxError' && !/process is not defined/.test(error.message));
    }
    assert.throws(() => css.parseElementCss('@import "x";'), /这里只支持/);
    assert.equal(/\bprocess\s*\.\s*env\b/.test(chunk.code), false, 'CSS bundle still reads process.env');
  });
}

test('both shipped entry bundles have no residual environment reads or native Node access', async () => {
  for (const entry of ['index.mjs', 'studio.js']) {
    const code = await readFile(new URL(`../dist/${entry}`, import.meta.url), 'utf8');
    assert.equal(/\bprocess\s*\.\s*env\b/.test(code), false, `${entry} still reads process.env`);
    assert.equal(/\b(?:require\s*\(|ctx\s*\.\s*native\s*\.\s*node\b)/.test(code), false, `${entry} requires Node access`);
  }
});
