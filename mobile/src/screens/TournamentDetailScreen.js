import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Calendar, MapPin, Trash2, Edit3, Flame, X, Users, Camera, Trophy,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import DateButton from '../components/DateButton';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TournamentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { auth } = useAuth();
  const { data, deleteTournament, updateTournament, update } = useData();
  const { dark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const tournament = data.tournaments.find(t => t.id === id);

  if (!tournament) {
    return (
      <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
        <PageHeader title="Турнир" back />
        <View style={{ paddingHorizontal: 16, paddingVertical: 48, alignItems: 'center' }}>
          <Trophy size={48} color={dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} style={{ opacity: 0.3 }} />
          <Text style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', fontSize: 14, marginTop: 12 }}>Турнир не найден</Text>
        </View>
      </View>
    );
  }

  const regs = (data.tournamentRegistrations || []).filter(r => r.tournamentId === id);
  const isRegistered = auth.role === 'student' && regs.some(r => r.studentId === auth.studentId);
  const isPast = new Date(tournament.date) < new Date();

  const trainerStudentIds = auth.role === 'trainer'
    ? data.students.filter(s => s.trainerId === auth.userId).map(s => s.id)
    : [];
  const trainerRegs = auth.role === 'trainer'
    ? regs.filter(r => trainerStudentIds.includes(r.studentId))
    : [];

  const handleDelete = () => {
    Alert.alert('Удалить турнир?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => { deleteTournament(tournament.id); navigation.goBack(); } },
    ]);
  };

  const startEdit = () => {
    setForm({ ...tournament });
    setEditing(true);
  };

  const saveEdit = () => {
    updateTournament(tournament.id, {
      title: form.title,
      date: form.date,
      location: form.location,
      description: form.description,
      coverImage: form.coverImage,
    });
    setEditing(false);
  };

  const handleEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const url = await api.uploadFile({ uri: result.assets[0].uri, type: 'image/jpeg', name: 'cover.jpg' });
        setForm(f => ({ ...f, coverImage: url }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const toggleRegistration = () => {
    update(d => {
      const r = d.tournamentRegistrations || [];
      const exists = r.find(x => x.tournamentId === id && x.studentId === auth.studentId);
      return {
        ...d,
        tournamentRegistrations: exists
          ? r.filter(x => !(x.tournamentId === id && x.studentId === auth.studentId))
          : [...r, { tournamentId: id, studentId: auth.studentId }],
      };
    });
  };

  const labelColor = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
  const inputStyle = {
    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
    fontSize: 16,
    backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.70)',
    borderWidth: 1,
    borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)',
    color: dark ? '#fff' : '#111',
  };

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title="Турнир" back>
        {auth.role === 'superadmin' && (
          <>
            <Pressable onPress={startEdit} style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
              <Edit3 size={18} color={dark ? '#fff' : '#111'} />
            </Pressable>
            <Pressable onPress={handleDelete} style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
              <Trash2 size={18} color="#f87171" />
            </Pressable>
          </>
        )}
      </PageHeader>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        {tournament.coverImage ? (
          <Image source={{ uri: tournament.coverImage }} style={{ width: '100%', height: 200, borderRadius: 24 }} contentFit="cover" />
        ) : (
          <View style={{ width: '100%', height: 176, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)' }}>
            <Text style={{ fontSize: 48, fontWeight: '900', fontStyle: 'italic', color: '#dc2626', opacity: 0.2 }}>FIGHT</Text>
          </View>
        )}

        {/* Title */}
        <Text style={{ fontSize: 24, fontWeight: '900', fontStyle: 'italic', color: dark ? '#fff' : '#111' }}>
          {tournament.title}
        </Text>

        {/* Date & Location */}
        <View style={{ gap: 8 }}>
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Calendar size={18} color="#dc2626" />
              <Text style={{ fontSize: 14, color: dark ? '#fff' : '#111' }}>{formatDate(tournament.date)}</Text>
            </View>
          </GlassCard>
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MapPin size={18} color="#dc2626" />
              <Text style={{ fontSize: 14, color: dark ? '#fff' : '#111' }}>{tournament.location}</Text>
            </View>
          </GlassCard>
        </View>

        {/* Student registration */}
        {auth.role === 'student' && !isPast && (
          <Pressable
            onPress={toggleRegistration}
            style={({ pressed }) => ({
              width: '100%', paddingVertical: 16, borderRadius: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
              shadowColor: isRegistered ? '#f97316' : '#dc2626',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
              ...(isRegistered
                ? { backgroundColor: 'rgba(249,115,22,0.2)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)' }
                : { backgroundColor: '#dc2626' }),
            })}
          >
            {isRegistered
              ? <><X size={20} color="#fb923c" /><Text style={{ fontWeight: '700', fontSize: 16, color: '#fb923c' }}>Отменить участие</Text></>
              : <><Flame size={20} color="#fff" /><Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>Хочу зажать!</Text></>
            }
          </Pressable>
        )}

        {/* Trainer: registered students */}
        {auth.role === 'trainer' && trainerRegs.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Flame size={14} color="#fb923c" />
              <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: '700', color: labelColor }}>
                Хотят участвовать ({trainerRegs.length})
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {trainerRegs.map(r => {
                const s = data.students.find(st => st.id === r.studentId);
                if (!s) return null;
                return (
                  <GlassCard key={r.studentId}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Avatar name={s.name} src={s.avatar} size={36} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontWeight: '600', fontSize: 14, color: dark ? '#fff' : '#111' }} numberOfLines={1}>{s.name}</Text>
                        <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)' }}>
                          {s.belt || '—'} {'—'} {s.weight ? s.weight + ' кг' : ''}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>
        )}

        {/* Total regs */}
        {regs.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="#fb923c" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: dark ? '#fff' : '#111' }}>
                {regs.length} чел. хотят участвовать
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Description */}
        {tournament.description ? (
          <GlassCard>
            <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: '700', color: labelColor, marginBottom: 8 }}>Описание</Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
              {tournament.description}
            </Text>
          </GlassCard>
        ) : null}
      </ScrollView>

      {/* Edit Modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Редактировать турнир">
        {form && (
          <View style={{ gap: 12 }}>
            {/* Cover upload */}
            <Pressable
              onPress={handleEditImage}
              style={{
                width: '100%', height: 128, borderRadius: 16, overflow: 'hidden',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                borderWidth: 1, borderStyle: 'dashed',
                borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              }}
            >
              {form.coverImage
                ? <Image source={{ uri: form.coverImage }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                : <><Camera size={24} color={dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)'} /><Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)', marginTop: 4 }}>Обложка</Text></>
              }
            </Pressable>

            <TextInput
              placeholder="Название"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}
              value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
              style={inputStyle}
            />
            <DateButton label="Дата" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <TextInput
              placeholder="Место"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}
              value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))}
              style={inputStyle}
            />
            <TextInput
              placeholder="Описание"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}
              value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))}
              style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]}
              multiline numberOfLines={3}
            />
            <Pressable
              onPress={saveEdit}
              style={({ pressed }) => ({
                width: '100%', paddingVertical: 14, borderRadius: 16,
                backgroundColor: '#dc2626', alignItems: 'center',
                opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
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
