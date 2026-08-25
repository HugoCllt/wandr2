import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PROFILE_AFFINITY_CATEGORIES } from '@wandr/shared';
import { Icon, type IconName } from '../../src/ui/Icon';
import { AppText } from '../../src/ui/AppText';
import { Screen } from '../../src/ui/Screen';
import { theme } from '../../src/theme/tokens';
import { authClient } from '../../src/lib/auth-client';
import { queryClient } from '../../src/lib/queries/queryClient';
import { useProfile } from '../../src/lib/queries/useProfile';
import { categoryLabelFor } from '../../src/components/cardMeta';

const AVATAR_BASE_URL = 'https://api.dicebear.com/9.x/avataaars/svg';

function buildAvatarUrl(seed: string): string {
  const params = new URLSearchParams({
    seed,
    backgroundColor: 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c0f4d4,ffe8a3',
    backgroundType: 'gradientLinear,solid',
    radius: '50',
  });
  return `${AVATAR_BASE_URL}?${params.toString()}`;
}

function ProfileRow({
  icon,
  label,
  onPress,
  showSeparator,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  showSeparator: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        showSeparator && styles.rowSeparator,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowIconMark}>
        <Icon name={icon} size={18} color={theme.colors.brass} strokeWidth={1.6} />
      </View>
      <AppText variant="subtitle" color={theme.colors.ink} style={styles.rowLabel}>
        {label}
      </AppText>
      <Icon name="arrow" size={16} color={theme.colors.smoke} strokeWidth={1.6} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { data: profile, isLoading, isError, refetch } = useProfile();

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

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.brass} />
        </View>
      </Screen>
    );
  }

  if (isError || !profile) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText variant="subtitle" color={theme.colors.ink} style={styles.centerText}>
            Impossible de charger votre profil.
          </AppText>
          <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.retryButton}>
            <AppText variant="subtitle" color={theme.colors.brass}>
              Réessayer
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const bio = profile.formInitial.bio;
  const affinities = profile.formInitial.affinities;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={{ uri: buildAvatarUrl(profile.profile.id) }}
            style={styles.avatar}
            contentFit="cover"
            transition={150}
          />
          <AppText variant="title" color={theme.colors.ink} style={styles.name}>
            {profile.profile.name}
          </AppText>
          {bio ? (
            <AppText variant="body" color={theme.colors.smoke} style={styles.bio}>
              {bio}
            </AppText>
          ) : (
            <Pressable
              onPress={() => router.push('/profile-edit')}
              accessibilityRole="button"
              style={styles.bioGhostButton}
            >
              <AppText variant="body" color={theme.colors.silver} style={styles.bioGhost}>
                Ajouter une bio
              </AppText>
            </Pressable>
          )}
        </View>

        <View style={styles.affinitySection}>
          <AppText variant="eyebrow" color={theme.colors.smoke}>
            MES AFFINITÉS
          </AppText>
          <View style={styles.chipWrap}>
            {PROFILE_AFFINITY_CATEGORIES.map((category) => {
              const active = (affinities[category] ?? 0) > 0;
              return (
                <View key={category} style={[styles.chip, active && styles.chipActive]}>
                  <AppText variant="caption" color={active ? theme.colors.brass700 : theme.colors.smoke}>
                    {categoryLabelFor(category)}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.rows}>
          <ProfileRow icon="heart" label="Favoris" onPress={() => router.push('/favorites')} showSeparator />
          <ProfileRow
            icon="calendar"
            label="Calendrier"
            onPress={() => router.navigate('/calendar')}
            showSeparator
          />
          <ProfileRow
            icon="profile"
            label="Modifier le profil"
            onPress={() => router.push('/profile-edit')}
            showSeparator={false}
          />
        </View>

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
          <AppText color={theme.colors.live}>{signingOut ? 'Déconnexion…' : 'Se déconnecter'}</AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s4,
  },
  centerText: {
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.s5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: theme.space.s6,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.space.s4,
    paddingBottom: theme.space.s5,
    gap: theme.space.s2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.pill,
    borderWidth: 3,
    borderColor: theme.colors.brassTint,
    backgroundColor: theme.colors.surface2,
    marginBottom: theme.space.s2,
  },
  name: {
    textAlign: 'center',
  },
  bio: {
    textAlign: 'center',
    paddingHorizontal: theme.space.s5,
  },
  bioGhostButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  bioGhost: {
    textAlign: 'center',
  },
  affinitySection: {
    gap: theme.space.s2,
    marginBottom: theme.space.s5,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.s2,
  },
  chip: {
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  chipActive: {
    backgroundColor: theme.colors.brassTint,
    borderColor: theme.colors.brassTint,
  },
  rows: {
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s3,
    minHeight: 52,
    paddingHorizontal: theme.space.s4,
    paddingVertical: theme.space.s3,
  },
  rowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  rowPressed: {
    backgroundColor: theme.colors.surface2,
  },
  rowIconMark: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
  },
  signOut: {
    marginTop: theme.space.s5,
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
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
