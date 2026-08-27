import { StyleSheet } from 'react-native';

export const theme = {
  colors: {
    offwhite: '#F6F1E8', surface: '#FFFFFF', surface2: '#FBF7F0', surface3: '#EFE8DB',
    ink: '#1E1A16', smoke: '#6F6559', silver: '#CFC6B7', line: '#E7DFD2',
    brass: '#C68A3A', brass700: '#9C6A28', brassTint: '#F3E7D0',
    teal: '#11605E', live: '#D8453F', heart: '#D8453F', liveTint: 'rgba(216,69,63,0.12)', heartTint: 'rgba(216,69,63,0.12)',
    scrim: 'rgba(30,26,22,0.35)', scrim900: 'rgba(30,26,22,0.9)',
    white: '#FFFFFF', white85: 'rgba(255,255,255,0.85)',
    glassEdge: 'rgba(255,255,255,0.55)',
    glassOutline: 'rgba(30,26,22,0.08)',
    glassFallback: 'rgba(251,247,240,0.72)',
  },
  space: { s0: 2, s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 40, s8: 48 },
  radius: { card: 12, btn: 9, sm: 7, pill: 999, sheet: 20 },
  hairline: StyleSheet.hairlineWidth,
  type: {
    wordmark: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 34, lineHeight: 38 },
    display: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 30, lineHeight: 34 },
    feature: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 26, lineHeight: 30 },
    title: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 22, lineHeight: 26 },
    titleSm: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 18, lineHeight: 23 },
    numeral: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 20, lineHeight: 24 },
    numeralSm: { fontFamily: 'LibreBodoni_600SemiBold', fontSize: 15, lineHeight: 18 },
    subtitle: { fontFamily: 'PublicSans_500Medium', fontSize: 17, lineHeight: 22 },
    body: { fontFamily: 'PublicSans_400Regular', fontSize: 15, lineHeight: 21 },
    label: { fontFamily: 'PublicSans_500Medium', fontSize: 13, lineHeight: 17 },
    caption: { fontFamily: 'PublicSans_500Medium', fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
    eyebrow: { fontFamily: 'PublicSans_500Medium', fontSize: 12, lineHeight: 16, letterSpacing: 1.2 },
    tabLabel: { fontFamily: 'PublicSans_500Medium', fontSize: 11, lineHeight: 14 },
  },
  shadow: {
    card: { shadowColor: '#1E1A16', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    raised: { shadowColor: '#1E1A16', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  },
} as const;
