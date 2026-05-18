import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Register: undefined;
  Login: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  CreateReport: undefined;
  MapPicker: {
    draftType: string;
    draftTitle: string;
    draftDescription: string;
  };
  MarksMap: undefined;
  Detail: { incidentId: string };
  Edit: { incidentId: string };
};

export type ResponderStackParamList = {
  ResponderDashboard: undefined;
  Profile: undefined;
  ResponderMarksMap: undefined;
  ResponderDetail: { incidentId: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type AppScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<AppStackParamList, T>;

export type ResponderScreenProps<T extends keyof ResponderStackParamList> = NativeStackScreenProps<
  ResponderStackParamList,
  T
>;
