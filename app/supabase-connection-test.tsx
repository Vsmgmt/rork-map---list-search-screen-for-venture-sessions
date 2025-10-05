import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
};

export default function SupabaseConnectionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, details } : r);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsLoading(true);
    clearResults();
    
    // Test 1: Environment Variables
    updateTest('env', 'pending', 'Check if Supabase URL and key are set');
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      updateTest('env', 'error', 'Environment variables are missing', 
        `URL: ${supabaseUrl ? 'Set' : 'Missing'}, Key: ${supabaseKey ? 'Set' : 'Missing'}`);
      setIsLoading(false);
      return;
    }
    
    updateTest('env', 'success', 'Check if Supabase URL and key are set', 
      `URL: ${supabaseUrl.substring(0, 30)}... (from env)\nKey: ${supabaseKey.substring(0, 30)}...`);
    
    // Test 2: Database Connection
    updateTest('connection', 'pending', 'Test basic connection to Supabase');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Simple connection test - try to connect to Supabase
      const { data, error } = await supabase.from('boards').select('count', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Database query failed: ${error.message} (Code: ${error.code})`);
      }
      
      console.log('✅ Connection test successful, board count:', data);
      
      updateTest('connection', 'success', 'Test basic connection to Supabase');
    } catch (error) {
      console.error('Connection test error:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else {
          errorMessage = JSON.stringify(error, null, 2);
        }
      } else {
        errorMessage = String(error);
      }
      
      updateTest('connection', 'error', `Supabase connection error: ${errorMessage}`);
    }
    
    // Test 3: Table Structure
    updateTest('tables', 'pending', 'Verify all required tables exist');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const tables = ['boards', 'pro_users', 'regular_users', 'bookings'];
      const tableTests = await Promise.all(
        tables.map(async (table) => {
          try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            console.log(`Table ${table} test:`, { data, error });
            return { table, exists: !error, error: error?.message, code: error?.code };
          } catch (e) {
            console.error(`Table ${table} error:`, e);
            return { table, exists: false, error: e instanceof Error ? e.message : 'Unknown error' };
          }
        })
      );
      
      const failedTables = tableTests.filter(t => !t.exists);
      if (failedTables.length > 0) {
        const tableDetails = failedTables.map(t => `${t.table}: ${t.error}${t.code ? ` [${t.code}]` : ''}`).join('\n');
        throw new Error(`Missing or inaccessible tables:\n${tableDetails}`);
      }
      
      const successDetails = tableTests.map(t => `✓ ${t.table}`).join('\n');
      updateTest('tables', 'success', 'Verify all required tables exist', successDetails);
      

    } catch (error) {
      console.error('Table test error:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else {
          errorMessage = JSON.stringify(error, null, 2);
        }
      } else {
        errorMessage = String(error);
      }
      
      updateTest('tables', 'error', `Table structure test error: ${errorMessage}`);
    }
    
    // Test 4: User Creation
    updateTest('user', 'pending', 'Test creating and deleting a user');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const testUser = {
        id: `test-${Date.now()}`,
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        phone: '+1-555-0123',
        location: 'Test Location',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        user_type: 'regular',
        joined_date: new Date().toISOString()
      };
      
      const { error: createError } = await supabase
        .from('regular_users')
        .insert([testUser])
        .select()
        .single();
      
      if (createError) {
        throw new Error(`User creation failed: ${createError.message}`);
      }
      
      // Clean up
      await supabase.from('regular_users').delete().eq('id', testUser.id);
      
      updateTest('user', 'success', 'Test creating and deleting a user');
    } catch (error) {
      console.error('User creation test error:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else {
          errorMessage = JSON.stringify(error, null, 2);
        }
      } else {
        errorMessage = String(error);
      }
      
      updateTest('user', 'error', `User creation error: ${errorMessage}`);
    }
    
    setIsLoading(false);
  };





  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Supabase Connection Test' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Connection Test</Text>
        <TouchableOpacity 
          style={[styles.button, styles.runButton]} 
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <View key={`result-${index}`} style={styles.testItem}>
            <View style={styles.testHeader}>
              <View style={styles.testIcon}>
                {result.status === 'success' && <CheckCircle size={20} color="#34C759" />}
                {result.status === 'error' && <XCircle size={20} color="#FF3B30" />}
                {result.status === 'pending' && <AlertCircle size={20} color="#FF9500" />}
              </View>
              <View style={styles.testContent}>
                <Text style={styles.testName}>{result.name === 'env' ? 'Environment Variables' : 
                  result.name === 'connection' ? 'Database Connection' :
                  result.name === 'tables' ? 'Table Structure' :
                  result.name === 'user' ? 'User Creation' : result.name}</Text>
                <Text style={styles.testMessage}>{result.message}</Text>
                {result.status === 'success' && (
                  <View style={styles.successBadge}>
                    <Text style={styles.successText}>Success</Text>
                  </View>
                )}
                {result.status === 'error' && (
                  <View style={styles.errorBadge}>
                    <Text style={styles.errorText}>Error</Text>
                  </View>
                )}
              </View>
            </View>
            {result.details && (
              <Text style={styles.testDetails}>{result.details}</Text>
            )}
          </View>
        ))}
        
        {testResults.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Tap &ldquo;Run All Tests&rdquo; to check your Supabase connection</Text>
          </View>
        )}
        
        {testResults.length > 0 && (
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>If tests are failing, check:</Text>
            <Text style={styles.helpItem}>• Supabase project is created and active</Text>
            <Text style={styles.helpItem}>• Environment variables are set correctly</Text>
            <Text style={styles.helpItem}>• Database schema has been applied</Text>
            <Text style={styles.helpItem}>• Row Level Security policies are configured</Text>
          </View>
        )}
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
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  testItem: {
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
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  testIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  testContent: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  testMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  testDetails: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  successBadge: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  successText: {
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBadge: {
    backgroundColor: '#f8d7da',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  errorText: {
    color: '#721c24',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  helpSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  helpItem: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 4,
  },
});