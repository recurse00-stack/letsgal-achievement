import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useSetting, FieldRow, Button, Select as Select$1, Section, TextInput, Switch, AssetPicker, ParamField, useParam, useInspectorEnvironment, Panel, SettingField } from "@avg-studio/studio-ui";
import { useState } from "react";
import { createListCollection, Select, Portal, Menu } from "@chakra-ui/react";
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
function StagePicker({ value, stages, onChange, removalReason, onRemove, shared = false }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const collection = createListCollection({ items: stages.map((s) => ({ value: s.id, label: `${s.name}（${s.id}）` })) });
  const pointed = stages.find((s) => s.id === (target == null ? void 0 : target.id));
  const reason = pointed ? removalReason(pointed.id) : "此阶段已不存在。";
  const colors = { bg: "var(--bg-canvas)", color: "var(--fg-primary)", borderColor: "var(--border-default)" };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      Select.Root,
      {
        collection,
        value: value ? [value] : [],
        open,
        onOpenChange: (e) => setOpen(e.open),
        onValueChange: (e) => {
          if (e.value[0]) onChange(e.value[0]);
        },
        positioning: { sameWidth: true },
        children: [
          /* @__PURE__ */ jsxs(Select.Trigger, { ...colors, "aria-label": shared ? "编辑默认阶段" : "编辑阶段", children: [
            /* @__PURE__ */ jsx(Select.ValueText, { placeholder: "请选择阶段" }),
            /* @__PURE__ */ jsx(Select.Indicator, {})
          ] }),
          /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(Select.Positioner, { children: /* @__PURE__ */ jsx(Select.Content, { "data-studio-user-content": true, ...colors, maxH: "320px", overflowY: "auto", children: collection.items.map((option) => /* @__PURE__ */ jsxs(
            Select.Item,
            {
              item: option,
              title: option.label,
              color: "var(--fg-primary)",
              _highlighted: { bg: "var(--bg-subtle)" },
              onContextMenu: (event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                setTarget({ id: option.value, x: event.clientX, y: event.clientY });
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
        open: !!target && !!pointed,
        onOpenChange: (e) => {
          if (!e.open) setTarget(null);
        },
        positioning: { placement: "bottom-start", getAnchorRect: () => ({ x: (target == null ? void 0 : target.x) ?? 0, y: (target == null ? void 0 : target.y) ?? 0, width: 0, height: 0 }) },
        onSelect: (e) => {
          if (e.value === "remove" && pointed && !removalReason(pointed.id)) onRemove(pointed.id);
          setTarget(null);
        },
        children: /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(Menu.Positioner, { children: /* @__PURE__ */ jsxs(Menu.Content, { "data-studio-user-content": true, ...colors, maxW: "360px", children: [
          /* @__PURE__ */ jsxs("div", { style: { padding: "6px 10px", color: "var(--fg-secondary)", overflowWrap: "anywhere" }, children: [
            pointed == null ? void 0 : pointed.name,
            "（",
            pointed == null ? void 0 : pointed.id,
            "）"
          ] }),
          /* @__PURE__ */ jsx(Menu.Item, { value: "remove", disabled: !!reason, color: "var(--fg-primary)", _highlighted: { bg: "var(--bg-subtle)" }, children: shared ? "删除默认阶段" : "从此成就删除阶段" }),
          /* @__PURE__ */ jsx("div", { style: { padding: "6px 10px", color: "var(--fg-secondary)" }, children: reason || (shared ? "影响沿用此默认阶段的成就；专用配置保留。" : "只影响当前成就，其他成就不变。") })
        ] }) }) })
      }
    )
  ] });
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
      /* @__PURE__ */ jsx(FieldRow, { label: "向玩家显示本阶段内容", children: /* @__PURE__ */ jsx(Switch, { checked: stage.visible, onChange: (visible) => patch({ visible }) }) }),
      stage.visible && /* @__PURE__ */ jsx(FieldRow, { label: "向玩家提供阶段名称", description: "自制卡片使用 item.stageName；浮现使用 achievement-stage 文字控件。", children: /* @__PURE__ */ jsx(Switch, { checked: stage.showStageName, onChange: (showStageName) => patch({ showStageName }) }) }),
      /* @__PURE__ */ jsxs("p", { style: noteStyle, children: [
        "阶段编号：",
        stage.id,
        "。修改名称不改变编号。"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "等级与边框", collapsible: true, defaultOpen: false, children: [
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
      stage.levelMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "选择等级", children: /* @__PURE__ */ jsx(Select$1, { value: stage.levelId, options: levels.map((l) => ({ value: l.id, label: l.name + "（" + l.id + "）" })), onChange: (levelId) => patch({ levelId }) }) }),
      stage.visible && /* @__PURE__ */ jsx(FieldRow, { label: "展示等级与边框", children: /* @__PURE__ */ jsx(Switch, { checked: stage.showLevel, onChange: (showLevel) => patch({ showLevel }) }) })
    ] }),
    stage.visible ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { style: noteStyle, children: "“使用成就基础配置”读取对应成就的名称、说明或图标，不继承上一阶段。" }),
      /* @__PURE__ */ jsxs(Section, { title: "名称显示", collapsible: true, defaultOpen: false, children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "名称显示方式", children: /* @__PURE__ */ jsx(Select$1, { value: stage.nameMode, options: contentOptions, onChange: (value) => patch({ nameMode: value }) }) }),
        stage.nameMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "显示名称", children: /* @__PURE__ */ jsx(TextInput, { value: stage.displayName, onChange: (displayName) => patch({ displayName }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "说明显示", collapsible: true, defaultOpen: false, children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "说明显示方式", children: /* @__PURE__ */ jsx(Select$1, { value: stage.descriptionMode, options: contentOptions, onChange: (value) => patch({ descriptionMode: value }) }) }),
        stage.descriptionMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "显示说明", children: /* @__PURE__ */ jsx(TextInput, { multiline: true, value: stage.description, onChange: (description) => patch({ description }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "图标显示", collapsible: true, defaultOpen: false, children: [
        /* @__PURE__ */ jsx(FieldRow, { label: "图标显示方式", children: /* @__PURE__ */ jsx(Select$1, { value: stage.iconMode, options: [...contentOptions, { value: "unknown", label: "默认未知图标" }], onChange: (value) => patch({ iconMode: value }) }) }),
        stage.iconMode === "custom" && /* @__PURE__ */ jsx(FieldRow, { label: "显示图标", children: /* @__PURE__ */ jsx(AssetPicker, { accepts: ["image"], value: stage.icon, onChange: (icon) => patch({ icon }) }) })
      ] }),
      /* @__PURE__ */ jsx(Section, { title: "内容预览", collapsible: true, defaultOpen: false, children: /* @__PURE__ */ jsxs("div", { style: { padding: 12, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 6 }, children: [
        /* @__PURE__ */ jsx("strong", { children: stage.nameMode === "base" ? (item == null ? void 0 : item.name) || "（对应成就的基础名称）" : stage.nameMode === "custom" ? stage.displayName : "（不显示名称）" }),
        /* @__PURE__ */ jsx("p", { style: { whiteSpace: "pre-wrap" }, children: stage.descriptionMode === "base" ? item ? item.description : "（对应成就的基础说明）" : stage.descriptionMode === "custom" ? stage.description : "（不显示说明）" }),
        stage.showStageName && /* @__PURE__ */ jsx("small", { children: stage.name })
      ] }) })
    ] }) : /* @__PURE__ */ jsx("p", { style: noteStyle, children: "此阶段不会出现在成就页，也不会浮现。" })
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
    stage && /* @__PURE__ */ jsx("p", { style: noteStyle, children: own ? "此阶段使用本成就专用配置，不随默认配置修改。" : "此阶段沿用默认配置；在此处修改仅影响当前成就。" }),
    /* @__PURE__ */ jsxs("div", { style: actionsStyle, children: [
      /* @__PURE__ */ jsx(Button, { onClick: () => {
        const next = { ...presetStages(item.id)[1], id: "stage_" + crypto.randomUUID(), name: "新阶段" };
        if (saveStage(next)) select(next.id);
      }, children: "添加本成就阶段" }),
      stage && own && shared && /* @__PURE__ */ jsx(Button, { onClick: () => save(without(stage.id)), children: "恢复使用默认配置" }),
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
          /* @__PURE__ */ jsxs(Section, { title: "基础配置", collapsible: true, defaultOpen: false, children: [
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
  const [policy] = useSetting("main.browsePolicy");
  const [paged, setPaged] = useSetting("main.allowPagination");
  const [vertical, setVertical] = useSetting("main.allowVertical");
  const [horizontal, setHorizontal] = useSetting("main.allowHorizontal");
  const modes = [
    { label: "翻页", value: paged !== false, set: setPaged },
    { label: "纵向滚动", value: vertical !== false, set: setVertical },
    { label: "横向滚动", value: horizontal === true, set: setHorizontal }
  ];
  const count = modes.filter((m) => m.value).length;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SettingField, { name: "main.browsePolicy" }),
    policy === "player" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 20, flexWrap: "wrap", padding: "8px 0" }, children: modes.map((mode2) => /* @__PURE__ */ jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: mode2.value,
            disabled: mode2.value && count === 1,
            onChange: (event) => mode2.set(event.target.checked)
          }
        ),
        mode2.label
      ] }, mode2.label)) }),
      /* @__PURE__ */ jsx("p", { style: { color: "var(--fg-secondary)" }, children: count > 1 ? "只显示已开放方式的切换按钮。" : "只开放一种方式时，不显示切换按钮。" }),
      count === 0 && /* @__PURE__ */ jsx("p", { role: "alert", children: "至少开放一种方式；当前将使用翻页。" }),
      /* @__PURE__ */ jsx(SettingField, { name: "main.browseDefault" })
    ] }),
    /* @__PURE__ */ jsx("p", { style: { color: "var(--fg-secondary)" }, children: "行列数与间距在可视化列表中设置。双击列表自由设计卡片；列表容器的高级 CSS 由浏览模块管理，卡片内样式不受影响。" })
  ] });
}
function Validation() {
  const [levels] = useSetting("main.levels");
  const [items] = useSetting("main.achievements");
  const [stages] = useSetting("main.displayStages");
  const [defaults] = useSetting("main.defaultStages");
  let message;
  let invalid = false;
  try {
    const value = catalog((levels == null ? void 0 : levels.length) ? levels : DEFAULT_LEVELS, items ?? [], stages ?? [], defaults ?? []);
    message = `${value.achievements.length} 个成就，${value.levels.length} 个等级。`;
  } catch (error) {
    invalid = true;
    message = error instanceof Error ? error.message : String(error);
  }
  return /* @__PURE__ */ jsx("p", { role: invalid ? "alert" : "status", style: { color: invalid ? "var(--warn)" : "var(--fg-secondary)" }, children: message });
}
function settingsPage() {
  return /* @__PURE__ */ jsxs(Panel, { children: [
    /* @__PURE__ */ jsxs(Section, { title: "成就配置", collapsible: true, description: "点击成就展开基础内容与展示阶段；每条成就可独立收起。游戏中只记录当前阶段。", children: [
      /* @__PURE__ */ jsx(Validation, {}),
      /* @__PURE__ */ jsx(AchievementEditor, {})
    ] }),
    /* @__PURE__ */ jsx(Section, { title: "成就等级", collapsible: true, defaultOpen: false, description: "统一配置可供成就和阶段选择的等级。未配置时使用铜、银、金。", children: /* @__PURE__ */ jsx(SettingField, { name: "main.levels" }) }),
    /* @__PURE__ */ jsx(Section, { title: "默认阶段配置", collapsible: true, defaultOpen: false, description: "共用的阶段配置。成就默认沿用这里；在单个成就下修改后，仅该成就使用专用配置。", children: /* @__PURE__ */ jsx(DefaultStageEditor, {}) }),
    /* @__PURE__ */ jsxs(Section, { title: "玩家界面", collapsible: true, defaultOpen: false, description: "选择向玩家提供的浏览方式；固定模式隐藏切换按钮。页面、卡片和翻页控件可在 UI 编辑器中编排，通过“打开成就页”进入。", children: [
      /* @__PURE__ */ jsx(SettingField, { name: "main.page" }),
      /* @__PURE__ */ jsx(Browsing, {})
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "浮现动画", collapsible: true, defaultOpen: false, description: "开启浮现的阶段切换通知依次播放；重复操作不重复通知，隐藏阶段不浮现。可编辑默认浮现界面中的进场、退场动画。", children: [
      /* @__PURE__ */ jsx(SettingField, { name: "main.notifications" }),
      /* @__PURE__ */ jsx(SettingField, { name: "main.popup" }),
      /* @__PURE__ */ jsx(SettingField, { name: "main.durationMs" })
    ] })
  ] });
}
export {
  inspectors,
  settingsPage
};
//# sourceMappingURL=studio.js.map
