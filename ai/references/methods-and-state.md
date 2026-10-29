# 方法调用与运行记录

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
