import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Linking,
  Modal as RNModal, StyleSheet, Dimensions,
} from 'react-native';
import {
  Search, UserPlus, Plus, Phone, MessageCircle, X,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';

const BELT_COLORS = {
  'Белый': '#e5e5e5',
  'Синий': '#3b82f6',
  'Фиолетовый': '#8b5cf6',
  'Коричневый': '#92400e',
  'Черный': '#1a1a1a',
};

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function cleanPhone(phone) {
  return (phone || '').replace(/[^\d+]/g, '');
}

function StudentCard({ person, dark, onPress, showClub }) {
  const expired = isExpired(person.subscriptionExpiresAt);

  return (
    <GlassCard onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar name={person.name} src={person.avatar} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}
          >
            {person.name}
          </Text>
          {person.status ? <StatusBadge status={person.status} /> : null}
        </View>
        <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', marginTop: 2 }}>
          {showClub || person.belt || '—'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {person.belt ? (
          <View
            style={{
              width: 16, height: 8, borderRadius: 4,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
              backgroundColor: BELT_COLORS[person.belt] || '#888',
            }}
          />
        ) : null}
        <View
          style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: expired ? '#ef4444' : '#22c55e',
          }}
        />
      </View>
    </GlassCard>
  );
}

function StudentTeamView({ auth, data, dark, navigation }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const student = data.students.find(s => s.id === auth.studentId);
  const teammates = data.students.filter(s => s.groupId === student?.groupId && s.id !== auth.studentId);
  const group = data.groups.find(g => g.id === student?.groupId);

  const filtered = teammates.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title="Моя команда" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {group ? (
          <GlassCard>
            <Text style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}>
              {group.name}
            </Text>
            <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', marginTop: 2 }}>
              {group.schedule}
            </Text>
          </GlassCard>
        ) : null}

        {/* Search */}
        <View style={{ position: 'relative' }}>
          <Search
            size={16}
            color={dark ? 'rgba(255,255,255,0.3)' : '#6b7280'}
            style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
          />
          <TextInput
            placeholder="Поиск..."
            placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
            value={search}
            onChangeText={setSearch}
            style={{
              paddingLeft: 40, paddingRight: 16, paddingVertical: 10,
              borderRadius: 16, fontSize: 14,
              backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
              color: dark ? '#fff' : '#111',
            }}
          />
        </View>

        {/* Teammates list */}
        <View style={{ gap: 8 }}>
          {filtered.map(s => (
            <GlassCard
              key={s.id}
              onPress={() => setSelected(s)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar name={s.name} src={s.avatar} size={48} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontWeight: '600', fontSize: 14, color: dark ? '#fff' : '#111' }}
                  >
                    {s.name}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', marginTop: 2 }}>
                  {s.belt || '—'}
                </Text>
              </View>
              <View style={{ flexShrink: 0 }}>
                {s.status ? <StatusBadge status={s.status} /> : null}
              </View>
            </GlassCard>
          ))}
          {filtered.length === 0 && (
            <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 14, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
              Нет одногруппников
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Teammate detail modal */}
      <RNModal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
        statusBarTranslucent
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setSelected(null)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 320, borderRadius: 28, overflow: 'hidden',
              backgroundColor: dark ? 'rgba(9,9,11,0.95)' : 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)',
            }}
          >
            {selected && (
              <>
                <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16 }}>
                  <Avatar name={selected.name} src={selected.avatar} size={120} />
                </View>
                <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 12 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: dark ? '#fff' : '#111' }}>
                      {selected.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', marginTop: 2 }}>
                      {selected.belt || '—'}
                    </Text>
                  </View>

                  {selected.status ? (
                    <StatusBadge status={selected.status} />
                  ) : null}

                  {selected.phone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Phone size={14} color={dark ? 'rgba(255,255,255,0.6)' : '#6b7280'} />
                      <Text style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>
                        {selected.phone}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 8, paddingTop: 8, width: '100%' }}>
                    {selected.phone ? (
                      <Pressable
                        onPress={() => Linking.openURL(`https://wa.me/${cleanPhone(selected.phone)}`)}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 10, borderRadius: 14,
                          backgroundColor: '#16a34a',
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                          opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                        })}
                      >
                        <MessageCircle size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>WhatsApp</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => setSelected(null)}
                      style={({ pressed }) => ({
                        flex: 1, paddingVertical: 10, borderRadius: 14,
                        backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                        borderWidth: 1,
                        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                      })}
                    >
                      <X size={16} color={dark ? '#fff' : '#111'} />
                      <Text style={{ color: dark ? '#fff' : '#111', fontWeight: '700', fontSize: 14 }}>
                        Закрыть
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </RNModal>
    </View>
  );
}

export default function TeamScreen({ navigation }) {
  const { auth } = useAuth();
  const { data } = useData();
  const { dark } = useTheme();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('students');

  if (auth.role === 'student') {
    return <StudentTeamView auth={auth} data={data} dark={dark} navigation={navigation} />;
  }

  const isAdmin = auth.role === 'superadmin';
  const trainers = data.users.filter(u => u.role === 'trainer');
  const students = isAdmin
    ? data.students
    : data.students.filter(s => s.trainerId === auth.userId);
  const myGroups = isAdmin
    ? data.groups
    : data.groups.filter(g => g.trainerId === auth.userId);

  const filteredTrainers = trainers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.clubName || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group students by group for trainer view
  const studentsByGroup = myGroups.map(g => ({
    group: g,
    students: filteredStudents.filter(s => s.groupId === g.id),
  }));
  const ungrouped = filteredStudents.filter(
    s => !s.groupId || !myGroups.find(g => g.id === s.groupId)
  );

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title={isAdmin ? 'Люди' : 'Команда'}>
        {auth.role === 'trainer' && (
          <Pressable
            onPress={() => navigation.navigate('AddStudent')}
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <UserPlus size={20} color={dark ? '#fff' : '#111'} />
          </Pressable>
        )}
        {isAdmin && (
          <Pressable
            onPress={() => navigation.navigate('AddTrainer')}
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <Plus size={20} color={dark ? '#fff' : '#111'} />
          </Pressable>
        )}
      </PageHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search bar */}
        <View style={{ position: 'relative' }}>
          <Search
            size={16}
            color={dark ? 'rgba(255,255,255,0.3)' : '#6b7280'}
            style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
          />
          <TextInput
            placeholder="Поиск по имени..."
            placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
            value={search}
            onChangeText={setSearch}
            style={{
              paddingLeft: 40, paddingRight: 16, paddingVertical: 10,
              borderRadius: 16, fontSize: 14,
              backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
              color: dark ? '#fff' : '#111',
            }}
          />
        </View>

        {/* Admin tabs */}
        {isAdmin && (
          <View
            style={{
              flexDirection: 'row', borderRadius: 16, padding: 4,
              backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
            }}
          >
            {[
              { key: 'students', label: `Спортсмены (${filteredStudents.length})` },
              { key: 'trainers', label: `Тренеры (${filteredTrainers.length})` },
            ].map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
                  backgroundColor: tab === key
                    ? (dark ? 'rgba(255,255,255,0.12)' : '#fff')
                    : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 12, fontWeight: '600',
                    color: tab === key
                      ? (dark ? '#fff' : '#111')
                      : (dark ? 'rgba(255,255,255,0.4)' : '#6b7280'),
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Admin trainers list */}
        {isAdmin && tab === 'trainers' && (
          <View style={{ gap: 8 }}>
            {filteredTrainers.map(person => {
              const count = data.students.filter(s => s.trainerId === person.id).length;
              return (
                <GlassCard
                  key={person.id}
                  onPress={() => navigation.navigate('TrainerDetail', { trainerId: person.id })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <Avatar name={person.name} src={person.avatar} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}
                    >
                      {person.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', marginTop: 2 }}>
                      {person.clubName}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                    {count} чел.
                  </Text>
                </GlassCard>
              );
            })}
            {filteredTrainers.length === 0 && (
              <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 14, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                {search ? 'Никого не найдено' : 'Список пуст'}
              </Text>
            )}
          </View>
        )}

        {/* Admin students list (flat) */}
        {isAdmin && tab === 'students' && (
          <View style={{ gap: 8 }}>
            {filteredStudents.map(person => {
              const trainerName = data.users.find(u => u.id === person.trainerId)?.clubName;
              return (
                <StudentCard
                  key={person.id}
                  person={person}
                  dark={dark}
                  onPress={() => navigation.navigate('StudentDetail', { studentId: person.id })}
                  showClub={trainerName}
                />
              );
            })}
            {filteredStudents.length === 0 && (
              <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 14, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                {search ? 'Никого не найдено' : 'Список пуст'}
              </Text>
            )}
          </View>
        )}

        {/* Trainer students - grouped by group */}
        {!isAdmin && (
          <View style={{ gap: 20 }}>
            {studentsByGroup.map(({ group, students: groupStudents }) => {
              if (groupStudents.length === 0) return null;
              return (
                <View key={group.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: '700', color: dark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
                      {group.name}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '500', color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                      {group.schedule}
                    </Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {groupStudents.map(person => (
                      <StudentCard
                        key={person.id}
                        person={person}
                        dark={dark}
                        onPress={() => navigation.navigate('StudentDetail', { studentId: person.id })}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
            {ungrouped.length > 0 && (
              <View>
                <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: '700', color: dark ? 'rgba(255,255,255,0.5)' : '#6b7280', marginBottom: 8 }}>
                  Без группы
                </Text>
                <View style={{ gap: 8 }}>
                  {ungrouped.map(person => (
                    <StudentCard
                      key={person.id}
                      person={person}
                      dark={dark}
                      onPress={() => navigation.navigate('StudentDetail', { studentId: person.id })}
                    />
                  ))}
                </View>
              </View>
            )}
            {filteredStudents.length === 0 && (
              <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 14, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                {search ? 'Никого не найдено' : 'Нет спортсменов'}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
