import Link from 'next/link';

import { Icon } from './icons/Icon';

const EXPLORE = [
  { label: 'Accueil', href: '/' },
  { label: 'Sport', href: '/sport' },
  { label: 'Gastronomie', href: '/dining' },
  { label: 'Culture', href: '/culture' },
  { label: 'Plein air', href: '/outdoor' },
];
const ABOUT = [
  { label: 'Notre mission', href: '/' },
  { label: 'Premium', href: '/' },
  { label: 'Calendrier', href: '/calendar' },
  { label: 'Assistant', href: '/chat' },
];

/**
 * Multi-column site footer. DTO-free chrome → shared/ui. Internal links use
 * next/link; the social links are inert placeholders for the POC.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <span className="footer-word">wandr</span>
          <p>
            Le meilleur de Montréal, choisi à la main — activités, sorties et découvertes au fil de
            vos envies.
          </p>
        </div>
        <div className="footer-col">
          <h4>Explorer</h4>
          {EXPLORE.map((l) => (
            <Link key={l.label} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h4>À propos</h4>
          {ABOUT.map((l) => (
            <Link key={l.label} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h4>Suivez-nous</h4>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">
              <Icon name="instagram" size={18} />
            </a>
            <a href="#" aria-label="Facebook">
              <Icon name="facebook" size={18} />
            </a>
            <a href="#" aria-label="X">
              <Icon name="x" size={18} />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bar">
        <span>© {new Date().getFullYear()} Wandr · Montréal</span>
        <div className="links">
          <a href="#">Confidentialité</a>
          <a href="#">Conditions</a>
        </div>
      </div>
    </footer>
  );
}
