import React from 'react';
import {
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Colors, Radius, Spacing, FontFamily, FontSize } from '../../constants/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}) => {
  const containerStyles = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textColor = variant === 'primary' ? Colors.background.primary :
    variant === 'danger' ? '#FFF' :
    variant === 'success' ? '#FFF' :
    Colors.text.primary;

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text
            style={{
              fontFamily: FontFamily.bodyMedium,
              fontSize: size === 'sm' ? FontSize.sm : size === 'lg' ? FontSize.lg : FontSize.md,
              color: textColor,
            }}
          >
            {label}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: { marginRight: Spacing.xs },
  iconRight: { marginLeft: Spacing.xs },

  variant_primary: { backgroundColor: Colors.accent.primary },
  variant_secondary: { backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: Colors.accent.secondary },
  variant_success: { backgroundColor: Colors.accent.success },

  size_sm: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, minHeight: 36 },
  size_md: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  size_lg: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 56 },

  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
});
