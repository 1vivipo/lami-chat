import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Message, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { FontSize } from '@/constants/FontSize';
import * as Haptics from 'expo-haptics';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTime?: boolean;
  onLongPress?: () => void;
  onReplyPress?: () => void;
  onRecallPress?: () => void;
  onForwardPress?: () => void;
  onCopyPress?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTime = true,
  onLongPress,
  onReplyPress,
  onRecallPress,
  onForwardPress,
  onCopyPress,
}) => {
  const { colors } = useTheme();
  const isRecalled = message.is_recalled;
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';
  
  // 触觉反馈
  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };
  
  // 渲染消息状态
  const renderStatus = () => {
    if (!isOwn) return null;
    
    if (isFailed) {
      return (
        <TouchableOpacity onPress={onForwardPress} style={styles.statusContainer}>
          <Ionicons name="alert-circle" size={14} color="#FF3B30" />
          <Text style={styles.failedText}>发送失败</Text>
        </TouchableOpacity>
      );
    }
    
    if (isSending) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="time-outline" size={14} color="#999" />
        </View>
      );
    }
    
    if (message.status === 'delivered') {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark" size={14} color="#999" />
        </View>
      );
    }
    
    if (message.status === 'read') {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-done" size={14} color="#07C160" />
        </View>
      );
    }
    
    return null;
  };
  
  // 渲染引用内容
  const renderReply = () => {
    if (!message.reply_to) return null;
    
    const replyMessage = message.reply_to;
    const isReplyRecalled = replyMessage.is_recalled;
    
    return (
      <TouchableOpacity 
        style={[styles.replyContainer, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }]}
        onPress={onReplyPress}
      >
        <View style={styles.replyLine} />
        <View style={styles.replyContent}>
          <Text style={[styles.replySender, { color: isOwn ? '#fff' : '#07C160' }]}>
            {replyMessage.sender?.nickname || '用户'}
          </Text>
          <Text style={[styles.replyText, { color: isOwn ? 'rgba(255,255,255,0.8)' : '#666' }]} numberOfLines={2}>
            {isReplyRecalled ? '消息已撤回' : replyMessage.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // 渲染消息内容
  const renderContent = () => {
    if (isRecalled) {
      return (
        <View style={styles.recalledContainer}>
          <Ionicons name="return-down-back" size={14} color="#999" />
          <Text style={styles.recalledText}>
            {isOwn ? '你撤回了一条消息' : '对方撤回了一条消息'}
          </Text>
        </View>
      );
    }
    
    switch (message.type) {
      case 'image':
        return (
          <Image
            source={{ uri: message.media_url || message.content }}
            style={styles.imageMessage}
            resizeMode="cover"
          />
        );
      
      case 'voice':
        return (
          <View style={styles.voiceMessage}>
            <Ionicons name="mic" size={20} color={isOwn ? '#fff' : '#333'} />
            <Text style={[styles.voiceDuration, { color: isOwn ? '#fff' : '#333' }]}>
              {message.duration ? `${Math.round(message.duration)}''` : '0"'}
            </Text>
          </View>
        );
      
      case 'emoji':
        return (
          <Text style={styles.emojiMessage}>
            {message.content}
          </Text>
        );
      
      default:
        return (
          <Text style={[
            styles.textMessage,
            { color: isOwn ? '#fff' : colors.text }
          ]}>
            {message.content}
          </Text>
        );
    }
  };
  
  // 渲染转发标记
  const renderForwardTag = () => {
    if (!message.is_forwarded) return null;
    
    return (
      <View style={styles.forwardTag}>
        <Ionicons name="arrow-redo" size={10} color="#999" />
        <Text style={styles.forwardText}>转发</Text>
      </View>
    );
  };
  
  // 渲染时间
  const renderTime = () => {
    if (!showTime) return null;
    
    const time = new Date(message.created_at);
    const now = new Date();
    const isToday = time.toDateString() === now.toDateString();
    
    let timeStr = '';
    if (isToday) {
      timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      timeStr = time.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    
    return (
      <Text style={[styles.timeText, { color: '#999' }]}>
        {timeStr}
      </Text>
    );
  };
  
  // 渲染头像
  const renderAvatar = () => {
    if (!showAvatar || !message.sender) return null;
    
    return (
      <Image
        source={{ uri: message.sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender.id}` }}
        style={styles.avatar}
      />
    );
  };
  
  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {!isOwn && renderAvatar()}
      
      <View style={[styles.messageWrapper, isOwn && styles.ownMessageWrapper]}>
        {renderForwardTag()}
        
        <TouchableOpacity
          style={[
            styles.bubble,
            isOwn 
              ? [styles.ownBubble, { backgroundColor: '#07C160' }]
              : [styles.otherBubble, { backgroundColor: '#fff' }],
            isRecalled && styles.recalledBubble,
          ]}
          onLongPress={handleLongPress}
          activeOpacity={0.8}
        >
          {renderReply()}
          {renderContent()}
        </TouchableOpacity>
        
        <View style={styles.footer}>
          {isOwn && renderStatus()}
          {renderTime()}
        </View>
      </View>
      
      {isOwn && renderAvatar()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  messageWrapper: {
    maxWidth: '70%',
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  ownBubble: {
    borderTopRightRadius: 4,
  },
  otherBubble: {
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recalledBubble: {
    backgroundColor: 'transparent',
  },
  textMessage: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  voiceDuration: {
    marginLeft: 8,
    fontSize: FontSize.sm,
  },
  emojiMessage: {
    fontSize: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  failedText: {
    fontSize: FontSize.xs,
    color: '#FF3B30',
    marginLeft: 2,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#07C160',
  },
  replyLine: {
    width: 2,
    backgroundColor: '#07C160',
    borderRadius: 1,
  },
  replyContent: {
    flex: 1,
    marginLeft: 8,
  },
  replySender: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  replyText: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  recalledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recalledText: {
    fontSize: FontSize.sm,
    color: '#999',
    marginLeft: 4,
  },
  forwardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  forwardText: {
    fontSize: FontSize.xs,
    color: '#999',
    marginLeft: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: FontSize.xs,
  },
});

export default ChatBubble;
