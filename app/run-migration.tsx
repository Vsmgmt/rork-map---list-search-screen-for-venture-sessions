import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Database, Copy, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

const MIGRATION_SQL = `-- Migration: Add missing columns to boards table
-- Run this in Supabase SQL Editor to add missing columns

-- Add new location columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS location_country TEXT;

-- Add new price columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS price_per_week DECIMAL(10,2);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS price_sale DECIMAL(10,2);

-- Add board details columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS dimensions_detail TEXT;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS volume_l DECIMAL(10,2);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS pickup_spot TEXT;

-- Add geolocation columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS lat DECIMAL(10,6);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS lon DECIMAL(10,6);

-- Add delivery columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10,2);

-- Add availability date columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS availability_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS availability_end TIMESTAMP WITH TIME ZONE;

-- Make location column nullable (if it was NOT NULL before)
ALTER TABLE boards ALTER COLUMN location DROP NOT NULL;
ALTER TABLE boards ALTER COLUMN board_type DROP NOT NULL;

-- Update indexes if needed
CREATE INDEX IF NOT EXISTS idx_boards_location_city ON boards(location_city);
CREATE INDEX IF NOT EXISTS idx_boards_lat_lon ON boards(lat, lon);

COMMENT ON COLUMN boards.lat IS 'Latitude for board pickup location';
COMMENT ON COLUMN boards.lon IS 'Longitude for board pickup location';
COMMENT ON COLUMN boards.location_city IS 'City name for the board location';
COMMENT ON COLUMN boards.location_country IS 'Country name for the board location';`;

export default function RunMigrationScreen() {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(MIGRATION_SQL);
        setCopied(true);
        
        setTimeout(() => {
          setCopied(false);
        }, 2000);
        
        Alert.alert(
          'Copied!',
          'Migration SQL has been copied to your clipboard. Open Supabase SQL Editor and paste it there.'
        );
      } catch {
        Alert.alert('Error', 'Failed to copy to clipboard');
      }
    } else {
      Alert.alert(
        'Copy SQL',
        'Please manually copy the SQL from the preview below and paste it in Supabase SQL Editor.'
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{
          title: 'Database Migration',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Database size={48} color={Colors.light.tint} />
          <Text style={styles.title}>Database Schema Update Required</Text>
          <Text style={styles.subtitle}>
            Your database needs to be updated with new columns for the &quot;Add Board&quot; feature to work.
          </Text>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Copy Migration SQL</Text>
              <Text style={styles.stepDescription}>
                Tap the button below to copy the migration SQL to your clipboard
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Open Supabase Dashboard</Text>
              <Text style={styles.stepDescription}>
                Go to your Supabase project dashboard at supabase.com
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Navigate to SQL Editor</Text>
              <Text style={styles.stepDescription}>
                Click on &quot;SQL Editor&quot; in the left sidebar
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Paste and Run</Text>
              <Text style={styles.stepDescription}>
                Paste the migration SQL and click &quot;Run&quot; to update your database
              </Text>
            </View>
          </View>
        </View>

        <Pressable 
          style={[styles.copyButton, copied && styles.copyButtonSuccess]}
          onPress={handleCopyToClipboard}
        >
          {copied ? (
            <>
              <CheckCircle size={24} color="white" />
              <Text style={styles.copyButtonText}>Copied!</Text>
            </>
          ) : (
            <>
              <Copy size={24} color="white" />
              <Text style={styles.copyButtonText}>Copy Migration SQL</Text>
            </>
          )}
        </Pressable>

        <View style={styles.sqlCard}>
          <Text style={styles.sqlTitle}>Migration SQL Preview</Text>
          <ScrollView style={styles.sqlScrollView} nestedScrollEnabled>
            <Text style={styles.sqlText}>{MIGRATION_SQL}</Text>
          </ScrollView>
        </View>

        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Admin</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  copyButtonSuccess: {
    backgroundColor: '#28a745',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sqlCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 300,
  },
  sqlTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sqlScrollView: {
    maxHeight: 250,
  },
  sqlText: {
    color: '#d4d4d4',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  backButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '600',
  },
});
