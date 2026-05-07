import type { ReactElement } from 'react';

import type { ActivityDTO } from '../contracts/ActivityDTO';
import { ActivityCard } from './ActivityCard';
import { Carousel } from './Carousel';

type HeroCarouselProps = {
  items: ActivityDTO[];
};

export function HeroCarousel({ items }: HeroCarouselProps): ReactElement | null {
  if (items.length === 0) return null;

  const slides = items.map((activity) => (
    <ActivityCard key={activity.id} activity={activity} variant="hero" />
  ));

  return <Carousel slides={slides} interval={5000} pauseOnHover ariaLabel="Featured activities" />;
}
