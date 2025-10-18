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
import { ShoppingCart, Truck, Info, X, ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCart } from '@/src/context/cart';
import { useBoardsBackend } from '@/src/context/boards-backend';

import { Board, BoardType } from '@/src/types/board';

function formatLocation(location: string): string {
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length === 0) return location;
  
  // Remove any zip codes (5 digits or 5-4 format)
  const filteredParts = parts.filter(part => {
    const cleaned = part.replace(/[^0-9]/g, '');
    return !(cleaned.length === 5 || cleaned.length === 9);
  });
  
  if (filteredParts.length === 0) return location;
  
  // Format as: City, State, Country (abbreviated)
  if (filteredParts.length >= 3) {
    const city = filteredParts[filteredParts.length - 3];
    const state = filteredParts[filteredParts.length - 2];
    const country = filteredParts[filteredParts.length - 1];
    
    // Abbreviate country to 2 letters if longer
    const countryAbbr = country.length > 3 
      ? country.substring(0, 2).toUpperCase() 
      : country.toUpperCase();
    
    return `${city}, ${state}, ${countryAbbr}`;
  }
  
  // Format as: City, Country (abbreviated)
  if (filteredParts.length === 2) {
    const city = filteredParts[0];
    const country = filteredParts[1];
    const countryAbbr = country.length > 3 
      ? country.substring(0, 2).toUpperCase() 
      : country.toUpperCase();
    return `${city}, ${countryAbbr}`;
  }
  
  return filteredParts[0];
}

export default function BoardsListScreen() {
  const insets = useSafeAreaInsets();
  const { ownerId, ownerName } = useLocalSearchParams<{ ownerId?: string; ownerName?: string }>();
  const { addToCart, getItemCount, cartItems } = useCart();
  const { boards } = useBoardsBackend();
  const [filtered, setFiltered] = useState<Board[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filter inputs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedBoardType, setSelectedBoardType] = useState<BoardType | ''>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  
  // Refs for scrolling
  const listRef = useRef<FlatList>(null);
  const cardRefs = useRef<Map<string, number>>(new Map());
  
  // Debounced keyword
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Live search - automatically filter when any input changes
  const performSearch = useCallback(() => {
    setLoading(true);
    
    // Simulate loading for UX
    setTimeout(() => {
      let results = ownerId 
        ? boards.filter(b => b.owner?.id === ownerId)
        : boards.slice(0, 50);
      
      // Date filter
      if (startDate && endDate) {
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        results = results.filter(board => {
          const boardStart = new Date(board.available_start);
          const boardEnd = new Date(board.available_end);
          return boardStart <= filterEnd && boardEnd >= filterStart;
        });
      }
      
      // Location filter
      if (location) {
        results = results.filter(board =>
          board.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      // Keyword filter
      if (debouncedKeyword) {
        results = results.filter(board =>
          board.short_name.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
          board.dimensions_detail.toLowerCase().includes(debouncedKeyword.toLowerCase())
        );
      }
      
      // Board type filter
      if (selectedBoardType) {
        results = results.filter(board => board.type === selectedBoardType);
      }
      
      // Sort by price
      results.sort((a, b) => {
        if (a.price_per_day === null) return 1;
        if (b.price_per_day === null) return -1;
        return a.price_per_day - b.price_per_day;
      });
      
      setFiltered(results);
      setLoading(false);
    }, 150);
  }, [boards, startDate, endDate, location, debouncedKeyword, selectedBoardType, ownerId]);

  // Auto-search when any filter changes
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Update filtered results when boards change initially
  useEffect(() => {
    if (boards.length > 0 && filtered.length === 0) {
      const initialBoards = ownerId 
        ? boards.filter(b => b.owner?.id === ownerId)
        : boards.slice(0, 50);
      setFiltered(initialBoards);
    }
  }, [boards, ownerId, filtered.length]);
  
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
  
  const handleCardPress = (boardId: string) => {
    setSelectedId(boardId);
  };
  
  const handleThumbnailPress = (boardId: string) => {
    router.push(`/board-preview?boardId=${boardId}`);
  };

  const isBoardInCart = (boardId: string) => {
    return cartItems.some(item => item.board.id === boardId);
  };

  const handleAddToCart = (board: Board) => {
    if (!board || !board.id) {
      Alert.alert('Error', 'Invalid board selected');
      return;
    }
    
    if (isBoardInCart(board.id)) {
      Alert.alert('Already in Cart', `${board.short_name} is already in your cart!`);
      return;
    }
    
    // Use today and tomorrow as default dates for quick add
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    addToCart(board, today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]);
    Alert.alert('Added to Cart', `${board.short_name} has been added to your cart!`);
  };

  const renderBoardCard = ({ item, index }: { item: Board; index: number }) => {
    const isSelected = item.id === selectedId;
    const inCart = isBoardInCart(item.id);
    
    return (
      <Pressable
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleCardPress(item.id)}
        onLayout={(event) => {
          cardRefs.current.set(item.id, index);
        }}
      >
        <Pressable 
          style={styles.cardThumbnail}
          onPress={() => handleThumbnailPress(item.id)}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="contain"
          />
          <View style={styles.typeOverlay}>
            <Text style={styles.typeOverlayText}>
              {item.type === 'soft-top' ? 'SOFT' : 
               item.type === 'longboard' ? 'LONG' : 
               item.type === 'shortboard' ? 'SHORT' :
               item.type === 'fish' ? 'FISH' : 'SUP'}
            </Text>
          </View>
        </Pressable>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.short_name}</Text>
        <Text style={styles.cardDims} numberOfLines={1}>{item.dimensions_detail}</Text>
        <Text style={styles.cardPrice}>
          {item.price_per_day ? `${item.price_per_day}/day • ${item.price_per_week}/week` : 'Price TBD'}
        </Text>
        <View style={styles.locationRow}>
          <Text style={styles.cardLocation} numberOfLines={1}>{formatLocation(item.location)}</Text>
          <View style={styles.locationIcons}>
            {item.delivery_available && (
              <View style={styles.deliveryIcon}>
                <Truck size={16} color="#007AFF" />
              </View>
            )}
            {item.owner && (
              <View style={styles.ownerAvatar}>
                <Image
                  source={{ uri: item.owner.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        </View>
        <Pressable
          style={[
            styles.addButton,
            inCart && styles.addButtonInCart
          ]}
          onPress={() => handleAddToCart(item)}
          disabled={inCart}
        >
          <Text style={[
            styles.addButtonText,
            inCart && styles.addButtonTextInCart
          ]}>
            {inCart ? 'In Cart' : 'Add to Cart'}
          </Text>
        </Pressable>
      </Pressable>
    );
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Back Button and Cart */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#007AFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{ownerName ? `${ownerName}'s Boards` : 'All Boards (50)'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            style={styles.infoButton}
            onPress={() => setShowInfoBubble(true)}
          >
            <Info size={24} color="#007AFF" />
          </Pressable>
          <Pressable 
            style={styles.cartBadge}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <ShoppingCart size={24} color="#333" />
            {getItemCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getItemCount()}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
      
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          <DatePicker
            value={startDate}
            onDateChange={setStartDate}
            placeholder="Start Date"
          />
          <DatePicker
            value={endDate}
            onDateChange={setEndDate}
            placeholder="End Date"
          />
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
          <Pressable
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {boardTypes.find(type => type.value === selectedBoardType)?.label || 'All Board Types'}
            </Text>
          </Pressable>

        </View>
      </View>
      
      {/* Board Type Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            {boardTypes.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.dropdownItem,
                  selectedBoardType === type.value && styles.dropdownItemSelected
                ]}
                onPress={() => handleBoardTypeSelect(type.value)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedBoardType === type.value && styles.dropdownItemTextSelected
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      
      {/* Info Bubble Modal */}
      <Modal
        visible={showInfoBubble}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoBubble(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowInfoBubble(false)}
        >
          <View style={styles.infoBubble}>
            <View style={styles.infoBubbleHeader}>
              <Info size={20} color="#007AFF" />
              <Text style={styles.infoBubbleTitle}>Browse All Boards</Text>
              <Pressable
                style={styles.infoBubbleClose}
                onPress={() => setShowInfoBubble(false)}
              >
                <X size={20} color="#666" />
              </Pressable>
            </View>
            <View style={styles.infoBubbleContent}>
              <Text style={styles.infoBubbleTip}>🏄 <Text style={styles.infoBubbleBold}>Browse 50 boards</Text> from our collection</Text>
              <Text style={styles.infoBubbleTip}>🔍 <Text style={styles.infoBubbleBold}>Use filters</Text> to narrow down your search</Text>
              <Text style={styles.infoBubbleTip}>📱 <Text style={styles.infoBubbleBold}>Tap board images</Text> to view full details</Text>
              <Text style={styles.infoBubbleTip}>🛒 <Text style={styles.infoBubbleBold}>Quick add to cart</Text> with default dates</Text>
              <Text style={styles.infoBubbleTip}>👤 <Text style={styles.infoBubbleBold}>Owner avatars</Text> show who owns each board</Text>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No boards match your filters.</Text>
          </View>
        ) : (
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
              console.log('ScrollToIndex failed:', info);
              // Fallback to scroll to end or beginning
              if (listRef.current) {
                const targetIndex = Math.min(info.index, filtered.length - 1);
                setTimeout(() => {
                  listRef.current?.scrollToIndex({ 
                    index: targetIndex, 
                    animated: true, 
                    viewPosition: 0.5 
                  });
                }, 50);
              }
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoButton: {
    padding: 4,
  },
  cartBadge: {
    position: 'relative',
  },
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
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
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
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#007AFF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: 'white',
  },

  listContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: Platform.OS === 'web' ? 8 : 16,
  },
  cardRow: {
    justifyContent: 'space-between',
    gap: Platform.OS === 'web' ? 8 : 0,
  },
  cardRowMobile: {
    justifyContent: 'space-around',
  },
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
    minHeight: Platform.OS === 'web' ? 360 : 340,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  cardThumbnail: {
    height: Platform.OS === 'web' ? 220 : 160,
    borderRadius: 8,
    marginBottom: Platform.OS === 'web' ? 6 : 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  typeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeOverlayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  cardTitle: {
    fontSize: Platform.OS === 'web' ? 14 : 16,
    fontWeight: '600',
    marginBottom: Platform.OS === 'web' ? 3 : 4,
    height: Platform.OS === 'web' ? 20 : 22,
  },
  cardDims: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#666',
    marginBottom: Platform.OS === 'web' ? 3 : 4,
    height: Platform.OS === 'web' ? 18 : 20,
  },
  cardPrice: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: Platform.OS === 'web' ? 3 : 4,
    height: Platform.OS === 'web' ? 18 : 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 6 : 8,
    gap: 6,
    height: 20,
  },
  cardLocation: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#999',
    flex: 1,
  },
  locationIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryIcon: {
    flexShrink: 0,
  },
  ownerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: Platform.OS === 'web' ? 6 : 8,
    alignItems: 'center',
  },
  addButtonInCart: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: Platform.OS === 'web' ? 12 : 14,
  },
  addButtonTextInCart: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
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
});