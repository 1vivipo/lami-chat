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
import { friendApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { FriendRequest } from '@/types';

export default function FriendRequestsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();

  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await friendApi.getReceivedRequests(user.id);
      setRequests(data || []);
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: FriendRequest) => {
    if (!user?.id) return;
    
    setProcessing(request.id);
    try {
      await friendApi.acceptRequest(request.id, request.sender_id, user.id);
      setRequests(requests.filter(r => r.id !== request.id));
      Alert.alert('成功', '已添加好友');
    } catch (error: any) {
      Alert.alert('失败', error.message || '请稍后重试');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: FriendRequest) => {
    setProcessing(request.id);
    try {
      await friendApi.rejectRequest(request.id);
      setRequests(requests.filter(r => r.id !== request.id));
    } catch (error: any) {
      Alert.alert('失败', error.message || '请稍后重试');
    } finally {
      setProcessing(null);
    }
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}
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
        {item.sender?.avatar_url ? (
          <Image source={{ uri: item.sender.avatar_url }} style={{ width: 50, height: 50, borderRadius: 25 }} />
        ) : (
          <Text style={{ color: '#fff', fontSize: FontSize.lg, fontWeight: 'bold' }}>
            {item.sender?.nickname?.charAt(0) || '?'}
          </Text>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }}>
          {item.sender?.nickname || '未知用户'}
        </Text>
        <Text style={{ fontSize: FontSize.sm, color: colors.mutedText }}>
          账号: {item.sender?.account}
        </Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <TouchableOpacity
          style={{
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            backgroundColor: colors.tint,
            borderRadius: BorderRadius.md,
          }}
          onPress={() => handleAccept(item)}
          disabled={processing === item.id}
        >
          {processing === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>接受</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            backgroundColor: colors.border,
            borderRadius: BorderRadius.md,
          }}
          onPress={() => handleReject(item)}
          disabled={processing === item.id}
        >
          <Text style={{ color: colors.text }}>拒绝</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : requests.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Ionicons name="mail-open-outline" size={64} color={colors.mutedText} />
          <Text style={{ fontSize: FontSize.lg, color: colors.mutedText, marginTop: Spacing.md }}>
            暂无好友申请
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
        />
      )}
    </View>
  );
}
