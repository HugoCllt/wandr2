import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/ui/AppText';
import { theme } from '../../src/theme/tokens';
import { authClient } from '../../src/lib/auth-client';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleSubmit() {
    if (busy) return;
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === 'signin'
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message ?? 'Une erreur est survenue. Réessayez.');
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    if (googleBusy) return;
    setError(null);
    setGoogleBusy(true);
    try {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
      if (result?.error) {
        setError(result.error.message ?? "La connexion Google n'est pas disponible pour le moment.");
      }
    } catch {
      setError("La connexion Google n'est pas disponible pour le moment.");
    } finally {
      setGoogleBusy(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <AppText style={styles.logo}>Wandr</AppText>
          <AppText variant="caption" color={theme.colors.smoke} style={styles.tagline}>
            VOTRE VILLE, VOS SORTIES
          </AppText>
        </View>

        <View style={styles.form}>
          <AppText variant="title" style={styles.formTitle}>
            {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </AppText>

          {mode === 'signup' && (
            <View style={styles.field}>
              <AppText variant="caption" color={theme.colors.smoke}>
                Nom
              </AppText>
              <TextInput
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Votre nom"
                placeholderTextColor={theme.colors.silver}
                accessibilityLabel="Nom"
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.field}>
            <AppText variant="caption" color={theme.colors.smoke}>
              Adresse courriel
            </AppText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="vous@exemple.com"
              placeholderTextColor={theme.colors.silver}
              accessibilityLabel="Adresse courriel"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={theme.colors.smoke}>
              Mot de passe
            </AppText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="8 caractères minimum"
              placeholderTextColor={theme.colors.silver}
              accessibilityLabel="Mot de passe"
              style={styles.input}
            />
          </View>

          {error && (
            <AppText color={theme.colors.live} accessibilityRole="alert">
              {error}
            </AppText>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, busy && styles.disabled]}
            accessibilityRole="button"
          >
            <AppText variant="subtitle" color={theme.colors.white}>
              {busy ? 'Patientez…' : mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
            </AppText>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" color={theme.colors.smoke}>
              OU
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={handleGoogle}
            disabled={googleBusy}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.googleButtonPressed,
              googleBusy && styles.disabled,
            ]}
            accessibilityRole="button"
          >
            <AppText variant="subtitle" color={theme.colors.ink}>
              {googleBusy ? 'Patientez…' : 'Continuer avec Google'}
            </AppText>
          </Pressable>

          <Pressable onPress={toggleMode} accessibilityRole="button" style={styles.toggle}>
            <AppText variant="body" color={theme.colors.brass700} style={styles.toggleLabel}>
              {mode === 'signin'
                ? 'Pas encore de compte ? Créer un compte'
                : 'Déjà un compte ? Se connecter'}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space.s5,
    paddingVertical: theme.space.s7,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.space.s7,
  },
  logo: {
    fontFamily: theme.type.display.fontFamily,
    fontSize: 34,
    lineHeight: 38,
    color: theme.colors.ink,
  },
  tagline: {
    marginTop: theme.space.s2,
    letterSpacing: 1.2,
  },
  form: {
    gap: theme.space.s4,
  },
  formTitle: {
    marginBottom: theme.space.s1,
  },
  field: {
    gap: theme.space.s1,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: theme.radius.btn,
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s3,
    fontFamily: theme.type.body.fontFamily,
    fontSize: theme.type.body.fontSize,
    color: theme.colors.ink,
  },
  cta: {
    backgroundColor: theme.colors.brass,
    borderRadius: theme.radius.btn,
    paddingVertical: theme.space.s4,
    alignItems: 'center',
    marginTop: theme.space.s2,
  },
  ctaPressed: {
    backgroundColor: theme.colors.brass700,
  },
  disabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s3,
    marginVertical: theme.space.s2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.line,
  },
  googleButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: theme.radius.btn,
    paddingVertical: theme.space.s4,
    alignItems: 'center',
  },
  googleButtonPressed: {
    backgroundColor: theme.colors.surface2,
  },
  toggle: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.space.s3,
  },
  toggleLabel: {
    textAlign: 'center',
  },
});
