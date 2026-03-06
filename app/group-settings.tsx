import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { groupApi, conversationApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface GroupMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  user: {
    id: string;
    account: string;
    nickname: string;
    avatar_url: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  announcement: string | null;
  owner_id: string;
  member_count: number;
  owner: {
    id: string;
    nickname: string;
  };
}

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadData();
  }, [id, user?.id]);

  const loadData = async () => {
    if (!id || !user?.id) return;
    
    setLoading(true);
    try {
      // Get conversation to find group_id
      const convResponse = await fetch(
        `https://uxpzbwjqfnwvxjllcadj.supabase.co/rest/v1/conversations?id=eq.${id}&select=group_id`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZm53dnhqbGxjYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg2ODIsImV4cCI6MjA4ODM3NDY4Mn0.n_Q9G1x5fsR7Qo-ZyoUK8DtCP77Yk6bS3sCQGD4gndo',
          },
        }
      ).then(r => r.json());

      const groupId = convResponse[0]?.group_id;
      if (!groupId) throw new Error('群组不存在');

      // Load group info and members in parallel
      const [groupData, membersData, role] = await Promise.all([
        groupApi.getGroup(groupId),
        groupApi.getGroupMembers(groupId),
        groupApi.getUserRole(groupId, user.id),
      ]);

      setGroup(groupData);
      setMembers(membersData);
      setUserRole(role);
      setNewName(groupData.name);
    } catch (error) {
      console.error('Load group error:', error);
      Alert.alert('错误', '加载群信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!group || !newName.trim()) return;

    try {
      await groupApi.updateGroup(group.id, { name: newName.trim() });
      setGroup({ ...group, name: newName.trim() });
      setShowEditName(false);
      Alert.alert('成功', '群名称已更新');
    } catch (error) {
      Alert.alert('失败', '更新失败');
    }
  };

  const handleSetAdmin = async (member: GroupMember, isAdmin: boolean) => {
    if (!group) return;

    try {
      await groupApi.setAdmin(group.id, member.user_id, isAdmin);
      loadData();
      Alert.alert('成功', isAdmin ? '已设为管理员' : '已取消管理员');
    } catch (error) {
      Alert.alert('失败', '操作失败');
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!group) return;

    Alert.alert(
      '移除成员',
      `确定要将 ${member.user.nickname} 移出群聊吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await groupApi.removeMember(group.id, member.user_id);
              loadData();
              Alert.alert('成功', '已移出群聊');
            } catch (error) {
              Alert.alert('失败', '操作失败');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    if (!group) return;

    Alert.alert(
      '退出群聊',
      '确定要退出群聊吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await groupApi.leaveGroup(group.id, user?.id || '');
              router.back();
            } catch (error) {
              Alert.alert('失败', '退出失败');
            }
          },
        },
      ]
    );
  };

  const handleDissolveGroup = () => {
    if (!group) return;

    Alert.alert(
      '解散群聊',
      '确定要解散群聊吗？此操作不可恢复！',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解散',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupApi.dissolveGroup(group.id);
              router.back();
            } catch (error) {
              Alert.alert('失败', '解散失败');
            }
          },
        },
      ]
    );
  };

  const canManage = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Group Info */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: Spacing.lg,
          backgroundColor: colors.card,
        }}
        onPress={() => canManage && setShowEditName(true)}
      >
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
          {group?.avatar_url ? (
            <Image source={{ uri: group.avatar_url }} style={{ width: 60, height: 60, borderRadius: 30 }} />
          ) : (
            <Ionicons name="people" size={28} color="#fff" />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text }}>
            {group?.name}
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginTop: 4 }}>
            群主: {group?.owner?.nickname} · {group?.member_count}人
          </Text>
        </View>
        {canManage && <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />}
      </TouchableOpacity>

      {/* Announcement */}
      {group?.announcement && (
        <View style={{ padding: Spacing.md, backgroundColor: colors.card, marginTop: Spacing.sm }}>
          <Text style={{ fontSize: FontSize.sm, color: colors.mutedText }}>群公告</Text>
          <Text style={{ fontSize: FontSize.md, color: colors.text, marginTop: Spacing.xs }}>
            {group.announcement}
          </Text>
        </View>
      )}

      {/* Members */}
      <View style={{ marginTop: Spacing.md }}>
        <Text style={{ padding: Spacing.md, color: colors.mutedText, fontSize: FontSize.sm }}>
          群成员 ({members.length})
        </Text>
        {members.map((member) => (
          <View
            key={member.id}
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
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.tint,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {member.user.avatar_url ? (
                <Image source={{ uri: member.user.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{member.user.nickname?.charAt(0)}</Text>
              )}
            </View>

            {/* Info */}
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={{ fontSize: FontSize.md, color: colors.text }}>
                {member.user.nickname}
                {member.role === 'owner' && (
                  <Text style={{ color: colors.tint, fontSize: FontSize.xs }}> 群主</Text>
                )}
                {member.role === 'admin' && (
                  <Text style={{ color: colors.warning, fontSize: FontSize.xs }}> 管理员</Text>
                )}
              </Text>
            </View>

            {/* Actions */}
            {isOwner && member.user_id !== user?.id && (
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <TouchableOpacity
                  style={{
                    paddingVertical: Spacing.xs,
                    paddingHorizontal: Spacing.sm,
                    backgroundColor: member.role === 'admin' ? colors.border : colors.tint,
                    borderRadius: BorderRadius.sm,
                  }}
                  onPress={() => handleSetAdmin(member, member.role !== 'admin')}
                >
                  <Text style={{ color: '#fff', fontSize: FontSize.xs }}>
                    {member.role === 'admin' ? '取消管理' : '设为管理'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingVertical: Spacing.xs,
                    paddingHorizontal: Spacing.sm,
                    backgroundColor: colors.error,
                    borderRadius: BorderRadius.sm,
                  }}
                  onPress={() => handleRemoveMember(member)}
                >
                  <Text style={{ color: '#fff', fontSize: FontSize.xs }}>移出</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={{ padding: Spacing.lg }}>
        {isOwner ? (
          <TouchableOpacity
            style={{
              height: 50,
              backgroundColor: colors.error,
              borderRadius: BorderRadius.md,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleDissolveGroup}
          >
            <Text style={{ color: '#fff', fontSize: FontSize.md }}>解散群聊</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              height: 50,
              backgroundColor: colors.card,
              borderRadius: BorderRadius.md,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.error,
            }}
            onPress={handleLeaveGroup}
          >
            <Text style={{ color: colors.error, fontSize: FontSize.md }}>退出群聊</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Edit Name Modal */}
      <Modal visible={showEditName} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '80%', backgroundColor: colors.background, borderRadius: BorderRadius.lg, padding: Spacing.lg }}>
            <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text, marginBottom: Spacing.md }}>
              修改群名称
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
              value={newName}
              onChangeText={setNewName}
              maxLength={20}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.md, gap: Spacing.sm }}>
              <TouchableOpacity onPress={() => setShowEditName(false)}>
                <Text style={{ color: colors.mutedText }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateName}>
                <Text style={{ color: colors.tint, fontWeight: '600' }}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
