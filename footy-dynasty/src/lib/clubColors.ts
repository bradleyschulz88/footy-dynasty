// Club theming system — injects club colors as CSS custom properties
// src/lib/clubColors.ts

import { PYRAMID, findClub } from '../data/pyramid.js';

const CLUB_THEME_KEY = 'fd-club-theme';

export interface ClubTheme {
  primary: string;      // Main club color (headers, primary buttons, accents)
  secondary: string;    // Secondary club color (text, borders)
  tertiary: string;     // Tertiary club color (gradients, hover states)
  gradient: string;     // Primary → secondary gradient
  gradientRadial: string; // Radial gradient for backgrounds
  textOnPrimary: string;  // Text color on primary backgrounds
  logo?: string;        // Logo URL
  shortName: string;    // Club abbreviation
}

const CLUB_COLOR_MAP: Record<string, Partial<ClubTheme>> = {
  // AFL clubs with verified colors
  ade: { primary: '#002B5C', secondary: '#E21937', tertiary: '#FFD200' },
  bri: { primary: '#7A0019', secondary: '#003E80', tertiary: '#FDB930' },
  car: { primary: '#0E1A40', secondary: '#FFFFFF', tertiary: '#0E1A40' },
  col: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#000000' },
  ess: { primary: '#CC2031', secondary: '#000000', tertiary: '#CC2031' },
  fre: { primary: '#2A0D54', secondary: '#FFFFFF', tertiary: '#2A0D54' },
  gws: { primary: '#F47920', secondary: '#231F20', tertiary: '#FFFFFF' },
  gee: { primary: '#002F6C', secondary: '#FFFFFF', tertiary: '#002F6C' },
  gcs: { primary: '#D71920', secondary: '#FDB813', tertiary: '#231F20' },
  haw: { primary: '#4D2004', secondary: '#FBBF15', tertiary: '#4D2004' },
  mel: { primary: '#0F1131', secondary: '#CC2031', tertiary: '#0F1131' },
  nor: { primary: '#003F87', secondary: '#FFFFFF', tertiary: '#003F87' },
  pad: { primary: '#008AAB', secondary: '#000000', tertiary: '#FFFFFF' },
  ric: { primary: '#FFD200', secondary: '#000000', tertiary: '#FFD200' },
  stk: { primary: '#ED1B2F', secondary: '#000000', tertiary: '#FFFFFF' },
  syd: { primary: '#ED1B2F', secondary: '#FFFFFF', tertiary: '#ED1B2F' },
  tas: { primary: '#D63B2F', secondary: '#000000', tertiary: '#FFFFFF' },
  wce: { primary: '#003087', secondary: '#F2A900', tertiary: '#003087' },
  wbd: { primary: '#0039A6', secondary: '#E21937', tertiary: '#FFFFFF' },

  // State leagues - use AFL club colors as base, muted
  // VFL
  vfl_box_hill_hawks: { primary: '#4D2004', secondary: '#FBBF15', tertiary: '#4D2004' },
  vfl_brisbane_lions: { primary: '#7A0019', secondary: '#003E80', tertiary: '#FDB930' },
  vfl_carlton: { primary: '#002B5C', secondary: '#FFFFFF', tertiary: '#002B5C' },
  vfl_casey_demons: { primary: '#0F1131', secondary: '#CC2031', tertiary: '#0F1131' },
  vfl_coburg_lions: { primary: '#003087', secondary: '#FFD200', tertiary: '#000000' },
  vfl_collingwood: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#000000' },
  vfl_essendon: { primary: '#CC2031', secondary: '#000000', tertiary: '#CC2031' },
  vfl_footscray_western_bu: { primary: '#0039A6', secondary: '#E21937', tertiary: '#FFFFFF' },
  vfl_frankston: { primary: '#000000', secondary: '#CC2031', tertiary: '#FFFFFF' },
  vfl_geelong: { primary: '#002F6C', secondary: '#FFFFFF', tertiary: '#002F6C' },
  vfl_gold_coast_suns: { primary: '#D71920', secondary: '#FDB813', tertiary: '#231F20' },
  vfl_gws_giants: { primary: '#F47920', secondary: '#231F20', tertiary: '#FFFFFF' },
  vfl_north_melbourne: { primary: '#003F87', secondary: '#FFFFFF', tertiary: '#003F87' },
  vfl_northern_bullants: { primary: '#003366', secondary: '#CC2031', tertiary: '#FFFFFF' },
  vfl_port_melbourne: { primary: '#CC2031', secondary: '#002B5C', tertiary: '#FFFFFF' },
  vfl_richmond: { primary: '#FFD200', secondary: '#000000', tertiary: '#FFD200' },
  vfl_sandringham: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#ED1B2F' },
  vfl_southport_sharks: { primary: '#003F87', secondary: '#FFD200', tertiary: '#FFFFFF' },
  vfl_st_kilda: { primary: '#ED1B2F', secondary: '#000000', tertiary: '#FFFFFF' },
  vfl_sydney_swans: { primary: '#ED1B2F', secondary: '#FFFFFF', tertiary: '#ED1B2F' },
  vfl_tasmania_devils: { primary: '#D63B2F', secondary: '#000000', tertiary: '#FFFFFF' },
  vfl_werribee: { primary: '#660066', secondary: '#FFD200', tertiary: '#660066' },
  vfl_williamstown: { primary: '#E21937', secondary: '#FFFFFF', tertiary: '#FFD200' },

  // SANFL
  sanfl_adelaide: { primary: '#002B5C', secondary: '#E21937', tertiary: '#FFD200' },
  sanfl_central_district: { primary: '#002B5C', secondary: '#CC2031', tertiary: '#FFFFFF' },
  sanfl_glenelg: { primary: '#000000', secondary: '#FFD200', tertiary: '#000000' },
  sanfl_north_adelaide: { primary: '#CC2031', secondary: '#FFFFFF', tertiary: '#CC2031' },
  sanfl_norwood: { primary: '#CC2031', secondary: '#003087', tertiary: '#FFFFFF' },
  sanfl_port_adelaide: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#000000' },
  sanfl_south_adelaide: { primary: '#002B5C', secondary: '#FFD200', tertiary: '#FFFFFF' },
  sanfl_sturt: { primary: '#003087', secondary: '#0099CC', tertiary: '#FFFFFF' },
  sanfl_west_adelaide: { primary: '#CC2031', secondary: '#002B5C', tertiary: '#FFFFFF' },
  sanfl_woodville_west_torre: { primary: '#003087', secondary: '#FFD200', tertiary: '#FFFFFF' },

  // WAFL
  wafl_claremont: { primary: '#FFD200', secondary: '#000000', tertiary: '#FFFFFF' },
  wafl_east_fremantle: { primary: '#002B5C', secondary: '#FFFFFF', tertiary: '#002B5C' },
  wafl_east_perth: { primary: '#CC2031', secondary: '#FFD200', tertiary: '#FFFFFF' },
  wafl_peel_thunder: { primary: '#002B5C', secondary: '#FFD200', tertiary: '#FFFFFF' },
  wafl_perth: { primary: '#CC2031', secondary: '#002B5C', tertiary: '#FFFFFF' },
  wafl_south_fremantle: { primary: '#CC2031', secondary: '#002B5C', tertiary: '#FFFFFF' },
  wafl_subiaco: { primary: '#003087', secondary: '#FFFFFF', tertiary: '#003087' },
  wafl_swan_districts: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#000000' },
  wafl_west_coast_eagles: { primary: '#003087', secondary: '#F2A900', tertiary: '#003087' },
  wafl_west_perth: { primary: '#003087', secondary: '#FFD200', tertiary: '#FFFFFF' },

  // QAFL
  qafl_aspley: { primary: '#003F87', secondary: '#FFD200', tertiary: '#FFFFFF' },
  qafl_broadbeach: { primary: '#003366', secondary: '#FFFFFF', tertiary: '#FFD200' },
  qafl_coorparoo: { primary: '#002B5C', secondary: '#FFD200', tertiary: '#FFFFFF' },
  qafl_labrador: { primary: '#003F87', secondary: '#FFD200', tertiary: '#FFFFFF' },
  qafl_maroochydore: { primary: '#003366', secondary: '#CC2031', tertiary: '#FFFFFF' },
  qafl_morningside: { primary: '#7B1D41', secondary: '#FFFFFF', tertiary: '#7B1D41' },
  qafl_mt_gravatt: { primary: '#7B1D41', secondary: '#FFD200', tertiary: '#FFFFFF' },
  qafl_noosa_tigers: { primary: '#003F87', secondary: '#FFD200', tertiary: '#FFFFFF' },
  qafl_palm_beach_currumbin: { primary: '#003F87', secondary: '#FFD200', tertiary: '#FFFFFF' },
  qafl_redland_victoria_point: { primary: '#003F87', secondary: '#FFFFFF', tertiary: '#CC2031' },
  qafl_sherwood_magpies: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#000000' },
  qafl_surfers_paradise: { primary: '#CC2031', secondary: '#002B5C', tertiary: '#FFFFFF' },
  qafl_wilston_grange: { primary: '#003087', secondary: '#CC2031', tertiary: '#FFFFFF' },

  // NTFL
  ntfl_darwin_buffaloes: { primary: '#002B5C', secondary: '#FFD200', tertiary: '#FFFFFF' },
  ntfl_nightcliff: { primary: '#FF7700', secondary: '#000000', tertiary: '#FFFFFF' },
  ntfl_pint: { primary: '#006633', secondary: '#FFD200', tertiary: '#000000' },
  ntfl_palmerston_magpies: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#000000' },
  ntfl_southern_districts: { primary: '#CC2031', secondary: '#FFFFFF', tertiary: '#003087' },
  ntfl_st_mary_s: { primary: '#CC2031', secondary: '#FFFFFF', tertiary: '#CC2031' },
  ntfl_tiwi_bombers: { primary: '#CC2031', secondary: '#000000', tertiary: '#FFD200' },
  ntfl_wanderers: { primary: '#006633', secondary: '#FFD200', tertiary: '#FFFFFF' },
  ntfl_waratah: { primary: '#660066', secondary: '#FFD200', tertiary: '#FFFFFF' },

  // TSL
  tsl_clarence: { primary: '#0033A0', secondary: '#FFFFFF', tertiary: '#CC2031' },
  tsl_glenorchy: { primary: '#000000', secondary: '#FFFFFF', tertiary: '#000000' },
  tsl_kingborough_tigers: { primary: '#4D2004', secondary: '#FFD200', tertiary: '#FFFFFF' },
  tsl_lauderdale: { primary: '#CC2031', secondary: '#000000', tertiary: '#FFD200' },
  tsl_launceston: { primary: '#003087', secondary: '#FFFFFF', tertiary: '#003087' },
  tsl_north_hobart: { primary: '#CC2031', secondary: '#002B5C', tertiary: '#FFFFFF' },
  tsl_north_launceston: { primary: '#003087', secondary: '#FFFFFF', tertiary: '#003087' },

  // Community leagues - generate from club data
};

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round((num >> 16) + amount * (255 - (num >> 16))));
  const g = Math.min(255, Math.round(((num >> 8) & 0x00FF) + amount * (255 - ((num >> 8) & 0x00FF))));
  const b = Math.min(255, Math.round((num & 0x0000FF) + amount * (255 - (num & 0x0000FF))));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round((num >> 16) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0x00FF) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0x0000FF) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function getContrastColor(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xFF;
  const g = (num >> 8) & 0xFF;
  const b = num & 0xFF;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#0B0F0E' : '#FFFFFF';
}

export function generateClubTheme(clubId: string): ClubTheme {
  const club = findClub(clubId);
  if (!club) {
    // Fallback for unknown clubs
    return {
      primary: '#e8b43f',
      secondary: '#e8e8e8',
      tertiary: '#f0c86a',
      gradient: 'linear-gradient(135deg, #e8b43f, #e8e8e8)',
      gradientRadial: 'radial-gradient(circle at 30% 30%, #e8b43f, #e8e8e8)',
      textOnPrimary: '#0b0f0e',
      shortName: clubId.toUpperCase(),
    };
  }

  const override = CLUB_COLOR_MAP[clubId];
  const colors = override ? [override.primary, override.secondary, override.tertiary] : club.colors;
  const [primary, secondary, tertiary] = colors.length >= 3 ? colors : [colors[0], colors[1] || colors[0], colors[2] || colors[0]];

  return {
    primary,
    secondary,
    tertiary,
    gradient: `linear-gradient(135deg, ${primary}, ${secondary})`,
    gradientRadial: `radial-gradient(circle at 30% 30%, ${primary}, ${secondary})`,
    textOnPrimary: getContrastColor(primary),
    logo: `/logos/${clubId}.svg`,
    shortName: club.short,
  };
}

export function injectClubTheme(clubId: string | null): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (!clubId) {
    // Clear club theme
    root.style.removeProperty('--fd-club-primary');
    root.style.removeProperty('--fd-club-secondary');
    root.style.removeProperty('--fd-club-tertiary');
    root.style.removeProperty('--fd-club-gradient');
    root.style.removeProperty('--fd-club-gradient-radial');
    root.style.removeProperty('--fd-club-text-on-primary');
    return;
  }

  const theme = generateClubTheme(clubId);
  root.style.setProperty('--fd-club-primary', theme.primary);
  root.style.setProperty('--fd-club-secondary', theme.secondary);
  root.style.setProperty('--fd-club-tertiary', theme.tertiary);
  root.style.setProperty('--fd-club-gradient', theme.gradient);
  root.style.setProperty('--fd-club-gradient-radial', theme.gradientRadial);
  root.style.setProperty('--fd-club-text-on-primary', theme.textOnPrimary);

  // Persist for next session
  try { localStorage.setItem(CLUB_THEME_KEY, JSON.stringify({ clubId, theme })); } catch {}
}

export function clearClubTheme(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.removeProperty('--fd-club-primary');
  root.style.removeProperty('--fd-club-secondary');
  root.style.removeProperty('--fd-club-tertiary');
  root.style.removeProperty('--fd-club-gradient');
  root.style.removeProperty('--fd-club-gradient-radial');
  root.style.removeProperty('--fd-club-text-on-primary');
  try { localStorage.removeItem(CLUB_THEME_KEY); } catch {}
}

export function restoreClubTheme(): void {
  if (typeof document === 'undefined') return;
  try {
    const stored = localStorage.getItem(CLUB_THEME_KEY);
    if (stored) {
      const { clubId } = JSON.parse(stored);
      injectClubTheme(clubId);
    }
  } catch {}
}

export function useClubTheme(clubId: string | null): ClubTheme | null {
  // This would be used in a React context, but we keep it simple with CSS custom props
  if (!clubId) return null;
  return generateClubTheme(clubId);
}