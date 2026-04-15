import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

// Fonction pour traduire les erreurs Supabase en français
const translateAuthError = (error: any): string => {
  if (!error) return 'Une erreur est survenue';
  
  const message = error.message || error.toString();
  
  // Erreurs de connexion
  if (message.includes('Invalid login credentials')) {
    return 'Email ou mot de passe incorrect';
  }
  if (message.includes('Email not confirmed')) {
    return 'Email non confirmé. Vérifie ta boîte de réception';
  }
  if (message.includes('User not found')) {
    return 'Aucun compte trouvé avec cet email';
  }
  if (message.includes('Invalid email')) {
    return 'Adresse email invalide';
  }
  if (message.includes('rate limit')) {
    return 'Trop de tentatives. Réessaie dans quelques minutes';
  }
  if (message.includes('network')) {
    return 'Problème de connexion internet. Vérifie ta connexion';
  }
  if (message.includes('timeout')) {
    return 'Délai dépassé. Réessaie';
  }
  
  return message;
};

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/(tabs)/home');
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(translateAuthError(error));
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const glassBg = isDark ? 'rgba(35, 35, 63, 0.4)' : 'rgba(248, 245, 255, 0.6)';
  const inputBg = isDark ? '#111127' : '#F8F5FF';

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
        <View style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', backgroundColor: 'rgba(156, 66, 244, 0.15)', borderRadius: 999 }} />
        <View style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', backgroundColor: 'rgba(82, 12, 112, 0.15)', borderRadius: 999 }} />

        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <LinearGradient
              colors={['#CA98FF', '#9C42F4']}
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFF' }}>L</Text>
            </LinearGradient>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>
              Bon retour
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 8 }}>
              Connectez-vous pour continuer sur LinkUp
            </Text>
          </View>

          <View
            style={{
              backgroundColor: glassBg,
              borderRadius: 20,
              padding: 32,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}
          >
            {error ? (
              <View style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF6B6B' }}>
                <Text style={{ color: '#FF6B6B', textAlign: 'center', fontSize: 14, fontWeight: '500' }}>
                  ⚠️ {error}
                </Text>
              </View>
            ) : null}

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Email
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, height: 56 }}>
                <Mail size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                <RNTextInput
                  placeholder="nom@exemple.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 16 }}
                  placeholderTextColor={isDark ? '#74738B' : '#AAA8C3'}
                />
              </View>
            </View>

            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 16, marginBottom: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Mot de passe
                </Text>
                <Pressable onPress={() => {}}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#CA98FF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Mot de passe oublié ?
                  </Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, height: 56 }}>
                <Lock size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                <RNTextInput
                  placeholder="••••••••"
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

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={{ marginTop: 24, opacity: loading ? 0.7 : 1 }}
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
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#000', marginRight: 8 }}>
                  {loading ? 'Connexion...' : 'Connexion'}
                </Text>
                <ArrowRight size={20} color="#000" />
              </LinearGradient>
            </Pressable>

            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <Text style={{ color: isDark ? '#AAA8C3' : '#74738B', fontSize: 14 }}>
                Pas encore de compte ?{' '}
                <Text onPress={() => router.push('/(auth)/register')} style={{ color: '#CA98FF', fontWeight: '700' }}>
                  Créer un compte
                </Text>
              </Text>
            </View>
          </View>

          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Pressable onPress={() => router.push('/')}>
              <Text style={{ color: isDark ? '#AAA8C3' : '#74738B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 2 }}>
                ← Retour à l'accueil
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
