import { Board, ProUser, Booking, Extra } from '@/src/types/board';
import { Message, Conversation } from '@/src/types/message';
import { getBoards, getProUsers } from '@/src/data/seed';

// Regular user type
export interface RegularUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinedDate: string;
  avatarUrl: string;
  type: 'regular';
}

// In-memory database (web-compatible)
class MemoryDatabase {
  private boards: Board[] = [];
  private proUsers: ProUser[] = [];
  private regularUsers: RegularUser[] = [];
  private bookings: Booking[] = [];
  private messages: Message[] = [];
  private conversations: Conversation[] = [];
  private extras: Extra[] = [];
  private initialized = false;

  constructor() {
    console.log('💾 Initializing MemoryDatabase...');
    try {
      this.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize memory database:', error);
      // Continue with empty data if initialization fails
      this.initialized = true;
    }
  }

  // Web-compatible persistence using localStorage (if available)
  private loadFromStorage<T>(collection: string, defaultValue: T[] = []): T[] {
    try {
      // Only use localStorage in browser environment, not in server/worker environment
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(`surfboard_db_${collection}`);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Loaded ${parsed.length} items from localStorage:${collection}`);
          return parsed;
        }
      }
    } catch (error) {
      console.error(`Error loading ${collection} from localStorage:`, error);
    }
    return defaultValue;
  }

  private saveToStorage<T>(collection: string, data: T[]) {
    try {
      // Only use localStorage in browser environment, not in server/worker environment
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && window.localStorage) {
        localStorage.setItem(`surfboard_db_${collection}`, JSON.stringify(data));
        console.log(`Saved ${data.length} items to localStorage:${collection}`);
      }
    } catch (error) {
      console.error(`Error saving ${collection} to localStorage:`, error);
    }
  }

  private saveAll() {
    this.saveToStorage('boards', this.boards);
    this.saveToStorage('proUsers', this.proUsers);
    this.saveToStorage('regularUsers', this.regularUsers);
    this.saveToStorage('bookings', this.bookings);
    this.saveToStorage('messages', this.messages);
    this.saveToStorage('conversations', this.conversations);
    this.saveToStorage('extras', this.extras);
  }

  private initialize() {
    if (this.initialized) return;
    
    console.log('Initializing web-compatible in-memory database...');
    
    // Try to load existing data from localStorage first
    this.boards = this.loadFromStorage<Board>('boards');
    this.proUsers = this.loadFromStorage<ProUser>('proUsers');
    this.regularUsers = this.loadFromStorage<RegularUser>('regularUsers');
    this.bookings = this.loadFromStorage<Booking>('bookings');
    this.messages = this.loadFromStorage<Message>('messages');
    this.conversations = this.loadFromStorage<Conversation>('conversations');
    this.extras = this.loadFromStorage<Extra>('extras');
    
    // If no data exists, load seed data
    if (this.boards.length === 0) {
      console.log('No existing boards found, loading seed data...');
      this.boards = getBoards(100);
      this.saveToStorage('boards', this.boards);
    }
    
    if (this.proUsers.length === 0) {
      console.log('No existing pro users found, loading seed data...');
      this.proUsers = getProUsers();
      this.saveToStorage('proUsers', this.proUsers);
    }
    
    // Initialize some sample regular users if none exist
    if (this.regularUsers.length === 0) {
      console.log('No existing regular users found, creating sample users...');
      this.regularUsers = [
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
      this.saveToStorage('regularUsers', this.regularUsers);
    }
    
    // Initialize extras if none exist
    if (this.extras.length === 0) {
      console.log('No existing extras found, creating default extras...');
      this.extras = [
        {
          id: 'extra-1',
          name: 'Wetsuit',
          pricePerDay: 15,
          pricePerWeek: 75,
          description: 'Full wetsuit for cold water surfing'
        },
        {
          id: 'extra-2',
          name: 'Leash',
          pricePerDay: 5,
          pricePerWeek: 25,
          description: 'Surfboard leash for safety'
        },
        {
          id: 'extra-3',
          name: 'Wax',
          pricePerDay: 3,
          pricePerWeek: 15,
          description: 'Surf wax for better grip'
        },
        {
          id: 'extra-4',
          name: 'Fins',
          pricePerDay: 10,
          pricePerWeek: 50,
          description: 'Replacement fins for your board'
        }
      ];
      this.saveToStorage('extras', this.extras);
    }
    
    this.initialized = true;
    console.log(`Database initialized with ${this.boards.length} boards, ${this.proUsers.length} pro users, ${this.regularUsers.length} regular users, ${this.extras.length} extras, ${this.bookings.length} bookings, ${this.conversations.length} conversations`);
    
    // Set up periodic save for web environments
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Save data periodically in web environment
      setInterval(() => {
        this.saveAll();
      }, 30000); // Save every 30 seconds
      
      // Save on page unload
      window.addEventListener('beforeunload', () => {
        this.saveAll();
      });
    }
  }

  // Boards
  getBoards(filters?: {
    location?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Board[] {
    let filteredBoards = [...this.boards];

    if (filters) {
      if (filters.location) {
        filteredBoards = filteredBoards.filter(board => 
          board.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      if (filters.type) {
        filteredBoards = filteredBoards.filter(board => board.type === filters.type);
      }

      if (filters.minPrice !== undefined) {
        filteredBoards = filteredBoards.filter(board => 
          (board.price_per_day || 0) >= filters.minPrice!
        );
      }

      if (filters.maxPrice !== undefined) {
        filteredBoards = filteredBoards.filter(board => 
          (board.price_per_day || 0) <= filters.maxPrice!
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredBoards = filteredBoards.filter(board => 
          board.short_name.toLowerCase().includes(searchTerm) ||
          board.location.toLowerCase().includes(searchTerm) ||
          board.type.toLowerCase().includes(searchTerm)
        );
      }

      // Date availability filtering would go here
      // For now, we'll assume all boards are available
    }

    return filteredBoards;
  }

  getBoardById(id: string): Board | undefined {
    return this.boards.find(board => board.id === id);
  }

  addBoard(board: Omit<Board, 'id'>): Board {
    const newBoard: Board = {
      ...board,
      id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.boards.push(newBoard);
    this.saveToStorage('boards', this.boards);
    return newBoard;
  }

  updateBoard(id: string, updates: Partial<Board>): Board | null {
    const index = this.boards.findIndex(board => board.id === id);
    if (index === -1) return null;
    
    this.boards[index] = { ...this.boards[index], ...updates };
    this.saveToStorage('boards', this.boards);
    return this.boards[index];
  }

  deleteBoard(id: string): boolean {
    const index = this.boards.findIndex(board => board.id === id);
    if (index === -1) return false;
    
    this.boards.splice(index, 1);
    this.saveToStorage('boards', this.boards);
    return true;
  }

  // Pro Users
  getProUsers(): ProUser[] {
    return [...this.proUsers];
  }

  getProUserById(id: string): ProUser | undefined {
    return this.proUsers.find(user => user.id === id);
  }

  addProUser(user: Omit<ProUser, 'id'>): ProUser {
    const newUser: ProUser = {
      ...user,
      id: `pro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.proUsers.push(newUser);
    this.saveToStorage('proUsers', this.proUsers);
    return newUser;
  }

  updateUser(userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    avatarUrl?: string;
  }): ProUser | null {
    console.log('🔄 updateUser called with:', { userId, updates });
    
    const userIndex = this.proUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      console.error('❌ User not found with ID:', userId);
      console.log('📋 Available pro users:', this.proUsers.map(u => ({ id: u.id, name: u.name })));
      return null;
    }
    
    console.log('✅ Found user at index:', userIndex, 'Current user:', this.proUsers[userIndex]);
    
    // Update the user
    const oldUser = { ...this.proUsers[userIndex] };
    this.proUsers[userIndex] = { ...this.proUsers[userIndex], ...updates };
    
    console.log('🔄 User updated from:', oldUser, 'to:', this.proUsers[userIndex]);
    
    // Update all boards owned by this user
    let boardsUpdated = 0;
    this.boards.forEach((board, boardIndex) => {
      if (board.owner.id === userId) {
        this.boards[boardIndex] = {
          ...board,
          owner: {
            ...board.owner,
            ...updates
          }
        };
        boardsUpdated++;
      }
    });
    
    console.log(`🏄 Updated ${boardsUpdated} boards owned by user ${userId}`);
    
    // Update conversation participant details
    let conversationsUpdated = 0;
    this.conversations.forEach((conversation, convIndex) => {
      const participantIndex = conversation.participantDetails?.findIndex(p => p.id === userId);
      if (participantIndex !== undefined && participantIndex !== -1 && conversation.participantDetails) {
        conversation.participantDetails[participantIndex] = {
          ...conversation.participantDetails[participantIndex],
          name: updates.name || conversation.participantDetails[participantIndex].name,
          avatarUrl: updates.avatarUrl || conversation.participantDetails[participantIndex].avatarUrl
        };
        conversationsUpdated++;
      }
    });
    
    console.log(`💬 Updated ${conversationsUpdated} conversations for user ${userId}`);
    
    // Save user data immediately for critical updates
    console.log('💾 Saving user data immediately...');
    this.saveToStorage('proUsers', this.proUsers);
    this.saveToStorage('boards', this.boards);
    this.saveToStorage('conversations', this.conversations);
    
    console.log('✅ User update completed successfully');
    return this.proUsers[userIndex];
  }

  // Bookings
  getBookings(userId?: string): Booking[] {
    if (userId) {
      return this.bookings.filter(booking => 
        booking.customerInfo.email === userId || // Simple user matching
        booking.orderItems.some((item: any) => item.board.owner.id === userId)
      );
    }
    return [...this.bookings];
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookings.find(booking => booking.id === id);
  }

  addBooking(booking: Omit<Booking, 'id' | 'confirmationNumber' | 'bookingDate'>): Booking {
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      confirmationNumber: `SURF${Date.now().toString().slice(-6)}`,
      bookingDate: new Date().toISOString()
    };
    this.bookings.push(newBooking);
    this.saveToStorage('bookings', this.bookings);
    return newBooking;
  }

  updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    const index = this.bookings.findIndex(booking => booking.id === id);
    if (index === -1) return null;
    
    this.bookings[index] = { ...this.bookings[index], ...updates };
    this.saveToStorage('bookings', this.bookings);
    return this.bookings[index];
  }

  // Messages
  getConversations(userId: string): Conversation[] {
    return this.conversations.filter(conv => 
      conv.participants.includes(userId)
    );
  }

  getConversationById(id: string): Conversation | undefined {
    return this.conversations.find(conv => conv.id === id);
  }

  getMessages(conversationId: string): Message[] {
    return this.messages.filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    this.messages.push(newMessage);
    
    // Update conversation last message
    const conversation = this.conversations.find(conv => conv.id === message.conversationId);
    if (conversation) {
      conversation.lastMessage = newMessage;
      conversation.lastActivity = newMessage.timestamp;
      conversation.unreadCount += 1;
    }
    
    this.saveToStorage('messages', this.messages);
    this.saveToStorage('conversations', this.conversations);
    return newMessage;
  }

  createConversation(participants: string[]): Conversation {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants,
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      participantDetails: participants.map(id => {
        const proUser = this.getProUserById(id);
        return {
          id,
          name: proUser?.name || 'User',
          avatarUrl: proUser?.avatarUrl || '',
          type: proUser ? 'pro' : 'regular'
        };
      })
    };
    this.conversations.push(newConversation);
    this.saveToStorage('conversations', this.conversations);
    return newConversation;
  }

  markConversationAsRead(conversationId: string): void {
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
    }
    
    // Mark all messages in conversation as read
    this.messages.forEach(msg => {
      if (msg.conversationId === conversationId) {
        msg.read = true;
      }
    });
    
    this.saveToStorage('conversations', this.conversations);
    this.saveToStorage('messages', this.messages);
  }

  // Extras
  getExtras(): Extra[] {
    return [...this.extras];
  }

  getExtraById(id: string): Extra | undefined {
    return this.extras.find(extra => extra.id === id);
  }

  // Regular Users
  getAllRegularUsers(): RegularUser[] {
    return [...this.regularUsers];
  }

  getRegularUserById(id: string): RegularUser | undefined {
    return this.regularUsers.find(user => user.id === id);
  }

  createRegularUser(userData: Omit<RegularUser, 'id' | 'type' | 'joinedDate' | 'avatarUrl'> & { avatarUrl?: string }): RegularUser {
    const newUser: RegularUser = {
      ...userData,
      id: `regular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'regular',
      joinedDate: new Date().toISOString(),
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    };
    this.regularUsers.push(newUser);
    this.saveToStorage('regularUsers', this.regularUsers);
    return newUser;
  }

  updateRegularUser(id: string, updates: Partial<Omit<RegularUser, 'id' | 'type'>>): RegularUser | null {
    const index = this.regularUsers.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    this.regularUsers[index] = { ...this.regularUsers[index], ...updates };
    this.saveToStorage('regularUsers', this.regularUsers);
    return this.regularUsers[index];
  }

  deleteRegularUser(id: string): boolean {
    const index = this.regularUsers.findIndex(user => user.id === id);
    if (index === -1) return false;
    
    this.regularUsers.splice(index, 1);
    this.saveToStorage('regularUsers', this.regularUsers);
    return true;
  }

  // User stats for admin
  getUserStats() {
    return {
      totalRegularUsers: this.regularUsers.length,
      totalProUsers: this.proUsers.length,
      totalUsers: this.regularUsers.length + this.proUsers.length,
      newUsersThisMonth: {
        regular: this.regularUsers.filter(user => {
          const joinDate = new Date(user.joinedDate);
          const now = new Date();
          return joinDate.getMonth() === now.getMonth() && 
                 joinDate.getFullYear() === now.getFullYear();
        }).length,
        pro: this.proUsers.filter(user => {
          const joinDate = new Date(user.joinedDate);
          const now = new Date();
          return joinDate.getMonth() === now.getMonth() && 
                 joinDate.getFullYear() === now.getFullYear();
        }).length
      }
    };
  }

  // Stats for admin
  getStats() {
    return {
      totalBoards: this.boards.length,
      totalProUsers: this.proUsers.length,
      totalRegularUsers: this.regularUsers.length,
      totalBookings: this.bookings.length,
      totalMessages: this.messages.length,
      totalConversations: this.conversations.length,
      revenueThisMonth: this.bookings
        .filter(booking => {
          const bookingDate = new Date(booking.bookingDate);
          const now = new Date();
          return bookingDate.getMonth() === now.getMonth() && 
                 bookingDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, booking) => sum + booking.totalAmount, 0)
    };
  }

  // Regenerate seed data
  regenerateSeedData() {
    console.log('🔄 Regenerating seed data...');
    
    // Clear existing data
    this.boards = [];
    this.proUsers = [];
    this.regularUsers = [];
    this.bookings = [];
    this.messages = [];
    this.conversations = [];
    
    // Load fresh seed data
    console.log('📦 Loading fresh boards and pro users...');
    this.boards = getBoards(100);
    this.proUsers = getProUsers();
    
    // Recreate extras
    console.log('🏄 Creating extras...');
    this.extras = [
      {
        id: 'extra-1',
        name: 'Wetsuit',
        pricePerDay: 15,
        pricePerWeek: 75,
        description: 'Full wetsuit for cold water surfing'
      },
      {
        id: 'extra-2',
        name: 'Leash',
        pricePerDay: 5,
        pricePerWeek: 25,
        description: 'Surfboard leash for safety'
      },
      {
        id: 'extra-3',
        name: 'Wax',
        pricePerDay: 3,
        pricePerWeek: 15,
        description: 'Surf wax for better grip'
      },
      {
        id: 'extra-4',
        name: 'Fins',
        pricePerDay: 10,
        pricePerWeek: 50,
        description: 'Replacement fins for your board'
      }
    ];
    
    // Generate some sample bookings
    console.log('📅 Creating sample bookings...');
    this.generateSampleBookings();
    
    // Generate some sample conversations
    console.log('💬 Creating sample conversations...');
    this.generateSampleConversations();
    
    // Save all data
    console.log('💾 Saving all data to files...');
    this.saveAll();
    
    console.log(`✅ Regenerated seed data: ${this.boards.length} boards, ${this.proUsers.length} pro users, ${this.regularUsers.length} regular users, ${this.extras.length} extras, ${this.bookings.length} bookings, ${this.conversations.length} conversations`);
    
    return {
      boards: this.boards.length,
      proUsers: this.proUsers.length,
      regularUsers: this.regularUsers.length,
      bookings: this.bookings.length,
      messages: this.messages.length,
      conversations: this.conversations.length,
      extras: this.extras.length
    };
  }

  // Initialize data immediately
  initializeData() {
    console.log('🚀 Initializing database with fresh data...');
    return this.regenerateSeedData();
  }

  // Generate sample bookings for demo purposes
  private generateSampleBookings() {
    const sampleBookings = [
      {
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          pickupTime: '09:00',
          returnTime: '17:00',
          notes: 'First time surfer, need beginner board'
        },
        orderItems: [{
          board: this.boards[0],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          days: 3,
          totalPrice: this.boards[0]?.price_per_day ? this.boards[0].price_per_day * 3 : 150,
          rentalType: 'daily' as const,
          deliverySelected: false,
          deliveryPrice: 0,
          extras: []
        }],
        totalAmount: this.boards[0]?.price_per_day ? this.boards[0].price_per_day * 3 : 150,
        status: 'confirmed' as const
      },
      {
        customerInfo: {
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@example.com',
          phone: '+1-555-0456',
          pickupTime: '08:00',
          returnTime: '18:00',
          notes: 'Weekly rental for surf camp'
        },
        orderItems: [{
          board: this.boards[1],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          days: 7,
          totalPrice: this.boards[1]?.price_per_week || 300,
          rentalType: 'weekly' as const,
          deliverySelected: true,
          deliveryPrice: 50,
          extras: [{
            extra: this.extras[0],
            quantity: 1,
            totalPrice: this.extras[0].pricePerWeek,
            size: 'M'
          }]
        }],
        totalAmount: (this.boards[1]?.price_per_week || 300) + 50 + this.extras[0].pricePerWeek,
        status: 'in-progress' as const
      },
      {
        customerInfo: {
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@example.com',
          phone: '+1-555-0789',
          pickupTime: '10:00',
          returnTime: '16:00',
          notes: 'Advanced surfer, need high performance board'
        },
        orderItems: [{
          board: this.boards[2],
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          days: 3,
          totalPrice: this.boards[2]?.price_per_day ? this.boards[2].price_per_day * 3 : 120,
          rentalType: 'daily' as const,
          deliverySelected: false,
          deliveryPrice: 0,
          extras: []
        }],
        totalAmount: this.boards[2]?.price_per_day ? this.boards[2].price_per_day * 3 : 120,
        status: 'completed' as const
      }
    ];

    sampleBookings.forEach(booking => {
      this.addBooking(booking);
    });
  }

  // Generate sample conversations for demo purposes
  private generateSampleConversations() {
    if (this.proUsers.length < 2) return;

    const conversation1 = this.createConversation([this.proUsers[0].id, 'customer-1']);
    const conversation2 = this.createConversation([this.proUsers[1].id, 'customer-2']);
    
    // Add some sample messages
    this.addMessage({
      conversationId: conversation1.id,
      senderId: 'customer-1',
      receiverId: this.proUsers[0].id,
      content: 'Hi! I am interested in renting a longboard for this weekend. Do you have any available?',
      type: 'text',
      read: false
    });

    this.addMessage({
      conversationId: conversation1.id,
      senderId: this.proUsers[0].id,
      receiverId: 'customer-1',
      content: 'Hello! Yes, I have several longboards available. What is your experience level?',
      type: 'text',
      read: true
    });

    this.addMessage({
      conversationId: conversation2.id,
      senderId: 'customer-2',
      receiverId: this.proUsers[1].id,
      content: 'Do you offer delivery to the beach?',
      type: 'text',
      read: false
    });
  }
}

// Export singleton instance
console.log('📦 Creating MemoryDatabase singleton...');
export const db = new MemoryDatabase();

console.log('✅ MemoryDatabase singleton created and exported');
export default db;