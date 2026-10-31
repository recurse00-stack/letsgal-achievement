var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create((base == null ? void 0 : base[__knownSymbol("metadata")]) ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x2) {
    return __privateSet(this, extra, x2);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x2) => __privateIn(target, x2) : (x2) => name in x2 };
      if (k ^ 3) access.get = p ? (x2) => (k ^ 1 ? __privateGet : __privateMethod)(x2, target, k ^ 4 ? extra : desc.get) : (x2) => x2[name];
      if (k > 2) access.set = p ? (x2, y) => __privateSet(x2, target, y, k ^ 4 ? extra : desc.set) : (x2, y) => x2[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _AchievementExtension_decorators, _init, _a;
import { defineSave, Extension, settings, extension } from "@avg-studio/sdk";
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
function effectFrames(effect) {
  switch (effect) {
    case "float":
      return [{ transform: "translateY(0)" }, { transform: "translateY(-5px)" }, { transform: "translateY(0)" }];
    case "rotate":
      return [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }];
    case "pulse":
      return [{ opacity: 1 }, { opacity: 0.45 }, { opacity: 1 }];
    case "glow":
      return [{ filter: "brightness(1)" }, { filter: "brightness(1.8) drop-shadow(0 0 5px currentColor)" }, { filter: "brightness(1)" }];
    default:
      return [];
  }
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
var document$1 = Document$3;
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
let Document$2 = document$1;
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
let Document$1 = document$1;
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
let Document2 = document$1;
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
    var _a2;
    if (((_a2 = rule2.parent) == null ? void 0 : _a2.type) === "atrule") {
      if (!rule2.selector.split(",").every((v) => /^(from|to|(?:\d+(?:\.\d+)?)%)$/.test(v.trim()))) throw rule2.error("关键帧位置需要 from、to 或百分比。");
    } else if (rule2.parent !== root2 || !rule2.selector.split(",").every((s) => /^&(?:(?::(?:hover|active|focus|focus-visible|focus-within|disabled))|(?:::?(?:before|after)))*(?:\s+img)?$/.test(s.trim()))) {
      throw rule2.error("元素状态请使用 &:hover、&::before 等写法；图片子层使用 & img，不支持全局选择器或规则嵌套。");
    }
  });
  root2.walkDecls((decl) => {
    var _a2, _b;
    if (!/^(?:--[\w-]+|[a-zA-Z-]+)$/.test(decl.prop) || /^--achievement-/i.test(decl.prop)) throw decl.error("CSS 属性无效，不能修改成就系统的内部标记。");
    const decoded = decl.value.replace(/\\([\da-f]{1,6})\s?/gi, (_, n) => String.fromCodePoint(Math.min(parseInt(n, 16), 1114111))).replace(/\\(.)/g, "$1").replace(/\/\*[\s\S]*?\*\//g, "");
    if (/expression\s*\(|javascript:|(?:image-set|src)\s*\(/i.test(decoded)) throw decl.error("不支持此 CSS 资源或表达式。");
    for (const match of decoded.matchAll(/url\s*\(\s*([\s\S]*?)\s*\)/gi)) {
      const url = match[1].replace(/^(['"])([\s\S]*)\1$/, "$2");
      if (!/^(?:data:image\/|#)/i.test(url)) throw decl.error("CSS 图片仅支持 data:image 或 #片段；工程图片请用素材选择器。");
    }
    if (((_a2 = decl.parent) == null ? void 0 : _a2.type) !== "root" && ((_b = decl.parent) == null ? void 0 : _b.type) !== "rule") throw decl.error("CSS 属性必须位于元素样式或关键帧中。");
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
function targetCssProperties(layers, surface, role, id2, baseOnly = false) {
  const blocks = layers.filter((r) => (r.surface === "both" || r.surface === surface) && (r.target === role || !!id2 && r.target === `element:${id2}`)).map((r) => r.css);
  if (!baseOnly) return cssProperties(blocks);
  const props = /* @__PURE__ */ new Set();
  for (const css of blocks) {
    const root2 = parseElementCss(css);
    root2.walkDecls((d) => {
      if (d.parent === root2) props.add(d.prop.toLowerCase());
    });
  }
  return props;
}
function rewriteCss(css, selector, prefix) {
  const root2 = parseElementCss(css).clone(), frames = /* @__PURE__ */ new Map(), properties = /* @__PURE__ */ new Set();
  root2.walkAtRules("keyframes", (r) => {
    frames.set(r.params, `${prefix}-${r.params}`);
    r.params = frames.get(r.params);
  });
  root2.walkDecls((d) => {
    properties.add(d.prop.toLowerCase());
    if (/^(?:-webkit-)?animation(?:-name)?$/.test(d.prop)) d.value = d.value.replace(/[A-Za-z_][\w-]*/g, (name) => frames.get(name) ?? name);
  });
  const base = root2.nodes.filter((node2) => node2.type === "decl");
  const initial = postcss$1.rule({ selector });
  for (const decl of base) initial.append(decl.clone());
  for (const decl of base) decl.remove();
  root2.walkRules((rule2) => {
    var _a2;
    if (((_a2 = rule2.parent) == null ? void 0 : _a2.type) === "root") rule2.selector = rule2.selector.split(",").map((s) => s.trim().replace(/^&/, selector)).join(",");
  });
  root2.prepend(initial);
  return { text: root2.toString(), properties, base };
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
  var _a2;
  const levelId = stage.levelMode === "custom" ? stage.levelId : item == null ? void 0 : item.levelId;
  const levelAppearanceId = levelPresetId(levels.find((l) => l.id === levelId), p.surface);
  const appearanceId = presets ? (_a2 = presentationPreset(p, presets, levelAppearanceId, p.surface)) == null ? void 0 : _a2.id : p.appearanceSource === "preset" ? p.appearanceId : p.appearanceSource === "level" ? levelAppearanceId : "";
  return [
    ...appearanceId ? [{ ownerKind: "appearance", ownerId: appearanceId, achievementId: "" }] : [],
    { ownerKind: "defaultStage", ownerId: stage.id, achievementId: "" },
    ...item ? [{ ownerKind: "stage", ownerId: stage.id, achievementId: item.id }] : []
  ];
}
function projectPresentation(definitions, item, stage, surface) {
  const raw = resolvePresentation(definitions.presentations ?? [], definitions.defaultStages, stage, item.id, surface);
  const level = definitions.levels.find((l) => l.id === (stage.levelMode === "custom" ? stage.levelId : item.levelId));
  const p = materializePresentation(raw, definitions.appearances ?? [], levelPresetId(level, surface));
  if (!p.enabled) return void 0;
  const content = (mode2, base, custom) => mode2 === "base" ? base : mode2 === "custom" ? custom : "";
  const stageName = content(stage.nameMode, item.name, stage.displayName);
  const stageDescription = content(stage.descriptionMode, item.description, stage.description);
  const select = (mode2, shared, own) => mode2 === "stage" ? shared : mode2 === "custom" ? own : "";
  const iconMode = p.iconMode === "stage" ? stage.iconMode : p.iconMode;
  const levelId = stage.levelMode === "custom" ? stage.levelId : item.levelId;
  return {
    id: item.id,
    stageId: stage.id,
    name: select(p.nameMode, stageName, p.displayName),
    description: select(p.descriptionMode, stageDescription, p.description),
    iconMode,
    icon: p.iconMode === "stage" ? content(stage.iconMode, item.icon, stage.icon) : p.iconMode === "custom" ? p.icon : "",
    levelId: p.showLevel ? levelId : "",
    levelName: p.showLevel ? (level == null ? void 0 : level.name) ?? "" : "",
    stageName: p.showStageName ? stage.name : "",
    appearance: resolveAppearance(p, definitions.appearances ?? [], levelPresetId(level, surface), surface),
    elementCss: resolveElementCss(definitions.elementCss ?? [], presentationCssOwners(p, stage, item, definitions.levels, definitions.appearances)).filter((r) => r.surface === surface),
    ...surface === "popup" ? { popupUI: p.ui, popupDurationMs: p.durationMs } : {}
  };
}
class AchievementError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AchievementError";
  }
}
function object$2(value) {
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
    const row = object$2(value);
    return { ...optionalAppearance(row), ...parsePresetOptions(row), id: id(row.id), name: text(row.name, "外观名称") };
  }), "共用外观");
  for (const surface of ["card", "popup"]) if (appearances.filter((p) => p.isDefault && p.surface === surface).length > 1) throw new AchievementError("INVALID_DATA", "每组只能有一个默认表现方案");
  const levels = unique(rows(levelValues).map((value) => {
    const row = object$2(value);
    return { id: id(row.id), name: text(row.name, "等级名称"), ...row.appearanceId ? { appearanceId: id(row.appearanceId) } : {}, ...row.popupAppearanceId ? { popupAppearanceId: id(row.popupAppearanceId) } : {} };
  }), "等级");
  const achievements = unique(rows(achievementValues).map((value) => {
    const row = object$2(value);
    const achievement = { id: id(row.id), name: text(row.name, "成就名称"), description: text(row.description ?? "", "成就说明", true), icon: text(row.icon ?? "", "图标", true), levelId: id(row.levelId), initialStageId: row.initialStageId ? id(row.initialStageId) : "unknown" };
    if (!levels.some((level) => level.id === achievement.levelId)) throw new AchievementError("LEVEL_NOT_FOUND", `成就 ${achievement.id} 的等级不存在`);
    return achievement;
  }), "成就");
  const parseStage = (value) => {
    const row = object$2(value);
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
    const row = object$2(value);
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
function currentStage(definitions, records, achievementId) {
  const item = definitions.achievements.find((row) => row.id === achievementId);
  if (!item) throw new AchievementError("NOT_FOUND", `找不到成就：${achievementId}`);
  const saved = records.find((row) => row.id === achievementId);
  return (saved == null ? void 0 : saved.stageId) ?? item.initialStageId;
}
function stageRecords(value) {
  return unique(rows(value).map((value2) => {
    const row = object$2(value2);
    if (typeof row.stageId !== "string" || !row.stageId.trim()) throw new AchievementError("INVALID_DATA", "记录缺少展示阶段编号，请使用新版阶段记录表");
    return { id: id(row.id), stageId: id(row.stageId) };
  }), "阶段记录");
}
function entries(definitions, records, surface = "card") {
  return definitions.achievements.flatMap((row) => {
    const stage = stagesFor(definitions, row.id).find((s) => s.id === currentStage(definitions, records, row.id));
    if (!stage) return [];
    const entry = projectPresentation(definitions, row, stage, surface);
    return entry ? [entry] : [];
  });
}
function setDisplayStage(definitions, records, achievementId, target, expected = "") {
  if (typeof expected !== "string") throw new AchievementError("INVALID_DATA", "预期阶段必须为文本");
  const previous = currentStage(definitions, records, achievementId);
  if (!stagesFor(definitions, achievementId).some((s) => s.id === target)) throw new AchievementError("STAGE_NOT_FOUND", `找不到展示阶段：${target}`);
  if (expected && previous !== expected) return { changed: false, matched: false, records: records.map((r) => ({ ...r })) };
  const next = records.filter((r) => r.id !== achievementId).map((r) => ({ ...r }));
  next.push({ id: achievementId, stageId: target });
  return { changed: previous !== target, matched: true, records: next };
}
function readInfo(definitions, records, achievementId, field) {
  var _a2;
  const stageId = currentStage(definitions, records, achievementId);
  const stage = stagesFor(definitions, achievementId).find((s) => s.id === stageId);
  const item = definitions.achievements.find((a) => a.id === achievementId);
  const levelId = stage ? stage.levelMode === "custom" ? stage.levelId : item.levelId : "";
  switch (field) {
    case "stageId":
      return stageId;
    case "stageName":
      return (stage == null ? void 0 : stage.name) ?? "";
    case "levelId":
      return levelId;
    case "levelName":
      return ((_a2 = definitions.levels.find((l) => l.id === levelId)) == null ? void 0 : _a2.name) ?? "";
    default:
      throw new AchievementError("INVALID_DATA", "读取项目无效");
  }
}
class NotificationQueue {
  constructor(play, report) {
    this.play = play;
    this.report = report;
    this.pending = [];
    this.running = false;
    this.stopped = false;
  }
  enqueue(item) {
    if (this.stopped) return;
    this.pending.push(item);
    void this.drain();
  }
  stop() {
    var _a2;
    this.stopped = true;
    this.pending.length = 0;
    (_a2 = this.current) == null ? void 0 : _a2.abort();
  }
  async drain() {
    if (this.running || this.stopped) return;
    this.running = true;
    try {
      while (this.pending.length && !this.stopped) {
        this.current = new AbortController();
        try {
          await this.play(this.pending.shift(), this.current.signal);
        } catch (error) {
          if (!this.stopped) this.report(error);
        } finally {
          this.current = void 0;
        }
      }
    } finally {
      this.running = false;
    }
  }
}
function delay(ms, signal) {
  return new Promise((resolve2) => {
    if (signal.aborted) {
      resolve2();
      return;
    }
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve2();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}
const BROWSE_MODES = ["pagination", "scroll", "horizontal"];
const BROWSE_LABELS = { pagination: "翻页", scroll: "纵向滚动", horizontal: "横向滚动" };
function browseChoices(options2) {
  if (options2.authoredMode !== "pagination" && options2.authoredMode !== "scroll") return [];
  const initial = options2.authoredMode === "scroll" && options2.scrollDirection === "horizontal" ? "horizontal" : options2.authoredMode;
  if (options2.allowPlayerSwitch !== true) return [initial];
  return [initial, ...BROWSE_MODES.filter((mode2) => mode2 !== initial && (mode2 === "pagination" ? options2.allowPagination === true : mode2 === "scroll" ? options2.allowVertical === true : options2.allowHorizontal === true))];
}
function bindBrowseMode(view, preference, options2 = {}, horizontal) {
  const list2 = view.get("achievement-list");
  if (!list2) {
    horizontal == null ? void 0 : horizontal.dispose();
    return () => {
    };
  }
  const choices = browseChoices(options2);
  const playerChoice = options2.allowPlayerSwitch === true && choices.length > 1;
  const fallback = choices[0];
  const saved = playerChoice ? preference.read() : void 0;
  let mode2 = playerChoice && choices.includes(saved) ? saved : fallback;
  const buttons = BROWSE_MODES.map((key) => ({ key, handle: view.get("achievement-mode-" + key) }));
  if (!fallback) {
    buttons.forEach(({ handle }) => handle == null ? void 0 : handle.setHidden(true));
    horizontal == null ? void 0 : horizontal.dispose();
    return () => {
    };
  }
  let nativeMode = options2.authoredMode;
  let live = true;
  const render = () => {
    const nextNative = mode2 === "horizontal" ? "scroll" : mode2;
    if (nativeMode !== nextNative) {
      list2.setProps({ navigationMode: nextNative });
      nativeMode = nextNative;
    }
    horizontal == null ? void 0 : horizontal.setEnabled(mode2 === "horizontal");
    for (const { key, handle } of buttons) {
      handle == null ? void 0 : handle.setHidden(!playerChoice || !choices.includes(key));
      handle == null ? void 0 : handle.setProps({ text: BROWSE_LABELS[key] + (key === mode2 ? " ✓" : "") });
    }
  };
  const detach = buttons.filter(({ key }) => playerChoice && choices.includes(key)).map(({ key, handle }) => handle == null ? void 0 : handle.on("click", () => {
    if (!live || mode2 === key) return;
    preference.write(key);
    mode2 = key;
    render();
  }));
  render();
  return () => {
    if (!live) return;
    live = false;
    detach.forEach((stop) => stop == null ? void 0 : stop());
    horizontal == null ? void 0 : horizontal.dispose();
  };
}
const GRID$1 = '[data-visual-ui-scroll-container="true"]';
const MARKER = "--achievement-layout-instance";
let sequence$3 = 0;
function horizontalCss(token, cols, rows2, gap) {
  return `${MARKER}: ${token};
& ${GRID$1} {
  grid-auto-flow: column !important;
  grid-template-columns: none !important;
  grid-template-rows: repeat(${rows2}, minmax(0, 1fr)) !important;
  grid-auto-rows: auto !important;
  grid-auto-columns: calc((100% - ${gap * (cols - 1)}px) / ${cols}) !important;
  overflow-x: auto !important; overflow-y: hidden !important;
  scrollbar-width: thin !important; scrollbar-color: #a89779 #202833;
  overscroll-behavior: contain; touch-action: pan-x;
}
& ${GRID$1}::-webkit-scrollbar { display: block !important; height: 12px; }
& ${GRID$1}::-webkit-scrollbar-thumb { background: #a89779; border-radius: 6px; }
& ${GRID$1}::-webkit-scrollbar-track { background: #202833; }
& ${GRID$1} ~ * { display: none !important; }`;
}
function wheelDistance(x2, y, unit, width) {
  return (Math.abs(x2) >= Math.abs(y) ? x2 : y) * (unit === 1 ? 16 : unit === 2 ? width : 1);
}
function createHorizontalCards(layout, baseCss = "") {
  if (baseCss) layout == null ? void 0 : layout.setStyle({ customCss: baseCss });
  const token = `achievement-${Date.now()}-${++sequence$3}`;
  const marker = `${MARKER}: ${token};`;
  let enabled = false, disposed = false, owned = false, frame = 0, attempts = 0;
  let grid;
  let detach = () => {
  };
  let observer;
  const clear = () => {
    if (frame) cancelAnimationFrame(frame);
    observer == null ? void 0 : observer.disconnect();
    observer = void 0;
    detach();
    detach = () => {
    };
    grid = void 0;
  };
  const fail = (message) => {
    clear();
    layout == null ? void 0 : layout.setStyle({ customCss: baseCss });
    console.error("[成就] 横向卡片布局未接入：" + message + "。当前保留原生纵向列表。");
  };
  const attach = () => {
    var _a2;
    if (disposed || !enabled) return;
    const candidates = Array.from(document.querySelectorAll(GRID$1)).filter((node2) => getComputedStyle(node2).getPropertyValue(MARKER).trim() === token);
    if (!candidates.length) {
      if (++attempts < 120) frame = requestAnimationFrame(attach);
      return;
    }
    if (candidates.length !== 1) {
      fail("布局容器内必须只有一个成就列表");
      return;
    }
    const target = candidates[0];
    if (grid === target) return;
    detach();
    const original = getComputedStyle(target);
    const cols = (_a2 = /^repeat\((\d+),/.exec(target.style.gridTemplateColumns)) == null ? void 0 : _a2[1];
    const cell = target.firstElementChild;
    const gap = parseFloat(original.rowGap) || 0;
    const cellHeight = cell instanceof HTMLElement ? cell.offsetHeight : 0;
    const rows2 = Math.round((target.clientHeight + gap) / (cellHeight + gap));
    if (!cols || rows2 < 1 || rows2 > 100 || !cellHeight) {
      fail("当前列表结构或尺寸不适用，请使用卡片布局");
      return;
    }
    grid = target;
    const oldTabIndex = target.getAttribute("tabindex");
    const oldLabel = target.getAttribute("aria-label");
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", "成就卡片，左右滚动");
    target.scrollTop = 0;
    target.scrollLeft = 0;
    const wheel = (event) => {
      if (event.ctrlKey || target.scrollWidth <= target.clientWidth) return;
      event.preventDefault();
      event.stopPropagation();
      target.scrollLeft += wheelDistance(event.deltaX, event.deltaY, event.deltaMode, target.clientWidth);
    };
    const key = (event) => {
      if (event.target !== target) return;
      const distance = Math.max(1, target.clientWidth * 0.8);
      const positions = { ArrowLeft: target.scrollLeft - distance, ArrowRight: target.scrollLeft + distance, Home: 0, End: target.scrollWidth };
      if (!(event.key in positions)) return;
      event.preventDefault();
      event.stopPropagation();
      target.scrollLeft = positions[event.key];
    };
    target.addEventListener("wheel", wheel, { passive: false, capture: true });
    target.addEventListener("keydown", key);
    detach = () => {
      target.removeEventListener("wheel", wheel, true);
      target.removeEventListener("keydown", key);
      if (oldTabIndex === null) target.removeAttribute("tabindex");
      else target.setAttribute("tabindex", oldTabIndex);
      if (oldLabel === null) target.removeAttribute("aria-label");
      else target.setAttribute("aria-label", oldLabel);
      target.scrollLeft = 0;
      target.scrollTop = 0;
    };
    layout.setStyle({ customCss: baseCss + horizontalCss(token, Number(cols), rows2, parseFloat(original.columnGap) || 0) });
  };
  return {
    setEnabled(next) {
      if (disposed || enabled === next) return;
      enabled = next;
      clear();
      if (!next) {
        layout == null ? void 0 : layout.setStyle({ customCss: baseCss });
        return;
      }
      if (!layout) {
        fail("缺少 achievement-list 卡片列表");
        return;
      }
      owned = true;
      layout.setStyle({ customCss: baseCss + marker });
      attempts = 0;
      frame = requestAnimationFrame(attach);
      observer = new MutationObserver(() => {
        if (grid == null ? void 0 : grid.isConnected) return;
        cancelAnimationFrame(frame);
        attempts = 0;
        frame = requestAnimationFrame(attach);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      if (owned) layout == null ? void 0 : layout.setStyle({ customCss: "" });
    }
  };
}
function ownedStyles() {
  const values = /* @__PURE__ */ new Map();
  return {
    set(node2, property, value) {
      let properties = values.get(node2);
      if (!properties) {
        properties = /* @__PURE__ */ new Map();
        values.set(node2, properties);
      }
      if (!properties.has(property)) properties.set(property, { before: node2.style.getPropertyValue(property), priority: node2.style.getPropertyPriority(property), written: "" });
      const previous = properties.get(property);
      if (node2.style.getPropertyValue(property) !== value) node2.style.setProperty(property, value);
      previous.written = node2.style.getPropertyValue(property);
    },
    restore() {
      for (const [node2, properties] of values) for (const [key, v] of properties) {
        if (node2.style.getPropertyValue(key) !== v.written) continue;
        if (v.before) node2.style.setProperty(key, v.before, v.priority);
        else node2.style.removeProperty(key);
      }
      values.clear();
    }
  };
}
function cssUrl(url) {
  return `url("${url.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]/g, "")}")`;
}
function backgroundPaint(a) {
  return a.backgroundMode === "gradient" ? `linear-gradient(${a.backgroundAngle}deg, ${a.backgroundColor || "transparent"}, ${a.backgroundColorEnd || "transparent"})` : a.backgroundColor || "transparent";
}
function bindElementEffects(container2, parts, appearance, allowHover = true) {
  const animations = [], finished = /* @__PURE__ */ new Set();
  let onScreen = true, hovered = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => {
    const allowed = onScreen && !document.hidden && !reduced.matches && (appearance.effectTrigger !== "hover" || allowHover && hovered);
    for (const a of animations) {
      if (finished.has(a) || a.playState === "finished") continue;
      if (allowed) a.play();
      else a.pause();
    }
  };
  for (const [role, effect] of [["icon", appearance.iconEffect], ["frame", appearance.frameEffect]]) {
    const content = parts.get(role), frames = effectFrames(effect);
    if (!content || !frames.length || typeof content.animate !== "function" || !allowHover && appearance.effectTrigger === "hover") continue;
    const a = content.animate(frames, { duration: appearance.effectDuration, iterations: appearance.effectTrigger === "enter" ? 1 : Infinity, easing: effect === "rotate" ? "linear" : "ease-in-out" });
    a.onfinish = () => {
      finished.add(a);
    };
    a.pause();
    animations.push(a);
  }
  const enter = () => {
    hovered = true;
    update();
  }, leave = () => {
    hovered = false;
    update();
  };
  const intersection = new IntersectionObserver((items) => {
    var _a2;
    onScreen = ((_a2 = items[0]) == null ? void 0 : _a2.isIntersecting) ?? false;
    update();
  });
  intersection.observe(container2);
  container2.addEventListener("mouseenter", enter);
  container2.addEventListener("mouseleave", leave);
  document.addEventListener("visibilitychange", update);
  reduced.addEventListener("change", update);
  update();
  return () => {
    intersection.disconnect();
    container2.removeEventListener("mouseenter", enter);
    container2.removeEventListener("mouseleave", leave);
    document.removeEventListener("visibilitychange", update);
    reduced.removeEventListener("change", update);
    animations.forEach((a) => {
      a.onfinish = null;
      a.cancel();
    });
    finished.clear();
  };
}
let sequence$2 = 0;
const ATTR = "data-achievement-element-css";
const sides = ["top", "right", "bottom", "left"];
const backgrounds = ["background-color", "background-image", "background-position", "background-size", "background-repeat", "background-origin", "background-clip", "background-attachment"];
const borderImages = ["border-image-source", "border-image-slice", "border-image-width", "border-image-outset", "border-image-repeat"];
function longhands(property) {
  if (property === "background") return backgrounds;
  if (property === "border") return [...borderImages, ...sides.flatMap((side) => ["width", "style", "color"].map((v) => `border-${side}-${v}`))];
  if (/^border-(width|style|color)$/.test(property)) return sides.map((side) => `border-${side}-${property.slice(7)}`);
  if (sides.some((side) => property === `border-${side}`)) return ["width", "style", "color"].map((v) => `${property}-${v}`);
  if (property === "border-image") return borderImages;
  if (property === "border-radius") return ["top-left", "top-right", "bottom-right", "bottom-left"].map((v) => `border-${v}-radius`);
  if (property === "font") return ["font-family", "font-size", "font-weight", "font-style", "font-variant", "font-stretch", "line-height"];
  return [property];
}
const textProperty = /^(?:color|font(?:-|$)|line-height|letter-spacing|word-spacing|text-(?:align|decoration|transform|shadow|indent|overflow)|white-space|word-break|overflow-wrap)/;
function bindElementCss(parts, layers, surface, appearance) {
  const cleanup = [], overridden = /* @__PURE__ */ new Set();
  const byNode = /* @__PURE__ */ new Map();
  for (const layer of layers) {
    if (layer.surface !== "both" && layer.surface !== surface) continue;
    const node2 = parts.get(layer.target);
    if (!node2 || !layer.css.trim()) continue;
    byNode.set(node2, [...byNode.get(node2) ?? [], layer.css]);
  }
  for (const [node2, blocks] of byNode) {
    const token = `achcss-${++sequence$2}`, attribute = node2.getAttribute(ATTR);
    const selector = `[${ATTR}="${token}"]:not(#${token}-reserved):not(#${token}-reserved-2)`;
    const root2 = parseElementCss(blocks.join("\n"));
    const animated = /* @__PURE__ */ new Set();
    root2.walkAtRules("keyframes", (rule2) => {
      rule2.walkDecls((d) => {
        for (const p of longhands(d.prop)) animated.add(p);
      });
    });
    root2.walkDecls((d) => {
      var _a2, _b;
      if (((_b = (_a2 = d.parent) == null ? void 0 : _a2.parent) == null ? void 0 : _b.type) === "atrule") return;
      if (!longhands(d.prop).some((p) => animated.has(p))) d.important = true;
    });
    const compiled = rewriteCss(root2.toString(), selector, token);
    const undo = ownedStyles();
    [...compiled.properties].flatMap(longhands);
    for (const key of animated) if (node2.style.getPropertyPriority(key) === "important") undo.set(node2, key, "");
    const textPaint = node2.querySelector("[data-visual-ui-text-paint]");
    let textCss = "";
    if (textPaint) {
      const textRoot = postcss$1.parse(compiled.text);
      textRoot.walkAtRules((rule2) => {
        rule2.remove();
      });
      textRoot.walkRules((rule2) => {
        rule2.selector = rule2.selector.split(",").map((s) => `${s} [data-visual-ui-text-paint]`).join(",");
        rule2.walkDecls((d) => {
          if (!textProperty.test(d.prop)) d.remove();
        });
      });
      textCss = textRoot.toString();
      const animatedText = [...animated].filter((p) => textProperty.test(p));
      if (animatedText.length) textCss += `
${selector} [data-visual-ui-text-paint]{${animatedText.map((p) => `${p}:inherit!important`).join(";")}}`;
    }
    const sheet = node2.ownerDocument.createElement("style");
    sheet.dataset.achievementCss = token;
    sheet.textContent = compiled.text + "\n" + textCss + `
@media(prefers-reduced-motion:reduce){${selector}{animation:none!important;transition:none!important;}}`;
    node2.setAttribute(ATTR, token);
    node2.ownerDocument.head.append(sheet);
    for (const [role, effect] of [["icon", appearance.iconEffect], ["frame", appearance.frameEffect]]) {
      if (parts.get(role) === node2 && cssStopsEffect(compiled.properties, effect)) overridden.add(role);
    }
    cleanup.push(() => {
      sheet.remove();
      undo.restore();
      if (node2.getAttribute(ATTR) === token) {
        if (attribute === null) node2.removeAttribute(ATTR);
        else node2.setAttribute(ATTR, attribute);
      }
    });
  }
  return {
    effects: { ...appearance, ...overridden.has("icon") ? { iconEffect: "none" } : {}, ...overridden.has("frame") ? { frameEffect: "none" } : {} },
    dispose() {
      cleanup.reverse().forEach((stop) => stop());
    }
  };
}
const GRID = '[data-visual-ui-scroll-container="true"], [style*="grid-template-columns"]';
const SCOPE = "--achievement-card-scope";
const ROLE = "--achievement-card-role";
let sequence$1 = 0;
function partsOf(cell, contract = []) {
  const parts = /* @__PURE__ */ new Map();
  const children = Array.from(cell.children);
  if (contract.length && children.length !== contract.length) return parts;
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    if (!(child instanceof HTMLElement) || !(child.firstElementChild instanceof HTMLElement)) continue;
    const content = child.firstElementChild;
    const expected = contract[index];
    if (expected && (expected.type === "image" && !content.matches("[data-visual-ui-image]") || expected.type === "text" && !content.querySelector("[data-visual-ui-text-paint]"))) return /* @__PURE__ */ new Map();
    const authoredRole = (expected == null ? void 0 : expected.role) || getComputedStyle(content).getPropertyValue(ROLE).trim();
    const role = authoredRole === "stage" ? "stageName" : authoredRole;
    if (role && !parts.has(role)) parts.set(role, { box: child, content });
    if (expected == null ? void 0 : expected.id) parts.set(`element:${expected.id}`, { box: child, content });
  }
  return parts;
}
function imageSource(part) {
  const img = part == null ? void 0 : part.content.querySelector('img[data-active="true"], img');
  return (img == null ? void 0 : img.currentSrc) || (img == null ? void 0 : img.src) || "";
}
function bindCardLayout(read, contract = [], onSize) {
  const token = `card-${++sequence$1}-${Date.now()}`;
  const css = `${SCOPE}: ${token};`;
  if (typeof document === "undefined") return { css, refresh() {
  }, dispose() {
  } };
  let disposed = false, frame = 0;
  const cells = /* @__PURE__ */ new Map();
  const queue = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(scan);
  };
  const mutation = new MutationObserver(queue);
  mutation.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "data-active"] });
  function configure(cell, entry, parts) {
    const style = ownedStyles();
    const set = style.set;
    const appearance = cardAppearance(entry.appearance ?? {});
    const bg = parts.get("background"), bgImage = parts.get("backgroundImage"), border = parts.get("frame");
    const props = (role, baseOnly = false) => {
      var _a2;
      return targetCssProperties(entry.elementCss ?? [], "card", role, (_a2 = contract.find((p) => p.role === role)) == null ? void 0 : _a2.id, baseOnly);
    };
    const bgCss = props("background", true), imageCss = props("backgroundImage"), frameCss = props("frame");
    if (bg && appearance.backgroundMode !== "template") {
      set(bg.content, "background", backgroundPaint(appearance));
    }
    if (bgImage && appearance.backgroundMode !== "template") {
      set(bgImage.box, "display", appearance.backgroundMode === "image" && !!appearance.backgroundImage ? "block" : "none");
      const img = bgImage.content.querySelector("img");
      if (appearance.backgroundFit === "tile" && imageSource(bgImage)) {
        set(bgImage.content, "background-image", cssUrl(imageSource(bgImage)));
        set(bgImage.content, "background-repeat", "repeat");
        if (img) set(img, "visibility", "hidden");
        set(bgImage.content, "background-position", `${appearance.backgroundX}% ${appearance.backgroundY}%`);
      } else if (img) {
        set(img, "object-fit", appearance.backgroundFit);
        set(img, "object-position", `${appearance.backgroundX}% ${appearance.backgroundY}%`);
      }
    }
    if (border && appearance.frameMode !== "template") {
      set(border.box, "display", appearance.frameMode === "none" ? "none" : "block");
      const img = border.content.querySelector("img");
      if (img) set(img, "visibility", "hidden");
      set(border.content, "box-sizing", "border-box");
      for (const side of ["top", "right", "bottom", "left"]) {
        set(border.content, `border-${side}-width`, `${appearance.frameWidth}px`);
        set(border.content, `border-${side}-style`, "solid");
        set(border.content, `border-${side}-color`, appearance.frameColor || "currentColor");
      }
      set(border.content, "color", appearance.frameColor || "inherit");
      set(border.content, "border-radius", appearance.frameMode === "nineSlice" ? "0" : `${appearance.frameRadius}px`);
      if (appearance.frameMode === "nineSlice" && appearance.frameImage && imageSource(border)) {
        set(border.content, "border-image-source", cssUrl(imageSource(border)));
        set(border.content, "border-image-slice", `${appearance.sliceTop} ${appearance.sliceRight} ${appearance.sliceBottom} ${appearance.sliceLeft}`);
        set(border.content, "border-image-width", String(1));
        set(border.content, "border-image-repeat", appearance.frameRepeat);
      }
    }
    if (bgImage && (bgCss.has("background") || bgCss.has("background-image")) && !imageCss.size) set(bgImage.box, "display", "none");
    if (bgImage && imageCss.size) set(bgImage.box, "display", "block");
    if (border && frameCss.size) {
      set(border.box, "display", "block");
      const img = border.content.querySelector("img");
      if (img && [...props("frame", true)].some((p) => p === "border" || /^border-(?:image|color|style|width|top|bottom|left|right)/.test(p))) set(img, "visibility", "hidden");
    }
    const paints = new Map([...parts].map(([role, p]) => [role, p.content]));
    const css2 = bindElementCss(paints, entry.elementCss ?? [], "card", appearance);
    const stopEffects = bindElementEffects(cell, paints, css2.effects);
    return () => {
      stopEffects();
      css2.dispose();
      style.restore();
    };
  }
  function scan() {
    var _a2, _b;
    frame = 0;
    if (disposed) return;
    const entries2 = read();
    const byId = new Map(entries2.map((e) => [e.id, e]));
    const seen = /* @__PURE__ */ new Set();
    const grids = Array.from(document.querySelectorAll(GRID)).filter((grid) => getComputedStyle(grid).getPropertyValue(SCOPE).trim() === token);
    for (const grid of grids) {
      let reported = false;
      for (const child of Array.from(grid.children)) {
        if (!(child instanceof HTMLElement)) continue;
        const parts = partsOf(child, contract), id2 = (_b = (_a2 = parts.get("key")) == null ? void 0 : _a2.content.textContent) == null ? void 0 : _b.trim();
        const entry = id2 ? byId.get(id2) : void 0;
        if (!entry) continue;
        if (!reported && onSize && child.clientWidth > 0 && child.clientHeight > 0) {
          const computed = getComputedStyle(child), layout = getComputedStyle(grid);
          const width = parseFloat(computed.width), height = parseFloat(computed.height);
          onSize({
            width: Number.isFinite(width) && width > 0 ? width : child.offsetWidth || child.clientWidth,
            height: Number.isFinite(height) && height > 0 ? height : child.offsetHeight || child.clientHeight,
            contentWidth: child.clientWidth,
            contentHeight: child.clientHeight,
            gridWidth: grid.clientWidth,
            gridHeight: grid.clientHeight,
            mode: layout.gridAutoFlow.startsWith("column") ? "horizontal" : grid.hasAttribute("data-visual-ui-scroll-container") ? "vertical" : "pagination"
          });
          reported = true;
        }
        seen.add(child);
        const key = JSON.stringify([entry, child.clientWidth, child.clientHeight, imageSource(parts.get("frame")), imageSource(parts.get("backgroundImage"))]);
        const existing = cells.get(child);
        if ((existing == null ? void 0 : existing.key) === key && parts.size === existing.parts.size && [...parts].every(([role, part]) => {
          var _a3;
          return ((_a3 = existing.parts.get(role)) == null ? void 0 : _a3.content) === part.content;
        })) continue;
        existing == null ? void 0 : existing.stop();
        existing == null ? void 0 : existing.resize.disconnect();
        const stop = configure(child, entry, parts), resize = new ResizeObserver(queue);
        resize.observe(child);
        cells.set(child, { key, parts, stop, resize });
      }
    }
    for (const [cell, state] of cells) if (!seen.has(cell)) {
      state.stop();
      state.resize.disconnect();
      cells.delete(cell);
    }
  }
  queue();
  return { css, refresh: queue, dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    mutation.disconnect();
    for (const state of cells.values()) {
      state.stop();
      state.resize.disconnect();
    }
    cells.clear();
  } };
}
function object$1(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function authoredNavigation(document2) {
  const found = [];
  const visit = (elements) => {
    if (!Array.isArray(elements)) return;
    for (const value of elements) {
      const element = object$1(value);
      if (element.refId === "achievement-list" && element.type === "data-list") found.push(element);
      else visit(element.children);
    }
  };
  visit(object$1(document2).elements);
  if (found.length !== 1) return void 0;
  const mode2 = object$1(found[0].props).navigationMode;
  return mode2 === "pagination" || mode2 === "scroll" ? mode2 : void 0;
}
function templateParts(document2) {
  var _a2;
  const root2 = object$1(document2);
  if (!Array.isArray(root2.elements)) throw Error("成就页缺少元素列表");
  const list2 = root2.elements.map(object$1).find((e) => e.refId === "achievement-list" && e.type === "data-list");
  if (!list2 || !Array.isArray(list2.children) || object$1(list2.props).layout !== "card") throw Error("需要顶层 achievement-list 卡片列表");
  const card = list2.children.map(object$1).find((e) => object$1(e.props).__dataListTemplateKind === "card");
  if (!card || !Array.isArray(card.children)) throw Error("请先在官方编辑器保存卡片模板");
  const result2 = [];
  for (const child of card.children.map(object$1)) {
    if (child.hidden === true) continue;
    if (child.type === "group" || child.visibleIf) throw Error("外观与尺寸参考需要直接位于卡片下的基础元素；分组或条件图层请使用原生自由模板");
    if (!["rect", "text", "image", "button", "line"].includes(String(child.type))) throw Error("卡片包含不支持的元素类型");
    const css = String(object$1(child.style).customCss || "");
    const role = ((_a2 = /(?:^|[;\n])\s*--achievement-card-role\s*:\s*([A-Za-z]+)\s*(?:;|$)/.exec(css)) == null ? void 0 : _a2[1]) || "";
    result2.push({ role, type: String(child.type), id: typeof child.id === "string" ? child.id : void 0 });
  }
  const roles = result2.map((p) => p.role).filter(Boolean);
  if (!roles.includes("key") || new Set(roles).size !== roles.length) throw Error("卡片数据标识缺失或元素角色重复");
  return result2;
}
function localTemplatePath(document2) {
  const match = /^@mixing-entropy\.achievement\/([A-Za-z0-9_-]+)$/.exec(document2);
  return match ? `ui/${match[1]}.json` : void 0;
}
const MARK = "--achievement-popup-part";
let sequence = 0;
function popupParts(document2) {
  const found = [];
  const object2 = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const roles = { "achievement-background": "background", "achievement-frame": "frame", "achievement-icon": "icon", "achievement-name": "name", "achievement-description": "description", "achievement-level": "level", "achievement-stage": "stageName" };
  const visit = (elements) => {
    if (!Array.isArray(elements)) return;
    for (const value of elements) {
      const element = object2(value);
      if (element.hidden || element.visibleIf) continue;
      if (element.type === "group") {
        visit(element.children);
        continue;
      }
      const refId = typeof element.refId === "string" ? element.refId : "";
      const elementId = typeof element.id === "string" ? element.id : void 0;
      const role = roles[refId] || (elementId ? `element:${elementId}` : "");
      const css = object2(element.style).customCss;
      if (refId && role && ["rect", "image", "text", "button", "line"].includes(String(element.type))) found.push({ role, refId, css: typeof css === "string" ? css : "", elementId });
    }
  };
  visit(object2(document2).elements);
  return found.filter((p) => found.filter((x2) => x2.role === p.role).length === 1);
}
function bindPopupAppearance(view, documentResource, read, resolve2) {
  var _a2;
  const contract = popupParts(documentResource), token = `popup-${++sequence}-${Date.now()}`;
  if (typeof document === "undefined" || !contract.length) return { refresh() {
  }, dispose() {
  } };
  for (const part of contract) (_a2 = view.get(part.refId)) == null ? void 0 : _a2.setStyle({ customCss: `${part.css}
${MARK}: ${token}-${part.role};` });
  let disposed = false, frame = 0, key = "", stop = () => {
  };
  let previous = /* @__PURE__ */ new Map();
  const queue = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(scan);
  };
  const mutations = new MutationObserver(queue);
  mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
  const resolveAsset = (asset) => {
    try {
      return asset ? resolve2(asset) : "";
    } catch {
      return "";
    }
  };
  function scan() {
    frame = 0;
    if (disposed) return;
    const item = read();
    if (!item) {
      stop();
      stop = () => {
      };
      key = "";
      previous.clear();
      return;
    }
    const parts = /* @__PURE__ */ new Map();
    const wanted = new Map(contract.map((p) => [`${token}-${p.role}`, p.role]));
    for (const node2 of document.querySelectorAll("div")) {
      const value = getComputedStyle(node2).getPropertyValue(MARK).trim(), role = wanted.get(value);
      if (!role || node2.parentElement && getComputedStyle(node2.parentElement).getPropertyValue(MARK).trim() === value) continue;
      const content = node2.firstElementChild;
      if (content instanceof HTMLElement && content.tagName === "DIV") parts.set(role, content);
    }
    const nextKey = JSON.stringify([item.id, item.stageId, item.appearance, item.elementCss]);
    if (key === nextKey && parts.size === previous.size && [...parts].every(([role, node2]) => previous.get(role) === node2)) return;
    stop();
    key = nextKey;
    previous = parts;
    const appearance = cardAppearance(item.appearance ?? {}), style = ownedStyles(), set = style.set;
    const border = parts.get("frame"), background = parts.get("background") ?? border;
    if (background && appearance.backgroundMode !== "template") {
      set(background, "background-color", appearance.backgroundColor || "transparent");
      set(background, "background-image", appearance.backgroundMode === "gradient" ? backgroundPaint(appearance) : "none");
      if (appearance.backgroundMode === "image") {
        const url = resolveAsset(appearance.backgroundImage);
        if (url) set(background, "background-image", cssUrl(url));
        set(background, "background-size", appearance.backgroundFit === "tile" ? "auto" : appearance.backgroundFit === "fill" ? "100% 100%" : appearance.backgroundFit);
        set(background, "background-repeat", appearance.backgroundFit === "tile" ? "repeat" : "no-repeat");
        set(background, "background-position", `${appearance.backgroundX}% ${appearance.backgroundY}%`);
      }
      const img = background.querySelector("img");
      if (img && background !== border) set(img, "visibility", "hidden");
    }
    if (border && appearance.frameMode !== "template") {
      const img = border.querySelector("img");
      if (img) set(img, "visibility", "hidden");
      set(border, "box-sizing", "border-box");
      for (const side of ["top", "right", "bottom", "left"]) {
        set(border, `border-${side}-width`, `${appearance.frameMode === "none" ? 0 : appearance.frameWidth}px`);
        set(border, `border-${side}-style`, appearance.frameMode === "none" ? "none" : "solid");
        set(border, `border-${side}-color`, appearance.frameColor || "currentColor");
      }
      set(border, "border-image-source", "none");
      if (appearance.frameMode !== "none") set(border, "border-radius", appearance.frameMode === "nineSlice" ? "0" : `${appearance.frameRadius}px`);
      if (appearance.frameMode === "nineSlice") {
        const url = resolveAsset(appearance.frameImage);
        if (url) {
          set(border, "border-image-source", cssUrl(url));
          set(border, "border-image-slice", `${appearance.sliceTop} ${appearance.sliceRight} ${appearance.sliceBottom} ${appearance.sliceLeft}`);
          set(border, "border-image-width", "1");
          set(border, "border-image-repeat", appearance.frameRepeat);
        }
      }
    }
    const surface = background ?? border ?? parts.get("icon");
    const cssParts = new Map(parts);
    for (const part of contract) if (part.elementId && parts.has(part.role)) cssParts.set(`element:${part.elementId}`, parts.get(part.role));
    if (!cssParts.has("background") && border) cssParts.set("background", border);
    const css = bindElementCss(cssParts, item.elementCss ?? [], "popup", appearance);
    const stopEffects = surface ? bindElementEffects(surface, parts, css.effects, false) : () => {
    };
    stop = () => {
      stopEffects();
      css.dispose();
      style.restore();
    };
  }
  queue();
  return { refresh: queue, dispose(restoreView = true) {
    var _a3;
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    mutations.disconnect();
    stop();
    previous.clear();
    if (restoreView) for (const part of contract) (_a3 = view.get(part.refId)) == null ? void 0 : _a3.setStyle({ customCss: part.css });
  } };
}
const object = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
const positive = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
function makeCardSizeReference(document2, page, size, measuredAt = Date.now()) {
  const elements = object(document2).elements;
  if (!Array.isArray(elements)) return;
  const lists = elements.map(object).filter((e) => e.refId === "achievement-list" && e.type === "data-list");
  if (lists.length !== 1) return;
  const list2 = lists[0], props = object(list2.props), rect = object(list2.rect);
  if (props.layout !== "card" || !Array.isArray(list2.children)) return;
  const template = list2.children.map(object).find((e) => object(e.props).__dataListTemplateKind === "card");
  const canvas = object(template == null ? void 0 : template.rect);
  if (![props.cols, props.rows, rect.w, rect.h, canvas.w, canvas.h, size.width, size.height, size.contentWidth, size.contentHeight, size.gridWidth, size.gridHeight].every(positive)) return;
  if (typeof props.gap !== "number" || !Number.isFinite(props.gap) || props.gap < 0) return;
  return {
    ...size,
    page,
    measuredAt,
    width: Math.max(1, Math.round(size.width)),
    height: Math.max(1, Math.round(size.height)),
    cols: props.cols,
    rows: props.rows,
    gap: props.gap,
    listWidth: rect.w,
    listHeight: rect.h,
    templateWidth: canvas.w,
    templateHeight: canvas.h
  };
}
function sizeReferenceKey(reference) {
  const { measuredAt: _time, ...geometry } = reference;
  return JSON.stringify(geometry);
}
const PAGE = "@mixing-entropy.achievement/achievements";
const POPUP = "@mixing-entropy.achievement/achievement-popup";
const runs = /* @__PURE__ */ new WeakMap();
function controller(ctx, sink) {
  const signal = ctx.flow.signal;
  let result2 = runs.get(signal);
  if (!result2) {
    result2 = new AchievementController(ctx, sink, signal);
    runs.set(signal, result2);
  }
  return result2;
}
class AchievementController {
  constructor(ctx, sink, signal) {
    this.ctx = ctx;
    this.sink = sink;
    this.signal = signal;
    this.latest = [];
    this.latestPopups = [];
    this.tail = Promise.resolve();
    this.cleanups = [];
    this.table = ctx.database.collection("states");
    this.notifications = new NotificationQueue((item, abort) => this.popup(item, abort), (error) => console.error("[成就] 浮现失败，阶段记录已保留", error));
    const refresh = () => {
      if (!signal.aborted) void this.refresh().catch((error) => console.error("[成就] 刷新失败", error));
    };
    this.cleanups.push(this.table.watch(refresh));
    this.cleanups.push(ctx.settings.subscribe("levels", refresh), ctx.settings.subscribe("achievements", refresh), ctx.settings.subscribe("displayStages", refresh), ctx.settings.subscribe("defaultStages", refresh), ctx.settings.subscribe("appearances", refresh), ctx.settings.subscribe("elementCss", refresh), ctx.settings.subscribe("stagePresentations", refresh), ctx.settings.subscribe("notifications", refresh), ctx.settings.subscribe("popup", refresh), ctx.settings.subscribe("durationMs", refresh));
    const dispose = () => {
      var _a2;
      this.notifications.stop();
      (_a2 = this.page) == null ? void 0 : _a2.close();
      this.cleanups.splice(0).forEach((fn) => fn());
    };
    if (signal.aborted) dispose();
    else signal.addEventListener("abort", dispose, { once: true });
  }
  assertLive() {
    if (this.signal.aborted || this.ctx.flow.signal !== this.signal) throw new AchievementError("RUN_ENDED", "本次游戏运行已结束");
  }
  serial(fn) {
    const task = this.tail.then(() => {
      this.assertLive();
      return fn();
    });
    this.tail = task.catch(() => void 0);
    return task;
  }
  definitions() {
    const levels = this.ctx.settings.get("levels") ?? [];
    return catalog(levels.length ? levels : DEFAULT_LEVELS, this.ctx.settings.get("achievements") ?? [], this.ctx.settings.get("displayStages") ?? [], this.ctx.settings.get("defaultStages") ?? [], this.ctx.settings.get("appearances") ?? [], this.ctx.settings.get("elementCss") ?? [], this.ctx.settings.get("stagePresentations") ?? []);
  }
  async read() {
    const definitions = this.definitions();
    const documents = await this.table.find();
    this.assertLive();
    const records = stageRecords(documents.map((row) => ({ id: row.achievementId, stageId: row.stageId })));
    return { definitions, documents, records };
  }
  publish(definitions, records) {
    var _a2, _b;
    this.assertLive();
    const prepare = (surface) => entries(definitions, records, surface).map((item) => {
      var _a3, _b2;
      return {
        ...item,
        icon: item.iconMode === "unknown" ? "extension-asset://mixing-entropy.achievement/assets/achievement-unknown.svg" : item.iconMode === "base" ? item.icon || "extension-asset://mixing-entropy.achievement/assets/achievement.svg" : item.icon,
        frame: ((_a3 = item.appearance) == null ? void 0 : _a3.frameMode) === "nineSlice" && item.appearance.frameImage ? item.appearance.frameImage : `extension-asset://mixing-entropy.achievement/assets/frame-${["bronze", "silver", "gold"].includes(item.levelId) ? item.levelId : "neutral"}.svg`,
        cardBackground: ((_b2 = item.appearance) == null ? void 0 : _b2.backgroundMode) === "image" && item.appearance.backgroundImage ? item.appearance.backgroundImage : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E'
      };
    });
    const result2 = prepare("card");
    this.latest = result2;
    this.latestPopups = prepare("popup");
    this.sink.set("entries", result2);
    (_a2 = this.updatePopup) == null ? void 0 : _a2.call(this, this.latestPopups);
    (_b = this.cardLayout) == null ? void 0 : _b.refresh();
    return result2;
  }
  refresh() {
    return this.serial(async () => {
      const { definitions, records } = await this.read();
      this.publish(definitions, records);
    });
  }
  readInfo(id2, field) {
    return this.serial(async () => {
      const { definitions, records } = await this.read();
      return readInfo(definitions, records, id2, field);
    });
  }
  async write(documents, record) {
    const existing = documents.find((row) => row.achievementId === record.id);
    const fields = { stageId: record.stageId };
    this.assertLive();
    if (existing) {
      const written = await this.table.updateOne({ id: existing.id }, { $set: fields });
      if (written.matchedCount !== 1) throw new AchievementError("WRITE_CONFLICT", "成就记录已变化，请重新操作");
    } else await this.table.insertOne({ achievementId: record.id, ...fields });
    this.assertLive();
  }
  setStage(id2, target, expected = "", notify = false) {
    return this.serial(async () => {
      var _a2;
      if (typeof expected !== "string" || typeof notify !== "boolean") throw new AchievementError("INVALID_DATA", "阶段方法参数无效");
      const { definitions, documents, records } = await this.read();
      if (this.ctx.flow.isRestoring) {
        this.publish(definitions, records);
        return false;
      }
      const change = setDisplayStage(definitions, records, id2, target, expected);
      if (!change.matched) return false;
      if (change.changed || !((_a2 = records.find((r) => r.id === id2)) == null ? void 0 : _a2.stageId)) await this.write(documents, change.records.find((r) => r.id === id2));
      this.publish(definitions, change.records);
      if (change.changed && notify && this.ctx.settings.get("notifications") !== false && this.latestPopups.some((r) => r.id === id2)) this.notifications.enqueue({ id: id2, stageId: target });
      return true;
    });
  }
  getStage(id2) {
    return this.serial(async () => {
      const { definitions, records } = await this.read();
      return currentStage(definitions, records, id2);
    });
  }
  async openPage() {
    await this.refresh();
    this.assertLive();
    if (this.page) return;
    const name = this.document("page", PAGE);
    const document2 = await this.authoredPage(name);
    this.assertLive();
    const page = await this.ctx.visualUI.open(name, { modal: true });
    if (this.signal.aborted) {
      page.close();
      return;
    }
    this.page = page;
    let template = [];
    if (document2) {
      try {
        template = templateParts(document2);
      } catch (error) {
        console.warn("[成就] 卡片外观与尺寸参考未接入，保留原生模板：", error);
      }
    }
    let sizeKey = "", sizeTimer;
    const cardLayout = bindCardLayout(() => this.latest, template, (size) => {
      const reference = makeCardSizeReference(document2, name, size);
      if (!reference || sizeReferenceKey(reference) === sizeKey) return;
      sizeKey = sizeReferenceKey(reference);
      clearTimeout(sizeTimer);
      sizeTimer = setTimeout(() => {
        if (this.signal.aborted || this.page !== page) return;
        try {
          this.ctx.settings.set("cardSizeReference", [reference]);
        } catch (error) {
          console.warn("[成就] 尺寸参考保存失败，页面仍可正常使用：", error);
        }
      }, 250);
    });
    this.cardLayout = cardLayout;
    const stopBrowsing = bindBrowseMode(page, {
      read: () => this.sink.get("browseMode"),
      write: (mode2) => {
        this.assertLive();
        this.sink.set("browseMode", mode2);
      }
    }, {
      authoredMode: authoredNavigation(document2),
      scrollDirection: this.ctx.settings.get("scrollDirection"),
      allowPlayerSwitch: this.ctx.settings.get("allowPlayerSwitch"),
      allowPagination: this.ctx.settings.get("allowPagination"),
      allowVertical: this.ctx.settings.get("allowVertical"),
      allowHorizontal: this.ctx.settings.get("allowHorizontal")
    }, createHorizontalCards(page.get("achievement-list"), cardLayout.css));
    page.onClose(() => {
      clearTimeout(sizeTimer);
      cardLayout.dispose();
      stopBrowsing();
      if (this.cardLayout === cardLayout) this.cardLayout = void 0;
      if (this.page === page) this.page = void 0;
    });
  }
  async authoredPage(name) {
    const path = localTemplatePath(name);
    if (!path || !this.ctx.extensionResource) return void 0;
    try {
      const response = await fetch(this.ctx.extensionResource.url(path), { signal: AbortSignal.any([this.signal, AbortSignal.timeout(3e3)]), cache: "no-store" });
      if (!response.ok) throw Error(`模板资源读取失败：${response.status}`);
      return await response.json();
    } catch (error) {
      if (!this.signal.aborted) console.warn("[成就] 无法读取页面配置，保留官方页面原有编排和浏览方式：", error);
      return void 0;
    }
  }
  document(key, fallback, override = "") {
    let value = (override || this.ctx.settings.get(key) || fallback).replace(/^ui:/, "");
    if (value.includes("/") && !value.startsWith("@")) value = "@" + value;
    if (!/^(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(value)) throw new AchievementError("INVALID_UI", `${key} 需要可视化界面的文件名或 @扩展编号/文件名`);
    return value;
  }
  async popup(request, abort) {
    var _a2, _b;
    if (abort.aborted || this.signal.aborted) return;
    await this.refresh();
    const eligible = (list2) => this.ctx.settings.get("notifications") === false ? void 0 : list2.find((row) => row.id === request.id && row.stageId === request.stageId);
    if (abort.aborted || !eligible(this.latestPopups) || this.ctx.settings.get("notifications") === false) return;
    const name = this.document("popup", POPUP, (_a2 = eligible(this.latestPopups)) == null ? void 0 : _a2.popupUI);
    const requestedDuration = ((_b = eligible(this.latestPopups)) == null ? void 0 : _b.popupDurationMs) || this.ctx.settings.get("durationMs");
    const popupDocument = await this.authoredPage(name);
    if (abort.aborted || this.signal.aborted || !eligible(this.latestPopups)) return;
    let appearance;
    let appearanceView;
    const bind = (view2) => {
      var _a3, _b2, _c, _d, _e, _f;
      const item = eligible(this.latestPopups);
      if (!item) return;
      (_a3 = view2.get("achievement-label")) == null ? void 0 : _a3.setProps({ text: "成就展示已更新" });
      (_b2 = view2.get("achievement-name")) == null ? void 0 : _b2.setProps({ text: item.name });
      (_c = view2.get("achievement-description")) == null ? void 0 : _c.setProps({ text: item.description });
      (_d = view2.get("achievement-level")) == null ? void 0 : _d.setProps({ text: item.levelName });
      (_e = view2.get("achievement-stage")) == null ? void 0 : _e.setProps({ text: item.stageName });
      (_f = view2.get("achievement-icon")) == null ? void 0 : _f.setProps({ asset: item.icon });
      if (appearanceView !== view2) {
        appearance == null ? void 0 : appearance.dispose();
        appearanceView = view2;
        appearance = bindPopupAppearance(view2, popupDocument, () => eligible(this.latestPopups), (asset) => this.ctx.asset.resolve(asset).url);
      } else appearance == null ? void 0 : appearance.refresh();
    };
    const detach = this.ctx.visualUI.onOpen(name, bind);
    let view;
    let detachClose = () => {
    };
    let resolveClosed = () => {
    };
    let closed = false;
    const timerAbort = new AbortController();
    const closedPromise = new Promise((resolve2) => {
      resolveClosed = resolve2;
    });
    const end = () => resolveClosed();
    let suppressed = false;
    const update = (list2) => {
      var _a3, _b2;
      if (!eligible(list2) || this.document("popup", POPUP, (_a3 = eligible(list2)) == null ? void 0 : _a3.popupUI) !== name || (((_b2 = eligible(list2)) == null ? void 0 : _b2.popupDurationMs) || this.ctx.settings.get("durationMs")) !== requestedDuration) {
        suppressed = true;
        view == null ? void 0 : view.close();
        end();
      } else if (view && !suppressed) bind(view);
    };
    this.updatePopup = update;
    abort.addEventListener("abort", end, { once: true });
    try {
      view = await this.ctx.visualUI.open(name, { modal: false, interactable: false, pointerEventsPassthrough: true });
      if (abort.aborted || this.signal.aborted || suppressed || !eligible(this.latestPopups)) return;
      bind(view);
      detachClose = view.onClose(() => {
        closed = true;
        resolveClosed();
      });
      const configured = requestedDuration;
      const duration = typeof configured === "number" && Number.isFinite(configured) ? Math.max(300, Math.min(6e4, configured)) : 3e3;
      await Promise.race([delay(duration, timerAbort.signal), closedPromise]);
      if (!closed) view.close();
      if (!abort.aborted) await closedPromise;
    } finally {
      appearance == null ? void 0 : appearance.dispose(false);
      timerAbort.abort();
      if (this.updatePopup === update) this.updatePopup = void 0;
      detach();
      detachClose();
      abort.removeEventListener("abort", end);
      if (!closed) view == null ? void 0 : view.close();
    }
  }
}
const appearanceFields = (i) => ({
  backgroundMode: i.enum("背景方式", ["template", "color", "image", "gradient"]).default("template"),
  backgroundColor: i.color("背景颜色").default(""),
  backgroundImage: i.asset("背景图片").accepts("image"),
  backgroundFit: i.enum("背景图片适配", ["cover", "contain", "fill", "tile"]).default("cover"),
  backgroundColorEnd: i.color("渐变终点颜色").default(""),
  backgroundAngle: i.number("渐变角度").default(135).range(0, 360),
  backgroundX: i.number("图片横向焦点（%）").default(50).range(0, 100),
  backgroundY: i.number("图片纵向焦点（%）").default(50).range(0, 100),
  frameMode: i.enum("边框方式", ["template", "none", "line", "nineSlice"]).default("template"),
  frameImage: i.asset("边框图片").accepts("image"),
  frameColor: i.color("边框颜色").default(""),
  frameWidth: i.number("边框显示厚度").default(3).range(0, 256),
  frameRadius: i.number("线框圆角").default(12).range(0, 256),
  sliceTop: i.number("原图上切线").default(16).range(0, 4096),
  sliceRight: i.number("原图右切线").default(16).range(0, 4096),
  sliceBottom: i.number("原图下切线").default(16).range(0, 4096),
  sliceLeft: i.number("原图左切线").default(16).range(0, 4096),
  frameRepeat: i.enum("九宫格边缘适配", ["stretch", "repeat", "round"]).default("stretch"),
  iconEffect: i.enum("图标动效", ["none", "float", "rotate", "pulse"]).default("none"),
  frameEffect: i.enum("边框动效", ["none", "pulse", "glow"]).default("none"),
  effectTrigger: i.enum("动效播放方式", ["loop", "enter", "hover"]).default("loop"),
  effectDuration: i.number("一轮动效时长（毫秒）").default(1800).range(200, 6e4)
});
const stageFields = (i) => ({
  ...appearanceFields(i),
  appearanceSource: i.enum("外观配置", ["local", "preset", "level", "default"]).default("local"),
  appearanceId: i.string("共用外观编号").default(""),
  overrideBackground: i.boolean("单独配置背景").default(false),
  overrideFrame: i.boolean("单独配置边框").default(false),
  overrideEffects: i.boolean("单独配置动效").default(false),
  id: i.string("阶段编号"),
  name: i.string("阶段名称"),
  visible: i.boolean("显示卡片与浮现").default(true),
  nameMode: i.enum("名称显示方式", ["base", "custom", "none"]).labels({ base: "使用成就基础配置", custom: "本阶段自定义", none: "不显示" }).default("none").describe("使用成就基础配置时，读取上方成就配置中的名称，不继承上一阶段。"),
  displayName: i.string("阶段显示名称").default(""),
  descriptionMode: i.enum("说明显示方式", ["base", "custom", "none"]).labels({ base: "使用成就基础配置", custom: "本阶段自定义", none: "不显示" }).default("none").describe("使用成就基础配置时，读取上方成就配置中的说明，不继承上一阶段。"),
  description: i.string("阶段说明").default("").multiline(),
  iconMode: i.enum("图标显示方式", ["base", "custom", "unknown", "none"]).labels({ base: "使用成就基础配置", custom: "本阶段自定义", unknown: "默认未知图标", none: "不显示" }).default("none").describe("使用成就基础配置时，读取上方成就配置中的图标，不继承上一阶段。"),
  icon: i.asset("阶段图标").accepts("image"),
  levelMode: i.enum("本阶段等级", ["base", "custom"]).labels({ base: "使用成就基础等级", custom: "指定本阶段等级" }).default("base"),
  levelId: i.string("阶段等级编号").default(""),
  showLevel: i.boolean("展示等级").default(false),
  showStageName: i.boolean("向玩家显示阶段名称").default(false)
});
const viewSave = defineSave({
  entries: { type: "list", persistence: "session", default: [], label: "成就界面数据（自动重建）" },
  browseMode: { type: "string", persistence: "shared", default: "", label: "成就浏览选择" }
});
_AchievementExtension_decorators = [extension({ id: "main", label: "成就", exposeUI: false })];
let _AchievementExtension = class _AchievementExtension extends (_a = Extension.withSave(viewSave)) {
};
_init = __decoratorStart(_a);
_AchievementExtension = __decorateElement(_init, 0, "AchievementExtension", _AchievementExtension_decorators, _AchievementExtension);
_AchievementExtension.settings = settings((s) => ({
  stagePresentations: s.array("阶段表现", (i) => ({
    achievementId: i.string("成就编号；空值为默认阶段").default(""),
    stageId: i.string("阶段编号"),
    surface: i.enum("使用位置", ["card", "popup"]),
    mode: i.enum("配置方式", ["custom", "inherit"]).default("custom"),
    enabled: i.boolean("启用").default(true),
    contentOverride: i.boolean("单独设置本处内容").default(true),
    nameMode: i.enum("名称显示方式", ["stage", "custom", "none"]).default("stage"),
    displayName: i.string("显示名称").default(""),
    descriptionMode: i.enum("说明显示方式", ["stage", "custom", "none"]).default("stage"),
    description: i.string("说明").default("").multiline(),
    iconMode: i.enum("图标显示方式", ["stage", "custom", "none", "unknown"]).default("stage"),
    icon: i.asset("图标").accepts("image"),
    showLevel: i.boolean("显示等级").default(false),
    showStageName: i.boolean("显示阶段名称").default(false),
    ui: i.string("浮现界面；空值沿用全局").default(""),
    durationMs: i.number("时长；0沿用全局").default(0).range(0, 6e4),
    ...appearanceFields(i),
    appearanceSource: i.enum("外观配置", ["local", "preset", "level", "default"]).default("local"),
    appearanceId: i.string("共用外观编号").default(""),
    overrideBackground: i.boolean("单独配置背景").default(false),
    overrideFrame: i.boolean("单独配置边框").default(false),
    overrideEffects: i.boolean("单独配置动效").default(false)
  })).maxItems(1e4).describe("按成就、阶段、卡片或浮现分别保存；由阶段表现编辑器维护。"),
  elementCss: s.array("元素进阶 CSS", (i) => ({
    id: i.string("配置编号"),
    ownerKind: i.enum("所属类型", ["appearance", "defaultStage", "stage"]),
    ownerId: i.string("外观或阶段编号"),
    achievementId: i.string("成就编号").default(""),
    target: i.string("元素"),
    surface: i.enum("使用位置", ["both", "card", "popup"]).default("both"),
    css: i.string("CSS").default("").multiline(),
    replace: i.boolean("替换上级 CSS").default(false)
  })).maxItems(1e4).describe("由共用外观与阶段的元素进阶 CSS 编辑器维护，按元素与使用位置保存。"),
  appearances: s.array("通用表现方案", (i) => ({
    id: i.string("方案编号"),
    name: i.string("方案名称"),
    surface: i.enum("使用位置", ["card", "popup"]).default("card"),
    isDefault: i.boolean("本组默认方案").default(false),
    nameMode: i.enum("名称", ["stage", "none"]).default("stage"),
    descriptionMode: i.enum("说明", ["stage", "none"]).default("stage"),
    iconMode: i.enum("图标", ["stage", "none", "unknown"]).default("stage"),
    levelVisibility: i.enum("等级显示", ["stage", "show", "hide"]).default("stage"),
    stageNameVisibility: i.enum("阶段名显示", ["stage", "show", "hide"]).default("stage"),
    ui: i.string("浮现界面").default(""),
    durationMs: i.number("浮现时长").default(0).range(0, 6e4),
    ...appearanceFields(i)
  })).maxItems(1e4).table({ titleField: "name", columns: ["id"] }),
  levels: s.array("等级", (i) => ({ id: i.string("等级编号"), name: i.string("等级名称"), appearanceId: i.string("通用卡片方案编号").default(""), popupAppearanceId: i.string("通用浮现方案编号").default("") })).addLabel("添加等级").emptyHint("未配置时使用 bronze 铜、silver 银、gold 金。").maxItems(1e4).table({ titleField: "name", columns: ["id"] }),
  achievements: s.array("成就", (i) => ({
    id: i.string("成就编号").describe("唯一且长期稳定，例如 first_step；改名时保留此编号。"),
    name: i.string("名称"),
    description: i.string("说明").default("").multiline().describe("可留空，最多 1000 字符。例如：故事从此时开始。卡片与浮现共用此内容；可在各自 UI 中隐藏或自由排版。"),
    icon: i.asset("图标").accepts("image"),
    levelId: i.string("等级编号").default("bronze"),
    initialStageId: i.string("初始展示阶段编号").default("unknown").describe("在此成就下方的“展示阶段”选择。尚无记录时使用，默认未激活；之后由方法块切换。")
  })).addLabel("添加成就").emptyHint("添加第一个成就。").maxItems(1e4).table({ titleField: "name", imageField: "icon", columns: ["id", "levelId"] }),
  defaultStages: s.array("默认阶段配置", stageFields).maxItems(1e4).table({ titleField: "name", columns: ["id"] }).emptyHint("未配置时使用隐藏、未激活、已激活三个默认阶段。"),
  displayStages: s.array("成就专用阶段配置", (i) => ({
    achievementId: i.string("成就编号"),
    ...stageFields(i),
    disabled: i.boolean("此成就不使用该阶段").default(false)
  })).maxItems(1e4).table({ titleField: "name", columns: ["achievementId", "id"] }),
  page: s.uiRef("成就页").default("ui:" + PAGE).describe("可视化界面引用：项目界面文件名，或 @扩展编号/文件名。"),
  cardSizeReference: s.array("最近卡片尺寸参考（自动测量）", (i) => ({
    page: i.string("页面"),
    mode: i.string("浏览方式"),
    measuredAt: i.number("测量时间"),
    width: i.number("建议画布宽度"),
    height: i.number("建议画布高度"),
    contentWidth: i.number("内容宽度"),
    contentHeight: i.number("内容高度"),
    gridWidth: i.number("网格宽度"),
    gridHeight: i.number("网格高度"),
    cols: i.number("列数"),
    rows: i.number("行数"),
    gap: i.number("间距"),
    listWidth: i.number("列表宽度"),
    listHeight: i.number("列表高度"),
    templateWidth: i.number("原画布宽度"),
    templateHeight: i.number("原画布高度")
  })).maxItems(1).describe("预览自动生成的尺寸参考；不用于控制页面或卡片尺寸。"),
  scrollDirection: s.enum("滚动方向", ["vertical", "horizontal"]).labels({ vertical: "从上到下", horizontal: "从左到右" }).default("vertical").describe("仅当官方成就列表开启“滚动模式”时决定默认方向；不会把翻页改成滚动。"),
  allowPlayerSwitch: s.boolean("允许玩家切换浏览方式").default(false).describe("关闭时始终使用官方页面的默认方式并隐藏切换按钮；开启后可额外开放其他方式。"),
  allowPagination: s.boolean("额外开放翻页").default(false).enabledWhen("allowPlayerSwitch", true),
  allowVertical: s.boolean("额外开放纵向滚动").default(false).enabledWhen("allowPlayerSwitch", true),
  allowHorizontal: s.boolean("额外开放横向滚动").default(false).enabledWhen("allowPlayerSwitch", true),
  popup: s.uiRef("默认浮现界面").default("ui:" + POPUP).describe("可编辑默认浮现界面，或填写自己的可视化界面引用。"),
  notifications: s.boolean("允许播放阶段浮现").default(true),
  durationMs: s.number("默认浮现时长（毫秒）").default(3e3).range(300, 6e4).step(100)
}));
_AchievementExtension.changeStage = _AchievementExtension.method({
  id: "change-stage",
  title: "成就操作",
  description: "先选成就，再选择目标展示阶段。可选预期当前阶段与浮现；相同阶段不重复通知，通常自动刷新。",
  schema: {
    achievementId: { type: "string", label: "成就", required: true },
    stageId: { type: "string", label: "目标展示阶段", required: true },
    notify: { type: "boolean", label: "切换时浮现", default: true },
    expectedStageId: { type: "string", label: "仅在此阶段执行（留空不限制）", default: "" }
  },
  async run(ctx, p) {
    await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, p.notify);
  },
  async skip(ctx, p) {
    await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, false);
  },
  async runImmediately(ctx, p) {
    await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, false);
  }
});
_AchievementExtension.stageInfo = _AchievementExtension.method({
  id: "stage-info",
  title: "读取成就信息",
  description: "读取当前展示阶段或其等级；统一返回文本。阶段名称与金银铜名称不产生额外状态判断。",
  returns: { type: "string", label: "所选信息（文本）" },
  schema: {
    achievementId: { type: "string", label: "成就", required: true },
    field: { type: "enum", label: "读取什么", default: "stageId", options: [{ value: "stageId", label: "当前阶段编号" }, { value: "stageName", label: "当前阶段名称" }, { value: "levelId", label: "当前等级编号" }, { value: "levelName", label: "当前等级名称" }] }
  },
  async run(ctx, p) {
    return controller(ctx, this.save).readInfo(p.achievementId, p.field);
  }
});
_AchievementExtension.openPage = _AchievementExtension.method({
  id: "open-page",
  title: "打开成就页",
  description: "重建界面数据，然后打开作者选择的成就页。",
  async run(ctx) {
    await controller(ctx, this.save).openPage();
  },
  async skip(ctx) {
    await controller(ctx, this.save).refresh();
  }
});
_AchievementExtension.refresh = _AchievementExtension.method({
  id: "refresh",
  title: "刷新成就界面数据",
  description: "通常会自动刷新：切换阶段和打开成就页时都会更新界面数据。仅在自制界面需要主动更新时调用；不会改变成就状态。",
  async run(ctx) {
    await controller(ctx, this.save).refresh();
  }
});
__runInitializers(_init, 1, _AchievementExtension);
let AchievementExtension = _AchievementExtension;
export {
  AchievementExtension as default
};
//# sourceMappingURL=index.mjs.map
