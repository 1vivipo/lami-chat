import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore, useChatStore } from '@/store';
import { conversationApi, messageApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Conversation } from '@/types';

export default function ChatListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();
  const { conversations, setConversations, isLoading, setIsLoading } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await conversationApi.getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}
      onPress={() => router.push(`/chat/${item.id}`)}
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
          marginRight: Spacing.md,
        }}
      >
        {item.other_user?.avatar_url ? (
          <Image
            source={{ uri: item.other_user.avatar_url }}
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
        ) : (
          <Text style={{ color: '#fff', fontSize: FontSize.lg, fontWeight: 'bold' }}>
            {item.other_user?.nickname?.charAt(0) || '?'}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text
            style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }}
            numberOfLines={1}
          >
            {item.other_user?.nickname || '未知用户'}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: colors.mutedText }}>
            {item.last_message ? formatTime(item.last_message.created_at) : ''}
          </Text>
        </View>
        <Text
          style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: Spacing.xs }}
          numberOfLines={1}
        >
          {item.last_message?.type === 'text'
            ? item.last_message.content
            : item.last_message?.type === 'image'
            ? '[图片]'
            : item.last_message?.type === 'voice'
            ? '[语音]'
            : '暂无消息'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Text style={{ fontSize: FontSize.lg, color: colors.mutedText, marginBottom: Spacing.md }}>
            暂无聊天记录
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText }}>
            添加好友开始聊天吧
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
        />
      )}
    </View>
  );
}
