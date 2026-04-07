import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, Pressable, Image, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../src/providers/AuthProvider';
import { useTheme } from '../../src/lib/theme';
import { AnimatedButton } from '../../src/components/AnimatedButton';
import { AvatarUpload } from '../../src/components/AvatarUpload';

import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Profile } from '../../src/types';
import { Camera, Lock, X, Eye, EyeOff } from '../../src/components/Icon';

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
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      setCoverUrl(profile.cover_url || null);
    }
  }, [profile]);

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
  };

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const uri = result.assets[0].uri;
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `${user?.id}/cover_${Date.now()}.jpg`;
        
        const { error } = await supabase.storage
          .from('cover-images')
          .upload(fileName, blob);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('cover-images')
          .getPublicUrl(fileName);
        
        setCoverUrl(publicUrl);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de télécharger la photo de couverture');
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    const updates: Partial<Profile> = {
      ...formData,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
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
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      Alert.alert('Succès', 'Mot de passe modifié avec succès');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de modifier le mot de passe');
    } finally {
      setPasswordLoading(false);
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
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary }}>
            Modifier le profil
          </Text>
          <Text style={{ fontSize: 16, color: isDark ? '#B57EDC' : '#9B59B6', marginTop: 8 }}>
            Personnalise ton profil étudiant
          </Text>
        </View>

        {/* Avatar Upload */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <AvatarUpload
            url={avatarUrl}
            onUpload={handleAvatarUpload}
            size={120}
          />
          <Text style={{ color: isDark ? '#B57EDC' : '#9B59B6', marginTop: 12, fontSize: 14 }}>
            Appuie pour changer ta photo
          </Text>
        </View>

        {/* Cover Photo Upload */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
            Photo de couverture
          </Text>
          <Pressable onPress={pickCoverImage} style={{ position: 'relative' }}>
            <View style={{
              width: '100%',
              height: 120,
              borderRadius: 16,
              backgroundColor: colors.surface,
              overflow: 'hidden',
            }}>
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={32} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
                  <Text style={{ color: isDark ? '#6B5B7A' : '#9B8AA8', marginTop: 8 }}>
                    Ajouter une photo de couverture
                  </Text>
                </View>
              )}
            </View>
            {coverUrl && (
              <View style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 20,
                padding: 8,
              }}>
                <Camera size={16} color="#FFF" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Change Password Button */}
        <View style={{ marginBottom: 24 }}>
          <Pressable
            onPress={() => setShowPasswordModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
            }}
          >
            <Lock size={20} color={colors.primary} />
            <Text style={{ color: colors.text, marginLeft: 12, flex: 1, fontWeight: '600' }}>
              Changer le mot de passe
            </Text>
            <Text style={{ color: isDark ? '#6B5B7A' : '#9B8AA8' }}>›</Text>
          </Pressable>
        </View>

        {/* Password Change Modal */}
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
                  Changer le mot de passe
                </Text>
                <Pressable onPress={() => setShowPasswordModal(false)}>
                  <X size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
                </Pressable>
              </View>

              {/* New Password */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>
                  Nouveau mot de passe
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                }}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nouveau mot de passe"
                    placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
                    secureTextEntry={!showNewPassword}
                    style={{
                      flex: 1,
                      padding: 16,
                      color: colors.text,
                      fontSize: 16,
                    }}
                  />
                  <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? (
                      <EyeOff size={20} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
                    ) : (
                      <Eye size={20} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>
                  Confirmer le mot de passe
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
                  secureTextEntry={!showNewPassword}
                  style={{
                    backgroundColor: colors.surface,
                    padding: 16,
                    borderRadius: 12,
                    color: colors.text,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Change Password Button */}
              <Pressable
                onPress={handleChangePassword}
                disabled={passwordLoading || !newPassword || !confirmPassword}
                style={{
                  backgroundColor: colors.primary,
                  padding: 18,
                  borderRadius: 16,
                  alignItems: 'center',
                  opacity: passwordLoading || !newPassword || !confirmPassword ? 0.5 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                  {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Error Message */}
        {error ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#FF6B6B', textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={{ gap: 16 }}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
