import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Image,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/lib/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { GlassmorphismCard } from '../../src/components/GlassmorphismCard';
import { LinearGradient } from 'expo-linear-gradient';

import { Profile, Conversation, Message, StudentGroup } from '../../src/types';
import { Edit3, Users, Plus, Search, UserPlus, X, Check, ArrowLeft, MoreVertical } from '../../src/components/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface ConversationWithDetails extends Conversation {
  other_user?: Profile;
  last_message?: Message;
  unread_count: number;
  isTyping?: boolean;
}

interface GroupWithDetails extends StudentGroup {
  last_message?: Message;
  unread_count: number;
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(202,152,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#CA98FF',
              marginHorizontal: 2,
              opacity: 0.4 + (i * 0.3),
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 12, color: '#CA98FF', fontStyle: 'italic', marginLeft: 8 }}>Typing...</Text>
    </View>
  );
}

// Online Status Dot
function OnlineStatusDot({ isOnline }: { isOnline: boolean }) {
  if (!isOnline) return null;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 3,
        borderColor: '#0C0C1F',
      }}
    />
  );
}

// Conversation Item Component
function ConversationItem({ 
  conversation, 
  onPress 
}: { 
  conversation: ConversationWithDetails;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message;
  const hasUnread = conversation.unread_count > 0;

  const formatTime = (date: string) => {
    const msgDate = new Date(date);
    const now = new Date();
    const isToday = msgDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable onPress={onPress}>
      <GlassmorphismCard 
        intensity="medium" 
        style={{ 
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          {/* Avatar with online status */}
          <View style={{ position: 'relative' }}>
            {otherUser?.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 32,
                  borderWidth: 2,
                  borderColor: isDark ? 'rgba(138,43,226,0.2)' : 'rgba(138,43,226,0.1)',
                }}
              />
            ) : (
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isDark ? 'rgba(138,43,226,0.2)' : 'rgba(138,43,226,0.1)',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>
                  {(otherUser?.full_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <OnlineStatusDot isOnline={true} />
          </View>

          {/* Content */}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                {otherUser?.full_name || otherUser?.username || 'User'}
              </Text>
              <Text style={{ 
                fontSize: 10, 
                fontWeight: '600',
                color: isDark ? '#AAA8C3' : '#74738B',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {lastMessage ? formatTime(lastMessage.created_at) : ''}
              </Text>
            </View>

            {conversation.isTyping ? (
              <TypingIndicator />
            ) : (
              <Text 
                numberOfLines={1} 
                style={{ 
                  fontSize: 14, 
                  color: hasUnread ? colors.text : (isDark ? '#AAA8C3' : '#74738B'),
                  fontWeight: hasUnread ? '500' : '400',
                }}
              >
                {lastMessage?.content || 'Start a conversation'}
              </Text>
            )}
          </View>

          {/* Unread badge */}
          {hasUnread && (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </GlassmorphismCard>
    </Pressable>
  );
}

// Group Item Component
function GroupItem({ 
  group, 
  onPress 
}: { 
  group: GroupWithDetails;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const lastMessage = group.last_message;

  const formatTime = (date: string) => {
    const msgDate = new Date(date);
    const now = new Date();
    const isToday = msgDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable onPress={onPress}>
      <GlassmorphismCard 
        intensity="medium" 
        style={{ 
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          {/* Stacked avatars */}
          <View style={{ width: 64, height: 64 }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: '#0C0C1F',
                zIndex: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                {group.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? '#23233F' : '#F8F5FF',
                borderWidth: 2,
                borderColor: '#0C0C1F',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary }}>
                +{Math.max(0, (group.member_count || 0) - 1)}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                {group.name}
              </Text>
              <Text style={{ 
                fontSize: 10, 
                fontWeight: '600',
                color: isDark ? '#AAA8C3' : '#74738B',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {lastMessage ? formatTime(lastMessage.created_at) : 'Yesterday'}
              </Text>
            </View>

            <Text 
              numberOfLines={1} 
              style={{ 
                fontSize: 14, 
                color: isDark ? '#AAA8C3' : '#74738B',
              }}
            >
              {lastMessage ? (
                <Text>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>
                    {lastMessage.sender?.full_name || 'Someone'}:
                  </Text>
                  <Text> {lastMessage.content}</Text>
                </Text>
              ) : (
                'No messages yet'
              )}
            </Text>
          </View>
        </View>
      </GlassmorphismCard>
    </Pressable>
  );
}

// Empty State Component
function EmptyState({ onFindPeople }: { onFindPeople: () => void }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <Users size={40} color={isDark ? '#AAA8C3' : '#74738B'} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
        Grow your circle
      </Text>
      <Text style={{ fontSize: 14, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center', lineHeight: 20 }}>
        Start a conversation with designers and developers in your local area.
      </Text>
      <Pressable
        onPress={onFindPeople}
        style={{
          marginTop: 24,
          paddingHorizontal: 32,
          paddingVertical: 12,
          borderRadius: 24,
          backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.6)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(138,43,226,0.2)' : 'rgba(138,43,226,0.1)',
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
          Find People
        </Text>
      </Pressable>
    </View>
  );
}

// Add Contact Modal
function AddContactModal({ visible, onClose, onContactAdded }: { visible: boolean; onClose: () => void; onContactAdded: () => void }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchUser = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setFoundUser(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!foundUser || !user?.id) return;

    try {
      const { data: existing } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', foundUser.id)
        .single();

      if (existing) {
        Alert.alert('Info', 'This user is already in your contacts');
        return;
      }

      await supabase.from('contacts').insert({
        user_id: user.id,
        contact_id: foundUser.id,
      });

      const { data: conv } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (conv) {
        await supabase.from('conversation_participants').insert([
          { conversation_id: conv.id, user_id: user.id },
          { conversation_id: conv.id, user_id: foundUser.id }
        ]);
      }

      Alert.alert('Success', 'Contact added successfully');
      onContactAdded();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Unable to add contact');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>New Message</Text>
            <Pressable onPress={onClose}>
              <X size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or username..."
              placeholderTextColor={isDark ? '#AAA8C3' : '#74738B'}
              style={{ 
                flex: 1, 
                backgroundColor: colors.surface, 
                borderRadius: 12, 
                paddingHorizontal: 16, 
                paddingVertical: 12, 
                color: colors.text,
                fontSize: 16,
              }}
              onSubmitEditing={searchUser}
            />
            <Pressable
              onPress={searchUser}
              style={{
                marginLeft: 12,
                padding: 12,
                backgroundColor: colors.primary,
                borderRadius: 12,
              }}
            >
              <Search size={20} color="#FFF" />
            </Pressable>
          </View>

          {searched && !foundUser && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: isDark ? '#AAA8C3' : '#74738B' }}>No users found</Text>
            </View>
          )}

          {foundUser && (
            <GlassmorphismCard intensity="medium" style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {foundUser.avatar_url ? (
                  <Image source={{ uri: foundUser.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{(foundUser.full_name || '?').charAt(0)}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{foundUser.full_name}</Text>
                  <Text style={{ fontSize: 14, color: isDark ? '#AAA8C3' : '#74738B' }}>@{foundUser.username}</Text>
                </View>
                <Pressable
                  onPress={addContact}
                  style={{
                    padding: 12,
                    backgroundColor: '#22C55E',
                    borderRadius: 12,
                  }}
                >
                  <UserPlus size={20} color="#FFF" />
                </Pressable>
              </View>
            </GlassmorphismCard>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Main Messages Screen
export default function MessagesScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'messages' | 'groups'>('messages');
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadConversations();
    loadGroups();
  }, []);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      // Fetch conversations without profile relationships
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(user_id)
        `)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;
      
      // Fetch all participants' profiles separately
      const allParticipantIds = [...new Set((conversationsData || []).flatMap((c: any) => 
        c.participants?.map((p: any) => p.user_id) || []
      ))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allParticipantIds);
      
      if (profilesError) throw profilesError;
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      // Fetch last messages for each conversation
      const conversationIds = (conversationsData || []).map(c => c.id);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(100);
      
      const lastMessagesMap = new Map();
      (messagesData || []).forEach(m => {
        if (!lastMessagesMap.has(m.conversation_id)) {
          lastMessagesMap.set(m.conversation_id, m);
        }
      });

      const formattedConversations: ConversationWithDetails[] = (conversationsData || [])
        .map((conv: any) => {
          const participants = conv.participants?.map((p: any) => ({
            ...p,
            profile: profilesMap.get(p.user_id)
          })) || [];
          const otherParticipant = participants.find((p: any) => p.user_id !== user.id);
          const lastMessage = lastMessagesMap.get(conv.id);
          
          return {
            ...conv,
            participants,
            other_user: otherParticipant?.profile,
            last_message: lastMessage,
            unread_count: 0,
          };
        })
        .filter((conv: ConversationWithDetails) => conv.other_user);

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('student_groups')
        .select(`
          *,
          messages:group_messages(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGroups: GroupWithDetails[] = (data || [])
        .filter((group: any) => group.messages && group.messages.length > 0)
        .map((group: any) => ({
          ...group,
          last_message: group.messages[group.messages.length - 1],
          unread_count: 0,
        }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1 }}>
              Messages
            </Text>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
            }}
          >
            <LinearGradient
              colors={['#CA98FF', '#9C42F4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#8A2BE2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Edit3 size={24} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            padding: 6,
            backgroundColor: isDark ? 'rgba(17,17,39,0.6)' : 'rgba(248,245,255,0.6)',
            borderRadius: 16,
          }}
        >
          <Pressable
            onPress={() => setActiveTab('messages')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: activeTab === 'messages' ? undefined : 'transparent',
            }}
          >
            {activeTab === 'messages' ? (
              <LinearGradient
                colors={['#8A2BE2', '#9C42F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 12,
                }}
              />
            ) : null}
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: activeTab === 'messages' ? '#FFF' : isDark ? '#AAA8C3' : '#74738B',
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              Messages
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('groups')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: activeTab === 'groups' ? undefined : 'transparent',
            }}
          >
            {activeTab === 'groups' ? (
              <LinearGradient
                colors={['#8A2BE2', '#9C42F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 12,
                }}
              />
            ) : null}
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: activeTab === 'groups' ? '#FFF' : isDark ? '#AAA8C3' : '#74738B',
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              Groups
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24 }}>
        {activeTab === 'messages' ? (
          conversations.length === 0 && !loading ? (
            <EmptyState onFindPeople={() => setShowAddModal(true)} />
          ) : (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onPress={() => router.push(`/(tabs)/chat/${conversation.id}`)}
              />
            ))
          )
        ) : (
          groups.length === 0 && !loading ? (
            <EmptyState onFindPeople={() => setShowAddModal(true)} />
          ) : (
            groups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                onPress={() => router.push(`/(tabs)/group-chat/${group.id}`)}
              />
            ))
          )
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <AddContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onContactAdded={loadConversations}
      />
    </View>
  );
}
