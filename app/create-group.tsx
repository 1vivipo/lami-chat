import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { friendApi, groupApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';

interface Friend {
  id: string;
  friend_id: string;
  friend: {
    id: string;
    account: string;
    nickname: string;
    avatar_url: string | null;
  };
}

export default function CreateGroupScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();

  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFriends();
  }, [user?.id]);

  const loadFriends = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await friendApi.getFriends(user.id);
      setFriends(data || []);
    } catch (error) {
      console.error('Load friends error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      }
      if (prev.length >= APP_CONFIG.group.maxMembers - 1) {
        Alert.alert('提示', `群成员最多${APP_CONFIG.group.maxMembers}人`);
        return prev;
      }
      return [...prev, friendId];
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('提示', '请输入群名称');
      return;
    }

    if (selectedFriends.length < APP_CONFIG.group.minMembers - 1) {
      Alert.alert('提示', `群成员至少需要${APP_CONFIG.group.minMembers}人`);
      return;
    }

    if (!user?.id) return;

    setCreating(true);
    try {
      const { conversation } = await groupApi.createGroup(
        user.id,
        groupName.trim(),
        selectedFriends
      );

      Alert.alert('成功', '群聊创建成功', [
        { text: '确定', onPress: () => router.replace(`/chat/${conversation.id}`) },
      ]);
    } catch (error: any) {
      Alert.alert('创建失败', error.message || '请稍后重试');
    } finally {
      setCreating(false);
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.includes(item.friend.id);

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: Spacing.md,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
        onPress={() => toggleFriend(item.friend.id)}
      >
        {/* Checkbox */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isSelected ? colors.tint : colors.border,
            backgroundColor: isSelected ? colors.tint : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: Spacing.md,
          }}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>

        {/* Avatar */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.tint,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {item.friend.avatar_url ? (
            <Image source={{ uri: item.friend.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.friend.nickname?.charAt(0)}</Text>
          )}
        </View>

        {/* Name */}
        <Text style={{ marginLeft: Spacing.md, fontSize: FontSize.md, color: colors.text }}>
          {item.friend.nickname}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Group Name Input */}
      <View style={{ padding: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.xs }}>
          群名称
        </Text>
        <TextInput
          style={{
            height: 44,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.md,
            fontSize: FontSize.md,
            color: colors.text,
            backgroundColor: colors.inputBackground,
          }}
          placeholder="请输入群名称"
          placeholderTextColor={colors.mutedText}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={20}
        />
      </View>

      {/* Selected count */}
      <View style={{ padding: Spacing.md, backgroundColor: colors.card }}>
        <Text style={{ color: colors.mutedText }}>
          已选择 {selectedFriends.length} 人
          {selectedFriends.length < APP_CONFIG.group.minMembers - 1 && (
            <Text style={{ color: colors.warning }}>
              {' '}(还需选择 {APP_CONFIG.group.minMembers - 1 - selectedFriends.length} 人)
            </Text>
          )}
        </Text>
      </View>

      {/* Friends List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : friends.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Ionicons name="people-outline" size={64} color={colors.mutedText} />
          <Text style={{ color: colors.mutedText, marginTop: Spacing.md }}>
            暂无好友，请先添加好友
          </Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          ListHeaderComponent={
            <Text style={{ padding: Spacing.md, color: colors.mutedText, fontSize: FontSize.sm }}>
              选择群成员（{APP_CONFIG.group.minMembers}-{APP_CONFIG.group.maxMembers}人）
            </Text>
          }
        />
      )}

      {/* Create Button */}
      <View style={{ padding: Spacing.md, borderTopWidth: 0.5, borderTopColor: colors.border }}>
        <TouchableOpacity
          style={{
            height: 50,
            backgroundColor: selectedFriends.length >= APP_CONFIG.group.minMembers - 1 ? colors.tint : colors.border,
            borderRadius: BorderRadius.md,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleCreate}
          disabled={creating || selectedFriends.length < APP_CONFIG.group.minMembers - 1}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: FontSize.md, fontWeight: '600' }}>
              创建群聊
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
