import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Swords, Calendar } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); }

export default function InternalTournamentsScreen({ route }) {
  const { data } = useData();
  const { dark } = useTheme();
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const id = route?.params?.id;
  const tournament = id ? data.internalTournaments?.find(it => it.id === id) : null;

  if (tournament) {
    return (
      <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
          <PageHeader title={tournament.title} back />
          <View style={{ paddingHorizontal: 16 }}>
            <GlassCard style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Swords size={20} color="#fbbf24" />
                <Text style={{ fontSize: 18, fontWeight: '800', color: t, marginLeft: 10 }}>{tournament.title}</Text>
              </View>
              {tournament.date && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Calendar size={14} color={t2} /><Text style={{ fontSize: 13, color: t2 }}>{formatDate(tournament.date)}</Text></View>}
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: tournament.status === 'finished' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)', alignSelf: 'flex-start', marginTop: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: tournament.status === 'finished' ? '#22c55e' : '#3b82f6' }}>{tournament.status === 'finished' ? 'Завершён' : 'Активный'}</Text>
              </View>
            </GlassCard>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Клубные турниры" back />
        <View style={{ paddingHorizontal: 16 }}>
          {(data.internalTournaments || []).map(it => (
            <GlassCard key={it.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Swords size={18} color="#fbbf24" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t }}>{it.title}</Text>
                  <Text style={{ fontSize: 12, color: t2 }}>{formatDate(it.date)}</Text>
                </View>
                {it.status === 'finished' && <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.15)' }}><Text style={{ fontSize: 10, fontWeight: '600', color: '#22c55e' }}>✓</Text></View>}
              </View>
            </GlassCard>
          ))}
          {(!data.internalTournaments || data.internalTournaments.length === 0) && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}><Swords size={48} color={t2} /><Text style={{ fontSize: 16, fontWeight: '600', color: t2, marginTop: 12 }}>Нет турниров</Text></View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
