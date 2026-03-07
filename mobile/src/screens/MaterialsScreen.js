import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function MaterialsScreen() {
  const { auth } = useAuth();
  const { data, addMaterial, deleteMaterial } = useData();
  const { t } = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const materials = data.materials || [];
  const categories = ['all', ...new Set(materials.map(m => m.category).filter(Boolean))];

  const filtered = materials.filter(m => {
    if (category !== 'all' && m.category !== category) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openVideo = (url) => {
    if (url) Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Материалы" />

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: t.input, borderColor: t.inputBorder }]}>
        <Ionicons name="search" size={16} color={t.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: t.text }]}
          placeholder="Поиск..."
          placeholderTextColor={t.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter */}
      {categories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.catBtn, category === cat && { backgroundColor: t.accent + '25' }]}
            >
              <Text style={[styles.catText, { color: category === cat ? t.accent : t.textMuted }]}>
                {cat === 'all' ? 'Все' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Materials list */}
      {filtered.map(m => (
        <GlassCard key={m.id} onPress={() => openVideo(m.videoUrl)}>
          <View style={styles.materialRow}>
            <View style={[styles.playIcon, { backgroundColor: t.accent + '20' }]}>
              <Ionicons name="play" size={20} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.materialTitle, { color: t.text }]}>{m.title}</Text>
              {m.category && <Text style={[styles.materialCat, { color: t.textMuted }]}>{m.category}</Text>}
              {m.description && (
                <Text style={[styles.materialDesc, { color: t.textSecondary }]} numberOfLines={2}>{m.description}</Text>
              )}
            </View>
            {auth.role === 'trainer' && (
              <TouchableOpacity onPress={() => deleteMaterial(m.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={16} color={t.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      ))}

      {filtered.length === 0 && (
        <Text style={[styles.empty, { color: t.textMuted }]}>Нет материалов</Text>
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
  catScroll: { marginBottom: 12 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginRight: 6 },
  catText: { fontSize: 13, fontWeight: '600' },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  materialTitle: { fontSize: 14, fontWeight: '700' },
  materialCat: { fontSize: 11, marginTop: 2 },
  materialDesc: { fontSize: 12, marginTop: 4 },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});
