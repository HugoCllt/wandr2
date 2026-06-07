'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import { CoverActivityCard } from './cards/CoverActivityCard';
import { MapView, type MapMarkerData, type MapViewHandle } from './Map/MapView';

type MapSectionProps = {
  nearbyActivities: ActivityDTO[];
};

const MONTREAL_CENTER = { lng: -73.5674, lat: 45.5019 };
const MARKER_CAP = 24;

export function MapSection({ nearbyActivities }: MapSectionProps) {
  const mapRef = useRef<MapViewHandle | null>(null);
  const blockRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const pins = useMemo(
    () =>
      nearbyActivities
        .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
        .slice(0, MARKER_CAP),
    [nearbyActivities],
  );

  const open = activeIndex !== null;
  const activeActivity = open ? pins[activeIndex] : null;

  const close = useCallback(() => setActiveIndex(null), []);

  const goTo = useCallback(
    (index: number) => {
      const next = (index + pins.length) % pins.length;
      setActiveIndex(next);
      const a = pins[next];
      mapRef.current?.flyTo(a.longitude, a.latitude, 14);
    },
    [pins],
  );

  // Escape closes; click outside the block closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onDown = (e: MouseEvent) => {
      if (blockRef.current && !blockRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, close]);

  const markers: MapMarkerData[] = pins.map((a, i) => ({
    id: a.id,
    lng: a.longitude,
    lat: a.latitude,
    label: a.title,
    color: a.kind === 'EVENT' ? 'orange' : 'blue',
    onClick: () => goTo(i),
  }));

  if (markers.length === 0) return null;

  return (
    <section className="map-explorer" ref={blockRef}>
      <div className="map-explorer-head">
        <div>
          <div className="feed-eyebrow">Sur la carte</div>
          <h2>Explorez autour de vous</h2>
          <p>Des activités triées sur le volet à Montréal — cliquez sur un point pour l&apos;ouvrir.</p>
        </div>
      </div>

      <div className={'map-explorer-stage' + (open ? ' open' : '')}>
        <div
          className="map-explorer-map"
          data-lenis-prevent-wheel={open ? '' : undefined}
          onClick={(e) => {
            // Click on the map background (not a pin) closes the volet.
            if (open && e.target === e.currentTarget) close();
          }}
        >
          <MapView
            ref={mapRef}
            center={MONTREAL_CENTER}
            zoom={12}
            markers={markers}
            scrollZoom={open}
            activeId={activeActivity?.id}
          />
        </div>

        <aside className="map-volet" aria-hidden={!open}>
          {activeActivity && (
            <>
              <button className="map-volet-close" onClick={close} aria-label="Fermer">
                <Icon name="close" size={16} stroke={2.2} />
              </button>
              <div className="map-volet-card">
                <CoverActivityCard activity={activeActivity} showPrice />
              </div>
              <div className="map-volet-nav">
                <span className="map-volet-count">
                  {activeIndex! + 1} / {pins.length}
                </span>
                <div className="map-volet-btns">
                  <button
                    className="map-volet-btn"
                    onClick={() => goTo(activeIndex! - 1)}
                    aria-label="Précédent"
                  >
                    <Icon name="chev-left" size={18} />
                  </button>
                  <button
                    className="map-volet-btn"
                    onClick={() => goTo(activeIndex! + 1)}
                    aria-label="Suivant"
                  >
                    <Icon name="chev-right" size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
