import { Tabs } from 'expo-router';
import { useTheme } from '../../src/lib/theme';
import { View, Text, Image } from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  GraduationCap,
  MessageSquare,
} from '../../src/components/Icon';

// Tab Icon Component with Lucide icons
function TabIcon({
  icon: Icon,
  focused,
  color,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  focused: boolean;
  color: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: focused ? 1.1 : 1 }],
      }}
    >
      <Icon size={24} color={color} />
    </View>
  );
}

// Profile Tab Icon with user photo
function ProfileTabIcon({ focused }: { focused: boolean }) {
  const { profile, user } = useAuth();
  const { colors } = useTheme();

  const avatarUrl = profile?.avatar_url;
  const initial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase();

  if (focused) {
    return (
      <LinearGradient
        colors={['#CA98FF', '#9C42F4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 3,
          borderRadius: 20,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: '#0C0C1F',
            backgroundColor: colors.primary,
          }}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{initial}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: 'rgba(202,152,255,0.3)',
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#CA98FF',
        tabBarInactiveTintColor: isDark ? '#6B5B7A' : '#9B8AA8',
        tabBarStyle: {
          backgroundColor: 'rgba(12,12,31,0.8)',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          height: 90,
          paddingBottom: 24,
          paddingTop: 12,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Home} focused={focused} color={color} />,
        }}
      />

      {/* Student */}
      <Tabs.Screen
        name="student"
        options={{
          title: 'Étudiant',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={GraduationCap} focused={focused} color={color} />,
        }}
      />

      {/* Messages/Discussions */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Discussions',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={MessageSquare} focused={focused} color={color} />,
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} />,
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
