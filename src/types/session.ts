export type SessionLevel = 'beginner' | 'intermediate' | 'advanced';
export type SessionType = 'lesson' | 'tour' | 'camp' | 'session';

export interface Session {
  id: string;
  name: string;
  type: SessionType;
  level: SessionLevel;
  duration: number;
  price: number;
  description: string;
  location: string;
  lat: number;
  lon: number;
  available_start: string;
  available_end: string;
  max_participants: number;
  imageUrl: string;
  image_url: string;
  instructor: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location: string;
    rating: number;
    verified?: boolean;
    is_verified?: boolean;
    avatarUrl?: string;
    avatar_url?: string;
    bio?: string;
  };
  includes: string[];
}

export interface SessionFilters {
  location?: string;
  type?: SessionType | '';
  level?: SessionLevel | '';
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}
