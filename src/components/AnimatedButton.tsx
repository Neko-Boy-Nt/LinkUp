import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../lib/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function AnimatedButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.surface;
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'primary') return '#FFF';
    if (variant === 'secondary') return colors.text;
    return colors.primary;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: colors.primary,
        } as ViewStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={{
            color: getTextColor(),
            fontSize: 16,
            fontWeight: '600',
          } as TextStyle}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
