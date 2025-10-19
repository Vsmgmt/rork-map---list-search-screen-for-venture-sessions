import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import { Session, SessionFilters } from '@/src/types/session';
import { getSessions } from '@/src/data/seed-sessions';

export const [SessionsProvider, useSessions] = createContextHook(() => {
  const [sessions] = useState<Session[]>(() => getSessions(60));
  
  const getSessionById = useCallback((sessionId: string): Session | undefined => {
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return undefined;
    }
    return sessions.find(s => s.id === sessionId.trim());
  }, [sessions]);

  const filterSessions = useCallback((filters: SessionFilters): Session[] => {
    let results = [...sessions];
    
    if (filters.location) {
      results = results.filter(s =>
        s.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    
    if (filters.type) {
      results = results.filter(s => s.type === filters.type);
    }
    
    if (filters.level) {
      results = results.filter(s => s.level === filters.level);
    }
    
    if (filters.search) {
      results = results.filter(s =>
        s.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        s.description.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }
    
    if (filters.minPrice !== undefined) {
      results = results.filter(s => s.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      results = results.filter(s => s.price <= filters.maxPrice!);
    }
    
    if (filters.startDate && filters.endDate) {
      const filterStart = new Date(filters.startDate);
      const filterEnd = new Date(filters.endDate);
      results = results.filter(s => {
        const sessionStart = new Date(s.available_start);
        const sessionEnd = new Date(s.available_end);
        return sessionStart <= filterEnd && sessionEnd >= filterStart;
      });
    }
    
    results.sort((a, b) => a.price - b.price);
    
    return results;
  }, [sessions]);

  return {
    sessions,
    getSessionById,
    filterSessions,
  };
});
