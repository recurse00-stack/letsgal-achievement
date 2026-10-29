import { AssetPicker, ColorPicker, FieldRow, Section, Select, SettingField, useSetting } from '@avg-studio/studio-ui';
import { cardAppearance, type CardAppearance } from './card-style';
import { readCardSizeReference } from './card-size-reference';
const note = { color: 'var(--fg-secondary)' };
function Numeric({ value, onChange, min = 0, max = 4096 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return <input type="number" value={value} min={min} max={max} step={1}
    style={{ width: '100%', padding: 10, border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--fg-primary)', background: 'var(--bg-canvas)' }}
    onChange={e => { const n = e.currentTarget.valueAsNumber; if (Number.isFinite(n) && n >= min && n <= max) onChange(n); }} />;
}
const choices = (values: Record<string, string>) => Object.entries(values).map(([value, label]) => ({ value, label }));

export function CardAppearanceEditor({ value, patch, groups = ['background', 'frame', 'effects'] }: { value: Partial<CardAppearance>; patch: (v: Partial<CardAppearance>) => void; groups?: string[] }) {
  const v = cardAppearance(value);
  const select = <K extends keyof CardAppearance>(key: K, labels: Record<string, string>) => <Select value={String(v[key])} options={choices(labels)} onChange={next => patch({ [key]: next })} />;
  return <>
    {groups.includes('background') && <Section title="背景" collapsible defaultOpen={false}>
      <FieldRow label="背景方式">{select('backgroundMode', { template: '使用各自界面原样', color: '颜色', image: '图片', gradient: '双色渐变' })}</FieldRow>
      {v.backgroundMode !== 'template' && <FieldRow label="底色"><ColorPicker value={v.backgroundColor} onChange={backgroundColor => patch({ backgroundColor })} /></FieldRow>}
      {v.backgroundMode === 'gradient' && <>
        <FieldRow label="渐变终点颜色"><ColorPicker value={v.backgroundColorEnd} onChange={backgroundColorEnd => patch({ backgroundColorEnd })} /></FieldRow>
        <FieldRow label="渐变角度"><Numeric value={v.backgroundAngle} max={360} onChange={backgroundAngle => patch({ backgroundAngle })} /></FieldRow>
      </>}
      {v.backgroundMode === 'image' && <>
        <FieldRow label="背景图片"><AssetPicker accepts={['image']} value={v.backgroundImage} onChange={backgroundImage => patch({ backgroundImage })} /></FieldRow>
        <FieldRow label="图片适配">{select('backgroundFit', { cover: '铺满并裁切', contain: '完整显示', tile: '平铺', fill: '拉伸' })}</FieldRow>
        <FieldRow label="横向焦点（%）" description="0 为左侧，50 为居中，100 为右侧。"><Numeric value={v.backgroundX} max={100} onChange={backgroundX => patch({ backgroundX })} /></FieldRow>
        <FieldRow label="纵向焦点（%）" description="0 为顶部，50 为居中，100 为底部。"><Numeric value={v.backgroundY} max={100} onChange={backgroundY => patch({ backgroundY })} /></FieldRow>
      </>}
    </Section>}
    {groups.includes('frame') && <Section title="边框" collapsible defaultOpen={false}>
      <FieldRow label="边框方式">{select('frameMode', { template: '使用各自界面原样', none: '不显示', line: '线框', nineSlice: '图片九宫格' })}</FieldRow>
      {(v.frameMode === 'line' || v.frameMode === 'nineSlice') && <>
        <FieldRow label="边框颜色" description="线框颜色；九宫格图片未就绪时也用此颜色。"><ColorPicker value={v.frameColor} onChange={frameColor => patch({ frameColor })} /></FieldRow>
        <FieldRow label="显示厚度" description="界面中的边框厚度，与原图切线距离分开。"><Numeric value={v.frameWidth} max={256} onChange={frameWidth => patch({ frameWidth })} /></FieldRow>
      </>}
      {v.frameMode === 'line' && <FieldRow label="圆角"><Numeric value={v.frameRadius} max={256} onChange={frameRadius => patch({ frameRadius })} /></FieldRow>}
      {v.frameMode === 'nineSlice' && <>
        <FieldRow label="边框图片"><AssetPicker accepts={['image']} value={v.frameImage} onChange={frameImage => patch({ frameImage })} /></FieldRow>
        <p style={note}>建议用透明 PNG 或静态 SVG。四条切线保留角部，边缘随卡片伸缩；距离按原图像素填写，SVG 按其 viewBox 坐标填写。内容留白在对应官方模板中手动编排。</p>
        {(['sliceTop', 'sliceRight', 'sliceBottom', 'sliceLeft'] as const).map((key, n) => <FieldRow key={key} label={'原图' + ['上', '右', '下', '左'][n] + '切线距离'}><Numeric value={v[key]} onChange={number => patch({ [key]: number })} /></FieldRow>)}
        <FieldRow label="边缘适配">{select('frameRepeat', { stretch: '拉伸', repeat: '平铺', round: '平铺并铺满' })}</FieldRow>
      </>}
    </Section>}
    {groups.includes('effects') && <Section title="元素动效" collapsible defaultOpen={false}>
      <FieldRow label="图标动效">{select('iconEffect', { none: '无', float: '轻微浮动', rotate: '旋转', pulse: '呼吸' })}</FieldRow>
      <FieldRow label="边框动效">{select('frameEffect', { none: '无', pulse: '呼吸', glow: '发光' })}</FieldRow>
      {(v.iconEffect !== 'none' || v.frameEffect !== 'none') && <>
        <FieldRow label="播放方式">{select('effectTrigger', { loop: '循环', enter: '出现时一次', hover: '鼠标悬停时循环' })}</FieldRow>
        <FieldRow label="一轮时长（毫秒）"><Numeric value={v.effectDuration} min={200} max={60000} onChange={effectDuration => patch({ effectDuration })} /></FieldRow>
      </>}
      <p style={note}>切换阶段会停止旧动效；滚出可见范围暂停附加动效。浮现不接收鼠标，悬停动效仅用于卡片。素材本身的逐帧动画由官方图片控件播放，与这里的动效分开。</p>
    </Section>}
  </>;
}
export function CardLayoutEditor() {
  const [page] = useSetting<string>('main.page');
  const [measured] = useSetting<unknown[]>('main.cardSizeReference');
  const reference = readCardSizeReference(measured, page || 'ui:@mixing-entropy.achievement/achievements');
  return <Section title="成就卡片编排" collapsible defaultOpen={false} description="页面列表决定每张卡片的空间；卡片内部继续使用官方可视化模板。">
    <Section title="尺寸参考" description="改完行列后，在剧情预览中通过“打开成就页”重新打开一次；这里自动更新最近测得的尺寸。">
      {reference ? <>
        <p><strong>建议单卡画布：{reference.width} × {reference.height} px</strong></p>
        <p>全卡背景、背景图片和边框控件：{reference.width} × {reference.height} px。图标和文字自行编排。</p>
        <p style={note}>测量时的模板画布：{reference.templateWidth} × {reference.templateHeight} px。修改位置：双击列表 → 网格项模板 → 按 Esc → 界面属性 → 设计画布。</p>
        <p style={note}>{({ pagination: '翻页', vertical: '纵向滚动', horizontal: '横向滚动' })[reference.mode]} · {reference.cols}列×{reference.rows}行 · 间距{reference.gap} · 列表{reference.listWidth}×{reference.listHeight} · 最近测量 {new Date(reference.measuredAt).toLocaleString()}</p>
      </> : <p style={note}>尚未测到所选页面的卡片尺寸。请先在剧情预览中打开一次成就页，并确保至少有一张可显示的卡片。</p>}
      <p style={note}>这是最近预览的参考值，不会改动设计画布或内部元素。改完行列、间距、浏览方式或页面大小后，请重新预览更新。仅支持本扩展内的卡片页面。</p>
    </Section>
      <p><strong>自由排版入口：</strong>官方 UI 编辑器 → 成就页 → 双击画布中的“双击编辑卡片 · 成就列表”区域 →“网格项模板”（单张成就卡片）。</p>
      <p style={note}>单击列表设置整页行列，双击画布中的列表进入单张卡片。卡片保持作者的坐标、字体和层级；页面变窄后请检查文字与装饰。</p>
    <p style={note}>单卡画布大小：进入“网格项模板”，按 Esc 取消元素选中，在右侧“界面属性 → 设计画布”修改宽度和高度。修改画布不会自动缩放或重排已有元素，内部仍由你摆放。</p>
    <p style={note}>行、列、间距和列表大小在成就页设置；单卡编辑画布目前不会随这些设置自动更新。改好后请在成就页剧情预览中核对实际效果。</p>
    <p style={note}>阶段外观增强用于本扩展内的成就页；卡片使用直接排列的基础元素，分组或条件图层保持原生模板效果。卡片和浮现使用各自的通用方案或阶段专用配置；两个界面的尺寸与排版分别在官方编辑器中设计。</p>
  </Section>;
}
