import { StyleSheet, View } from 'react-native';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon, type IconName } from '../ui/Icon';

type DetailRowProps = {
  icon: IconName;
  label: string;
  value: string;
};

export function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconMark}>
        <Icon name={icon} size={16} color={theme.colors.brass} strokeWidth={1.6} />
      </View>
      <View style={styles.text}>
        <AppText variant="caption" color={theme.colors.smoke}>
          {label}
        </AppText>
        <AppText variant="body" color={theme.colors.ink}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s3,
  },
  iconMark: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
