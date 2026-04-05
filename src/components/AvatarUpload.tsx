import React, { useState } from 'react';
import { View, Image, Pressable, Alert, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AvatarUploadProps {
  size?: number;
  url: string | null;
  onUpload: (url: string) => void;
  editable?: boolean;
}

export function AvatarUpload({ size = 100, url, onUpload, editable = true }: AvatarUploadProps) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { stiffness: 400, damping: 17 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 17 });
  };

  const pickImage = async () => {
    if (!editable) return;

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!session?.user?.id) return;

    setUploading(true);
    try {
      // Convertir l'URI en blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Générer un nom de fichier unique
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      Alert.alert('Succès', 'Photo de profil mise à jour !');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'uploader l\'image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <AnimatedPressable
        onPress={pickImage}
        disabled={!editable || uploading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surface,
            overflow: 'hidden',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          },
          animatedStyle,
        ]}
      >
        {url ? (
          <Image
            source={{ uri: url }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: size * 0.4, color: '#FFF', fontWeight: 'bold' }}>
              👤
            </Text>
          </View>
        )}

        {uploading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: size / 2,
            }}
          >
            <ActivityIndicator color="#FFF" />
          </View>
        )}

        {editable && !uploading && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingVertical: 4,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>
              Modifier
            </Text>
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}
