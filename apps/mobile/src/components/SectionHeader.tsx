import { StyleSheet, View } from 'react-native';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="title" color={theme.colors.ink}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.space.s6,
    paddingBottom: theme.space.s2,
  },
});
