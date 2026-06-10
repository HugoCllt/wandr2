'use client';

import { useEffect, useState } from 'react';

import type { ChatStreamPhase } from '../../../shared/contracts/ChatStreamEvent';
import { DotMatrixLoader } from './DotMatrixLoader';

/**
 * What the assistant is doing before any answer text shows: the dot-matrix
 * bloom plus a rotating phase label (Claude-style). Each pool stays honest
 * about the graph's real phase — `thinking` (routing), `reflecting` (reading
 * you + planning), `searching` (the web), `synthesizing` (composing the
 * cards); `writing` then swaps to the streaming bubble.
 */
const PHASE_LABELS: Record<ChatStreamPhase, string[]> = {
  thinking: [
    'Wandr réfléchit…',
    'Wandr se creuse la tête…',
    'Wandr hume l’air du soir…',
    'Wandr tend l’oreille…',
  ],
  reflecting: [
    'Wandr réfléchit à toi…',
    'Wandr relit tes envies…',
    'Wandr feuillette tes souvenirs…',
    'Wandr trace des pistes…',
  ],
  searching: [
    'Wandr fouine dans les ruelles…',
    'Wandr arpente Montréal…',
    'Wandr déniche des pépites…',
    'Wandr écume le web…',
    'Wandr lève chaque pierre…',
  ],
  synthesizing: [
    'Wandr mijote des idées…',
    'Wandr compose tes cartes…',
    'Wandr peaufine la sélection…',
    'Wandr fait le tri…',
  ],
  writing: ['Wandr écrit…', 'Wandr trempe sa plume…'],
};

const ROTATE_MS = 2600;

export function ChatStatusIndicator({ phase }: { phase: ChatStreamPhase }) {
  const [index, setIndex] = useState(0);

  // Restart the rotation whenever the graph enters a new phase.
  useEffect(() => {
    setIndex(0);
    const pool = PHASE_LABELS[phase];
    if (pool.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % pool.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [phase]);

  const pool = PHASE_LABELS[phase];
  const label = pool[index % pool.length];

  return (
    <div className="chat-status" role="status" aria-live="polite">
      <DotMatrixLoader size={40} />
      {/* Remount per label so the fade-in replays on every rotation. */}
      <span key={label} className="chat-status-label">
        {label}
      </span>
    </div>
  );
}
