import type { Gender } from '@/system/types'
import { GENDER_OPTIONS } from '@ems/shared/profileFields'
import { Field } from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

export type ProfileFormState = {
  name: string
  phone: string
  address: string
  dateOfBirth: string
  gender: Gender | ''
}

type Props = {
  value: ProfileFormState
  onChange: (patch: Partial<ProfileFormState>) => void
  idPrefix?: string
}

export default function ProfileFormFields({ value, onChange, idPrefix = 'profile' }: Props) {
  return (
    <>
      <Field label="Full name">
        <Input
          id={`${idPrefix}-name`}
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          autoComplete="name"
          required
          minLength={2}
        />
      </Field>
      <Field label="Phone number" hint="e.g. 09171234567">
        <Input
          id={`${idPrefix}-phone`}
          value={value.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          type="tel"
          autoComplete="tel"
          placeholder="09XXXXXXXXX"
        />
      </Field>
      <Field label="Home address">
        <Input
          id={`${idPrefix}-address`}
          value={value.address}
          onChange={(e) => onChange({ address: e.target.value })}
          autoComplete="street-address"
          placeholder="Purok, street, barangay"
        />
      </Field>
      <Field label="Date of birth">
        <Input
          id={`${idPrefix}-dob`}
          value={value.dateOfBirth}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
          type="date"
        />
      </Field>
      <Field label="Gender">
        <Select
          id={`${idPrefix}-gender`}
          value={value.gender}
          onChange={(e) => onChange({ gender: e.target.value as Gender | '' })}
        >
          <option value="">Select…</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
      </Field>
    </>
  )
}
