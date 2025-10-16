import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Calendar,
  CheckSquare,
  Square,
  Users,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { useBoards } from '@/src/context/boards';
import { Board, ProUser } from '@/src/types/board';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';

interface RegionData {
  name: string;
  boardCount: number;
  totalRevenue: number;
  activeListings: number;
}



const REGIONS = [
  'All Regions',
  'San Diego',
  'Santa Cruz', 
  'Bali',
  'Gold Coast',
  'Honolulu',
  'Kona',
  'Hossegor',
  'Ericeira',
  'Taghazout',
  'Chiba',
  'Lisbon',
  'Puerto Escondido'
];

export default function BulkManagementScreen() {
  const { boards } = useBoards();
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState<'none' | 'price' | 'availability' | 'assign'>('none');
  const [bulkPrice, setBulkPrice] = useState('');
  const [selectedProUser, setSelectedProUser] = useState<string>('');

  const proUsersQuery = trpc.admin.getProUsers.useQuery();
  const proUsers = proUsersQuery.data || [];

  // Filter boards by region and search
  const filteredBoards = useMemo(() => {
    let filtered = boards;
    
    if (selectedRegion !== 'All Regions') {
      filtered = filtered.filter(board => board.location === selectedRegion);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(board => 
        board.short_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [boards, selectedRegion, searchQuery]);

  // Calculate region statistics
  const regionStats = useMemo(() => {
    const stats: RegionData[] = [];
    
    REGIONS.slice(1).forEach(region => {
      const regionBoards = boards.filter(board => board.location === region);
      const activeListings = regionBoards.filter(board => {
        const today = new Date().toISOString().split('T')[0];
        return board.available_start <= today && board.available_end >= today;
      }).length;
      
      const totalRevenue = regionBoards.reduce((sum, board) => {
        return sum + (board.price_per_day || 0) * 30; // Estimate monthly revenue
      }, 0);
      
      if (regionBoards.length > 0) {
        stats.push({
          name: region,
          boardCount: regionBoards.length,
          totalRevenue,
          activeListings
        });
      }
    });
    
    return stats.sort((a, b) => b.boardCount - a.boardCount);
  }, [boards]);

  const toggleBoardSelection = (boardId: string) => {
    const newSelection = new Set(selectedBoards);
    if (newSelection.has(boardId)) {
      newSelection.delete(boardId);
    } else {
      newSelection.add(boardId);
    }
    setSelectedBoards(newSelection);
  };

  const selectAllBoards = () => {
    if (selectedBoards.size === filteredBoards.length) {
      setSelectedBoards(new Set());
    } else {
      setSelectedBoards(new Set(filteredBoards.map(board => board.id)));
    }
  };

  const handleBulkAction = () => {
    if (selectedBoards.size === 0) {
      Alert.alert('No Selection', 'Please select boards to perform bulk actions.');
      return;
    }

    switch (bulkAction) {
      case 'price':
        if (!bulkPrice) {
          Alert.alert('Missing Price', 'Please enter a price for bulk update.');
          return;
        }
        Alert.alert(
          'Update Prices',
          `Update ${selectedBoards.size} boards to $${bulkPrice}/day?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Update', onPress: () => {
              // Here you would implement the actual bulk price update
              Alert.alert('Success', `Updated prices for ${selectedBoards.size} boards`);
              setSelectedBoards(new Set());
              setBulkAction('none');
              setBulkPrice('');
            }}
          ]
        );
        break;
      
      case 'assign':
        if (!selectedProUser) {
          Alert.alert('No User Selected', 'Please select a pro user to assign boards to.');
          return;
        }
        const proUser = proUsers.find(user => user.id === selectedProUser);
        Alert.alert(
          'Assign Boards',
          `Assign ${selectedBoards.size} boards to ${proUser?.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Assign', onPress: () => {
              Alert.alert('Success', `Assigned ${selectedBoards.size} boards to ${proUser?.name}`);
              setSelectedBoards(new Set());
              setBulkAction('none');
              setSelectedProUser('');
            }}
          ]
        );
        break;
        
      case 'availability':
        Alert.alert(
          'Update Availability',
          `Toggle availability for ${selectedBoards.size} boards?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Update', onPress: () => {
              Alert.alert('Success', `Updated availability for ${selectedBoards.size} boards`);
              setSelectedBoards(new Set());
              setBulkAction('none');
            }}
          ]
        );
        break;
    }
  };

  const renderBoardItem = ({ item: board }: { item: Board }) => {
    const isSelected = selectedBoards.has(board.id);
    const isUserBoard = board.id.startsWith('user-');
    
    return (
      <TouchableOpacity 
        style={[styles.boardItem, isSelected && styles.boardItemSelected]}
        onPress={() => toggleBoardSelection(board.id)}
      >
        <View style={styles.boardHeader}>
          <View style={styles.boardInfo}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => toggleBoardSelection(board.id)}
            >
              {isSelected ? (
                <CheckSquare size={20} color={Colors.light.tint} />
              ) : (
                <Square size={20} color="#666" />
              )}
            </TouchableOpacity>
            
            <View style={styles.boardDetails}>
              <Text style={styles.boardName}>{board.short_name}</Text>
              <View style={styles.boardMeta}>
                <MapPin size={14} color="#666" />
                <Text style={styles.boardLocation}>{board.location}</Text>
                <Text style={styles.boardType}>• {board.type}</Text>
                {isUserBoard && <Text style={styles.userBadge}>• Your Board</Text>}
              </View>
            </View>
          </View>
          
          <View style={styles.boardActions}>
            <View style={styles.priceContainer}>
              <DollarSign size={16} color={Colors.light.tint} />
              <Text style={styles.price}>{board.price_per_day}/day</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                router.push({
                  pathname: '/board-preview',
                  params: { boardId: board.id }
                });
              }}
            >
              <Eye size={16} color="#666" />
            </TouchableOpacity>
            
            {isUserBoard && (
              <TouchableOpacity style={styles.actionButton}>
                <Edit3 size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.boardStats}>
          <View style={styles.stat}>
            <Calendar size={14} color="#666" />
            <Text style={styles.statText}>Available until {new Date(board.available_end).toLocaleDateString()}</Text>
          </View>
          
          <View style={styles.stat}>
            <TrendingUp size={14} color="#666" />
            <Text style={styles.statText}>Est. $450/month</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRegionCard = ({ item: region }: { item: RegionData }) => (
    <TouchableOpacity 
      style={styles.regionCard}
      onPress={() => setSelectedRegion(region.name)}
    >
      <View style={styles.regionHeader}>
        <Text style={styles.regionName}>{region.name}</Text>
        <Text style={styles.regionRevenue}>${region.totalRevenue.toLocaleString()}</Text>
      </View>
      
      <View style={styles.regionStats}>
        <View style={styles.regionStat}>
          <Text style={styles.regionStatNumber}>{region.boardCount}</Text>
          <Text style={styles.regionStatLabel}>Total Boards</Text>
        </View>
        
        <View style={styles.regionStat}>
          <Text style={styles.regionStatNumber}>{region.activeListings}</Text>
          <Text style={styles.regionStatLabel}>Active</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProUserCard = ({ item: user }: { item: ProUser }) => {
    const userBoards = boards.filter(b => b.owner?.id === user.id);
    const estimatedRevenue = userBoards.reduce((sum, b) => sum + (b.price_per_day || 0) * 30, 0);
    
    return (
      <TouchableOpacity 
        style={[styles.proUserCard, selectedProUser === user.id && styles.proUserCardSelected]}
        onPress={() => setSelectedProUser(selectedProUser === user.id ? '' : user.id)}
      >
        <View style={styles.proUserHeader}>
          <View>
            <Text style={styles.proUserName}>{user.name}</Text>
            <Text style={styles.proUserEmail}>{user.email}</Text>
          </View>
          
          <View style={styles.proUserStats}>
            <Text style={styles.proUserRevenue}>${estimatedRevenue.toLocaleString()}</Text>
            <Text style={styles.proUserBoards}>{userBoards.length} boards</Text>
          </View>
        </View>
        
        <View style={styles.proUserMeta}>
          <MapPin size={14} color="#666" />
          <Text style={styles.proUserRegion}>{user.location}</Text>
          {user.joined_date && (
            <Text style={styles.proUserJoinDate}>• Joined {new Date(user.joined_date).toLocaleDateString()}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Section - 50% of screen */}
      <View style={styles.topSection}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Bulk Management</Text>
            <Text style={styles.subtitle}>Manage boards across regions efficiently</Text>
          </View>

          {/* Region Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Regional Overview</Text>
            <FlatList
              data={regionStats}
              renderItem={renderRegionCard}
              keyExtractor={(item) => item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionList}
            />
          </View>

          {/* Search and Filters */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInput}>
                <Search size={20} color="#666" />
                <TextInput
                  style={styles.searchText}
                  placeholder="Search boards..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} color={showFilters ? Colors.light.tint : '#666'} />
              </TouchableOpacity>
            </View>

            {showFilters && (
              <View style={styles.filtersContainer}>
                <Text style={styles.filterLabel}>Region:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.regionFilters}>
                    {REGIONS.map((region) => (
                      <TouchableOpacity
                        key={region}
                        style={[
                          styles.regionFilter,
                          selectedRegion === region && styles.regionFilterActive
                        ]}
                        onPress={() => setSelectedRegion(region)}
                      >
                        <Text style={[
                          styles.regionFilterText,
                          selectedRegion === region && styles.regionFilterTextActive
                        ]}>
                          {region}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Bulk Actions */}
          {selectedBoards.size > 0 && (
            <View style={styles.bulkActionsContainer}>
              <View style={styles.bulkActionsHeader}>
                <Text style={styles.bulkActionsTitle}>
                  {selectedBoards.size} board{selectedBoards.size !== 1 ? 's' : ''} selected
                </Text>
                
                <TouchableOpacity 
                  style={styles.selectAllButton}
                  onPress={selectAllBoards}
                >
                  <Text style={styles.selectAllText}>
                    {selectedBoards.size === filteredBoards.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.bulkActions}>
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkAction === 'price' && styles.bulkActionButtonActive]}
                    onPress={() => setBulkAction(bulkAction === 'price' ? 'none' : 'price')}
                  >
                    <DollarSign size={16} color={bulkAction === 'price' ? 'white' : Colors.light.tint} />
                    <Text style={[styles.bulkActionText, bulkAction === 'price' && styles.bulkActionTextActive]}>Update Price</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkAction === 'availability' && styles.bulkActionButtonActive]}
                    onPress={() => setBulkAction(bulkAction === 'availability' ? 'none' : 'availability')}
                  >
                    <Calendar size={16} color={bulkAction === 'availability' ? 'white' : Colors.light.tint} />
                    <Text style={[styles.bulkActionText, bulkAction === 'availability' && styles.bulkActionTextActive]}>Availability</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.bulkActionButton, bulkAction === 'assign' && styles.bulkActionButtonActive]}
                    onPress={() => setBulkAction(bulkAction === 'assign' ? 'none' : 'assign')}
                  >
                    <Users size={16} color={bulkAction === 'assign' ? 'white' : Colors.light.tint} />
                    <Text style={[styles.bulkActionText, bulkAction === 'assign' && styles.bulkActionTextActive]}>Assign to Pro</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              {bulkAction === 'price' && (
                <View style={styles.bulkActionInput}>
                  <Text style={styles.inputLabel}>New daily price:</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={16} color="#666" />
                    <TextInput
                      style={styles.priceInput}
                      value={bulkPrice}
                      onChangeText={setBulkPrice}
                      placeholder="35"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <TouchableOpacity style={styles.applyButton} onPress={handleBulkAction}>
                    <Text style={styles.applyButtonText}>Apply to {selectedBoards.size} boards</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {bulkAction === 'assign' && (
                <View style={styles.bulkActionInput}>
                  <Text style={styles.inputLabel}>Select Pro User:</Text>
                  {proUsersQuery.isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={Colors.light.tint} />
                      <Text style={styles.loadingText}>Loading pro users...</Text>
                    </View>
                  ) : proUsers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No pro users found in database</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={proUsers}
                      renderItem={renderProUserCard}
                      keyExtractor={(item) => item.id}
                      style={styles.proUsersList}
                    />
                  )}
                  {selectedProUser && (
                    <TouchableOpacity style={styles.applyButton} onPress={handleBulkAction}>
                      <Text style={styles.applyButtonText}>Assign to {proUsers.find(u => u.id === selectedProUser)?.name}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {bulkAction === 'availability' && (
                <View style={styles.bulkActionInput}>
                  <TouchableOpacity style={styles.applyButton} onPress={handleBulkAction}>
                    <Text style={styles.applyButtonText}>Toggle availability for {selectedBoards.size} boards</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Boards List Section - 50% of screen */}
      <View style={styles.boardsSection}>
        <View style={styles.boardsHeader}>
          <Text style={styles.boardsTitle}>
            {filteredBoards.length} board{filteredBoards.length !== 1 ? 's' : ''}
            {selectedRegion !== 'All Regions' && ` in ${selectedRegion}`}
          </Text>
        </View>
        
        <FlatList
          data={filteredBoards}
          renderItem={renderBoardItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.boardsList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topSection: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  regionList: {
    paddingRight: 20,
  },
  regionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 160,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  regionRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  regionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  regionStat: {
    alignItems: 'center',
  },
  regionStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  regionStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  regionFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  regionFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  regionFilterActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  regionFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  regionFilterTextActive: {
    color: 'white',
  },
  bulkActionsContainer: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  bulkActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bulkActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  selectAllText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: Colors.light.tint,
    gap: 8,
  },
  bulkActionButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  bulkActionText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  bulkActionTextActive: {
    color: 'white',
  },
  bulkActionInput: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    marginLeft: 8,
  },
  applyButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  proUsersList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  proUserCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  proUserCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#f0f8ff',
  },
  proUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  proUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  proUserEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  proUserStats: {
    alignItems: 'flex-end',
  },
  proUserRevenue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  proUserBoards: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  proUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proUserRegion: {
    fontSize: 12,
    color: '#666',
  },
  proUserJoinDate: {
    fontSize: 12,
    color: '#666',
  },
  boardsSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderTopColor: '#e1e5e9',
  },
  boardsHeader: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  boardsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  boardsList: {
    padding: 20,
  },
  boardItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  boardItemSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#f0f8ff',
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  boardInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    marginTop: 2,
  },
  boardDetails: {
    flex: 1,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  boardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boardLocation: {
    fontSize: 14,
    color: '#666',
  },
  boardType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  userBadge: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  boardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  boardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});