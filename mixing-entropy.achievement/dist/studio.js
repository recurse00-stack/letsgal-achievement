import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useSetting, Section, FieldRow, ColorPicker, AssetPicker, Select as Select$1, TextInput, Switch, Button, SettingField, UIRefPicker, NumberSlider, ParamField, useParam, useInspectorEnvironment, Panel } from "@avg-studio/studio-ui";
import { useState, useRef, useEffect } from "react";
import { createListCollection, Select, Portal, Menu } from "@chakra-ui/react";
const CARD_DEFAULTS = {
  backgroundMode: "template",
  backgroundColor: "",
  backgroundImage: "",
  backgroundFit: "cover",
  backgroundColorEnd: "",
  backgroundAngle: 135,
  backgroundX: 50,
  backgroundY: 50,
  frameMode: "template",
  frameImage: "",
  frameColor: "",
  frameWidth: 3,
  frameRadius: 12,
  sliceTop: 16,
  sliceRight: 16,
  sliceBottom: 16,
  sliceLeft: 16,
  frameRepeat: "stretch",
  iconEffect: "none",
  frameEffect: "none",
  effectTrigger: "loop",
  effectDuration: 1800
};
const options = {
  backgroundMode: ["template", "color", "image", "gradient"],
  backgroundFit: ["cover", "contain", "fill", "tile"],
  frameRepeat: ["stretch", "repeat", "round"],
  frameMode: ["template", "none", "line", "nineSlice"],
  iconEffect: ["none", "float", "rotate", "pulse"],
  frameEffect: ["none", "pulse", "glow"],
  effectTrigger: ["loop", "enter", "hover"]
};
function cardAppearance(row) {
  const result2 = { ...CARD_DEFAULTS };
  for (const key of Object.keys(CARD_DEFAULTS)) {
    const value = row[key];
    if (value === void 0) continue;
    if (typeof value !== typeof CARD_DEFAULTS[key]) throw Error(`阶段外观 ${key} 类型无效`);
    if (typeof value === "number") {
      const min = key === "effectDuration" ? 200 : 0;
      const max = key === "effectDuration" ? 6e4 : key.startsWith("slice") ? 4096 : key === "backgroundAngle" ? 360 : key === "backgroundX" || key === "backgroundY" ? 100 : 256;
      if (!Number.isFinite(value) || value < min || value > max) throw Error(`阶段外观 ${key} 超出范围 ${min}–${max}`);
    }
    if (typeof value === "string" && (value.length > 1e4 || options[key] && !options[key].includes(value))) throw Error(`阶段外观 ${key} 无效`);
    Object.assign(result2, { [key]: value });
  }
  return result2;
}
function optionalAppearance(row) {
  return Object.keys(CARD_DEFAULTS).some((key) => key in row) ? cardAppearance(row) : {};
}
function parsePresetOptions(row) {
  const result2 = {};
  for (const [key, values] of Object.entries({ surface: ["card", "popup"], nameMode: ["stage", "none"], descriptionMode: ["stage", "none"], iconMode: ["stage", "none", "unknown"], levelVisibility: ["stage", "show", "hide"], stageNameVisibility: ["stage", "show", "hide"] })) {
    if (row[key] !== void 0) {
      if (!values.includes(String(row[key]))) throw Error("通用表现方案选项无效");
      result2[key] = row[key];
    }
  }
  if (row.isDefault !== void 0) {
    if (typeof row.isDefault !== "boolean") throw Error("默认方案标记无效");
    result2.isDefault = row.isDefault;
  }
  if (row.ui !== void 0) {
    if (typeof row.ui !== "string" || row.ui && !/^(?:ui:)?(?:@?[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(row.ui)) throw Error("通用浮现界面引用无效");
    result2.ui = row.ui;
  }
  if (row.durationMs !== void 0) {
    if (typeof row.durationMs !== "number" || !Number.isFinite(row.durationMs) || row.durationMs !== 0 && (row.durationMs < 300 || row.durationMs > 6e4)) throw Error("通用浮现时长无效");
    result2.durationMs = row.durationMs;
  }
  return result2;
}
function presentationPreset(binding, presets, levelId = "", surface) {
  const allowed = presets.filter((p) => !surface || !p.surface || p.surface === surface);
  if (binding.appearanceSource === "default") return allowed.find((p) => p.isDefault);
  const id2 = binding.appearanceSource === "level" ? levelId : binding.appearanceSource === "preset" ? binding.appearanceId : "";
  return id2 ? allowed.find((p) => p.id === id2) : void 0;
}
const APPEARANCE_GROUPS = {
  background: ["backgroundMode", "backgroundColor", "backgroundImage", "backgroundFit", "backgroundColorEnd", "backgroundAngle", "backgroundX", "backgroundY"],
  frame: ["frameMode", "frameImage", "frameColor", "frameWidth", "frameRadius", "sliceTop", "sliceRight", "sliceBottom", "sliceLeft", "frameRepeat"],
  effects: ["iconEffect", "frameEffect", "effectTrigger", "effectDuration"]
};
function resolveAppearance(stage, presets, levelAppearanceId = "", surface) {
  if (!stage.appearanceSource || stage.appearanceSource === "local") return cardAppearance(stage);
  const base = cardAppearance(presentationPreset(stage, presets, levelAppearanceId, surface) ?? {});
  const own = cardAppearance(stage);
  for (const [group, enabled] of [["background", stage.overrideBackground], ["frame", stage.overrideFrame], ["effects", stage.overrideEffects]]) {
    if (enabled) for (const key of APPEARANCE_GROUPS[group]) Object.assign(base, { [key]: own[key] });
  }
  return base;
}
function copyAppearanceGroup(value, group) {
  const full = cardAppearance(value);
  return Object.fromEntries(APPEARANCE_GROUPS[group].map((key) => [key, full[key]]));
}
function parseAppearanceBinding(row) {
  const result2 = {};
  if (row.appearanceSource !== void 0) {
    if (!["local", "preset", "level", "default"].includes(String(row.appearanceSource))) throw Error("阶段外观来源无效");
    result2.appearanceSource = row.appearanceSource;
  }
  if (row.appearanceId !== void 0) {
    if (typeof row.appearanceId !== "string" || row.appearanceId && !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(row.appearanceId)) throw Error("共用外观编号无效");
    result2.appearanceId = row.appearanceId;
  }
  for (const key of ["overrideBackground", "overrideFrame", "overrideEffects"]) if (row[key] !== void 0) {
    if (typeof row[key] !== "boolean") throw Error("外观覆盖开关必须为布尔值");
    result2[key] = row[key];
  }
  return result2;
}
function appearanceInUse(id2, levels, stages) {
  return levels.some((l) => l.appearanceId === id2 || l.popupAppearanceId === id2) || stages.some((s) => s.appearanceSource === "preset" && s.appearanceId === id2);
}
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
  if (typeof f == "function") {
    var a = function a2() {
      if (this instanceof a2) {
        return Reflect.construct(f, arguments, this.constructor);
      }
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
var picocolors_browser = { exports: {} };
var x = String;
var create = function() {
  return { isColorSupported: false, reset: x, bold: x, dim: x, italic: x, underline: x, inverse: x, hidden: x, strikethrough: x, black: x, red: x, green: x, yellow: x, blue: x, magenta: x, cyan: x, white: x, gray: x, bgBlack: x, bgRed: x, bgGreen: x, bgYellow: x, bgBlue: x, bgMagenta: x, bgCyan: x, bgWhite: x, blackBright: x, redBright: x, greenBright: x, yellowBright: x, blueBright: x, magentaBright: x, cyanBright: x, whiteBright: x, bgBlackBright: x, bgRedBright: x, bgGreenBright: x, bgYellowBright: x, bgBlueBright: x, bgMagentaBright: x, bgCyanBright: x, bgWhiteBright: x };
};
picocolors_browser.exports = create();
picocolors_browser.exports.createColors = create;
var picocolors_browserExports = picocolors_browser.exports;
const __viteBrowserExternal = {};
const __viteBrowserExternal$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: __viteBrowserExternal
}, Symbol.toStringTag, { value: "Module" }));
const require$$2 = /* @__PURE__ */ getAugmentedNamespace(__viteBrowserExternal$1);
let pico = picocolors_browserExports;
let terminalHighlight$1 = require$$2;
let CssSyntaxError$3 = class CssSyntaxError extends Error {
  constructor(message, line, column, source, file, plugin2) {
    super(message);
    this.name = "CssSyntaxError";
    this.reason = message;
    if (file) {
      this.file = file;
    }
    if (source) {
      this.source = source;
    }
    if (plugin2) {
      this.plugin = plugin2;
    }
    if (typeof line !== "undefined" && typeof column !== "undefined") {
      if (typeof line === "number") {
        this.line = line;
        this.column = column;
      } else {
        this.line = line.line;
        this.column = line.column;
        this.endLine = column.line;
        this.endColumn = column.column;
      }
    }
    this.setMessage();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CssSyntaxError);
    }
  }
  setMessage() {
    this.message = this.plugin ? this.plugin + ": " : "";
    this.message += this.file ? this.file : "<css input>";
    if (typeof this.line !== "undefined") {
      this.message += ":" + this.line + ":" + this.column;
    }
    this.message += ": " + this.reason;
  }
  showSourceCode(color) {
    if (!this.source) return "";
    let css = this.source;
    if (color == null) color = pico.isColorSupported;
    let aside = (text2) => text2;
    let mark = (text2) => text2;
    let highlight = (text2) => text2;
    if (color) {
      let { bold, gray, red } = pico.createColors(true);
      mark = (text2) => bold(red(text2));
      aside = (text2) => gray(text2);
      if (terminalHighlight$1) {
        highlight = (text2) => terminalHighlight$1(text2);
      }
    }
    let lines = css.split(/\r?\n/);
    let start = Math.max(this.line - 3, 0);
    let end = Math.min(this.line + 2, lines.length);
    let maxWidth = String(end).length;
    return lines.slice(start, end).map((line, index) => {
      let number = start + 1 + index;
      let gutter = " " + (" " + number).slice(-maxWidth) + " | ";
      if (number === this.line) {
        if (line.length > 160) {
          let padding = 20;
          let subLineStart = Math.max(0, this.column - padding);
          let subLineEnd = Math.max(
            this.column + padding,
            this.endColumn + padding
          );
          let subLine = line.slice(subLineStart, subLineEnd);
          let spacing2 = aside(gutter.replace(/\d/g, " ")) + line.slice(0, Math.min(this.column - 1, padding - 1)).replace(/[^\t]/g, " ");
          return mark(">") + aside(gutter) + highlight(subLine) + "\n " + spacing2 + mark("^");
        }
        let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, this.column - 1).replace(/[^\t]/g, " ");
        return mark(">") + aside(gutter) + highlight(line) + "\n " + spacing + mark("^");
      }
      return " " + aside(gutter) + highlight(line);
    }).join("\n");
  }
  toString() {
    let code = this.showSourceCode();
    if (code) {
      code = "\n\n" + code + "\n";
    }
    return this.name + ": " + this.message + code;
  }
};
var cssSyntaxError = CssSyntaxError$3;
CssSyntaxError$3.default = CssSyntaxError$3;
const AT_NAME_END = /[\t\n\f\r "#'()/;[\\\]{}]/;
const DEFAULT_RAW = {
  after: "\n",
  beforeClose: "\n",
  beforeComment: "\n",
  beforeDecl: "\n",
  beforeOpen: " ",
  beforeRule: "\n",
  colon: ": ",
  commentLeft: " ",
  commentRight: " ",
  emptyBody: "",
  indent: "    ",
  semicolon: false
};
function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}
function atruleStart(str, node2) {
  let name = "@" + node2.name;
  let params = node2.params ? str.rawValue(node2, "params") : "";
  let afterName = node2.raws.afterName;
  if (typeof afterName === "undefined") {
    afterName = params ? " " : "";
  } else if (afterName === "" && params && !AT_NAME_END.test(params[0])) {
    afterName = " ";
  }
  return name + afterName + params;
}
function isCustomProperty(node2) {
  if (!node2.prop.startsWith("--")) return false;
  let before = node2.raws.before;
  return typeof before === "undefined" || !/[^\s;]$/.test(before);
}
function pushBody(str, stack, node2) {
  let nodes = node2.nodes;
  let last = nodes.length - 1;
  while (last > 0) {
    if (nodes[last].type !== "comment") break;
    last -= 1;
  }
  let semicolon = str.raw(node2, "semicolon");
  let isDocument = node2.type === "document";
  for (let i = nodes.length - 1; i >= 0; i--) {
    let child = nodes[i];
    let childSemicolon = last !== i || semicolon;
    if (!childSemicolon && i < nodes.length - 1 && (child.type === "atrule" && !child.nodes || child.type === "decl" && isCustomProperty(child))) {
      childSemicolon = true;
    }
    stack.push({
      document: isDocument,
      node: child,
      semicolon: childSemicolon
    });
  }
}
function pushBlock(str, stack, node2, start) {
  let between = str.raw(node2, "between", "beforeOpen");
  str.builder(start + between + "{", node2, "start");
  let hasNodes = node2.nodes && node2.nodes.length;
  let close = () => {
    let after = hasNodes ? str.raw(node2, "after") : str.raw(node2, "after", "emptyBody");
    if (after) str.builder(after);
    str.builder("}", node2, "end");
    if (node2.type === "rule" && node2.raws.ownSemicolon) {
      str.builder(node2.raws.ownSemicolon, node2, "end");
    }
  };
  if (hasNodes) {
    stack.push(close);
    pushBody(str, stack, node2);
  } else {
    close();
  }
}
let Stringifier$2 = class Stringifier {
  constructor(builder) {
    this.builder = builder;
  }
  atrule(node2, semicolon) {
    let start = atruleStart(this, node2);
    if (node2.nodes) {
      this.block(node2, start);
    } else {
      let end = (node2.raws.between || "") + (semicolon ? ";" : "");
      this.builder(start + end, node2);
    }
  }
  beforeAfter(node2, detect) {
    let value;
    if (node2.type === "decl") {
      value = this.raw(node2, null, "beforeDecl");
    } else if (node2.type === "comment") {
      value = this.raw(node2, null, "beforeComment");
    } else if (detect === "before") {
      value = this.raw(node2, null, "beforeRule");
    } else {
      value = this.raw(node2, null, "beforeClose");
    }
    let buf = node2.parent;
    let depth = 0;
    while (buf && buf.type !== "root") {
      depth += 1;
      buf = buf.parent;
    }
    if (value.includes("\n")) {
      let indent = this.raw(node2, null, "indent");
      if (indent.length) {
        for (let step = 0; step < depth; step++) value += indent;
      }
    }
    return value;
  }
  block(node2, start) {
    let between = this.raw(node2, "between", "beforeOpen");
    this.builder(start + between + "{", node2, "start");
    let after;
    if (node2.nodes && node2.nodes.length) {
      this.body(node2);
      after = this.raw(node2, "after");
    } else {
      after = this.raw(node2, "after", "emptyBody");
    }
    if (after) this.builder(after);
    this.builder("}", node2, "end");
  }
  body(node2) {
    let proto = Stringifier.prototype;
    let expandable = ["atrule", "block", "body", "rule", "stringify"].every(
      (method) => this[method] === proto[method]
    );
    let stack = [];
    pushBody(this, stack, node2);
    while (stack.length > 0) {
      let entry = stack.pop();
      if (typeof entry === "function") {
        entry();
        continue;
      }
      let child = entry.node;
      let before = this.raw(child, "before");
      if (before) {
        this.builder(before);
      }
      if (expandable && child.type === "rule") {
        pushBlock(this, stack, child, this.rawValue(child, "selector"));
      } else if (expandable && child.type === "atrule" && child.nodes) {
        pushBlock(this, stack, child, atruleStart(this, child));
      } else {
        this.stringify(child, entry.semicolon);
      }
    }
  }
  comment(node2) {
    let left = this.raw(node2, "left", "commentLeft");
    let right = this.raw(node2, "right", "commentRight");
    this.builder("/*" + left + node2.text + right + "*/", node2);
  }
  decl(node2, semicolon) {
    let raws = node2.raws;
    let between = this.raw(node2, "between", "colon");
    let string = node2.prop + between + this.rawValue(node2, "value");
    if (node2.important) {
      string += raws.important || " !important";
    }
    if (semicolon) string += ";";
    this.builder(string, node2);
  }
  document(node2) {
    this.body(node2);
  }
  raw(node2, own, detect) {
    let value;
    if (!detect) detect = own;
    if (own) {
      value = node2.raws[own];
      if (typeof value !== "undefined") return value;
    }
    let parent = node2.parent;
    if (detect === "before") {
      if (!parent || parent.type === "root" && parent.first === node2) {
        return "";
      }
      if (parent && parent.type === "document") {
        return "";
      }
    }
    if (!parent) return DEFAULT_RAW[detect];
    let root2 = node2.root();
    let cache = root2.rawCache || (root2.rawCache = {});
    if (typeof cache[detect] !== "undefined") {
      return cache[detect];
    }
    if (detect === "before" || detect === "after") {
      return this.beforeAfter(node2, detect);
    } else {
      let method = "raw" + capitalize(detect);
      if (this[method]) {
        value = this[method](root2, node2);
      } else {
        root2.walk((i) => {
          value = i.raws[own];
          if (typeof value !== "undefined") return false;
        });
      }
    }
    if (typeof value === "undefined") value = DEFAULT_RAW[detect];
    cache[detect] = value;
    return value;
  }
  rawBeforeClose(root2) {
    let value;
    root2.walk((i) => {
      if (i.nodes && i.nodes.length > 0) {
        if (typeof i.raws.after !== "undefined") {
          value = i.raws.after;
          if (value.includes("\n")) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      }
    });
    if (value) value = value.replace(/\S/g, "");
    return value;
  }
  rawBeforeComment(root2, node2) {
    let value;
    root2.walkComments((i) => {
      if (typeof i.raws.before !== "undefined") {
        value = i.raws.before;
        if (value.includes("\n")) {
          value = value.replace(/[^\n]+$/, "");
        }
        return false;
      }
    });
    if (typeof value === "undefined") {
      value = this.raw(node2, null, "beforeDecl");
    } else if (value) {
      value = value.replace(/\S/g, "");
    }
    return value;
  }
  rawBeforeDecl(root2, node2) {
    let value;
    root2.walkDecls((i) => {
      if (typeof i.raws.before !== "undefined") {
        value = i.raws.before;
        if (value.includes("\n")) {
          value = value.replace(/[^\n]+$/, "");
        }
        return false;
      }
    });
    if (typeof value === "undefined") {
      value = this.raw(node2, null, "beforeRule");
    } else if (value) {
      value = value.replace(/\S/g, "");
    }
    return value;
  }
  rawBeforeOpen(root2) {
    let value;
    root2.walk((i) => {
      if (i.type !== "decl") {
        value = i.raws.between;
        if (typeof value !== "undefined") return false;
      }
    });
    return value;
  }
  rawBeforeRule(root2) {
    let value;
    root2.walk((i) => {
      if (i.nodes && (i.parent !== root2 || root2.first !== i)) {
        if (typeof i.raws.before !== "undefined") {
          value = i.raws.before;
          if (value.includes("\n")) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      }
    });
    if (value) value = value.replace(/\S/g, "");
    return value;
  }
  rawColon(root2) {
    let value;
    root2.walkDecls((i) => {
      if (typeof i.raws.between !== "undefined") {
        value = i.raws.between.replace(/[^\s:]/g, "");
        return false;
      }
    });
    return value;
  }
  rawEmptyBody(root2) {
    let value;
    root2.walk((i) => {
      if (i.nodes && i.nodes.length === 0) {
        value = i.raws.after;
        if (typeof value !== "undefined") return false;
      }
    });
    return value;
  }
  rawIndent(root2) {
    if (root2.raws.indent) return root2.raws.indent;
    let value;
    root2.walk((i) => {
      let p = i.parent;
      if (p && p !== root2 && p.parent && p.parent === root2) {
        if (typeof i.raws.before !== "undefined") {
          let parts = i.raws.before.split("\n");
          value = parts[parts.length - 1];
          value = value.replace(/\S/g, "");
          return false;
        }
      }
    });
    return value;
  }
  rawSemicolon(root2) {
    let value;
    root2.walk((i) => {
      if (i.nodes && i.nodes.length && i.last.type === "decl") {
        value = i.raws.semicolon;
        if (typeof value !== "undefined") return false;
      }
    });
    return value;
  }
  rawValue(node2, prop) {
    let value = node2[prop];
    let raw = node2.raws[prop];
    if (raw && raw.value === value) {
      return raw.raw;
    }
    return value;
  }
  root(node2) {
    let inDocument = node2.parent && node2.parent.type === "document";
    if (!inDocument && node2.source && node2.source.input.hasBOM) {
      this.builder("\uFEFF", node2, "start");
    }
    this.body(node2);
    if (node2.raws.after) {
      this.builder(node2.raws.after);
    }
  }
  rule(node2) {
    this.block(node2, this.rawValue(node2, "selector"));
    if (node2.raws.ownSemicolon) {
      this.builder(node2.raws.ownSemicolon, node2, "end");
    }
  }
  stringify(node2, semicolon) {
    if (!this[node2.type]) {
      throw new Error(
        "Unknown AST node type " + node2.type + ". Maybe you need to change PostCSS stringifier."
      );
    }
    this[node2.type](node2, semicolon);
  }
};
var stringifier = Stringifier$2;
Stringifier$2.default = Stringifier$2;
let Stringifier$1 = stringifier;
const STYLE_TAG = /(<)(\/?style\b)/gi;
const COMMENT_OPEN = /(<)(!--)/g;
function escapeHTMLInCSS(str) {
  if (!str.includes("<")) return str;
  return str.replace(STYLE_TAG, "\\3c $2").replace(COMMENT_OPEN, "\\3c $2");
}
function cutEscaped(chunks, css, escaped) {
  let parts = [];
  let at = 0;
  let into = 0;
  for (let i = 0; i < chunks.length; i += 3) {
    let from = into;
    let end = at + chunks[i].length;
    while (at < end) {
      if (css[at] === escaped[into]) {
        at += 1;
        into += 1;
      } else {
        at += 1;
        into += 4;
      }
    }
    parts.push(escaped.slice(from, into));
  }
  return parts;
}
class SafeStringifier extends Stringifier$1 {
  escapeHTML(print) {
    let builder = this.builder;
    let chunks, css;
    this.builder = (str, child, type) => {
      if (chunks) {
        css += str;
        chunks.push(str, child, type);
      } else if (str.includes("<")) {
        css = str;
        chunks = [str, child, type];
      } else {
        builder(str, child, type);
      }
    };
    print();
    this.builder = builder;
    if (!chunks) return;
    let escaped = escapeHTMLInCSS(css);
    if (escaped === css) {
      for (let i = 0; i < chunks.length; i += 3) {
        builder(chunks[i], chunks[i + 1], chunks[i + 2]);
      }
    } else {
      let parts = cutEscaped(chunks, css, escaped);
      for (let i = 0; i < chunks.length; i += 3) {
        builder(parts[i / 3], chunks[i + 1], chunks[i + 2]);
      }
    }
  }
  root(node2) {
    if (node2.parent && node2.parent.type === "document") {
      this.escapeHTML(() => this.body(node2));
      if (node2.raws.after) this.builder(node2.raws.after);
    } else {
      this.escapeHTML(() => super.root(node2));
    }
  }
}
function stringify$4(node2, builder) {
  let str = new SafeStringifier(builder);
  if (node2.type === "root" || node2.type === "document") {
    str.stringify(node2);
  } else {
    str.escapeHTML(() => str.stringify(node2));
  }
}
var stringify_1 = stringify$4;
stringify$4.default = stringify$4;
var symbols = {};
symbols.isClean = Symbol("isClean");
symbols.my = Symbol("my");
let CssSyntaxError$2 = cssSyntaxError;
let Stringifier2 = stringifier;
let stringify$3 = stringify_1;
let { isClean: isClean$2, my: my$3 } = symbols;
function cloneNode(obj, parent) {
  let cloned = new obj.constructor();
  let stack = [[obj, cloned, parent]];
  while (stack.length > 0) {
    let [source, target, targetParent] = stack.pop();
    for (let i in source) {
      if (!Object.prototype.hasOwnProperty.call(source, i)) {
        continue;
      }
      if (i === "proxyCache") continue;
      let value = source[i];
      let type = typeof value;
      if (i === "parent" && type === "object") {
        if (targetParent) target[i] = targetParent;
      } else if (i === "source") {
        target[i] = value;
      } else if (Array.isArray(value)) {
        let children = [];
        target[i] = children;
        for (let j of value) {
          let childClone = new j.constructor();
          children.push(childClone);
          stack.push([j, childClone, target]);
        }
      } else {
        if (type === "object" && value !== null) {
          let valueClone = new value.constructor();
          stack.push([value, valueClone, void 0]);
          value = valueClone;
        }
        target[i] = value;
      }
    }
  }
  return cloned;
}
function sourceOffset(inputCSS, position) {
  if (position && typeof position.offset !== "undefined") {
    return position.offset;
  }
  let column = 1;
  let line = 1;
  let offset = 0;
  for (let i = 0; i < inputCSS.length; i++) {
    if (line === position.line && column === position.column) {
      offset = i;
      break;
    }
    if (inputCSS[i] === "\n") {
      column = 1;
      line += 1;
    } else {
      column += 1;
    }
  }
  return offset;
}
let Node$4 = class Node {
  get proxyOf() {
    return this;
  }
  constructor(defaults = {}) {
    this.raws = {};
    this[isClean$2] = false;
    this[my$3] = true;
    for (let name of Object.keys(defaults)) {
      if (name === "__proto__") continue;
      if (name === "nodes") {
        this.nodes = [];
        for (let node2 of defaults[name]) {
          if (typeof node2.clone === "function" && node2.parent) {
            this.append(node2.clone());
          } else {
            this.append(node2);
          }
        }
      } else {
        this[name] = defaults[name];
      }
    }
  }
  addToError(error) {
    error.postcssNode = this;
    if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
      let s = this.source;
      error.stack = error.stack.replace(
        /\n\s{4}at /,
        `$&${s.input.from}:${s.start.line}:${s.start.column}$&`
      );
    }
    return error;
  }
  after(add) {
    this.parent.insertAfter(this, add);
    return this;
  }
  assign(overrides = {}) {
    for (let name in overrides) {
      this[name] = overrides[name];
    }
    return this;
  }
  before(add) {
    this.parent.insertBefore(this, add);
    return this;
  }
  cleanRaws(keepBetween) {
    delete this.raws.before;
    delete this.raws.after;
    if (!keepBetween) delete this.raws.between;
  }
  clone(overrides = {}) {
    let cloned = cloneNode(this);
    for (let name in overrides) {
      cloned[name] = overrides[name];
    }
    return cloned;
  }
  cloneAfter(overrides = {}) {
    let cloned = this.clone(overrides);
    this.parent.insertAfter(this, cloned);
    return cloned;
  }
  cloneBefore(overrides = {}) {
    let cloned = this.clone(overrides);
    this.parent.insertBefore(this, cloned);
    return cloned;
  }
  error(message, opts = {}) {
    if (this.source) {
      let { end, start } = this.rangeBy(opts);
      return this.source.input.error(
        message,
        { column: start.column, line: start.line },
        { column: end.column, line: end.line },
        opts
      );
    }
    return new CssSyntaxError$2(message);
  }
  getProxyProcessor() {
    return {
      get(node2, prop) {
        if (prop === "proxyOf") {
          return node2;
        } else if (prop === "root") {
          return () => node2.root().toProxy();
        } else {
          return node2[prop];
        }
      },
      set(node2, prop, value) {
        if (node2[prop] === value) return true;
        node2[prop] = value;
        if (prop === "prop" || prop === "value" || prop === "name" || prop === "params" || prop === "important" || /* c8 ignore next */
        prop === "text") {
          node2.markDirty();
        }
        return true;
      }
    };
  }
  /* c8 ignore next 3 */
  markClean() {
    this[isClean$2] = true;
  }
  markDirty() {
    if (this[isClean$2]) {
      this[isClean$2] = false;
      let next = this;
      while (next = next.parent) {
        next[isClean$2] = false;
      }
    }
  }
  next() {
    if (!this.parent) return void 0;
    let index = this.parent.index(this);
    return this.parent.nodes[index + 1];
  }
  positionBy(opts = {}) {
    let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
    let pos = {
      column: this.source.start.column,
      line: this.source.start.line,
      offset: sourceOffset(inputString, this.source.start)
    };
    if (opts.index) {
      pos = this.positionInside(opts.index);
    } else if (opts.word) {
      let stringRepresentation = inputString.slice(
        sourceOffset(inputString, this.source.start),
        sourceOffset(inputString, this.source.end)
      );
      let index = stringRepresentation.indexOf(opts.word);
      if (index !== -1) pos = this.positionInside(index);
    }
    return pos;
  }
  positionInside(index) {
    let column = this.source.start.column;
    let line = this.source.start.line;
    let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
    let offset = sourceOffset(inputString, this.source.start);
    let end = offset + index;
    for (let i = offset; i < end; i++) {
      if (inputString[i] === "\n") {
        column = 1;
        line += 1;
      } else {
        column += 1;
      }
    }
    return { column, line, offset: end };
  }
  prev() {
    if (!this.parent) return void 0;
    let index = this.parent.index(this);
    return this.parent.nodes[index - 1];
  }
  rangeBy(opts = {}) {
    let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
    let start = {
      column: this.source.start.column,
      line: this.source.start.line,
      offset: sourceOffset(inputString, this.source.start)
    };
    let end = this.source.end ? {
      column: this.source.end.column + 1,
      line: this.source.end.line,
      offset: typeof this.source.end.offset === "number" ? (
        // `source.end.offset` is exclusive, so we don't need to add 1
        this.source.end.offset
      ) : (
        // Since line/column in this.source.end is inclusive,
        // the `sourceOffset(... , this.source.end)` returns an inclusive offset.
        // So, we add 1 to convert it to exclusive.
        sourceOffset(inputString, this.source.end) + 1
      )
    } : {
      column: start.column + 1,
      line: start.line,
      offset: start.offset + 1
    };
    if (opts.word) {
      let stringRepresentation = inputString.slice(
        sourceOffset(inputString, this.source.start),
        sourceOffset(inputString, this.source.end)
      );
      let index = stringRepresentation.indexOf(opts.word);
      if (index !== -1) {
        start = this.positionInside(index);
        end = this.positionInside(index + opts.word.length);
      }
    } else {
      if (opts.start) {
        start = {
          column: opts.start.column,
          line: opts.start.line,
          offset: sourceOffset(inputString, opts.start)
        };
      } else if (typeof opts.index === "number") {
        start = this.positionInside(opts.index);
      }
      if (opts.end) {
        end = {
          column: opts.end.column,
          line: opts.end.line,
          offset: sourceOffset(inputString, opts.end)
        };
      } else if (typeof opts.endIndex === "number") {
        end = this.positionInside(opts.endIndex);
      } else if (typeof opts.index === "number") {
        end = this.positionInside(opts.index + 1);
      }
    }
    if (end.line < start.line || end.line === start.line && end.column <= start.column) {
      end = {
        column: start.column + 1,
        line: start.line,
        offset: start.offset + 1
      };
    }
    return { end, start };
  }
  raw(prop, defaultType) {
    let str = new Stringifier2();
    return str.raw(this, prop, defaultType);
  }
  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
    this.parent = void 0;
    return this;
  }
  replaceWith(...nodes) {
    if (this.parent) {
      let bookmark = this;
      let foundSelf = false;
      for (let node2 of nodes) {
        if (node2 === this) {
          foundSelf = true;
        } else if (foundSelf) {
          this.parent.insertAfter(bookmark, node2);
          bookmark = node2;
        } else {
          this.parent.insertBefore(bookmark, node2);
        }
      }
      if (!foundSelf) {
        this.remove();
      }
    }
    return this;
  }
  root() {
    let result2 = this;
    while (result2.parent && result2.parent.type !== "document") {
      result2 = result2.parent;
    }
    return result2;
  }
  toJSON(_, inputs) {
    let emitInputs = inputs == null;
    inputs = inputs || /* @__PURE__ */ new Map();
    let holderOfRoot = [];
    let queue = [[this, holderOfRoot, 0]];
    for (let step = 0; step < queue.length; step++) {
      let [node2, holder, key] = queue[step];
      let fixed2 = {};
      holder[key] = fixed2;
      for (let name in node2) {
        if (!Object.prototype.hasOwnProperty.call(node2, name)) {
          continue;
        }
        if (name === "parent" || name === "proxyCache") continue;
        let value = node2[name];
        if (Array.isArray(value)) {
          let fixedArray = [];
          fixed2[name] = fixedArray;
          for (let i = 0; i < value.length; i++) {
            let item = value[i];
            if (typeof item === "object" && item.toJSON) {
              if (item.toJSON === Node.prototype.toJSON) {
                queue.push([item, fixedArray, i]);
              } else {
                fixedArray[i] = item.toJSON(null, inputs);
              }
            } else {
              fixedArray[i] = item;
            }
          }
        } else if (typeof value === "object" && value.toJSON) {
          if (value.toJSON === Node.prototype.toJSON) {
            queue.push([value, fixed2, name]);
          } else {
            fixed2[name] = value.toJSON(null, inputs);
          }
        } else if (name === "source") {
          if (value == null) continue;
          let inputId = inputs.get(value.input);
          if (inputId == null) {
            inputId = inputs.size;
            inputs.set(value.input, inputId);
          }
          fixed2[name] = {
            end: value.end,
            inputId,
            start: value.start
          };
        } else {
          fixed2[name] = value;
        }
      }
    }
    let fixed = holderOfRoot[0];
    if (emitInputs) {
      fixed.inputs = [...inputs.keys()].map((input2) => input2.toJSON());
    }
    return fixed;
  }
  toProxy() {
    if (!this.proxyCache) {
      this.proxyCache = new Proxy(this, this.getProxyProcessor());
    }
    return this.proxyCache;
  }
  toString(stringifier2 = stringify$3) {
    if (stringifier2.stringify) stringifier2 = stringifier2.stringify;
    let result2 = "";
    stringifier2(this, (i) => {
      result2 += i;
    });
    return result2;
  }
  warn(result2, text2, opts = {}) {
    let data = { node: this };
    for (let i in opts) data[i] = opts[i];
    return result2.warn(text2, data);
  }
};
var node = Node$4;
Node$4.default = Node$4;
let Node$3 = node;
let Comment$4 = class Comment extends Node$3 {
  constructor(defaults) {
    super(defaults);
    this.type = "comment";
  }
};
var comment = Comment$4;
Comment$4.default = Comment$4;
let Node$2 = node;
let Declaration$4 = class Declaration extends Node$2 {
  get variable() {
    return this.prop.startsWith("--") || this.prop[0] === "$";
  }
  constructor(defaults) {
    if (defaults && typeof defaults.value !== "undefined" && typeof defaults.value !== "string") {
      defaults = { ...defaults, value: String(defaults.value) };
    }
    super(defaults);
    this.type = "decl";
  }
};
var declaration = Declaration$4;
Declaration$4.default = Declaration$4;
let Comment$3 = comment;
let Declaration$3 = declaration;
let Node$1 = node;
let { isClean: isClean$1, my: my$2 } = symbols;
let AtRule$4, parse$4, Root$6, Rule$4;
function cleanSource(nodes) {
  let stack = nodes.slice();
  while (stack.length > 0) {
    let node2 = stack.pop();
    delete node2.source;
    if (node2.nodes) {
      node2.nodes = node2.nodes.slice();
      for (let i of node2.nodes) stack.push(i);
    }
  }
  return nodes.slice();
}
function markTreeDirty(node2) {
  let stack = [node2];
  while (stack.length > 0) {
    let next = stack.pop();
    next[isClean$1] = false;
    if (next.proxyOf.nodes) {
      for (let i of next.proxyOf.nodes) stack.push(i);
    }
  }
}
let Container$8 = class Container extends Node$1 {
  get first() {
    if (!this.proxyOf.nodes) return void 0;
    return this.proxyOf.nodes[0];
  }
  get last() {
    if (!this.proxyOf.nodes) return void 0;
    return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
  }
  append(...children) {
    for (let child of children) {
      let nodes = this.normalize(child, this.last);
      for (let node2 of nodes) this.proxyOf.nodes.push(node2);
    }
    this.markDirty();
    return this;
  }
  cleanRaws(keepBetween) {
    let stack = [this];
    while (stack.length > 0) {
      let node2 = stack.pop();
      if (node2 !== this && node2.cleanRaws !== Container.prototype.cleanRaws) {
        node2.cleanRaws(keepBetween);
        continue;
      }
      Node$1.prototype.cleanRaws.call(node2, keepBetween);
      if (node2.nodes) {
        for (let child of node2.nodes) stack.push(child);
      }
    }
  }
  each(callback) {
    if (!this.proxyOf.nodes) return void 0;
    let iterator = this.getIterator();
    let index, result2;
    while (this.indexes[iterator] < this.proxyOf.nodes.length) {
      index = this.indexes[iterator];
      result2 = callback(this.proxyOf.nodes[index], index);
      if (result2 === false) break;
      this.indexes[iterator] += 1;
    }
    delete this.indexes[iterator];
    return result2;
  }
  every(condition) {
    return this.nodes.every(condition);
  }
  getIterator() {
    if (!this.lastEach) this.lastEach = 0;
    if (!this.indexes) this.indexes = {};
    this.lastEach += 1;
    let iterator = this.lastEach;
    this.indexes[iterator] = 0;
    return iterator;
  }
  getProxyProcessor() {
    return {
      get(node2, prop) {
        if (prop === "proxyOf") {
          return node2;
        } else if (!node2[prop]) {
          return node2[prop];
        } else if (prop === "each" || typeof prop === "string" && prop.startsWith("walk")) {
          return (...args) => {
            return node2[prop](
              ...args.map((i) => {
                if (typeof i === "function") {
                  return (child, index) => i(child.toProxy(), index);
                } else {
                  return i;
                }
              })
            );
          };
        } else if (prop === "every" || prop === "some") {
          return (cb) => {
            return node2[prop](
              (child, ...other) => cb(child.toProxy(), ...other)
            );
          };
        } else if (prop === "root") {
          return () => node2.root().toProxy();
        } else if (prop === "nodes") {
          return node2.nodes.map((i) => i.toProxy());
        } else if (prop === "first" || prop === "last") {
          return node2[prop].toProxy();
        } else {
          return node2[prop];
        }
      },
      set(node2, prop, value) {
        if (node2[prop] === value) return true;
        node2[prop] = value;
        if (prop === "name" || prop === "params" || prop === "selector") {
          node2.markDirty();
        }
        return true;
      }
    };
  }
  index(child) {
    if (typeof child === "number") return child;
    if (child.proxyOf) child = child.proxyOf;
    return this.proxyOf.nodes.indexOf(child);
  }
  insertAfter(exist, add) {
    let existIndex = this.index(exist);
    let nodes = this.normalize(add, this.proxyOf.nodes[existIndex]).reverse();
    existIndex = this.index(exist);
    for (let node2 of nodes) this.proxyOf.nodes.splice(existIndex + 1, 0, node2);
    let index;
    for (let id2 in this.indexes) {
      index = this.indexes[id2];
      if (existIndex < index) {
        this.indexes[id2] = index + nodes.length;
      }
    }
    this.markDirty();
    return this;
  }
  insertBefore(exist, add) {
    let existIndex = this.index(exist);
    let type = existIndex === 0 ? "prepend" : false;
    let nodes = this.normalize(
      add,
      this.proxyOf.nodes[existIndex],
      type
    ).reverse();
    existIndex = this.index(exist);
    for (let node2 of nodes) this.proxyOf.nodes.splice(existIndex, 0, node2);
    let index;
    for (let id2 in this.indexes) {
      index = this.indexes[id2];
      if (existIndex <= index) {
        this.indexes[id2] = index + nodes.length;
      }
    }
    this.markDirty();
    return this;
  }
  normalize(nodes, sample) {
    if (typeof nodes === "string") {
      nodes = cleanSource(parse$4(nodes).nodes);
    } else if (typeof nodes === "undefined") {
      nodes = [];
    } else if (Array.isArray(nodes)) {
      nodes = nodes.slice(0);
      for (let i of nodes) {
        if (i.parent) i.parent.removeChild(i, "ignore");
      }
    } else if (nodes.type === "root" && this.type !== "document") {
      nodes = nodes.nodes.slice(0);
      for (let i of nodes) {
        if (i.parent) i.parent.removeChild(i, "ignore");
      }
    } else if (nodes.type) {
      nodes = [nodes];
    } else if (nodes.prop) {
      if (typeof nodes.value === "undefined") {
        throw new Error("Value field is missed in node creation");
      } else if (typeof nodes.value !== "string") {
        nodes.value = String(nodes.value);
      }
      nodes = [new Declaration$3(nodes)];
    } else if (nodes.selector || nodes.selectors) {
      nodes = [new Rule$4(nodes)];
    } else if (nodes.name) {
      nodes = [new AtRule$4(nodes)];
    } else if (nodes.text) {
      nodes = [new Comment$3(nodes)];
    } else {
      throw new Error("Unknown node type in node creation");
    }
    let processed = nodes.map((i) => {
      if (!i[my$2]) Container.rebuild(i);
      i = i.proxyOf;
      if (i.parent) i.parent.removeChild(i);
      if (i[isClean$1]) markTreeDirty(i);
      if (!i.raws) i.raws = {};
      if (typeof i.raws.before === "undefined") {
        if (sample && typeof sample.raws.before !== "undefined") {
          i.raws.before = sample.raws.before.replace(/\S/g, "");
        }
      }
      i.parent = this.proxyOf;
      return i;
    });
    return processed;
  }
  prepend(...children) {
    children = children.reverse();
    for (let child of children) {
      let nodes = this.normalize(child, this.first, "prepend").reverse();
      for (let node2 of nodes) this.proxyOf.nodes.unshift(node2);
      for (let id2 in this.indexes) {
        this.indexes[id2] = this.indexes[id2] + nodes.length;
      }
    }
    this.markDirty();
    return this;
  }
  push(child) {
    child.parent = this;
    this.proxyOf.nodes.push(child);
    return this;
  }
  removeAll() {
    for (let node2 of this.proxyOf.nodes) node2.parent = void 0;
    this.proxyOf.nodes = [];
    this.markDirty();
    return this;
  }
  removeChild(child) {
    child = this.index(child);
    this.proxyOf.nodes[child].parent = void 0;
    this.proxyOf.nodes.splice(child, 1);
    let index;
    for (let id2 in this.indexes) {
      index = this.indexes[id2];
      if (index >= child) {
        this.indexes[id2] = index - 1;
      }
    }
    this.markDirty();
    return this;
  }
  replaceValues(pattern, opts, callback) {
    if (!callback) {
      callback = opts;
      opts = {};
    }
    this.walkDecls((decl) => {
      if (opts.props && !opts.props.includes(decl.prop)) return;
      if (opts.fast && !decl.value.includes(opts.fast)) return;
      decl.value = decl.value.replace(pattern, callback);
    });
    this.markDirty();
    return this;
  }
  some(condition) {
    return this.nodes.some(condition);
  }
  walk(callback) {
    if (!this.proxyOf.nodes) return void 0;
    let stack = [{ iterator: this.getIterator(), node: this.proxyOf }];
    while (stack.length > 0) {
      let { iterator, node: node2 } = stack[stack.length - 1];
      let index = node2.indexes[iterator];
      if (index >= node2.proxyOf.nodes.length) {
        delete node2.indexes[iterator];
        stack.pop();
        let parent = stack[stack.length - 1];
        if (parent) parent.node.indexes[parent.iterator] += 1;
        continue;
      }
      let child = node2.proxyOf.nodes[index];
      let result2;
      try {
        result2 = callback(child, index);
      } catch (e) {
        throw child.addToError(e);
      }
      if (result2 === false) {
        for (let opened of stack) {
          delete opened.node.indexes[opened.iterator];
        }
        return false;
      }
      if (child.walk && child.proxyOf.nodes) {
        stack.push({ iterator: child.getIterator(), node: child });
      } else {
        node2.indexes[iterator] += 1;
      }
    }
    return void 0;
  }
  walkAtRules(name, callback) {
    if (!callback) {
      callback = name;
      return this.walk((child, i) => {
        if (child.type === "atrule") {
          return callback(child, i);
        }
      });
    }
    if (name instanceof RegExp) {
      return this.walk((child, i) => {
        if (child.type === "atrule" && name.test(child.name)) {
          return callback(child, i);
        }
      });
    }
    return this.walk((child, i) => {
      if (child.type === "atrule" && child.name === name) {
        return callback(child, i);
      }
    });
  }
  walkComments(callback) {
    return this.walk((child, i) => {
      if (child.type === "comment") {
        return callback(child, i);
      }
    });
  }
  walkDecls(prop, callback) {
    if (!callback) {
      callback = prop;
      return this.walk((child, i) => {
        if (child.type === "decl") {
          return callback(child, i);
        }
      });
    }
    if (prop instanceof RegExp) {
      return this.walk((child, i) => {
        if (child.type === "decl" && prop.test(child.prop)) {
          return callback(child, i);
        }
      });
    }
    return this.walk((child, i) => {
      if (child.type === "decl" && child.prop === prop) {
        return callback(child, i);
      }
    });
  }
  walkRules(selector, callback) {
    if (!callback) {
      callback = selector;
      return this.walk((child, i) => {
        if (child.type === "rule") {
          return callback(child, i);
        }
      });
    }
    if (selector instanceof RegExp) {
      return this.walk((child, i) => {
        if (child.type === "rule" && selector.test(child.selector)) {
          return callback(child, i);
        }
      });
    }
    return this.walk((child, i) => {
      if (child.type === "rule" && child.selector === selector) {
        return callback(child, i);
      }
    });
  }
};
Container$8.registerParse = (dependant) => {
  parse$4 = dependant;
};
Container$8.registerRule = (dependant) => {
  Rule$4 = dependant;
};
Container$8.registerAtRule = (dependant) => {
  AtRule$4 = dependant;
};
Container$8.registerRoot = (dependant) => {
  Root$6 = dependant;
};
var container = Container$8;
Container$8.default = Container$8;
Container$8.rebuild = (node2) => {
  let stack = [node2];
  while (stack.length > 0) {
    let next = stack.pop();
    if (next.type === "atrule") {
      Object.setPrototypeOf(next, AtRule$4.prototype);
    } else if (next.type === "rule") {
      Object.setPrototypeOf(next, Rule$4.prototype);
    } else if (next.type === "decl") {
      Object.setPrototypeOf(next, Declaration$3.prototype);
    } else if (next.type === "comment") {
      Object.setPrototypeOf(next, Comment$3.prototype);
    } else if (next.type === "root") {
      Object.setPrototypeOf(next, Root$6.prototype);
    }
    next[my$2] = true;
    if (next.nodes) {
      for (let child of next.nodes) stack.push(child);
    }
  }
};
let Container$7 = container;
let AtRule$3 = class AtRule extends Container$7 {
  constructor(defaults) {
    super(defaults);
    this.type = "atrule";
  }
  append(...children) {
    if (!this.proxyOf.nodes) this.nodes = [];
    return super.append(...children);
  }
  prepend(...children) {
    if (!this.proxyOf.nodes) this.nodes = [];
    return super.prepend(...children);
  }
};
var atRule = AtRule$3;
AtRule$3.default = AtRule$3;
Container$7.registerAtRule(AtRule$3);
let Container$6 = container;
let LazyResult$4, Processor$3;
let Document$3 = class Document extends Container$6 {
  constructor(defaults) {
    super({ type: "document", ...defaults });
    if (!this.nodes) {
      this.nodes = [];
    }
  }
  toResult(opts = {}) {
    let lazy = new LazyResult$4(new Processor$3(), this, opts);
    return lazy.stringify();
  }
};
Document$3.registerLazyResult = (dependant) => {
  LazyResult$4 = dependant;
};
Document$3.registerProcessor = (dependant) => {
  Processor$3 = dependant;
};
var document = Document$3;
Document$3.default = Document$3;
let urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let nanoid$1 = (size = 21) => {
  let id2 = "";
  let i = size | 0;
  while (i-- > 0) {
    id2 += urlAlphabet[Math.random() * 64 | 0];
  }
  return id2;
};
var nonSecure = { nanoid: nanoid$1 };
let { existsSync, readFileSync, realpathSync } = require$$2;
let { dirname: dirname$1, isAbsolute: isAbsolute$1, join, relative: relative$1, sep: sep$1 } = require$$2;
let { SourceMapConsumer: SourceMapConsumer$2, SourceMapGenerator: SourceMapGenerator$2 } = require$$2;
function realPath(path) {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}
function fromBase64(str) {
  if (Buffer) {
    return Buffer.from(str, "base64").toString();
  } else {
    return window.atob(str);
  }
}
let PreviousMap$2 = class PreviousMap {
  constructor(css, opts) {
    if (opts.map === false) return;
    if (opts.unsafeMap) this.unsafeMap = true;
    this.loadAnnotation(css);
    this.inline = this.startWith(this.annotation, "data:");
    let prev = opts.map ? opts.map.prev : void 0;
    let text2 = this.loadMap(opts.from, prev);
    if (!this.mapFile && opts.from) {
      this.mapFile = opts.from;
    }
    if (this.mapFile) this.root = dirname$1(this.mapFile);
    if (text2) this.text = text2;
  }
  consumer() {
    if (!this.consumerCache) {
      this.consumerCache = new SourceMapConsumer$2(this.json || this.text);
    }
    return this.consumerCache;
  }
  decodeInline(text2) {
    let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
    let baseUri = /^data:application\/json;base64,/;
    let charsetUri = /^data:application\/json;charset=utf-?8,/;
    let uri = /^data:application\/json,/;
    let uriMatch = text2.match(charsetUri) || text2.match(uri);
    if (uriMatch) {
      return decodeURIComponent(text2.substr(uriMatch[0].length));
    }
    let baseUriMatch = text2.match(baseCharsetUri) || text2.match(baseUri);
    if (baseUriMatch) {
      return fromBase64(text2.substr(baseUriMatch[0].length));
    }
    let encoding = text2.slice("data:application/json;".length);
    encoding = encoding.slice(0, encoding.indexOf(","));
    throw new Error("Unsupported source map encoding " + encoding);
  }
  getAnnotationURL(sourceMapString) {
    return sourceMapString.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
  }
  isMap(map) {
    if (typeof map !== "object") return false;
    return typeof map.mappings === "string" || typeof map._mappings === "string" || Array.isArray(map.sections);
  }
  loadAnnotation(css) {
    let comments = css.match(/\/\*\s*# sourceMappingURL=/g);
    if (!comments) return;
    let start = css.lastIndexOf(comments.pop());
    let end = css.indexOf("*/", start);
    if (start > -1 && end > -1) {
      this.annotation = this.getAnnotationURL(css.substring(start, end));
    }
  }
  loadFile(path, cssFile, trusted) {
    if (!trusted && !this.unsafeMap) {
      if (!/\.map$/i.test(path)) return void 0;
      if (!cssFile) return void 0;
      let rel = relative$1(realPath(dirname$1(cssFile)), realPath(path));
      if (rel === ".." || rel.startsWith(".." + sep$1) || isAbsolute$1(rel)) {
        return void 0;
      }
    }
    this.root = dirname$1(path);
    if (existsSync(path)) {
      this.mapFile = path;
      return readFileSync(path, "utf-8").toString().trim();
    }
  }
  loadMap(file, prev) {
    if (prev === false) return false;
    if (prev) {
      if (typeof prev === "string") {
        return prev;
      } else if (typeof prev === "function") {
        let prevPath = prev(file);
        if (prevPath) {
          let map = this.loadFile(prevPath, file, true);
          if (!map) {
            throw new Error(
              "Unable to load previous source map: " + prevPath.toString()
            );
          }
          return map;
        }
      } else if (prev instanceof SourceMapConsumer$2) {
        return SourceMapGenerator$2.fromSourceMap(prev).toString();
      } else if (prev instanceof SourceMapGenerator$2) {
        return prev.toString();
      } else if (this.isMap(prev)) {
        return JSON.stringify(prev);
      } else {
        throw new Error(
          "Unsupported previous source map format: " + prev.toString()
        );
      }
    } else if (this.inline) {
      return this.decodeInline(this.annotation);
    } else if (this.annotation) {
      let map = this.annotation;
      if (file) map = join(dirname$1(file), map);
      let unknown = this.loadFile(map, file, false);
      if (unknown) {
        try {
          this.json = JSON.parse(unknown.replace(/^\)]}'[^\n]*\n/, ""));
        } catch {
          return void 0;
        }
      }
      return unknown;
    }
  }
  startWith(string, start) {
    if (!string) return false;
    return string.substr(0, start.length) === start;
  }
  withContent() {
    return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
  }
};
var previousMap = PreviousMap$2;
PreviousMap$2.default = PreviousMap$2;
let { nanoid } = nonSecure;
let { isAbsolute, resolve: resolve$1 } = require$$2;
let { SourceMapConsumer: SourceMapConsumer$1, SourceMapGenerator: SourceMapGenerator$1 } = require$$2;
let { fileURLToPath, pathToFileURL: pathToFileURL$1 } = require$$2;
let CssSyntaxError$1 = cssSyntaxError;
let PreviousMap$1 = previousMap;
let terminalHighlight = require$$2;
let lineToIndexCache = Symbol("lineToIndexCache");
let sourceMapAvailable$1 = Boolean(SourceMapConsumer$1 && SourceMapGenerator$1);
let pathAvailable$1 = Boolean(resolve$1 && isAbsolute);
function getLineToIndex(input2) {
  if (input2[lineToIndexCache]) return input2[lineToIndexCache];
  let lines = input2.css.split("\n");
  let lineToIndex = new Array(lines.length);
  let prevIndex = 0;
  for (let i = 0, l = lines.length; i < l; i++) {
    lineToIndex[i] = prevIndex;
    prevIndex += lines[i].length + 1;
  }
  input2[lineToIndexCache] = lineToIndex;
  return lineToIndex;
}
let Input$4 = class Input {
  get from() {
    return this.file || this.id;
  }
  constructor(css, opts = {}) {
    if (css === null || typeof css === "undefined" || typeof css === "object" && !css.toString) {
      throw new Error(`PostCSS received ${css} instead of CSS string`);
    }
    this.css = css.toString();
    if (this.css[0] === "\uFEFF" || this.css[0] === "￾") {
      this.hasBOM = true;
      this.css = this.css.slice(1);
    } else {
      this.hasBOM = false;
    }
    this.document = this.css;
    if (opts.document) this.document = opts.document.toString();
    if (opts.from) {
      if (!pathAvailable$1 || /^\w+:\/\//.test(opts.from) || isAbsolute(opts.from)) {
        this.file = opts.from;
      } else {
        this.file = resolve$1(opts.from);
      }
    }
    if (pathAvailable$1 && sourceMapAvailable$1) {
      let map = new PreviousMap$1(this.css, opts);
      if (map.text) {
        this.map = map;
        let file = map.consumer().file;
        if (!this.file && file) this.file = this.mapResolve(file);
      }
    }
    if (!this.file) {
      this.id = "<input css " + nanoid(6) + ">";
    }
    if (this.map) this.map.file = this.from;
  }
  error(message, line, column, opts = {}) {
    let endColumn, endLine, endOffset, offset, result2;
    if (line && typeof line === "object") {
      let start = line;
      let end = column;
      if (typeof start.offset === "number") {
        offset = start.offset;
        let pos = this.fromOffset(offset);
        line = pos.line;
        column = pos.col;
      } else {
        line = start.line;
        column = start.column;
        offset = this.fromLineAndColumn(line, column);
      }
      if (typeof end.offset === "number") {
        endOffset = end.offset;
        let pos = this.fromOffset(endOffset);
        endLine = pos.line;
        endColumn = pos.col;
      } else {
        endLine = end.line;
        endColumn = end.column;
        endOffset = this.fromLineAndColumn(end.line, end.column);
      }
    } else if (!column) {
      offset = line;
      let pos = this.fromOffset(offset);
      line = pos.line;
      column = pos.col;
    } else {
      offset = this.fromLineAndColumn(line, column);
    }
    let origin = this.origin(line, column, endLine, endColumn);
    if (origin) {
      result2 = new CssSyntaxError$1(
        message,
        origin.endLine === void 0 ? origin.line : { column: origin.column, line: origin.line },
        origin.endLine === void 0 ? origin.column : { column: origin.endColumn, line: origin.endLine },
        origin.source,
        origin.file,
        opts.plugin
      );
    } else {
      result2 = new CssSyntaxError$1(
        message,
        endLine === void 0 ? line : { column, line },
        endLine === void 0 ? column : { column: endColumn, line: endLine },
        this.css,
        this.file,
        opts.plugin
      );
    }
    result2.input = {
      column,
      endColumn,
      endLine,
      endOffset,
      line,
      offset,
      source: this.css
    };
    if (this.file) {
      if (pathToFileURL$1) {
        result2.input.url = pathToFileURL$1(this.file).toString();
      }
      result2.input.file = this.file;
    }
    return result2;
  }
  fromLineAndColumn(line, column) {
    let lineToIndex = getLineToIndex(this);
    let index = lineToIndex[line - 1];
    return index + column - 1;
  }
  fromOffset(offset) {
    let lineToIndex = getLineToIndex(this);
    let lastLine = lineToIndex[lineToIndex.length - 1];
    let min = 0;
    if (offset >= lastLine) {
      min = lineToIndex.length - 1;
    } else {
      let max = lineToIndex.length - 2;
      let mid;
      while (min < max) {
        mid = min + (max - min >> 1);
        if (offset < lineToIndex[mid]) {
          max = mid - 1;
        } else if (offset >= lineToIndex[mid + 1]) {
          min = mid + 1;
        } else {
          min = mid;
          break;
        }
      }
    }
    return {
      col: offset - lineToIndex[min] + 1,
      line: min + 1
    };
  }
  mapResolve(file) {
    if (/^\w+:\/\//.test(file)) {
      return file;
    }
    return resolve$1(this.map.consumer().sourceRoot || this.map.root || ".", file);
  }
  origin(line, column, endLine, endColumn) {
    if (!this.map) return false;
    let consumer = this.map.consumer();
    let from = consumer.originalPositionFor({ column: column - 1, line });
    if (!from.source) return false;
    let to;
    if (typeof endLine === "number") {
      let toPosition = consumer.originalPositionFor({
        column: endColumn - 1,
        line: endLine
      });
      if (toPosition.source) to = toPosition;
    }
    let fromUrl;
    if (isAbsolute(from.source)) {
      fromUrl = pathToFileURL$1(from.source);
    } else {
      fromUrl = new URL(
        from.source,
        this.map.consumer().sourceRoot || pathToFileURL$1(this.map.mapFile)
      );
    }
    let result2 = {
      column: from.column + 1,
      endColumn: to && to.column + 1,
      endLine: to && to.line,
      line: from.line,
      url: fromUrl.toString()
    };
    if (fromUrl.protocol === "file:") {
      if (fileURLToPath) {
        result2.file = fileURLToPath(fromUrl);
      } else {
        throw new Error(`file: protocol is not available in this PostCSS build`);
      }
    }
    let source = consumer.sourceContentFor(from.source);
    if (source) result2.source = source;
    return result2;
  }
  toJSON() {
    let json = {};
    for (let name of ["hasBOM", "css", "file", "id"]) {
      if (this[name] != null) {
        json[name] = this[name];
      }
    }
    if (this.map) {
      json.map = { ...this.map };
      if (json.map.consumerCache) {
        json.map.consumerCache = void 0;
      }
    }
    return json;
  }
};
var input = Input$4;
Input$4.default = Input$4;
if (terminalHighlight && terminalHighlight.registerInput) {
  terminalHighlight.registerInput(Input$4);
}
let Container$5 = container;
let LazyResult$3, Processor$2;
let Root$5 = class Root extends Container$5 {
  constructor(defaults) {
    super(defaults);
    this.type = "root";
    if (!this.nodes) this.nodes = [];
  }
  normalize(child, sample, type) {
    let keepBefore = /* @__PURE__ */ new Set();
    for (let node2 of Array.isArray(child) ? child : [child]) {
      if (node2 && typeof node2 === "object" && !node2.parent && node2.raws && typeof node2.raws.before !== "undefined") {
        keepBefore.add(node2.raws);
      }
    }
    let nodes = super.normalize(child);
    if (sample) {
      if (type === "prepend") {
        if (this.nodes.length > 1) {
          sample.raws.before = this.nodes[1].raws.before;
        } else {
          delete sample.raws.before;
        }
      } else if (this.first !== sample) {
        for (let node2 of nodes) {
          if (!keepBefore.has(node2.raws)) {
            node2.raws.before = sample.raws.before;
          }
        }
      }
    }
    return nodes;
  }
  removeChild(child, ignore) {
    let index = this.index(child);
    if (!ignore && index === 0 && this.nodes.length > 1) {
      this.nodes[1].raws.before = this.nodes[index].raws.before;
    }
    return super.removeChild(child);
  }
  toResult(opts = {}) {
    let lazy = new LazyResult$3(new Processor$2(), this, opts);
    return lazy.stringify();
  }
};
Root$5.registerLazyResult = (dependant) => {
  LazyResult$3 = dependant;
};
Root$5.registerProcessor = (dependant) => {
  Processor$2 = dependant;
};
var root = Root$5;
Root$5.default = Root$5;
Container$5.registerRoot(Root$5);
let list$2 = {
  comma(string) {
    return list$2.split(string, [","], true);
  },
  space(string) {
    let spaces = [" ", "\n", "	"];
    return list$2.split(string, spaces);
  },
  split(string, separators, last) {
    if (typeof string !== "string") return [];
    let array = [];
    let current = "";
    let split = false;
    let func = 0;
    let inQuote = false;
    let prevQuote = "";
    let escape = false;
    let inComment = false;
    for (let i = 0; i < string.length; i++) {
      let letter = string[i];
      if (inComment) {
        current += letter;
        if (letter === "*" && string[i + 1] === "/") {
          current += "/";
          i += 1;
          inComment = false;
        }
        continue;
      }
      if (escape) {
        escape = false;
      } else if (letter === "\\") {
        escape = true;
      } else if (inQuote) {
        if (letter === prevQuote) {
          inQuote = false;
        }
      } else if (letter === '"' || letter === "'") {
        inQuote = true;
        prevQuote = letter;
      } else if (letter === "/" && string[i + 1] === "*") {
        current += "/*";
        i += 1;
        inComment = true;
        continue;
      } else if (letter === "(") {
        func += 1;
      } else if (letter === ")") {
        if (func > 0) func -= 1;
      } else if (func === 0) {
        if (separators.includes(letter)) split = true;
      }
      if (split) {
        let value2 = current.trim();
        if (last || value2 !== "") array.push(value2);
        current = "";
        split = false;
      } else {
        current += letter;
      }
    }
    let value = current.trim();
    if (last || value !== "") array.push(value);
    return array;
  }
};
var list_1 = list$2;
list$2.default = list$2;
let Container$4 = container;
let list$1 = list_1;
let Rule$3 = class Rule extends Container$4 {
  get selectors() {
    return list$1.comma(this.selector);
  }
  set selectors(values) {
    let match = this.selector ? this.selector.match(/,\s*/) : null;
    let sep2 = match ? match[0] : "," + this.raw("between", "beforeOpen");
    this.selector = values.join(sep2);
  }
  constructor(defaults) {
    super(defaults);
    this.type = "rule";
    if (!this.nodes) this.nodes = [];
  }
};
var rule = Rule$3;
Rule$3.default = Rule$3;
Container$4.registerRule(Rule$3);
let AtRule$2 = atRule;
let Comment$2 = comment;
let Declaration$2 = declaration;
let Input$3 = input;
let PreviousMap2 = previousMap;
let Root$4 = root;
let Rule$2 = rule;
function hydrateInputs(json, inputs) {
  if (!json.inputs) return inputs;
  return json.inputs.map((input2) => {
    let inputHydrated = { ...input2, __proto__: Input$3.prototype };
    if (inputHydrated.map) {
      inputHydrated.map = {
        ...inputHydrated.map,
        __proto__: PreviousMap2.prototype
      };
    }
    return inputHydrated;
  });
}
function constructNode(json, inputs, children) {
  let defaults = { ...json };
  delete defaults.inputs;
  delete defaults.nodes;
  if (defaults.source) {
    let { inputId, ...source } = defaults.source;
    defaults.source = source;
    if (inputId != null) {
      defaults.source.input = inputs[inputId];
    }
  }
  let node2;
  if (defaults.type === "root") {
    node2 = new Root$4(defaults);
  } else if (defaults.type === "decl") {
    node2 = new Declaration$2(defaults);
  } else if (defaults.type === "rule") {
    node2 = new Rule$2(defaults);
  } else if (defaults.type === "comment") {
    node2 = new Comment$2(defaults);
  } else if (defaults.type === "atrule") {
    node2 = new AtRule$2(defaults);
  } else {
    throw new Error("Unknown node type: " + json.type);
  }
  if (children) {
    node2.nodes = children;
    for (let child of children) child.parent = node2;
  }
  return node2;
}
function fromJSON$1(json, inputs) {
  if (Array.isArray(json)) return json.map((n) => fromJSON$1(n));
  let result2;
  let stack = [
    { childIndex: 0, children: [], inputs: hydrateInputs(json, inputs), json }
  ];
  while (stack.length > 0) {
    let frame = stack[stack.length - 1];
    let jsonNodes = frame.json.nodes;
    if (jsonNodes && frame.childIndex < jsonNodes.length) {
      let childJson = jsonNodes[frame.childIndex];
      frame.childIndex += 1;
      stack.push({
        childIndex: 0,
        children: [],
        inputs: hydrateInputs(childJson, frame.inputs),
        json: childJson
      });
      continue;
    }
    stack.pop();
    let node2 = constructNode(
      frame.json,
      frame.inputs,
      jsonNodes ? frame.children : void 0
    );
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node2);
    } else {
      result2 = node2;
    }
  }
  return result2;
}
var fromJSON_1 = fromJSON$1;
fromJSON$1.default = fromJSON$1;
let { dirname, relative, resolve, sep } = require$$2;
let { SourceMapConsumer, SourceMapGenerator } = require$$2;
let { pathToFileURL } = require$$2;
let Input$2 = input;
let sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
let pathAvailable = Boolean(dirname && resolve && relative && sep);
let MapGenerator$2 = class MapGenerator {
  constructor(stringify2, root2, opts, cssString) {
    this.stringify = stringify2;
    this.mapOpts = opts.map || {};
    this.root = root2;
    this.opts = opts;
    this.css = cssString;
    this.originalCSS = cssString;
    this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute;
    this.memoizedFileURLs = /* @__PURE__ */ new Map();
    this.memoizedPaths = /* @__PURE__ */ new Map();
    this.memoizedURLs = /* @__PURE__ */ new Map();
  }
  addAnnotation() {
    let content;
    if (this.isInline()) {
      content = "data:application/json;base64," + this.toBase64(this.map.toString());
    } else if (typeof this.mapOpts.annotation === "string") {
      content = this.mapOpts.annotation;
    } else if (typeof this.mapOpts.annotation === "function") {
      content = this.mapOpts.annotation(this.opts.to, this.root);
    } else {
      content = this.outputFile() + ".map";
    }
    let eol = "\n";
    if (this.css.includes("\r\n")) eol = "\r\n";
    this.css += eol + "/*# sourceMappingURL=" + content + " */";
  }
  applyPrevMaps() {
    for (let prev of this.previous()) {
      let from = this.toUrl(this.path(prev.file));
      let root2 = prev.root || dirname(prev.file);
      let map;
      if (this.mapOpts.sourcesContent === false) {
        map = new SourceMapConsumer(prev.text);
        if (map.sourcesContent) {
          map.sourcesContent = null;
        }
      } else {
        map = prev.consumer();
      }
      this.map.applySourceMap(map, from, this.toUrl(this.path(root2)));
    }
  }
  clearAnnotation() {
    if (this.mapOpts.annotation === false) return;
    if (this.root) {
      let node2;
      for (let i = this.root.nodes.length - 1; i >= 0; i--) {
        node2 = this.root.nodes[i];
        if (node2.type !== "comment") continue;
        if (node2.text.startsWith("# sourceMappingURL=")) {
          this.root.removeChild(i);
        }
      }
    } else if (this.css) {
      let annotation = "/*# sourceMappingURL=";
      let css = "";
      let cursor = 0;
      let startIndex;
      while ((startIndex = this.css.indexOf(annotation, cursor)) !== -1) {
        let endIndex = this.css.indexOf("*/", startIndex + annotation.length);
        if (endIndex === -1) break;
        while (startIndex > cursor && this.css[startIndex - 1] === "\n") {
          startIndex--;
        }
        css += this.css.slice(cursor, startIndex);
        cursor = endIndex + 2;
      }
      if (cursor > 0) this.css = css + this.css.slice(cursor);
    }
  }
  generate() {
    this.clearAnnotation();
    if (pathAvailable && sourceMapAvailable && this.isMap()) {
      return this.generateMap();
    } else {
      let result2 = "";
      this.stringify(this.root, (i) => {
        result2 += i;
      });
      return [result2];
    }
  }
  generateMap() {
    if (this.root) {
      this.generateString();
    } else if (this.previous().length === 1) {
      let prev = this.previous()[0].consumer();
      prev.file = this.outputFile();
      this.map = SourceMapGenerator.fromSourceMap(prev, {
        ignoreInvalidMapping: true
      });
    } else {
      this.map = new SourceMapGenerator({
        file: this.outputFile(),
        ignoreInvalidMapping: true
      });
      this.map.addMapping({
        generated: { column: 0, line: 1 },
        original: { column: 0, line: 1 },
        source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
      });
    }
    if (this.isSourcesContent()) this.setSourcesContent();
    if (this.root && this.previous().length > 0) this.applyPrevMaps();
    if (this.isAnnotation()) this.addAnnotation();
    if (this.isInline()) {
      return [this.css];
    } else {
      return [this.css, this.map];
    }
  }
  generateString() {
    this.css = "";
    this.map = new SourceMapGenerator({
      file: this.outputFile(),
      ignoreInvalidMapping: true
    });
    let line = 1;
    let column = 1;
    let noSource = "<no source>";
    let mapping = {
      generated: { column: 0, line: 0 },
      original: { column: 0, line: 0 },
      source: ""
    };
    let last, lines;
    this.stringify(this.root, (str, node2, type) => {
      this.css += str;
      if (node2 && type !== "end") {
        mapping.generated.line = line;
        mapping.generated.column = column - 1;
        if (node2.source && node2.source.start) {
          mapping.source = this.sourcePath(node2);
          mapping.original.line = node2.source.start.line;
          mapping.original.column = node2.source.start.column - 1;
          this.map.addMapping(mapping);
        } else {
          mapping.source = noSource;
          mapping.original.line = 1;
          mapping.original.column = 0;
          this.map.addMapping(mapping);
        }
      }
      lines = str.match(/\n/g);
      if (lines) {
        line += lines.length;
        last = str.lastIndexOf("\n");
        column = str.length - last;
      } else {
        column += str.length;
      }
      if (node2 && type !== "start") {
        let p = node2.parent || { raws: {} };
        let childless = node2.type === "decl" || node2.type === "atrule" && !node2.nodes;
        if (!childless || node2 !== p.last || p.raws.semicolon) {
          if (node2.source && node2.source.end) {
            mapping.source = this.sourcePath(node2);
            mapping.original.line = node2.source.end.line;
            mapping.original.column = node2.source.end.column - 1;
            mapping.generated.line = line;
            mapping.generated.column = column - 2;
            this.map.addMapping(mapping);
          } else {
            mapping.source = noSource;
            mapping.original.line = 1;
            mapping.original.column = 0;
            mapping.generated.line = line;
            mapping.generated.column = column - 1;
            this.map.addMapping(mapping);
          }
        }
      }
    });
  }
  isAnnotation() {
    if (this.isInline()) {
      return true;
    }
    if (typeof this.mapOpts.annotation !== "undefined") {
      return this.mapOpts.annotation;
    }
    if (this.previous().length) {
      return this.previous().some((i) => i.annotation);
    }
    return true;
  }
  isInline() {
    if (typeof this.mapOpts.inline !== "undefined") {
      return this.mapOpts.inline;
    }
    let annotation = this.mapOpts.annotation;
    if (typeof annotation !== "undefined" && annotation !== true) {
      return false;
    }
    if (this.previous().length) {
      return this.previous().some((i) => i.inline);
    }
    return true;
  }
  isMap() {
    if (typeof this.opts.map !== "undefined") {
      return !!this.opts.map;
    }
    return this.previous().length > 0;
  }
  isSourcesContent() {
    if (typeof this.mapOpts.sourcesContent !== "undefined") {
      return this.mapOpts.sourcesContent;
    }
    if (this.previous().length) {
      return this.previous().some((i) => i.withContent());
    }
    return true;
  }
  outputFile() {
    if (this.opts.to) {
      return this.path(this.opts.to);
    } else if (this.opts.from) {
      return this.path(this.opts.from);
    } else {
      return "to.css";
    }
  }
  path(file) {
    if (this.mapOpts.absolute) return file;
    if (file.charCodeAt(0) === 60) return file;
    if (/^\w+:\/\//.test(file)) return file;
    let cached = this.memoizedPaths.get(file);
    if (cached) return cached;
    let from = this.opts.to ? dirname(this.opts.to) : ".";
    if (typeof this.mapOpts.annotation === "string") {
      from = dirname(resolve(from, this.mapOpts.annotation));
    }
    let path = relative(from, file);
    this.memoizedPaths.set(file, path);
    return path;
  }
  previous() {
    if (!this.previousMaps) {
      this.previousMaps = [];
      if (this.root) {
        this.root.walk((node2) => {
          if (node2.source && node2.source.input.map) {
            let map = node2.source.input.map;
            if (!this.previousMaps.includes(map)) {
              this.previousMaps.push(map);
            }
          }
        });
      } else {
        let input2 = new Input$2(this.originalCSS, this.opts);
        if (input2.map) this.previousMaps.push(input2.map);
      }
    }
    return this.previousMaps;
  }
  setSourcesContent() {
    let already = {};
    if (this.root) {
      this.root.walk((node2) => {
        if (node2.source) {
          let from = node2.source.input.from;
          if (from && !already[from]) {
            already[from] = true;
            let fromUrl = this.usesFileUrls ? this.toFileUrl(from) : this.toUrl(this.path(from));
            this.map.setSourceContent(fromUrl, node2.source.input.css);
          }
        }
      });
    } else if (this.css) {
      let from = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
      this.map.setSourceContent(from, this.css);
    }
  }
  sourcePath(node2) {
    if (this.mapOpts.from) {
      return this.toUrl(this.mapOpts.from);
    } else if (this.usesFileUrls) {
      return this.toFileUrl(node2.source.input.from);
    } else {
      return this.toUrl(this.path(node2.source.input.from));
    }
  }
  toBase64(str) {
    if (Buffer) {
      return Buffer.from(str).toString("base64");
    } else {
      return window.btoa(unescape(encodeURIComponent(str)));
    }
  }
  toFileUrl(path) {
    let cached = this.memoizedFileURLs.get(path);
    if (cached) return cached;
    if (pathToFileURL) {
      let fileURL = pathToFileURL(path).toString();
      this.memoizedFileURLs.set(path, fileURL);
      return fileURL;
    } else {
      throw new Error(
        "`map.absolute` option is not available in this PostCSS build"
      );
    }
  }
  toUrl(path) {
    let cached = this.memoizedURLs.get(path);
    if (cached) return cached;
    if (sep === "\\") {
      path = path.replace(/\\/g, "/");
    }
    let url = encodeURI(path).replace(/[#?]/g, encodeURIComponent);
    this.memoizedURLs.set(path, url);
    return url;
  }
};
var mapGenerator = MapGenerator$2;
const SINGLE_QUOTE = "'".charCodeAt(0);
const DOUBLE_QUOTE = '"'.charCodeAt(0);
const BACKSLASH = "\\".charCodeAt(0);
const SLASH = "/".charCodeAt(0);
const NEWLINE = "\n".charCodeAt(0);
const SPACE = " ".charCodeAt(0);
const FEED = "\f".charCodeAt(0);
const TAB = "	".charCodeAt(0);
const CR = "\r".charCodeAt(0);
const OPEN_SQUARE = "[".charCodeAt(0);
const CLOSE_SQUARE = "]".charCodeAt(0);
const OPEN_PARENTHESES = "(".charCodeAt(0);
const CLOSE_PARENTHESES = ")".charCodeAt(0);
const OPEN_CURLY = "{".charCodeAt(0);
const CLOSE_CURLY = "}".charCodeAt(0);
const SEMICOLON = ";".charCodeAt(0);
const ASTERISK = "*".charCodeAt(0);
const COLON = ":".charCodeAt(0);
const AT = "@".charCodeAt(0);
const RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
const RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
const RE_BAD_BRACKET = /.[\r\n"'(/\\]/;
const RE_HEX_ESCAPE = /[\da-f]/i;
var tokenize = function tokenizer(input2, options2 = {}) {
  let css = input2.css.valueOf();
  let ignore = options2.ignoreErrors;
  let code, content, escape, next, quote;
  let currentToken, escaped, escapePos, n, prev;
  let length = css.length;
  let pos = 0;
  let buffer = [];
  let returned = [];
  let lastBadParen = -1;
  function position() {
    return pos;
  }
  function unclosed(what) {
    throw input2.error("Unclosed " + what, pos);
  }
  function endOfFile() {
    return returned.length === 0 && pos >= length;
  }
  function nextToken(opts) {
    if (returned.length) return returned.pop();
    if (pos >= length) return;
    let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
    code = css.charCodeAt(pos);
    switch (code) {
      case NEWLINE:
      case SPACE:
      case TAB:
      case CR:
      case FEED: {
        next = pos;
        do {
          next += 1;
          code = css.charCodeAt(next);
        } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);
        currentToken = ["space", css.slice(pos, next)];
        pos = next - 1;
        break;
      }
      case OPEN_SQUARE:
      case CLOSE_SQUARE:
      case OPEN_CURLY:
      case CLOSE_CURLY:
      case COLON:
      case SEMICOLON:
      case CLOSE_PARENTHESES: {
        let controlChar = String.fromCharCode(code);
        currentToken = [controlChar, controlChar, pos];
        break;
      }
      case OPEN_PARENTHESES: {
        prev = buffer.length ? buffer.pop()[1] : "";
        n = css.charCodeAt(pos + 1);
        if (prev === "url" && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE && n !== SPACE && n !== NEWLINE && n !== TAB && n !== FEED && n !== CR) {
          next = pos;
          do {
            escaped = false;
            next = css.indexOf(")", next + 1);
            if (next === -1) {
              if (ignore || ignoreUnclosed) {
                next = pos;
                break;
              } else {
                unclosed("bracket");
              }
            }
            escapePos = next;
            while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
              escapePos -= 1;
              escaped = !escaped;
            }
          } while (escaped);
          currentToken = ["brackets", css.slice(pos, next + 1), pos, next];
          pos = next;
        } else if (pos <= lastBadParen) {
          currentToken = ["(", "(", pos];
        } else {
          next = css.indexOf(")", pos + 1);
          content = css.slice(pos, next + 1);
          if (next === -1 || RE_BAD_BRACKET.test(content)) {
            lastBadParen = next === -1 ? length : next;
            currentToken = ["(", "(", pos];
          } else {
            currentToken = ["brackets", content, pos, next];
            pos = next;
          }
        }
        break;
      }
      case SINGLE_QUOTE:
      case DOUBLE_QUOTE: {
        quote = code === SINGLE_QUOTE ? "'" : '"';
        next = pos;
        do {
          escaped = false;
          next = css.indexOf(quote, next + 1);
          if (next === -1) {
            if (ignore || ignoreUnclosed) {
              next = pos + 1;
              break;
            } else {
              unclosed("string");
            }
          }
          escapePos = next;
          while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
            escapePos -= 1;
            escaped = !escaped;
          }
        } while (escaped);
        currentToken = ["string", css.slice(pos, next + 1), pos, next];
        pos = next;
        break;
      }
      case AT: {
        RE_AT_END.lastIndex = pos + 1;
        RE_AT_END.test(css);
        if (RE_AT_END.lastIndex === 0) {
          next = css.length - 1;
        } else {
          next = RE_AT_END.lastIndex - 2;
        }
        currentToken = ["at-word", css.slice(pos, next + 1), pos, next];
        pos = next;
        break;
      }
      case BACKSLASH: {
        next = pos;
        escape = true;
        while (css.charCodeAt(next + 1) === BACKSLASH) {
          next += 1;
          escape = !escape;
        }
        code = css.charCodeAt(next + 1);
        if (escape && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
          next += 1;
          if (RE_HEX_ESCAPE.test(css.charAt(next))) {
            while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
              next += 1;
            }
            if (css.charCodeAt(next + 1) === SPACE) {
              next += 1;
            }
          }
        }
        currentToken = ["word", css.slice(pos, next + 1), pos, next];
        pos = next;
        break;
      }
      default: {
        if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
          next = css.indexOf("*/", pos + 2) + 1;
          if (next === 0) {
            if (ignore || ignoreUnclosed) {
              next = css.length;
            } else {
              unclosed("comment");
            }
          }
          currentToken = ["comment", css.slice(pos, next + 1), pos, next];
          pos = next;
        } else {
          RE_WORD_END.lastIndex = pos + 1;
          RE_WORD_END.test(css);
          if (RE_WORD_END.lastIndex === 0) {
            next = css.length - 1;
          } else {
            next = RE_WORD_END.lastIndex - 2;
          }
          currentToken = ["word", css.slice(pos, next + 1), pos, next];
          buffer.push(currentToken);
          pos = next;
        }
        break;
      }
    }
    pos++;
    return currentToken;
  }
  function back(token) {
    returned.push(token);
  }
  return {
    back,
    endOfFile,
    nextToken,
    position
  };
};
let AtRule$1 = atRule;
let Comment$1 = comment;
let Declaration$1 = declaration;
let Root$3 = root;
let Rule$1 = rule;
let tokenizer2 = tokenize;
const SAFE_COMMENT_NEIGHBOR = {
  empty: true,
  space: true
};
function findLastWithPosition(tokens) {
  for (let i = tokens.length - 1; i >= 0; i--) {
    let token = tokens[i];
    let pos = token[3] || token[2];
    if (pos) return pos;
  }
}
function tokensToString(tokens, from, to) {
  let result2 = "";
  for (let i = from; i < to; i++) result2 += tokens[i][1];
  return result2;
}
let Parser$1 = class Parser {
  constructor(input2) {
    this.input = input2;
    this.root = new Root$3();
    this.current = this.root;
    this.spaces = "";
    this.semicolon = false;
    this.createTokenizer();
    this.root.source = { input: input2, start: { column: 1, line: 1, offset: 0 } };
  }
  atrule(token) {
    let node2 = new AtRule$1();
    node2.name = token[1].slice(1);
    if (node2.name === "") {
      this.unnamedAtrule(node2, token);
    }
    this.init(node2, token[2]);
    let type;
    let prev;
    let shift;
    let last = false;
    let open = false;
    let params = [];
    let brackets = [];
    while (!this.tokenizer.endOfFile()) {
      token = this.tokenizer.nextToken();
      type = token[0];
      if (type === "(" || type === "[") {
        brackets.push(type === "(" ? ")" : "]");
      } else if (type === "{" && brackets.length > 0) {
        brackets.push("}");
      } else if (type === brackets[brackets.length - 1]) {
        brackets.pop();
      }
      if (brackets.length === 0) {
        if (type === ";") {
          node2.source.end = this.getPosition(token[2]);
          node2.source.end.offset++;
          this.semicolon = true;
          break;
        } else if (type === "{") {
          open = true;
          break;
        } else if (type === "}") {
          if (params.length > 0) {
            shift = params.length - 1;
            prev = params[shift];
            while (prev && prev[0] === "space") {
              prev = params[--shift];
            }
            if (prev) {
              node2.source.end = this.getPosition(prev[3] || prev[2]);
              node2.source.end.offset++;
            }
          }
          this.end(token);
          break;
        } else {
          params.push(token);
        }
      } else {
        params.push(token);
      }
      if (this.tokenizer.endOfFile()) {
        last = true;
        break;
      }
    }
    node2.raws.between = this.spacesAndCommentsFromEnd(params);
    if (params.length) {
      node2.raws.afterName = this.spacesAndCommentsFromStart(params);
      this.raw(node2, "params", params);
      if (last) {
        token = params[params.length - 1];
        node2.source.end = this.getPosition(token[3] || token[2]);
        node2.source.end.offset++;
        this.spaces = node2.raws.between;
        node2.raws.between = "";
      }
    } else {
      node2.raws.afterName = "";
      node2.params = "";
    }
    if (open) {
      node2.nodes = [];
      this.current = node2;
    }
  }
  checkMissedSemicolon(tokens) {
    let colon = this.colon(tokens);
    if (colon === false) return;
    let founded = 0;
    let token;
    for (let j = colon - 1; j >= 0; j--) {
      token = tokens[j];
      if (token[0] !== "space") {
        founded += 1;
        if (founded === 2) break;
      }
    }
    throw this.input.error(
      "Missed semicolon",
      token[0] === "word" ? token[3] + 1 : token[2]
    );
  }
  colon(tokens) {
    let brackets = 0;
    let prev, token, type;
    for (let [i, element] of tokens.entries()) {
      token = element;
      type = token[0];
      if (type === "(") {
        brackets += 1;
      }
      if (type === ")") {
        brackets -= 1;
      }
      if (brackets === 0 && type === ":") {
        if (!prev) {
          this.doubleColon(token);
        } else if (prev[0] === "word" && prev[1] === "progid") {
          continue;
        } else {
          return i;
        }
      }
      prev = token;
    }
    return false;
  }
  comment(token) {
    let node2 = new Comment$1();
    this.init(node2, token[2]);
    node2.source.end = this.getPosition(token[3] || token[2]);
    node2.source.end.offset++;
    let text2 = token[1].slice(2, -2);
    if (!text2.trim()) {
      node2.text = "";
      node2.raws.left = text2;
      node2.raws.right = "";
    } else {
      let match = text2.match(/^(\s*)([^]*\S)(\s*)$/);
      node2.text = match[2];
      node2.raws.left = match[1];
      node2.raws.right = match[3];
    }
  }
  createTokenizer() {
    this.tokenizer = tokenizer2(this.input);
  }
  decl(tokens, customProperty) {
    let node2 = new Declaration$1();
    this.init(node2, tokens[0][2]);
    let last = tokens[tokens.length - 1];
    if (last[0] === ";") {
      this.semicolon = true;
      tokens.pop();
    }
    node2.source.end = this.getPosition(
      last[3] || last[2] || findLastWithPosition(tokens)
    );
    node2.source.end.offset++;
    let start = 0;
    while (tokens[start][0] !== "word") {
      if (start === tokens.length - 1) this.unknownWord([tokens[start]]);
      start++;
    }
    node2.raws.before += tokensToString(tokens, 0, start);
    node2.source.start = this.getPosition(tokens[start][2]);
    let propStart = start;
    while (start < tokens.length) {
      let type = tokens[start][0];
      if (type === ":" || type === "space" || type === "comment") {
        break;
      }
      start++;
    }
    node2.prop = tokensToString(tokens, propStart, start);
    let betweenStart = start;
    let token;
    while (start < tokens.length) {
      token = tokens[start];
      start++;
      if (token[0] === ":") break;
      if (token[0] === "word" && /\w/.test(token[1])) {
        this.unknownWord([token]);
      }
    }
    node2.raws.between = tokensToString(tokens, betweenStart, start);
    if (node2.prop[0] === "_" || node2.prop[0] === "*") {
      node2.raws.before += node2.prop[0];
      node2.prop = node2.prop.slice(1);
    }
    let firstSpacesStart = start;
    while (start < tokens.length) {
      let next = tokens[start][0];
      if (next !== "space" && next !== "comment") break;
      start++;
    }
    let firstSpaces = tokens.slice(firstSpacesStart, start);
    tokens = tokens.slice(start);
    this.precheckMissedSemicolon(tokens);
    for (let i = tokens.length - 1; i >= 0; i--) {
      token = tokens[i];
      if (token[1].toLowerCase() === "!important") {
        node2.important = true;
        let string = this.stringFrom(tokens, i);
        string = this.spacesFromEnd(tokens) + string;
        if (string !== " !important") node2.raws.important = string;
        break;
      } else if (token[1].toLowerCase() === "important") {
        let cache = tokens.slice(0);
        let str = "";
        for (let j = i; j > 0; j--) {
          let type = cache[j][0];
          if (str.trim().startsWith("!") && type !== "space") {
            break;
          }
          str = cache.pop()[1] + str;
        }
        if (str.trim().startsWith("!")) {
          node2.important = true;
          node2.raws.important = str;
          tokens = cache;
        }
      }
      if (token[0] !== "space" && token[0] !== "comment") {
        break;
      }
    }
    let hasWord = tokens.some((i) => i[0] !== "space" && i[0] !== "comment");
    if (hasWord) {
      node2.raws.between += firstSpaces.map((i) => i[1]).join("");
      firstSpaces = [];
    }
    this.raw(node2, "value", firstSpaces.concat(tokens), customProperty);
    if (node2.value.includes(":") && !customProperty) {
      this.checkMissedSemicolon(tokens);
    }
  }
  doubleColon(token) {
    throw this.input.error(
      "Double colon",
      { offset: token[2] },
      { offset: token[2] + token[1].length }
    );
  }
  emptyRule(token) {
    let node2 = new Rule$1();
    this.init(node2, token[2]);
    node2.selector = "";
    node2.raws.between = "";
    this.current = node2;
  }
  end(token) {
    if (this.current.nodes && this.current.nodes.length) {
      this.current.raws.semicolon = this.semicolon;
    }
    this.semicolon = false;
    this.current.raws.after = (this.current.raws.after || "") + this.spaces;
    this.spaces = "";
    if (this.current.parent) {
      this.current.source.end = this.getPosition(token[2]);
      this.current.source.end.offset++;
      this.current = this.current.parent;
    } else {
      this.unexpectedClose(token);
    }
  }
  endFile() {
    if (this.current.parent) this.unclosedBlock();
    if (this.current.nodes && this.current.nodes.length) {
      this.current.raws.semicolon = this.semicolon;
    }
    this.current.raws.after = (this.current.raws.after || "") + this.spaces;
    this.root.source.end = this.getPosition(this.tokenizer.position());
  }
  freeSemicolon(token) {
    this.spaces += token[1];
    if (this.current.nodes) {
      let prev = this.current.nodes[this.current.nodes.length - 1];
      if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
        prev.raws.ownSemicolon = this.spaces;
        this.spaces = "";
        prev.source.end = this.getPosition(token[2]);
        prev.source.end.offset++;
      }
    }
  }
  // Helpers
  getPosition(offset) {
    let pos = this.input.fromOffset(offset);
    return {
      column: pos.col,
      line: pos.line,
      offset
    };
  }
  init(node2, offset) {
    this.current.push(node2);
    node2.source = {
      input: this.input,
      start: this.getPosition(offset)
    };
    node2.raws.before = this.spaces;
    this.spaces = "";
    if (node2.type !== "comment") this.semicolon = false;
  }
  other(start) {
    let end = false;
    let type = null;
    let colon = false;
    let bracket = null;
    let brackets = [];
    let customProperty = start[1].startsWith("--");
    let tokens = [];
    let token = start;
    while (token) {
      type = token[0];
      tokens.push(token);
      if (type === "(" || type === "[") {
        if (!bracket) bracket = token;
        brackets.push(type === "(" ? ")" : "]");
      } else if (customProperty && colon && type === "{") {
        if (!bracket) bracket = token;
        brackets.push("}");
      } else if (brackets.length === 0) {
        if (type === ";") {
          if (colon) {
            this.decl(tokens, customProperty);
            return;
          } else {
            break;
          }
        } else if (type === "{") {
          this.rule(tokens);
          return;
        } else if (type === "}") {
          this.tokenizer.back(tokens.pop());
          end = true;
          break;
        } else if (type === ":") {
          colon = true;
        }
      } else if (type === brackets[brackets.length - 1]) {
        brackets.pop();
        if (brackets.length === 0) bracket = null;
      }
      token = this.tokenizer.nextToken();
    }
    if (this.tokenizer.endOfFile()) end = true;
    if (brackets.length > 0) this.unclosedBracket(bracket);
    if (end && colon) {
      if (!customProperty) {
        while (tokens.length) {
          token = tokens[tokens.length - 1][0];
          if (token !== "space" && token !== "comment") break;
          this.tokenizer.back(tokens.pop());
        }
      }
      this.decl(tokens, customProperty);
    } else {
      this.unknownWord(tokens);
    }
  }
  parse() {
    let token;
    while (!this.tokenizer.endOfFile()) {
      token = this.tokenizer.nextToken();
      switch (token[0]) {
        case "space":
          this.spaces += token[1];
          break;
        case ";":
          this.freeSemicolon(token);
          break;
        case "}":
          this.end(token);
          break;
        case "comment":
          this.comment(token);
          break;
        case "at-word":
          this.atrule(token);
          break;
        case "{":
          this.emptyRule(token);
          break;
        default:
          this.other(token);
          break;
      }
    }
    this.endFile();
  }
  precheckMissedSemicolon() {
  }
  raw(node2, prop, tokens, customProperty) {
    let token, type;
    let length = tokens.length;
    let value = "";
    let last = "";
    let clean = true;
    let next, prev;
    for (let i = 0; i < length; i += 1) {
      token = tokens[i];
      type = token[0];
      if (type === "space" && i === length - 1 && !customProperty) {
        clean = false;
      } else if (type === "comment") {
        prev = tokens[i - 1] ? tokens[i - 1][0] : "empty";
        next = tokens[i + 1] ? tokens[i + 1][0] : "empty";
        if (!SAFE_COMMENT_NEIGHBOR[prev] && !SAFE_COMMENT_NEIGHBOR[next]) {
          if (last === ",") {
            clean = false;
          } else {
            value += token[1];
            last = token[1].slice(-1);
          }
        } else {
          clean = false;
        }
      } else {
        value += token[1];
        last = token[1].slice(-1);
      }
    }
    if (!clean) {
      let raw = tokens.reduce((all, i) => all + i[1], "");
      node2.raws[prop] = { raw, value };
    }
    node2[prop] = value;
  }
  rule(tokens) {
    tokens.pop();
    let node2 = new Rule$1();
    this.init(node2, tokens[0][2]);
    node2.raws.between = this.spacesAndCommentsFromEnd(tokens);
    this.raw(node2, "selector", tokens);
    this.current = node2;
  }
  spacesAndCommentsFromEnd(tokens) {
    let lastTokenType;
    let spaces = "";
    while (tokens.length) {
      lastTokenType = tokens[tokens.length - 1][0];
      if (lastTokenType !== "space" && lastTokenType !== "comment") break;
      spaces = tokens.pop()[1] + spaces;
    }
    return spaces;
  }
  // Errors
  spacesAndCommentsFromStart(tokens) {
    let next;
    let spaces = "";
    while (tokens.length) {
      next = tokens[0][0];
      if (next !== "space" && next !== "comment") break;
      spaces += tokens.shift()[1];
    }
    return spaces;
  }
  spacesFromEnd(tokens) {
    let lastTokenType;
    let spaces = "";
    while (tokens.length) {
      lastTokenType = tokens[tokens.length - 1][0];
      if (lastTokenType !== "space") break;
      spaces = tokens.pop()[1] + spaces;
    }
    return spaces;
  }
  stringFrom(tokens, from) {
    let result2 = "";
    for (let i = from; i < tokens.length; i++) {
      result2 += tokens[i][1];
    }
    tokens.splice(from, tokens.length - from);
    return result2;
  }
  unclosedBlock() {
    let pos = this.current.source.start;
    throw this.input.error("Unclosed block", pos.line, pos.column);
  }
  unclosedBracket(bracket) {
    throw this.input.error(
      "Unclosed bracket",
      { offset: bracket[2] },
      { offset: bracket[2] + 1 }
    );
  }
  unexpectedClose(token) {
    throw this.input.error(
      "Unexpected }",
      { offset: token[2] },
      { offset: token[2] + 1 }
    );
  }
  unknownWord(tokens) {
    throw this.input.error(
      "Unknown word " + tokens[0][1],
      { offset: tokens[0][2] },
      { offset: tokens[0][2] + tokens[0][1].length }
    );
  }
  unnamedAtrule(node2, token) {
    throw this.input.error(
      "At-rule without name",
      { offset: token[2] },
      { offset: token[2] + token[1].length }
    );
  }
};
var parser = Parser$1;
let Container$3 = container;
let Input$1 = input;
let Parser2 = parser;
function parse$3(css, opts) {
  let input2 = new Input$1(css, opts);
  let parser2 = new Parser2(input2);
  try {
    parser2.parse();
  } catch (e) {
    throw e;
  }
  return parser2.root;
}
var parse_1 = parse$3;
parse$3.default = parse$3;
Container$3.registerParse(parse$3);
let Container$2 = container;
let { my: my$1 } = symbols;
let Warning$2 = class Warning {
  constructor(text2, opts = {}) {
    this.type = "warning";
    this.text = text2;
    if (opts.node && opts.node.source) {
      if (!opts.node[my$1]) {
        Container$2.rebuild(opts.node);
      }
      let range = opts.node.rangeBy(opts);
      this.line = range.start.line;
      this.column = range.start.column;
      this.endLine = range.end.line;
      this.endColumn = range.end.column;
    }
    for (let opt in opts) this[opt] = opts[opt];
  }
  toString() {
    if (this.node) {
      return this.node.error(this.text, {
        index: this.index,
        plugin: this.plugin,
        word: this.word
      }).message;
    }
    if (this.plugin) {
      return this.plugin + ": " + this.text;
    }
    return this.text;
  }
};
var warning = Warning$2;
Warning$2.default = Warning$2;
let Warning$1 = warning;
let Result$3 = class Result {
  get content() {
    return this.css;
  }
  constructor(processor2, root2, opts) {
    this.processor = processor2;
    this.messages = [];
    this.root = root2;
    this.opts = opts;
    this.css = "";
    this.map = void 0;
  }
  toString() {
    return this.css;
  }
  warn(text2, opts = {}) {
    if (!opts.plugin) {
      if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
        opts.plugin = this.lastPlugin.postcssPlugin;
      }
    }
    let warning2 = new Warning$1(text2, opts);
    this.messages.push(warning2);
    return warning2;
  }
  warnings() {
    return this.messages.filter((i) => i.type === "warning");
  }
};
var result = Result$3;
Result$3.default = Result$3;
let Container$1 = container;
let Document$2 = document;
let MapGenerator$1 = mapGenerator;
let parse$2 = parse_1;
let Result$2 = result;
let Root$2 = root;
let stringify$2 = stringify_1;
let { isClean, my } = symbols;
const TYPE_TO_CLASS_NAME = {
  atrule: "AtRule",
  comment: "Comment",
  decl: "Declaration",
  document: "Document",
  root: "Root",
  rule: "Rule"
};
const PLUGIN_PROPS = {
  AtRule: true,
  AtRuleExit: true,
  Comment: true,
  CommentExit: true,
  Declaration: true,
  DeclarationExit: true,
  Document: true,
  DocumentExit: true,
  Once: true,
  OnceExit: true,
  postcssPlugin: true,
  prepare: true,
  Root: true,
  RootExit: true,
  Rule: true,
  RuleExit: true
};
const NOT_VISITORS = {
  Once: true,
  postcssPlugin: true,
  prepare: true
};
const CHILDREN = 0;
function isPromise(obj) {
  return typeof obj === "object" && typeof obj.then === "function";
}
function getEvents(node2) {
  let key = false;
  let type = TYPE_TO_CLASS_NAME[node2.type];
  if (node2.type === "decl") {
    key = node2.prop.toLowerCase();
  } else if (node2.type === "atrule") {
    key = node2.name.toLowerCase();
  }
  if (key && node2.append) {
    return [
      type,
      type + "-" + key,
      CHILDREN,
      type + "Exit",
      type + "Exit-" + key
    ];
  } else if (key) {
    return [type, type + "-" + key, type + "Exit", type + "Exit-" + key];
  } else if (node2.append) {
    return [type, CHILDREN, type + "Exit"];
  } else {
    return [type, type + "Exit"];
  }
}
function toStack(node2) {
  let events;
  if (node2.type === "document") {
    events = ["Document", CHILDREN, "DocumentExit"];
  } else if (node2.type === "root") {
    events = ["Root", CHILDREN, "RootExit"];
  } else {
    events = getEvents(node2);
  }
  return {
    eventIndex: 0,
    events,
    iterator: 0,
    node: node2,
    visitorIndex: 0,
    visitors: []
  };
}
function cleanMarks(node2) {
  let stack = [node2];
  while (stack.length > 0) {
    let next = stack.pop();
    next[isClean] = false;
    if (next.nodes) {
      for (let i of next.nodes) stack.push(i);
    }
  }
  return node2;
}
let postcss$2 = {};
let LazyResult$2 = class LazyResult {
  get content() {
    return this.stringify().content;
  }
  get css() {
    return this.stringify().css;
  }
  get map() {
    return this.stringify().map;
  }
  get messages() {
    return this.sync().messages;
  }
  get opts() {
    return this.result.opts;
  }
  get processor() {
    return this.result.processor;
  }
  get root() {
    return this.sync().root;
  }
  get [Symbol.toStringTag]() {
    return "LazyResult";
  }
  constructor(processor2, css, opts) {
    this.stringified = false;
    this.processed = false;
    let root2;
    if (typeof css === "object" && css !== null && (css.type === "root" || css.type === "document")) {
      root2 = cleanMarks(css);
    } else if (css instanceof LazyResult || css instanceof Result$2) {
      root2 = cleanMarks(css.root);
      if (css.map) {
        if (typeof opts.map === "undefined") opts.map = {};
        if (!opts.map.inline) opts.map.inline = false;
        opts.map.prev = css.map;
      }
    } else {
      let parser2 = parse$2;
      if (opts.syntax) parser2 = opts.syntax.parse;
      if (opts.parser) parser2 = opts.parser;
      if (parser2.parse) parser2 = parser2.parse;
      try {
        root2 = parser2(css, opts);
      } catch (error) {
        this.processed = true;
        this.error = error;
      }
      if (root2 && !root2[my]) {
        Container$1.rebuild(root2);
      }
    }
    this.result = new Result$2(processor2, root2, opts);
    this.helpers = { ...postcss$2, postcss: postcss$2, result: this.result };
    this.plugins = this.processor.plugins.map((plugin2) => {
      if (typeof plugin2 === "object" && plugin2.prepare) {
        return { ...plugin2, ...plugin2.prepare(this.result) };
      } else {
        return plugin2;
      }
    });
  }
  async() {
    if (this.error) return Promise.reject(this.error);
    if (this.processed) return Promise.resolve(this.result);
    if (!this.processing) {
      this.processing = this.runAsync();
    }
    return this.processing;
  }
  catch(onRejected) {
    return this.async().catch(onRejected);
  }
  finally(onFinally) {
    return this.async().then(onFinally, onFinally);
  }
  getAsyncError() {
    throw new Error("Use process(css).then(cb) to work with async plugins");
  }
  handleError(error, node2) {
    let plugin2 = this.result.lastPlugin;
    try {
      if (node2) node2.addToError(error);
      this.error = error;
      if (error.name === "CssSyntaxError" && !error.plugin) {
        error.plugin = plugin2.postcssPlugin;
        error.setMessage();
      } else if (plugin2.postcssVersion) {
        if (false) ;
      }
    } catch (err) {
      if (console && console.error) console.error(err);
    }
    return error;
  }
  prepareVisitors() {
    this.listeners = {};
    let add = (plugin2, type, cb) => {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push([plugin2, cb]);
    };
    for (let plugin2 of this.plugins) {
      if (typeof plugin2 === "object") {
        for (let event in plugin2) {
          if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
            throw new Error(
              `Unknown event ${event} in ${plugin2.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`
            );
          }
          if (!NOT_VISITORS[event]) {
            if (typeof plugin2[event] === "object") {
              for (let filter in plugin2[event]) {
                if (filter === "*") {
                  add(plugin2, event, plugin2[event][filter]);
                } else {
                  add(
                    plugin2,
                    event + "-" + filter.toLowerCase(),
                    plugin2[event][filter]
                  );
                }
              }
            } else if (typeof plugin2[event] === "function") {
              add(plugin2, event, plugin2[event]);
            }
          }
        }
      }
    }
    this.hasListener = Object.keys(this.listeners).length > 0;
  }
  async runAsync() {
    this.plugin = 0;
    for (let i = 0; i < this.plugins.length; i++) {
      let plugin2 = this.plugins[i];
      let promise = this.runOnRoot(plugin2);
      if (isPromise(promise)) {
        try {
          await promise;
        } catch (error) {
          throw this.handleError(error);
        }
      }
    }
    this.prepareVisitors();
    if (this.hasListener) {
      let root2 = this.result.root;
      while (!root2[isClean]) {
        root2[isClean] = true;
        let stack = [toStack(root2)];
        while (stack.length > 0) {
          let promise = this.visitTick(stack);
          if (isPromise(promise)) {
            try {
              await promise;
            } catch (e) {
              let node2 = stack[stack.length - 1].node;
              throw this.handleError(e, node2);
            }
          }
        }
      }
      if (this.listeners.OnceExit) {
        for (let [plugin2, visitor] of this.listeners.OnceExit) {
          this.result.lastPlugin = plugin2;
          try {
            if (root2.type === "document") {
              let roots = root2.nodes.map(
                (subRoot) => visitor(subRoot, this.helpers)
              );
              await Promise.all(roots);
            } else {
              await visitor(root2, this.helpers);
            }
          } catch (e) {
            throw this.handleError(e);
          }
        }
      }
    }
    this.processed = true;
    return this.stringify();
  }
  runOnRoot(plugin2) {
    this.result.lastPlugin = plugin2;
    try {
      if (typeof plugin2 === "object" && plugin2.Once) {
        if (this.result.root.type === "document") {
          let roots = this.result.root.nodes.map(
            (root2) => plugin2.Once(root2, this.helpers)
          );
          if (isPromise(roots[0])) {
            return Promise.all(roots);
          }
          return roots;
        }
        return plugin2.Once(this.result.root, this.helpers);
      } else if (typeof plugin2 === "function") {
        return plugin2(this.result.root, this.result);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }
  stringify() {
    if (this.error) throw this.error;
    if (this.stringified) return this.result;
    this.stringified = true;
    this.sync();
    let opts = this.result.opts;
    let str = stringify$2;
    if (opts.syntax) str = opts.syntax.stringify;
    if (opts.stringifier) str = opts.stringifier;
    if (str.stringify) str = str.stringify;
    let rootSource = this.result.root.source;
    if (opts.map === void 0 && !(rootSource && rootSource.input && rootSource.input.map)) {
      let result2 = "";
      str(this.result.root, (i) => {
        result2 += i;
      });
      this.result.css = result2;
      return this.result;
    }
    let map = new MapGenerator$1(str, this.result.root, this.result.opts);
    let data = map.generate();
    this.result.css = data[0];
    this.result.map = data[1];
    return this.result;
  }
  sync() {
    if (this.error) throw this.error;
    if (this.processed) return this.result;
    this.processed = true;
    if (this.processing) {
      throw this.getAsyncError();
    }
    for (let plugin2 of this.plugins) {
      let promise = this.runOnRoot(plugin2);
      if (isPromise(promise)) {
        throw this.getAsyncError();
      }
    }
    this.prepareVisitors();
    if (this.hasListener) {
      let root2 = this.result.root;
      while (!root2[isClean]) {
        root2[isClean] = true;
        this.walkSync(root2);
      }
      if (this.listeners.OnceExit) {
        if (root2.type === "document") {
          for (let subRoot of root2.nodes) {
            this.visitSync(this.listeners.OnceExit, subRoot);
          }
        } else {
          this.visitSync(this.listeners.OnceExit, root2);
        }
      }
    }
    return this.result;
  }
  then(onFulfilled, onRejected) {
    return this.async().then(onFulfilled, onRejected);
  }
  toString() {
    return this.css;
  }
  visitSync(visitors, node2) {
    for (let [plugin2, visitor] of visitors) {
      this.result.lastPlugin = plugin2;
      let promise;
      try {
        promise = visitor(node2, this.helpers);
      } catch (e) {
        throw this.handleError(e, node2.proxyOf);
      }
      if (node2.type !== "root" && node2.type !== "document" && !node2.parent) {
        return true;
      }
      if (isPromise(promise)) {
        throw this.getAsyncError();
      }
    }
  }
  visitTick(stack) {
    let visit = stack[stack.length - 1];
    let { node: node2, visitors } = visit;
    if (node2.type !== "root" && node2.type !== "document" && !node2.parent) {
      stack.pop();
      return;
    }
    if (visitors.length > 0 && visit.visitorIndex < visitors.length) {
      let [plugin2, visitor] = visitors[visit.visitorIndex];
      visit.visitorIndex += 1;
      if (visit.visitorIndex === visitors.length) {
        visit.visitors = [];
        visit.visitorIndex = 0;
      }
      this.result.lastPlugin = plugin2;
      try {
        return visitor(node2.toProxy(), this.helpers);
      } catch (e) {
        throw this.handleError(e, node2);
      }
    }
    if (visit.iterator !== 0) {
      let iterator = visit.iterator;
      if (visit.descending) {
        visit.descending = false;
        node2.indexes[iterator] += 1;
      }
      let child;
      while (child = node2.nodes[node2.indexes[iterator]]) {
        if (!child[isClean]) {
          child[isClean] = true;
          visit.descending = true;
          stack.push(toStack(child));
          return;
        }
        node2.indexes[iterator] += 1;
      }
      visit.iterator = 0;
      delete node2.indexes[iterator];
    }
    let events = visit.events;
    while (visit.eventIndex < events.length) {
      let event = events[visit.eventIndex];
      visit.eventIndex += 1;
      if (event === CHILDREN) {
        if (node2.nodes && node2.nodes.length) {
          node2[isClean] = true;
          visit.iterator = node2.getIterator();
        }
        return;
      } else if (this.listeners[event]) {
        visit.visitors = this.listeners[event];
        return;
      }
    }
    stack.pop();
  }
  walkSync(node2) {
    node2[isClean] = true;
    let stack = [{ eventIndex: 0, events: getEvents(node2), iterator: 0, node: node2 }];
    while (stack.length > 0) {
      let visit = stack[stack.length - 1];
      let visitNode = visit.node;
      if (visit.iterator !== 0) {
        let iterator = visit.iterator;
        if (visit.descending) {
          visit.descending = false;
          visitNode.indexes[iterator] += 1;
        }
        let child;
        let descended = false;
        while (child = visitNode.nodes[visitNode.indexes[iterator]]) {
          if (!child[isClean]) {
            child[isClean] = true;
            visit.descending = true;
            stack.push({
              eventIndex: 0,
              events: getEvents(child),
              iterator: 0,
              node: child
            });
            descended = true;
            break;
          }
          visitNode.indexes[iterator] += 1;
        }
        if (descended) continue;
        visit.iterator = 0;
        delete visitNode.indexes[iterator];
      }
      if (visit.eventIndex < visit.events.length) {
        let event = visit.events[visit.eventIndex];
        visit.eventIndex += 1;
        if (event === CHILDREN) {
          if (visitNode.nodes && visitNode.nodes.length) {
            visit.iterator = visitNode.getIterator();
          }
        } else {
          let visitors = this.listeners[event];
          if (visitors) {
            if (this.visitSync(visitors, visitNode.toProxy())) stack.pop();
          }
        }
        continue;
      }
      stack.pop();
    }
  }
  warnings() {
    return this.sync().warnings();
  }
};
LazyResult$2.registerPostcss = (dependant) => {
  postcss$2 = dependant;
};
var lazyResult = LazyResult$2;
LazyResult$2.default = LazyResult$2;
Root$2.registerLazyResult(LazyResult$2);
Document$2.registerLazyResult(LazyResult$2);
let MapGenerator2 = mapGenerator;
let parse$1 = parse_1;
let Result$1 = result;
let stringify$1 = stringify_1;
let NoWorkResult$1 = class NoWorkResult {
  get content() {
    return this.result.css;
  }
  get css() {
    return this.result.css;
  }
  get map() {
    return this.result.map;
  }
  get messages() {
    return [];
  }
  get opts() {
    return this.result.opts;
  }
  get processor() {
    return this.result.processor;
  }
  get root() {
    if (this._root) {
      return this._root;
    }
    let root2;
    let parser2 = parse$1;
    try {
      root2 = parser2(this._css, this._opts);
    } catch (error) {
      this.error = error;
    }
    if (this.error) {
      throw this.error;
    } else {
      this._root = root2;
      return root2;
    }
  }
  get [Symbol.toStringTag]() {
    return "NoWorkResult";
  }
  constructor(processor2, css, opts) {
    css = css.toString();
    this.stringified = false;
    this._processor = processor2;
    this._css = css;
    this._opts = opts;
    this._map = void 0;
    let str = stringify$1;
    this.result = new Result$1(this._processor, void 0, this._opts);
    this.result.css = css;
    let self = this;
    Object.defineProperty(this.result, "root", {
      get() {
        return self.root;
      }
    });
    let map = new MapGenerator2(str, void 0, this._opts, css);
    if (map.isMap()) {
      let [generatedCSS, generatedMap] = map.generate();
      if (generatedCSS) {
        this.result.css = generatedCSS;
      }
      if (generatedMap) {
        this.result.map = generatedMap;
      }
    } else {
      map.clearAnnotation();
      this.result.css = map.css;
    }
  }
  async() {
    if (this.error) return Promise.reject(this.error);
    return Promise.resolve(this.result);
  }
  catch(onRejected) {
    return this.async().catch(onRejected);
  }
  finally(onFinally) {
    return this.async().then(onFinally, onFinally);
  }
  sync() {
    if (this.error) throw this.error;
    return this.result;
  }
  then(onFulfilled, onRejected) {
    return this.async().then(onFulfilled, onRejected);
  }
  toString() {
    return this._css;
  }
  warnings() {
    return [];
  }
};
var noWorkResult = NoWorkResult$1;
NoWorkResult$1.default = NoWorkResult$1;
let Document$1 = document;
let LazyResult$1 = lazyResult;
let NoWorkResult2 = noWorkResult;
let Root$1 = root;
let Processor$1 = class Processor {
  constructor(plugins = []) {
    this.version = "8.5.31";
    this.plugins = this.normalize(plugins);
  }
  normalize(plugins) {
    let normalized = [];
    for (let i of plugins) {
      if (i.postcss === true) {
        i = i();
      } else if (i.postcss) {
        i = i.postcss;
      }
      if (typeof i === "object" && Array.isArray(i.plugins)) {
        normalized = normalized.concat(i.plugins);
      } else if (typeof i === "object" && i.postcssPlugin) {
        normalized.push(i);
      } else if (typeof i === "function") {
        normalized.push(i);
      } else if (typeof i === "object" && (i.parse || i.stringify)) ;
      else {
        throw new Error(i + " is not a PostCSS plugin");
      }
    }
    return normalized;
  }
  process(css, opts = {}) {
    if (!this.plugins.length && !opts.parser && !opts.stringifier && !opts.syntax) {
      return new NoWorkResult2(this, css, opts);
    } else {
      return new LazyResult$1(this, css, opts);
    }
  }
  use(plugin2) {
    this.plugins = this.plugins.concat(this.normalize([plugin2]));
    return this;
  }
};
var processor = Processor$1;
Processor$1.default = Processor$1;
Root$1.registerProcessor(Processor$1);
Document$1.registerProcessor(Processor$1);
let AtRule2 = atRule;
let Comment2 = comment;
let Container2 = container;
let CssSyntaxError2 = cssSyntaxError;
let Declaration2 = declaration;
let Document2 = document;
let fromJSON = fromJSON_1;
let Input2 = input;
let LazyResult2 = lazyResult;
let list = list_1;
let Node2 = node;
let parse = parse_1;
let Processor2 = processor;
let Result2 = result;
let Root2 = root;
let Rule2 = rule;
let stringify = stringify_1;
let Warning2 = warning;
function postcss(...plugins) {
  if (plugins.length === 1 && Array.isArray(plugins[0])) {
    plugins = plugins[0];
  }
  return new Processor2(plugins);
}
postcss.plugin = function plugin(name, initializer) {
  let warningPrinted = false;
  function creator(...args) {
    if (console && console.warn && !warningPrinted) {
      warningPrinted = true;
      console.warn(
        name + ": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"
      );
    }
    let transformer = initializer(...args);
    transformer.postcssPlugin = name;
    transformer.postcssVersion = new Processor2().version;
    return transformer;
  }
  let cache;
  Object.defineProperty(creator, "postcss", {
    get() {
      if (!cache) cache = creator();
      return cache;
    }
  });
  creator.process = function(css, processOpts, pluginOpts) {
    return postcss([creator(pluginOpts)]).process(css, processOpts);
  };
  return creator;
};
postcss.stringify = stringify;
postcss.parse = parse;
postcss.fromJSON = fromJSON;
postcss.list = list;
postcss.comment = (defaults) => new Comment2(defaults);
postcss.atRule = (defaults) => new AtRule2(defaults);
postcss.decl = (defaults) => new Declaration2(defaults);
postcss.rule = (defaults) => new Rule2(defaults);
postcss.root = (defaults) => new Root2(defaults);
postcss.document = (defaults) => new Document2(defaults);
postcss.CssSyntaxError = CssSyntaxError2;
postcss.Declaration = Declaration2;
postcss.Container = Container2;
postcss.Processor = Processor2;
postcss.Document = Document2;
postcss.Comment = Comment2;
postcss.Warning = Warning2;
postcss.AtRule = AtRule2;
postcss.Result = Result2;
postcss.Input = Input2;
postcss.Rule = Rule2;
postcss.Root = Root2;
postcss.Node = Node2;
LazyResult2.registerPostcss(postcss);
var postcss_1 = postcss;
postcss.default = postcss;
const postcss$1 = /* @__PURE__ */ getDefaultExportFromCjs(postcss_1);
postcss$1.stringify;
postcss$1.fromJSON;
postcss$1.plugin;
postcss$1.parse;
postcss$1.list;
postcss$1.document;
postcss$1.comment;
postcss$1.atRule;
postcss$1.rule;
postcss$1.decl;
postcss$1.root;
postcss$1.CssSyntaxError;
postcss$1.Declaration;
postcss$1.Container;
postcss$1.Processor;
postcss$1.Document;
postcss$1.Comment;
postcss$1.Warning;
postcss$1.AtRule;
postcss$1.Result;
postcss$1.Input;
postcss$1.Rule;
postcss$1.Root;
postcss$1.Node;
const CSS_TARGETS = { background: "背景", backgroundImage: "背景图片", frame: "边框", icon: "图标", name: "名称", description: "说明", level: "等级文字", stageName: "阶段名称" };
const targetOk = (s) => s in CSS_TARGETS || /^element:[A-Za-z0-9_.:-]{1,160}$/.test(s);
const sameOwner = (a, b) => a.ownerKind === b.ownerKind && a.ownerId === b.ownerId && a.achievementId === b.achievementId;
function cssOwnerKey(row) {
  return `${row.ownerKind}/${row.achievementId}/${row.ownerId}`;
}
function parseElementCss(css) {
  if (typeof css !== "string" || css.length > 2e4) throw Error("每份元素 CSS 最多 20000 字符。");
  const root2 = postcss$1.parse(css);
  root2.walkAtRules((rule2) => {
    if (rule2.name !== "keyframes" || rule2.parent !== root2 || !/^[A-Za-z_][\w-]*$/.test(rule2.params)) throw rule2.error("这里只支持元素内样式和 @keyframes 动画。");
  });
  root2.walkRules((rule2) => {
    var _a;
    if (((_a = rule2.parent) == null ? void 0 : _a.type) === "atrule") {
      if (!rule2.selector.split(",").every((v) => /^(from|to|(?:\d+(?:\.\d+)?)%)$/.test(v.trim()))) throw rule2.error("关键帧位置需要 from、to 或百分比。");
    } else if (rule2.parent !== root2 || !rule2.selector.split(",").every((s) => /^&(?:(?::(?:hover|active|focus|focus-visible|focus-within|disabled))|(?:::?(?:before|after)))*(?:\s+img)?$/.test(s.trim()))) {
      throw rule2.error("元素状态请使用 &:hover、&::before 等写法；图片子层使用 & img，不支持全局选择器或规则嵌套。");
    }
  });
  root2.walkDecls((decl) => {
    var _a, _b;
    if (!/^(?:--[\w-]+|[a-zA-Z-]+)$/.test(decl.prop) || /^--achievement-/i.test(decl.prop)) throw decl.error("CSS 属性无效，不能修改成就系统的内部标记。");
    const decoded = decl.value.replace(/\\([\da-f]{1,6})\s?/gi, (_, n) => String.fromCodePoint(Math.min(parseInt(n, 16), 1114111))).replace(/\\(.)/g, "$1").replace(/\/\*[\s\S]*?\*\//g, "");
    if (/expression\s*\(|javascript:|(?:image-set|src)\s*\(/i.test(decoded)) throw decl.error("不支持此 CSS 资源或表达式。");
    for (const match of decoded.matchAll(/url\s*\(\s*([\s\S]*?)\s*\)/gi)) {
      const url = match[1].replace(/^(['"])([\s\S]*)\1$/, "$2");
      if (!/^(?:data:image\/|#)/i.test(url)) throw decl.error("CSS 图片仅支持 data:image 或 #片段；工程图片请用素材选择器。");
    }
    if (((_a = decl.parent) == null ? void 0 : _a.type) !== "root" && ((_b = decl.parent) == null ? void 0 : _b.type) !== "rule") throw decl.error("CSS 属性必须位于元素样式或关键帧中。");
  });
  return root2;
}
function parseCssRecords(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 1e4) throw Error("元素 CSS 需要结构化列表，最多 10000 项。");
  const seen = /* @__PURE__ */ new Set();
  return value.map((raw) => {
    if (!raw || typeof raw !== "object") throw Error("元素 CSS 配置无效。");
    const r = raw;
    if (!["appearance", "defaultStage", "stage"].includes(r.ownerKind) || !r.ownerId || typeof r.ownerId !== "string" || typeof r.achievementId !== "string" || r.ownerKind === "stage" && !r.achievementId) throw Error("元素 CSS 所属外观或阶段无效。");
    if (typeof r.target !== "string" || !targetOk(r.target) || !["both", "card", "popup"].includes(r.surface) || typeof r.replace !== "boolean" || typeof r.id !== "string") throw Error("元素 CSS 的元素、用途或编号无效。");
    const key = `${cssOwnerKey(r)}/${r.target}/${r.surface}`;
    if (seen.has(key)) throw Error("同一元素和用途只能配置一份专用 CSS。");
    seen.add(key);
    parseElementCss(r.css);
    return { id: r.id, ownerKind: r.ownerKind, ownerId: r.ownerId, achievementId: r.achievementId, target: r.target, surface: r.surface, css: r.css, replace: r.replace };
  });
}
function resolveElementCss(rows2, owners) {
  const result2 = [];
  for (const surface of ["card", "popup"]) {
    const layers = /* @__PURE__ */ new Map();
    for (const owner of owners) for (const scope of ["both", surface]) {
      for (const row of rows2.filter((r) => sameOwner(r, owner) && r.surface === scope)) {
        const list2 = row.replace ? [] : layers.get(row.target) ?? [];
        if (row.css.trim()) list2.push(row.css);
        layers.set(row.target, list2);
      }
    }
    for (const [target, blocks] of layers) for (const css of blocks) result2.push({ target, surface, css });
  }
  return result2;
}
function cssProperties(blocks) {
  const props = /* @__PURE__ */ new Set();
  for (const text2 of blocks) parseElementCss(text2).walkDecls((d) => {
    props.add(d.prop.toLowerCase());
  });
  return props;
}
function cssStopsEffect(properties, effect) {
  if (effect === "none") return false;
  if ([...properties].some((p) => p === "all" || p.startsWith("animation") || p.startsWith("transition"))) return true;
  return effect === "float" || effect === "rotate" ? ["transform", "translate", "rotate", "scale"].some((p) => properties.has(p)) : effect === "pulse" ? properties.has("opacity") : effect === "glow" && properties.has("filter");
}
function presentationKey(p) {
  return JSON.stringify([p.achievementId, p.stageId, p.surface]);
}
function parsePresentations(value) {
  if (!Array.isArray(value) || value.length > 1e4) throw Error("阶段表现需要结构化列表，最多 10000 项。");
  const keys = /* @__PURE__ */ new Set();
  const identifier = (v, empty = false) => typeof v === "string" && (empty && v === "" || /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(v));
  return value.map((raw) => {
    if (!raw || typeof raw !== "object") throw Error("阶段表现配置无效。");
    const row = raw;
    if (!identifier(row.achievementId, true) || !identifier(row.stageId) || !["card", "popup"].includes(row.surface) || !["custom", "inherit"].includes(row.mode)) throw Error("阶段表现的所属成就、阶段或位置无效。");
    if (row.contentOverride !== void 0 && typeof row.contentOverride !== "boolean") throw Error("内容覆盖选项无效");
    const key = presentationKey(row);
    if (keys.has(key)) throw Error("同一阶段的卡片或浮现只能配置一份。");
    keys.add(key);
    for (const k of ["enabled", "showLevel", "showStageName"]) if (typeof row[k] !== "boolean") throw Error("阶段表现开关必须为布尔值。");
    for (const k of ["nameMode", "descriptionMode", "iconMode"]) if (!["stage", "custom", "none", ...k === "iconMode" ? ["unknown"] : []].includes(row[k])) throw Error("阶段表现的内容方式无效。");
    for (const k of ["displayName", "description", "icon", "ui"]) if (typeof row[k] !== "string" || row[k].length > 1e3) throw Error("阶段表现内容无效或超过 1000 字符。");
    if (row.ui && !/^(?:ui:)?(?:@?[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(row.ui)) throw Error("浮现界面引用无效。");
    if (!Number.isFinite(row.durationMs) || row.durationMs !== 0 && (row.durationMs < 300 || row.durationMs > 6e4)) throw Error("浮现时长应为 300～60000 毫秒；0 表示沿用全局。");
    return {
      ...row.contentOverride !== void 0 ? { contentOverride: row.contentOverride } : {},
      ...optionalAppearance({ ...row }),
      ...parseAppearanceBinding({ ...row }),
      achievementId: row.achievementId,
      stageId: row.stageId,
      surface: row.surface,
      mode: row.mode,
      enabled: row.enabled,
      nameMode: row.nameMode,
      displayName: row.displayName,
      descriptionMode: row.descriptionMode,
      description: row.description,
      iconMode: row.iconMode,
      icon: row.icon,
      showLevel: row.showLevel,
      showStageName: row.showStageName,
      ui: row.ui,
      durationMs: row.durationMs
    };
  });
}
function legacyPresentation(stage, surface) {
  return {
    ...optionalAppearance({ ...stage }),
    ...parseAppearanceBinding(stage),
    achievementId: "",
    stageId: stage.id,
    surface,
    mode: "custom",
    enabled: stage.visible,
    nameMode: "stage",
    displayName: "",
    descriptionMode: "stage",
    description: "",
    iconMode: "stage",
    icon: "",
    showLevel: stage.showLevel,
    showStageName: stage.showStageName,
    ui: "",
    durationMs: 0
  };
}
function resolvePresentation(rows2, defaults, stage, achievementId, surface) {
  const own = achievementId ? rows2.find((p) => p.achievementId === achievementId && p.stageId === stage.id && p.surface === surface) : void 0;
  if ((own == null ? void 0 : own.mode) === "custom") return own;
  const shared = rows2.find((p) => !p.achievementId && p.stageId === stage.id && p.surface === surface);
  if ((shared == null ? void 0 : shared.mode) === "custom") return shared;
  const base = (own == null ? void 0 : own.mode) === "inherit" ? defaults.find((s) => s.id === stage.id) ?? stage : stage;
  const result2 = legacyPresentation(base, surface);
  const authored = base.appearanceSource && base.appearanceSource !== "local" || Object.entries(optionalAppearance({ ...base })).some(([k, v]) => v !== CARD_DEFAULTS[k]);
  return { ...result2, contentOverride: false, ...authored ? {} : { appearanceSource: "default" } };
}
function levelPresetId(level, surface) {
  return (surface === "popup" ? (level == null ? void 0 : level.popupAppearanceId) ?? (level == null ? void 0 : level.appearanceId) : level == null ? void 0 : level.appearanceId) ?? "";
}
function materializePresentation(p, presets, levelId = "") {
  const scheme = presentationPreset(p, presets, levelId, p.surface);
  if (!scheme) return p;
  return {
    ...p,
    ...p.contentOverride === false ? {
      nameMode: scheme.nameMode ?? "stage",
      descriptionMode: scheme.descriptionMode ?? "stage",
      iconMode: scheme.iconMode ?? "stage",
      showLevel: !scheme.levelVisibility || scheme.levelVisibility === "stage" ? p.showLevel : scheme.levelVisibility === "show",
      showStageName: !scheme.stageNameVisibility || scheme.stageNameVisibility === "stage" ? p.showStageName : scheme.stageNameVisibility === "show"
    } : {},
    ui: p.ui || scheme.ui || "",
    durationMs: p.durationMs || scheme.durationMs || 0
  };
}
function presentationCssOwners(p, stage, item, levels, presets) {
  var _a;
  const levelId = stage.levelMode === "custom" ? stage.levelId : item == null ? void 0 : item.levelId;
  const levelAppearanceId = levelPresetId(levels.find((l) => l.id === levelId), p.surface);
  const appearanceId = presets ? (_a = presentationPreset(p, presets, levelAppearanceId, p.surface)) == null ? void 0 : _a.id : p.appearanceSource === "preset" ? p.appearanceId : p.appearanceSource === "level" ? levelAppearanceId : "";
  return [
    ...appearanceId ? [{ ownerKind: "appearance", ownerId: appearanceId, achievementId: "" }] : [],
    { ownerKind: "defaultStage", ownerId: stage.id, achievementId: "" },
    ...item ? [{ ownerKind: "stage", ownerId: stage.id, achievementId: item.id }] : []
  ];
}
function resetSurfaceCss(rows2, achievementId, stageId, surface) {
  const matches = (r) => r.ownerKind === "stage" && r.achievementId === achievementId && r.ownerId === stageId;
  const other = surface === "card" ? "popup" : "card";
  const own = rows2.filter(matches);
  const result2 = rows2.filter((r) => !matches(r));
  for (const target of new Set(own.map((r) => r.target))) {
    const shared = own.find((r) => r.target === target && r.surface === "both");
    const specific = own.find((r) => r.target === target && r.surface === other);
    if ((specific == null ? void 0 : specific.replace) || !shared) {
      if (specific) result2.push(specific);
      continue;
    }
    if (!specific) {
      result2.push({ ...shared, surface: other });
      continue;
    }
    const root2 = parseElementCss(shared.css).clone(), frames = /* @__PURE__ */ new Map();
    root2.walkAtRules("keyframes", (r) => {
      frames.set(r.params, `inherited-${shared.id.replace(/[^\w-]/g, "-")}-${r.params}`);
      r.params = frames.get(r.params);
    });
    root2.walkDecls((d) => {
      if (/^(?:-webkit-)?animation(?:-name)?$/.test(d.prop)) d.value = d.value.replace(/[A-Za-z_][\w-]*/g, (name) => frames.get(name) ?? name);
    });
    result2.push({ ...specific, css: root2.toString() + "\n" + specific.css, replace: shared.replace });
  }
  return result2;
}
class AchievementError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AchievementError";
  }
}
function object$1(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AchievementError("INVALID_DATA", "需要结构化对象");
  return value;
}
function text(value, label, empty = false) {
  if (typeof value !== "string" || !empty && !value.trim() || value.length > 1e3) throw new AchievementError("INVALID_DATA", `${label}无效`);
  return value;
}
function id(value) {
  const result2 = text(value, "编号");
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(result2)) throw new AchievementError("INVALID_ID", "编号使用字母、数字、点、横线或下划线，最长 128 个字符");
  return result2;
}
function rows(value) {
  if (!Array.isArray(value) || value.length > 1e4) throw new AchievementError("INVALID_DATA", "记录应为不超过 10000 行的数组");
  return value;
}
function unique(values, label) {
  if (new Set(values.map((value) => value.id)).size !== values.length) throw new AchievementError("DUPLICATE_ID", `${label}编号重复`);
  return values;
}
const DEFAULT_LEVELS = [{ id: "bronze", name: "铜" }, { id: "silver", name: "银" }, { id: "gold", name: "金" }];
function presetStages(achievementId) {
  const base = { achievementId, id: "unknown", name: "未激活", visible: true, nameMode: "custom", displayName: "？？？", descriptionMode: "custom", description: "？？？", iconMode: "unknown", icon: "", levelMode: "base", levelId: "", showLevel: false, showStageName: false };
  return [
    { ...base, id: "hidden", name: "隐藏", visible: false },
    base,
    { ...base, id: "revealed", name: "已激活", nameMode: "base", descriptionMode: "base", iconMode: "base", showLevel: true }
  ];
}
function bool(value, fallback) {
  if (value === void 0) return fallback;
  if (typeof value !== "boolean") throw new AchievementError("INVALID_DATA", "阶段开关必须为布尔值");
  return value;
}
function mode(value, icon = false) {
  const result2 = value ?? "none";
  if (result2 === "base" || result2 === "custom" || result2 === "none" || icon && result2 === "unknown") return result2;
  throw new AchievementError("INVALID_DATA", "阶段内容来源无效");
}
function catalog(levelValues, achievementValues, stageValues = [], defaultStageValues = [], appearanceValues = [], cssValues = [], presentationValues = []) {
  const appearances = unique(rows(appearanceValues).map((value) => {
    const row = object$1(value);
    return { ...optionalAppearance(row), ...parsePresetOptions(row), id: id(row.id), name: text(row.name, "外观名称") };
  }), "共用外观");
  for (const surface of ["card", "popup"]) if (appearances.filter((p) => p.isDefault && p.surface === surface).length > 1) throw new AchievementError("INVALID_DATA", "每组只能有一个默认表现方案");
  const levels = unique(rows(levelValues).map((value) => {
    const row = object$1(value);
    return { id: id(row.id), name: text(row.name, "等级名称"), ...row.appearanceId ? { appearanceId: id(row.appearanceId) } : {}, ...row.popupAppearanceId ? { popupAppearanceId: id(row.popupAppearanceId) } : {} };
  }), "等级");
  const achievements = unique(rows(achievementValues).map((value) => {
    const row = object$1(value);
    const achievement = { id: id(row.id), name: text(row.name, "成就名称"), description: text(row.description ?? "", "成就说明", true), icon: text(row.icon ?? "", "图标", true), levelId: id(row.levelId), initialStageId: row.initialStageId ? id(row.initialStageId) : "unknown" };
    if (!levels.some((level) => level.id === achievement.levelId)) throw new AchievementError("LEVEL_NOT_FOUND", `成就 ${achievement.id} 的等级不存在`);
    return achievement;
  }), "成就");
  const parseStage = (value) => {
    const row = object$1(value);
    const levelMode = row.levelMode ?? "base";
    if (levelMode !== "base" && levelMode !== "custom") throw new AchievementError("INVALID_DATA", "阶段等级方式无效");
    const levelId = row.levelId ? id(row.levelId) : "";
    if (levelMode === "custom" && !levels.some((level) => level.id === levelId)) throw new AchievementError("LEVEL_NOT_FOUND", `阶段 ${row.id} 的等级不存在`);
    return {
      ...optionalAppearance(row),
      ...parseAppearanceBinding(row),
      id: id(row.id),
      name: text(row.name, "阶段名称"),
      visible: bool(row.visible, true),
      nameMode: mode(row.nameMode),
      displayName: text(row.displayName ?? "", "阶段显示名称", true),
      descriptionMode: mode(row.descriptionMode),
      description: text(row.description ?? "", "阶段说明", true),
      iconMode: mode(row.iconMode, true),
      icon: text(row.icon ?? "", "阶段图标", true),
      levelMode,
      levelId,
      showLevel: bool(row.showLevel, false),
      showStageName: bool(row.showStageName, false)
    };
  };
  const defaultStages = unique(defaultsFor(rows(defaultStageValues).map(parseStage)), "默认阶段");
  const stages = rows(stageValues).map((value) => {
    const row = object$1(value);
    const achievementId = id(row.achievementId);
    const disabled = bool(row.disabled, false);
    if (disabled) return { ...presetStages(achievementId)[1], id: id(row.id), disabled: true };
    return { ...parseStage(row), achievementId, disabled: false };
  });
  if (new Set(stages.map((s) => s.achievementId + "/" + s.id)).size !== stages.length) throw new AchievementError("DUPLICATE_ID", "同一成就的阶段编号重复");
  const result2 = { levels, achievements, stages, defaultStages, appearances, elementCss: parseCssRecords(cssValues), presentations: parsePresentations(presentationValues) };
  for (const item of achievements) if (item.initialStageId && !stagesFor(result2, item.id).some((s) => s.id === item.initialStageId)) throw new AchievementError("STAGE_NOT_FOUND", `成就 ${item.id} 的初始阶段不存在`);
  return result2;
}
function defaultsFor(configured = []) {
  return configured.length ? [...configured] : presetStages("").map(({ achievementId: _owner, ...stage }) => stage);
}
function resolveStages(achievementId, configured = [], overrides = []) {
  const all = new Map(defaultsFor(configured).map((s) => [s.id, { ...s, achievementId }]));
  for (const stage of overrides) if (stage.achievementId === achievementId) {
    if (stage.disabled) all.delete(stage.id);
    else all.set(stage.id, stage);
  }
  return [...all.values()];
}
function stagesFor(definitions, achievementId) {
  if (!definitions.achievements.some((item) => item.id === achievementId)) return [];
  return resolveStages(achievementId, definitions.defaultStages, definitions.stages);
}
function StagePicker({ value, stages, onChange, removalReason, onRemove, shared = false }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const listRef = useRef(null);
  const menuRef = useRef(null);
  const returnToList = () => requestAnimationFrame(() => {
    var _a;
    return (_a = listRef.current) == null ? void 0 : _a.focus({ preventScroll: true });
  });
  const collection = createListCollection({ items: stages.map((s) => ({ value: s.id, label: `${s.name}（${s.id}）` })) });
  const pointed = stages.find((s) => s.id === (target == null ? void 0 : target.id));
  const reason = pointed ? removalReason(pointed.id) : "此阶段已不存在。";
  const colors = { bg: "var(--bg-canvas)", color: "var(--fg-primary)", borderColor: "var(--border-default)" };
  const optionFrame = { borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border-subtle, var(--border-default))", borderRadius: "4px" };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      Select.Root,
      {
        collection,
        value: value ? [value] : [],
        open,
        onOpenChange: (e) => {
          setOpen(e.open);
          if (!e.open) setTarget(null);
        },
        onInteractOutside: (event) => {
          var _a;
          if ((_a = menuRef.current) == null ? void 0 : _a.contains(event.detail.target)) event.preventDefault();
        },
        onValueChange: (e) => {
          if (e.value[0]) onChange(e.value[0]);
        },
        positioning: { sameWidth: true },
        children: [
          /* @__PURE__ */ jsxs(Select.Trigger, { ...colors, "aria-label": shared ? "编辑默认阶段" : "编辑阶段", children: [
            /* @__PURE__ */ jsx(Select.ValueText, { placeholder: "请选择阶段" }),
            /* @__PURE__ */ jsx(Select.Indicator, {})
          ] }),
          /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(Select.Positioner, { children: /* @__PURE__ */ jsx(Select.Content, { ref: listRef, "data-studio-user-content": true, ...colors, borderWidth: "1px", borderStyle: "solid", maxH: "320px", overflowY: "auto", children: collection.items.map((option) => /* @__PURE__ */ jsxs(
            Select.Item,
            {
              item: option,
              title: option.label,
              ...optionFrame,
              my: "2px",
              color: "var(--fg-primary)",
              bg: (target == null ? void 0 : target.id) === option.value ? "var(--bg-subtle)" : void 0,
              _highlighted: { bg: "var(--bg-subtle)", borderColor: "var(--border-default)" },
              onContextMenu: (event) => {
                event.preventDefault();
                event.stopPropagation();
                setTarget({ id: option.value, row: event.currentTarget });
              },
              children: [
                /* @__PURE__ */ jsx(Select.ItemText, { truncate: true, children: option.label }),
                /* @__PURE__ */ jsx(Select.ItemIndicator, {})
              ]
            },
            option.value
          )) }) }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      Menu.Root,
      {
        open: open && !!target && !!pointed,
        onOpenChange: (e) => {
          if (!e.open) setTarget(null);
        },
        onEscapeKeyDown: returnToList,
        positioning: {
          strategy: "fixed",
          placement: "right-start",
          gutter: 4,
          overflowPadding: 8,
          flip: ["left-start", "bottom-end", "top-end"],
          slide: true,
          fitViewport: true,
          hideWhenDetached: true,
          getAnchorElement: () => (target == null ? void 0 : target.row) ?? null
        },
        onSelect: (e) => {
          if (e.value === "remove" && pointed && !removalReason(pointed.id)) onRemove(pointed.id);
          setTarget(null);
          returnToList();
        },
        children: /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(Menu.Positioner, { children: /* @__PURE__ */ jsxs(
          Menu.Content,
          {
            ref: menuRef,
            "data-studio-user-content": true,
            ...colors,
            borderWidth: "1px",
            borderStyle: "solid",
            width: "320px",
            maxW: "calc(100vw - 16px)",
            maxH: "var(--available-height)",
            overflowY: "auto",
            children: [
              /* @__PURE__ */ jsxs("div", { style: { padding: "6px 10px", color: "var(--fg-secondary)" }, children: [
                /* @__PURE__ */ jsx("div", { style: { overflowWrap: "anywhere" }, children: pointed == null ? void 0 : pointed.name }),
                /* @__PURE__ */ jsx("div", { title: pointed == null ? void 0 : pointed.id, style: { fontSize: "0.85em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: pointed == null ? void 0 : pointed.id })
              ] }),
              /* @__PURE__ */ jsx(
                Menu.Item,
                {
                  value: "remove",
                  disabled: !!reason,
                  ...optionFrame,
                  color: "var(--fg-primary)",
                  _highlighted: { bg: "var(--bg-subtle)", borderColor: "var(--border-default)" },
                  children: shared ? "删除默认阶段" : "从此成就删除阶段"
                }
              ),
              /* @__PURE__ */ jsx("div", { style: { padding: "6px 10px", color: "var(--fg-secondary)", fontSize: "0.8em", lineHeight: 1.5 }, children: reason || (shared ? "影响沿用此默认阶段的成就；专用配置保留。" : "只影响当前成就，其他成就不变。") })
            ]
          }
        ) }) })
      }
    )
  ] });
}
const object = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const positive = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
function readCardSizeReference(value, selectedPage) {
  if (!Array.isArray(value) || value.length !== 1) return;
  const record = object(value[0]);
  if (record.page !== selectedPage.replace(/^ui:/, "") || !["pagination", "vertical", "horizontal"].includes(String(record.mode))) return;
  const keys = ["width", "height", "contentWidth", "contentHeight", "gridWidth", "gridHeight", "cols", "rows", "listWidth", "listHeight", "templateWidth", "templateHeight", "measuredAt"];
  if (!keys.every((key) => positive(record[key])) || typeof record.gap !== "number" || !Number.isFinite(record.gap) || record.gap < 0) return;
  return record;
}
const note$3 = { color: "var(--fg-secondary)" };
function Numeric({ value, onChange, min = 0, max = 4096 }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type: "number",
      value,
      min,
      max,
      step: 1,
      style: { width: "100%", padding: 10, border: "1px solid var(--border-default)", borderRadius: 6, color: "var(--fg-primary)", background: "var(--bg-canvas)" },
      onChange: (e) => {
        const n = e.currentTarget.valueAsNumber;
        if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
      }
    }
  );
}
const choices$1 = (values) => Object.entries(values).map(([value, label]) => ({ value, label }));
function CardAppearanceEditor({ value, patch, groups = ["background", "frame", "effects"] }) {
  const v = cardAppearance(value);
  const select = (key, labels) => /* @__PURE__ */ jsx(Select$1, { value: String(v[key]), options: choices$1(labels), onChange: (next) => patch({ [key]: next }) });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    groups.includes("background") && /* @__PURE__ */ jsxs(Section, { title: "背景", collapsible: true, defaultOpen: false, children: [
      /* @__PURE__ */ jsx(FieldRow, { label: "背景方式", children: select("backgroundMode", { template: "使用各自界面原样", color: "颜色", image: "图片", gradient: "双色渐变" }) }),
      v.backgroundMode !== "template" && /* @__PURE__ */ jsx(FieldRow, { label: "底色", children: /* @__PURE__ */ jsx(ColorPicker, { value: v.backgroundColor, onChange: (backgroundColor) => patch({ backgroundColor }) }) }),
      v.backgroundMode === "gradient" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "渐变终点颜色", children: /* @__PURE__ */ jsx(ColorPicker, { value: v.backgroundColorEnd, onChange: (backgroundColorEnd) => patch({ backgroundColorEnd }) }) }),
        /* @__PURE__ */ jsx(FieldRow, { label: "渐变角度", children: /* @__PURE__ */ jsx(Numeric, { value: v.backgroundAngle, max: 360, onChange: (backgroundAngle) => patch({ backgroundAngle }) }) })
      ] }),
      v.backgroundMode === "image" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "背景图片", children: /* @__PURE__ */ jsx(AssetPicker, { accepts: ["image"], value: v.backgroundImage, onChange: (backgroundImage) => patch({ backgroundImage }) }) }),
        /* @__PURE__ */ jsx(FieldRow, { label: "图片适配", children: select("backgroundFit", { cover: "铺满并裁切", contain: "完整显示", tile: "平铺", fill: "拉伸" }) }),
        /* @__PURE__ */ jsx(FieldRow, { label: "横向焦点（%）", description: "0 为左侧，50 为居中，100 为右侧。", children: /* @__PURE__ */ jsx(Numeric, { value: v.backgroundX, max: 100, onChange: (backgroundX) => patch({ backgroundX }) }) }),
        /* @__PURE__ */ jsx(FieldRow, { label: "纵向焦点（%）", description: "0 为顶部，50 为居中，100 为底部。", children: /* @__PURE__ */ jsx(Numeric, { value: v.backgroundY, max: 100, onChange: (backgroundY) => patch({ backgroundY }) }) })
      ] })
    ] }),
    groups.includes("frame") && /* @__PURE__ */ jsxs(Section, { title: "边框", collapsible: true, defaultOpen: false, children: [
      /* @__PURE__ */ jsx(FieldRow, { label: "边框方式", children: select("frameMode", { template: "使用各自界面原样", none: "不显示", line: "线框", nineSlice: "图片九宫格" }) }),
      (v.frameMode === "line" || v.frameMode === "nineSlice") && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "边框颜色", description: "线框颜色；九宫格图片未就绪时也用此颜色。", children: /* @__PURE__ */ jsx(ColorPicker, { value: v.frameColor, onChange: (frameColor) => patch({ frameColor }) }) }),
        /* @__PURE__ */ jsx(FieldRow, { label: "显示厚度", description: "界面中的边框厚度，与原图切线距离分开。", children: /* @__PURE__ */ jsx(Numeric, { value: v.frameWidth, max: 256, onChange: (frameWidth) => patch({ frameWidth }) }) })
      ] }),
      v.frameMode === "line" && /* @__PURE__ */ jsx(FieldRow, { label: "圆角", children: /* @__PURE__ */ jsx(Numeric, { value: v.frameRadius, max: 256, onChange: (frameRadius) => patch({ frameRadius }) }) }),
      v.frameMode === "nineSlice" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "边框图片", children: /* @__PURE__ */ jsx(AssetPicker, { accepts: ["image"], value: v.frameImage, onChange: (frameImage) => patch({ frameImage }) }) }),
        /* @__PURE__ */ jsx("p", { style: note$3, children: "建议用透明 PNG 或静态 SVG。四条切线保留角部，边缘随卡片伸缩；距离按原图像素填写，SVG 按其 viewBox 坐标填写。内容留白在对应官方模板中手动编排。" }),
        ["sliceTop", "sliceRight", "sliceBottom", "sliceLeft"].map((key, n) => /* @__PURE__ */ jsx(FieldRow, { label: "原图" + ["上", "右", "下", "左"][n] + "切线距离", children: /* @__PURE__ */ jsx(Numeric, { value: v[key], onChange: (number) => patch({ [key]: number }) }) }, key)),
        /* @__PURE__ */ jsx(FieldRow, { label: "边缘适配", children: select("frameRepeat", { stretch: "拉伸", repeat: "平铺", round: "平铺并铺满" }) })
      ] })
    ] }),
    groups.includes("effects") && /* @__PURE__ */ jsxs(Section, { title: "元素动效", collapsible: true, defaultOpen: false, children: [
      /* @__PURE__ */ jsx(FieldRow, { label: "图标动效", children: select("iconEffect", { none: "无", float: "轻微浮动", rotate: "旋转", pulse: "呼吸" }) }),
      /* @__PURE__ */ jsx(FieldRow, { label: "边框动效", children: select("frameEffect", { none: "无", pulse: "呼吸", glow: "发光" }) }),
      (v.iconEffect !== "none" || v.frameEffect !== "none") && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "播放方式", children: select("effectTrigger", { loop: "循环", enter: "出现时一次", hover: "鼠标悬停时循环" }) }),
        /* @__PURE__ */ jsx(FieldRow, { label: "一轮时长（毫秒）", children: /* @__PURE__ */ jsx(Numeric, { value: v.effectDuration, min: 200, max: 6e4, onChange: (effectDuration) => patch({ effectDuration }) }) })
      ] }),
      /* @__PURE__ */ jsx("p", { style: note$3, children: "切换阶段会停止旧动效；滚出可见范围暂停附加动效。浮现不接收鼠标，悬停动效仅用于卡片。素材本身的逐帧动画由官方图片控件播放，与这里的动效分开。" })
    ] })
  ] });
}
function CardLayoutEditor() {
  const [page] = useSetting("main.page");
  const [measured] = useSetting("main.cardSizeReference");
  const reference = readCardSizeReference(measured, page || "ui:@mixing-entropy.achievement/achievements");
  return /* @__PURE__ */ jsxs(Section, { title: "成就卡片编排", collapsible: true, defaultOpen: false, description: "页面列表决定每张卡片的空间；卡片内部继续使用官方可视化模板。", children: [
    /* @__PURE__ */ jsxs(Section, { title: "尺寸参考", description: "改完行列后，在剧情预览中通过“打开成就页”重新打开一次；这里自动更新最近测得的尺寸。", children: [
      reference ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsxs("strong", { children: [
          "建议单卡画布：",
          reference.width,
          " × ",
          reference.height,
          " px"
        ] }) }),
        /* @__PURE__ */ jsxs("p", { children: [
          "全卡背景、背景图片和边框控件：",
          reference.width,
          " × ",
          reference.height,
          " px。图标和文字自行编排。"
        ] }),
        /* @__PURE__ */ jsxs("p", { style: note$3, children: [
          "测量时的模板画布：",
          reference.templateWidth,
          " × ",
          reference.templateHeight,
          " px。修改位置：双击列表 → 网格项模板 → 按 Esc → 界面属性 → 设计画布。"
        ] }),
        /* @__PURE__ */ jsxs("p", { style: note$3, children: [
          { pagination: "翻页", vertical: "纵向滚动", horizontal: "横向滚动" }[reference.mode],
          " · ",
          reference.cols,
          "列×",
          reference.rows,
          "行 · 间距",
          reference.gap,
          " · 列表",
          reference.listWidth,
          "×",
          reference.listHeight,
          " · 最近测量 ",
          new Date(reference.measuredAt).toLocaleString()
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { style: note$3, children: "尚未测到所选页面的卡片尺寸。请先在剧情预览中打开一次成就页，并确保至少有一张可显示的卡片。" }),
      /* @__PURE__ */ jsx("p", { style: note$3, children: "这是最近预览的参考值，不会改动设计画布或内部元素。改完行列、间距、浏览方式或页面大小后，请重新预览更新。仅支持本扩展内的卡片页面。" })
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      /* @__PURE__ */ jsx("strong", { children: "自由排版入口：" }),
      "官方 UI 编辑器 → 成就页 → 双击画布中的“双击编辑卡片 · 成就列表”区域 →“网格项模板”（单张成就卡片）。"
    ] }),
    /* @__PURE__ */ jsx("p", { style: note$3, children: "单击列表设置整页行列，双击画布中的列表进入单张卡片。卡片保持作者的坐标、字体和层级；页面变窄后请检查文字与装饰。" }),
    /* @__PURE__ */ jsx("p", { style: note$3, children: "单卡画布大小：进入“网格项模板”，按 Esc 取消元素选中，在右侧“界面属性 → 设计画布”修改宽度和高度。修改画布不会自动缩放或重排已有元素，内部仍由你摆放。" }),
    /* @__PURE__ */ jsx("p", { style: note$3, children: "行、列、间距和列表大小在成就页设置；单卡编辑画布目前不会随这些设置自动更新。改好后请在成就页剧情预览中核对实际效果。" }),
    /* @__PURE__ */ jsx("p", { style: note$3, children: "阶段外观增强用于本扩展内的成就页；卡片使用直接排列的基础元素，分组或条件图层保持原生模板效果。卡片和浮现使用各自的通用方案或阶段专用配置；两个界面的尺寸与排版分别在官方编辑器中设计。" })
  ] });
}
const note$2 = { color: "var(--fg-secondary)", fontSize: "0.9em" };
function ElementCssEditor({ owner, inheritedOwners = [], appearance, surface }) {
  return /* @__PURE__ */ jsx(Section, { title: "元素进阶 CSS", collapsible: true, defaultOpen: false, description: "普通配置打底，CSS 覆盖同名样式；只影响当前元素，切换阶段自动清理。", children: /* @__PURE__ */ jsx(CssEditor, { owner, inheritedOwners, appearance, fixedSurface: surface }, cssOwnerKey(owner)) });
}
function CssEditor({ owner, inheritedOwners, appearance, fixedSurface }) {
  const [stored, setRows] = useSetting("main.elementCss");
  const rows2 = stored ?? [];
  const [target, setTarget] = useState("background");
  const [elementId, setElementId] = useState("");
  const [surface, setSurface] = useState(fixedSurface ?? "both");
  const selectedTarget = target === "custom" ? `element:${elementId.trim()}` : target;
  const row = rows2.find((r) => sameOwner(r, owner) && r.target === selectedTarget && r.surface === surface);
  const [draft, setDraft] = useState((row == null ? void 0 : row.css) ?? "");
  const [replace, setReplace] = useState((row == null ? void 0 : row.replace) ?? false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setDraft((row == null ? void 0 : row.css) ?? "");
    setReplace((row == null ? void 0 : row.replace) ?? false);
    setMessage("");
    setError("");
  }, [selectedTarget, surface, row == null ? void 0 : row.css, row == null ? void 0 : row.replace]);
  const savedTargets = [...new Set(rows2.filter((r) => sameOwner(r, owner)).map((r) => r.target))];
  const save = (remove = false) => {
    try {
      const remaining = rows2.filter((r) => !(sameOwner(r, owner) && r.target === selectedTarget && r.surface === surface));
      const next = remove ? remaining : [...remaining, { ...owner, id: (row == null ? void 0 : row.id) ?? "css_" + crypto.randomUUID(), target: selectedTarget, surface, css: draft, replace }];
      parseCssRecords(next);
      if (!setRows(next)) throw Error("保存失败，请检查配置。");
      setError("");
      setMessage(remove ? "已恢复继承。" : "CSS 已应用。");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  };
  const inherited = resolveElementCss(rows2.filter((r) => !(sameOwner(r, owner) && r.surface === surface)), [...inheritedOwners, ...fixedSurface ? [owner] : []]).filter((r) => r.target === selectedTarget && (surface === "both" || r.surface === surface));
  let props = /* @__PURE__ */ new Set();
  try {
    parseElementCss(draft);
    props = cssProperties([...replace ? [] : inherited.map((r) => r.css), draft]);
  } catch {
  }
  const effect = selectedTarget === "icon" ? appearance == null ? void 0 : appearance.iconEffect : selectedTarget === "frame" ? appearance == null ? void 0 : appearance.frameEffect : void 0;
  const conflict = effect && cssStopsEffect(props, effect);
  const dirty = draft !== ((row == null ? void 0 : row.css) ?? "") || replace !== ((row == null ? void 0 : row.replace) ?? false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(FieldRow, { label: "配置元素", children: /* @__PURE__ */ jsx(
      Select$1,
      {
        value: target,
        options: [...Object.entries(CSS_TARGETS).map(([value, label]) => ({ value, label })), ...savedTargets.filter((t) => t.startsWith("element:")).map((value) => ({ value, label: `自建元素 ${value.slice(8)}` })), { value: "custom", label: "添加自建元素（按编号）" }],
        onChange: (value) => {
          if (dirty && !save()) return;
          setTarget(value);
        }
      }
    ) }),
    target === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "元素编号", description: "填写官方源码中的元素 id；卡片使用模板直属基础元素，浮现元素还需在官方编辑器填写唯一标识符。", children: /* @__PURE__ */ jsx(TextInput, { value: elementId, onChange: (value) => {
      if (dirty && !save()) return;
      setElementId(value);
    }, placeholder: "例如 image-… 或 rect-…" }) }),
    !fixedSurface && /* @__PURE__ */ jsx(FieldRow, { label: "使用位置", children: /* @__PURE__ */ jsx(
      Select$1,
      {
        value: surface,
        options: [{ value: "both", label: "卡片与浮现共用" }, { value: "card", label: "仅卡片" }, { value: "popup", label: "仅浮现" }],
        onChange: (value) => {
          if (dirty && !save()) return;
          setSurface(value);
        }
      }
    ) }),
    savedTargets.length > 0 && /* @__PURE__ */ jsxs("p", { style: note$2, children: [
      "本处已配置：",
      savedTargets.map((t) => CSS_TARGETS[t] ?? t).join("、")
    ] }),
    /* @__PURE__ */ jsx(FieldRow, { label: "替换此元素的上级 CSS", description: "关闭时补充共用样式；开启并留空可停用继承的 CSS。普通配置仍保留。", children: /* @__PURE__ */ jsx(Switch, { checked: replace, onChange: setReplace }) }),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        "aria-label": "元素 CSS",
        spellCheck: false,
        value: draft,
        onChange: (e) => {
          setDraft(e.target.value);
          setMessage("");
        },
        placeholder: "border-radius: 20px;\nbox-shadow: 0 4px 16px currentColor;",
        style: { width: "100%", minHeight: 160, padding: 12, fontFamily: "monospace", color: "var(--fg-primary)", background: "var(--bg-sunken)", border: "1px solid var(--border-default)", borderRadius: 6 }
      }
    ),
    /* @__PURE__ */ jsxs("p", { style: note$2, children: [
      "直接填写属性；状态可写 &:hover ",
      "{ … }",
      "，动画可用 @keyframes。无需 !important。不支持全局选择器、@import、嵌套规则或外部图片地址；工程图片用素材选择器。"
    ] }),
    props.size > 0 && /* @__PURE__ */ jsxs("p", { style: note$2, children: [
      "由 CSS 管理：",
      [...props].join("、"),
      "。对应普通设置保留原值；移除此覆盖后恢复。"
    ] }),
    conflict && /* @__PURE__ */ jsx("p", { style: { ...note$2, color: "var(--warn)" }, children: "CSS 接管了动效相关属性，此元素的内置附加动效暂停。" }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
      /* @__PURE__ */ jsx(Button, { onClick: () => save(), children: "应用 CSS" }),
      /* @__PURE__ */ jsx(Button, { disabled: !row, onClick: () => save(true), children: "恢复继承" })
    ] }),
    inherited.length > 0 && /* @__PURE__ */ jsxs("details", { children: [
      /* @__PURE__ */ jsx("summary", { children: "查看继承的 CSS" }),
      /* @__PURE__ */ jsx("pre", { style: { ...note$2, whiteSpace: "pre-wrap" }, children: [...new Set(inherited.map((r) => r.css))].join("\n") })
    ] }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", style: { color: "var(--warn)" }, children: error }),
    message && /* @__PURE__ */ jsx("p", { role: "status", style: note$2, children: message })
  ] });
}
const note$1 = { color: "var(--fg-secondary)", fontSize: "0.9em" };
const choices = (presets, surface) => presets.filter((p) => !p.surface || p.surface === surface).map((p) => ({ value: p.id, label: p.name }));
function SharedPresentationEditor({ surface }) {
  const [stored, setStored] = useSetting("main.appearances");
  const [levels] = useSetting("main.levels");
  const [defaults] = useSetting("main.defaultStages");
  const [stages] = useSetting("main.displayStages");
  const [presentations] = useSetting("main.stagePresentations");
  const [css, setCss] = useSetting("main.elementCss");
  const [globalUI] = useSetting("main.popup");
  const [globalDuration] = useSetting("main.durationMs");
  const presets = stored ?? [], available = presets.filter((p) => p.surface === surface);
  const [selected, select] = useState("");
  const [error, setError] = useState("");
  const current = available.find((p) => p.id === selected) ?? available[0];
  const fallback = available.find((p) => p.isDefault);
  const used = !!current && (current.isDefault || appearanceInUse(current.id, levels ?? [], [...defaults ?? [], ...stages ?? [], ...(presentations ?? []).filter((p) => p.mode === "custom")]));
  const save = (next) => {
    const ok = setStored(next);
    setError(ok ? "" : "方案保存失败，请检查内容。");
    return ok;
  };
  const patch = (v) => save(presets.map((p) => p.id === current.id ? { ...p, ...v } : p));
  const remove = () => {
    if (!current || used) return;
    const owner = { ownerKind: "appearance", ownerId: current.id, achievementId: "" };
    const nextCss = (css ?? []).filter((row) => !sameOwner(row, owner));
    if (!save(presets.filter((p) => p.id !== current.id))) return;
    if (nextCss.length !== (css ?? []).length && !setCss(nextCss)) {
      const restored = setStored(presets);
      setError(restored ? "专属 CSS 清理失败，已恢复方案，请重试。" : "方案已移除，但专属 CSS 清理失败且方案未能恢复；请撤销本次删除。");
    }
  };
  return /* @__PURE__ */ jsxs(
    Section,
    {
      title: surface === "card" ? "通用卡片展示" : "通用浮现",
      collapsible: true,
      defaultOpen: false,
      description: "保存可复用的表现方案；阶段默认沿用本组默认方案，也可选择其他方案或单独调整。具体文字和图标读取当前阶段。",
      children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "默认方案", children: /* @__PURE__ */ jsx(
          Select$1,
          {
            value: (fallback == null ? void 0 : fallback.id) ?? "",
            options: [{ value: "", label: "使用官方界面原样" }, ...choices(available, surface)],
            onChange: (id2) => save(presets.map((p) => p.surface === surface ? { ...p, isDefault: p.id === id2 } : p))
          }
        ) }),
        surface === "popup" && !fallback && /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: "官方浮现界面与时长" }),
          /* @__PURE__ */ jsx(SettingField, { name: "main.popup" }),
          /* @__PURE__ */ jsx(SettingField, { name: "main.durationMs" })
        ] }),
        surface === "card" && /* @__PURE__ */ jsx("p", { style: note$1, children: "卡片排版使用成就页的官方列表模板；双击列表编辑。方案不复制卡片画布。" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          const p = {
            id: "look_" + crypto.randomUUID(),
            name: surface === "card" ? "新卡片方案" : "新浮现方案",
            surface,
            isDefault: available.length === 0,
            nameMode: "stage",
            descriptionMode: "stage",
            iconMode: "stage",
            levelVisibility: "stage",
            stageNameVisibility: "stage",
            durationMs: surface === "popup" ? 3e3 : 0,
            ui: surface === "popup" ? "ui:@mixing-entropy.achievement/achievement-popup" : ""
          };
          if (save([...presets, p])) select(p.id);
        }, children: "添加方案" }),
        current ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(FieldRow, { label: "编辑方案", children: /* @__PURE__ */ jsx(Select$1, { value: current.id, options: choices(available, surface), onChange: select }) }),
          /* @__PURE__ */ jsx(FieldRow, { label: "方案名称", children: /* @__PURE__ */ jsx(TextInput, { value: current.name, onChange: (name) => patch({ name }) }) }),
          /* @__PURE__ */ jsxs(Section, { title: "内容显示方式", collapsible: true, defaultOpen: false, description: "只决定是否显示；名称、说明和图标始终读取当前阶段，不在这里填写某个成就的内容。", children: [
            ["nameMode", "descriptionMode", "iconMode"].map((key, n) => /* @__PURE__ */ jsx(FieldRow, { label: ["名称", "说明", "图标"][n], children: /* @__PURE__ */ jsx(Select$1, { value: current[key] ?? "stage", options: [{ value: "stage", label: "使用当前阶段内容" }, { value: "none", label: "不显示" }, ...key === "iconMode" ? [{ value: "unknown", label: "默认未知图标" }] : []], onChange: (value) => patch({ [key]: value }) }) }, key)),
            ["levelVisibility", "stageNameVisibility"].map((key, n) => /* @__PURE__ */ jsx(FieldRow, { label: ["等级", "阶段名称"][n], children: /* @__PURE__ */ jsx(Select$1, { value: current[key] ?? "stage", options: [{ value: "stage", label: "沿用阶段设置" }, { value: "show", label: "显示" }, { value: "hide", label: "不显示" }], onChange: (value) => patch({ [key]: value }) }) }, key))
          ] }),
          surface === "popup" && /* @__PURE__ */ jsxs(Section, { title: "界面与时长", collapsible: true, defaultOpen: false, children: [
            /* @__PURE__ */ jsx(FieldRow, { label: "浮现界面", children: /* @__PURE__ */ jsx(UIRefPicker, { value: (current.ui || globalUI || "ui:@mixing-entropy.achievement/achievement-popup").replace(/^ui:@?/, ""), onChange: (ui) => patch({ ui: ui ? "ui:@" + (ui.includes("/") ? ui : "mixing-entropy.achievement/" + ui) : "" }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "时长（毫秒）", children: /* @__PURE__ */ jsx(NumberSlider, { ariaLabel: "通用浮现时长", value: current.durationMs || globalDuration || 3e3, min: 300, max: 6e4, step: 100, unit: "ms", onChange: (durationMs) => patch({ durationMs }) }) })
          ] }),
          /* @__PURE__ */ jsx(CardAppearanceEditor, { value: current, patch }),
          /* @__PURE__ */ jsx(ElementCssEditor, { owner: { ownerKind: "appearance", ownerId: current.id, achievementId: "" }, appearance: current, surface }, current.id),
          /* @__PURE__ */ jsx(Button, { disabled: used, title: used ? "先更换默认方案或解除等级、阶段引用" : void 0, onClick: remove, children: "删除此方案" }),
          used && /* @__PURE__ */ jsx("p", { style: note$1, children: "默认方案或仍被引用的方案不能直接删除。" })
        ] }) : /* @__PURE__ */ jsx("p", { style: note$1, children: "尚无方案，默认保留官方界面原样。" }),
        error && /* @__PURE__ */ jsx("p", { role: "alert", children: error })
      ]
    }
  );
}
function LevelAppearanceEditor() {
  const [stored, setLevels] = useSetting("main.levels");
  const [presets] = useSetting("main.appearances");
  const [items] = useSetting("main.achievements");
  const [defaults] = useSetting("main.defaultStages");
  const [stages] = useSetting("main.displayStages");
  const levels = (stored == null ? void 0 : stored.length) ? stored : DEFAULT_LEVELS;
  const [selected, select] = useState("");
  const [error, setError] = useState("");
  const current = levels.find((l) => l.id === selected) ?? levels[0];
  const used = (items == null ? void 0 : items.some((a) => a.levelId === current.id)) || [...defaults ?? [], ...stages ?? []].some((s) => s.levelMode === "custom" && s.levelId === current.id);
  const save = (next) => {
    const ok = setLevels(next);
    setError(ok ? "" : "等级保存失败");
    return ok;
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(FieldRow, { label: "等级", children: /* @__PURE__ */ jsx(Select$1, { value: current.id, options: levels.map((l) => ({ value: l.id, label: l.name })), onChange: select }) }),
    /* @__PURE__ */ jsx(FieldRow, { label: "等级名称", children: /* @__PURE__ */ jsx(TextInput, { value: current.name, onChange: (name) => save(levels.map((l) => l.id === current.id ? { ...l, name } : l)) }) }),
    ["card", "popup"].map((surface) => /* @__PURE__ */ jsx(FieldRow, { label: surface === "card" ? "通用卡片方案" : "通用浮现方案", children: /* @__PURE__ */ jsx(
      Select$1,
      {
        value: (surface === "popup" ? current.popupAppearanceId : current.appearanceId) ?? "",
        options: [{ value: "", label: "未关联" }, ...choices(presets ?? [], surface)],
        onChange: (id2) => save(levels.map((l) => l.id === current.id ? { ...l, [surface === "card" ? "appearanceId" : "popupAppearanceId"]: id2 } : l))
      }
    ) }, surface)),
    /* @__PURE__ */ jsx("p", { style: note$1, children: "仅阶段选择“跟随本阶段等级”时使用这些关联，不自动改变阶段。" }),
    /* @__PURE__ */ jsx(Button, { onClick: () => {
      const l = { id: "level_" + crypto.randomUUID(), name: "新等级" };
      if (save([...levels, l])) select(l.id);
    }, children: "添加等级" }),
    /* @__PURE__ */ jsx(Button, { disabled: used || levels.length <= 1, onClick: () => save(levels.filter((l) => l.id !== current.id)), children: "删除此等级" }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", children: error })
  ] });
}
function StageAppearanceEditor({ stage, patch, levels, item, surface = "card", presentation }) {
  const [presets] = useSetting("main.appearances");
  const source = stage.appearanceSource ?? "default";
  const level = levels.find((l) => l.id === (stage.levelMode === "custom" ? stage.levelId : item == null ? void 0 : item.levelId));
  const inherited = resolveAppearance(stage, presets ?? [], levelPresetId(level, surface), surface);
  const scheme = presentationPreset(stage, presets ?? [], levelPresetId(level, surface), surface);
  const missing = source === "preset" && !scheme;
  const owners = presentationCssOwners(presentation, stage, item, levels, presets ?? []);
  const [editing, setEditing] = useState(source === "local" || !!(stage.overrideBackground || stage.overrideFrame || stage.overrideEffects));
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(FieldRow, { label: "表现方案", children: /* @__PURE__ */ jsx(
      Select$1,
      {
        value: source,
        options: [{ value: "default", label: "沿用本组默认方案" }, { value: "preset", label: "选择通用方案" }, { value: "level", label: "跟随本阶段等级" }, { value: "local", label: "完全单独配置" }],
        onChange: (value) => {
          patch({ appearanceSource: value });
          setEditing(value === "local");
        }
      }
    ) }),
    source === "preset" && /* @__PURE__ */ jsx(FieldRow, { label: "选择方案", children: /* @__PURE__ */ jsx(Select$1, { value: stage.appearanceId ?? "", options: [{ value: "", label: "请选择方案" }, ...choices(presets ?? [], surface)], onChange: (appearanceId) => patch({ appearanceId }) }) }),
    /* @__PURE__ */ jsxs("p", { style: note$1, children: [
      source === "local" ? "使用本阶段单独配置。" : `当前沿用：${(scheme == null ? void 0 : scheme.name) ?? "官方界面原样"}。`,
      missing ? "所选方案已失效，请重新选择。" : ""
    ] }),
    source !== "local" && /* @__PURE__ */ jsx(Button, { onClick: () => setEditing(!editing), children: editing ? "收起单独调整" : "单独调整外观或 CSS" }),
    (editing || source === "local") && /* @__PURE__ */ jsxs(Section, { title: "外观与元素 CSS", collapsible: true, children: [
      source !== "local" && /* @__PURE__ */ jsxs(Fragment, { children: [
        [["background", "overrideBackground", "背景"], ["frame", "overrideFrame", "边框"], ["effects", "overrideEffects", "动效"]].map(([group, key, label]) => /* @__PURE__ */ jsx(FieldRow, { label: "单独配置" + label, children: /* @__PURE__ */ jsx(Switch, { checked: stage[key] === true, onChange: (enabled) => patch({ ...enabled ? copyAppearanceGroup(inherited, group) : {}, [key]: enabled }) }) }, key)),
        /* @__PURE__ */ jsx("p", { style: note$1, children: "只展开单独配置的部分；关闭后继续沿用方案。" })
      ] }),
      /* @__PURE__ */ jsx(CardAppearanceEditor, { value: stage, patch, groups: source === "local" ? void 0 : [stage.overrideBackground && "background", stage.overrideFrame && "frame", stage.overrideEffects && "effects"].filter(Boolean) }),
      /* @__PURE__ */ jsx(ElementCssEditor, { owner: owners[owners.length - 1], inheritedOwners: owners.slice(0, -1), appearance: inherited, surface })
    ] })
  ] });
}
const note = { color: "var(--fg-secondary)", fontSize: "0.9em" };
const contentOptions$1 = [{ value: "stage", label: "使用本阶段内容" }, { value: "custom", label: "单独填写" }, { value: "none", label: "不显示" }];
function StagePresentationEditor({ stage, item, levels }) {
  return /* @__PURE__ */ jsxs(Section, { title: "阶段表现", collapsible: true, defaultOpen: false, description: "卡片和浮现分别配置；默认使用本阶段内容，位置与大小在各自官方界面里编排。", children: [
    /* @__PURE__ */ jsx(SurfaceEditor, { stage, item, levels, surface: "card" }, `${(item == null ? void 0 : item.id) ?? ""}/${stage.id}/card`),
    /* @__PURE__ */ jsx(SurfaceEditor, { stage, item, levels, surface: "popup" }, `${(item == null ? void 0 : item.id) ?? ""}/${stage.id}/popup`)
  ] });
}
function SurfaceEditor({ stage, item, levels, surface }) {
  const [stored, setStored] = useSetting("main.stagePresentations");
  const [configured] = useSetting("main.defaultStages");
  const [css, setCss] = useSetting("main.elementCss");
  const [presets] = useSetting("main.appearances");
  const [contentEditing, setContentEditing] = useState(false);
  const [timingEditing, setTimingEditing] = useState(false);
  const [globalUI] = useSetting("main.popup");
  const [globalDuration] = useSetting("main.durationMs");
  const [globalNotifications] = useSetting("main.notifications");
  const [error, setError] = useState("");
  const rows2 = stored ?? [];
  const defaults = defaultsFor(configured);
  const owner = { achievementId: (item == null ? void 0 : item.id) ?? "", stageId: stage.id, surface };
  const key = presentationKey(owner);
  const own = rows2.find((r) => presentationKey(r) === key);
  const effective = resolvePresentation(rows2, defaults, stage, owner.achievementId, surface);
  const effectiveView = materializePresentation(effective, presets ?? [], levelPresetId(levels.find((l) => l.id === (stage.levelMode === "custom" ? stage.levelId : item == null ? void 0 : item.levelId)), surface));
  const shared = item && defaults.some((s) => s.id === stage.id);
  const save = (value) => {
    try {
      const next = parsePresentations([...rows2.filter((r) => presentationKey(r) !== key), value]);
      if (!setStored(next)) throw Error("保存失败，请检查配置。");
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  };
  const patch = (changes) => save({ ...effective, ...owner, mode: "custom", ...changes });
  const patchContent = (changes) => patch({ contentOverride: true, nameMode: effectiveView.nameMode, displayName: effectiveView.displayName, descriptionMode: effectiveView.descriptionMode, description: effectiveView.description, iconMode: effectiveView.iconMode, icon: effectiveView.icon, showLevel: effectiveView.showLevel, showStageName: effectiveView.showStageName, ...changes });
  const restore = () => {
    const nextCss = resetSurfaceCss(css ?? [], item.id, stage.id, surface);
    if (!setCss(nextCss)) {
      setError("CSS 恢复失败，请重试。");
      return;
    }
    if (!save({ ...effective, ...owner, mode: "inherit" })) setCss(css ?? []);
  };
  const legacyCss = (css ?? []).filter((r) => r.ownerKind === (item ? "stage" : "defaultStage") && r.achievementId === owner.achievementId && r.ownerId === stage.id && r.surface === "both");
  return /* @__PURE__ */ jsxs(
    Section,
    {
      title: surface === "card" ? "卡片展示" : "阶段浮现",
      collapsible: true,
      defaultOpen: false,
      description: surface === "card" ? "决定这个阶段在成就页里的内容和外观。" : "进入这个阶段时播放；相同阶段不重复播放，连续通知依次排队。",
      children: [
        /* @__PURE__ */ jsx("p", { style: note, children: !item ? "这是共用默认配置；成就可分别覆盖卡片或浮现。" : (own == null ? void 0 : own.mode) === "custom" ? "本项使用当前成就的专用配置。" : (own == null ? void 0 : own.mode) === "inherit" ? "本项沿用默认阶段，默认修改会同步生效。" : "当前沿用已有阶段配置；在这里修改只影响当前成就的本项。" }),
        shared && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8 }, children: (own == null ? void 0 : own.mode) === "custom" && /* @__PURE__ */ jsx(Button, { onClick: restore, children: "恢复默认阶段的本项表现" }) }),
        surface === "card" ? /* @__PURE__ */ jsx(FieldRow, { label: "成就页收录", children: /* @__PURE__ */ jsx(Select$1, { value: effective.enabled ? "show" : "omit", options: [{ value: "show", label: "显示卡片" }, { value: "omit", label: "不生成卡片" }], onChange: (value) => patch({ enabled: value === "show" }) }) }) : /* @__PURE__ */ jsx(FieldRow, { label: "进入此阶段时浮现", description: "还需全局允许播放；方法块可让本次切换静默。", children: /* @__PURE__ */ jsx(Switch, { checked: effective.enabled, onChange: (enabled) => patch({ enabled }) }) }),
        surface === "popup" && globalNotifications === false && /* @__PURE__ */ jsx("p", { style: note, children: "全局已关闭浮现；可在“界面与播放 → 浮现播放”开启。" }),
        effective.enabled && /* @__PURE__ */ jsxs(Fragment, { children: [
          surface === "popup" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("p", { style: note, children: [
              "当前浮现界面：",
              (effectiveView.ui || globalUI || "ui:@mixing-entropy.achievement/achievement-popup").replace(/^ui:@?/, ""),
              "；时长：",
              (effectiveView.durationMs || globalDuration || 3e3) / 1e3,
              " 秒。"
            ] }),
            /* @__PURE__ */ jsx(Button, { onClick: () => setTimingEditing(!timingEditing), children: timingEditing ? "收起界面与时长" : "单独设置界面与时长" }),
            timingEditing && /* @__PURE__ */ jsxs(Section, { title: "界面与时长", collapsible: true, children: [
              /* @__PURE__ */ jsx(FieldRow, { label: "浮现界面", children: /* @__PURE__ */ jsx(Select$1, { value: effective.ui ? "custom" : "default", options: [{ value: "default", label: "沿用通用方案" }, { value: "custom", label: "为此阶段选择界面" }], onChange: (value) => patch({ ui: value === "custom" ? effectiveView.ui || globalUI || "ui:@mixing-entropy.achievement/achievement-popup" : "" }) }) }),
              !!effective.ui && /* @__PURE__ */ jsx(FieldRow, { label: "选择界面", children: /* @__PURE__ */ jsx(UIRefPicker, { value: effective.ui.replace(/^ui:@?/, "").replace(/^@/, ""), onChange: (ui) => patch({ ui: ui ? "ui:@" + (ui.includes("/") ? ui : "mixing-entropy.achievement/" + ui) : "" }) }) }),
              !effective.ui && /* @__PURE__ */ jsx(FieldRow, { label: "当前默认界面", children: /* @__PURE__ */ jsx(UIRefPicker, { ariaLabel: "当前沿用的浮现界面", value: (effectiveView.ui || globalUI || "ui:@mixing-entropy.achievement/achievement-popup").replace(/^ui:@?/, "").replace(/^@/, ""), disabled: true, onChange: () => {
              } }) }),
              /* @__PURE__ */ jsx(FieldRow, { label: "浮现时长", children: /* @__PURE__ */ jsx(Select$1, { value: effective.durationMs ? "custom" : "default", options: [{ value: "default", label: "沿用通用方案" }, { value: "custom", label: "单独设置时长" }], onChange: (value) => patch({ durationMs: value === "custom" ? effectiveView.durationMs || globalDuration || 3e3 : 0 }) }) }),
              !effective.durationMs && /* @__PURE__ */ jsxs("p", { style: note, children: [
                "当前默认时长：",
                (effectiveView.durationMs || globalDuration || 3e3) / 1e3,
                " 秒"
              ] }),
              !!effective.durationMs && /* @__PURE__ */ jsx(FieldRow, { label: "时长（毫秒）", children: /* @__PURE__ */ jsx(NumberSlider, { ariaLabel: "阶段浮现时长", value: effective.durationMs, min: 300, max: 6e4, step: 100, unit: "ms", onChange: (durationMs) => patch({ durationMs }) }) }),
              /* @__PURE__ */ jsx("p", { style: note, children: "进场、退场动画和元素排版，在所选浮现界面的官方编辑器设置。" }),
              /* @__PURE__ */ jsx(Button, { onClick: () => patch({ ui: "", durationMs: 0 }), children: "恢复沿用界面与时长" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { style: note, children: [
            "内容：",
            effective.contentOverride === false ? "沿用本阶段内容与通用方案的显示方式" : "本处已有单独显示配置",
            "。"
          ] }),
          /* @__PURE__ */ jsx(Button, { onClick: () => setContentEditing(!contentEditing), children: contentEditing ? "收起内容设置" : "单独设置内容" }),
          contentEditing && /* @__PURE__ */ jsxs(Section, { title: "单独内容", collapsible: true, description: "只影响本处；卡片和浮现都从当前阶段读取，不互相继承。", children: [
            /* @__PURE__ */ jsx(FieldRow, { label: "名称", children: /* @__PURE__ */ jsx(Select$1, { value: effectiveView.nameMode, options: contentOptions$1, onChange: (nameMode) => patchContent({ nameMode }) }) }),
            effective.nameMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "显示名称", children: /* @__PURE__ */ jsx(TextInput, { value: effective.displayName, onChange: (displayName) => patchContent({ displayName }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "说明", children: /* @__PURE__ */ jsx(Select$1, { value: effectiveView.descriptionMode, options: contentOptions$1, onChange: (descriptionMode) => patchContent({ descriptionMode }) }) }),
            effective.descriptionMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "显示说明", children: /* @__PURE__ */ jsx(TextInput, { multiline: true, value: effective.description, onChange: (description) => patchContent({ description }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "图标", children: /* @__PURE__ */ jsx(Select$1, { value: effectiveView.iconMode, options: [...contentOptions$1, { value: "unknown", label: "默认未知图标" }], onChange: (iconMode) => patchContent({ iconMode }) }) }),
            effective.iconMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "显示图标", children: /* @__PURE__ */ jsx(AssetPicker, { accepts: ["image"], value: effective.icon, onChange: (icon) => patchContent({ icon }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "显示等级", children: /* @__PURE__ */ jsx(Switch, { checked: effectiveView.showLevel, onChange: (showLevel) => patchContent({ showLevel }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "显示阶段名称", children: /* @__PURE__ */ jsx(Switch, { checked: effectiveView.showStageName, onChange: (showStageName) => patchContent({ showStageName }) }) }),
            /* @__PURE__ */ jsx(Button, { onClick: () => {
              patch({ contentOverride: false, nameMode: "stage", descriptionMode: "stage", iconMode: "stage", displayName: "", description: "", icon: "", showLevel: stage.showLevel, showStageName: stage.showStageName });
              setContentEditing(false);
            }, children: "恢复沿用内容" })
          ] }),
          /* @__PURE__ */ jsx(StageAppearanceEditor, { stage: { ...stage, ...optionalAppearance({ ...effective }), ...parseAppearanceBinding(effective) }, patch: (changes) => patch(changes), levels, item, surface, presentation: effective }),
          legacyCss.length > 0 && /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { style: note, children: "已有卡片与浮现共用 CSS" }),
            /* @__PURE__ */ jsx("pre", { style: { ...note, whiteSpace: "pre-wrap" }, children: legacyCss.map((r) => `${r.target}
${r.css}`).join("\n") }),
            /* @__PURE__ */ jsx("p", { style: note, children: "原配置继续生效；下方的逐元素 CSS 可单独覆盖本项。" })
          ] })
        ] }),
        error && /* @__PURE__ */ jsx("p", { role: "alert", children: error })
      ]
    }
  );
}
function localRemovalReason(item, stages, id2) {
  if (!stages.some((s) => s.id === id2)) return "此阶段已不存在。";
  if (stages.length <= 1) return "至少保留一个可用阶段。";
  if ((item.initialStageId || "unknown") === id2) return "这是初始阶段，请先更换初始阶段。";
  return "";
}
function removeLocalStage(item, configured, saved, id2) {
  const stages = resolveStages(item.id, configured, saved);
  const reason = localRemovalReason(item, stages, id2);
  if (reason) throw new Error(reason);
  const next = (saved ?? []).filter((s) => !(s.achievementId === item.id && s.id === id2));
  if (defaultsFor(configured).some((s) => s.id === id2)) next.push({ ...stages.find((s) => s.id === id2), disabled: true });
  return next;
}
function defaultRemovalReason(stages, items, overrides, id2) {
  if (!stages.some((s) => s.id === id2)) return "此阶段已不存在。";
  if (stages.length <= 1) return "至少保留一个默认阶段。";
  const count = items.filter((a) => (a.initialStageId || "unknown") === id2 && !overrides.some((s) => s.achievementId === a.id && s.id === id2 && !s.disabled)).length;
  return count ? `${count} 个成就将它作为初始阶段，请先更换这些成就的初始阶段。` : "";
}
function removeDefaultStage(stages, items, overrides, levels, id2) {
  const reason = defaultRemovalReason(stages, items, overrides, id2);
  if (reason) throw new Error(reason);
  const next = stages.filter((s) => s.id !== id2);
  catalog(levels, items, overrides, next);
  return next;
}
const contentOptions = [{ value: "base", label: "使用成就基础配置" }, { value: "custom", label: "本阶段自定义" }, { value: "none", label: "不显示" }];
const noteStyle = { color: "var(--fg-secondary)" };
const actionsStyle = { display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" };
function StageFields({ stage, patch, levels, item }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Section, { title: "阶段信息", collapsible: true, defaultOpen: false, children: [
      /* @__PURE__ */ jsx(FieldRow, { label: "阶段名称", children: /* @__PURE__ */ jsx(TextInput, { value: stage.name, onChange: (name) => patch({ name }) }) }),
      /* @__PURE__ */ jsxs("p", { style: noteStyle, children: [
        "阶段编号：",
        stage.id,
        "。修改名称不改变编号。"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "阶段等级", collapsible: true, defaultOpen: false, children: [
      /* @__PURE__ */ jsx(FieldRow, { label: "本阶段等级", description: "使用基础等级时，每个成就读取自己的基础配置，不继承上一阶段。", children: /* @__PURE__ */ jsx(
        Select$1,
        {
          value: stage.levelMode ?? "base",
          options: [{ value: "base", label: "使用成就基础等级" }, { value: "custom", label: "指定本阶段等级" }],
          onChange: (value) => {
            var _a;
            return patch({ levelMode: value, ...value === "custom" && !levels.some((l) => l.id === stage.levelId) ? { levelId: (item == null ? void 0 : item.levelId) || ((_a = levels[0]) == null ? void 0 : _a.id) || "bronze" } : {} });
          }
        }
      ) }),
      stage.levelMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "选择等级", children: /* @__PURE__ */ jsx(Select$1, { value: stage.levelId, options: levels.map((l) => ({ value: l.id, label: l.name + "（" + l.id + "）" })), onChange: (levelId) => patch({ levelId }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "本阶段内容", collapsible: true, defaultOpen: false, description: "卡片和浮现默认使用这里的内容，各自也能单独填写。", children: [
      /* @__PURE__ */ jsx("p", { style: noteStyle, children: "“使用成就基础配置”读取对应成就的名称、说明或图标，不继承上一阶段。" }),
      ["name", "description", "icon"].map((field) => /* @__PURE__ */ jsx(StageContentField, { field, stage, item, patch }, stage.id + field))
    ] }),
    /* @__PURE__ */ jsx(StagePresentationEditor, { stage, item, levels })
  ] });
}
function StageContentField({ field, stage, item, patch }) {
  const [editing, setEditing] = useState(false);
  const key = field === "name" ? "nameMode" : field === "description" ? "descriptionMode" : "iconMode";
  const valueKey = field === "name" ? "displayName" : field;
  const label = { name: "名称", description: "说明", icon: "图标" }[field];
  const mode2 = stage[key];
  const summary = mode2 === "base" ? (item == null ? void 0 : item[field]) || "对应成就的基础配置" : mode2 === "none" ? "不显示" : mode2 === "unknown" ? "默认未知图标" : stage[valueKey] || "（空内容）";
  return /* @__PURE__ */ jsxs(FieldRow, { label, children: [
    /* @__PURE__ */ jsxs("p", { style: { ...noteStyle, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }, children: [
      summary,
      " ",
      mode2 === "base" ? " · 沿用基础资料" : " · 本阶段设置"
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => setEditing(!editing), children: editing ? "收起" : "单独设置" }),
    editing && /* @__PURE__ */ jsxs("div", { style: { marginTop: 8 }, children: [
      /* @__PURE__ */ jsx(Select$1, { value: mode2, options: [...contentOptions, ...field === "icon" ? [{ value: "unknown", label: "默认未知图标" }] : []], onChange: (value) => patch({ [key]: value }) }),
      mode2 === "custom" && (field === "icon" ? /* @__PURE__ */ jsx(AssetPicker, { accepts: ["image"], value: stage.icon, onChange: (icon) => patch({ icon }) }) : /* @__PURE__ */ jsx(TextInput, { multiline: field === "description", value: stage[valueKey], onChange: (value) => patch({ [valueKey]: value }) })),
      /* @__PURE__ */ jsx(Button, { onClick: () => {
        patch({ [key]: "base" });
        setEditing(false);
      }, children: "恢复沿用基础资料" })
    ] })
  ] });
}
function DefaultStageEditor() {
  const [configured, setConfigured] = useSetting("main.defaultStages");
  const [items] = useSetting("main.achievements");
  const [overrides] = useSetting("main.displayStages");
  const [configuredLevels] = useSetting("main.levels");
  const levels = (configuredLevels == null ? void 0 : configuredLevels.length) ? configuredLevels : DEFAULT_LEVELS;
  const defaults = defaultsFor(configured);
  const [selected, select] = useState("unknown");
  const [error, setError] = useState("");
  const stage = defaults.find((s) => s.id === selected) ?? defaults[0];
  const save = (next, structural = false) => {
    if (structural) try {
      catalog(levels, items ?? [], overrides ?? [], next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
    const ok = setConfigured(next);
    setError(ok ? "" : "保存失败，请检查内容。");
    return ok;
  };
  const removalReason = (id2) => defaultRemovalReason(defaults, items ?? [], overrides ?? [], id2);
  const remove = (id2) => {
    try {
      const next = removeDefaultStage(defaults, items ?? [], overrides ?? [], levels, id2);
      if (save(next) && stage.id === id2) select(next[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(FieldRow, { label: "编辑默认阶段", description: "展开列表，右键阶段可删除；影响沿用该默认阶段的成就。", children: /* @__PURE__ */ jsx(StagePicker, { value: stage.id, stages: defaults, onChange: select, removalReason, onRemove: remove, shared: true }) }),
    /* @__PURE__ */ jsxs("div", { style: actionsStyle, children: [
      /* @__PURE__ */ jsx(Button, { onClick: () => {
        const next = { ...defaultsFor()[1], id: "stage_" + crypto.randomUUID(), name: "新默认阶段" };
        if (save([...defaults, next], true)) select(next.id);
      }, children: "添加默认阶段" }),
      /* @__PURE__ */ jsx(Button, { disabled: !!removalReason(stage.id), title: removalReason(stage.id) || void 0, onClick: () => remove(stage.id), children: "移除此默认阶段" })
    ] }),
    removalReason(stage.id) && /* @__PURE__ */ jsx("p", { style: noteStyle, children: removalReason(stage.id) }),
    /* @__PURE__ */ jsx(StageFields, { stage, levels, patch: (changes) => save(defaults.map((s) => s.id === stage.id ? { ...s, ...changes } : s)) }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", children: error })
  ] });
}
function AchievementStageEditor({ item, setInitial }) {
  const [configured] = useSetting("main.defaultStages");
  const [saved, setSaved] = useSetting("main.displayStages");
  const [configuredLevels] = useSetting("main.levels");
  const levels = (configuredLevels == null ? void 0 : configuredLevels.length) ? configuredLevels : DEFAULT_LEVELS;
  const defaults = defaultsFor(configured);
  const all = resolveStages(item.id, configured, saved);
  const [selected, select] = useState(item.initialStageId || "unknown");
  const [error, setError] = useState("");
  const stage = all.find((s) => s.id === selected) ?? all[0];
  const own = saved == null ? void 0 : saved.find((s) => s.achievementId === item.id && s.id === (stage == null ? void 0 : stage.id) && !s.disabled);
  const shared = defaults.find((s) => s.id === (stage == null ? void 0 : stage.id));
  const removed = defaults.filter((s) => saved == null ? void 0 : saved.some((o) => o.achievementId === item.id && o.id === s.id && o.disabled));
  const save = (next) => {
    const ok = setSaved(next);
    setError(ok ? "" : "保存失败，请检查内容。");
    return ok;
  };
  const without = (id2) => (saved ?? []).filter((s) => !(s.achievementId === item.id && s.id === id2));
  const saveStage = (next) => save([...without(next.id), next]);
  const removalReason = (id2) => localRemovalReason(item, all, id2);
  const remove = (id2) => {
    try {
      const next = removeLocalStage(item, configured, saved, id2);
      if (save(next) && (stage == null ? void 0 : stage.id) === id2) select(all.find((s) => s.id !== id2).id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(FieldRow, { label: "初始展示阶段", description: "只用于尚无阶段记录的新成就，已有记录不会改变。", children: /* @__PURE__ */ jsx(Select$1, { value: item.initialStageId || "unknown", placeholder: "请选择有效的初始阶段", options: all.map((s) => ({ value: s.id, label: s.name })), onChange: setInitial }) }),
    /* @__PURE__ */ jsx(FieldRow, { label: "编辑阶段", description: "展开列表，右键阶段可删除；只影响当前成就。", children: /* @__PURE__ */ jsx(StagePicker, { value: (stage == null ? void 0 : stage.id) ?? "", stages: all, onChange: select, removalReason, onRemove: remove }) }),
    stage && /* @__PURE__ */ jsx("p", { style: noteStyle, children: own ? "阶段信息与内容使用本成就专用配置；卡片和浮现的继承分别设置。" : "阶段信息与内容沿用默认配置；卡片和浮现可分别配置。" }),
    /* @__PURE__ */ jsxs("div", { style: actionsStyle, children: [
      /* @__PURE__ */ jsx(Button, { onClick: () => {
        const next = { ...presetStages(item.id)[1], id: "stage_" + crypto.randomUUID(), name: "新阶段" };
        if (saveStage(next)) select(next.id);
      }, children: "添加本成就阶段" }),
      stage && own && shared && /* @__PURE__ */ jsx(Button, { onClick: () => save(without(stage.id)), children: "恢复阶段信息与内容" }),
      stage && /* @__PURE__ */ jsx(Button, { disabled: !!removalReason(stage.id), title: removalReason(stage.id) || void 0, onClick: () => remove(stage.id), children: "从此成就移除阶段" })
    ] }),
    removed.length > 0 && /* @__PURE__ */ jsx(FieldRow, { label: "恢复已移除的默认阶段", children: /* @__PURE__ */ jsx(
      Select$1,
      {
        value: "",
        options: [{ value: "", label: "选择要恢复的阶段", disabled: true }, ...removed.map((s) => ({ value: s.id, label: s.name }))],
        onChange: (id2) => {
          if (save(without(id2))) select(id2);
        }
      }
    ) }),
    stage && /* @__PURE__ */ jsx(StageFields, { stage, item, levels, patch: (changes) => saveStage({ ...stage, ...changes, disabled: false }) }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", children: error })
  ] });
}
function AchievementEditor() {
  const [saved, setSaved] = useSetting("main.achievements");
  const [configuredLevels] = useSetting("main.levels");
  const [configuredStages] = useSetting("main.defaultStages");
  const [stageOverrides] = useSetting("main.displayStages");
  const items = saved ?? [];
  const levels = (configuredLevels == null ? void 0 : configuredLevels.length) ? configuredLevels : DEFAULT_LEVELS;
  const [open, setOpen] = useState(() => /* @__PURE__ */ new Set());
  const [newId, setNewId] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [error, setError] = useState("");
  const save = (next) => {
    const ok = setSaved(next);
    setError(ok ? "" : "保存失败，请检查填写内容。");
    return ok;
  };
  const patch = (item, changes) => save(items.map((a) => a.id === item.id ? { ...a, ...changes } : a));
  const toggle = (id2) => setOpen((previous) => {
    const next = new Set(previous);
    if (next.has(id2)) next.delete(id2);
    else next.add(id2);
    return next;
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }, children: [
      /* @__PURE__ */ jsxs("span", { children: [
        items.length,
        " 个成就"
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setOpen(new Set(items.map((a) => a.id))), children: "全部展开" }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setOpen(/* @__PURE__ */ new Set()), children: "全部收起" })
    ] }),
    items.map((item) => {
      var _a;
      return /* @__PURE__ */ jsxs("div", { style: { border: "1px solid var(--border-subtle)", borderRadius: 6, marginBottom: 8, overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            "aria-expanded": open.has(item.id),
            onClick: () => toggle(item.id),
            style: { width: "100%", border: 0, padding: "14px 12px", cursor: "pointer", background: "var(--bg-subtle)", color: "var(--fg-primary)", font: "inherit", textAlign: "left", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
            children: [
              /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: open.has(item.id) ? "▾" : "▸" }),
              /* @__PURE__ */ jsx("strong", { style: { flex: 1 }, children: item.name || "未命名成就" }),
              /* @__PURE__ */ jsx("span", { style: { color: "var(--fg-secondary)", overflowWrap: "anywhere" }, children: item.id }),
              /* @__PURE__ */ jsx("span", { children: ((_a = levels.find((l) => l.id === item.levelId)) == null ? void 0 : _a.name) ?? item.levelId })
            ]
          }
        ),
        open.has(item.id) && /* @__PURE__ */ jsxs("div", { style: { padding: 14 }, children: [
          /* @__PURE__ */ jsxs(Section, { title: "基础配置", collapsible: true, defaultOpen: false, description: "各阶段可沿用这里的名称、说明、图标和等级，也可单独设置。", children: [
            /* @__PURE__ */ jsxs("p", { style: { color: "var(--fg-secondary)" }, children: [
              "成就编号：",
              item.id,
              "（供剧情调用，修改名称不会改变编号）"
            ] }),
            /* @__PURE__ */ jsx(FieldRow, { label: "名称", children: /* @__PURE__ */ jsx(TextInput, { value: item.name, onChange: (name) => patch(item, { name }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "说明", children: /* @__PURE__ */ jsx(TextInput, { multiline: true, value: item.description ?? "", onChange: (description) => patch(item, { description }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "图标", children: /* @__PURE__ */ jsx(AssetPicker, { accepts: ["image"], value: item.icon ?? "", onChange: (icon) => patch(item, { icon }) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "基础等级", children: /* @__PURE__ */ jsx(Select$1, { value: item.levelId, options: levels.map((l) => ({ value: l.id, label: l.name })), onChange: (levelId) => patch(item, { levelId }) }) })
          ] }),
          /* @__PURE__ */ jsx(Section, { title: "展示阶段", collapsible: true, defaultOpen: false, children: /* @__PURE__ */ jsx(AchievementStageEditor, { item, setInitial: (initialStageId) => patch(item, { initialStageId }) }) }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8, marginTop: 16 }, children: removeId === item.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { children: "移除成就配置？已有玩家阶段记录会保留。" }),
            /* @__PURE__ */ jsx(Button, { variant: "danger", onClick: () => {
              if (save(items.filter((a) => a.id !== item.id))) setRemoveId("");
            }, children: "确认移除" }),
            /* @__PURE__ */ jsx(Button, { onClick: () => setRemoveId(""), children: "取消" })
          ] }) : /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setRemoveId(item.id), children: "移除成就" }) })
        ] })
      ] }, item.id);
    }),
    /* @__PURE__ */ jsx(FieldRow, { label: "新成就编号（可留空）", description: "留空自动生成。自填时使用字母、数字、点、横线或下划线；创建后保持稳定。", children: /* @__PURE__ */ jsx(TextInput, { value: newId, onChange: setNewId, placeholder: "例如 first_step" }) }),
    /* @__PURE__ */ jsx(Button, { disabled: items.length >= 1e4, onClick: () => {
      var _a;
      const id2 = newId.trim() || "achievement_" + crypto.randomUUID();
      if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(id2)) {
        setError("成就编号格式无效。");
        return;
      }
      if (items.some((a) => a.id === id2)) {
        setError("这个成就编号已经存在。");
        return;
      }
      const stages = resolveStages(id2, configuredStages, stageOverrides);
      if (!stages.length) {
        setError("此编号保留的阶段配置没有可用阶段，请使用新编号或先恢复阶段配置。");
        return;
      }
      const next = { id: id2, name: "新成就", description: "", icon: "", levelId: levels[0].id, initialStageId: ((_a = stages.find((s) => s.id === "unknown")) == null ? void 0 : _a.id) ?? stages[0].id };
      if (save([...items, next])) {
        setOpen((previous) => /* @__PURE__ */ new Set([...previous, id2]));
        setNewId("");
      }
    }, children: "添加成就" }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", children: error })
  ] });
}
function useStages(id2) {
  const [items] = useSetting("main.achievements");
  const [saved] = useSetting("main.displayStages");
  const [defaults] = useSetting("main.defaultStages");
  if (!id2 || !(items == null ? void 0 : items.some((item) => item.id === id2))) return [];
  return resolveStages(id2, defaults, saved);
}
function AchievementChoice() {
  const [items] = useSetting("main.achievements");
  const [id2, setId, info] = useParam("achievementId");
  const { readOnly } = useInspectorEnvironment();
  const [manual, setManual] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(FieldRow, { label: "选择成就", description: !(items == null ? void 0 : items.length) ? "先在局内成就系统配置页添加成就。" : void 0, children: /* @__PURE__ */ jsx(
      Select$1,
      {
        value: info.isVariable ? "" : id2 ?? "",
        disabled: readOnly,
        onChange: setId,
        options: [{ value: "", label: info.isVariable ? "当前使用变量" : "请选择成就", disabled: true }, ...id2 && !(items == null ? void 0 : items.some((a) => a.id === id2)) ? [{ value: id2, label: `未找到：${id2}` }] : [], ...(items ?? []).map((a) => ({ value: a.id, label: `${a.name || "未命名"}（${a.id}）` }))]
      }
    ) }),
    /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setManual(!manual), children: manual ? "收起编号／变量输入" : "按编号或变量指定" }),
    (manual || info.isVariable) && /* @__PURE__ */ jsx(ParamField, { name: "achievementId" })
  ] });
}
function StageChoice({ name, optional = false }) {
  const [achievementId, , achievementInfo] = useParam("achievementId");
  const [value, setValue, info] = useParam(name);
  const { readOnly } = useInspectorEnvironment();
  const [manual, setManual] = useState(false);
  const stages = useStages(achievementId);
  if (achievementInfo.isVariable || !achievementId || info.isVariable || manual) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ParamField, { name }),
    manual && /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setManual(false), children: "返回阶段选择" })
  ] });
  const missing = !!value && !stages.some((stage) => stage.id === value);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      FieldRow,
      {
        label: optional ? "仅在此阶段执行" : "目标展示阶段",
        description: !stages.length ? "请先选择配置中存在的成就。" : missing ? `原阶段编号 ${value} 不属于此成就或已被移除，请重新选择。原参数尚未修改。` : "只列出所选成就的阶段。",
        children: /* @__PURE__ */ jsx(Select$1, { value: value ?? "", placeholder: "请选择有效阶段", disabled: readOnly || !stages.length, onChange: setValue, options: [
          { value: "", label: optional ? "不限制" : "请选择阶段", disabled: !optional },
          ...stages.map((s) => ({ value: s.id, label: `${s.name}（${s.id}）` }))
        ] })
      }
    ),
    /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setManual(true), children: "按阶段编号或变量指定" })
  ] });
}
function OperationInspector() {
  const [expected, , expectedInfo] = useParam("expectedStageId");
  const [advanced, setAdvanced] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(AchievementChoice, {}),
    /* @__PURE__ */ jsx(StageChoice, { name: "stageId" }),
    /* @__PURE__ */ jsx(ParamField, { name: "notify" }),
    /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setAdvanced(!advanced), children: advanced ? "收起阶段限制" : "设置执行前的阶段限制（可选）" }),
    (advanced || expected || expectedInfo.isVariable) && /* @__PURE__ */ jsx(StageChoice, { name: "expectedStageId", optional: true }),
    /* @__PURE__ */ jsx("p", { children: "只切换当前展示阶段；相同阶段不重复浮现。阶段限制不匹配时跳过，界面通常自动刷新。" })
  ] });
}
function ReadInspector() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(AchievementChoice, {}),
    /* @__PURE__ */ jsx(ParamField, { name: "field" }),
    /* @__PURE__ */ jsx("p", { children: "返回当前阶段或等级的文本。条件建议比较稳定编号；当前等级由本阶段配置决定。" })
  ] });
}
const inspectors = { "change-stage": OperationInspector, "stage-info": ReadInspector };
function Browsing() {
  const [playerChoice] = useSetting("main.allowPlayerSwitch");
  const [paged, setPaged] = useSetting("main.allowPagination");
  const [vertical, setVertical] = useSetting("main.allowVertical");
  const [horizontal, setHorizontal] = useSetting("main.allowHorizontal");
  const modes = [
    { label: "翻页", value: paged === true, set: setPaged },
    { label: "纵向滚动", value: vertical === true, set: setVertical },
    { label: "横向滚动", value: horizontal === true, set: setHorizontal }
  ];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("p", { style: { color: "var(--fg-secondary)" }, children: "默认翻页／滚动只在官方编辑器设置：打开成就页，单击“双击编辑卡片 · 成就列表”，关闭“滚动模式”就是翻页，开启就是滚动。保存后重新打开游戏中的成就页生效。" }),
    /* @__PURE__ */ jsx(SettingField, { name: "main.scrollDirection" }),
    /* @__PURE__ */ jsx(SettingField, { name: "main.allowPlayerSwitch" }),
    playerChoice === true && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { children: "额外开放给玩家的方式：" }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 20, flexWrap: "wrap", padding: "8px 0" }, children: modes.map((mode2) => /* @__PURE__ */ jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: mode2.value,
            onChange: (event) => mode2.set(event.target.checked)
          }
        ),
        mode2.label
      ] }, mode2.label)) }),
      /* @__PURE__ */ jsx("p", { style: { color: "var(--fg-secondary)" }, children: "官方页面的默认方式始终可用；勾选项仅增加可选方式。只有两种以上方式时才显示切换按钮，玩家已有且仍开放的选择优先。" })
    ] }),
    /* @__PURE__ */ jsx("p", { style: { color: "var(--fg-secondary)" }, children: "行、列、间距和列表大小也在官方编辑器设置。这里仅补充滚动方向和玩家切换权限。" })
  ] });
}
function Validation() {
  const [levels] = useSetting("main.levels");
  const [items] = useSetting("main.achievements");
  const [stages] = useSetting("main.displayStages");
  const [defaults] = useSetting("main.defaultStages");
  const [appearances] = useSetting("main.appearances");
  const [elementCss] = useSetting("main.elementCss");
  const [presentations] = useSetting("main.stagePresentations");
  let message;
  let invalid = false;
  try {
    const value = catalog((levels == null ? void 0 : levels.length) ? levels : DEFAULT_LEVELS, items ?? [], stages ?? [], defaults ?? [], appearances ?? [], elementCss ?? [], presentations ?? []);
    message = `${value.achievements.length} 个成就，${value.levels.length} 个等级。`;
  } catch (error) {
    invalid = true;
    message = error instanceof Error ? error.message : String(error);
  }
  return /* @__PURE__ */ jsx("p", { role: invalid ? "alert" : "status", style: { color: invalid ? "var(--warn)" : "var(--fg-secondary)" }, children: message });
}
function settingsPage() {
  return /* @__PURE__ */ jsxs(Panel, { children: [
    /* @__PURE__ */ jsxs(Section, { title: "成就管理", collapsible: true, description: "点击成就展开基础内容与展示阶段；每条成就可独立收起。游戏中只记录当前阶段。", children: [
      /* @__PURE__ */ jsx(Validation, {}),
      /* @__PURE__ */ jsx(AchievementEditor, {})
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "通用配置", collapsible: true, defaultOpen: false, description: "统一维护等级、默认阶段，以及通用卡片展示和通用浮现方案。", children: [
      /* @__PURE__ */ jsx(Section, { title: "成就等级", collapsible: true, defaultOpen: false, description: "统一配置可供成就和阶段选择的等级。未配置时使用铜、银、金。", children: /* @__PURE__ */ jsx(LevelAppearanceEditor, {}) }),
      /* @__PURE__ */ jsx(SharedPresentationEditor, { surface: "card" }),
      /* @__PURE__ */ jsx(SharedPresentationEditor, { surface: "popup" }),
      /* @__PURE__ */ jsx(Section, { title: "默认阶段配置", collapsible: true, defaultOpen: false, description: "共用的阶段配置。成就默认沿用这里；在单个成就下修改后，仅该成就使用专用配置。", children: /* @__PURE__ */ jsx(DefaultStageEditor, {}) })
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "界面与播放", collapsible: true, defaultOpen: false, description: "成就页的编排、浏览方式和全局浮现播放开关；通用表现到通用配置管理。", children: [
      /* @__PURE__ */ jsxs(Section, { title: "成就页与卡片编排", collapsible: true, defaultOpen: false, description: "默认翻页／滚动与页面编排统一在官方 UI 编辑器设置；这里补充滚动方向和玩家切换权限。通过“打开成就页”进入游戏界面。", children: [
        /* @__PURE__ */ jsx(SettingField, { name: "main.page" }),
        /* @__PURE__ */ jsx(Browsing, {}),
        /* @__PURE__ */ jsx(CardLayoutEditor, {})
      ] }),
      /* @__PURE__ */ jsx(Section, { title: "浮现播放", collapsible: true, defaultOpen: false, description: "全局允许播放后，各阶段自行决定是否浮现。连续通知内置排队，依次播放；相同阶段不重复播放。", children: /* @__PURE__ */ jsx(SettingField, { name: "main.notifications" }) })
    ] })
  ] });
}
export {
  inspectors,
  settingsPage
};
//# sourceMappingURL=studio.js.map
