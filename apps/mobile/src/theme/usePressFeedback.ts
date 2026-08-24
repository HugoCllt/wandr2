import { useState } from 'react';
import { Animated } from 'react-native';

const PRESS_SCALE = 0.98;
const PRESS_OPACITY = 0.92;
const PRESS_DURATION = 120;

export function usePressFeedback() {
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(1));

  function animateTo(toScale: number, toOpacity: number) {
    Animated.parallel([
      Animated.timing(scale, { toValue: toScale, duration: PRESS_DURATION, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: toOpacity, duration: PRESS_DURATION, useNativeDriver: true }),
    ]).start();
  }

  return {
    animatedStyle: { transform: [{ scale }], opacity },
    onPressIn: () => animateTo(PRESS_SCALE, PRESS_OPACITY),
    onPressOut: () => animateTo(1, 1),
  };
}
