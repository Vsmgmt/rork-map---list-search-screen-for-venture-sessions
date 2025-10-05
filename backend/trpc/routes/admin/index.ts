import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';

export const getStatsRoute = publicProcedure
  .query(() => {
    console.log('Getting admin stats');
    return db.getStats();
  });

export const getProUsersRoute = publicProcedure
  .query(() => {
    console.log('Getting pro users');
    return db.getProUsers();
  });

export const getProUserByIdRoute = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .query(({ input }) => {
    console.log('Getting pro user by ID:', input.id);
    const user = db.getProUserById(input.id);
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
  .mutation(({ input }) => {
    console.log('🔄 Admin updateUser called with:', input);
    
    // Check if user exists before updating
    const existingUser = db.getProUserById(input.userId);
    if (!existingUser) {
      console.error('❌ Pro user not found with ID:', input.userId);
      console.log('📋 Available pro users:', db.getProUsers().map((u: any) => ({ id: u.id, name: u.name })));
      throw new Error(`Pro user with ID ${input.userId} not found`);
    }
    
    console.log('✅ Found existing pro user:', { id: existingUser.id, name: existingUser.name });
    
    const result = db.updateUser(input.userId, input);
    
    if (!result) {
      console.error('❌ Failed to update user in database');
      throw new Error('Failed to update user');
    }
    
    console.log('✅ User updated successfully:', { id: result.id, name: result.name });
    return result;
  });

export const regenerateSeedDataRoute = publicProcedure
  .mutation(() => {
    console.log('Regenerating seed data...');
    return db.regenerateSeedData();
  });

export const getAllUsersRoute = publicProcedure
  .query(async () => {
    console.log('Getting all users from database...');
    
    try {
      // Handle different database types
      if ('getProUsers' in db && typeof db.getProUsers === 'function') {
        const proUsers = db.getProUsers();
        console.log(`Found ${proUsers.length} pro users in database`);
        
        return {
          proUsers,
          regularUsers: [], // Regular users are not stored in backend database
          totalUsers: proUsers.length
        };
      } else {
        // For SQLite or other databases, we might need different approach
        console.log('Database does not have getProUsers method');
        return {
          proUsers: [],
          regularUsers: [],
          totalUsers: 0
        };
      }
    } catch (error) {
      console.error('Error getting users:', error);
      return {
        proUsers: [],
        regularUsers: [],
        totalUsers: 0
      };
    }
  });

// Export seed data routes
export { seedDataRoute, clearDataRoute, getDataStatsRoute } from './seed-data';

// Export create pro users route
export { createProUsersRoute } from './create-pro-users';