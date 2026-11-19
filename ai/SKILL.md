---
name: letsgal-plugin-achievement
description: 配置 LetsGal 局内成就系统 mixing-entropy.achievement 的阶段、等级、方法、卡片与浮现；不实现世界状态条件或宏。
metadata:
  version: 0.2.0
  channel: stable
  revision: 20261119-release.1
---

# 局内成就系统

用于 mixing-entropy.achievement 0.2.0，对应 Studio 3.0.0 随包 SDK。按工程实际启用的版本选择资料。

每个成就的展示阶段可在「阶段内容 → 关联 Steam 成就」填写 Steamworks API Name。剧情沿用「成就操作」。按实际获得的目标阶段提交，同层被拦截、跳过的低层和读档回放均不发起解锁。模拟测试与真实 App ID 桌面验收分别记录。

分组在属性配置中管理，成就可多选并逐项选择等级、卡片、浮现来源。剧情用 group-visibility 改变组入口显隐。成就启用阶段层级后，change-stage 允许首次获得和向更高层推进；同层先到者保留，读档继续使用共享记录。新增专用阶段或默认阶段会自动追加到各成就的新最高层，创作者可再并层。

## 按任务读取

| 当前任务 | 读取资料 |
| --- | --- |
| 剧情切换阶段、读取阶段或等级，处理运行记录 | [方法与状态](references/methods-and-state.md) |
| 工作台编辑、关联图定位、新建成就、共用／专用阶段及卡片／浮现覆盖 | [阶段配置](references/stage-configuration.md) |
| 打开成就页、浏览、浮现分批／排序／汇总与设置页切换 | [页面与通知](references/page-and-notifications.md)；调用参数见[方法与状态](references/methods-and-state.md) |
| 单卡编排、尺寸参考、背景／边框／动态素材、元素 CSS | [外观与 CSS](references/appearance-and-css.md) |
| 升级宿主、判断兼容性、核对实际验证范围 | [版本与验证](references/compatibility.md) |
| 安装／更新插件知识、维护资料与发行内容 | [资料维护](references/maintenance.md) |

只读当前任务所需主题；面向创作者的逐步操作见随包 `docs/USER-GUIDE.html` 或 `docs/USER-GUIDE.md`，不用把整份手册作为每次前置。已有 letsgal-authoring 主 Skill 时沿用其工程定位、MCP 与版本选择流程；没有主 Skill 时按目标工程公开接口完成当前插件任务。

## 关键不变量

- **成就 → 阶段 → 元素**：只保存当前 `stageId`。隐藏／未激活／已激活是普通预设名称，不新增 `active`、推断等级达成历史或强制阶段顺序。
- 作者定义留在扩展设置，玩家阶段只使用官方 shared 扩展存档，首次运行自动建立。无进度来源选项、数据表依赖或旧表导入；已有 stageProgress 继续使用。条件、监听和宏归世界状态。
- **内容与布局分工**：阶段给出当前内容；通用卡片与通用浮现各自沿用／覆盖，位置大小由官方 UI 手动编排。基础配置指所属成就，不继承上一阶段；画布目前不自动跟随行列变化。
- **保留已有资料和记录**：旧激活接口与旧表记录不兼容。清理工程旧表前核对引用和实际数据，不能把本插件无需旧表当作删除其他内容的授权。候选能力、历史实测和本次验证分别判断，不能用文档安装或构建代替运行验收。

- **工作台边界**：成就、属性配置、界面与浮现分别进入。默认阶段／通用方案是共享来源；跳转修改前核对影响范围。无效输入草稿仅在本次打开保留，SDK 接受不等于磁盘已保存；不要为清除错误提示覆写外部更新。
