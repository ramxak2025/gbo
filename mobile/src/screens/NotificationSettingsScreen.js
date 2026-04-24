import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { Bell, BellOff, Newspaper, Trophy, Wallet, Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function NotificationSettingsScreen() {
  const { dark } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [settings, setSettings] = useState({ news: true, tournaments: true, payments: true, schedule: true });
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  const categories = [
    { key: 'news', icon: Newspaper, label: 'Новости', desc: 'Новости от тренера и группы', color: '#3b82f6' },
    { key: 'tournaments', icon: Trophy, label: 'Турниры', desc: 'Новые турниры и напоминания', color: '#fbbf24' },
    { key: 'payments', icon: Wallet, label: 'Оплата', desc: 'Напоминания об абонементе', color: '#22c55e' },
    { key: 'schedule', icon: Calendar, label: 'Расписание', desc: 'Изменения в расписании', color: '#8b5cf6' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Уведомления" back />
        <View style={{ paddingHorizontal: 16 }}>
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {pushEnabled ? <Bell size={24} color="#3b82f6" /> : <BellOff size={24} color={t2} />}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: t }}>Push-уведомления</Text>
                <Text style={{ fontSize: 13, color: t2 }}>{pushEnabled ? 'Включены' : 'Выключены'}</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#3b82f6', false: dark ? '#333' : '#ddd' }} />
            </View>
          </GlassCard>
          {pushEnabled && categories.map(cat => (
            <GlassCard key={cat.key} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <cat.icon size={20} color={cat.color} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t }}>{cat.label}</Text>
                  <Text style={{ fontSize: 12, color: t2 }}>{cat.desc}</Text>
                </View>
                <Switch value={settings[cat.key]} onValueChange={v => setSettings(s => ({ ...s, [cat.key]: v }))} trackColor={{ true: cat.color, false: dark ? '#333' : '#ddd' }} />
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
