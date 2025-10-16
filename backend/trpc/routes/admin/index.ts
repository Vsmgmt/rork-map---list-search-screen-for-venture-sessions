import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';

export const getStatsRoute = publicProcedure
  .query(async () => {
    console.log('Getting admin stats');
    return await db.getStats();
  });

export const getProUsersRoute = publicProcedure
  .query(async () => {
    console.log('Getting pro users from database...');
    const proUsers = await db.getProUsers();
    console.log(`✅ Found ${proUsers.length} pro users in database`);
    return proUsers;
  });

export const getProUserByIdRoute = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .query(async ({ input }) => {
    console.log('Getting pro user by ID:', input.id);
    const user = await db.getProUserById(input.id);
    if (!user) {
      throw new Error('Pro user not found');
    }
    return user;
  });

export const getExtrasRoute = publicProcedure
  .query(() => {
    console.log('Getting extras');
    return db.getExtras();
  });

export const updateUserRoute = publicProcedure
  .input(z.object({
    userId: z.string(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    avatarUrl: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log('🔄 Admin updateUser called with:', input);
    
    const existingUser = await db.getProUserById(input.userId);
    if (!existingUser) {
      console.error('❌ Pro user not found with ID:', input.userId);
      const allUsers = await db.getProUsers();
      console.log('📋 Available pro users:', allUsers.map((u: any) => ({ id: u.id, name: u.name })));
      throw new Error(`Pro user with ID ${input.userId} not found`);
    }
    
    console.log('✅ Found existing pro user:', { id: existingUser.id, name: existingUser.name });
    
    const result = await db.updateUser(input.userId, input);
    
    if (!result) {
      console.error('❌ Failed to update user in database');
      throw new Error('Failed to update user');
    }
    
    console.log('✅ User updated successfully:', { id: result.id, name: result.name });
    return result;
  });

export const regenerateSeedDataRoute = publicProcedure
  .mutation(async () => {
    console.log('Regenerating seed data...');
    return await db.regenerateSeedData();
  });

export const getAllUsersRoute = publicProcedure
  .query(async () => {
    console.log('Getting all users from database...');
    
    try {
      const proUsers = await db.getProUsers();
      const regularUsers = await db.getAllRegularUsers();
      
      console.log(`Found ${proUsers.length} pro users and ${regularUsers.length} regular users in database`);
      
      const allUsers = [
        ...proUsers.map((u: any) => ({ ...u, type: 'pro' })),
        ...regularUsers.map((u: any) => ({ ...u, type: 'regular' }))
      ];
      
      return allUsers;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  });

// Export seed data routes
export { seedDataRoute, clearDataRoute, getDataStatsRoute } from './seed-data';

// Export create pro users route
export { createProUsersRoute } from './create-pro-users';