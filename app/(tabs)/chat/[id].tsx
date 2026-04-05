import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Alert,
  Dimensions,
  StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/lib/theme';
import { useMessaging } from '../../../src/providers/MessagingProvider';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase } from '../../../src/lib/supabase';
import { GlassmorphismCard } from '../../../src/components/GlassmorphismCard';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { Message, Profile, MessageReaction } from '../../../src/types';
import { ArrowLeft, MoreVertical, Video, Phone, Mic, Send, Check, Plus } from '../../../src/components/Icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Types
interface MessageWithReactions extends Message {
  reactions?: MessageReaction[];
  sender_name?: string;
}

// Typing Indicator for chat
function TypingIndicator() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(17,17,39,0.6)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#CA98FF',
              marginHorizontal: 3,
              opacity: 0.4 + (i * 0.3),
            }}
          />
        ))}
      </View>
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
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#0C0C1F',
      }}
    />
  );
}

// Reaction Bubble
function ReactionBubble({ reaction }: { reaction: MessageReaction }) {
  const { colors } = useTheme();
  
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(35,35,63,0.8)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginRight: 4,
      }}
    >
      <Text style={{ fontSize: 12 }}>{reaction.reaction}</Text>
      <Text style={{ fontSize: 10, color: colors.text, marginLeft: 4, fontWeight: '700' }}>
        1
      </Text>
    </View>
  );
}

// Message Bubble Component with Actions
function MessageBubble({ 
  message, 
  isMine, 
  showAvatar,
  otherUser,
  onReply,
  onReact,
  onEdit,
  onDelete
}: { 
  message: MessageWithReactions;
  isMine: boolean;
  showAvatar: boolean;
  otherUser?: Profile;
  onReply: (msg: MessageWithReactions) => void;
  onReact: (msgId: string, emoji: string) => void;
  onEdit: (msg: MessageWithReactions) => void;
  onDelete: (msgId: string, mode: 'me' | 'all') => void;
}) {
  const { colors, isDark } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const { user } = useAuth();

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const isDeleted = message.deleted_at !== null;
  const isEdited = message.edited_at !== null;

  return (
    <View 
      style={{ 
        flexDirection: 'column', 
        alignItems: isMine ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        maxWidth: '85%',
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        position: 'relative',
      }}
    >
      {/* Reply Reference */}
      {message.reply_to && (
        <View style={{
          backgroundColor: isDark ? 'rgba(35,35,63,0.6)' : 'rgba(248,245,255,0.8)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          marginBottom: 4,
          borderLeftWidth: 3,
          borderLeftColor: '#CA98FF',
        }}>
          <Text style={{ fontSize: 12, color: '#CA98FF', fontWeight: '600' }}>
            {message.reply_to.sender_id === user?.id ? 'Vous' : otherUser?.full_name}
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B' }} numberOfLines={1}>
            {message.reply_to.content}
          </Text>
        </View>
      )}

      <Pressable 
        onLongPress={() => !isDeleted && setShowActions(true)}
        onPress={() => setShowReactions(false)}
      >
        {!isMine ? (
          <View>
            <View
              style={{
                backgroundColor: isDark ? 'rgba(35,35,63,0.4)' : 'rgba(248,245,255,0.6)',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderBottomRightRadius: 24,
                borderBottomLeftRadius: 4,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>
                {isDeleted ? 'Message supprimé' : message.content}
              </Text>
              {isEdited && !isDeleted && (
                <Text style={{ fontSize: 10, color: isDark ? '#74738B' : '#AAA8C3', marginTop: 4 }}>modifié</Text>
              )}
            </View>
          </View>
        ) : (
          <View>
            <LinearGradient
              colors={['#8A2BE2', '#6B21A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 4,
                shadowColor: '#8A2BE2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                opacity: isDeleted ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 15, color: '#FFF', lineHeight: 22 }}>
                {isDeleted ? 'Message supprimé' : message.content}
              </Text>
              {isEdited && !isDeleted && (
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>modifié</Text>
              )}
            </LinearGradient>
          </View>
        )}
      </Pressable>
      
      {/* Reactions Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 8, marginRight: 8 }}>
        {message.reactions && message.reactions.length > 0 && (
          <View style={{ flexDirection: 'row', marginRight: 8 }}>
            {message.reactions.map((reaction, idx) => (
              <ReactionBubble key={idx} reaction={reaction} />
            ))}
          </View>
        )}
        
        <Pressable onPress={() => setShowReactions(!showReactions)}>
          <Text style={{ fontSize: 14 }}>😊</Text>
        </Pressable>

        <Text style={{ fontSize: 10, color: isDark ? 'rgba(170,168,195,0.6)' : 'rgba(116,115,139,0.6)', marginLeft: 8 }}>
          {formatTime(message.created_at)}
        </Text>
        
        {isMine && message.is_read && (
          <Text style={{ fontSize: 10, color: '#CA98FF', marginLeft: 4 }}>✓✓</Text>
        )}
      </View>

      {/* Reaction Picker */}
      {showReactions && !isDeleted && (
        <View style={{ marginTop: 8 }}>
          <ReactionPicker 
            onReact={(emoji) => { onReact(message.id, emoji); setShowReactions(false); }}
            currentReactions={message.reactions || []}
          />
        </View>
      )}

      {/* Actions Menu */}
      <MessageActionsMenu
        visible={showActions}
        onClose={() => setShowActions(false)}
        onReply={() => onReply(message)}
        onEdit={() => onEdit(message)}
        onDelete={(mode) => onDelete(message.id, mode)}
        isMine={isMine}
        isDeleted={isDeleted}
      />
    </View>
  );
}

// Date Divider

// Reaction Picker
const REACTIONS = ['❤️', '👍', '👎', '😂', '😮', '😢', '🙏', '🔥'];

function ReactionPicker({ onReact, currentReactions }: { onReact: (emoji: string) => void, currentReactions: MessageReaction[] }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const myReaction = currentReactions.find(r => r.user_id === user?.id)?.reaction;

  return (
    <View style={{ flexDirection: 'row', padding: 8, backgroundColor: isDark ? '#1D1D37' : '#F8F5FF', borderRadius: 20 }}>
      {REACTIONS.map(emoji => (
        <Pressable
          key={emoji}
          onPress={() => onReact(emoji)}
          style={{
            padding: 6,
            marginHorizontal: 2,
            borderRadius: 16,
            backgroundColor: myReaction === emoji ? 'rgba(202,152,255,0.3)' : 'transparent',
          }}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Message Actions Menu
function MessageActionsMenu({ 
  visible, 
  onClose, 
  onReply, 
  onEdit, 
  onDelete, 
  isMine,
  isDeleted
}: { 
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: (mode: 'me' | 'all') => void;
  isMine: boolean;
  isDeleted: boolean;
}) {
  const { isDark } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 40,
        right: 0,
        backgroundColor: isDark ? '#1D1D37' : '#FFF',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
        minWidth: 200,
      }}
    >
      <Pressable onPress={() => { onReply(); onClose(); }} style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>↩️</Text>
        <Text style={{ color: isDark ? '#FFF' : '#000' }}>Répondre</Text>
      </Pressable>
      
      {isMine && !isDeleted && (
        <>
          <Pressable onPress={() => { onEdit(); onClose(); }} style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>✏️</Text>
            <Text style={{ color: isDark ? '#FFF' : '#000' }}>Modifier</Text>
          </Pressable>
          
          <Pressable onPress={() => { onDelete('me'); onClose(); }} style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🫣</Text>
            <Text style={{ color: isDark ? '#FFF' : '#000' }}>Supprimer pour moi</Text>
          </Pressable>
          
          <Pressable onPress={() => { onDelete('all'); onClose(); }} style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🗑️</Text>
            <Text style={{ color: '#FF4444' }}>Supprimer pour tous</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// Emoji Picker
function EmojiPicker({ onEmojiSelect, onClose }: { onEmojiSelect: (emoji: string) => void, onClose: () => void }) {
  const { isDark } = useTheme();
  const emojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '👎', '❤️', '🔥', '🎉', '🙏', '👏', '😊', '😎', '🤯', '🥳'];

  return (
    <View style={{ backgroundColor: isDark ? '#1D1D37' : '#F8F5FF', padding: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {emojis.map(emoji => (
          <Pressable
            key={emoji}
            onPress={() => onEmojiSelect(emoji)}
            style={{ padding: 8, margin: 4 }}
          >
            <Text style={{ fontSize: 28 }}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
function DateDivider({ date }: { date: string }) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 24 }}>
      <View
        style={{
          backgroundColor: isDark ? 'rgba(29,29,55,0.5)' : 'rgba(248,245,255,0.6)',
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 16,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: isDark ? '#AAA8C3' : '#74738B',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {date}
        </Text>
      </View>
    </View>
  );
}

// Main Chat Screen
export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { sendMessage, markAsRead } = useMessaging();
  
  const [messages, setMessages] = useState<MessageWithReactions[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(true);
  const [replyingTo, setReplyingTo] = useState<MessageWithReactions | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageWithReactions | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages and conversation details
  useEffect(() => {
    loadMessages();
    loadConversationDetails();
    
    // Subscribe to realtime messages
    const subscription = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, (payload) => {
        const newMsg = payload.new as MessageWithReactions;
        if (newMsg.sender_id !== user?.id) {
          setMessages(prev => [...prev, newMsg]);
          markAsRead(id as string);
        }
      })
      .subscribe();

    // Subscribe to typing indicators - temporarily disabled
    const unsubscribeTyping = () => {};

    return () => {
      subscription.unsubscribe();
      unsubscribeTyping?.();
    };
  }, [id, user?.id]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          reactions:message_reactions(*)
        `)
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const messagesWithNames = await Promise.all(
        (data || []).map(async (msg: MessageWithReactions) => {
          if (msg.sender_id !== user?.id) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', msg.sender_id)
              .single();
            msg.sender_name = sender?.full_name;
          }
          return msg;
        })
      );
      
      setMessages(messagesWithNames);
      setLoading(false);
      
      // Mark as read
      markAsRead(id as string);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadConversationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          profile:profiles(*)
        `)
        .eq('conversation_id', id)
        .neq('user_id', user?.id)
        .single();

      if (error) throw error;
      const profile = (data?.profile as unknown as Profile) || null;
      setOtherUser(profile);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    // If editing a message
    if (editingMessage) {
      try {
        await supabase
          .from('messages')
          .update({ content: newMessage.trim(), edited_at: new Date().toISOString() })
          .eq('id', editingMessage.id);
        
        setMessages(prev => prev.map(m => 
          m.id === editingMessage.id ? { ...m, content: newMessage.trim(), edited_at: new Date().toISOString() } : m
        ));
        setEditingMessage(null);
        setNewMessage('');
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de modifier le message');
      }
      return;
    }

    // Send new message (with or without reply)
    const tempMessage: MessageWithReactions = {
      id: `temp-${Date.now()}`,
      conversation_id: id as string,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      read_at: null,
      reply_to_id: replyingTo?.id || null,
      forwarded_from_id: null,
      is_forwarded: false,
      edited_at: null,
      deleted_at: null,
      reply_to: replyingTo || undefined,
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setReplyingTo(null);

    try {
      await sendMessage(id as string, newMessage.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      const existingReaction = message?.reactions?.find(r => r.user_id === user.id && r.reaction === emoji);
      
      if (existingReaction) {
        // Remove reaction
        await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
        setMessages(prev => prev.map(m => ({
          ...m,
          reactions: m.reactions?.filter(r => r.id !== existingReaction.id) || []
        })));
      } else {
        // Add reaction
        const { data } = await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: user.id,
          reaction: emoji,
        }).select().single();
        
        if (data) {
          setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, reactions: [...(m.reactions || []), data] } : m
          ));
        }
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const handleDelete = async (messageId: string, mode: 'me' | 'all') => {
    if (!user) return;

    try {
      if (mode === 'all') {
        // Soft delete for everyone
        await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId);
      } else {
        // Delete for me only (add to hidden_messages table)
        await supabase.from('hidden_messages').insert({
          message_id: messageId,
          user_id: user.id,
        });
      }
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer le message');
    }
  };

  const handleTyping = () => {
    // Send typing indicator
    supabase.channel(`typing:${id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user?.id, typing: true }
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`typing:${id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user?.id, typing: false }
      });
    }, 3000);
  };

  const groupMessagesByDate = (messages: MessageWithReactions[]) => {
    const groups: { date: string; messages: MessageWithReactions[] }[] = [];
    let currentDate = '';
    let currentGroup: MessageWithReactions[] = [];

    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: isDark ? 'rgba(12,12,31,0.4)' : 'rgba(248,245,255,0.4)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <ArrowLeft size={24} color={colors.primary} />
          </Pressable>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
            <View style={{ position: 'relative' }}>
              {otherUser?.avatar_url ? (
                <Image
                  source={{ uri: otherUser.avatar_url }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: 'rgba(138,43,226,0.2)',
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                    {(otherUser?.full_name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                {otherUser?.full_name || 'User'}
              </Text>
              <Text style={{ fontSize: 10, color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isOtherUserOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Pressable style={{ padding: 8 }}>
            <Video size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
          </Pressable>
          <Pressable style={{ padding: 8 }}>
            <MoreVertical size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {groupedMessages.map((group, groupIndex) => (
          <View key={group.date}>
            <DateDivider date={formatDate(group.date)} />
            
            {group.messages.map((message, msgIndex) => (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={message.sender_id === user?.id}
                showAvatar={msgIndex === 0 || group.messages[msgIndex - 1].sender_id !== message.sender_id}
                otherUser={otherUser || undefined}
                onReply={(msg) => setReplyingTo(msg)}
                onReact={handleReact}
                onEdit={(msg) => {
                  setEditingMessage(msg);
                  setNewMessage(msg.content);
                }}
                onDelete={handleDelete}
              />
            ))}
          </View>
        ))}
        
        {isTyping && <TypingIndicator />}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Reply/Edit Reference */}
        {(replyingTo || editingMessage) && (
          <View style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            backgroundColor: isDark ? 'rgba(12,12,31,0.8)' : 'rgba(248,245,255,0.8)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#CA98FF', fontWeight: '600' }}>
                {editingMessage ? 'Modifier le message' : `Répondre à ${replyingTo?.sender_id === user?.id ? 'vous' : otherUser?.full_name}`}
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B' }} numberOfLines={1}>
                {editingMessage ? editingMessage.content : replyingTo?.content}
              </Text>
            </View>
            <Pressable onPress={() => { setReplyingTo(null); setEditingMessage(null); setNewMessage(''); }}>
              <X size={20} color={isDark ? '#AAA8C3' : '#74738B'} />
            </Pressable>
          </View>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <EmojiPicker 
            onEmojiSelect={(emoji) => {
              setNewMessage(prev => prev + emoji);
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 32 : 24,
            backgroundColor: isDark ? 'rgba(12,12,31,0.6)' : 'rgba(248,245,255,0.6)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 24 }}>😊</Text>
          </Pressable>

          <View
            style={{
              flex: 1,
              marginHorizontal: 12,
              backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextInput
              value={newMessage}
              onChangeText={(text) => {
                setNewMessage(text);
                handleTyping();
              }}
              placeholder={editingMessage ? "Modifier le message..." : "Écrire un message..."}
              placeholderTextColor={isDark ? 'rgba(170,168,195,0.4)' : 'rgba(116,115,139,0.4)'}
              multiline
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.text,
                maxHeight: 100,
              }}
            />
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!newMessage.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
            }}
          >
            <LinearGradient
              colors={['#8A2BE2', '#9C42F4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: newMessage.trim() ? 1 : 0.5,
                shadowColor: '#8A2BE2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Send size={20} color="#FFF" fill="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
