import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../../theme';

type Props = {
  label: string;
  icon: string;
  onPress: () => void;
};

export default function HeaderIconButton({ label, icon, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.88 },
  icon: { fontSize: 22, color: colors.primary },
});
