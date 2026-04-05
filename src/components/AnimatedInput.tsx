import React from 'react';
import { View, TextInput, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../lib/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: string;
}

export function AnimatedInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: InputProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const borderColor = useSharedValue<string>(colors.surface);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderColor.value,
    borderWidth: 2,
  }));

  const handleFocus = () => {
    scale.value = withSpring(1.02, { stiffness: 300, damping: 20 });
    borderColor.value = colors.primary;
  };

  const handleBlur = () => {
    scale.value = withSpring(1, { stiffness: 300, damping: 20 });
    borderColor.value = colors.surface;
  };

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        } as ViewStyle,
        animatedStyle,
      ]}
    >
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          padding: 18,
          fontSize: 16,
          color: colors.text,
        } as TextStyle}
        placeholderTextColor="#999"
      />
    </Animated.View>
  );
}
