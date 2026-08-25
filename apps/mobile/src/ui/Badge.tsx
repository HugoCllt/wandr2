import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../theme/tokens';
import { AppText } from './AppText';

export type BadgeVariant = 'trending' | 'live';

type BadgeProps = {
  variant: BadgeVariant;
  label: string;
  style?: StyleProp<ViewStyle>;
};

const VARIANT_STYLE: Record<BadgeVariant, { backgroundColor: string; color: string }> = {
  trending: { backgroundColor: theme.colors.brassTint, color: theme.colors.brass700 },
  live: { backgroundColor: theme.colors.live, color: theme.colors.white },
};

export function Badge({ variant, label, style }: BadgeProps) {
  const { backgroundColor, color } = VARIANT_STYLE[variant];
  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <AppText variant="caption" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s1,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
  },
});
