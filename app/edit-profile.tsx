import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store';
import { userApi, storageApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [signature, setSignature] = useState(user?.signature || '');
  const [account, setAccount] = useState(user?.account || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url);
  const [loading, setLoading] = useState(false);
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setSignature(user.signature || '');
      setAccount(user.account || '');
      setAvatarUri(user.avatar_url);
    }
  }, [user]);

  const validateAccount = (value: string) => {
    if (value.length < APP_CONFIG.account.minLength) {
      setAccountError(`账号至少需要${APP_CONFIG.account.minLength}位`);
      return false;
    }
    if (!APP_CONFIG.account.pattern.test(value)) {
      setAccountError('账号只能包含字母和数字');
      return false;
    }
    setAccountError('');
    return true;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('提示', '需要相册权限才能选择头像');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (account !== user.account && !validateAccount(account)) {
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = avatarUri;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== user.avatar_url && !avatarUri.startsWith('http')) {
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        avatarUrl = await storageApi.uploadAvatar(user.id, blob, `avatar_${Date.now()}.jpg`);
      }

      // Update profile
      const updates: any = {
        nickname,
        signature,
        avatar_url: avatarUrl,
      };

      // Update account if changed
      if (account !== user.account) {
        await userApi.updateAccount(user.id, account.toUpperCase());
      }

      const updatedUser = await userApi.updateProfile(user.id, updates);
      setUser(updatedUser);

      Alert.alert('成功', '资料已更新', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('更新失败', error.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: Spacing.lg }}>
        {/* Avatar */}
        <TouchableOpacity
          style={{ alignItems: 'center', marginBottom: Spacing.xl }}
          onPress={pickImage}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.tint,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: 100, height: 100, borderRadius: 50 }} />
            ) : (
              <Text style={{ color: '#fff', fontSize: 36, fontWeight: 'bold' }}>
                {nickname?.charAt(0) || 'U'}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm }}>
            <Ionicons name="camera-outline" size={18} color={colors.tint} />
            <Text style={{ color: colors.tint, marginLeft: 4 }}>更换头像</Text>
          </View>
        </TouchableOpacity>

        {/* Nickname */}
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.xs }}>
            昵称
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
            value={nickname}
            onChangeText={setNickname}
            placeholder="请输入昵称"
            placeholderTextColor={colors.mutedText}
            maxLength={20}
          />
        </View>

        {/* Account */}
        <View style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.xs }}>
            账号（每月可修改一次）
          </Text>
          <TextInput
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: accountError ? colors.error : colors.border,
              borderRadius: BorderRadius.md,
              paddingHorizontal: Spacing.md,
              fontSize: FontSize.md,
              color: colors.text,
              backgroundColor: colors.inputBackground,
            }}
            value={account}
            onChangeText={(value) => {
              setAccount(value.toUpperCase());
              validateAccount(value.toUpperCase());
            }}
            placeholder="请输入账号"
            placeholderTextColor={colors.mutedText}
            maxLength={20}
            autoCapitalize="characters"
          />
          {accountError ? (
            <Text style={{ color: colors.error, fontSize: FontSize.xs, marginTop: Spacing.xs }}>
              {accountError}
            </Text>
          ) : null}
        </View>

        {/* Signature */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.xs }}>
            个性签名
          </Text>
          <TextInput
            style={{
              height: 80,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: BorderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              fontSize: FontSize.md,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              textAlignVertical: 'top',
            }}
            value={signature}
            onChangeText={setSignature}
            placeholder="写点什么吧..."
            placeholderTextColor={colors.mutedText}
            maxLength={200}
            multiline
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={{
            height: 50,
            backgroundColor: colors.tint,
            borderRadius: BorderRadius.md,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: FontSize.md, fontWeight: '600' }}>
              保存
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
