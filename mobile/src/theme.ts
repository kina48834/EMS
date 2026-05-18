import { Platform } from 'react-native';
import { emsColors } from '@ems/shared/theme/colors';

export const colors = {
  primary: emsColors.primary,
  primaryDark: emsColors.primaryDark,
  primaryLight: emsColors.primaryLight,
  background: '#f1f5f9',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  danger: '#e11d48',
  dangerDark: '#be123c',
  dangerLight: '#fff1f2',
  warning: '#d97706',
  warningLight: '#fffbeb',
  success: emsColors.primary,
  successLight: emsColors.primaryLight,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySm: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  button: { fontSize: 15, fontWeight: '700' as const },
  buttonSm: { fontSize: 13, fontWeight: '700' as const },
} as const;

export const layout = {
  maxContentWidth: 720,
  minTouchTarget: 44,
} as const;

const isWeb = Platform.OS === 'web';

export const shadows = {
  card: isWeb
    ? ({ boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)' } as const)
    : {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      },
  cardHover: isWeb
    ? ({ boxShadow: '0 4px 14px rgba(15, 23, 42, 0.1)' } as const)
    : {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 4,
      },
  button: isWeb
    ? ({ boxShadow: `0 2px 6px ${emsColors.primaryDark}33` } as const)
    : {
        shadowColor: emsColors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
      },
} as const;
