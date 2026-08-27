import { useState, type ComponentType, type ReactNode } from 'react';
import { PixelRatio, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { theme } from '../theme/tokens';

const ANDROID_SHADER_MIN_API = 33;

type LiquidGlassProps = {
  style?: StyleProp<ViewStyle>;
  cornerRadius?: number;
  blurRadius?: number;
  refractionStrength?: number;
  chromaticAberration?: number;
  edgeGlowIntensity?: number;
  glareIntensity?: number;
  borderIntensity?: number;
  glassOpacity?: number;
  shadowOpacity?: number;
  saturation?: number;
  tintColor?: string;
};

function loadAndroidGlass(): ComponentType<LiquidGlassProps> | null {
  if (Platform.OS !== 'android' || Number(Platform.Version) < ANDROID_SHADER_MIN_API) return null;
  if (requireOptionalNativeModule('LiquidGlass') === null) return null;
  try {
    return require('@uginy/react-native-liquid-glass').LiquidGlassView as ComponentType<LiquidGlassProps>;
  } catch {
    return null;
  }
}

function detectAppleGlass(): boolean {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

const LiquidGlassView = loadAndroidGlass();

export const APPLE_GLASS = detectAppleGlass();
export const ANDROID_GLASS = LiquidGlassView !== null;
export const LIQUID_GLASS = APPLE_GLASS || ANDROID_GLASS;

type GlassSurfaceProps = {
  radius: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

function AndroidGlassSurface({ radius, style, children }: GlassSurfaceProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const Glass = LiquidGlassView as ComponentType<LiquidGlassProps>;
  const shaderRadius =
    PixelRatio.get() * Math.min(radius, Math.min(size.width, size.height) / 2);

  return (
    <View
      style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
    >
      {size.width > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Glass
            style={{ width: size.width, height: size.height }}
            cornerRadius={shaderRadius}
            blurRadius={28}
            refractionStrength={0.05}
            chromaticAberration={0.04}
            edgeGlowIntensity={0.22}
            glareIntensity={0.34}
            borderIntensity={0.5}
            glassOpacity={0.1}
            shadowOpacity={0}
            saturation={1.1}
            tintColor={theme.colors.offwhite}
          />
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function GlassSurface({ radius, style, children }: GlassSurfaceProps) {
  if (APPLE_GLASS) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive style={[{ borderRadius: radius }, style]}>
        {children}
      </GlassView>
    );
  }

  if (ANDROID_GLASS) {
    return (
      <AndroidGlassSurface radius={radius} style={style}>
        {children}
      </AndroidGlassSurface>
    );
  }

  return (
    <BlurView
      intensity={40}
      tint="light"
      style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: theme.colors.glassFallback }, style]}
    >
      {children}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: theme.hairline,
            borderColor: theme.colors.glassOutline,
            borderTopColor: theme.colors.glassEdge,
          },
        ]}
      />
    </BlurView>
  );
}
