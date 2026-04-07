import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '../src/lib/theme';
import { supabase } from '../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, BookOpen, MessageCircle, GraduationCap, User } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState<'welcome' | 'choice'>('welcome');
  const [loading, setLoading] = useState(false);

  const glassBg = isDark ? 'rgba(35, 35, 63, 0.4)' : 'rgba(248, 245, 255, 0.6)';

  const handleProfileChoice = async (isStudent: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          is_student: isStudent,
          has_completed_onboarding: true,
          onboarding_step: 'complete',
        }).eq('id', user.id);
      }
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder votre choix');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Social',
      description: 'Rejoignez des communautés qui partagent vos passions et élargissez votre réseau au-delà de l\'amphi.',
      color: '#CA98FF',
      bgColor: 'rgba(202, 152, 255, 0.2)',
    },
    {
      icon: BookOpen,
      title: 'Études',
      description: 'Accédez à vos ressources, collaborez sur des projets de groupe et suivez votre progression académique avec élégance.',
      color: '#E097FD',
      bgColor: 'rgba(224, 151, 253, 0.2)',
      featured: true,
    },
    {
      icon: MessageCircle,
      title: 'Messagerie',
      description: 'Des échanges instantanés et sécurisés pour ne jamais perdre le fil de vos discussions importantes.',
      color: '#9C42F4',
      bgColor: 'rgba(156, 66, 244, 0.2)',
    },
  ];

  // Profile Choice Step
  if (step === 'choice') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '50%', backgroundColor: 'rgba(202, 152, 255, 0.1)', borderRadius: 999 }} />
        <View style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '50%', height: '40%', backgroundColor: 'rgba(156, 66, 244, 0.1)', borderRadius: 999 }} />

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1, textAlign: 'center' }}>
              Quel est votre profil ?
            </Text>
            <Text style={{ fontSize: 16, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 12, textAlign: 'center' }}>
              Cela nous permettra de personnaliser votre expérience
            </Text>
          </View>

          {/* Student Option */}
          <View>
            <Pressable
              onPress={() => handleProfileChoice(true)}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <LinearGradient
                colors={['#CA98FF', '#9C42F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 16,
                  shadowColor: '#9C42F4',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                    <GraduationCap size={28} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>
                      Je suis étudiant
                    </Text>
                    <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                      Accès aux groupes, ressources, événements et offres de stage
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Non-Student Option */}
          <View>
            <Pressable
              onPress={() => handleProfileChoice(false)}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <View
                style={{
                  backgroundColor: glassBg,
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 2,
                  borderColor: 'rgba(202, 152, 255, 0.3)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(202, 152, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                    <User size={28} color="#CA98FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                      Je ne suis pas étudiant
                    </Text>
                    <Text style={{ fontSize: 14, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 4 }}>
                      Messagerie, publications et stories
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Background gradients */}
      <View style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '50%', backgroundColor: 'rgba(202, 152, 255, 0.1)', borderRadius: 999 }} />
      <View style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '50%', height: '40%', backgroundColor: 'rgba(156, 66, 244, 0.1)', borderRadius: 999 }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 32 }}>
          <LinearGradient
            colors={['#CA98FF', '#9C42F4']}
            style={{
              width: 128,
              height: 128,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              shadowColor: '#CA98FF',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 30,
            }}
          >
            <Text style={{ fontSize: 64, fontWeight: '900', color: '#FFF' }}>L</Text>
          </LinearGradient>
          <Text style={{ fontSize: 40, fontWeight: '900', color: colors.text, letterSpacing: -2 }}>
            LinkUp
          </Text>
        </View>

        {/* Welcome Message */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: -1 }}>
            L'excellence académique,{'\n'}le lien en plus.
          </Text>
          <Text style={{ fontSize: 16, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center', marginTop: 16, lineHeight: 24, fontWeight: '400' }}>
            Bienvenue dans votre nouvel écosystème étudiant. Un espace fluide conçu pour connecter vos ambitions, vos projets et vos rencontres.
          </Text>
        </View>

        {/* Feature Bento Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
          {features.map((feature, index) => (
            <View
              key={feature.title}
              style={{
                flex: 1,
                minWidth: feature.featured ? '100%' : '45%',
                backgroundColor: glassBg,
                borderRadius: 16,
                padding: 24,
                borderWidth: feature.featured ? 1 : 1,
                borderColor: feature.featured ? 'rgba(202, 152, 255, 0.3)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                shadowColor: feature.featured ? '#CA98FF' : 'transparent',
                shadowOffset: { width: 0, height: feature.featured ? 10 : 0 },
                shadowOpacity: feature.featured ? 0.2 : 0,
                shadowRadius: feature.featured ? 20 : 0,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: feature.bgColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <feature.icon size={24} color={feature.color} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                {feature.title}
              </Text>
              <Text style={{ fontSize: 13, color: isDark ? '#AAA8C3' : '#74738B', lineHeight: 20 }}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <View>
          <Pressable onPress={() => setStep('choice')}>
            <LinearGradient
              colors={['#CA98FF', '#9C42F4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 60,
                borderRadius: 30,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#9C42F4',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>
                Commencer l'aventure
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Footer Quote */}
        <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 40 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#74738B' : '#AAA8C3', textTransform: 'uppercase', letterSpacing: 2 }}>
            Conçu pour la nouvelle génération d'étudiants
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
