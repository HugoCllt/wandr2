import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from './tokens';

export const TAB_BAR_HEIGHT = 68;
export const TAB_BAR_GAP = theme.space.s2;

export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_GAP + TAB_BAR_HEIGHT + theme.space.s5;
}
