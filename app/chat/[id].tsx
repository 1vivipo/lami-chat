import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useChatStore } from '@/store';
import { messageApi, conversationApi, groupApi } from '@/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Message } from '@/types';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, currentConversation, setCurrentConversation } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [isGroup, setIsGroup] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatData();
    
    // Subscribe to new messages
    const subscription = messageApi.subscribeToMessages(id, (message) => {
      if (message.sender_id !== user?.id) {
        // Fetch sender info for the message
        fetchSenderInfo(message);
      }
    });

    return () => {
      subscription.unsubscribe();
      setCurrentConversation(null);
    };
  }, [id]);

  const fetchSenderInfo = async (message: any) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, account, nickname, avatar_url')
        .eq('id', message.sender_id)
        .single();
      
      const fullMessage = {
        ...message,
        sender: data,
      };
      addMessage(fullMessage as Message);
      scrollToBottom();
    } catch (error) {
      console.error('Fetch sender error:', error);
    }
  };

  const loadChatData = async () => {
    try {
      // Get conversation info
      const convResponse = await fetch(
        `https://uxpzbwjqfnwvxjllcadj.supabase.co/rest/v1/conversations?id=eq.${id}&select=type,group_id`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZsIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpb3MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZmb53dnhqbGxjYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg2ODgyLCJleHAiOjIwODgzNzQ2ODJ9.n_Q9G1x5fsR7Qo-ZyoUK8DtCP77Yk6bS3sCQGD4gndo',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZm53dnhqbGxjYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg2ODgyLCJleHAiOjIwODgzNzQ2ODJ9.n_Q9G1x5fsR7Qo-ZyoUK8DtCP77Yk6bS3sCQGD4gndo`,
          },
        }
      ).then(r => r.json());

      const convType = convResponse[0]?.type;
      const groupId = convResponse[0]?.group_id;

      setIsGroup(convType === 'group');

      if (convType === 'group' && groupId) {
        // Load group info
        const groupData = await groupApi.getGroup(groupId);
        setGroupInfo(groupData);
      } else {
        // Get other participant for private chat
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id, users(id, account, nickname, avatar_url)')
          .eq('conversation_id', id)
          .neq('user_id', user?.id)
          .single();
        
        if (participants?.users) {
          setOtherUser(participants.users);
        }
      }

      // Load messages
      const data = await messageApi.getMessages(id);
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Load chat data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user?.id || sending) return;

    setSending(true);
    try {
      const message = await messageApi.sendMessage(id, user.id, inputText.trim());
      addMessage(message);
      setInputText('');
      scrollToBottom();
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('发送失败', '消息发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSelf = item.sender_id === user?.id;

    return (
      <View
        style={{
          flexDirection: isSelf ? 'row-reverse' : 'row',
          marginBottom: Spacing.sm,
          paddingHorizontal: Spacing.md,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isSelf ? colors.tint : colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: Spacing.sm,
          }}
        >
          {isSelf ? (
            user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{user?.nickname?.charAt(0)}</Text>
            )
          ) : item.sender?.avatar_url ? (
            <Image source={{ uri: item.sender.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <Text style={{ color: colors.text, fontWeight: 'bold' }}>{item.sender?.nickname?.charAt(0) || '?'}</Text>
          )}
        </View>

        {/* Bubble */}
        <View
          style={{
            maxWidth: '70%',
            backgroundColor: isSelf ? colors.bubbleSelf : colors.bubbleOther,
            padding: Spacing.md,
            borderRadius: BorderRadius.lg,
            borderBottomLeftRadius: isSelf ? BorderRadius.lg : 4,
            borderBottomRightRadius: isSelf ? 4 : BorderRadius.lg,
          }}
        >
          {/* Show sender name in group chat */}
          {isGroup && !isSelf && item.sender && (
            <Text style={{ color: colors.tint, fontSize: FontSize.xs, marginBottom: 4 }}>
              {item.sender.nickname}
            </Text>
          )}
          <Text style={{ color: isSelf ? colors.bubbleTextSelf : colors.bubbleTextOther, fontSize: FontSize.md }}>
            {item.content}
          </Text>
          <Text
            style={{
              color: isSelf ? 'rgba(255,255,255,0.7)' : colors.mutedText,
              fontSize: FontSize.xs,
              marginTop: 4,
              textAlign: isSelf ? 'right' : 'left',
            }}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: '600', color: colors.text }}>
          {isGroup ? groupInfo?.name || otherUser?.nickname || '聊天'}
        </Text>
        <TouchableOpacity onPress={() => isGroup && router.push(`/group-settings?id=${id}`)}>
          <Ionicons name={isGroup ? 'settings-outline' : 'ellipsis-vertical'} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: Spacing.md }}
        onContentSizeChange={scrollToBottom}
      />

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: Spacing.sm,
          backgroundColor: colors.background,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
        }}
      >
        <TouchableOpacity style={{ padding: Spacing.sm }}>
          <Ionicons name="add-circle-outline" size={28} color={colors.tint} />
        </TouchableOpacity>
        <TextInput
          style={{
            flex: 1,
            height: 40,
            backgroundColor: colors.inputBackground,
            borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.md,
            fontSize: FontSize.md,
            color: colors.text,
            marginHorizontal: Spacing.sm,
          }}
          placeholder="输入消息..."
          placeholderTextColor={colors.mutedText}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={{ padding: Spacing.sm }} onPress={() => {}}>
          <Ionicons name="mic-outline" size={28} color={colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: colors.tint,
            borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            marginLeft: Spacing.xs,
          }}
          onPress={sendMessage}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>发送</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
