import { StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme/tokens';
import { AddToCalendarBody } from '../src/components/AddToCalendarSheet';

export default function CalendarAddScreen() {
  const router = useRouter();
  const { activityId, activityTitle } = useLocalSearchParams<{
    activityId: string;
    activityTitle: string;
  }>();

  if (!activityId) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.root}>
      <AddToCalendarBody
        activityId={activityId}
        activityTitle={activityTitle ?? ''}
        onClose={() => router.back()}
        onSaved={() => router.back()}
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
