import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message, TypingStatus, MessageDraft } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_STORAGE_KEY = 'message_drafts';
const TYPING_TIMEOUT = 3000; // 3秒后自动停止输入状态

export function useMessageStatus(conversationId: string, currentUserId: string) {
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [draft, setDraft] = useState<string>('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 发送输入状态
  const sendTypingStatus = useCallback(async (isTyping: boolean) => {
    try {
      await supabase
        .from('typing_status')
        .upsert({
          conversation_id: conversationId,
          user_id: currentUserId,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'conversation_id,user_id',
        });
    } catch (error) {
      console.error('Failed to send typing status:', error);
    }
  }, [conversationId, currentUserId]);

  // 开始输入
  const startTyping = useCallback(() => {
    sendTypingStatus(true);
    
    // 清除之前的超时
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 设置自动停止
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, TYPING_TIMEOUT);
  }, [sendTypingStatus]);

  // 停止输入
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(false);
  }, [sendTypingStatus]);

  // 监听其他用户的输入状态
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const data = payload.new as TypingStatus;
          if (data.user_id !== currentUserId) {
            setTypingUsers((prev) => {
              const filtered = prev.filter((u) => u.user_id !== data.user_id);
              if (data.is_typing) {
                return [...filtered, data];
              }
              return filtered;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  // 保存草稿
  const saveDraft = useCallback(async (content: string) => {
    try {
      setDraft(content);
      
      // 保存到本地存储
      const drafts = await loadAllDrafts();
      drafts[conversationId] = {
        conversation_id: conversationId,
        content,
        updated_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      
      // 同时保存到服务器
      await supabase
        .from('conversation_participants')
        .update({
          draft: content,
          draft_updated_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [conversationId, currentUserId]);

  // 加载草稿
  const loadDraft = useCallback(async () => {
    try {
      // 先从本地加载
      const drafts = await loadAllDrafts();
      const localDraft = drafts[conversationId]?.content || '';
      
      // 再从服务器加载
      const { data } = await supabase
        .from('conversation_participants')
        .select('draft, draft_updated_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId)
        .single();
      
      // 使用最新的草稿
      if (data?.draft && data.draft_updated_at) {
        const serverTime = new Date(data.draft_updated_at).getTime();
        const localTime = drafts[conversationId]?.updated_at 
          ? new Date(drafts[conversationId].updated_at).getTime() 
          : 0;
        
        if (serverTime > localTime) {
          setDraft(data.draft);
          return data.draft;
        }
      }
      
      setDraft(localDraft);
      return localDraft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return '';
    }
  }, [conversationId, currentUserId]);

  // 清除草稿
  const clearDraft = useCallback(async () => {
    try {
      setDraft('');
      
      // 清除本地
      const drafts = await loadAllDrafts();
      delete drafts[conversationId];
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      
      // 清除服务器
      await supabase
        .from('conversation_participants')
        .update({
          draft: null,
          draft_updated_at: null,
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [conversationId, currentUserId]);

  // 加载所有草稿
  const loadAllDrafts = async (): Promise<Record<string, MessageDraft>> => {
    try {
      const data = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  // 组件挂载时加载草稿
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // 组件卸载时停止输入状态
  useEffect(() => {
    return () => {
      stopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [stopTyping]);

  return {
    typingUsers,
    draft,
    startTyping,
    stopTyping,
    saveDraft,
    loadDraft,
    clearDraft,
  };
}

// 消息撤回 Hook
export function useMessageRecall() {
  const recallMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      // 检查是否在2分钟内
      const { data: message } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', messageId)
        .single();
      
      if (!message) {
        throw new Error('消息不存在');
      }
      
      const messageTime = new Date(message.created_at).getTime();
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;
      
      if (now - messageTime > twoMinutes) {
        throw new Error('超过撤回时间限制（2分钟）');
      }
      
      // 执行撤回
      const { error } = await supabase
        .from('messages')
        .update({
          is_recalled: true,
          recalled_at: new Date().toISOString(),
          content: '消息已撤回',
        })
        .eq('id', messageId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Failed to recall message:', error);
      throw error;
    }
  }, []);
  
  return { recallMessage };
}

// 消息已读状态 Hook
export function useMessageRead(conversationId: string, currentUserId: string) {
  // 标记消息为已读
  const markAsRead = useCallback(async (messageIds: string[]) => {
    try {
      // 更新消息的已读列表
      for (const messageId of messageIds) {
        await supabase.rpc('mark_message_read', {
          message_id: messageId,
          user_id: currentUserId,
        });
      }
      
      // 更新会话参与者的最后阅读时间
      await supabase
        .from('conversation_participants')
        .update({
          last_read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [conversationId, currentUserId]);
  
  // 获取未读消息数
  const getUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('last_read_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId)
        .single();
      
      if (!participant?.last_read_at) {
        // 获取所有消息数
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId);
        return count || 0;
      }
      
      // 获取最后阅读时间之后的消息数
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .gt('created_at', participant.last_read_at);
      
      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }, [conversationId, currentUserId]);
  
  return { markAsRead, getUnreadCount };
}
