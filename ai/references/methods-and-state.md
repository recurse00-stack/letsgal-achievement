# 方法调用与运行记录

## 运行阶段记录

stageProgress 由 defineSave 声明为 shared/list。初始 [] 表示尚未建立；建立后为 [{schemaVersion:1,records:[{achievementId,stageId}]}]。records 为空也是已建立的进度。成就操作整体替换记录并读回，查询及卡片读取同一来源。

首次正常运行自动建立共享记录，无需选择进度来源或绑定数据表。仅使用 stageProgress，不读取旧数据集合。已建立的共享记录继续读取；结构或版本异常、重复编号会停止写入，失效引用原样保留。读档回放仅重建投影，不初始化或覆盖进度。

只有当前 stageId 是业务状态；没有 active/status 字段、阶段激活标记、等级顺序推断或自动补低级记录。默认 hidden（隐藏）、unknown（未激活）、revealed（已激活）都是普通阶段。已有多余字段不参与查询或写入，新的记录只写成就身份和阶段。

## 方法

`change-stage` 的普通执行与玩家快进在实际获得目标阶段、共享记录写入并读回后，才向可用的 `ctx.steam.achievements.unlock(apiName)` 提交。显式首次获得初始阶段也适用。读档恢复、`runImmediately`、同层或低层被拦截、重复当前阶段、预期不符和仅刷新页面均不会提交。只处理直接获得的目标。Steam 请求异步完成，失败保留本地记录，`queued` 由 SDK 负责重试。未启用分层时，重新切回一个阶段沿用自由切换语义，Steam 已解锁的项目由 SDK 返回 `already-unlocked`。

3.0 中 group-visibility、change-stage、stage-info、refresh 和 notification-mode 声明 performanceSafe，可放入演出段。宿主时间轴不等待调用结果；需要按结果推进剧情时使用普通剧情方法。open-page 留在演出段外，作为等待玩家操作的模态页。回放重建跳过已关闭的页面；后续真实调用使用该次调用的读写接口。

| localType | 参数 | 返回／作用 |
| --- | --- | --- |
| change-stage | achievementId:string, stageId:string, notify:boolean=true, expectedStageId:string='' | 无返回；目标切换，预期不符整项跳过，重复阶段不通知 |
| stage-info | achievementId:string, field:stageId/stageName/levelId/levelName='stageId' | string；读取当前阶段或有效等级 |
| open-page | 无 | 刷新并打开作者选择的页面 |
| group-visibility | groupId:string, visible:boolean | 设置分组入口显示或隐藏；解锁及目前显隐通过 shared/list groupVisibility 保存 |
| refresh | 无 | 只刷新投影，正常操作自动执行 |
| notification-mode | action:read/toggle/sequential/merged/default='read' | string；返回当前 sequential/merged。开放玩家切换后可保存偏好；default 清除偏好 |

全局类型为 mixing-entropy.achievement/localType。剧情 paramsJson 用 {kind:'lit',value:...} 或变量绑定；UI ext.call 用裸参数。读取返回固定 string，If 用文本比较。先验证目标再检查预期；未分层时同阶段首次操作仍固化初始值但不通知。已分层时，缺少成就记录表示首次获得；已有记录时只允许更高层。方法 skip/runImmediately 静默更新；恢复回放 isRestoring 跳过写入和通知、仅刷新。

自定义成就／阶段选择器显示 useParam 的 isInvalid、reason 和 rawValue；无效的可选 expectedStageId 也保持可见。不得在挂载、展开或切换入口时自动修复。仅明确选择才写入，setter 返回 false 时提示并保留原参数；明确选回无效参数所显示的默认值时用 setValue(undefined) 清除原值，避免原样写回被当作无操作。变量参数交给 ParamField，readOnly 时禁用选择。编号输入文案跟随 useInspectorEnvironment().canUseVariables：界面点击动作仅提示固定编号，允许变量的入口保留编号／变量文案。

旧 activate/deactivate/is-active/set-display-stage/get-display-stage/operate/read-info 已移除。旧剧情必须替换，不能再依赖旧布尔返回。旧数据集合记录不自动迁移到扩展存档。
