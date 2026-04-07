import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../src/lib/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { GlassmorphismCard } from '../../src/components/GlassmorphismCard';
import { StoryViewer } from '../../src/components/Stories';
import { LinearGradient } from 'expo-linear-gradient';

import { 
  Plus,
  Flame,
  MessageCircle, 
  Share2, 
  MoreVertical,
  X,
  Repeat,
  MapPin,
  Bell,
  Bookmark,
  Camera,
} from '../../src/components/Icon';
import type { Post, Profile, Comment, Story } from '../../src/types';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface PostWithComments extends Post {
  latest_comment?: Comment & { profile?: Profile };
}

// Gradient Ring Story Component
function StoryRingItem({ 
  userId, 
  avatarUrl, 
  fullName, 
  hasUnseenStories, 
  isMyStory,
  onPress 
}: { 
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
  hasUnseenStories: boolean;
  isMyStory?: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', marginRight: 16 }}>
      <View style={{ position: 'relative' }}>
        {/* Gradient Ring */}
        {hasUnseenStories ? (
          <LinearGradient
            colors={['#8A2BE2', '#CA98FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              padding: 3,
            }}
          >
            <View style={{
              flex: 1,
              backgroundColor: isDark ? '#0C0C1F' : '#F8F5FF',
              borderRadius: 33,
              padding: 3,
            }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 54, height: 54, borderRadius: 27 }}
                />
              ) : (
                <View style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 20 }}>
                    {(fullName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        ) : (
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: isDark ? '#46465C' : '#E5E3FF',
            padding: 3,
            backgroundColor: isDark ? '#1D1D37' : '#F8F5FF',
          }}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 62, height: 62, borderRadius: 31 }}
              />
            ) : (
              <View style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 24 }}>
                  {(fullName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Add button for my story */}
        {isMyStory && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 2,
            borderWidth: 2,
            borderColor: isDark ? '#0C0C1F' : '#FFF',
          }}>
            <Plus size={14} color="#FFF" />
          </View>
        )}
      </View>
      
      <Text style={{
        marginTop: 8,
        fontSize: 10,
        fontWeight: '500',
        color: isDark ? '#AAA8C3' : '#74738B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {isMyStory ? 'Your Story' : (fullName?.split(' ')[0] || 'User')}
      </Text>
    </Pressable>
  );
}

// Stories Bar Component
function StoriesBar({ onRefresh }: { onRefresh: () => void }) {
  const { colors, isDark } = useTheme();
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
      
      // Fetch stories without profile relationship
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          *,
          views:story_views(viewer_id)
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;
      
      // Fetch profiles separately
      const userIds = [...new Set((storiesData || []).map(s => s.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      const storiesWithViewStatus = (storiesData || []).map((story: any) => ({
        ...story,
        profile: profilesMap.get(story.user_id),
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
          {/* Your Story */}
          <StoryRingItem
            userId={user?.id || ''}
            avatarUrl={user?.avatar_url || null}
            fullName="Your Story"
            hasUnseenStories={false}
            isMyStory={true}
            onPress={() => {
              // TODO: Navigate to create story
              console.log('Create story');
            }}
          />
          
          {/* Other Stories */}
          {users.filter(([userId]) => userId !== user?.id).map(([userId, userStories], index) => {
            const firstStory = userStories[0];
            const hasUnseen = userStories.some(s => !s.has_viewed);
            
            return (
              <StoryRingItem
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
function PostCard({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onDelete,
  latestComment
}: { 
  post: PostWithComments;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (post: Post) => void;
  onDelete?: (postId: string) => void;
  latestComment?: Comment & { profile?: Profile };
}) {
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

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <GlassmorphismCard intensity="medium" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 }}>
          <View style={{ position: 'relative' }}>
            {post.profile?.avatar_url ? (
              <Image 
                source={{ uri: post.profile.avatar_url }} 
                style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: isDark ? 'rgba(138,43,226,0.3)' : 'rgba(138,43,226,0.2)' }}
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
                  borderWidth: 2,
                  borderColor: isDark ? 'rgba(138,43,226,0.3)' : 'rgba(138,43,226,0.2)',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                  {(post.profile?.full_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              {post.profile?.full_name || post.profile?.username}
            </Text>
            {post.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MapPin size={12} color={colors.primary} />
                <Text style={{ fontSize: 11, color: colors.primary, marginLeft: 4, fontWeight: '500' }}>
                  {post.location}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={{ fontSize: 10, fontWeight: '500', color: isDark ? '#AAA8C3' : '#74738B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {formatTime(post.created_at)}
          </Text>
          
          {isMine && onDelete && (
            <Pressable onPress={() => onDelete(post.id)} style={{ padding: 8, marginLeft: 8 }}>
              <MoreVertical size={20} color={isDark ? '#6B5B7A' : '#9B8AA8'} />
            </Pressable>
          )}
        </View>

        {/* Content */}
        {post.content && (
          <Text style={{ fontSize: 14, color: colors.text, paddingHorizontal: 16, paddingBottom: 12, lineHeight: 20 }}>
            {post.content}
          </Text>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <View style={{ marginHorizontal: 8, marginBottom: 12, borderRadius: 12, overflow: 'hidden' }}>
            <Image
              source={{ uri: post.media_urls[0] }}
              style={{ width: '100%', height: SCREEN_WIDTH * 1.25, borderRadius: 12 }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Shared post indicator */}
        {post.is_shared && post.original_post && (
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Repeat size={12} color={colors.primary} />
              <Text style={{ fontSize: 11, color: colors.primary, marginLeft: 4, fontWeight: '600' }}>Shared post</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {post.original_post.profile?.avatar_url ? (
                <Image source={{ uri: post.original_post.profile.avatar_url }} style={{ width: 28, height: 28, borderRadius: 14 }} />
              ) : (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{(post.original_post.profile?.full_name || '?').charAt(0)}</Text>
                </View>
              )}
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{post.original_post.profile?.full_name}</Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: isDark ? '#AAA8C3' : '#74738B' }}>{post.original_post.content}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Kiff (Like) */}
            <Pressable 
              onPress={() => onLike(post.id)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}
            >
              <Flame size={24} color={hasLiked ? '#CA98FF' : (isDark ? '#AAA8C3' : '#74738B')} fill={hasLiked ? '#CA98FF' : 'none'} />
              {post.likes_count > 0 && (
                <Text style={{ 
                  marginLeft: 4, 
                  fontSize: 12, 
                  fontWeight: '700',
                  color: hasLiked ? '#CA98FF' : isDark ? '#AAA8C3' : '#74738B',
                }}>
                  {post.likes_count >= 1000 ? `${(post.likes_count / 1000).toFixed(1)}k` : post.likes_count}
                </Text>
              )}
            </Pressable>

            {/* Comment */}
            <Pressable 
              onPress={() => onComment(post.id)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}
            >
              <MessageCircle size={22} color={isDark ? '#AAA8C3' : '#74738B'} />
              {post.comments_count > 0 && (
                <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '700', color: isDark ? '#AAA8C3' : '#74738B' }}>
                  {post.comments_count}
                </Text>
              )}
            </Pressable>

            {/* Share */}
            <Pressable 
              onPress={() => onShare(post)}
              style={{ marginLeft: 'auto' }}
            >
              <Share2 size={22} color={isDark ? '#AAA8C3' : '#74738B'} />
            </Pressable>
          </View>

          {/* Comment Preview */}
          {latestComment && (
            <View style={{ 
              marginTop: 12, 
              backgroundColor: isDark ? 'rgba(17,17,39,0.4)' : 'rgba(248,245,255,0.6)', 
              borderRadius: 8, 
              padding: 10,
              borderLeftWidth: 2,
              borderLeftColor: isDark ? 'rgba(138,43,226,0.5)' : 'rgba(138,43,226,0.3)',
            }}>
              <Text style={{ fontSize: 11, color: colors.text, lineHeight: 16 }}>
                <Text style={{ fontWeight: '700' }}>{latestComment.profile?.full_name?.split(' ')[0] || 'User'}: </Text>
                <Text style={{ color: isDark ? '#AAA8C3' : '#74738B' }}>{latestComment.content}</Text>
              </Text>
            </View>
          )}
        </View>
      </GlassmorphismCard>
    </View>
  );
}

// Comment Modal
function CommentModal({ visible, postId, onClose }: { visible: boolean; postId: string | null; onClose: () => void }) {
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
      Alert.alert('Error', 'Unable to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Comments</Text>
            <Pressable onPress={onClose}>
              <X size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 400, padding: 16 }}>
            {comments.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MessageCircle size={48} color={isDark ? '#AAA8C3' : '#74738B'} />
                <Text style={{ color: isDark ? '#AAA8C3' : '#74738B', marginTop: 12 }}>No comments yet</Text>
                <Text style={{ color: isDark ? '#AAA8C3' : '#74738B', marginTop: 4, fontSize: 14 }}>Be the first to comment!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {comment.profile?.avatar_url ? (
                      <Image source={{ uri: comment.profile.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{(comment.profile?.full_name || '?').charAt(0)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 }}>{comment.profile?.full_name}</Text>
                        <Text style={{ fontSize: 14, color: colors.text }}>{comment.content}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: 12 }}>
                        <Text style={{ fontSize: 11, color: isDark ? '#AAA8C3' : '#74738B' }}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                        <Pressable style={{ marginLeft: 16 }}>
                          <Text style={{ fontSize: 11, color: isDark ? '#AAA8C3' : '#74738B', fontWeight: '600' }}>Reply</Text>
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
                placeholder="Add a comment..."
                placeholderTextColor={isDark ? '#AAA8C3' : '#74738B'}
                style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, maxHeight: 100 }}
                multiline
              />
              <Pressable 
                onPress={addComment}
                disabled={loading || !newComment.trim()}
                style={{ marginLeft: 12, padding: 12, backgroundColor: newComment.trim() ? colors.primary : colors.surface, borderRadius: 20 }}
              >
                <Flame size={18} color={newComment.trim() ? '#FFF' : isDark ? '#AAA8C3' : '#74738B'} fill={newComment.trim() ? '#FFF' : 'none'} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Share Modal
function ShareModal({ visible, post, onClose, onShared }: { visible: boolean; post: Post | null; onClose: () => void; onShared: () => void }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [shareMessage, setShareMessage] = useState('');

  const shareInApp = async () => {
    if (!post || !user) return;
    
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: shareMessage.trim() || `Shared ${post.profile?.full_name}'s post`,
        is_shared: true,
        original_post_id: post.id,
      });

      if (error) throw error;

      await supabase.rpc('increment_post_shares', { post_id: post.id });

      Alert.alert('Success', 'Post shared!');
      onShared();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Unable to share');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20, textAlign: 'center' }}>Share</Text>

          {post?.is_shared === false && (
            <TextInput
              value={shareMessage}
              onChangeText={setShareMessage}
              placeholder="Add a comment (optional)..."
              placeholderTextColor={isDark ? '#AAA8C3' : '#74738B'}
              style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, color: colors.text, marginBottom: 20, minHeight: 80 }}
              multiline
            />
          )}

          <Pressable onPress={shareInApp} style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Share in app</Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Create Post Modal with Image Support
function CreatePostModal({ visible, onClose, onPosted }: { visible: boolean; onClose: () => void; onPosted: () => void }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${user?.id}/${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, blob);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const createPost = async () => {
    if (!content.trim() && images.length === 0 || !user) return;

    try {
      setLoading(true);
      
      // Upload images
      const uploadedUrls = await Promise.all(images.map(uploadImage));
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        media_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
        media_type: uploadedUrls.length > 0 ? (uploadedUrls.length === 1 ? 'image' : 'mixed') : null,
      });

      if (error) throw error;

      setContent('');
      setImages([]);
      onPosted();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Unable to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Nouvelle Publication</Text>
            <Pressable onPress={onClose}>
              <X size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 400 }}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Quoi de neuf ?"
              placeholderTextColor={isDark ? '#AAA8C3' : '#74738B'}
              multiline
              style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, color: colors.text, fontSize: 16, minHeight: 100, textAlignVertical: 'top' }}
            />

            {/* Image Preview */}
            {images.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 8 }}>
                {images.map((uri, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                    <Pressable 
                      onPress={() => removeImage(index)}
                      style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#FF4444', borderRadius: 12, padding: 4 }}
                    >
                      <X size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', marginTop: 16, marginBottom: 20, alignItems: 'center' }}>
            <Pressable 
              onPress={pickImages}
              style={{ marginRight: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
            >
              <Camera size={24} color={isDark ? '#AAA8C3' : '#74738B'} />
              <Text style={{ marginLeft: 8, color: isDark ? '#AAA8C3' : '#74738B' }}>Photos</Text>
            </Pressable>
            <Text style={{ color: isDark ? '#74738B' : '#AAA8C3', fontSize: 12 }}>
              {images.length}/4 images
            </Text>
          </View>

          <Pressable 
            onPress={createPost}
            disabled={loading || (!content.trim() && images.length === 0)}
            style={{ 
              backgroundColor: (content.trim() || images.length > 0) ? colors.primary : colors.surface, 
              padding: 18, 
              borderRadius: 16, 
              alignItems: 'center', 
              opacity: (content.trim() || images.length > 0) ? 1 : 0.5 
            }}
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

// Floating Action Button - Gradient style
function FAB({ onPress }: { onPress: () => void }) {
  return (
    <Pressable 
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: 100,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#CA98FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
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
        <Plus size={28} color="#46007D" strokeWidth={2.5} />
      </LinearGradient>
    </Pressable>
  );
}

// Main Home Screen
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithComments[]>([]);
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
      // Fetch posts without profile relationships
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          likes:likes(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      
      // Fetch user profiles separately
      const userIds = [...new Set((postsData || []).map(p => p.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      // Fetch comments separately
      const postIds = (postsData || []).map(p => p.id);
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: false });
      
      // Fetch comment authors' profiles
      const commentUserIds = [...new Set((commentsData || []).map(c => c.user_id))];
      const { data: commentProfilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', commentUserIds);
      
      const commentProfilesMap = new Map((commentProfilesData || []).map(p => [p.id, p]));
      
      const commentsWithProfiles = (commentsData || []).map(c => ({
        ...c,
        profile: commentProfilesMap.get(c.user_id)
      }));
      
      const commentsMap = new Map();
      commentsWithProfiles.forEach(c => {
        if (!commentsMap.has(c.post_id)) {
          commentsMap.set(c.post_id, []);
        }
        commentsMap.get(c.post_id).push(c);
      });

      const postsWithLikeStatus = (postsData || []).map((post: any) => ({
        ...post,
        profile: profilesMap.get(post.user_id),
        has_liked: post.likes?.some((like: any) => like.user_id === user?.id),
        latest_comment: commentsMap.get(post.id)?.[0],
        comments: commentsMap.get(post.id) || [],
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
      'Delete',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('posts').delete().eq('id', postId);
              setPosts(posts.filter(p => p.id !== postId));
            } catch (error) {
              Alert.alert('Error', 'Unable to delete');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header avec photo profil et notification */}
      <View style={{ 
        paddingTop: 60, 
        paddingHorizontal: 20, 
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Photo de profil */}
        <Pressable onPress={() => {}}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(202,152,255,0.3)',
          }}>
            {user?.avatar_url ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                  {(user?.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Logo LinkUp */}
        <Text style={{ 
          fontSize: 24, 
          fontWeight: '900', 
          letterSpacing: -1,
        }}>
          <Text style={{ color: '#CA98FF' }}>LinkUp</Text>
        </Text>

        {/* Icône notification */}
        <Pressable onPress={() => {}} style={{ padding: 8 }}>
          <Bell size={24} color="#CA98FF" />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
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
              latestComment={post.latest_comment}
            />
          ))}
          
          {posts.length === 0 && !loading && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Flame size={64} color={isDark ? '#AAA8C3' : '#74738B'} />
              <Text style={{ fontSize: 18, color: colors.text, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>No posts yet</Text>
              <Text style={{ fontSize: 14, color: isDark ? '#AAA8C3' : '#74738B', textAlign: 'center' }}>Be the first to share something!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB onPress={() => setShowCreateModal(true)} />

      {/* Modals */}
      <CreatePostModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} onPosted={loadPosts} />
      <CommentModal visible={commentPostId !== null} postId={commentPostId} onClose={() => setCommentPostId(null)} />
      <ShareModal visible={sharePost !== null} post={sharePost} onClose={() => setSharePost(null)} onShared={loadPosts} />
    </View>
  );
}
