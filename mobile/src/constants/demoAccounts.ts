/** Aligned with supabase/sql/demo_accounts.sql and web LoginPage. */
export type DemoAccount = {
  key: string;
  label: string;
  email: string;
  password: string;
  /** Supported in Expo (resident + emergency responder). */
  mobileSupported: boolean;
  hint?: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: 'resident',
    label: 'Resident',
    email: 'resident@gmail.com',
    password: 'resident123',
    mobileSupported: true,
  },
  {
    key: 'emergencyResponders',
    label: 'Emergency Responder',
    email: 'emergencyresponder@gmail.com',
    password: 'emergencyresponder123',
    mobileSupported: true,
  },
  {
    key: 'barangayOfficial',
    label: 'Barangay Official',
    email: 'barangayofficial@gmail.com',
    password: 'official123',
    mobileSupported: false,
    hint: 'Web app only',
  },
  {
    key: 'superAdmin',
    label: 'System Admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    mobileSupported: false,
    hint: 'Web app only',
  },
];
