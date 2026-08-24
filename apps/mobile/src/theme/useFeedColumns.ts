import { useWindowDimensions } from 'react-native';

const TWO_COLUMN_MIN_WIDTH = 600;

export function useFeedColumns(): { columns: 1 | 2 } {
  const { width } = useWindowDimensions();
  return { columns: width >= TWO_COLUMN_MIN_WIDTH ? 2 : 1 };
}
