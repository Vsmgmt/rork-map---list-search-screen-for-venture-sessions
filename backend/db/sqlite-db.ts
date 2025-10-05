import * as SQLite from 'expo-sqlite';
import { Board, Booking, ProUser } from '@/src/types/board';
import { getBoards, getProUsers } from '@/src/data/seed';
import { RegularUser } from './memory-db';

class SQLiteDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  constructor() {
    console.log('💾 Initializing SQLite Database...');
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    
    try {
      this.db = await SQLite.openDatabaseAsync('surfboard_rental.db');
      await this.createTables();
      await this.seedInitialData();
      this.initialized = true;
      console.log('✅ SQLite Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Simple boards table with JSON columns for complex data
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Simple bookings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Simple regular users table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS regular_users (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Simple pro users table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pro_users (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully');
  }

  private async seedInitialData() {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const boardCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM boards');
    if ((boardCount as any)?.count > 0) {
      console.log('📦 Database already has data, skipping seed');
      return;
    }

    console.log('🌱 Seeding initial data...');

    // Seed pro users first
    const proUsers = getProUsers();
    for (const proUser of proUsers) {
      await this.db.runAsync(
        'INSERT INTO pro_users (id, data) VALUES (?, ?)',
        [proUser.id, JSON.stringify(proUser)]
      );
    }
    console.log(`✅ Seeded ${proUsers.length} pro users`);

    // Seed boards
    const boards = getBoards(50);
    for (const board of boards) {
      await this.db.runAsync(
        'INSERT INTO boards (id, data) VALUES (?, ?)',
        [board.id, JSON.stringify(board)]
      );
    }

    console.log(`✅ Seeded ${boards.length} boards`);
    
    // Seed some sample regular users
    const sampleRegularUsers: RegularUser[] = [
      {
        id: 'regular-1',
        name: 'Alex Johnson',
        email: 'alex.johnson@email.com',
        phone: '+1-555-0123',
        location: 'San Diego',
        joinedDate: '2024-01-15',
        avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g',
        type: 'regular'
      },
      {
        id: 'regular-2',
        name: 'Emma Davis',
        email: 'emma.davis@email.com',
        phone: '+1-555-0456',
        location: 'Santa Cruz',
        joinedDate: '2024-02-20',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        type: 'regular'
      },
      {
        id: 'regular-3',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+1-555-0789',
        location: 'Honolulu',
        joinedDate: '2024-03-10',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        type: 'regular'
      }
    ];
    
    for (const user of sampleRegularUsers) {
      await this.db.runAsync(
        'INSERT INTO regular_users (id, data) VALUES (?, ?)',
        [user.id, JSON.stringify(user)]
      );
    }
    
    console.log(`✅ Seeded ${sampleRegularUsers.length} regular users`);
  }

  // Boards methods
  async getBoards(filters?: {
    location?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<Board[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync('SELECT data FROM boards') as any[];
    let boards: Board[] = rows.map(row => JSON.parse(row.data));

    // Apply filters
    if (filters) {
      if (filters.location) {
        boards = boards.filter(board => 
          board.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      if (filters.type) {
        boards = boards.filter(board => board.type === filters.type);
      }
      if (filters.minPrice !== undefined) {
        boards = boards.filter(board => 
          (board.price_per_day || 0) >= filters.minPrice!
        );
      }
      if (filters.maxPrice !== undefined) {
        boards = boards.filter(board => 
          (board.price_per_day || 0) <= filters.maxPrice!
        );
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        boards = boards.filter(board => 
          board.short_name.toLowerCase().includes(searchTerm) ||
          board.location.toLowerCase().includes(searchTerm) ||
          board.type.toLowerCase().includes(searchTerm)
        );
      }
    }

    return boards;
  }

  async getBoardById(id: string): Promise<Board | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync('SELECT data FROM boards WHERE id = ?', [id]) as any;
    return row ? JSON.parse(row.data) : undefined;
  }

  async addBoard(board: Omit<Board, 'id'> | Board): Promise<Board> {
    if (!this.db) throw new Error('Database not initialized');

    let newBoard: Board;
    if ('id' in board && board.id) {
      // Board already has an ID, use it
      newBoard = board as Board;
    } else {
      // Generate new ID
      const id = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newBoard = { ...board, id };
    }
    
    await this.db.runAsync(
      'INSERT INTO boards (id, data) VALUES (?, ?)',
      [newBoard.id, JSON.stringify(newBoard)]
    );

    return newBoard;
  }

  // Bookings methods
  async getBookings(userId?: string): Promise<Booking[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync('SELECT data FROM bookings') as any[];
    let bookings: Booking[] = rows.map(row => JSON.parse(row.data));

    if (userId) {
      bookings = bookings.filter(booking => 
        booking.customerInfo.email === userId || 
        booking.orderItems.some((item: any) => item.board.owner.id === userId)
      );
    }

    return bookings;
  }

  async addBooking(booking: Omit<Booking, 'id' | 'confirmationNumber' | 'bookingDate'>): Promise<Booking> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const confirmationNumber = `SURF${Date.now().toString().slice(-6)}`;
    const bookingDate = new Date().toISOString();

    const newBooking: Booking = {
      ...booking,
      id,
      confirmationNumber,
      bookingDate
    };

    await this.db.runAsync(
      'INSERT INTO bookings (id, data) VALUES (?, ?)',
      [id, JSON.stringify(newBooking)]
    );

    return newBooking;
  }

  // Regular Users methods
  async getAllRegularUsers(): Promise<RegularUser[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync('SELECT data FROM regular_users') as any[];
    return rows.map(row => JSON.parse(row.data));
  }

  async getRegularUserById(id: string): Promise<RegularUser | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync('SELECT data FROM regular_users WHERE id = ?', [id]) as any;
    return row ? JSON.parse(row.data) : undefined;
  }

  async createRegularUser(userData: Omit<RegularUser, 'id' | 'type' | 'joinedDate' | 'avatarUrl'> & { avatarUrl?: string }): Promise<RegularUser> {
    if (!this.db) throw new Error('Database not initialized');

    const newUser: RegularUser = {
      ...userData,
      id: `regular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'regular',
      joinedDate: new Date().toISOString(),
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    };
    
    await this.db.runAsync(
      'INSERT INTO regular_users (id, data) VALUES (?, ?)',
      [newUser.id, JSON.stringify(newUser)]
    );

    return newUser;
  }

  async updateRegularUser(id: string, updates: Partial<Omit<RegularUser, 'id' | 'type'>>): Promise<RegularUser | null> {
    if (!this.db) throw new Error('Database not initialized');

    const existingUser = await this.getRegularUserById(id);
    if (!existingUser) return null;

    const updatedUser = { ...existingUser, ...updates };
    
    await this.db.runAsync(
      'UPDATE regular_users SET data = ? WHERE id = ?',
      [JSON.stringify(updatedUser), id]
    );

    return updatedUser;
  }

  async deleteRegularUser(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync('DELETE FROM regular_users WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // User stats for admin
  async getUserStats() {
    if (!this.db) throw new Error('Database not initialized');

    const regularUserCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM regular_users') as any;
    const regularUserRows = await this.db.getAllAsync('SELECT data FROM regular_users') as any[];
    const regularUsers: RegularUser[] = regularUserRows.map(row => JSON.parse(row.data));
    
    const now = new Date();
    const newRegularUsersThisMonth = regularUsers.filter(user => {
      const joinDate = new Date(user.joinedDate);
      return joinDate.getMonth() === now.getMonth() && 
             joinDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalRegularUsers: regularUserCount?.count || 0,
      totalProUsers: 0, // Not implemented in SQLite version
      totalUsers: regularUserCount?.count || 0,
      newUsersThisMonth: {
        regular: newRegularUsersThisMonth,
        pro: 0
      }
    };
  }

  // Pro Users methods
  async getProUsers(): Promise<ProUser[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync('SELECT data FROM pro_users') as any[];
    return rows.map(row => JSON.parse(row.data));
  }

  async getProUserById(id: string): Promise<ProUser | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync('SELECT data FROM pro_users WHERE id = ?', [id]) as any;
    return row ? JSON.parse(row.data) : undefined;
  }

  async updateUser(id: string, updates: Partial<ProUser>): Promise<ProUser | null> {
    if (!this.db) throw new Error('Database not initialized');

    const existingUser = await this.getProUserById(id);
    if (!existingUser) return null;

    const updatedUser = { ...existingUser, ...updates };
    
    await this.db.runAsync(
      'UPDATE pro_users SET data = ? WHERE id = ?',
      [JSON.stringify(updatedUser), id]
    );

    return updatedUser;
  }

  // Extras method (placeholder)
  getExtras() {
    return {
      wetsuits: [
        { id: 'wetsuit-1', name: '3/2mm Wetsuit', price: 15 },
        { id: 'wetsuit-2', name: '4/3mm Wetsuit', price: 20 },
        { id: 'wetsuit-3', name: '5/4mm Wetsuit', price: 25 }
      ],
      accessories: [
        { id: 'leash-1', name: 'Surf Leash', price: 5 },
        { id: 'wax-1', name: 'Surf Wax', price: 3 },
        { id: 'fins-1', name: 'Fin Set', price: 10 }
      ]
    };
  }

  // Regenerate seed data
  async regenerateSeedData() {
    if (!this.db) throw new Error('Database not initialized');

    console.log('🗑️ Clearing existing data...');
    await this.db.execAsync('DELETE FROM boards');
    await this.db.execAsync('DELETE FROM pro_users');
    await this.db.execAsync('DELETE FROM bookings');
    await this.db.execAsync('DELETE FROM regular_users');

    console.log('🌱 Regenerating seed data...');
    await this.seedInitialData();

    return {
      success: true,
      message: 'Seed data regenerated successfully'
    };
  }

  // Stats for admin
  async getStats() {
    if (!this.db) throw new Error('Database not initialized');

    const boardCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM boards') as any;
    const bookingCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM bookings') as any;
    const regularUserCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM regular_users') as any;
    const proUserCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM pro_users') as any;
    
    // Calculate revenue from booking data
    const bookingRows = await this.db.getAllAsync('SELECT data FROM bookings') as any[];
    const bookings: Booking[] = bookingRows.map(row => JSON.parse(row.data));
    
    const now = new Date();
    const revenueThisMonth = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      totalBoards: boardCount?.count || 0,
      totalProUsers: proUserCount?.count || 0,
      totalRegularUsers: regularUserCount?.count || 0,
      totalBookings: bookingCount?.count || 0,
      totalMessages: 0, // Not implemented in simple version
      totalConversations: 0, // Not implemented in simple version
      revenueThisMonth
    };
  }
}

// Export singleton instance
export const sqliteDb = new SQLiteDatabase();
export default sqliteDb;