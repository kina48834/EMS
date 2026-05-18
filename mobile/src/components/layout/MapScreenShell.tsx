import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppScreenHeader from './AppScreenHeader';
import { colors } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

/** Full-screen map layouts with aligned menu + back header (no native stack header). */
export default function MapScreenShell({ title, subtitle, headerRight, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppScreenHeader title={title} subtitle={subtitle} right={headerRight} />
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  body: { flex: 1, minHeight: 0 },
});
