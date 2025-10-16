import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Shield,
  Settings,
  LogOut,
  Camera,
  Check,
  X,
  Crown,
  ChevronRight,
  BarChart3,
  Plus,
  Upload,
  DollarSign,
  Info,
  Loader2,
  Wand2,
  Users,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
} from 'lucide-react-native';
import { useUser } from '@/src/context/user';
import { trpc } from '@/lib/trpc';
import { getProUsers } from '@/src/data/seed';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { BoardType, Booking, Board } from '@/src/types/board';
import DatePicker from '@/components/DatePicker';
import { useBoards } from '@/src/context/boards';
import { useBookings } from '@/src/context/bookings';

interface BoardImages {
  deckFront: string | null;
  bottomBack: string | null;
  dimensions: string | null;
}

interface NewBoard {
  name: string;
  type: BoardType;
  location: string;
  pricePerDay: string;
  pricePerWeek: string;
  dimensions: string;
  volume: string;
  description: string;
  pickupSpot: string;
  availableStart: string;
  availableEnd: string;
  deliveryAvailable: boolean;
  deliveryPrice: string;
  images: BoardImages;
}

const BOARD_TYPES: { label: string; value: BoardType }[] = [
  { label: 'Soft Top', value: 'soft-top' },
  { label: 'Shortboard', value: 'shortboard' },
  { label: 'Fish', value: 'fish' },
  { label: 'Longboard', value: 'longboard' },
  { label: 'SUP', value: 'sup' },
];

const LOCATIONS = [
  'Honolulu', 'Kona', 'San Diego', 'Santa Cruz', 'Bali', 'Gold Coast',
  'Hossegor', 'Ericeira', 'Taghazout', 'Chiba', 'Lisbon', 'Puerto Escondido'
];

export default function ProfileScreen() {
  const { currentUser, isLoading, updateUser, switchToProUser, switchToRegularUser, logout } = useUser();
  const { addBoard, updateBoard, boards, removeBoard } = useBoards();
  const { bookings, isLoading: bookingsLoading, getTotalRevenue, getBookingsCount, getBookingsByStatus, updateBookingStatus } = useBookings();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(currentUser);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [activeProTab, setActiveProTab] = useState<'dashboard' | 'add-board' | 'bookings' | 'my-boards'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all');
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingDimensions, setIsAnalyzingDimensions] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  
  const [board, setBoard] = useState<NewBoard>({
    name: '',
    type: 'shortboard',
    location: 'San Diego',
    pricePerDay: '35',
    pricePerWeek: '175',
    dimensions: '',
    volume: '',
    description: '',
    pickupSpot: '',
    availableStart: '',
    availableEnd: '',
    deliveryAvailable: false,
    deliveryPrice: '',
    images: {
      deckFront: null,
      bottomBack: null,
      dimensions: null,
    },
  });

  const proUsersQuery = trpc.admin.getProUsers.useQuery();
  const addBoardMutation = trpc.boards.add.useMutation();
  
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No user found</Text>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!editedUser) return;
    
    await updateUser({
      name: editedUser.name,
      email: editedUser.email,
      phone: editedUser.phone,
      location: editedUser.location,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(currentUser);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSwitchUserType = (type: 'regular' | 'pro', proUserId?: string) => {
    if (type === 'regular') {
      switchToRegularUser();
    } else if (type === 'pro' && proUserId) {
      switchToProUser(proUserId);
    }
    setShowUserTypeModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const proUsers = getProUsers();

  const renderProDashboardContent = () => {
    if (bookingsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      );
    }

    const confirmedBookings = getBookingsByStatus('confirmed');
    const inProgressBookings = getBookingsByStatus('in-progress');
    const completedBookings = getBookingsByStatus('completed');
    const myBoards = boards.filter(board => board.id.startsWith('user-'));

    switch (activeProTab) {
      case 'dashboard':
        return (
          <View style={styles.dashboardContent}>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <DollarSign size={20} color={Colors.light.tint} />
                <Text style={styles.statValue}>${getTotalRevenue()}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Calendar size={20} color={Colors.light.tint} />
                <Text style={styles.statValue}>{getBookingsCount()}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <CheckCircle size={20} color="#28a745" />
                <Text style={styles.statValue}>{confirmedBookings.length}</Text>
                <Text style={styles.statLabel}>Confirmed</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={20} color="#ffc107" />
                <Text style={styles.statValue}>{inProgressBookings.length}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
            </View>
            
            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => setActiveProTab('add-board')}
              >
                <Plus size={16} color={Colors.light.tint} />
                <Text style={styles.quickActionText}>Add Board</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => setActiveProTab('bookings')}
              >
                <BarChart3 size={16} color={Colors.light.tint} />
                <Text style={styles.quickActionText}>View Bookings</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case 'add-board':
        const availableProUsers = proUsersQuery.data || [];
        return (
          <ScrollView style={styles.addBoardForm} showsVerticalScrollIndicator={false}>
            {/* Owner Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Owner *</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowOwnerDropdown(!showOwnerDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {selectedOwner ? availableProUsers.find((u: any) => u.id === selectedOwner)?.name : 'Select Pro User'}
                </Text>
                <ChevronRight size={20} color="#666" style={{ transform: [{ rotate: showOwnerDropdown ? '90deg' : '0deg' }] }} />
              </Pressable>
              {showOwnerDropdown && (
                <View style={styles.dropdownMenu}>
                  {availableProUsers.map((user: any) => (
                    <Pressable
                      key={user.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedOwner(user.id);
                        setShowOwnerDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{user.name}</Text>
                      <Text style={styles.dropdownItemSubtext}>{user.location}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Board Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Board Name *</Text>
              <TextInput
                style={styles.formInput}
                value={board.name}
                onChangeText={(text) => setBoard(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Wavestorm 8'"
                placeholderTextColor="#999"
              />
            </View>

            {/* Board Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Board Type *</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {BOARD_TYPES.find(t => t.value === board.type)?.label}
                </Text>
                <ChevronRight size={20} color="#666" style={{ transform: [{ rotate: showTypeDropdown ? '90deg' : '0deg' }] }} />
              </Pressable>
              {showTypeDropdown && (
                <View style={styles.dropdownMenu}>
                  {BOARD_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setBoard(prev => ({ ...prev, type: type.value }));
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location *</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowLocationDropdown(!showLocationDropdown)}
              >
                <Text style={styles.dropdownText}>{board.location}</Text>
                <ChevronRight size={20} color="#666" style={{ transform: [{ rotate: showLocationDropdown ? '90deg' : '0deg' }] }} />
              </Pressable>
              {showLocationDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={styles.dropdownScroll}>
                    {LOCATIONS.map((loc) => (
                      <Pressable
                        key={loc}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setBoard(prev => ({ ...prev, location: loc }));
                          setShowLocationDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{loc}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Pricing */}
            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Price/Day *</Text>
                <TextInput
                  style={styles.formInput}
                  value={board.pricePerDay}
                  onChangeText={(text) => setBoard(prev => ({ ...prev, pricePerDay: text }))}
                  placeholder="35"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Price/Week *</Text>
                <TextInput
                  style={styles.formInput}
                  value={board.pricePerWeek}
                  onChangeText={(text) => setBoard(prev => ({ ...prev, pricePerWeek: text }))}
                  placeholder="175"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Dimensions */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Dimensions *</Text>
              <TextInput
                style={styles.formInput}
                value={board.dimensions}
                onChangeText={(text) => setBoard(prev => ({ ...prev, dimensions: text }))}
                placeholder="8'0 x 22 x 3 inches"
                placeholderTextColor="#999"
              />
            </View>

            {/* Pickup Spot */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pickup Location *</Text>
              <TextInput
                style={styles.formInput}
                value={board.pickupSpot}
                onChangeText={(text) => setBoard(prev => ({ ...prev, pickupSpot: text }))}
                placeholder="123 Beach St, San Diego, CA"
                placeholderTextColor="#999"
              />
            </View>

            {/* Image Upload */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Board Photo *</Text>
              <Pressable
                style={styles.imageUploadButton}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [3, 4],
                    quality: 0.8,
                  });
                  if (!result.canceled) {
                    setBoard(prev => ({
                      ...prev,
                      images: { ...prev.images, deckFront: result.assets[0].uri }
                    }));
                  }
                }}
              >
                {board.images.deckFront ? (
                  <Image source={{ uri: board.images.deckFront }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Upload size={32} color="#999" />
                    <Text style={styles.uploadText}>Tap to upload photo</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitBoardButton, isSubmitting && styles.submitBoardButtonDisabled]}
              onPress={async () => {
                if (!selectedOwner) {
                  Alert.alert('Missing Owner', 'Please select a pro user as the board owner.');
                  return;
                }
                if (!board.name || !board.pricePerDay || !board.pricePerWeek || !board.dimensions || !board.pickupSpot) {
                  Alert.alert('Missing Fields', 'Please fill in all required fields.');
                  return;
                }
                if (!board.images.deckFront) {
                  Alert.alert('Missing Photo', 'Please upload a board photo.');
                  return;
                }

                setIsSubmitting(true);
                try {
                  const today = new Date();
                  const nextYear = new Date();
                  nextYear.setFullYear(today.getFullYear() + 1);

                  await addBoardMutation.mutateAsync({
                    name: board.name,
                    type: board.type,
                    location: board.location,
                    pricePerDay: parseFloat(board.pricePerDay),
                    pricePerWeek: parseFloat(board.pricePerWeek),
                    dimensions: board.dimensions,
                    volume: board.volume ? parseFloat(board.volume) : undefined,
                    description: board.description || `${board.type} surfboard`,
                    pickupSpot: board.pickupSpot,
                    availableStart: today.toISOString(),
                    availableEnd: nextYear.toISOString(),
                    deliveryAvailable: board.deliveryAvailable,
                    deliveryPrice: board.deliveryPrice ? parseFloat(board.deliveryPrice) : 0,
                    imageUrl: board.images.deckFront,
                    ownerId: selectedOwner,
                  });

                  Alert.alert('Success!', 'Board added successfully');
                  setBoard({
                    name: '',
                    type: 'shortboard',
                    location: 'San Diego',
                    pricePerDay: '35',
                    pricePerWeek: '175',
                    dimensions: '',
                    volume: '',
                    description: '',
                    pickupSpot: '',
                    availableStart: '',
                    availableEnd: '',
                    deliveryAvailable: false,
                    deliveryPrice: '',
                    images: { deckFront: null, bottomBack: null, dimensions: null },
                  });
                  setSelectedOwner('');
                  setActiveProTab('dashboard');
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Failed to add board');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBoardButtonText}>
                {isSubmitting ? 'Adding Board...' : 'Add Board for Rent'}
              </Text>
            </Pressable>
          </ScrollView>
        );
        
      case 'my-boards':
        return (
          <View style={styles.myBoardsContent}>
            <Text style={styles.boardsCount}>My Boards ({myBoards.length})</Text>
            {myBoards.length === 0 ? (
              <View style={styles.emptyBoardsState}>
                <Edit size={32} color="#6c757d" />
                <Text style={styles.emptyStateText}>No boards yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first board to start renting</Text>
              </View>
            ) : (
              myBoards.slice(0, 3).map((board) => (
                <View key={board.id} style={styles.boardPreviewCard}>
                  <Image source={{ uri: board.imageUrl }} style={styles.boardPreviewImage} />
                  <View style={styles.boardPreviewInfo}>
                    <Text style={styles.boardPreviewName}>{board.short_name}</Text>
                    <Text style={styles.boardPreviewType}>{board.type} • {board.dimensions_detail}</Text>
                    <Text style={styles.boardPreviewPrice}>${board.price_per_day}/day</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        );
        
      case 'bookings':
        return (
          <View style={styles.bookingsContent}>
            <Text style={styles.bookingsCount}>Recent Bookings ({bookings.length})</Text>
            {bookings.length === 0 ? (
              <View style={styles.emptyBookingsState}>
                <Users size={32} color="#6c757d" />
                <Text style={styles.emptyStateText}>No bookings yet</Text>
                <Text style={styles.emptyStateSubtext}>Bookings will appear here</Text>
              </View>
            ) : (
              bookings.slice(0, 3).map((booking) => (
                <View key={booking.id} style={styles.bookingPreviewCard}>
                  <View style={styles.bookingPreviewHeader}>
                    <Text style={styles.confirmationNumber}>#{booking.confirmationNumber}</Text>
                    <Text style={styles.bookingAmount}>${booking.totalAmount}</Text>
                  </View>
                  <Text style={styles.customerName}>
                    {booking.customerInfo.firstName} {booking.customerInfo.lastName}
                  </Text>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowUserTypeModal(true)}
          >
            <Settings size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              {currentUser.type === 'pro' && 'verified' in currentUser && currentUser.verified && (
                <Shield size={20} color={Colors.light.tint} />
              )}
            </View>
            
            <View style={styles.userTypeContainer}>
              <Text style={styles.userType}>
                {currentUser.type === 'pro' ? 'Pro User' : 'Regular User'}
              </Text>
              {currentUser.type === 'pro' && 'rating' in currentUser && (
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.rating}>{currentUser.rating}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/user-edit?mode=edit')}
          >
            <Edit3 size={20} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>

        {/* User Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.detailItem}>
            <Mail size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.detailText}>{currentUser.email}</Text>
          </View>

          <View style={styles.detailItem}>
            <Phone size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.detailText}>{currentUser.phone}</Text>
          </View>

          <View style={styles.detailItem}>
            <MapPin size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.detailText}>{currentUser.location}</Text>
          </View>

          <View style={styles.detailItem}>
            <Calendar size={20} color={Colors.light.tabIconDefault} />
            <Text style={styles.detailText}>
              Joined {formatDate(currentUser.joinedDate || new Date().toISOString())}
            </Text>
          </View>

          {currentUser.type === 'pro' && 'totalBoards' in currentUser && (
            <View style={styles.detailItem}>
              <User size={20} color={Colors.light.tabIconDefault} />
              <Text style={styles.detailText}>
                {currentUser.totalBoards} boards listed
              </Text>
            </View>
          )}
        </View>

        {/* Pro Dashboard Integration */}
        {currentUser.type === 'pro' && (
          <View style={styles.proDashboardCard}>
            <Text style={styles.sectionTitle}>Pro Dashboard</Text>
            
            {/* Pro Tab Navigation */}
            <View style={styles.proTabContainer}>
              <TouchableOpacity 
                style={[styles.proTab, activeProTab === 'dashboard' && styles.activeProTab]}
                onPress={() => setActiveProTab('dashboard')}
              >
                <BarChart3 size={16} color={activeProTab === 'dashboard' ? Colors.light.tint : '#666'} />
                <Text style={[styles.proTabText, activeProTab === 'dashboard' && styles.activeProTabText]}>Overview</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.proTab, activeProTab === 'add-board' && styles.activeProTab]}
                onPress={() => setActiveProTab('add-board')}
              >
                <Plus size={16} color={activeProTab === 'add-board' ? Colors.light.tint : '#666'} />
                <Text style={[styles.proTabText, activeProTab === 'add-board' && styles.activeProTabText]}>Add Board</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.proTab, activeProTab === 'my-boards' && styles.activeProTab]}
                onPress={() => setActiveProTab('my-boards')}
              >
                <Edit size={16} color={activeProTab === 'my-boards' ? Colors.light.tint : '#666'} />
                <Text style={[styles.proTabText, activeProTab === 'my-boards' && styles.activeProTabText]}>My Boards</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.proTab, activeProTab === 'bookings' && styles.activeProTab]}
                onPress={() => setActiveProTab('bookings')}
              >
                <Calendar size={16} color={activeProTab === 'bookings' ? Colors.light.tint : '#666'} />
                <Text style={[styles.proTabText, activeProTab === 'bookings' && styles.activeProTabText]}>Bookings</Text>
              </TouchableOpacity>
            </View>
            
            {/* Pro Dashboard Content */}
            <View style={styles.proDashboardContent}>
              {renderProDashboardContent()}
            </View>
          </View>
        )}

        {/* Admin Access */}
        <View style={styles.adminCard}>
          <Text style={styles.sectionTitle}>Admin Access</Text>
          
          <TouchableOpacity 
            style={styles.adminFeatureItem}
            onPress={() => router.push('/(tabs)/admin')}
          >
            <View style={styles.adminFeatureIcon}>
              <Shield size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.adminFeatureInfo}>
              <Text style={styles.adminFeatureTitle}>Admin Dashboard</Text>
              <Text style={styles.adminFeatureDescription}>
                View platform analytics, manage all bookings and users
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.adminFeatureItem}
            onPress={() => router.push('/user-edit?mode=create')}
          >
            <View style={styles.adminFeatureIcon}>
              <Plus size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.adminFeatureInfo}>
              <Text style={styles.adminFeatureTitle}>Create New User</Text>
              <Text style={styles.adminFeatureDescription}>
                Add a new user to the platform
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.light.tabIconDefault} />
          </TouchableOpacity>
          
          <View style={styles.adminFeatureStats}>
            <View style={styles.adminStatItem}>
              <Shield size={16} color="#FF6B35" />
              <Text style={styles.adminStatText}>Admin Access Enabled</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancel}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave}>
              <Check size={24} color={Colors.light.tint} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedUser?.name || ''}
                onChangeText={(text) => setEditedUser(prev => prev ? { ...prev, name: text } : null)}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editedUser?.email || ''}
                onChangeText={(text) => setEditedUser(prev => prev ? { ...prev, email: text } : null)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editedUser?.phone || ''}
                onChangeText={(text) => setEditedUser(prev => prev ? { ...prev, phone: text } : null)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={editedUser?.location || ''}
                onChangeText={(text) => setEditedUser(prev => prev ? { ...prev, location: text } : null)}
                placeholder="Enter your location"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* User Type Switch Modal */}
      <Modal
        visible={showUserTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUserTypeModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Switch User Type</Text>
            <View style={styles.spacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionDescription}>
              Switch between different user types for testing purposes
            </Text>

            <TouchableOpacity
              style={[
                styles.userTypeOption,
                currentUser.type === 'regular' && styles.selectedUserType
              ]}
              onPress={() => handleSwitchUserType('regular')}
            >
              <View style={styles.userTypeInfo}>
                <Text style={styles.userTypeTitle}>Regular User</Text>
                <Text style={styles.userTypeSubtitle}>Standard user account</Text>
              </View>
              {currentUser.type === 'regular' && (
                <Check size={20} color={Colors.light.tint} />
              )}
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Pro Users</Text>
            {proUsers.map((proUser) => (
              <TouchableOpacity
                key={proUser.id}
                style={[
                  styles.userTypeOption,
                  currentUser.type === 'pro' && currentUser.id === proUser.id && styles.selectedUserType
                ]}
                onPress={() => handleSwitchUserType('pro', proUser.id)}
              >
                <View style={styles.proUserOption}>
                  <Image source={{ uri: proUser.avatarUrl }} style={styles.proUserAvatar} />
                  <View style={styles.proUserInfo}>
                    <Text style={styles.userTypeTitle}>{proUser.name}</Text>
                    <Text style={styles.userTypeSubtitle}>
                      {proUser.location} • {proUser.totalBoards} boards
                    </Text>
                    <View style={styles.proUserRating}>
                      <Star size={14} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.proUserRatingText}>{proUser.rating}</Text>
                      {proUser.verified && (
                        <Shield size={14} color={Colors.light.tint} />
                      )}
                    </View>
                  </View>
                </View>
                {currentUser.type === 'pro' && currentUser.id === proUser.id && (
                  <Check size={20} color={Colors.light.tint} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
  },
  settingsButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginRight: 8,
  },
  userTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userType: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
  },
  detailsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 20,
    lineHeight: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  actionsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF3B30',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userTypeOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedUserType: {
    borderColor: Colors.light.tint,
    backgroundColor: '#f0f8ff',
  },
  userTypeInfo: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  userTypeSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  proUserOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  proUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  proUserInfo: {
    flex: 1,
  },
  proUserRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  proUserRatingText: {
    fontSize: 12,
    color: Colors.light.text,
    marginLeft: 4,
    marginRight: 8,
  },
  spacer: {
    width: 24,
  },
  proFeaturesCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    marginBottom: 16,
  },
  proFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  proFeatureInfo: {
    flex: 1,
  },
  proFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  proFeatureDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  proFeatureStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  proStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proStatText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFD700',
    marginLeft: 6,
  },
  proStatNumber: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
    marginRight: 4,
  },
  proStatLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  adminCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  adminFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  adminFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminFeatureInfo: {
    flex: 1,
  },
  adminFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  adminFeatureDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  adminFeatureStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  adminStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminStatText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF6B35',
    marginLeft: 6,
  },
  // Pro Dashboard Styles
  proDashboardCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  proTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  activeProTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  proTabText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  activeProTabText: {
    color: Colors.light.tint,
  },
  proDashboardContent: {
    minHeight: 200,
  },
  dashboardContent: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint + '10',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  addBoardContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    lineHeight: 20,
  },
  myBoardsContent: {
    gap: 12,
  },
  boardsCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyBoardsState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#495057',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  boardPreviewCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  boardPreviewImage: {
    width: 60,
    height: 80,
    borderRadius: 6,
  },
  boardPreviewInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  boardPreviewName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  boardPreviewType: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  boardPreviewPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#28a745',
  },
  bookingsContent: {
    gap: 12,
  },
  bookingsCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyBookingsState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  bookingPreviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  bookingPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmationNumber: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#28a745',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  addBoardForm: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: Colors.light.text,
  },
  dropdown: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  imageUploadButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed' as const,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  submitBoardButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitBoardButtonDisabled: {
    opacity: 0.6,
  },
  submitBoardButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
});