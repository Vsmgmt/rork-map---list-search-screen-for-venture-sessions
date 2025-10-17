import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, Shield, Building2, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";


export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  const handleAdminAccess = () => {
    router.push('/(tabs)/admin');
  };

  const handleProAccess = () => {
    router.push('/(tabs)/pro');
  };

  const handleProApplication = () => {
    router.push('/(tabs)/application');
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Venture Sessions</Text>
        <Text style={styles.subtitle}>Find Your Perfect Board</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.text}>
            Venture Sessions connects surfers with board rentals across the world&apos;s best surf destinations. 
            Browse our collection of 100+ boards from 12 premier surf locations.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.text}>
            1. Search by location, dates, and board type{"\n"}
            2. View boards on the map and in the list{"\n"}
            3. Click markers to highlight boards{"\n"}
            4. Add boards to your cart{"\n"}
            5. Filter by price and availability
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Board Types</Text>
          <Text style={styles.text}>
            • Soft-top: Perfect for beginners (7&apos;0&quot; - 9&apos;0&quot;){"\n"}
            • Longboard: Classic style and stability (8&apos;0&quot; - 10&apos;0&quot;){"\n"}
            • Shortboard: High performance (5&apos;4&quot; - 6&apos;6&quot;)
          </Text>
        </View>
        
        {/* Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management & Business Tools</Text>
          
          <TouchableOpacity 
            style={styles.managementButton}
            onPress={handleAdminAccess}
          >
            <View style={styles.managementIcon}>
              <Shield size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Admin Dashboard</Text>
              <Text style={styles.managementDescription}>
                Manage bookings, view analytics, and oversee operations
              </Text>
            </View>
            <ArrowRight size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.managementButton}
            onPress={handleProAccess}
          >
            <View style={styles.managementIcon}>
              <Crown size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Pro Dashboard</Text>
              <Text style={styles.managementDescription}>
                Add boards, manage inventory, and track bookings
              </Text>
            </View>
            <ArrowRight size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.managementButton}
            onPress={handleProApplication}
          >
            <View style={styles.managementIcon}>
              <Building2 size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Pro Application</Text>
              <Text style={styles.managementDescription}>
                Apply to become a verified business partner
              </Text>
            </View>
            <ArrowRight size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  managementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  managementContent: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  managementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});