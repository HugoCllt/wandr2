import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../src/ui/Icon';
import { AppText } from '../../src/ui/AppText';
import { Screen } from '../../src/ui/Screen';
import { theme } from '../../src/theme/tokens';
import { authClient } from '../../src/lib/auth-client';
import { queryClient } from '../../src/lib/queries/queryClient';

export default function ProfileScreen() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut();
      queryClient.clear();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Icon name="profile" size={26} color={theme.colors.brass} strokeWidth={1.4} />
        </View>
        <AppText variant="display" style={styles.title}>
          Profil
        </AppText>
        <AppText variant="caption" color={theme.colors.smoke} style={styles.caption}>
          VOS FAVORIS ET PRÉFÉRENCES ARRIVENT BIENTÔT
        </AppText>
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => [
            styles.signOut,
            pressed && styles.signOutPressed,
            signingOut && styles.signOutDisabled,
          ]}
          accessibilityRole="button"
        >
          <AppText color={theme.colors.ink}>{signingOut ? 'Déconnexion…' : 'Se déconnecter'}</AppText>
        </Pressable>
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
  signOut: {
    marginTop: theme.space.s5,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.btn,
    paddingHorizontal: theme.space.s5,
    paddingVertical: theme.space.s3,
    backgroundColor: theme.colors.surface,
  },
  signOutPressed: {
    backgroundColor: theme.colors.surface2,
  },
  signOutDisabled: {
    opacity: 0.6,
  },
});
