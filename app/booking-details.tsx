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
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Home,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react-native';
import { useBookings } from '@/src/context/bookings';
import { Booking } from '@/src/types/board';
import Colors from '@/constants/colors';

export default function BookingDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { updateBookingStatus } = useBookings();
  
  const booking = JSON.parse(params.bookingData as string) as Booking;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={20} color="#28a745" />;
      case 'in-progress':
        return <Clock size={20} color="#ffc107" />;
      case 'completed':
        return <CheckCircle size={20} color="#007bff" />;
      case 'cancelled':
        return <XCircle size={20} color="#dc3545" />;
      default:
        return <AlertCircle size={20} color="#6c757d" />;
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return '#28a745';
      case 'in-progress':
        return '#ffc107';
      case 'completed':
        return '#007bff';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const handleStatusChange = (newStatus: Booking['status']) => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to change the status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: () => {
            updateBookingStatus(booking.id, newStatus);
            router.back();
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#495057" />
        </Pressable>
        <Text style={styles.title}>Booking Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.confirmationNumber}>#{booking.confirmationNumber}</Text>
              <Text style={styles.bookingDate}>{formatDateTime(booking.bookingDate)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
              {getStatusIcon(booking.status)}
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <User size={20} color={Colors.light.tint} />
            <Text style={styles.infoText}>{booking.customerInfo.firstName} {booking.customerInfo.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Mail size={20} color={Colors.light.tint} />
            <Text style={styles.infoText}>{booking.customerInfo.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={20} color={Colors.light.tint} />
            <Text style={styles.infoText}>{booking.customerInfo.phone}</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          {booking.orderItems.map((item, index) => (
            <View key={`${item.board.id}-${index}`} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.boardName}>{item.board.short_name}</Text>
                <Text style={styles.boardDetails}>{item.board.dimensions_detail}</Text>
                <View style={styles.rentalInfo}>
                  <Text style={styles.rentalText}>
                    {formatDate(item.startDate)} - {formatDate(item.endDate)} ({item.days} days)
                  </Text>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.board.type) }]}>
                    <Text style={styles.typeText}>
                      {item.board.type.charAt(0).toUpperCase() + item.board.type.slice(1)}
                    </Text>
                  </View>
                </View>
                {item.deliverySelected && (
                  <View style={styles.deliveryInfo}>
                    <Truck size={16} color={Colors.light.tint} />
                    <Text style={styles.deliveryText}>Delivery included (+${item.deliveryPrice})</Text>
                  </View>
                )}
                {item.extras && item.extras.length > 0 && (
                  <View style={styles.extrasContainer}>
                    <Text style={styles.extrasTitle}>Extras:</Text>
                    {item.extras.map((cartExtra, extraIndex) => (
                      <View key={`${cartExtra.extra.id}-${extraIndex}`} style={styles.extraItem}>
                        <Text style={styles.extraName}>
                          {cartExtra.extra.name} x{cartExtra.quantity}
                          {cartExtra.size && ` (${cartExtra.size})`}
                        </Text>
                        <Text style={styles.extraPrice}>${cartExtra.totalPrice}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.ownerInfo}>
                  <Image
                    source={{ uri: item.board.owner.avatarUrl }}
                    style={styles.ownerAvatar}
                    resizeMode="cover"
                  />
                  <Text style={styles.ownerName}>Owner: {item.board.owner.name}</Text>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>${item.totalPrice}</Text>
                {item.deliverySelected && (
                  <Text style={styles.deliveryPrice}>+${item.deliveryPrice}</Text>
                )}
              </View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>${booking.totalAmount}</Text>
          </View>
        </View>

        {/* Pickup & Return Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup & Return Times</Text>
          <View style={styles.infoRow}>
            <Clock size={20} color={Colors.light.tint} />
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Pickup Time:</Text>
              <Text style={styles.timeText}>{booking.customerInfo.pickupTime}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Clock size={20} color={Colors.light.tint} />
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Return Time:</Text>
              <Text style={styles.timeText}>{booking.customerInfo.returnTime}</Text>
            </View>
          </View>
        </View>

        {/* Pickup Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Locations</Text>
          {Array.from(new Set(booking.orderItems.filter(item => !item.deliverySelected).map(item => item.board.pickup_spot))).map((location) => (
            <View key={location} style={styles.infoRow}>
              <MapPin size={20} color={Colors.light.tint} />
              <Text style={styles.infoText}>{location}</Text>
            </View>
          ))}
          {booking.orderItems.every(item => item.deliverySelected) && (
            <Text style={styles.noPickupText}>All items will be delivered</Text>
          )}
        </View>

        {/* Delivery Address */}
        {booking.orderItems.some(item => item.deliverySelected) && booking.customerInfo.deliveryAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.infoRow}>
              <Home size={20} color={Colors.light.tint} />
              <Text style={styles.infoText}>{booking.customerInfo.deliveryAddress}</Text>
            </View>
          </View>
        )}

        {/* Special Notes */}
        {booking.customerInfo.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Notes</Text>
            <View style={styles.infoRow}>
              <MessageSquare size={20} color={Colors.light.tint} />
              <Text style={styles.infoText}>{booking.customerInfo.notes}</Text>
            </View>
          </View>
        )}

        {/* Status Actions */}
        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsContainer}>
              {booking.status === 'confirmed' && (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#ffc107' }]}
                  onPress={() => handleStatusChange('in-progress')}
                >
                  <Clock size={20} color="white" />
                  <Text style={styles.actionButtonText}>Start Rental</Text>
                </Pressable>
              )}
              
              {booking.status === 'in-progress' && (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#007bff' }]}
                  onPress={() => handleStatusChange('completed')}
                >
                  <CheckCircle size={20} color="white" />
                  <Text style={styles.actionButtonText}>Mark Complete</Text>
                </Pressable>
              )}

              {(booking.status === 'confirmed' || booking.status === 'in-progress') && (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
                  onPress={() => handleStatusChange('cancelled')}
                >
                  <XCircle size={20} color="white" />
                  <Text style={styles.actionButtonText}>Cancel Booking</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>
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
  placeholder: {
    width: 40,
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  confirmationNumber: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 6,
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
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ownerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
  },
  ownerName: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500' as const,
  },
  extrasContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  extrasTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#495057',
    marginBottom: 4,
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  extraName: {
    fontSize: 11,
    color: '#6c757d',
    flex: 1,
  },
  extraPrice: {
    fontSize: 11,
    color: Colors.light.tint,
    fontWeight: '600' as const,
  },
});