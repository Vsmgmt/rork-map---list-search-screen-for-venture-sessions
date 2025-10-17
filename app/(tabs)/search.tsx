import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import DatePicker from '@/components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, Truck, Info, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '@/src/context/cart';
import { Board, BoardType } from '@/src/types/board';
import { supabase } from '@/lib/supabase';
import { SEED_PRO_USERS } from '@/src/data/seed-pro-users';
import { SEED_BOARDS } from '@/src/data/seed-boards';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  avatarUrl?: string;
  avatar_url?: string;
  joinedDate?: string;
  joined_date?: string;
  rating?: number;
  type?: string;
}

/** Pick the best cover image URL for a board (supports snake_case + camelCase). */
function coverFor(board: any): string | null {
  if (!board) return null;
  if (typeof board.image_url === 'string' && board.image_url.startsWith('http')) return board.image_url;
  if (typeof board.imageUrl === 'string' && board.imageUrl.startsWith('http')) return board.imageUrl;
  // Optional: if you stored storage paths like "boards/86.png", you could translate them here
  // to a public URL using your Supabase project URL. For now, return null so we show a fallback.
  return null;
}

/** Owner avatar helper (optional; safe default) */
function ownerAvatarFor(item: any): string | null {
  const u = item?.owner?.avatar_url ?? item?.owner?.avatarUrl;
  return typeof u === 'string' && u.startsWith('http') ? u : null;
}

type SupabaseBoard = {
  id: string;
  name?: string | null;
  title?: string | null;
  shaper?: string | null;
  dimensions?: string | null;
  length_in?: number | null;
  width_in?: number | null;
  thickness_in?: number | null;
  volume_l?: number | null;
  fin_setup?: string | null;
  condition?: string | null;
  location?: string | null;
  availability_start?: string | null;
  availability_end?: string | null;
  sale_price?: number | null;
  rent_price_per_day?: number | null;
  rent_price_per_week?: number | null;
  owner_id?: string | null;
  owner_name?: string | null;
  owner_avatar_url?: string | null;
  image_url?: string | null;
  image_urls?: string[];
  images?: { image_url: string }[];
  owner?: {
    id: string;
    name?: string | null;
    avatar_url?: string | null;
  };
  type?: string | null;
  short_name?: string | null;
  dimensions_detail?: string | null;
  price_per_day?: number | null;
  price_per_week?: number | null;
  available_start?: string | null;
  available_end?: string | null;
  delivery_available?: boolean | null;
  delivery_price?: number | null;
  pickup_spot?: string | null;
  lat?: number | null;
  lon?: number | null;
  created_at?: string | null;
};

function coerceBoard(row: SupabaseBoard): Board {
  const gallery = row.image_urls ?? row.images?.map((i: any) => i.image_url) ?? [];
  const primary = row.image_url ?? gallery[0] ?? '';
  
  const boardType: BoardType = 
    row.type === 'soft-top' ? 'soft-top' :
    row.type === 'shortboard' ? 'shortboard' :
    row.type === 'fish' ? 'fish' :
    row.type === 'longboard' ? 'longboard' :
    row.type === 'sup' ? 'sup' : 'shortboard';
  
  return {
    id: row.id,
    short_name: row.short_name ?? row.name ?? row.title ?? '',
    dimensions_detail: row.dimensions_detail ?? row.dimensions ?? '',
    volume_l: row.volume_l ?? null,
    price_per_day: row.price_per_day ?? row.rent_price_per_day ?? null,
    price_per_week: row.price_per_week ?? row.rent_price_per_week ?? null,
    available_start: row.available_start ?? row.availability_start ?? '',
    available_end: row.available_end ?? row.availability_end ?? '',
    location: row.location ?? '',
    pickup_spot: row.pickup_spot ?? '',
    lat: row.lat ?? 0,
    lon: row.lon ?? 0,
    type: boardType,
    imageUrl: primary,
    image_url: primary,
    delivery_available: row.delivery_available ?? false,
    delivery_price: row.delivery_price ?? 0,
    owner: {
      id: row.owner_id ?? row.owner?.id ?? '',
      name: row.owner_name ?? row.owner?.name ?? '',
      email: '',
      location: row.location ?? '',
      rating: 4.5,
      avatarUrl: row.owner_avatar_url ?? row.owner?.avatar_url ?? '',
      avatar_url: row.owner_avatar_url ?? row.owner?.avatar_url ?? '',
    },
  };
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { addToCart, getItemCount, cartItems } = useCart();

  const [searchMode, setSearchMode] = useState<'boards' | 'users'>('boards');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [boards, setBoards] = useState<Board[]>([]);
  const [filtered, setFiltered] = useState<Board[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [boardsError, setBoardsError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedBoardType, setSelectedBoardType] = useState<BoardType | ''>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInfoBubble, setShowInfoBubble] = useState(false);

  // Refs
  const listRef = useRef<FlatList<Board>>(null);
  const cardRefs = useRef<Map<string, number>>(new Map());

  // Debounce keyword a bit
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    const fetchBoards = async () => {
      setLoadingBoards(true);
      setBoardsError(null);
      try {
        console.log('🔄 Fetching boards from Supabase...');
        
        let data: SupabaseBoard[] | null = null;
        let error: any = null;
        
        ({ data, error } = await supabase
          .from('mv_boards_with_owner_and_images')
          .select('*')
          .order('created_at', { ascending: false }));
        
        if (error || !data) {
          console.log('⚠️ Materialized view not found, trying plain view...');
          ({ data, error } = await supabase
            .from('v_boards_with_owner_and_images')
            .select('*')
            .order('created_at', { ascending: false }));
        }
        
        if (error || !data) {
          console.log('⚠️ View not found, querying base tables...');
          const { data: baseBoards, error: bErr } = await supabase
            .from('boards')
            .select('*')
            .order('created_at', { ascending: false });
          if (bErr) throw bErr;
          
          const ids = (baseBoards ?? []).map(b => b.id);
          let imageMap: Record<string, string[]> = {};
          if (ids.length) {
            const { data: maps } = await supabase
              .from('board_image_map')
              .select('board_id, image_id')
              .in('board_id', ids);
            
            const imageIds = Array.from(new Set((maps ?? []).map(m => m.image_id)));
            const { data: images } = imageIds.length
              ? await supabase.from('stock_images')
                  .select('id, image_url')
                  .in('id', imageIds)
              : { data: [] as any[] };
            const imgById = Object.fromEntries((images ?? []).map(i => [i.id, i.image_url]));
            
            (maps ?? []).forEach(m => {
              if (!imageMap[m.board_id]) imageMap[m.board_id] = [];
              const url = imgById[m.image_id];
              if (url) imageMap[m.board_id].push(url);
            });
          }
          
          data = (baseBoards ?? []).map(b => ({
            ...b,
            image_urls: imageMap[b.id] ?? [],
          }));
        }
        
        const normalized = (data ?? []).map(coerceBoard);
        console.log('✅ Fetched boards from Supabase:', normalized.length);
        
        const seedBoardsConverted: Board[] = SEED_BOARDS.map(sb => ({
          id: sb.id,
          short_name: sb.name,
          dimensions_detail: sb.dimensions ?? '',
          volume_l: sb.volume_l,
          price_per_day: sb.rent_price_per_day,
          price_per_week: sb.rent_price_per_week,
          available_start: sb.availability_start,
          available_end: sb.availability_end,
          location: sb.location,
          pickup_spot: 'Beach parking lot',
          lat: 21.3099,
          lon: -157.8581,
          type: 'shortboard' as BoardType,
          imageUrl: sb.image_url,
          image_url: sb.image_url,
          delivery_available: true,
          delivery_price: 50,
          owner: {
            id: sb.owner_id,
            name: sb.owner_name,
            email: '',
            location: sb.location,
            rating: 4.5,
            avatarUrl: sb.owner_avatar_url,
            avatar_url: sb.owner_avatar_url,
          },
        }));
        
        const boardList = normalized && normalized.length > 0 ? normalized : seedBoardsConverted;
        
        if (boardList.length === 0 || normalized.length === 0) {
          console.log('⚠️ No boards in Supabase, using local seed boards:', SEED_BOARDS.length);
        }
        
        setBoards(boardList);
        setFiltered(boardList);
        setBoardsError(null);
      } catch (err: any) {
        console.error('❌ Boards fetch failed:', err?.message ?? err);
        setBoardsError(err?.message ?? 'Failed to load boards');
        console.log('⚠️ Using seed boards due to error');
        
        const seedBoardsList: Board[] = SEED_BOARDS.map(sb => ({
          id: sb.id,
          short_name: sb.name,
          dimensions_detail: sb.dimensions ?? '',
          volume_l: sb.volume_l,
          price_per_day: sb.rent_price_per_day,
          price_per_week: sb.rent_price_per_week,
          available_start: sb.availability_start,
          available_end: sb.availability_end,
          location: sb.location,
          pickup_spot: 'Beach parking lot',
          lat: 21.3099,
          lon: -157.8581,
          type: 'shortboard' as BoardType,
          imageUrl: sb.image_url,
          image_url: sb.image_url,
          delivery_available: true,
          delivery_price: 50,
          owner: {
            id: sb.owner_id,
            name: sb.owner_name,
            email: '',
            location: sb.location,
            rating: 4.5,
            avatarUrl: sb.owner_avatar_url,
            avatar_url: sb.owner_avatar_url,
          },
        }));
        
        setBoards(seedBoardsList);
        setFiltered(seedBoardsList);
      } finally {
        setLoadingBoards(false);
      }
    };
    fetchBoards();
  }, []);

  // Fetch users directly from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        console.log('🔄 Fetching users from Supabase...');
        
        const { data, error } = await supabase
          .from('pro_users')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('❌ Supabase user fetch error:', error);
          throw error;
        }

        console.log('✅ Fetched users from Supabase:', data?.length || 0);
        
        if (data && data.length > 0) {
          setAllUsers(data);
          setUsers(data);
          setFilteredUsers(data);
        } else {
          console.log('⚠️ No users in Supabase, using local seed users:', SEED_PRO_USERS.length);
          setAllUsers(SEED_PRO_USERS);
          setUsers(SEED_PRO_USERS);
          setFilteredUsers(SEED_PRO_USERS);
        }
      } catch (err: any) {
        console.error('❌ Error fetching pro users:', err.message);
        console.log('⚠️ User fetch failed, using local seed data');
        setAllUsers(SEED_PRO_USERS);
        setUsers(SEED_PRO_USERS);
        setFilteredUsers(SEED_PRO_USERS);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Live search (client-side) for users
  const performUserSearch = useCallback(() => {
    setTimeout(() => {
      let results = [...users];

      if (location) {
        const q = location.toLowerCase();
        results = results.filter((u: any) => String(u.location ?? '').toLowerCase().includes(q));
      }

      if (debouncedKeyword) {
        const q = debouncedKeyword.toLowerCase();
        results = results.filter((u: any) =>
          String(u.name ?? '').toLowerCase().includes(q) ||
          String(u.email ?? '').toLowerCase().includes(q)
        );
      }

      results.sort((a: any, b: any) => {
        const aName = a?.name ?? '';
        const bName = b?.name ?? '';
        return aName.localeCompare(bName);
      });

      setFilteredUsers(results as User[]);
    }, 150);
  }, [users, location, debouncedKeyword]);

  // Live search (client-side) for boards
  const performSearch = useCallback(() => {
    setTimeout(() => {
      let results = [...boards];

      // Date overlap filter
      if (startDate && endDate) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        results = results.filter((b: any) => {
          const bs = new Date(b.available_start ?? '1900-01-01');
          const be = new Date(b.available_end ?? '2999-12-31');
          return bs <= e && be >= s;
        });
      }

      if (location) {
        const q = location.toLowerCase();
        results = results.filter((b: any) => String(b.location ?? '').toLowerCase().includes(q));
      }

      if (debouncedKeyword) {
        const q = debouncedKeyword.toLowerCase();
        results = results.filter((b: any) =>
          String(b.short_name ?? '').toLowerCase().includes(q) ||
          String(b.dimensions_detail ?? '').toLowerCase().includes(q)
        );
      }

      if (selectedBoardType) {
        results = results.filter((b: any) => b.type === selectedBoardType);
      }

      // Sort alphabetically by short_name
      results.sort((a: any, b: any) => {
        const aName = a?.short_name ?? '';
        const bName = b?.short_name ?? '';
        return aName.localeCompare(bName);
      });

      setFiltered(results as Board[]);
    }, 150);
  }, [boards, startDate, endDate, location, debouncedKeyword, selectedBoardType]);

  useEffect(() => {
    if (searchMode === 'boards') {
      performSearch();
    } else {
      performUserSearch();
    }
  }, [performSearch, performUserSearch, searchMode]);

  const boardTypes: { value: BoardType | ''; label: string }[] = [
    { value: '', label: 'All Board Types' },
    { value: 'soft-top', label: 'Soft-top' },
    { value: 'shortboard', label: 'Shortboard' },
    { value: 'fish', label: 'Fish' },
    { value: 'longboard', label: 'Longboard' },
    { value: 'sup', label: 'SUP' },
  ];

  const handleBoardTypeSelect = (type: BoardType | '') => {
    setSelectedBoardType(type);
    setShowDropdown(false);
  };

  const handleCardPress = (boardId: string) => setSelectedId(boardId);

  const handleThumbnailPress = (boardId: string) => {
    router.push(`/board-preview?boardId=${boardId}`);
  };

  const isBoardInCart = (boardId: string) => cartItems.some((i) => i.board.id === boardId);

  const handleAddToCart = (board: Board) => {
    if (!board?.id) {
      Alert.alert('Error', 'Invalid board selected');
      return;
    }
    if (isBoardInCart(board.id)) {
      Alert.alert('Already in Cart', `${board.short_name} is already in your cart!`);
      return;
    }
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    addToCart(board, today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]);
    Alert.alert('Added to Cart', `${board.short_name} has been added to your cart!`);
  };

  const renderBoardCard = ({ item, index }: { item: Board; index: number }) => {
    const isSelected = item.id === selectedId;
    const inCart = isBoardInCart(item.id);
    const cover = coverFor(item);
    const ownerAvatar = ownerAvatarFor(item);

    return (
      <Pressable
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleCardPress(item.id)}
        onLayout={() => cardRefs.current.set(item.id, index)}
      >
        <Pressable style={styles.cardThumbnail} onPress={() => handleThumbnailPress(item.id)}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={styles.cardImage}
              resizeMode="contain"
              onError={(e) => {
                console.warn('Image failed', { id: item.id, cover, error: e?.nativeEvent });
              }}
            />
          ) : (
            <View
              style={[
                styles.cardImage,
                { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
              ]}
            >
              <Text>No Image</Text>
            </View>
          )}
          <View style={styles.typeOverlay}>
            <Text style={styles.typeOverlayText}>
              {item.type === 'soft-top'
                ? 'SOFT'
                : item.type === 'longboard'
                ? 'LONG'
                : item.type === 'shortboard'
                ? 'SHORT'
                : item.type === 'fish'
                ? 'FISH'
                : 'SUP'}
            </Text>
          </View>
        </Pressable>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.short_name}
        </Text>
        <Text style={styles.cardDims}>{item.dimensions_detail}</Text>

        {item.price_per_day != null && (
          <Text style={styles.cardPrice}>
            ${item.price_per_day}/day • ${item.price_per_week}/week
          </Text>
        )}

        <View style={styles.locationRow}>
          <Text style={styles.cardLocation}>{item.location}</Text>
          <View style={styles.locationIcons}>
            {item.delivery_available && (
              <View style={styles.deliveryIcon}>
                <Truck size={16} color="#007AFF" />
              </View>
            )}
            <View style={styles.ownerAvatar}>
              {ownerAvatar ? (
                <Image source={{ uri: ownerAvatar }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <View
                  style={[
                    styles.avatarImage,
                    { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Text style={{ color: '#fff', fontSize: 10 }}>No Avatar</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.addButton, inCart && styles.addButtonInCart]}
          onPress={() => handleAddToCart(item)}
          disabled={inCart}
        >
          <Text style={[styles.addButtonText, inCart && styles.addButtonTextInCart]}>
            {inCart ? 'In Cart' : 'Add to Cart'}
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  const renderUserCard = ({ item }: { item: User }) => {
    const isSelected = item.id === selectedUserId;
    const userAvatar = item.avatar_url || item.avatarUrl;

    return (
      <Pressable
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedUserId(item.id)}
      >
        <View style={styles.userAvatarContainer}>
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={styles.userAvatarLarge}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.userAvatarLarge, { backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
                {item.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardDims} numberOfLines={1}>{item.email}</Text>

        {item.phone && (
          <Text style={styles.cardDims}>{item.phone}</Text>
        )}

        <View style={styles.locationRow}>
          <Text style={styles.cardLocation}>{item.location}</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => {
            Alert.alert('User Profile', `Name: ${item.name}\nEmail: ${item.email}\nLocation: ${item.location}`);
          }}
        >
          <Text style={styles.addButtonText}>View Profile</Text>
        </Pressable>
      </Pressable>
    );
  };

  if (loadingBoards || loadingUsers) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Venture Sessions</Text>
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, searchMode === 'boards' && styles.toggleButtonActive]}
            onPress={() => setSearchMode('boards')}
          >
            <Text style={[styles.toggleButtonText, searchMode === 'boards' && styles.toggleButtonTextActive]}>
              Boards
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, searchMode === 'users' && styles.toggleButtonActive]}
            onPress={() => setSearchMode('users')}
          >
            <Text style={[styles.toggleButtonText, searchMode === 'users' && styles.toggleButtonTextActive]}>
              Users
            </Text>
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.infoButton} onPress={() => setShowInfoBubble(true)}>
            <Info size={24} color="#007AFF" />
          </Pressable>
          <Pressable style={styles.cartBadge} onPress={() => router.push('/(tabs)/cart')}>
            <ShoppingCart size={24} color="#333" />
            {getItemCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getItemCount()}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Filters */}
      {searchMode === 'boards' && (
        <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          <DatePicker value={startDate} onDateChange={setStartDate} placeholder="Start Date" />
          <DatePicker value={endDate} onDateChange={setEndDate} placeholder="End Date" />
          <TextInput
            style={styles.filterInput}
            placeholder="Location"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.filterRow}>
          <TextInput
            style={styles.filterInput}
            placeholder="Keyword"
            value={keyword}
            onChangeText={setKeyword}
          />
          <Pressable style={styles.dropdownButton} onPress={() => setShowDropdown(true)}>
            <Text style={styles.dropdownButtonText}>
              {boardTypes.find((t) => t.value === selectedBoardType)?.label || 'All Board Types'}
            </Text>
          </Pressable>
        </View>
      </View>
      )}

      {/* User Filters */}
      {searchMode === 'users' && (
        <View style={styles.filterBar}>
          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="Location"
              value={location}
              onChangeText={setLocation}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Search by name or email"
              value={keyword}
              onChangeText={setKeyword}
            />
          </View>
        </View>
      )}

      {/* Board Type Dropdown */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownModal}>
            {boardTypes.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.dropdownItem, selectedBoardType === t.value && styles.dropdownItemSelected]}
                onPress={() => handleBoardTypeSelect(t.value)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedBoardType === t.value && styles.dropdownItemTextSelected,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Info Bubble */}
      <Modal
        visible={showInfoBubble}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoBubble(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowInfoBubble(false)}>
          <View style={styles.infoBubble}>
            <View style={styles.infoBubbleHeader}>
              <Info size={20} color="#007AFF" />
              <Text style={styles.infoBubbleTitle}>How to use Search</Text>
              <Pressable style={styles.infoBubbleClose} onPress={() => setShowInfoBubble(false)}>
                <X size={20} color="#666" />
              </Pressable>
            </View>
            <View style={styles.infoBubbleContent}>
              <Text style={styles.infoBubbleTip}>
                🔍 <Text style={styles.infoBubbleBold}>Filter by dates</Text> to find boards available
                for your trip
              </Text>
              <Text style={styles.infoBubbleTip}>
                📍 <Text style={styles.infoBubbleBold}>Search by location</Text> to find boards near
                your destination
              </Text>
              <Text style={styles.infoBubbleTip}>
                🏄 <Text style={styles.infoBubbleBold}>Filter by board type</Text> to find the
                perfect board for your skill level
              </Text>
              <Text style={styles.infoBubbleTip}>
                🛒 <Text style={styles.infoBubbleBold}>Tap board images</Text> to view details or add
                to cart quickly
              </Text>
              <Text style={styles.infoBubbleTip}>
                🚚 <Text style={styles.infoBubbleBold}>Delivery icon</Text> shows boards available
                for delivery
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* List */}
      <View style={styles.listContainer}>
        {searchMode === 'boards' ? (
          filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No boards match your filters.</Text>
              <Text style={styles.emptyStateSubtext}>Total boards loaded: {boards.length}</Text>
              <Text style={styles.emptyStateSubtext}>
                Source: {boards.length > 0 && boards[0]?.id?.startsWith('seed-') ? 'Local Seed Data' : 'Supabase Database'}
              </Text>
              {boardsError && <Text style={styles.emptyStateSubtext}>Error: {boardsError}</Text>}
            </View>
          ) : (
            <>
              <View style={{ padding: 16, backgroundColor: '#f0f0f0' }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Showing {filtered.length} of {boards.length} boards from {boards.length > 0 && boards[0]?.id?.startsWith('seed-') ? 'Local Seed' : 'Supabase'}
                </Text>
              </View>
              <FlatList
                ref={listRef}
                data={filtered}
                renderItem={renderBoardCard}
                keyExtractor={(item) => item.id}
                key={Platform.OS === 'web' ? 'web-4-cols' : 'mobile-2-cols'}
                numColumns={Platform.OS === 'web' ? 4 : 2}
                columnWrapperStyle={Platform.OS === 'web' ? styles.cardRow : styles.cardRowMobile}
                contentContainerStyle={styles.listContent}
                onScrollToIndexFailed={(info) => {
                  const target = Math.min(info.index, filtered.length - 1);
                  setTimeout(() => listRef.current?.scrollToIndex({ index: target, viewPosition: 0.5 }), 50);
                }}
              />
            </>
          )
        ) : (
          filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No users found.</Text>
              <Text style={styles.emptyStateSubtext}>
                Total users loaded: {users.length}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Source: {allUsers && allUsers.length > 0 ? 'Supabase Database' : 'Local Seed Data'}
              </Text>
              {loadingUsers && <Text style={styles.emptyStateSubtext}>Loading...</Text>}
            </View>
          ) : (
            <>
              <View style={{ padding: 16, backgroundColor: '#f0f0f0' }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Showing {filteredUsers.length} of {users.length} users from {allUsers && allUsers.length > 0 ? 'Supabase' : 'Local Seed'}
                </Text>
              </View>
              <FlatList
                data={filteredUsers}
                renderItem={renderUserCard}
                keyExtractor={(item) => item.id}
                key={Platform.OS === 'web' ? 'web-4-cols-users' : 'mobile-2-cols-users'}
                numColumns={Platform.OS === 'web' ? 4 : 2}
                columnWrapperStyle={Platform.OS === 'web' ? styles.cardRow : styles.cardRowMobile}
                contentContainerStyle={styles.listContent}
              />
            </>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoButton: { padding: 4 },
  cartBadge: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  filterBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: Platform.OS === 'web' ? 'nowrap' : 'wrap',
  },
  filterInput: {
    flex: 1,
    minWidth: 120,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  dropdownButton: {
    flex: 1,
    minWidth: 120,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  dropdownButtonText: { fontSize: 14, color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemSelected: { backgroundColor: '#007AFF' },
  dropdownItemText: { fontSize: 16, color: '#333' },
  dropdownItemTextSelected: { color: 'white' },

  listContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: Platform.OS === 'web' ? 8 : 16 },
  cardRow: { justifyContent: 'space-between', gap: Platform.OS === 'web' ? 8 : 0 },
  cardRowMobile: { justifyContent: 'space-around' },

  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: Platform.OS === 'web' ? 8 : 12,
    marginBottom: Platform.OS === 'web' ? 8 : 12,
    flex: Platform.OS === 'web' ? 0.24 : 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSelected: { borderWidth: 2, borderColor: '#007AFF' },
  cardThumbnail: {
    height: Platform.OS === 'web' ? 220 : 160,
    borderRadius: 8,
    marginBottom: Platform.OS === 'web' ? 6 : 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  cardImage: { width: '100%', height: '100%' },
  typeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeOverlayText: { color: 'white', fontWeight: 'bold', fontSize: 10 },

  cardTitle: { fontSize: Platform.OS === 'web' ? 14 : 16, fontWeight: '600', marginBottom: Platform.OS === 'web' ? 3 : 4 },
  cardDims: { fontSize: Platform.OS === 'web' ? 12 : 14, color: '#666', marginBottom: Platform.OS === 'web' ? 3 : 4 },
  cardPrice: { fontSize: Platform.OS === 'web' ? 12 : 14, fontWeight: '500', color: '#4CAF50', marginBottom: Platform.OS === 'web' ? 3 : 4 },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Platform.OS === 'web' ? 6 : 8, gap: 6 },
  cardLocation: { fontSize: Platform.OS === 'web' ? 12 : 14, color: '#999', flex: 1 },
  locationIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveryIcon: { flexShrink: 0 },

  ownerAvatar: { width: 20, height: 20, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  avatarImage: { width: '100%', height: '100%' },

  addButton: { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: Platform.OS === 'web' ? 6 : 8, alignItems: 'center' },
  addButtonInCart: { backgroundColor: '#4CAF50', opacity: 0.8 },
  addButtonText: { color: 'white', fontWeight: '600', fontSize: Platform.OS === 'web' ? 12 : 14 },
  addButtonTextInCart: { color: 'white' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyStateText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 4 },

  infoBubble: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  infoBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 8,
  },
  infoBubbleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  infoBubbleClose: {
    padding: 4,
  },
  infoBubbleContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  infoBubbleTip: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  infoBubbleBold: {
    fontWeight: '600',
    color: '#333',
  },

  userAvatarContainer: {
    height: Platform.OS === 'web' ? 220 : 160,
    borderRadius: 8,
    marginBottom: Platform.OS === 'web' ? 6 : 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarLarge: {
    width: '80%',
    height: '80%',
    borderRadius: 999,
  },
});
