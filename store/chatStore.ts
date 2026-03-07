import { create } from 'zustand';
import { Conversation, Message } from '@/types';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  prependMessages: (messages: Message[]) => void;
  setIsLoading: (value: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => 
    set((state) => ({ 
      conversations: [conversation, ...state.conversations] 
    })),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  prependMessages: (messages) =>
    set((state) => ({ messages: [...messages, ...state.messages] })),
  setIsLoading: (value) => set({ isLoading: value }),
  clearMessages: () => set({ messages: [] }),
}));
