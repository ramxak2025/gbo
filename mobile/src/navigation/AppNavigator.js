import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CashScreen from '../screens/CashScreen';
import TeamScreen from '../screens/TeamScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import TournamentsScreen from '../screens/TournamentsScreen';
import TournamentDetailScreen from '../screens/TournamentDetailScreen';
import AddTournamentScreen from '../screens/AddTournamentScreen';
import GroupsScreen from '../screens/GroupsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import ClubsScreen from '../screens/ClubsScreen';
import ClubDetailScreen from '../screens/ClubDetailScreen';
import ClubBranchesScreen from '../screens/ClubBranchesScreen';
import ClubTrainersScreen from '../screens/ClubTrainersScreen';
import AddStudentScreen from '../screens/AddStudentScreen';
import AddTrainerScreen from '../screens/AddTrainerScreen';
import TrainerDetailScreen from '../screens/TrainerDetailScreen';
import InternalTournamentDetailScreen from '../screens/InternalTournamentDetailScreen';
import CreateInternalTournamentScreen from '../screens/CreateInternalTournamentScreen';
import ParentClubScreen from '../screens/ParentClubScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AuthorScreen from '../screens/AuthorScreen';
import QRCheckinScreen from '../screens/QRCheckinScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabConfigs = {
  superadmin: [
    { name: 'Home', screen: DashboardScreen, icon: 'home', label: 'Главная' },
    { name: 'Clubs', screen: ClubsScreen, icon: 'shield-checkmark', label: 'Клубы' },
    { name: 'Team', screen: TeamScreen, icon: 'people', label: 'Люди' },
    { name: 'Tournaments', screen: TournamentsScreen, icon: 'trophy', label: 'Турниры' },
    { name: 'Profile', screen: ProfileScreen, icon: 'person', label: 'Профиль' },
  ],
  trainer: [
    { name: 'Home', screen: DashboardScreen, icon: 'home', label: 'Главная' },
    { name: 'Cash', screen: CashScreen, icon: 'wallet', label: 'Касса' },
    { name: 'Team', screen: TeamScreen, icon: 'people', label: 'Команда' },
    { name: 'Tournaments', screen: TournamentsScreen, icon: 'trophy', label: 'Турниры' },
    { name: 'Materials', screen: MaterialsScreen, icon: 'film', label: 'Материалы' },
  ],
  club_owner: [
    { name: 'Home', screen: DashboardScreen, icon: 'home', label: 'Главная' },
    { name: 'Branches', screen: ClubBranchesScreen, icon: 'business', label: 'Филиалы' },
    { name: 'ClubTrainers', screen: ClubTrainersScreen, icon: 'people', label: 'Тренеры' },
    { name: 'Author', screen: AuthorScreen, icon: 'sparkles', label: 'Автор' },
    { name: 'Profile', screen: ProfileScreen, icon: 'person', label: 'Профиль' },
  ],
  club_admin: [
    { name: 'Home', screen: DashboardScreen, icon: 'home', label: 'Главная' },
    { name: 'Branches', screen: ClubBranchesScreen, icon: 'business', label: 'Филиалы' },
    { name: 'ClubTrainers', screen: ClubTrainersScreen, icon: 'people', label: 'Тренеры' },
    { name: 'Author', screen: AuthorScreen, icon: 'sparkles', label: 'Автор' },
    { name: 'Profile', screen: ProfileScreen, icon: 'person', label: 'Профиль' },
  ],
  organizer: [
    { name: 'Home', screen: DashboardScreen, icon: 'home', label: 'Главная' },
    { name: 'Tournaments', screen: TournamentsScreen, icon: 'trophy', label: 'Турниры' },
    { name: 'Author', screen: AuthorScreen, icon: 'sparkles', label: 'Автор' },
    { name: 'Profile', screen: ProfileScreen, icon: 'person', label: 'Профиль' },
  ],
  student: [
    { name: 'Home', screen: DashboardScreen, icon: 'home', label: 'Главная' },
    { name: 'Team', screen: TeamScreen, icon: 'people', label: 'Команда' },
    { name: 'Tournaments', screen: TournamentsScreen, icon: 'trophy', label: 'Турниры' },
    { name: 'Author', screen: AuthorScreen, icon: 'sparkles', label: 'Автор' },
    { name: 'Materials', screen: MaterialsScreen, icon: 'film', label: 'Материалы' },
  ],
  parent: [
    { name: 'Home', screen: DashboardScreen, icon: 'home', label: 'Главная' },
    { name: 'MyClub', screen: ParentClubScreen, icon: 'shield-checkmark', label: 'Клуб' },
    { name: 'Tournaments', screen: TournamentsScreen, icon: 'trophy', label: 'Турниры' },
    { name: 'Author', screen: AuthorScreen, icon: 'sparkles', label: 'Автор' },
    { name: 'Materials', screen: MaterialsScreen, icon: 'film', label: 'Материалы' },
  ],
};

function TabNavigator() {
  const { auth } = useAuth();
  const { dark } = useTheme();
  const c = getColors(dark);
  const tabs = tabConfigs[auth?.role] || tabConfigs.student;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: dark ? '#ffffff' : '#111827',
        tabBarInactiveTintColor: dark ? '#6b7280' : '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.screen}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { auth } = useAuth();
  const { dark } = useTheme();

  if (auth === undefined) return null; // loading

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: dark ? '#050505' : '#f5f5f7' },
        animation: 'slide_from_right',
      }}
    >
      {auth === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
          <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} />
          <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
          <Stack.Screen name="AddTournament" component={AddTournamentScreen} />
          <Stack.Screen name="AddStudent" component={AddStudentScreen} />
          <Stack.Screen name="AddTrainer" component={AddTrainerScreen} />
          <Stack.Screen name="Groups" component={GroupsScreen} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
          <Stack.Screen name="InternalTournamentDetail" component={InternalTournamentDetailScreen} />
          <Stack.Screen name="CreateInternalTournament" component={CreateInternalTournamentScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="QRCheckin" component={QRCheckinScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Author" component={AuthorScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
