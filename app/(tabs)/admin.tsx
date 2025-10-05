import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Calendar,
  DollarSign,
  Users,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Crown,
  Waves,
  Info,
  X,
  Download,
  Database,
} from 'lucide-react-native';
import { useBookingsBackend } from '@/src/context/bookings-backend';
import { useBoardsBackend } from '@/src/context/boards-backend';
import { Booking, CartItem } from '@/src/types/board';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { bookings, isLoading, getTotalRevenue, getBookingsCount, getBookingsByStatus, updateBookingStatus, backendAvailable } = useBookingsBackend();
  const { boards } = useBoardsBackend();

  
  // Test query to verify tRPC connection
  const testQuery = trpc.admin.getStats.useQuery(undefined, {
    enabled: false, // Don't auto-fetch
  });
  
  // Test regular users query
  const regularUsersQuery = trpc.users.getAllRegular.useQuery(undefined, {
    enabled: false, // Don't auto-fetch
  });
  
  // Test user stats query
  const userStatsQuery = trpc.users.getStats.useQuery(undefined, {
    enabled: false, // Don't auto-fetch
  });
  
  // Export bookings query
  const exportBookingsQuery = trpc.bookings.exportAll.useQuery(undefined, {
    enabled: false, // Don't auto-fetch
  });
  
  // Create pro users mutation
  const createProUsersMutation = trpc.admin.createProUsers.useMutation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all');
  const [currentStatsIndex, setCurrentStatsIndex] = useState(0);
  const [showInfoBubble, setShowInfoBubble] = useState(false);


  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusIcon = useCallback((status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} color="#28a745" />;
      case 'in-progress':
        return <Clock size={16} color="#ffc107" />;
      case 'completed':
        return <CheckCircle size={16} color="#007bff" />;
      case 'cancelled':
        return <XCircle size={16} color="#dc3545" />;
      default:
        return <AlertCircle size={16} color="#6c757d" />;
    }
  }, []);

  const getStatusColor = useCallback((status: Booking['status']) => {
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
  }, []);

  // Regional stats
  const regionalStats = useMemo(() => {
    const regions = ['Honolulu', 'Kona', 'San Diego', 'Santa Cruz', 'Bali', 'Gold Coast', 'Hossegor', 'Ericeira', 'Taghazout', 'Chiba', 'Lisbon', 'Puerto Escondido'];
    return regions.map(region => {
      const regionBoards = boards.filter(board => board.location === region);
      const regionBookings = bookings.filter((booking: Booking) => 
        booking.orderItems.some((item: CartItem) => 
          boards.find(board => board.id === item.board.id)?.location === region
        )
      );
      const revenue = regionBookings.reduce((sum: number, booking: Booking) => sum + booking.totalAmount, 0);
      return {
        region,
        boardCount: regionBoards.length,
        bookingCount: regionBookings.length,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [boards, bookings]);

  // Board type stats
  const boardTypeStats = useMemo(() => {
    const types = ['soft-top', 'longboard', 'shortboard', 'fish', 'sup'];
    return types.map(type => {
      const typeBoards = boards.filter(board => board.type === type);
      const typeBookings = bookings.filter((booking: Booking) => 
        booking.orderItems.some((item: CartItem) => 
          boards.find(board => board.id === item.board.id)?.type === type
        )
      );
      const revenue = typeBookings.reduce((sum: number, booking: Booking) => sum + booking.totalAmount, 0);
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
        boardCount: typeBoards.length,
        bookingCount: typeBookings.length,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [boards, bookings]);

  // PRO user stats (mock data for now)
  const proUserStats = useMemo(() => {
    const mockProUsers = [
      { name: 'Surf Shop Honolulu', boards: 15, bookings: 45, revenue: 2250 },
      { name: 'Kona Beach Rentals', boards: 12, bookings: 38, revenue: 1900 },
      { name: 'San Diego Surf Co', boards: 18, bookings: 52, revenue: 2600 },
      { name: 'Santa Cruz Boards', boards: 10, bookings: 28, revenue: 1400 },
      { name: 'Bali Surf School', boards: 8, bookings: 22, revenue: 1100 }
    ];
    return mockProUsers.sort((a, b) => b.revenue - a.revenue);
  }, []);

  const statsData = useMemo(() => [
    { title: 'Top Regions', data: regionalStats, icon: MapPin },
    { title: 'Board Types', data: boardTypeStats, icon: Waves },
    { title: 'PRO Users', data: proUserStats, icon: Crown }
  ], [regionalStats, boardTypeStats, proUserStats]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: Booking) => {
      const matchesSearch = 
        booking.confirmationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerInfo.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerInfo.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const handleStatusChange = useCallback((bookingId: string, newStatus: Booking['status']) => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to change the status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: () => updateBookingStatus(bookingId, newStatus)
        }
      ]
    );
  }, [updateBookingStatus]);

  const handleViewBooking = useCallback((booking: Booking) => {
    router.push({
      pathname: '/booking-details' as any,
      params: {
        bookingId: booking.id,
        bookingData: JSON.stringify(booking)
      }
    });
  }, []);

  const handleRegenerateSeedData = useCallback(() => {
    console.log('🎯 Regenerate button clicked - navigating to regeneration screen');
    router.push('/data-regeneration');
  }, []);

  const handleSaveAllBookings = useCallback(() => {
    console.log('💾 Save all bookings button pressed');
    exportBookingsQuery.refetch().then((result) => {
      if (result.data) {
        const exportData = result.data;
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Create a downloadable file (web-compatible)
        if (typeof window !== 'undefined') {
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `surfboard-bookings-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          Alert.alert(
            'Export Successful', 
            `Successfully exported ${exportData.totalBookings} bookings to JSON file.\n\nExport Date: ${new Date(exportData.exportDate).toLocaleDateString()}`
          );
        } else {
          // For mobile, show the data in an alert
          Alert.alert(
            'Bookings Export', 
            `Total Bookings: ${exportData.totalBookings}\nExport Date: ${new Date(exportData.exportDate).toLocaleDateString()}\n\nBookings data has been prepared for export.`
          );
        }
        
        console.log('✅ Bookings exported successfully:', exportData);
      }
    }).catch((error) => {
      console.error('❌ Export bookings failed:', error);
      Alert.alert('Export Failed', `Failed to export bookings: ${error.message}`);
    });
  }, [exportBookingsQuery]);
  
  const handleCreateProUsers = useCallback(() => {
    console.log('🏄‍♂️ Create pro users button pressed');
    
    Alert.alert(
      'Create Pro Users',
      'This will create 5 new pro users with 5 boards each (25 total boards). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            createProUsersMutation.mutate({}, {
              onSuccess: (result: any) => {
                console.log('✅ Pro users created successfully:', result);
                Alert.alert(
                  'Success!',
                  `Successfully created ${result.data.totalProUsers} pro users with ${result.data.totalBoards} boards!`
                );
              },
              onError: (error: any) => {
                console.error('❌ Failed to create pro users:', error);
                Alert.alert(
                  'Error',
                  `Failed to create pro users: ${error.message}`
                );
              }
            });
          }
        }
      ]
    );
  }, [createProUsersMutation]);



  const nextStats = useCallback(() => {
    setCurrentStatsIndex((prev) => (prev + 1) % statsData.length);
  }, [statsData.length]);

  const prevStats = useCallback(() => {
    setCurrentStatsIndex((prev) => (prev - 1 + statsData.length) % statsData.length);
  }, [statsData.length]);

  const confirmedBookings = useMemo(() => getBookingsByStatus('confirmed'), [getBookingsByStatus]);
  const inProgressBookings = useMemo(() => getBookingsByStatus('in-progress'), [getBookingsByStatus]);
  const completedBookings = useMemo(() => getBookingsByStatus('completed'), [getBookingsByStatus]);
  const cancelledBookings = useMemo(() => getBookingsByStatus('cancelled'), [getBookingsByStatus]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.headerButtons}>
          <View style={[styles.statusIndicator, { backgroundColor: backendAvailable ? '#28a745' : '#dc3545' }]}>
            <Text style={styles.statusText}>{backendAvailable ? 'Backend' : 'Local'}</Text>
          </View>
          <Pressable 
            style={styles.infoButton}
            onPress={() => setShowInfoBubble(true)}
          >
            <Info size={24} color="#007AFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <DollarSign size={24} color={Colors.light.tint} />
            <Text style={styles.statValue}>${getTotalRevenue()}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={24} color={Colors.light.tint} />
            <Text style={styles.statValue}>{getBookingsCount()}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={24} color={Colors.light.tint} />
            <Text style={styles.statValue}>{boards.length}</Text>
            <Text style={styles.statLabel}>Total Boards</Text>
          </View>
          <Pressable 
            style={[styles.statCard, { backgroundColor: '#f8f9ff' }]}
            onPress={() => {
              console.log('🎯 User Stats button clicked - navigating to user stats screen');
              router.push('/user-stats');
            }}
          >
            <Users size={24} color={Colors.light.tint} />
            <Text style={styles.statValue}>View</Text>
            <Text style={styles.statLabel}>User Stats</Text>
          </Pressable>
        </View>
        
        <View style={styles.statsContainer}>
          <Pressable 
            style={[styles.statCard, { backgroundColor: '#e8f5e8' }]}
            onPress={handleCreateProUsers}
            disabled={createProUsersMutation.isPending}
          >
            <Crown size={24} color="#28a745" />
            <Text style={styles.statValue}>
              {createProUsersMutation.isPending ? '...' : 'Create'}
            </Text>
            <Text style={styles.statLabel}>5 Pro Users + Boards</Text>
          </Pressable>
          <Pressable 
            style={[styles.statCard, { backgroundColor: '#fff8e1' }]}
            onPress={handleSaveAllBookings}
          >
            <Download size={24} color="#ff9800" />
            <Text style={styles.statValue}>Export</Text>
            <Text style={styles.statLabel}>All Bookings</Text>
          </Pressable>
        </View>
        
        <View style={styles.statsContainer}>
          <Pressable 
            style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}
            onPress={() => router.push('/supabase-test')}
          >
            <Database size={24} color="#1976d2" />
            <Text style={styles.statValue}>Test</Text>
            <Text style={styles.statLabel}>Supabase Connection</Text>
          </Pressable>
          <Pressable 
            style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}
            onPress={() => router.push('/setup-database')}
          >
            <Database size={24} color="#9c27b0" />
            <Text style={styles.statValue}>Setup</Text>
            <Text style={styles.statLabel}>Database Schema</Text>
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <CheckCircle size={24} color="#28a745" />
            <Text style={styles.statValue}>{confirmedBookings.length}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#ffc107" />
            <Text style={styles.statValue}>{inProgressBookings.length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* Stats Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderTitle}>{statsData[currentStatsIndex]?.title}</Text>
            <View style={styles.sliderControls}>
              <Pressable style={styles.sliderButton} onPress={prevStats}>
                <Text style={styles.sliderButtonText}>‹</Text>
              </Pressable>
              <View style={styles.sliderDots}>
                {statsData.map((stat, index) => (
                  <View
                    key={stat.title}
                    style={[
                      styles.sliderDot,
                      index === currentStatsIndex && styles.sliderDotActive
                    ]}
                  />
                ))}
              </View>
              <Pressable style={styles.sliderButton} onPress={nextStats}>
                <Text style={styles.sliderButtonText}>›</Text>
              </Pressable>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.sliderScrollView}
            contentContainerStyle={styles.sliderContent}
          >
            <View style={[styles.sliderPage, { width: screenWidth - 40 }]}>
              {statsData[currentStatsIndex]?.data.slice(0, 5).map((item: any, index: number) => {
                const IconComponent = statsData[currentStatsIndex]?.icon;
                const itemKey = item.region || item.type || item.name || `item-${index}`;
                return (
                  <View key={itemKey} style={styles.sliderItem}>
                    <View style={styles.sliderItemLeft}>
                      <IconComponent size={20} color={Colors.light.tint} />
                      <View style={styles.sliderItemInfo}>
                        <Text style={styles.sliderItemName}>
                          {item.region || item.type || item.name}
                        </Text>
                        <Text style={styles.sliderItemDetails}>
                          {item.boardCount || item.boards} boards • {item.bookingCount || item.bookings} bookings
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.sliderItemRevenue}>
                      ${item.revenue}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color="#6c757d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by confirmation, name, or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6c757d"
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).map((status) => (
              <Pressable
                key={status}
                style={[
                  styles.filterButton,
                  statusFilter === status && styles.filterButtonActive
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  statusFilter === status && styles.filterButtonTextActive
                ]}>
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsContainer}>
          <Text style={styles.sectionTitle}>
            Bookings ({filteredBookings.length})
          </Text>
          
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#6c757d" />
              <Text style={styles.emptyStateText}>No bookings found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Bookings will appear here once customers make reservations'
                }
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking: Booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.confirmationNumber}>
                      #{booking.confirmationNumber}
                    </Text>
                    <Text style={styles.customerName}>
                      {booking.customerInfo.firstName} {booking.customerInfo.lastName}
                    </Text>
                    <Text style={styles.bookingDate}>
                      {formatDate(booking.bookingDate)}
                    </Text>
                  </View>
                  <View style={styles.bookingActions}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                      {getStatusIcon(booking.status)}
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(booking.status) }]}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <Text style={styles.orderSummary}>
                    {booking.orderItems.length} board{booking.orderItems.length !== 1 ? 's' : ''} • ${booking.totalAmount}
                  </Text>
                  <Text style={styles.contactInfo}>
                    {booking.customerInfo.email} • {booking.customerInfo.phone}
                  </Text>
                </View>

                <View style={styles.bookingFooter}>
                  <Pressable
                    style={styles.viewButton}
                    onPress={() => handleViewBooking(booking)}
                  >
                    <Eye size={16} color={Colors.light.tint} />
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </Pressable>

                  {booking.status === 'confirmed' && (
                    <Pressable
                      style={styles.statusButton}
                      onPress={() => handleStatusChange(booking.id, 'in-progress')}
                    >
                      <Text style={styles.statusButtonText}>Start Rental</Text>
                    </Pressable>
                  )}

                  {booking.status === 'in-progress' && (
                    <Pressable
                      style={styles.statusButton}
                      onPress={() => handleStatusChange(booking.id, 'completed')}
                    >
                      <Text style={styles.statusButtonText}>Complete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
              <Text style={styles.infoBubbleTitle}>How to use Admin Dashboard</Text>
              <Pressable
                style={styles.infoBubbleClose}
                onPress={() => setShowInfoBubble(false)}
              >
                <X size={20} color="#666" />
              </Pressable>
            </View>
            <View style={styles.infoBubbleContent}>
              <Text style={styles.infoBubbleTip}>📊 <Text style={styles.infoBubbleBold}>Stats Cards</Text> show total revenue, bookings, and status breakdown</Text>
              <Text style={styles.infoBubbleTip}>📈 <Text style={styles.infoBubbleBold}>Stats Slider</Text> displays top regions, board types, and PRO users by revenue</Text>
              <Text style={styles.infoBubbleTip}>🔍 <Text style={styles.infoBubbleBold}>Search & Filter</Text> helps you find specific bookings quickly</Text>
              <Text style={styles.infoBubbleTip}>📅 <Text style={styles.infoBubbleBold}>Booking Management</Text> lets you view details and update booking status</Text>
              <Text style={styles.infoBubbleTip}>👑 <Text style={styles.infoBubbleBold}>PRO User Stats</Text> tracks performance of professional rental partners</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },

  infoButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#212529',
  },
  loadingText: {
    textAlign: 'center' as const,
    marginTop: 50,
    fontSize: 16,
    color: '#6c757d',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  sliderContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#212529',
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
  },
  sliderDots: {
    flexDirection: 'row',
    gap: 4,
  },
  sliderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e9ecef',
  },
  sliderDotActive: {
    backgroundColor: Colors.light.tint,
  },
  sliderScrollView: {
    flex: 1,
  },
  sliderContent: {
    paddingHorizontal: 0,
  },
  sliderPage: {
    gap: 12,
  },
  sliderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  sliderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sliderItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sliderItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 2,
  },
  sliderItemDetails: {
    fontSize: 12,
    color: '#6c757d',
  },
  sliderItemRevenue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#212529',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500' as const,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  bookingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#495057',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 20,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  confirmationNumber: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  bookingActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  orderSummary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#495057',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 12,
    color: '#6c757d',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.tint + '10',
  },
  viewButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  statusButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: '#333',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
  },
});