import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { Colors, FontFamily, FontSize } from '../../constants/theme';

type Variant = 'hero' | 'display' | 'title' | 'subtitle' | 'body' | 'bodyMedium' | 'caption' | 'mono' | 'monoBold' | 'label';
type Color = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'disabled';

interface ForgeTextProps extends TextProps {
  variant?: Variant;
  color?: Color;
  style?: TextStyle | TextStyle[];
}

const variantStyles: Record<Variant, TextStyle> = {
  hero: { fontFamily: FontFamily.display, fontSize: FontSize.hero, color: Colors.text.primary, letterSpacing: -1 },
  display: { fontFamily: FontFamily.display, fontSize: FontSize.display, color: Colors.text.primary, letterSpacing: -0.5 },
  title: { fontFamily: FontFamily.display, fontSize: FontSize.xl, color: Colors.text.primary },
  subtitle: { fontFamily: FontFamily.displayMedium, fontSize: FontSize.lg, color: Colors.text.primary },
  body: { fontFamily: FontFamily.body, fontSize: FontSize.md, color: Colors.text.primary },
  bodyMedium: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.text.primary },
  caption: { fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.text.secondary },
  mono: { fontFamily: FontFamily.mono, fontSize: FontSize.md, color: Colors.text.primary },
  monoBold: { fontFamily: FontFamily.monoBold, fontSize: FontSize.md, color: Colors.text.primary },
  label: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.text.secondary, letterSpacing: 0.8, textTransform: 'uppercase' },
};

const colorMap: Record<Color, string> = {
  primary: Colors.text.primary,
  secondary: Colors.text.secondary,
  accent: Colors.accent.primary,
  success: Colors.accent.success,
  warning: Colors.accent.warning,
  danger: Colors.accent.secondary,
  disabled: Colors.text.disabled,
};

export const Text: React.FC<ForgeTextProps> = ({ variant = 'body', color, style, ...props }) => {
  const baseStyle = variantStyles[variant];
  const colorStyle = color ? { color: colorMap[color] } : {};

  return (
    <RNText
      style={[baseStyle, colorStyle, style]}
      {...props}
    />
  );
};
