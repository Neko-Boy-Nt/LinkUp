import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../src/lib/theme';

export default function StartScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/welcome');
      }
    }
  }, [session, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 48, fontWeight: '900', color: '#9C42F4' }}>L</Text>
        <ActivityIndicator style={{ marginTop: 20 }} color="#9C42F4" />
      </View>
    </View>
  );
}
