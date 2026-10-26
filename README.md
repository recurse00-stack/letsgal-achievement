# 局内成就系统

为 LetsGal 游戏提供可配置等级、图标与名称、可选说明、自定义展示阶段、成就页和浮现通知。当前阶段是唯一状态：默认隐藏、未激活、已激活三个普通预设，创作者可修改或新增阶段；卡片和浮现跟随当前阶段。默认提供金银铜边框；创作者可以固定翻页、纵向滚动或横向滚动，也可以勾选向玩家开放的方式。三种方式共用一份可视化卡片模板，默认固定翻页、不显示切换按钮。页面、卡片和浮现界面均可设计；卡片与浮现共用成就说明，浮现说明控件可隐藏、删除或自由排版；列表容器的高级 CSS 由浏览模块管理。

适用开发环境：LetsGal Studio 2.8.0-beta.1。状态模板使用 profile，同一玩家档案跨存档共享；读旧档和新开游戏保留阶段记录。已有其他保存范围的数据表不会自动迁移，接入时核对绑定。

已在 Studio 2.8.0-beta.1 验证阶段显示、浮现与配置操作。新阶段模型的独立 Player、普通／快速存读档、应用冷重开和作品导出尚未验收；跨存档行为依据 profile 契约，发布作品前需在目标播放器验证。

当前配置页保存成就定义到扩展设置，当前阶段记录使用官方数据表。配置页自动写入官方作者表、自定义属性组及 Wiki 查阅备注尚未提供。

配置页把每个成就的基础内容与展示阶段放在同一条目中，条目默认收起，支持全部展开／收起。“默认阶段配置”集中维护共用阶段；成就默认沿用，也可覆盖、添加或移除自己的阶段。

基础配置、展示阶段及阶段内的阶段信息、等级与边框、名称显示、说明显示、图标显示、内容预览均可分别折叠，初次显示时收起；玩家界面与浮现动画区域也可折叠。阶段下拉列表支持右键删除，菜单注明范围并保护初始阶段。

正常方法收敛为“成就操作”“读取成就信息”“打开成就页”“刷新成就界面数据”；先选成就，再选择目标阶段或读取项目。展示阶段可指定不同等级，卡片和浮现同步更新。

## 下载与使用

旧激活接口与旧记录格式不再兼容，使用新版阶段记录表契约 2.0.0。

本版为 0.1.1，采用展示阶段模型。由 0.1.0 升级前请备份工程，并按手册重新接入方法与阶段记录表。

从 [Release](https://github.com/recurse00-stack/letsgal-achievement/releases/tag/v0.1.1) 下载 `mixing-entropy.achievement-0.1.1.zip`，在 Studio 中导入扩展并加入项目。需要源码、手册和 AI 指南时下载 `letsgal-achievement-0.1.1-bundle.zip`。

[中文使用说明](docs/USER-GUIDE.md) 包含配置成就、数据表绑定、剧情切换阶段、编辑卡片、浏览方式及浮现动画。解压完整包后，也可以离线打开 `docs/USER-GUIDE.html`。

![自制卡片与横向滚动](docs/images/achievement-horizontal-cards.png)

## AI 辅助与源码

[成就 AI 指南](ai/SKILL.md) 随完整包提供。运行 `python tools/install-ai.py` 预览安装，确认目标后添加 `--apply`。需要 LetsGal 通用创作指导时，另从 [LetsGal Authoring Kit](https://github.com/recurse00-stack/letsgal-authoring-kit/releases) 获取主 Skill。

构建源码时先在 Studio 中同步官方 SDK 和 Studio UI Kit，再在 mixing-entropy.achievement 中执行 npm install、npm run check、npm test、npm run build。SDK 和 UI Kit 使用宿主提供的版本，不自行替换接口。运行代码和编辑期代码分别构建到 dist/index.mjs 与 dist/studio.js。
