import React, { useEffect, useRef } from 'react';
import { Animated, type ViewStyle, type StyleProp } from 'react-native';

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedListItem({ index, children, style }: AnimatedListItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 60,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
