import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './src/lib/queryClient';
import { linkingConfig } from './src/lib/deepLinks';
import { registerForPushNotifications, subscribeToNotificationTaps } from './src/lib/pushNotifications';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider, useData } from './src/context/DataContext';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TeamScreen from './src/screens/TeamScreen';
import CashScreen from './src/screens/CashScreen';
import TournamentsScreen from './src/screens/TournamentsScreen';
import TournamentDetailScreen from './src/screens/TournamentDetailScreen';
import MaterialsScreen from './src/screens/MaterialsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import StudentDetailScreen from './src/screens/StudentDetailScreen';
import AddStudentScreen from './src/screens/AddStudentScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import TrainerDetailScreen from './src/screens/TrainerDetailScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import InternalTournamentsScreen from './src/screens/InternalTournamentsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Cash: { active: 'wallet', inactive: 'wallet-outline' },
  Team: { active: 'people', inactive: 'people-outline' },
  Tournaments: { active: 'trophy', inactive: 'trophy-outline' },
  Materials: { active: 'film', inactive: 'film-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
  Clubs: { active: 'shield', inactive: 'shield-outline' },
};

function TrainerTabs() {
  const { t, dark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: dark ? '#111125' : '#f8f8fa',
          borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Главная' }} />
      <Tab.Screen name="Cash" component={CashScreen} options={{ tabBarLabel: 'Касса' }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Команда' }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Турниры' }} />
      <Tab.Screen name="Materials" component={MaterialsScreen} options={{ tabBarLabel: 'Материалы' }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { t, dark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: dark ? '#111125' : '#f8f8fa',
          borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Панель' }} />
      <Tab.Screen name="Clubs" component={GroupsScreen} options={{ tabBarLabel: 'Клубы' }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Люди' }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Турниры' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Профиль' }} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  const { t, dark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: dark ? '#111125' : '#f8f8fa',
          borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Главная' }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Команда' }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Турниры' }} />
      <Tab.Screen name="Materials" component={MaterialsScreen} options={{ tabBarLabel: 'Материалы' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Профиль' }} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { auth } = useAuth();
  const { reload } = useData();

  if (auth === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a1a' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!auth) {
    return <LoginScreen onLogin={reload} />;
  }

  const TabsComponent = auth.role === 'superadmin' ? AdminTabs
    : auth.role === 'trainer' ? TrainerTabs
    : StudentTabs;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsComponent} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="AddStudent" component={AddStudentScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} />
      <Stack.Screen name="ClubsStack" component={ClubsScreen} />
      <Stack.Screen name="InternalTournaments" component={InternalTournamentsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="ProfilePage" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { auth } = useAuth();
  const navigationRef = useRef(null);

  useEffect(() => {
    if (!auth?.userId) return;
    // Регистрация push-токена после логина
    registerForPushNotifications().catch(() => { /* ignore */ });

    // Обработка тапа по push → навигация по deep link
    const unsubscribe = subscribeToNotificationTaps((payload) => {
      const url = payload?.data?.url;
      if (!url || !navigationRef.current) return;
      // navigationRef.current.navigate будет разрешён через linking config
      const match = url.match(/iborcuha:\/\/(.*)$/);
      if (!match) return;
      // React Navigation resolves deep links automatically when supplied via linking.config
      // Fallback: try direct navigate by type
      try {
        const { type, studentId, tournamentId, trainerId } = payload.data || {};
        if (type === 'student' && studentId) navigationRef.current.navigate('StudentDetail', { id: studentId });
        else if (type === 'tournament' && tournamentId) navigationRef.current.navigate('TournamentDetail', { id: tournamentId });
        else if (type === 'trainer' && trainerId) navigationRef.current.navigate('TrainerDetail', { id: trainerId });
      } catch { /* ignore navigation errors */ }
    });

    return unsubscribe;
  }, [auth?.userId]);

  return (
    <NavigationContainer ref={navigationRef} linking={linkingConfig}>
      <MainNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DataProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </DataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
