import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore } from '@/store';
import { authApi, userApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { themeMode, setThemeMode } = useThemeStore();

  const handleLogout = async () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await authApi.signOut();
            logout();
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'person-circle-outline',
      title: '编辑资料',
      onPress: () => router.push('/edit-profile'),
    },
    {
      icon: 'people-outline',
      title: '好友列表',
      onPress: () => router.push('/friends'),
    },
    {
      icon: 'person-add-outline',
      title: '添加好友',
      onPress: () => router.push('/add-friend'),
    },
    {
      icon: 'mail-outline',
      title: '好友申请',
      onPress: () => router.push('/friend-requests'),
      badge: 0, // TODO: Add unread count
    },
  ];

  const settingItems = [
    {
      icon: 'notifications-outline',
      title: '消息通知',
      onPress: () => {},
    },
    {
      icon: 'color-palette-outline',
      title: '主题设置',
      onPress: () => router.push('/settings'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: '隐私设置',
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline',
      title: '关于我们',
      onPress: () => Alert.alert('Lami Chat', '版本 1.0.0\n简洁、纯粹的聊天体验'),
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Profile Header */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          padding: Spacing.lg,
          backgroundColor: colors.background,
          alignItems: 'center',
        }}
        onPress={() => router.push('/edit-profile')}
      >
        {/* Avatar */}
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: colors.tint,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={{ width: 70, height: 70, borderRadius: 35 }} />
          ) : (
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
              {user?.nickname?.charAt(0) || 'U'}
            </Text>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={{ fontSize: FontSize.xl, fontWeight: 'bold', color: colors.text }}>
            {user?.nickname || '用户'}
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: Spacing.xs }}>
            账号: {user?.account || '未设置'}
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: 2 }}>
            {user?.signature || '这个人很懒，什么都没写~'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
      </TouchableOpacity>

      {/* Menu Items */}
      <View style={{ marginTop: Spacing.md, backgroundColor: colors.background }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: Spacing.md,
              backgroundColor: colors.card,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
            }}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={22} color={colors.tint} />
            <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: FontSize.md, color: colors.text }}>
              {item.title}
            </Text>
            {item.badge > 0 && (
              <View
                style={{
                  backgroundColor: colors.error,
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginRight: Spacing.sm,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>{item.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <View style={{ marginTop: Spacing.md, backgroundColor: colors.background }}>
        {settingItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: Spacing.md,
              backgroundColor: colors.card,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
            }}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={22} color={colors.tint} />
            <Text style={{ flex: 1, marginLeft: Spacing.md, fontSize: FontSize.md, color: colors.text }}>
              {item.title}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={{
          margin: Spacing.lg,
          padding: Spacing.md,
          backgroundColor: colors.card,
          borderRadius: BorderRadius.md,
          alignItems: 'center',
        }}
        onPress={handleLogout}
      >
        <Text style={{ color: colors.error, fontSize: FontSize.md }}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
