export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // user IDs
  lastMessage?: Message;
  lastActivity: string;
  unreadCount: number;
  participantDetails: {
    id: string;
    name: string;
    avatarUrl: string;
    type: 'regular' | 'pro';
  }[];
}

export interface MessageContextType {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  sendMessage: (conversationId: string, content: string, receiverId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (participantId: string) => Promise<string>;
  isLoading: boolean;
}