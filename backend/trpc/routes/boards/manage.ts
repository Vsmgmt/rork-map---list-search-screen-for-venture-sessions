import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';

const newBoardSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['soft-top', 'shortboard', 'fish', 'longboard', 'sup']),
  location: z.string().min(1).max(100),
  pricePerDay: z.number().min(0),
  pricePerWeek: z.number().min(0),
  dimensions: z.string().max(50),
  volume: z.number().optional(),
  description: z.string().max(500).optional(),
  pickupSpot: z.string().max(200),
  availableStart: z.string(),
  availableEnd: z.string(),
  deliveryAvailable: z.boolean(),
  deliveryPrice: z.number().min(0),
  imageUrl: z.string().url().optional(),
  ownerId: z.string().optional(),
});

export const addBoardRoute = publicProcedure
  .input(newBoardSchema)
  .mutation(async ({ input }) => {
    console.log('Adding board:', input);
    
    // Always auto-assign a random pro user when no owner is provided
    let owner;
    if (input.ownerId) {
      owner = await db.getProUserById(input.ownerId);
      if (!owner) {
        console.log('⚠️  Specified owner not found, auto-assigning random pro user');
        const proUsers = await db.getProUsers();
        if (!proUsers || proUsers.length === 0) {
          throw new Error('No pro users available to assign board');
        }
        const randomIndex = Math.floor(Math.random() * proUsers.length);
        owner = proUsers[randomIndex];
        console.log('🎲 Auto-assigned random pro user:', owner.name, 'ID:', owner.id);
      }
    } else {
      // Auto-assign a random pro user
      const proUsers = await db.getProUsers();
      if (!proUsers || proUsers.length === 0) {
        throw new Error('No pro users available to assign board');
      }
      const randomIndex = Math.floor(Math.random() * proUsers.length);
      owner = proUsers[randomIndex];
      console.log('🎲 Auto-assigned random pro user:', owner.name, 'ID:', owner.id);
    }
    
    // Convert the input to match the Board interface
    const imageUrl = input.imageUrl || 'https://via.placeholder.com/300x400?text=No+Image';
    const boardData = {
      short_name: input.name,
      type: input.type,
      location: input.location,
      price_per_day: input.pricePerDay,
      price_per_week: input.pricePerWeek,
      dimensions_detail: input.dimensions,
      volume_l: input.volume || null,
      pickup_spot: input.pickupSpot,
      available_start: input.availableStart,
      available_end: input.availableEnd,
      delivery_available: input.deliveryAvailable,
      delivery_price: input.deliveryPrice,
      imageUrl,
      image_url: imageUrl,
      lat: 0,
      lon: 0,
      owner,
    };
    
    return await db.addBoard(boardData);
  });

export const updateBoardRoute = publicProcedure
  .input(z.object({
    id: z.string(),
    updates: newBoardSchema.partial(),
  }))
  .mutation(async ({ input }) => {
    console.log('Updating board:', input);
    
    const { id, updates } = input;
    const boardUpdates: any = {};
    
    if (updates.name) boardUpdates.short_name = updates.name;
    if (updates.type) boardUpdates.type = updates.type;
    if (updates.location) boardUpdates.location = updates.location;
    if (updates.pricePerDay !== undefined) boardUpdates.price_per_day = updates.pricePerDay;
    if (updates.pricePerWeek !== undefined) boardUpdates.price_per_week = updates.pricePerWeek;
    if (updates.dimensions) boardUpdates.dimensions_detail = updates.dimensions;
    if (updates.volume !== undefined) boardUpdates.volume_l = updates.volume;
    if (updates.pickupSpot) boardUpdates.pickup_spot = updates.pickupSpot;
    if (updates.availableStart) boardUpdates.available_start = updates.availableStart;
    if (updates.availableEnd) boardUpdates.available_end = updates.availableEnd;
    if (updates.deliveryAvailable !== undefined) boardUpdates.delivery_available = updates.deliveryAvailable;
    if (updates.deliveryPrice !== undefined) boardUpdates.delivery_price = updates.deliveryPrice;
    if (updates.imageUrl) boardUpdates.imageUrl = updates.imageUrl;
    
    throw new Error('Update board not implemented for Supabase database yet');
  });

export const deleteBoardRoute = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('Deleting board:', input.id);
    throw new Error('Delete board not implemented for Supabase database yet');
  });