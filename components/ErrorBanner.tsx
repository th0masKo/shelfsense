import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants/theme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.message}>{message}</Text>
      {onRetry != null && (
        <TouchableOpacity onPress={onRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.redLight,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.red,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: colors.red,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  retry: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.red,
    fontFamily: fonts.body,
  },
});
