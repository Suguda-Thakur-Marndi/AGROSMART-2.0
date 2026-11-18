import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_MODE_DEFAULT } from '../constants';

const DEMO_MODE_KEY = '@agrosmart:demoMode';

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(DEMO_MODE_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_MODE_KEY).then((value) => {
      if (value !== null) setIsDemoMode(value === 'true');
      setIsLoading(false);
    });
  }, []);

  const toggleDemoMode = async (value: boolean) => {
    setIsDemoMode(value);
    await AsyncStorage.setItem(DEMO_MODE_KEY, String(value));
  };

  return { isDemoMode, isLoading, toggleDemoMode };
}
