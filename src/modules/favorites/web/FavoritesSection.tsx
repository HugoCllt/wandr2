'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Icon } from '../../../shared/ui/icons/Icon';
import { FavoritesPopup } from './FavoritesPopup';

export function FavoritesSection({ favoritesCount }: { favoritesCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="profile-actions">
      <h3>Favoris</h3>
      <div className="qa-grid">
        <button type="button" className="qa-btn" onClick={() => setOpen(true)}>
          <span className="qa-icon warm">
            <Icon name="heart" size={18} />
          </span>
          <span>
            <div>Favoris</div>
            <div className="qa-meta">{favoritesCount} enregistrés</div>
          </span>
          <Icon name="chev-right" size={14} />
        </button>

        <Link href="/calendar" className="qa-btn">
          <span className="qa-icon cream">
            <Icon name="calendar" size={18} />
          </span>
          <span>
            <div>Calendrier</div>
            <div className="qa-meta">Voir le calendrier</div>
          </span>
          <Icon name="chev-right" size={14} />
        </Link>
      </div>

      <FavoritesPopup open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
