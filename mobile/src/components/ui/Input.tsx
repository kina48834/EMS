import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { colors, radius, spacing } from '../../theme';

type Props = TextInputProps & {
  invalid?: boolean;
};

export default function Input({ invalid, onFocus, onBlur, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[
        styles.input,
        focused && styles.inputFocused,
        invalid && styles.inputInvalid,
        props.multiline && styles.multiline,
        style,
      ]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2, paddingHorizontal: spacing.md + 1, paddingVertical: spacing.md - 1 },
  inputInvalid: { borderColor: colors.danger },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
});
