import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { X, Save } from 'lucide-react-native';
import { boardQueries } from '@/lib/queries';
import { useBoardsBackend } from '@/src/context/boards-backend';
import { useBoards } from '@/src/context/boards';
import Colors from '@/constants/colors';

export default function BoardEditScreen() {
  const insets = useSafeAreaInsets();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const { getBoardById: getBackendBoard } = useBoardsBackend();
  const { getBoardById: getLocalBoard } = useBoards();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [board, setBoard] = useState<any>(null);
  
  const [shortName, setShortName] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [lengthIn, setLengthIn] = useState('');
  const [widthIn, setWidthIn] = useState('');
  const [thicknessIn, setThicknessIn] = useState('');
  const [volumeL, setVolumeL] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerWeek, setPricePerWeek] = useState('');
  const [location, setLocation] = useState('');
  const [pickupSpot, setPickupSpot] = useState('');
  
  useEffect(() => {
    if (!boardId) {
      setLoading(false);
      return;
    }
    
    (async () => {
      try {
        console.log('Fetching board for edit:', boardId);
        
        let data = getBackendBoard(boardId);
        
        if (!data) {
          data = getLocalBoard(boardId);
        }
        
        if (!data) {
          data = await boardQueries.getById(boardId);
        }
        
        console.log('Board data for edit:', data);
        setBoard(data);
        
        if (data) {
          setShortName(data.short_name || '');
          setDimensions(data.dimensions_detail || '');
          setLengthIn((data as any).length_in?.toString() || '');
          setWidthIn((data as any).width_in?.toString() || '');
          setThicknessIn((data as any).thickness_in?.toString() || '');
          setVolumeL((data as any).volume_l?.toString() || data.volume_l?.toString() || '');
          setPricePerDay((data as any).price_per_day?.toString() || (data as any).pricePerDay?.toString() || '');
          setPricePerWeek((data as any).price_per_week?.toString() || '');
          setLocation((data as any).location || (data as any).location_city || '');
          setPickupSpot((data as any).pickup_spot || '');
        }
      } catch (error) {
        console.error('Failed to fetch board:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [boardId, getBackendBoard, getLocalBoard]);
  
  const handleSave = async () => {
    if (!board) return;
    
    if (!shortName.trim()) {
      Alert.alert('Validation Error', 'Short name is required');
      return;
    }
    
    setSaving(true);
    try {
      const updates = {
        short_name: shortName.trim(),
        dimensions_detail: dimensions.trim(),
        length_in: lengthIn ? parseFloat(lengthIn) : null,
        width_in: widthIn ? parseFloat(widthIn) : null,
        thickness_in: thicknessIn ? parseFloat(thicknessIn) : null,
        volume_l: volumeL ? parseFloat(volumeL) : null,
        price_per_day: pricePerDay ? parseFloat(pricePerDay) : null,
        price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : null,
        location: location.trim(),
        pickup_spot: pickupSpot.trim(),
      };
      
      console.log('Updating board:', boardId, updates);
      await boardQueries.update(boardId, updates);
      
      Alert.alert('Success', 'Board updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to update board:', error);
      Alert.alert('Error', 'Failed to update board. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Board</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading board...</Text>
        </View>
      </View>
    );
  }
  
  if (!board) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Board</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Board not found</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Board</Text>
        <Pressable 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={18} color="white" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </Pressable>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Short Name *</Text>
              <TextInput
                style={styles.input}
                value={shortName}
                onChangeText={setShortName}
                placeholder="e.g., Blue Cruiser"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Dimensions Detail</Text>
              <TextInput
                style={styles.input}
                value={dimensions}
                onChangeText={setDimensions}
                placeholder="e.g., 9'2'' x 23'' x 3''"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Length (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={lengthIn}
                  onChangeText={setLengthIn}
                  placeholder="110"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Width (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={widthIn}
                  onChangeText={setWidthIn}
                  placeholder="23"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Thickness (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={thicknessIn}
                  onChangeText={setThicknessIn}
                  placeholder="3"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Volume (liters)</Text>
                <TextInput
                  style={styles.input}
                  value={volumeL}
                  onChangeText={setVolumeL}
                  placeholder="75"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Price Per Day ($)</Text>
                <TextInput
                  style={styles.input}
                  value={pricePerDay}
                  onChangeText={setPricePerDay}
                  placeholder="25"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Price Per Week ($)</Text>
                <TextInput
                  style={styles.input}
                  value={pricePerWeek}
                  onChangeText={setPricePerWeek}
                  placeholder="150"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Waikiki"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Pickup Spot</Text>
              <TextInput
                style={styles.input}
                value={pickupSpot}
                onChangeText={setPickupSpot}
                placeholder="e.g., Waikiki Beach Parking"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.bottomPadding} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 80,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bottomPadding: {
    height: 40,
  },
});
