import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Message, Conversation } from '@/src/types/message';
import { trpc } from '@/lib/trpc';
import { useMessages } from '@/src/context/messages';
import { useUser } from '@/src/context/user';

export const [MessagesBackendProvider, useMessagesBackendInternal] = createContextHook(() => {
  const { currentUser } = useUser();
  const [backendAvailable, setBackendAvailable] = useState(false); // Temporarily disable backend
  
  // Get local messages as fallback
  const localMessages = useMessages();
  
  // Test tRPC connection first
  const testQuery = trpc.testMessages.useQuery(
    { userId: currentUser?.id || 'test-user' },
    {
      enabled: !!currentUser && backendAvailable,
      refetchOnWindowFocus: false,
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: (failureCount: number, error: any) => {
        console.log('tRPC test query error:', error?.message);
        console.log('Full error:', error);
        if (error?.message?.includes('fetch') || 
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('Network error') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('404') ||
            error?.message?.includes('No procedure found')) {
          console.log('Backend not available or procedure not found, using local messages fallback');
          setBackendAvailable(false);
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    }
  );

  // Use tRPC to fetch conversations
  const conversationsQuery = trpc.messages.getConversations.useQuery(
    { userId: currentUser?.id || '' },
    {
      enabled: !!currentUser && backendAvailable && testQuery.isSuccess,
      refetchOnWindowFocus: false,
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: (failureCount: number, error: any) => {
        console.log('tRPC conversations query error:', error?.message);
        console.log('Full error:', error);
        if (error?.message?.includes('fetch') || 
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('Network error') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('404') ||
            error?.message?.includes('No procedure found')) {
          console.log('Backend not available or procedure not found, using local messages fallback');
          setBackendAvailable(false);
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    }
  );

  // Send message mutation
  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      console.log('Message sent successfully in backend');
      conversationsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to send message in backend:', error);
    },
  });

  // Create conversation mutation
  const createConversationMutation = trpc.messages.createConversation.useMutation({
    onSuccess: () => {
      console.log('Conversation created successfully in backend');
      conversationsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to create conversation in backend:', error);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.messages.markAsRead.useMutation({
    onSuccess: () => {
      console.log('Messages marked as read in backend');
      conversationsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to mark messages as read in backend:', error);
    },
  });

  const sendMessage = useCallback(async (conversationId: string, content: string, receiverId: string) => {
    if (!currentUser) return;

    if (backendAvailable) {
      try {
        await sendMessageMutation.mutateAsync({
          conversationId,
          senderId: currentUser.id,
          receiverId,
          content,
          type: 'text',
        });
        console.log('Message sent in backend');
        return;
      } catch (error) {
        console.error('Backend message sending failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local message sending
    console.log('Sending message locally');
    await localMessages.sendMessage(conversationId, content, receiverId);
  }, [currentUser, backendAvailable, sendMessageMutation, localMessages]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    if (backendAvailable) {
      try {
        await markAsReadMutation.mutateAsync({ conversationId });
        console.log('Messages marked as read in backend');
        return;
      } catch (error) {
        console.error('Backend mark as read failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local mark as read
    console.log('Marking messages as read locally');
    await localMessages.markAsRead(conversationId);
  }, [currentUser, backendAvailable, markAsReadMutation, localMessages]);

  const createConversation = useCallback(async (participantId: string): Promise<string> => {
    if (!currentUser) return '';

    if (backendAvailable) {
      try {
        const conversation = await createConversationMutation.mutateAsync({
          participants: [currentUser.id, participantId]
        });
        console.log('Conversation created in backend:', conversation);
        return conversation.id;
      } catch (error) {
        console.error('Backend conversation creation failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local conversation creation
    console.log('Creating conversation locally');
    return await localMessages.createConversation(participantId);
  }, [currentUser, backendAvailable, createConversationMutation, localMessages]);

  // Get messages for a specific conversation
  const getMessages = useCallback((conversationId: string): Message[] => {
    // For now, we'll use local messages as the backend doesn't store individual messages in the query
    // This could be enhanced to fetch messages per conversation from backend
    return localMessages.messages[conversationId] || [];
  }, [localMessages.messages]);

  const refetchConversations = useCallback(() => {
    console.log('Refetching conversations');
    return conversationsQuery.refetch();
  }, [conversationsQuery]);

  const contextValue = useMemo(() => {
    const conversations = backendAvailable && conversationsQuery.data ? conversationsQuery.data : localMessages.conversations;
    const isLoading = backendAvailable ? conversationsQuery.isLoading : localMessages.isLoading;
    
    // Calculate total unread count
    const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    
    return {
      conversations: conversations.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()),
      messages: localMessages.messages, // Keep using local messages for now
      sendMessage,
      markAsRead,
      createConversation,
      getMessages,
      isLoading,
      totalUnreadCount,
      refetchConversations,
      backendAvailable,
    };
  }, [
    backendAvailable,
    conversationsQuery.data,
    conversationsQuery.isLoading,
    localMessages.conversations,
    localMessages.messages,
    localMessages.isLoading,
    sendMessage,
    markAsRead,
    createConversation,
    getMessages,
    refetchConversations,
  ]);

  console.log('MessagesBackend context value:', {
    conversationsCount: contextValue.conversations.length,
    totalUnreadCount: contextValue.totalUnreadCount,
    isLoading: contextValue.isLoading,
    backendAvailable: contextValue.backendAvailable
  });

  return contextValue;
});

// Safe wrapper that ensures the context is always available
export function useMessagesBackend() {
  const localMessages = useMessages();
  
  const createFallbackContext = () => ({
    conversations: localMessages.conversations,
    messages: localMessages.messages,
    sendMessage: localMessages.sendMessage,
    markAsRead: localMessages.markAsRead,
    createConversation: localMessages.createConversation,
    getMessages: (conversationId: string) => localMessages.messages[conversationId] || [],
    isLoading: localMessages.isLoading,
    totalUnreadCount: localMessages.totalUnreadCount,
    refetchConversations: () => Promise.resolve({ data: localMessages.conversations }),
    backendAvailable: false,
  });
  
  try {
    const context = useMessagesBackendInternal();
    if (!context) {
      console.warn('MessagesBackend context is null, using local fallback');
      return createFallbackContext();
    }
    
    return context;
  } catch (error) {
    console.error('Error accessing MessagesBackend context, using local fallback:', error);
    return createFallbackContext();
  }
}