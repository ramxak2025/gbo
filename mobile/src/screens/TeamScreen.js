import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import { BELT_COLORS } from '../utils/sports';

const STATUS_CONFIG = {
  sick: { label: 'Болеет', icon: 'thermometer-outline', color: '#eab308', bg: '#eab30820' },
  injury: { label: 'Травма', icon: 'heart-dislike-outline', color: '#ef4444', bg: '#ef444420' },
  skip: { label: 'Сачок', icon: 'flash-outline', color: '#8b5cf6', bg: '#8b5cf620' },
};

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={10} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function StudentCard({ person, t, onPress }) {
  const expired = isExpired(person.subscriptionExpiresAt);
  return (
    <GlassCard onPress={onPress}>
      <View style={styles.studentRow}>
        <Avatar name={person.name} src={person.avatar} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>{person.name}</Text>
            {person.status && <StatusBadge status={person.status} />}
          </View>
          <Text style={[styles.subtext, { color: t.textMuted }]}>{person.belt || '—'}</Text>
        </View>
        <View style={styles.indicators}>
          {person.belt && (
            <View style={[styles.beltDot, { backgroundColor: BELT_COLORS[person.belt] || '#888' }]} />
          )}
          <View style={[styles.statusDot, { backgroundColor: expired ? '#ef4444' : '#22c55e' }]} />
        </View>
      </View>
    </GlassCard>
  );
}

export default function TeamScreen({ navigation }) {
  const { auth } = useAuth();
  const { data } = useData();
  const { t } = useTheme();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('students');

  const isAdmin = auth.role === 'superadmin';
  const trainers = data.users.filter(u => u.role === 'trainer');
  const students = isAdmin ? data.students : data.students.filter(s => s.trainerId === auth.userId);
  const myGroups = isAdmin ? data.groups : data.groups.filter(g => g.trainerId === auth.userId);

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredTrainers = trainers.filter(tr => tr.name.toLowerCase().includes(search.toLowerCase()));

  const studentsByGroup = myGroups.map(g => ({
    group: g,
    students: filteredStudents.filter(s => s.groupId === g.id),
  }));
  const ungrouped = filteredStudents.filter(s => !s.groupId || !myGroups.find(g => g.id === s.groupId));

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title={isAdmin ? 'Люди' : 'Команда'}>
        {auth.role === 'trainer' && (
          <TouchableOpacity onPress={() => navigation.navigate('AddStudent')}>
            <Ionicons name="person-add" size={22} color={t.text} />
          </TouchableOpacity>
        )}
      </PageHeader>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: t.input, borderColor: t.inputBorder }]}>
        <Ionicons name="search" size={16} color={t.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: t.text }]}
          placeholder="Поиск по имени..."
          placeholderTextColor={t.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Admin tabs */}
      {isAdmin && (
        <View style={[styles.tabBar, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          {[{ key: 'students', label: `Спортсмены (${filteredStudents.length})` }, { key: 'trainers', label: `Тренеры (${filteredTrainers.length})` }].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tabItem, tab === key && { backgroundColor: t.tabActive }]}
            >
              <Text style={[styles.tabText, { color: tab === key ? t.text : t.textMuted }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Trainers list */}
      {isAdmin && tab === 'trainers' && filteredTrainers.map(person => {
        const count = data.students.filter(s => s.trainerId === person.id).length;
        return (
          <GlassCard key={person.id}>
            <View style={styles.studentRow}>
              <Avatar name={person.name} src={person.avatar} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: t.text }]}>{person.name}</Text>
                <Text style={[styles.subtext, { color: t.textMuted }]}>{person.clubName}</Text>
              </View>
              <Text style={[styles.subtext, { color: t.textMuted }]}>{count} чел.</Text>
            </View>
          </GlassCard>
        );
      })}

      {/* Students list */}
      {(!isAdmin || tab === 'students') && !isAdmin && studentsByGroup.map(({ group, students: gs }) => {
        if (gs.length === 0) return null;
        return (
          <View key={group.id} style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <Text style={[styles.groupName, { color: t.textSecondary }]}>{group.name}</Text>
              <Text style={[styles.groupSchedule, { color: t.textMuted }]}>{group.schedule}</Text>
            </View>
            {gs.map(person => (
              <StudentCard key={person.id} person={person} t={t} onPress={() => navigation.navigate('StudentDetail', { id: person.id })} />
            ))}
          </View>
        );
      })}
      {(!isAdmin || tab === 'students') && !isAdmin && ungrouped.length > 0 && (
        <View style={styles.groupSection}>
          <Text style={[styles.groupName, { color: t.textSecondary }]}>Без группы</Text>
          {ungrouped.map(person => (
            <StudentCard key={person.id} person={person} t={t} onPress={() => navigation.navigate('StudentDetail', { id: person.id })} />
          ))}
        </View>
      )}

      {/* Admin flat students */}
      {isAdmin && tab === 'students' && filteredStudents.map(person => (
        <StudentCard key={person.id} person={person} t={t} onPress={() => navigation.navigate('StudentDetail', { id: person.id })} />
      ))}

      {filteredStudents.length === 0 && (!isAdmin || tab === 'students') && (
        <Text style={[styles.empty, { color: t.textMuted }]}>{search ? 'Никого не найдено' : 'Список пуст'}</Text>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  tabBar: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4, marginBottom: 12 },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 14, fontWeight: '700' },
  subtext: { fontSize: 12, marginTop: 2 },
  indicators: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  beltDot: { width: 16, height: 8, borderRadius: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  groupSection: { marginBottom: 16 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  groupName: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  groupSchedule: { fontSize: 10, fontWeight: '500' },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});
