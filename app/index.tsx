import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { View, Text } from 'react-native';
import { useTheme } from '../src/lib/theme';
import Animated, { 
  SlideInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withDelay,
  FadeIn
} from 'react-native-reanimated';

export default function StartScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animation d'entrée
    scale.value = withSequence(
      withSpring(1.2, { stiffness: 200, damping: 15 }),
      withDelay(500, withSpring(1, { stiffness: 200, damping: 15 }))
    );
    opacity.value = withSpring(1, { stiffness: 100 });

    // Navigation après l'animation
    const timer = setTimeout(() => {
      if (!loading) {
        if (session) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [session, loading, router]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      <Animated.View style={logoStyle}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 32,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <Text style={{ fontSize: 56, fontWeight: 'bold', color: '#FFF' }}>
            L
          </Text>
        </View>
      </Animated.View>

      <Animated.View 
        entering={SlideInUp.delay(400).springify()}
        style={{ marginTop: 32, alignItems: 'center' }}
      >
        <Text 
          style={{ 
            fontSize: 40, 
            fontWeight: 'bold', 
            color: colors.primary,
            letterSpacing: 1,
          }}
        >
          LinkUp
        </Text>
        <Text 
          style={{ 
            fontSize: 16, 
            color: colors.text,
            opacity: 0.7,
            marginTop: 12,
          }}
        >
          Connecte-toi, étudie, réussis ensemble
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(1000)}
        style={{ 
          position: 'absolute', 
          bottom: 60,
          alignItems: 'center'
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.primary,
            opacity: 0.3,
          }}
        />
      </Animated.View>
    </View>
  );
}