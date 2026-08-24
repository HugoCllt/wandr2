import { Text, type TextProps } from 'react-native';
import { theme } from '../theme/tokens';

export type AppTextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: string;
};

export function AppText({ variant = 'body', color = theme.colors.ink, style, ...rest }: AppTextProps) {
  return <Text style={[theme.type[variant], { color }, style]} {...rest} />;
}
