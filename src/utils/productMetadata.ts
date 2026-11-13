export type ScreenType = 'oled' | 'lcd' | 'unknown';
export type BacklightType = 'emissive' | 'mini-led' | 'led' | 'unknown';

export interface ProductMetadata {
  screenType: ScreenType;
  backlightType: BacklightType;
  sizes: number[];
  size: number | null;
}

export const SCREEN_TYPE_OPTIONS = [
  { value: 'unknown', label: '未知屏幕' },
  { value: 'oled', label: 'OLED' },
  { value: 'lcd', label: 'LCD' }
] as const;

export const BACKLIGHT_TYPE_OPTIONS = [
  { value: 'unknown', label: '未知背光' },
  { value: 'emissive', label: '自发光' },
  { value: 'mini-led', label: 'Mini LED' },
  { value: 'led', label: '普通 LED' }
] as const;

export function screenTypeLabel(value: ScreenType | undefined | null): string {
  return SCREEN_TYPE_OPTIONS.find(option => option.value === value)?.label ?? '未知屏幕';
}

export function backlightTypeLabel(value: BacklightType | undefined | null): string {
  return BACKLIGHT_TYPE_OPTIONS.find(option => option.value === value)?.label ?? '未知背光';
}

export function normalizeScreenType(value: unknown): ScreenType {
  return value === 'oled' || value === 'lcd' ? value : 'unknown';
}

export function normalizeBacklightType(value: unknown): BacklightType {
  return value === 'emissive' || value === 'mini-led' || value === 'led'
    ? value
    : 'unknown';
}

export function parseProductSizes(size: string | number | null | undefined): number[] {
  if (typeof size === 'number') {
    return Number.isFinite(size) ? [size] : [];
  }
  if (typeof size !== 'string') return [];
  const values = size
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter(value => value > 0 && value <= 300);
  return [...new Set(values ?? [])].sort((a, b) => a - b);
}

export function getProductMetadata(product: {
  size?: string | number | null;
  sizes?: number[] | null;
  screenType?: ScreenType | null;
  backlightType?: BacklightType | null;
}): ProductMetadata {
  const sizes = product.sizes?.length
    ? [...product.sizes].sort((a, b) => a - b)
    : parseProductSizes(product.size);
  return {
    screenType: normalizeScreenType(product.screenType),
    backlightType: normalizeBacklightType(product.backlightType),
    sizes,
    size: typeof product.size === 'number' ? product.size : sizes[0] ?? null
  };
}
