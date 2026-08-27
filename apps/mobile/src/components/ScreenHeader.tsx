import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { GlassSurface } from '../ui/GlassSurface';
import { Icon } from '../ui/Icon';

type ScreenHeaderProps = {
  filterCount?: number;
  onPressFilters?: () => void;
  onPressBack?: () => void;
};

export function ScreenHeader({ filterCount = 0, onPressFilters, onPressBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const hasFilters = filterCount > 0;
  const tint = hasFilters ? theme.colors.brass700 : theme.colors.ink;

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + theme.space.s2 }]}>
      {onPressBack ? (
        <Pressable onPress={onPressBack} accessibilityRole="button" accessibilityLabel="Retour à Explorer">
          <GlassSurface radius={theme.radius.pill} style={styles.round}>
            <View style={styles.backIcon}>
              <Icon name="arrow" size={20} color={theme.colors.ink} strokeWidth={1.8} />
            </View>
          </GlassSurface>
        </Pressable>
      ) : (
        <View />
      )}
      {onPressFilters ? (
        <Pressable
          onPress={onPressFilters}
          accessibilityRole="button"
          accessibilityLabel={hasFilters ? `Filtres, ${filterCount} actifs` : 'Filtres'}
        >
          <GlassSurface radius={theme.radius.pill} style={styles.pill}>
            <Icon name="filter" size={18} color={tint} strokeWidth={1.8} />
            <AppText variant="label" color={tint}>
              Filtres
            </AppText>
            {hasFilters ? (
              <View style={styles.count}>
                <AppText variant="caption" color={theme.colors.white}>
                  {filterCount}
                </AppText>
              </View>
            ) : null}
          </GlassSurface>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: theme.space.s4,
    right: theme.space.s4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  round: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
    height: 44,
    paddingHorizontal: theme.space.s4,
  },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: theme.space.s1,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brass700,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
