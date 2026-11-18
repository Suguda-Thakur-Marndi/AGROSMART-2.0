import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants';
import { useAppStore } from '../store/appStore';

export default function EntryScreen() {
  const router = useRouter();
  const { isAuthenticated, isDemoMode, checkAuth } = useAppStore();

  useEffect(() => {
    let isMounted = true;
    checkAuth().finally(() => {
      if (!isMounted) return;
      const state = useAppStore.getState();
      if (state.isAuthenticated || state.isDemoMode) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [checkAuth, router]);

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
