import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/lib/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { GlassmorphismCard } from '../../src/components/GlassmorphismCard';
import { LinearGradient } from 'expo-linear-gradient';

import { Menu, Settings, Share2, Grid, Bookmark, Users } from '../../src/components/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock posts data
const MOCK_POSTS = [
  { id: '1', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
  { id: '2', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop' },
  { id: '3', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop' },
  { id: '4', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop' },
  { id: '5', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop' },
  { id: '6', image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop' },
];

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');

  const getAvatarInitial = () => {
    if (profile?.full_name) return profile.full_name.charAt(0).toUpperCase();
    if (profile?.username) return profile.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with TopAppBar */}
        <View
          style={{
            paddingTop: 60,
            paddingHorizontal: 20,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Menu size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
          </Pressable>

          <Text
            style={{
              fontSize: 20,
              fontWeight: '900',
              letterSpacing: -0.5,
            }}
          >
            <Text style={{ color: '#CA98FF' }}>LinkUp </Text>
            <Text style={{ color: '#9C42F4' }}>Ether</Text>
          </Text>

          <Pressable
            onPress={() => router.push('/settings')}
            style={{
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Settings size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
          </Pressable>
        </View>

        {/* Cover Image */}
        <View style={{ height: 180, width: '100%', position: 'relative' }}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=400&fit=crop' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(12,12,31,0.2)', colors.background]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 100,
            }}
          />
        </View>

        {/* Profile Info Section */}
        <View style={{ paddingHorizontal: 20, marginTop: -60 }}>
          {/* Avatar and Actions Row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
            {/* Avatar with gradient border */}
            <View style={{ position: 'relative' }}>
              <LinearGradient
                colors={['#CA98FF', '#9C42F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 3,
                  borderRadius: 70,
                }}
              >
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      borderWidth: 4,
                      borderColor: colors.background,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 4,
                      borderColor: colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#FFF' }}>
                      {getAvatarInitial()}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Share Button */}
            <Pressable
              style={{
                padding: 12,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                marginBottom: 8,
              }}
            >
              <Share2 size={20} color="#CA98FF" />
            </Pressable>
          </View>

          {/* Name and Username */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, letterSpacing: -0.5 }}>
              {profile?.full_name || user?.email?.split('@')[0] || 'Alexandre Vance'}
            </Text>
            <Text style={{ fontSize: 16, color: '#CA98FF', fontWeight: '600', marginTop: 4 }}>
              @{profile?.username || 'alex_vance'}
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 12, lineHeight: 20, maxWidth: 280 }}>
              UI/UX Design & Photography enthusiast. Capturing the world through a lens of pixels and light.
            </Text>
          </View>

          {/* Stats Bar - Glass Panel */}
          <GlassmorphismCard
            intensity="medium"
            style={{
              paddingVertical: 20,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>142</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Posts</Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>12.5k</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Followers</Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>842</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Following</Text>
              </View>
            </View>
          </GlassmorphismCard>

          {/* Edit Profile Button */}
          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={{ marginTop: 20 }}
          >
            <LinearGradient
              colors={['#CA98FF', '#9C42F4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                shadowColor: '#CA98FF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Text style={{ color: '#46007D', fontWeight: 'bold', fontSize: 16 }}>
                Modifier profil
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Tabs Navigation */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 32, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            {[
              { key: 'posts', icon: Grid, label: 'Posts' },
              { key: 'saved', icon: Bookmark, label: 'Sauvegardés' },
              { key: 'tagged', icon: Users, label: 'Identifié' },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={{
                  paddingBottom: 16,
                  paddingHorizontal: 16,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab.key ? '#CA98FF' : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <tab.icon
                  size={18}
                  color={activeTab === tab.key ? '#CA98FF' : isDark ? '#AAA8C3' : '#74738B'}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: activeTab === tab.key ? '600' : '400',
                    color: activeTab === tab.key ? '#CA98FF' : isDark ? '#AAA8C3' : '#74738B',
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Posts Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, marginHorizontal: -6 }}>
            {MOCK_POSTS.map((post, index) => (
              <Pressable
                key={post.id}
                style={{
                  width: (SCREEN_WIDTH - 52) / 3,
                  height: (SCREEN_WIDTH - 52) / 3,
                  margin: 4,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={{ uri: post.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}
                />
              </Pressable>
            ))}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}
