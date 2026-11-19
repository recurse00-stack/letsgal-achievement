import { Extension, extension, settings, defineSave, type ArrayItemBuilder } from '@avg-studio/sdk';
import { MAX_TIER, type GroupVisibility } from './groups';
import { type Entry } from './model';
import type { ProgressEnvelope } from './stage-progress';
import { controller, PAGE, POPUP, SUMMARY } from './runtime';
import { publishNotificationPreference } from './notification-policy';
import { appearanceFields } from './card-schema';

const stageFields = (i: ArrayItemBuilder) => ({
  ...appearanceFields(i),
  appearanceSource: i.enum('外观配置', ['local', 'preset', 'level', 'default', 'global'] as const).default('local'),
  appearanceId: i.string('共用外观编号').default(''),
  overrideBackground: i.boolean('单独配置背景').default(false),
  overrideFrame: i.boolean('单独配置边框').default(false),
  overrideEffects: i.boolean('单独配置动效').default(false),
  id: i.string('阶段编号'), name: i.string('阶段名称'),
      visible: i.boolean('显示卡片与浮现').default(true),
      nameMode: i.enum('名称显示方式', ['base', 'custom', 'none'] as const).labels({ base: '使用成就基础配置', custom: '本阶段自定义', none: '不显示' }).default('none')
        .describe('使用成就基础配置时，读取上方成就配置中的名称，不继承上一阶段。'),
      displayName: i.string('阶段显示名称').default(''),
      descriptionMode: i.enum('说明显示方式', ['base', 'custom', 'none'] as const).labels({ base: '使用成就基础配置', custom: '本阶段自定义', none: '不显示' }).default('none')
        .describe('使用成就基础配置时，读取上方成就配置中的说明，不继承上一阶段。'),
      description: i.string('阶段说明').default('').multiline(),
      iconMode: i.enum('图标显示方式', ['base', 'custom', 'unknown', 'none'] as const).labels({ base: '使用成就基础配置', custom: '本阶段自定义', unknown: '默认未知图标', none: '不显示' }).default('none')
        .describe('使用成就基础配置时，读取上方成就配置中的图标，不继承上一阶段。'),
      icon: i.asset('阶段图标').accepts('image'),
      levelMode: i.enum('本阶段等级', ['base', 'custom'] as const).labels({ base: '使用成就基础等级', custom: '指定本阶段等级' }).default('base'),
      levelId: i.string('阶段等级编号').default(''),
      showLevel: i.boolean('展示等级').default(false), showStageName: i.boolean('向玩家显示阶段名称').default(false),
});

// Disposable player projection. Only the current stage is a runtime fact.
const viewSave = defineSave({
  groupVisibility: { type: 'list', persistence: 'shared', default: [] as GroupVisibility[], label: '分组解锁与显隐' },
  stageProgress: { type: 'list', persistence: 'shared', default: [] as ProgressEnvelope[], label: '玩家当前成就阶段' },
  entries: { type: 'list', persistence: 'session', default: [] as Entry[], label: '成就界面数据（自动重建）' },
  browseMode: { type: 'string', persistence: 'shared', default: '', label: '成就浏览选择' },
  notificationPreference: { type: 'string', persistence: 'shared', default: '', label: '玩家浮现方式选择' },
  notificationMode: { type: 'string', persistence: 'session', default: 'sequential', label: '当前浮现方式' },
  notificationModeLabel: { type: 'string', persistence: 'session', default: '连续浮现', label: '当前浮现方式名称' },
  notificationCanSwitch: { type: 'boolean', persistence: 'session', default: false, label: '允许玩家切换浮现方式' },
  notificationEntries: { type: 'list', persistence: 'session', default: [] as Entry[], label: '本批汇总成就（仅当前允许内容）' },
  notificationCount: { type: 'number', persistence: 'session', default: 0, label: '本批汇总成就数量' },
});
@extension({ id: 'main', label: '成就', exposeUI: false })
export default class AchievementExtension extends Extension.withSave(viewSave) {
  static onRegister(ctx: import('@avg-studio/sdk').ExtensionContext) {
    publishNotificationPreference(key => ctx.settings.get(key), {
      get: key => ctx.variables.get('mixing-entropy.achievement.' + key),
      set: (key, value) => ctx.variables.set('mixing-entropy.achievement.' + key, value),
    });
  }
  static settings = settings(s => ({
    allowGroupFilter: s.boolean('允许玩家按分组筛选').default(false),
    groupCatalog: s.array('分组与成员', i => ({
      id:i.string('记录编号'), kind:i.enum('记录类型',['group','member','binding'] as const),
      name:i.string('组名').default(''), visible:i.boolean('初始显示').default(true), order:i.number('顺序').default(0),
      group:i.string('所属组').default(''), achievement:i.string('所属成就').default(''),
      level:i.string('等级').default(''), card:i.string('卡片方案').default(''), popup:i.string('浮现方案').default(''),
      levelGroup:i.string('等级来源组').default(''), cardGroup:i.string('卡片来源组').default(''), popupGroup:i.string('浮现来源组').default(''),
    })).maxItems(50000),
    stageTiers: s.array('阶段层级', i => ({ achievementId:i.string('成就编号'), stageId:i.string('阶段编号'), tier:i.number('层级').range(1,MAX_TIER) })).maxItems(50000),
    steamAchievements: s.array('展示阶段关联的 Steam 成就', i => ({
      achievementId: i.string('成就编号'), stageId: i.string('阶段编号'), apiName: i.string('Steamworks API Name'),
    })).maxItems(50000),
    stagePresentations: s.array('阶段表现', i => ({
      achievementId: i.string('成就编号；空值为默认阶段').default(''), stageId: i.string('阶段编号'),
      surface: i.enum('使用位置', ['card', 'popup'] as const), mode: i.enum('配置方式', ['custom', 'inherit'] as const).default('custom'),
      enabled: i.boolean('启用').default(true), contentOverride: i.boolean('单独设置本处内容').default(true),
      nameMode: i.enum('名称显示方式', ['stage', 'custom', 'none'] as const).default('stage'), displayName: i.string('显示名称').default(''),
      descriptionMode: i.enum('说明显示方式', ['stage', 'custom', 'none'] as const).default('stage'), description: i.string('说明').default('').multiline(),
      iconMode: i.enum('图标显示方式', ['stage', 'custom', 'none', 'unknown'] as const).default('stage'), icon: i.asset('图标').accepts('image'),
      showLevel: i.boolean('显示等级').default(false), showStageName: i.boolean('显示阶段名称').default(false),
      ui: i.string('浮现界面；空值沿用全局').default(''), durationMs: i.number('时长；0沿用全局').default(0).range(0, 60000),
      ...appearanceFields(i), appearanceSource: i.enum('外观配置', ['local', 'preset', 'level', 'default', 'global'] as const).default('local'),
      appearanceId: i.string('共用外观编号').default(''), overrideBackground: i.boolean('单独配置背景').default(false),
      overrideFrame: i.boolean('单独配置边框').default(false), overrideEffects: i.boolean('单独配置动效').default(false),
    })).maxItems(10000).describe('按成就、阶段、卡片或浮现分别保存；由阶段表现编辑器维护。'),
    elementCss: s.array('元素进阶 CSS', i => ({
      id: i.string('配置编号'), ownerKind: i.enum('所属类型', ['appearance', 'defaultStage', 'stage'] as const),
      ownerId: i.string('外观或阶段编号'), achievementId: i.string('成就编号').default(''),
      target: i.string('元素'), surface: i.enum('使用位置', ['both', 'card', 'popup'] as const).default('both'),
      css: i.string('CSS').default('').multiline(), replace: i.boolean('替换上级 CSS').default(false),
    })).maxItems(10000).describe('由共用外观与阶段的元素进阶 CSS 编辑器维护，按元素与使用位置保存。'),
    appearances: s.array('通用表现方案', i => ({ id: i.string('方案编号'), name: i.string('方案名称'),
      surface: i.enum('使用位置', ['card', 'popup'] as const).default('card'), isDefault: i.boolean('本组默认方案').default(false),
      nameMode: i.enum('名称', ['stage', 'none'] as const).default('stage'), descriptionMode: i.enum('说明', ['stage', 'none'] as const).default('stage'),
      iconMode: i.enum('图标', ['stage', 'none', 'unknown'] as const).default('stage'),
      levelVisibility: i.enum('等级显示', ['stage', 'show', 'hide'] as const).default('stage'), stageNameVisibility: i.enum('阶段名显示', ['stage', 'show', 'hide'] as const).default('stage'),
      ui: i.string('浮现界面').default(''), durationMs: i.number('浮现时长').default(0).range(0,60000), ...appearanceFields(i) }))
      .maxItems(10000).table({ titleField: 'name', columns: ['id'] }),
    levels: s.array('等级', i => ({ id: i.string('等级编号'), name: i.string('等级名称'), appearanceId: i.string('通用卡片方案编号').default(''), popupAppearanceId: i.string('通用浮现方案编号').default('') }))
      .addLabel('添加等级').emptyHint('未配置时使用 bronze 铜、silver 银、gold 金。')
      .maxItems(10000).table({ titleField: 'name', columns: ['id'] }),
    achievements: s.array('成就', i => ({
      id: i.string('成就编号').describe('唯一且长期稳定，例如 first_step；改名时保留此编号。'),
      name: i.string('名称'),
      description: i.string('说明').default('').multiline().describe('可留空，最多 1000 字符。例如：故事从此时开始。卡片与浮现共用此内容；可在各自 UI 中隐藏或自由排版。'),
      icon: i.asset('图标').accepts('image'),
      levelId: i.string('等级编号').default('bronze'),
      initialStageId: i.string('初始展示阶段编号').default('unknown').describe('在此成就下方的“展示阶段”选择。尚无记录时使用，默认未激活；之后由方法块切换。'),
    })).addLabel('添加成就').emptyHint('添加第一个成就。').maxItems(10000)
      .table({ titleField: 'name', imageField: 'icon', columns: ['id', 'levelId'] }),
    defaultStages: s.array('默认阶段配置', stageFields).maxItems(10000).table({ titleField: 'name', columns: ['id'] })
      .emptyHint('未配置时使用隐藏、未激活、已激活三个默认阶段。'),
    displayStages: s.array('成就专用阶段配置', i => ({
      achievementId: i.string('成就编号'), ...stageFields(i), disabled: i.boolean('此成就不使用该阶段').default(false),
    })).maxItems(10000).table({ titleField: 'name', columns: ['achievementId', 'id'] }),
    page: s.uiRef('成就页').default('ui:' + PAGE).describe('可视化界面引用：项目界面文件名，或 @扩展编号/文件名。'),
    cardSizeReference: s.array('最近卡片尺寸参考（自动测量）', i => ({
      page: i.string('页面'), mode: i.string('浏览方式'), measuredAt: i.number('测量时间'),
      width: i.number('建议画布宽度'), height: i.number('建议画布高度'),
      contentWidth: i.number('内容宽度'), contentHeight: i.number('内容高度'),
      gridWidth: i.number('网格宽度'), gridHeight: i.number('网格高度'),
      cols: i.number('列数'), rows: i.number('行数'), gap: i.number('间距'),
      listWidth: i.number('列表宽度'), listHeight: i.number('列表高度'),
      templateWidth: i.number('原画布宽度'), templateHeight: i.number('原画布高度'),
    })).maxItems(1).describe('预览自动生成的尺寸参考；不用于控制页面或卡片尺寸。'),
    scrollDirection: s.enum('滚动方向', ['vertical', 'horizontal'] as const)
      .labels({ vertical: '从上到下', horizontal: '从左到右' }).default('vertical')
      .describe('仅当官方成就列表开启“滚动模式”时决定默认方向；不会把翻页改成滚动。'),
    allowPlayerSwitch: s.boolean('允许玩家切换浏览方式').default(false)
      .describe('关闭时始终使用官方页面的默认方式并隐藏切换按钮；开启后可额外开放其他方式。'),
    allowPagination: s.boolean('额外开放翻页').default(false).enabledWhen('allowPlayerSwitch', true),
    allowVertical: s.boolean('额外开放纵向滚动').default(false).enabledWhen('allowPlayerSwitch', true),
    allowHorizontal: s.boolean('额外开放横向滚动').default(false).enabledWhen('allowPlayerSwitch', true),
    popup: s.uiRef('默认浮现界面').default('ui:' + POPUP).describe('可编辑默认浮现界面，或填写自己的可视化界面引用。'),
    notifications: s.boolean('允许播放阶段浮现').default(true),
    durationMs: s.number('默认浮现时长（毫秒）').default(3000).range(300, 60000).step(100),
    notificationMode: s.enum('默认浮现方式', ['sequential', 'merged'] as const).labels({ sequential: '连续浮现', merged: '合并浮现' }).default('sequential'),
    allowNotificationModeSwitch: s.boolean('允许玩家切换浮现方式').default(false).describe('开放后可在自制设置页调用“浮现方式”方法；玩家选择跨存档保留。'),
    notificationWindowMs: s.number('批次收集时间（毫秒）').default(500).range(50, 5000).step(50).describe('先收集再播放；首条也等待。收集期间不延长窗口，封批后的通知进入下一批。'),
    notificationDurationPercent: s.number('连续浮现停留时长比例（%）').default(67).range(10, 100).step(1),
    notificationSort: s.array('浮现属性排序', i => ({ field: i.enum('比较属性', ['level', 'stage', 'achievement'] as const), value: i.string('优先值编号；空值保留空规则').default('') })).maxItems(30000).describe('按属性首次出现顺序比较；同属性按值的行序优先，未列出值并列靠后。由独立设置页编排。'),
    summaryUI: s.uiRef('汇总浮现界面').default('ui:' + SUMMARY),
    summaryDurationMs: s.number('汇总停留时长（毫秒）').default(3000).range(300, 60000).step(100),
  }));
  static groupVisibility = this.method({
    performanceSafe: true,
    id:'group-visibility', title:'设置分组可见性', schema:{groupId:{type:'string',label:'分组',required:true},visible:{type:'boolean',label:'显示分组',default:true}},
    async run(ctx,p) { await controller(ctx,this.save).setGroupVisible(p.groupId,p.visible); },
    async skip(ctx,p) { await controller(ctx,this.save).setGroupVisible(p.groupId,p.visible); },
    async runImmediately(ctx,p) { await controller(ctx,this.save).setGroupVisible(p.groupId,p.visible); },
  });
  static changeStage = this.method({
    performanceSafe: true,
    id: 'change-stage', title: '成就操作', description: '先选成就，再选择目标展示阶段。可选预期当前阶段与浮现；按层级获得时只向更高层推进；同层先到者保留。',
    schema: {
      achievementId: { type: 'string', label: '成就', required: true },
      stageId: { type: 'string', label: '目标展示阶段', required: true },
      notify: { type: 'boolean', label: '切换时浮现', default: true },
      expectedStageId: { type: 'string', label: '仅在此阶段执行（留空不限制）', default: '' },
    },
    async run(ctx, p) { await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, p.notify, ctx.steam); },
    async skip(ctx, p) { await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, false, ctx.steam); },
    async runImmediately(ctx, p) { await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, false); },
  });
  static stageInfo = this.method({
    performanceSafe: true,
    id: 'stage-info', title: '读取成就信息', description: '读取当前展示阶段或其等级；统一返回文本。阶段名称与金银铜名称不产生额外状态判断。',
    returns: { type: 'string', label: '所选信息（文本）' },
    schema: {
      achievementId: { type: 'string', label: '成就', required: true },
      field: { type: 'enum', label: '读取什么', default: 'stageId', options: [{ value: 'stageId', label: '当前阶段编号' }, { value: 'stageName', label: '当前阶段名称' }, { value: 'levelId', label: '当前等级编号' }, { value: 'levelName', label: '当前等级名称' }] },
    },
    async run(ctx, p) { return controller(ctx, this.save).readInfo(p.achievementId, p.field); },
  });
  static openPage = this.method({
    id: 'open-page', title: '打开成就页', description: '重建界面数据，然后打开作者选择的成就页。',
    async run(ctx) {
      if (!ctx.flow.isRestoring) await controller(ctx, this.save).openPage();
    },
    async skip(ctx) { if (!ctx.flow.isRestoring) await controller(ctx, this.save).refresh(); },
    // A past modal in the reconstructed story was already closed by the player.
    runImmediately() {},
  });
  static refresh = this.method({
    performanceSafe: true,
    id: 'refresh', title: '刷新成就界面数据', description: '通常会自动刷新：切换阶段和打开成就页时都会更新界面数据。仅在自制界面需要主动更新时调用；不会改变成就状态。',
    async run(ctx) { await controller(ctx, this.save).refresh(); },
  });
  static notificationMode = this.method({
    performanceSafe: true,
    id: 'notification-mode', title: '浮现方式', description: '读取或切换连续／合并浮现，供自制设置页调用。创作者开放切换后才保存玩家选择；已开始收集的批次保持原方式。',
    returns: { type: 'string', label: '当前方式（sequential / merged）' },
    schema: { action: { type: 'enum', label: '操作', default: 'read', options: [
      { value: 'read', label: '读取当前方式' }, { value: 'toggle', label: '切换到另一种方式' },
      { value: 'sequential', label: '选择连续浮现' }, { value: 'merged', label: '选择合并浮现' },
      { value: 'default', label: '恢复创作者默认方式' },
    ] } },
    run(ctx, p) { return controller(ctx, this.save).notificationMode(p.action); },
    skip(ctx) { return controller(ctx, this.save).notificationMode('read'); },
    runImmediately(ctx) { return controller(ctx, this.save).notificationMode('read'); },
  });
}
