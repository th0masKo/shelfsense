import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../hooks/usePantryItems';
import { colors, fonts } from '../constants/theme';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (signUpError) throw signUpError;
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Sign in after confirming your account.',
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>ShelfSense</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => {
                setMode('login');
                setError(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <Text style={styles.toggleDivider}>·</Text>
            <TouchableOpacity
              onPress={() => {
                setMode('signup');
                setError(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textGrey}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textGrey}
            secureTextEntry
            style={styles.input}
          />

          {error != null && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'login' ? 'Log in' : 'Sign up'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontFamily: fonts.display,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textGrey,
    fontFamily: fonts.body,
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  toggleActive: {
    color: colors.teal,
    fontWeight: '600',
  },
  toggleDivider: {
    marginHorizontal: 10,
    color: colors.border,
    fontSize: 15,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textGrey,
    letterSpacing: 0.04 * 11,
    fontFamily: fonts.body,
    marginBottom: 6,
  },
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    marginBottom: 16,
  },
  error: {
    fontSize: 13,
    color: colors.red,
    fontFamily: fonts.body,
    marginBottom: 12,
  },
  submitBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fonts.body,
  },
});
