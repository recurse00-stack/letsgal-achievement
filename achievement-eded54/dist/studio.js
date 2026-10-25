import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Panel, Section, SettingField, useSetting } from "@avg-studio/studio-ui";
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
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 20, flexWrap: "wrap", padding: "8px 0" }, children: modes.map((mode) => /* @__PURE__ */ jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: mode.value,
            disabled: mode.value && count === 1,
            onChange: (event) => mode.set(event.target.checked)
          }
        ),
        mode.label
      ] }, mode.label)) }),
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
  let message;
  let invalid = false;
  try {
    const value = catalog((levels == null ? void 0 : levels.length) ? levels : DEFAULT_LEVELS, items ?? []);
    message = `${value.achievements.length} 个成就，${value.levels.length} 个等级。`;
  } catch (error) {
    invalid = true;
    message = error instanceof Error ? error.message : String(error);
  }
  return /* @__PURE__ */ jsx("p", { role: invalid ? "alert" : "status", style: { color: invalid ? "var(--warn)" : "var(--fg-secondary)" }, children: message });
}
function settingsPage() {
  return /* @__PURE__ */ jsxs(Panel, { children: [
    /* @__PURE__ */ jsxs(Section, { title: "成就配置", description: "填写定义；游戏中的激活记录由成就状态表保存。改名称或图标时保留原编号。", children: [
      /* @__PURE__ */ jsx(Validation, {}),
      /* @__PURE__ */ jsx(SettingField, { name: "main.levels" }),
      /* @__PURE__ */ jsx(SettingField, { name: "main.achievements" })
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "玩家界面", description: "选择向玩家提供的浏览方式；固定模式隐藏切换按钮。页面、卡片和翻页控件可在 UI 编辑器中编排，通过“打开成就页”进入。", children: [
      /* @__PURE__ */ jsx(SettingField, { name: "main.page" }),
      /* @__PURE__ */ jsx(Browsing, {})
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "浮现动画", description: "激活时依次播放；重复激活不重复通知。可编辑默认浮现界面中的进场、退场动画。", children: [
      /* @__PURE__ */ jsx(SettingField, { name: "main.notifications" }),
      /* @__PURE__ */ jsx(SettingField, { name: "main.popup" }),
      /* @__PURE__ */ jsx(SettingField, { name: "main.durationMs" })
    ] })
  ] });
}
export {
  settingsPage
};
//# sourceMappingURL=studio.js.map
