import { Icon } from './Icon';

type FlameRowProps = {
  value?: number;
  total?: number;
  size?: number;
  dimColor?: 'dim' | 'dim-light';
};

export function FlameRow({ value = 3, total = 4, size = 11, dimColor = 'dim' }: FlameRowProps) {
  return (
    <span className="trend-flames" aria-label={`Trend ${value} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={'flame ' + (i < value ? '' : dimColor)}
          style={{ display: 'inline-flex' }}
        >
          <Icon name="fire" size={size} />
        </span>
      ))}
    </span>
  );
}
