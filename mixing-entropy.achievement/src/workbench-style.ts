export const workbenchStyle = `
.aw-root{container-type:inline-size;color:var(--fg-primary);font:inherit;min-width:0;line-height:1.55}
.aw-root *{box-sizing:border-box}.aw-root button,.aw-root input,.aw-root textarea{font:inherit}
.aw-root button{cursor:pointer}.aw-root button:disabled{cursor:not-allowed;opacity:.5}
.aw-root :focus-visible{outline:2px solid var(--accent,#c44840);outline-offset:3px}
.aw-root h2,.aw-root h3,.aw-root p{margin:0 0 10px}.aw-root h2{font-size:1.2em}.aw-root h3{font-size:1em}
.aw-top{position:sticky;top:0;z-index:5;background:var(--bg-canvas);border-bottom:1px solid var(--border-default);padding:12px 0}
.aw-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 16px}.aw-tabs button{border:1px solid var(--border-default);border-radius:7px;padding:8px 15px;background:var(--bg-subtle);color:var(--fg-primary)}
.aw-tabs button[aria-current]{border-color:var(--accent,#c44840);box-shadow:inset 0 -3px var(--accent,#c44840)}
.aw-stage-picker{margin:8px 0 16px}.aw-stage-picker>.aw-input{margin-bottom:8px}
.aw-stage-strip{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start}
.aw-stage-blocks{min-width:0;margin:0;padding:4px}.aw-stage-blocks>div{flex:0 0 auto;max-width:100%;min-width:0}
.aw-stage-blocks button{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aw-stage-strip[data-collapsed="true"] .aw-stage-blocks{flex-wrap:nowrap;overflow:hidden}
.aw-stage-toggle{margin-top:4px;padding:8px 10px;border:1px solid var(--border-default);border-radius:7px;background:var(--bg-subtle);color:var(--fg-primary);white-space:nowrap}
.aw-scale-controls{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-bottom:8px;color:var(--fg-secondary);font:inherit;font-size:.85em}
.aw-scale-controls input{width:110px;accent-color:var(--accent,#c44840)}.aw-scale-controls button{border:1px solid var(--border-default);border-radius:6px;background:var(--bg-subtle);color:var(--fg-primary);padding:4px 8px;cursor:pointer}
.aw-scale-controls button:disabled{opacity:.5;cursor:not-allowed}.aw-scale-controls output{min-width:3.5em;text-align:center}
.aw-save{display:flex;gap:8px;flex-wrap:wrap;font-size:.82em;color:var(--fg-secondary)}
.aw-workspace{display:grid;grid-template-columns:210px minmax(0,1fr);gap:18px;align-items:start}.aw-has-preview{grid-template-columns:210px minmax(0,1fr) 230px}.aw-stage-grid{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:14px;align-items:start}.aw-stage-grid>div{min-width:0}
.aw-list-column,.aw-editor,.aw-preview{min-width:0}.aw-object-list{padding:10px;border:1px solid var(--border-subtle);border-radius:9px;background:var(--bg-subtle)}
.aw-object-list h3{display:flex;justify-content:space-between}.aw-list{display:grid;gap:5px}.aw-object{display:block;text-align:left;width:100%;padding:10px;border:1px solid var(--border-subtle);border-radius:6px;color:var(--fg-primary);background:var(--bg-canvas)}
.aw-object strong,.aw-object small{display:block;overflow-wrap:anywhere}.aw-object small{font-size:.75em;color:var(--fg-secondary)}.aw-object[aria-current]{border-color:var(--accent,#c44840);background:var(--bg-selected,var(--bg-muted))}
.aw-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}.aw-note{color:var(--fg-secondary);font-size:.85em;overflow-wrap:anywhere}.aw-section{margin-bottom:18px;padding:14px;border:1px solid var(--border-subtle);border-radius:8px}.aw-section>.aw-section{border:0;padding:0}.aw-section>header{display:flex;justify-content:space-between;gap:10px}
.aw-field{display:grid;grid-template-columns:minmax(100px,30%) minmax(0,1fr);gap:14px;align-items:start;padding:12px 0;border-bottom:1px solid var(--border-subtle)}.aw-field:last-child{border-bottom:0}.aw-label{font-weight:600}.aw-label p{font-weight:400}.aw-field fieldset{border:0;padding:0;margin:0;min-width:0}
.aw-input{display:block;width:100%;min-width:0;padding:9px 12px;border:1px solid var(--border-default);border-radius:6px;color:var(--fg-primary);background:var(--bg-canvas)}textarea.aw-input{resize:vertical}.aw-preview{border:1px solid var(--border-subtle);padding:14px;border-radius:9px;overflow-wrap:anywhere}.aw-preview img{max-width:100%;max-height:100px;object-fit:contain}.aw-preview-card{padding:16px;border:1px dashed var(--border-default);border-radius:8px}.aw-mobile{display:none}.aw-scope{padding:10px;border-left:3px solid var(--accent,#c44840);background:var(--bg-subtle);margin:10px 0}.aw-css-grid{display:grid;grid-template-columns:145px minmax(0,1fr);gap:12px}.aw-css-code{min-height:220px;font-family:monospace!important}.aw-root pre{white-space:pre-wrap;overflow-wrap:anywhere}.aw-drag{cursor:grab!important;border:1px solid var(--border-default);background:var(--bg-subtle);color:var(--fg-primary);padding:6px;border-radius:4px}
@container (max-width:999px){.aw-has-preview{grid-template-columns:190px minmax(0,1fr)}.aw-preview{grid-column:2}.aw-stage-grid{display:block}.aw-stage-grid .aw-preview{margin-top:14px}.aw-field{grid-template-columns:1fr;gap:5px}}
@container (max-width:699px){.aw-workspace,.aw-has-preview{display:block}.aw-workspace .aw-editor,.aw-workspace .aw-preview{display:none}.aw-show-detail .aw-list-column{display:none}.aw-show-detail .aw-editor,.aw-show-detail .aw-preview{display:block}.aw-mobile{display:block;margin-bottom:12px}.aw-preview{margin-top:14px}.aw-css-grid{grid-template-columns:1fr}.aw-top{position:static}.aw-tabs button{padding:7px 10px}}
`;
