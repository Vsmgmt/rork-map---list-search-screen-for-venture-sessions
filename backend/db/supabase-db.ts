import { createClient } from '@supabase/supabase-js';
import { Board, Booking, ProUser } from '@/src/types/board';
import { getBoards, getProUsers } from '@/src/data/seed';
import { RegularUser } from './memory-db';

// Get environment variables - try both backend and frontend formats
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ozzfbzhfyuyqcvixfuez.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96emZiemhmeXV5cWN2aXhmdWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjcwNjksImV4cCI6MjA3MzIwMzA2OX0.Zd9x22XREzIKE5fvqK_uJsLFwzvYpPlgNCKKoAOR1wY';

console.log('🔧 Supabase Environment Check:');
console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING');
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 30)}...` : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseDatabase {
  private initialized = false;

  constructor() {
    console.log('🔗 Initializing Supabase Database...');
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    
    try {
      await this.createTables();
      this.initialized = true;
      console.log('✅ Supabase Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase database:', error);
      throw error;
    }
  }

  private async createTables() {
    // Create tables if they don't exist
    // Note: In production, you should create these tables via Supabase dashboard or migrations
    
    // For now, we'll assume tables exist or create them via SQL
    console.log('✅ Supabase tables ready');
  }

  // Boards methods
  async getBoards(filters?: {
    location?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<Board[]> {
    let query = supabase.from('boards').select('*');

    // Apply filters
    if (filters) {
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.type) {
        query = query.eq('board_type', filters.type);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price_per_day', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price_per_day', filters.maxPrice);
      }
      if (filters.search) {
        query = query.or(`short_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%,board_type.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getBoardById(id: string): Promise<Board | undefined> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data || undefined;
  }

  async addBoard(board: Omit<Board, 'id'> | Board): Promise<Board> {
    let newBoard: Board;
    if ('id' in board && board.id) {
      newBoard = board as Board;
    } else {
      const id = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newBoard = { ...board, id };
    }
    
    // Map the Board object to database schema
    const dbBoard = {
      id: newBoard.id,
      short_name: newBoard.short_name,
      location: newBoard.location,
      board_type: newBoard.type,
      price_per_day: newBoard.price_per_day,
      description: newBoard.dimensions_detail || '',
      images: [newBoard.imageUrl || ''],
      owner_id: newBoard.owner?.id || '',
      owner_name: newBoard.owner?.name || '',
      owner_avatar: newBoard.owner?.avatarUrl || '',
      owner_rating: newBoard.owner?.rating || 0,
      owner_reviews_count: 0,
      rating: 0,
      reviews_count: 0,
      available: true
    };
    
    console.log('🏄‍♂️ Inserting board into Supabase:', dbBoard);
    
    const { data, error } = await supabase
      .from('boards')
      .insert([dbBoard])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase board insert error:', error);
      throw error;
    }
    
    console.log('✅ Board inserted successfully:', data);
    return newBoard; // Return the original format
  }

  // Bookings methods
  async getBookings(userId?: string): Promise<Booking[]> {
    let query = supabase.from('bookings').select('*');
    
    if (userId) {
      // This would need to be adjusted based on your booking structure
      query = query.or(`customer_email.eq.${userId},owner_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async addBooking(booking: Omit<Booking, 'id' | 'confirmationNumber' | 'bookingDate'>): Promise<Booking> {
    const id = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const confirmationNumber = `SURF${Date.now().toString().slice(-6)}`;
    const bookingDate = new Date().toISOString();

    const newBooking: Booking = {
      ...booking,
      id,
      confirmationNumber,
      bookingDate
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([newBooking])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Regular Users methods
  async getAllRegularUsers(): Promise<RegularUser[]> {
    const { data, error } = await supabase
      .from('regular_users')
      .select('*');
    
    if (error) throw error;
    
    // Map database fields to application fields
    return (data || []).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      avatarUrl: user.avatar_url,
      type: user.user_type,
      joinedDate: user.joined_date
    }));
  }

  async getRegularUserById(id: string): Promise<RegularUser | undefined> {
    const { data, error } = await supabase
      .from('regular_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return undefined;
    
    // Map database fields to application fields
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      avatarUrl: data.avatar_url,
      type: data.user_type,
      joinedDate: data.joined_date
    };
  }

  async createRegularUser(userData: Omit<RegularUser, 'id' | 'type' | 'joinedDate' | 'avatarUrl'> & { avatarUrl?: string }): Promise<RegularUser> {
    const newUser = {
      id: `regular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      location: userData.location,
      avatar_url: userData.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      user_type: 'regular',
      joined_date: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('regular_users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating regular user:', error);
      throw error;
    }
    
    // Map the response back to RegularUser format
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      avatarUrl: data.avatar_url,
      type: data.user_type,
      joinedDate: data.joined_date
    };
  }

  async updateRegularUser(id: string, updates: Partial<Omit<RegularUser, 'id' | 'type'>>): Promise<RegularUser | null> {
    const { data, error } = await supabase
      .from('regular_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async deleteRegularUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('regular_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Pro Users methods
  async getProUsers(): Promise<ProUser[]> {
    const { data, error } = await supabase
      .from('pro_users')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getProUserById(id: string): Promise<ProUser | undefined> {
    const { data, error } = await supabase
      .from('pro_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  }

  async createProUser(userData: Omit<ProUser, 'id'>): Promise<ProUser> {
    const newUser: ProUser = {
      ...userData,
      id: `pro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const { data, error } = await supabase
      .from('pro_users')
      .insert([newUser])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(id: string, updates: Partial<ProUser>): Promise<ProUser | null> {
    const { data, error } = await supabase
      .from('pro_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  // User stats for admin
  async getUserStats() {
    const [regularUsersResult, proUsersResult] = await Promise.all([
      supabase.from('regular_users').select('id, joined_date', { count: 'exact' }),
      supabase.from('pro_users').select('id', { count: 'exact' })
    ]);

    if (regularUsersResult.error) throw regularUsersResult.error;
    if (proUsersResult.error) throw proUsersResult.error;

    const now = new Date();
    const newRegularUsersThisMonth = (regularUsersResult.data || []).filter(user => {
      const joinDate = new Date(user.joined_date);
      return joinDate.getMonth() === now.getMonth() && 
             joinDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalRegularUsers: regularUsersResult.count || 0,
      totalProUsers: proUsersResult.count || 0,
      totalUsers: (regularUsersResult.count || 0) + (proUsersResult.count || 0),
      newUsersThisMonth: {
        regular: newRegularUsersThisMonth,
        pro: 0 // Would need to track join dates for pro users too
      }
    };
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

  // Seed data methods
  async seedInitialData() {
    console.log('🌱 Seeding initial data to Supabase...');

    try {
      // Check if data already exists
      const { count: boardCount } = await supabase
        .from('boards')
        .select('*', { count: 'exact', head: true });

      if ((boardCount || 0) > 0) {
        console.log('📦 Database already has data, skipping seed');
        return;
      }

      // Seed pro users first
      const proUsers = getProUsers();
      const { error: proUsersError } = await supabase
        .from('pro_users')
        .insert(proUsers);
      
      if (proUsersError) throw proUsersError;
      console.log(`✅ Seeded ${proUsers.length} pro users`);

      // Seed boards - map to database schema
      const boardsData = getBoards(50);
      const mappedBoards = boardsData.map(board => ({
        id: board.id,
        short_name: board.short_name,
        location: board.location,
        board_type: board.type,
        price_per_day: board.price_per_day,
        description: board.dimensions_detail || '',
        images: [board.imageUrl || ''],
        owner_id: board.owner?.id || '',
        owner_name: board.owner?.name || '',
        owner_avatar: board.owner?.avatarUrl || '',
        owner_rating: board.owner?.rating || 0,
        owner_reviews_count: 0,
        rating: 0,
        reviews_count: 0,
        available: true
      }));
      
      const { error: boardsError } = await supabase
        .from('boards')
        .insert(mappedBoards);
      
      if (boardsError) throw boardsError;
      console.log(`✅ Seeded ${mappedBoards.length} boards`);
      
      // Seed some sample regular users (using database column names)
      const sampleRegularUsers = [
        {
          id: 'regular-1',
          name: 'Alex Johnson',
          email: 'alex.johnson@email.com',
          phone: '+1-555-0123',
          location: 'San Diego',
          joined_date: '2024-01-15',
          avatar_url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g',
          user_type: 'regular'
        },
        {
          id: 'regular-2',
          name: 'Emma Davis',
          email: 'emma.davis@email.com',
          phone: '+1-555-0456',
          location: 'Santa Cruz',
          joined_date: '2024-02-20',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          user_type: 'regular'
        },
        {
          id: 'regular-3',
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          phone: '+1-555-0789',
          location: 'Honolulu',
          joined_date: '2024-03-10',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          user_type: 'regular'
        }
      ];
      
      const { error: regularUsersError } = await supabase
        .from('regular_users')
        .insert(sampleRegularUsers);
      
      if (regularUsersError) throw regularUsersError;
      console.log(`✅ Seeded ${sampleRegularUsers.length} regular users`);

    } catch (error) {
      console.error('❌ Failed to seed data:', error);
      throw error;
    }
  }

  async regenerateSeedData() {
    console.log('🗑️ Clearing existing data...');
    
    await Promise.all([
      supabase.from('boards').delete().neq('id', ''),
      supabase.from('pro_users').delete().neq('id', ''),
      supabase.from('bookings').delete().neq('id', ''),
      supabase.from('regular_users').delete().neq('id', '')
    ]);

    console.log('🌱 Regenerating seed data...');
    await this.seedInitialData();

    return {
      success: true,
      message: 'Seed data regenerated successfully'
    };
  }

  // Stats for admin
  async getStats() {
    const [boardsResult, bookingsResult, regularUsersResult, proUsersResult] = await Promise.all([
      supabase.from('boards').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*'),
      supabase.from('regular_users').select('*', { count: 'exact', head: true }),
      supabase.from('pro_users').select('*', { count: 'exact', head: true })
    ]);
    
    // Calculate revenue from booking data
    const bookings: Booking[] = bookingsResult.data || [];
    const now = new Date();
    const revenueThisMonth = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      totalBoards: boardsResult.count || 0,
      totalProUsers: proUsersResult.count || 0,
      totalRegularUsers: regularUsersResult.count || 0,
      totalBookings: bookings.length,
      totalMessages: 0, // Not implemented
      totalConversations: 0, // Not implemented
      revenueThisMonth
    };
  }
}

// Export singleton instance
export const supabaseDb = new SupabaseDatabase();
export default supabaseDb;