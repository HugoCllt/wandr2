import { Easing, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

export const motion = {
  duration: { feedback: 140, state: 240, entrance: 480 },
  easing: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.65, 0, 0.35, 1),
  },
  spring: {
    press: { damping: 26, stiffness: 420, mass: 0.7, reduceMotion: ReduceMotion.System },
    slide: { damping: 20, stiffness: 220, mass: 0.9, reduceMotion: ReduceMotion.System },
    pop: { damping: 12, stiffness: 320, mass: 0.6, reduceMotion: ReduceMotion.System },
  },
} as const;

export { useReducedMotion };
