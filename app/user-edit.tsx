import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Camera, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { RegularUser } from '@/src/context/user';
import { useBoardsBackend } from '@/src/context/boards-backend';
import { useUserBackend } from '@/src/context/user-backend';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl: string;
}

export default function UserEditScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: 'create' | 'edit' }>();
  const { currentUser, updateUser } = useUserBackend();
  const { refetchBoards } = useBoardsBackend();
  const isCreateMode = mode === 'create';
  
  // tRPC mutation for creating regular users
  const createUserMutation = trpc.users.createRegular.useMutation({
    onSuccess: (newUser) => {
      console.log('User created successfully:', newUser);
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
  
  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    avatarUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    if (!isCreateMode && currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        location: currentUser.location,
        avatarUrl: currentUser.avatarUrl,
      });
    }
  }, [currentUser, isCreateMode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (isCreateMode) {
        // Create user via tRPC backend
        const createUserData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          avatarUrl: formData.avatarUrl || 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8cqe04ampu7qlz037go5g',
        };
        
        console.log('Creating user with data:', createUserData);
        const newUser = await createUserMutation.mutateAsync(createUserData);
        console.log('User created successfully:', newUser);
        
        // Invalidate user queries to refresh the user list
        await utils.users.getAllRegular.invalidate();
        await utils.users.getStats.invalidate();
        
        Alert.alert('Success', 'User created successfully!');
      } else {
        if (!currentUser) {
          Alert.alert('Error', 'No user to update');
          return;
        }
        
        // Prepare the update data with only the fields that changed
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          avatarUrl: formData.avatarUrl,
        };
        
        console.log('Updating user with data:', updateData);
        console.log('Current user ID:', currentUser.id);
        console.log('Current user type:', currentUser.type);
        
        await updateUser(updateData);
        console.log('User update completed successfully');
        
        // Try to refresh boards data after user update (non-blocking)
        try {
          await refetchBoards();
          console.log('Boards data refreshed successfully');
        } catch (refreshError) {
          console.warn('Failed to refresh boards data (non-critical):', refreshError);
        }
        
        Alert.alert('Success', 'Profile updated successfully!');
      }
      
      router.back();
    } catch (error) {
      console.error('Failed to save user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to save user: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Change Avatar',
      'Choose how you want to update your profile picture',
      [
        {
          text: 'Camera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      let permissionResult;
      
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          `Permission to access ${source === 'camera' ? 'camera' : 'photo library'} is required to change your avatar.`
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        ...(source === 'camera' && {
          // For camera, we'll use launchCameraAsync instead
        }),
      });

      // Use camera if source is camera
      const pickerResult = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : result;

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
        const imageUri = pickerResult.assets[0].uri;
        updateField('avatarUrl', imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const updateField = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isCreateMode ? 'Create User' : 'Edit Profile'}
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
              {formData.avatarUrl ? (
                <Image source={{ uri: formData.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserIcon size={40} color={Colors.light.tabIconDefault} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.light.tabIconDefault}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="Enter your email address"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Location *</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
                placeholder="Enter your location"
                placeholderTextColor={Colors.light.tabIconDefault}
                autoCapitalize="words"
              />
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Avatar URL</Text>
              <TextInput
                style={styles.input}
                value={formData.avatarUrl}
                onChangeText={(value) => updateField('avatarUrl', value)}
                placeholder="Enter avatar image URL (optional)"
                placeholderTextColor={Colors.light.tabIconDefault}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  bottomSpacing: {
    height: 40,
  },
});