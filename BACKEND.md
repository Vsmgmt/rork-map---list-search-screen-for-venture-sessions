# Backend Documentation

## Overview

Your app now has a fully functional backend using:
- **Hono** - Fast web framework for the API server
- **tRPC** - Type-safe API layer
- **In-Memory Database** - Simple database that can be easily scaled

## Database Structure

The in-memory database (`backend/db/memory-db.ts`) stores:
- **Boards** - All surfboard listings with filters and search
- **Pro Users** - Professional users who rent out boards
- **Bookings** - Rental bookings and transactions
- **Messages** - Chat conversations between users
- **Extras** - Additional rental items (wetsuits, leashes, etc.)

## API Endpoints

All endpoints are available via tRPC at `/api/trpc/`:

### Boards
- `trpc.boards.getAll.useQuery(filters)` - Get boards with optional filters
- `trpc.boards.getById.useQuery({ id })` - Get specific board

### Bookings
- `trpc.bookings.create.useMutation()` - Create new booking
- `trpc.bookings.getAll.useQuery({ userId? })` - Get bookings
- `trpc.bookings.getById.useQuery({ id })` - Get specific booking
- `trpc.bookings.update.useMutation()` - Update booking status

### Messages
- `trpc.messages.getConversations.useQuery({ userId })` - Get user conversations
- `trpc.messages.getMessages.useQuery({ conversationId })` - Get messages
- `trpc.messages.send.useMutation()` - Send message
- `trpc.messages.createConversation.useMutation()` - Start conversation
- `trpc.messages.markAsRead.useMutation()` - Mark as read

### Admin
- `trpc.admin.getStats.useQuery()` - Get platform statistics
- `trpc.admin.getProUsers.useQuery()` - Get all pro users
- `trpc.admin.getProUserById.useQuery({ id })` - Get specific pro user
- `trpc.admin.getExtras.useQuery()` - Get rental extras

## Usage Examples

### Basic Board Search
```tsx
import { trpc } from '@/lib/trpc';

function BoardsList() {
  const boardsQuery = trpc.boards.getAll.useQuery({
    location: 'Honolulu',
    type: 'shortboard',
    search: 'Channel Islands'
  });

  if (boardsQuery.isLoading) return <Text>Loading...</Text>;
  if (boardsQuery.error) return <Text>Error: {boardsQuery.error.message}</Text>;

  return (
    <View>
      {boardsQuery.data?.map(board => (
        <Text key={board.id}>{board.short_name}</Text>
      ))}
    </View>
  );
}
```

### Creating a Booking
```tsx
const createBooking = trpc.bookings.create.useMutation({
  onSuccess: (booking) => {
    console.log('Booking created:', booking.confirmationNumber);
  }
});

const handleBooking = () => {
  createBooking.mutate({
    customerInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      pickupTime: '10:00 AM',
      returnTime: '5:00 PM'
    },
    orderItems: [/* cart items */],
    totalAmount: 150
  });
};
```

## Testing the Backend

Visit `/backend-test` in your app to see the backend in action. This page shows:
- Live data from all endpoints
- Real-time loading states
- Error handling
- Refresh functionality

## Scaling to Production

This in-memory database is perfect for development and can easily be scaled:

1. **SQLite** - Replace memory-db with SQLite for persistence
2. **PostgreSQL** - Use Prisma + PostgreSQL for production
3. **Supabase** - Quick setup with real-time features
4. **Firebase** - Google's backend-as-a-service

The tRPC routes will remain the same - just update the database layer!

## Data Initialization

The database automatically loads:
- 100 surfboards from seed data
- 12 pro users from different locations
- 4 rental extras (wetsuit, leash, wax, fins)

All data is generated with realistic:
- Prices and dimensions
- Geographic locations
- High-quality board images
- Professional user profiles