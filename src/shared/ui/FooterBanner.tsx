import { Icon } from './icons/Icon';
import { FooterSkyline } from './decor/FooterSkyline';

export function FooterBanner() {
  return (
    <section className="footer-cta">
      <div>
        <h3>Make every day an adventure.</h3>
        <p>Discover plans that match your mood, your people, your city.</p>
      </div>
      <div className="skyline">
        <FooterSkyline />
      </div>
      <button className="btn-primary">
        Let&apos;s Explore
        <Icon name="sparkle" size={14} />
      </button>
    </section>
  );
}
