import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/lib/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { useResponsive } from '../../src/hooks/useResponsive';
import { GlassmorphismCard } from '../../src/components/GlassmorphismCard';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Bell,
  Users,
  BookOpen,
  Calendar,
  Briefcase,
  Search,
  Plus,
  Download,
  Clock,
  MapPin,
  ChevronRight,
  FileText,
  Video,
  Link as LinkIcon,
  MoreVertical,
  Flame,
} from '../../src/components/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'groupes' | 'ressources' | 'calendrier' | 'opportunites';

// Dynamic data types
interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  icon: string;
}

interface Resource {
  id: string;
  title: string;
  subject: string;
  size: string;
  type: string;
  downloads: number;
}

interface Subject {
  id: string;
  name: string;
  files: number;
  icon: string;
  color: string;
}

interface Event {
  id: string;
  title: string;
  type: 'cours' | 'echeance' | 'evenement';
  time: string;
  location: string;
  color: string;
}

interface Opportunity {
  id: string;
  title: string;
  company: string;
  type: 'stage' | 'alternance' | 'job';
  location: string;
  deadline: string;
  logo: string;
}

// Tab Button Component
function TabButton({ active, onPress, icon: Icon, label }: { active: boolean; onPress: () => void; icon: any; label: string }) {
  const { isDark } = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: active ? '#CA98FF' : 'transparent',
      }}
    >
      <Icon size={20} color={active ? '#CA98FF' : isDark ? '#AAA8C3' : '#74738B'} />
      <Text
        style={{
          fontSize: 11,
          fontWeight: active ? '600' : '400',
          color: active ? '#CA98FF' : isDark ? '#AAA8C3' : '#74738B',
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Group Card Component
function GroupCard({ group }: { group: Group }) {
  const { isDark } = useTheme();
  const { fontScale } = useResponsive();
  
  return (
    <GlassmorphismCard
      intensity="medium"
      style={{
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }}
    >
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'rgba(202,152,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 24 * fontScale }}>{group.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16 * fontScale, fontWeight: 'bold', color: isDark ? '#E5E3FF' : '#1E1E1E' }}>{group.name}</Text>
          <Text style={{ fontSize: 12 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 2 }}>{group.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Users size={12} color={isDark ? '#AAA8C3' : '#74738B'} />
            <Text style={{ fontSize: 11 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 4 }}>{group.members} membres</Text>
          </View>
        </View>
        <Pressable
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: '#CA98FF',
          }}
        >
          <Text style={{ fontSize: 12 * fontScale, fontWeight: 'bold', color: '#46007D' }}>Rejoindre</Text>
        </Pressable>
      </View>
    </GlassmorphismCard>
  );
}

// Resource Card Component
function ResourceCard({ resource }: { resource: Resource }) {
  const { isDark } = useTheme();
  const { fontScale } = useResponsive();
  
  const getIcon = () => {
    switch (resource.type) {
      case 'pdf': return <FileText size={20} color="#CA98FF" />;
      case 'video': return <Video size={20} color="#FF8B9A" />;
      case 'link': return <LinkIcon size={20} color="#E097FD" />;
      default: return <FileText size={20} color="#CA98FF" />;
    }
  };
  
  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: isDark ? 'rgba(202,152,255,0.2)' : 'rgba(202,152,255,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {getIcon()}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14 * fontScale, fontWeight: '600', color: isDark ? '#E5E3FF' : '#1E1E1E' }} numberOfLines={1}>
          {resource.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 11 * fontScale, color: '#CA98FF', fontWeight: '500' }}>{resource.subject}</Text>
          <Text style={{ fontSize: 11 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 8 }}>{resource.size}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Download size={18} color={isDark ? '#AAA8C3' : '#74738B'} />
        <Text style={{ fontSize: 10 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 2 }}>{resource.downloads}</Text>
      </View>
    </Pressable>
  );
}

// Event Card Component
function EventCard({ event }: { event: Event }) {
  const { isDark } = useTheme();
  const { fontScale } = useResponsive();
  
  const getIcon = () => {
    switch (event.type) {
      case 'cours': return <BookOpen size={18} color={event.color} />;
      case 'echeance': return <Clock size={18} color={event.color} />;
      case 'evenement': return <Users size={18} color={event.color} />;
      default: return <Calendar size={18} color={event.color} />;
    }
  };
  
  return (
    <GlassmorphismCard
      intensity="medium"
      style={{
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: event.color,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }}
    >
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10 * fontScale, color: event.color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
              {event.type === 'cours' ? 'Cours' : event.type === 'echeance' ? 'Échéance' : 'Événement'}
            </Text>
            <Text style={{ fontSize: 16 * fontScale, fontWeight: 'bold', color: isDark ? '#E5E3FF' : '#1E1E1E', marginTop: 4 }}>
              {event.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Clock size={14} color={isDark ? '#AAA8C3' : '#74738B'} />
              <Text style={{ fontSize: 12 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 6 }}>{event.time}</Text>
              <MapPin size={14} color={isDark ? '#AAA8C3' : '#74738B'} style={{ marginLeft: 12 }} />
              <Text style={{ fontSize: 12 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 6 }}>{event.location}</Text>
            </View>
          </View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(35,35,63,0.8)' : 'rgba(248,245,255,0.8)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getIcon()}
          </View>
        </View>
      </View>
    </GlassmorphismCard>
  );
}

// Opportunity Card Component
function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const { isDark } = useTheme();
  const { fontScale } = useResponsive();
  
  const getTypeColor = () => {
    switch (opportunity.type) {
      case 'stage': return '#CA98FF';
      case 'alternance': return '#E097FD';
      case 'job': return '#FF8B9A';
      default: return '#CA98FF';
    }
  };
  
  return (
    <GlassmorphismCard
      intensity="medium"
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }}
    >
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: `${getTypeColor()}20`,
            }}
          >
            <Text style={{ fontSize: 10 * fontScale, fontWeight: 'bold', color: getTypeColor(), textTransform: 'uppercase' }}>
              {opportunity.type}
            </Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Text style={{ fontSize: 28 * fontScale }}>{opportunity.logo}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 18 * fontScale, fontWeight: 'bold', color: isDark ? '#E5E3FF' : '#1E1E1E' }}>{opportunity.title}</Text>
            <Text style={{ fontSize: 14 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 2 }}>{opportunity.company}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MapPin size={14} color={isDark ? '#AAA8C3' : '#74738B'} />
            <Text style={{ fontSize: 12 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', marginLeft: 6 }}>{opportunity.location}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
            <Clock size={14} color="#FF6E84" />
            <Text style={{ fontSize: 12 * fontScale, color: '#FF6E84', marginLeft: 6 }}>Avant le {opportunity.deadline}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14 * fontScale, fontWeight: '600', color: isDark ? '#E5E3FF' : '#1E1E1E' }}>Voir l'offre</Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: '#CA98FF',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14 * fontScale, fontWeight: 'bold', color: '#46007D' }}>Postuler</Text>
          </Pressable>
        </View>
      </View>
    </GlassmorphismCard>
  );
}

export default function StudentScreen() {
  const { colors, isDark } = useTheme();
  const { profile, user } = useAuth();
  const router = useRouter();
  const { fontScale } = useResponsive();
  const [activeTab, setActiveTab] = useState<TabType>('groupes');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dynamic data states - empty initially, will be fetched from Supabase
  const [groups, setGroups] = useState<Group[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Fetch data from Supabase when tab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'groupes':
          const { data: groupsData } = await supabase.from('student_groups').select('*').limit(10);
          setGroups(groupsData || []);
          break;
        case 'ressources':
          const { data: resourcesData } = await supabase.from('resources').select('*').limit(10);
          const { data: subjectsData } = await supabase.from('subjects').select('*').limit(10);
          setResources(resourcesData || []);
          setSubjects(subjectsData || []);
          break;
        case 'calendrier':
          const { data: eventsData } = await supabase.from('events').select('*').limit(10);
          setEvents(eventsData || []);
          break;
        case 'opportunites':
          const { data: opportunitiesData } = await supabase.from('opportunities').select('*').limit(10);
          setOpportunities(opportunitiesData || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarInitial = () => {
    if (profile?.full_name) return profile.full_name.charAt(0).toUpperCase();
    if (profile?.username) return profile.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: '#CA98FF',
              padding: 2,
            }}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{getAvatarInitial()}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#CA98FF' }}>Espace Étudiant</Text>
        </View>

        <Pressable onPress={() => {}} style={{ padding: 8 }}>
          <Bell size={24} color="#CA98FF" />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        <TabButton active={activeTab === 'groupes'} onPress={() => setActiveTab('groupes')} icon={Users} label="Groupes" />
        <TabButton active={activeTab === 'ressources'} onPress={() => setActiveTab('ressources')} icon={BookOpen} label="Ressources" />
        <TabButton active={activeTab === 'calendrier'} onPress={() => setActiveTab('calendrier')} icon={Calendar} label="Calendrier" />
        <TabButton active={activeTab === 'opportunites'} onPress={() => setActiveTab('opportunites')} icon={Briefcase} label="Offres" />
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ padding: 20 }}>
          
          {/* GROUPES TAB */}
          {activeTab === 'groupes' && (
            <View>
              {/* Search */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                  borderRadius: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <Search size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher des groupes..."
                  placeholderTextColor={isDark ? 'rgba(170,168,195,0.5)' : 'rgba(116,115,139,0.5)'}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Create Group Button */}
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: '#CA98FF',
                  borderStyle: 'dashed',
                  marginBottom: 20,
                }}
              >
                <Plus size={20} color="#CA98FF" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#CA98FF', marginLeft: 8 }}>Créer un groupe</Text>
              </Pressable>

              {/* Groups List */}
              <Text style={{ fontSize: 18 * fontScale, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Groupes recommandés</Text>
              {loading ? (
                <ActivityIndicator color="#CA98FF" />
              ) : groups.length === 0 ? (
                <Text style={{ fontSize: 14 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center', marginTop: 20 }}>
                  Aucun groupe disponible
                </Text>
              ) : (
                groups.map((group: Group) => (
                  <GroupCard key={group.id} group={group} />
                ))
              )}
            </View>
          )}

          {/* RESSOURCES TAB */}
          {activeTab === 'ressources' && (
            <View>
              {/* Search */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                  borderRadius: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <Search size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
                <TextInput
                  placeholder="Rechercher des ressources..."
                  placeholderTextColor={isDark ? 'rgba(170,168,195,0.5)' : 'rgba(116,115,139,0.5)'}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Categories */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {['PDF', 'Vidéo', 'Liens', 'eBooks'].map((cat, index) => (
                  <Pressable
                    key={cat}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: index === 0 ? '#CA98FF' : isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: index === 0 ? '#46007D' : isDark ? '#AAA8C3' : '#74738B',
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Subjects Grid */}
              <Text style={{ fontSize: 18 * fontScale, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Matières</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                {subjects.map((subject: Subject) => (
                  <Pressable
                    key={subject.id}
                    style={{
                      width: (SCREEN_WIDTH - 64) / 2,
                      margin: 6,
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: `${subject.color}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{subject.icon}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>{subject.name}</Text>
                    <Text style={{ fontSize: 10, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 2 }}>
                      {subject.files} fichiers
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Recent Resources */}
              <Text style={{ fontSize: 18 * fontScale, fontWeight: 'bold', color: colors.text, marginTop: 24, marginBottom: 12 }}>
                Ressources récentes
              </Text>
              {loading ? (
                <ActivityIndicator color="#CA98FF" />
              ) : resources.length === 0 ? (
                <Text style={{ fontSize: 14 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center' }}>
                  Aucune ressource disponible
                </Text>
              ) : (
                resources.map((resource: Resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))
              )}
            </View>
          )}

          {/* CALENDRIER TAB */}
          {activeTab === 'calendrier' && (
            <View>
              {/* Month Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>Octobre 2024</Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 4 }}>
                    Année Académique 2024/25
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                    }}
                  >
                    <ChevronLeft size={20} color="#CA98FF" />
                  </Pressable>
                  <Pressable
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                    }}
                  >
                    <ChevronRight size={20} color="#CA98FF" />
                  </Pressable>
                </View>
              </View>

              {/* Calendar Grid */}
              <GlassmorphismCard
                intensity="medium"
                style={{
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
              >
                {/* Days of week */}
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <Text
                      key={day}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: isDark ? '#AAA8C3' : '#74738B',
                        textTransform: 'uppercase',
                      }}
                    >
                      {day}
                    </Text>
                  ))}
                </View>
                
                {/* Calendar days - simplified view */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const isToday = day === 8;
                    const hasEvent = [2, 9, 13, 24].includes(day);
                    
                    return (
                      <View
                        key={i}
                        style={{
                          width: (SCREEN_WIDTH - 72) / 7,
                          height: 40,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isToday ? (
                          <LinearGradient
                            colors={['#CA98FF', '#9C42F4']}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFF' }}>{day}</Text>
                          </LinearGradient>
                        ) : (
                          <>
                            <Text
                              style={{
                                fontSize: 14,
                                color: day > 28 ? (isDark ? 'rgba(170,168,195,0.3)' : 'rgba(116,115,139,0.3)') : colors.text,
                              }}
                            >
                              {day > 28 ? day - 28 : day}
                            </Text>
                            {hasEvent && (
                              <View
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: '#CA98FF',
                                  marginTop: 2,
                                }}
                              />
                            )}
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              </GlassmorphismCard>

              {/* Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {['Tous les événements', 'Mes Cours', 'Événements', 'Échéances'].map((filter, index) => (
                  <Pressable
                    key={filter}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: index === 0 ? '#CA98FF' : isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                      marginRight: 12,
                      borderWidth: index === 0 ? 0 : 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: index === 0 ? 'bold' : '500',
                        color: index === 0 ? '#46007D' : isDark ? '#AAA8C3' : '#74738B',
                      }}
                    >
                      {filter}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Events List */}
              <Text style={{ fontSize: 14 * fontScale, fontWeight: 'bold', color: '#CA98FF', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Aujourd'hui
              </Text>
              {loading ? (
                <ActivityIndicator color="#CA98FF" />
              ) : events.length === 0 ? (
                <Text style={{ fontSize: 14 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center' }}>
                  Aucun événement disponible
                </Text>
              ) : (
                events.map((event: Event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </View>
          )}

          {/* OPPORTUNITES TAB */}
          {activeTab === 'opportunites' && (
            <View>
              {/* Tab filters */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                {['Offres', 'Opportunités', 'Mentors'].map((tab, index) => (
                  <Pressable
                    key={tab}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderBottomWidth: 2,
                      borderBottomColor: index === 0 ? '#CA98FF' : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: index === 0 ? 'bold' : '500',
                        color: index === 0 ? '#CA98FF' : isDark ? '#AAA8C3' : '#74738B',
                      }}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Type filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {['Tous', 'Stage', 'Job Étudiant', 'Alternance'].map((type, index) => (
                  <Pressable
                    key={type}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: index === 0 ? '#CA98FF' : isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: index === 0 ? 'bold' : '500',
                        color: index === 0 ? '#46007D' : isDark ? '#AAA8C3' : '#74738B',
                      }}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Opportunity Cards */}
              {loading ? (
                <ActivityIndicator color="#CA98FF" />
              ) : opportunities.length === 0 ? (
                <Text style={{ fontSize: 14 * fontScale, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center', marginTop: 20 }}>
                  Aucune opportunité disponible
                </Text>
              ) : (
                opportunities.map((opp: Opportunity) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))
              )}

              {/* CTA Card */}
              <GlassmorphismCard
                intensity="medium"
                style={{
                  padding: 24,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8 }}>
                      Prêt pour ton prochain défi ?
                    </Text>
                    <Text style={{ fontSize: 13, color: isDark ? '#AAA8C3' : '#74738B', lineHeight: 18 }}>
                      Découvre des opportunités exclusives adaptées à ton profil étudiant.
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 80,
                      height: 60,
                      borderRadius: 12,
                      backgroundColor: isDark ? 'rgba(35,35,63,0.8)' : 'rgba(248,245,255,0.8)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Flame size={32} color="#CA98FF" />
                  </View>
                </View>
              </GlassmorphismCard>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB - Only show for certain tabs */}
      {(activeTab === 'groupes' || activeTab === 'calendrier') && (
        <Pressable
          style={{
            position: 'absolute',
            bottom: 100,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            overflow: 'hidden',
            shadowColor: '#CA98FF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          }}
        >
          <LinearGradient
            colors={['#CA98FF', '#9C42F4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={28} color="#46007D" />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}
