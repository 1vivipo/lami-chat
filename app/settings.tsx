import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeStore();

  const themes = [
    { key: 'system', label: '跟随系统', icon: 'phone-portrait-outline' as const },
    { key: 'light', label: '浅色模式', icon: 'sunny-outline' as const },
    { key: 'dark', label: '深色模式', icon: 'moon-outline' as const },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: Spacing.lg }}>
        <Text style={{ fontSize: FontSize.sm, color: colors.mutedText, marginBottom: Spacing.md }}>
          选择主题
        </Text>

        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: Spacing.md,
              backgroundColor: colors.card,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.sm,
              borderWidth: themeMode === theme.key ? 2 : 0,
              borderColor: colors.tint,
            }}
            onPress={() => setThemeMode(theme.key as any)}
          >
            <Ionicons
              name={theme.icon}
              size={24}
              color={themeMode === theme.key ? colors.tint : colors.mutedText}
            />
            <Text
              style={{
                flex: 1,
                marginLeft: Spacing.md,
                fontSize: FontSize.md,
                color: themeMode === theme.key ? colors.tint : colors.text,
                fontWeight: themeMode === theme.key ? '600' : 'normal',
              }}
            >
              {theme.label}
            </Text>
            {themeMode === theme.key && (
              <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
