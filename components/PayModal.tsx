import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { 
  X, 
  CreditCard, 
  Lock, 
  CheckCircle,
  Smartphone,
  Wallet,
  DollarSign
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface PayModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  totalAmount: number;
  customerName: string;
  description?: string;
}

type PaymentMethod = 'card' | 'apple' | 'google' | 'paypal';

export default function PayModal({ 
  visible, 
  onClose, 
  onPaymentComplete, 
  totalAmount, 
  customerName,
  description 
}: PayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState(customerName);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateCard = () => {
    if (selectedMethod === 'card') {
      if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid card number.');
        return false;
      }
      if (!expiryDate || expiryDate.length < 5) {
        Alert.alert('Invalid Expiry', 'Please enter a valid expiry date.');
        return false;
      }
      if (!cvv || cvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid CVV.');
        return false;
      }
      if (!cardName.trim()) {
        Alert.alert('Invalid Name', 'Please enter the cardholder name.');
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateCard()) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate random success/failure for demo
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        onPaymentComplete();
      } else {
        Alert.alert(
          'Payment Failed',
          'Your payment could not be processed. Please try again or use a different payment method.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const PaymentMethodButton = ({ 
    method, 
    icon, 
    title, 
    subtitle 
  }: { 
    method: PaymentMethod; 
    icon: React.ReactNode; 
    title: string; 
    subtitle: string; 
  }) => (
    <Pressable
      style={[
        styles.paymentMethod,
        selectedMethod === method && styles.paymentMethodSelected
      ]}
      onPress={() => setSelectedMethod(method)}
    >
      <View style={styles.paymentMethodIcon}>
        {icon}
      </View>
      <View style={styles.paymentMethodInfo}>
        <Text style={styles.paymentMethodTitle}>{title}</Text>
        <Text style={styles.paymentMethodSubtitle}>{subtitle}</Text>
      </View>
      <View style={[
        styles.radioButton,
        selectedMethod === method && styles.radioButtonSelected
      ]}>
        {selectedMethod === method && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#495057" />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>${totalAmount}</Text>
            <Text style={styles.amountDescription}>{description || `Booking for ${customerName}`}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <PaymentMethodButton
              method="card"
              icon={<CreditCard size={24} color={Colors.light.tint} />}
              title="Credit/Debit Card"
              subtitle="Visa, Mastercard, American Express"
            />
            
            <PaymentMethodButton
              method="apple"
              icon={<Smartphone size={24} color="#000" />}
              title="Apple Pay"
              subtitle="Pay with Touch ID or Face ID"
            />
            
            <PaymentMethodButton
              method="google"
              icon={<Wallet size={24} color="#4285F4" />}
              title="Google Pay"
              subtitle="Quick and secure payment"
            />
            
            <PaymentMethodButton
              method="paypal"
              icon={<DollarSign size={24} color="#0070BA" />}
              title="PayPal"
              subtitle="Pay with your PayPal account"
            />
          </View>

          {selectedMethod === 'card' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card Details</Text>
              
              <View style={styles.inputContainer}>
                <CreditCard size={20} color="#6c757d" />
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Lock size={20} color="#6c757d" />
                  <TextInput
                    style={styles.input}
                    placeholder="CVV"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Cardholder Name"
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {selectedMethod !== 'card' && (
            <View style={styles.section}>
              <View style={styles.alternativePaymentInfo}>
                <Text style={styles.alternativePaymentText}>
                  You will be redirected to {selectedMethod === 'apple' ? 'Apple Pay' : selectedMethod === 'google' ? 'Google Pay' : 'PayPal'} to complete your payment securely.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.securityInfo}>
            <Lock size={16} color="#28a745" />
            <Text style={styles.securityText}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable 
            style={[styles.payButton, isProcessing && styles.payButtonDisabled]} 
            onPress={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.payButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <CheckCircle size={20} color="white" />
                <Text style={styles.payButtonText}>Pay ${totalAmount}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
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
  content: {
    flex: 1,
  },
  amountSection: {
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
  amountLabel: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
    marginBottom: 8,
  },
  amountDescription: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center' as const,
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
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#f8f9ff',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.light.tint,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#212529',
  },
  inputRow: {
    flexDirection: 'row',
  },
  alternativePaymentInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  alternativePaymentText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  securityText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 8,
    fontWeight: '500' as const,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  payButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600' as const,
  },
});