import { StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme/tokens';
import { ReviewBody } from '../src/components/ReviewSheet';

export default function ReviewScreen() {
  const router = useRouter();
  const { entryId, activityTitle, outcome } = useLocalSearchParams<{
    entryId: string;
    activityTitle: string;
    outcome?: string;
  }>();

  if (!entryId) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.root}>
      <ReviewBody
        entryId={entryId}
        activityTitle={activityTitle ?? ''}
        defaultOutcome={outcome === 'MISSED' ? 'MISSED' : 'DONE'}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
  },
});
