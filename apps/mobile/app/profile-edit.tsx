import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProfileFormDTO } from '@wandr/shared';
import { theme } from '../src/theme/tokens';
import { AppText } from '../src/ui/AppText';
import { ProfileForm } from '../src/components/ProfileForm';
import { useProfile, useUpdateProfile } from '../src/lib/queries/useProfile';

const DEFAULT_CITY_NAME = 'Montréal';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfile();

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }

  async function handleSubmit(form: ProfileFormDTO) {
    await updateProfile.mutateAsync(form);
    goBack();
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.brass} />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.center}>
        <AppText variant="subtitle" color={theme.colors.ink} style={styles.errorText}>
          Impossible de charger votre profil.
        </AppText>
        <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.retryButton}>
          <AppText variant="subtitle" color={theme.colors.brass}>
            Réessayer
          </AppText>
        </Pressable>
        <Pressable onPress={goBack} accessibilityRole="button" style={styles.retryButton}>
          <AppText variant="subtitle" color={theme.colors.smoke}>
            Retour
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <ProfileForm
      initial={{
        ...profile.formInitial,
        cityName: profile.formInitial.cityName || DEFAULT_CITY_NAME,
      }}
      dismissable
      onSubmit={handleSubmit}
      onClose={goBack}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s4,
    backgroundColor: theme.colors.offwhite,
    paddingHorizontal: theme.space.s5,
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.s5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
