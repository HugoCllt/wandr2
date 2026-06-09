'use client';

import { useEffect, useState } from 'react';

import { Icon } from './icons/Icon';

const PREMIUM_PICK_IMG =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=200&q=80';

const PREMIUM_FEATURES = [
  {
    icon: 'chat' as const,
    title: 'Compagnon de voyage IA',
    desc: "Discutez avec l'assistant pour bâtir un week-end ou un itinéraire complet à Montréal — étape par étape, à votre rythme.",
  },
  {
    icon: 'compass' as const,
    title: 'Recommandations sur mesure',
    desc: "Précisez vos critères au fil de la conversation — quartier, budget, ambiance, météo — et l'assistant trouve l'activité juste pour vous.",
  },
  {
    icon: 'calendar' as const,
    count: '3',
    title: "Suivez jusqu'à 3 activités",
    desc: 'Recevez chaque jour des mises à jour sur les événements et les activités liés aux sujets que vous suivez.',
  },
];

export function PremiumModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="prem-overlay" onClick={onClose}>
      <div className="prem-modal" onClick={(e) => e.stopPropagation()}>
        <button className="prem-close" onClick={onClose} aria-label="Fermer">
          <Icon name="close" size={18} stroke={2.2} />
        </button>
        <div className="prem-scroll">
          <div className="prem-top">
            <span className="prem-badge">
              <Icon name="gem" size={14} /> Wandr Premium
            </span>
            <h2 className="prem-title">Le meilleur de Montréal, planifié pour vous.</h2>
            <p className="prem-sub">
              Un assistant qui apprend ce que vous aimez — pour planifier, découvrir et suivre vos
              sorties sans effort.
            </p>
          </div>
          <div className="prem-body">
            {PREMIUM_FEATURES.map((f) => (
              <div className="prem-feat" key={f.title}>
                <span className="ico">
                  <Icon name={f.icon} size={24} />
                  {'count' in f && f.count ? <span className="count">{f.count}</span> : null}
                </span>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="prem-foot">
          <div className="prem-price-blk">
            <span className="prem-price-num">9,99 $</span>
            <span className="prem-price-unit">/ mois · annulez à tout moment</span>
          </div>
          <div className="prem-cta-row">
            <button className="prem-later" onClick={onClose}>
              Plus tard
            </button>
            <button className="btn-primary" onClick={onClose}>
              Passer à Premium <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium upsell band (with a static AI-companion preview) + recap modal.
 * DTO-free chrome → shared/ui. The modal is opened by the band CTA via local
 * state (no window globals).
 */
export function Premium() {
  const [open, setOpen] = useState(false);

  return (
    <section className="section premium">
      <div className="premium-band">
        <div className="pb-main">
          <span className="pb-badge">
            <Icon name="gem" size={14} /> Wandr Premium
          </span>
          <h2 className="pb-title">Votre compagnon d&apos;activité, propulsé par l&apos;IA.</h2>
          <p className="pb-sub">
            Planifiez vos sorties en discutant, trouvez l&apos;activité parfaite selon vos envies,
            et laissez Wandr veiller sur ce qui compte pour vous.
          </p>
          <div className="pb-feats">
            <div className="pb-feat">
              <span className="ico">
                <Icon name="chat" size={16} />
              </span>{' '}
              Planifiez un voyage en conversation
            </div>
            <div className="pb-feat">
              <span className="ico">
                <Icon name="compass" size={16} />
              </span>{' '}
              Des suggestions selon vos critères
            </div>
            <div className="pb-feat">
              <span className="ico">
                <Icon name="calendar" size={16} />
              </span>{' '}
              Suivi quotidien de 3 activités
            </div>
          </div>
          <div className="pb-cta-row">
            <button className="btn-primary" onClick={() => setOpen(true)}>
              Découvrir Premium <Icon name="arrow-right" size={16} />
            </button>
            <div className="pb-price">
              À partir de <b>9,99 $ / mois</b>
            </div>
          </div>
        </div>
        <div className="pb-aside">
          <div className="pb-chat">
            <div className="pb-chat-head">
              <span className="pb-chat-avatar">
                <Icon name="sparkle" size={17} />
              </span>
              <div className="pb-chat-id">
                <span className="pb-chat-name">Compagnon Wandr</span>
                <span className="pb-chat-status">
                  <span className="live" /> En ligne
                </span>
              </div>
            </div>
            <div className="bubble ai">Que cherchez-vous à faire ce week-end&nbsp;?</div>
            <div className="bubble me">Plein air, près du fleuve, moins de 40&nbsp;$</div>
            <div className="bubble ai">Voici une idée qui correspond — au coucher du soleil&nbsp;:</div>
            <div className="pb-pick">
              <span className="pb-pick-img" style={{ backgroundImage: `url(${PREMIUM_PICK_IMG})` }} />
              <span className="pb-pick-tx">
                <b>Belvédère du Mont-Royal</b>
                <span>Plateau · Gratuit</span>
              </span>
              <span className="pb-pick-go">
                <Icon name="arrow-right" size={16} />
              </span>
            </div>
            <div className="pb-track">
              <span className="pb-track-l">
                <Icon name="calendar" size={15} /> Suivi quotidien
              </span>
              <span className="pb-track-dots">
                <i />
                <i />
                <i className="off" />
              </span>
            </div>
          </div>
        </div>
      </div>
      {open && <PremiumModal onClose={() => setOpen(false)} />}
    </section>
  );
}
