import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme/tokens';
import { AppText } from '../src/ui/AppText';
import { Icon } from '../src/ui/Icon';

export default function PremiumRequiredScreen() {
  const router = useRouter();

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/chat');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Icon name="chat" size={26} color={theme.colors.brass} strokeWidth={1.4} />
        </View>
        <AppText variant="display" style={styles.title}>
          Accès Premium requis
        </AppText>
        <AppText variant="subtitle" color={theme.colors.ink} style={styles.message}>
          Le chat Wandr est réservé aux comptes Premium.
        </AppText>
        <AppText variant="body" color={theme.colors.smoke} style={styles.explanation}>
          Cette fonctionnalité n’est pas incluse dans votre abonnement actuel.
        </AppText>
        <Pressable onPress={goBack} accessibilityRole="button" style={styles.button}>
          <AppText variant="subtitle" color={theme.colors.white}>
            Retour
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s3,
    paddingHorizontal: theme.space.s5,
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
  message: {
    textAlign: 'center',
  },
  explanation: {
    textAlign: 'center',
  },
  button: {
    marginTop: theme.space.s4,
    minHeight: 44,
    paddingHorizontal: theme.space.s6,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
