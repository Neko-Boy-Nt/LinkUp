import { useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/lib/theme';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E0D7FF',
            paddingBottom: Platform.OS === 'ios' ? 20 : 12,
            paddingTop: 12,
            height: Platform.OS === 'ios' ? 100 : 90,
          },
          tabBarActiveTintColor: '#8A2BE2',
          tabBarInactiveTintColor: '#666666',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        {/* Accueil */}
        <Tabs.Screen
          name="home"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 24,
                  backgroundColor: focused ? 'rgba(202, 152, 255, 0.2)' : 'transparent',
                  transform: [{ scale: focused ? 1.1 : 1 }],
                }}
              >
                <MaterialCommunityIcons
                  name={focused ? 'home' : 'home'}
                  size={24}
                  color={color}
                  style={{ marginBottom: 4 }}
                />
              </View>
            ),
          }}
        />

        {/* Recherche */}
        <Tabs.Screen
          name="search"
          options={{
            title: 'Recherche',
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 24,
                  backgroundColor: focused ? 'rgba(202, 152, 255, 0.2)' : 'transparent',
                  transform: [{ scale: focused ? 1.1 : 1 }],
                }}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={24}
                  color={color}
                  style={{ marginBottom: 4 }}
                />
              </View>
            ),
          }}
        />

        {/* Espace Étudiant */}
        <Tabs.Screen
          name="student"
          options={{
            title: 'Espace',
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 24,
                  backgroundColor: focused ? 'rgba(202, 152, 255, 0.2)' : 'transparent',
                  transform: [{ scale: focused ? 1.1 : 1 }],
                }}
              >
                <MaterialCommunityIcons
                  name="school"
                  size={24}
                  color={color}
                  style={{ marginBottom: 4 }}
                />
              </View>
            ),
          }}
        />

        {/* Messages */}
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 24,
                  backgroundColor: focused ? 'rgba(202, 152, 255, 0.2)' : 'transparent',
                  transform: [{ scale: focused ? 1.1 : 1 }],
                }}
              >
                <MaterialCommunityIcons
                  name="chat"
                  size={24}
                  color={color}
                  style={{ marginBottom: 4 }}
                />
              </View>
            ),
          }}
        />

        {/* Profil */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 24,
                  backgroundColor: focused ? 'rgba(202, 152, 255, 0.2)' : 'transparent',
                  transform: [{ scale: focused ? 1.1 : 1 }],
                }}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={24}
                  color={color}
                  style={{ marginBottom: 4 }}
                />
              </View>
            ),
          }}
        />
      </Tabs>

      {/* FAB avec Gradient - Positionné au-dessus de la navbar */}
      <Pressable
        onPress={() => setShowCreateModal(true)}
        style={{
          position: 'absolute',
          bottom: 85,
          right: 20,
          zIndex: 50,
        }}
      >
        <LinearGradient
          colors={['#CA98FF', '#9c42f4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            shadowColor: '#CA98FF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Pressable
            style={({ pressed }) => ({
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <MaterialCommunityIcons name="plus" size={32} color="#fff" />
          </Pressable>
        </LinearGradient>
      </Pressable>
    </>
  );
}