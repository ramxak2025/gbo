import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Shield, MapPin, Crown, Users } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function ClubsScreen() {
  const { data } = useData();
  const { dark } = useTheme();
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Клубы" />
        <View style={{ paddingHorizontal: 16 }}>
          {(data.clubs || []).map(club => {
            const head = club.headTrainerId ? data.users?.find(u => u.id === club.headTrainerId) : null;
            const trainers = data.users?.filter(u => u.role === 'trainer' && u.clubId === club.id) || [];
            return (
              <GlassCard key={club.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={22} color="#3b82f6" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: t }}>{club.name}</Text>
                    {!!club.city && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={11} color={t2} /><Text style={{ fontSize: 12, color: t2 }}>{club.city}</Text></View>}
                    {head && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}><Crown size={11} color="#fbbf24" /><Text style={{ fontSize: 12, color: t2 }}>{head.name}</Text></View>}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Users size={14} color={t2} /><Text style={{ fontSize: 12, fontWeight: '600', color: t2 }}>{trainers.length}</Text></View>
                </View>
              </GlassCard>
            );
          })}
          {(!data.clubs || data.clubs.length === 0) && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}><Shield size={48} color={t2} /><Text style={{ fontSize: 16, fontWeight: '600', color: t2, marginTop: 12 }}>Нет клубов</Text></View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
