import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Gender } from '@ems/shared/types';
import { GENDER_OPTIONS } from '@ems/shared/profileFields';
import AuthField from '../auth/AuthField';
import Input from '../ui/Input';
import { colors, radius, spacing } from '../../theme';

export type ProfileFormState = {
  name: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: Gender | '';
};

type Props = {
  value: ProfileFormState;
  onChange: (patch: Partial<ProfileFormState>) => void;
};

export default function ProfileFormFields({ value, onChange }: Props) {
  return (
    <>
      <AuthField label="Full name">
        <Input placeholder="Your full name" value={value.name} onChangeText={(t) => onChange({ name: t })} autoCapitalize="words" />
      </AuthField>
      <AuthField label="Phone number" hint="e.g. 09171234567">
        <Input
          placeholder="09XXXXXXXXX"
          value={value.phone}
          onChangeText={(t) => onChange({ phone: t })}
          keyboardType="phone-pad"
        />
      </AuthField>
      <AuthField label="Home address">
        <Input
          placeholder="Purok, street, barangay"
          value={value.address}
          onChangeText={(t) => onChange({ address: t })}
          multiline
          style={styles.multiline}
        />
      </AuthField>
      <AuthField label="Date of birth" hint="YYYY-MM-DD">
        <Input
          placeholder="1990-05-15"
          value={value.dateOfBirth}
          onChangeText={(t) => onChange({ dateOfBirth: t })}
          keyboardType="numbers-and-punctuation"
        />
      </AuthField>
      <AuthField label="Gender">
        <View style={styles.chips}>
          {GENDER_OPTIONS.map((g) => {
            const active = value.gender === g.value;
            return (
              <Pressable
                key={g.value}
                onPress={() => onChange({ gender: g.value })}
                style={[styles.chip, active && styles.chipOn]}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{g.label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => onChange({ gender: '' })}
            style={[styles.chip, value.gender === '' && styles.chipOn]}
          >
            <Text style={[styles.chipText, value.gender === '' && styles.chipTextOn]}>Skip</Text>
          </Pressable>
        </View>
      </AuthField>
    </>
  );
}

const styles = StyleSheet.create({
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextOn: { color: colors.primaryDark },
});
