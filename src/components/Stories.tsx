import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Image, 
  Modal,
  Dimensions,
  StatusBar,
  Alert,
  TextInput
} from 'react-native';
import { useTheme } from '../lib/theme';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';
import Animated, { 
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { Story, Profile } from '../types';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StoryRingProps {
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
  hasUnseenStories: boolean;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function StoryRing({ 
  userId, 
  avatarUrl, 
  fullName, 
  hasUnseenStories, 
  onPress,
  size = 'medium'
}: StoryRingProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const getSize = () => {
    switch (size) {
      case 'small': return { ring: 52, avatar: 44, font: 12 };
      case 'medium': return { ring: 72, avatar: 60, font: 14 };
      case 'large': return { ring: 88, avatar: 76, font: 16 };
    }
  };

  const s = getSize();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ alignItems: 'center', marginRight: 12 }}
      >
        <View
          style={{
            width: s.ring,
            height: s.ring,
            borderRadius: s.ring / 2,
            padding: 3,
            backgroundColor: hasUnseenStories ? 'transparent' : 'transparent',
            ...(hasUnseenStories && {
              borderWidth: 3,
              borderColor: colors.primary,
            }),
            borderStyle: hasUnseenStories ? 'dashed' : 'solid',
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{
                width: s.avatar,
                height: s.avatar,
                borderRadius: s.avatar / 2,
              }}
            />
          ) : (
            <View
              style={{
                width: s.avatar,
                height: s.avatar,
                borderRadius: s.avatar / 2,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: s.font }}>
                {(fullName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        {fullName && (
          <Text 
            numberOfLines={1}
            style={{ 
              fontSize: 11, 
              color: hasUnseenStories ? colors.text : '#888', 
              marginTop: 4,
              maxWidth: s.ring,
              fontWeight: hasUnseenStories ? '600' : '400',
            }}
          >
            {fullName.split(' ')[0]}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onViewStory: (storyId: string) => void;
}

export function StoryViewer({ visible, stories, initialIndex, onClose, onViewStory }: StoryViewerProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const progressAnim = useSharedValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const STORY_DURATION = 5000; // 5 seconds per story

  const currentStory = stories[currentIndex];
  const isMyStory = currentStory?.user_id === user?.id;

  useEffect(() => {
    if (visible && currentStory) {
      progressAnim.value = 0;
      setProgress(0);
      
      // Mark as viewed
      if (!currentStory.has_viewed && !isMyStory) {
        onViewStory(currentStory.id);
      }

      // Start progress animation
      progressAnim.value = withTiming(100, { 
        duration: STORY_DURATION 
      }, (finished) => {
        if (finished) {
          runOnJS(goToNext)();
        }
      });

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [visible, currentIndex, currentStory]);

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTap = (event: any) => {
    const x = event.nativeEvent.locationX;
    if (x < SCREEN_WIDTH / 2) {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  const handleLongPress = () => {
    progressAnim.value = progressAnim.value; // Pause animation
  };

  const deleteStory = async () => {
    if (!currentStory || !isMyStory) return;
    
    Alert.alert(
      'Supprimer la story',
      'Tu es sûr de vouloir supprimer cette story ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('stories').delete().eq('id', currentStory.id);
              onClose();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la story');
            }
          }
        }
      ]
    );
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Progress bars */}
        <View 
          style={{ 
            position: 'absolute', 
            top: 50, 
            left: 10, 
            right: 10, 
            flexDirection: 'row',
            zIndex: 100,
          }}
        >
          {stories.map((_, idx) => (
            <View 
              key={idx}
              style={{ 
                flex: 1, 
                height: 3, 
                backgroundColor: 'rgba(255,255,255,0.3)',
                marginHorizontal: 2,
                borderRadius: 2,
              }}
            >
              <View 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#FFF',
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                }} 
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View 
          style={{ 
            position: 'absolute', 
            top: 60, 
            left: 10, 
            right: 10, 
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {currentStory.profile?.avatar_url ? (
              <Image
                source={{ uri: currentStory.profile.avatar_url }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
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
                  marginRight: 10,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                  {(currentStory.profile?.full_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
                {currentStory.profile?.full_name || currentStory.profile?.username}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {new Date(currentStory.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {isMyStory && (
            <Pressable onPress={deleteStory} style={{ padding: 8 }}>
              <Text style={{ color: '#FFF', fontSize: 20 }}>🗑️</Text>
            </Pressable>
          )}
          
          <Pressable onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: '#FFF', fontSize: 24 }}>✕</Text>
          </Pressable>
        </View>

        {/* Story Content */}
        <Pressable 
          onPress={handleTap}
          onLongPress={handleLongPress}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          {currentStory.media_type === 'text' ? (
            <View 
              style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: currentStory.background_color || colors.primary,
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
              }}
            >
              <Text 
                style={{ 
                  color: currentStory.text_color || '#FFF', 
                  fontSize: 24,
                  fontWeight: '600',
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                {currentStory.content}
              </Text>
            </View>
          ) : currentStory.media_url ? (
            <Image
              source={{ uri: currentStory.media_url }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 18 }}>Story indisponible</Text>
            </View>
          )}
        </Pressable>

        {/* Views count (for my stories) */}
        {isMyStory && (
          <View 
            style={{ 
              position: 'absolute', 
              bottom: 40, 
              left: 20,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 16 }}>👁</Text>
            <Text style={{ color: '#FFF', marginLeft: 6, fontWeight: '600' }}>
              {currentStory.views_count} vue{currentStory.views_count !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Tap zones indicator */}
        <View 
          style={{ 
            position: 'absolute', 
            bottom: 100, 
            left: 0, 
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 40,
          }}
          pointerEvents="none"
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>← Précédent</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Suivant →</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Component to add new story
export function AddStoryButton({ onStoryAdded }: { onStoryAdded: () => void }) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8A2BE2');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');

  const colors_palette = [
    '#8A2BE2', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF',
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setSelectedImage(result.assets[0].uri);
      setStoryType('image');
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${user?.id}/story_${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('story-images')
      .upload(fileName, blob);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const addStory = async () => {
    if (!user) return;
    if (storyType === 'text' && !storyText.trim()) return;
    if (storyType === 'image' && !selectedImage) return;

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      let mediaUrl = null;
      if (storyType === 'image' && selectedImage) {
        mediaUrl = await uploadImage(selectedImage);
      }

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        content: storyType === 'text' ? storyText.trim() : null,
        media_type: storyType,
        media_url: mediaUrl,
        background_color: storyType === 'text' ? selectedColor : null,
        text_color: '#FFFFFF',
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      setShowModal(false);
      setStoryText('');
      setSelectedImage(null);
      setStoryType('text');
      onStoryAdded();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la story');
    }
  };

  return (
    <>
      <Pressable 
        onPress={() => setShowModal(true)}
        style={{ alignItems: 'center', marginRight: 12 }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.primary,
            borderStyle: 'dashed',
          }}
        >
          <Text style={{ fontSize: 32 }}>➕</Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.text, marginTop: 4 }}>Ma story</Text>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
            Nouvelle story
          </Text>

          {/* Type Selector */}
          <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
            <Pressable
              onPress={() => setStoryType('text')}
              style={{ 
                flex: 1, 
                padding: 16, 
                borderRadius: 12, 
                backgroundColor: storyType === 'text' ? colors.primary : 'rgba(255,255,255,0.1)',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Texte</Text>
            </Pressable>
            <Pressable
              onPress={() => setStoryType('image')}
              style={{ 
                flex: 1, 
                padding: 16, 
                borderRadius: 12, 
                backgroundColor: storyType === 'image' ? colors.primary : 'rgba(255,255,255,0.1)',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Photo</Text>
            </Pressable>
          </View>

          {storyType === 'text' ? (
            <>
              <TextInput
                value={storyText}
                onChangeText={setStoryText}
                placeholder="Écris quelque chose..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                style={{
                  backgroundColor: selectedColor,
                  borderRadius: 20,
                  padding: 20,
                  color: '#FFF',
                  fontSize: 18,
                  minHeight: 150,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              />

              <Text style={{ color: '#FFF', marginBottom: 12 }}>Couleur du fond:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
                {colors_palette.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: c,
                      margin: 6,
                      borderWidth: selectedColor === c ? 3 : 0,
                      borderColor: '#FFF',
                    }}
                  />
                ))}
              </View>
            </>
          ) : (
            <>
              {selectedImage ? (
                <View style={{ position: 'relative', marginBottom: 20 }}>
                  <Image source={{ uri: selectedImage }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
                  <Pressable 
                    onPress={() => setSelectedImage(null)}
                    style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#FF4444', borderRadius: 12, padding: 6 }}
                  >
                    <Text style={{ color: '#FFF' }}>✕</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickImage}
                  style={{
                    width: '100%',
                    height: 150,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 40 }}>📷</Text>
                  <Text style={{ color: '#FFF', marginTop: 8 }}>Choisir une photo</Text>
                </Pressable>
              )}
            </>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable 
              onPress={() => {
                setShowModal(false);
                setSelectedImage(null);
                setStoryType('text');
              }}
              style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Annuler</Text>
            </Pressable>
            <Pressable 
              onPress={addStory}
              disabled={storyType === 'text' ? !storyText.trim() : !selectedImage}
              style={{ 
                flex: 1, 
                backgroundColor: (storyType === 'text' ? storyText.trim() : selectedImage) ? colors.primary : 'rgba(255,255,255,0.1)', 
                padding: 16, 
                borderRadius: 12, 
                alignItems: 'center',
                opacity: (storyType === 'text' ? storyText.trim() : selectedImage) ? 1 : 0.5
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Publier</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
