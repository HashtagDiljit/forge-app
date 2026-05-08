import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, FontSize, FontFamily } from '../../constants/theme';
import { Text } from './Text';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = Colors.accent.primary,
  bgColor,
  style,
}) => (
  <View style={[styles.badge, { backgroundColor: bgColor ?? `${color}20`, borderColor: `${color}40` }, style]}>
    <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color, letterSpacing: 0.4 }}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
