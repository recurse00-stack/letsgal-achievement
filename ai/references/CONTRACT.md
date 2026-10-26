# 成就插件接口

扩展 mixing-entropy.achievement，模块 main。版本 0.1.1，发行修订 20261026-release.1。SDK 与宿主为 Studio 2.8.0-beta.1；本版直接使用阶段模型，不兼容旧激活接口和 active-only 记录。

## 作者定义

main.levels 为 {id,name}[]，空数组使用铜银金。main.achievements 为 {id,name,description,icon,levelId,initialStageId}[]。description 可空、换行，最多 1000 字符。initialStageId 默认 unknown。编号长期稳定；等级和初始阶段引用必须存在。配置错误拒绝业务写入。

main.defaultStages 是共用阶段数组，不含 achievementId。非空时为完整共用列表，空／未设置时使用内置 hidden/unknown/revealed。

main.displayStages 是成就专用阶段的结构化平面数组，独立配置页在所属成就下方编辑，不另存第二份定义。每项：achievementId、id、name、visible、nameMode、displayName、descriptionMode、description、iconMode、icon、levelMode、levelId、showLevel、showStageName，以及可选 disabled。nameMode／descriptionMode 为 base|custom|none；iconMode 另支持 unknown。base 在界面显示为“使用成就基础配置”，读取所属成就的基础名称、说明或图标，不继承上一阶段；custom 空值不回退到基础内容。阶段配置总行数最多 10000，同一成就的阶段编号唯一，不同成就可重复。解析顺序为共用阶段 → 同 achievementId/id 的完整专用配置；disabled=true 为此成就移除该阶段的标记，不是隐藏阶段。移除标记不产生内容或等级依赖。恢复共用配置删除该专用行；删除共用阶段不删除已有的完整专用行。编辑器新增阶段生成 UUID，不复用已移除身份。未知保存阶段隐藏处理，查询仍返回原编号；外部显式设置到存在的阶段可以恢复。

levelMode 为 base（默认，使用成就基础等级）或 custom（指定本阶段 levelId）；custom 必须引用有效等级。showLevel 只控制玩家是否看到等级，不改变有效等级。旧阶段缺少这两项时按基础等级解释。默认边框和浮现等级跟随有效等级。

方法检查器与运行时复用相同的阶段解析，仅为存在的成就列出其合并后的实际阶段；失效参数仅以说明提示，不插入选项，不自动改参数。变量指定成就时使用编号／变量输入。

配置页的成就区域及各成就条目可折叠，逐项默认收起并提供全部展开／收起。折叠状态仅属编辑器组件，不写玩家记录。基础配置、展示阶段及阶段内的阶段信息、等级与边框、名称显示、说明显示、图标显示、内容预览均可分别折叠，初次显示时收起；玩家界面与浮现动画区域也可折叠。

阶段编辑选择器支持按右键目标编号删除，菜单和按钮共用删除规则；初始阶段、最后可用阶段及失效目标拒绝。专用删除只影响所属成就，共用删除保留已存在的完整专用配置。新成就可自填编号或自动生成，初始阶段优先 unknown，否则选首个实际阶段；已有初始阶段引用仍须有效。

## 运行阶段记录

states：contract letsgal.achievement.states，version ^2.0.0，runtime-write，profile。模板 contractVersion 2.0.0；schema 必需 achievementId:string、stageId:string，附带宿主 id，同一 achievementId 唯一。无记录时使用成就初始阶段。既有记录必须有 stageId，缺少时报错，不根据 active 推断。

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

mixing-entropy.achievement.entries 为 session list，仅提供 id,name,description,icon,iconMode,levelId,levelName,stageId,stageName,frame。白名单投影当前允许内容，隐藏或失效阶段不进入列表、不占页数。stageName 按 showStageName 提供；隐藏等级时 levelId/levelName 为空且使用中性边框；作者 stage-info 仍能读取有效等级。投影不回写运行记录。

内置 ui/achievements.json 与 ui/achievement-popup.json 保留 hiddenInStudio=true，只隐藏方法选择入口，编辑与运行保留。列表来源 ext:mixing-entropy.achievement.entries；名称字段 name、副文字 stageName、图片 icon；说明绑定 {{item.description}}。旧 active/status 绑定不再提供。

浮现可选标识为 achievement-name、achievement-description、achievement-icon、achievement-level、achievement-stage、achievement-label、achievement-frame。label 固定“成就展示已更新”，其余取当前投影。控件缺失兼容，不覆盖作者 hidden/visibleIf、排版或动画。main.notifications 为全局开关；main.durationMs 默认 3000，范围 300–60000。

阶段实际变化且 notify=true、全局开启、当前可见时排一条通知。队列串行，播放前重读当前内容，正在播放时跟随刷新；切到隐藏则关闭。相同阶段不重复通知。浮现失败不回滚阶段记录；游戏结束释放队列和计时器。只记录当前阶段，不补播历史。

作者设置 main.browsePolicy 为 pagination（默认固定翻页）、scroll（固定纵向滚动）、horizontal（固定横向滚动）或 player（允许玩家切换）。固定时隐藏模式按钮，不读写玩家偏好。player 用 main.allowPagination、main.allowVertical、main.allowHorizontal 独立开放模式，默认 true、true、false；只有一种时也隐藏切换按钮。配置页不能关闭最后一种；外部输入全 false 时安全回退翻页。main.browseDefault 支持三种值，默认 pagination；不在开放集合中时选集合首项。重新打开页面应用策略。

浏览偏好 mixing-entropy.achievement.browseMode 为 shared string，默认空字符串；有效值 pagination／scroll／horizontal，不是阶段记录。多选 player 策略优先使用仍被开放的有效选择；空值、未知值或已停用值回退默认，但不自动覆写旧偏好。open-page 绑定 achievement-list 和相应 achievement-mode-pagination／achievement-mode-scroll／achievement-mode-horizontal 按钮。关闭时清理按钮、输入、观察器及临时布局；无 achievement-list 的页面保持自己的行为。直接显示界面不绑定此控制器。


## 验证范围

48 项自动检查、类型和双入口构建通过。Studio 已核对阶段显示与浮现、动态方法选项、共用／专用编辑、折叠及单成就阶段右键删除；新模型未验证独立 Player、普通／快速存读档、冷重开与导出。世界状态未修改，定义自动写作者表、属性组和 Wiki 仍待后续。

横向：保留顶层官方 data-list 的卡片模板，通过公开 setStyle.customCss 和标准 DOM/CSS 实现集合横排、原生横向滚动条、滚轮／横向输入及聚焦后的左右键／Home／End。沿用列表 cols、rows、gap，先填满一列再向右扩展。容器高级 CSS 为模块所有，内部卡片 CSS、样式、动作和数据绑定保持。原生 navigationMode 使用 scroll，不编造方向属性；不旋转整个列表，不克隆或重写卡片渲染器。适配以 2.8.0-beta.1 的 data-visual-ui-scroll-container DOM 为依据；未知结构记录错误并保留原生纵向列表，宿主升级需复核。列表不要放进普通分组，以保留官方卡片模板编辑入口。

browse.3 已在 Studio 2.8.0-beta.1 和其生成的独立桌面 Player 验证三种浏览方式、自制双行卡片、实际滚轮与横向键盘操作；Player 正常退出后冷重开仍采用此前的横向偏好。创作者仅开放两种／一种时的按钮显示与配置保存已在 Studio 验证。
