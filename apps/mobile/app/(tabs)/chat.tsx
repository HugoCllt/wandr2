import { StyleSheet, View } from 'react-native';
import { Icon } from '../../src/ui/Icon';
import { AppText } from '../../src/ui/AppText';
import { Screen } from '../../src/ui/Screen';
import { theme } from '../../src/theme/tokens';

export default function ChatScreen() {
  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Icon name="chat" size={26} color={theme.colors.brass} strokeWidth={1.4} />
        </View>
        <AppText variant="display" style={styles.title}>
          Chat
        </AppText>
        <AppText variant="caption" color={theme.colors.smoke} style={styles.caption}>
          L&apos;ASSISTANT DE RECOMMANDATIONS ARRIVE BIENTÔT
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s3,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.s2,
  },
  title: {
    textAlign: 'center',
  },
  caption: {
    textAlign: 'center',
  },
});
