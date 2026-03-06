import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/store';
import { authApi, userApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('提示', '请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const { session, user } = await authApi.signIn(email.trim(), password);
      
      if (user) {
        // Get user profile
        const profile = await userApi.getProfile(user.id);
        setUser(profile);
        setIsAuthenticated(true);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: Spacing.lg,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xl * 2 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: BorderRadius.xl,
              backgroundColor: colors.tint,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.md,
            }}
          >
            <Text style={{ fontSize: 40, color: '#fff', fontWeight: 'bold' }}>L</Text>
          </View>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: 'bold', color: colors.text }}>
            Lami Chat
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: Spacing.xs }}>
            简洁、纯粹的聊天体验
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: Spacing.md }}>
          <View>
            <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.xs }}>
              邮箱
            </Text>
            <TextInput
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: BorderRadius.md,
                paddingHorizontal: Spacing.md,
                fontSize: FontSize.md,
                color: colors.text,
                backgroundColor: colors.inputBackground,
              }}
              placeholder="请输入邮箱"
              placeholderTextColor={colors.mutedText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.xs }}>
              密码
            </Text>
            <TextInput
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: BorderRadius.md,
                paddingHorizontal: Spacing.md,
                fontSize: FontSize.md,
                color: colors.text,
                backgroundColor: colors.inputBackground,
              }}
              placeholder="请输入密码"
              placeholderTextColor={colors.mutedText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={{
              height: 50,
              backgroundColor: colors.tint,
              borderRadius: BorderRadius.md,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: Spacing.md,
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontSize: FontSize.md, color: '#fff', fontWeight: '600' }}>
                登录
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl }}>
          <Text style={{ color: colors.mutedText }}>还没有账号？</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={{ color: colors.tint, fontWeight: '600' }}> 立即注册</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
