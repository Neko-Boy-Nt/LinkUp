import { Stack } from 'expo-router';
import { useTheme } from '../src/lib/theme';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '../src/providers/AuthProvider';
import { MessagingProvider } from '../src/providers/MessagingProvider';
import { NotificationsProvider } from '../src/providers/NotificationsProvider';
import { ErrorLoggerProvider, showErrorSummary } from '../src/providers/ErrorLoggerProvider';

export default function RootLayout() {
  const { colors } = useTheme();

  if (__DEV__) {
    setTimeout(() => {
      showErrorSummary();
    }, 5000);
  }

  return (
    <ErrorLoggerProvider>
      <AuthProvider>
      <NotificationsProvider>
        <MessagingProvider>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </View>
        </MessagingProvider>
      </NotificationsProvider>
    </AuthProvider>
    </ErrorLoggerProvider>
  );
}