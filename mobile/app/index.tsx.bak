import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants';
import { useAppStore } from '../store/appStore';

export default function EntryScreen() {
  const router = useRouter();
  const { isAuthenticated, isDemoMode } = useAppStore();

  useEffect(() => {
    // In demo mode or if authenticated, proceed to main dashboard tabs
    const timer = setTimeout(() => {
      if (isAuthenticated || isDemoMode) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isDemoMode, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary.natural} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
