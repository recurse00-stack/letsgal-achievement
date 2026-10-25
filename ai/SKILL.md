---
name: letsgal-plugin-achievement
description: 配置 LetsGal 成就插件 mixing-entropy.achievement 的等级、定义、方法块、成就页和浮现界面；仅处理已安装的这个插件。
metadata:
  version: 0.1.0
  channel: beta
---

# LetsGal 成就插件

先核对目标项目实际启用的扩展 ID、版本、完整 Studio 版本与通道。已验证资料对应 0.1.0、Studio 2.8.0-beta.1；其他版本按目标宿主官方 SDK/MCP 核实，不猜兼容、不自动升级宿主。存在 letsgal-authoring 主技能时沿用其工程操作方式。

配置、方法参数、数据表及 UI 对接读 [接口](references/CONTRACT.md)。用户只讨论方案时不自动写入工程。当前最简版只有等级、图标名称、激活状态、可编辑 UI 和浮现动画，避免把完整设计里后续内容提前加入。

用 ext_read 取得真实方法和设置；ext_settings_set 更新定义；ui_read/ui_edit 修改可视化页面和 card 内部模板，保留稳定标识。UIRef 只选择可视化文档。源码扩展的 UI 编辑会写自用源，作品自定义优先新建项目界面并通过 main.page/main.popup 选用。

创作者用 main.browsePolicy 选择 pagination 固定翻页（默认）、scroll 固定纵向滚动、horizontal 固定横向滚动或 player 开放玩家切换。player 时用 allowPagination、allowVertical、allowHorizontal 分别开放模式（默认 true、true、false），browseDefault 指定默认方式。只开放一种或固定模式时隐藏切换按钮。已有选择只有仍被开放时才采用；关闭某种能力不清除旧偏好。不要把具备能力理解为必须全部展示给玩家。

三种模式共用官方列表及自由设计的 card 模板。自制页面保留顶层 achievement-list（卡片布局），开放切换时添加相应的 achievement-mode-pagination、achievement-mode-scroll、achievement-mode-horizontal 按钮，使用 open-page 进入。横向由本扩展的局部 CSS 和浏览器输入适配实现，不需要私有宿主接口；行列和间距沿用官方列表。列表容器高级 CSS 由模块管理，卡片内部 CSS、元素、动作与绑定保留。不要把列表放进普通分组：2.8 的卡片模板编辑入口对此有限制。适配器依赖当前宿主渲染的列表 DOM，升级宿主须验证；不支持结构会记录错误并保留纵向列表，不伪装成横向成功。

browseMode 为 shared 玩家偏好，默认空表示未选择；固定模式不采用也不清除已有偏好。直接显示界面不绑定浏览控制器。当前配置页仍写扩展设置，自动写作者表、自定义属性组和 Wiki 尚未实现，不能用 Agent database_write 代替插件能力。

状态表 states 独立拥有激活事实，默认 profile：同一玩家档案跨存档共享，读旧档、新开游戏不回退。先用 database_inspect 核对绑定、契约与 profile 策略；未绑定时用本插件的官方模板创建。旧 session/archive 表保留，不静默迁移，明确按实际作品范围改绑。不要在世界状态另存一份成就事实。取消激活会改变共享记录；跨设备同步与混合范围不在本版。

条件、监听、时序交由世界状态宏编排成就官方方法块。重复激活无通知；取消后再次激活会通知。读档回放、快进、UI 队列与持久保存分别验证，不把静态测试或临时表预览说成存读档/导出通过。图标、名称和等级改动保持稳定成就编号。
