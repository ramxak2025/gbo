import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Linking } from 'react-native';
import { Search, Play, Film, X } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function MaterialsScreen() {
  const { data } = useData();
  const { dark } = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  const materials = useMemo(() => {
    let list = data.materials || [];
    if (search) list = list.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'all') list = list.filter(m => m.category === category);
    return list;
  }, [data.materials, search, category]);

  const categories = useMemo(() => {
    const cats = [...new Set((data.materials || []).map(m => m.category).filter(Boolean))];
    return ['all', ...cats];
  }, [data.materials]);

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Материалы" />
        <View style={{ paddingHorizontal: 16 }}>
          <GlassCard style={{ marginBottom: 12, padding: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 }}>
              <Search size={18} color={t2} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Поиск материалов..." placeholderTextColor={t2} style={{ flex: 1, marginLeft: 10, color: t, fontSize: 15 }} />
              {search !== '' && <Pressable onPress={() => setSearch('')}><X size={16} color={t2} /></Pressable>}
            </View>
          </GlassCard>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {categories.map(cat => (
                <Pressable key={cat} onPress={() => setCategory(cat)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: category === cat ? 'rgba(220,38,38,0.15)' : (dark ? 'rgba(255,255,255,0.06)' : '#fff'), borderWidth: 1, borderColor: category === cat ? 'rgba(220,38,38,0.30)' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: category === cat ? '#dc2626' : t2 }}>{cat === 'all' ? 'Все' : cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {materials.map(m => (
            <GlassCard key={m.id} style={{ marginBottom: 10 }} onPress={() => m.videoUrl && Linking.openURL(m.videoUrl)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={20} color="#dc2626" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t }} numberOfLines={1}>{m.title}</Text>
                  {!!m.category && <Text style={{ fontSize: 12, color: t2 }}>{m.category}</Text>}
                  {!!m.description && <Text style={{ fontSize: 12, color: t2, marginTop: 2 }} numberOfLines={1}>{m.description}</Text>}
                </View>
              </View>
            </GlassCard>
          ))}
          {materials.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Film size={48} color={t2} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: t2, marginTop: 12 }}>Нет материалов</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
