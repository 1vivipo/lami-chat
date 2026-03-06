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
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  joined_at: string;
}

// Message types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'emoji';
  created_at: string;
  sender?: User;
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
