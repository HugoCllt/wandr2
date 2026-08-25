import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { ChatRecommendationDTO } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';

type ChatRecoCardProps = {
  item: ChatRecommendationDTO;
};

export function ChatRecoCard({ item }: ChatRecoCardProps) {
  const { activity, reason, sourceUrl } = item;
  const [linkFailed, setLinkFailed] = useState(false);

  function openSource(url: string) {
    setLinkFailed(false);
    Linking.openURL(url).catch(() => setLinkFailed(true));
  }

  return (
    <View style={styles.card}>
      <View style={styles.clip}>
        {activity.imageUrl && (
          <Image
            source={{ uri: activity.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        )}
        <View style={styles.body}>
          <AppText variant="title" color={theme.colors.ink} numberOfLines={2}>
            {activity.title}
          </AppText>
          <AppText variant="body" color={theme.colors.smoke} style={styles.reason}>
            {reason}
          </AppText>
          {sourceUrl && (
            <Pressable
              onPress={() => openSource(sourceUrl)}
              accessibilityRole="link"
              accessibilityLabel="Voir la source"
              style={styles.sourceRow}
            >
              <AppText variant="caption" color={theme.colors.brass700}>
                Voir la source
              </AppText>
              <Icon name="external" size={12} color={theme.colors.brass700} strokeWidth={1.8} />
            </Pressable>
          )}
          {linkFailed && (
            <AppText variant="caption" color={theme.colors.live}>
              Impossible d’ouvrir ce lien.
            </AppText>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    borderRadius: theme.radius.card,
    ...theme.shadow.card,
  },
  clip: {
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: theme.colors.surface3,
  },
  body: {
    padding: theme.space.s3,
    gap: theme.space.s1,
  },
  reason: {
    marginTop: theme.space.s1,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s1,
    minHeight: 44,
    marginTop: theme.space.s1,
  },
});
