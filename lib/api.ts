import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/constants/config';

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth API
export const authApi = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get current session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Send OTP for email verification
  sendOtp: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    if (error) throw error;
    return data;
  },

  // Verify OTP
  verifyOtp: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },
};

// User API
export const userApi = {
  // Create user profile after signup
  createProfile: async (userId: string, email: string, account: string, nickname: string) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        account,
        nickname,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get user profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<{
    nickname: string;
    avatar_url: string;
    signature: string;
    theme: string;
  }>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update account (with cooldown check)
  updateAccount: async (userId: string, newAccount: string) => {
    // First check if user can change account
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('last_account_change_at')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;

    // Check cooldown (30 days)
    if (user.last_account_change_at) {
      const lastChange = new Date(user.last_account_change_at);
      const now = new Date();
      const daysSinceLastChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastChange < 30) {
        throw new Error(`账号修改冷却中，还需等待 ${30 - daysSinceLastChange} 天`);
      }
    }

    // Check if account already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('account', newAccount)
      .single();

    if (existingUser) {
      throw new Error('该账号已被占用');
    }

    // Update account
    const { data, error } = await supabase
      .from('users')
      .update({
        account: newAccount,
        last_account_change_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Search user by account
  searchByAccount: async (account: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, account, nickname, avatar_url, signature')
      .eq('account', account)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Get user settings
  getSettings: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Update user settings
  updateSettings: async (userId: string, settings: Partial<{
    notification_enabled: boolean;
    sound_enabled: boolean;
    vibration_enabled: boolean;
    who_can_add: string;
  }>) => {
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Friend API
export const friendApi = {
  // Send friend request
  sendRequest: async (senderId: string, receiverId: string) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get received friend requests
  getReceivedRequests: async (userId: string) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:users!friend_requests_sender_id_fkey(id, account, nickname, avatar_url)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get sent friend requests
  getSentRequests: async (userId: string) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        receiver:users!friend_requests_receiver_id_fkey(id, account, nickname, avatar_url)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Accept friend request
  acceptRequest: async (requestId: string, senderId: string, receiverId: string) => {
    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (updateError) throw updateError;

    // Create friendship (both directions)
    const { error: friendError } = await supabase
      .from('friendships')
      .insert([
        { user_id: senderId, friend_id: receiverId },
        { user_id: receiverId, friend_id: senderId },
      ]);
    if (friendError) throw friendError;
  },

  // Reject friend request
  rejectRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    if (error) throw error;
  },

  // Get friends list
  getFriends: async (userId: string) => {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend:users!friendships_friend_id_fkey(id, account, nickname, avatar_url, signature)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Delete friend
  deleteFriend: async (userId: string, friendId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    if (error) throw error;
  },

  // Check if already friends
  isFriend: async (userId: string, otherId: string) => {
    const { data, error } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', otherId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return true;
  },
};

// Conversation API
export const conversationApi = {
  // Get all conversations for user
  getConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations(
          id,
          type,
          group_id,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;

    // For each conversation, get the other participant/group info and last message
    const conversations = await Promise.all(
      data.map(async (cp: any) => {
        const conv = cp.conversations;
        
        // Get last message with sender info
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users(id, account, nickname, avatar_url)
          `)
          .eq('conversation_id', cp.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Handle group conversation
        if (conv.type === 'group' && conv.group_id) {
          const { data: group } = await supabase
            .from('groups')
            .select('id, name, avatar_url, member_count')
            .eq('id', conv.group_id)
            .single();

          return {
            id: conv.id,
            type: conv.type,
            group_id: conv.group_id,
            group_name: group?.name,
            group_avatar: group?.avatar_url,
            member_count: group?.member_count,
            updated_at: conv.updated_at,
            last_message: lastMessage,
          };
        }

        // Handle private conversation
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            users(id, account, nickname, avatar_url)
          `)
          .eq('conversation_id', cp.conversation_id)
          .neq('user_id', userId)
          .single();

        return {
          id: conv.id,
          type: conv.type,
          updated_at: conv.updated_at,
          other_user: participants?.users,
          last_message: lastMessage,
        };
      })
    );

    // Sort by updated_at
    return conversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  // Get or create conversation with another user
  getOrCreateConversation: async (userId: string, otherUserId: string) => {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (existing && existing.length > 0) {
      for (const cp of existing) {
        const { data: other } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', cp.conversation_id)
          .eq('user_id', otherUserId)
          .single();
        
        if (other) {
          return cp.conversation_id;
        }
      }
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({ type: 'private' })
      .select()
      .single();
    
    if (convError) throw convError;

    // Add participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: userId },
        { conversation_id: conversation.id, user_id: otherUserId },
      ]);
    
    if (partError) throw partError;

    return conversation.id;
  },
};

// Message API
export const messageApi = {
  // Get messages for conversation
  getMessages: async (conversationId: string, limit = 50, before?: string) => {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users(id, account, nickname, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data?.reverse() || [];
  },

  // Send message
  sendMessage: async (conversationId: string, senderId: string, content: string, type = 'text') => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,
      })
      .select(`
        *,
        sender:users(id, account, nickname, avatar_url)
      `)
      .single();
    
    if (error) throw error;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },

  // Subscribe to new messages
  subscribeToMessages: (conversationId: string, callback: (message: any) => void) => {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },
};

// Storage API
export const storageApi = {
  // Upload avatar
  uploadAvatar: async (userId: string, file: Blob | File, fileName: string) => {
    const filePath = `${userId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  },

  // Upload chat image
  uploadChatImage: async (userId: string, file: Blob | File, fileName: string) => {
    const filePath = `${userId}/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(filePath, file);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  },

  // Upload voice message
  uploadVoice: async (userId: string, file: Blob, fileName: string) => {
    const filePath = `${userId}/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from('chat-voices')
      .upload(filePath, file);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('chat-voices')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  },
};

// Group API
export const groupApi = {
  // Create group
  createGroup: async (ownerId: string, name: string, memberIds: string[]) => {
    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        owner_id: ownerId,
        member_count: memberIds.length + 1,
      })
      .select()
      .single();
    
    if (groupError) throw groupError;

    // Add owner as member
    await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: ownerId,
        role: 'owner',
      });

    // Add other members
    if (memberIds.length > 0) {
      await supabase
        .from('group_members')
        .insert(
          memberIds.map(id => ({
            group_id: group.id,
            user_id: id,
            role: 'member',
          }))
        );
    }

    // Create conversation for group
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'group',
        group_id: group.id,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add all members as conversation participants
    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: ownerId },
        ...memberIds.map(id => ({ conversation_id: conversation.id, user_id: id })),
      ]);

    return { group, conversation };
  },

  // Get group info
  getGroup: async (groupId: string) => {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        owner:users!groups_owner_id_fkey(id, account, nickname, avatar_url)
      `)
      .eq('id', groupId)
      .single();
    if (error) throw error;
    return data;
  },

  // Get group members
  getGroupMembers: async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:users(id, account, nickname, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Update group info
  updateGroup: async (groupId: string, updates: Partial<{
    name: string;
    avatar_url: string;
    announcement: string;
  }>) => {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Add member to group
  addMember: async (groupId: string, userId: string) => {
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      });
    if (error) throw error;

    // Update member count
    await supabase.rpc('increment_member_count', { group_id: groupId });
  },

  // Remove member from group
  removeMember: async (groupId: string, userId: string) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;

    // Update member count
    await supabase.rpc('decrement_member_count', { group_id: groupId });
  },

  // Set admin
  setAdmin: async (groupId: string, userId: string, isAdmin: boolean) => {
    const { error } = await supabase
      .from('group_members')
      .update({ role: isAdmin ? 'admin' : 'member' })
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // Transfer owner
  transferOwner: async (groupId: string, newOwnerId: string, currentOwnerId: string) => {
    // Update new owner
    await supabase
      .from('group_members')
      .update({ role: 'owner' })
      .eq('group_id', groupId)
      .eq('user_id', newOwnerId);

    // Update old owner to admin
    await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', currentOwnerId);

    // Update group owner
    await supabase
      .from('groups')
      .update({ owner_id: newOwnerId })
      .eq('id', groupId);
  },

  // Leave group
  leaveGroup: async (groupId: string, userId: string) => {
    await groupApi.removeMember(groupId, userId);
  },

  // Dissolve group
  dissolveGroup: async (groupId: string) => {
    // Delete all members
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId);

    // Delete group
    await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
  },

  // Get user's role in group
  getUserRole: async (groupId: string, userId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data.role;
  },
};

// Network utility for China mainland adaptation
export const networkApi = {
  // Check connection status
  checkConnection: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // Retry wrapper
  retry: async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw lastError;
  },
};

// Generate unique account
export const generateUniqueAccount = async (): Promise<string> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let account = '';
  for (let i = 0; i < 6; i++) {
    account += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Check if exists
  const existing = await userApi.searchByAccount(account);
  if (existing) {
    return generateUniqueAccount(); // Retry
  }
  
  return account;
};
