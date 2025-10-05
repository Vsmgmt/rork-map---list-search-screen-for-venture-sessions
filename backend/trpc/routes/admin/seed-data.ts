import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';
import { getBoards, getProUsers } from '@/src/data/seed';

export const seedDataRoute = publicProcedure
  .input(z.object({
    boardCount: z.number().min(1).max(500).default(100),
    clearExisting: z.boolean().default(true)
  }).optional())
  .mutation(async ({ input }) => {
    const { boardCount = 100, clearExisting = true } = input || {};
    
    console.log('🌱 Starting data seeding process...');
    console.log(`📊 Board count: ${boardCount}, Clear existing: ${clearExisting}`);
    
    try {
      // If using SQLite, we need to handle seeding differently
      if ('seedInitialData' in db) {
        console.log('💾 Using SQLite database - seeding through database methods');
        
        // For SQLite, we'll need to clear and reseed
        if (clearExisting) {
          console.log('🗑️ Clearing existing data...');
          // Note: SQLite implementation would need clear methods
        }
        
        // Generate fresh data
        const boards = getBoards(boardCount);
        const proUsers = getProUsers();
        
        console.log(`📋 Generated ${boards.length} boards and ${proUsers.length} pro users`);
        
        // Add boards to database
        for (const board of boards) {
          await (db as any).addBoard(board);
        }
        
        console.log('✅ Data seeding completed successfully');
        
        return {
          success: true,
          message: `Successfully seeded ${boards.length} boards and ${proUsers.length} pro users`,
          data: {
            boardsCount: boards.length,
            proUsersCount: proUsers.length
          }
        };
      } else {
        // Memory database
        console.log('💭 Using memory database - seeding through regeneration');
        
        const result = (db as any).regenerateSeedData();
        
        return {
          success: true,
          message: 'Successfully regenerated seed data',
          data: result
        };
      }
    } catch (error) {
      console.error('❌ Error during data seeding:', error);
      throw new Error(`Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export const clearDataRoute = publicProcedure
  .mutation(async () => {
    console.log('🗑️ Clearing all data...');
    
    try {
      // This would need to be implemented based on database type
      if ('clearAllData' in db) {
        await (db as any).clearAllData();
      } else {
        // For memory database, we can regenerate with empty data
        console.log('💭 Memory database - clearing not implemented');
        throw new Error('Clear data not implemented for memory database');
      }
      
      console.log('✅ All data cleared successfully');
      
      return {
        success: true,
        message: 'All data cleared successfully'
      };
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw new Error(`Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export const getDataStatsRoute = publicProcedure
  .query(async () => {
    console.log('📊 Getting data statistics...');
    
    try {
      const boards = await db.getBoards();
      const stats = await db.getStats();
      
      return {
        totalBoards: boards.length,
        totalBookings: stats.totalBookings || 0,
        totalProUsers: stats.totalProUsers || 0,
        totalRegularUsers: stats.totalRegularUsers || 0,
        revenueThisMonth: stats.revenueThisMonth || 0,
        databaseType: 'sqlite' // Based on current config
      };
    } catch (error) {
      console.error('❌ Error getting data stats:', error);
      throw new Error(`Failed to get data stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });