import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ProUser } from '@/src/types/board';
import { trpc } from '@/lib/trpc';
import { useUser, User } from '@/src/context/user';

export const [UserBackendProvider, useUserBackendInternal] = createContextHook(() => {
  // Start with backend disabled to avoid initial errors
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  // Get local user as fallback
  const localUser = useUser();
  
  // Update user mutation
  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: (updatedUser: any) => {
      console.log('User updated successfully in backend:', updatedUser);
      setBackendAvailable(true); // Mark backend as available on successful update
      // Invalidate and refetch pro users to get the latest data
      proUsersQuery.refetch();
    },
    onError: (error: any) => {
      console.error('Failed to update user in backend:', error);
      
      // Check for specific error types
      const errorMessage = error?.message || '';
      
      // Check if it's a JSON parsing error (HTML response instead of JSON)
      if (errorMessage.includes('Unexpected token') && errorMessage.includes('<!DOCTYPE')) {
        console.log('Backend returned HTML instead of JSON - API route issue detected');
        setBackendAvailable(false);
        return;
      }
      
      // Check if it's a network error
      if (errorMessage.includes('timeout') || 
          errorMessage.includes('Network error') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('tRPC endpoint not found')) {
        console.log('Network/routing error detected, marking backend as unavailable');
        setBackendAvailable(false);
      }
    },
    retry: (failureCount: number, error: any) => {
      const errorMessage = error?.message || '';
      
      // Don't retry on network errors, routing errors, or JSON parsing errors
      if (errorMessage.includes('timeout') || 
          errorMessage.includes('Network error') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('tRPC endpoint not found') ||
          (errorMessage.includes('Unexpected token') && errorMessage.includes('<!DOCTYPE'))) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Get pro users query
  // eslint-disable-next-line @rork/linters/rsp-react-query-object-api-only
  const proUsersQuery = trpc.admin.getProUsers.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: backendAvailable, // Enable when backend is available
    retry: (failureCount: number, error: any) => {
      console.log('tRPC pro users query error:', error?.message);
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('fetch') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Network error') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('tRPC endpoint not found') ||
          (errorMessage.includes('Unexpected token') && errorMessage.includes('<!DOCTYPE'))) {
        console.log('Backend not available for pro users');
        setBackendAvailable(false);
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
  
  // Try to enable backend after component mounts
  useEffect(() => {
    // Give the app time to initialize, then try to enable backend
    const timer = setTimeout(() => {
      console.log('UserBackend: Attempting to enable backend...');
      setBackendAvailable(true);
    }, 1000); // Reduced delay
    
    return () => clearTimeout(timer);
  }, []);
  
  // Mark backend as available when query succeeds
  useEffect(() => {
    if (proUsersQuery.isSuccess && !backendAvailable) {
      console.log('Backend is now available again');
      setBackendAvailable(true);
    }
  }, [proUsersQuery.isSuccess, backendAvailable]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!localUser.currentUser) {
      console.warn('UserBackend: No current user to update');
      throw new Error('No current user to update');
    }
    
    console.log('UserBackend: Updating user with:', updates);
    console.log('UserBackend: Current user:', {
      id: localUser.currentUser.id,
      type: localUser.currentUser.type,
      name: localUser.currentUser.name
    });
    
    // Always update locally first for immediate UI feedback
    try {
      await localUser.updateUser(updates);
      console.log('UserBackend: Local user update completed successfully');
    } catch (localError) {
      console.error('UserBackend: Local user update failed:', localError);
      throw localError;
    }
    
    // Only attempt backend sync for pro users when backend is available
    if (localUser.currentUser.type === 'pro' && backendAvailable) {
      console.log('UserBackend: Attempting backend sync for pro user:', localUser.currentUser.id);
      
      try {
        // Filter out undefined values to avoid sending them to the backend
        const mutationData: {
          userId: string;
          name?: string;
          email?: string;
          phone?: string;
          location?: string;
          avatarUrl?: string;
        } = {
          userId: localUser.currentUser.id,
        };
        
        // Only include fields that are actually being updated
        if (updates.name !== undefined) mutationData.name = updates.name;
        if (updates.email !== undefined) mutationData.email = updates.email;
        if (updates.phone !== undefined) mutationData.phone = updates.phone;
        if (updates.location !== undefined) mutationData.location = updates.location;
        if (updates.avatarUrl !== undefined) mutationData.avatarUrl = updates.avatarUrl;
        
        console.log('UserBackend: Sending mutation data:', mutationData);
        console.log('UserBackend: About to call updateUserMutation.mutateAsync...');
        
        try {
          const result = await updateUserMutation.mutateAsync(mutationData);
          console.log('UserBackend: Backend sync successful:', result);
        } catch (mutationError) {
          console.error('UserBackend: Mutation error details:', {
            error: mutationError,
            message: mutationError instanceof Error ? mutationError.message : 'Unknown error',
            stack: mutationError instanceof Error ? mutationError.stack : undefined
          });
          throw mutationError;
        }
      } catch (error) {
        console.error('UserBackend: Backend sync failed:', error);
        
        // Log the full error details for debugging
        if (error instanceof Error) {
          console.error('UserBackend: Error message:', error.message);
          console.error('UserBackend: Error stack:', error.stack);
        }
        
        // Check if it's a network error that should mark backend as unavailable
        if (error instanceof Error) {
          const errorMessage = error.message;
          
          if (errorMessage.includes('fetch') ||
              errorMessage.includes('Failed to fetch') ||
              errorMessage.includes('Network error') ||
              errorMessage.includes('timeout') ||
              errorMessage.includes('AbortError') ||
              errorMessage.includes('NetworkError') ||
              errorMessage.includes('tRPC endpoint not found') ||
              (errorMessage.includes('Unexpected token') && errorMessage.includes('<!DOCTYPE'))) {
            console.log('UserBackend: Network/routing error detected, marking backend as unavailable');
            setBackendAvailable(false);
          } else {
            // For non-network errors, we might want to show them to the user
            console.warn('UserBackend: Non-network error occurred during backend sync:', error);
            // Re-throw non-network errors so they can be handled by the UI
            throw new Error(`Backend sync failed: ${errorMessage}`);
          }
        } else {
          throw new Error(`Backend sync failed: ${error}`);
        }
        
        // Don't throw network errors - local update succeeded
        console.log('UserBackend: Continuing despite backend sync failure (local update succeeded)');
      }
    } else if (localUser.currentUser.type === 'pro' && !backendAvailable) {
      console.log('UserBackend: Backend unavailable, skipping sync for pro user');
      
      // Periodically try to reconnect to backend
      setTimeout(() => {
        console.log('UserBackend: Attempting to reconnect to backend...');
        setBackendAvailable(true);
      }, 30000); // Try again in 30 seconds
    } else {
      console.log('UserBackend: Regular user, no backend sync needed');
    }
  }, [localUser, backendAvailable, updateUserMutation]);

  const switchToProUser = useCallback(async (proUserId: string) => {
    // Use backend data if available, otherwise fall back to local
    const proUsers = backendAvailable && proUsersQuery.data ? proUsersQuery.data : [];
    const proUser = proUsers.find(user => user.id === proUserId);
    
    if (proUser) {
      // Update both local and backend
      await localUser.switchToProUser(proUserId);
    } else {
      // Fallback to local pro user switching
      await localUser.switchToProUser(proUserId);
    }
  }, [localUser, backendAvailable, proUsersQuery.data]);

  const contextValue = useMemo(() => {
    return {
      currentUser: localUser.currentUser,
      isLoading: localUser.isLoading,
      updateUser,
      switchToProUser,
      switchToRegularUser: localUser.switchToRegularUser,
      logout: localUser.logout,
      backendAvailable,
      proUsers: backendAvailable && proUsersQuery.data ? proUsersQuery.data : [],
    };
  }, [
    localUser.currentUser,
    localUser.isLoading,
    localUser.switchToRegularUser,
    localUser.logout,
    updateUser,
    switchToProUser,
    backendAvailable,
    proUsersQuery.data,
  ]);

  console.log('UserBackend context value:', {
    hasCurrentUser: !!contextValue.currentUser,
    userType: contextValue.currentUser?.type,
    isLoading: contextValue.isLoading,
    backendAvailable: contextValue.backendAvailable,
    proUsersCount: contextValue.proUsers.length
  });

  return contextValue;
});

// Safe wrapper that ensures the context is always available
export function useUserBackend() {
  const localUser = useUser();
  
  const createFallbackContext = () => ({
    currentUser: localUser.currentUser,
    isLoading: localUser.isLoading,
    updateUser: localUser.updateUser,
    switchToProUser: localUser.switchToProUser,
    switchToRegularUser: localUser.switchToRegularUser,
    logout: localUser.logout,
    backendAvailable: false,
    proUsers: [] as ProUser[],
  });
  
  try {
    const context = useUserBackendInternal();
    if (!context) {
      console.warn('UserBackend context is null, using local fallback');
      return createFallbackContext();
    }
    
    return context;
  } catch (error) {
    console.error('Error accessing UserBackend context, using local fallback:', error);
    return createFallbackContext();
  }
}