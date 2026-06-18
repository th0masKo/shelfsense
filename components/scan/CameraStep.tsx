import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, fonts } from '../../constants/theme';

interface CameraStepProps {
  overlayText: string;
  thumbnailUri?: string | null;
  onCapture: (base64: string, uri: string) => void;
  isCapturing?: boolean;
}

export function CameraStep({
  overlayText,
  thumbnailUri,
  onCapture,
  isCapturing = false,
}: CameraStepProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleShutter = async () => {
    if (cameraRef.current == null || isCapturing) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.75,
      });
      if (photo?.base64 != null) {
        onCapture(photo.base64, photo.uri);
      }
    } catch {
      // Shutter failure is non-fatal; user can retry
    }
  };

  if (permission == null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>📷</Text>
        <Text style={styles.emptyTitle}>Camera access needed</Text>
        <Text style={styles.emptySub}>
          ShelfSense uses your camera to read product labels and expiry dates.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={() => requestPermission()}>
          <Text style={styles.grantBtnText}>Grant access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>{overlayText}</Text>
          {thumbnailUri != null && (
            <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
          )}
        </View>
        <View style={styles.shutterRow}>
          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleShutter}
            disabled={isCapturing}
            activeOpacity={0.9}
          >
            <View style={[styles.shutterInner, isCapturing && styles.shutterDisabled]} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  overlayText: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  thumbnail: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shutterRow: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textGrey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  grantBtn: {
    backgroundColor: colors.teal,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  grantBtnText: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CameraStep;
