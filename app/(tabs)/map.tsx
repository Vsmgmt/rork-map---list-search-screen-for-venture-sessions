import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ImageBackground,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  ScrollView,
} from 'react-native';
import DatePicker from '@/components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, X, MapPin, Info, Truck, GraduationCap } from 'lucide-react-native';
import { router } from 'expo-router';
import { lonLatToXY, jitterOverlappingMarkers, calculateDistance } from '@/src/util/geo';
import { useCart } from '@/src/context/cart';
import { useBoardsBackend } from '@/src/context/boards-backend';
import { useSessions } from '@/src/context/sessions';
import { Board, BoardType } from '@/src/types/board';
import { Session, SessionType, SessionLevel } from '@/src/types/session';

const WORLD_MAP_URL = 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=2000&h=1000&fit=crop';
const MARKER_URL = 'https://cdn-icons-png.flaticon.com/32/684/684908.png';

const MAP_INTRINSIC_WIDTH = 2000;
const MAP_INTRINSIC_HEIGHT = 1000;

type ViewMode = 'boards' | 'sessions';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { addToCart, getItemCount, cartItems } = useCart();
  const { boards: backendBoards, isLoading: loadingBoards } = useBoardsBackend();
  const { sessions: allSessions, filterSessions } = useSessions();
  
  const [viewMode, setViewMode] = useState<ViewMode>('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [filtered, setFiltered] = useState<Board[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearbyModalVisible, setNearbyModalVisible] = useState(false);
  const [nearbyBoards, setNearbyBoards] = useState<(Board & { distance: number })[]>([]);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lon: number; locationName: string } | null>(null);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [randomBoards, setRandomBoards] = useState<Board[]>([]);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [nearbySessions, setNearbySessions] = useState<(Session & { distance: number })[]>([]);
  const [randomSessions, setRandomSessions] = useState<Session[]>([]);
  
  // Filter inputs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedBoardType, setSelectedBoardType] = useState<BoardType | ''>('');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | ''>('');
  const [selectedSessionLevel, setSelectedSessionLevel] = useState<SessionLevel | ''>('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Map dimensions
  const [mapWidth, setMapWidth] = useState(400);
  const mapHeight = mapWidth / 2;
  
  // Debounced inputs for auto-search
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  
  // Update boards when backend data loads
  useEffect(() => {
    if (backendBoards && backendBoards.length > 0) {
      console.log('Map: Loaded boards from backend:', backendBoards.length);
      setBoards(backendBoards);
      setFiltered(backendBoards);
      const shuffled = [...backendBoards].sort(() => 0.5 - Math.random());
      setRandomBoards(shuffled.slice(0, 20));
    }
  }, [backendBoards]);
  
  // Update sessions when context data loads
  useEffect(() => {
    if (allSessions && allSessions.length > 0) {
      console.log('Map: Loaded sessions:', allSessions.length);
      setSessions(allSessions);
      setFilteredSessions(allSessions);
      const shuffled = [...allSessions].sort(() => 0.5 - Math.random());
      setRandomSessions(shuffled.slice(0, 20));
    }
  }, [allSessions]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location);
    }, 300);
    return () => clearTimeout(timer);
  }, [location]);
  
  const handleSearch = useCallback(() => {
    setLoading(true);
    
    setTimeout(() => {
      if (viewMode === 'boards') {
        let results = [...boards];
        
        if (startDate && endDate) {
          const filterStart = new Date(startDate);
          const filterEnd = new Date(endDate);
          results = results.filter(board => {
            const boardStart = new Date(board.available_start);
            const boardEnd = new Date(board.available_end);
            return boardStart <= filterEnd && boardEnd >= filterStart;
          });
        }
        
        if (debouncedLocation) {
          results = results.filter(board =>
            board.location.toLowerCase().includes(debouncedLocation.toLowerCase())
          );
        }
        
        if (debouncedKeyword) {
          results = results.filter(board =>
            board.short_name.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
            board.dimensions_detail.toLowerCase().includes(debouncedKeyword.toLowerCase())
          );
        }
        
        if (selectedBoardType) {
          results = results.filter(board => board.type === selectedBoardType);
        }
        
        results.sort((a, b) => {
          if (a.price_per_day === null) return 1;
          if (b.price_per_day === null) return -1;
          return a.price_per_day - b.price_per_day;
        });
        
        setFiltered(results);
      } else {
        let results = [...sessions];
        
        if (startDate && endDate) {
          const filterStart = new Date(startDate);
          const filterEnd = new Date(endDate);
          results = results.filter(session => {
            const sessionStart = new Date(session.available_start);
            const sessionEnd = new Date(session.available_end);
            return sessionStart <= filterEnd && sessionEnd >= filterStart;
          });
        }
        
        if (debouncedLocation) {
          results = results.filter(session =>
            session.location.toLowerCase().includes(debouncedLocation.toLowerCase())
          );
        }
        
        if (debouncedKeyword) {
          results = results.filter(session =>
            session.name.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
            session.description.toLowerCase().includes(debouncedKeyword.toLowerCase())
          );
        }
        
        if (selectedSessionType) {
          results = results.filter(session => session.type === selectedSessionType);
        }
        
        if (selectedSessionLevel) {
          results = results.filter(session => session.level === selectedSessionLevel);
        }
        
        results.sort((a, b) => a.price - b.price);
        
        setFilteredSessions(results);
      }
      
      setLoading(false);
    }, 300);
  }, [viewMode, boards, sessions, startDate, endDate, debouncedLocation, debouncedKeyword, selectedBoardType, selectedSessionType, selectedSessionLevel]);
  
  const boardTypes: { value: BoardType | ''; label: string }[] = [
    { value: '', label: 'All Board Types' },
    { value: 'soft-top', label: 'Soft-top' },
    { value: 'shortboard', label: 'Shortboard' },
    { value: 'fish', label: 'Fish' },
    { value: 'longboard', label: 'Longboard' },
    { value: 'sup', label: 'SUP' },
  ];

  const sessionTypes: { value: SessionType | ''; label: string }[] = [
    { value: '', label: 'All Session Types' },
    { value: 'lesson', label: 'Lesson' },
    { value: 'tour', label: 'Tour' },
    { value: 'camp', label: 'Camp' },
    { value: 'session', label: 'Session' },
  ];

  const sessionLevels: { value: SessionLevel | ''; label: string }[] = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const handleBoardTypeSelect = (type: BoardType | '') => {
    setSelectedBoardType(type);
    setShowDropdown(false);
  };

  const handleSessionTypeSelect = (type: SessionType | '') => {
    setSelectedSessionType(type);
    setShowDropdown(false);
  };

  const handleSessionLevelSelect = (level: SessionLevel | '') => {
    setSelectedSessionLevel(level);
    setShowDropdown(false);
  };
  
  // Auto-search when filters change
  useEffect(() => {
    handleSearch();
  }, [handleSearch, startDate, endDate, debouncedLocation, debouncedKeyword, selectedBoardType, selectedSessionType, selectedSessionLevel, viewMode]);
  
  const markerPositions = useMemo(() => {
    if (viewMode === 'boards') {
      const positions = filtered.map(board => {
        const { x, y } = lonLatToXY(board.lon, board.lat, MAP_INTRINSIC_WIDTH, MAP_INTRINSIC_HEIGHT);
        return {
          x: (x / MAP_INTRINSIC_WIDTH) * mapWidth,
          y: (y / MAP_INTRINSIC_HEIGHT) * mapHeight,
          id: board.id
        };
      });
      return jitterOverlappingMarkers(positions);
    } else {
      const positions = filteredSessions.map(session => {
        const { x, y } = lonLatToXY(session.lon, session.lat, MAP_INTRINSIC_WIDTH, MAP_INTRINSIC_HEIGHT);
        return {
          x: (x / MAP_INTRINSIC_WIDTH) * mapWidth,
          y: (y / MAP_INTRINSIC_HEIGHT) * mapHeight,
          id: session.id
        };
      });
      return jitterOverlappingMarkers(positions);
    }
  }, [viewMode, filtered, filteredSessions, mapWidth, mapHeight]);
  
  const handleMarkerPress = (id: string) => {
    if (viewMode === 'boards') {
      const clickedBoard = filtered.find(b => b.id === id);
      if (!clickedBoard) return;
      
      setSelectedId(id);
      setClickedLocation({
        lat: clickedBoard.lat,
        lon: clickedBoard.lon,
        locationName: clickedBoard.location
      });
      
      const nearby = boards
        .map(board => ({
          ...board,
          distance: calculateDistance(
            clickedBoard.lat,
            clickedBoard.lon,
            board.lat,
            board.lon
          )
        }))
        .filter(board => board.distance <= 50)
        .sort((a, b) => a.distance - b.distance);
      
      setNearbyBoards(nearby);
      setNearbyModalVisible(true);
    } else {
      const clickedSession = filteredSessions.find(s => s.id === id);
      if (!clickedSession) return;
      
      setSelectedSessionId(id);
      setClickedLocation({
        lat: clickedSession.lat,
        lon: clickedSession.lon,
        locationName: clickedSession.location
      });
      
      const nearby = sessions
        .map(session => ({
          ...session,
          distance: calculateDistance(
            clickedSession.lat,
            clickedSession.lon,
            session.lat,
            session.lon
          )
        }))
        .filter(session => session.distance <= 50)
        .sort((a, b) => a.distance - b.distance);
      
      setNearbySessions(nearby);
      setNearbyModalVisible(true);
    }
  };
  
  const selectedBoard = selectedId ? filtered.find(b => b.id === selectedId) : null;
  const selectedSession = selectedSessionId ? filteredSessions.find(s => s.id === selectedSessionId) : null;
  
  const isBoardInCart = (boardId: string) => {
    return cartItems.some(item => item.board.id === boardId);
  };

  const handleAddToCart = (board: Board) => {
    if (!board || !board.id) {
      return;
    }
    
    if (isBoardInCart(board.id)) {
      return;
    }
    
    // Use today and tomorrow as default dates for quick add
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    addToCart(board, today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]);
  };

  const renderBoardCard = ({ item }: { item: Board }) => {
    const inCart = isBoardInCart(item.id);
    
    return (
      <Pressable
        style={styles.boardCard}
        onPress={() => router.push(`/board-preview?boardId=${item.id}`)}
      >
        <Pressable 
          style={styles.boardCardThumbnail}
          onPress={() => router.push(`/board-preview?boardId=${item.id}`)}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.boardCardImage}
            resizeMode="contain"
          />
          <View style={styles.boardTypeOverlay}>
            <Text style={styles.boardTypeOverlayText}>
              {item.type === 'soft-top' ? 'SOFT' : 
               item.type === 'longboard' ? 'LONG' : 
               item.type === 'shortboard' ? 'SHORT' :
               item.type === 'fish' ? 'FISH' : 'SUP'}
            </Text>
          </View>
        </Pressable>
        <Text style={styles.boardCardTitle} numberOfLines={1}>{item.short_name}</Text>
        <Text style={styles.boardCardDims}>{item.dimensions_detail}</Text>
        {item.price_per_day && (
          <Text style={styles.boardCardPrice}>
            ${item.price_per_day}/day • ${item.price_per_week}/week
          </Text>
        )}
        <View style={styles.boardLocationRow}>
          <Text style={styles.boardCardLocation}>{item.location}</Text>
          <View style={styles.boardLocationIcons}>
            {item.delivery_available && (
              <View style={styles.boardDeliveryIcon}>
                <Truck size={16} color="#007AFF" />
              </View>
            )}
            {(item.owner?.avatarUrl || item.owner?.avatar_url) ? (
              <View style={styles.boardOwnerAvatar}>
                <Image
                  source={{ uri: item.owner.avatarUrl || item.owner.avatar_url }}
                  style={styles.boardAvatarImage}
                  resizeMode="cover"
                />
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          style={[
            styles.boardAddButton,
            inCart && styles.boardAddButtonInCart
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart(item);
          }}
          disabled={inCart}
        >
          <Text style={[
            styles.boardAddButtonText,
            inCart && styles.boardAddButtonTextInCart
          ]}>
            {inCart ? 'In Cart' : 'Add to Cart'}
          </Text>
        </Pressable>
      </Pressable>
    );
  };
  
  const renderSessionCard = ({ item }: { item: Session }) => {
    return (
      <Pressable
        style={styles.boardCard}
        onPress={() => router.push(`/session-preview?sessionId=${item.id}`)}
      >
        <View style={styles.boardCardThumbnail}>
          <Image
            source={{ uri: item.imageUrl || item.image_url }}
            style={styles.boardCardImage}
            resizeMode="cover"
          />
          <View style={styles.boardTypeOverlay}>
            <Text style={styles.boardTypeOverlayText}>
              {item.type.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.boardCardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.boardCardDims}>{item.level} • {item.duration}h</Text>
        <Text style={styles.boardCardPrice}>
          ${item.price}/session
        </Text>
        <View style={styles.boardLocationRow}>
          <Text style={styles.boardCardLocation}>{item.location}</Text>
          <View style={styles.boardLocationIcons}>
            {(item.instructor?.avatarUrl || item.instructor?.avatar_url) ? (
              <View style={styles.boardOwnerAvatar}>
                <Image
                  source={{ uri: item.instructor.avatarUrl || item.instructor.avatar_url }}
                  style={styles.boardAvatarImage}
                  resizeMode="cover"
                />
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          style={styles.boardAddButton}
          onPress={() => router.push(`/session-preview?sessionId=${item.id}`)}
        >
          <Text style={styles.boardAddButtonText}>
            View Details
          </Text>
        </Pressable>
      </Pressable>
    );
  };
  
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header with Cart */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map View</Text>
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
      
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleButton, viewMode === 'boards' && styles.toggleButtonActive]}
          onPress={() => setViewMode('boards')}
        >
          <Text style={[styles.toggleButtonText, viewMode === 'boards' && styles.toggleButtonTextActive]}>
            Boards
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, viewMode === 'sessions' && styles.toggleButtonActive]}
          onPress={() => setViewMode('sessions')}
        >
          <GraduationCap size={16} color={viewMode === 'sessions' ? '#fff' : '#007AFF'} />
          <Text style={[styles.toggleButtonText, viewMode === 'sessions' && styles.toggleButtonTextActive]}>
            Sessions
          </Text>
        </Pressable>
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
          {viewMode === 'boards' ? (
            <Pressable
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {boardTypes.find(type => type.value === selectedBoardType)?.label || 'All Board Types'}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {sessionTypes.find(type => type.value === selectedSessionType)?.label || 'All Session Types'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
      
      {/* Board Type / Session Type Dropdown Modal */}
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
            {viewMode === 'boards' ? (
              boardTypes.map((type) => (
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
              ))
            ) : (
              sessionTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.dropdownItem,
                    selectedSessionType === type.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => handleSessionTypeSelect(type.value)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedSessionType === type.value && styles.dropdownItemTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </Pressable>
      </Modal>
      
      {/* Map Container */}
      <View style={styles.mapContainer}>
        {(loading || loadingBoards) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <View 
            style={styles.mapWrapper}
            onLayout={(e) => setMapWidth(e.nativeEvent.layout.width)}
          >
            <ImageBackground
              source={{ uri: WORLD_MAP_URL }}
              style={[styles.map, { height: mapHeight }]}
              resizeMode="cover"
            >
              {markerPositions.map((pos) => {
                if (viewMode === 'boards') {
                  const board = filtered.find(b => b.id === pos.id);
                  if (!board) return null;
                  
                  const isSelected = board.id === selectedId;
                  
                  return (
                    <Pressable
                      key={board.id}
                      style={[
                        styles.marker,
                        {
                          left: pos.x - (isSelected ? 16 : 12),
                          top: pos.y - (isSelected ? 16 : 12),
                          width: isSelected ? 32 : 24,
                          height: isSelected ? 32 : 24,
                        },
                        isSelected && styles.markerSelected
                      ]}
                      onPress={() => handleMarkerPress(board.id)}
                    >
                      <Image
                        source={{ uri: MARKER_URL }}
                        style={styles.markerImage}
                        resizeMode="contain"
                      />
                    </Pressable>
                  );
                } else {
                  const session = filteredSessions.find(s => s.id === pos.id);
                  if (!session) return null;
                  
                  const isSelected = session.id === selectedSessionId;
                  
                  return (
                    <Pressable
                      key={session.id}
                      style={[
                        styles.marker,
                        {
                          left: pos.x - (isSelected ? 16 : 12),
                          top: pos.y - (isSelected ? 16 : 12),
                          width: isSelected ? 32 : 24,
                          height: isSelected ? 32 : 24,
                        },
                        isSelected && styles.markerSelected
                      ]}
                      onPress={() => handleMarkerPress(session.id)}
                    >
                      <Image
                        source={{ uri: MARKER_URL }}
                        style={styles.sessionMarkerImage}
                        resizeMode="contain"
                      />
                    </Pressable>
                  );
                }
              })}
            </ImageBackground>
          </View>
        )}
      </View>
      
      {/* Selected Board Info Card */}
      {selectedBoard && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Pressable 
              style={styles.infoThumbnail}
              onPress={() => router.push(`/board-preview?boardId=${selectedBoard.id}`)}
            >
              <Image
                source={{ uri: selectedBoard.imageUrl }}
                style={styles.infoImage}
                resizeMode="contain"
              />
              <View style={styles.infoTypeOverlay}>
                <Text style={styles.infoTypeOverlayText}>
                  {selectedBoard.type === 'soft-top' ? 'SOFT' : 
                   selectedBoard.type === 'longboard' ? 'LONG' : 
                   selectedBoard.type === 'shortboard' ? 'SHORT' :
                   selectedBoard.type === 'fish' ? 'FISH' : 'SUP'}
                </Text>
              </View>
            </Pressable>
            <View style={styles.infoDetails}>
              <Text style={styles.infoTitle} numberOfLines={1}>{selectedBoard.short_name}</Text>
              <Text style={styles.infoDims}>{selectedBoard.dimensions_detail}</Text>
              {selectedBoard.price_per_day && (
                <Text style={styles.infoPrice}>
                  ${selectedBoard.price_per_day}/day • ${selectedBoard.price_per_week}/week
                </Text>
              )}
              <Text style={styles.infoLocation}>{selectedBoard.location}</Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={styles.viewButton}
                onPress={() => router.push(`/board-preview?boardId=${selectedBoard.id}`)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.addButton,
                  isBoardInCart(selectedBoard.id) && styles.addButtonInCart
                ]}
                onPress={() => handleAddToCart(selectedBoard)}
                disabled={isBoardInCart(selectedBoard.id)}
              >
                <Text style={[
                  styles.addButtonText,
                  isBoardInCart(selectedBoard.id) && styles.addButtonTextInCart
                ]}>
                  {isBoardInCart(selectedBoard.id) ? 'In Cart' : 'Add'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      
      {/* Results Counter */}
      <View style={styles.resultsCounter}>
        <Text style={styles.resultsText}>
          {viewMode === 'boards' 
            ? `${filtered.length} board${filtered.length !== 1 ? 's' : ''} found`
            : `${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''} found`
          }
        </Text>
      </View>

      {/* Available Boards/Sessions Section */}
      {viewMode === 'boards' ? (
        <View style={styles.availableBoardsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Boards</Text>
            <Pressable 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          <FlatList
            data={randomBoards}
            renderItem={renderBoardCard}
            keyExtractor={(item) => item.id}
            numColumns={Platform.OS === 'web' ? 4 : 2}
            columnWrapperStyle={Platform.OS === 'web' ? styles.boardCardRow : styles.boardCardRowMobile}
            contentContainerStyle={styles.boardListContent}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <View style={styles.availableBoardsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Sessions</Text>
          </View>
          <FlatList
            data={randomSessions}
            renderItem={renderSessionCard}
            keyExtractor={(item) => item.id}
            numColumns={Platform.OS === 'web' ? 4 : 2}
            columnWrapperStyle={Platform.OS === 'web' ? styles.boardCardRow : styles.boardCardRowMobile}
            contentContainerStyle={styles.boardListContent}
            scrollEnabled={false}
          />
        </View>
      )}
      
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
              <Text style={styles.infoBubbleTitle}>How to use Map View</Text>
              <Pressable
                style={styles.infoBubbleClose}
                onPress={() => setShowInfoBubble(false)}
              >
                <X size={20} color="#666" />
              </Pressable>
            </View>
            <View style={styles.infoBubbleContent}>
              <Text style={styles.infoBubbleTip}>🗺️ <Text style={styles.infoBubbleBold}>Tap markers</Text> to see boards in that area</Text>
              <Text style={styles.infoBubbleTip}>🔍 <Text style={styles.infoBubbleBold}>Use filters</Text> to narrow down your search by date, location, or board type</Text>
              <Text style={styles.infoBubbleTip}>📍 <Text style={styles.infoBubbleBold}>Click View</Text> on any board card to see full details</Text>
              <Text style={styles.infoBubbleTip}>🛒 <Text style={styles.infoBubbleBold}>Quick add</Text> boards to cart with default dates (today-tomorrow)</Text>
              <Text style={styles.infoBubbleTip}>🚚 <Text style={styles.infoBubbleBold}>Delivery available</Text> for boards within 50 miles of your location</Text>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Nearby Boards Modal */}
      <Modal
        visible={nearbyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNearbyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <MapPin size={24} color="#007AFF" />
              <View>
                <Text style={styles.modalTitle}>
                  {viewMode === 'boards' ? 'Boards' : 'Sessions'} within 50 miles
                </Text>
                <Text style={styles.modalSubtitle}>
                  {clickedLocation?.locationName} area • {viewMode === 'boards' ? nearbyBoards.length : nearbySessions.length} {viewMode === 'boards' ? 'boards' : 'sessions'}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setNearbyModalVisible(false)}
            >
              <X size={24} color="#666" />
            </Pressable>
          </View>
          
          {viewMode === 'boards' ? (
            <FlatList
              data={nearbyBoards}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.nearbyCard}
                  onPress={() => {
                    setNearbyModalVisible(false);
                    router.push(`/board-preview?boardId=${item.id}`);
                  }}
                >
                  <View style={styles.nearbyCardHeader}>
                    <View style={styles.nearbyThumbnail}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.nearbyImage}
                        resizeMode="contain"
                      />
                      <View style={styles.nearbyTypeOverlay}>
                        <Text style={styles.nearbyTypeOverlayText}>
                          {item.type === 'soft-top' ? 'SOFT' : 
                           item.type === 'longboard' ? 'LONG' : 
                           item.type === 'shortboard' ? 'SHORT' :
                           item.type === 'fish' ? 'FISH' : 'SUP'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.nearbyDetails}>
                      <Text style={styles.nearbyTitle} numberOfLines={1}>{item.short_name}</Text>
                      <Text style={styles.nearbyDims}>{item.dimensions_detail}</Text>
                      <Text style={styles.nearbyDistance}>
                        {item.distance < 1 
                          ? `${(item.distance * 5280).toFixed(0)} ft away`
                          : `${item.distance.toFixed(1)} miles away`
                        }
                      </Text>
                      {item.price_per_day && (
                        <Text style={styles.nearbyPrice}>
                          ${item.price_per_day}/day
                        </Text>
                      )}
                    </View>
                    <View style={styles.nearbyActions}>
                      <Pressable
                        style={[
                          styles.nearbyAddButton,
                          isBoardInCart(item.id) && styles.nearbyAddButtonInCart
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        disabled={isBoardInCart(item.id)}
                      >
                        <Text style={[
                          styles.nearbyAddButtonText,
                          isBoardInCart(item.id) && styles.nearbyAddButtonTextInCart
                        ]}>
                          {isBoardInCart(item.id) ? 'In Cart' : 'Add'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No boards found within 50 miles</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={nearbySessions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.nearbyCard}
                  onPress={() => {
                    setNearbyModalVisible(false);
                    router.push(`/session-preview?sessionId=${item.id}`);
                  }}
                >
                  <View style={styles.nearbyCardHeader}>
                    <View style={styles.nearbyThumbnail}>
                      <Image
                        source={{ uri: item.imageUrl || item.image_url }}
                        style={styles.nearbyImage}
                        resizeMode="cover"
                      />
                      <View style={styles.nearbyTypeOverlay}>
                        <Text style={styles.nearbyTypeOverlayText}>
                          {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.nearbyDetails}>
                      <Text style={styles.nearbyTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.nearbyDims}>{item.level} • {item.duration}h</Text>
                      <Text style={styles.nearbyDistance}>
                        {item.distance < 1 
                          ? `${(item.distance * 5280).toFixed(0)} ft away`
                          : `${item.distance.toFixed(1)} miles away`
                        }
                      </Text>
                      <Text style={styles.nearbyPrice}>
                        ${item.price}/session
                      </Text>
                    </View>
                    <View style={styles.nearbyActions}>
                      <Pressable
                        style={styles.nearbyAddButton}
                        onPress={() => {
                          setNearbyModalVisible(false);
                          router.push(`/session-preview?sessionId=${item.id}`);
                        }}
                      >
                        <Text style={styles.nearbyAddButtonText}>
                          View
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No sessions found within 50 miles</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </ScrollView>
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
  headerTitle: {
    fontSize: 24,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'white',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  toggleButtonTextActive: {
    color: 'white',
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

  mapContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width: '100%',
    position: 'relative',
  },
  marker: {
    position: 'absolute',
    zIndex: 1,
  },
  markerSelected: {
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  sessionMarkerImage: {
    width: '100%',
    height: '100%',
    tintColor: '#007AFF',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoThumbnail: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  infoImage: {
    width: '100%',
    height: '100%',
  },
  infoTypeOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  infoTypeOverlayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 8,
  },
  thumbnailsoft: {
    backgroundColor: '#81C784',
  },
  thumbnaillong: {
    backgroundColor: '#64B5F6',
  },
  thumbnailshort: {
    backgroundColor: '#FFB74D',
  },
  thumbnailText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoDetails: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoDims: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: 2,
  },
  infoLocation: {
    fontSize: 14,
    color: '#999',
  },
  cardActions: {
    flexDirection: 'column',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonInCart: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  addButtonTextInCart: {
    color: 'white',
  },
  resultsCounter: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  modalList: {
    padding: 16,
  },
  nearbyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nearbyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nearbyThumbnail: {
    width: 50,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  nearbyImage: {
    width: '100%',
    height: '100%',
  },
  nearbyTypeOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  nearbyTypeOverlayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 7,
  },
  nearbyDetails: {
    flex: 1,
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nearbyDims: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  nearbyDistance: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  nearbyPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  nearbyActions: {
    alignItems: 'center',
  },
  nearbyAddButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  nearbyAddButtonInCart: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  nearbyAddButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  nearbyAddButtonTextInCart: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  availableBoardsSection: {
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#007AFF',
  },
  viewAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  boardListContent: {
    padding: Platform.OS === 'web' ? 8 : 16,
  },
  boardCardRow: {
    justifyContent: 'space-between',
    gap: Platform.OS === 'web' ? 8 : 0,
  },
  boardCardRowMobile: {
    justifyContent: 'space-around',
  },
  boardCard: {
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
  boardCardThumbnail: {
    height: Platform.OS === 'web' ? 220 : 160,
    borderRadius: 8,
    marginBottom: Platform.OS === 'web' ? 6 : 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  boardCardImage: {
    width: '100%',
    height: '100%',
  },
  boardTypeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boardTypeOverlayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  boardCardTitle: {
    fontSize: Platform.OS === 'web' ? 14 : 16,
    fontWeight: '600',
    marginBottom: Platform.OS === 'web' ? 3 : 4,
  },
  boardCardDims: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#666',
    marginBottom: Platform.OS === 'web' ? 3 : 4,
  },
  boardCardPrice: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: Platform.OS === 'web' ? 3 : 4,
  },
  boardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 6 : 8,
    gap: 6,
  },
  boardCardLocation: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#999',
    flex: 1,
  },
  boardLocationIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boardDeliveryIcon: {
    flexShrink: 0,
  },
  boardOwnerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  boardAvatarImage: {
    width: '100%',
    height: '100%',
  },
  boardAddButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: Platform.OS === 'web' ? 6 : 8,
    alignItems: 'center',
  },
  boardAddButtonInCart: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  boardAddButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: Platform.OS === 'web' ? 12 : 14,
  },
  boardAddButtonTextInCart: {
    color: 'white',
  },
});