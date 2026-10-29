/** Authoring reference only: never used to size the page or change the template. */
export interface CardSizeMeasurement {
  width: number; height: number;
  contentWidth: number; contentHeight: number;
  gridWidth: number; gridHeight: number;
  mode: 'pagination' | 'vertical' | 'horizontal';
}
export interface CardSizeReference extends CardSizeMeasurement {
  page: string; measuredAt: number;
  cols: number; rows: number; gap: number;
  listWidth: number; listHeight: number;
  templateWidth: number; templateHeight: number;
}
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
export function makeCardSizeReference(document: unknown, page: string, size: CardSizeMeasurement, measuredAt = Date.now()): CardSizeReference | undefined {
  const elements = object(document).elements;
  if (!Array.isArray(elements)) return;
  const lists = elements.map(object).filter(e => e.refId === 'achievement-list' && e.type === 'data-list');
  if (lists.length !== 1) return;
  const list = lists[0], props = object(list.props), rect = object(list.rect);
  if (props.layout !== 'card' || !Array.isArray(list.children)) return;
  const template = list.children.map(object).find(e => object(e.props).__dataListTemplateKind === 'card');
  const canvas = object(template?.rect);
  if (![props.cols, props.rows, rect.w, rect.h, canvas.w, canvas.h, size.width, size.height, size.contentWidth, size.contentHeight, size.gridWidth, size.gridHeight].every(positive)) return;
  if (typeof props.gap !== 'number' || !Number.isFinite(props.gap) || props.gap < 0) return;
  return { ...size, page, measuredAt, width: Math.max(1, Math.round(size.width)), height: Math.max(1, Math.round(size.height)),
    cols: props.cols as number, rows: props.rows as number, gap: props.gap,
    listWidth: rect.w as number, listHeight: rect.h as number,
    templateWidth: canvas.w as number, templateHeight: canvas.h as number };
}
export function readCardSizeReference(value: unknown, selectedPage: string): CardSizeReference | undefined {
  if (!Array.isArray(value) || value.length !== 1) return;
  const record = object(value[0]);
  if (record.page !== selectedPage.replace(/^ui:/, '') || !['pagination', 'vertical', 'horizontal'].includes(String(record.mode))) return;
  const keys = ['width', 'height', 'contentWidth', 'contentHeight', 'gridWidth', 'gridHeight', 'cols', 'rows', 'listWidth', 'listHeight', 'templateWidth', 'templateHeight', 'measuredAt'];
  if (!keys.every(key => positive(record[key])) || typeof record.gap !== 'number' || !Number.isFinite(record.gap) || record.gap < 0) return;
  return record as unknown as CardSizeReference;
}

/** Geometry-only dedupe: a stable resize must not cause repeated project saves. */
export function sizeReferenceKey(reference: CardSizeReference): string {
  const { measuredAt: _time, ...geometry } = reference;
  return JSON.stringify(geometry);
}
