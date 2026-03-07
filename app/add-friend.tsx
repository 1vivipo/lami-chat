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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { userApi, friendApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';

export default function AddFriendScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();

  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('提示', '请输入要搜索的账号');
      return;
    }

    // Validate account format
    if (!APP_CONFIG.account.pattern.test(searchText.trim())) {
      Alert.alert('提示', '账号格式不正确，只能包含字母和数字');
      return;
    }

    if (searchText.trim().length < APP_CONFIG.account.minLength) {
      Alert.alert('提示', `账号至少需要${APP_CONFIG.account.minLength}位`);
      return;
    }

    setSearching(true);
    setSearchResult(null);
    try {
      const result = await userApi.searchByAccount(searchText.trim().toUpperCase());
      if (result) {
        if (result.id === user?.id) {
          setSearchResult({ ...result, isSelf: true });
        } else {
          // Check if already friends
          const isFriend = await friendApi.isFriend(user?.id || '', result.id);
          setSearchResult({ ...result, isFriend });
        }
      } else {
        setSearchResult({ notFound: true });
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('搜索失败', '请稍后重试');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult || searchResult.isSelf || searchResult.notFound || searchResult.isFriend) return;
    if (!user?.id) return;

    setSending(true);
    try {
      await friendApi.sendRequest(user.id, searchResult.id);
      Alert.alert('成功', '好友申请已发送', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        Alert.alert('提示', '已经发送过好友申请了');
      } else {
        Alert.alert('发送失败', error.message || '请稍后重试');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Input */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.sm }}>
            输入对方账号搜索
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TextInput
              style={{
                flex: 1,
                height: 50,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: BorderRadius.md,
                paddingHorizontal: Spacing.md,
                fontSize: FontSize.md,
                color: colors.text,
                backgroundColor: colors.inputBackground,
              }}
              placeholder="请输入账号"
              placeholderTextColor={colors.mutedText}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="characters"
              maxLength={20}
            />
            <TouchableOpacity
              style={{
                width: 50,
                height: 50,
                backgroundColor: colors.tint,
                borderRadius: BorderRadius.md,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="search" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Result */}
        {searchResult && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BorderRadius.lg,
              padding: Spacing.md,
            }}
          >
            {searchResult.notFound ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <Ionicons name="person-outline" size={48} color={colors.mutedText} />
                <Text style={{ color: colors.mutedText, marginTop: Spacing.md }}>
                  未找到该用户
                </Text>
              </View>
            ) : searchResult.isSelf ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <Ionicons name="happy-outline" size={48} color={colors.tint} />
                <Text style={{ color: colors.text, marginTop: Spacing.md }}>
                  这是你自己哦~
                </Text>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: colors.tint,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {searchResult.avatar_url ? (
                      <Image
                        source={{ uri: searchResult.avatar_url }}
                        style={{ width: 60, height: 60, borderRadius: 30 }}
                      />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                        {searchResult.nickname?.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                    <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text }}>
                      {searchResult.nickname}
                    </Text>
                    <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: 2 }}>
                      账号: {searchResult.account}
                    </Text>
                    {searchResult.signature && (
                      <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: 2 }}>
                        {searchResult.signature}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    marginTop: Spacing.md,
                    padding: Spacing.md,
                    backgroundColor: searchResult.isFriend ? colors.border : colors.tint,
                    borderRadius: BorderRadius.md,
                    alignItems: 'center',
                  }}
                  onPress={handleAddFriend}
                  disabled={sending || searchResult.isFriend}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                      {searchResult.isFriend ? '已经是好友了' : '添加好友'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText }}>
            提示：
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: Spacing.xs }}>
            • 账号由6-20位字母和数字组成
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: Spacing.xs }}>
            • 添加好友需要对方确认
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
