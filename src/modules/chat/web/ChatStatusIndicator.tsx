import type { ChatStreamPhase } from '../../../shared/contracts/ChatStreamEvent';
import { DotMatrixLoader } from './DotMatrixLoader';

/**
 * What the assistant is doing before any answer text shows: the dot-matrix
 * bloom plus a phase label. Today only `thinking` reaches here (writing swaps
 * to the streaming bubble); the map keeps a `writing` label for completeness
 * and is where future phases ('recherche sur le web…') get their copy.
 */
const PHASE_LABEL: Record<ChatStreamPhase, string> = {
  thinking: 'Wandr réfléchit…',
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
