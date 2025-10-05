import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  Waves,
  Star,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

// Show current database stats before regeneration
const DatabaseStats = () => {
  const statsQuery = trpc.admin.getStats.useQuery();
  
  if (statsQuery.isLoading) {
    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Current Database Stats</Text>
        <Text style={styles.statsText}>Loading...</Text>
      </View>
    );
  }
  
  if (statsQuery.error) {
    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Current Database Stats</Text>
        <Text style={styles.statsError}>Error loading stats: {statsQuery.error.message}</Text>
      </View>
    );
  }
  
  const stats = statsQuery.data;
  
  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Current Database Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalBoards || 0}</Text>
          <Text style={styles.statLabel}>Boards</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalProUsers || 0}</Text>
          <Text style={styles.statLabel}>Pro Users</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalBookings || 0}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalMessages || 0}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>
      <Text style={styles.revenueText}>Revenue this month: ${stats?.revenueThisMonth || 0}</Text>
    </View>
  );
};

export default function DataRegenerationScreen() {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const regenerateMutation = trpc.admin.regenerateSeedData.useMutation({
    onMutate: () => {
      console.log('🔄 Starting regeneration mutation...');
      setIsStarted(true);
      setProgress(0);
      setCurrentStep('Initializing...');
      startProgressAnimation();
      startRotationAnimation();
    },
    onSuccess: (data) => {
      console.log('✅ Regeneration success:', data);
      completeProgress();
      setCurrentStep('Completed successfully!');
      setTimeout(() => {
        Alert.alert(
          'Success! 🎉',
          `Seed data has been regenerated successfully!\n\nGenerated:\n• ${data.boards} boards\n• ${data.proUsers} pro users\n• ${data.extras} extras`,
          [
            {
              text: 'Go Back to Admin',
              onPress: () => router.back()
            }
          ]
        );
      }, 1000);
    },
    onError: (error) => {
      console.error('❌ Regeneration error:', error);
      resetProgress();
      setCurrentStep('Failed - Please try again');
      Alert.alert('Error', `Failed to regenerate seed data: ${error.message}`);
    },
    onSettled: () => {
      console.log('🏁 Regeneration mutation settled');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopRotationAnimation();
    }
  });

  const startProgressAnimation = useCallback(() => {
    setProgress(0);
    progressAnim.setValue(0);
    
    const steps = [
      { progress: 10, step: 'Clearing existing data...' },
      { progress: 25, step: 'Generating board data...' },
      { progress: 45, step: 'Creating user profiles...' },
      { progress: 65, step: 'Setting up locations...' },
      { progress: 80, step: 'Adding extras and features...' },
      { progress: 95, step: 'Finalizing setup...' },
    ];
    
    let currentStepIndex = 0;
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 1, 95);
        
        // Update step based on progress
        const currentStepData = steps.find(s => newProgress >= s.progress && newProgress < s.progress + 15);
        if (currentStepData && currentStepIndex < steps.length) {
          setCurrentStep(currentStepData.step);
          currentStepIndex++;
        }
        
        Animated.timing(progressAnim, {
          toValue: newProgress / 100,
          duration: 100,
          useNativeDriver: false,
        }).start();
        
        return newProgress;
      });
    }, 80);
  }, [progressAnim]);

  const startRotationAnimation = useCallback(() => {
    const rotate = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => rotate());
    };
    rotate();
  }, [rotateAnim]);

  const stopRotationAnimation = useCallback(() => {
    rotateAnim.stopAnimation();
  }, [rotateAnim]);
  
  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setProgress(100);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);
  
  const resetProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setProgress(0);
    setIsStarted(false);
    setCurrentStep('');
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const handleStartRegeneration = useCallback(() => {
    console.log('🚀 Starting regeneration process...');
    console.log('🔧 Mutation state before trigger:', {
      isPending: regenerateMutation.isPending,
      isError: regenerateMutation.isError,
      error: regenerateMutation.error?.message
    });
    
    try {
      regenerateMutation.mutate();
      console.log('✅ Mutation triggered successfully');
    } catch (error) {
      console.error('❌ Error triggering mutation:', error);
    }
  }, [regenerateMutation]);

  // Auto-start regeneration when component mounts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isStarted && !regenerateMutation.isPending) {
        console.log('🎯 Auto-triggering regeneration after 1 second...');
        console.log('🔍 Current state - isStarted:', isStarted, 'isPending:', regenerateMutation.isPending);
        handleStartRegeneration();
      } else {
        console.log('⏸️ Skipping auto-start - isStarted:', isStarted, 'isPending:', regenerateMutation.isPending);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [handleStartRegeneration, isStarted, regenerateMutation.isPending]);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.light.tint} />
        </Pressable>
        <Text style={styles.title}>Data Regeneration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Stats */}
        <DatabaseStats />
        
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.iconContainer}>
            <Animated.View 
              style={[
                styles.iconWrapper,
                isStarted && { transform: [{ rotate: rotateInterpolate }] }
              ]}
            >
              <Database size={48} color={Colors.light.tint} />
            </Animated.View>
          </View>
          
          <Text style={styles.mainTitle}>Regenerate Database</Text>
          <Text style={styles.mainDescription}>
            This process will completely refresh your database with new sample data including boards, users, bookings, and locations.
          </Text>

          {!isStarted ? (
            <View style={styles.buttonContainer}>
              <Pressable 
                style={[
                  styles.startButton,
                  regenerateMutation.isPending && styles.startButtonDisabled
                ]}
                onPress={handleStartRegeneration}
                disabled={regenerateMutation.isPending}
              >
                <RefreshCw size={20} color="white" />
                <Text style={styles.startButtonText}>
                  {regenerateMutation.isPending ? 'Starting...' : 'Start Regeneration'}
                </Text>
              </Pressable>
              
              {regenerateMutation.isError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    Error: {regenerateMutation.error?.message || 'Unknown error'}
                  </Text>
                  <Pressable 
                    style={styles.retryButton}
                    onPress={() => {
                      regenerateMutation.reset();
                      handleStartRegeneration();
                    }}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Regenerating Data...</Text>
                <Text style={styles.progressPercentage}>{progress}%</Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View 
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        })
                      }
                    ]} 
                  />
                </View>
              </View>
              
              <Text style={styles.currentStep}>{currentStep}</Text>
              
              {progress === 100 && (
                <View style={styles.successContainer}>
                  <CheckCircle size={24} color="#28a745" />
                  <Text style={styles.successText}>Regeneration Complete!</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>What will be generated:</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Waves size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Surfboards</Text>
              <Text style={styles.infoDescription}>
                Various types of boards (shortboard, longboard, fish, SUP) across multiple locations
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Users size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Users & Profiles</Text>
              <Text style={styles.infoDescription}>
                Regular users and PRO rental shop owners with complete profiles
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Star size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Extras & Features</Text>
              <Text style={styles.infoDescription}>
                Wetsuits, lessons, delivery options, and other rental add-ons
              </Text>
            </View>
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <AlertTriangle size={20} color="#ff6b35" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important Notice</Text>
            <Text style={styles.warningText}>
              This action will permanently delete all existing data including bookings, user profiles, and board listings. Make sure you have backups if needed.
            </Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#212529',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  mainDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fee',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#212529',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  currentStep: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#28a745',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#212529',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  // Stats component styles
  statsCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  statsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center' as const,
  },
  statsError: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center' as const,
  },
  revenueText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#28a745',
    textAlign: 'center' as const,
  },
});