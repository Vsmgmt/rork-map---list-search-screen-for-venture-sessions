import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Board, CartItem, CartExtra, Extra } from '@/src/types/board';
import { useCart } from '@/src/context/cart';
import { useBoardsBackend } from '@/src/context/boards-backend';
import { AVAILABLE_EXTRAS } from '@/constants/extras';

// For now, we'll keep the cart local but use backend boards
// In the future, we could add cart persistence to the backend
export const [CartBackendProvider, useCartBackendInternal] = createContextHook(() => {
  const localCart = useCart();
  const { getBoardById } = useBoardsBackend();
  
  // Override the addToCart function to use backend boards
  const addToCart = useCallback((board: Board, startDate: string, endDate: string, deliverySelected: boolean = false, extras: CartExtra[] = []) => {
    console.log('CartBackend addToCart called with:', { boardId: board.id, startDate, endDate, deliverySelected });
    
    // Get the latest board data from backend
    const latestBoard = getBoardById(board.id) || board;
    
    // Use the local cart's addToCart with the latest board data
    localCart.addToCart(latestBoard, startDate, endDate, deliverySelected, extras);
  }, [localCart, getBoardById]);

  // Override getBoardById to use backend data
  const getCartItemBoard = useCallback((boardId: string): Board | undefined => {
    return getBoardById(boardId);
  }, [getBoardById]);

  const contextValue = useMemo(() => {
    return {
      ...localCart,
      addToCart,
      getCartItemBoard,
      backendAvailable: true, // Cart uses backend boards
    };
  }, [
    localCart,
    addToCart,
    getCartItemBoard,
  ]);

  console.log('CartBackend context value:', {
    cartItemsCount: contextValue.cartItems.length,
    isLoading: contextValue.isLoading,
    totalPrice: contextValue.getTotalPrice(),
  });

  return contextValue;
});

// Safe wrapper that ensures the context is always available
export function useCartBackend() {
  const localCart = useCart();
  
  const createFallbackContext = () => ({
    ...localCart,
    getCartItemBoard: (boardId: string) => localCart.cartItems.find(item => item.board.id === boardId)?.board,
    backendAvailable: false,
  });
  
  try {
    const context = useCartBackendInternal();
    if (!context) {
      console.warn('CartBackend context is null, using local fallback');
      return createFallbackContext();
    }
    
    return context;
  } catch (error) {
    console.error('Error accessing CartBackend context, using local fallback:', error);
    return createFallbackContext();
  }
}