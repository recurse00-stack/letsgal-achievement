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
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
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
class AchievementError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "AchievementError";
  }
}
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AchievementError("INVALID_DATA", "需要结构化对象");
  return value;
}
function text(value, label, empty = false) {
  if (typeof value !== "string" || !empty && !value.trim() || value.length > 1e3) throw new AchievementError("INVALID_DATA", `${label}无效`);
  return value;
}
function id(value) {
  const result = text(value, "编号");
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(result)) throw new AchievementError("INVALID_ID", "编号使用字母、数字、点、横线或下划线，最长 128 个字符");
  return result;
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
function catalog(levelValues, achievementValues) {
  const levels = unique(rows(levelValues).map((value) => {
    const row = object(value);
    return { id: id(row.id), name: text(row.name, "等级名称") };
  }), "等级");
  const achievements = unique(rows(achievementValues).map((value) => {
    const row = object(value);
    const achievement = { id: id(row.id), name: text(row.name, "成就名称"), icon: text(row.icon ?? "", "图标", true), levelId: id(row.levelId) };
    if (!levels.some((level) => level.id === achievement.levelId)) throw new AchievementError("LEVEL_NOT_FOUND", `成就 ${achievement.id} 的等级不存在`);
    return achievement;
  }), "成就");
  return { levels, achievements };
}
function activations(value) {
  return unique(rows(value).map((value2) => {
    const row = object(value2);
    if (typeof row.active !== "boolean") throw new AchievementError("INVALID_DATA", "激活状态必须为布尔值");
    return { id: id(row.id), active: row.active };
  }), "激活记录");
}
function entries(definitions, records) {
  const active = new Map(records.map((row) => [row.id, row.active]));
  const names = new Map(definitions.levels.map((level) => [level.id, level.name]));
  return definitions.achievements.map((row) => ({ ...row, levelName: names.get(row.levelId), active: active.get(row.id) ?? false, status: active.get(row.id) ? "已激活" : "未激活" }));
}
function setActivation(definitions, records, achievementId, active) {
  var _a2;
  if (typeof active !== "boolean") throw new AchievementError("INVALID_DATA", "激活状态必须为布尔值");
  const item = definitions.achievements.find((row) => row.id === achievementId);
  if (!item) throw new AchievementError("NOT_FOUND", `找不到成就：${achievementId}`);
  const previous = ((_a2 = records.find((row) => row.id === achievementId)) == null ? void 0 : _a2.active) ?? false;
  if (previous === active) return { changed: false, activated: false, records: records.map((row) => ({ ...row })) };
  const next = records.filter((row) => row.id !== achievementId).map((row) => ({ ...row }));
  next.push({ id: achievementId, active });
  return { changed: true, activated: active, records: next };
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
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}
const BROWSE_MODES = ["pagination", "scroll", "horizontal"];
const BROWSE_LABELS = { pagination: "翻页", scroll: "纵向滚动", horizontal: "横向滚动" };
function browseChoices(options) {
  if (options.policy !== "player") return [options.policy === "scroll" || options.policy === "horizontal" ? options.policy : "pagination"];
  const allowed = BROWSE_MODES.filter((mode) => mode === "pagination" ? options.allowPagination !== false : mode === "scroll" ? options.allowVertical !== false : options.allowHorizontal === true);
  return allowed.length ? allowed : ["pagination"];
}
function bindBrowseMode(view, preference, options = {}, horizontal) {
  const list = view.get("achievement-list");
  if (!list) {
    horizontal == null ? void 0 : horizontal.dispose();
    return () => {
    };
  }
  const choices = browseChoices(options);
  const playerChoice = options.policy === "player" && choices.length > 1;
  const fallback = choices.includes(options.defaultMode) ? options.defaultMode : choices[0];
  const saved = playerChoice ? preference.read() : void 0;
  let mode = playerChoice && choices.includes(saved) ? saved : fallback;
  const buttons = BROWSE_MODES.map((key) => ({ key, handle: view.get("achievement-mode-" + key) }));
  let live = true;
  const render = () => {
    list.setProps({ navigationMode: mode === "horizontal" ? "scroll" : mode });
    horizontal == null ? void 0 : horizontal.setEnabled(mode === "horizontal");
    for (const { key, handle } of buttons) {
      handle == null ? void 0 : handle.setHidden(!playerChoice || !choices.includes(key));
      handle == null ? void 0 : handle.setProps({ text: BROWSE_LABELS[key] + (key === mode ? " ✓" : "") });
    }
  };
  const detach = buttons.filter(({ key }) => playerChoice && choices.includes(key)).map(({ key, handle }) => handle == null ? void 0 : handle.on("click", () => {
    if (!live || mode === key) return;
    preference.write(key);
    mode = key;
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
const GRID = '[data-visual-ui-scroll-container="true"]';
const MARKER = "--achievement-layout-instance";
let sequence = 0;
function horizontalCss(token, cols, rows2, gap) {
  return `${MARKER}: ${token};
& ${GRID} {
  grid-auto-flow: column !important;
  grid-template-columns: none !important;
  grid-template-rows: repeat(${rows2}, minmax(0, 1fr)) !important;
  grid-auto-rows: auto !important;
  grid-auto-columns: calc((100% - ${gap * (cols - 1)}px) / ${cols}) !important;
  overflow-x: auto !important; overflow-y: hidden !important;
  scrollbar-width: thin !important; scrollbar-color: #a89779 #202833;
  overscroll-behavior: contain; touch-action: pan-x;
}
& ${GRID}::-webkit-scrollbar { display: block !important; height: 12px; }
& ${GRID}::-webkit-scrollbar-thumb { background: #a89779; border-radius: 6px; }
& ${GRID}::-webkit-scrollbar-track { background: #202833; }
& ${GRID} ~ * { display: none !important; }`;
}
function wheelDistance(x, y, unit, width) {
  return (Math.abs(x) >= Math.abs(y) ? x : y) * (unit === 1 ? 16 : unit === 2 ? width : 1);
}
function createHorizontalCards(layout) {
  const token = `achievement-${Date.now()}-${++sequence}`;
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
    layout == null ? void 0 : layout.setStyle({ customCss: "" });
    console.error("[成就] 横向卡片布局未接入：" + message + "。当前保留原生纵向列表。");
  };
  const attach = () => {
    var _a2;
    if (disposed || !enabled) return;
    const candidates = Array.from(document.querySelectorAll(GRID)).filter((node) => getComputedStyle(node).getPropertyValue(MARKER).trim() === token);
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
    layout.setStyle({ customCss: horizontalCss(token, Number(cols), rows2, parseFloat(original.columnGap) || 0) });
  };
  return {
    setEnabled(next) {
      if (disposed || enabled === next) return;
      enabled = next;
      clear();
      if (!next) {
        layout == null ? void 0 : layout.setStyle({ customCss: "" });
        return;
      }
      if (!layout) {
        fail("缺少 achievement-list 卡片列表");
        return;
      }
      owned = true;
      layout.setStyle({ customCss: marker });
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
const PAGE = "@mixing-entropy.achievement/achievements";
const POPUP = "@mixing-entropy.achievement/achievement-popup";
const runs = /* @__PURE__ */ new WeakMap();
function controller(ctx, sink) {
  const signal = ctx.flow.signal;
  let result = runs.get(signal);
  if (!result) {
    result = new AchievementController(ctx, sink, signal);
    runs.set(signal, result);
  }
  return result;
}
class AchievementController {
  constructor(ctx, sink, signal) {
    this.ctx = ctx;
    this.sink = sink;
    this.signal = signal;
    this.tail = Promise.resolve();
    this.cleanups = [];
    this.table = ctx.database.collection("states");
    this.notifications = new NotificationQueue((item, abort) => this.popup(item, abort), (error) => console.error("[成就] 浮现失败，激活记录已保留", error));
    const refresh = () => {
      if (!signal.aborted) void this.refresh().catch((error) => console.error("[成就] 刷新失败", error));
    };
    this.cleanups.push(this.table.watch(refresh));
    this.cleanups.push(ctx.settings.subscribe("levels", refresh), ctx.settings.subscribe("achievements", refresh));
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
    return catalog(levels.length ? levels : DEFAULT_LEVELS, this.ctx.settings.get("achievements") ?? []);
  }
  async read() {
    const definitions = this.definitions();
    const documents = await this.table.find();
    this.assertLive();
    const records = activations(documents.map((row) => ({ id: row.achievementId, active: row.active })));
    return { definitions, documents, records };
  }
  publish(definitions, records) {
    this.assertLive();
    const result = entries(definitions, records).map((item) => ({ ...item, icon: item.icon || "extension-asset://mixing-entropy.achievement/assets/achievement.svg", frame: `extension-asset://mixing-entropy.achievement/assets/frame-${["bronze", "silver", "gold"].includes(item.levelId) ? item.levelId : "neutral"}.svg` }));
    this.sink.set("entries", result);
    return result;
  }
  refresh() {
    return this.serial(async () => {
      const { definitions, records } = await this.read();
      this.publish(definitions, records);
    });
  }
  set(id2, active, notify) {
    return this.serial(async () => {
      const { definitions, documents, records } = await this.read();
      if (this.ctx.flow.isRestoring) {
        this.publish(definitions, records);
        return;
      }
      const change = setActivation(definitions, records, id2, active);
      if (change.changed) {
        const existing = documents.find((row) => row.achievementId === id2);
        this.assertLive();
        if (existing) {
          const written = await this.table.updateOne({ id: existing.id }, { $set: { active } });
          if (written.matchedCount !== 1) throw new AchievementError("WRITE_CONFLICT", "激活记录已变化，请重新操作");
        } else await this.table.insertOne({ achievementId: id2, active });
        this.assertLive();
      }
      const list = this.publish(definitions, change.records);
      if (change.activated && notify && this.ctx.settings.get("notifications") !== false) this.notifications.enqueue(list.find((row) => row.id === id2));
    });
  }
  isActive(id2) {
    return this.serial(async () => {
      var _a2;
      const { definitions, records } = await this.read();
      if (!definitions.achievements.some((row) => row.id === id2)) throw new AchievementError("NOT_FOUND", `找不到成就：${id2}`);
      return ((_a2 = records.find((row) => row.id === id2)) == null ? void 0 : _a2.active) ?? false;
    });
  }
  async openPage() {
    await this.refresh();
    this.assertLive();
    if (this.page) return;
    const page = await this.ctx.visualUI.open(this.document("page", PAGE), { modal: true });
    if (this.signal.aborted) {
      page.close();
      return;
    }
    this.page = page;
    const stopBrowsing = bindBrowseMode(page, {
      read: () => this.sink.get("browseMode"),
      write: (mode) => {
        this.assertLive();
        this.sink.set("browseMode", mode);
      }
    }, {
      policy: this.ctx.settings.get("browsePolicy"),
      defaultMode: this.ctx.settings.get("browseDefault"),
      allowPagination: this.ctx.settings.get("allowPagination"),
      allowVertical: this.ctx.settings.get("allowVertical"),
      allowHorizontal: this.ctx.settings.get("allowHorizontal")
    }, createHorizontalCards(page.get("achievement-list")));
    page.onClose(() => {
      stopBrowsing();
      if (this.page === page) this.page = void 0;
    });
  }
  document(key, fallback) {
    const value = (this.ctx.settings.get(key) || fallback).replace(/^ui:/, "");
    if (!/^(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_-]+$/.test(value)) throw new AchievementError("INVALID_UI", `${key} 需要可视化界面的文件名或 @扩展编号/文件名`);
    return value;
  }
  async popup(item, abort) {
    if (abort.aborted || this.signal.aborted) return;
    const name = this.document("popup", POPUP);
    const bind = (view2) => {
      var _a2, _b, _c, _d, _e;
      (_a2 = view2.get("achievement-frame")) == null ? void 0 : _a2.setStyle({ borderColor: { bronze: "#b38a55", silver: "#b9c2cc", gold: "#d4b04c" }[item.levelId] ?? "#697888" });
      (_b = view2.get("achievement-name")) == null ? void 0 : _b.setProps({ text: item.name });
      (_c = view2.get("achievement-level")) == null ? void 0 : _c.setProps({ text: item.levelName });
      (_d = view2.get("achievement-icon")) == null ? void 0 : _d.setProps({ asset: item.icon });
      (_e = view2.get("achievement-icon")) == null ? void 0 : _e.setHidden(!item.icon);
    };
    const detach = this.ctx.visualUI.onOpen(name, bind);
    let view;
    let detachClose = () => {
    };
    let resolveClosed = () => {
    };
    let closed = false;
    const closedPromise = new Promise((resolve) => {
      resolveClosed = resolve;
    });
    const end = () => resolveClosed();
    abort.addEventListener("abort", end, { once: true });
    try {
      view = await this.ctx.visualUI.open(name, { modal: false, interactable: false, pointerEventsPassthrough: true });
      if (abort.aborted || this.signal.aborted) return;
      bind(view);
      detachClose = view.onClose(() => {
        closed = true;
        resolveClosed();
      });
      const configured = this.ctx.settings.get("durationMs");
      const duration = typeof configured === "number" && Number.isFinite(configured) ? Math.max(300, Math.min(6e4, configured)) : 3e3;
      await Promise.race([delay(duration, abort), closedPromise]);
      if (!closed) view.close();
      if (!abort.aborted) await closedPromise;
    } finally {
      detach();
      detachClose();
      abort.removeEventListener("abort", end);
      if (!closed) view == null ? void 0 : view.close();
    }
  }
}
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
  levels: s.array("等级", (i) => ({ id: i.string("等级编号"), name: i.string("等级名称") })).addLabel("添加等级").emptyHint("未配置时使用 bronze 铜、silver 银、gold 金。").maxItems(1e4).table({ titleField: "name", columns: ["id"] }),
  achievements: s.array("成就", (i) => ({
    id: i.string("成就编号").describe("唯一且长期稳定，例如 first_step；改名时保留此编号。"),
    name: i.string("名称"),
    icon: i.asset("图标").accepts("image"),
    levelId: i.string("等级编号").default("bronze")
  })).addLabel("添加成就").emptyHint("添加第一个成就。").maxItems(1e4).table({ titleField: "name", imageField: "icon", columns: ["id", "levelId"] }),
  page: s.uiRef("成就页").default("ui:" + PAGE).describe("可视化界面引用：项目界面文件名，或 @扩展编号/文件名。"),
  browsePolicy: s.enum("页面浏览方式", ["pagination", "scroll", "horizontal", "player"]).labels({ pagination: "固定翻页", scroll: "固定纵向滚动", horizontal: "固定横向滚动", player: "允许玩家切换" }).default("pagination").describe("固定方式隐藏切换按钮；允许玩家切换时，分别选择开放的方式。"),
  allowPagination: s.boolean("开放翻页").default(true).enabledWhen("browsePolicy", "player"),
  allowVertical: s.boolean("开放纵向滚动").default(true).enabledWhen("browsePolicy", "player"),
  allowHorizontal: s.boolean("开放横向滚动").default(false).enabledWhen("browsePolicy", "player"),
  browseDefault: s.enum("默认浏览方式", ["pagination", "scroll", "horizontal"]).labels({ pagination: "翻页", scroll: "纵向滚动", horizontal: "横向滚动" }).default("pagination").enabledWhen("browsePolicy", "player").describe("仅在已开放的方式中生效；玩家有效的已有选择优先。"),
  popup: s.uiRef("浮现界面").default("ui:" + POPUP).describe("可编辑默认浮现界面，或填写自己的可视化界面引用。"),
  notifications: s.boolean("激活时浮现").default(true),
  durationMs: s.number("每条浮现时长（毫秒）").default(3e3).range(300, 6e4).step(100)
}));
_AchievementExtension.activate = _AchievementExtension.method({
  id: "activate",
  title: "激活成就",
  description: "仅未激活到已激活时通知；重复调用没有额外通知。",
  schema: { achievementId: { type: "string", label: "成就编号", required: true } },
  async run(ctx, p) {
    await controller(ctx, this.save).set(p.achievementId, true, true);
  },
  async skip(ctx, p) {
    await controller(ctx, this.save).set(p.achievementId, true, false);
  },
  async runImmediately(ctx, p) {
    await controller(ctx, this.save).set(p.achievementId, true, false);
  }
});
_AchievementExtension.deactivate = _AchievementExtension.method({
  id: "deactivate",
  title: "取消激活成就",
  schema: { achievementId: { type: "string", label: "成就编号", required: true } },
  async run(ctx, p) {
    await controller(ctx, this.save).set(p.achievementId, false, false);
  }
});
_AchievementExtension.isActive = _AchievementExtension.method({
  id: "is-active",
  title: "成就是否激活",
  returns: { type: "boolean", label: "已激活" },
  schema: { achievementId: { type: "string", label: "成就编号", required: true } },
  async run(ctx, p) {
    return controller(ctx, this.save).isActive(p.achievementId);
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
  description: "供自制界面调用；只重建展示数据，不改变激活事实。",
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
