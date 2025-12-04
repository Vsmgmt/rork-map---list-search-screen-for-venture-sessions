import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default function SplashScreen() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/(tabs)/map');
    });
  }, [fadeAnim, router]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/icon.png')}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
    </View>
  );
}