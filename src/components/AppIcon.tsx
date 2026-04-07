import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface AppIconProps {
  size?: number;
  borderRadius?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  size = 1024, 
  borderRadius = 180 // iOS standard corner radius for app icons
}) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      <Image
        source={require('../assets/icon.png')}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default AppIcon;
