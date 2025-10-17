import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Camera, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { BoardType } from '@/src/types/board';
import Colors from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { uploadBoardImage } from '@/lib/upload';

const BOARD_TYPES = [
  { value: 'soft-top' as BoardType, label: 'Soft-top' },
  { value: 'shortboard' as BoardType, label: 'Shortboard' },
  { value: 'fish' as BoardType, label: 'Fish' },
  { value: 'longboard' as BoardType, label: 'Longboard' },
  { value: 'sup' as BoardType, label: 'SUP' },
];

export default function BoardEditScreen() {
  const insets = useSafeAreaInsets();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<BoardType>('shortboard');
  const [dimensions, setDimensions] = useState('');
  const [lengthIn, setLengthIn] = useState('');
  const [widthIn, setWidthIn] = useState('');
  const [thicknessIn, setThicknessIn] = useState('');
  const [volumeL, setVolumeL] = useState('');
  const [finSetup, setFinSetup] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [rentPricePerDay, setRentPricePerDay] = useState('');
  const [rentPricePerWeek, setRentPricePerWeek] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUri, setLocalImageUri] = useState('');
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    if (!boardId) {
      setLoading(false);
      return;
    }
    
    const fetchBoard = async () => {
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('*')
          .eq('id', boardId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setName(data.short_name || '');
          setType(data.board_type || 'shortboard');
          setDimensions(data.dimensions_detail || '');
          setVolumeL(data.volume_l?.toString() || '');
          setLocation(data.location || '');
          setSalePrice(data.price_sale?.toString() || '');
          setRentPricePerDay(data.price_per_day?.toString() || '');
          setRentPricePerWeek(data.price_per_week?.toString() || '');
          setImageUrl(data.image_url || '');
          setNotes(data.notes || '');
          
          try {
            const notesData = data.notes ? JSON.parse(data.notes) : {};
            setLengthIn(notesData.length_in?.toString() || '');
            setWidthIn(notesData.width_in?.toString() || '');
            setThicknessIn(notesData.thickness_in?.toString() || '');
            setFinSetup(notesData.fin_setup || '');
            setCondition(notesData.condition || '');
          } catch (e) {
            console.log('Notes not in JSON format, skipping parse');
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch board:', error);
        Alert.alert('Error', 'Failed to load board data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoard();
  }, [boardId]);
  
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload board images.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setLocalImageUri(uri);
        
        await analyzeImageWithAI(uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const analyzeImageWithAI = async (uri: string) => {
    setAnalyzingImage(true);
    
    try {
      let base64Image: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        base64Image = await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        base64Image = await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      console.log('Sending AI analysis request...');
      console.log('Image base64 length:', base64Image?.length || 0);
      
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this surfboard image comprehensively and extract all visible information to auto-fill a rental listing form. Extract and format the following (if visible):

1. Board Name/Brand (e.g., "Channel Islands Rocket", "Lost Puddle Jumper", or generic like "Blue Shortboard")
2. Board Type (one of: soft-top, shortboard, fish, longboard, sup)
3. Dimensions in format "L x W x T" (e.g., "6'2 x 19.5 x 2.5")
4. Length in inches (numeric only)
5. Width in inches (numeric only)
6. Thickness in inches (numeric only)
7. Volume in liters if visible (numeric only)
8. Fin setup (e.g., "Thruster", "Quad", "Single")
9. Condition (e.g., "Excellent", "Good", "Fair")

Format your response as:
NAME: [board name]
TYPE: [board type]
DIMENSIONS: [dimensions]
LENGTH: [length in inches]
WIDTH: [width in inches]
THICKNESS: [thickness in inches]
VOLUME: [volume in liters]
FIN_SETUP: [fin setup]
CONDITION: [condition]

If any field is not visible or unclear, write "NOT_VISIBLE" for that field.`,
              },
              {
                type: 'image',
                image: base64Image,
              },
            ],
          },
        ],
      };
      
      console.log('Request body prepared');
      
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('AI Response status:', aiResponse.status);
      
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error response:', errorText);
        throw new Error(`AI API responded with status ${aiResponse.status}: ${errorText}`);
      }
      
      const result = await aiResponse.json();
      const completion = result.completion;
      
      console.log('AI Analysis Result:', completion);
      
      const nameMatch = completion.match(/NAME:\s*(.+?)(?=\n|$)/i);
      const typeMatch = completion.match(/TYPE:\s*(.+?)(?=\n|$)/i);
      const dimensionsMatch = completion.match(/DIMENSIONS:\s*(.+?)(?=\n|$)/i);
      const lengthMatch = completion.match(/LENGTH:\s*([0-9.]+)/i);
      const widthMatch = completion.match(/WIDTH:\s*([0-9.]+)/i);
      const thicknessMatch = completion.match(/THICKNESS:\s*([0-9.]+)/i);
      const volumeMatch = completion.match(/VOLUME:\s*([0-9.]+)/i);
      const finSetupMatch = completion.match(/FIN_SETUP:\s*(.+?)(?=\n|$)/i);
      const conditionMatch = completion.match(/CONDITION:\s*(.+?)(?=\n|$)/i);
      
      let fieldsUpdated = 0;
      
      if (nameMatch && nameMatch[1].trim() !== 'NOT_VISIBLE') {
        setName(nameMatch[1].trim());
        fieldsUpdated++;
      }
      
      if (typeMatch && typeMatch[1].trim() !== 'NOT_VISIBLE') {
        const typeValue = typeMatch[1].trim().toLowerCase();
        const matchedType = BOARD_TYPES.find(t => 
          typeValue.includes(t.value) || typeValue.includes(t.value.replace('-', ''))
        );
        if (matchedType) {
          setType(matchedType.value);
          fieldsUpdated++;
        }
      }
      
      if (dimensionsMatch && dimensionsMatch[1].trim() !== 'NOT_VISIBLE') {
        setDimensions(dimensionsMatch[1].trim());
        fieldsUpdated++;
      }
      
      if (lengthMatch) {
        setLengthIn(lengthMatch[1]);
        fieldsUpdated++;
      }
      
      if (widthMatch) {
        setWidthIn(widthMatch[1]);
        fieldsUpdated++;
      }
      
      if (thicknessMatch) {
        setThicknessIn(thicknessMatch[1]);
        fieldsUpdated++;
      }
      
      if (volumeMatch) {
        setVolumeL(volumeMatch[1]);
        fieldsUpdated++;
      }
      
      if (finSetupMatch && finSetupMatch[1].trim() !== 'NOT_VISIBLE') {
        setFinSetup(finSetupMatch[1].trim());
        fieldsUpdated++;
      }
      
      if (conditionMatch && conditionMatch[1].trim() !== 'NOT_VISIBLE') {
        setCondition(conditionMatch[1].trim());
        fieldsUpdated++;
      }
      
      if (fieldsUpdated > 0) {
        Alert.alert(
          'AI Auto-fill Complete! 🤖',
          `Successfully extracted and filled ${fieldsUpdated} field${fieldsUpdated !== 1 ? 's' : ''} from the photo. Review and adjust as needed.`
        );
      } else {
        Alert.alert(
          'Photo Uploaded',
          'Could not extract information from this photo automatically. Please fill in the fields manually.'
        );
      }
    } catch (error: any) {
      console.error('AI analysis error:', error);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'The photo was uploaded but automatic analysis is unavailable. Please fill in the fields manually.';
      
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network error: Unable to connect to AI service. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert(
        'AI analysis failed',
        errorMessage
      );
    } finally {
      setAnalyzingImage(false);
    }
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Board name is required');
      return;
    }
    
    setSaving(true);
    
    try {
      let uploadedImageUrl = imageUrl;
      
      if (localImageUri && boardId) {
        console.log('[handleSave] Uploading new image to Supabase Storage...');
        console.log('[handleSave] Local image URI:', localImageUri);
        
        try {
          let ext = 'jpg';
          const uriLower = localImageUri.toLowerCase();
          
          if (uriLower.includes('.png')) {
            ext = 'png';
          } else if (uriLower.includes('.jpeg') || uriLower.includes('.jpg')) {
            ext = 'jpg';
          } else if (uriLower.includes('.webp')) {
            ext = 'webp';
          }
          
          console.log('[handleSave] Detected extension:', ext);
          
          const { publicUrl } = await uploadBoardImage(
            boardId,
            { uri: localImageUri },
            ext
          );
          
          uploadedImageUrl = publicUrl;
          console.log('[handleSave] Image uploaded successfully:', publicUrl);
        } catch (uploadError: any) {
          console.error('[handleSave] Image upload failed:', uploadError);
          console.error('[handleSave] Error details:', JSON.stringify(uploadError, null, 2));
          
          Alert.alert(
            'Image Upload Failed',
            `Failed to upload image: ${uploadError.message || 'Unknown error'}. Continue saving without new image?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => { setSaving(false); } },
              { text: 'Continue', onPress: () => {} }
            ]
          );
          return;
        }
      }
      
      const notesData: any = {};
      
      if (lengthIn) notesData.length_in = parseFloat(lengthIn);
      if (widthIn) notesData.width_in = parseFloat(widthIn);
      if (thicknessIn) notesData.thickness_in = parseFloat(thicknessIn);
      if (finSetup.trim()) notesData.fin_setup = finSetup.trim();
      if (condition.trim()) notesData.condition = condition.trim();
      
      const updateData: any = {
        short_name: name.trim(),
        board_type: type,
        dimensions_detail: dimensions.trim() || null,
        volume_l: volumeL ? parseFloat(volumeL) : null,
        location: location.trim() || null,
        price_sale: salePrice ? parseFloat(salePrice) : null,
        price_per_day: rentPricePerDay ? parseFloat(rentPricePerDay) : null,
        price_per_week: rentPricePerWeek ? parseFloat(rentPricePerWeek) : null,
        image_url: uploadedImageUrl || null,
        notes: Object.keys(notesData).length > 0 ? JSON.stringify(notesData) : null,
      };
      
      console.log('Updating board with data:', updateData);
      console.log('Notes data (fields without columns):', notesData);
      
      const { data, error } = await supabase
        .from('boards')
        .update(updateData)
        .eq('id', boardId)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to update board');
      }
      
      console.log('Board updated successfully:', data);
      
      Alert.alert('Success', 'Board updated successfully', [
        { text: 'OK', onPress: () => router.push({ pathname: '/board-preview', params: { boardId: boardId } }) }
      ]);
    } catch (error: any) {
      console.error('Failed to update board:', error);
      Alert.alert('Error', `Failed to update board: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Board</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading board data...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
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
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Image Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Board Image</Text>
            <Pressable 
              style={styles.imagePickerButton} 
              onPress={handlePickImage}
              disabled={analyzingImage}
            >
              {localImageUri || imageUrl ? (
                <Image
                  source={{ uri: localImageUri || imageUrl }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Camera size={40} color="#999" />
                  <Text style={styles.imagePickerText}>Tap to upload photo</Text>
                </View>
              )}
            </Pressable>
            {analyzingImage && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="small" color={Colors.light.tint} />
                <Text style={styles.analyzingText}>Analyzing image with AI...</Text>
              </View>
            )}
            <Pressable 
              style={styles.aiButton} 
              onPress={handlePickImage}
              disabled={analyzingImage}
            >
              <Sparkles size={16} color="white" />
              <Text style={styles.aiButtonText}>
                {analyzingImage ? 'Analyzing...' : 'Upload & Auto-fill with AI'}
              </Text>
            </Pressable>
          </View>
          
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Text style={styles.label}>Board Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Channel Islands Rocket"
            />
            
            <Text style={styles.label}>Board Type</Text>
            <View style={styles.typeSelector}>
              {BOARD_TYPES.map((boardType) => (
                <Pressable
                  key={boardType.value}
                  style={[
                    styles.typeButton,
                    type === boardType.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setType(boardType.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === boardType.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {boardType.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          {/* Dimensions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dimensions</Text>
            
            <Text style={styles.label}>Dimensions (optional)</Text>
            <TextInput
              style={styles.input}
              value={dimensions}
              onChangeText={setDimensions}
              placeholder="e.g., 6'2 x 19.5 x 2.5"
            />
            
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Length (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={lengthIn}
                  onChangeText={setLengthIn}
                  placeholder="74"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.flex1}>
                <Text style={styles.label}>Width (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={widthIn}
                  onChangeText={setWidthIn}
                  placeholder="19.5"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Thickness (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={thicknessIn}
                  onChangeText={setThicknessIn}
                  placeholder="2.5"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.flex1}>
                <Text style={styles.label}>Volume (liters)</Text>
                <TextInput
                  style={styles.input}
                  value={volumeL}
                  onChangeText={setVolumeL}
                  placeholder="30"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          
          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            <Text style={styles.label}>Fin Setup (optional)</Text>
            <TextInput
              style={styles.input}
              value={finSetup}
              onChangeText={setFinSetup}
              placeholder="e.g., Thruster, Quad, Single"
            />
            
            <Text style={styles.label}>Condition (optional)</Text>
            <TextInput
              style={styles.input}
              value={condition}
              onChangeText={setCondition}
              placeholder="e.g., Excellent, Good, Fair"
            />
            
            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Waikiki, North Shore"
            />
          </View>
          
          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            
            <Text style={styles.label}>Sale Price (optional)</Text>
            <TextInput
              style={styles.input}
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="599"
              keyboardType="decimal-pad"
            />
            
            <Text style={styles.label}>Rent Price Per Day (optional)</Text>
            <TextInput
              style={styles.input}
              value={rentPricePerDay}
              onChangeText={setRentPricePerDay}
              placeholder="25"
              keyboardType="decimal-pad"
            />
            
            <Text style={styles.label}>Rent Price Per Week (optional)</Text>
            <TextInput
              style={styles.input}
              value={rentPricePerWeek}
              onChangeText={setRentPricePerWeek}
              placeholder="140"
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={{ height: 100 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
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
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  imagePickerButton: {
    width: '100%',
    height: 320,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#999',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  aiButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  analyzingText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
});
