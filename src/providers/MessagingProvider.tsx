import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Message, Conversation, ConversationParticipant } from '../types';

type MessagingContextType = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  createConversation: (participantIds: string[]) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
};

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Load conversations
  const refreshConversations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    
    // Get conversations where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (participantError || !participantData) {
      console.error('Error fetching participant data:', participantError);
      setLoading(false);
      return;
    }

    const conversationIds = participantData.map(p => p.conversation_id);

    if (conversationIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get conversations with last message
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages:messages(
          id,
          content,
          sender_id,
          created_at,
          is_read
        )
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      setLoading(false);
      return;
    }

    // Get participants for each conversation
    const conversationsWithParticipants = await Promise.all(
      conversationsData.map(async (conv: any) => {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            profile:profiles(*)
          `)
          .eq('conversation_id', conv.id);

        const lastMessage = conv.messages?.[0] || null;
        
        return {
          ...conv,
          participants: participants?.map((p: any) => p.profile) || [],
          last_message: lastMessage,
        };
      })
    );

    setConversations(conversationsWithParticipants);
    setLoading(false);
  }, [user?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user?.id) return;

    refreshConversations();

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // If we're in the current conversation, add the message
          if (currentConversation?.id === newMessage.conversation_id) {
            setMessages(prev => [...prev, newMessage]);
          }
          
          // Refresh conversations to update last message
          refreshConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, currentConversation?.id, refreshConversations]);

  const loadConversation = async (conversationId: string) => {
    setLoading(true);
    
    // Load messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      setLoading(false);
      return;
    }

    setMessages(messagesData || []);

    // Set current conversation
    const conversation = conversations.find(c => c.id === conversationId);
    setCurrentConversation(conversation || null);

    setLoading(false);

    // Mark as read
    await markAsRead(conversationId);
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user?.id || !content.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        is_read: false,
      });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };

  const createConversation = async (participantIds: string[]): Promise<string | null> => {
    if (!user?.id) return null;

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (conversationError || !conversation) {
      console.error('Error creating conversation:', conversationError);
      return null;
    }

    // Add participants
    const allParticipants = [...new Set([...participantIds, user.id])];
    const participantInserts = allParticipants.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId,
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      return null;
    }

    await refreshConversations();
    return conversation.id;
  };

  const markAsRead = async (conversationId: string) => {
    if (!user?.id) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id);
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        loading,
        sendMessage,
        loadConversation,
        createConversation,
        markAsRead,
        refreshConversations,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) throw new Error('useMessaging must be used within MessagingProvider');
  return context;
};
