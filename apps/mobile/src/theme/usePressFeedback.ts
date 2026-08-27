import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { motion } from './motion';

const PRESS_SCALE = 0.972;
const PRESS_OPACITY = 0.94;

export function usePressFeedback() {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * (1 - PRESS_SCALE), motion.spring.press) }],
    opacity: withTiming(1 - pressed.value * (1 - PRESS_OPACITY), {
      duration: motion.duration.feedback,
      easing: motion.easing.out,
    }),
  }));

  return {
    animatedStyle,
    onPressIn: () => {
      pressed.set(1);
    },
    onPressOut: () => {
      pressed.set(0);
    },
  };
}
