import { create } from 'zustand';
import type { Message, ChatState } from '../types/chat.types';
import socketService from '../services/socketService';

/**
 * Chat Store
 * Manages chat state using Zustand
 */

interface ChatStore extends ChatState {
  // Actions
  setCurrentConversation: (conversationId: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setHandoffStatus: (status: 'none' | 'requested' | 'assigned' | 'resolved') => void;
  setQueuePosition: (position: number | null) => void;
  setAgentName: (name: string | null) => void;
  clearMessages: () => void;
  reset: () => void;
}

const initialState: ChatState = {
  currentConversationId: null,
  messages: [],
  isTyping: false,
  isConnected: false,
  handoffStatus: 'none',
  queuePosition: null,
  agentName: null,
};

export const useChatStore = create<ChatStore>((set) => ({
  ...initialState,

  setCurrentConversation: (conversationId) =>
    set({ currentConversationId: conversationId }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  setIsTyping: (isTyping) => set({ isTyping }),

  setIsConnected: (isConnected) => set({ isConnected }),

  setHandoffStatus: (status) => set({ handoffStatus: status }),

  setQueuePosition: (position) => set({ queuePosition: position }),

  setAgentName: (name) => set({ agentName: name }),

  clearMessages: () => set({ messages: [] }),

  reset: () => set(initialState),
}));

/**
 * Initialize socket listeners for chat
 */
export const initializeChatSocket = () => {
  const socket = socketService.getSocket();
  if (!socket) return;

  const store = useChatStore.getState();

  // Message sent confirmation
  socket.on('message:sent', (data: { conversationId: string; message: Message }) => {
    console.log('Message sent:', data);
  });

  // AI typing indicator
  socket.on('ai:typing', () => {
    store.setIsTyping(true);
  });

  // AI message received
  socket.on('ai:message', (data: { conversationId: string; message: Message; shouldHandoff: boolean; confidence: number }) => {
    store.setIsTyping(false);
    store.addMessage(data.message);

    // Suggest handoff if AI confidence is low
    if (data.shouldHandoff && data.confidence < 0.5) {
      console.log('AI suggests handoff - low confidence');
    }
  });

  // AI error
  socket.on('ai:error', (data: { conversationId: string; message: string; error: string }) => {
    store.setIsTyping(false);
    console.error('AI error:', data);
  });

  // Handoff queued
  socket.on('handoff:queued', (data: { ticketId: string; position: number; estimatedWaitMinutes: number }) => {
    store.setHandoffStatus('requested');
    store.setQueuePosition(data.position);
  });

  // Agent assigned
  socket.on('handoff:agent-assigned', (data: { ticketId: string; agentName: string; message: string }) => {
    store.setHandoffStatus('assigned');
    store.setAgentName(data.agentName);
    store.setQueuePosition(null);
  });

  // Agent message
  socket.on('agent:message', (data: { ticketId: string; message: Message }) => {
    store.addMessage(data.message);
  });

  // Handoff resolved
  socket.on('handoff:resolved', () => {
    store.setHandoffStatus('resolved');
    store.setAgentName(null);
  });

  // Socket connection status
  socket.on('connect', () => {
    store.setIsConnected(true);
  });

  socket.on('disconnect', () => {
    store.setIsConnected(false);
  });

  // Error handling
  socket.on('error', (data: { message: string }) => {
    console.error('Socket error:', data);
  });
};
