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
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../src/lib/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { GlassmorphismCard } from '../../src/components/GlassmorphismCard';
import { StoryViewer, AddStoryButton } from '../../src/components/Stories';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomToast, useToast } from '../../src/components/CustomToast';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Post, Profile, Comment, Story } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostWithComments extends Post {
  latest_comment?: Comment & { profile?: Profile };
}

interface StoryWithProfile extends Story {
  profile?: Profile;
  has_viewed?: boolean;
}

// Stories Bar avec Gradient Ring
function StoryRingItem({ 
  avatarUrl, 
  fullName, 
  hasUnseenStories,
  onPress 
}: { 
  avatarUrl: string | null;
  fullName: string | null;
  hasUnseenStories: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', marginRight: 16 }}>
      {hasUnseenStories ? (
        <LinearGradient
          colors={['#CA98FF', '#9c42f4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            padding: 3,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: '#fff' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 20 }}>
                {(fullName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </LinearGradient>
      ) : (
        <View style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          borderWidth: 2,
          borderColor: '#E0D7FF',
          backgroundColor: '#F8F5FF',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
        }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 66, height: 66, borderRadius: 33 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 20 }}>
                {(fullName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <Text 
        numberOfLines={1}
        style={{
          marginTop: 8,
          fontSize: 10,
          fontWeight: '500',
          color: '#666666',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          maxWidth: 80,
        }}>
        {fullName?.split(' ')[0] || 'User'}
      </Text>
    </Pressable>
  );
}

// Stories Bar
function StoriesBar({ onStoryAdded }: { onStoryAdded: () => void }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [groupedStories, setGroupedStories] = useState<Map<string, StoryWithProfile[]>>(new Map());
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    if (!user?.id) return;
    
    try {
      const now = new Date().toISOString();
      
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!storiesData || storiesData.length === 0) {
        setGroupedStories(new Map());
        return;
      }

      const userIds = [...new Set(storiesData.map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      const storiesWithProfile: StoryWithProfile[] = storiesData.map((story: any) => ({
        ...story,
        profile: profilesMap.get(story.user_id),
      }));

      const grouped = new Map<string, StoryWithProfile[]>();
      storiesWithProfile.forEach((story: StoryWithProfile) => {
        const userStories = grouped.get(story.user_id) || [];
        userStories.push(story);
        grouped.set(story.user_id, userStories);
      });

      setGroupedStories(grouped);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const users = Array.from(groupedStories.entries()).filter(([userId]) => userId !== user?.id);
  const selectedUser = users[selectedUserIndex];

  return (
    <>
      <View style={{ paddingVertical: 16 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          scrollEventThrottle={16}
        >
          <AddStoryButton onStoryAdded={onStoryAdded} />
          
          {users.map(([userId, userStories], index) => {
            const firstStory = userStories[0];
            const hasUnseen = userStories.some(s => !s.has_viewed);
            
            return (
              <StoryRingItem
                key={`story-${userId}`}
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
          onViewStory={async (storyId) => {
            try {
              await supabase.from('story_views').insert({
                story_id: storyId,
                viewer_id: user?.id,
              });
            } catch (error) {
              console.error('Error marking story as viewed:', error);
            }
          }}
        />
      )}
    </>
  );
}

// Post Card avec Glassmorphism
function PostCard({ 
  post, 
  onLike, 
  onComment,
  latestComment
}: { 
  post: PostWithComments;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  latestComment?: Comment & { profile?: Profile };
}) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const hasLiked = post.has_liked || false;
  const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [];

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{
        backgroundColor: '#FFFFFF',
        // Note: backdropFilter not supported on mobile, using opacity instead
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0D7FF',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <LinearGradient
              colors={['#CA98FF', '#e097fd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 48, height: 48, borderRadius: 24, padding: 1 }}
            >
              {post.profile?.avatar_url ? (
                <Image
                  source={{ uri: post.profile.avatar_url }}
                  style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#E0D7FF' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                    {(post.profile?.full_name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </LinearGradient>
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#e5e3ff' }}>
                {post.profile?.full_name || 'Unknown User'}
              </Text>
              {post.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <MaterialCommunityIcons name="map-marker" size={12} color="#CA98FF" />
                  <Text style={{ fontSize: 11, color: '#CA98FF', marginLeft: 4, fontWeight: '500' }}>
                    {post.location}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <MaterialCommunityIcons name="dots-horizontal" size={20} color="#666666" />
        </View>

        {/* Content */}
        {post.content && (
          <Text style={{ fontSize: 14, color: '#666666', paddingHorizontal: 16, paddingBottom: 12, lineHeight: 20 }}>
            {post.content}
          </Text>
        )}

        {/* Media */}
        {mediaUrls.length > 0 && (
          <View style={{ marginHorizontal: 12, marginBottom: 12, borderRadius: 12, overflow: 'hidden', aspectRatio: 4/5 }}>
            <Image
              source={{ uri: mediaUrls[0] }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Actions */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E0D7FF' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <Pressable
              onPress={() => onLike(post.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={20} 
                  color={hasLiked ? '#8A2BE2' : '#666666'}
                />
              </View>
              {(post.likes_count || 0) > 0 && (
                <Text style={{ fontSize: 12, fontWeight: '700', color: hasLiked ? '#8A2BE2' : '#666666' }}>
                  {(post.likes_count || 0) >= 1000 ? `${((post.likes_count || 0) / 1000).toFixed(1)}k` : (post.likes_count || 0)}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => onComment(post.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="chat" size={20} color="#666666" />
              </View>
              {(post.comments_count || 0) > 0 && (
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#666666' }}>
                  {post.comments_count || 0}
                </Text>
              )}
            </Pressable>

            <View style={{ flex: 1 }} />

            <MaterialCommunityIcons name="share" size={20} color="#666666" />
            <MaterialCommunityIcons name="bookmark" size={20} color="#666666" />
          </View>
        </View>
      </View>
    </View>
  );
}

// Main Home Screen
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostWithComments[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, [user?.id]);

  const loadPosts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      const postIds = postsData.map(p => p.id);
      
      let commentsWithProfiles: (Comment & { profile?: Profile })[] = [];
      if (postIds.length > 0) {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .in('post_id', postIds)
          .order('created_at', { ascending: false });
        
        if (commentsData && commentsData.length > 0) {
          const commentUserIds = [...new Set(commentsData.map(c => c.user_id))];
          const { data: commentProfilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', commentUserIds);
          
          const commentProfilesMap = new Map((commentProfilesData || []).map(p => [p.id, p]));
          
          commentsWithProfiles = commentsData.map(c => ({
            ...c,
            profile: commentProfilesMap.get(c.user_id)
          }));
        }
      }
      
      const commentsMap = new Map<string, (Comment & { profile?: Profile })[]>();
      commentsWithProfiles.forEach(c => {
        if (!commentsMap.has(c.post_id)) {
          commentsMap.set(c.post_id, []);
        }
        commentsMap.get(c.post_id)!.push(c);
      });

      let likedPostIds = new Set<string>();
      if (postIds.length > 0) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.id);

        likedPostIds = new Set((likesData || []).map(l => l.post_id));
      }

      const postsWithData: PostWithComments[] = postsData.map((post: any) => ({
        ...post,
        profile: profilesMap.get(post.user_id),
        has_liked: likedPostIds.has(post.id),
        latest_comment: commentsMap.get(post.id)?.[0],
        comments_count: commentsMap.get(post.id)?.length || 0,
        likes_count: post.likes_count || 0,
      }));

      setPosts(postsWithData);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
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
    if (!user?.id) return;

    try {
      const post = posts.find(p => p.id === postId);
      
      if (post?.has_liked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, has_liked: false, likes_count: Math.max(0, (p.likes_count || 1) - 1) } : p
        ));
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, has_liked: true, likes_count: (p.likes_count || 0) + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomToast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => {}}
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header avec Glassmorphism */}
        <View style={{
          backgroundColor: '#FFFFFF',
          // Note: backdropFilter not supported on mobile
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Profile */}
          <Pressable>
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
                <View style={{ width: '100%', height: '100%', backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>
                    {(user?.email || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Logo */}
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '900', 
            letterSpacing: -1,
            color: colors.text,
          }}>
            <Text style={{ color: '#CA98FF' }}>Link</Text><Text style={{ color: colors.text }}>Up</Text>
          </Text>

          {/* Notifications */}
          <MaterialCommunityIcons name="bell" size={24} color="#CA98FF" />
        </View>

        {/* Stories */}
        <StoriesBar onStoryAdded={loadPosts} />

        {/* Posts Feed */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {posts.map((post) => (
            <PostCard
              key={`post-${post.id}`}
              post={post}
              onLike={handleLike}
              onComment={(postId) => setCommentPostId(postId)}
              latestComment={post.latest_comment}
            />
          ))}
          
          {posts.length === 0 && !loading && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <MaterialCommunityIcons name="fire" size={64} color="#666666" />
              <Text style={{ fontSize: 18, color: colors.text, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>No posts yet</Text>
              <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>Be the first to share something!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}