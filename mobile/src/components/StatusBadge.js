/**
 * StatusBadge — точная копия PWA status badges
 *
 * PWA: px-2 py-1 rounded-full flex-row gap-1 text-[10px] font-semibold uppercase
 * sick: Thermometer 10px + "Болеет", bg-yellow-500/15 text-yellow-400
 * injury: HeartCrack 10px + "Травма", bg-red-500/15 text-red-400
 * skip: Zap 10px + "Сачок", bg-purple-500/15 text-purple-400
 * null: не рендерить
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Thermometer, HeartCrack, Zap } from 'lucide-react-native';

const STATUS_CONFIG = {
  sick: {
    icon: Thermometer,
    label: 'Болеет',
    bg: 'rgba(251, 191, 36, 0.15)',
    color: '#fbbf24',
  },
  injury: {
    icon: HeartCrack,
    label: 'Травма',
    bg: 'rgba(248, 113, 113, 0.15)',
    color: '#f87171',
  },
  skip: {
    icon: Zap,
    label: 'Сачок',
    bg: 'rgba(168, 85, 247, 0.15)',
    color: '#a855f7',
  },
};

export default function StatusBadge({ status, style }) {
  if (!status || !STATUS_CONFIG[status]) return null;

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: config.bg,
        },
        style,
      ]}
    >
      <Icon size={10} color={config.color} />
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          color: config.color,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
