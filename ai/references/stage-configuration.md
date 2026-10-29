# 成就、阶段与表现配置

## 作者定义

定义保存在扩展结构化设置，运行记录在官方 profile 表。配置页自动写作者表、完整属性组和业务 Wiki 尚未实现；离线使用手册不是该业务 Wiki。条件、监听和宏由世界状态负责，本插件只提供成就操作；不以 Agent MCP 写表代替插件自身同步能力。

main.levels 为 {id,name,appearanceId?,popupAppearanceId?}[]，空数组使用铜银金。appearanceId 关联通用卡片方案，popupAppearanceId 关联通用浮现方案。main.achievements 为 {id,name,description,icon,levelId,initialStageId}[]。description 可空、换行，最多 1000 字符。initialStageId 默认 unknown。编号长期稳定；等级和初始阶段引用必须存在。配置错误拒绝业务写入。

main.defaultStages 是共用阶段数组，不含 achievementId。非空时为完整共用列表，空／未设置时使用内置 hidden/unknown/revealed。

main.displayStages 是成就专用阶段的结构化平面数组，独立配置页在所属成就下方编辑，不另存第二份定义。每项：achievementId、id、name、visible、nameMode、displayName、descriptionMode、description、iconMode、icon、levelMode、levelId、showLevel、showStageName，以及可选 disabled。nameMode／descriptionMode 为 base|custom|none；iconMode 另支持 unknown。base 在界面显示为“使用成就基础配置”，读取所属成就的基础名称、说明或图标，不继承上一阶段；custom 空值不回退到基础内容。阶段配置总行数最多 10000，同一成就的阶段编号唯一，不同成就可重复。解析顺序为共用阶段 → 同 achievementId/id 的完整专用配置；disabled=true 为此成就移除该阶段的标记，不是隐藏阶段。移除标记不产生内容或等级依赖。恢复共用配置删除该专用行；删除共用阶段不删除已有的完整专用行。编辑器新增阶段生成 UUID，不复用已移除身份。未知保存阶段隐藏处理，查询仍返回原编号；外部显式设置到存在的阶段可以恢复。

levelMode 为 base（默认，使用成就基础等级）或 custom（指定本阶段 levelId）；custom 必须引用有效等级。showLevel 只控制玩家是否看到等级，不改变有效等级。旧阶段缺少这两项时按基础等级解释。默认边框和浮现等级跟随有效等级。

方法检查器与运行时复用相同的阶段解析，仅为存在的成就列出其合并后的实际阶段；失效参数仅以说明提示，不插入选项，不自动改参数。变量指定成就时使用编号／变量输入。

配置页的成就区域及各成就条目可折叠，逐项默认收起并提供全部展开／收起。折叠状态仅属编辑器组件，不写玩家记录。基础配置、展示阶段、阶段信息、阶段等级、本阶段内容和阶段表现可折叠；名称、说明与图标先显示沿用摘要，点击单独设置才展开。卡片／浮现只展开明确请求的内容、外观或时长控件，展开不写配置。

阶段编辑选择器支持按右键目标编号删除，菜单和按钮共用删除规则；初始阶段、最后可用阶段及失效目标拒绝。右键菜单锚定目标选项，打开和删除时保留列表展开；Esc 先关闭菜单，外部交互收起列表。选项使用浅边框，范围提示使用较小字号。专用删除只影响所属成就，共用删除保留已存在的完整专用配置。新成就可自填编号或自动生成，初始阶段优先 unknown，否则选首个实际阶段；已有初始阶段引用仍须有效。

## 阶段表现与界面分层

配置页顶层为成就管理、通用配置、界面与播放。阶段表现内并列卡片展示与阶段浮现，均使用官方模板编排；阶段内容是两者共同的默认内容，不与上一运行阶段发生继承。

main.stagePresentations 是最多 10000 项的结构化平面数组，键为 achievementId + stageId + surface。achievementId 为空表示默认阶段；surface=card|popup；mode=custom|inherit。custom 行保存 contentOverride、enabled、nameMode/displayName、descriptionMode/description、iconMode/icon、showLevel、showStageName、ui、durationMs，以及原有外观与引用字段。内容模式 stage|custom|none，icon 另支持 unknown；stage 读取当前阶段基础内容，不读取另一种表现的专用内容。contentOverride=false 时沿用本阶段内容及所选方案显示规则；true 时整组内容规则使用本处专用值。已有未标记的专用行保留其内容规则。ui 为空、durationMs=0 优先沿用所选通用方案，再回退 main.popup/main.durationMs；自定时长 300～60000 毫秒。

每个 surface 单独解析：本成就 custom → 同阶段默认 custom → 原有阶段外观与显示配置。inherit 行明确跳过本成就旧外观，回到默认阶段表现。未指定专用外观时读取本组默认方案；已有明确专用外观不被覆盖。配置页修改某一表现不创建／覆盖 displayStages；恢复某一表现仅重置它的行和对应 CSS，原 both CSS 转存到另一 surface，避免误删另一表现。阶段基本信息、名称、说明、图标及等级的专用行仍独立维护。阶段移除后其表现配置不参与投影；只保存 stageId，不迁移玩家记录。

entries 只投影卡片内容，popupUI/popupDurationMs 不输出到 entries；运行另建只含当前阶段允许内容的浮现投影。卡片 enabled 决定是否生成卡片；浮现 enabled 决定是否允许阶段切换通知。它们与阶段名称无关。通用方案引用的删除保护同时检查默认选择、等级和阶段表现配置。

真实阶段变化且 notify=true、全局允许、目标浮现 enabled 时入队；队列携带目标 stageId，播放前再次读当前阶段，过期请求丢弃。正在播放时阶段、界面或时长变化会结束旧实例，不自动重播；同阶段内容／外观改动可更新现有实例。notifications 关闭会结束正在播放的实例。ui 选择器使用官方 UIRefPicker；普通布局与进退场仍由原生 UI 控制。不存在界面导致播放失败时保留已写入阶段记录并报告错误。
