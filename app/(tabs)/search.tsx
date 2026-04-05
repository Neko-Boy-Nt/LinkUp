import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Image,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/lib/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  FadeInRight
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Profile, StudentGroup } from '../../src/types';
import { Search, SlidersHorizontal, MessageCircle, Users, Code, BarChart3, Palette } from 'lucide-react-native';

type SearchFilter = 'all' | 'users' | 'groups' | 'design' | 'code' | 'data';

interface SearchResult {
  users: Profile[];
  groups: StudentGroup[];
}

const FILTERS = [
  { id: 'all' as SearchFilter, label: 'Tout' },
  { id: 'users' as SearchFilter, label: 'Utilisateurs' },
  { id: 'design' as SearchFilter, label: 'Design', icon: Palette },
  { id: 'code' as SearchFilter, label: 'Code', icon: Code },
  { id: 'data' as SearchFilter, label: 'Data Science', icon: BarChart3 },
];

const MOCK_USERS: Profile[] = [
  { id: '1', full_name: 'Thomas Rivet', username: 'thomasr', university: 'Lead Developer @TechFlow', avatar_url: null, field_of_study: 'Expert en React & Architecture Cloud. Mentor pour les projets de fin d\'étude.', bio: null, is_student: false, year_of_study: null, has_completed_onboarding: true, onboarding_step: 'complete', is_public: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', full_name: 'Sofia Chen', username: 'sofiac', university: 'Fullstack Dev | Mentor', avatar_url: null, field_of_study: 'Passionnée par l\'enseignement du code et l\'accessibilité web.', bio: null, is_student: false, year_of_study: null, has_completed_onboarding: true, onboarding_step: 'complete', is_public: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', full_name: 'Marc Lemoine', username: 'marcl', university: 'Founder @DesignNexus', avatar_url: null, field_of_study: 'Spécialiste Design Thinking et Product Strategy. 10 ans d\'expérience.', bio: null, is_student: false, year_of_study: null, has_completed_onboarding: true, onboarding_step: 'complete', is_public: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const MOCK_GROUPS: StudentGroup[] = [
  { id: '1', name: 'Algorithmique Avancée', description: 'Préparation aux entretiens techniques FAANG et résolution de problèmes complexes.', type: 'custom', member_count: 24, is_member: false, university: null, field_of_study: null, year_of_study: null, avatar_url: null, created_by: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Data Viz Storytelling', description: 'Apprendre à raconter des histoires percutantes avec des données complexes.', type: 'club', member_count: 12, is_member: false, university: null, field_of_study: null, year_of_study: null, avatar_url: null, created_by: '2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'Le Cercle des Designers', description: 'Feedback hebdomadaire sur vos portfolios et veilles technologiques créatives.', type: 'club', member_count: 42, is_member: false, university: null, field_of_study: null, year_of_study: null, avatar_url: null, created_by: '3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function UserResult({ user, index }: { user: Profile; index: number }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <View
        style={{
          backgroundColor: isDark ? 'rgba(35, 35, 63, 0.4)' : 'rgba(248, 245, 255, 0.6)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ position: 'relative' }}>
            <LinearGradient
              colors={['#CA98FF', '#9C42F4']}
              style={{
                position: 'absolute',
                inset: -2,
                borderRadius: 28,
                opacity: 0.4,
              }}
            />
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={{ width: 64, height: 64, borderRadius: 26, borderWidth: 2, borderColor: isDark ? '#23233F' : '#FFF' }}
              />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 26, backgroundColor: isDark ? '#1D1D37' : '#F8F5FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: isDark ? '#23233F' : '#FFF' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#CA98FF' }}>
                  {user.full_name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{user.full_name}</Text>
            <Text style={{ fontSize: 12, color: '#CA98FF', marginTop: 2, fontWeight: '500' }}>{user.university}</Text>
          </View>
          <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#1D1D37' : '#F8F5FF', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={18} color={isDark ? '#AAA8C3' : '#74738B'} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 13, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 12, lineHeight: 18 }}>
          {user.field_of_study}
        </Text>
        <Pressable style={{ marginTop: 16 }}>
          <LinearGradient
            colors={['rgba(202, 152, 255, 0.2)', 'rgba(156, 66, 244, 0.2)']}
            style={{
              height: 44,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(202, 152, 255, 0.3)',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#CA98FF' }}>Voir Profil</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function GroupResult({ group, index }: { group: StudentGroup; index: number }) {
  const { colors, isDark } = useTheme();

  const typeIcons: Record<string, any> = {
    design: Palette,
    code: Code,
    data: BarChart3,
  };

  const typeColors: Record<string, string> = {
    design: '#E097FD',
    code: '#CA98FF',
    data: '#FF8B9A',
  };

  const TypeIcon = typeIcons[group.type] || Users;
  const typeColor = typeColors[group.type] || '#CA98FF';

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <View
        style={{
          backgroundColor: isDark ? 'rgba(17, 17, 39, 0.6)' : 'rgba(248, 245, 255, 0.8)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${typeColor}20`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <TypeIcon size={24} color={typeColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {group.member_count} Membres en ligne
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{group.name}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: isDark ? '#AAA8C3' : '#74738B', lineHeight: 18 }}>
          {group.description}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 12, marginLeft: -4 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? '#23233F' : '#F8F5FF', marginLeft: -8, borderWidth: 2, borderColor: isDark ? '#0C0C1F' : '#FFF', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, color: isDark ? '#AAA8C3' : '#74738B' }}>{String.fromCharCode(64 + i)}</Text>
            </View>
          ))}
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDark ? '#1D1D37' : '#F0F0F5', marginLeft: -8, borderWidth: 2, borderColor: isDark ? '#0C0C1F' : '#FFF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 8, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B' }}>+{group.member_count - 3}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setTimeout(() => setLoading(false), 500);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search();
      } else {
        setHasSearched(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, filter, search]);

  const filteredUsers = MOCK_USERS.filter(u => 
    filter === 'all' || filter === 'users' || 
    (filter === 'design' && u.field_of_study?.toLowerCase().includes('design')) ||
    (filter === 'code' && (u.field_of_study?.toLowerCase().includes('react') || u.field_of_study?.toLowerCase().includes('dev'))) ||
    (filter === 'data' && u.field_of_study?.toLowerCase().includes('data'))
  );

  const filteredGroups = MOCK_GROUPS.filter(g =>
  filter === 'all' || filter === 'groups' || 
  (filter === 'design' && g.name.toLowerCase().includes('design')) ||
  (filter === 'code' && g.name.toLowerCase().includes('algorithm')) ||
  (filter === 'data' && g.name.toLowerCase().includes('data'))
);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#CA98FF' }}>
              <Image source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150?img=12' }} style={{ width: 36, height: 36 }} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginLeft: 12, letterSpacing: -1 }}>
              LinkUp
            </Text>
          </View>
          <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#111127' : '#F8F5FF', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 16 }}>
          <Search size={20} color="#CA98FF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher des cours, des mentors ou des groupes..."
            placeholderTextColor={isDark ? '#74738B' : '#AAA8C3'}
            style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 16 }}
            autoFocus
          />
          <Pressable>
            <SlidersHorizontal size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
          </Pressable>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isActive ? '#CA98FF' : isDark ? '#23233F' : '#F8F5FF',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  marginRight: 8,
                }}
              >
                {Icon && <Icon size={16} color={isActive ? '#000' : isDark ? '#AAA8C3' : '#74738B'} style={{ marginRight: 6 }} />}
                <Text style={{ color: isActive ? '#000' : isDark ? '#AAA8C3' : '#74738B', fontWeight: isActive ? '600' : '500', fontSize: 14 }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#CA98FF" />
            <Text style={{ marginTop: 16, color: isDark ? '#AAA8C3' : '#74738B' }}>
              Recherche en cours...
            </Text>
          </View>
        ) : !hasSearched ? (
          <Animated.View entering={FadeInUp.springify()}>
            {/* Featured Course Card */}
            <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800' }}
                style={{ width: '100%', height: 200 }}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(12, 12, 31, 0.9)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
              />
              <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                <View style={{ backgroundColor: 'rgba(202, 152, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#CA98FF', textTransform: 'uppercase', letterSpacing: 1 }}>Cours Populaire</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF' }}>Masterclass UI/UX Design</Text>
                <Text style={{ fontSize: 13, color: '#AAA8C3', marginTop: 4 }}>Apprenez à créer des interfaces immersives</Text>
              </View>
            </View>

            {/* Influential User */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Mentor en vedette</Text>
            <View style={{ backgroundColor: isDark ? 'rgba(35, 35, 63, 0.4)' : 'rgba(248, 245, 255, 0.6)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginBottom: 24 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ position: 'relative', marginBottom: 16 }}>
                  <LinearGradient
                    colors={['#CA98FF', '#E097FD']}
                    style={{ position: 'absolute', inset: -3, borderRadius: 35, opacity: 0.5 }}
                  />
                  <View style={{ width: 80, height: 80, borderRadius: 32, backgroundColor: '#1D1D37', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#CA98FF' }}>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#CA98FF' }}>T</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Thomas Rivet</Text>
                <Text style={{ fontSize: 13, color: '#CA98FF', marginTop: 4, fontWeight: '500' }}>Lead Developer @TechFlow</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 8, textAlign: 'center' }}>
                  Expert en React & Architecture Cloud. 12k followers.
                </Text>
                <Pressable style={{ marginTop: 16, width: '100%' }}>
                  <LinearGradient
                    colors={['rgba(202, 152, 255, 0.2)', 'rgba(156, 66, 244, 0.2)']}
                    style={{ height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(202, 152, 255, 0.3)' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#CA98FF' }}>Voir Profil</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>

            {/* Active Study Groups */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Groupes d'étude actifs</Text>
              <Text style={{ fontSize: 13, color: '#CA98FF', fontWeight: '600' }}>Voir tout</Text>
            </View>
            {MOCK_GROUPS.map((group, index) => (
              <GroupResult key={group.id} group={group} index={index} />
            ))}
          </Animated.View>
        ) : (
          <View>
            {/* Search Results: Users */}
            {(filter === 'all' || filter === 'users' || filter === 'design' || filter === 'code' || filter === 'data') && filteredUsers.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Résultats : Utilisateurs</Text>
                  <Text style={{ fontSize: 13, color: '#CA98FF', fontWeight: '600' }}>Voir tout</Text>
                </View>
                {filteredUsers.map((user, index) => (
                  <UserResult key={user.id} user={user} index={index} />
                ))}
              </View>
            )}

            {/* Search Results: Groups */}
            {(filter === 'all' || filter === 'groups' || filter === 'design' || filter === 'code' || filter === 'data') && filteredGroups.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Groupes suggérés</Text>
                  <Text style={{ fontSize: 13, color: '#CA98FF', fontWeight: '600' }}>Voir tout</Text>
                </View>
                {filteredGroups.map((group, index) => (
                  <GroupResult key={group.id} group={group} index={index} />
                ))}
              </View>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
