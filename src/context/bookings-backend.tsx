import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Booking, CartItem, CheckoutInfo } from '@/src/types/board';
import { trpc } from '@/lib/trpc';
import { useBookings } from '@/src/context/bookings';

export const [BookingsBackendProvider, useBookingsBackendInternal] = createContextHook(() => {
  const [backendAvailable, setBackendAvailable] = useState(true);
  
  // Get local bookings as fallback
  const localBookings = useBookings();
  
  // Use tRPC to fetch bookings
  const bookingsQuery = trpc.bookings.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
    enabled: backendAvailable,
    retry: (failureCount: number, error: any) => {
      const errorMsg = error?.message || '';
      console.log('tRPC bookings query error:', errorMsg);
      if (errorMsg.includes('fetch') || 
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('Network error') ||
          errorMsg.includes('timeout') ||
          errorMsg.includes('404') ||
          errorMsg.includes('Not Found')) {
        console.log('Backend not available, using local bookings fallback');
        setBackendAvailable(false);
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Create booking mutation
  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: () => {
      console.log('Booking created successfully in backend');
      bookingsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to create booking in backend:', error);
    },
  });

  // Update booking mutation
  const updateBookingMutation = trpc.bookings.update.useMutation({
    onSuccess: () => {
      console.log('Booking updated successfully in backend');
      bookingsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to update booking in backend:', error);
    },
  });

  const addBooking = useCallback(async (customerInfo: CheckoutInfo, orderItems: CartItem[], totalAmount: number, confirmationNumber: string): Promise<Booking> => {
    if (backendAvailable) {
      try {
        const booking = await createBookingMutation.mutateAsync({
          customerInfo,
          orderItems,
          totalAmount,
          status: 'confirmed',
        });
        console.log('Booking created in backend:', booking);
        return booking;
      } catch (error) {
        console.error('Backend booking creation failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local booking creation
    console.log('Creating booking locally');
    return localBookings.addBooking(customerInfo, orderItems, totalAmount, confirmationNumber);
  }, [backendAvailable, createBookingMutation, localBookings]);

  const updateBookingStatus = useCallback(async (bookingId: string, status: Booking['status']) => {
    if (backendAvailable) {
      try {
        await updateBookingMutation.mutateAsync({ id: bookingId, status });
        console.log('Booking status updated in backend');
        return;
      } catch (error) {
        console.error('Backend booking update failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local booking update
    console.log('Updating booking status locally');
    localBookings.updateBookingStatus(bookingId, status);
  }, [backendAvailable, updateBookingMutation, localBookings]);

  const getBookingByConfirmation = useCallback((confirmationNumber: string): Booking | undefined => {
    const bookings = backendAvailable && bookingsQuery.data ? bookingsQuery.data : localBookings.bookings;
    return bookings.find(booking => booking.confirmationNumber === confirmationNumber);
  }, [backendAvailable, bookingsQuery.data, localBookings.bookings]);

  const getBookingsByStatus = useCallback((status: Booking['status']): Booking[] => {
    const bookings = backendAvailable && bookingsQuery.data ? bookingsQuery.data : localBookings.bookings;
    return bookings.filter(booking => booking.status === status);
  }, [backendAvailable, bookingsQuery.data, localBookings.bookings]);

  const getTotalRevenue = useCallback((): number => {
    const bookings = backendAvailable && bookingsQuery.data ? bookingsQuery.data : localBookings.bookings;
    return bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  }, [backendAvailable, bookingsQuery.data, localBookings.bookings]);

  const getBookingsCount = useCallback((): number => {
    const bookings = backendAvailable && bookingsQuery.data ? bookingsQuery.data : localBookings.bookings;
    return bookings.length;
  }, [backendAvailable, bookingsQuery.data, localBookings.bookings]);

  const refetchBookings = useCallback(() => {
    console.log('Refetching bookings');
    return bookingsQuery.refetch();
  }, [bookingsQuery]);

  const contextValue = useMemo(() => {
    const bookings = backendAvailable && bookingsQuery.data ? bookingsQuery.data : localBookings.bookings;
    const isLoading = backendAvailable ? bookingsQuery.isLoading : localBookings.isLoading;
    
    return {
      bookings,
      isLoading,
      addBooking,
      updateBookingStatus,
      getBookingByConfirmation,
      getBookingsByStatus,
      getTotalRevenue,
      getBookingsCount,
      refetchBookings,
      backendAvailable,
    };
  }, [
    backendAvailable,
    bookingsQuery.data,
    bookingsQuery.isLoading,
    localBookings.bookings,
    localBookings.isLoading,
    addBooking,
    updateBookingStatus,
    getBookingByConfirmation,
    getBookingsByStatus,
    getTotalRevenue,
    getBookingsCount,
    refetchBookings,
  ]);

  console.log('BookingsBackend context value:', {
    bookingsCount: contextValue.bookings.length,
    isLoading: contextValue.isLoading,
    backendAvailable: contextValue.backendAvailable
  });

  return contextValue;
});

// Safe wrapper that ensures the context is always available
export function useBookingsBackend() {
  const localBookings = useBookings();
  
  const createFallbackContext = () => ({
    bookings: localBookings.bookings,
    isLoading: localBookings.isLoading,
    addBooking: localBookings.addBooking,
    updateBookingStatus: localBookings.updateBookingStatus,
    getBookingByConfirmation: localBookings.getBookingByConfirmation,
    getBookingsByStatus: localBookings.getBookingsByStatus,
    getTotalRevenue: localBookings.getTotalRevenue,
    getBookingsCount: localBookings.getBookingsCount,
    refetchBookings: () => Promise.resolve({ data: localBookings.bookings }),
    backendAvailable: false,
  });
  
  try {
    const context = useBookingsBackendInternal();
    if (!context) {
      console.warn('BookingsBackend context is null, using local fallback');
      return createFallbackContext();
    }
    
    return context;
  } catch (error) {
    console.error('Error accessing BookingsBackend context, using local fallback:', error);
    return createFallbackContext();
  }
}