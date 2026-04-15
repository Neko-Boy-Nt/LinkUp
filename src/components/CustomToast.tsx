import { useEffect } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useTheme } from '../lib/theme';
import { CheckCircle, XCircle, AlertCircle, X } from './Icon';

interface CustomToastProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export function CustomToast({ visible, type, title, message, onClose, duration = 3000 }: CustomToastProps) {
  const { colors, isDark } = useTheme();
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  const typeStyles = {
    success: {
      bg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
      border: '#22C55E',
      icon: <CheckCircle size={24} color="#22C55E" />,
    },
    error: {
      bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      border: '#EF4444',
      icon: <XCircle size={24} color="#EF4444" />,
    },
    warning: {
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      border: '#F59E0B',
      icon: <AlertCircle size={24} color="#F59E0B" />,
    },
  };

  const style = typeStyles[type];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: style.bg,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: style.border,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: style.border,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {style.icon}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            {title}
          </Text>
          {message && (
            <Text style={{ fontSize: 12, color: isDark ? '#AAA8C3' : '#74738B', marginTop: 2 }}>
              {message}
            </Text>
          )}
        </View>
        <Pressable onPress={handleClose} style={{ padding: 4 }}>
          <X size={18} color={isDark ? '#AAA8C3' : '#74738B'} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// Hook pour gérer le toast
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message?: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
  });

  const showToast = useCallback((type: 'success' | 'error' | 'warning', title: string, message?: string) => {
    setToast({ visible: true, type, title, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast('error', title, message);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message);
  }, [showToast]);

  return { toast, showToast, hideToast, success, error, warning };
}
