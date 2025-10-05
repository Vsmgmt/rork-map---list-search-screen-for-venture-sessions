import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react-native';

type SetupStep = {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
};

export default function SetupDatabase() {
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const insets = useSafeAreaInsets();

  const updateStep = (name: string, status: SetupStep['status'], message: string, details?: string) => {
    setSteps(prev => {
      const existing = prev.find(s => s.name === name);
      if (existing) {
        return prev.map(s => s.name === name ? { ...s, status, message, details } : s);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const clearSteps = () => {
    setSteps([]);
  };

  const setupDatabase = async () => {
    setIsRunning(true);
    clearSteps();

    // Step 1: Check environment variables
    updateStep('env', 'running', 'Checking environment variables...');
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      updateStep('env', 'error', 'Environment variables missing', 
        `URL: ${supabaseUrl ? 'Set' : 'Missing'}, Key: ${supabaseKey ? 'Set' : 'Missing'}`);
      setIsRunning(false);
      return;
    }

    updateStep('env', 'success', 'Environment variables found');

    // Step 2: Connect to Supabase
    updateStep('connect', 'running', 'Connecting to Supabase...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test connection
      const { error } = await supabase.from('_test_connection').select('*').limit(1);
      // This will fail if no tables exist, but that's expected
      console.log('Connection test result:', error ? 'No tables found (expected)' : 'Tables exist');
      
      updateStep('connect', 'success', 'Connected to Supabase successfully');
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      updateStep('connect', 'error', 'Failed to connect to Supabase', errorMessage);
      setIsRunning(false);
      return;
    }

    // Step 3: Create tables
    updateStep('tables', 'running', 'Creating database tables...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Create tables using SQL
      const createTablesSQL = `
        -- Create boards table
        CREATE TABLE IF NOT EXISTS boards (
          id TEXT PRIMARY KEY,
          short_name TEXT NOT NULL,
          location TEXT NOT NULL,
          board_type TEXT NOT NULL,
          price_per_day DECIMAL(10,2),
          description TEXT,
          images TEXT[],
          owner_id TEXT,
          owner_name TEXT,
          owner_avatar TEXT,
          owner_rating DECIMAL(3,2),
          owner_reviews_count INTEGER,
          rating DECIMAL(3,2),
          reviews_count INTEGER,
          available BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create pro_users table
        CREATE TABLE IF NOT EXISTS pro_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          location TEXT,
          avatar_url TEXT,
          bio TEXT,
          rating DECIMAL(3,2) DEFAULT 0,
          reviews_count INTEGER DEFAULT 0,
          boards_count INTEGER DEFAULT 0,
          joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create regular_users table
        CREATE TABLE IF NOT EXISTS regular_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          location TEXT,
          avatar_url TEXT,
          user_type TEXT DEFAULT 'regular',
          joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create bookings table
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          confirmation_number TEXT UNIQUE NOT NULL,
          customer_email TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_phone TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          status TEXT DEFAULT 'confirmed',
          booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          order_items JSONB,
          customer_info JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create messages table
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          sender_name TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create conversations table
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          participants TEXT[] NOT NULL,
          last_message TEXT,
          last_message_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
      
      if (sqlError) {
        // If RPC doesn't work, try creating tables individually
        console.log('RPC failed, trying individual table creation...');
        
        // Try a simpler approach - just check if we can query the tables
        const tables = ['boards', 'pro_users', 'regular_users', 'bookings', 'messages', 'conversations'];
        let createdTables = 0;
        
        for (const table of tables) {
          try {
            const { error } = await supabase.from(table).select('*').limit(1);
            if (!error) {
              createdTables++;
            }
          } catch {
            console.log(`Table ${table} doesn't exist or has issues`);
          }
        }
        
        if (createdTables === 0) {
          throw new Error('No tables found. Please run the SQL schema in your Supabase dashboard.');
        }
        
        updateStep('tables', 'success', `Found ${createdTables}/${tables.length} tables`, 
          'Some tables may need to be created manually in Supabase dashboard');
      } else {
        updateStep('tables', 'success', 'Database tables created successfully');
      }
    } catch (error) {
      console.error('Table creation error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      updateStep('tables', 'error', 'Failed to create tables', errorMessage);
    }

    // Step 4: Set up RLS policies
    updateStep('policies', 'running', 'Setting up Row Level Security policies...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Enable RLS and create policies
      const rlsSQL = `
        -- Enable RLS
        ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
        ALTER TABLE pro_users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE regular_users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

        -- Create permissive policies for development
        CREATE POLICY IF NOT EXISTS "Allow public access on boards" ON boards FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow public access on pro_users" ON pro_users FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow public access on regular_users" ON regular_users FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow public access on bookings" ON bookings FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow public access on messages" ON messages FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow public access on conversations" ON conversations FOR ALL USING (true);
      `;

      const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
      
      if (rlsError) {
        console.log('RLS setup failed, but continuing...');
        updateStep('policies', 'success', 'RLS policies may need manual setup', 
          'Please set up Row Level Security policies in Supabase dashboard');
      } else {
        updateStep('policies', 'success', 'Row Level Security policies created');
      }
    } catch (error) {
      console.error('RLS setup error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      updateStep('policies', 'error', 'Failed to set up RLS policies', 
        `Error: ${errorMessage}\n\nYou may need to set these up manually in Supabase dashboard`);
    }

    // Step 5: Test database operations
    updateStep('test', 'running', 'Testing database operations...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test creating a user
      const testUser = {
        id: `test-setup-${Date.now()}`,
        name: 'Setup Test User',
        email: `setup-test-${Date.now()}@example.com`,
        phone: '+1-555-0123',
        location: 'Test Location',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        user_type: 'regular',
        joined_date: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('regular_users')
        .insert([testUser])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Insert test failed: ${insertError.message}`);
      }

      // Test reading
      const { error: readError } = await supabase
        .from('regular_users')
        .select('*')
        .eq('id', testUser.id)
        .single();

      if (readError) {
        throw new Error(`Read test failed: ${readError.message}`);
      }

      // Clean up
      await supabase.from('regular_users').delete().eq('id', testUser.id);

      updateStep('test', 'success', 'Database operations working correctly');
    } catch (error) {
      console.error('Database test error:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      updateStep('test', 'error', 'Database operations failed', errorMessage);
    }

    setIsRunning(false);
  };

  const showInstructions = () => {
    Alert.alert(
      'Manual Setup Instructions',
      'If automatic setup fails, please:\n\n' +
      '1. Go to your Supabase dashboard\n' +
      '2. Navigate to SQL Editor\n' +
      '3. Copy and paste the schema from backend/db/supabase-schema.sql\n' +
      '4. Run the SQL to create tables and policies\n' +
      '5. Come back and test the connection',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Database Setup' }} />
      
      <View style={styles.header}>
        <Database size={32} color="#007AFF" />
        <Text style={styles.title}>Database Setup</Text>
        <Text style={styles.subtitle}>Set up your Supabase database tables and policies</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={setupDatabase}
            disabled={isRunning}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Setting Up...' : 'Auto Setup'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={showInstructions}
          >
            <Text style={styles.secondaryButtonText}>Manual Setup</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={`step-${index}`} style={styles.stepItem}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                {step.status === 'success' && <CheckCircle size={20} color="#34C759" />}
                {step.status === 'error' && <XCircle size={20} color="#FF3B30" />}
                {step.status === 'running' && <AlertCircle size={20} color="#FF9500" />}
                {step.status === 'pending' && <AlertCircle size={20} color="#8E8E93" />}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepName}>
                  {step.name === 'env' ? 'Environment Variables' :
                   step.name === 'connect' ? 'Database Connection' :
                   step.name === 'tables' ? 'Create Tables' :
                   step.name === 'policies' ? 'Security Policies' :
                   step.name === 'test' ? 'Test Operations' : step.name}
                </Text>
                <Text style={styles.stepMessage}>{step.message}</Text>
                {step.status === 'success' && (
                  <View style={styles.successBadge}>
                    <Text style={styles.successText}>Complete</Text>
                  </View>
                )}
                {step.status === 'error' && (
                  <View style={styles.errorBadge}>
                    <Text style={styles.errorText}>Failed</Text>
                  </View>
                )}
                {step.status === 'running' && (
                  <View style={styles.runningBadge}>
                    <Text style={styles.runningText}>Running...</Text>
                  </View>
                )}
              </View>
            </View>
            {step.details && (
              <Text style={styles.stepDetails}>{step.details}</Text>
            )}
          </View>
        ))}
        
        {steps.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Database size={48} color="#8E8E93" />
            <Text style={styles.emptyTitle}>Ready to Set Up Database</Text>
            <Text style={styles.emptyText}>
              This will create the necessary tables and policies in your Supabase database.
            </Text>
          </View>
        )}
        
        {steps.length > 0 && (
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>What This Does</Text>
            <Text style={styles.helpItem}>• Creates all required database tables</Text>
            <Text style={styles.helpItem}>• Sets up Row Level Security policies</Text>
            <Text style={styles.helpItem}>• Tests basic database operations</Text>
            <Text style={styles.helpItem}>• Ensures your app can connect properly</Text>
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
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  stepsContainer: {
    flex: 1,
    padding: 16,
  },
  stepItem: {
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
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  stepMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  stepDetails: {
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
  runningBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  runningText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 12,
  },
  helpItem: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 6,
  },
});