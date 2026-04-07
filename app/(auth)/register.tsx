import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/(auth)/login` : undefined
      }
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  // Glassmorphism background colors
  const glassBg = isDark ? 'rgba(35, 35, 63, 0.4)' : 'rgba(248, 245, 255, 0.6)';
  const inputBg = isDark ? '#111127' : '#F8F5FF';

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 40, color: '#FFF' }}>✓</Text>
          </LinearGradient>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 16, textAlign: 'center' }}>
            Compte créé !
          </Text>
          <Text style={{ fontSize: 16, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            Un email de confirmation a été envoyé.{'\n'}Vérifie ta boîte de réception et reviens te connecter.
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: '#46007D', fontSize: 16, fontWeight: '700' }}>
              Aller à la connexion
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Background gradients */}
        <View style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', backgroundColor: 'rgba(156, 66, 244, 0.15)', borderRadius: 999 }} />
        <View style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', backgroundColor: 'rgba(82, 12, 112, 0.15)', borderRadius: 999 }} />

        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          {/* Brand Identity */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ position: 'relative', marginBottom: 24 }}>
              <LinearGradient
                colors={['#CA98FF', '#9C42F4']}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 48, fontWeight: '900', color: '#FFF' }}>L</Text>
              </LinearGradient>
            </View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1 }}>
              REJOINDRE LINKUP
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 8, fontWeight: '500' }}>
              L'excellence académique à portée de clic
            </Text>
          </View>

          {/* Main Form */}
          <View 
           
            style={{
              backgroundColor: glassBg,
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}
          >
            {error ? (
              <Text
               
                style={{
                  color: '#FF6B6B',
                  textAlign: 'center',
                  marginBottom: 16,
                  fontSize: 14,
                }}
              >
                {error}
              </Text>
            ) : null}

            {/* Full Name Field */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Nom complet
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, height: 56 }}>
                <User size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                <RNTextInput
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChangeText={setFullName}
                  style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 16 }}
                  placeholderTextColor={isDark ? '#74738B' : '#AAA8C3'}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Email
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, height: 56 }}>
                <Mail size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                <RNTextInput
                  placeholder="nom@etudiant.fr"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 16 }}
                  placeholderTextColor={isDark ? '#74738B' : '#AAA8C3'}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Mot de passe
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, height: 56 }}>
                <Lock size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                <RNTextInput
                  placeholder="••••••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 16 }}
                  placeholderTextColor={isDark ? '#74738B' : '#AAA8C3'}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                  ) : (
                    <Eye size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* CTA Button */}
            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <LinearGradient
                colors={['#CA98FF', '#9C42F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 56,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#9C42F4',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 8,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#000', marginRight: 8 }}>
                  {loading ? 'Création...' : 'Créer un compte'}
                </Text>
                <ArrowRight size={20} color="#000" />
              </LinearGradient>
            </Pressable>

            {/* Social Login Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#AAA8C3' : '#74738B', marginHorizontal: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                Ou continuer avec
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            </View>

            {/* Social Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                style={{
                  flex: 1,
                  height: 56,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>G</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>Google</Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  height: 56,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>🍎</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>Apple</Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: isDark ? '#AAA8C3' : '#74738B', fontSize: 14 }}>
              Déjà membre ?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: '#9C42F4', fontSize: 14, fontWeight: '700' }}>
                Connectez-vous
              </Text>
            </Pressable>
          </View>

          {/* Terms */}
          <Text style={{ fontSize: 10, color: isDark ? '#74738B' : '#AAA8C3', textAlign: 'center', marginTop: 16, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20 }}>
            En vous inscrivant, vous acceptez nos Conditions d'utilisation & Politique de confidentialité
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}