import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Check, AlertCircle } from 'lucide-react-native';

export default function ClearCartScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'idle' | 'clearing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const clearAllData = async () => {
    try {
      setStatus('clearing');
      setMessage('Clearing cart data...');
      
      await AsyncStorage.removeItem('venture_sessions_cart');
      
      setStatus('success');
      setMessage('Cart data cleared successfully!');
      
      setTimeout(() => {
        router.replace('/(tabs)/map');
      }, 2000);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      setStatus('error');
      setMessage('Failed to clear cart data. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clear Cart Data</Text>
      </View>
      
      <View style={styles.content}>
        <AlertCircle size={80} color="#FF9800" />
        <Text style={styles.title}>Cart Data Recovery</Text>
        <Text style={styles.description}>
          This will clear any corrupted cart data and fix loading issues.
        </Text>
        
        {status === 'idle' && (
          <Pressable style={styles.button} onPress={clearAllData}>
            <Trash2 size={20} color="white" />
            <Text style={styles.buttonText}>Clear Cart Data</Text>
          </Pressable>
        )}
        
        {status === 'clearing' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.statusText}>{message}</Text>
          </View>
        )}
        
        {status === 'success' && (
          <View style={styles.statusContainer}>
            <Check size={60} color="#4CAF50" />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>{message}</Text>
            <Text style={styles.redirectText}>Redirecting to Map...</Text>
          </View>
        )}
        
        {status === 'error' && (
          <View style={styles.statusContainer}>
            <AlertCircle size={60} color="#FF3B30" />
            <Text style={[styles.statusText, { color: '#FF3B30' }]}>{message}</Text>
            <Pressable style={[styles.button, { marginTop: 20 }]} onPress={clearAllData}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        )}
        
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#333',
    textAlign: 'center' as const,
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center' as const,
  },
  redirectText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
