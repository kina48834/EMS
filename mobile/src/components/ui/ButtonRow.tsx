import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLayout } from '../../hooks/useLayout';
import { spacing } from '../../theme';

/** Equal-width responsive row of buttons — wraps on narrow screens. */
export default function ButtonRow({ children, tight }: { children: ReactNode; tight?: boolean }) {
  const { gap, isCompact } = useLayout();
  return (
    <View style={[styles.row, { gap: tight ? spacing.sm : gap }, isCompact && styles.rowCompact]}>
      {children}
    </View>
  );
}

export function ButtonRowItem({ children }: { children: ReactNode }) {
  return <View style={styles.item}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    width: '100%',
  },
  rowCompact: { flexDirection: 'column' },
  item: { flex: 1, minWidth: 88 },
});
