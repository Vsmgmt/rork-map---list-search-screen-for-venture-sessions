import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  X, 
  Mail, 
  CheckCircle, 
  Send, 
  Receipt, 
  Calendar,
  Phone,
  Truck,
  MapPin,
  ShoppingBag,
  Package
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CheckoutInfo } from '@/src/types/board';

export default function EmailReceiptScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Parse the passed parameters
  const confirmationNumber = params.confirmationNumber as string;
  const customerInfo = JSON.parse(params.customerInfo as string) as CheckoutInfo;
  const orderItems = JSON.parse(params.orderItems as string);
  const totalAmount = parseFloat(params.totalAmount as string);
  
  const handleSendReceipt = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
      Alert.alert(
        'Receipt Sent!',
        `Your booking receipt has been sent to ${email}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send receipt. Please try again.');
    } finally {
      setIsSending(false);
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
        <Text style={styles.title}>Email Receipt</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#495057" />
        </Pressable>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color="#28a745" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your booking has been confirmed
          </Text>
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationLabel}>Confirmation Number</Text>
            <Text style={styles.confirmationNumber}>{confirmationNumber}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer:</Text>
            <Text style={styles.summaryValue}>
              {customerInfo.firstName} {customerInfo.lastName}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>{customerInfo.email}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone:</Text>
            <Text style={styles.summaryValue}>{customerInfo.phone}</Text>
          </View>
          
          {customerInfo.pickupTime && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pickup Time:</Text>
              <Text style={styles.summaryValue}>{customerInfo.pickupTime}</Text>
            </View>
          )}
          
          {customerInfo.returnTime && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Return Time:</Text>
              <Text style={styles.summaryValue}>{customerInfo.returnTime}</Text>
            </View>
          )}
          
          {customerInfo.deliveryAddress && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Address:</Text>
              <Text style={styles.summaryValue}>{customerInfo.deliveryAddress}</Text>
            </View>
          )}
          
          {customerInfo.notes && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Notes:</Text>
              <Text style={styles.summaryValue}>{customerInfo.notes}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          {orderItems.map((item: any, index: number) => {
            const isSession = item.session || item.board?.type === 'lesson' || item.board?.type === 'tour' || item.board?.type === 'camp' || item.board?.type === 'session';
            const bookingItem = item.session || item.board;
            const itemName = bookingItem?.short_name || bookingItem?.name || 'Unknown Item';
            const itemDetails = isSession 
              ? `${bookingItem?.level || ''} · ${bookingItem?.duration || 0} min`
              : bookingItem?.dimensions_detail || '';
            
            return (
              <View key={`${bookingItem?.id}-${index}`} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.boardName}>{itemName}</Text>
                  {itemDetails && <Text style={styles.boardDetails}>{itemDetails}</Text>}
                  <View style={styles.rentalInfo}>
                    {!isSession && item.startDate && item.endDate ? (
                      <Text style={styles.rentalText}>
                        {formatDate(item.startDate)} - {formatDate(item.endDate)} ({item.days} days)
                      </Text>
                    ) : isSession && item.sessionDate && item.sessionTime ? (
                      <Text style={styles.rentalText}>
                        {formatDate(item.sessionDate)} at {item.sessionTime}
                      </Text>
                    ) : null}
                    {bookingItem?.type && (
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(bookingItem.type) }]}>
                        <Text style={styles.typeText}>
                          {bookingItem.type.charAt(0).toUpperCase() + bookingItem.type.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {item.deliverySelected && (
                    <View style={styles.deliveryInfo}>
                      <Truck size={14} color={Colors.light.tint} />
                      <Text style={styles.deliveryText}>Delivery included</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.itemPrice}>${item.totalPrice}</Text>
                  {item.deliverySelected && (
                    <Text style={styles.deliveryPrice}>+${item.deliveryPrice}</Text>
                  )}
                </View>
              </View>
            );
          })}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid:</Text>
            <Text style={styles.totalAmount}>${totalAmount}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Location & Directions</Text>
          <View style={styles.directionsBox}>
            <MapPin size={24} color={Colors.light.tint} />
            <View style={styles.directionsContent}>
              <Text style={styles.directionsTitle}>Haleiwa Beach Park - South End</Text>
              <Text style={styles.directionsText}>
                Look for the lifeguard tower. We will meet you near the south end of Haleiwa Beach Park by the main parking area.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Bring</Text>
          <View style={styles.infoBox}>
            <ShoppingBag size={24} color={Colors.light.tint} />
            <View style={styles.infoContent}>
              <Text style={styles.infoItem}>• Come wearing your swimsuit</Text>
              <Text style={styles.infoItem}>• Apply sunscreen before arrival</Text>
              <Text style={styles.infoItem}>• Bring a towel</Text>
              <Text style={styles.infoItem}>• Water bottle (stay hydrated!)</Text>
              <Text style={styles.infoItem}>• Reef-safe sunscreen for reapplication</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Provide</Text>
          <View style={styles.infoBox}>
            <Package size={24} color={Colors.light.tint} />
            <View style={styles.infoContent}>
              <Text style={styles.infoItem}>• Surfboard or paddleboard</Text>
              <Text style={styles.infoItem}>• Rash guard</Text>
              <Text style={styles.infoItem}>• Booties (reef protection)</Text>
              <Text style={styles.infoItem}>• Safety leash</Text>
              <Text style={styles.infoItem}>• Professional instruction (for lessons/tours)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Reminders</Text>
          <View style={styles.nextStepItem}>
            <Calendar size={20} color={Colors.light.tint} />
            <Text style={styles.nextStepText}>
              Arrive 10 minutes early to get fitted for your gear
            </Text>
          </View>
          <View style={styles.nextStepItem}>
            <Receipt size={20} color={Colors.light.tint} />
            <Text style={styles.nextStepText}>
              Show this confirmation number: {confirmationNumber}
            </Text>
          </View>
          <View style={styles.nextStepItem}>
            <Phone size={20} color={Colors.light.tint} />
            <Text style={styles.nextStepText}>
              Contact us if you need to make any changes or have questions
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Receipt via Email</Text>
          <Text style={styles.sectionDescription}>
            Enter your email address to receive a detailed receipt of your booking.
          </Text>
          
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6c757d" />
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!emailSent}
            />
          </View>
          
          <Pressable 
            style={[
              styles.sendButton, 
              (isSending || emailSent) && styles.sendButtonDisabled
            ]} 
            onPress={handleSendReceipt}
            disabled={isSending || emailSent}
          >
            {isSending ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.sendButtonText}>Sending...</Text>
              </>
            ) : emailSent ? (
              <>
                <CheckCircle size={20} color="white" />
                <Text style={styles.sendButtonText}>Receipt Sent</Text>
              </>
            ) : (
              <>
                <Send size={20} color="white" />
                <Text style={styles.sendButtonText}>Send Receipt</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable 
          style={styles.doneButton} 
          onPress={() => router.push('/')}
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
    color: '#28a745',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  confirmationBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
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
    letterSpacing: 1,
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
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#212529',
  },
  sendButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500' as const,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#212529',
    flex: 2,
    textAlign: 'right' as const,
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
    fontWeight: '500' as const,
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
    color: '#28a745',
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nextStepText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  directionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    padding: 16,
  },
  directionsContent: {
    flex: 1,
    marginLeft: 12,
  },
  directionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 8,
  },
  directionsText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 4,
  },
});