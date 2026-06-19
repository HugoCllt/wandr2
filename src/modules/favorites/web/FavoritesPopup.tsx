'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import type { FeedItemDTO, FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import { ActivityCategories } from '../../activities/domain/ActivityCategorySet';
import { ActivityModal } from '../../activities/web/ActivityModal/ActivityModal';
import { MapView, type MapMarkerData } from '../../activities/web/Map/MapView';
import { categoryIconFor, categoryLabelFor } from '../../activities/web/cards/categoryMeta';

const MONTREAL_CENTER = { lng: -73.5674, lat: 45.5019 };

type FavoritesPopupProps = {
  open: boolean;
  onClose: () => void;
};

export function FavoritesPopup({ open, onClose }: FavoritesPopupProps): ReactElement | null {
  const [items, setItems] = useState<FeedItemDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ActivityDTO | null>(null);

  useEffect(() => {
    if (!open || items !== null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/favorites/feed?limit=50', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Échec du chargement : ${res.status}`);
        return res.json() as Promise<FeedResultDTO>;
      })
      .then((dto) => {
        if (!cancelled) setItems(dto.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Échec du chargement.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) setSelected(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selected, onClose]);

  const groups = useMemo(() => {
    if (!items) return [];
    return ActivityCategories.map((category) => ({
      category,
      items: items.filter((a) => a.categories.primary === category),
    })).filter((g) => g.items.length > 0);
  }, [items]);

  const markers = useMemo<MapMarkerData[]>(() => {
    if (!items) return [];
    return items
      .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
      .map((a) => ({
        id: a.id,
        lng: a.longitude,
        lat: a.latitude,
        label: a.title,
        color: a.kind === 'EVENT' ? 'orange' : 'blue',
        onClick: () => setSelected(a),
      }));
  }, [items]);

  const center = useMemo(() => {
    if (markers.length === 0) return MONTREAL_CENTER;
    const sum = markers.reduce((acc, m) => ({ lng: acc.lng + m.lng, lat: acc.lat + m.lat }), {
      lng: 0,
      lat: 0,
    });
    return { lng: sum.lng / markers.length, lat: sum.lat / markers.length };
  }, [markers]);

  if (!open) return null;

  const hasFavorites = (items?.length ?? 0) > 0;

  return (
    <>
    <div role="presentation" className="fav-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vos favoris"
        className="fav-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fav-modal-head">
          <h2>Vos favoris</h2>
          <button type="button" className="fav-close" onClick={onClose} aria-label="Fermer">
            <Icon name="close" size={16} stroke={2.2} />
          </button>
        </div>

        {loading && <p className="fav-state">Chargement…</p>}
        {error && !loading && <p className="fav-state">{error}</p>}
        {!loading && !error && !hasFavorites && (
          <p className="fav-state">Aucun favori pour le moment.</p>
        )}

        {!loading && !error && hasFavorites && (
          <div className="fav-body">
            {markers.length > 0 && (
              <div className="fav-map">
                <MapView center={center} zoom={11} markers={markers} showControls={false} />
              </div>
            )}

            <div className="fav-groups">
              {groups.map((g) => (
                <div key={g.category} className="fav-group">
                  <div className="fav-group-head">
                    <Icon name={categoryIconFor(g.category)} size={15} />
                    {categoryLabelFor(g.category)}
                  </div>
                  {g.items.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="fav-item"
                      onClick={() => setSelected(a)}
                    >
                      <span className="fav-item-title">{a.title}</span>
                      {a.neighborhood && <span className="fav-item-meta">{a.neighborhood}</span>}
                      <Icon name="chev-right" size={14} />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

      {selected && <ActivityModal activity={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
