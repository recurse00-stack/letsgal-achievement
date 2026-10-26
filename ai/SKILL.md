---
name: letsgal-plugin-achievement
description: 配置 LetsGal 局内成就系统 mixing-entropy.achievement 的展示阶段、等级、成就方法、卡片与浮现；仅处理已安装插件。
metadata:
  version: 0.1.1
  channel: beta
---

# LetsGal 局内成就系统

先核实际项目启用的扩展、完整 Studio 版本与通道。本文对应局内成就系统 0.1.1、Studio 2.8.0-beta.1；0.1.0 为旧激活模型，升级须重新接入。其他宿主按其官方 SDK/MCP 核实，不猜兼容、不自动升级。已有 letsgal-authoring 主技能时沿用其工程操作方式。

完整接口见 [CONTRACT](references/CONTRACT.md)。阶段是唯一业务状态；“已激活”是可改名的普通预设，不增加布尔标记或按等级推断历史。用户讨论时不写工程；实施只在授权范围内，不实现世界状态条件、监听、宏或完整计划功能。

用 ext_read 核对方法与设置；正常方法只有 change-stage、stage-info、open-page、refresh。change-stage 先选 achievementId 再选 stageId，notify 默认 true，expectedStageId 留空不限制。重复阶段不通知，隐藏不浮现。stage-info 读取阶段或等级编号/名称，固定文本返回；If 按文本比较。旧七方法已移除，不再创建旧调用。

states 使用 letsgal.achievement.states ^2.0.0、profile，只有 achievementId/stageId 两个必需文本字段。旧 active-only 格式不兼容，不编写补写 active 的兼容支路。先核 schema 与契约，不能把删除表格显示列当成解除 required 约束。不静默改绑或清除玩家数据；需要更新已有表时备份并保留稳定表编号与保存范围。恢复回放不重写记录。

检查器阶段选项按所选成就过滤，共用定义与本成就专用配置按同一规则合并，排除本成就移除的阶段；失效旧编号只提示，不作为选项，不自动重写。变量成就无法静态确定阶段集合。

main.achievements、共用 main.defaultStages 与专用 main.displayStages 均为扩展结构化配置，官方作者表自动同步、属性组及 Wiki 尚未实现。不要用 Agent database_write 冒充插件配置页同步能力。共用默认列表非空时完整替代内置列表，空时用 hidden/unknown/revealed；专用同编号行完整覆盖共用阶段，disabled=true 排除此成就的阶段。恢复共用时移除专用行；修改共用不改变完整专用配置。不可移除仍使用的初始阶段。新成就初始优先 unknown，否则取首个可用阶段。内容 base 使用所属成就基础配置，不继承上一阶段；custom 空值不回退。阶段可指定等级，showLevel 独立控制玩家可见性。失效保存阶段隐藏处理。

配置页：每条成就展开后直接配置基础信息和展示阶段；成就列表整体、单条、等级和默认阶段区均可折叠，提供全部展开／收起。基础配置、展示阶段及阶段内的阶段信息、等级与边框、名称显示、说明显示、图标显示、内容预览均可分别折叠，初次显示时收起；玩家界面与浮现动画区域也可折叠。阶段编辑下拉列表支持右键删除，按点击项编号执行；菜单和按钮共用初始／最后阶段保护。共用删除与单成就删除范围不同，不扩大删除范围。不要把折叠偏好保存为玩家状态。

用 ui_read/ui_edit 编辑官方 card 模板与浮现，保留稳定 refId。内置两页 hiddenInStudio=true，仍可编辑和在扩展设置里选择。列表用 ext:mixing-entropy.achievement.entries；不提供 active/status，阶段标签用 item.stageName，说明 item.description。浮现说明 refId achievement-description，由控制器填值，没有列表 item 作用域。是否显示、删除、排版由创作者控制。

浏览策略 pagination/scroll/horizontal/player，固定方式或仅开放一种时隐藏模式按钮。三模式共用顶层 achievement-list 和自由卡片模板；玩家选择由 allowPagination/allowVertical/allowHorizontal 限制，browseDefault 指定默认。保留 achievement-mode-pagination/scroll/horizontal 标识。列表容器高级 CSS 由适配器管理，内部卡片自由设计；不要放进普通分组。横向依赖当前宿主 DOM，不支持时记错并保留纵向，不伪装成功。

主体、AI 指南及人类手册同步维护。辅助安装器保持预览、保全、同版本不同内容拒绝覆盖，不覆盖主 Skill。静态、Studio、Player、存档与导出分别记录，沿用旧版结果要明确边界。未获授权不发布。
