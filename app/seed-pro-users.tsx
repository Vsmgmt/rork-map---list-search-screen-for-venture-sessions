import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { seedFiveProUsers } from '@/lib/seed-pro-users';

export default function SeedProUsersScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const seedResult = await seedFiveProUsers();
      setResult(seedResult);
      Alert.alert('Success', seedResult.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to seed users';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Seed Pro Users',
          headerStyle: { backgroundColor: '#0EA5E9' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Seed Database</Text>
          <Text style={styles.subtitle}>
            Create 5 pro users with 3 boards each (15 total boards)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSeed}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Seed 5 Pro Users</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ Success!</Text>
            <Text style={styles.resultText}>{result.message}</Text>
            
            {result.users && result.users.length > 0 && (
              <View style={styles.usersContainer}>
                <Text style={styles.usersTitle}>Created Users:</Text>
                {result.users.map((user: any, index: number) => (
                  <View key={user.id} style={styles.userCard}>
                    <Text style={styles.userName}>
                      {index + 1}. {user.name}
                    </Text>
                    <Text style={styles.userDetail}>📧 {user.email}</Text>
                    <Text style={styles.userDetail}>📍 {user.location}</Text>
                    <Text style={styles.userDetail}>⭐ Rating: {user.rating}</Text>
                    <Text style={styles.userDetail}>🏄 Boards: 3</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {!result && !loading && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ What will be created:</Text>
            <Text style={styles.infoText}>• 5 verified pro users</Text>
            <Text style={styles.infoText}>• 3 boards per user (15 total)</Text>
            <Text style={styles.infoText}>• Various board types (shortboard, longboard, fish, soft-top, SUP)</Text>
            <Text style={styles.infoText}>• Real surfboard images</Text>
            <Text style={styles.infoText}>• Locations: Santa Cruz, San Diego, Honolulu, Kona</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#991B1B',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#059669',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 20,
    lineHeight: 24,
  },
  usersContainer: {
    marginTop: 20,
  },
  usersTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 8,
  },
  userDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  backButton: {
    backgroundColor: '#64748B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E40AF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 6,
    lineHeight: 20,
  },
});
