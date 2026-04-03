import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

LogBox.ignoreLogs(['new NativeEventEmitter']);

function AppContent() {
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <NavigationContainer
        theme={{
          dark,
          colors: {
            primary: '#8b5cf6',
            background: dark ? '#050505' : '#f5f5f7',
            card: dark ? '#050505' : '#f5f5f7',
            text: dark ? '#ffffff' : '#111827',
            border: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            notification: '#dc2626',
          },
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          ...MaterialCommunityIcons.font,
        });
      } catch (e) {
        setLoadError(e.message);
      }
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505', padding: 32 }}>
        <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Ошибка загрузки</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{loadError}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <AppContent />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
