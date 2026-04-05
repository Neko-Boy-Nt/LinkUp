import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../src/providers/AuthProvider';
import { useTheme } from '../../src/lib/theme';
import { AnimatedButton } from '../../src/components/AnimatedButton';
import { AvatarUpload } from '../../src/components/AvatarUpload';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Profile } from '../../src/types';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, user } = useAuth();
  const { colors, isDark } = useTheme();

  const [formData, setFormData] = useState<Partial<Profile>>({
    full_name: '',
    username: '',
    bio: '',
    university: '',
    field_of_study: '',
    year_of_study: undefined,
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        university: profile.university || '',
        field_of_study: profile.field_of_study || '',
        year_of_study: profile.year_of_study || undefined,
      });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    const updates: Partial<Profile> = {
      ...formData,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await updateProfile(updates);

    setLoading(false);

    if (error) {
      setError(error.message || 'Erreur lors de la mise à jour du profil');
    } else {
      router.back();
    }
  };

  const updateField = (field: keyof Profile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary }}>
            Modifier le profil
          </Text>
          <Text style={{ fontSize: 16, color: isDark ? '#B57EDC' : '#9B59B6', marginTop: 8 }}>
            Personnalise ton profil étudiant
          </Text>
        </Animated.View>

        {/* Avatar Upload */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={{ alignItems: 'center', marginBottom: 32 }}>
          <AvatarUpload
            url={avatarUrl}
            onUpload={handleAvatarUpload}
            size={120}
          />
          <Text style={{ color: isDark ? '#B57EDC' : '#9B59B6', marginTop: 12, fontSize: 14 }}>
            Appuie pour changer ta photo
          </Text>
        </Animated.View>

        {/* Error Message */}
        {error ? (
          <Animated.View entering={FadeInUp} style={{ marginBottom: 16 }}>
            <Text style={{ color: '#FF6B6B', textAlign: 'center' }}>{error}</Text>
          </Animated.View>
        ) : null}

        {/* Form Fields */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={{ gap: 16 }}>
          {/* Full Name */}
          <View>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
              Nom complet
            </Text>
            <TextInput
              value={formData.full_name || ''}
              onChangeText={(text) => updateField('full_name', text)}
              placeholder="Ton nom complet"
              placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                color: colors.text,
                fontSize: 16,
              }}
            />
          </View>

          {/* Username */}
          <View>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
              Nom d'utilisateur
            </Text>
            <TextInput
              value={formData.username || ''}
              onChangeText={(text) => updateField('username', text)}
              placeholder="@username"
              placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
              autoCapitalize="none"
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                color: colors.text,
                fontSize: 16,
              }}
            />
          </View>

          {/* Bio */}
          <View>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
              Bio
            </Text>
            <TextInput
              value={formData.bio || ''}
              onChangeText={(text) => updateField('bio', text)}
              placeholder="Décrivez-vous en quelques mots..."
              placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                color: colors.text,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* University */}
          <View>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
              Université / École
            </Text>
            <TextInput
              value={formData.university || ''}
              onChangeText={(text) => updateField('university', text)}
              placeholder="Ton université"
              placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                color: colors.text,
                fontSize: 16,
              }}
            />
          </View>

          {/* Field of Study */}
          <View>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
              Filière
            </Text>
            <TextInput
              value={formData.field_of_study || ''}
              onChangeText={(text) => updateField('field_of_study', text)}
              placeholder="Ta filière (ex: Informatique, Droit...)"
              placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                color: colors.text,
                fontSize: 16,
              }}
            />
          </View>

          {/* Year of Study */}
          <View>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
              Année d'études
            </Text>
            <TextInput
              value={formData.year_of_study?.toString() || ''}
              onChangeText={(text) => updateField('year_of_study', parseInt(text) || undefined)}
              placeholder="Année (1, 2, 3, Master, Doctorat...)"
              placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
              keyboardType="numeric"
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                color: colors.text,
                fontSize: 16,
              }}
            />
          </View>

          {/* Save Button */}
          <AnimatedButton
            title="Enregistrer les modifications"
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: 16 }}
          />

          {/* Cancel Button */}
          <AnimatedButton
            title="Annuler"
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: 8 }}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
