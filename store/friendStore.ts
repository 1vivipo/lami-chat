import { create } from 'zustand';
import { Friendship, FriendRequest } from '@/types';

interface FriendState {
  friends: Friendship[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  setFriends: (friends: Friendship[]) => void;
  addFriend: (friend: Friendship) => void;
  removeFriend: (friendId: string) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  addFriendRequest: (request: FriendRequest) => void;
  removeFriendRequest: (requestId: string) => void;
  setSentRequests: (requests: FriendRequest[]) => void;
  setIsLoading: (value: boolean) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],
  isLoading: false,
  setFriends: (friends) => set({ friends }),
  addFriend: (friend) => set((state) => ({ friends: [...state.friends, friend] })),
  removeFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.friend_id !== friendId),
    })),
  setFriendRequests: (requests) => set({ friendRequests: requests }),
  addFriendRequest: (request) =>
    set((state) => ({ friendRequests: [...state.friendRequests, request] })),
  removeFriendRequest: (requestId) =>
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
    })),
  setSentRequests: (requests) => set({ sentRequests: requests }),
  setIsLoading: (value) => set({ isLoading: value }),
}));
