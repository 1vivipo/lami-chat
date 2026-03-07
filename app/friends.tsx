import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { friendApi, conversationApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Friendship } from '@/types';

export default function FriendsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleStartChat = async (friendId: string) => {
    if (!user?.id) return;
    
    try {
      const conversationId = await conversationApi.getOrCreateConversation(user.id, friendId);
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Start chat error:', error);
      Alert.alert('错误', '无法创建对话');
    }
  };

  const handleDeleteFriend = (friend: Friendship) => {
    Alert.alert(
      '删除好友',
      `确定要删除好友 ${friend.friend?.nickname} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendApi.deleteFriend(user?.id || '', friend.friend_id);
              setFriends(friends.filter(f => f.id !== friend.id));
              Alert.alert('成功', '已删除好友');
            } catch (error) {
              Alert.alert('失败', '删除好友失败');
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friendship }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}
      onPress={() => handleStartChat(item.friend_id)}
      onLongPress={() => handleDeleteFriend(item)}
    >
      {/* Avatar */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.tint,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {item.friend?.avatar_url ? (
          <Image source={{ uri: item.friend.avatar_url }} style={{ width: 50, height: 50, borderRadius: 25 }} />
        ) : (
          <Text style={{ color: '#fff', fontSize: FontSize.lg, fontWeight: 'bold' }}>
            {item.friend?.nickname?.charAt(0) || '?'}
          </Text>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }}>
          {item.friend?.nickname || '未知用户'}
        </Text>
        <Text style={{ fontSize: FontSize.sm, color: colors.mutedText }}>
          {item.friend?.signature || '这个人很懒，什么都没写~'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : friends.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Ionicons name="people-outline" size={64} color={colors.mutedText} />
          <Text style={{ fontSize: FontSize.lg, color: colors.mutedText, marginTop: Spacing.md }}>
            暂无好友
          </Text>
          <TouchableOpacity
            style={{
              marginTop: Spacing.md,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
              backgroundColor: colors.tint,
              borderRadius: BorderRadius.md,
            }}
            onPress={() => router.push('/add-friend')}
          >
            <Text style={{ color: '#fff' }}>添加好友</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
        />
      )}
    </View>
  );
}
