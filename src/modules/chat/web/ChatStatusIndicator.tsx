import type { ChatStreamPhase } from '../../../shared/contracts/ChatStreamEvent';
import { DotMatrixLoader } from './DotMatrixLoader';

/**
 * What the assistant is doing before any answer text shows: the dot-matrix
 * bloom plus a phase label. The recommendation graph drives the phases —
 * `thinking` (routing), `reflecting` (reading you + planning), `searching`
 * (the web), `synthesizing` (composing the cards); `writing` then swaps to the
 * streaming bubble.
 */
const PHASE_LABEL: Record<ChatStreamPhase, string> = {
  thinking: 'Wandr réfléchit…',
  reflecting: 'Wandr réfléchit à toi…',
  searching: 'Wandr cherche sur le web…',
  synthesizing: 'Wandr compose tes idées…',
  writing: 'Wandr écrit…',
};

export function ChatStatusIndicator({ phase }: { phase: ChatStreamPhase }) {
  return (
    <div className="chat-status" role="status" aria-live="polite">
      <DotMatrixLoader size={40} />
      <span className="chat-status-label">{PHASE_LABEL[phase]}</span>
    </div>
  );
}
