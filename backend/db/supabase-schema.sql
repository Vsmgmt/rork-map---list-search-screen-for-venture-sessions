-- Supabase Database Schema for Surfboard Rental App
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  short_name TEXT NOT NULL,
  location TEXT NOT NULL,
  board_type TEXT NOT NULL,
  price_per_day DECIMAL(10,2),
  description TEXT,
  images TEXT[], -- Array of image URLs (legacy)
  image_url TEXT, -- Primary board image URL
  image_path TEXT, -- Storage path for the image
  owner_id TEXT,
  owner_name TEXT,
  owner_avatar TEXT,
  owner_rating DECIMAL(3,2),
  owner_reviews_count INTEGER,
  rating DECIMAL(3,2),
  reviews_count INTEGER,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pro_users table
CREATE TABLE IF NOT EXISTS pro_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  boards_count INTEGER DEFAULT 0,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regular_users table
CREATE TABLE IF NOT EXISTS regular_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'regular',
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  confirmation_number TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed',
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_items JSONB, -- Store order items as JSON
  customer_info JSONB, -- Store customer info as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table (for chat functionality)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  participants TEXT[] NOT NULL, -- Array of user IDs
  last_message TEXT,
  last_message_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boards_location ON boards(location);
CREATE INDEX IF NOT EXISTS idx_boards_type ON boards(board_type);
CREATE INDEX IF NOT EXISTS idx_boards_price ON boards(price_per_day);
CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regular_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access on boards" ON boards FOR SELECT USING (true);
CREATE POLICY "Allow public read access on pro_users" ON pro_users FOR SELECT USING (true);
CREATE POLICY "Allow public read access on regular_users" ON regular_users FOR SELECT USING (true);
CREATE POLICY "Allow public access on bookings" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow public access on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow public access on conversations" ON conversations FOR ALL USING (true);

-- Allow public insert/update/delete (adjust as needed)
CREATE POLICY "Allow public insert on boards" ON boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on boards" ON boards FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on pro_users" ON pro_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on pro_users" ON pro_users FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on regular_users" ON regular_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on regular_users" ON regular_users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on regular_users" ON regular_users FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pro_users_updated_at BEFORE UPDATE ON pro_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regular_users_updated_at BEFORE UPDATE ON regular_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC function to link board image (updates image_url and image_path)
CREATE OR REPLACE FUNCTION link_board_image(
  p_board_id TEXT,
  p_image_url TEXT,
  p_image_path TEXT,
  p_is_primary BOOLEAN DEFAULT true,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS void AS $
BEGIN
  UPDATE boards
  SET 
    image_url = p_image_url,
    image_path = p_image_path,
    updated_at = NOW()
  WHERE id = p_board_id;
END;
$ LANGUAGE plpgsql;

-- RPC function to get board by ID with owner details (fast query)
CREATE OR REPLACE FUNCTION get_board_by_id_fast(p_id TEXT)
RETURNS TABLE (
  id TEXT,
  short_name TEXT,
  location TEXT,
  board_type TEXT,
  price_per_day DECIMAL,
  description TEXT,
  images TEXT[],
  image_url TEXT,
  image_path TEXT,
  owner_id TEXT,
  owner_name TEXT,
  owner_avatar TEXT,
  owner_rating DECIMAL,
  owner_reviews_count INTEGER,
  rating DECIMAL,
  reviews_count INTEGER,
  available BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  owner JSONB
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.short_name,
    b.location,
    b.board_type,
    b.price_per_day,
    b.description,
    b.images,
    b.image_url,
    b.image_path,
    b.owner_id,
    b.owner_name,
    b.owner_avatar,
    b.owner_rating,
    b.owner_reviews_count,
    b.rating,
    b.reviews_count,
    b.available,
    b.created_at,
    b.updated_at,
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'email', p.email,
      'location', p.location,
      'avatar_url', p.avatar_url,
      'is_verified', p.is_verified,
      'rating', p.rating,
      'boards_count', p.boards_count,
      'joined_date', p.joined_date
    ) as owner
  FROM boards b
  LEFT JOIN pro_users p ON b.owner_id = p.id
  WHERE b.id = p_id;
END;
$ LANGUAGE plpgsql;