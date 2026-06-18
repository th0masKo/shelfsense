import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface SuccessToastProps {
  message: string;
  onDismiss: () => void;
}

export default function SuccessToast({ message, onDismiss }: SuccessToastProps) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <Text style={styles.text}>✓ {message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    backgroundColor: '#2C2C2A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'DMSans',
  },
});
