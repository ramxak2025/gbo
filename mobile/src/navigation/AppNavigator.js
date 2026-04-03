import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LiquidGlassTabBar from '../components/LiquidGlassTabBar';

// Icons
import {
  HomeIcon, WalletIcon, UsersIcon, TrophyIcon, UserIcon,
  BookIcon, BuildingIcon, PenIcon, GitBranchIcon, ListIcon,
} from '../icons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import CashScreen from '../screens/CashScreen';
import TeamScreen from '../screens/TeamScreen';
import TournamentsScreen from '../screens/TournamentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import ClubsScreen from '../screens/ClubsScreen';
import AuthorScreen from '../screens/AuthorScreen';
import ClubBranchesScreen from '../screens/ClubBranchesScreen';
import ClubTrainersScreen from '../screens/ClubTrainersScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ParentClubScreen from '../screens/ParentClubScreen';

// Stack screens
import StudentDetailScreen from '../screens/StudentDetailScreen';
import TournamentDetailScreen from '../screens/TournamentDetailScreen';
import TrainerDetailScreen from '../screens/TrainerDetailScreen';
import ClubDetailScreen from '../screens/ClubDetailScreen';
import AddStudentScreen from '../screens/AddStudentScreen';
import AddTournamentScreen from '../screens/AddTournamentScreen';
import AddTrainerScreen from '../screens/AddTrainerScreen';
import GroupsScreen from '../screens/GroupsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import CreateInternalTournamentScreen from '../screens/CreateInternalTournamentScreen';
import InternalTournamentDetailScreen from '../screens/InternalTournamentDetailScreen';
import QRCheckinScreen from '../screens/QRCheckinScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_CONFIGS = {
  superadmin: [
    { name: 'Home', component: DashboardScreen, label: 'Главная', icon: HomeIcon },
    { name: 'Clubs', component: ClubsScreen, label: 'Клубы', icon: BuildingIcon },
    { name: 'Team', component: TeamScreen, label: 'Люди', icon: UsersIcon },
    { name: 'Tournaments', component: TournamentsScreen, label: 'Турниры', icon: TrophyIcon },
    { name: 'Profile', component: ProfileScreen, label: 'Профиль', icon: UserIcon },
  ],
  trainer: [
    { name: 'Home', component: DashboardScreen, label: 'Главная', icon: HomeIcon },
    { name: 'Cash', component: CashScreen, label: 'Касса', icon: WalletIcon },
    { name: 'Team', component: TeamScreen, label: 'Команда', icon: UsersIcon },
    { name: 'Tournaments', component: TournamentsScreen, label: 'Турниры', icon: TrophyIcon },
    { name: 'Materials', component: MaterialsScreen, label: 'Материалы', icon: BookIcon },
  ],
  club_owner: [
    { name: 'Home', component: DashboardScreen, label: 'Главная', icon: HomeIcon },
    { name: 'Branches', component: ClubBranchesScreen, label: 'Филиалы', icon: GitBranchIcon },
    { name: 'ClubTrainers', component: ClubTrainersScreen, label: 'Тренеры', icon: UsersIcon },
    { name: 'Author', component: AuthorScreen, label: 'Автор', icon: PenIcon },
    { name: 'Catalog', component: CatalogScreen, label: 'Каталог', icon: ListIcon },
  ],
  club_admin: [
    { name: 'Home', component: DashboardScreen, label: 'Главная', icon: HomeIcon },
    { name: 'Branches', component: ClubBranchesScreen, label: 'Филиалы', icon: GitBranchIcon },
    { name: 'ClubTrainers', component: ClubTrainersScreen, label: 'Тренеры', icon: UsersIcon },
    { name: 'Author', component: AuthorScreen, label: 'Автор', icon: PenIcon },
    { name: 'Catalog', component: CatalogScreen, label: 'Каталог', icon: ListIcon },
  ],
  organizer: [
    { name: 'Home', component: DashboardScreen, label: 'Главная', icon: HomeIcon },
    { name: 'Tournaments', component: TournamentsScreen, label: 'Турниры', icon: TrophyIcon },
    { name: 'Author', component: AuthorScreen, label: 'Автор', icon: PenIcon },
    { name: 'Profile', component: ProfileScreen, label: 'Профиль', icon: UserIcon },
  ],
  student: [
    { name: 'Home', component: DashboardScreen, label: 'Главная', icon: HomeIcon },
    { name: 'Team', component: TeamScreen, label: 'Команда', icon: UsersIcon },
    { name: 'Tournaments', component: TournamentsScreen, label: 'Турниры', icon: TrophyIcon },
    { name: 'Author', component: AuthorScreen, label: 'Автор', icon: PenIcon },
    { name: 'Materials', component: MaterialsScreen, label: 'Материалы', icon: BookIcon },
  ],
  parent: [
    { name: 'Home', component: DashboardScreen, label: 'Главная', icon: HomeIcon },
    { name: 'ParentClub', component: ParentClubScreen, label: 'Клуб', icon: BuildingIcon },
    { name: 'Tournaments', component: TournamentsScreen, label: 'Турниры', icon: TrophyIcon },
    { name: 'Author', component: AuthorScreen, label: 'Автор', icon: PenIcon },
    { name: 'Materials', component: MaterialsScreen, label: 'Материалы', icon: BookIcon },
  ],
};

function TabNavigator() {
  const { auth } = useAuth();
  const { colors } = useTheme();
  const role = auth?.role || 'student';
  const tabs = TAB_CONFIGS[role] || TAB_CONFIGS.student;

  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: tab.icon,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
      <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} />
      <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <Stack.Screen name="AddStudent" component={AddStudentScreen} />
      <Stack.Screen name="AddTournament" component={AddTournamentScreen} />
      <Stack.Screen name="AddTrainer" component={AddTrainerScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="CreateInternalTournament" component={CreateInternalTournamentScreen} />
      <Stack.Screen name="InternalTournamentDetail" component={InternalTournamentDetailScreen} />
      <Stack.Screen name="QRCheckin" component={QRCheckinScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </Stack.Navigator>
  );
}
