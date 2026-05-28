'use client';

import { useState } from 'react';

import {
  PROFILE_AFFINITY_CATEGORIES,
  type ProfileAffinityCategory,
  type ProfileFormDTO,
  type ProfileGender,
} from '../../../shared/contracts/ProfileFormDTO';
import { Icon } from '../../../shared/ui/icons/Icon';

const GENDERS: { value: ProfileGender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const CATEGORY_LABELS: Record<ProfileAffinityCategory, string> = {
  SPORT: 'Sport',
  FOOD: 'Dining',
  CULTURE: 'Culture',
  OUTDOOR: 'Outdoor',
  NIGHTLIFE: 'Nightlife',
  ROMANTIC: 'Romantic',
};

const BIO_MAX = 280;

/** Form-state seed — like the DTO but gender may be unset (fresh onboarding). */
export type ProfileFormInitial = Omit<ProfileFormDTO, 'gender'> & { gender: ProfileGender | '' };

type Props = {
  initial: ProfileFormInitial;
  dismissable: boolean;
  onSubmit: (form: ProfileFormDTO) => Promise<void>;
  onClose?: () => void;
};

export function ProfileFormModal({ initial, dismissable, onSubmit, onClose }: Props) {
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [gender, setGender] = useState<ProfileGender | ''>(initial.gender);
  const [bio, setBio] = useState(initial.bio);
  const [affinities, setAffinities] = useState<Record<ProfileAffinityCategory, number>>(
    initial.affinities,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = dismissable ? onClose : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!birthDate) return setError('Please enter your date of birth.');
    if (!gender) return setError('Please select a gender.');
    setBusy(true);
    try {
      await onSubmit({ birthDate, gender, cityId: initial.cityId, bio, affinities });
    } catch {
      setError('Could not save your profile. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="act-overlay" onClick={close ? () => close() : undefined}>
      <div className="act-modal profile-modal" onClick={(e) => e.stopPropagation()}>
        {dismissable && close && (
          <button className="act-close" onClick={() => close()} aria-label="Close">
            <Icon name="close" size={16} stroke={2.2} />
          </button>
        )}

        <form className="profile-form act-scroll" onSubmit={handleSubmit}>
          <h1 className="profile-form-title">
            {dismissable ? 'Edit your profile' : 'Welcome — tell us about you'}
          </h1>
          <p className="profile-form-sub">
            We use this to personalize your Montréal feed.
          </p>

          <div className="pf-row">
            <label className="pf-field">
              <span>Date of birth</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </label>

            <label className="pf-field">
              <span>City</span>
              <select value={initial.cityId} disabled>
                <option value={initial.cityId}>Montréal</option>
              </select>
            </label>
          </div>

          <fieldset className="pf-field">
            <span>Gender</span>
            <div className="pf-radios">
              {GENDERS.map((g) => (
                <label key={g.value} className={'pf-radio ' + (gender === g.value ? 'on' : '')}>
                  <input
                    type="radio"
                    name="gender"
                    value={g.value}
                    checked={gender === g.value}
                    onChange={() => setGender(g.value)}
                  />
                  {g.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="pf-field">
            <span>
              Bio <em className="pf-count">{bio.length}/{BIO_MAX}</em>
            </span>
            <textarea
              value={bio}
              maxLength={BIO_MAX}
              rows={3}
              placeholder="Your vibe in a sentence…"
              onChange={(e) => setBio(e.target.value)}
            />
          </label>

          <div className="pf-field">
            <span>Your interests</span>
            <div className="pf-sliders">
              {PROFILE_AFFINITY_CATEGORIES.map((cat) => (
                <div key={cat} className="pf-slider">
                  <label htmlFor={`aff-${cat}`}>{CATEGORY_LABELS[cat]}</label>
                  <input
                    id={`aff-${cat}`}
                    type="range"
                    min={0}
                    max={10}
                    value={affinities[cat]}
                    onChange={(e) =>
                      setAffinities((prev) => ({ ...prev, [cat]: Number(e.target.value) }))
                    }
                  />
                  <span className="pf-slider-val">{affinities[cat]}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Saving…' : dismissable ? 'Save changes' : 'Get started'}
          </button>
        </form>
      </div>
    </div>
  );
}
