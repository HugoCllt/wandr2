import { useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import type { ActivityDetailDTO, FeedItemDTO } from '@wandr/shared';
import { theme } from '../../src/theme/tokens';
import { AppText } from '../../src/ui/AppText';
import { Icon } from '../../src/ui/Icon';
import { formatActivityPrice, PriceLabel } from '../../src/ui/PriceLabel';
import { CardActions } from '../../src/components/CardActions';
import { DetailRow } from '../../src/components/DetailRow';
import { categoryIconFor, categoryLabelFor, formatActivityWhen } from '../../src/components/cardMeta';
import { useActivity } from '../../src/lib/queries/useActivity';
import { ApiError } from '../../src/lib/api';

export default function ActivityDetailScreen() {
  const { slug, favorited, bookmarked } = useLocalSearchParams<{
    slug: string;
    favorited?: string;
    bookmarked?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: activity, isLoading, isError, error, refetch } = useActivity(slug);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const closeButton = (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Fermer"
      hitSlop={8}
      style={styles.closeButton}
    >
      <Icon name="close" size={20} color={theme.colors.white} strokeWidth={2} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.skeletonHero} />
          <View style={styles.body}>
            <View style={[styles.skeletonBlock, styles.skeletonEyebrow]} />
            <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
            <View style={[styles.skeletonBlock, styles.skeletonLine]} />
            <View style={[styles.skeletonBlock, styles.skeletonLineShort]} />
            <View style={[styles.skeletonBlock, styles.skeletonRow]} />
            <View style={[styles.skeletonBlock, styles.skeletonRow]} />
          </View>
        </ScrollView>
        {closeButton}
      </View>
    );
  }

  if (isError || !activity) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <View style={styles.container}>
        <View style={styles.errorCenter}>
          <AppText variant="subtitle" color={theme.colors.ink} style={styles.errorText}>
            {notFound ? 'Cette activité n’existe plus.' : 'Impossible de charger cette activité.'}
          </AppText>
          <Pressable
            onPress={() => (notFound ? goBack() : refetch())}
            accessibilityRole="button"
            style={styles.errorButton}
          >
            <AppText variant="subtitle" color={theme.colors.brass}>
              {notFound ? 'Retour' : 'Réessayer'}
            </AppText>
          </Pressable>
        </View>
        {closeButton}
      </View>
    );
  }

  return (
    <ActivityDetailContent
      activity={activity}
      insets={insets}
      closeButton={closeButton}
      initialFavorited={favorited === '1'}
      initialBookmarked={bookmarked === '1'}
    />
  );
}

function ActivityDetailContent({
  activity,
  insets,
  closeButton,
  initialFavorited,
  initialBookmarked,
}: {
  activity: ActivityDetailDTO;
  insets: EdgeInsets;
  closeButton: ReactNode;
  initialFavorited: boolean;
  initialBookmarked: boolean;
}) {
  const primary = activity.categories.primary;
  const feedItem: FeedItemDTO = {
    ...activity,
    matchScore: 0,
    isFavorited: activity.isFavorited ?? initialFavorited,
    isBookmarked: activity.isBookmarked ?? initialBookmarked,
  };
  const price = formatActivityPrice(activity);
  const address = activity.neighborhood ? `${activity.address}, ${activity.neighborhood}` : activity.address;

  const [linkError, setLinkError] = useState<string | null>(null);

  const handleOpenMaps = () => {
    const mapsUrl = Platform.select<string>({
      ios: `maps:?q=${activity.latitude},${activity.longitude}`,
      android: `geo:${activity.latitude},${activity.longitude}?q=${encodeURIComponent(activity.title)}`,
    });
    if (!mapsUrl) return;
    setLinkError(null);
    Linking.openURL(mapsUrl).catch(() => setLinkError('Impossible d’ouvrir l’application de cartes.'));
  };

  const handleOpenWebsite = () => {
    if (!activity.externalUrl) return;
    setLinkError(null);
    Linking.openURL(activity.externalUrl).catch(() => setLinkError('Impossible d’ouvrir ce lien.'));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activity.imageUrl ? (
          <Image source={{ uri: activity.imageUrl }} style={styles.hero} contentFit="cover" transition={150} />
        ) : (
          <LinearGradient
            colors={[theme.colors.surface2, theme.colors.surface3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIconMark}>
              <Icon name={categoryIconFor(primary)} size={32} color={theme.colors.brass} strokeWidth={1.4} />
            </View>
          </LinearGradient>
        )}

        <View style={styles.body}>
          <View style={styles.categoryTag}>
            <View style={styles.categoryIconMark}>
              <Icon name={categoryIconFor(primary)} size={14} color={theme.colors.brass} strokeWidth={1.6} />
            </View>
            <AppText variant="caption" color={theme.colors.smoke}>
              {categoryLabelFor(primary)}
            </AppText>
          </View>

          <AppText variant="display" color={theme.colors.ink} style={styles.title}>
            {activity.title}
          </AppText>

          <AppText variant="body" color={theme.colors.smoke} style={styles.description}>
            {activity.description}
          </AppText>

          <View style={styles.rows}>
            {activity.kind === 'EVENT' && (
              <DetailRow icon="calendar" label="Quand" value={formatActivityWhen(activity)} />
            )}
            <DetailRow icon="pin" label="Où" value={address} />
          </View>

          {price && (
            <View style={styles.priceRow}>
              <AppText variant="caption" color={theme.colors.smoke}>
                Prix
              </AppText>
              <PriceLabel activity={activity} variant="subtitle" color={theme.colors.brass700} />
            </View>
          )}

          {(activity.indoor || activity.outdoor) && (
            <View style={styles.chips}>
              {activity.indoor && (
                <View style={styles.chip}>
                  <AppText variant="caption" color={theme.colors.ink}>
                    Intérieur
                  </AppText>
                </View>
              )}
              {activity.outdoor && (
                <View style={styles.chip}>
                  <AppText variant="caption" color={theme.colors.ink}>
                    Extérieur
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {closeButton}

      {linkError && (
        <View style={styles.linkErrorBar}>
          <AppText variant="caption" color={theme.colors.live} accessibilityRole="alert">
            {linkError}
          </AppText>
        </View>
      )}

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + theme.space.s3 }]}>
        <View style={styles.actionsSlot}>
          <CardActions activity={feedItem} variant="detail" />
        </View>
        <Pressable onPress={handleOpenMaps} accessibilityRole="button" style={styles.primaryButton}>
          <Icon name="pin" size={16} color={theme.colors.white} strokeWidth={1.8} />
          <AppText variant="subtitle" color={theme.colors.white}>
            Ouvrir dans Plans
          </AppText>
        </Pressable>
        {activity.externalUrl && (
          <Pressable onPress={handleOpenWebsite} accessibilityRole="button" style={styles.ghostButton}>
            <Icon name="external" size={16} color={theme.colors.brass} strokeWidth={1.8} />
            <AppText variant="subtitle" color={theme.colors.brass}>
              Site web
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  scrollContent: {
    paddingBottom: theme.space.s8,
  },
  hero: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconMark: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: theme.space.s4,
    right: theme.space.s3,
    zIndex: 1,
    elevation: 1,
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: theme.space.s4,
    gap: theme.space.s4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  categoryIconMark: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: -theme.space.s1,
  },
  description: {
    marginTop: -theme.space.s2,
  },
  rows: {
    gap: theme.space.s4,
  },
  priceRow: {
    gap: 2,
    marginTop: -theme.space.s2,
  },
  chips: {
    flexDirection: 'row',
    gap: theme.space.s2,
    marginTop: -theme.space.s2,
  },
  chip: {
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
  },
  linkErrorBar: {
    paddingHorizontal: theme.space.s4,
    paddingVertical: theme.space.s2,
    backgroundColor: theme.colors.liveTint,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
    paddingHorizontal: theme.space.s4,
    paddingTop: theme.space.s3,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  actionsSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s2,
    borderRadius: theme.radius.btn,
    backgroundColor: theme.colors.brass,
  },
  ghostButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s2,
    paddingHorizontal: theme.space.s4,
    borderRadius: theme.radius.btn,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.s4,
    paddingHorizontal: theme.space.s5,
  },
  errorText: {
    textAlign: 'center',
  },
  errorButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.s5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonHero: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.surface3,
  },
  skeletonBlock: {
    backgroundColor: theme.colors.surface3,
    borderRadius: theme.radius.sm,
  },
  skeletonEyebrow: {
    width: '30%',
    height: 14,
  },
  skeletonTitle: {
    width: '80%',
    height: 30,
    marginTop: theme.space.s3,
  },
  skeletonLine: {
    width: '100%',
    height: 16,
    marginTop: theme.space.s4,
  },
  skeletonLineShort: {
    width: '90%',
    height: 16,
    marginTop: theme.space.s2,
  },
  skeletonRow: {
    width: '100%',
    height: 44,
    marginTop: theme.space.s4,
  },
});
