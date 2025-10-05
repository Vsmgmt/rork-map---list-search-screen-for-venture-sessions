import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Booking, CartItem, CheckoutInfo } from '@/src/types/board';

const BOOKINGS_STORAGE_KEY = 'venture_sessions_bookings';

export const [BookingsProvider, useBookings] = createContextHook(() => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (stored) {
        const parsedBookings = JSON.parse(stored);
        // Ensure we have valid booking data
        if (Array.isArray(parsedBookings)) {
          setBookings(parsedBookings);
        } else {
          console.warn('Invalid bookings data format, clearing storage');
          await AsyncStorage.removeItem(BOOKINGS_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
      // Clear corrupted booking data
      try {
        await AsyncStorage.removeItem(BOOKINGS_STORAGE_KEY);
      } catch (clearError) {
        console.error('Failed to clear corrupted bookings:', clearError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveBookings = useCallback(async (bookingsToSave: Booking[]) => {
    try {
      if (!bookingsToSave || !Array.isArray(bookingsToSave) || bookingsToSave.length === 0) {
        await AsyncStorage.removeItem(BOOKINGS_STORAGE_KEY);
        return;
      }
      
      const dataToStore = JSON.stringify(bookingsToSave);
      
      // Check if data size is reasonable (less than 2MB)
      if (dataToStore.length > 2 * 1024 * 1024) {
        console.warn('Bookings data is too large, keeping only recent 50 bookings');
        const recentBookings = bookingsToSave.slice(0, 50);
        const reducedData = JSON.stringify(recentBookings);
        await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, reducedData);
        return;
      }
      
      await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, dataToStore);
    } catch (error) {
      console.error('Failed to save bookings:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Keep only recent 20 bookings if storage is full
        try {
          const recentBookings = bookingsToSave.slice(0, 20);
          await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(recentBookings));
          console.log('Reduced bookings to recent 20 due to storage quota exceeded');
        } catch (clearError) {
          console.error('Failed to save reduced bookings after quota error:', clearError);
          // If still failing, clear all bookings
          try {
            await AsyncStorage.removeItem(BOOKINGS_STORAGE_KEY);
            console.log('Cleared all bookings due to persistent storage issues');
          } catch (removeError) {
            console.error('Failed to clear bookings:', removeError);
          }
        }
      }
    }
  }, []);

  const addBooking = useCallback((customerInfo: CheckoutInfo, orderItems: CartItem[], totalAmount: number, confirmationNumber: string) => {
    const newBooking: Booking = {
      id: Date.now().toString(),
      confirmationNumber,
      customerInfo,
      orderItems,
      totalAmount,
      bookingDate: new Date().toISOString(),
      status: 'confirmed',
    };

    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    saveBookings(updatedBookings);
    return newBooking;
  }, [bookings, saveBookings]);

  const updateBookingStatus = useCallback((bookingId: string, status: Booking['status']) => {
    const updatedBookings = bookings.map(booking => 
      booking.id === bookingId ? { ...booking, status } : booking
    );
    setBookings(updatedBookings);
    saveBookings(updatedBookings);
  }, [bookings, saveBookings]);

  const getBookingByConfirmation = useCallback((confirmationNumber: string) => {
    return bookings.find(booking => booking.confirmationNumber === confirmationNumber);
  }, [bookings]);

  const getBookingsByStatus = useCallback((status: Booking['status']) => {
    return bookings.filter(booking => booking.status === status);
  }, [bookings]);

  const getTotalRevenue = useCallback(() => {
    return bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  }, [bookings]);

  const getBookingsCount = useCallback(() => {
    return bookings.length;
  }, [bookings]);

  return useMemo(() => ({
    bookings,
    isLoading,
    addBooking,
    updateBookingStatus,
    getBookingByConfirmation,
    getBookingsByStatus,
    getTotalRevenue,
    getBookingsCount,
  }), [bookings, isLoading, addBooking, updateBookingStatus, getBookingByConfirmation, getBookingsByStatus, getTotalRevenue, getBookingsCount]);
});