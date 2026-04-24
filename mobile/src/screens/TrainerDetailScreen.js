import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Users, Dumbbell, MapPin, Phone, Crown, Key } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

export default function TrainerDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { auth } = useAuth();
  const { data } = useData();
  const { dark } = useTheme();
  const trainer = data.users?.find(u => u.id === id);
  const students = data.students?.filter(s => s.trainerId === id) || [];
  const groups = data.groups?.filter(g => g.trainerId === id) || [];
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  if (!trainer) return <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: t2 }}>Тренер не найден</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Тренер" back />
        <View style={{ paddingHorizontal: 16 }}>
          <GlassCard style={{ marginBottom: 16, alignItems: 'center', padding: 24 }}>
            <View style={{ borderWidth: 3, borderColor: trainer.isHeadTrainer ? 'rgba(251,191,36,0.4)' : 'rgba(139,92,246,0.4)', borderRadius: 44, padding: 3 }}>
              <Avatar src={trainer.avatar} name={trainer.name} size={72} />
            </View>
            {trainer.isHeadTrainer && <Crown size={16} color="#fbbf24" style={{ marginTop: 4 }} />}
            <Text style={{ fontSize: 22, fontWeight: '900', color: t, marginTop: 8 }}>{trainer.name}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.15)' }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>Тренер</Text></View>
              {trainer.isHeadTrainer && <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(251,191,36,0.15)' }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#fbbf24' }}>Главный</Text></View>}
            </View>
          </GlassCard>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}><Users size={18} color="#3b82f6" /><Text style={{ fontSize: 20, fontWeight: '800', color: t, marginTop: 4 }}>{students.length}</Text></View></GlassCard>
            <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}><Dumbbell size={18} color="#8b5cf6" /><Text style={{ fontSize: 20, fontWeight: '800', color: t, marginTop: 4 }}>{groups.length}</Text></View></GlassCard>
          </View>
          {trainer.phone && <GlassCard style={{ marginBottom: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Phone size={16} color="#3b82f6" /><Text style={{ fontSize: 14, color: t, marginLeft: 10 }}>{trainer.phone}</Text></View></GlassCard>}
          {trainer.city && <GlassCard style={{ marginBottom: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><MapPin size={16} color="#22c55e" /><Text style={{ fontSize: 14, color: t, marginLeft: 10 }}>{trainer.city}</Text></View></GlassCard>}
          {auth.role === 'superadmin' && trainer.plainPassword && <GlassCard style={{ marginBottom: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Key size={16} color="#fbbf24" /><Text style={{ fontSize: 14, color: t, marginLeft: 10 }}>{trainer.plainPassword}</Text></View></GlassCard>}
          {groups.length > 0 && <><Text style={{ fontSize: 16, fontWeight: '700', color: t, marginTop: 16, marginBottom: 10 }}>Группы</Text>{groups.map(g => <GlassCard key={g.id} style={{ marginBottom: 8 }}><Text style={{ fontSize: 14, fontWeight: '600', color: t }}>{g.name}</Text><Text style={{ fontSize: 12, color: t2 }}>{g.schedule} · {students.filter(s => s.groupId === g.id).length} чел.</Text></GlassCard>)}</>}
          {students.length > 0 && <><Text style={{ fontSize: 16, fontWeight: '700', color: t, marginTop: 16, marginBottom: 10 }}>Ученики</Text>{students.map(s => <GlassCard key={s.id} onPress={() => navigation.navigate('StudentDetail', { id: s.id })} style={{ marginBottom: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Avatar src={s.avatar} name={s.name} size={36} /><View style={{ marginLeft: 10, flex: 1 }}><Text style={{ fontSize: 14, fontWeight: '600', color: t }}>{s.name}</Text><Text style={{ fontSize: 12, color: t2 }}>{s.belt || ''}</Text></View></View></GlassCard>)}</>}
        </View>
      </ScrollView>
    </View>
  );
}
