import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProUser } from '@/src/types/board';
import { getProUsers } from '@/src/data/seed';

const USER_STORAGE_KEY = 'venture_sessions_user';

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

export interface ProUserExtended extends ProUser {
  type: 'pro';
}

export type User = RegularUser | ProUserExtended;

export const [UserProvider, useUser] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored) as User;
        setCurrentUser(userData);
      } else {
        // Create a default regular user for demo purposes
        const defaultUser: RegularUser = {
          id: 'user-1',
          name: 'Alex Johnson',
          email: 'alex.johnson@email.com',
          phone: '+1-555-0123',
          location: 'San Diego',
          joinedDate: '2024-01-15',
          avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g',
          type: 'regular'
        };
        setCurrentUser(defaultUser);
        await saveUser(defaultUser);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = useCallback(async (user: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates } as User;
    setCurrentUser(updatedUser);
    await saveUser(updatedUser);
  }, [currentUser, saveUser]);

  const switchToProUser = useCallback(async (proUserId: string) => {
    const proUsers = getProUsers();
    const proUser = proUsers.find(user => user.id === proUserId);
    
    if (proUser) {
      const proUserExtended: ProUserExtended = {
        ...proUser,
        type: 'pro'
      };
      setCurrentUser(proUserExtended);
      await saveUser(proUserExtended);
    }
  }, [saveUser]);

  const switchToRegularUser = useCallback(async () => {
    const regularUser: RegularUser = {
      id: 'user-1',
      name: 'Alex Johnson',
      email: 'alex.johnson@email.com',
      phone: '+1-555-0123',
      location: 'San Diego',
      joinedDate: '2024-01-15',
      avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g',
      type: 'regular'
    };
    setCurrentUser(regularUser);
    await saveUser(regularUser);
  }, [saveUser]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setCurrentUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  return useMemo(() => ({
    currentUser,
    isLoading,
    updateUser,
    switchToProUser,
    switchToRegularUser,
    logout,
  }), [currentUser, isLoading, updateUser, switchToProUser, switchToRegularUser, logout]);
});