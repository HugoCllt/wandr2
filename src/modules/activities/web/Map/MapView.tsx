'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import type { ReactElement } from 'react';
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre';

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

type MapViewProps = {
  center: { lng: number; lat: number };
  zoom?: number;
  markers?: MapMarkerData[];
  height?: number | string;
  showControls?: boolean;
  interactive?: boolean;
  className?: string;
};

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export function MapView({
  center,
  zoom = 12,
  markers = [],
  height = '100%',
  showControls = true,
  interactive = true,
  className,
}: MapViewProps): ReactElement {
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height }}>
      <Map
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom,
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        interactive={interactive}
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
            <MarkerVisual color={m.color ?? 'orange'} clickable={Boolean(m.onClick)} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}

function MarkerVisual({
  color,
  clickable,
}: {
  color: MapMarkerColor;
  clickable: boolean;
}): ReactElement {
  if (color === 'me') {
    return <span className="map-dot-me" style={{ position: 'relative', transform: 'none' }} />;
  }
  return (
    <span
      className={'map-pin ' + color}
      style={{
        position: 'relative',
        transform: 'none',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span className="pin-bubble">
        {color === 'orange' ? <Icon name="fire" size={14} /> : <Icon name="pin" size={13} />}
      </span>
    </span>
  );
}
