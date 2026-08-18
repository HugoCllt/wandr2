'use client';

import { useEffect, useState } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon, type IconName } from '../../../../shared/ui/icons/Icon';
import { FlameRow } from '../../../../shared/ui/icons/FlameRow';
import { MapView } from '../Map/MapView';
import { coverImageUrl } from '../cards/coverImage';

type ActivityModalProps = {
  activity: ActivityDTO;
  onClose: () => void;
};

function formatPrice(a: ActivityDTO): { price: string | null; unit: string | null } {
  if (a.priceMinCents <= 0) return { price: null, unit: 'Entrée gratuite' };
  const min = (a.priceMinCents / 100).toFixed(0);
  if (a.priceMaxCents && a.priceMaxCents > a.priceMinCents) {
    const max = (a.priceMaxCents / 100).toFixed(0);
    return { price: `${min}–${max} $`, unit: null };
  }
  return { price: `${min} $+`, unit: null };
}

function formatWhen(a: ActivityDTO): string | null {
  if (a.kind === 'PLACE') return 'Ouvert tous les jours';
  if (!a.dateStart) return null;
  const d = new Date(a.dateStart);
  return d.toLocaleString('fr-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ActivityModal({ activity, onClose }: ActivityModalProps) {
  const a = activity;
  const gallery = [coverImageUrl(a)];
  const [main, setMain] = useState(0);

  const when = formatWhen(a);
  const { price, unit } = formatPrice(a);

  useEffect(() => {
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, []);

  return (
    <div className="act-overlay" data-lenis-prevent onClick={onClose}>
      <div className="act-modal" onClick={(e) => e.stopPropagation()}>
        <button className="act-close" onClick={onClose} aria-label="Fermer">
          <Icon name="close" size={16} stroke={2.2} />
        </button>

        <div className="act-scroll">
          <div className="act-hero">
            <div
              className="act-hero-img"
              style={{ backgroundImage: `url(${gallery[main]})` }}
            />
            <div className="act-hero-meta">
              <div>
                {a.isFeatured && (
                  <div className="act-badges">
                    <span className="act-badge warm">
                      <Icon name="fire" size={11} />
                      À la une
                    </span>
                  </div>
                )}
                <h1 className="act-h1">{a.title}</h1>
              </div>
              <div className="act-flames-pill">
                <FlameRow value={3} size={12} />
                <span>Tendance</span>
              </div>
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="act-thumbs">
              {gallery.slice(0, 5).map((g, i) => (
                <button
                  key={i}
                  className={'act-thumb ' + (i === main ? 'active' : '')}
                  style={{ backgroundImage: `url(${g})` }}
                  onClick={() => setMain(i)}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}

          <div className="act-body">
            <div>
              <h3>À propos de cette activité</h3>
              <p className="act-desc">{a.description}</p>

              <h3>Bon à savoir</h3>
              <div className="act-info-grid">
                {when && <InfoItem icon="calendar" label="Quand" value={when} />}
                {a.neighborhood && (
                  <InfoItem icon="pin" label="Quartier" value={a.neighborhood} />
                )}
                {(a.indoor || a.outdoor) && (
                  <InfoItem
                    icon="compass"
                    label="Cadre"
                    value={a.indoor && a.outdoor ? 'Intérieur et extérieur' : a.indoor ? 'Intérieur' : 'Extérieur'}
                  />
                )}
                <InfoItem
                  icon="sparkle"
                  label="Type"
                  value={a.kind === 'EVENT' ? 'Événement' : 'Lieu'}
                />
              </div>
            </div>

            <div className="act-side">
              <h3>Emplacement</h3>
              <div className="act-mini-map">
                <MapView
                  center={{ lng: a.longitude, lat: a.latitude }}
                  zoom={14}
                  markers={[
                    {
                      id: a.id,
                      lng: a.longitude,
                      lat: a.latitude,
                      color: 'orange',
                    },
                  ]}
                  showControls={false}
                  interactive={false}
                />
              </div>
              <div className="act-address-row">
                <div className="act-address">
                  <span className="ico">
                    <Icon name="pin" size={14} />
                  </span>
                  <span>{a.address}</span>
                </div>
                <a
                  className="act-directions"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Itinéraire <Icon name="arrow-right" size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="act-footer">
          <div className="act-price-blk">
            {price && <span className="act-price-num">{price}</span>}
            {unit && <span className="act-price-unit">{unit}</span>}
            {!price && !unit && <span className="act-price-unit">Voir le site</span>}
          </div>
          <div className="act-cta-row">
            {a.externalUrl && (
              <a className="act-cta" href={a.externalUrl} target="_blank" rel="noreferrer">
                Réserver <Icon name="arrow-right" size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="act-info">
      <span className="ico">
        <Icon name={icon} size={15} />
      </span>
      <div>
        <div className="act-info-key">{label}</div>
        <div className="act-info-val">{value}</div>
      </div>
    </div>
  );
}
