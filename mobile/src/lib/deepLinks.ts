/**
 * iBorcuha mobile — Deep linking config
 *
 * URL паттерн совпадает 1:1 с веб-роутингом:
 *   iborcuha://team           → Team tab
 *   iborcuha://student/:id    → StudentDetail stack screen
 *   iborcuha://tournaments/:id
 *   https://iborcuha.ru/team  → тоже открывает приложение (Android Deep Link)
 *
 * Имена screens должны совпадать с `<Tab.Screen>` и `<Stack.Screen>` в AppNavigator.
 */
import type { LinkingOptions } from '@react-navigation/native'
import * as Linking from 'expo-linking'

export const linkingPrefixes: string[] = [
  Linking.createURL('/'),
  'iborcuha://',
  'https://iborcuha.ru',
  'https://www.iborcuha.ru',
]

export const linkingConfig: LinkingOptions<any> = {
  prefixes: linkingPrefixes,
  config: {
    screens: {
      Tabs: {
        screens: {
          Dashboard: '',
          Cash: 'cash',
          Team: 'team',
          Tournaments: 'tournaments',
          Materials: 'materials',
          Profile: 'profile',
          Clubs: 'clubs',
        },
      },
      StudentDetail: 'student/:id',
      TournamentDetail: 'tournaments/:id',
      TrainerDetail: 'trainer/:id',
      ClubsStack: 'club/:id',
      InternalTournaments: 'internal-tournament/:id',
      Attendance: 'attendance/:groupId',
      AddStudent: 'add-student',
      Groups: 'groups',
      NotificationSettings: 'notifications',
      ProfilePage: 'profile-page',
    },
  },
}
