import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';



const CreateRegularUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  location: z.string().min(1, 'Location is required'),
  avatarUrl: z.string().optional(),
});

const UpdateRegularUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  avatarUrl: z.string().optional(),
});

// Get all regular users
export const getAllRegularUsersRoute = publicProcedure
  .query(async () => {
    console.log('Getting all regular users from database...');
    return await db.getAllRegularUsers();
  });

// Get regular user by ID
export const getRegularUserByIdRoute = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    console.log('Getting regular user by ID:', input.id);
    const user = await db.getRegularUserById(input.id);
    if (!user) {
      throw new Error('Regular user not found');
    }
    return user;
  });

// Create regular user
export const createRegularUserRoute = publicProcedure
  .input(CreateRegularUserSchema)
  .mutation(async ({ input }) => {
    console.log('Creating regular user:', input);
    return await db.createRegularUser(input);
  });

// Update regular user
export const updateRegularUserRoute = publicProcedure
  .input(UpdateRegularUserSchema)
  .mutation(async ({ input }) => {
    console.log('Updating regular user:', input);
    const { id, ...updates } = input;
    return await db.updateRegularUser(id, updates);
  });

// Delete regular user
export const deleteRegularUserRoute = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    console.log('Deleting regular user:', input.id);
    return await db.deleteRegularUser(input.id);
  });

// Get user stats (for admin)
export const getUserStatsRoute = publicProcedure
  .query(async () => {
    console.log('Getting user statistics...');
    return await db.getUserStats();
  });