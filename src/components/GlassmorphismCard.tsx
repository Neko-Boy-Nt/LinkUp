import React from 'react';
import { View, ViewStyle, StyleProp, Text } from 'react-native';
import { useTheme } from '../lib/theme';

interface GlassmorphismCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'strong';
  animated?: boolean;
  delay?: number;
}

export function GlassmorphismCard({ 
  children, 
  style, 
  intensity = 'medium',
  animated = true,
  delay = 0 
}: GlassmorphismCardProps) {
  const { colors, isDark } = useTheme();

  const getBackgroundOpacity = () => {
    switch (intensity) {
      case 'light': return isDark ? '15' : '10';
      case 'medium': return isDark ? '25' : '20';
      case 'strong': return isDark ? '40' : '35';
    }
  };

  const getBlur = () => {
    switch (intensity) {
      case 'light': return 8;
      case 'medium': return 16;
      case 'strong': return 24;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: isDark 
            ? `rgba(44, 31, 58, 0.${getBackgroundOpacity()})` 
            : `rgba(255, 255, 255, 0.${getBackgroundOpacity()})`,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(255, 255, 255, 0.5)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: getBlur(),
          elevation: isDark ? 8 : 4,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
          backgroundColor: isDark 
            ? `linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(44, 31, 58, 0.2) 100%)` 
            : `linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 232, 250, 0.2) 100%)`,
        }}
      />
      {children}
    </View>
  );
}

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scale?: number;
}

export function AnimatedPressable({ 
  children, 
  onPress, 
  onLongPress,
  style, 
  scale = 0.95 
}: AnimatedPressableProps) {
  return (
    <View
      onTouchStart={onPress}
      onTouchEnd={onPress}
      onTouchCancel={onPress}
      style={style}
    >
      {children}
    </View>
  );
}

export function Shimmer({ width = 200, height = 20 }: { width?: number; height?: number }) {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: isDark ? '#2C1F3A' : '#E8E0F0',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: width * 0.5,
          height,
          backgroundColor: isDark 
            ? 'rgba(138, 43, 226, 0.3)' 
            : 'rgba(138, 43, 226, 0.2)',
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

interface AnimatedBadgeProps {
  count: number;
  color?: string;
}

export function AnimatedBadge({ count, color }: AnimatedBadgeProps) {
  const { colors } = useTheme();

  if (count === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: color || colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: color || colors.primary,
          opacity: 0.4,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: color || colors.primary,
          opacity: 0.2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: color || colors.primary,
          opacity: 0.1,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#FFF',
            marginRight: count > 9 ? 2 : 0,
          }}
        />
        {count > 9 && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#FFF',
            }}
          />
        )}
      </View>
    </View>
  );
}

interface FABProps {
  icon: string;
  onPress: () => void;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export function FloatingActionButton({ icon, onPress, color, size = 'medium' }: FABProps) {
  const { colors } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small': return 48;
      case 'medium': return 56;
      case 'large': return 64;
    }
  };

  return (
    <View
      onTouchStart={onPress}
      style={{
        width: getSize(),
        height: getSize(),
        borderRadius: getSize() / 2,
        backgroundColor: color || colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: color || colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Text style={{ fontSize: size === 'small' ? 20 : size === 'large' ? 28 : 24, color: '#FFF', fontWeight: 'bold' }}>
        {icon}
      </Text>
    </View>
  );
}
