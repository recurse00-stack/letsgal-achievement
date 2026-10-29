# 成就页、浏览与通知

## 玩家投影和通知

mixing-entropy.achievement.entries 为 session list，仅提供 id,name,description,icon,iconMode,levelId,levelName,stageId,stageName,frame,cardBackground,appearance,elementCss。白名单投影当前允许内容；卡片配置为不生成卡片，或保存阶段失效时，不进入列表、不占页数。stageName 按 showStageName 提供；隐藏等级时 levelId/levelName 为空，但 appearance 仍按有效等级解析。未配置外观且不显示等级时使用默认中性边框；作者 stage-info 仍能读取有效等级。投影不回写运行记录。

内置 ui/achievements.json 与 ui/achievement-popup.json 保留 hiddenInStudio=true，只隐藏方法选择入口，编辑与运行保留。列表来源 ext:mixing-entropy.achievement.entries；名称字段 name、副文字 stageName、图片 icon；说明绑定 {{item.description}}。旧 active/status 绑定不再提供。

浮现内容可选标识为 achievement-name、achievement-description、achievement-icon、achievement-level、achievement-stage、achievement-label；外观标识为 achievement-background、achievement-frame、achievement-icon。label 固定“成就展示已更新”，其余取当前阶段的浮现专用投影。控件缺失兼容，不覆盖作者 hidden/visibleIf、排版或进退场动画。main.notifications 为全局开关；main.durationMs 默认 3000，范围 300–60000。

阶段实际变化且 notify=true、全局开启、目标阶段浮现 enabled 时排一条通知。队列串行，播放前校验目标 stageId 并重读当前内容；离开目标阶段则结束／丢弃旧通知，不把新阶段内容套入旧界面。相同阶段不重复通知。浮现失败不回滚阶段记录；游戏结束释放队列和计时器。只记录当前阶段，不补播历史。

默认翻页／滚动只在官方 UI 编辑器设置：打开成就页，单击“双击编辑卡片 · 成就列表”，关闭“滚动模式”使用翻页，开启使用滚动。行、列、间距和列表大小也由官方页面保存。扩展不再提供另一份默认浏览设置，保存后重新打开游戏中的成就页生效。

控制器每次 open-page 经公开 extensionResource 读取当前本扩展 UI 文档，navigationMode=pagination/scroll 是唯一默认来源；移除 main.browsePolicy/main.browseDefault，残留旧值不读取。main.scrollDirection=vertical/horizontal（默认vertical）仅增强 scroll 的方向。main.allowPlayerSwitch 默认false；main.allowPagination/allowVertical/allowHorizontal 默认均false，只增加玩家可选方式，默认方式始终保留。单一方式不显示按钮；不开玩家切换时不读写偏好。

浏览增强目前支持本扩展内的页面（如 @mixing-entropy.achievement/achievements，或在本扩展下新建的页面）。项目级页面、其他扩展页面或资源读取失败时，保留官方页面原有浏览方式，隐藏本模块的切换按钮，不强制改成翻页。

官方编辑器的图层名称为“双击编辑卡片 · 成就列表”。单击列表设置整页行列；双击画布中的列表区域，进入“网格项模板”，这里编辑单张成就卡片。列表图层名是作者提示，运行使用稳定标识符 achievement-list，不把提示文字显示给玩家。

浏览偏好 mixing-entropy.achievement.browseMode 为 shared string，默认空字符串；有效值 pagination／scroll／horizontal，不是阶段记录。开启玩家切换且有多个选择时，优先使用仍被开放的有效选择；空值、未知值或已停用值回退默认，但不自动覆写旧偏好。open-page 绑定 achievement-list 和相应 achievement-mode-pagination／achievement-mode-scroll／achievement-mode-horizontal 按钮。关闭时清理按钮、输入、观察器及临时布局；无 achievement-list 的页面保持自己的行为。直接显示界面不绑定此控制器。

## 横向浏览适配

横向：保留顶层官方 data-list 的卡片模板，通过公开 setStyle.customCss 和标准 DOM/CSS 实现集合横排、原生横向滚动条、滚轮／横向输入及聚焦后的左右键／Home／End。沿用列表 cols、rows、gap，先填满一列再向右扩展。容器高级 CSS 为模块所有，内部卡片 CSS、样式、动作和数据绑定保持。原生 navigationMode 使用 scroll，不编造方向属性；不旋转整个列表，不克隆或重写卡片渲染器。适配以 2.8.0-beta.1 的 data-visual-ui-scroll-container DOM 为依据；未知结构记录错误并保留原生纵向列表，宿主升级需复核。列表不要放进普通分组，以保留官方卡片模板编辑入口。

历史 browse.3 已在 Studio 2.8.0-beta.1 和其生成的独立桌面 Player 验证三种浏览方式、自制双行卡片、实际滚轮与横向键盘操作；Player 正常退出后冷重开仍采用此前的横向偏好。创作者仅开放两种／一种时的按钮显示与配置保存已在 Studio 验证。
