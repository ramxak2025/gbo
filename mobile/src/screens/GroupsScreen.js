import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Alert, Switch,
} from 'react-native';
import {
  Plus, Trash2, Edit3, ClipboardList, Dumbbell,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';

const SPORT_TYPES = [
  { id: 'bjj', label: 'BJJ' },
  { id: 'grappling', label: 'Грэпплинг' },
  { id: 'freestyle', label: 'Вольная борьба' },
  { id: 'grecoroman', label: 'Греко-римская' },
  { id: 'sambo', label: 'Самбо' },
  { id: 'judo', label: 'Дзюдо' },
  { id: 'mma', label: 'ММА' },
];

function getSportLabel(sportType) {
  return SPORT_TYPES.find(s => s.id === sportType)?.label || sportType || '—';
}

export default function GroupsScreen({ navigation }) {
  const { auth } = useAuth();
  const { data, addGroup, updateGroup, deleteGroup } = useData();
  const { dark } = useTheme();

  const [showAdd, setShowAdd] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [form, setForm] = useState({ name: '', schedule: '', subscriptionCost: '', sportType: '' });

  const myGroups = data.groups.filter(g => g.trainerId === auth.userId);
  const trainerUser = data.users.find(u => u.id === auth.userId);
  const trainerSports = trainerUser?.sportTypes?.length > 0
    ? trainerUser.sportTypes
    : trainerUser?.sportType ? [trainerUser.sportType] : [];

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addGroup({
      trainerId: auth.userId,
      name: form.name.trim(),
      schedule: form.schedule.trim(),
      subscriptionCost: parseInt(form.subscriptionCost) || 5000,
      sportType: form.sportType || trainerSports[0] || null,
    });
    setForm({ name: '', schedule: '', subscriptionCost: '', sportType: '' });
    setShowAdd(false);
  };

  const handleEdit = () => {
    if (!editGroup) return;
    updateGroup(editGroup.id, {
      name: editGroup.name,
      schedule: editGroup.schedule,
      subscriptionCost: parseInt(editGroup.subscriptionCost) || 5000,
      sportType: editGroup.sportType || null,
    });
    setEditGroup(null);
  };

  const handleDelete = (id) => {
    const studentCount = data.students.filter(s => s.groupId === id).length;
    if (studentCount > 0) {
      Alert.alert(
        'Удалить группу?',
        `В группе ${studentCount} учеников. Они будут откреплены. Удалить?`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Удалить', style: 'destructive', onPress: () => deleteGroup(id) },
        ]
      );
    } else {
      deleteGroup(id);
    }
  };

  const inputStyle = {
    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, fontSize: 16,
    backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
    color: dark ? '#fff' : '#111',
  };

  const renderSportButtons = (selectedSport, onSelect) => {
    if (trainerSports.length <= 1) return null;
    return (
      <View>
        <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: '600', marginBottom: 8, color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280' }}>
          Вид спорта
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {trainerSports.map(sId => {
            const active = selectedSport === sId || (!selectedSport && sId === trainerSports[0]);
            return (
              <Pressable
                key={sId}
                onPress={() => onSelect(sId)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
                  backgroundColor: active ? '#dc2626' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)'),
                  borderWidth: active ? 0 : 1,
                  borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                  opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: active ? '#fff' : (dark ? 'rgba(255,255,255,0.5)' : '#6b7280'),
                }}>
                  {getSportLabel(sId)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title="Группы" back>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}
        >
          <Plus size={20} color={dark ? '#fff' : '#111'} />
        </Pressable>
      </PageHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {myGroups.map(g => {
          const count = data.students.filter(s => s.groupId === g.id).length;
          return (
            <GlassCard key={g.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}>
                    {g.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', marginTop: 2 }}>
                    {g.schedule}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                      {count} чел. — {g.subscriptionCost?.toLocaleString('ru-RU')} ₽/мес
                    </Text>
                    {g.sportType ? (
                      <View style={{
                        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                        backgroundColor: dark ? 'rgba(220,38,38,0.15)' : 'rgba(254,242,242,1)',
                      }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: dark ? '#fca5a5' : '#dc2626' }}>
                          {getSportLabel(g.sportType)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {g.attendanceEnabled ? (
                    <Pressable
                      onPress={() => navigation.navigate('Attendance', { groupId: g.id })}
                      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
                    >
                      <ClipboardList size={16} color="#4ade80" />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => setEditGroup({ ...g })}
                    style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Edit3 size={16} color={dark ? 'rgba(255,255,255,0.4)' : '#6b7280'} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(g.id)}
                    style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Trash2 size={16} color="#f87171" />
                  </Pressable>
                </View>
              </View>
              {/* Attendance toggle */}
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 8, paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280' }}>
                  Учёт посещаемости
                </Text>
                <Pressable
                  onPress={() => updateGroup(g.id, { attendanceEnabled: !g.attendanceEnabled })}
                  style={({ pressed }) => ({
                    width: 44, height: 24, borderRadius: 12,
                    backgroundColor: g.attendanceEnabled ? '#22c55e' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                    opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: '#fff',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
                      transform: [{ translateX: g.attendanceEnabled ? 20 : 0 }],
                    }}
                  />
                </Pressable>
              </View>
            </GlassCard>
          );
        })}
        {myGroups.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Dumbbell size={48} color={dark ? 'rgba(255,255,255,0.2)' : '#d1d5db'} style={{ opacity: 0.3 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280', marginTop: 12 }}>
              Нет групп
            </Text>
            <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.2)' : '#9ca3af', marginTop: 4 }}>
              Нажмите + чтобы создать
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новая группа">
        <View style={{ gap: 12 }}>
          <TextInput
            placeholder="Название (напр. Утро 09:00)"
            placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
            style={inputStyle}
          />
          <TextInput
            placeholder="Расписание (напр. Пн, Ср, Пт — 09:00)"
            placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
            value={form.schedule}
            onChangeText={v => setForm(f => ({ ...f, schedule: v }))}
            style={inputStyle}
          />
          <TextInput
            placeholder="Стоимость абонемента (₽)"
            placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
            value={form.subscriptionCost}
            onChangeText={v => setForm(f => ({ ...f, subscriptionCost: v }))}
            keyboardType="numeric"
            style={inputStyle}
          />
          {renderSportButtons(form.sportType, sId => setForm(f => ({ ...f, sportType: sId })))}
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => ({
              width: '100%', paddingVertical: 14, borderRadius: 16,
              backgroundColor: '#dc2626', alignItems: 'center',
              opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Создать группу</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editGroup} onClose={() => setEditGroup(null)} title="Редактировать">
        {editGroup && (
          <View style={{ gap: 12 }}>
            <TextInput
              placeholder="Название"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
              value={editGroup.name}
              onChangeText={v => setEditGroup(g => ({ ...g, name: v }))}
              style={inputStyle}
            />
            <TextInput
              placeholder="Расписание"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
              value={editGroup.schedule}
              onChangeText={v => setEditGroup(g => ({ ...g, schedule: v }))}
              style={inputStyle}
            />
            <TextInput
              placeholder="Стоимость"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
              value={String(editGroup.subscriptionCost)}
              onChangeText={v => setEditGroup(g => ({ ...g, subscriptionCost: v }))}
              keyboardType="numeric"
              style={inputStyle}
            />
            {renderSportButtons(editGroup.sportType, sId => setEditGroup(g => ({ ...g, sportType: sId })))}
            <Pressable
              onPress={handleEdit}
              style={({ pressed }) => ({
                width: '100%', paddingVertical: 14, borderRadius: 16,
                backgroundColor: '#dc2626', alignItems: 'center',
                opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Сохранить</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </View>
  );
}
