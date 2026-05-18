import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { emsColors } from '@ems/shared/theme/colors';
import { useAppLayout } from '../../context/AppLayoutContext';
import { radius } from '../../theme';

function HamburgerBars({ open }: { open: boolean }) {
  return (
    <View style={styles.bars}>
      <View style={[styles.bar, open && styles.barTop]} />
      <View style={[styles.bar, styles.barMid, open && styles.barMidHidden]} />
      <View style={[styles.bar, open && styles.barBottom]} />
    </View>
  );
}

export default function MenuButton() {
  const { toggleSidebar, sidebarOpen } = useAppLayout();

  return (
    <Pressable
      onPress={toggleSidebar}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, sidebarOpen && styles.btnOpen]}
      accessibilityRole="button"
      accessibilityLabel={sidebarOpen ? 'Close menu' : 'Open menu'}
    >
      <HamburgerBars open={sidebarOpen} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: emsColors.primary,
    ...(Platform.OS === 'web'
      ? { boxShadow: `0 2px 8px ${emsColors.primaryDark}40` }
      : {
          shadowColor: emsColors.primaryDark,
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }),
  },
  btnOpen: {
    backgroundColor: emsColors.primaryDark,
  },
  pressed: { opacity: 0.9 },
  bars: {
    width: 22,
    height: 16,
    justifyContent: 'space-between',
  },
  bar: {
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  barMid: {},
  barTop: {
    transform: [{ translateY: 6.75 }, { rotate: '45deg' }],
  },
  barMidHidden: {
    opacity: 0,
  },
  barBottom: {
    transform: [{ translateY: -6.75 }, { rotate: '-45deg' }],
  },
});
