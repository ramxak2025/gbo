import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { LogOutIcon, BellIcon, ChevronRightIcon } from '../icons';

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { auth, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Выйти?', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  const name = auth?.user?.name || auth?.user?.phone || 'Пользователь';
  const role = auth?.role;
  const roleLabels = {
    superadmin: 'Суперадмин',
    trainer: 'Тренер',
    student: 'Ученик',
    parent: 'Родитель',
    club_owner: 'Владелец клуба',
    club_admin: 'Администратор клуба',
    organizer: 'Организатор',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Профиль" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={name} photo={auth?.user?.photo} size={80} />
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.accentLight }]}>
            <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>
              {roleLabels[role] || role}
            </Text>
          </View>
        </View>

        <GlassCard>
          {auth?.user?.phone && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Телефон</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{auth.user.phone}</Text>
            </View>
          )}
          {auth?.user?.email && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{auth.user.email}</Text>
            </View>
          )}
        </GlassCard>

        <GlassCard onPress={() => navigation.navigate('NotificationSettings')}>
          <View style={styles.menuRow}>
            <BellIcon size={20} color={colors.accent} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Уведомления</Text>
            <ChevronRightIcon size={20} color={colors.textSecondary} />
          </View>
        </GlassCard>

        <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: colors.danger }]}>
          <LogOutIcon size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Выйти</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  profileSection: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginTop: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, fontWeight: '500', flex: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderRadius: 16, paddingVertical: 14, marginTop: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
