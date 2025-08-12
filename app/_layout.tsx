import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

// Sentry: dynamically require to avoid bundler resolution issues in dev
let Sentry: any;
import { useColorScheme } from '@/components/useColorScheme';
import { ThemePreferenceProvider, useThemePreference } from '@/components/ThemePreference';
import { I18nProvider, useI18n } from '@/components/I18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Silence RN New Architecture warning from dependencies calling LayoutAnimation.enable.
LogBox.ignoreLogs([
  'setLayoutAnimationEnabledExperimental is currently a no-op',
  'setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture',
]);

// Sentry init (optional, dynamic)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = 'sentry-expo';
  Sentry = require(m);
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || (global as any)?.__SENTRY_DSN__;
  if (dsn && Sentry?.init) {
    Sentry.init({ dsn, enableInExpoDevelopment: true, debug: __DEV__, tracesSampleRate: 0.1 });
  }
} catch {}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <I18nProvider>
      <ThemePreferenceProvider>
        <RootLayoutNav />
      </ThemePreferenceProvider>
    </I18nProvider>
  );
}

function RootLayoutNav() {
  const systemScheme = useColorScheme();
  const { preference } = useThemePreference();
  const effectiveScheme = preference === 'system' ? systemScheme : preference;
  const { t } = useI18n();

  return (
    <ThemeProvider value={effectiveScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('menu') }} />
      </Stack>
    </ThemeProvider>
  );
}
