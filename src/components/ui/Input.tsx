import React, { useState } from 'react';
import {
  TextInput,
  View,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors, Radius, Spacing, FontFamily, FontSize } from '../../constants/theme';
import { Text } from './Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text variant="label" style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        focused && styles.focused,
        error ? styles.error : {},
      ]}>
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={18}
            color={Colors.text.secondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeftIcon, style]}
          placeholderTextColor={Colors.text.disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <MaterialCommunityIcons name={rightIcon as any} size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text variant="caption" color="danger" style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text variant="caption" style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { marginBottom: Spacing.xs },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    minHeight: 48,
  },
  focused: { borderColor: Colors.accent.primary },
  error: { borderColor: Colors.accent.secondary },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  inputWithLeftIcon: { paddingLeft: Spacing.xs },
  leftIcon: { paddingLeft: Spacing.sm },
  rightIcon: { paddingRight: Spacing.sm },
  errorText: { marginTop: 4 },
  hint: { marginTop: 4 },
});
