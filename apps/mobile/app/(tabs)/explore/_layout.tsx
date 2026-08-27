import { Stack } from 'expo-router';
import { theme } from '../../../src/theme/tokens';

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.offwhite },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[category]" />
    </Stack>
  );
}
