# 资料安装与维护

仅安装、升级或整理本插件资料时读取。普通成就配置不要求先安装、清理旧版本或检查全部发行材料。

## 接到主 Skill

插件 Skill 是版本化知识资料，不是 Agent 插件，也不会启用游戏扩展。有 letsgal-authoring 主 Skill 时，安装到实际用户区 `.letsgal-authoring/plugins/mixing-entropy.achievement/<版本>/`，由 `plugins/INDEX.md` 按需路由；不把插件正文或个人偏好写进公共主 Skill 包。按目标工程的 LETSGAL.md、实际已启用扩展及内部修订选择资料，不默认选目录中最新版本。

没有主 Skill 时才安装到所选 Agent 的技能目录。保留现有 Skill 名称和触发描述；不为重排参考资料另建一个独立入口。本插件的安装不更改工程依赖、运行表绑定或个人偏好。

## 使用随包安装器

在插件完整包根目录运行 `python tools/install-ai.py`，默认只预览；`--apply` 安装 Skill 和离线手册。同版本内容已不同时，核对目标后使用 `--apply --upgrade`，安装器先生成并校验恢复 ZIP；可用 `--backup-dir` 指定恢复目录。仅安装后的知识目录不包含工具，需从插件完整包调用。

`--skills-root` 指定 Agent 技能根，`--user-root` 指定实际用户区。安装器检测所选根中的主 Skill，拒绝链接路径、越界及来源／目标重叠；目标存在额外文件时停止，先保留并核对个人补充，不能为通过安装直接删除。索引更新保留其他插件条目；重复执行相同载荷应无变化。

主 Skill 升级不覆盖此知识包，反向更新此包也不修改主 Skill。需要退出旧资料时先核对实际引用、按精确文件集保全原文并修正索引，再退出活动目录；既有恢复包和其他插件不属于清理目标。

## 维护来源与交付

- 接口、配置和运行边界以同版本源码及 `docs/CONTRACT.md` 为依据；`tools/build-docs.py` 将契约按主题生成 references，覆盖关系与源／产物哈希记在 `reference-manifest.json`。修改契约后运行生成器，不单独编辑生成参考文件。`references/CONTRACT.md` 只保留旧入口导航。
- `ai/SKILL.md` 维护精简任务入口，本维护页维护安装方法；人类手册以 `docs/USER-GUIDE.md` 为源生成 HTML，保持能独立阅读。不要把私有维护日志、个人偏好或成品美术放进公共知识包。
- 自用源码、独立发行源、用户区安装副本职责分开。核对插件主体、Skill 与安装器、人工手册分别是 changed / verified-unchanged / missing；安装文件与发行包按精确清单核对。
- 使用官方 skill-creator 的格式检查，并按受影响任务检查引用、参数和流程。资料重排只验证资料；宿主、Player、存读档及导出范围见 [版本与验证](compatibility.md)。保留真实证据，不因重排资料重标为通过。
- 同一未发布候选保留版本主体与当前内部修订；资料整理不构成发布。GitHub／工坊的外部发布按该次明确授权处理。
