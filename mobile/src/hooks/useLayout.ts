import { useWindowDimensions } from 'react-native';
import { layout } from '../theme';

export type LayoutSize = 'compact' | 'phone' | 'tablet' | 'desktop';

export function useLayout() {
  const { width, height } = useWindowDimensions();

  const size: LayoutSize =
    width >= 1024 ? 'desktop' : width >= 600 ? 'tablet' : width < 380 ? 'compact' : 'phone';

  const isWide = width >= 600;
  const isCompact = width < 380;
  const stackActions = width < 520;
  const contentPadding = isCompact ? 14 : isWide ? 24 : 16;
  const gap = isCompact ? 8 : 12;
  const buttonSize = isCompact ? ('sm' as const) : ('md' as const);
  const headerTitleSize = isCompact ? 20 : isWide ? 26 : 22;
  const headerSubtitleSize = isCompact ? 13 : 14;

  return {
    width,
    height,
    size,
    isWide,
    isCompact,
    stackActions,
    contentPadding,
    gap,
    buttonSize,
    headerTitleSize,
    headerSubtitleSize,
    maxContentWidth: layout.maxContentWidth,
    columns: isWide ? 2 : 1,
  };
}
