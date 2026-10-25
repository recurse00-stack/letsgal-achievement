import { Extension, extension, settings, defineSave } from '@avg-studio/sdk';
import { type Entry } from './model';
import { controller, PAGE, POPUP } from './runtime';

// Disposable UI projection. Activation facts live only in states.
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
      name: i.string('名称'), icon: i.asset('图标').accepts('image'),
      levelId: i.string('等级编号').default('bronze'),
    })).addLabel('添加成就').emptyHint('添加第一个成就。').maxItems(10000)
      .table({ titleField: 'name', imageField: 'icon', columns: ['id', 'levelId'] }),
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
    notifications: s.boolean('激活时浮现').default(true),
    durationMs: s.number('每条浮现时长（毫秒）').default(3000).range(300, 60000).step(100),
  }));
  static activate = this.method({
    id: 'activate', title: '激活成就', description: '仅未激活到已激活时通知；重复调用没有额外通知。',
    schema: { achievementId: { type: 'string', label: '成就编号', required: true } },
    async run(ctx, p) { await controller(ctx, this.save).set(p.achievementId, true, true); },
    async skip(ctx, p) { await controller(ctx, this.save).set(p.achievementId, true, false); },
    async runImmediately(ctx, p) { await controller(ctx, this.save).set(p.achievementId, true, false); },
  });
  static deactivate = this.method({
    id: 'deactivate', title: '取消激活成就',
    schema: { achievementId: { type: 'string', label: '成就编号', required: true } },
    async run(ctx, p) { await controller(ctx, this.save).set(p.achievementId, false, false); },
  });
  static isActive = this.method({
    id: 'is-active', title: '成就是否激活', returns: { type: 'boolean', label: '已激活' },
    schema: { achievementId: { type: 'string', label: '成就编号', required: true } },
    async run(ctx, p) { return controller(ctx, this.save).isActive(p.achievementId); },
  });
  static openPage = this.method({
    id: 'open-page', title: '打开成就页', description: '重建界面数据，然后打开作者选择的成就页。',
    async run(ctx) { await controller(ctx, this.save).openPage(); },
    async skip(ctx) { await controller(ctx, this.save).refresh(); },
  });
  static refresh = this.method({
    id: 'refresh', title: '刷新成就界面数据', description: '供自制界面调用；只重建展示数据，不改变激活事实。',
    async run(ctx) { await controller(ctx, this.save).refresh(); },
  });
}
