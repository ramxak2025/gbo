import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';

const ROLE_TABS = [
  { id: 'students', label: 'Ученики', icon: 'people-outline' },
  { id: 'trainers', label: 'Тренеры', icon: 'school-outline' },
];

const STATUS_CONFIG = {
  sick: { label: 'Болеет', color: 'yellow', icon: 'medkit-outline' },
  injury: { label: 'Травма', color: 'red', icon: 'bandage-outline' },
  skip: { label: 'Пропуск', color: 'purple', icon: 'time-outline' },
};

export default function TeamScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, loading, reload } = useData();
  const navigation = useNavigation();
  const c = getColors(dark);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('students');
  const [refreshing, setRefreshing] = useState(false);

  const role = auth?.role;
  const isAdmin = role === 'superadmin' || role === 'club_admin' || role === 'club_owner';
  const isTrainer = role === 'trainer';
  const isStudent = role === 'student';

  const groups = data.groups || [];
  const students = data.students || [];
  const trainers = useMemo(() => (data.users || []).filter(u => u.role === 'trainer'), [data.users]);
  const studentGroups = data.studentGroups || [];

  const myStudentId = auth?.studentId;
  const myGroups = useMemo(() => {
    if (!isStudent || !myStudentId) return [];
    const myGroupIds = studentGroups.filter(sg => sg.studentId === myStudentId).map(sg => sg.groupId);
    return groups.filter(g => myGroupIds.includes(g.id));
  }, [isStudent, myStudentId, studentGroups, groups]);

  const teammates = useMemo(() => {
    if (!isStudent || !myStudentId) return [];
    const myGroupIds = studentGroups.filter(sg => sg.studentId === myStudentId).map(sg => sg.groupId);
    const teammateIds = new Set();
    studentGroups.forEach(sg => {
      if (myGroupIds.includes(sg.groupId) && sg.studentId !== myStudentId) {
        teammateIds.add(sg.studentId);
      }
    });
    return students.filter(s => teammateIds.has(s.id));
  }, [isStudent, myStudentId, studentGroups, students]);

  // For trainers: students grouped by group
  const studentsByGroup = useMemo(() => {
    if (!isTrainer) return [];
    return groups.map(g => {
      const groupStudentIds = studentGroups.filter(sg => sg.groupId === g.id).map(sg => sg.studentId);
      const groupStudents = students.filter(s => groupStudentIds.includes(s.id));
      return { group: g, students: groupStudents };
    }).filter(item => item.students.length > 0);
  }, [isTrainer, groups, studentGroups, students]);

  const searchFilter = useCallback((items) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => (item.name || '').toLowerCase().includes(q));
  }, [search]);

  const filteredStudents = useMemo(() => searchFilter(students), [students, searchFilter]);
  const filteredTrainers = useMemo(() => searchFilter(trainers), [trainers, searchFilter]);
  const filteredTeammates = useMemo(() => searchFilter(teammates), [teammates, searchFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const navigateToStudent = useCallback((id) => {
    navigation.navigate('StudentDetail', { id });
  }, [navigation]);

  const navigateToTrainer = useCallback((id) => {
    navigation.navigate('TrainerDetail', { id });
  }, [navigation]);

  const openWhatsApp = useCallback((phone) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    const whatsappNumber = cleaned.startsWith('8') ? '7' + cleaned.slice(1) : cleaned;
    Linking.openURL(`https://wa.me/${whatsappNumber}`);
  }, []);

  const renderStatusBadge = (status) => {
    const config = STATUS_CONFIG[status];
    if (!config) return null;
    const badgeBg = c[config.color + 'Bg'];
    const badgeColor = c[config.color];
    return (
      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
        <Ionicons name={config.icon} size={12} color={badgeColor} />
        <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{config.label}</Text>
      </View>
    );
  };

  const renderStudentCard = (student, showWhatsApp = false) => {
    const groupNames = studentGroups
      .filter(sg => sg.studentId === student.id)
      .map(sg => groups.find(g => g.id === sg.groupId)?.name)
      .filter(Boolean);

    return (
      <TouchableOpacity
        key={student.id}
        style={[styles.personCard, { borderBottomColor: c.border }]}
        onPress={() => navigateToStudent(student.id)}
        activeOpacity={0.7}
      >
        <Avatar name={student.name} photo={student.photo} size={44} />
        <View style={styles.personInfo}>
          <View style={styles.personNameRow}>
            <Text style={[styles.personName, { color: c.text }]} numberOfLines={1}>
              {student.name}
            </Text>
            {student.status && renderStatusBadge(student.status)}
          </View>
          {groupNames.length > 0 && (
            <Text style={[styles.personSub, { color: c.textSecondary }]} numberOfLines={1}>
              {groupNames.join(', ')}
            </Text>
          )}
          {student.phone && (
            <Text style={[styles.personPhone, { color: c.textTertiary }]}>{student.phone}</Text>
          )}
        </View>
        {showWhatsApp && student.phone ? (
          <TouchableOpacity
            style={[styles.whatsappButton, { backgroundColor: c.greenBg }]}
            onPress={() => openWhatsApp(student.phone)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color={c.green} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderTrainerCard = (trainer) => (
    <TouchableOpacity
      key={trainer.id}
      style={[styles.personCard, { borderBottomColor: c.border }]}
      onPress={() => navigateToTrainer(trainer.id)}
      activeOpacity={0.7}
    >
      <Avatar name={trainer.name} photo={trainer.photo} size={44} />
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: c.text }]} numberOfLines={1}>
          {trainer.name}
        </Text>
        {trainer.phone && (
          <Text style={[styles.personPhone, { color: c.textTertiary }]}>{trainer.phone}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
      <Ionicons name="search-outline" size={18} color={c.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: c.text }]}
        placeholder="Поиск..."
        placeholderTextColor={c.placeholder}
        value={search}
        onChangeText={setSearch}
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={() => setSearch('')}>
          <Ionicons name="close-circle" size={18} color={c.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Student view: show teammates from same groups
  const renderStudentView = () => (
    <View>
      {myGroups.map(group => {
        const groupTeammates = filteredTeammates.filter(t => {
          const tGroupIds = studentGroups.filter(sg => sg.studentId === t.id).map(sg => sg.groupId);
          return tGroupIds.includes(group.id);
        });
        if (groupTeammates.length === 0) return null;
        return (
          <View key={group.id} style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color={c.purple} />
              <Text style={[styles.groupTitle, { color: c.text }]}>{group.name}</Text>
              <View style={[styles.countBadge, { backgroundColor: c.purpleBg }]}>
                <Text style={[styles.countBadgeText, { color: c.purple }]}>{groupTeammates.length}</Text>
              </View>
            </View>
            <GlassCard style={styles.listCard}>
              {groupTeammates.map(s => renderStudentCard(s, true))}
            </GlassCard>
          </View>
        );
      })}
      {filteredTeammates.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={c.textTertiary} />
          <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет одногруппников</Text>
        </View>
      )}
    </View>
  );

  // Trainer view: students grouped by training group
  const renderTrainerView = () => (
    <View>
      {studentsByGroup.map(({ group, students: groupStudents }) => {
        const filtered = searchFilter(groupStudents);
        if (filtered.length === 0) return null;
        return (
          <View key={group.id} style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color={c.purple} />
              <Text style={[styles.groupTitle, { color: c.text }]}>{group.name}</Text>
              <View style={[styles.countBadge, { backgroundColor: c.purpleBg }]}>
                <Text style={[styles.countBadgeText, { color: c.purple }]}>{filtered.length}</Text>
              </View>
            </View>
            <GlassCard style={styles.listCard}>
              {filtered.map(s => renderStudentCard(s))}
            </GlassCard>
          </View>
        );
      })}
      {studentsByGroup.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={c.textTertiary} />
          <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет учеников</Text>
        </View>
      )}
    </View>
  );

  // Admin view: tabs for students/trainers
  const renderAdminView = () => (
    <View>
      <View style={styles.tabRow}>
        {ROLE_TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                { backgroundColor: active ? c.purple : c.glass, borderColor: active ? c.purple : c.glassBorder },
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.icon} size={16} color={active ? '#fff' : c.textSecondary} />
              <Text style={[styles.tabText, { color: active ? '#fff' : c.textSecondary }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'students' && (
        <View>
          <View style={styles.countRow}>
            <Text style={[styles.countLabel, { color: c.textSecondary }]}>
              Всего: {filteredStudents.length}
            </Text>
          </View>
          {filteredStudents.length > 0 ? (
            <GlassCard style={styles.listCard}>
              {filteredStudents.map(s => renderStudentCard(s))}
            </GlassCard>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={c.textTertiary} />
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет учеников</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'trainers' && (
        <View>
          <View style={styles.countRow}>
            <Text style={[styles.countLabel, { color: c.textSecondary }]}>
              Всего: {filteredTrainers.length}
            </Text>
          </View>
          {filteredTrainers.length > 0 ? (
            <GlassCard style={styles.listCard}>
              {filteredTrainers.map(t => renderTrainerCard(t))}
            </GlassCard>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={40} color={c.textTertiary} />
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет тренеров</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.purple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {renderSearchBar()}

        {isStudent && renderStudentView()}
        {isTrainer && renderTrainerView()}
        {isAdmin && renderAdminView()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countRow: {
    marginBottom: 8,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  personInfo: {
    flex: 1,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  personSub: {
    fontSize: 12,
    marginTop: 2,
  },
  personPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  whatsappButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
