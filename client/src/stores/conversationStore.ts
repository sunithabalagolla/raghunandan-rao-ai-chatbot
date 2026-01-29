import { create } from 'zustand';
import type { Conversation } from '../types/chat.types';
import { conversationAPI } from '../services/chatService';

/**
 * Conversation Store
 * Manages conversation list state
 */

interface ConversationStore {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await conversationAPI.getConversations('active');
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Failed to fetch conversations:', error);
    }
  },

  createConversation: async (title?: string) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await conversationAPI.createConversation(title);
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        isLoading: false,
      }));
      return conversation;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  deleteConversation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await conversationAPI.deleteConversation(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  },

  updateConversationTitle: async (id: string, title: string) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await conversationAPI.updateTitle(id, title);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === id ? updated : c
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Failed to update conversation title:', error);
      throw error;
    }
  },

  archiveConversation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await conversationAPI.archiveConversation(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Failed to archive conversation:', error);
      throw error;
    }
  },

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c._id !== id),
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === id ? { ...c, ...updates } : c
      ),
    })),
}));
