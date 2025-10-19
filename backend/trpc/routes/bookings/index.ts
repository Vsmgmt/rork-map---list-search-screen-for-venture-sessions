import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db/memory-db';

const checkoutInfoSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  pickupTime: z.string(),
  returnTime: z.string(),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
});

const cartExtraSchema = z.object({
  extra: z.object({
    id: z.string(),
    name: z.string(),
    pricePerDay: z.number(),
    pricePerWeek: z.number(),
    description: z.string().optional(),
  }),
  quantity: z.number(),
  totalPrice: z.number(),
  size: z.string().optional(),
});

const cartItemSchema = z.object({
  board: z.any().optional(),
  session: z.any().optional(),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number(),
  totalPrice: z.number(),
  rentalType: z.enum(['daily', 'weekly']).optional(),
  deliverySelected: z.boolean().optional(),
  deliveryPrice: z.number().optional(),
  extras: z.array(cartExtraSchema).optional(),
  bookingTime: z.string().optional(),
  participants: z.number().optional(),
});

export const createBookingRoute = publicProcedure
  .input(z.object({
    customerInfo: checkoutInfoSchema,
    orderItems: z.array(cartItemSchema),
    totalAmount: z.number(),
    status: z.enum(['confirmed', 'in-progress', 'completed', 'cancelled']).default('confirmed'),
  }))
  .mutation(({ input }) => {
    console.log('Creating booking:', input);
    const bookingData = {
      customerInfo: input.customerInfo,
      orderItems: input.orderItems.map((item: any) => ({
        ...item,
        board: item.board || {},
        rentalType: item.rentalType || 'daily',
        deliverySelected: item.deliverySelected || false,
        deliveryPrice: item.deliveryPrice || 0,
        extras: item.extras || [],
      })) as any,
      totalAmount: input.totalAmount,
      status: input.status,
    };
    return db.addBooking(bookingData);
  });

export const getBookingsRoute = publicProcedure
  .input(z.object({
    userId: z.string().optional(),
  }).optional())
  .query(({ input }) => {
    console.log('Getting bookings for user:', input?.userId);
    return db.getBookings(input?.userId);
  });

export const getBookingByIdRoute = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .query(({ input }) => {
    console.log('Getting booking by ID:', input.id);
    const booking = db.getBookingById(input.id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  });

export const updateBookingRoute = publicProcedure
  .input(z.object({
    id: z.string(),
    status: z.enum(['confirmed', 'in-progress', 'completed', 'cancelled']).optional(),
  }))
  .mutation(({ input }) => {
    console.log('Updating booking:', input);
    const { id, ...updates } = input;
    const booking = db.updateBooking(id, updates);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  });

export const exportAllBookingsRoute = publicProcedure
  .query(() => {
    console.log('Exporting all bookings');
    const bookings = db.getBookings();
    const exportData = {
      exportDate: new Date().toISOString(),
      totalBookings: bookings.length,
      bookings: bookings.map(booking => ({
        id: booking.id,
        confirmationNumber: booking.confirmationNumber,
        bookingDate: booking.bookingDate,
        status: booking.status,
        customerInfo: booking.customerInfo,
        orderItems: booking.orderItems.map(item => ({
          boardId: item.board?.id,
          boardName: item.board?.short_name,
          boardType: item.board?.type,
          location: item.board?.location,
          sessionId: item.session?.id,
          sessionName: item.session?.name,
          sessionType: item.session?.type,
          startDate: item.startDate,
          endDate: item.endDate,
          days: item.days,
          totalPrice: item.totalPrice,
          rentalType: item.rentalType,
          deliverySelected: item.deliverySelected,
          deliveryPrice: item.deliveryPrice,
          bookingTime: item.bookingTime,
          participants: item.participants,
          extras: item.extras
        })),
        totalAmount: booking.totalAmount
      }))
    };
    return exportData;
  });