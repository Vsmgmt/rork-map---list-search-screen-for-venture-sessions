import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { RefreshCw, Database, Trash2, BarChart3, Download } from 'lucide-react-native';

export default function DataManagementScreen() {
  const [boardCount, setBoardCount] = useState<string>('100');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Get current data stats
  const { data: dataStats, refetch: refetchStats, isLoading: statsLoading } = trpc.admin.getDataStats.useQuery();

  // Mutations
  const seedDataMutation = trpc.admin.seedData.useMutation({
    onSuccess: (result) => {
      Alert.alert(
        'Success!',
        result.message,
        [{ text: 'OK' }]
      );
      refetchStats();
      setIsSeeding(false);
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        `Failed to seed data: ${error.message}`,
        [{ text: 'OK' }]
      );
      setIsSeeding(false);
    },
  });

  const clearDataMutation = trpc.admin.clearData.useMutation({
    onSuccess: (result) => {
      Alert.alert(
        'Success!',
        result.message,
        [{ text: 'OK' }]
      );
      refetchStats();
      setIsClearing(false);
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        `Failed to clear data: ${error.message}`,
        [{ text: 'OK' }]
      );
      setIsClearing(false);
    },
  });

  const regenerateDataMutation = trpc.admin.regenerateSeedData.useMutation({
    onSuccess: (result) => {
      Alert.alert(
        'Success!',
        'Data regenerated successfully!',
        [{ text: 'OK' }]
      );
      refetchStats();
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        `Failed to regenerate data: ${error.message}`,
        [{ text: 'OK' }]
      );
    },
  });

  const handleSeedData = () => {
    const count = parseInt(boardCount);
    if (isNaN(count) || count < 1 || count > 500) {
      Alert.alert('Invalid Input', 'Please enter a number between 1 and 500');
      return;
    }

    Alert.alert(
      'Seed Database',
      `This will add ${count} boards and all pro users to the database. This may take a moment. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed Data',
          onPress: () => {
            setIsSeeding(true);
            seedDataMutation.mutate({
              boardCount: count,
              clearExisting: true
            });
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all data from the database. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setIsClearing(true);
            clearDataMutation.mutate();
          },
        },
      ]
    );
  };

  const handleRegenerateData = () => {
    Alert.alert(
      'Regenerate Data',
      'This will clear existing data and generate fresh seed data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: () => {
            regenerateDataMutation.mutate();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Data Management',
          headerStyle: { backgroundColor: '#0ea5e9' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={24} color="#0ea5e9" />
            <Text style={styles.sectionTitle}>Current Database Stats</Text>
          </View>
          
          {statsLoading ? (
            <ActivityIndicator size="large" color="#0ea5e9" style={styles.loader} />
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Boards</Text>
                <Text style={styles.statValue}>{dataStats?.totalBoards || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Pro Users</Text>
                <Text style={styles.statValue}>{dataStats?.totalProUsers || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Bookings</Text>
                <Text style={styles.statValue}>{dataStats?.totalBookings || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Regular Users</Text>
                <Text style={styles.statValue}>{dataStats?.totalRegularUsers || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Database Type</Text>
                <Text style={styles.statValue}>{dataStats?.databaseType || 'Unknown'}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => refetchStats()}
            disabled={statsLoading}
          >
            <RefreshCw size={20} color="#0ea5e9" />
            <Text style={styles.refreshButtonText}>Refresh Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Seed Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Seed Database</Text>
          </View>
          
          <Text style={styles.description}>
            Convert mock data to real database records. This will create boards, pro users, and sample data.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Number of Boards (1-500):</Text>
            <TextInput
              style={styles.textInput}
              value={boardCount}
              onChangeText={setBoardCount}
              keyboardType="numeric"
              placeholder="100"
              maxLength={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.seedButton]}
            onPress={handleSeedData}
            disabled={isSeeding || seedDataMutation.isPending}
          >
            {isSeeding || seedDataMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Download size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {isSeeding || seedDataMutation.isPending ? 'Seeding...' : 'Seed Database'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Regenerate Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RefreshCw size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Regenerate Data</Text>
          </View>
          
          <Text style={styles.description}>
            Clear existing data and generate fresh seed data with default settings.
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.regenerateButton]}
            onPress={handleRegenerateData}
            disabled={regenerateDataMutation.isPending}
          >
            {regenerateDataMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <RefreshCw size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {regenerateDataMutation.isPending ? 'Regenerating...' : 'Regenerate Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clear Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={24} color="#ef4444" />
            <Text style={styles.sectionTitle}>Clear All Data</Text>
          </View>
          
          <Text style={styles.description}>
            ⚠️ Permanently delete all data from the database. This action cannot be undone.
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearData}
            disabled={isClearing || clearDataMutation.isPending}
          >
            {isClearing || clearDataMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash2 size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {isClearing || clearDataMutation.isPending ? 'Clearing...' : 'Clear All Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  refreshButtonText: {
    color: '#0ea5e9',
    fontWeight: '500',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  seedButton: {
    backgroundColor: '#10b981',
  },
  regenerateButton: {
    backgroundColor: '#f59e0b',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
});