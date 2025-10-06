import { supabase } from './supabase';
import { uploadBoardImage } from './upload';
import type { Board, ProUser, CheckoutInfo, CartItem } from '@/src/types/board';

export async function saveImageToBoard(
  boardId: string,
  input: { file?: File | Blob; uri?: string },
  opts?: { isPrimary?: boolean; sortOrder?: number; ext?: string }
) {
  const { publicUrl, path } = await uploadBoardImage(boardId, input, opts?.ext ?? 'png');

  const { error: linkErr } = await supabase.rpc('link_board_image', {
    p_board_id: boardId,
    p_image_url: publicUrl,
    p_image_path: path,
    p_is_primary: !!opts?.isPrimary,
    p_sort_order: opts?.sortOrder ?? 0,
  });
  if (linkErr) throw linkErr;
  return { publicUrl, path };
}

export async function getBoardByIdFast(id: string) {
  const { data, error } = await supabase.rpc('get_board_by_id_fast', { p_id: id });
  if (error) throw error;
  const row = (data && data[0]) || null;
  if (!row) return null;

  return {
    ...row,
    imageUrl: row.primary_image_url,
    image_url: row.primary_image_url,
    shortName: row.short_name,
    dimensionsDetail: row.dimensions_detail,
    pricePerDay: row.price_per_day,
    owner: {
      id: row.owner_id,
      name: row.owner_name,
      avatar_url: row.owner_avatar_url,
      avatarUrl: row.owner_avatar_url,
      rating: row.owner_rating,
      reviews_count: row.owner_reviews_count,
      location: row.location,
      joined_date: row.owner_joined_date,
      joinedDate: row.owner_joined_date,
      total_boards: row.owner_total_boards,
      totalBoards: row.owner_total_boards,
      is_verified: row.owner_is_verified,
      verified: row.owner_is_verified,
    },
  };
}

export const boardQueries = {
  async getAll() {
    const { data, error } = await supabase
      .from('boards')
      .select(`
        *,
        owner:pro_users!owner_id (
          id,
          name,
          email,
          location,
          avatar_url,
          is_verified,
          rating,
          boards_count,
          joined_date
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    try {
      const board = await getBoardByIdFast(id);
      return board;
    } catch {
      const { data, error } = await supabase
        .from('boards')
        .select(`
          *,
          owner:pro_users!owner_id (
            id,
            name,
            email,
            location,
            avatar_url,
            is_verified,
            rating,
            boards_count,
            joined_date
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  async getByLocation(location: string) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('location', location)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getByType(boardType: string) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('board_type', boardType)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getByOwner(ownerId: string) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async search(filters: {
    location?: string;
    boardType?: string;
    minPrice?: number;
    maxPrice?: number;
    available?: boolean;
  }) {
    let query = supabase.from('boards').select('*');

    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    if (filters.boardType) {
      query = query.eq('board_type', filters.boardType);
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price_per_day', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price_per_day', filters.maxPrice);
    }
    if (filters.available !== undefined) {
      query = query.eq('available', filters.available);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(
    board: Partial<Board>,
    opts?: { image?: { file?: File | Blob; uri?: string; ext?: string } }
  ) {
    const { data: inserted, error: insertErr } = await supabase
      .from('boards')
      .insert(board)
      .select()
      .single();

    if (insertErr) throw insertErr;

    if (opts?.image) {
      const { publicUrl, path } = await uploadBoardImage(
        inserted.id,
        { file: opts.image.file, uri: opts.image.uri },
        opts.image.ext ?? 'png'
      );

      const { data: withImage, error: patchErr } = await supabase
        .from('boards')
        .update({ image_url: publicUrl, image_path: path })
        .eq('id', inserted.id)
        .select()
        .single();

      if (patchErr) throw patchErr;
      return withImage;
    }

    return inserted;
  },

  async update(
    id: string,
    updates: Partial<Board>,
    opts?: { image?: { file?: File | Blob; uri?: string; ext?: string } }
  ) {
    if (opts?.image) {
      const { publicUrl, path } = await uploadBoardImage(
        id,
        { file: opts.image.file, uri: opts.image.uri },
        opts.image.ext ?? 'png'
      );
      updates.image_url = publicUrl;
      updates.image_path = path;
    }

    const { data, error } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

export const proUserQueries = {
  async getAll() {
    const { data, error } = await supabase
      .from('pro_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('pro_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('pro_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getVerified() {
    const { data, error } = await supabase
      .from('pro_users')
      .select('*')
      .eq('is_verified', true)
      .order('rating', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(user: Partial<ProUser>) {
    const { data, error } = await supabase
      .from('pro_users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ProUser>) {
    const { data, error } = await supabase
      .from('pro_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('pro_users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

export const regularUserQueries = {
  async getAll() {
    const { data, error } = await supabase
      .from('regular_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('regular_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('regular_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar_url?: string;
  }) {
    const { data, error } = await supabase
      .from('regular_users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    avatar_url?: string;
  }) {
    const { data, error } = await supabase
      .from('regular_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('regular_users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

export const bookingQueries = {
  async getAll() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByConfirmationNumber(confirmationNumber: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('confirmation_number', confirmationNumber)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByCustomerEmail(email: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_email', email)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getByStatus(status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled') {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', status)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(booking: {
    id: string;
    confirmation_number: string;
    customer_email: string;
    customer_name: string;
    customer_phone?: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status?: string;
    order_items: CartItem[];
    customer_info: CheckoutInfo;
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: {
    status?: string;
    customer_info?: CheckoutInfo;
    order_items?: CartItem[];
    total_amount?: number;
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

export const messageQueries = {
  async getConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getConversationById(id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createConversation(conversation: {
    id: string;
    participants: string[];
    last_message?: string;
  }) {
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async sendMessage(message: {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;

    await supabase
      .from('conversations')
      .update({
        last_message: message.content,
        last_message_timestamp: new Date().toISOString(),
      })
      .eq('id', message.conversation_id);

    return data;
  },

  async markAsRead(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markConversationAsRead(conversationId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false);
    
    if (error) throw error;
  },
};

export const statsQueries = {
  async getBoardStats() {
    const { count: totalBoards, error: boardsError } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true });

    const { count: availableBoards, error: availableError } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true })
      .eq('available', true);

    if (boardsError || availableError) {
      throw boardsError || availableError;
    }

    return {
      totalBoards: totalBoards || 0,
      availableBoards: availableBoards || 0,
    };
  },

  async getBookingStats() {
    const { count: totalBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    const { data: revenueData, error: revenueError } = await supabase
      .from('bookings')
      .select('total_amount');

    if (bookingsError || revenueError) {
      throw bookingsError || revenueError;
    }

    const totalRevenue = revenueData?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0;

    return {
      totalBookings: totalBookings || 0,
      totalRevenue,
    };
  },

  async getUserStats() {
    const { count: proUsers, error: proError } = await supabase
      .from('pro_users')
      .select('*', { count: 'exact', head: true });

    const { count: regularUsers, error: regularError } = await supabase
      .from('regular_users')
      .select('*', { count: 'exact', head: true });

    if (proError || regularError) {
      throw proError || regularError;
    }

    return {
      proUsers: proUsers || 0,
      regularUsers: regularUsers || 0,
      totalUsers: (proUsers || 0) + (regularUsers || 0),
    };
  },
};

export async function initUserProfile(role: 'regular' | 'pro', profile: {
  name: string; email: string; phone?: string; location?: string; avatar_url?: string; bio?: string;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not signed in');

  const args = {
    p_id: user.id,
    p_name: profile.name,
    p_email: profile.email,
    p_phone: profile.phone ?? null,
    p_location: profile.location ?? null,
    p_avatar_url: profile.avatar_url ?? null,
    p_bio: profile.bio ?? null,
  };

  if (role === 'pro') {
    const { error } = await supabase.rpc('upsert_pro_profile', args);
    if (error) throw error;
  } else {
    const { error } = await supabase.rpc('upsert_regular_profile', args);
    if (error) throw error;
  }
}

export async function becomePro() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase.rpc('promote_to_pro', { p_id: user.id });
  if (error) throw error;
}
