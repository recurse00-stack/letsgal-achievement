# 成就 0.1.0

为 LetsGal 游戏提供可配置等级、图标与名称、激活状态、成就页和浮现通知。默认提供金银铜边框；创作者可以固定翻页、纵向滚动或横向滚动，也可以勾选向玩家开放的方式。三种方式共用一份可视化卡片模板，默认固定翻页、不显示切换按钮。页面、卡片和浮现界面均可设计；列表容器的高级 CSS 由浏览模块管理。

适用开发环境：LetsGal Studio 2.8.0-beta.1。状态模板使用 profile，同一玩家档案跨存档共享；读旧档和新开游戏保留激活记录。已有其他保存范围的数据表不会自动迁移，接入时核对绑定。

当前配置页保存成就定义到扩展设置，激活记录使用官方数据表。配置页自动写入官方作者表、自定义属性组及 Wiki 查阅备注尚未提供。

## 下载与使用

从 [Release](https://github.com/recurse00-stack/letsgal-achievement/releases/tag/v0.1.0) 下载 `achievement-eded54-0.1.0.zip`，在 Studio 中导入扩展并加入项目。需要源码、手册和 AI 指南时下载 `letsgal-achievement-0.1.0-bundle.zip`。

[中文使用说明](docs/USER-GUIDE.md) 包含配置成就、数据表绑定、剧情激活、编辑卡片、浏览方式及浮现动画。解压完整包后，也可以离线打开 `docs/USER-GUIDE.html`。

![自制卡片与横向滚动](docs/images/achievement-horizontal-cards.png)

## AI 辅助与源码

[成就 AI 指南](ai/SKILL.md) 随完整包提供。运行 `python tools/install-ai.py` 预览安装，确认目标后添加 `--apply`。需要 LetsGal 通用创作指导时，另从 [LetsGal Authoring Kit](https://github.com/recurse00-stack/letsgal-authoring-kit/releases) 获取主 Skill。

构建源码时先在 Studio 中同步官方 SDK 和 Studio UI Kit，再在 achievement-eded54 中执行 npm install、npm run check、npm test、npm run build。SDK 和 UI Kit 使用宿主提供的版本，不自行替换接口。运行代码和编辑期代码分别构建到 dist/index.js 与 dist/studio.js。
