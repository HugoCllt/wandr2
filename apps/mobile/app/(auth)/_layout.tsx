import { Stack } from 'expo-router';
import { theme } from '../../src/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.offwhite },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
