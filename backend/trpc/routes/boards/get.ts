import { router, publicProcedure } from '@/backend/trpc/create-context';
import db from '@/backend/db/memory-db';
import { z } from 'zod';
import { addBoardRoute, updateBoardRoute, deleteBoardRoute } from './manage';

export const boardsRouter = router({
  getAll: publicProcedure
    .input(z.object({
      location: z.string().optional(),
      type: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      console.log('📋 boards.getAll called with filters:', input);
      return await db.getBoards(input || {});
    }),
    
  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      console.log('📋 boards.getById called with id:', input);
      return await db.getBoardById(input);
    }),
    
  add: addBoardRoute,
  update: updateBoardRoute,
  delete: deleteBoardRoute,
});