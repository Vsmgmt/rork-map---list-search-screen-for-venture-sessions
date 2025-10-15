import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DatePicker from '@/components/DatePicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { X, MapPin, Calendar, DollarSign, Ruler, Droplets, ShoppingCart, Check, Truck, Star, MessageCircle } from 'lucide-react-native';
import { useCart } from '@/src/context/cart';
import { boardQueries } from '@/lib/queries';
import { useMessages } from '@/src/context/messages';
import { useUser } from '@/src/context/user';
import { useBoardsBackend } from '@/src/context/boards-backend';
import { useBoards } from '@/src/context/boards';
import Colors from '@/constants/colors';

export default function BoardPreviewModal() {
  const insets = useSafeAreaInsets();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const { addToCart, cartItems } = useCart();
  const { createConversation } = useMessages();
  const { currentUser } = useUser();
  const { getBoardById: getBackendBoard } = useBoardsBackend();
  const { getBoardById: getLocalBoard } = useBoards();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [deliverySelected, setDeliverySelected] = useState(false);
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!boardId) {
      setLoading(false);
      return;
    }
    
    (async () => {
      try {
        console.log('Fetching board:', boardId);
        
        // First try backend context (includes both Supabase and local seed data)
        let data = getBackendBoard(boardId);
        console.log('Backend board:', data);
        
        // If not found in backend, try local boards
        if (!data) {
          console.log('Not found in backend, trying local boards');
          data = getLocalBoard(boardId);
          console.log('Local board:', data);
        }
        
        // If still not found, try Supabase directly
        if (!data) {
          console.log('Not found locally, trying Supabase');
          data = await boardQueries.getById(boardId);
          console.log('Supabase board:', data);
        }
        
        console.log('Final board data:', data);
        setBoard(data);
      } catch (error) {
        console.error('Failed to fetch board:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [boardId, getBackendBoard, getLocalBoard]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#333" />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.errorSubText}>Loading board...</Text>
        </View>
      </View>
    );
  }
  
  if (!board) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#333" />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Board not found</Text>
          <Text style={styles.errorSubText}>Board ID: {boardId}</Text>
        </View>
      </View>
    );
  }
  
  const getBoardTypeColor = (type: string) => {
    switch (type) {
      case 'soft-top': return '#81C784';
      case 'longboard': return '#64B5F6';
      case 'shortboard': return '#FFB74D';
      case 'fish': return '#FF8A65';
      case 'sup': return '#9575CD';
      default: return '#999';
    }
  };
  
  const getBoardTypeLabel = (type: string | undefined | null) => {
    if (!type) return 'Unknown';
    switch (type) {
      case 'soft-top': return 'Soft-top';
      case 'longboard': return 'Longboard';
      case 'shortboard': return 'Shortboard';
      case 'fish': return 'Fish';
      case 'sup': return 'SUP';
      default: return type;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const isBoardInCart = () => {
    return cartItems.some(item => item.board.id === board?.id);
  };
  
  const getBoardAvailabilityStatus = () => {
    if (!board) return 'unavailable';
    
    const now = new Date();
    const availableStart = new Date(board.available_start);
    const availableEnd = new Date(board.available_end);
    
    if (now < availableStart || now > availableEnd) {
      return 'out-of-season';
    }
    
    return isBoardInCart() ? 'in-cart' : 'available';
  };
  
  const getButtonConfig = () => {
    const status = getBoardAvailabilityStatus();
    
    switch (status) {
      case 'in-cart':
        return {
          text: 'Added to Cart',
          backgroundColor: '#4CAF50',
          disabled: true,
          icon: 'check'
        };
      case 'out-of-season':
        return {
          text: 'Board Out',
          backgroundColor: '#FF5722',
          disabled: true,
          icon: 'x'
        };
      case 'available':
      default:
        return {
          text: 'Select Dates',
          backgroundColor: Colors.light.tint,
          disabled: false,
          icon: 'cart'
        };
    }
  };
  
  const handleAddToCart = () => {
    console.log('handleAddToCart called');
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    console.log('deliverySelected:', deliverySelected);
    
    if (!startDate.trim() || !endDate.trim()) {
      console.log('Missing dates validation failed');
      Alert.alert('Missing Dates', 'Please select both start and end dates.');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Parsed dates:', { start, end });
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('Invalid dates validation failed');
      Alert.alert('Invalid Dates', 'Please enter valid dates in YYYY-MM-DD format.');
      return;
    }
    
    if (start >= end) {
      console.log('Date range validation failed');
      Alert.alert('Invalid Date Range', 'End date must be after start date.');
      return;
    }
    
    console.log('About to call addToCart with:', { board: board.id, startDate, endDate, deliverySelected });
    addToCart(board, startDate, endDate, deliverySelected);
    console.log('addToCart called successfully');
    Alert.alert('Added to Cart', `${board.short_name} has been added to your cart!`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };
  
  const handleMessageOwner = async () => {
    if (!currentUser || !board || !board.owner) {
      Alert.alert('Unable to Message', 'Owner information is not available.');
      return;
    }
    
    try {
      const conversationId = await createConversation(board.owner.id);
      if (conversationId) {
        router.push({
          pathname: '/chat',
          params: {
            conversationId,
            participantId: board.owner.id,
            participantName: board.owner.name
          }
        });
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Board Details</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImage}>
            <Image
              source={{ uri: board.image_url || board.imageUrl }}
              style={styles.boardImage}
              resizeMode="contain"
            />
            {board.type && (
              <View style={styles.heroTypeOverlay}>
                <Text style={styles.heroTypeText}>{getBoardTypeLabel(board.type).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Board Info */}
        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.boardTitle}>{board.short_name}</Text>
            {board.type && (
              <View style={[styles.typeTag, { backgroundColor: getBoardTypeColor(board.type) }]}>
                <Text style={styles.typeTagText}>{getBoardTypeLabel(board.type)}</Text>
              </View>
            )}
          </View>
          
          {/* Specifications */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            
            <View style={styles.specRow}>
              <View style={styles.specIcon}>
                <Ruler size={20} color="#666" />
              </View>
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>Dimensions</Text>
                <Text style={styles.specValue}>{board.dimensions_detail}</Text>
              </View>
            </View>
            
            {board.volume_l && (
              <View style={styles.specRow}>
                <View style={styles.specIcon}>
                  <Droplets size={20} color="#666" />
                </View>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Volume</Text>
                  <Text style={styles.specValue}>{board.volume_l}L</Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Pricing */}
          {(board.price_per_day || board.price_per_week) && (
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              
              <View style={styles.priceRow}>
                <View style={styles.priceIcon}>
                  <DollarSign size={20} color="#4CAF50" />
                </View>
                <View style={styles.priceContent}>
                  {board.price_per_day && (
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Daily Rate</Text>
                      <Text style={styles.priceValue}>${board.price_per_day}</Text>
                    </View>
                  )}
                  {board.price_per_week && (
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Weekly Rate</Text>
                      <Text style={styles.priceValue}>${board.price_per_week}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
          
          {/* Availability */}
          <View style={styles.availabilitySection}>
            <Text style={styles.sectionTitle}>Availability</Text>
            
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityIcon}>
                <Calendar size={20} color="#666" />
              </View>
              <View style={styles.availabilityContent}>
                <Text style={styles.availabilityLabel}>Available Period</Text>
                <Text style={styles.availabilityValue}>
                  {formatDate(board.available_start)} - {formatDate(board.available_end)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Owner */}
          {board.owner && (
            <View style={styles.ownerSection}>
              <Text style={styles.sectionTitle}>Board Owner</Text>
              
              <View style={styles.ownerRow}>
                <View style={styles.ownerAvatarContainer}>
                  <Image
                    source={{ uri: board.owner.avatar_url || board.owner.avatarUrl || 'https://via.placeholder.com/60' }}
                    style={styles.ownerAvatarLarge}
                    resizeMode="cover"
                  />
                  {(board.owner.is_verified || board.owner.verified) && (
                    <View style={styles.verifiedBadge}>
                      <Check size={12} color="white" />
                    </View>
                  )}
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{board.owner.name || 'Unknown'}</Text>
                  <View style={styles.ownerRating}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.ownerRatingText}>{board.owner.rating?.toFixed(1) || '5.0'}</Text>
                    <Text style={styles.ownerBoardCount}>• {board.owner.total_boards || board.owner.totalBoards || 0} boards</Text>
                  </View>
                  {board.owner.location && (
                    <Text style={styles.ownerLocation}>{board.owner.location}</Text>
                  )}
                  {(board.owner.joined_date || board.owner.joinedDate) && (
                    <Text style={styles.ownerJoined}>Member since {new Date(board.owner.joined_date || board.owner.joinedDate).getFullYear()}</Text>
                  )}
                </View>
                <Pressable
                  style={styles.messageOwnerButton}
                  onPress={handleMessageOwner}
                >
                  <MessageCircle size={16} color={Colors.light.tint} />
                  <Text style={styles.messageOwnerText}>Message Owner</Text>
                </Pressable>
              </View>
            </View>
          )}
          
          {/* Location */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Location & Pickup</Text>
            
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <MapPin size={20} color="#666" />
              </View>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Location</Text>
                <View style={styles.locationWithDelivery}>
                  <Text style={styles.locationValue}>{board.location}</Text>
                  {board.delivery_available && (
                    <View style={styles.deliveryIconContainer}>
                      <Truck size={16} color={Colors.light.tint} />
                    </View>
                  )}
                </View>
                <Text style={styles.pickupLabel}>Pickup Spot</Text>
                <Text style={styles.pickupValue}>{board.pickup_spot}</Text>
                {board.delivery_available && (
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryInfoText}>Delivery available for ${board.delivery_price}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Description Placeholder */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              This {board.type ? getBoardTypeLabel(board.type).toLowerCase() : 'board'} is perfect for your surfing adventure. 
              With its {board.dimensions_detail} dimensions{board.volume_l ? ` and ${board.volume_l}L volume` : ''}, 
              it offers excellent performance for surfers of all levels. Available for pickup in {board.location}.
            </Text>
          </View>
          
          {/* Date Selection */}
          {showDateInputs && (
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>Select Rental Dates</Text>
              
              <DatePicker
                value={startDate}
                onDateChange={setStartDate}
                placeholder="Start Date"
                style={styles.dateInputContainer}
              />
              
              <DatePicker
                value={endDate}
                onDateChange={setEndDate}
                placeholder="End Date"
                style={styles.dateInputContainer}
              />
              
              {board.delivery_available && (
                <Pressable 
                  style={styles.deliveryOption} 
                  onPress={() => setDeliverySelected(!deliverySelected)}
                >
                  <View style={styles.deliveryCheckbox}>
                    {deliverySelected && (
                      <View style={styles.deliveryCheckboxChecked} />
                    )}
                  </View>
                  <Truck size={16} color={Colors.light.tint} />
                  <Text style={styles.deliveryText}>Add delivery (+${board.delivery_price})</Text>
                </Pressable>
              )}
              
              <Pressable
                style={styles.confirmDatesButton}
                onPress={handleAddToCart}
              >
                <ShoppingCart size={20} color="white" />
                <Text style={styles.confirmDatesText}>Add to Cart</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.priceDisplay}>
          {board.price_per_day && (
            <>
              <Text style={styles.bottomPriceLabel}>From</Text>
              <Text style={styles.bottomPriceValue}>${board.price_per_day}/day</Text>
            </>
          )}
        </View>
        <Pressable
          style={[
            styles.addToCartButton,
            { backgroundColor: getButtonConfig().backgroundColor },
            getButtonConfig().disabled && styles.disabledButton
          ]}
          onPress={() => {
            if (!getButtonConfig().disabled) {
              setShowDateInputs(true);
            }
          }}
          disabled={getButtonConfig().disabled}
        >
          {getButtonConfig().icon === 'check' ? (
            <Check size={20} color="white" />
          ) : getButtonConfig().icon === 'x' ? (
            <X size={20} color="white" />
          ) : (
            <ShoppingCart size={20} color="white" />
          )}
          <Text style={styles.addToCartText}>{getButtonConfig().text}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    backgroundColor: 'white',
    paddingVertical: Platform.OS === 'web' ? 24 : 32,
    alignItems: 'center',
  },
  heroImage: {
    width: Platform.OS === 'web' ? '80%' : '60%',
    height: Platform.OS === 'web' ? 320 : 280,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  heroTypeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  heroTypeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  contentContainer: {
    padding: Platform.OS === 'web' ? 16 : 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  boardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  specsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  specIcon: {
    width: 40,
    alignItems: 'center',
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  pricingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  priceContent: {
    flex: 1,
  },
  priceItem: {
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  availabilitySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  availabilityIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  availabilityContent: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  availabilityValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  pickupLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  pickupValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  descriptionSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  priceDisplay: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addToCartButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.8,
  },
  cartBadge: {
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
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  confirmDatesButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  confirmDatesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationWithDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryIconContainer: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 6,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deliveryInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 0,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  deliveryCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryCheckboxChecked: {
    width: 10,
    height: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  deliveryText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  ownerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ownerAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  ownerAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ownerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ownerRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 4,
  },
  ownerBoardCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  ownerLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  ownerJoined: {
    fontSize: 12,
    color: '#999',
  },
  messageOwnerButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  messageOwnerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500' as const,
  },
});