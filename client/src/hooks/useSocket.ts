import { useEffect, useState, useCallback, useRef } from 'react';
import socketService, { type ConnectionState } from '../services/socketService';
import { useAuth } from './useAuth';

/**
 * useSocket Hook
 * React hook for Socket.io connection management
 * Implements Requirements 0.1, 0.3
 */

export interface UseSocketReturn {
  // Connection state
  isConnected: boolean;
  connectionState: ConnectionState;
  
  // Connection methods
  connect: () => void;
  disconnect: () => void;
  
  // Chat methods
  connectToChat: (sessionId: string, language?: 'en' | 'te' | 'hi') => void;
  sendMessage: (sessionId: string, message: string, language?: string) => void;
  sendTyping: (isTyping: boolean) => void;
  requestAgent: (sessionId: string, reason: string) => void;
  disconnectFromChat: (sessionId: string) => void;
  
  // Event listeners
  onChatResponse: (callback: (data: any) => void) => () => void;
  onTyping: (callback: (data: any) => void) => () => void;
  onStream: (callback: (data: any) => void) => () => void;
  onStatusUpdate: (callback: (data: any) => void) => () => void;
  onNotification: (callback: (data: any) => void) => () => void;
  onAgentJoined: (callback: (data: any) => void) => () => void;
  onHandoffQueued: (callback: (data: any) => void) => () => void;
  onHandoffResolved: (callback: (data: any) => void) => () => void;
  onChatError: (callback: (data: any) => void) => () => void;
  onRateLimitExceeded: (callback: (data: any) => void) => () => void;
}

/**
 * useSocket Hook
 * Manages Socket.io connection lifecycle and provides methods for real-time communication
 */
export function useSocket(): UseSocketReturn {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Generate anonymous user ID if not authenticated - MUST be stable across re-renders
  const userIdRef = useRef<string | null>(null);
  if (!userIdRef.current) {
    userIdRef.current = user?.id || `anonymous_${Date.now()}`;
  }
  const userId = userIdRef.current;

  /**
   * Connect to Socket.io server
   * Requirement 0.1
   */
  const connect = useCallback(() => {
    try {
      socketService.connect();
      setIsConnected(socketService.isConnected());
    } catch (error: any) {
      console.error('Failed to connect socket:', error.message);
    }
  }, []);

  /**
   * Disconnect from Socket.io server
   * Requirement 0.10
   */
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  /**
   * Connect to chat session
   * Requirement 0.1, 0.9
   */
  const connectToChat = useCallback((sessionId: string, language: 'en' | 'te' | 'hi' = 'en') => {
    socketService.connectToChat(userId, sessionId, language);
  }, [userId]);

  /**
   * Send chat message
   * Requirement 0.4
   */
  const sendMessage = useCallback((sessionId: string, message: string, language?: string) => {
    socketService.sendMessage(userId, sessionId, message, language);
  }, [userId]);

  /**
   * Send typing indicator
   * Requirement 0.6
   */
  const sendTyping = useCallback((isTyping: boolean) => {
    socketService.sendTyping(isTyping);
  }, []);

  /**
   * Request human agent
   * Requirement 44.2
   */
  const requestAgent = useCallback((sessionId: string, reason: string) => {
    socketService.requestAgent(userId, sessionId, reason);
  }, [userId]);

  /**
   * Disconnect from chat
   * Requirement 0.10
   */
  const disconnectFromChat = useCallback((sessionId: string) => {
    socketService.disconnectFromChat(userId, sessionId);
  }, [userId]);

  /**
   * Event listener wrappers
   */
  const onChatResponse = useCallback((callback: (data: any) => void) => {
    return socketService.onChatResponse(callback);
  }, []);

  const onTyping = useCallback((callback: (data: any) => void) => {
    return socketService.onTyping(callback);
  }, []);

  const onStream = useCallback((callback: (data: any) => void) => {
    return socketService.onStream(callback);
  }, []);

  const onStatusUpdate = useCallback((callback: (data: any) => void) => {
    return socketService.onStatusUpdate(callback);
  }, []);

  const onNotification = useCallback((callback: (data: any) => void) => {
    return socketService.onNotification(callback);
  }, []);

  const onAgentJoined = useCallback((callback: (data: any) => void) => {
    return socketService.onAgentJoined(callback);
  }, []);

  const onHandoffQueued = useCallback((callback: (data: any) => void) => {
    return socketService.onHandoffQueued(callback);
  }, []);

  const onHandoffResolved = useCallback((callback: (data: any) => void) => {
    return socketService.onHandoffResolved(callback);
  }, []);

  const onChatError = useCallback((callback: (data: any) => void) => {
    return socketService.onChatError(callback);
  }, []);

  const onRateLimitExceeded = useCallback((callback: (data: any) => void) => {
    return socketService.onRateLimitExceeded(callback);
  }, []);

  /**
   * Setup connection state listener
   * Requirement 0.3
   */
  useEffect(() => {
    // Subscribe to connection state changes
    unsubscribeRef.current = socketService.onConnectionStateChange((state) => {
      setConnectionState(state);
      setIsConnected(state === 'connected');
    });

    // Update initial state
    setConnectionState(socketService.getConnectionState());
    setIsConnected(socketService.isConnected());

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  /**
   * Auto-connect when component mounts (no authentication required)
   * Requirement 0.1
   */
  useEffect(() => {
    if (!isConnected) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, [isConnected, connect]);

  return {
    // Connection state
    isConnected,
    connectionState,
    
    // Connection methods
    connect,
    disconnect,
    
    // Chat methods
    connectToChat,
    sendMessage,
    sendTyping,
    requestAgent,
    disconnectFromChat,
    
    // Event listeners
    onChatResponse,
    onTyping,
    onStream,
    onStatusUpdate,
    onNotification,
    onAgentJoined,
    onHandoffQueued,
    onHandoffResolved,
    onChatError,
    onRateLimitExceeded,
  };
}

export default useSocket;
