import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Board, BoardType } from '@/src/types/board';
import { trpc } from '@/lib/trpc';
import { useBoards } from '@/src/context/boards';

export interface NewBoardData {
  name: string;
  type: BoardType;
  location: string;
  pricePerDay: string;
  pricePerWeek: string;
  dimensions: string;
  volume: string;
  description: string;
  pickupSpot: string;
  availableStart: string;
  availableEnd: string;
  deliveryAvailable: boolean;
  deliveryPrice: string;
  images: {
    deckFront: string | null;
    bottomBack: string | null;
    dimensions: string | null;
  };
}

export interface BoardFilters {
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const [BoardsBackendProvider, useBoardsBackendInternal] = createContextHook(() => {
  const [filters, setFilters] = useState<BoardFilters>({});
  const [backendAvailable, setBackendAvailable] = useState(true);
  
  // Get local boards as fallback
  const localBoards = useBoards();
  
  // Use tRPC to fetch boards with filters
  const boardsQuery = trpc.boards.getAll.useQuery(filters, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: backendAvailable,
    retry: (failureCount: number, error: any) => {
      console.log('tRPC boards query error:', error?.message);
      if (error?.message?.includes('fetch') || 
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('Network error') ||
          error?.message?.includes('timeout')) {
        console.log('Backend not available, using local boards fallback');
        setBackendAvailable(false);
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const updateFilters = useCallback((newFilters: BoardFilters) => {
    if (!newFilters || typeof newFilters !== 'object') return;
    const validatedFilters: BoardFilters = {};
    if (newFilters.location && typeof newFilters.location === 'string' && newFilters.location.trim().length <= 100) {
      validatedFilters.location = newFilters.location.trim();
    }
    if (newFilters.type && typeof newFilters.type === 'string' && newFilters.type.trim().length <= 50) {
      validatedFilters.type = newFilters.type.trim();
    }
    if (newFilters.search && typeof newFilters.search === 'string' && newFilters.search.trim().length <= 100) {
      validatedFilters.search = newFilters.search.trim();
    }
    if (typeof newFilters.minPrice === 'number' && newFilters.minPrice >= 0) {
      validatedFilters.minPrice = newFilters.minPrice;
    }
    if (typeof newFilters.maxPrice === 'number' && newFilters.maxPrice >= 0) {
      validatedFilters.maxPrice = newFilters.maxPrice;
    }
    if (newFilters.startDate && typeof newFilters.startDate === 'string') {
      validatedFilters.startDate = newFilters.startDate;
    }
    if (newFilters.endDate && typeof newFilters.endDate === 'string') {
      validatedFilters.endDate = newFilters.endDate;
    }
    console.log('Updating board filters:', validatedFilters);
    setFilters(validatedFilters);
  }, []);

  const clearFilters = useCallback(() => {
    console.log('Clearing board filters');
    setFilters({});
  }, []);

  const getBoardById = useCallback((boardId: string): Board | undefined => {
    if (!boardId || typeof boardId !== 'string' || boardId.trim().length === 0) return undefined;
    const sanitizedBoardId = boardId.trim();
    
    // First try to find in backend data
    const backendBoard = boardsQuery.data?.find(b => b.id === sanitizedBoardId);
    if (backendBoard) {
      return backendBoard;
    }
    
    // If backend is not available or board not found, try local boards
    if (boardsQuery.error || !boardsQuery.data) {
      console.log('Using local boards fallback for board:', sanitizedBoardId);
      return localBoards.getBoardById(sanitizedBoardId);
    }
    
    return undefined;
  }, [boardsQuery.data, boardsQuery.error, localBoards]);

  // Board management mutations
  const addBoardMutation = trpc.boards.add.useMutation({
    onSuccess: () => {
      console.log('Board added successfully in backend');
      boardsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to add board in backend:', error);
    },
  });

  const updateBoardMutation = trpc.boards.update.useMutation({
    onSuccess: () => {
      console.log('Board updated successfully in backend');
      boardsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to update board in backend:', error);
    },
  });

  const deleteBoardMutation = trpc.boards.delete.useMutation({
    onSuccess: () => {
      console.log('Board deleted successfully in backend');
      boardsQuery.refetch();
    },
    onError: (error) => {
      console.error('Failed to delete board in backend:', error);
    },
  });

  const addBoard = useCallback(async (boardData: NewBoardData): Promise<string> => {
    if (backendAvailable) {
      try {
        const board = await addBoardMutation.mutateAsync({
          name: boardData.name,
          type: boardData.type,
          location: boardData.location,
          pricePerDay: parseFloat(boardData.pricePerDay) || 0,
          pricePerWeek: parseFloat(boardData.pricePerWeek) || 0,
          dimensions: boardData.dimensions,
          volume: parseFloat(boardData.volume) || undefined,
          pickupSpot: boardData.pickupSpot,
          availableStart: boardData.availableStart,
          availableEnd: boardData.availableEnd,
          deliveryAvailable: boardData.deliveryAvailable,
          deliveryPrice: parseFloat(boardData.deliveryPrice) || 0,
          imageUrl: boardData.images.deckFront || undefined,
          ownerId: 'pro-1', // Default owner for now
        });
        console.log('Board added in backend:', board);
        return board.id;
      } catch (error) {
        console.error('Backend board creation failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local board creation
    console.log('Creating board locally');
    return localBoards.addBoard(boardData);
  }, [backendAvailable, addBoardMutation, localBoards]);

  const updateBoard = useCallback(async (boardId: string, boardData: NewBoardData): Promise<void> => {
    if (backendAvailable) {
      try {
        await updateBoardMutation.mutateAsync({
          id: boardId,
          updates: {
            name: boardData.name,
            type: boardData.type,
            location: boardData.location,
            pricePerDay: parseFloat(boardData.pricePerDay) || 0,
            pricePerWeek: parseFloat(boardData.pricePerWeek) || 0,
            dimensions: boardData.dimensions,
            volume: parseFloat(boardData.volume) || undefined,
            pickupSpot: boardData.pickupSpot,
            availableStart: boardData.availableStart,
            availableEnd: boardData.availableEnd,
            deliveryAvailable: boardData.deliveryAvailable,
            deliveryPrice: parseFloat(boardData.deliveryPrice) || 0,
            imageUrl: boardData.images.deckFront || undefined,
          },
        });
        console.log('Board updated in backend');
        return;
      } catch (error) {
        console.error('Backend board update failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local board update
    console.log('Updating board locally');
    await localBoards.updateBoard(boardId, boardData);
  }, [backendAvailable, updateBoardMutation, localBoards]);

  const removeBoard = useCallback(async (boardId: string): Promise<void> => {
    if (backendAvailable) {
      try {
        await deleteBoardMutation.mutateAsync({ id: boardId });
        console.log('Board deleted in backend');
        return;
      } catch (error) {
        console.error('Backend board deletion failed, falling back to local:', error);
        setBackendAvailable(false);
      }
    }
    
    // Fallback to local board deletion
    console.log('Deleting board locally');
    await localBoards.removeBoard(boardId);
  }, [backendAvailable, deleteBoardMutation, localBoards]);

  const refetchBoards = useCallback(() => {
    console.log('Refetching boards');
    return boardsQuery.refetch();
  }, [boardsQuery]);

  const contextValue = useMemo(() => {
    // Use backend data if available, otherwise fall back to local boards
    const boards = backendAvailable && boardsQuery.data ? boardsQuery.data : localBoards.boards;
    const isLoading = backendAvailable ? boardsQuery.isLoading : false;
    const error = backendAvailable ? boardsQuery.error : null;
    
    const value = {
      boards,
      isLoading,
      error,
      filters,
      updateFilters,
      clearFilters,
      getBoardById,
      refetchBoards,
      backendAvailable,
      // Add board management functions
      addBoard,
      updateBoard,
      removeBoard,
    };
    
    return value;
  }, [
    boardsQuery.data,
    boardsQuery.isLoading,
    boardsQuery.error,
    localBoards.boards,
    localBoards.getBoardById,
    localBoards.addBoard,
    localBoards.updateBoard,
    localBoards.removeBoard,
    filters,
    updateFilters,
    clearFilters,
    getBoardById,
    refetchBoards,
    backendAvailable,
  ]);

  console.log('BoardsBackend context value:', {
    boardsCount: contextValue.boards.length,
    isLoading: contextValue.isLoading,
    hasGetBoardById: typeof contextValue.getBoardById === 'function',
    backendAvailable: contextValue.backendAvailable
  });

  return contextValue;
});

// Safe wrapper that ensures the context is always available
export function useBoardsBackend() {
  const localBoards = useBoards();
  
  const createFallbackContext = () => ({
    boards: localBoards.boards,
    isLoading: false,
    error: null,
    filters: {},
    updateFilters: () => {},
    clearFilters: () => {},
    getBoardById: localBoards.getBoardById,
    refetchBoards: () => Promise.resolve({ data: localBoards.boards }),
    backendAvailable: false,
    addBoard: localBoards.addBoard,
    updateBoard: localBoards.updateBoard,
    removeBoard: localBoards.removeBoard,
  });
  
  try {
    const context = useBoardsBackendInternal();
    if (!context) {
      console.warn('BoardsBackend context is null, using local fallback');
      return createFallbackContext();
    }
    
    if (!context.getBoardById || typeof context.getBoardById !== 'function') {
      console.warn('getBoardById is missing or invalid, using local fallback');
      return createFallbackContext();
    }
    
    return context;
  } catch (error) {
    console.error('Error accessing BoardsBackend context, using local fallback:', error);
    return createFallbackContext();
  }
}

// Hook for filtered boards (client-side filtering for instant search)
export function useFilteredBoards(searchTerm?: string) {
  const { boards } = useBoardsBackend();
  
  return useMemo(() => {
    if (!searchTerm) return boards;
    
    const term = searchTerm.toLowerCase();
    return boards.filter(board => 
      board.short_name.toLowerCase().includes(term) ||
      board.location.toLowerCase().includes(term) ||
      board.type.toLowerCase().includes(term)
    );
  }, [boards, searchTerm]);
}