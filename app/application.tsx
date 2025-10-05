import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { 
  Building2, 
  User, 
  FileText, 
  CheckCircle,
  ArrowRight,
  Waves,
  Heart,
  Handshake
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ApplicationData {
  // Business Information
  businessName: string;
  businessType: 'surf_shop' | 'rental_company' | 'individual_pro' | 'resort' | 'other';
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  website: string;
  taxId: string;
  
  // Contact Person
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  
  // Business Details
  yearsInBusiness: string;
  numberOfBoards: string;
  averageMonthlyRentals: string;
  primaryLocations: string;
  
  // Services
  servicesOffered: {
    boardRentals: boolean;
    lessons: boolean;
    repairs: boolean;
    sales: boolean;
    delivery: boolean;
    storage: boolean;
  };
  
  // Additional Information
  businessDescription: string;
  whyJoinPlatform: string;
  additionalNotes: string;
}

const BUSINESS_TYPES = [
  { label: 'Surf Shop', value: 'surf_shop' },
  { label: 'Rental Company', value: 'rental_company' },
  { label: 'Individual Pro', value: 'individual_pro' },
  { label: 'Resort/Hotel', value: 'resort' },
  { label: 'Other', value: 'other' },
];

export default function ApplicationScreen() {
  const [application, setApplication] = useState<ApplicationData>({
    businessName: '',
    businessType: 'surf_shop',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    taxId: '',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    yearsInBusiness: '',
    numberOfBoards: '',
    averageMonthlyRentals: '',
    primaryLocations: '',
    servicesOffered: {
      boardRentals: true,
      lessons: false,
      repairs: false,
      sales: false,
      delivery: false,
      storage: false,
    },
    businessDescription: '',
    whyJoinPlatform: '',
    additionalNotes: '',
  });

  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleServiceToggle = (service: keyof ApplicationData['servicesOffered']) => {
    setApplication(prev => ({
      ...prev,
      servicesOffered: {
        ...prev.servicesOffered,
        [service]: !prev.servicesOffered[service],
      },
    }));
  };

  const validateForm = (): boolean => {
    const required = [
      'businessName',
      'businessAddress',
      'businessPhone',
      'businessEmail',
      'contactName',
      'contactEmail',
      'yearsInBusiness',
      'numberOfBoards',
      'businessDescription',
      'whyJoinPlatform',
    ];

    for (const field of required) {
      if (!application[field as keyof ApplicationData]) {
        Alert.alert('Missing Information', `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(application.businessEmail) || !emailRegex.test(application.contactEmail)) {
      Alert.alert('Invalid Email', 'Please enter valid email addresses.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to confirmation screen
      router.push({
        pathname: '/confirmation',
        params: {
          type: 'application_submitted',
          businessName: application.businessName,
          message: '🤙 Stoked! Your application is in! We will review it within 2-3 business days and get back to you. In the meantime, keep riding those waves - we are excited to have you join our surf family!'
        }
      });
      
    } catch (error) {
      console.error('Failed to submit application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Pro Application',
          headerStyle: { backgroundColor: Colors.light.tint },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Waves size={32} color={Colors.light.tint} />
            <Heart size={24} color="#ff6b6b" style={styles.heartIcon} />
          </View>
          <Text style={styles.title}>Ready to Ride the Wave? 🏄‍♂️</Text>
          <Text style={styles.subtitle}>
            Hey there, fellow ocean lover! We are stoked to help you grow your surf business. 
            Think of us as your business mentors who happen to love perfect barrels as much as you do.
          </Text>
          <View style={styles.mentorNote}>
            <Handshake size={20} color={Colors.light.tint} />
            <Text style={styles.mentorText}>
              We are here to support local surf businesses globally - from your first board rental to building your empire! 🌊
            </Text>
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={24} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Business Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>What is your surf business called? *</Text>
            <Text style={styles.helpText}>The name that gets surfers stoked! 🤙</Text>
            <TextInput
              style={styles.input}
              value={application.businessName}
              onChangeText={(text) => setApplication(prev => ({ ...prev, businessName: text }))}
              placeholder="e.g. Pacific Surf Co., Aloha Boards, Wave Riders"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>What kind of surf business are you running? *</Text>
            <Text style={styles.helpText}>Every surf business has its own vibe - what is yours?</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
            >
              <Text style={styles.dropdownText}>
                {BUSINESS_TYPES.find(t => t.value === application.businessType)?.label}
              </Text>
              <ArrowRight 
                size={20} 
                color="#666" 
                style={showBusinessTypeDropdown ? styles.arrowRotated : styles.arrowNormal} 
              />
            </TouchableOpacity>
            {showBusinessTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {BUSINESS_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setApplication(prev => ({ ...prev, businessType: type.value as any }));
                      setShowBusinessTypeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Where is your home base? *</Text>
            <Text style={styles.helpText}>Your surf shop, garage, or wherever the magic happens!</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={application.businessAddress}
              onChangeText={(text) => setApplication(prev => ({ ...prev, businessAddress: text }))}
              placeholder="123 Ocean Ave, Surf City, CA 90210\n(Include your full address so locals can find you!)" 
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Phone (for the urgent board needs!) *</Text>
              <TextInput
                style={styles.input}
                value={application.businessPhone}
                onChangeText={(text) => setApplication(prev => ({ ...prev, businessPhone: text }))}
                placeholder="(555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Business Email *</Text>
              <TextInput
                style={styles.input}
                value={application.businessEmail}
                onChangeText={(text) => setApplication(prev => ({ ...prev, businessEmail: text }))}
                placeholder="info@business.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Website (if you have got one)</Text>
              <TextInput
                style={styles.input}
                value={application.website}
                onChangeText={(text) => setApplication(prev => ({ ...prev, website: text }))}
                placeholder="www.business.com"
                placeholderTextColor="#999"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Tax ID / EIN (the boring but necessary stuff)</Text>
              <TextInput
                style={styles.input}
                value={application.taxId}
                onChangeText={(text) => setApplication(prev => ({ ...prev, taxId: text }))}
                placeholder="12-3456789"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Contact Person */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={24} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Who is the Captain of this Ship?</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Your name, surf legend! *</Text>
              <TextInput
                style={styles.input}
                value={application.contactName}
                onChangeText={(text) => setApplication(prev => ({ ...prev, contactName: text }))}
                placeholder="John Smith"
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Your title (CEO, Surf Guru, Wave Whisperer?)</Text>
              <TextInput
                style={styles.input}
                value={application.contactTitle}
                onChangeText={(text) => setApplication(prev => ({ ...prev, contactTitle: text }))}
                placeholder="Owner, Manager, etc."
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={application.contactPhone}
                onChangeText={(text) => setApplication(prev => ({ ...prev, contactPhone: text }))}
                placeholder="(555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Contact Email *</Text>
              <TextInput
                style={styles.input}
                value={application.contactEmail}
                onChangeText={(text) => setApplication(prev => ({ ...prev, contactEmail: text }))}
                placeholder="john@business.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Business Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={24} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Tell Us Your Surf Story</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>How long have you been living the dream? *</Text>
              <Text style={styles.helpText}>Years in the surf business (even if you started in your garage!)</Text>
              <TextInput
                style={styles.input}
                value={application.yearsInBusiness}
                onChangeText={(text) => setApplication(prev => ({ ...prev, yearsInBusiness: text }))}
                placeholder="5"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>How many boards in your quiver? *</Text>
              <Text style={styles.helpText}>Total boards you have for rent</Text>
              <TextInput
                style={styles.input}
                value={application.numberOfBoards}
                onChangeText={(text) => setApplication(prev => ({ ...prev, numberOfBoards: text }))}
                placeholder="50"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Monthly rentals (rough estimate is fine!)</Text>
              <Text style={styles.helpText}>How many boards go out per month?</Text>
              <TextInput
                style={styles.input}
                value={application.averageMonthlyRentals}
                onChangeText={(text) => setApplication(prev => ({ ...prev, averageMonthlyRentals: text }))}
                placeholder="100"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Your favorite surf spots to serve</Text>
              <Text style={styles.helpText}>Where do you usually deliver or operate?</Text>
              <TextInput
                style={styles.input}
                value={application.primaryLocations}
                onChangeText={(text) => setApplication(prev => ({ ...prev, primaryLocations: text }))}
                placeholder="San Diego, LA"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Services Offered */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={24} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>What is Your Superpower?</Text>
            <Text style={styles.helpText}>Check all the ways you help fellow surfers get stoked!</Text>
          </View>
          
          <View style={styles.servicesGrid}>
            {Object.entries({
              boardRentals: 'Board Rentals',
              lessons: 'Surf Lessons',
              repairs: 'Board Repairs',
              sales: 'Board Sales',
              delivery: 'Delivery Service',
              storage: 'Board Storage',
            }).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={styles.serviceItem}
                onPress={() => handleServiceToggle(key as keyof ApplicationData['servicesOffered'])}
              >
                <View style={[
                  styles.serviceCheckbox,
                  application.servicesOffered[key as keyof ApplicationData['servicesOffered']] && styles.serviceCheckboxChecked
                ]}>
                  {application.servicesOffered[key as keyof ApplicationData['servicesOffered']] && (
                    <CheckCircle size={16} color="white" />
                  )}
                </View>
                <Text style={styles.serviceLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={24} color={Colors.light.tint} />
            <Text style={styles.sectionTitle}>Let us Get to Know You Better</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>What is your surf business story? *</Text>
            <Text style={styles.helpText}>Share your passion! What makes your business special?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={application.businessDescription}
              onChangeText={(text) => setApplication(prev => ({ ...prev, businessDescription: text }))}
              placeholder="Started in my garage with 3 boards and a dream... Now we are the go-to spot for beginners and pros alike! We specialize in eco-friendly boards and love teaching groms their first wave. What makes us unique is..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Why do you want to join our surf family? *</Text>
            <Text style={styles.helpText}>We are building a global community of surf businesses - what is your vision?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={application.whyJoinPlatform}
              onChangeText={(text) => setApplication(prev => ({ ...prev, whyJoinPlatform: text }))}
              placeholder="I want to connect with more surfers and grow my business while staying true to the surf culture. I would love to help travelers find quality boards and share my local knowledge. My goal is to..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Anything else you want to share?</Text>
            <Text style={styles.helpText}>Questions, special requests, or just want to say aloha?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={application.additionalNotes}
              onChangeText={(text) => setApplication(prev => ({ ...prev, additionalNotes: text }))}
              placeholder="I am excited to be part of this! I also do board repairs and have been surfing for 15 years. Looking forward to connecting with the community..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>🌊 What You Get as Our Partner 🌊</Text>
          <Text style={styles.benefitsSubtitle}>We have got your back! Here is how we help you succeed:</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <CheckCircle size={20} color={Colors.light.tint} />
              <Text style={styles.benefitText}>🏆 Priority placement (get seen first!)</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={20} color={Colors.light.tint} />
              <Text style={styles.benefitText}>💰 Lower fees (more money in your pocket)</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={20} color={Colors.light.tint} />
              <Text style={styles.benefitText}>📊 Business insights (know your numbers)</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={20} color={Colors.light.tint} />
              <Text style={styles.benefitText}>⚡ Easy bulk management (save time)</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={20} color={Colors.light.tint} />
              <Text style={styles.benefitText}>🤝 Direct support line (we are here to help)</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={20} color={Colors.light.tint} />
              <Text style={styles.benefitText}>📢 Marketing partnerships (grow together)</Text>
            </View>
          </View>
          <View style={styles.encouragementBox}>
            <Text style={styles.encouragementText}>
              💙 Remember: Every successful surf business started with someone who believed in their dream. 
              We believe in yours too! Let us make some waves together.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '🌊 Sending Your Story...' : '🚀 Let us Do This Together!'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    gap: 8,
  },
  serviceCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCheckboxChecked: {
    backgroundColor: Colors.light.tint,
  },
  serviceLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  benefitsSection: {
    backgroundColor: '#f0f8ff',
    margin: 12,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1f0ff',
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  arrowNormal: {
    transform: [{ rotate: '0deg' }],
  },
  arrowRotated: {
    transform: [{ rotate: '90deg' }],
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heartIcon: {
    marginLeft: -8,
    marginTop: -4,
  },
  mentorNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e1f0ff',
  },
  mentorText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  benefitsSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  encouragementBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  encouragementText: {
    fontSize: 15,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});