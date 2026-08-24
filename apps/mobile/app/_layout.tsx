import { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts as useLibreBodoniFonts, LibreBodoni_600SemiBold } from '@expo-google-fonts/libre-bodoni';
import {
  useFonts as usePublicSansFonts,
  PublicSans_400Regular,
  PublicSans_500Medium,
} from '@expo-google-fonts/public-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../src/theme/tokens';
import { queryClient } from '../src/lib/queries/queryClient';
import { useSession, type SessionUser } from '../src/lib/auth-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [libreBodoniLoaded, libreBodoniError] = useLibreBodoniFonts({ LibreBodoni_600SemiBold });
  const [publicSansLoaded, publicSansError] = usePublicSansFonts({ PublicSans_400Regular, PublicSans_500Medium });
  const fontsLoaded = (libreBodoniLoaded || !!libreBodoniError) && (publicSansLoaded || !!publicSansError);
  const { data: session, isPending } = useSession();
  const ready = fontsLoaded && !isPending;

  const hideSplash = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  useEffect(() => {
    hideSplash();
  }, [hideSplash]);

  if (!ready) {
    return null;
  }

  const user = session?.user as SessionUser | undefined;
  const isAuthenticated = !!user;
  const isOnboarded = !!user?.onboardedAt;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.offwhite },
            }}
          >
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated && !isOnboarded}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated && isOnboarded}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="activity/[slug]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="favorites" />
              <Stack.Screen name="profile-edit" options={{ presentation: 'modal' }} />
            </Stack.Protected>
          </Stack>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
