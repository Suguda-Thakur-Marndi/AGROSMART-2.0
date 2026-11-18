import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Colors } from '../constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 5, // 5 seconds
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.neutral.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="pump-control"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="water-management"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="device-connectivity"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="sensor-detail"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="zone-vegetable"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="zone-paddy"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
