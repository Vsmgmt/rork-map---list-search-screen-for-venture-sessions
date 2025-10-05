import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Message, Conversation, MessageContextType } from '@/src/types/message';
import { useUser } from './user';
import { getProUsers } from '@/src/data/seed';

const MESSAGES_STORAGE_KEY = 'venture_sessions_messages';
const CONVERSATIONS_STORAGE_KEY = 'venture_sessions_conversations';

// Mock data for demo
const generateMockMessages = (currentUserId: string): { conversations: Conversation[], messages: { [key: string]: Message[] } } => {
  const proUsers = getProUsers();
  const mockConversations: Conversation[] = [];
  const mockMessages: { [key: string]: Message[] } = {};

  // Create conversations with a few pro users
  proUsers.slice(0, 3).forEach((proUser, index) => {
    const conversationId = `conv-${currentUserId}-${proUser.id}`;
    const conversation: Conversation = {
      id: conversationId,
      participants: [currentUserId, proUser.id],
      lastActivity: new Date(Date.now() - index * 3600000).toISOString(),
      unreadCount: index === 0 ? 2 : 0,
      participantDetails: [
        {
          id: proUser.id,
          name: proUser.name,
          avatarUrl: proUser.avatarUrl,
          type: 'pro'
        }
      ]
    };

    const messages: Message[] = [
      {
        id: `msg-${conversationId}-1`,
        conversationId,
        senderId: proUser.id,
        receiverId: currentUserId,
        content: `Hi! I saw you're interested in surfboard rentals. I have some great boards available!`,
        timestamp: new Date(Date.now() - (index + 1) * 7200000).toISOString(),
        read: index !== 0,
        type: 'text'
      },
      {
        id: `msg-${conversationId}-2`,
        conversationId,
        senderId: currentUserId,
        receiverId: proUser.id,
        content: `That sounds great! What boards do you have available for this weekend?`,
        timestamp: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
        read: true,
        type: 'text'
      }
    ];

    if (index === 0) {
      messages.push({
        id: `msg-${conversationId}-3`,
        conversationId,
        senderId: proUser.id,
        receiverId: currentUserId,
        content: `I have a few longboards and shortboards. Would you like to see photos?`,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        type: 'text'
      });
    }

    conversation.lastMessage = messages[messages.length - 1];
    mockConversations.push(conversation);
    mockMessages[conversationId] = messages;
  });

  return { conversations: mockConversations, messages: mockMessages };
};

export const [MessagesProvider, useMessages] = createContextHook(() => {
  const { currentUser } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const storedConversations = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      const storedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
      
      if (storedConversations && storedMessages) {
        setConversations(JSON.parse(storedConversations));
        setMessages(JSON.parse(storedMessages));
      } else {
        // Generate mock data for demo
        const mockData = generateMockMessages(currentUser.id);
        setConversations(mockData.conversations);
        setMessages(mockData.messages);
        await saveConversations(mockData.conversations);
        await saveMessages(mockData.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadMessages();
    }
  }, [currentUser, loadMessages]);

  const saveConversations = async (convs: Conversation[]) => {
    try {
      await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(convs));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  };

  const saveMessages = async (msgs: { [conversationId: string]: Message[] }) => {
    try {
      await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(msgs));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  const sendMessage = useCallback(async (conversationId: string, content: string, receiverId: string) => {
    if (!currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text'
    };

    // Update messages
    setMessages(prevMessages => {
      const updatedMessages = {
        ...prevMessages,
        [conversationId]: [...(prevMessages[conversationId] || []), newMessage]
      };
      saveMessages(updatedMessages);
      return updatedMessages;
    });

    // Update conversation
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: newMessage,
            lastActivity: newMessage.timestamp
          };
        }
        return conv;
      });
      saveConversations(updatedConversations);
      return updatedConversations;
    });
  }, [currentUser]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    // Mark messages as read
    setMessages(prevMessages => {
      const updatedMessages = {
        ...prevMessages,
        [conversationId]: prevMessages[conversationId]?.map(msg => 
          msg.receiverId === currentUser.id ? { ...msg, read: true } : msg
        ) || []
      };
      saveMessages(updatedMessages);
      return updatedMessages;
    });

    // Update conversation unread count
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
      saveConversations(updatedConversations);
      return updatedConversations;
    });
  }, [currentUser]);

  const createConversation = useCallback(async (participantId: string): Promise<string> => {
    if (!currentUser) return '';

    return new Promise((resolve) => {
      setConversations(prevConversations => {
        // Check if conversation already exists
        const existingConv = prevConversations.find(conv => 
          conv.participants.includes(participantId) && conv.participants.includes(currentUser.id)
        );
        
        if (existingConv) {
          resolve(existingConv.id);
          return prevConversations;
        }

        // Find participant details
        const proUsers = getProUsers();
        const participant = proUsers.find(user => user.id === participantId);
        
        if (!participant) {
          resolve('');
          return prevConversations;
        }

        const conversationId = `conv-${currentUser.id}-${participantId}-${Date.now()}`;
        const newConversation: Conversation = {
          id: conversationId,
          participants: [currentUser.id, participantId],
          lastActivity: new Date().toISOString(),
          unreadCount: 0,
          participantDetails: [
            {
              id: participant.id,
              name: participant.name,
              avatarUrl: participant.avatarUrl,
              type: 'pro'
            }
          ]
        };

        const updatedConversations = [newConversation, ...prevConversations];
        saveConversations(updatedConversations);
        
        // Initialize empty messages array for this conversation
        setMessages(prevMessages => {
          const updatedMessages = { ...prevMessages, [conversationId]: [] };
          saveMessages(updatedMessages);
          return updatedMessages;
        });

        resolve(conversationId);
        return updatedConversations;
      });
    });
  }, [currentUser]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }, [conversations]);

  return useMemo(() => ({
    conversations: conversations.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()),
    messages,
    sendMessage,
    markAsRead,
    createConversation,
    isLoading,
    totalUnreadCount
  }), [conversations, messages, sendMessage, markAsRead, createConversation, isLoading, totalUnreadCount]);
});