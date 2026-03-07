import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { Home, Wallet, Users, Trophy, User, Film } from 'lucide-react-native';
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

function GlassTabBar(props) {
  const { dark } = useTheme();
  return (
    <BlurView
      intensity={dark ? 60 : 50}
      tint={dark ? 'dark' : 'light'}
      style={styles.blurTabBar}
    >
      <View style={[
        styles.tabBarOverlay,
        dark ? styles.tabBarDark : styles.tabBarLight,
      ]}>
        {props.children}
      </View>
    </BlurView>
  );
}

function getTabScreenOptions(dark) {
  const c = getColors(dark);
  return {
    headerShown: false,
    tabBarStyle: {
      position: 'absolute',
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      elevation: 0,
      height: 70,
      paddingBottom: 10,
      paddingTop: 6,
    },
    tabBarBackground: () => <GlassTabBar />,
    tabBarActiveTintColor: dark ? '#ffffff' : '#111827',
    tabBarInactiveTintColor: dark ? 'rgba(255,255,255,0.35)' : '#9ca3af',
    tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  };
}

function TrainerTabs() {
  const { dark } = useTheme();
  return (
    <Tab.Navigator screenOptions={getTabScreenOptions(dark)}>
      <Tab.Screen name="Home" component={DashboardScreen}
        options={{ tabBarLabel: 'Главная', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tab.Screen name="Cash" component={CashScreen}
        options={{ tabBarLabel: 'Касса', tabBarIcon: ({ color }) => <Wallet size={22} color={color} /> }} />
      <Tab.Screen name="Team" component={TeamScreen}
        options={{ tabBarLabel: 'Команда', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen}
        options={{ tabBarLabel: 'Турниры', tabBarIcon: ({ color }) => <Trophy size={22} color={color} /> }} />
      <Tab.Screen name="Materials" component={MaterialsScreen}
        options={{ tabBarLabel: 'Материалы', tabBarIcon: ({ color }) => <Film size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  const { dark } = useTheme();
  return (
    <Tab.Navigator screenOptions={getTabScreenOptions(dark)}>
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
  return (
    <Tab.Navigator screenOptions={getTabScreenOptions(dark)}>
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

const styles = StyleSheet.create({
  blurTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  tabBarOverlay: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarDark: {
    backgroundColor: 'rgba(10,10,15,0.65)',
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabBarLight: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});
