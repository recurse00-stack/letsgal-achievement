---
name: letsgal-plugin-achievement
description: 配置 LetsGal 局内成就系统 mixing-entropy.achievement 的阶段、等级、方法、卡片与浮现；不实现世界状态条件或宏。
metadata:
  version: 0.1.3
  channel: beta
  revision: 20261031-release.1
---

# 局内成就系统

用于扩展 `mixing-entropy.achievement`。本资料对应 **0.1.3 / 20261031-release.1**。先依据目标工程启用的扩展及实际接口选择资料；不能只看版本号。宿主证据来自 Studio **2.8.0-beta.1**，其他版本或通道的适配需另核，不自动升级。

## 按任务读取

| 当前任务 | 读取资料 |
| --- | --- |
| 剧情切换阶段、读取阶段或等级，处理运行记录 | [方法与状态](references/methods-and-state.md) |
| 新建成就、配置共用或专用阶段、卡片／浮现沿用与覆盖 | [阶段配置](references/stage-configuration.md) |
| 打开成就页、翻页／滚动、通知排队、UI 数据绑定 | [页面与通知](references/page-and-notifications.md) |
| 单卡编排、尺寸参考、背景／边框／动态素材、元素 CSS | [外观与 CSS](references/appearance-and-css.md) |
| 升级宿主、判断兼容性、核对实际验证范围 | [版本与验证](references/compatibility.md) |
| 安装／更新插件知识、维护资料与发行内容 | [资料维护](references/maintenance.md) |

只读当前任务所需主题；面向创作者的逐步操作见随包 `docs/USER-GUIDE.html` 或 `docs/USER-GUIDE.md`，不用把整份手册作为每次前置。已有 letsgal-authoring 主 Skill 时沿用其工程定位、MCP 与版本选择流程；没有主 Skill 时按目标工程公开接口完成当前插件任务。

## 关键不变量

- **成就 → 阶段 → 元素**：只保存当前 `stageId`。隐藏／未激活／已激活是普通预设名称，不新增 `active`、推断等级达成历史或强制阶段顺序。
- **配置与条件分工**：定义在扩展配置，运行阶段在官方 profile 表。世界状态负责外部条件、监听和宏；不在本插件补做。作者表自动同步、完整属性组和业务 Wiki 仍属计划。
- **内容与布局分工**：阶段给出当前内容；通用卡片与通用浮现各自沿用／覆盖，位置大小由官方 UI 手动编排。基础配置指所属成就，不继承上一阶段；画布目前不自动跟随行列变化。
- **保留已有资料和记录**：旧激活接口不兼容，不能静默清表或改绑；按方法参考处理。候选能力、历史实测和本次验证分别判断，不能用文档安装或构建代替运行验收。
