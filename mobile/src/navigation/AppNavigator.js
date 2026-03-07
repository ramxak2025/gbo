import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Wallet, Users, Trophy, User, Film, Shield } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';

import DashboardScreen from '../screens/DashboardScreen';
import CashScreen from '../screens/CashScreen';
import TeamScreen from '../screens/TeamScreen';
import TournamentsScreen from '../screens/TournamentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import TournamentDetailScreen from '../screens/TournamentDetailScreen';
import GroupsScreen from '../screens/GroupsScreen';
import AddStudentScreen from '../screens/AddStudentScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TrainerTabs() {
  const { dark } = useTheme();
  const c = getColors(dark);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.navBg,
          borderTopColor: c.separator,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: dark ? '#ffffff' : '#111827',
        tabBarInactiveTintColor: dark ? '#6b7280' : '#9ca3af',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen}
        options={{ tabBarLabel: 'Главная', tabBarIcon: ({ color, size }) => <Home size={22} color={color} /> }} />
      <Tab.Screen name="Cash" component={CashScreen}
        options={{ tabBarLabel: 'Касса', tabBarIcon: ({ color, size }) => <Wallet size={22} color={color} /> }} />
      <Tab.Screen name="Team" component={TeamScreen}
        options={{ tabBarLabel: 'Команда', tabBarIcon: ({ color, size }) => <Users size={22} color={color} /> }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen}
        options={{ tabBarLabel: 'Турниры', tabBarIcon: ({ color, size }) => <Trophy size={22} color={color} /> }} />
      <Tab.Screen name="Materials" component={MaterialsScreen}
        options={{ tabBarLabel: 'Материалы', tabBarIcon: ({ color, size }) => <Film size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  const { dark } = useTheme();
  const c = getColors(dark);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.navBg,
          borderTopColor: c.separator,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: dark ? '#ffffff' : '#111827',
        tabBarInactiveTintColor: dark ? '#6b7280' : '#9ca3af',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen}
        options={{ tabBarLabel: 'Главная', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tab.Screen name="Team" component={TeamScreen}
        options={{ tabBarLabel: 'Команда', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen}
        options={{ tabBarLabel: 'Турниры', tabBarIcon: ({ color }) => <Trophy size={22} color={color} /> }} />
      <Tab.Screen name="Materials" component={MaterialsScreen}
        options={{ tabBarLabel: 'Материалы', tabBarIcon: ({ color }) => <Film size={22} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: 'Профиль', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

function SuperadminTabs() {
  const { dark } = useTheme();
  const c = getColors(dark);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.navBg,
          borderTopColor: c.separator,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: dark ? '#ffffff' : '#111827',
        tabBarInactiveTintColor: dark ? '#6b7280' : '#9ca3af',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen}
        options={{ tabBarLabel: 'Главная', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tab.Screen name="Team" component={TeamScreen}
        options={{ tabBarLabel: 'Люди', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen}
        options={{ tabBarLabel: 'Турниры', tabBarIcon: ({ color }) => <Trophy size={22} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: 'Профиль', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { auth } = useAuth();
  const { dark } = useTheme();
  const c = getColors(dark);

  const TabsComponent = auth?.role === 'trainer' ? TrainerTabs
    : auth?.role === 'superadmin' ? SuperadminTabs
    : StudentTabs;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabsComponent} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="AddStudent" component={AddStudentScreen} />
      <Stack.Screen name="Notifications" component={NotificationSettingsScreen} />
      <Stack.Screen name="ProfilePage" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
