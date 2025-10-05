import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  Users,
  Search,
  Crown,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Plus,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

type UserType = 'all' | 'regular' | 'pro';

export default function UserStatsScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<UserType>('all');
  // Get all regular users
  const regularUsersQuery = trpc.users.getAllRegular.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get all pro users
  const proUsersQuery = trpc.admin.getProUsers.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get user stats
  const userStatsQuery = trpc.users.getStats.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    try {
      await Promise.all([
        regularUsersQuery.refetch(),
        proUsersQuery.refetch(),
        userStatsQuery.refetch(),
      ]);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Combine and filter users
  const allUsers = useMemo(() => {
    const regular = regularUsersQuery.data || [];
    const pro = proUsersQuery.data || [];
    
    const combinedUsers = [
      ...regular.map(user => ({ ...user, userType: 'regular' as const })),
      ...pro.map(user => ({ ...user, userType: 'pro' as const })),
    ];

    return combinedUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.location && user.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [regularUsersQuery.data, proUsersQuery.data, searchQuery, userTypeFilter]);

  const stats = userStatsQuery.data;
  const isLoading = regularUsersQuery.isLoading || proUsersQuery.isLoading || userStatsQuery.isLoading;
  const hasError = regularUsersQuery.error || proUsersQuery.error || userStatsQuery.error;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUserIcon = (userType: 'regular' | 'pro') => {
    return userType === 'pro' ? (
      <Crown size={16} color="#FFD700" />
    ) : (
      <User size={16} color="#6c757d" />
    );
  };

  const getUserTypeColor = (userType: 'regular' | 'pro') => {
    return userType === 'pro' ? '#FFD700' : '#6c757d';
  };

  if (hasError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.tint} />
          </Pressable>
          <Text style={styles.title}>User Statistics</Text>
        </View>
        <View style={styles.errorContainer}>
          <UserX size={48} color="#dc3545" />
          <Text style={styles.errorText}>Failed to load user data</Text>
          <Text style={styles.errorSubtext}>
            {regularUsersQuery.error?.message || proUsersQuery.error?.message || userStatsQuery.error?.message}
          </Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.tint} />
        </Pressable>
        <Text style={styles.title}>User Statistics</Text>
        <Pressable 
          style={styles.createButton} 
          onPress={() => router.push('/user-edit?mode=create')}
        >
          <Plus size={20} color="white" />
          <Text style={styles.createButtonText}>Create User</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Users size={24} color={Colors.light.tint} />
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <User size={24} color="#6c757d" />
              <Text style={styles.statValue}>{stats.totalRegularUsers}</Text>
              <Text style={styles.statLabel}>Regular Users</Text>
            </View>
            <View style={styles.statCard}>
              <Crown size={24} color="#FFD700" />
              <Text style={styles.statValue}>{stats.totalProUsers}</Text>
              <Text style={styles.statLabel}>Pro Users</Text>
            </View>
          </View>
        )}

        {/* New Users This Month */}
        {stats?.newUsersThisMonth && (
          <View style={styles.newUsersContainer}>
            <Text style={styles.sectionTitle}>New Users This Month</Text>
            <View style={styles.newUsersStats}>
              <View style={styles.newUserStat}>
                <UserCheck size={20} color="#28a745" />
                <Text style={styles.newUserValue}>{stats.newUsersThisMonth.regular}</Text>
                <Text style={styles.newUserLabel}>Regular</Text>
              </View>
              <View style={styles.newUserStat}>
                <Crown size={20} color="#FFD700" />
                <Text style={styles.newUserValue}>{stats.newUsersThisMonth.pro}</Text>
                <Text style={styles.newUserLabel}>Pro</Text>
              </View>
            </View>
          </View>
        )}

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color="#6c757d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, phone, or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6c757d"
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'regular', 'pro'] as const).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.filterButton,
                  userTypeFilter === type && styles.filterButtonActive
                ]}
                onPress={() => setUserTypeFilter(type)}
              >
                <Text style={[
                  styles.filterButtonText,
                  userTypeFilter === type && styles.filterButtonTextActive
                ]}>
                  {type === 'all' ? 'All Users' : type === 'regular' ? 'Regular' : 'Pro'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Users List */}
        <View style={styles.usersContainer}>
          <Text style={styles.sectionTitle}>
            Users ({allUsers.length})
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : allUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#6c757d" />
              <Text style={styles.emptyStateText}>No users found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || userTypeFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'No users have been registered yet'
                }
              </Text>
            </View>
          ) : (
            allUsers.map((user) => (
              <View key={`${user.userType}-${user.id}`} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      {getUserIcon(user.userType)}
                      <Text style={styles.userName}>{user.name}</Text>
                      <View style={[
                        styles.userTypeBadge, 
                        { backgroundColor: getUserTypeColor(user.userType) + '20' }
                      ]}>
                        <Text style={[
                          styles.userTypeBadgeText, 
                          { color: getUserTypeColor(user.userType) }
                        ]}>
                          {user.userType.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.userDetails}>
                      <View style={styles.userDetailRow}>
                        <Mail size={14} color="#6c757d" />
                        <Text style={styles.userDetailText}>{user.email}</Text>
                      </View>
                      {user.phone && (
                        <View style={styles.userDetailRow}>
                          <Phone size={14} color="#6c757d" />
                          <Text style={styles.userDetailText}>{user.phone}</Text>
                        </View>
                      )}
                      {user.location && (
                        <View style={styles.userDetailRow}>
                          <MapPin size={14} color="#6c757d" />
                          <Text style={styles.userDetailText}>{user.location}</Text>
                        </View>
                      )}
                      {user.joinedDate && (
                        <View style={styles.userDetailRow}>
                          <Calendar size={14} color="#6c757d" />
                          <Text style={styles.userDetailText}>
                            Joined {formatDate(user.joinedDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#212529',
    flex: 1,
    marginLeft: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  newUsersContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'white',
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
  newUsersStats: {
    flexDirection: 'row',
    gap: 24,
  },
  newUserStat: {
    alignItems: 'center',
    flex: 1,
  },
  newUserValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginTop: 4,
  },
  newUserLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  usersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#212529',
    flex: 1,
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  userTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  userDetails: {
    gap: 4,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userDetailText: {
    fontSize: 14,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#dc3545',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});