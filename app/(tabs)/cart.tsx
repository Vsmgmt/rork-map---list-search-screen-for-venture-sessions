import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Trash2, ShoppingBag, CreditCard, Truck, Plus, Minus, Package } from 'lucide-react-native';
import { useCart } from '@/src/context/cart';
import Colors from '@/constants/colors';
import SizeSelector from '@/components/SizeSelector';

export default function CartScreen() {
  const { 
    cartItems, 
    removeFromCart, 
    getTotalPrice, 
    clearCart, 
    addToCart, 
    toggleDelivery, 
    getDeliveryBreakdown,
    addExtraToItem,

    updateExtraQuantity,
    updateExtraSize,
    availableExtras
  } = useCart();
  const insets = useSafeAreaInsets();

  console.log('Cart Screen - Cart Items:', cartItems);
  console.log('Cart Screen - Cart Items Length:', cartItems.length);

  const handleRemoveItem = (index: number) => {
    console.log('handleRemoveItem called with index:', index);
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          console.log('Remove confirmed for index:', index);
          removeFromCart(index);
        }},
      ]
    );
  };

  const handleClearCart = () => {
    console.log('handleClearCart called');
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          console.log('Clear cart confirmed');
          clearCart();
        }},
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add some boards to your cart before checking out.');
      return;
    }
    router.push('../checkout' as any);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'soft': return '#4CAF50';
      case 'long': return '#2196F3';
      case 'short': return '#FF9800';
      default: return Colors.light.tint;
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={80} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse our boards and add some to your cart to get started!
          </Text>
          <Pressable
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.browseButtonText}>Browse Boards</Text>
          </Pressable>
          <Pressable
            style={[styles.browseButton, { backgroundColor: '#28a745', marginTop: 12 }]}
            onPress={() => {
              // Add a test item for debugging
              const testBoard = {
                id: 'test-1',
                short_name: 'Test Longboard',
                dimensions_detail: '9\'2" x 22.5" x 3.25"',
                type: 'longboard' as const,
                location: 'Malibu',
                pickup_spot: 'Malibu Pier',
                price_per_day: 45,
                price_per_week: 250,
                available_start: '2024-01-01',
                available_end: '2024-12-31',
                volume_l: 65,
                lat: 34.0259,
                lon: -118.7798,
                imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=600&fit=crop',
                image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=600&fit=crop',
                delivery_available: true,
                delivery_price: 25,
                owner: {
                  id: 'test-owner',
                  name: 'Test Owner',
                  email: 'test@example.com',
                  phone: '+1-555-0123',
                  location: 'Malibu',
                  joinedDate: '2023-01-01',
                  totalBoards: 5,
                  rating: 4.8,
                  verified: true,
                  avatarUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g'
                }
              };
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              addToCart(testBoard, today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0], false, []);
            }}
          >
            <Text style={styles.browseButtonText}>Add Test Item</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Pressable onPress={handleClearCart} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {cartItems.map((item, index) => (
          <View key={`${item.board.id}-${index}`} style={styles.cartItem}>
            <View style={styles.itemHeader}>
              <Image 
                source={{ uri: item.board.imageUrl }} 
                style={styles.boardImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.boardName}>{item.board.short_name}</Text>
                <Text style={styles.boardDetails}>{item.board.dimensions_detail}</Text>
                {item.board.type && (
                  <View style={styles.typeContainer}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.board.type) }]}>
                      <Text style={styles.typeText}>
                        {item.board.type.charAt(0).toUpperCase() + item.board.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}
                <View style={styles.ownerRow}>
                  <Image
                    source={{ uri: item.board.owner.avatarUrl }}
                    style={styles.ownerAvatar}
                    resizeMode="cover"
                  />
                  <Text style={styles.ownerName}>{item.board.owner.name}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleRemoveItem(index)}
                style={styles.removeButton}
              >
                <Trash2 size={20} color="#FF4444" />
              </Pressable>
            </View>

            <View style={styles.rentalDetails}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Rental Period:</Text>
                <Text style={styles.dateText}>
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>
              </View>
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>{item.days} days</Text>
                <Text style={styles.rentalType}>
                  ({item.rentalType === 'weekly' ? 'Weekly + Daily' : 'Daily'} rate)
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Pickup:</Text>
              <Text style={styles.locationText}>{item.board.pickup_spot}</Text>
            </View>

            {item.board.delivery_available && (
              <Pressable 
                style={styles.deliveryOption} 
                onPress={() => toggleDelivery(index)}
              >
                <View style={styles.deliveryCheckbox}>
                  {item.deliverySelected && (
                    <View style={styles.deliveryCheckboxChecked} />
                  )}
                </View>
                <Truck size={16} color={Colors.light.tint} />
                <Text style={styles.deliveryText}>Delivery (${item.board.delivery_price})</Text>
              </Pressable>
            )}

            {/* Extras Section */}
            <View style={styles.extrasSection}>
              <Text style={styles.extrasSectionTitle}>Available Extras</Text>
              {availableExtras.map((extra) => {
                const cartExtra = item.extras.find(e => e.extra.id === extra.id);
                const quantity = cartExtra?.quantity || 0;
                
                return (
                  <View key={extra.id} style={styles.extraItem}>
                    <View style={styles.extraInfo}>
                      <Package size={16} color={Colors.light.tint} />
                      <View style={styles.extraDetails}>
                        <Text style={styles.extraName}>{extra.name}</Text>
                        <Text style={styles.extraPrice}>
                          ${extra.pricePerDay}/day • ${extra.pricePerWeek}/week
                        </Text>
                        {extra.description && (
                          <Text style={styles.extraDescription}>{extra.description}</Text>
                        )}
                        <SizeSelector
                          extraId={extra.id}
                          selectedSize={cartExtra?.size}
                          onSizeSelect={(size) => {
                            if (cartExtra) {
                              updateExtraSize(index, extra.id, size);
                            }
                          }}
                          disabled={quantity === 0}
                        />
                      </View>
                    </View>
                    <View style={styles.extraControls}>
                      <Pressable
                        style={[styles.extraButton, quantity === 0 && styles.extraButtonDisabled]}
                        onPress={() => {
                          if (quantity > 0) {
                            updateExtraQuantity(index, extra.id, quantity - 1);
                          }
                        }}
                        disabled={quantity === 0}
                      >
                        <Minus size={16} color={quantity === 0 ? '#ccc' : Colors.light.tint} />
                      </Pressable>
                      <Text style={styles.extraQuantity}>{quantity}</Text>
                      <Pressable
                        style={styles.extraButton}
                        onPress={() => {
                          if (quantity === 0) {
                            addExtraToItem(index, extra, 1);
                          } else {
                            updateExtraQuantity(index, extra.id, quantity + 1);
                          }
                        }}
                      >
                        <Plus size={16} color={Colors.light.tint} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              
              {/* Show selected extras summary */}
              {item.extras.length > 0 && (
                <View style={styles.selectedExtras}>
                  <Text style={styles.selectedExtrasTitle}>Selected Extras:</Text>
                  {item.extras.map((cartExtra, extraIndex) => (
                    <View key={`${cartExtra.extra.id}-${extraIndex}`} style={styles.selectedExtraItem}>
                      <Text style={styles.selectedExtraText}>
                        {cartExtra.quantity}x {cartExtra.extra.name}
                        {cartExtra.size && ` (${cartExtra.size})`}
                      </Text>
                      <Text style={styles.selectedExtraPrice}>
                        ${cartExtra.totalPrice}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Rental:</Text>
                <Text style={styles.priceText}>${item.totalPrice}</Text>
                {item.extras.length > 0 && (
                  <>
                    <Text style={styles.priceLabel}>Extras:</Text>
                    <Text style={styles.priceText}>
                      ${item.extras.reduce((sum, extra) => sum + extra.totalPrice, 0)}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.itemTotalContainer}>
                <Text style={styles.itemTotalLabel}>Item Total:</Text>
                <Text style={styles.itemTotalText}>
                  ${item.totalPrice + item.extras.reduce((sum, extra) => sum + extra.totalPrice, 0)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {/* Pricing Breakdown */}
        <View style={styles.pricingBreakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Rental Subtotal:</Text>
            <Text style={styles.breakdownValue}>
              ${cartItems.reduce((sum, item) => sum + item.totalPrice, 0)}
            </Text>
          </View>
          
          {cartItems.some(item => item.extras.length > 0) && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Extras Subtotal:</Text>
              <Text style={styles.breakdownValue}>
                ${cartItems.reduce((sum, item) => 
                  sum + item.extras.reduce((extraSum, extra) => extraSum + extra.totalPrice, 0), 0
                )}
              </Text>
            </View>
          )}
          
          {getDeliveryBreakdown().length > 0 && (
            <View style={styles.deliveryBreakdownSection}>
              <Text style={styles.deliveryBreakdownTitle}>Delivery Pricing</Text>
              {getDeliveryBreakdown().map((group, groupIndex) => (
                <View key={`delivery-${groupIndex}`} style={styles.deliveryGroup}>
                  <Text style={styles.deliveryGroupOwner}>From {group.ownerName}</Text>
                  <View style={styles.deliveryGroupDetails}>
                    <Text style={styles.deliveryGroupText}>
                      {group.items.length} board{group.items.length > 1 ? 's' : ''}
                      {group.items.length > 1 && (
                        <Text style={styles.discountText}> (25% off additional boards)</Text>
                      )}
                    </Text>
                    <Text style={styles.deliveryGroupPrice}>${group.totalPrice.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>${getTotalPrice()}</Text>
        </View>
        <Pressable style={styles.checkoutButton} onPress={handleCheckout}>
          <CreditCard size={20} color="white" />
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#212529',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  boardImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  itemInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: 4,
  },
  boardDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  removeButton: {
    padding: 8,
  },
  rentalDetails: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500' as const,
  },
  dateText: {
    fontSize: 14,
    color: '#212529',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500' as const,
  },
  rentalType: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic' as const,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500' as const,
  },
  locationText: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
    textAlign: 'right' as const,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  deliveryCheckbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 3,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryCheckboxChecked: {
    width: 8,
    height: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 1,
  },
  deliveryText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500' as const,
  },
  priceText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  deliveryPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryPriceLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500' as const,
  },
  deliveryPriceText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500' as const,
  },
  itemTotalContainer: {
    alignItems: 'flex-end',
  },
  itemTotalLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600' as const,
  },
  itemTotalText: {
    fontSize: 18,
    color: Colors.light.tint,
    fontWeight: 'bold' as const,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    color: '#495057',
    fontWeight: '600' as const,
  },
  totalAmount: {
    fontSize: 24,
    color: Colors.light.tint,
    fontWeight: 'bold' as const,
  },
  checkoutButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#495057',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  deliveryBreakdownSection: {
    marginTop: 12,
  },
  deliveryBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#495057',
    marginBottom: 12,
  },
  deliveryGroup: {
    marginBottom: 8,
  },
  deliveryGroupOwner: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 4,
  },
  deliveryGroupDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
  },
  deliveryGroupText: {
    fontSize: 13,
    color: '#6c757d',
    flex: 1,
  },
  discountText: {
    color: '#28a745',
    fontWeight: '500' as const,
  },
  deliveryGroupPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ownerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  ownerName: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500' as const,
  },
  extrasSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  extrasSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#495057',
    marginBottom: 12,
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  extraInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  extraDetails: {
    marginLeft: 8,
    flex: 1,
  },
  extraName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 2,
  },
  extraPrice: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  extraDescription: {
    fontSize: 11,
    color: '#6c757d',
    lineHeight: 14,
  },
  extraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  extraButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  extraQuantity: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#212529',
    minWidth: 20,
    textAlign: 'center' as const,
  },
  selectedExtras: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  selectedExtrasTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#495057',
    marginBottom: 8,
  },
  selectedExtraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectedExtraText: {
    fontSize: 13,
    color: '#6c757d',
  },
  selectedExtraPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  pricingBreakdown: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500' as const,
  },
  breakdownValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600' as const,
  },
});