import React, { useState, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider, useData } from './src/context/DataContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';

function AppContent() {
  const { auth } = useAuth();
  const { dark } = useTheme();
  const { reload, loading } = useData();

  if (auth === undefined || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (!auth) {
    return <LoginScreen onLogin={reload} />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: dark,
        colors: {
          primary: '#a855f7',
          background: dark ? '#050505' : '#f5f5f7',
          card: dark ? '#050505' : '#f5f5f7',
          text: dark ? '#ffffff' : '#111827',
          border: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          notification: '#ef4444',
        },
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DataProvider>
          <AuthProvider>
            <StatusBarWrapper />
            <AppContent />
          </AuthProvider>
        </DataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function StatusBarWrapper() {
  const { dark } = useTheme();
  return <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={dark ? '#050505' : '#f5f5f7'} />;
}
