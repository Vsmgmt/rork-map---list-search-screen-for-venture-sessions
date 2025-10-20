import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  CheckCircle, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  Home, 
  Truck,
  Share2,
  ArrowLeft,
  Clock,
  Backpack,
  AlertCircle,
  Info
} from 'lucide-react-native';
import { CartItem, CheckoutInfo } from '@/src/types/board';
import Colors from '@/constants/colors';

export default function ConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const type = params.type as string;
  
  // Handle different confirmation types
  if (type === 'board_added') {
    const boardId = params.boardId as string;
    const boardName = params.boardName as string;
    const message = params.message as string;
    
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
            <ArrowLeft size={24} color="#495057" />
          </Pressable>
          <Text style={styles.title}>Board Added</Text>
          <View style={styles.shareButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.successSection}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color={Colors.light.tint} />
            </View>
            <Text style={styles.successTitle}>Board Added Successfully!</Text>
            <Text style={styles.successSubtitle}>
              {message}
            </Text>
            <View style={styles.confirmationBox}>
              <Text style={styles.confirmationLabel}>Board ID</Text>
              <Text style={styles.confirmationNumber}>{boardId}</Text>
              <Text style={styles.confirmationDate}>{new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Board Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>Board Name: {boardName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>Status: Available for Rent</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What&apos;s Next?</Text>
            <Text style={styles.nextStepsText}>
              • Your board is now live in the search results{"\n"}
              • Renters can find and book your board{"\n"}
              • You&apos;ll be notified when someone books your board{"\n"}
              • Check the search tab to see your board listed
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable 
            style={styles.doneButton} 
            onPress={() => router.replace('/(tabs)/search')}
          >
            <Text style={styles.doneButtonText}>View in Search</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  
  // Original booking confirmation logic
  const confirmationNumber = params.confirmationNumber as string;
  const customerInfo = JSON.parse(params.customerInfo as string) as CheckoutInfo;
  const orderItems = JSON.parse(params.orderItems as string) as CartItem[];
  const totalAmount = parseFloat(params.totalAmount as string);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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

  const hasOnlySessionItems = orderItems.every(item => !!item.session);

  const handleShare = async () => {
    const receiptText = `
🏄‍♂️ VENTURE SESSIONS - BOOKING CONFIRMATION

Confirmation #: ${confirmationNumber}
Date: ${currentDate}

👤 CUSTOMER INFORMATION
Name: ${customerInfo.firstName} ${customerInfo.lastName}
Email: ${customerInfo.email}
Phone: ${customerInfo.phone}

📋 ORDER DETAILS
${orderItems.map((item, index) => {
  if (item.session) {
    return `${index + 1}. ${item.session.name} (${item.session.type})
   ${formatDate(item.startDate)} - ${formatDate(item.endDate)}
   ${item.bookingTime ? `Time: ${item.bookingTime}` : ''}
   Price: ${item.totalPrice}`;
  } else if (item.board) {
    return `${index + 1}. ${item.board.short_name}
   ${item.board.dimensions_detail}
   ${formatDate(item.startDate)} - ${formatDate(item.endDate)} (${item.days} days)
   Price: ${item.totalPrice}${item.deliverySelected ? ` + Delivery: ${item.deliveryPrice}` : ''}`;
  }
  return '';
}).filter(Boolean).join('\n\n')}

💰 TOTAL: ${totalAmount}

${!hasOnlySessionItems ? `⏰ PICKUP & RETURN\nPickup Time: ${customerInfo.pickupTime}\nReturn Time: ${customerInfo.returnTime}\n\n` : ''}${!hasOnlySessionItems ? `📍 PICKUP LOCATIONS\n${Array.from(new Set(orderItems.filter(item => !item.deliverySelected && item.board).map(item => item.board!.pickup_spot))).join('\n')}\n\n` : ''}${hasOnlySessionItems ? `📍 MEETING LOCATION\nSouth end of Haleiwa Beach Park (look for lifeguard tower)\n\n` : ''}${orderItems.some(item => item.deliverySelected) ? `🚚 DELIVERY ADDRESS\n${customerInfo.deliveryAddress}\n\n` : ''}${customerInfo.notes ? `📝 NOTES\n${customerInfo.notes}\n\n` : ''}💳 Payment has been processed online.

Thank you for choosing Venture Sessions!
    `;

    try {
      await Share.share({
        message: receiptText,
        title: 'Booking Confirmation Receipt'
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
          <ArrowLeft size={24} color="#495057" />
        </Pressable>
        <Text style={styles.title}>Booking Confirmed</Text>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Share2 size={24} color={Colors.light.tint} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={Colors.light.tint} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Thank you {customerInfo.firstName}! Your {hasOnlySessionItems ? 'session booking' : 'surfboard rental'} has been confirmed.
          </Text>
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationLabel}>Confirmation Number</Text>
            <Text style={styles.confirmationNumber}>{confirmationNumber}</Text>
            <Text style={styles.confirmationDate}>{currentDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <User size={20} color={Colors.light.tint} />
            <Text style={styles.infoText}>{customerInfo.firstName} {customerInfo.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Mail size={20} color={Colors.light.tint} />
            <Text style={styles.infoText}>{customerInfo.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={20} color={Colors.light.tint} />
            <Text style={styles.infoText}>{customerInfo.phone}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          {orderItems.map((item, index) => {
            const isSession = !!item.session;
            const itemId = isSession ? item.session!.id : (item.board?.id || `item-${index}`);
            const itemName = isSession ? item.session!.name : (item.board?.short_name || 'Unknown');
            const itemDetails = isSession 
              ? `${item.session!.type.charAt(0).toUpperCase() + item.session!.type.slice(1)} • ${item.session!.level}`
              : (item.board?.dimensions_detail || '');
            const itemType = isSession ? item.session!.type : (item.board?.type || 'unknown');
            
            return (
              <View key={`${itemId}-${index}`} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.boardName}>{itemName}</Text>
                  <Text style={styles.boardDetails}>{itemDetails}</Text>
                  <View style={styles.rentalInfo}>
                    <Text style={styles.rentalText}>
                      {formatDate(item.startDate)}{!isSession && ` - ${formatDate(item.endDate)} (${item.days} days)`}
                      {isSession && item.bookingTime && ` • ${item.bookingTime}`}
                      {isSession && item.participants && ` • ${item.participants} participant${item.participants > 1 ? 's' : ''}`}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(itemType) }]}>
                      <Text style={styles.typeText}>
                        {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {!isSession && item.deliverySelected && (
                    <View style={styles.deliveryInfo}>
                      <Truck size={16} color={Colors.light.tint} />
                      <Text style={styles.deliveryText}>Delivery included (+${item.deliveryPrice})</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.itemPrice}>${item.totalPrice}</Text>
                  {!isSession && item.deliverySelected && (
                    <Text style={styles.deliveryPrice}>+${item.deliveryPrice}</Text>
                  )}
                </View>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>${totalAmount}</Text>
          </View>
        </View>

        {!hasOnlySessionItems && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pickup & Return Times</Text>
              <View style={styles.infoRow}>
                <Clock size={20} color={Colors.light.tint} />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Pickup Time:</Text>
                  <Text style={styles.timeText}>{customerInfo.pickupTime}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Clock size={20} color={Colors.light.tint} />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Return Time:</Text>
                  <Text style={styles.timeText}>{customerInfo.returnTime}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pickup Locations</Text>
              {Array.from(new Set(orderItems.filter(item => !item.deliverySelected && item.board).map(item => item.board!.pickup_spot))).map((location) => (
                <View key={location} style={styles.infoRow}>
                  <MapPin size={20} color={Colors.light.tint} />
                  <Text style={styles.infoText}>{location}</Text>
                </View>
              ))}
              {orderItems.every(item => item.deliverySelected || !item.board) && (
                <Text style={styles.noPickupText}>All items will be delivered</Text>
              )}
            </View>
          </>
        )}

        {orderItems.some(item => item.deliverySelected) && customerInfo.deliveryAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.infoRow}>
              <Home size={20} color={Colors.light.tint} />
              <Text style={styles.infoText}>{customerInfo.deliveryAddress}</Text>
            </View>
          </View>
        )}

        {customerInfo.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Notes</Text>
            <View style={styles.infoRow}>
              <MessageSquare size={20} color={Colors.light.tint} />
              <Text style={styles.infoText}>{customerInfo.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <Text style={styles.paymentNote}>
            💳 Payment has been processed successfully online.
          </Text>
          <Text style={styles.importantNote}>
            📧 A confirmation email has been sent to {customerInfo.email} with all the details above.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color={Colors.light.tint} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Meeting Location</Text>
          </View>
          <View style={styles.directionsBox}>
            <Text style={styles.directionsText}>
              We meet on the south end of Haleiwa Beach Park. Look for the lifeguard tower.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Backpack size={24} color={Colors.light.tint} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>What to Bring</Text>
          </View>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Valid ID and payment method</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Swimwear and towel</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Sunscreen (reef-safe preferred)</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Water bottle to stay hydrated</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Positive attitude and stoke!</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={24} color={Colors.light.tint} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Important Information</Text>
          </View>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Please arrive 10 minutes before your scheduled time</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>All equipment will be provided</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Cancellations must be made 24 hours in advance</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Weather conditions will be monitored for safety</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={24} color={Colors.light.tint} />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>What&apos;s Next?</Text>
          </View>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Arrive at the meeting location at your scheduled time</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Check in with our team at the lifeguard tower</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Our team will have your boards ready to go</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Enjoy your surf session!</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={styles.doneButton} 
          onPress={() => router.replace('/')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
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
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#212529',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  successSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed' as const,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  confirmationNumber: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
    marginBottom: 8,
    letterSpacing: 2,
  },
  confirmationDate: {
    fontSize: 12,
    color: '#495057',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#495057',
    marginLeft: 12,
    flex: 1,
  },
  timeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600' as const,
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
    marginBottom: 4,
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
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: Colors.light.tint,
    marginLeft: 4,
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
  noPickupText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    paddingVertical: 16,
  },
  paymentNote: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 12,
  },
  importantNote: {
    fontSize: 14,
    color: Colors.light.tint,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  directionsBox: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  directionsText: {
    fontSize: 15,
    color: '#212529',
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.tint,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  doneButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600' as const,
  },
});