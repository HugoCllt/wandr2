'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import { useActiveCity } from './ActiveCityProvider';
import { CoverActivityCard } from './cards/CoverActivityCard';
import { MapView, type MapMarkerData, type MapViewHandle } from './Map/MapView';

type MapSectionProps = {
  nearbyActivities: ActivityDTO[];
};

const MARKER_CAP = 24;

export function MapSection({ nearbyActivities }: MapSectionProps) {
  const city = useActiveCity();
  const mapRef = useRef<MapViewHandle | null>(null);
  const blockRef = useRef<HTMLElement | null>(null);
  // Panel is open by default (first activity on the side). `engaged` is a
  // separate, opt-in state that hands the mouse wheel to the map — it only turns
  // on once the user clicks the map, so the page scrolls past until then.
  const [activeIndex, setActiveIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);

  const pins = useMemo(
    () =>
      nearbyActivities
        .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
        .slice(0, MARKER_CAP),
    [nearbyActivities],
  );

  const activeActivity = pins[activeIndex] ?? null;

  const goTo = useCallback(
    (index: number) => {
      if (pins.length === 0) return;
      const next = (index + pins.length) % pins.length;
      setActiveIndex(next);
      const a = pins[next];
      mapRef.current?.flyTo(a.longitude, a.latitude, 14);
    },
    [pins],
  );

  // Escape or a click outside the block disengages the wheel zoom; the panel
  // stays open so the page scrolls normally again.
  useEffect(() => {
    if (!engaged) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEngaged(false);
    };
    const onDown = (e: MouseEvent) => {
      if (blockRef.current && !blockRef.current.contains(e.target as Node)) setEngaged(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [engaged]);

  const markers: MapMarkerData[] = pins.map((a, i) => ({
    id: a.id,
    lng: a.longitude,
    lat: a.latitude,
    label: a.title,
    color: a.kind === 'EVENT' ? 'orange' : 'blue',
    onClick: () => {
      setEngaged(true);
      goTo(i);
    },
  }));

  if (markers.length === 0) return null;

  return (
    <section className="map-explorer" ref={blockRef}>
      <div className="map-explorer-head">
        <div>
          <div className="feed-eyebrow">Sur la carte</div>
          <h2>Explorez autour de vous</h2>
          <p>
            Des activités triées sur le volet à {city.name} — cliquez sur la carte pour
            l&apos;explorer.
          </p>
        </div>
      </div>

      <div className="map-explorer-stage open">
        <div
          className="map-explorer-map"
          data-lenis-prevent-wheel={engaged ? '' : undefined}
          onClick={() => setEngaged(true)}
        >
          <MapView
            key={city.slug}
            ref={mapRef}
            center={{ lng: city.centerLng, lat: city.centerLat }}
            zoom={12}
            markers={markers}
            scrollZoom={engaged}
            activeId={activeActivity?.id}
          />
        </div>

        <aside className="map-volet">
          {activeActivity && (
            <div className="map-volet-card">
              <CoverActivityCard activity={activeActivity} showPrice />
              <div className="map-volet-nav">
                <button
                  className="map-volet-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(activeIndex - 1);
                  }}
                  aria-label="Précédent"
                >
                  <Icon name="chev-left" size={26} stroke={2.6} />
                </button>
                <button
                  className="map-volet-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(activeIndex + 1);
                  }}
                  aria-label="Suivant"
                >
                  <Icon name="chev-right" size={26} stroke={2.6} />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
