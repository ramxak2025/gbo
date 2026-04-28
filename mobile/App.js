/**
 * iBorcuha Mobile — App entry point
 *
 * Точная навигационная структура как в PWA:
 * - Role-based bottom tabs (superadmin/trainer/student)
 * - Stack screens для деталей
 * - BottomNav как custom tabBar (копия PWA BottomNav.jsx)
 */
import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClientProvider } from '@tanstack/react-query';
import { Home, Wallet, Users, Trophy, Film, Shield, User, Sparkles } from 'lucide-react-native';

import { queryClient } from './src/lib/queryClient';
import { linkingConfig } from './src/lib/deepLinks';
import { registerForPushNotifications, subscribeToNotificationTaps } from './src/lib/pushNotifications';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DataProvider, useData } from './src/context/DataContext';
import BottomNav from './src/components/BottomNav';

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

function makeIcon(Icon) {
  return ({ focused, color, size }) => (
    <Icon size={size || 22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
  );
}

// PWA navConfigs:
// superadmin: Home(Главная), Shield(Клубы), Users(Люди), Trophy(Турниры), User(Профиль)
// trainer: Home(Главная), Wallet(Касса), Users(Команда), Trophy(Турниры), Film(Материалы)
// student: Home(Главная), Users(Команда), Trophy(Турниры), Sparkles(Автор), Film(Материалы)

function TrainerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Главная', tabBarIcon: makeIcon(Home) }} />
      <Tab.Screen name="Cash" component={CashScreen} options={{ tabBarLabel: 'Касса', tabBarIcon: makeIcon(Wallet) }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Команда', tabBarIcon: makeIcon(Users) }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Турниры', tabBarIcon: makeIcon(Trophy) }} />
      <Tab.Screen name="Materials" component={MaterialsScreen} options={{ tabBarLabel: 'Материалы', tabBarIcon: makeIcon(Film) }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Главная', tabBarIcon: makeIcon(Home) }} />
      <Tab.Screen name="Clubs" component={ClubsScreen} options={{ tabBarLabel: 'Клубы', tabBarIcon: makeIcon(Shield) }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Люди', tabBarIcon: makeIcon(Users) }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Турниры', tabBarIcon: makeIcon(Trophy) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Профиль', tabBarIcon: makeIcon(User) }} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Главная', tabBarIcon: makeIcon(Home) }} />
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Команда', tabBarIcon: makeIcon(Users) }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Турниры', tabBarIcon: makeIcon(Trophy) }} />
      <Tab.Screen name="Materials" component={MaterialsScreen} options={{ tabBarLabel: 'Материалы', tabBarIcon: makeIcon(Film) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Профиль', tabBarIcon: makeIcon(User) }} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { auth } = useAuth();
  const { reload } = useData();

  console.log('[MainNavigator] auth:', auth === undefined ? 'loading' : auth === null ? 'null' : `${auth.userId}/${auth.role}`);

  if (auth === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505' }}>
        <ActivityIndicator size="large" color="#dc2626" />
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
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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
    registerForPushNotifications().catch(() => {});
    const unsubscribe = subscribeToNotificationTaps((payload) => {
      if (!navigationRef.current) return;
      try {
        const { type, studentId, tournamentId, trainerId } = payload?.data || {};
        if (type === 'student' && studentId) navigationRef.current.navigate('StudentDetail', { id: studentId });
        else if (type === 'tournament' && tournamentId) navigationRef.current.navigate('TournamentDetail', { id: tournamentId });
        else if (type === 'trainer' && trainerId) navigationRef.current.navigate('TrainerDetail', { id: trainerId });
      } catch {}
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <DataProvider>
                <RootNavigator />
              </DataProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
