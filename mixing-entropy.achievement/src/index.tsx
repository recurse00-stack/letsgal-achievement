import { Extension, extension, settings, defineSave, type ArrayItemBuilder } from '@avg-studio/sdk';
import { type Entry } from './model';
import { controller, PAGE, POPUP } from './runtime';

const stageFields = (i: ArrayItemBuilder) => ({
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
  entries: { type: 'list', persistence: 'session', default: [] as Entry[], label: '成就界面数据（自动重建）' },
  browseMode: { type: 'string', persistence: 'shared', default: '', label: '成就浏览选择' },
});
@extension({ id: 'main', label: '成就', exposeUI: false })
export default class AchievementExtension extends Extension.withSave(viewSave) {
  static settings = settings(s => ({
    levels: s.array('等级', i => ({ id: i.string('等级编号'), name: i.string('等级名称') }))
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
    browsePolicy: s.enum('页面浏览方式', ['pagination', 'scroll', 'horizontal', 'player'] as const)
      .labels({ pagination: '固定翻页', scroll: '固定纵向滚动', horizontal: '固定横向滚动', player: '允许玩家切换' }).default('pagination')
      .describe('固定方式隐藏切换按钮；允许玩家切换时，分别选择开放的方式。'),
    allowPagination: s.boolean('开放翻页').default(true).enabledWhen('browsePolicy', 'player'),
    allowVertical: s.boolean('开放纵向滚动').default(true).enabledWhen('browsePolicy', 'player'),
    allowHorizontal: s.boolean('开放横向滚动').default(false).enabledWhen('browsePolicy', 'player'),
    browseDefault: s.enum('默认浏览方式', ['pagination', 'scroll', 'horizontal'] as const)
      .labels({ pagination: '翻页', scroll: '纵向滚动', horizontal: '横向滚动' }).default('pagination').enabledWhen('browsePolicy', 'player')
      .describe('仅在已开放的方式中生效；玩家有效的已有选择优先。'),
    popup: s.uiRef('浮现界面').default('ui:' + POPUP).describe('可编辑默认浮现界面，或填写自己的可视化界面引用。'),
    notifications: s.boolean('启用浮现通知').default(true),
    durationMs: s.number('每条浮现时长（毫秒）').default(3000).range(300, 60000).step(100),
  }));
  static changeStage = this.method({
    id: 'change-stage', title: '成就操作', description: '先选成就，再选择目标展示阶段。可选预期当前阶段与浮现；相同阶段不重复通知，通常自动刷新。',
    schema: {
      achievementId: { type: 'string', label: '成就', required: true },
      stageId: { type: 'string', label: '目标展示阶段', required: true },
      notify: { type: 'boolean', label: '切换时浮现', default: true },
      expectedStageId: { type: 'string', label: '仅在此阶段执行（留空不限制）', default: '' },
    },
    async run(ctx, p) { await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, p.notify); },
    async skip(ctx, p) { await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, false); },
    async runImmediately(ctx, p) { await controller(ctx, this.save).setStage(p.achievementId, p.stageId, p.expectedStageId, false); },
  });
  static stageInfo = this.method({
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
    async run(ctx) { await controller(ctx, this.save).openPage(); },
    async skip(ctx) { await controller(ctx, this.save).refresh(); },
  });
  static refresh = this.method({
    id: 'refresh', title: '刷新成就界面数据', description: '通常会自动刷新：切换阶段和打开成就页时都会更新界面数据。仅在自制界面需要主动更新时调用；不会改变成就状态。',
    async run(ctx) { await controller(ctx, this.save).refresh(); },
  });
}
