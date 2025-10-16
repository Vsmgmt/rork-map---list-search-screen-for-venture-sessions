import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { 
  Camera, 
  Upload, 
  MapPin, 
  DollarSign, 
  Calendar, 
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
  BarChart3,
  Plus,
  Trash2,
  Check,
  X,
  Edit
} from 'lucide-react-native';
import { BoardType, Booking, Board } from '@/src/types/board';
import Colors from '@/constants/colors';
import DatePicker from '@/components/DatePicker';
import { useBoards } from '@/src/context/boards';
import { useBookings } from '@/src/context/bookings';
import { useBoardsBackend } from '@/src/context/boards-backend';
import { router } from 'expo-router';
import { createBoardDirectly } from '@/lib/queries';
import { trpc } from '@/lib/trpc';

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
  ownerId: string;
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

// AI-generated realistic board names
const boardNames = [
  'Channel Islands Rocket 9',
  'Lost Puddle Jumper',
  'Firewire Seaside',
  'JS Monsta Box',
  'Hayden Shapes Hypto Krypto',
  'Pyzel Ghost',
  'CI Mid',
  'Lost RNF',
  'Firewire Mashup',
  'DHD Black Diamond',
];

const descriptions = [
  'Perfect all-around board for intermediate surfers. Great condition with minimal dings. Ideal for 2-6ft waves.',
  'High-performance shortboard for experienced riders. Fast and responsive with excellent wave catching ability.',
  'Beginner-friendly soft top with great stability. Perfect for learning and progressing your surfing skills.',
  'Classic longboard with smooth glide. Excellent for nose riding and small to medium waves.',
  'Versatile fish design perfect for everyday surfing. Works great in mushy conditions and small waves.',
];

export default function ProUserScreen() {
  const { addBoard, updateBoard, boards, removeBoard } = useBoards();
  const { refetchBoards } = useBoardsBackend();
  const { bookings, isLoading: bookingsLoading, getTotalRevenue, getBookingsCount, getBookingsByStatus, updateBookingStatus } = useBookings();
  
  // Fetch all users for owner selection (changed from pro users only)
  const { data: allUsersResponse, isLoading: proUsersLoading } = trpc.admin.getAllUsers.useQuery();
  const proUsers = allUsersResponse?.proUsers || [];
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-board' | 'bookings' | 'my-boards'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all');
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  
  // Generate random AI-prefilled values
  const generateRandomBoardData = () => {
    const randomName = boardNames[Math.floor(Math.random() * boardNames.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomType = BOARD_TYPES[Math.floor(Math.random() * BOARD_TYPES.length)].value;
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const randomPrice = (25 + Math.floor(Math.random() * 30)).toString();
    const randomLength = (5 + Math.floor(Math.random() * 4));
    const randomWidth = (18 + Math.random() * 4).toFixed(1);
    const randomThickness = (2 + Math.random() * 1.5).toFixed(1);
    const randomVolume = (25 + Math.floor(Math.random() * 25)).toString();
    const firstProUser = proUsers.length > 0 ? proUsers[0].id : '';
    
    return {
      name: randomName,
      type: randomType,
      location: randomLocation,
      pricePerDay: randomPrice,
      pricePerWeek: (parseInt(randomPrice) * 5).toString(),
      dimensions: `${randomLength}'${Math.floor(Math.random() * 12)}" x ${randomWidth} x ${randomThickness}`,
      volume: randomVolume,
      description: randomDescription,
      pickupSpot: `${randomLocation} Beach Parking`,
      availableStart: new Date().toISOString().split('T')[0],
      availableEnd: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryAvailable: Math.random() > 0.5,
      deliveryPrice: '15',
      images: {
        deckFront: 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=400',
        bottomBack: null,
        dimensions: null,
      },
      ownerId: firstProUser,
    };
  };
  
  const [board, setBoard] = useState<NewBoard>(generateRandomBoardData());

  // Update board data when pro users load - make sure it's always set
  useEffect(() => {
    if (proUsers.length > 0) {
      setBoard(prev => ({
        ...prev,
        ownerId: prev.ownerId || proUsers[0].id,
      }));
    }
  }, [proUsers]);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingDimensions, setIsAnalyzingDimensions] = useState(false);
  const [showInfoBubble, setShowInfoBubble] = useState(false);

  const pickImage = async (imageType: keyof BoardImages) => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setBoard(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [imageType]: result.assets[0].uri,
        },
      }));

      if (imageType === 'dimensions') {
        await analyzeDimensions(result.assets[0].uri);
      } else {
        await analyzePhotoForAllInfo(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async (imageType: keyof BoardImages) => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to take photos.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setBoard(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [imageType]: result.assets[0].uri,
        },
      }));

      if (imageType === 'dimensions') {
        await analyzeDimensions(result.assets[0].uri);
      } else {
        await analyzePhotoForAllInfo(result.assets[0].uri);
      }
    }
  };

  const analyzePhotoForAllInfo = async (imageUri: string) => {
    setIsAnalyzingDimensions(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(',')[1];
        
        try {
          const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `Please analyze this surfboard image comprehensively and extract all visible information to auto-fill a rental listing form. Extract and format the following (if visible):\n\n1. Board Name/Brand (e.g., "Channel Islands Rocket", "Lost Puddle Jumper", or generic like "Blue Shortboard")\n2. Board Type (one of: soft-top, shortboard, fish, longboard, sup)\n3. Dimensions in format "L x W x T" (e.g., "6'2 x 19.5 x 2.5")\n4. Volume in liters if visible\n5. Brief description highlighting features, condition, colors, and suitability\n\nFormat your response as:\nNAME: [board name]\nTYPE: [board type]\nDIMENSIONS: [dimensions]\nVOLUME: [volume in liters]\nDESCRIPTION: [detailed description]\n\nIf any field is not visible or unclear, write "NOT_VISIBLE" for that field.`,
                    },
                    {
                      type: 'image',
                      image: base64Image,
                    },
                  ],
                },
              ],
            }),
          });
          
          const result = await aiResponse.json();
          const completion = result.completion;
          
          console.log('🤖 AI Analysis Result:', completion);
          
          const nameMatch = completion.match(/NAME:\s*(.+?)(?=\n|$)/i);
          const typeMatch = completion.match(/TYPE:\s*(.+?)(?=\n|$)/i);
          const dimensionsMatch = completion.match(/DIMENSIONS:\s*(.+?)(?=\n|$)/i);
          const volumeMatch = completion.match(/VOLUME:\s*([0-9.]+)/i);
          const descriptionMatch = completion.match(/DESCRIPTION:\s*([\s\S]+?)(?=\n\n|$)/i);
          
          let fieldsUpdated = 0;
          const updates: any = {};
          
          if (nameMatch && nameMatch[1].trim() !== 'NOT_VISIBLE') {
            updates.name = nameMatch[1].trim();
            fieldsUpdated++;
          }
          
          if (typeMatch && typeMatch[1].trim() !== 'NOT_VISIBLE') {
            const typeValue = typeMatch[1].trim().toLowerCase();
            const boardTypes = ['soft-top', 'shortboard', 'fish', 'longboard', 'sup'];
            const matchedType = boardTypes.find(t => 
              typeValue.includes(t) || typeValue.includes(t.replace('-', ''))
            );
            if (matchedType) {
              updates.type = matchedType as BoardType;
              fieldsUpdated++;
            }
          }
          
          if (dimensionsMatch && dimensionsMatch[1].trim() !== 'NOT_VISIBLE') {
            updates.dimensions = dimensionsMatch[1].trim();
            fieldsUpdated++;
          }
          
          if (volumeMatch) {
            updates.volume = volumeMatch[1];
            fieldsUpdated++;
          }
          
          if (descriptionMatch && descriptionMatch[1].trim() !== 'NOT_VISIBLE') {
            updates.description = descriptionMatch[1].trim();
            fieldsUpdated++;
          }
          
          // Apply all updates at once
          if (Object.keys(updates).length > 0) {
            setBoard(prev => ({ ...prev, ...updates }));
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
        } catch (error) {
          console.error('AI analysis error:', error);
          Alert.alert(
            'Photo Uploaded',
            'The photo was uploaded but automatic analysis is unavailable. Please fill in the fields manually.'
          );
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsAnalyzingDimensions(false);
    }
  };

  const analyzeDimensions = async (imageUri: string) => {
    setIsAnalyzingDimensions(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(',')[1];
        
        try {
          const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Please analyze this image of surfboard dimensions and extract the length, width, and thickness measurements. Return the dimensions in the format "L x W x T" (e.g., "6\'2 x 19.5 x 2.5"). Also estimate the volume in liters if possible. If you can see clear measurements, please be precise. If measurements are unclear, make reasonable estimates based on typical surfboard proportions.',
                    },
                    {
                      type: 'image',
                      image: base64Image,
                    },
                  ],
                },
              ],
            }),
          });
          
          const result = await aiResponse.json();
          const completion = result.completion;
          
          // Extract dimensions and volume from AI response
          const dimensionMatch = completion.match(/([0-9]+['"][0-9]*\s*x\s*[0-9.]+\s*x\s*[0-9.]+)/i);
          const volumeMatch = completion.match(/([0-9.]+)\s*liters?/i);
          
          if (dimensionMatch) {
            setBoard(prev => ({ ...prev, dimensions: dimensionMatch[1] }));
          }
          
          if (volumeMatch) {
            setBoard(prev => ({ ...prev, volume: volumeMatch[1] }));
          }
          
          if (!dimensionMatch && !volumeMatch) {
            Alert.alert('AI Analysis', completion);
          }
        } catch (error) {
          console.error('AI analysis error:', error);
          Alert.alert('Error', 'Failed to analyze dimensions. Please enter them manually.');
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsAnalyzingDimensions(false);
    }
  };

  const generateBoardInfo = async () => {
    if (!board.images.deckFront && !board.images.bottomBack) {
      Alert.alert('No Images', 'Please add at least one board photo to generate information.');
      return;
    }

    try {
      const imageToAnalyze = board.images.deckFront || board.images.bottomBack;
      const response = await fetch(imageToAnalyze!);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(',')[1];
        
        try {
          const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `Analyze this surfboard image and generate a suitable board name and description for a rental listing. Consider the board type (${board.type}), visible features, colors, and design. Provide:\n\n1. A catchy board name (brand + model style, e.g., "Channel Islands Rocket" or "Lost Puddle Jumper")\n2. A detailed description highlighting the board's features, condition, and what type of surfer it's good for.\n\nFormat your response as:\nNAME: [board name]\nDESCRIPTION: [detailed description]`,
                    },
                    {
                      type: 'image',
                      image: base64Image,
                    },
                  ],
                },
              ],
            }),
          });
          
          const result = await aiResponse.json();
          const completion = result.completion;
          
          // Extract name and description from AI response
          const nameMatch = completion.match(/NAME:\s*(.+)/i);
          const descriptionMatch = completion.match(/DESCRIPTION:\s*([\s\S]+)/i);
          
          if (nameMatch) {
            setBoard(prev => ({ ...prev, name: nameMatch[1].trim() }));
          }
          
          if (descriptionMatch) {
            setBoard(prev => ({ ...prev, description: descriptionMatch[1].trim() }));
          }
          
          if (!nameMatch && !descriptionMatch) {
            Alert.alert('AI Analysis', completion);
          }
        } catch (error) {
          console.error('AI analysis error:', error);
          Alert.alert('Error', 'Failed to generate board information. Please enter manually.');
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit called');
    console.log('📋 Current board data:', {
      name: board.name,
      pricePerDay: board.pricePerDay,
      dimensions: board.dimensions,
      hasDeckFront: !!board.images.deckFront,
      ownerId: board.ownerId,
    });

    if (!board.name || !board.pricePerDay || !board.dimensions || !board.images.deckFront || !board.ownerId) {
      const missing = [];
      if (!board.name) missing.push('Board Name');
      if (!board.pricePerDay) missing.push('Price per Day');
      if (!board.dimensions) missing.push('Dimensions');
      if (!board.images.deckFront) missing.push('Deck Photo');
      if (!board.ownerId) missing.push('Owner');
      
      Alert.alert(
        'Missing Information', 
        `Please fill in the following required fields:\n\n${missing.join('\n')}`
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingBoard) {
        await updateBoard(editingBoard.id, board);
        
        router.push({
          pathname: '/confirmation',
          params: {
            type: 'board_updated',
            boardId: editingBoard.id,
            boardName: board.name,
            message: 'Your board has been successfully updated!'
          }
        });
        
        setEditingBoard(null);
      } else {
        console.log('🚀 Starting board submission to Supabase...');
        console.log('📋 Board data:', {
          name: board.name,
          type: board.type,
          location: board.location,
          pricePerDay: board.pricePerDay,
          pricePerWeek: board.pricePerWeek,
        });
        
        const supabaseBoard = await createBoardDirectly({
          short_name: board.name,
          dimensions_detail: board.dimensions,
          volume_l: board.volume ? parseFloat(board.volume) : null,
          price_per_day: board.pricePerDay ? parseFloat(board.pricePerDay) : null,
          price_per_week: board.pricePerWeek ? parseFloat(board.pricePerWeek) : null,
          location_city: board.location,
          location_country: null,
          pickup_spot: board.pickupSpot || 'TBD',
          board_type: board.type,
          image_url: board.images.deckFront || 'https://via.placeholder.com/300x400?text=No+Image',
          delivery_available: board.deliveryAvailable,
          delivery_price: board.deliveryPrice ? parseFloat(board.deliveryPrice) : null,
          availability_start: board.availableStart,
          availability_end: board.availableEnd,
        }, board.ownerId);
        
        console.log('✅ Board created in Supabase with ID:', supabaseBoard.id);
        console.log('✅ Full board data:', supabaseBoard);
        
        // Refetch boards to show the new board from Supabase
        console.log('🔄 Refetching boards from Supabase...');
        const refetchResult = await refetchBoards();
        console.log('✅ Boards refetched. New count:', refetchResult?.data?.length || 'unknown');
        
        router.push({
          pathname: '/confirmation',
          params: {
            type: 'board_added',
            boardId: supabaseBoard.id,
            boardName: board.name,
            message: `Board saved to Supabase! ID: ${supabaseBoard.id}. Go to Search tab to see it.`
          }
        });
      }
      
      resetForm();
    } catch (error: any) {
      console.error('Failed to save board:', error);
      Alert.alert('Error', error.message || 'Failed to save board. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBoard(generateRandomBoardData());
    setEditingBoard(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: Booking['status']) => {
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
  };

  const getStatusColor = (status: Booking['status']) => {
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
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.confirmationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerInfo.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerInfo.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (bookingId: string, newStatus: Booking['status']) => {
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
  };

  const handleViewBooking = (booking: Booking) => {
    router.push({
      pathname: '/booking-details' as any,
      params: {
        bookingId: booking.id,
        bookingData: JSON.stringify(booking)
      }
    });
  };

  const renderImageSection = (imageType: keyof BoardImages, title: string, description: string) => {
    const imageUri = board.images[imageType];
    const isAnalyzing = imageType === 'dimensions' && isAnalyzingDimensions;
    
    return (
      <View style={styles.imageSection}>
        <Text style={styles.imageSectionTitle}>{title}</Text>
        <Text style={styles.imageSectionDescription}>{description}</Text>
        
        <View style={styles.imageContainer}>
          {imageUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.boardImage} />
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={() => setBoard(prev => ({
                  ...prev,
                  images: { ...prev.images, [imageType]: null }
                }))}
              >
                <Text style={styles.changeImageText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              {isAnalyzing ? (
                <>
                  <Loader2 size={48} color={Colors.light.tint} />
                  <Text style={styles.imagePlaceholderText}>Analyzing dimensions...</Text>
                </>
              ) : (
                <>
                  <Upload size={48} color={Colors.light.tint} />
                  <Text style={styles.imagePlaceholderText}>Add {title.toLowerCase()}</Text>
                  <View style={styles.imageButtons}>
                    <TouchableOpacity 
                      style={styles.imageButton} 
                      onPress={() => takePhoto(imageType)}
                      disabled={isAnalyzing}
                    >
                      <Camera size={20} color="white" />
                      <Text style={styles.imageButtonText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.imageButton} 
                      onPress={() => pickImage(imageType)}
                      disabled={isAnalyzing}
                    >
                      <Upload size={20} color="white" />
                      <Text style={styles.imageButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                  {imageType === 'dimensions' && (
                    <View style={styles.aiHint}>
                      <Wand2 size={16} color={Colors.light.tint} />
                      <Text style={styles.aiHintText}>AI will read dimensions automatically</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDashboard = () => {
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
    const cancelledBookings = getBookingsByStatus('cancelled');

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Your Business Hub</Text>
          <Text style={styles.welcomeSubtitle}>
            Building local surf businesses, globally. We're here to help you grow your rental business like a mentor.
          </Text>
        </View>

        {/* Stats Cards */}
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => setActiveTab('add-board')}
            >
              <Plus size={32} color={Colors.light.tint} />
              <Text style={styles.quickActionTitle}>Add New Board</Text>
              <Text style={styles.quickActionSubtitle}>List a board for rent</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => setActiveTab('bookings')}
            >
              <BarChart3 size={32} color={Colors.light.tint} />
              <Text style={styles.quickActionTitle}>Manage Bookings</Text>
              <Text style={styles.quickActionSubtitle}>View and update rentals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Bookings Preview */}
        {bookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => setActiveTab('bookings')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {bookings.slice(0, 3).map((booking) => (
              <View key={booking.id} style={styles.bookingPreviewCard}>
                <View style={styles.bookingPreviewHeader}>
                  <Text style={styles.confirmationNumber}>#{booking.confirmationNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                    {getStatusIcon(booking.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customerName}>
                  {booking.customerInfo.firstName} {booking.customerInfo.lastName}
                </Text>
                <Text style={styles.bookingAmount}>${booking.totalAmount}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderBookings = () => {
    if (bookingsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            filteredBookings.map((booking) => (
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
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
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
    );
  };

  // My Boards functionality
  const myBoards = boards.filter(board => board.id.startsWith('user-'));
  
  const handleSelectBoard = (boardId: string) => {
    setSelectedBoards(prev => 
      prev.includes(boardId) 
        ? prev.filter(id => id !== boardId)
        : [...prev, boardId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedBoards.length === myBoards.length) {
      setSelectedBoards([]);
    } else {
      setSelectedBoards(myBoards.map(board => board.id));
    }
  };
  
  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Boards',
      `Are you sure you want to delete ${selectedBoards.length} board${selectedBoards.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            for (const boardId of selectedBoards) {
              await removeBoard(boardId);
            }
            setSelectedBoards([]);
          }
        }
      ]
    );
  };
  
  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    // Convert board data to form format
    setBoard({
      name: board.short_name,
      type: board.type,
      location: board.location,
      pricePerDay: board.price_per_day?.toString() || '',
      pricePerWeek: board.price_per_week?.toString() || '',
      dimensions: board.dimensions_detail,
      volume: board.volume_l?.toString() || '',
      description: '', // Not stored in current board type
      pickupSpot: board.pickup_spot,
      availableStart: board.available_start,
      availableEnd: board.available_end,
      deliveryAvailable: board.delivery_available,
      deliveryPrice: board.delivery_price?.toString() || '',
      images: {
        deckFront: board.imageUrl,
        bottomBack: null,
        dimensions: null,
      },
      ownerId: board.owner?.id || (proUsers.length > 0 ? proUsers[0].id : ''),
    });
    setActiveTab('add-board');
  };
  
  const renderMyBoards = () => {
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with actions */}
        <View style={styles.myBoardsHeader}>
          <View style={styles.myBoardsHeaderLeft}>
            <Text style={styles.sectionTitle}>My Boards ({myBoards.length})</Text>
            {selectedBoards.length > 0 && (
              <Text style={styles.selectedCount}>{selectedBoards.length} selected</Text>
            )}
          </View>
          
          {myBoards.length > 0 && (
            <View style={styles.myBoardsActions}>
              <TouchableOpacity 
                style={styles.selectAllButton}
                onPress={handleSelectAll}
              >
                <Text style={styles.selectAllText}>
                  {selectedBoards.length === myBoards.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              
              {selectedBoards.length > 0 && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDeleteSelected}
                >
                  <Trash2 size={16} color="white" />
                  <Text style={styles.deleteButtonText}>Delete ({selectedBoards.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Boards List */}
        <View style={styles.myBoardsContainer}>
          {myBoards.length === 0 ? (
            <View style={styles.emptyState}>
              <Edit size={48} color="#6c757d" />
              <Text style={styles.emptyStateText}>No boards yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first board to start renting it out to surfers
              </Text>
              <TouchableOpacity 
                style={styles.addFirstBoardButton}
                onPress={() => setActiveTab('add-board')}
              >
                <Plus size={20} color={Colors.light.tint} />
                <Text style={styles.addFirstBoardText}>Add Your First Board</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myBoards.map((board) => (
              <View key={board.id} style={styles.myBoardCard}>
                <View style={styles.myBoardHeader}>
                  <TouchableOpacity 
                    style={styles.selectCheckbox}
                    onPress={() => handleSelectBoard(board.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedBoards.includes(board.id) && styles.checkboxChecked
                    ]}>
                      {selectedBoards.includes(board.id) && (
                        <Check size={12} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.myBoardInfo}>
                    <Text style={styles.myBoardName}>{board.short_name}</Text>
                    <Text style={styles.myBoardType}>
                      {BOARD_TYPES.find(t => t.value === board.type)?.label} • {board.dimensions_detail}
                    </Text>
                    <Text style={styles.myBoardLocation}>
                      {board.location} • {board.pickup_spot}
                    </Text>
                  </View>
                  
                  <Image source={{ uri: board.imageUrl }} style={styles.myBoardImage} />
                </View>
                
                <View style={styles.myBoardDetails}>
                  <View style={styles.myBoardPricing}>
                    <Text style={styles.myBoardPrice}>
                      ${board.price_per_day}/day
                      {board.price_per_week && ` • ${board.price_per_week}/week`}
                    </Text>
                    {board.delivery_available && (
                      <Text style={styles.deliveryBadge}>Delivery Available</Text>
                    )}
                  </View>
                  
                  <View style={styles.myBoardAvailability}>
                    <Text style={styles.availabilityText}>
                      Available: {new Date(board.available_start).toLocaleDateString()} - {new Date(board.available_end).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.myBoardActions}>
                  <TouchableOpacity 
                    style={styles.editBoardButton}
                    onPress={() => handleEditBoard(board)}
                  >
                    <Edit size={16} color={Colors.light.tint} />
                    <Text style={styles.editBoardText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.viewBoardButton}
                    onPress={() => {
                      router.push({
                        pathname: '/board-preview',
                        params: { boardId: board.id }
                      });
                    }}
                  >
                    <Eye size={16} color={Colors.light.tint} />
                    <Text style={styles.viewBoardText}>Preview</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteSingleButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Board',
                        `Are you sure you want to delete "${board.short_name}"?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive',
                            onPress: () => removeBoard(board.id)
                          }
                        ]
                      );
                    }}
                  >
                    <Trash2 size={16} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  const renderAddBoard = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

      {/* Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 Board Photo *</Text>
        <Text style={styles.sectionDescription}>Upload one photo and AI will auto-fill all fields below! Just review and click "Add Board".</Text>
        
        {renderImageSection('deckFront', 'Main Board Photo (Required)', '🤖 AI will auto-fill name, type, dimensions, volume & description from this photo')}
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Board Name *</Text>
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={generateBoardInfo}
              disabled={!board.images.deckFront && !board.images.bottomBack}
            >
              <Wand2 size={16} color={Colors.light.tint} />
              <Text style={styles.aiButtonText}>AI Generate</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={board.name}
            onChangeText={(text) => setBoard(prev => ({ ...prev, name: text }))}
            placeholder="e.g. Channel Islands Rocket"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Board Type *</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <Text style={styles.dropdownText}>
              {BOARD_TYPES.find(t => t.value === board.type)?.label}
            </Text>
          </TouchableOpacity>
          {showTypeDropdown && (
            <View style={styles.dropdownMenu}>
              {BOARD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setBoard(prev => ({ ...prev, type: type.value }));
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dimensions * {isAnalyzingDimensions && '(AI analyzing...)'}</Text>
            <TextInput
              style={[styles.input, isAnalyzingDimensions && styles.inputDisabled]}
              value={board.dimensions}
              onChangeText={(text) => setBoard(prev => ({ ...prev, dimensions: text }))}
              placeholder="e.g. 6'2 x 19.5 x 2.5"
              placeholderTextColor="#999"
              editable={!isAnalyzingDimensions}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Volume (Liters) {isAnalyzingDimensions && '(AI analyzing...)'}</Text>
            <TextInput
              style={[styles.input, isAnalyzingDimensions && styles.inputDisabled]}
              value={board.volume}
              onChangeText={(text) => setBoard(prev => ({ ...prev, volume: text }))}
              placeholder="e.g. 32"
              placeholderTextColor="#999"
              keyboardType="numeric"
              editable={!isAnalyzingDimensions}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Description</Text>
              <TouchableOpacity 
                style={styles.aiButton}
                onPress={generateBoardInfo}
                disabled={!board.images.deckFront && !board.images.bottomBack}
              >
                <Wand2 size={16} color={Colors.light.tint} />
                <Text style={styles.aiButtonText}>AI Generate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={board.description}
              onChangeText={(text) => setBoard(prev => ({ ...prev, description: text }))}
              placeholder="Tell renters about your board's condition, features, etc."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>👤 Owner (User) * {board.ownerId && '✓'}</Text>
            {proUsersLoading ? (
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>Loading users...</Text>
              </View>
            ) : proUsers.length === 0 ? (
              <View style={styles.noProUsersContainer}>
                <View style={styles.dropdown}>
                  <Text style={styles.dropdownText}>⚠️ No users found</Text>
                </View>
                <Text style={styles.noProUsersHint}>
                  You need to create users first before adding boards.
                </Text>
                <TouchableOpacity 
                  style={styles.createProUsersButton}
                  onPress={() => router.push('/data-management')}
                >
                  <Users size={16} color="white" />
                  <Text style={styles.createProUsersButtonText}>Seed Database</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.dropdown, board.ownerId && styles.dropdownFilled]}
                  onPress={() => setShowOwnerDropdown(!showOwnerDropdown)}
                >
                  <Text style={[styles.dropdownText, board.ownerId && styles.dropdownTextFilled]}>
                    {proUsers.find((u: any) => u.id === board.ownerId)?.name || 'Select Owner'}
                  </Text>
                  <Users size={20} color={board.ownerId ? Colors.light.tint : '#666'} />
                </TouchableOpacity>
                {showOwnerDropdown && (
                  <View style={styles.dropdownMenu}>
                    {proUsers.map((user: any) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.dropdownItem, board.ownerId === user.id && styles.dropdownItemSelected]}
                        onPress={() => {
                          setBoard(prev => ({ ...prev, ownerId: user.id }));
                          setShowOwnerDropdown(false);
                        }}
                      >
                        <View>
                          <Text style={styles.dropdownItemText}>{user.name}</Text>
                          <Text style={[styles.dropdownItemText, { fontSize: 12, color: '#999' }]}>{user.email}</Text>
                        </View>
                        {board.ownerId === user.id && (
                          <Check size={16} color={Colors.light.tint} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Location & Pickup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Pickup</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <Text style={styles.dropdownText}>{board.location}</Text>
              <MapPin size={20} color="#666" />
            </TouchableOpacity>
            {showLocationDropdown && (
              <View style={styles.dropdownMenu}>
                {LOCATIONS.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setBoard(prev => ({ ...prev, location }));
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{location}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Spot</Text>
            <TextInput
              style={styles.input}
              value={board.pickupSpot}
              onChangeText={(text) => setBoard(prev => ({ ...prev, pickupSpot: text }))}
              placeholder="e.g. Beach parking lot, Surf shop downtown"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price per Day *</Text>
              <View style={styles.priceInput}>
                <DollarSign size={20} color="#666" />
                <TextInput
                  style={styles.priceTextInput}
                  value={board.pricePerDay}
                  onChangeText={(text) => setBoard(prev => ({ ...prev, pricePerDay: text }))}
                  placeholder="35"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price per Week</Text>
              <View style={styles.priceInput}>
                <DollarSign size={20} color="#666" />
                <TextInput
                  style={styles.priceTextInput}
                  value={board.pricePerWeek}
                  onChangeText={(text) => setBoard(prev => ({ ...prev, pricePerWeek: text }))}
                  placeholder="175"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setBoard(prev => ({ ...prev, deliveryAvailable: !prev.deliveryAvailable }))}
            >
              <View style={[styles.checkboxInner, board.deliveryAvailable && styles.checkboxChecked]} />
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Offer delivery service</Text>
          </View>

          {board.deliveryAvailable && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Delivery Price</Text>
              <View style={styles.priceInput}>
                <DollarSign size={20} color="#666" />
                <TextInput
                  style={styles.priceTextInput}
                  value={board.deliveryPrice}
                  onChangeText={(text) => setBoard(prev => ({ ...prev, deliveryPrice: text }))}
                  placeholder="50"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Available From</Text>
              <DatePicker
                value={board.availableStart}
                onDateChange={(date) => setBoard(prev => ({ ...prev, availableStart: date }))}
                placeholder="Select start date"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Available Until</Text>
              <DatePicker
                value={board.availableEnd}
                onDateChange={(date) => setBoard(prev => ({ ...prev, availableEnd: date }))}
                placeholder="Select end date"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={() => {
            console.log('🔵🔵🔵 BUTTON PRESSED!');
            console.log('📋 Current state:', {
              name: board.name,
              ownerId: board.ownerId,
              isSubmitting,
            });
            handleSubmit();
          }}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting 
              ? (editingBoard ? 'Updating Board...' : 'Adding Board...') 
              : (editingBoard ? 'Update Board' : 'Add Board for Rent')
            }
          </Text>
        </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Info Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pro Dashboard</Text>
        <Pressable 
          style={styles.infoButton}
          onPress={() => setShowInfoBubble(true)}
        >
          <Info size={24} color="#007AFF" />
        </Pressable>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={20} color={activeTab === 'dashboard' ? Colors.light.tint : '#666'} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'add-board' && styles.activeTab]}
          onPress={() => setActiveTab('add-board')}
        >
          <Plus size={20} color={activeTab === 'add-board' ? Colors.light.tint : '#666'} />
          <Text style={[styles.tabText, activeTab === 'add-board' && styles.activeTabText]}>Add Board</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my-boards' && styles.activeTab]}
          onPress={() => setActiveTab('my-boards')}
        >
          <Edit size={20} color={activeTab === 'my-boards' ? Colors.light.tint : '#666'} />
          <Text style={[styles.tabText, activeTab === 'my-boards' && styles.activeTabText]}>My Boards</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}
          onPress={() => setActiveTab('bookings')}
        >
          <Calendar size={20} color={activeTab === 'bookings' ? Colors.light.tint : '#666'} />
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.activeTabText]}>Bookings</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'add-board' && renderAddBoard()}
      {activeTab === 'my-boards' && renderMyBoards()}
      {activeTab === 'bookings' && renderBookings()}

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
              <Text style={styles.infoBubbleTitle}>How to use Pro Dashboard</Text>
              <Pressable
                style={styles.infoBubbleClose}
                onPress={() => setShowInfoBubble(false)}
              >
                <X size={20} color="#666" />
              </Pressable>
            </View>
            <View style={styles.infoBubbleContent}>
              <Text style={styles.infoBubbleTip}>📊 <Text style={styles.infoBubbleBold}>Dashboard</Text> shows your business stats and recent bookings</Text>
              <Text style={styles.infoBubbleTip}>➕ <Text style={styles.infoBubbleBold}>Add Board</Text> lets you list new boards with AI-powered photo analysis</Text>
              <Text style={styles.infoBubbleTip}>🏄 <Text style={styles.infoBubbleBold}>My Boards</Text> manages all your listed boards with bulk actions</Text>
              <Text style={styles.infoBubbleTip}>📅 <Text style={styles.infoBubbleBold}>Bookings</Text> tracks all rentals and lets you update their status</Text>
              <Text style={styles.infoBubbleTip}>🤖 <Text style={styles.infoBubbleBold}>AI Features</Text> automatically read board dimensions and generate descriptions</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
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
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  infoButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
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
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  imageSectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
  },
  boardImage: {
    width: 280,
    height: 350,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  changeImageText: {
    color: 'white',
    fontWeight: '600',
  },
  imagePlaceholder: {
    width: 280,
    height: 350,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  imageButtonText: {
    color: 'white',
    fontWeight: '600',
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
  dropdownFilled: {
    borderColor: Colors.light.tint,
    backgroundColor: '#f0f8ff',
  },
  dropdownTextFilled: {
    color: Colors.light.tint,
    fontWeight: '600' as const,
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
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f8ff',
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
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingLeft: 12,
  },
  priceTextInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingLeft: 12,
  },
  dateTextInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1a1a1a',
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
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  aiHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  aiHintText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f0f8ff',
    gap: 4,
  },
  aiButtonText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: Colors.light.tint,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  welcomeSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
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
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  bookingPreviewCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bookingPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: 'white',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
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
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  bookingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
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
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
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
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  orderSummary: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  // My Boards styles
  myBoardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  myBoardsHeaderLeft: {
    flex: 1,
  },
  selectedCount: {
    fontSize: 12,
    color: Colors.light.tint,
    marginTop: 4,
  },
  myBoardsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  selectAllText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#dc3545',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  myBoardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addFirstBoardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint + '10',
    marginTop: 16,
    gap: 8,
  },
  addFirstBoardText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  myBoardCard: {
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
  myBoardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  selectCheckbox: {
    padding: 4,
  },
  myBoardInfo: {
    flex: 1,
  },
  myBoardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  myBoardType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  myBoardLocation: {
    fontSize: 12,
    color: '#999',
  },
  myBoardImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  myBoardDetails: {
    marginBottom: 12,
  },
  myBoardPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  myBoardPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  deliveryBadge: {
    fontSize: 10,
    color: Colors.light.tint,
    backgroundColor: Colors.light.tint + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  myBoardAvailability: {
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
  },
  myBoardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  editBoardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.tint + '10',
    gap: 4,
  },
  editBoardText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  viewBoardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    gap: 4,
  },
  viewBoardText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  deleteSingleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#dc354520',
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#333',
  },
  noProUsersContainer: {
    marginTop: 12,
  },
  noProUsersHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  createProUsersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  createProUsersButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});