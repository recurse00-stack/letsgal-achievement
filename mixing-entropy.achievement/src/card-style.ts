/** Stage appearance is author configuration; it never creates another progress state. */
export interface CardAppearance {
  backgroundMode: 'template' | 'color' | 'image' | 'gradient';
  backgroundColor: string; backgroundImage: string; backgroundFit: 'cover' | 'contain' | 'fill' | 'tile';
  backgroundColorEnd: string; backgroundAngle: number; backgroundX: number; backgroundY: number;
  frameMode: 'template' | 'none' | 'line' | 'nineSlice';
  frameImage: string; frameColor: string; frameWidth: number; frameRadius: number;
  sliceTop: number; sliceRight: number; sliceBottom: number; sliceLeft: number;
  frameRepeat: 'stretch' | 'repeat' | 'round';
  iconEffect: 'none' | 'float' | 'rotate' | 'pulse';
  frameEffect: 'none' | 'pulse' | 'glow';
  effectTrigger: 'loop' | 'enter' | 'hover'; effectDuration: number;
}
export const CARD_DEFAULTS: CardAppearance = {
  backgroundMode: 'template', backgroundColor: '', backgroundImage: '', backgroundFit: 'cover',
  backgroundColorEnd: '', backgroundAngle: 135, backgroundX: 50, backgroundY: 50,
  frameMode: 'template', frameImage: '', frameColor: '', frameWidth: 3, frameRadius: 12,
  sliceTop: 16, sliceRight: 16, sliceBottom: 16, sliceLeft: 16,
  frameRepeat: 'stretch',
  iconEffect: 'none', frameEffect: 'none', effectTrigger: 'loop', effectDuration: 1800,
};
const options: Partial<Record<keyof CardAppearance, readonly string[]>> = {
  backgroundMode: ['template', 'color', 'image', 'gradient'], backgroundFit: ['cover', 'contain', 'fill', 'tile'],
  frameRepeat: ['stretch', 'repeat', 'round'],
  frameMode: ['template', 'none', 'line', 'nineSlice'], iconEffect: ['none', 'float', 'rotate', 'pulse'],
  frameEffect: ['none', 'pulse', 'glow'], effectTrigger: ['loop', 'enter', 'hover'],
};
/** Validate only declared fields. Do not evaluate CSS or arbitrary author code. */
export function cardAppearance(row: Partial<CardAppearance>): CardAppearance {
  const result = { ...CARD_DEFAULTS };
  for (const key of Object.keys(CARD_DEFAULTS) as Array<keyof CardAppearance>) {
    const value = row[key];
    if (value === undefined) continue;
    if (typeof value !== typeof CARD_DEFAULTS[key]) throw Error(`阶段外观 ${key} 类型无效`);
    if (typeof value === 'number') {
      const min = key === 'effectDuration' ? 200 : 0;
      const max = key === 'effectDuration' ? 60000 : key.startsWith('slice') ? 4096 : key === 'backgroundAngle' ? 360 : key === 'backgroundX' || key === 'backgroundY' ? 100 : 256;
      if (!Number.isFinite(value) || value < min || value > max) throw Error(`阶段外观 ${key} 超出范围 ${min}–${max}`);
    }
    if (typeof value === 'string' && (value.length > 10000 || (options[key] && !options[key]!.includes(value)))) throw Error(`阶段外观 ${key} 无效`);
    Object.assign(result, { [key]: value });
  }
  return result;
}
export function optionalAppearance(row: Record<string, unknown>): Partial<CardAppearance> {
  return Object.keys(CARD_DEFAULTS).some(key => key in row) ? cardAppearance(row) : {};
}

export function effectFrames(effect: CardAppearance['iconEffect'] | CardAppearance['frameEffect']): Keyframe[] {
  switch (effect) {
    case 'float': return [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }];
    case 'rotate': return [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }];
    case 'pulse': return [{ opacity: 1 }, { opacity: .45 }, { opacity: 1 }];
    case 'glow': return [{ filter: 'brightness(1)' }, { filter: 'brightness(1.8) drop-shadow(0 0 5px currentColor)' }, { filter: 'brightness(1)' }];
    default: return [];
  }
}
