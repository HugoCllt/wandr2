import { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts as useLibreBodoniFonts, LibreBodoni_600SemiBold } from '@expo-google-fonts/libre-bodoni';
import {
  useFonts as usePublicSansFonts,
  PublicSans_400Regular,
  PublicSans_500Medium,
} from '@expo-google-fonts/public-sans';
import { theme } from '../src/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [libreBodoniLoaded] = useLibreBodoniFonts({ LibreBodoni_600SemiBold });
  const [publicSansLoaded] = usePublicSansFonts({ PublicSans_400Regular, PublicSans_500Medium });
  const fontsLoaded = libreBodoniLoaded && publicSansLoaded;

  const hideSplash = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    hideSplash();
  }, [hideSplash]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.offwhite },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activity/[slug]" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
