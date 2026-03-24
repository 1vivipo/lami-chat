import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { FontSize } from '@/constants/FontSize';
import * as Haptics from 'expo-haptics';
import { useMessageStatus, useMessageSend } from '@/hooks';
import { Message } from '@/types';

interface MessageInputProps {
  conversationId: string;
  currentUserId: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  onMessageSent?: (message: Message) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  currentUserId,
  replyTo,
  onCancelReply,
  onMessageSent,
}) => {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  // 使用消息状态 Hook
  const {
    draft,
    startTyping,
    stopTyping,
    saveDraft,
    clearDraft,
    typingUsers,
  } = useMessageStatus(conversationId, currentUserId);
  
  // 使用消息发送 Hook
  const { sendMessage, getMessageStatus, isOnline, retryMessage } = useMessageSend(
    conversationId,
    currentUserId
  );
  
  // 加载草稿
  useEffect(() => {
    if (draft) {
      setText(draft);
    }
  }, [draft]);
  
  // 输入变化时
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    
    // 保存草稿
    if (newText.trim()) {
      saveDraft(newText);
      startTyping();
    } else {
      clearDraft();
      stopTyping();
    }
  }, [saveDraft, clearDraft, startTyping, stopTyping]);
  
  // 发送消息
  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content) return;
    
    // 触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // 清空输入框
    setText('');
    clearDraft();
    stopTyping();
    
    // 发送消息
    const message = await sendMessage(content, 'text');
    
    if (message) {
      onMessageSent?.(message);
    }
  }, [text, sendMessage, clearDraft, stopTyping, onMessageSent]);
  
  // 显示对方正在输入
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const names = typingUsers.map((u) => u.user_id).slice(0, 2);
    let text = '';
    
    if (names.length === 1) {
      text = '对方正在输入...';
    } else if (names.length === 2) {
      text = '多人正在输入...';
    } else {
      text = `${names.length}人正在输入...`;
    }
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={[styles.typingText, { color: '#999' }]}>{text}</Text>
      </View>
    );
  };
  
  // 渲染引用预览
  const renderReplyPreview = () => {
    if (!replyTo) return null;
    
    return (
      <View style={[styles.replyPreview, { backgroundColor: colors.background }]}>
        <View style={styles.replyContent}>
          <Text style={[styles.replyLabel, { color: '#07C160' }]}>
            回复 {replyTo.sender?.nickname || '用户'}
          </Text>
          <Text style={[styles.replyText, { color: '#666' }]} numberOfLines={1}>
            {replyTo.is_recalled ? '消息已撤回' : replyTo.content}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancelReply} style={styles.cancelReply}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };
  
  // 渲染离线提示
  const renderOfflineIndicator = () => {
    if (isOnline) return null;
    
    return (
      <View style={styles.offlineIndicator}>
        <Ionicons name="cloud-offline" size={14} color="#FF9500" />
        <Text style={styles.offlineText}>离线模式</Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderTypingIndicator()}
      {renderReplyPreview()}
      {renderOfflineIndicator()}
      
      <View style={[styles.inputContainer, { backgroundColor: '#f5f5f5' }]}>
        {/* 表情按钮 */}
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="happy-outline" size={24} color="#666" />
        </TouchableOpacity>
        
        {/* 输入框 */}
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          placeholder="输入消息..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={5000}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            stopTyping();
          }}
        />
        
        {/* 附件按钮 */}
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="add-circle-outline" size={24} color="#666" />
        </TouchableOpacity>
        
        {/* 发送按钮 */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            text.trim() ? { backgroundColor: '#07C160' } : { backgroundColor: '#ccc' },
          ]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 8,
    paddingTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    maxHeight: 100,
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#07C160',
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  replyText: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  cancelReply: {
    padding: 4,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  offlineText: {
    fontSize: FontSize.xs,
    color: '#FF9500',
    marginLeft: 4,
  },
});

export default MessageInput;
