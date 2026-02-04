export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
}
