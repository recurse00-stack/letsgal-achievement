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
  const result = value ?? "none";
  if (result === "base" || result === "custom" || result === "none" || icon && result === "unknown") return result;
  throw new AchievementError("INVALID_DATA", "阶段内容来源无效");
}
function catalog(levelValues, achievementValues, stageValues = [], defaultStageValues = []) {
  const levels = unique(rows(levelValues).map((value) => {
    const row = object(value);
    return { id: id(row.id), name: text(row.name, "等级名称") };
  }), "等级");
  const achievements = unique(rows(achievementValues).map((value) => {
    const row = object(value);
    const achievement = { id: id(row.id), name: text(row.name, "成就名称"), description: text(row.description ?? "", "成就说明", true), icon: text(row.icon ?? "", "图标", true), levelId: id(row.levelId), initialStageId: row.initialStageId ? id(row.initialStageId) : "unknown" };
    if (!levels.some((level) => level.id === achievement.levelId)) throw new AchievementError("LEVEL_NOT_FOUND", `成就 ${achievement.id} 的等级不存在`);
    return achievement;
  }), "成就");
  const parseStage = (value) => {
    const row = object(value);
    const levelMode = row.levelMode ?? "base";
    if (levelMode !== "base" && levelMode !== "custom") throw new AchievementError("INVALID_DATA", "阶段等级方式无效");
    const levelId = row.levelId ? id(row.levelId) : "";
    if (levelMode === "custom" && !levels.some((level) => level.id === levelId)) throw new AchievementError("LEVEL_NOT_FOUND", `阶段 ${row.id} 的等级不存在`);
    return {
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
    const row = object(value);
    const achievementId = id(row.achievementId);
    const disabled = bool(row.disabled, false);
    if (disabled) return { ...presetStages(achievementId)[1], id: id(row.id), disabled: true };
    return { ...parseStage(row), achievementId, disabled: false };
  });
  if (new Set(stages.map((s) => s.achievementId + "/" + s.id)).size !== stages.length) throw new AchievementError("DUPLICATE_ID", "同一成就的阶段编号重复");
  const result = { levels, achievements, stages, defaultStages };
  for (const item of achievements) if (item.initialStageId && !stagesFor(result, item.id).some((s) => s.id === item.initialStageId)) throw new AchievementError("STAGE_NOT_FOUND", `成就 ${item.id} 的初始阶段不存在`);
  return result;
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
    const row = object(value2);
    if (typeof row.stageId !== "string" || !row.stageId.trim()) throw new AchievementError("INVALID_DATA", "记录缺少展示阶段编号，请使用新版阶段记录表");
    return { id: id(row.id), stageId: id(row.stageId) };
  }), "阶段记录");
}
function entries(definitions, records) {
  const names = new Map(definitions.levels.map((level) => [level.id, level.name]));
  return definitions.achievements.flatMap((row) => {
    const stageId = currentStage(definitions, records, row.id);
    const stage = stagesFor(definitions, row.id).find((s) => s.id === stageId);
    if (!(stage == null ? void 0 : stage.visible)) return [];
    const levelId = stage.levelMode === "custom" ? stage.levelId : row.levelId;
    const content = (source, base, custom) => source === "base" ? base : source === "custom" ? custom : "";
    return [{
      id: row.id,
      name: content(stage.nameMode, row.name, stage.displayName),
      description: content(stage.descriptionMode, row.description, stage.description),
      icon: stage.iconMode === "base" ? row.icon : stage.iconMode === "custom" ? stage.icon : "",
      iconMode: stage.iconMode,
      levelId: stage.showLevel ? levelId : "",
      levelName: stage.showLevel ? names.get(levelId) : "",
      stageId,
      stageName: stage.showStageName ? stage.name : ""
    }];
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
  const allowed = BROWSE_MODES.filter((mode2) => mode2 === "pagination" ? options.allowPagination !== false : mode2 === "scroll" ? options.allowVertical !== false : options.allowHorizontal === true);
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
  let mode2 = playerChoice && choices.includes(saved) ? saved : fallback;
  const buttons = BROWSE_MODES.map((key) => ({ key, handle: view.get("achievement-mode-" + key) }));
  let live = true;
  const render = () => {
    list.setProps({ navigationMode: mode2 === "horizontal" ? "scroll" : mode2 });
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
    this.latest = [];
    this.tail = Promise.resolve();
    this.cleanups = [];
    this.table = ctx.database.collection("states");
    this.notifications = new NotificationQueue((item, abort) => this.popup(item, abort), (error) => console.error("[成就] 浮现失败，阶段记录已保留", error));
    const refresh = () => {
      if (!signal.aborted) void this.refresh().catch((error) => console.error("[成就] 刷新失败", error));
    };
    this.cleanups.push(this.table.watch(refresh));
    this.cleanups.push(ctx.settings.subscribe("levels", refresh), ctx.settings.subscribe("achievements", refresh), ctx.settings.subscribe("displayStages", refresh), ctx.settings.subscribe("defaultStages", refresh));
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
    return catalog(levels.length ? levels : DEFAULT_LEVELS, this.ctx.settings.get("achievements") ?? [], this.ctx.settings.get("displayStages") ?? [], this.ctx.settings.get("defaultStages") ?? []);
  }
  async read() {
    const definitions = this.definitions();
    const documents = await this.table.find();
    this.assertLive();
    const records = stageRecords(documents.map((row) => ({ id: row.achievementId, stageId: row.stageId })));
    return { definitions, documents, records };
  }
  publish(definitions, records) {
    var _a2;
    this.assertLive();
    const result = entries(definitions, records).map((item) => ({
      ...item,
      icon: item.iconMode === "unknown" ? "extension-asset://mixing-entropy.achievement/assets/achievement-unknown.svg" : item.iconMode === "base" ? item.icon || "extension-asset://mixing-entropy.achievement/assets/achievement.svg" : item.icon,
      frame: `extension-asset://mixing-entropy.achievement/assets/frame-${["bronze", "silver", "gold"].includes(item.levelId) ? item.levelId : "neutral"}.svg`
    }));
    this.latest = result;
    this.sink.set("entries", result);
    (_a2 = this.updatePopup) == null ? void 0 : _a2.call(this, result);
    return result;
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
      const list = this.publish(definitions, change.records);
      if (change.changed && notify && this.ctx.settings.get("notifications") !== false && list.some((r) => r.id === id2)) this.notifications.enqueue({ id: id2 });
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
    const page = await this.ctx.visualUI.open(this.document("page", PAGE), { modal: true });
    if (this.signal.aborted) {
      page.close();
      return;
    }
    this.page = page;
    const stopBrowsing = bindBrowseMode(page, {
      read: () => this.sink.get("browseMode"),
      write: (mode2) => {
        this.assertLive();
        this.sink.set("browseMode", mode2);
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
  async popup(request, abort) {
    if (abort.aborted || this.signal.aborted) return;
    await this.refresh();
    const eligible = (list) => list.find((row) => row.id === request.id);
    if (abort.aborted || !eligible(this.latest) || this.ctx.settings.get("notifications") === false) return;
    const name = this.document("popup", POPUP);
    const bind = (view2) => {
      var _a2, _b, _c, _d, _e, _f, _g;
      const item = eligible(this.latest);
      if (!item) return;
      (_a2 = view2.get("achievement-frame")) == null ? void 0 : _a2.setStyle({ borderColor: { bronze: "#b38a55", silver: "#b9c2cc", gold: "#d4b04c" }[item.levelId] ?? "#697888" });
      (_b = view2.get("achievement-label")) == null ? void 0 : _b.setProps({ text: "成就展示已更新" });
      (_c = view2.get("achievement-name")) == null ? void 0 : _c.setProps({ text: item.name });
      (_d = view2.get("achievement-description")) == null ? void 0 : _d.setProps({ text: item.description });
      (_e = view2.get("achievement-level")) == null ? void 0 : _e.setProps({ text: item.levelName });
      (_f = view2.get("achievement-stage")) == null ? void 0 : _f.setProps({ text: item.stageName });
      (_g = view2.get("achievement-icon")) == null ? void 0 : _g.setProps({ asset: item.icon });
    };
    const detach = this.ctx.visualUI.onOpen(name, bind);
    let view;
    let detachClose = () => {
    };
    let resolveClosed = () => {
    };
    let closed = false;
    const timerAbort = new AbortController();
    const closedPromise = new Promise((resolve) => {
      resolveClosed = resolve;
    });
    const end = () => resolveClosed();
    let suppressed = false;
    const update = (list) => {
      if (!eligible(list)) {
        suppressed = true;
        view == null ? void 0 : view.close();
        end();
      } else if (view && !suppressed) bind(view);
    };
    this.updatePopup = update;
    abort.addEventListener("abort", end, { once: true });
    try {
      view = await this.ctx.visualUI.open(name, { modal: false, interactable: false, pointerEventsPassthrough: true });
      if (abort.aborted || this.signal.aborted || suppressed || !eligible(this.latest)) return;
      bind(view);
      detachClose = view.onClose(() => {
        closed = true;
        resolveClosed();
      });
      const configured = this.ctx.settings.get("durationMs");
      const duration = typeof configured === "number" && Number.isFinite(configured) ? Math.max(300, Math.min(6e4, configured)) : 3e3;
      await Promise.race([delay(duration, timerAbort.signal), closedPromise]);
      if (!closed) view.close();
      if (!abort.aborted) await closedPromise;
    } finally {
      timerAbort.abort();
      if (this.updatePopup === update) this.updatePopup = void 0;
      detach();
      detachClose();
      abort.removeEventListener("abort", end);
      if (!closed) view == null ? void 0 : view.close();
    }
  }
}
const stageFields = (i) => ({
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
  levels: s.array("等级", (i) => ({ id: i.string("等级编号"), name: i.string("等级名称") })).addLabel("添加等级").emptyHint("未配置时使用 bronze 铜、silver 银、gold 金。").maxItems(1e4).table({ titleField: "name", columns: ["id"] }),
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
  browsePolicy: s.enum("页面浏览方式", ["pagination", "scroll", "horizontal", "player"]).labels({ pagination: "固定翻页", scroll: "固定纵向滚动", horizontal: "固定横向滚动", player: "允许玩家切换" }).default("pagination").describe("固定方式隐藏切换按钮；允许玩家切换时，分别选择开放的方式。"),
  allowPagination: s.boolean("开放翻页").default(true).enabledWhen("browsePolicy", "player"),
  allowVertical: s.boolean("开放纵向滚动").default(true).enabledWhen("browsePolicy", "player"),
  allowHorizontal: s.boolean("开放横向滚动").default(false).enabledWhen("browsePolicy", "player"),
  browseDefault: s.enum("默认浏览方式", ["pagination", "scroll", "horizontal"]).labels({ pagination: "翻页", scroll: "纵向滚动", horizontal: "横向滚动" }).default("pagination").enabledWhen("browsePolicy", "player").describe("仅在已开放的方式中生效；玩家有效的已有选择优先。"),
  popup: s.uiRef("浮现界面").default("ui:" + POPUP).describe("可编辑默认浮现界面，或填写自己的可视化界面引用。"),
  notifications: s.boolean("启用浮现通知").default(true),
  durationMs: s.number("每条浮现时长（毫秒）").default(3e3).range(300, 6e4).step(100)
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
