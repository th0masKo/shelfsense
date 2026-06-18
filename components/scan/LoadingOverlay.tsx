import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';

export default function LoadingOverlay() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reading your product…</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(250,250,248,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  text: {
    fontSize: 20,
    color: '#2C2C2A',
    fontFamily: 'Fraunces',
  },
  track: {
    width: 200,
    height: 3,
    backgroundColor: '#E5E3DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: 3,
    backgroundColor: '#1D9E75',
    borderRadius: 2,
  },
});
