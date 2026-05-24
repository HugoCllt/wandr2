'use client';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { FromMapActivityCard } from './cards/FromMapActivityCard';
import { useOpenActivity } from './cards/helpers';
import { MapView, type MapMarkerData } from './Map/MapView';

type MapSectionProps = {
  nearbyActivities: ActivityDTO[];
};

const MONTREAL_CENTER = { lng: -73.5674, lat: 45.5019 };

export function MapSection({ nearbyActivities }: MapSectionProps) {
  const open = useOpenActivity();

  const markers: MapMarkerData[] = nearbyActivities
    .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
    .map((a) => ({
      id: a.id,
      lng: a.longitude,
      lat: a.latitude,
      label: a.title,
      color: a.kind === 'EVENT' ? 'orange' : 'blue',
      onClick: () => open(a),
    }));

  return (
    <section className="map-panel">
      <div className="map-panel-head">
        <div>
          <h2>Explore Near You</h2>
          <p>Handpicked activities around Montréal — click a pin to open it.</p>
        </div>
        <span className="link">See all on the map</span>
      </div>
      <div className="map-panel-grid">
        <div className="map-panel-map">
          <MapView center={MONTREAL_CENTER} zoom={12} markers={markers} />
        </div>
        <div className="map-panel-list">
          {nearbyActivities.slice(0, 4).map((a) => (
            <FromMapActivityCard key={a.id} activity={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
