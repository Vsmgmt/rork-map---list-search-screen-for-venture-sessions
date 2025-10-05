export type BoardType = 'soft-top' | 'shortboard' | 'fish' | 'longboard' | 'sup';

export interface ProUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  joinedDate?: string;
  joined_date?: string;
  totalBoards?: number;
  total_boards?: number;
  rating: number;
  verified?: boolean;
  is_verified?: boolean;
  avatarUrl?: string;
  avatar_url?: string;
}

export interface Board {
  id: string;
  short_name: string;
  dimensions_detail: string;
  volume_l: number | null;
  price_per_day: number | null;
  price_per_week: number | null;
  available_start: string;
  available_end: string;
  location: string;
  pickup_spot: string;
  lat: number;
  lon: number;
  type: BoardType;
  imageUrl: string;
  image_url: string;
  image_path?: string;
  delivery_available: boolean;
  delivery_price: number;
  owner: ProUser;
}

export interface Extra {
  id: string;
  name: string;
  pricePerDay: number;
  pricePerWeek: number;
  description?: string;
}

export interface CartExtra {
  extra: Extra;
  quantity: number;
  totalPrice: number;
  size?: string;
}

export interface CartItem {
  board: Board;
  startDate: string;
  endDate: string;
  days: number;
  totalPrice: number;
  rentalType: 'daily' | 'weekly';
  deliverySelected: boolean;
  deliveryPrice: number;
  extras: CartExtra[];
}

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickupTime: string;
  returnTime: string;
  notes?: string;
  deliveryAddress?: string;
}

export interface Booking {
  id: string;
  confirmationNumber: string;
  customerInfo: CheckoutInfo;
  orderItems: CartItem[];
  totalAmount: number;
  bookingDate: string;
  status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
}