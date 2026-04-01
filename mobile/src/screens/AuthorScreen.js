import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const APP_VERSION = '1.0.0';

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    bgColor: 'rgba(228,64,95,0.12)',
    urlPrefix: 'https://instagram.com/',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: 'paper-plane-outline',
    color: '#0088CC',
    bgColor: 'rgba(0,136,204,0.12)',
    urlPrefix: 'https://t.me/',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    bgColor: 'rgba(37,211,102,0.12)',
    urlPrefix: 'https://wa.me/',
  },
];

export default function AuthorScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const { data } = useData();

  const authorInfo = data.authorInfo || {};

  const handleOpenLink = useCallback(async (url) => {
    if (!url) return;
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      await Linking.openURL(fullUrl);
    } catch {}
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="О разработчике" back onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Developer Card */}
        <GlassCard style={styles.devCard}>
          <View style={[styles.devIcon, { backgroundColor: c.purpleBg }]}>
            <Ionicons name="code-slash-outline" size={32} color={c.purple} />
          </View>
          <Text style={[styles.devName, { color: c.text }]}>
            {authorInfo.name || 'iBorcuha'}
          </Text>
          <Text style={[styles.devDesc, { color: c.textSecondary }]}>
            {authorInfo.description || 'Разработка мобильных и веб-приложений для управления клубами единоборств'}
          </Text>

          {authorInfo.email && (
            <TouchableOpacity
              style={styles.emailRow}
              onPress={() => handleOpenLink(`mailto:${authorInfo.email}`)}
            >
              <Ionicons name="mail-outline" size={16} color={c.purple} />
              <Text style={[styles.emailText, { color: c.purple }]}>{authorInfo.email}</Text>
            </TouchableOpacity>
          )}

          {authorInfo.phone && (
            <TouchableOpacity
              style={styles.emailRow}
              onPress={() => handleOpenLink(`tel:${authorInfo.phone}`)}
            >
              <Ionicons name="call-outline" size={16} color={c.purple} />
              <Text style={[styles.emailText, { color: c.purple }]}>{authorInfo.phone}</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Social Links */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Связаться</Text>

        {SOCIAL_LINKS.map(social => {
          const handle = authorInfo[social.key];
          return (
            <TouchableOpacity
              key={social.key}
              activeOpacity={0.7}
              onPress={() => {
                if (handle) handleOpenLink(`${social.urlPrefix}${handle.replace('@', '')}`);
              }}
              disabled={!handle}
            >
              <GlassCard style={[styles.socialCard, !handle && { opacity: 0.5 }]}>
                <View style={styles.socialRow}>
                  <View style={[styles.socialIcon, { backgroundColor: social.bgColor }]}>
                    <Ionicons name={social.icon} size={22} color={social.color} />
                  </View>
                  <View style={styles.socialInfo}>
                    <Text style={[styles.socialLabel, { color: c.text }]}>{social.label}</Text>
                    <Text style={[styles.socialHandle, { color: c.textSecondary }]}>
                      {handle ? `@${handle.replace('@', '')}` : 'Не указан'}
                    </Text>
                  </View>
                  {handle && (
                    <Ionicons name="open-outline" size={18} color={c.textTertiary} />
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        {/* App Version */}
        <GlassCard style={styles.versionCard}>
          <View style={styles.versionRow}>
            <View style={[styles.versionIcon, { backgroundColor: c.blueBg }]}>
              <Ionicons name="information-circle-outline" size={22} color={c.blue} />
            </View>
            <View style={styles.versionInfo}>
              <Text style={[styles.versionLabel, { color: c.text }]}>Версия приложения</Text>
              <Text style={[styles.versionValue, { color: c.textSecondary }]}>{APP_VERSION}</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={[styles.footer, { color: c.textTertiary }]}>
          iBorcuha - управление клубом единоборств
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  devCard: { alignItems: 'center', paddingVertical: 28, marginBottom: 24 },
  devIcon: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  devName: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  devDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
  },
  emailText: { fontSize: 14, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  socialCard: { marginBottom: 10 },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  socialInfo: { flex: 1 },
  socialLabel: { fontSize: 15, fontWeight: '600' },
  socialHandle: { fontSize: 13, marginTop: 2 },
  versionCard: { marginTop: 14 },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  versionIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  versionInfo: { flex: 1 },
  versionLabel: { fontSize: 15, fontWeight: '600' },
  versionValue: { fontSize: 13, marginTop: 2 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 32 },
});
