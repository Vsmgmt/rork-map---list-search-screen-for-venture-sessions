import { supabase } from './supabase';

export interface DebugResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

export class SupabaseDebugger {
  private results: DebugResult[] = [];

  private addResult(test: string, success: boolean, data?: any, error?: any, details?: string) {
    this.results.push({
      test,
      success,
      data: success ? data : undefined,
      error: error?.message || error?.toString() || (success ? undefined : 'Unknown error'),
      details
    });
  }

  async testConnection(): Promise<DebugResult> {
    try {
      const { data, error } = await supabase.from('boards_public').select('count').limit(1);
      if (error) throw error;
      this.addResult('Connection Test', true, data, null, 'Successfully connected to Supabase');
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Connection Test', false, null, error, 'Failed to connect to Supabase');
      return this.results[this.results.length - 1];
    }
  }

  async testBoardsPublic(): Promise<DebugResult> {
    try {
      const { data, error } = await supabase
        .from('boards_public')
        .select('id, title, description, price, category, location, image_url, available, created_at')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Boards Public View', true, data, null, `Found ${data?.length || 0} boards`);
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Boards Public View', false, null, error, 'Failed to fetch from boards_public view');
      return this.results[this.results.length - 1];
    }
  }

  async testBoardsInsert(): Promise<DebugResult> {
    try {
      const testBoard = {
        title: 'Debug Test Board',
        description: 'This is a test board created by the debugger',
        price: 99.99,
        category: 'longboard',
        location: 'Test Location',
        image_url: 'https://example.com/test.jpg',
        available: true
      };

      const { data, error } = await supabase
        .from('boards')
        .insert(testBoard)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clean up - delete the test board
      await supabase.from('boards').delete().eq('id', data.id);
      
      this.addResult('Board Insert Test', true, data, null, 'Successfully inserted and deleted test board');
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Board Insert Test', false, null, error, 'Failed to insert test board');
      return this.results[this.results.length - 1];
    }
  }

  async testUsersTable(): Promise<DebugResult> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, is_pro, created_at')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Users Table', true, data, null, `Found ${data?.length || 0} users`);
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Users Table', false, null, error, 'Failed to fetch from users table');
      return this.results[this.results.length - 1];
    }
  }

  async testBookingsTable(): Promise<DebugResult> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, board_id, user_id, start_date, end_date, total_price, status, created_at')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Bookings Table', true, data, null, `Found ${data?.length || 0} bookings`);
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Bookings Table', false, null, error, 'Failed to fetch from bookings table');
      return this.results[this.results.length - 1];
    }
  }

  async testMessagesTable(): Promise<DebugResult> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, created_at, read')
        .limit(5);
      
      if (error) throw error;
      this.addResult('Messages Table', true, data, null, `Found ${data?.length || 0} messages`);
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Messages Table', false, null, error, 'Failed to fetch from messages table');
      return this.results[this.results.length - 1];
    }
  }

  async testUserInsert(): Promise<DebugResult> {
    try {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        name: 'Debug Test User',
        is_pro: false
      };

      const { data, error } = await supabase
        .from('users')
        .insert(testUser)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clean up - delete the test user
      await supabase.from('users').delete().eq('id', data.id);
      
      this.addResult('User Insert Test', true, data, null, 'Successfully inserted and deleted test user');
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('User Insert Test', false, null, error, 'Failed to insert test user');
      return this.results[this.results.length - 1];
    }
  }

  async testBookingInsert(): Promise<DebugResult> {
    try {
      // First, get a board and user to test with
      const { data: boards } = await supabase.from('boards_public').select('id').limit(1);
      const { data: users } = await supabase.from('users').select('id').limit(1);
      
      if (!boards?.length || !users?.length) {
        throw new Error('Need at least one board and one user to test booking insert');
      }

      const testBooking = {
        board_id: boards[0].id,
        user_id: users[0].id,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        total_price: 50.00,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(testBooking)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clean up - delete the test booking
      await supabase.from('bookings').delete().eq('id', data.id);
      
      this.addResult('Booking Insert Test', true, data, null, 'Successfully inserted and deleted test booking');
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Booking Insert Test', false, null, error, 'Failed to insert test booking');
      return this.results[this.results.length - 1];
    }
  }

  async testMessageInsert(): Promise<DebugResult> {
    try {
      // Get two users to test messaging
      const { data: users } = await supabase.from('users').select('id').limit(2);
      
      if (!users?.length || users.length < 2) {
        throw new Error('Need at least two users to test message insert');
      }

      const testMessage = {
        sender_id: users[0].id,
        recipient_id: users[1].id,
        content: 'This is a debug test message',
        read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(testMessage)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clean up - delete the test message
      await supabase.from('messages').delete().eq('id', data.id);
      
      this.addResult('Message Insert Test', true, data, null, 'Successfully inserted and deleted test message');
      return this.results[this.results.length - 1];
    } catch (error) {
      this.addResult('Message Insert Test', false, null, error, 'Failed to insert test message');
      return this.results[this.results.length - 1];
    }
  }

  async runAllTests(): Promise<DebugResult[]> {
    this.results = [];
    
    console.log('🧪 Starting Supabase debug tests...');
    
    await this.testConnection();
    await this.testBoardsPublic();
    await this.testUsersTable();
    await this.testBookingsTable();
    await this.testMessagesTable();
    await this.testBoardsInsert();
    await this.testUserInsert();
    await this.testBookingInsert();
    await this.testMessageInsert();
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`✅ Tests completed: ${passed}/${total} passed`);
    
    return this.results;
  }

  getResults(): DebugResult[] {
    return this.results;
  }

  getSummary(): { passed: number; failed: number; total: number } {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    return { passed, failed, total: this.results.length };
  }
}

export const supabaseDebugger = new SupabaseDebugger();