import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useTheme } from '../src/lib/theme';
import { useAuth } from '../src/providers/AuthProvider';
import { supabase } from '../src/lib/supabase';
import Animated, { FadeInUp, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'choice' | 'student_info' | 'username'>('choice');
  const [isStudent, setIsStudent] = useState<boolean | null>(null);
  const [university, setUniversity] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileChoice = async (student: boolean) => {
    setIsStudent(student);
    setLoading(true);

    try {
      if (student) {
        // Student - go to student info step
        await supabase.from('profiles').update({
          is_student: true,
          onboarding_step: 'student_info',
        }).eq('id', user!.id);
        setStep('student_info');
      } else {
        // Non-student - skip to username
        await supabase.from('profiles').update({
          is_student: false,
          has_completed_onboarding: true,
          onboarding_step: 'username',
        }).eq('id', user!.id);
        setStep('username');
      }
      await refreshProfile();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentInfo = async () => {
    if (!university || !fieldOfStudy || !yearOfStudy) {
      Alert.alert('Info manquante', 'Remplis tous les champs');
      return;
    }

    setLoading(true);
    try {
      await supabase.from('profiles').update({
        university,
        field_of_study: fieldOfStudy,
        year_of_study: yearOfStudy,
        onboarding_step: 'username',
      }).eq('id', user!.id);

      await refreshProfile();
      setStep('username');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

  const handleUsername = async () => {
    if (!username || username.length < 3) {
      Alert.alert('Pseudo invalide', 'Minimum 3 caractères');
      return;
    }

    setLoading(true);
    try {
      // Check availability
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user!.id)
        .maybeSingle();

      if (data) {
        Alert.alert('Pseudo pris', 'Choisis un autre pseudo');
        setLoading(false);
        return;
      }

      await supabase.from('profiles').update({
        username: username.toLowerCase(),
        has_completed_onboarding: true,
        onboarding_step: 'complete',
      }).eq('id', user!.id);

      await refreshProfile();
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

  const renderChoiceStep = () => (
    <Animated.View entering={FadeInUp.springify()} style={{ padding: 24 }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
        Bienvenue sur LinkUp !
      </Text>
      <Text style={{ fontSize: 16, color: colors.text, opacity: 0.7, marginBottom: 40 }}>
        Quel est ton profil ?
      </Text>

      <Pressable
        onPress={() => handleProfileChoice(true)}
        disabled={loading}
        style={{
          backgroundColor: colors.primary,
          padding: 24,
          borderRadius: 20,
          marginBottom: 16,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🎓</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFF' }}>
          Je suis étudiant
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Accès aux groupes, ressources, événements et offres de stage
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleProfileChoice(false)}
        disabled={loading}
        style={{
          backgroundColor: colors.surface,
          padding: 24,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: colors.primary + '40',
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ fontSize: 40, marginBottom: 8 }}>👤</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
          Je ne suis pas étudiant
        </Text>
        <Text style={{ fontSize: 14, color: colors.text, opacity: 0.6, marginTop: 4 }}>
          Messagerie, publications et stories
        </Text>
      </Pressable>
    </Animated.View>
  );

  const renderStudentInfoStep = () => (
    <Animated.View entering={FadeInRight.springify()} style={{ padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
        🎓 Info étudiant
      </Text>
      <Text style={{ fontSize: 16, color: colors.text, opacity: 0.7, marginBottom: 32 }}>
        Ces infos permettront de te connecter avec d'autres étudiants
      </Text>

      <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Université / École</Text>
      <TextInput
        value={university}
        onChangeText={setUniversity}
        placeholder="Ex: Université Paris-Saclay"
        style={{
          backgroundColor: colors.surface,
          padding: 16,
          borderRadius: 12,
          color: colors.text,
          fontSize: 16,
          marginBottom: 20,
        }}
      />

      <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Filière</Text>
      <TextInput
        value={fieldOfStudy}
        onChangeText={setFieldOfStudy}
        placeholder="Ex: Informatique"
        style={{
          backgroundColor: colors.surface,
          padding: 16,
          borderRadius: 12,
          color: colors.text,
          fontSize: 16,
          marginBottom: 20,
        }}
      />

      <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Année d'études</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3, 4, 5].map((year) => (
          <Pressable
            key={year}
            onPress={() => setYearOfStudy(year)}
            style={{
              flex: 1,
              backgroundColor: yearOfStudy === year ? colors.primary : colors.surface,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: yearOfStudy === year ? '#FFF' : colors.text,
              }}
            >
              {year}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleStudentInfo}
        disabled={loading}
        style={{
          backgroundColor: colors.primary,
          padding: 18,
          borderRadius: 16,
          alignItems: 'center',
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
          {loading ? '...' : 'Continuer'}
        </Text>
      </Pressable>
    </Animated.View>
  );

  const renderUsernameStep = () => (
    <Animated.View entering={FadeInUp.springify()} style={{ padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
        Choisis ton pseudo
      </Text>
      <Text style={{ fontSize: 16, color: colors.text, opacity: 0.7, marginBottom: 32 }}>
        C'est comme ça que les autres te verront
      </Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="pseudo"
        autoCapitalize="none"
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 16,
          color: colors.text,
          fontSize: 20,
          textAlign: 'center',
          marginBottom: 32,
        }}
      />

      <Text style={{ fontSize: 14, color: colors.text, opacity: 0.6, marginBottom: 32, textAlign: 'center' }}>
        Lettres, chiffres et underscores uniquement{'\n'}
        3-20 caractères
      </Text>

      <Pressable
        onPress={handleUsername}
        disabled={loading || !username}
        style={{
          backgroundColor: username ? colors.primary : colors.surface,
          padding: 18,
          borderRadius: 16,
          alignItems: 'center',
          opacity: loading || !username ? 0.6 : 1,
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
          {loading ? '...' : 'C\'est parti !'}
        </Text>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'choice' && renderChoiceStep()}
        {step === 'student_info' && renderStudentInfoStep()}
        {step === 'username' && renderUsernameStep()}
      </ScrollView>
    </View>
  );
}

// TextInput component for the screen
function TextInput({
  value,
  onChangeText,
  placeholder,
  style,
  autoCapitalize = 'sentences',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const { isDark } = useTheme();
  return (
    <View style={style}>
      <input
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          color: style?.color || '#000',
          fontSize: style?.fontSize || 16,
        }}
      />
    </View>
  );
}
