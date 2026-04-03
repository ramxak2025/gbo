import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import { EditIcon, LinkIcon, PhoneIcon } from '../icons';

export default function AuthorScreen() {
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { authorInfo, updateAuthor } = useData();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const canEdit = ['club_owner', 'club_admin', 'organizer'].includes(auth?.role);

  const startEdit = () => {
    setForm({
      name: authorInfo?.name || '',
      description: authorInfo?.description || '',
      phone: authorInfo?.phone || '',
      website: authorInfo?.website || '',
      instagram: authorInfo?.instagram || '',
      telegram: authorInfo?.telegram || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateAuthor(form);
      setEditing(false);
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <PageHeader title="Редактировать" back />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {['name', 'description', 'phone', 'website', 'instagram', 'telegram'].map(key => (
            <View key={key}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {key === 'name' ? 'Название' : key === 'description' ? 'Описание' : key === 'phone' ? 'Телефон' : key === 'website' ? 'Сайт' : key === 'instagram' ? 'Instagram' : 'Telegram'}
              </Text>
              <TextInput
                value={form[key]}
                onChangeText={v => set(key, v)}
                placeholder={key}
                placeholderTextColor={colors.textSecondary}
                multiline={key === 'description'}
                style={[
                  styles.input,
                  key === 'description' && styles.textArea,
                  { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                ]}
              />
            </View>
          ))}
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
            <Text style={styles.saveText}>Сохранить</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Автор">
        {canEdit && (
          <TouchableOpacity onPress={startEdit}>
            <EditIcon size={20} color={colors.accent} />
          </TouchableOpacity>
        )}
      </PageHeader>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {authorInfo ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>{authorInfo.name || 'Автор'}</Text>
            {authorInfo.description && (
              <GlassCard style={{ marginTop: 12 }}>
                <Text style={[styles.desc, { color: colors.text }]}>{authorInfo.description}</Text>
              </GlassCard>
            )}
            {authorInfo.phone && (
              <GlassCard onPress={() => Linking.openURL(`tel:${authorInfo.phone}`)}>
                <View style={styles.row}>
                  <PhoneIcon size={18} color={colors.accent} />
                  <Text style={[styles.linkText, { color: colors.text }]}>{authorInfo.phone}</Text>
                </View>
              </GlassCard>
            )}
            {authorInfo.website && (
              <GlassCard onPress={() => Linking.openURL(authorInfo.website)}>
                <View style={styles.row}>
                  <LinkIcon size={18} color={colors.accent} />
                  <Text style={[styles.linkText, { color: colors.text }]}>{authorInfo.website}</Text>
                </View>
              </GlassCard>
            )}
            {authorInfo.telegram && (
              <GlassCard onPress={() => Linking.openURL(`https://t.me/${authorInfo.telegram.replace('@', '')}`)}>
                <View style={styles.row}>
                  <LinkIcon size={18} color={colors.accent} />
                  <Text style={[styles.linkText, { color: colors.text }]}>Telegram: {authorInfo.telegram}</Text>
                </View>
              </GlassCard>
            )}
            {authorInfo.instagram && (
              <GlassCard onPress={() => Linking.openURL(`https://instagram.com/${authorInfo.instagram.replace('@', '')}`)}>
                <View style={styles.row}>
                  <LinkIcon size={18} color={colors.accent} />
                  <Text style={[styles.linkText, { color: colors.text }]}>Instagram: {authorInfo.instagram}</Text>
                </View>
              </GlassCard>
            )}
          </>
        ) : (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Информация об авторе не заполнена</Text>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  desc: { fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { fontSize: 15, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 8, fontWeight: '500' },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 4 },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
