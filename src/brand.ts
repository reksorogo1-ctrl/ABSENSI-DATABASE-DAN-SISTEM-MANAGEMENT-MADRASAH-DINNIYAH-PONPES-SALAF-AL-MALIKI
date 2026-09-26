import { AppSettings } from './types';

export const LOGO_MADRASAH = '/assets/logo_madrasah_diniyah.jpg';
export const LOGO_PONDOK = '/assets/logo_pondok_almaliki.jpg';

const LEGACY_LOGO = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa';

export interface BrandLogoUrls { madrasah: string; pondok: string; }

// Logos are editable in Option Panel; fall back to bundled assets when empty/legacy.
export function resolveLogos(settings?: Partial<AppSettings> | null): BrandLogoUrls {
  const clean = (v?: string) => (v && !v.startsWith(LEGACY_LOGO) ? v.trim() : '');
  return {
    madrasah: clean(settings?.logo_madrasah) || LOGO_MADRASAH,
    pondok: clean(settings?.logo_pondok) || LOGO_PONDOK,
  };
}
