import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';

export default function BackendTestScreen() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  
  // Test minimal tRPC endpoint
  const boardsQuery = trpc.boards.getAll.useQuery();
  
  // Test users endpoint
  const usersQuery = trpc.admin.getAllUsers.useQuery();
  
  // Test ping endpoint
  const testPing = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
      const response = await fetch(`${url}/api/ping`);
      const text = await response.text();
      setHealthStatus(`Ping: ${text} (${response.status})`);
    } catch (error) {
      setHealthStatus(`Ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  React.useEffect(() => {
    testPing();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Minimal tRPC Test</Text>
        
        {/* Health Check Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Status</Text>
          <Text style={styles.healthStatus}>{healthStatus}</Text>
          <TouchableOpacity style={styles.testButton} onPress={testPing}>
            <Text style={styles.testButtonText}>Test Ping</Text>
          </TouchableOpacity>
        </View>
        
        {/* Users Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Users in Database</Text>
          {usersQuery.isLoading && <Text>Loading users...</Text>}
          {usersQuery.error && (
            <Text style={styles.error}>Error: {usersQuery.error.message}</Text>
          )}
          {usersQuery.data && (
            <View>
              <Text>Total users: {(usersQuery.data as any).totalUsers}</Text>
              <Text>Pro users: {(usersQuery.data as any).proUsers?.length || 0}</Text>
              <Text>Regular users: {(usersQuery.data as any).regularUsers?.length || 0} (stored locally)</Text>
              
              {((usersQuery.data as any).proUsers || []).slice(0, 5).map((user: any) => (
                <View key={user.id} style={styles.item}>
                  <Text style={styles.itemTitle}>{user.name}</Text>
                  <Text style={styles.itemSubtitle}>{user.email} • {user.location}</Text>
                </View>
              ))}
              
              {((usersQuery.data as any).proUsers || []).length > 5 && (
                <Text style={styles.moreText}>... and {((usersQuery.data as any).proUsers || []).length - 5} more pro users</Text>
              )}
            </View>
          )}
          <TouchableOpacity 
            style={[styles.testButton, { marginTop: 10 }]} 
            onPress={() => usersQuery.refetch()}
          >
            <Text style={styles.testButtonText}>Refresh Users</Text>
          </TouchableOpacity>
        </View>
        
        {/* Boards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boards from tRPC</Text>
          {boardsQuery.isLoading && <Text>Loading boards...</Text>}
          {boardsQuery.error && (
            <Text style={styles.error}>Error: {boardsQuery.error.message}</Text>
          )}
          {boardsQuery.data && (
            <View>
              <Text>Found {boardsQuery.data.length} boards:</Text>
              {boardsQuery.data.slice(0, 3).map((board: any) => (
                <View key={board.id} style={styles.item}>
                  <Text style={styles.itemTitle}>{board.short_name}</Text>
                  <Text style={styles.itemSubtitle}>{board.location} • ${board.price_per_day}/day</Text>
                </View>
              ))}
              
              {boardsQuery.data.length > 3 && (
                <Text style={styles.moreText}>... and {boardsQuery.data.length - 3} more boards</Text>
              )}
            </View>
          )}
          <TouchableOpacity 
            style={[styles.testButton, { marginTop: 10 }]} 
            onPress={() => boardsQuery.refetch()}
          >
            <Text style={styles.testButtonText}>Refresh Boards</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  error: {
    color: 'red',
    fontStyle: 'italic',
  },
  healthStatus: {
    fontSize: 16,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  testButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
});