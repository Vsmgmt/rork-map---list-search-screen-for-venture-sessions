import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db/memory-db';

export const getConversationsRoute = publicProcedure
  .input(z.object({
    userId: z.string()
  }))
  .query(({ input }) => {
    console.log('Getting conversations for user:', input.userId);
    return db.getConversations(input.userId);
  });

export const getMessagesRoute = publicProcedure
  .input(z.object({
    conversationId: z.string()
  }))
  .query(({ input }) => {
    console.log('Getting messages for conversation:', input.conversationId);
    return db.getMessages(input.conversationId);
  });

export const sendMessageRoute = publicProcedure
  .input(z.object({
    conversationId: z.string(),
    senderId: z.string(),
    receiverId: z.string(),
    content: z.string(),
    type: z.enum(['text', 'image']).default('text'),
    imageUrl: z.string().optional(),
  }))
  .mutation(({ input }) => {
    console.log('Sending message:', input);
    return db.addMessage({
      conversationId: input.conversationId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      content: input.content,
      type: input.type,
      imageUrl: input.imageUrl,
      read: false,
    });
  });

export const createConversationRoute = publicProcedure
  .input(z.object({
    participants: z.array(z.string())
  }))
  .mutation(({ input }) => {
    console.log('Creating conversation:', input);
    return db.createConversation(input.participants);
  });

export const markAsReadRoute = publicProcedure
  .input(z.object({
    conversationId: z.string()
  }))
  .mutation(({ input }) => {
    console.log('Marking conversation as read:', input.conversationId);
    db.markConversationAsRead(input.conversationId);
    return { success: true };
  });