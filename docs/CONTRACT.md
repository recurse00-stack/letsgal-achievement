# 成就插件接口

扩展 mixing-entropy.achievement，模块 main。主体版本 0.1.2，发行修订 20261029-release.1。清单 sdkVersion 为 ^2.8.0-beta.1，已有宿主证据来自 Studio 2.8.0-beta.1；Stable 未验证。本版直接使用阶段模型，不兼容旧激活接口和 active-only 记录。

## 作者定义

定义保存在扩展结构化设置，运行记录在官方 profile 表。配置页自动写作者表、完整属性组和业务 Wiki 尚未实现；离线使用手册不是该业务 Wiki。条件、监听和宏由世界状态负责，本插件只提供成就操作；不以 Agent MCP 写表代替插件自身同步能力。

main.levels 为 {id,name,appearanceId?,popupAppearanceId?}[]，空数组使用铜银金。appearanceId 关联通用卡片方案，popupAppearanceId 关联通用浮现方案。main.achievements 为 {id,name,description,icon,levelId,initialStageId}[]。description 可空、换行，最多 1000 字符。initialStageId 默认 unknown。编号长期稳定；等级和初始阶段引用必须存在。配置错误拒绝业务写入。

main.defaultStages 是共用阶段数组，不含 achievementId。非空时为完整共用列表，空／未设置时使用内置 hidden/unknown/revealed。

main.displayStages 是成就专用阶段的结构化平面数组，独立配置页在所属成就下方编辑，不另存第二份定义。每项：achievementId、id、name、visible、nameMode、displayName、descriptionMode、description、iconMode、icon、levelMode、levelId、showLevel、showStageName，以及可选 disabled。nameMode／descriptionMode 为 base|custom|none；iconMode 另支持 unknown。base 在界面显示为“使用成就基础配置”，读取所属成就的基础名称、说明或图标，不继承上一阶段；custom 空值不回退到基础内容。阶段配置总行数最多 10000，同一成就的阶段编号唯一，不同成就可重复。解析顺序为共用阶段 → 同 achievementId/id 的完整专用配置；disabled=true 为此成就移除该阶段的标记，不是隐藏阶段。移除标记不产生内容或等级依赖。恢复共用配置删除该专用行；删除共用阶段不删除已有的完整专用行。编辑器新增阶段生成 UUID，不复用已移除身份。未知保存阶段隐藏处理，查询仍返回原编号；外部显式设置到存在的阶段可以恢复。

levelMode 为 base（默认，使用成就基础等级）或 custom（指定本阶段 levelId）；custom 必须引用有效等级。showLevel 只控制玩家是否看到等级，不改变有效等级。旧阶段缺少这两项时按基础等级解释。默认边框和浮现等级跟随有效等级。

方法检查器与运行时复用相同的阶段解析，仅为存在的成就列出其合并后的实际阶段；失效参数仅以说明提示，不插入选项，不自动改参数。变量指定成就时使用编号／变量输入。

配置页的成就区域及各成就条目可折叠，逐项默认收起并提供全部展开／收起。折叠状态仅属编辑器组件，不写玩家记录。基础配置、展示阶段、阶段信息、阶段等级、本阶段内容和阶段表现可折叠；名称、说明与图标先显示沿用摘要，点击单独设置才展开。卡片／浮现只展开明确请求的内容、外观或时长控件，展开不写配置。

阶段编辑选择器支持按右键目标编号删除，菜单和按钮共用删除规则；初始阶段、最后可用阶段及失效目标拒绝。右键菜单锚定目标选项，打开和删除时保留列表展开；Esc 先关闭菜单，外部交互收起列表。选项使用浅边框，范围提示使用较小字号。专用删除只影响所属成就，共用删除保留已存在的完整专用配置。新成就可自填编号或自动生成，初始阶段优先 unknown，否则选首个实际阶段；已有初始阶段引用仍须有效。

## 运行阶段记录

states：contract letsgal.achievement.states，version ^2.0.0，runtime-write，profile。模板 contractVersion 2.0.0；schema 必需 achievementId:string、stageId:string，附带宿主 id，同一 achievementId 唯一。无记录时使用成就初始阶段。既有记录必须有 stageId，缺少时报错，不根据 active 推断。

profile 表按同一玩家档案跨剧情存档保留当前阶段。处理既有绑定时保留记录和稳定身份；不静默清表、改绑或以删除显示列代替契约变更。

只有当前 stageId 是业务状态；没有 active/status 字段、阶段激活标记、等级顺序推断或自动补低级记录。默认 hidden（隐藏）、unknown（未激活）、revealed（已激活）都是普通阶段。已有多余字段不参与查询或写入，新的记录只写成就身份和阶段。

## 方法

| localType | 参数 | 返回／作用 |
| --- | --- | --- |
| change-stage | achievementId:string, stageId:string, notify:boolean=true, expectedStageId:string='' | 无返回；目标切换，预期不符整项跳过，重复阶段不通知 |
| stage-info | achievementId:string, field:stageId/stageName/levelId/levelName='stageId' | string；读取当前阶段或有效等级 |
| open-page | 无 | 刷新并打开作者选择的页面 |
| refresh | 无 | 只刷新投影，正常操作自动执行 |

全局类型为 mixing-entropy.achievement/localType。剧情 paramsJson 用 {kind:'lit',value:...} 或变量绑定；UI ext.call 用裸参数。读取返回固定 string，If 用文本比较。先验证目标再检查预期；同阶段首次操作仍固化初始值但不通知。方法 skip/runImmediately 静默更新；恢复回放 isRestoring 跳过写入和通知、仅刷新。

旧 activate/deactivate/is-active/set-display-stage/get-display-stage/operate/read-info 已移除。旧剧情必须替换，不能再依赖旧布尔返回。绑定旧 1.x 表不会自动迁移；仅隐藏 active 列不等于移除 schema 必填约束。

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


## 卡片编排与外观字段

本节为 0.1.2 的卡片编排与外观配置；沿用原方法、运行状态和保存契约。

卡片内部统一使用官方手动模板，不提供编排模式选择和自动图文布局。扩展不自动重排位置、大小、字号或行数；阶段普通外观应用背景、边框、动效并测量尺寸参考，创作者另可显式使用元素 CSS 覆盖内容层样式。

main.appearances 为统一存储的通用表现方案数组，界面分成“通用卡片展示”和“通用浮现”，不再显示独立共用外观入口。每项为 {id,name,surface,isDefault,...外观字段,nameMode,descriptionMode,iconMode,levelVisibility,stageNameVisibility,ui,durationMs}；surface=card|popup，每组最多一个 isDefault=true。名称／说明显示模式为 stage|none，图标另支持 unknown；不保存具体成就文字。levelVisibility/stageNameVisibility=stage|show|hide。浮现 ui 和 durationMs 决定通用界面、时长，0／空值回退原 main.popup/main.durationMs。卡片布局仍使用成就页的原生 card 模板，不按方案切换独立模板文档。

appearanceSource=default|local|preset|level。没有专用外观的阶段默认 default，引用对应 surface 的默认方案；local 完全独立，preset 使用 appearanceId，level 按有效等级读取卡片 appearanceId 或浮现 popupAppearanceId。跨 surface 的引用不应用外观或 CSS。overrideBackground/overrideFrame/overrideEffects 默认 false；default/preset/level 下按整个分段覆盖，关闭恢复实时跟随。具体阶段值不复制整套通用方案形成另一份来源；仅首次开启覆盖时捕获该分段。已有专用外观保持原值。

每个方案的 CSS ownerKind 仍为 appearance，ownerId 是方案编号，新 UI 固定 surface。默认或被引用的方案不能直接删除。方案／等级／阶段变动刷新当前投影，不改玩家 stageId；世界状态不参与这些表现设置。

| 字段 | 可选值／默认 |
| --- | --- |
| backgroundMode / backgroundColor / backgroundImage | template、color、image、gradient / 空 / 空 |
| backgroundFit | cover（默认）、contain、fill、tile |
| backgroundColorEnd / backgroundAngle | 空 / 135，角度范围 0–360 |
| backgroundX / backgroundY | 各 50，范围 0–100，百分比焦点 |
| frameMode / frameImage / frameColor | template（默认）、none、line、nineSlice / 空 / 空 |
| frameWidth / frameRadius | 3 / 12，范围 0–256 |
| sliceTop / sliceRight / sliceBottom / sliceLeft | 各 16，范围 0–4096；源图切线与目标厚度分离 |
| frameRepeat | stretch（默认）、repeat、round |
| iconEffect / frameEffect | none、float、rotate、pulse / none、pulse、glow |
| effectTrigger / effectDuration | loop、enter、hover / 1800 毫秒，范围 200–60000 |

entries 新增当前阶段 appearance 白名单对象和 cardBackground 图片引用。frame 在九宫格且有图片时使用阶段 frameImage，否则沿用默认等级边框。cardBackground 未配置时为透明 SVG 数据 URL，避免原生图片空资源占位。投影只含当前阶段，不输出其它阶段的素材或内容。

open-page 通过 ctx.extensionResource.url('ui/<name>.json') 读取本扩展自有公开模板资源，最多等待 3 秒。仅匹配 @mixing-entropy.achievement/<文档名>；不读取宿主编辑器私有状态。增强适配要求顶层 refId=achievement-list 的 card data-list，直接基础子元素，唯一 key 角色。角色由作者样式 customCss 中 --achievement-card-role 声明：background、backgroundImage、frame、icon、name、description、level、stage、key。key 绑定 item.id，透明但不设 hidden；角色不得重复。隐藏图层不参与映射，其它装饰可无角色。角色用源码顺序对照原生图层；若数量／基本类型不匹配或包含分组／visibleIf，则保留原生模板，不猜测映射。

2.8 原生卡片渲染可能不执行子元素 customCss；这里将角色作为资源中的声明读取，不依赖原生保留该 CSS。适配器以本次页面作用域限制 DOM 操作，检查实际卡片 clientWidth/Height 并监听尺寸变化。不改作者的布局坐标和元素尺寸；关闭页面恢复仍由适配器拥有的样式并释放监听和 WAAPI 动画，作者后续修改优先。

九宫格用 border-image；切线、边框厚度与卡片内容内边距分开，边缘提供 stretch/repeat/round，中部不填充。附加动效与素材逐帧动画分离，后者交官方图片控件。

浮现通过相同公开资源入口读取本扩展 UI 文档。唯一、无 hidden/visibleIf 的矩形／图片 refId 形成外观契约；静态分组可递归，条件／隐藏父组不进入。公开 setStyle.customCss 写入本次作用域标记，2.8 DOM 适配只处理其首个内容层，保留外层位置和原生进退场。无独立背景时以 frame 内容层承载；none 只去边线，不隐藏底板。浮现不启动 hover 附加动效。关闭清理动画、观察器及仍由适配器拥有的样式，恢复作者 customCss；不适用／外部页面保持原生效果。

原生单卡编辑器沿用双击列表入口，可在取消元素选中后的“界面属性 → 设计画布”修改宽高，不需要独立界面。修改画布不自动缩放或重排已有元素。当前设计宽高保存在 card 模板组的 rect.w/h；MCP 读取以 template.canvas 为准，templates[].canvas 是参考表。240×280不是固定尺寸或已确认的固定下限。列表行列、间距及区域变化目前不会自动更新该设计画布；扩展公开编辑期 SDK 未找到列表文档变更订阅／模板持久写回接口。Agent 的 ui_edit 能修改工程，不等同于发行插件自动能力。

尺寸参考位于“界面与播放 → 成就页与卡片编排 → 成就卡片编排”。通过 open-page 打开的剧情预览测量实际单卡占位，并经公开 ctx.settings.set 写入 main.cardSizeReference（最多一条结构化记录）；配置页 useSetting 读取同一记录。包含页面、测量时间、浏览方式、实际占位／内容／网格宽高及作者行列、间距、列表和模板画布宽高。该记录只供作者参考，不参与布局和成就状态；Player 中设置写入仅在运行内存生效。尺寸变化去重并延迟250ms写入，页面关闭时撤销等待。换页面不显示其他页面的缓存；没有可见卡片或模板不支持时不生成新值。修改官方布局后须通过方法重新打开剧情预览，不能把旧时间的记录当成即时同步。建议画布与全卡背景／边框控件采用测得的占位尺寸，内部元素手动摆放；不改作者模板。

装饰锚点／最小最大尺寸、逐元素行数和完整属性标签映射仍待补充。配置页直达编辑器仍待后续，不作为画布跟随的前置。

旧阶段字段 visible 继续作为未配置独立表现时的缺省值；配置页已移除阶段总可见开关。实际卡片与浮现分别按解析后的 enabled 决定是否输出，不按阶段名称推断。

## 阶段表现与界面分层

配置页顶层为成就管理、通用配置、界面与播放。阶段表现内并列卡片展示与阶段浮现，均使用官方模板编排；阶段内容是两者共同的默认内容，不与上一运行阶段发生继承。

main.stagePresentations 是最多 10000 项的结构化平面数组，键为 achievementId + stageId + surface。achievementId 为空表示默认阶段；surface=card|popup；mode=custom|inherit。custom 行保存 contentOverride、enabled、nameMode/displayName、descriptionMode/description、iconMode/icon、showLevel、showStageName、ui、durationMs，以及原有外观与引用字段。内容模式 stage|custom|none，icon 另支持 unknown；stage 读取当前阶段基础内容，不读取另一种表现的专用内容。contentOverride=false 时沿用本阶段内容及所选方案显示规则；true 时整组内容规则使用本处专用值。已有未标记的专用行保留其内容规则。ui 为空、durationMs=0 优先沿用所选通用方案，再回退 main.popup/main.durationMs；自定时长 300～60000 毫秒。

每个 surface 单独解析：本成就 custom → 同阶段默认 custom → 原有阶段外观与显示配置。inherit 行明确跳过本成就旧外观，回到默认阶段表现。未指定专用外观时读取本组默认方案；已有明确专用外观不被覆盖。配置页修改某一表现不创建／覆盖 displayStages；恢复某一表现仅重置它的行和对应 CSS，原 both CSS 转存到另一 surface，避免误删另一表现。阶段基本信息、名称、说明、图标及等级的专用行仍独立维护。阶段移除后其表现配置不参与投影；只保存 stageId，不迁移玩家记录。

entries 只投影卡片内容，popupUI/popupDurationMs 不输出到 entries；运行另建只含当前阶段允许内容的浮现投影。卡片 enabled 决定是否生成卡片；浮现 enabled 决定是否允许阶段切换通知。它们与阶段名称无关。通用方案引用的删除保护同时检查默认选择、等级和阶段表现配置。

真实阶段变化且 notify=true、全局允许、目标浮现 enabled 时入队；队列携带目标 stageId，播放前再次读当前阶段，过期请求丢弃。正在播放时阶段、界面或时长变化会结束旧实例，不自动重播；同阶段内容／外观改动可更新现有实例。notifications 关闭会结束正在播放的实例。ui 选择器使用官方 UIRefPicker；普通布局与进退场仍由原生 UI 控制。不存在界面导致播放失败时保留已写入阶段记录并报告错误。

## 元素 CSS

main.elementCss 为结构化配置数组（最多 10000 行），每行 {id,ownerKind,ownerId,achievementId,target,surface,css,replace}。ownerKind=appearance/defaultStage/stage；ownerId 为外观或阶段编号，stage 还需 achievementId。target=background/backgroundImage/frame/icon/name/description/level/stageName，或 element:<官方元素 id>；surface=both/card/popup；css 最多 20000 字符，replace 为布尔。同一 owner+target+surface 唯一。只投影当前阶段的解析结果到 entries.elementCss，不生成卡片的阶段不向 entries 输出 CSS；浮现投影单独解析。

解析顺序为阶段实际引用的外观、同编号默认阶段、当前成就阶段；各层先 both 后对应 surface。replace 清除该元素已累计的上级 CSS，空 replace 行可停用继承。阶段基础内容按完整阶段规则处理，卡片与浮现外观分别解析；CSS 单独按上述层级叠加，不继承前一个运行阶段。无对应实际阶段的 CSS 记录不参与投影。

配置页默认显示沿用摘要，点击单独设置才展开内容或外观参数；提供保存前解析、覆盖属性列表、动效冲突提示和恢复继承。CSS 可写根声明、本元素状态与伪元素、& img、根级 @keyframes，不允许其它全局／嵌套规则、外部 URL、表达式或 --achievement-* 内部标记。保存草稿用“应用 CSS”；不能解析时保留草稿并阻止切换元素／用途。

运行时给目标内容层唯一作用域并为关键帧改名，不写作者 UI 文件。普通根声明以 important 覆盖基础属性；参与关键帧的属性保留动画优先级。文字色彩／字体等同时覆盖原生文字 paint span。hover-only CSS 保留普通静止样式；关闭时移除作用域、样式表并恢复仍由适配器拥有的内联值。CSS 接管 animation/transition 或内置动效对应的 transform/opacity/filter 时只暂停该元素的内置附加动效。减少动画的媒体条件停用 CSS 动画与过渡。CSS 动画不继承内置动效的 loop/enter/hover 设置。

卡片角色 stage 映射到 CSS stageName；自建元素按模板直属基础元素 id 绑定。浮现扩展背景、边框、图标契约到文字及自建基础元素，使用已有唯一 refId 的公开 view.get 连接，element:<id> 仍以资源 id 定位；没有 refId 的自建浮现元素不增强。官方静态模板画布不会显示运行时阶段 CSS，效果在剧情预览核对。背景与边框复用同一底板时共同作用到该内容层，必要时作者拆分元素。显式背景绘制 CSS 替代背后的普通图片层，CSS 边框可替代普通“不显示”或图片边框；素材和普通参数原值保留。

## 验证范围

2026-10-29 通用卡片／浮现两组方案完成时，100 项自动检查、类型检查和双入口构建通过，Studio 2.8.0-beta.1 核对了默认卡片方案。此后的方案删除 CSS 清理修复通过针对性组件检查、类型检查和编辑器构建，runtime 未变；不能称为修复后重跑了全量 100 项。新的浮现方案通知及配置页逐项原生操作未在该轮验收。

本版发行前的 Studio 证据覆盖三种浏览方式、尺寸参考、阶段外观、元素 CSS、独立浮现内容及默认值提示。素材样例覆盖卡片 GIF/APNG/动态 WebP 和浮现动态 WebP 的不同动画帧；不代表全部编码组合或导出通过。此前 0.1.1 的原生证据覆盖阶段显示与浮现、动态方法选项、共用／专用编辑、折叠及单成就阶段右键删除。新模型未验证独立 Player、普通／快速存读档、冷重开与导出。定义自动写作者表、完整属性组和 Wiki 尚未实现。

## 横向浏览适配

横向：保留顶层官方 data-list 的卡片模板，通过公开 setStyle.customCss 和标准 DOM/CSS 实现集合横排、原生横向滚动条、滚轮／横向输入及聚焦后的左右键／Home／End。沿用列表 cols、rows、gap，先填满一列再向右扩展。容器高级 CSS 为模块所有，内部卡片 CSS、样式、动作和数据绑定保持。原生 navigationMode 使用 scroll，不编造方向属性；不旋转整个列表，不克隆或重写卡片渲染器。适配以 2.8.0-beta.1 的 data-visual-ui-scroll-container DOM 为依据；未知结构记录错误并保留原生纵向列表，宿主升级需复核。列表不要放进普通分组，以保留官方卡片模板编辑入口。

历史 browse.3 已在 Studio 2.8.0-beta.1 和其生成的独立桌面 Player 验证三种浏览方式、自制双行卡片、实际滚轮与横向键盘操作；Player 正常退出后冷重开仍采用此前的横向偏好。创作者仅开放两种／一种时的按钮显示与配置保存已在 Studio 验证。
