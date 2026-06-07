'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import { forwardRef, useImperativeHandle, useRef, type ReactElement } from 'react';
import { Map, type MapRef, Marker, NavigationControl } from 'react-map-gl/maplibre';

import { Icon } from '../../../../shared/ui/icons/Icon';

export type MapMarkerColor = 'orange' | 'blue' | 'me';

export type MapMarkerData = {
  id: string;
  lng: number;
  lat: number;
  label?: string;
  color?: MapMarkerColor;
  onClick?: () => void;
};

export type MapViewHandle = {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
};

type MapViewProps = {
  center: { lng: number; lat: number };
  zoom?: number;
  markers?: MapMarkerData[];
  height?: number | string;
  showControls?: boolean;
  interactive?: boolean;
  /** When false, the mouse wheel does not zoom the map (page scrolls instead). */
  scrollZoom?: boolean;
  /** Marker id to render in the highlighted/active state. */
  activeId?: string;
  className?: string;
};

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    center,
    zoom = 12,
    markers = [],
    height = '100%',
    showControls = true,
    interactive = true,
    scrollZoom,
    activeId,
    className,
  },
  ref,
): ReactElement {
  const mapRef = useRef<MapRef | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lng, lat, z) => {
        const map = mapRef.current;
        if (!map) return;
        map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 800 });
      },
    }),
    [],
  );

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        interactive={interactive}
        scrollZoom={scrollZoom}
      >
        {showControls ? <NavigationControl position="bottom-right" showCompass={false} /> : null}
        {markers.map((m) => (
          <Marker
            key={m.id}
            longitude={m.lng}
            latitude={m.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              m.onClick?.();
            }}
          >
            <MarkerVisual
              color={m.color ?? 'orange'}
              clickable={Boolean(m.onClick)}
              active={m.id === activeId}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
});

function MarkerVisual({
  color,
  clickable,
  active,
}: {
  color: MapMarkerColor;
  clickable: boolean;
  active: boolean;
}): ReactElement {
  if (color === 'me') {
    return <span className="map-dot-me" style={{ position: 'relative', transform: 'none' }} />;
  }
  return (
    <span
      className={'map-pin ' + color + (active ? ' active' : '')}
      style={{ position: 'relative', transform: 'none', cursor: clickable ? 'pointer' : 'default' }}
    >
      <span className="pin-bubble">
        {color === 'orange' ? <Icon name="fire" size={14} /> : <Icon name="pin" size={13} />}
      </span>
    </span>
  );
}
