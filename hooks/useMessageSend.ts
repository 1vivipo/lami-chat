import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message, MessageSendStatus } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_QUEUE_KEY = 'offline_message_queue';
const MAX_RETRY_COUNT = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 递增重试延迟

interface QueuedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'emoji';
  media_url?: string;
  retry_count: number;
  created_at: string;
}

export function useMessageSend(conversationId: string, currentUserId: string) {
  const [isOnline, setIsOnline] = useState(true);
  const [sendingMessages, setSendingMessages] = useState<Map<string, MessageSendStatus>>(new Map());
  const [offlineQueue, setOfflineQueue] = useState<QueuedMessage[]>([]);

  // 监听网络状态
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      const nowOnline = state.isConnected;
      
      setIsOnline(nowOnline ?? false);
      
      // 网络恢复时，发送离线队列
      if (wasOffline && nowOnline) {
        processOfflineQueue();
      }
    });
    
    return () => unsubscribe();
  }, [isOnline]);

  // 加载离线队列
  useEffect(() => {
    loadOfflineQueue();
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'voice' | 'emoji' = 'text',
    mediaUrl?: string
  ): Promise<Message | null> => {
    const tempId = `temp-${Date.now()}`;
    
    // 创建临时消息
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      type,
      status: 'sending',
      created_at: new Date().toISOString(),
      media_url: mediaUrl,
    };
    
    // 更新发送状态
    setSendingMessages((prev) => new Map(prev).set(tempId, 'sending'));
    
    try {
      if (!isOnline) {
        // 离线状态，加入队列
        await addToOfflineQueue({
          id: tempId,
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          type,
          media_url: mediaUrl,
          retry_count: 0,
          created_at: new Date().toISOString(),
        });
        
        setSendingMessages((prev) => new Map(prev).set(tempId, 'sent'));
        return tempMessage;
      }
      
      // 在线状态，直接发送
      const message = await sendToServer(tempId, content, type, mediaUrl);
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      setSendingMessages((prev) => new Map(prev).set(tempId, 'failed'));
      return null;
    }
  }, [conversationId, currentUserId, isOnline]);

  // 发送到服务器
  const sendToServer = async (
    tempId: string,
    content: string,
    type: 'text' | 'image' | 'voice' | 'emoji',
    mediaUrl?: string,
    retryCount: number = 0
  ): Promise<Message> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          type,
          media_url: mediaUrl,
          status: 'sent',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 更新状态为已发送
      setSendingMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      
      // 更新会话最后更新时间
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return data;
    } catch (error) {
      // 重试逻辑
      if (retryCount < MAX_RETRY_COUNT) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[retryCount]));
        return sendToServer(tempId, content, type, mediaUrl, retryCount + 1);
      }
      
      throw error;
    }
  };

  // 重发失败的消息
  const retryMessage = useCallback(async (messageId: string) => {
    const queue = await loadOfflineQueue();
    const queuedMessage = queue.find((m) => m.id === messageId);
    
    if (queuedMessage) {
      setSendingMessages((prev) => new Map(prev).set(messageId, 'sending'));
      
      try {
        await sendToServer(
          messageId,
          queuedMessage.content,
          queuedMessage.type,
          queuedMessage.media_url
        );
        
        // 从队列中移除
        await removeFromOfflineQueue(messageId);
      } catch (error) {
        setSendingMessages((prev) => new Map(prev).set(messageId, 'failed'));
      }
    }
  }, []);

  // 添加到离线队列
  const addToOfflineQueue = async (message: QueuedMessage) => {
    const queue = await loadOfflineQueue();
    queue.push(message);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    setOfflineQueue(queue);
  };

  // 从离线队列移除
  const removeFromOfflineQueue = async (messageId: string) => {
    const queue = await loadOfflineQueue();
    const filtered = queue.filter((m) => m.id !== messageId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    setOfflineQueue(filtered);
  };

  // 加载离线队列
  const loadOfflineQueue = async (): Promise<QueuedMessage[]> => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = data ? JSON.parse(data) : [];
      setOfflineQueue(queue);
      return queue;
    } catch {
      return [];
    }
  };

  // 处理离线队列
  const processOfflineQueue = async () => {
    const queue = await loadOfflineQueue();
    
    for (const message of queue) {
      try {
        await sendToServer(
          message.id,
          message.content,
          message.type,
          message.media_url
        );
        await removeFromOfflineQueue(message.id);
      } catch (error) {
        console.error('Failed to send queued message:', error);
      }
    }
  };

  // 获取消息发送状态
  const getMessageStatus = useCallback((messageId: string): MessageSendStatus => {
    return sendingMessages.get(messageId) || 'sent';
  }, [sendingMessages]);

  return {
    sendMessage,
    retryMessage,
    getMessageStatus,
    isOnline,
    offlineQueue,
    sendingMessages,
  };
}

// 消息引用回复 Hook
export function useMessageReply() {
  const replyToMessage = useCallback(async (
    conversationId: string,
    content: string,
    replyToId: string,
    senderId: string
  ): Promise<Message | null> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          type: 'text',
          reply_to_id: replyToId,
          status: 'sent',
        })
        .select('*, reply_to:messages(*)')
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to reply to message:', error);
      return null;
    }
  }, []);
  
  return { replyToMessage };
}

// 消息转发 Hook
export function useMessageForward() {
  const forwardMessage = useCallback(async (
    messageIds: string[],
    targetConversationIds: string[],
    senderId: string
  ): Promise<boolean> => {
    try {
      // 获取原消息
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .in('id', messageIds);
      
      if (!messages) return false;
      
      // 创建转发消息
      const forwardedMessages = targetConversationIds.flatMap((conversationId) =>
        messages.map((msg) => ({
          conversation_id: conversationId,
          sender_id: senderId,
          content: msg.content,
          type: msg.type,
          media_url: msg.media_url,
          is_forwarded: true,
          forwarded_from_id: msg.id,
          status: 'sent',
        }))
      );
      
      const { error } = await supabase
        .from('messages')
        .insert(forwardedMessages);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Failed to forward messages:', error);
      return false;
    }
  }, []);
  
  return { forwardMessage };
}

// 消息搜索 Hook
export function useMessageSearch() {
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchMessages = useCallback(async (
    query: string,
    conversationId?: string,
    senderId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Message[]> => {
    setIsSearching(true);
    
    try {
      let queryBuilder = supabase
        .from('messages')
        .select('*, sender:users(id, nickname, avatar_url)')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (conversationId) {
        queryBuilder = queryBuilder.eq('conversation_id', conversationId);
      }
      
      if (senderId) {
        queryBuilder = queryBuilder.eq('sender_id', senderId);
      }
      
      if (startDate) {
        queryBuilder = queryBuilder.gte('created_at', startDate);
      }
      
      if (endDate) {
        queryBuilder = queryBuilder.lte('created_at', endDate);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) throw error;
      
      setSearchResults(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);
  
  return {
    searchMessages,
    searchResults,
    isSearching,
    clearSearch,
  };
}
