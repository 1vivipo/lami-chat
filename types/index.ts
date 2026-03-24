// User types
export interface User {
  id: string;
  account: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  signature: string | null;
  theme: 'system' | 'light' | 'dark';
  created_at: string;
  last_account_change_at: string | null;
}

export interface UserSettings {
  user_id: string;
  notification_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  who_can_add: 'all' | 'friends_only';
}

// Friend types
export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: User;
  receiver?: User;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: User;
}

// Conversation types
export interface Conversation {
  id: string;
  type: 'private' | 'group';
  group_id: string | null;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  other_user?: User;
  // 新增：未读消息数
  unread_count?: number;
  // 新增：草稿
  draft?: string;
  draft_updated_at?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  joined_at: string;
}

// Message types - 增强版
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'emoji' | 'video' | 'file';
  created_at: string;
  sender?: User;
  
  // 新增：消息状态
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  
  // 新增：已读用户列表
  read_by?: string[];
  
  // 新增：撤回相关
  is_recalled?: boolean;
  recalled_at?: string;
  
  // 新增：引用回复
  reply_to_id?: string;
  reply_to?: Message;
  
  // 新增：转发标记
  is_forwarded?: boolean;
  forwarded_from_id?: string;
  
  // 多媒体相关
  media_url?: string;
  thumbnail_url?: string;
  duration?: number; // 语音/视频时长（秒）
  file_name?: string;
  file_size?: number;
}

// 新增：输入状态
export interface TypingStatus {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

// 新增：草稿
export interface MessageDraft {
  conversation_id: string;
  content: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Theme types
export type ThemeMode = 'system' | 'light' | 'dark';

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  'chat/[id]': { id: string };
  'profile': undefined;
  'settings': undefined;
  'add-friend': undefined;
  'friend-requests': undefined;
  'edit-profile': undefined;
  'theme-settings': undefined;
};

// Notification types
export interface NotificationData {
  type: 'message' | 'friend_request';
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  message?: string;
}

// 新增：消息发送状态
export type MessageSendStatus = 'idle' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// 新增：聊天设置
export interface ChatSettings {
  show_read_receipt: boolean; // 是否显示已读回执
  show_typing_status: boolean; // 是否显示输入状态
  save_draft: boolean; // 是否保存草稿
}
