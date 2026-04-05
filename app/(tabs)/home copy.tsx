import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Image,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/lib/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { GlassmorphismCard } from '../../src/components/GlassmorphismCard';
import { StoryRing, StoryViewer, AddStoryButton } from '../../src/components/Stories';
import { MapPin, Repeat, Flame, Heart, MessageCircle, Share2, X, MoreVertical } from '../../src/components/Icon';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Post, Story, Profile, Comment } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Stories Bar Component
function StoriesBar({ onRefresh }: { onRefresh: () => void }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<Map<string, Story[]>>(new Map());
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profile:profiles(*),
          views:story_views(viewer_id)
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const storiesWithViewStatus = (data || []).map((story: any) => ({
        ...story,
        has_viewed: story.views?.some((v: any) => v.viewer_id === user?.id) || story.user_id === user?.id,
      }));

      const grouped = new Map<string, Story[]>();
      storiesWithViewStatus.forEach((story: Story) => {
        const userStories = grouped.get(story.user_id) || [];
        userStories.push(story);
        grouped.set(story.user_id, userStories);
      });

      setGroupedStories(grouped);
      setStories(storiesWithViewStatus);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const viewStory = async (storyId: string) => {
    if (!user) return;
    
    try {
      await supabase.from('story_views').insert({
        story_id: storyId,
        viewer_id: user.id,
      });
      
      await supabase.rpc('increment_story_views', { story_id: storyId });
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const users = Array.from(groupedStories.entries());
  const selectedUser = users[selectedUserIndex];

  return (
    <>
      <View style={{ paddingVertical: 16 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <AddStoryButton onStoryAdded={loadStories} />
          
          {users.map(([userId, userStories], index) => {
            const firstStory = userStories[0];
            const hasUnseen = userStories.some(s => !s.has_viewed);
            
            return (
              <StoryRing
                key={userId}
                userId={userId}
                avatarUrl={firstStory.profile?.avatar_url || null}
                fullName={firstStory.profile?.full_name || null}
                hasUnseenStories={hasUnseen}
                onPress={() => {
                  setSelectedUserIndex(index);
                  setViewerVisible(true);
                }}
              />
            );
          })}
        </ScrollView>
      </View>

      {selectedUser && (
        <StoryViewer
          visible={viewerVisible}
          stories={selectedUser[1]}
          initialIndex={0}
          onClose={() => setViewerVisible(false)}
          onViewStory={viewStory}
        />
      )}
    </>
  );
}

// Post Card Component
interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

function PostCard({ post, onLike, onComment, onShare, onDelete }: PostCardProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const isMine = post.user_id === user?.id;
  const hasLiked = post.has_liked;

  const formatTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now.getTime() - postDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return postDate.toLocaleDateString('fr-FR');
  };

  return (
    <Animated.View entering={FadeInUp.springify()} style={{ marginBottom: 16 }}>
      <GlassmorphismCard intensity="medium">
        <View>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 }}>
            {post.profile?.avatar_url ? (
              <Image 
                source={{ uri: post.profile.avatar_url }} 
                style={{ width: 44, height: 44, borderRadius: 14 }}
              />
            ) : (
              <View 
                style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 14, 
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                  {(post.profile?.full_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                {post.profile?.full_name || post.profile?.username}
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#6B5B7A' : '#9B8AA8', marginTop: 2 }}>
                {formatTime(post.created_at)}
                {post.location && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <MapPin size={12} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
                    <Text style={{ fontSize: 12, color: isDark ? '#6B5B7A' : '#9B8AA8', marginLeft: 4 }}>
                      {post.location}
                    </Text>
                  </View>
                )}
              </Text>
            </View>
            
            {isMine && onDelete && (
              <Pressable onPress={() => onDelete(post.id)} style={{ padding: 8 }}>
                <MoreVertical size={20} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
              </Pressable>
            )}
          </View>

          {/* Content */}
          {post.content && (
            <Text style={{ fontSize: 15, color: colors.text, paddingHorizontal: 16, paddingBottom: 12, lineHeight: 22 }}>
              {post.content}
            </Text>
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              {post.media_urls.length === 1 ? (
                <Image
                  source={{ uri: post.media_urls[0] }}
                  style={{ width: '100%', height: 300, borderRadius: 16 }}
                  resizeMode="cover"
                />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {post.media_urls.map((url, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: url }}
                      style={{ 
                        width: 280, 
                        height: 280, 
                        borderRadius: 16,
                        marginRight: 8,
                      }}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Shared post indicator */}
          {post.is_shared && post.original_post && (
            <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 12, color: colors.primary, marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Repeat size={12} color={colors.primary} style={{ marginRight: 4 }} /> Publication partagée
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {post.original_post.profile?.avatar_url ? (
                  <Image source={{ uri: post.original_post.profile.avatar_url }} style={{ width: 28, height: 28, borderRadius: 10 }} />
                ) : (
                  <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{(post.original_post.profile?.full_name || '?').charAt(0)}</Text>
                  </View>
                )}
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{post.original_post.profile?.full_name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: isDark ? '#6B5B7A' : '#9B8AA8' }}>{post.original_post.content}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 }}>
            {/* Kiff (Like) */}
            <Pressable 
              onPress={() => onLike(post.id)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}
            >
              <Flame size={24} color={hasLiked ? colors.primary : (isDark ? '#6B5B7A' : '#9B8AA8')} fill={hasLiked ? colors.primary : 'none'} />
              <Text style={{ 
                marginLeft: 6, 
                fontSize: 14, 
                fontWeight: hasLiked ? '600' : '400',
                color: hasLiked ? colors.primary : isDark ? '#6B5B7A' : '#9B8AA8',
              }}>
                {post.likes_count > 0 ? `${post.likes_count} Kiff${post.likes_count !== 1 ? 's' : ''}` : 'Kiff'}
              </Text>
            </Pressable>

            {/* Comment */}
            <Pressable 
              onPress={() => onComment(post.id)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}
            >
              <MessageCircle size={22} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
              <Text style={{ marginLeft: 6, fontSize: 14, color: isDark ? '#6B5B7A' : '#9B8AA8' }}>
                {post.comments_count > 0 ? post.comments_count : 'Commenter'}
              </Text>
            </Pressable>

            {/* Share */}
            <Pressable 
              onPress={() => onShare(post)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Share2 size={22} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
              <Text style={{ marginLeft: 6, fontSize: 14, color: isDark ? '#6B5B7A' : '#9B8AA8' }}>
                {post.share_count > 0 ? `${post.share_count} partage${post.share_count !== 1 ? 's' : ''}` : 'Partager'}
              </Text>
            </Pressable>
          </View>
        </View>
      </GlassmorphismCard>
    </Animated.View>
  );
}

// Comment Modal
interface CommentModalProps {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
}

function CommentModal({ visible, postId, onClose }: CommentModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    if (!postId) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !postId || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      loadComments();
      
      await supabase.rpc('increment_post_comments', { post_id: postId });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d ajouter le commentaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Commentaires</Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 24, color: isDark ? '#6B5B7A' : '#9B8AA8' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 400, padding: 16 }}>
            {comments.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
                <Text style={{ color: isDark ? '#6B5B7A' : '#9B8AA8' }}>Pas encore de commentaires</Text>
                <Text style={{ color: isDark ? '#6B5B7A' : '#9B8AA8', marginTop: 4, fontSize: 14 }}>Soyez le premier à commenter !</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {comment.profile?.avatar_url ? (
                      <Image source={{ uri: comment.profile.avatar_url }} style={{ width: 36, height: 36, borderRadius: 12 }} />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{(comment.profile?.full_name || '?').charAt(0)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 }}>{comment.profile?.full_name}</Text>
                        <Text style={{ fontSize: 14, color: colors.text }}>{comment.content}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: 12 }}>
                        <Text style={{ fontSize: 11, color: isDark ? '#6B5B7A' : '#9B8AA8' }}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                        <Pressable style={{ marginLeft: 16 }}>
                          <Text style={{ fontSize: 11, color: isDark ? '#6B5B7A' : '#9B8AA8', fontWeight: '600' }}>Répondre</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
                style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, maxHeight: 100 }}
                multiline
              />
              <Pressable 
                onPress={addComment}
                disabled={loading || !newComment.trim()}
                style={{ marginLeft: 12, padding: 12, backgroundColor: newComment.trim() ? colors.primary : colors.surface, borderRadius: 20 }}
              >
                <Text style={{ fontSize: 18 }}>➤</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Share Modal
interface ShareModalProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onShared: () => void;
}

function ShareModal({ visible, post, onClose, onShared }: ShareModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [shareMessage, setShareMessage] = useState('');

  const shareInApp = async () => {
    if (!post || !user) return;
    
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: shareMessage.trim() || `A partagé la publication de ${post.profile?.full_name}`,
        is_shared: true,
        original_post_id: post.id,
      });

      if (error) throw error;

      await supabase.rpc('increment_post_shares', { post_id: post.id });

      Alert.alert('Succès', 'Publication partagée !');
      onShared();
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager');
    }
  };

  const shareToWhatsApp = async () => {
    if (!post) return;
    
    try {
      if (user) {
        await supabase.from('shares').insert({
          post_id: post.id,
          user_id: user.id,
          platform: 'whatsapp',
        });
      }
      
      Alert.alert('Info', 'Ouverture de WhatsApp...');
      onClose();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20, textAlign: 'center' }}>Partager</Text>

          {post?.is_shared === false && (
            <TextInput
              value={shareMessage}
              onChangeText={setShareMessage}
              placeholder="Ajouter un commentaire (optionnel)..."
              placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
              style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, color: colors.text, marginBottom: 20, minHeight: 80 }}
              multiline
            />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
            <Pressable onPress={shareToWhatsApp} style={{ alignItems: 'center' }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 30 }}>💬</Text>
              </View>
              <Text style={{ marginTop: 8, color: colors.text, fontSize: 12 }}>WhatsApp</Text>
            </Pressable>

            <Pressable onPress={shareInApp} style={{ alignItems: 'center' }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 30 }}>🔗</Text>
              </View>
              <Text style={{ marginTop: 8, color: colors.text, fontSize: 12 }}>Dans l'app</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Create Post Modal
interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPosted: () => void;
}

function CreatePostModal({ visible, onClose, onPosted }: CreatePostModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const createPost = async () => {
    if (!content.trim() || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      setContent('');
      onPosted();
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Nouvelle publication</Text>
            <Pressable onPress={onClose}>
              <X size={24} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
            </Pressable>
          </View>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Quoi de neuf ?"
            placeholderTextColor={isDark ? '#6B5B7A' : '#9B8AA8'}
            multiline
            style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, color: colors.text, fontSize: 16, minHeight: 150, textAlignVertical: 'top' }}
          />

          <View style={{ flexDirection: 'row', marginTop: 16, marginBottom: 20 }}>
            <Pressable style={{ marginRight: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}>
              <Text style={{ fontSize: 24 }}>📷</Text>
            </Pressable>
            <Pressable style={{ marginRight: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}>
              <Text style={{ fontSize: 24 }}>🎥</Text>
            </Pressable>
            <Pressable style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}>
              <Text style={{ fontSize: 24 }}>📍</Text>
            </Pressable>
          </View>

          <Pressable 
            onPress={createPost}
            disabled={loading || !content.trim()}
            style={{ backgroundColor: content.trim() ? colors.primary : colors.surface, padding: 18, borderRadius: 16, alignItems: 'center', opacity: content.trim() ? 1 : 0.5 }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? 'Publication...' : 'Publier'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Main Home Screen
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(*),
          likes:likes(user_id),
          original_post:posts(*, profile:profiles(*))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithLikeStatus = (data || []).map((post: any) => ({
        ...post,
        has_liked: post.likes?.some((like: any) => like.user_id === user?.id),
      }));

      setPosts(postsWithLikeStatus);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      
      if (post?.has_liked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
        await supabase.rpc('decrement_post_likes', { post_id: postId });
        
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, has_liked: false, likes_count: p.likes_count - 1 } : p
        ));
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        await supabase.rpc('increment_post_likes', { post_id: postId });
        
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, has_liked: true, likes_count: p.likes_count + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    Alert.alert(
      'Supprimer',
      'Tu es sûr de vouloir supprimer cette publication ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('posts').delete().eq('id', postId);
              setPosts(posts.filter(p => p.id !== postId));
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.surface, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary }}>LinkUp</Text>
          <Pressable onPress={() => setShowCreateModal(true)} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, color: '#FFF' }}>➕</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stories Bar */}
        <StoriesBar onRefresh={loadPosts} />

        {/* Posts Feed */}
        <View style={{ padding: 16, paddingTop: 8 }}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={(postId) => setCommentPostId(postId)}
              onShare={(post) => setSharePost(post)}
              onDelete={post.user_id === user?.id ? handleDelete : undefined}
            />
          ))}
          
          {posts.length === 0 && !loading && (
            <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📱</Text>
              <Text style={{ fontSize: 18, color: colors.text, fontWeight: '600', marginBottom: 8 }}>Pas encore de publications</Text>
              <Text style={{ fontSize: 14, color: isDark ? '#6B5B7A' : '#9B8AA8', textAlign: 'center' }}>Sois le premier à publier quelque chose !</Text>
            </Animated.View>
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <CreatePostModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} onPosted={loadPosts} />
      <CommentModal visible={commentPostId !== null} postId={commentPostId} onClose={() => setCommentPostId(null)} />
      <ShareModal visible={sharePost !== null} post={sharePost} onClose={() => setSharePost(null)} onShared={loadPosts} />
    </View>
  );
}