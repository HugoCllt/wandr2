import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';

export type UpcomingItem = {
  id: string;
  scheduledAt: string;
  title: string;
  venue: string;
  slug: string | null;
};

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit' });
}

type UpcomingListProps = {
  items: UpcomingItem[];
  emptyLabel?: string;
};

export function UpcomingList({ items, emptyLabel = 'Rien de prévu pour le moment.' }: UpcomingListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <AppText variant="body" color={theme.colors.smoke}>
        {emptyLabel}
      </AppText>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const dt = new Date(item.scheduledAt);
        return (
          <Pressable
            key={item.id}
            onPress={() => item.slug && router.push(`/activity/${item.slug}`)}
            disabled={!item.slug}
            accessibilityRole="button"
            style={styles.row}
          >
            <View style={styles.dateBlock}>
              <AppText variant="caption" color={theme.colors.brass700}>
                {MONTHS[dt.getMonth()].toUpperCase()}
              </AppText>
              <AppText variant="title" color={theme.colors.ink} style={styles.dateNumber}>
                {dt.getDate()}
              </AppText>
            </View>
            <View style={styles.info}>
              <AppText variant="subtitle" color={theme.colors.ink} numberOfLines={1}>
                {item.title}
              </AppText>
              <View style={styles.metaRow}>
                <AppText variant="caption" color={theme.colors.smoke}>
                  {formatTime(item.scheduledAt)}
                </AppText>
                <View style={styles.dot} />
                <AppText variant="caption" color={theme.colors.smoke} numberOfLines={1}>
                  {item.venue}
                </AppText>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.space.s3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s3,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.space.s3,
  },
  dateBlock: {
    width: 48,
    alignItems: 'center',
  },
  dateNumber: {
    fontSize: 20,
    lineHeight: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.smoke,
  },
});
