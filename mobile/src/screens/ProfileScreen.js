import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import { getSportLabel } from '../utils/sports';

export default function ProfileScreen({ navigation }) {
  const { auth, logout } = useAuth();
  const { data } = useData();
  const { t, dark, toggle } = useTheme();

  const user = auth.role === 'student'
    ? data.students.find(s => s.id === auth.studentId)
    : data.users.find(u => u.id === auth.userId) || auth.user;

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Профиль" />

      {/* User card */}
      <GlassCard>
        <View style={styles.userCenter}>
          <Avatar name={user?.name} src={user?.avatar} size={80} />
          <Text style={[styles.userName, { color: t.text }]}>{user?.name || '—'}</Text>
          <Text style={[styles.userRole, { color: t.accent }]}>
            {auth.role === 'superadmin' ? 'Администратор' : auth.role === 'trainer' ? 'Тренер' : 'Спортсмен'}
          </Text>
        </View>
      </GlassCard>

      {/* Info */}
      <GlassCard>
        {user?.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{user.phone}</Text>
          </View>
        )}
        {user?.clubName && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{user.clubName}</Text>
          </View>
        )}
        {user?.sportType && (
          <View style={styles.infoRow}>
            <Ionicons name="fitness-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{getSportLabel(user.sportType)}</Text>
          </View>
        )}
        {user?.city && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{user.city}</Text>
          </View>
        )}
        {user?.belt && (
          <View style={styles.infoRow}>
            <Ionicons name="ribbon-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{user.belt}</Text>
          </View>
        )}
      </GlassCard>

      {/* Theme toggle */}
      <GlassCard onPress={toggle}>
        <View style={styles.infoRow}>
          <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={18} color={t.textMuted} />
          <Text style={[styles.infoText, { color: t.text }]}>
            {dark ? 'Светлая тема' : 'Тёмная тема'}
          </Text>
        </View>
      </GlassCard>

      {/* Navigation links */}
      {auth.role === 'trainer' && (
        <GlassCard onPress={() => navigation.navigate('Groups')}>
          <View style={styles.infoRow}>
            <Ionicons name="layers-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>Управление группами</Text>
            <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
          </View>
        </GlassCard>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  userCenter: { alignItems: 'center', gap: 6 },
  userName: { fontSize: 20, fontWeight: '800' },
  userRole: { fontSize: 13, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  infoText: { fontSize: 14, flex: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, marginTop: 16, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
