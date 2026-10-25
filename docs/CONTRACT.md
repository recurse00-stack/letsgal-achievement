# 成就最简版接口

扩展 mixing-entropy.achievement，模块 main，版本 0.1.0。依赖 LetsGal Studio 2.8.0-beta.1 官方 SDK；稳定版和其他 Beta 未实测。

定义：main.levels 为 {id,name}[]，空数组使用 bronze/silver/gold；main.achievements 为 {id,name,icon,levelId}[]。编号稳定，引用等级必须存在。配置校验失败时拒绝状态写入。

状态依赖 states：contract letsgal.achievement.states，version ^1.0.0，access runtime-write；autoCreate 提供 contractVersion 1.0.0、runtimePolicy profile、两列 schema 和空 documents。行 {id,achievementId,active}，id 由宿主生成，achievementId 唯一。同一玩家档案跨存档共享；读旧档及新开游戏不回退，deactivate 明确修改共享事实。现存 session/archive 绑定不静默改动，接入前应通过官方面板重新建立 profile 绑定，保留旧表。

方法：mixing-entropy.achievement/activate、deactivate、is-active 均带字符串 achievementId；is-active 返回 boolean。open-page、refresh 无参数。脚本 paramsJson 每项为 {kind:"lit",value:...}；可视化 UI 的 ext.call 使用裸参数。

界面投影 mixing-entropy.achievement.entries 是 session list，源自配置与 states。每项含 id,name,icon,levelId,levelName,active,status,frame。通过 this.save 更新；不把临时投影当权威记录，不用世界状态变量镜像事实。

成就页 UI 数据来源 ext:mixing-entropy.achievement.entries。浮现控制器通过 achievement-name、achievement-level、achievement-icon 填值，可选 achievement-frame 改等级边框。UI 设置采用 ui:项目文件或 ui:@扩展/文件；不接受程序 UI 或槽位。

作者设置 main.browsePolicy 为 pagination（默认固定翻页）、scroll（固定纵向滚动）、horizontal（固定横向滚动）或 player（允许玩家切换）。固定时隐藏模式按钮，不读写玩家偏好。player 用 main.allowPagination、main.allowVertical、main.allowHorizontal 独立开放模式，默认 true、true、false；只有一种时也隐藏切换按钮。配置页不能关闭最后一种；外部输入全 false 时安全回退翻页。main.browseDefault 支持三种值，默认 pagination；不在开放集合中时选集合首项。重新打开页面应用策略。

浏览偏好 mixing-entropy.achievement.browseMode 为 shared string，默认空字符串；有效值 pagination／scroll／horizontal，不是激活事实。多选 player 策略优先使用仍被开放的有效选择；空值、未知值或已停用值回退默认，但不自动覆写旧偏好。open-page 绑定 achievement-list 和相应 achievement-mode-pagination／achievement-mode-scroll／achievement-mode-horizontal 按钮。关闭时清理按钮、输入、观察器及临时布局；无 achievement-list 的页面保持自己的行为。直接显示界面不绑定此控制器。

每轮运行按 flow.signal 隔离写队列和通知队列；幂等激活无通知，取消后再次激活可通知。isRestoring 时跳过写入结算；skip/runImmediately 激活只变状态。持久状态写入成功后才发布新视图及通知；通知错误不回滚状态。

适用范围：Studio 2.8.0-beta.1 与其生成的独立桌面 Player。profile 模板支持激活去重和读取旧档不回退。作品的公开发行导出、Web/Android 与其他宿主版本尚未验证。

当前编辑期定义仍采用扩展设置。自动写官方作者表、自定义属性组、属性查询与 Wiki 接入尚未实现；公开 Studio UI Kit 未提供作者表读写入口，运行 DatabaseAPI 与 Agent MCP 均不能作为配置页的替代接口。

横向：保留顶层官方 data-list 的卡片模板，通过公开 setStyle.customCss 和标准 DOM/CSS 实现集合横排、原生横向滚动条、滚轮／横向输入及聚焦后的左右键／Home／End。沿用列表 cols、rows、gap，先填满一列再向右扩展。容器高级 CSS 为模块所有，内部卡片 CSS、样式、动作和数据绑定保持。原生 navigationMode 使用 scroll，不编造方向属性；不旋转整个列表，不克隆或重写卡片渲染器。适配以 2.8.0-beta.1 的 data-visual-ui-scroll-container DOM 为依据；未知结构记录错误并保留原生纵向列表，宿主升级需复核。列表不要放进普通分组，以保留官方卡片模板编辑入口。

browse.3 已在 Studio 2.8.0-beta.1 和其生成的独立桌面 Player 验证三种浏览方式、自制双行卡片、实际滚轮与横向键盘操作；Player 正常退出后冷重开仍采用此前的横向偏好。创作者仅开放两种／一种时的按钮显示与配置保存已在 Studio 验证。
