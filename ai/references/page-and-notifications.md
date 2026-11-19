# 成就页、浏览与通知

## 玩家投影和通知

正式版中单条和汇总浮现使用 closeOnContextMenu=false，按播放时长结束；成就页沿用玩家的返回操作。

成就页按钮 achievement-group-filter 切换「全部」和依序排列的可见分组。当前组仅过滤 entries，独立的浮现投影继续接收全部成就的有效通知。当前组隐藏后退回全部，可见的空组保留。

mixing-entropy.achievement.entries 为 session list，仅提供 id,name,description,icon,iconMode,levelId,levelName,stageId,stageName,frame,cardBackground,appearance,elementCss。白名单投影当前允许内容；卡片配置为不生成卡片，或保存阶段失效时，不进入列表、不占页数。stageName 按 showStageName 提供；隐藏等级时 levelId/levelName 为空，但 appearance 仍按有效等级解析。未配置外观且不显示等级时使用默认中性边框；作者 stage-info 仍能读取有效等级。投影不回写运行记录。

内置 ui/achievements.json 与 ui/achievement-popup.json 保留 hiddenInStudio=true，只隐藏方法选择入口，编辑与运行保留。列表来源 ext:mixing-entropy.achievement.entries；名称字段 name、副文字 stageName、图片 icon；说明绑定 {{item.description}}。旧 active/status 绑定不再提供。

浮现内容可选标识为 achievement-name、achievement-description、achievement-icon、achievement-level、achievement-stage、achievement-label；外观标识为 achievement-background、achievement-frame、achievement-icon。label 固定“成就展示已更新”，其余取当前阶段的浮现专用投影。控件缺失兼容，不覆盖作者 hidden/visibleIf、排版或进退场动画。main.notifications 为全局开关；main.durationMs 默认 3000，范围 300–60000。

阶段实际变化且 notify=true、全局开启、目标阶段浮现 enabled 时加入收集窗口。通知计时与播放不阻塞阶段写入。main.notificationWindowMs 默认500，范围50–5000毫秒；从第一条成功入队起固定计时，后续入队不延长。窗口结束前无任何浮现；封批后再到的通知进入下一批。各批通过同一串行队列播放，前批关闭后才播放后批。

main.notificationMode 为 sequential（默认）或 merged；main.allowNotificationModeSwitch 默认false。main.notificationDurationPercent 默认67，范围10–100。批次开始收集时捕获方式、时长比例、排序规则、汇总界面与时长；已收集或播放的批次不被随后设置变化改编。播放前先读取当前内容，校验目标阶段及本次运行内的变化序号，去掉失效通知并按成就去重，只保留最后有效通知。随后一次确定批次成员、顺序和连续播放比例，再打开第一张界面。阶段来回变化后静默回到原阶段也不复活旧通知；变化序号只在内存，不加入保存契约。

sequential：有效成就数超过1时，各条原停留时长乘以比例（包括第一条）；单条保留原时长。原时长仍按阶段专用／通用方案／全局300–60000毫秒解析；缩短结果取整毫秒，最短30毫秒，不改官方进退场动画。merged：有效成就数超过1时用 main.summaryUI，默认 ui:@mixing-entropy.achievement/achievement-summary；main.summaryDurationMs 默认3000、范围300–60000。只有1条时用阶段原浮现，0条不打开界面。

main.notificationSort 为结构化平面行 {field:'level'|'stage'|'achievement',value:string}[]，最多30000项。属性首次出现的顺序是规则优先顺序，同属性行序是优先值顺序；空value只保留空规则，不参与排序，重复值去重。按规则依次比较，每条未列出的值并列靠后，全部相等时按首次接收顺序稳定排列。level 读取当前阶段实际等级，不依赖玩家投影中是否显示等级；stage 按目标阶段编号匹配，achievement 按成就编号匹配。失效引用不匹配、不改其他对象。独立设置页管理规则和优先值，无需填写JSON或比较表达式。

汇总通过 session 字段 mixing-entropy.achievement.notificationCount:number 与 notificationEntries:list 输出；条目是排序后的浮现白名单投影，字段与 entries 一致，不输出作者基础资料或其他阶段。默认UI文字“解锁了 {{mixing-entropy.achievement.notificationCount}} 个成就”由作者自由改写，数字统计不同成就而不是独立解锁事实。官方列表来源 ext:mixing-entropy.achievement.notificationEntries。控制器不覆盖汇总作者文字、样式、位置与动画；关闭后清空计数和条目。显示中只移除离开通知阶段或关闭浮现的条目，不补入新批次；全部失效则关闭。

玩家选择 notificationPreference 为 shared string，默认空；允许值 sequential/merged，空或无效值沿用创作者默认。关闭开放权限时忽略但保留原选择。notification-mode 仅在允许切换、非存档恢复时写偏好，其他情况返回实际方式；未知action拒绝。skip/runImmediately只读取，不切换。当前方式 notificationMode、中文名称 notificationModeLabel、是否允许切换 notificationCanSwitch 均为session投影，模块注册与方法调用时刷新，活动控制器另订阅作者默认与权限变化。自制设置页按钮使用 ext.call target=mixing-entropy.achievement/notification-mode，paramsJson={"action":"toggle"}（裸参数）；也可指定sequential/merged/default。按钮文字绑定 {{mixing-entropy.achievement.notificationModeLabel}}，visibleIf 使用游戏变量 mixing-entropy.achievement.notificationCanSwitch。原生switch的引擎设置bind列表不支持自定义插件值，使用可视化按钮承载切换，不伪造原生绑定键。

重复获得、静默切换和存档恢复均不发通知。开启层级后，首次获得初始展示阶段也算有效获得。离开目标阶段时关闭旧浮现并等待 onClose，运行结束取消队列。队列、计时器及序号只在内存中维护；汇总计数和卡片列表是 session 投影。

默认翻页／滚动只在官方 UI 编辑器设置：打开成就页，单击“双击编辑卡片 · 成就列表”，关闭“滚动模式”使用翻页，开启使用滚动。行、列、间距和列表大小也由官方页面保存。扩展不再提供另一份默认浏览设置，保存后重新打开游戏中的成就页生效。

控制器每次 open-page 经公开 extensionResource 读取当前本扩展 UI 文档，navigationMode=pagination/scroll 是唯一默认来源；移除 main.browsePolicy/main.browseDefault，残留旧值不读取。main.scrollDirection=vertical/horizontal（默认vertical）仅增强 scroll 的方向。main.allowPlayerSwitch 默认false；main.allowPagination/allowVertical/allowHorizontal 默认均false，只增加玩家可选方式，默认方式始终保留。单一方式不显示按钮；不开玩家切换时不读写偏好。

浏览增强目前支持本扩展内的页面（如 @mixing-entropy.achievement/achievements，或在本扩展下新建的页面）。项目级页面、其他扩展页面或资源读取失败时，保留官方页面原有浏览方式，隐藏本模块的切换按钮，不强制改成翻页。

官方编辑器的图层名称为“双击编辑卡片 · 成就列表”。单击列表设置整页行列；双击画布中的列表区域，进入“网格项模板”，这里编辑单张成就卡片。列表图层名是作者提示，运行使用稳定标识符 achievement-list，不把提示文字显示给玩家。

浏览偏好 mixing-entropy.achievement.browseMode 为 shared string，默认空字符串；有效值 pagination／scroll／horizontal，不是阶段记录。开启玩家切换且有多个选择时，优先使用仍被开放的有效选择；空值、未知值或已停用值回退默认，但不自动覆写旧偏好。open-page 绑定 achievement-list 和相应 achievement-mode-pagination／achievement-mode-scroll／achievement-mode-horizontal 按钮。关闭时清理按钮、输入、观察器及临时布局；无 achievement-list 的页面保持自己的行为。直接显示界面不绑定此控制器。

## 横向浏览适配

横向：保留顶层官方 data-list 的卡片模板，通过公开 setStyle.customCss 和标准 DOM/CSS 实现集合横排、原生横向滚动条、滚轮／横向输入及聚焦后的左右键／Home／End。沿用列表 cols、rows、gap，先填满一列再向右扩展。容器高级 CSS 为模块所有，内部卡片 CSS、样式、动作和数据绑定保持。原生 navigationMode 使用 scroll，不编造方向属性；不旋转整个列表，不克隆或重写卡片渲染器。适配以 2.8.0-beta.1 的 data-visual-ui-scroll-container DOM 为依据；未知结构记录错误并保留原生纵向列表，宿主升级需复核。列表不要放进普通分组，以保留官方卡片模板编辑入口。

历史 browse.3 已在 Studio 2.8.0-beta.1 和其生成的独立桌面 Player 验证三种浏览方式、自制双行卡片、实际滚轮与横向键盘操作；Player 正常退出后冷重开仍采用此前的横向偏好。创作者仅开放两种／一种时的按钮显示与配置保存已在 Studio 验证。
