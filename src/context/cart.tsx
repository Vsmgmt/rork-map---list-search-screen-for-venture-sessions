import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Board, CartItem, CartExtra, Extra } from '@/src/types/board';
import { Session } from '@/src/types/session';
import { useBoards } from '@/src/context/boards';
import { AVAILABLE_EXTRAS } from '@/constants/extras';

const CART_STORAGE_KEY = 'venture_sessions_cart';

// Lightweight cart item for storage
interface StoredCartExtra {
  extraId: string;
  quantity: number;
  totalPrice: number;
  size?: string;
}

interface StoredCartItem {
  boardId: string;
  startDate: string;
  endDate: string;
  days: number;
  totalPrice: number;
  rentalType: 'daily' | 'weekly';
  deliverySelected: boolean;
  deliveryPrice: number;
  extras: StoredCartExtra[];
}

export const [CartProvider, useCart] = createContextHook(() => {
  const { boards } = useBoards();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored && boards.length > 0) {
        const storedItems: StoredCartItem[] = JSON.parse(stored);
        const reconstructedItems: CartItem[] = storedItems
          .map(item => {
            const board = boards.find(b => b.id === item.boardId);
            if (!board) return null;
            
            const extras: CartExtra[] = (item.extras || [])
              .map(storedExtra => {
                const extra = AVAILABLE_EXTRAS.find(e => e.id === storedExtra.extraId);
                if (!extra) return null;
                return {
                  extra,
                  quantity: storedExtra.quantity,
                  totalPrice: storedExtra.totalPrice,
                  size: storedExtra.size,
                } as CartExtra;
              })
              .filter((extra): extra is CartExtra => extra !== null);
            
            return {
              board,
              startDate: item.startDate,
              endDate: item.endDate,
              days: item.days,
              totalPrice: item.totalPrice,
              rentalType: item.rentalType,
              deliverySelected: item.deliverySelected,
              deliveryPrice: item.deliveryPrice,
              extras,
            } as CartItem;
          })
          .filter(item => item !== null) as CartItem[];
        setCartItems(reconstructedItems);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Clear corrupted cart data
      try {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      } catch (clearError) {
        console.error('Failed to clear corrupted cart:', clearError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [boards]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const saveCart = useCallback(async (items: CartItem[]) => {
    try {
      if (!items || !Array.isArray(items) || items.length === 0) {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
        return;
      }
      
      // Convert to lightweight storage format (only boards for now)
      const storedItems: StoredCartItem[] = items
        .filter(item => item.board)
        .map(item => ({
          boardId: item.board!.id,
          startDate: item.startDate,
          endDate: item.endDate,
          days: item.days,
          totalPrice: item.totalPrice,
          rentalType: item.rentalType!,
          deliverySelected: item.deliverySelected!,
          deliveryPrice: item.deliveryPrice!,
          extras: (item.extras || []).map(cartExtra => ({
            extraId: cartExtra.extra.id,
            quantity: cartExtra.quantity,
            totalPrice: cartExtra.totalPrice,
            size: cartExtra.size,
          })),
        }));
      
      const dataToStore = JSON.stringify(storedItems);
      
      // Check if data size is reasonable (less than 1MB)
      if (dataToStore.length > 1024 * 1024) {
        console.warn('Cart data is too large, clearing cart to prevent storage issues');
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
        return;
      }
      
      await AsyncStorage.setItem(CART_STORAGE_KEY, dataToStore);
    } catch (error) {
      console.error('Failed to save cart:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Clear cart if storage is full
        try {
          await AsyncStorage.removeItem(CART_STORAGE_KEY);
          console.log('Cleared cart due to storage quota exceeded');
        } catch (clearError) {
          console.error('Failed to clear cart after quota error:', clearError);
        }
      }
    }
  }, []);

  const addSessionToCart = useCallback((session: Session, startDate: string, endDate: string, bookingTime?: string, participants: number = 1) => {
    console.log('Cart addSessionToCart called with:', { sessionId: session.id, startDate, endDate, bookingTime, participants });
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const totalPrice = session.price * participants;

    const cartItem: CartItem = {
      session,
      startDate,
      endDate,
      days,
      totalPrice,
      bookingTime,
      participants,
    };

    console.log('Created session cart item:', cartItem);

    const newItems = [...cartItems, cartItem];
    setCartItems(newItems);
    console.log('Cart updated successfully with session');
  }, [cartItems]);

  const addToCart = useCallback((board: Board, startDate: string, endDate: string, deliverySelected: boolean = false, extras: CartExtra[] = []) => {
    console.log('Cart addToCart called with:', { boardId: board.id, startDate, endDate, deliverySelected });
    console.log('Current cartItems before adding:', cartItems);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    console.log('Calculated days:', days);
    
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    let totalPrice = 0;
    let rentalType: 'daily' | 'weekly' = 'daily';
    
    if (weeks > 0 && board.price_per_week) {
      totalPrice = weeks * board.price_per_week;
      if (remainingDays > 0 && board.price_per_day) {
        totalPrice += remainingDays * board.price_per_day;
      }
      rentalType = 'weekly';
    } else if (board.price_per_day) {
      totalPrice = days * board.price_per_day;
    }

    console.log('Calculated totalPrice:', totalPrice);

    const deliveryPrice = deliverySelected && board.delivery_available ? board.delivery_price : 0;

    const cartItem: CartItem = {
      board,
      startDate,
      endDate,
      days,
      totalPrice,
      rentalType,
      deliverySelected,
      deliveryPrice,
      extras,
    };

    console.log('Created cartItem:', cartItem);

    const newItems = [...cartItems, cartItem];
    console.log('New cart items:', newItems);
    setCartItems(newItems);
    saveCart(newItems);
    console.log('Cart updated successfully');
  }, [cartItems, saveCart]);

  const removeFromCart = useCallback((index: number) => {
    console.log('removeFromCart called with index:', index);
    console.log('Current cartItems:', cartItems);
    const newItems = cartItems.filter((_, i) => i !== index);
    console.log('New items after removal:', newItems);
    setCartItems(newItems);
    saveCart(newItems);
  }, [cartItems, saveCart]);

  const updateCartItem = useCallback((index: number, updates: Partial<CartItem>) => {
    const newItems = [...cartItems];
    newItems[index] = { ...newItems[index], ...updates };
    setCartItems(newItems);
    saveCart(newItems);
  }, [cartItems, saveCart]);

  const clearCart = useCallback(() => {
    console.log('clearCart called');
    console.log('Current cartItems before clear:', cartItems);
    setCartItems([]);
    saveCart([]);
    console.log('Cart cleared');
  }, [saveCart, cartItems]);

  const calculateDeliveryPricing = useCallback(() => {
    const deliveryItemsByOwner = cartItems
      .filter(item => item.board && item.deliverySelected)
      .reduce((groups, item) => {
        const ownerId = item.board!.owner.id;
        if (!groups[ownerId]) {
          groups[ownerId] = [];
        }
        groups[ownerId].push(item);
        return groups;
      }, {} as Record<string, CartItem[]>);

    let totalDeliveryPrice = 0;
    
    Object.values(deliveryItemsByOwner).forEach(ownerItems => {
      if (ownerItems.length === 0) return;
      
      const count = ownerItems.length;
      
      if (count <= 2) {
        totalDeliveryPrice += 50;
      } else {
        totalDeliveryPrice += 50 + (count - 2) * 10;
      }
    });
    
    return totalDeliveryPrice;
  }, [cartItems]);

  const getTotalPrice = useCallback(() => {
    const rentalTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const extrasTotal = cartItems.reduce((sum, item) => 
      sum + (item.extras || []).reduce((extraSum, extra) => extraSum + extra.totalPrice, 0), 0
    );
    const deliveryTotal = calculateDeliveryPricing();
    return rentalTotal + extrasTotal + deliveryTotal;
  }, [cartItems, calculateDeliveryPricing]);

  const getDeliveryBreakdown = useCallback(() => {
    const deliveryItemsByOwner = cartItems
      .filter(item => item.board && item.deliverySelected)
      .reduce((groups, item) => {
        const ownerId = item.board!.owner.id;
        if (!groups[ownerId]) {
          groups[ownerId] = {
            ownerName: item.board!.owner.name,
            items: [],
            totalPrice: 0
          };
        }
        groups[ownerId].items.push(item);
        return groups;
      }, {} as Record<string, { ownerName: string; items: CartItem[]; totalPrice: number }>);

    Object.values(deliveryItemsByOwner).forEach(group => {
      if (group.items.length === 0) return;
      
      const count = group.items.length;
      
      if (count <= 2) {
        group.totalPrice = 50;
      } else {
        group.totalPrice = 50 + (count - 2) * 10;
      }
    });
    
    return Object.values(deliveryItemsByOwner);
  }, [cartItems]);

  const toggleDelivery = useCallback((index: number) => {
    const item = cartItems[index];
    if (!item?.board?.delivery_available) return;
    
    const deliverySelected = !item.deliverySelected;
    const deliveryPrice = deliverySelected ? item.board.delivery_price : 0;
    
    updateCartItem(index, { deliverySelected, deliveryPrice });
  }, [cartItems, updateCartItem]);

  const getItemCount = useCallback(() => {
    return cartItems.length;
  }, [cartItems]);

  const addExtraToItem = useCallback((itemIndex: number, extra: Extra, quantity: number = 1) => {
    const item = cartItems[itemIndex];
    if (!item) return;

    const days = item.days;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    let totalPrice = 0;
    if (weeks > 0) {
      totalPrice = weeks * extra.pricePerWeek * quantity;
      if (remainingDays > 0) {
        totalPrice += remainingDays * extra.pricePerDay * quantity;
      }
    } else {
      totalPrice = days * extra.pricePerDay * quantity;
    }

    const existingExtraIndex = (item.extras || []).findIndex(e => e.extra.id === extra.id);
    let newExtras = [...(item.extras || [])];
    
    if (existingExtraIndex >= 0) {
      // Update existing extra
      newExtras[existingExtraIndex] = {
        extra,
        quantity: newExtras[existingExtraIndex].quantity + quantity,
        totalPrice: newExtras[existingExtraIndex].totalPrice + totalPrice,
      };
    } else {
      // Add new extra
      newExtras.push({
        extra,
        quantity,
        totalPrice,
      });
    }

    updateCartItem(itemIndex, { extras: newExtras });
  }, [cartItems, updateCartItem]);

  const removeExtraFromItem = useCallback((itemIndex: number, extraId: string) => {
    const item = cartItems[itemIndex];
    if (!item) return;

    const newExtras = (item.extras || []).filter(e => e.extra.id !== extraId);
    updateCartItem(itemIndex, { extras: newExtras });
  }, [cartItems, updateCartItem]);

  const updateExtraQuantity = useCallback((itemIndex: number, extraId: string, quantity: number) => {
    const item = cartItems[itemIndex];
    if (!item) return;

    if (quantity <= 0) {
      removeExtraFromItem(itemIndex, extraId);
      return;
    }

    const extraIndex = (item.extras || []).findIndex(e => e.extra.id === extraId);
    if (extraIndex < 0) return;

    const extra = (item.extras || [])[extraIndex].extra;
    const days = item.days;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    let totalPrice = 0;
    if (weeks > 0) {
      totalPrice = weeks * extra.pricePerWeek * quantity;
      if (remainingDays > 0) {
        totalPrice += remainingDays * extra.pricePerDay * quantity;
      }
    } else {
      totalPrice = days * extra.pricePerDay * quantity;
    }

    const newExtras = [...(item.extras || [])];
    newExtras[extraIndex] = {
      extra,
      quantity,
      totalPrice,
      size: newExtras[extraIndex].size,
    };

    updateCartItem(itemIndex, { extras: newExtras });
  }, [cartItems, updateCartItem, removeExtraFromItem]);

  const updateExtraSize = useCallback((itemIndex: number, extraId: string, size: string) => {
    const item = cartItems[itemIndex];
    if (!item) return;

    const extraIndex = (item.extras || []).findIndex(e => e.extra.id === extraId);
    if (extraIndex < 0) return;

    const newExtras = [...(item.extras || [])];
    newExtras[extraIndex] = {
      ...newExtras[extraIndex],
      size,
    };

    updateCartItem(itemIndex, { extras: newExtras });
  }, [cartItems, updateCartItem]);

  return useMemo(() => ({
    cartItems,
    isLoading,
    addToCart,
    addSessionToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getTotalPrice,
    getItemCount,
    toggleDelivery,
    calculateDeliveryPricing,
    getDeliveryBreakdown,
    addExtraToItem,
    removeExtraFromItem,
    updateExtraQuantity,
    updateExtraSize,
    availableExtras: AVAILABLE_EXTRAS,
  }), [cartItems, isLoading, addToCart, addSessionToCart, removeFromCart, updateCartItem, clearCart, getTotalPrice, getItemCount, toggleDelivery, calculateDeliveryPricing, getDeliveryBreakdown, addExtraToItem, removeExtraFromItem, updateExtraQuantity, updateExtraSize]);
});

export const useCartCount = () => {
  const { getItemCount } = useCart();
  return getItemCount();
};