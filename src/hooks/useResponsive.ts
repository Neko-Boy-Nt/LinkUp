import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

interface ResponsiveState {
  isWeb: boolean;
  isWebMobile: boolean;
  isMobile: boolean;
  fontScale: number;
  screenWidth: number;
  screenHeight: number;
}

export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const isWeb = Platform.OS === 'web';
  const isWebMobile = isWeb && dimensions.width < 768;
  const isMobile = dimensions.width < 768;
  
  // Font scale: smaller for web mobile, normal for native mobile, larger for desktop
  let fontScale = 1;
  if (isWebMobile) {
    fontScale = 0.85; // Smaller fonts for web mobile
  } else if (isWeb && dimensions.width >= 768) {
    fontScale = 1; // Normal for desktop web
  } else if (Platform.OS !== 'web') {
    fontScale = 1; // Normal for native mobile
  }

  return {
    isWeb,
    isWebMobile,
    isMobile,
    fontScale,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
  };
}
