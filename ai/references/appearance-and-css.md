# 卡片编排、外观与 CSS

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

## 元素 CSS

main.elementCss 为结构化配置数组（最多 10000 行），每行 {id,ownerKind,ownerId,achievementId,target,surface,css,replace}。ownerKind=appearance/defaultStage/stage；ownerId 为外观或阶段编号，stage 还需 achievementId。target=background/backgroundImage/frame/icon/name/description/level/stageName，或 element:<官方元素 id>；surface=both/card/popup；css 最多 20000 字符，replace 为布尔。同一 owner+target+surface 唯一。只投影当前阶段的解析结果到 entries.elementCss，不生成卡片的阶段不向 entries 输出 CSS；浮现投影单独解析。

解析顺序为阶段实际引用的外观、同编号默认阶段、当前成就阶段；各层先 both 后对应 surface。replace 清除该元素已累计的上级 CSS，空 replace 行可停用继承。阶段基础内容按完整阶段规则处理，卡片与浮现外观分别解析；CSS 单独按上述层级叠加，不继承前一个运行阶段。无对应实际阶段的 CSS 记录不参与投影。

配置页默认显示沿用摘要，点击单独设置才展开内容或外观参数；提供保存前解析、覆盖属性列表、动效冲突提示和恢复继承。CSS 可写根声明、本元素状态与伪元素、& img、根级 @keyframes，不允许其它全局／嵌套规则、外部 URL、表达式或 --achievement-* 内部标记。保存草稿用“应用 CSS”；不能解析时保留草稿并阻止切换元素／用途。

运行时给目标内容层唯一作用域并为关键帧改名，不写作者 UI 文件。普通根声明以 important 覆盖基础属性；参与关键帧的属性保留动画优先级。文字色彩／字体等同时覆盖原生文字 paint span。hover-only CSS 保留普通静止样式；关闭时移除作用域、样式表并恢复仍由适配器拥有的内联值。CSS 接管 animation/transition 或内置动效对应的 transform/opacity/filter 时只暂停该元素的内置附加动效。减少动画的媒体条件停用 CSS 动画与过渡。CSS 动画不继承内置动效的 loop/enter/hover 设置。

卡片角色 stage 映射到 CSS stageName；自建元素按模板直属基础元素 id 绑定。浮现扩展背景、边框、图标契约到文字及自建基础元素，使用已有唯一 refId 的公开 view.get 连接，element:<id> 仍以资源 id 定位；没有 refId 的自建浮现元素不增强。官方静态模板画布不会显示运行时阶段 CSS，效果在剧情预览核对。背景与边框复用同一底板时共同作用到该内容层，必要时作者拆分元素。显式背景绘制 CSS 替代背后的普通图片层，CSS 边框可替代普通“不显示”或图片边框；素材和普通参数原值保留。
