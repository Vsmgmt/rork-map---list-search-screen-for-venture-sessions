import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { X, MapPin, Clock, Users, Star, Award, CheckCircle } from 'lucide-react-native';
import { useSessions } from '@/src/context/sessions';
import { Session } from '@/src/types/session';
import Colors from '@/constants/colors';

export default function SessionPreviewModal() {
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { getSessionById } = useSessions();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    
    const data = getSessionById(sessionId);
    console.log('Session data:', data);
    setSession(data || null);
    setLoading(false);
  }, [sessionId, getSessionById]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#333" />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.errorSubText}>Loading session...</Text>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#333" />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <Text style={styles.errorSubText}>The session you&apos;re looking for doesn&apos;t exist.</Text>
        </View>
      </View>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'Surf Lesson';
      case 'tour':
        return 'Surf Tour';
      case 'camp':
        return 'Surf Camp';
      case 'session':
        return 'Private Session';
      default:
        return type;
    }
  };

  const getDurationText = (type: string, duration: number) => {
    if (type === 'camp') {
      return `${duration} days`;
    }
    return `${duration} minutes`;
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#333" />
        </Pressable>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: session.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(session.level) }]}>
          <Award size={16} color="white" />
          <Text style={styles.levelBadgeText}>{session.level.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{session.name}</Text>
          <Text style={styles.type}>{getTypeLabel(session.type)}</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>${session.price}</Text>
          <Text style={styles.priceLabel}>{session.type === 'camp' ? 'total' : 'per session'}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Clock size={20} color={Colors.light.tint} />
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{getDurationText(session.type, session.duration)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Users size={20} color={Colors.light.tint} />
            <Text style={styles.infoLabel}>Max Group Size</Text>
            <Text style={styles.infoValue}>{session.max_participants}</Text>
          </View>

          <View style={styles.infoItem}>
            <MapPin size={20} color={Colors.light.tint} />
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{session.location}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Experience</Text>
          <Text style={styles.description}>{session.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What&apos;s Included</Text>
          {session.includes.map((item, index) => (
            <View key={index} style={styles.includeItem}>
              <CheckCircle size={20} color="#4CAF50" />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.instructorSection}>
          <Text style={styles.sectionTitle}>Your Instructor</Text>
          <View style={styles.instructorCard}>
            {session.instructor.avatarUrl && (
              <Image
                source={{ uri: session.instructor.avatarUrl }}
                style={styles.instructorAvatar}
                resizeMode="cover"
              />
            )}
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>{session.instructor.name}</Text>
              <View style={styles.instructorRating}>
                <Star size={16} color="#FFB800" fill="#FFB800" />
                <Text style={styles.ratingText}>{session.instructor.rating.toFixed(1)}</Text>
                {session.instructor.verified && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={14} color="#4CAF50" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              {session.instructor.bio && (
                <Text style={styles.instructorBio}>{session.instructor.bio}</Text>
              )}
              <Text style={styles.instructorContact}>{session.instructor.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.availabilitySection}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.availabilityText}>
            From {new Date(session.available_start).toLocaleDateString()} to{' '}
            {new Date(session.available_end).toLocaleDateString()}
          </Text>
        </View>

        <Pressable style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </Pressable>

        <View style={{ height: insets.bottom + 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelBadgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  type: {
    fontSize: 16,
    color: '#666',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  includeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  instructorSection: {
    marginBottom: 24,
  },
  instructorCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  instructorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  instructorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  instructorBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  instructorContact: {
    fontSize: 14,
    color: '#007AFF',
  },
  availabilitySection: {
    marginBottom: 24,
  },
  availabilityText: {
    fontSize: 16,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
