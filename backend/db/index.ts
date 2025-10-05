import memoryDb from './memory-db';
import { sqliteDb } from './sqlite-db';
import { supabaseDb } from './supabase-db';

// Database configuration - choose which database to use
export const DATABASE_TYPE = 'supabase' as 'memory' | 'sqlite' | 'supabase';

// Export the selected database
export const db = DATABASE_TYPE === 'supabase' ? supabaseDb : 
                  DATABASE_TYPE === 'sqlite' ? sqliteDb : memoryDb;
export default db;