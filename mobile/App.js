import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';

// Simple error boundary without any icon fonts
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Произошла ошибка
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center' }}>
            {this.state.error?.message || 'Перезагрузите приложение'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { auth } = useAuth();
  const { colors } = useTheme();
  const { reload } = require('./src/context/DataContext').useData();

  // Loading state
  if (auth === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.accent }]}>iBorcuha</Text>
      </View>
    );
  }

  // Not authenticated
  if (!auth) {
    return <LoginScreen />;
  }

  // Authenticated
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <AppContent />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
});
