import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';
import { supabase } from '@/lib/supabase';



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

// Initialize user profile
const InitUserProfileSchema = z.object({
  role: z.enum(['regular', 'pro']),
  profile: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    avatar_url: z.string().optional(),
    bio: z.string().optional(),
  }),
});

export const initUserProfileRoute = publicProcedure
  .input(InitUserProfileSchema)
  .mutation(async ({ input }) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not signed in');

    const args = {
      p_id: user.id,
      p_name: input.profile.name,
      p_email: input.profile.email,
      p_phone: input.profile.phone ?? null,
      p_location: input.profile.location ?? null,
      p_avatar_url: input.profile.avatar_url ?? null,
      p_bio: input.profile.bio ?? null,
    };

    if (input.role === 'pro') {
      const { error } = await supabase.rpc('upsert_pro_profile', args);
      if (error) throw error;
    } else {
      const { error } = await supabase.rpc('upsert_regular_profile', args);
      if (error) throw error;
    }
  });