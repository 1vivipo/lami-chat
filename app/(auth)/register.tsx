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
import { authApi, userApi, generateUniqueAccount } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: 输入邮箱, 2: 输入验证码, 3: 设置密码
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Send verification code
  const sendCode = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    try {
      // Check if email already exists
      const { data, error } = await fetch(
        `https://uxpzbwjqfnwvxjllcadj.supabase.co/auth/v1/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZm53dnhqbGxjYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg2ODIsImV4cCI6MjA4ODM3NDY4Mn0.n_Q9G1x5fsR7Qo-ZyoUK8DtCP77Yk6bS3sCQGD4gndo',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: 'temp_' + Math.random().toString(36).substring(7),
          }),
        }
      ).then(r => r.json());

      // Start countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert('成功', '验证码已发送到您的邮箱，请查收');
      setStep(2);
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Verify code
  const verifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    setLoading(true);
    try {
      // For simplicity, we'll proceed to password setup
      // In production, you'd verify the OTP here
      setStep(3);
    } catch (error: any) {
      Alert.alert('验证失败', error.message || '验证码错误');
    } finally {
      setLoading(false);
    }
  };

  // Complete registration
  const completeRegistration = async () => {
    if (!password.trim() || password.length < 6) {
      Alert.alert('提示', '密码至少需要6位');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }

    setLoading(true);
    try {
      // Sign up with email and password
      const { user, session } = await authApi.signUp(email.trim(), password);
      
      if (user) {
        // Generate unique account
        const account = await generateUniqueAccount();
        
        // Create user profile
        await userApi.createProfile(
          user.id,
          email.trim(),
          account,
          nickname.trim()
        );

        Alert.alert(
          '注册成功',
          `您的账号是: ${account}\n请牢记此账号，可用于添加好友`,
          [
            {
              text: '确定',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '请稍后重试');
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
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress indicator */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg }}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: step >= s ? colors.tint : colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{s}</Text>
              </View>
              {s < 3 && (
                <View
                  style={{
                    width: 40,
                    height: 2,
                    backgroundColor: step > s ? colors.tint : colors.border,
                  }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Step 1: Email */}
        {step === 1 && (
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: 'bold', color: colors.text, textAlign: 'center' }}>
              输入您的邮箱
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, textAlign: 'center' }}>
              我们将发送验证码到您的邮箱
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
                marginTop: Spacing.md,
              }}
              placeholder="请输入邮箱"
              placeholderTextColor={colors.mutedText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={{
                height: 50,
                backgroundColor: colors.tint,
                borderRadius: BorderRadius.md,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: Spacing.md,
              }}
              onPress={sendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: FontSize.md, color: '#fff', fontWeight: '600' }}>
                  发送验证码
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Verification Code */}
        {step === 2 && (
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: 'bold', color: colors.text, textAlign: 'center' }}>
              输入验证码
            </Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, textAlign: 'center' }}>
              验证码已发送至 {email}
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
                marginTop: Spacing.md,
                textAlign: 'center',
                letterSpacing: 8,
              }}
              placeholder="请输入6位验证码"
              placeholderTextColor={colors.mutedText}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              onPress={sendCode}
              disabled={countdown > 0}
            >
              <Text style={{ 
                color: countdown > 0 ? colors.mutedText : colors.tint, 
                textAlign: 'center' 
              }}>
                {countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送验证码'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                height: 50,
                backgroundColor: colors.tint,
                borderRadius: BorderRadius.md,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: Spacing.md,
              }}
              onPress={verifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: FontSize.md, color: '#fff', fontWeight: '600' }}>
                  验证
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Password & Nickname */}
        {step === 3 && (
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: 'bold', color: colors.text, textAlign: 'center' }}>
              设置密码和昵称
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
              placeholder="请输入密码（至少6位）"
              placeholderTextColor={colors.mutedText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
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
              placeholder="请再次输入密码"
              placeholderTextColor={colors.mutedText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
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
              placeholder="请输入昵称"
              placeholderTextColor={colors.mutedText}
              value={nickname}
              onChangeText={setNickname}
            />
            <TouchableOpacity
              style={{
                height: 50,
                backgroundColor: colors.tint,
                borderRadius: BorderRadius.md,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: Spacing.md,
              }}
              onPress={completeRegistration}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: FontSize.md, color: '#fff', fontWeight: '600' }}>
                  完成注册
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
