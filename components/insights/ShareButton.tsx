import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';

interface ShareButtonProps {
  month: string;
  onPress: () => void;
  isSharing: boolean;
}

export default function ShareButton({ month, onPress, isSharing }: ShareButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={isSharing}
      activeOpacity={0.7}
    >
      {isSharing ? (
        <ActivityIndicator size="small" color={colors.teal} />
      ) : (
        <Text style={styles.text}>Share your {month} report →</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.teal,
    fontFamily: 'System',
  },
});
