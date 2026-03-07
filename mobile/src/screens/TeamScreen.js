import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  StyleSheet,
} from 'react-native';
import {
  Search,
  Plus,
  UserPlus,
  Phone,
  MessageCircle,
  X,
  Thermometer,
  HeartCrack,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

const BELT_COLORS = {
  '\u0411\u0435\u043b\u044b\u0439': '#e5e5e5',
  '\u0421\u0438\u043d\u0438\u0439': '#3b82f6',
  '\u0424\u0438\u043e\u043b\u0435\u0442\u043e\u0432\u044b\u0439': '#8b5cf6',
  '\u041a\u043e\u0440\u0438\u0447\u043d\u0435\u0432\u044b\u0439': '#92400e',
  '\u0427\u0451\u0440\u043d\u044b\u0439': '#1a1a1a',
};

const STATUS_CONFIG = {
  sick: { label: '\u0411\u043e\u043b\u0435\u0435\u0442', Icon: Thermometer, color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  injury: { label: '\u0422\u0440\u0430\u0432\u043c\u0430', Icon: HeartCrack, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  skip: { label: '\u0421\u0430\u0447\u043e\u043a', Icon: Zap, color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const { Icon, label, color, bg } = cfg;
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Icon size={10} color={color} />
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function StudentCard({ person, c, onPress, showClub }) {
  const expired = isExpired(person.subscriptionExpiresAt);
  return (
    <GlassCard onPress={onPress} style={styles.studentCard}>
      <Avatar src={person.avatar} name={person.name} size={44} />
      <View style={styles.studentInfo}>
        <View style={styles.studentNameRow}>
          <Text style={[styles.studentName, { color: c.text }]} numberOfLines={1}>
            {person.name}
          </Text>
          {person.status ? <StatusBadge status={person.status} /> : null}
        </View>
        <Text style={[styles.studentSub, { color: c.textSecondary }]} numberOfLines={1}>
          {showClub || person.belt || '\u2014'}
        </Text>
      </View>
      <View style={styles.studentIndicators}>
        {person.belt ? (
          <View
            style={[
              styles.beltDot,
              { backgroundColor: BELT_COLORS[person.belt] || '#888' },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.subDot,
            { backgroundColor: expired ? '#ef4444' : '#22c55e' },
          ]}
        />
      </View>
    </GlassCard>
  );
}

function StudentTeamView({ auth, data, c, dark, navigation }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const student = useMemo(
    () => data.students.find((s) => s.id === auth.studentId),
    [data.students, auth.studentId],
  );
  const group = useMemo(
    () => data.groups.find((g) => g.id === student?.groupId),
    [data.groups, student?.groupId],
  );
  const teammates = useMemo(
    () =>
      data.students.filter(
        (s) => s.groupId === student?.groupId && s.id !== auth.studentId,
      ),
    [data.students, student?.groupId, auth.studentId],
  );

  const filtered = useMemo(
    () =>
      teammates.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [teammates, search],
  );

  const cleanPhone = (phone) => phone?.replace(/[^\d+]/g, '') || '';

  return (
    <View style={styles.flex1}>
      <PageHeader title={'\u041c\u043e\u044f \u043a\u043e\u043c\u0430\u043d\u0434\u0430'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {group && (
          <GlassCard style={styles.groupInfoCard}>
            <Text style={[styles.groupInfoName, { color: c.text }]}>
              {group.name}
            </Text>
            <Text style={[styles.groupInfoSchedule, { color: c.textSecondary }]}>
              {group.schedule}
            </Text>
          </GlassCard>
        )}

        <View style={styles.searchWrap}>
          <Search
            size={16}
            color={c.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: c.inputBg,
                borderColor: c.inputBorder,
                color: c.text,
              },
            ]}
            value={search}
            onChangeText={setSearch}
            placeholder={'\u041f\u043e\u0438\u0441\u043a...'}
            placeholderTextColor={c.textTertiary}
          />
        </View>

        <View style={styles.listGap}>
          {filtered.map((s) => (
            <GlassCard
              key={s.id}
              onPress={() => setSelected(s)}
              style={styles.studentCard}
            >
              <Avatar src={s.avatar} name={s.name} size={48} />
              <View style={styles.studentInfo}>
                <Text
                  style={[styles.studentName, { color: c.text }]}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
                <Text style={[styles.studentSub, { color: c.textSecondary }]}>
                  {s.belt || '\u2014'}
                </Text>
              </View>
              <View style={styles.studentIndicators}>
                {s.status ? <StatusBadge status={s.status} /> : null}
              </View>
            </GlassCard>
          ))}
          {filtered.length === 0 && (
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>
              {'\u041d\u0435\u0442 \u043e\u0434\u043d\u043e\u0433\u0440\u0443\u043f\u043f\u043d\u0438\u043a\u043e\u0432'}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Teammate detail modal */}
      <Modal
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
      >
        {selected && (
          <View style={styles.modalContent}>
            <View style={styles.modalAvatarWrap}>
              <Avatar src={selected.avatar} name={selected.name} size={120} />
            </View>
            <Text style={[styles.modalName, { color: c.text }]}>
              {selected.name}
            </Text>
            <Text style={[styles.modalBelt, { color: c.textSecondary }]}>
              {selected.belt || '\u2014'}
            </Text>

            {selected.status ? (
              <View style={styles.modalStatusWrap}>
                <StatusBadge status={selected.status} />
              </View>
            ) : null}

            {selected.phone ? (
              <View style={styles.modalPhoneRow}>
                <Phone size={14} color={c.textSecondary} />
                <Text style={[styles.modalPhone, { color: c.textSecondary }]}>
                  {selected.phone}
                </Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              {selected.phone ? (
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${cleanPhone(selected.phone)}`,
                    )
                  }
                >
                  <MessageCircle size={16} color="#fff" />
                  <Text style={styles.waBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.closeModalBtn,
                  {
                    backgroundColor: c.inputBg,
                    borderColor: c.inputBorder,
                  },
                ]}
                onPress={() => setSelected(null)}
              >
                <X size={16} color={c.text} />
                <Text style={[styles.closeModalBtnText, { color: c.text }]}>
                  {'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

export default function TeamScreen({ navigation }) {
  const { auth } = useAuth();
  const { data } = useData();
  const { dark } = useTheme();
  const c = getColors(dark);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('students');

  if (auth?.role === 'student') {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <StudentTeamView
          auth={auth}
          data={data}
          c={c}
          dark={dark}
          navigation={navigation}
        />
      </View>
    );
  }

  const isAdmin = auth?.role === 'superadmin';
  const trainers = data.users.filter((u) => u.role === 'trainer');
  const students = isAdmin
    ? data.students
    : data.students.filter((s) => s.trainerId === auth?.userId);
  const myGroups = isAdmin
    ? data.groups
    : data.groups.filter((g) => g.trainerId === auth?.userId);

  const filteredTrainers = trainers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.clubName?.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const studentsByGroup = myGroups.map((g) => ({
    group: g,
    students: filteredStudents.filter((s) => s.groupId === g.id),
  }));
  const ungrouped = filteredStudents.filter(
    (s) => !s.groupId || !myGroups.find((g) => g.id === s.groupId),
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title={isAdmin ? '\u041b\u044e\u0434\u0438' : '\u041a\u043e\u043c\u0430\u043d\u0434\u0430'}>
        {auth?.role === 'trainer' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AddStudent')}
            style={styles.headerBtn}
          >
            <UserPlus size={20} color={c.text} />
          </TouchableOpacity>
        )}
        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AddTrainer')}
            style={styles.headerBtn}
          >
            <Plus size={20} color={c.text} />
          </TouchableOpacity>
        )}
      </PageHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Search size={16} color={c.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: c.inputBg,
                borderColor: c.inputBorder,
                color: c.text,
              },
            ]}
            value={search}
            onChangeText={setSearch}
            placeholder={'\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0438\u043c\u0435\u043d\u0438...'}
            placeholderTextColor={c.textTertiary}
          />
        </View>

        {/* Admin tab switcher */}
        {isAdmin && (
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: c.inputBg, borderColor: c.inputBorder },
            ]}
          >
            {[
              {
                key: 'students',
                label: `\u0421\u043f\u043e\u0440\u0442\u0441\u043c\u0435\u043d\u044b (${filteredStudents.length})`,
              },
              {
                key: 'trainers',
                label: `\u0422\u0440\u0435\u043d\u0435\u0440\u044b (${filteredTrainers.length})`,
              },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setTab(key)}
                style={[
                  styles.tab,
                  tab === key && {
                    backgroundColor: dark
                      ? 'rgba(255,255,255,0.12)'
                      : '#ffffff',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        tab === key ? c.text : c.textSecondary,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Admin trainers list */}
        {isAdmin && tab === 'trainers' && (
          <View style={styles.listGap}>
            {filteredTrainers.map((person) => {
              const count = data.students.filter(
                (s) => s.trainerId === person.id,
              ).length;
              return (
                <GlassCard
                  key={person.id}
                  onPress={() =>
                    navigation.navigate('TrainerDetail', { id: person.id })
                  }
                  style={styles.studentCard}
                >
                  <Avatar
                    src={person.avatar}
                    name={person.name}
                    size={44}
                  />
                  <View style={styles.studentInfo}>
                    <Text
                      style={[styles.studentName, { color: c.text }]}
                      numberOfLines={1}
                    >
                      {person.name}
                    </Text>
                    <Text
                      style={[
                        styles.studentSub,
                        { color: c.textSecondary },
                      ]}
                    >
                      {person.clubName || '\u2014'}
                    </Text>
                  </View>
                  <Text style={[styles.trainerCount, { color: c.textTertiary }]}>
                    {count} \u0447\u0435\u043b.
                  </Text>
                </GlassCard>
              );
            })}
            {filteredTrainers.length === 0 && (
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>
                {search
                  ? '\u041d\u0438\u043a\u043e\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e'
                  : '\u0421\u043f\u0438\u0441\u043e\u043a \u043f\u0443\u0441\u0442'}
              </Text>
            )}
          </View>
        )}

        {/* Admin students list (flat) */}
        {isAdmin && tab === 'students' && (
          <View style={styles.listGap}>
            {filteredStudents.map((person) => {
              const trainerName = data.users.find(
                (u) => u.id === person.trainerId,
              )?.clubName;
              return (
                <StudentCard
                  key={person.id}
                  person={person}
                  c={c}
                  onPress={() =>
                    navigation.navigate('StudentDetail', { id: person.id })
                  }
                  showClub={trainerName}
                />
              );
            })}
            {filteredStudents.length === 0 && (
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>
                {search
                  ? '\u041d\u0438\u043a\u043e\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e'
                  : '\u0421\u043f\u0438\u0441\u043e\u043a \u043f\u0443\u0441\u0442'}
              </Text>
            )}
          </View>
        )}

        {/* Trainer students - grouped by group */}
        {!isAdmin && (
          <View style={styles.groupedList}>
            {studentsByGroup.map(({ group, students: groupStudents }) => {
              if (groupStudents.length === 0) return null;
              return (
                <View key={group.id} style={styles.groupSection}>
                  <View style={styles.groupHeader}>
                    <Text
                      style={[styles.groupName, { color: c.textSecondary }]}
                    >
                      {group.name}
                    </Text>
                    <Text
                      style={[
                        styles.groupSchedule,
                        { color: c.textTertiary },
                      ]}
                    >
                      {group.schedule}
                    </Text>
                  </View>
                  <View style={styles.listGap}>
                    {groupStudents.map((person) => (
                      <StudentCard
                        key={person.id}
                        person={person}
                        c={c}
                        onPress={() =>
                          navigation.navigate('StudentDetail', {
                            id: person.id,
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              );
            })}
            {ungrouped.length > 0 && (
              <View style={styles.groupSection}>
                <Text
                  style={[styles.groupName, { color: c.textSecondary }]}
                >
                  {'\u0411\u0435\u0437 \u0433\u0440\u0443\u043f\u043f\u044b'}
                </Text>
                <View style={styles.listGap}>
                  {ungrouped.map((person) => (
                    <StudentCard
                      key={person.id}
                      person={person}
                      c={c}
                      onPress={() =>
                        navigation.navigate('StudentDetail', {
                          id: person.id,
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            )}
            {filteredStudents.length === 0 && (
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>
                {search
                  ? '\u041d\u0438\u043a\u043e\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e'
                  : '\u041d\u0435\u0442 \u0441\u043f\u043e\u0440\u0442\u0441\u043c\u0435\u043d\u043e\u0432'}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 36,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listGap: {
    gap: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  studentSub: {
    fontSize: 12,
    marginTop: 2,
  },
  studentIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  beltDot: {
    width: 16,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  subDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  trainerCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  groupedList: {
    gap: 20,
  },
  groupSection: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  groupSchedule: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
  },
  groupInfoCard: {
    marginBottom: 16,
  },
  groupInfoName: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupInfoSchedule: {
    fontSize: 12,
    marginTop: 4,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalAvatarWrap: {
    marginBottom: 16,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalBelt: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  modalStatusWrap: {
    marginTop: 12,
  },
  modalPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  modalPhone: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    width: '100%',
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#16a34a',
  },
  waBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
