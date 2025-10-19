import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Calendar, MapPin, User, Phone, Mail, MessageSquare, CheckCircle, Truck, Home } from 'lucide-react-native';
import { useCart } from '@/src/context/cart';
import { useBookingsBackend } from '@/src/context/bookings-backend';
import { CheckoutInfo } from '@/src/types/board';
import Colors from '@/constants/colors';
import PayModal from '@/components/PayModal';

export default function CheckoutScreen() {
  const { cartItems, getTotalPrice, clearCart, toggleDelivery, getDeliveryBreakdown } = useCart();
  const { addBooking } = useBookingsBackend();
  const insets = useSafeAreaInsets();
  
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pickupTime: '',
    returnTime: '',
    notes: '',
    deliveryAddress: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const handleInputChange = (field: keyof CheckoutInfo, value: string) => {
    setCheckoutInfo(prev => ({ ...prev, [field]: value }));
  };

  const hasOnlySessionItems = cartItems.every(item => !!item.session);

  const getPaymentDescription = () => {
    if (cartItems.length === 0) return 'Booking';
    
    if (cartItems.length === 1) {
      const item = cartItems[0];
      if (item.session) {
        const sessionType = item.session.type.charAt(0).toUpperCase() + item.session.type.slice(1);
        const date = formatDate(item.startDate);
        const timeInfo = item.bookingTime ? ` • ${item.bookingTime}` : '';
        return `${item.session.name} (${sessionType})${timeInfo} • ${date}`;
      } else if (item.board) {
        return `${item.board.short_name} rental • ${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;
      }
    }
    
    const sessionCount = cartItems.filter(item => item.session).length;
    const boardCount = cartItems.filter(item => item.board).length;
    
    if (sessionCount > 0 && boardCount === 0) {
      return `${sessionCount} session${sessionCount > 1 ? 's' : ''}`;
    } else if (boardCount > 0 && sessionCount === 0) {
      return `${boardCount} board rental${boardCount > 1 ? 's' : ''}`;
    } else {
      return `${sessionCount} session${sessionCount > 1 ? 's' : ''} & ${boardCount} board${boardCount > 1 ? 's' : ''}`;
    }
  };
  
  const validateForm = () => {
    const { firstName, lastName, email, phone, pickupTime, returnTime } = checkoutInfo;
    
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'Please enter your first name.');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter your last name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number.');
      return false;
    }
    if (!hasOnlySessionItems && !pickupTime.trim()) {
      Alert.alert('Validation Error', 'Please specify your preferred pickup time.');
      return false;
    }
    if (!hasOnlySessionItems && !returnTime.trim()) {
      Alert.alert('Validation Error', 'Please specify your preferred return time.');
      return false;
    }
    
    // Check if delivery address is required
    const hasDeliveryItems = cartItems.some(item => item.deliverySelected);
    if (hasDeliveryItems && !checkoutInfo.deliveryAddress?.trim()) {
      Alert.alert('Validation Error', 'Please enter a delivery address for your delivery items.');
      return false;
    }
    
    return true;
  };

  const handleCheckout = () => {
    if (!validateForm()) return;
    setShowPayModal(true);
  };

  const handlePaymentComplete = async () => {
    setShowPayModal(false);
    setIsProcessing(true);
    
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Generate confirmation number
      const confirmationNumber = `VB${Date.now().toString().slice(-6)}`;
      const totalAmount = getTotalPrice();
      
      // Save booking to admin system
      addBooking(checkoutInfo, cartItems, totalAmount, confirmationNumber);
      
      // Navigate to email receipt page with all the data
      router.push({
        pathname: '/email-receipt',
        params: {
          confirmationNumber,
          customerInfo: JSON.stringify(checkoutInfo),
          orderItems: JSON.stringify(cartItems),
          totalAmount: totalAmount.toString(),
        }
      });
      
      clearCart();
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Checkout</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#495057" />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item, index) => {
            const isSession = !!item.session;
            const itemId = isSession ? item.session!.id : item.board?.id || index.toString();
            const itemName = isSession ? item.session!.name : item.board?.short_name || 'Unknown';
            const itemDetails = isSession 
              ? `${item.session!.type.charAt(0).toUpperCase() + item.session!.type.slice(1)} • ${item.session!.level}`
              : item.board?.dimensions_detail || '';
            const itemType = isSession ? item.session!.type : item.board?.type || 'unknown';
            
            return (
              <View key={`${itemId}-${index}`} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.boardName}>{itemName}</Text>
                  <Text style={styles.boardDetails}>{itemDetails}</Text>
                  <View style={styles.rentalInfo}>
                    <Text style={styles.rentalText}>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)} ({item.days} days)
                      {isSession && item.bookingTime && ` • ${item.bookingTime}`}
                      {isSession && item.participants && ` • ${item.participants} participant${item.participants > 1 ? 's' : ''}`}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(itemType) }]}>
                      <Text style={styles.typeText}>
                        {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {!isSession && item.board?.delivery_available && (
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
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.itemPrice}>${item.totalPrice}</Text>
                </View>
              </View>
            );
          })}
          {getDeliveryBreakdown().length > 0 && (
            <View style={styles.deliveryBreakdownSection}>
              <Text style={styles.deliveryBreakdownTitle}>Delivery Pricing</Text>
              {getDeliveryBreakdown().map((group, index) => (
                <View key={index} style={styles.deliveryGroup}>
                  <Text style={styles.deliveryGroupOwner}>From {group.ownerName}</Text>
                  <View style={styles.deliveryGroupDetails}>
                    <Text style={styles.deliveryGroupText}>
                      {group.items.length} board{group.items.length > 1 ? 's' : ''}
                      {group.items.length <= 2 ? (
                        <Text style={styles.discountText}> ($50 flat fee)</Text>
                      ) : (
                        <Text style={styles.discountText}> ($50 + ${(group.items.length - 2) * 10} for {group.items.length - 2} extra)</Text>
                      )}
                    </Text>
                    <Text style={styles.deliveryGroupPrice}>${group.totalPrice.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>${getTotalPrice()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <User size={20} color="#6c757d" />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={checkoutInfo.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputContainer}>
              <User size={20} color="#6c757d" />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={checkoutInfo.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#6c757d" />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={checkoutInfo.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#6c757d" />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={checkoutInfo.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {!hasOnlySessionItems && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup & Return</Text>
            
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#6c757d" />
              <TextInput
                style={styles.input}
                placeholder="Preferred Pickup Time (e.g., 9:00 AM)"
                value={checkoutInfo.pickupTime}
                onChangeText={(text) => handleInputChange('pickupTime', text)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Calendar size={20} color="#6c757d" />
              <TextInput
                style={styles.input}
                placeholder="Preferred Return Time (e.g., 5:00 PM)"
                value={checkoutInfo.returnTime}
                onChangeText={(text) => handleInputChange('returnTime', text)}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{hasOnlySessionItems ? 'Additional Notes' : 'Additional Information'}</Text>
          
          <View style={styles.inputContainer}>
            <MessageSquare size={20} color="#6c757d" />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Special requests or notes (optional)"
              value={checkoutInfo.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {cartItems.some(item => item.deliverySelected) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.inputContainer}>
              <Home size={20} color="#6c757d" />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Enter your delivery address"
                value={checkoutInfo.deliveryAddress}
                onChangeText={(text) => handleInputChange('deliveryAddress', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {!hasOnlySessionItems && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Locations</Text>
            {Array.from(new Set(cartItems.filter(item => !item.deliverySelected && item.board).map(item => item.board!.pickup_spot))).map((location) => (
              <View key={location} style={styles.locationItem}>
                <MapPin size={16} color={Colors.light.tint} />
                <Text style={styles.locationText}>{location}</Text>
              </View>
            ))}
            {cartItems.every(item => item.deliverySelected || !item.board) && (
              <Text style={styles.noPickupText}>All items will be delivered</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentNote}>
            Complete your booking and pay securely online.
          </Text>
        </View>
        <Pressable 
          style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]} 
          onPress={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.checkoutButtonText}>Processing...</Text>
          ) : (
            <>
              <CheckCircle size={20} color="white" />
              <Text style={styles.checkoutButtonText}>Confirm Booking and Pay</Text>
            </>
          )}
        </Pressable>
      </View>

      <PayModal
        visible={showPayModal}
        onClose={() => setShowPayModal(false)}
        onPaymentComplete={handlePaymentComplete}
        totalAmount={getTotalPrice()}
        customerName={`${checkoutInfo.firstName} ${checkoutInfo.lastName}`.trim() || 'Customer'}
        description={getPaymentDescription()}
      />
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
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  itemInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 4,
  },
  boardDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  rentalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rentalText: {
    fontSize: 12,
    color: '#495057',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
  },
  deliveryPrice: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  deliveryBreakdownSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
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
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
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
  },
  noPickupText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    paddingVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e9ecef',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#495057',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    flex: 1,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#212529',
  },
  notesInput: {
    minHeight: 80,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  paymentInfo: {
    marginBottom: 16,
  },
  paymentNote: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center' as const,
    lineHeight: 20,
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
  checkoutButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600' as const,
  },
});