import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Board, BoardType } from '@/src/types/board';
import { getBoards } from '@/src/data/seed';

const BOARDS_STORAGE_KEY = 'venture_sessions_boards';

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

export const [BoardsProvider, useBoards] = createContextHook(() => {
  const [boards, setBoards] = useState<Board[]>(() => getBoards(100));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserBoards();
  }, []);

  const loadUserBoards = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOARDS_STORAGE_KEY);
      if (stored) {
        const userBoards = JSON.parse(stored) as Board[];
        // Merge user boards with seed data
        setBoards(prev => [...userBoards, ...prev.filter(board => !board.id.startsWith('user-'))]);
      }
    } catch (error) {
      console.error('Failed to load user boards:', error);
    }
  };

  const saveUserBoards = useCallback(async (userBoards: Board[]) => {
    try {
      await AsyncStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(userBoards));
    } catch (error) {
      console.error('Failed to save user boards:', error);
    }
  }, []);

  const addBoard = useCallback(async (boardData: NewBoardData): Promise<string> => {
    const boardId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newBoard: Board = {
      id: boardId,
      short_name: boardData.name,
      dimensions_detail: boardData.dimensions,
      volume_l: boardData.volume ? parseFloat(boardData.volume) : null,
      price_per_day: boardData.pricePerDay ? parseFloat(boardData.pricePerDay) : null,
      price_per_week: boardData.pricePerWeek ? parseFloat(boardData.pricePerWeek) : null,
      available_start: boardData.availableStart,
      available_end: boardData.availableEnd,
      location: boardData.location,
      pickup_spot: boardData.pickupSpot || 'TBD',
      lat: 0, // Will be set based on location
      lon: 0, // Will be set based on location
      type: boardData.type,
      imageUrl: boardData.images.deckFront || 'https://via.placeholder.com/300x400?text=No+Image',
      delivery_available: boardData.deliveryAvailable,
      delivery_price: boardData.deliveryPrice ? parseFloat(boardData.deliveryPrice) : 50,
    };

    // Set coordinates based on location (simplified mapping)
    const locationCoords: Record<string, { lat: number; lon: number }> = {
      'Honolulu': { lat: 21.3099, lon: -157.8581 },
      'Kona': { lat: 19.6400, lon: -155.9969 },
      'San Diego': { lat: 32.7157, lon: -117.1611 },
      'Santa Cruz': { lat: 36.9741, lon: -122.0308 },
      'Bali': { lat: -8.3405, lon: 115.0920 },
      'Gold Coast': { lat: -28.0167, lon: 153.4000 },
      'Hossegor': { lat: 43.6647, lon: -1.3967 },
      'Ericeira': { lat: 38.9631, lon: -9.4170 },
      'Taghazout': { lat: 30.5456, lon: -9.7103 },
      'Chiba': { lat: 35.6050, lon: 140.1233 },
      'Lisbon': { lat: 38.7223, lon: -9.1393 },
      'Puerto Escondido': { lat: 15.8720, lon: -97.0767 },
    };

    const coords = locationCoords[boardData.location];
    if (coords) {
      newBoard.lat = coords.lat + (Math.random() - 0.5) * 0.1; // Add small jitter
      newBoard.lon = coords.lon + (Math.random() - 0.5) * 0.1;
    }

    const updatedBoards = [newBoard, ...boards];
    setBoards(updatedBoards);
    
    // Save only user boards to storage
    const userBoards = updatedBoards.filter(board => board.id.startsWith('user-'));
    await saveUserBoards(userBoards);
    
    return boardId;
  }, [boards, saveUserBoards]);

  const updateBoard = useCallback(async (boardId: string, boardData: NewBoardData): Promise<void> => {
    if (!boardId.startsWith('user-')) {
      console.warn('Cannot update non-user board');
      return;
    }
    
    const updatedBoard: Board = {
      id: boardId,
      short_name: boardData.name,
      dimensions_detail: boardData.dimensions,
      volume_l: boardData.volume ? parseFloat(boardData.volume) : null,
      price_per_day: boardData.pricePerDay ? parseFloat(boardData.pricePerDay) : null,
      price_per_week: boardData.pricePerWeek ? parseFloat(boardData.pricePerWeek) : null,
      available_start: boardData.availableStart,
      available_end: boardData.availableEnd,
      location: boardData.location,
      pickup_spot: boardData.pickupSpot || 'TBD',
      lat: 0,
      lon: 0,
      type: boardData.type,
      imageUrl: boardData.images.deckFront || 'https://via.placeholder.com/300x400?text=No+Image',
      delivery_available: boardData.deliveryAvailable,
      delivery_price: boardData.deliveryPrice ? parseFloat(boardData.deliveryPrice) : 50,
    };
    
    // Keep existing coordinates
    const existingBoard = boards.find(b => b.id === boardId);
    if (existingBoard) {
      updatedBoard.lat = existingBoard.lat;
      updatedBoard.lon = existingBoard.lon;
    }
    
    const updatedBoards = boards.map(board => 
      board.id === boardId ? updatedBoard : board
    );
    setBoards(updatedBoards);
    
    const userBoards = updatedBoards.filter(board => board.id.startsWith('user-'));
    await saveUserBoards(userBoards);
  }, [boards, saveUserBoards]);

  const removeBoard = useCallback(async (boardId: string) => {
    if (!boardId.startsWith('user-')) {
      console.warn('Cannot remove non-user board');
      return;
    }
    
    const updatedBoards = boards.filter(board => board.id !== boardId);
    setBoards(updatedBoards);
    
    const userBoards = updatedBoards.filter(board => board.id.startsWith('user-'));
    await saveUserBoards(userBoards);
  }, [boards, saveUserBoards]);

  const getBoardById = useCallback((boardId: string): Board | undefined => {
    return boards.find(board => board.id === boardId);
  }, [boards]);

  return useMemo(() => ({
    boards,
    isLoading,
    addBoard,
    updateBoard,
    removeBoard,
    getBoardById,
  }), [boards, isLoading, addBoard, updateBoard, removeBoard, getBoardById]);
});