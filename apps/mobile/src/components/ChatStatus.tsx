import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ChatStreamPhase } from '@wandr/shared';
import { theme } from '../theme/tokens';
import { AppText } from '../ui/AppText';

const PHASE_LABEL: Record<ChatStreamPhase, string> = {
  thinking: 'Wandr réfléchit…',
  reflecting: 'Wandr lit votre profil…',
  searching: 'Wandr explore le web…',
  synthesizing: 'Wandr compose…',
  writing: 'Wandr écrit…',
};

const DOT_DELAY_MS = 160;
const DOT_DURATION_MS = 320;

export function ChatStatus({ phase }: { phase: ChatStreamPhase }) {
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.3)));

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * DOT_DELAY_MS),
          Animated.timing(dot, { toValue: 1, duration: DOT_DURATION_MS, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: DOT_DURATION_MS, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dots]);

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={PHASE_LABEL[phase]}>
      <View style={styles.dotsRow}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>
      <AppText variant="body" color={theme.colors.smoke}>
        {PHASE_LABEL[phase]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.s2,
    minHeight: 44,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brass,
  },
});
