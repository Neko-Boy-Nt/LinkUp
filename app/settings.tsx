import { View, Text, ScrollView, Pressable, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/lib/theme';
import { useAuth } from '../src/providers/AuthProvider';
import { GlassmorphismCard } from '../src/components/GlassmorphismCard';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChevronLeft,
  User,
  Shield,
  Bell,
  MessageSquare,
  Eye,
  Moon,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  ExternalLink,
} from '../src/components/Icon';
import { useState } from 'react';

// Toggle Switch Component with gradient
function GradientToggle({ value, onValueChange }: { value: boolean; onValueChange: (val: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? 'transparent' : 'rgba(70,70,100,0.4)',
        padding: 2,
        justifyContent: 'center',
      }}
    >
      {value && (
        <LinearGradient
          colors={['#CA98FF', '#9C42F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: 14,
          }}
        />
      )}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFF',
          transform: [{ translateX: value ? 24 : 0 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
        }}
      />
    </Pressable>
  );
}

// Bento Card Component
function BentoCard({
  icon: Icon,
  title,
  description,
  onPress,
  rightElement,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  const { colors, isDark } = useTheme();
  const Content = (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <Icon size={24} color="#CA98FF" />
        {rightElement || <ChevronRight size={20} color={isDark ? '#74738B' : '#AAA8C3'} />}
      </View>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 13, color: isDark ? '#AAA8C3' : '#74738B', lineHeight: 18 }}>{description}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        {Content}
      </Pressable>
    );
  }
  return <View style={{ flex: 1 }}>{Content}</View>;
}

// Section Header
function SectionHeader({ title }: { title: string }) {
  const { isDark } = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: isDark ? '#AAA8C3' : '#74738B',
        marginBottom: 12,
        marginLeft: 4,
      }}
    >
      {title}
    </Text>
  );
}

// Setting Row Component
function SettingRow({
  icon: Icon,
  title,
  subtitle,
  rightElement,
  onPress,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const Content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isDark ? 'rgba(35,35,63,0.8)' : 'rgba(248,245,255,0.8)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Icon size={20} color="#CA98FF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {rightElement || <ChevronRight size={20} color={isDark ? '#74738B' : '#AAA8C3'} />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {Content}
      </Pressable>
    );
  }
  return <View style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>{Content}</View>;
}

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);

  const handleThemeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    // Theme follows system - no manual toggle available
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            paddingTop: 60,
            paddingHorizontal: 20,
            paddingBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable onPress={() => router.back()} style={{ padding: 8, borderRadius: 20 }}>
            <ChevronLeft size={28} color="#CA98FF" />
          </Pressable>

          <Text
            style={{
              fontSize: 22,
              fontWeight: '900',
              letterSpacing: -0.5,
            }}
          >
            <Text style={{ color: '#CA98FF' }}>Paramètres</Text>
          </Text>

          {/* User Avatar */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(202,152,255,0.3)',
            }}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                  {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Account Section - Bento Grid */}
          <SectionHeader title="Compte" />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <BentoCard
              icon={User}
              title="Infos Personnelles"
              description="Gérez votre identité et vos coordonnées."
              onPress={() => router.push('/edit-profile')}
            />
            <BentoCard
              icon={Shield}
              title="Sécurité"
              description="Mot de passe, 2FA et sessions actives."
              onPress={() => {}}
            />
          </View>

          {/* Notifications Section */}
          <SectionHeader title="Notifications" />
          <GlassmorphismCard
            intensity="medium"
            style={{
              marginBottom: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <SettingRow
              icon={Bell}
              title="Notifications Push"
              subtitle="Alertes instantanées sur l'appareil"
              rightElement={<GradientToggle value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
            />
            <SettingRow
              icon={MessageSquare}
              title="Messages Directs"
              subtitle="Prévisualisation du contenu"
              rightElement={<GradientToggle value={messagesEnabled} onValueChange={setMessagesEnabled} />}
            />
          </GlassmorphismCard>

          {/* Privacy & Appearance - Bento Grid */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            {/* Privacy Card */}
            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <Eye size={24} color="#CA98FF" style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>Visibilité du profil</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B', marginBottom: 16 }}>
                Choisissez qui peut voir votre activité.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: '#CA98FF',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#46007D', textTransform: 'uppercase' }}>Public</Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(70,70,100,0.6)' : 'rgba(200,200,220,0.6)',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase' }}>
                    Privé
                  </Text>
                </View>
              </View>
            </View>

            {/* Dark Mode Card */}
            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <Moon size={24} color="#CA98FF" style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>Mode Sombre</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B', marginBottom: 16 }}>L'Ether est plus beau dans le noir.</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#CA98FF' }}>{darkModeEnabled ? 'Activé' : 'Désactivé'}</Text>
                <GradientToggle value={darkModeEnabled} onValueChange={handleThemeToggle} />
              </View>
            </View>
          </View>

          {/* Support Section */}
          <SectionHeader title="Assistance" />
          <GlassmorphismCard
            intensity="medium"
            style={{
              marginBottom: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 18,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <HelpCircle size={20} color={isDark ? '#AAA8C3' : '#74738B'} style={{ marginRight: 16 }} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>Centre d'aide</Text>
              </View>
              <ExternalLink size={18} color={isDark ? '#74738B' : '#AAA8C3'} />
            </Pressable>
            <Pressable
              onPress={() => {}}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 18,
                paddingHorizontal: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FileText size={20} color={isDark ? '#AAA8C3' : '#74738B'} style={{ marginRight: 16 }} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>Conditions d'utilisation</Text>
              </View>
              <ExternalLink size={18} color={isDark ? '#74738B' : '#AAA8C3'} />
            </Pressable>
          </GlassmorphismCard>

          {/* Danger Zone - Logout */}
          <Pressable
            onPress={handleSignOut}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,110,132,0.3)',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 40,
            }}
          >
            <LogOut size={20} color="#FF6E84" />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF6E84' }}>Déconnexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
