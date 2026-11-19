# 成就、阶段与表现配置

## 作者定义

`main.steamAchievements` 是可选关联列表，行结构为 `{achievementId, stageId, apiName}`。工作台按成就与阶段编号这一对键保存或清除一条关联。API Name 区分大小写，录入时去除首尾空白。各成就独立设置，绑定共用阶段无需覆盖其展示内容。

main.groupCatalog 用同一结构化列表保存 group、member、binding 三种带稳定 id 的行。group 提供初始 visible、order、可选 level/card/popup；member 引用 group 和 achievement，order 表示组内顺序；binding 按 achievement 保存逐项来源 levelGroup/cardGroup/popupGroup 或直接引用。移出来源组时同批解除并固化引用。main.allowGroupFilter 默认关闭。main.stageTiers 的每项是 {achievementId,stageId,tier}，正整数同值表示同层；未配置层级的成就沿用原行为。已分层成就中，当前可用且缺行的阶段依次追加到各自的新最高层。编辑阶段前保留既有顺序，恢复同编号沿用已记录的层级。

成就、阶段及表现定义存于官方扩展结构化设置。方法检查器和独立配置页读取同一份定义。世界状态负责外部条件、监听和宏。

main.levels 为 {id,name,appearanceId?,popupAppearanceId?}[]，空数组使用铜银金。appearanceId 关联通用卡片方案，popupAppearanceId 关联通用浮现方案。main.achievements 为 {id,name,description,icon,levelId,initialStageId}[]。description 可空、换行，最多 1000 字符。initialStageId 默认 unknown。编号长期稳定；等级和初始阶段引用必须存在。配置错误拒绝业务写入。

main.defaultStages 是共用阶段数组，不含 achievementId。非空时为完整共用列表，空／未设置时使用内置 hidden/unknown/revealed。

main.displayStages 是成就专用阶段的结构化平面数组，独立配置页在所属成就下方编辑，不另存第二份定义。每项：achievementId、id、name、visible、nameMode、displayName、descriptionMode、description、iconMode、icon、levelMode、levelId、showLevel、showStageName，以及可选 disabled。nameMode／descriptionMode 为 base|custom|none；iconMode 另支持 unknown。base 在界面显示为“使用成就基础配置”，读取所属成就的基础名称、说明或图标，不继承上一阶段；custom 空值不回退到基础内容。阶段配置总行数最多 10000，同一成就的阶段编号唯一，不同成就可重复。解析顺序为共用阶段 → 同 achievementId/id 的完整专用配置；disabled=true 为此成就移除该阶段的标记，不是隐藏阶段。移除标记不产生内容或等级依赖。恢复共用配置删除该专用行；删除共用阶段不删除已有的完整专用行。编辑器新增阶段生成 UUID，不复用已移除身份。未知保存阶段隐藏处理，查询仍返回原编号；外部显式设置到存在的阶段可以恢复。

levelMode 为 base（默认，使用成就基础等级）或 custom（指定本阶段 levelId）；custom 必须引用有效等级。showLevel 只控制玩家是否看到等级，不改变有效等级。旧阶段缺少这两项时按基础等级解释。默认边框和浮现等级跟随有效等级。

方法检查器与运行时复用相同的阶段解析，仅为存在的成就列出其合并后的实际阶段；失效参数仅以说明提示，不插入选项，不自动改参数。变量指定成就时使用编号／变量输入。

配置页采用成就／属性配置／界面与浮现工作台。对象列表每页 50 项，搜索不改变选择；阶段始终使用选择块，超过 8 个默认单行，旁侧展开／收起，展开后可搜索。收起时保持当前选中阶段可见；初始阶段标记和右键移除保护不变。顶部独立缩放范围 75%—150%，默认与还原值 100%；只作用于工作台内容，控制条保持原大小。缩放、折叠、导航、选择与草稿只在本次编辑器会话保留，不进入配置或玩家记录。

编辑器通过官方 useSetting/useParam 提交。文本、数值、CSS 约 500ms 去抖，失焦尝试提交；无效或被拒绝的输入保留为本次会话草稿。同字段外部更新暂停自动写入，明确核对后解决；对不同字段的更新合并以避免覆盖。正常状态仅显示“自动保存”，异常时显示草稿、拒绝或冲突；SDK 接受提交不等于磁盘保存完成。

阶段块支持右键目标删除，按钮与菜单共用保护；初始／最后阶段受保护。专用删除只影响所属成就，共用删除保留完整专用配置。新建编号可自填或自动生成，已有稳定编号不改。

等级、方案、成就、规则、优先值和元素 CSS 通过对象列表或当前编辑区提供右键及可见移除操作。菜单调用原删除保护；方案清理精确 CSS owner，失败尝试恢复；成就删除仍需确认。文本输入保留原生菜单。

成就旁“查看关联图”打开只读关系图，初始布局以成就为中心向外放射。关系使用 resolveStages／resolvePresentation／materializePresentation／presentationPreset 的实际结果，按稳定身份合并共用阶段、等级、方案和界面。普通滚轮继续滚动工作台；图内 Ctrl＋滚轮以非被动事件阻止默认滚动／宿主缩放，只改变图视角。节点可拖动并带衰减弹簧牵引；单击显示摘要，双击或 Enter 定位已有编辑器。返回关联图保留视角、位置、展开和选择；它们只在 EditorSession 中保存，不进入设置或存档。概览中，完整沿用的阶段只连一个共用默认阶段；有专用内容、表现或 CSS 的阶段直接连接卡片、等级、浮现。默认阶段按需展开这三部分，三部分再按需展开方案、模板和界面；展开状态使用稳定节点身份保存。混合覆盖逐部分标记来源；专用阶段保留自身内容时不误标成实时沿用。默认等级为基础等级时，显示当前参考成就的解析结果。阶段每组 50 个，反向引用每页 20 个；收起来源不留下孤立反查节点。无输出的表现仍保留配置连线，并明确标记不输出。

图中界面／模板双击进入只读引用详情及官方编排路径；UIRefPicker 展示实际引用。当前 Studio UI 3.0.0 未提供打开指定官方画布的编辑期 API，不通过 DOM 或私有宿主接口绕过。图中恢复布局只改变临时坐标，不恢复任何业务配置；双击定位不修改参数或玩家记录。

## 阶段表现与界面分层

工作台顶部为成就、属性配置、界面与浮现。属性区含等级与默认阶段；界面区含成就页、卡片、浮现。卡片方案及模板尺寸归卡片；播放规则、合并汇总及浮现方案归浮现。每个设置一个主入口，引用处摘要与来源跳转，并可返回原选择。配置键、运行结构与继承算法不变。

界面文案以当前操作为准：对象、来源与范围已经明确时省去重复解释；会影响操作结果的共用修改范围、初始阶段影响、未保存草稿、拒绝、冲突和删除保护继续提示。保存落盘机制、阶段继承与通知去重等完整说明集中在人工指南，不在正常状态栏重复展示。

main.stagePresentations 是最多 10000 项的结构化平面数组，键为 achievementId + stageId + surface。achievementId 为空表示默认阶段；surface=card|popup；mode=custom|inherit。custom 行保存 contentOverride、enabled、nameMode/displayName、descriptionMode/description、iconMode/icon、showLevel、showStageName、ui、durationMs，以及原有外观与引用字段。内容模式 stage|custom|none，icon 另支持 unknown；stage 读取当前阶段基础内容，不读取另一种表现的专用内容。contentOverride=false 时沿用本阶段内容及所选方案显示规则；true 时整组内容规则使用本处专用值。已有未标记的专用行保留其内容规则。ui 为空、durationMs=0 优先沿用所选通用方案，再回退 main.popup/main.durationMs；自定时长 300～60000 毫秒。

每个 surface 单独解析：本成就 custom → 同阶段默认 custom → 原有阶段外观与显示配置。inherit 行明确跳过本成就旧外观，回到默认阶段表现。未指定专用外观时读取本组默认方案；已有明确专用外观不被覆盖。配置页修改某一表现不创建／覆盖 displayStages；恢复某一表现仅重置它的行和对应 CSS，原 both CSS 转存到另一 surface，避免误删另一表现。阶段基本信息、名称、说明、图标及等级的专用行仍独立维护。阶段移除后其表现配置不参与投影；只保存 stageId，不迁移玩家记录。

entries 只投影卡片内容，popupUI/popupDurationMs 不输出到 entries；运行另建只含当前阶段允许内容的浮现投影。卡片 enabled 决定是否生成卡片；浮现 enabled 决定是否允许阶段切换通知。它们与阶段名称无关。通用方案引用的删除保护同时检查默认选择、等级和阶段表现配置。

真实阶段变化且 notify=true、全局允许、目标浮现 enabled 时入队；队列携带目标 stageId，播放前再次读当前阶段，过期请求丢弃。正在播放时阶段、界面或时长变化会结束旧实例，不自动重播；同阶段内容／外观改动可更新现有实例。notifications 关闭会结束正在播放的实例。ui 选择器使用官方 UIRefPicker；普通布局与进退场仍由原生 UI 控制。不存在界面导致播放失败时保留已写入阶段记录并报告错误。
