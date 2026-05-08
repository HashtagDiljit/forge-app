import React from 'react';
import { View, ViewStyle, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  onLongPress?: () => void;
  elevated?: boolean;
  noPadding?: boolean;
  accent?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  onLongPress,
  elevated = false,
  noPadding = false,
  accent,
}) => {
  const containerStyle: ViewStyle[] = [
    styles.card,
    elevated ? styles.elevated : null,
    noPadding ? styles.noPadding : null,
    accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null,
    ...(Array.isArray(style) ? style : [style ?? null]),
  ].filter(Boolean) as ViewStyle[];

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  elevated: {
    backgroundColor: Colors.background.elevated,
    ...Shadow.md,
  },
  noPadding: {
    padding: 0,
  },
});
