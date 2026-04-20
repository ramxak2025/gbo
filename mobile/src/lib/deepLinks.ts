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

export const linkingConfig: LinkingOptions<Record<string, object | undefined>> = {
  prefixes: linkingPrefixes,
  config: {
    screens: {
      // Tab roots
      Dashboard: '',
      Cash: 'cash',
      Team: 'team',
      Tournaments: 'tournaments',
      Materials: 'materials',
      Profile: 'profile',
      Clubs: 'clubs',

      // Stack detail screens
      StudentDetail: 'student/:id',
      TournamentDetail: 'tournaments/:id',
      TrainerDetail: 'trainer/:id',
      ClubDetail: 'club/:id',
      InternalTournamentDetail: 'internal-tournament/:id',
      Attendance: 'attendance/:groupId',
      AddStudent: 'add-student',
      AddTrainer: 'add-trainer',
      Groups: 'groups',
      NotificationSettings: 'notifications',

      // Fallback
      NotFound: '*',
    },
  },
}
