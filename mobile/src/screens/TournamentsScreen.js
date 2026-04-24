import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Plus, Calendar, MapPin, Trophy, Swords, Check, Archive,
  ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TournamentsScreen({ navigation }) {
  const { auth } = useAuth();
  const { data } = useData();
  const { dark } = useTheme();
  const [showArchive, setShowArchive] = useState(false);

  const sorted = [...data.tournaments].sort((a, b) => new Date(a.date) - new Date(b.date));

  const allInternal = (data.internalTournaments || [])
    .filter(t => {
      if (auth.role === 'trainer') return t.trainerId === auth.userId;
      if (auth.role === 'student') {
        const student = data.students.find(s => s.id === auth.studentId);
        return student && t.trainerId === student.trainerId;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeInternalTournaments = allInternal.filter(t => t.status !== 'completed');
  const archivedInternalTournaments = allInternal.filter(t => {
    if (t.status !== 'completed') return false;
    return new Date(t.date || 0) >= thirtyDaysAgo;
  });

  const labelColor = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
  const dimColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  const renderTournamentCard = (t) => {
    const cats = t.brackets?.categories || [];
    const isLegacy = !cats.length && t.brackets?.rounds;
    const totalParticipants = isLegacy
      ? (t.brackets?.participants?.length || 0)
      : cats.reduce((s, c) => s + (c.participants?.length || 0), 0);
    const catCount = isLegacy ? 1 : cats.length;

    return (
      <GlassCard
        key={t.id}
        onPress={() => navigation.navigate('InternalTournamentDetail', { id: t.id })}
        style={t.status === 'completed'
          ? { borderColor: 'rgba(255,255,255,0.06)' }
          : { borderColor: 'rgba(220,38,38,0.2)' }
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }} numberOfLines={1}>
                {t.title}
              </Text>
              {t.status === 'completed' && (
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} color="#4ade80" />
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Calendar size={11} color={labelColor} />
              <Text style={{ fontSize: 12, color: labelColor }}>{formatDate(t.date)}</Text>
              <Text style={{ fontSize: 12, color: labelColor }}>{'•'}</Text>
              <Text style={{ fontSize: 12, color: labelColor }}>{catCount} {catCount === 1 ? 'весовая' : 'весовых'}</Text>
              <Text style={{ fontSize: 12, color: labelColor }}>{'•'}</Text>
              <Text style={{ fontSize: 12, color: labelColor }}>{totalParticipants} чел.</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title="Турниры">
        {auth.role === 'trainer' && (
          <Pressable onPress={() => navigation.navigate('CreateInternalTournament')} style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
            <Swords size={20} color={dark ? '#fff' : '#111'} />
          </Pressable>
        )}
        {auth.role === 'superadmin' && (
          <Pressable onPress={() => navigation.navigate('AddTournament')} style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
            <Plus size={20} color={dark ? '#fff' : '#111'} />
          </Pressable>
        )}
      </PageHeader>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Active Internal */}
        {activeInternalTournaments.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Swords size={14} color="#dc2626" />
              <Text style={{ fontSize: 14, textTransform: 'uppercase', fontWeight: '700', color: dimColor }}>Клубные турниры</Text>
            </View>
            <View style={{ gap: 8 }}>
              {activeInternalTournaments.map(renderTournamentCard)}
            </View>
          </View>
        )}

        {/* Archive */}
        {archivedInternalTournaments.length > 0 && (
          <View>
            <Pressable
              onPress={() => setShowArchive(!showArchive)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Archive size={14} color={dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'} />
                <Text style={{ fontSize: 14, textTransform: 'uppercase', fontWeight: '700', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                  Архив ({archivedInternalTournaments.length})
                </Text>
              </View>
              {showArchive
                ? <ChevronUp size={16} color={labelColor} />
                : <ChevronDown size={16} color={labelColor} />
              }
            </Pressable>
            {showArchive && (
              <View style={{ gap: 8, marginTop: 8 }}>
                {archivedInternalTournaments.map(renderTournamentCard)}
              </View>
            )}
          </View>
        )}

        {/* Official */}
        {sorted.length > 0 && (
          <View>
            {(activeInternalTournaments.length > 0 || archivedInternalTournaments.length > 0) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Trophy size={14} color="#fb923c" />
                <Text style={{ fontSize: 14, textTransform: 'uppercase', fontWeight: '700', color: dimColor }}>Официальные турниры</Text>
              </View>
            )}
            <View style={{ gap: 12 }}>
              {sorted.map(t => {
                const isPast = new Date(t.date) < new Date();
                return (
                  <GlassCard key={t.id} onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}>
                    {t.coverImage ? (
                      <Image
                        source={{ uri: t.coverImage }}
                        style={{ width: '100%', height: 144, borderRadius: 16, marginBottom: 12 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{
                        width: '100%', height: 112, borderRadius: 16, marginBottom: 12,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                      }}>
                        <Text style={{ fontSize: 36, fontWeight: '900', fontStyle: 'italic', color: '#dc2626', opacity: 0.3 }}>BJJ</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontWeight: '700', fontSize: 16, color: dark ? '#fff' : '#111' }} numberOfLines={1}>{t.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Calendar size={12} color={labelColor} />
                          <Text style={{ fontSize: 12, color: labelColor }}>{formatDate(t.date)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={12} color={labelColor} />
                          <Text style={{ fontSize: 12, color: labelColor }} numberOfLines={1}>{t.location}</Text>
                        </View>
                      </View>
                      {isPast && (
                        <View style={{
                          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
                          backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
                          borderWidth: dark ? 0 : 1, borderColor: 'rgba(255,255,255,0.6)',
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            Прошёл
                          </Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty */}
        {sorted.length === 0 && allInternal.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Swords size={48} color={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'} />
            <Text style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)', marginTop: 12 }}>Нет турниров</Text>
            {auth.role === 'trainer' && (
              <Pressable
                onPress={() => navigation.navigate('CreateInternalTournament')}
                style={({ pressed }) => ({
                  marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: '#dc2626', opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Создать клубный турнир</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
