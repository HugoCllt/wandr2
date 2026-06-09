import type {
  BaseChatModel,
  BaseChatModelCallOptions,
} from '@langchain/core/language_models/chat_models';
import { type AIMessage, type BaseMessage, HumanMessage } from '@langchain/core/messages';
import type { z } from 'zod';

import type { TokenUsage } from '../domain/TokenUsage';
import { addTokenUsage, toTokenUsage, ZERO_USAGE } from './tokenUsage';

/** Raised when the model can't produce schema-valid JSON within the retry budget. */
export class StructuredCallError extends Error {
  constructor(message: string) {
    super(`Structured call failed: ${message}`);
    this.name = 'StructuredCallError';
  }
}

/** Pull the first `{...}` / `[...]` block out of a model reply (tolerates code fences / prose). */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.search(/[[{]/);
  if (start === -1) return body;
  const open = body[start];
  const close = open === '{' ? '}' : ']';
  const end = body.lastIndexOf(close);
  return end > start ? body.slice(start, end + 1) : body.slice(start);
}

/**
 * Structured output for a small local model (Gemma) the deterministic way:
 * JSON-mode + Zod parse + one repair retry — no tool-calling / `withStructuredOutput`
 * (Gemma's function-calling is unreliable). Returns the parsed value plus the
 * summed token usage of every attempt. Throws `StructuredCallError` if the
 * retry still fails — callers decide the fallback.
 */
export async function structuredCall<T>(
  model: BaseChatModel,
  messages: BaseMessage[],
  schema: z.ZodType<T>,
): Promise<{ value: T; usage: TokenUsage }> {
  // JSON-mode for the OpenAI-compatible endpoint (Ollama honours it). Typed as
  // a generic BaseChatModel here, so the OpenAI-specific option is cast through.
  const json = model.withConfig({
    response_format: { type: 'json_object' },
  } as unknown as Partial<BaseChatModelCallOptions>);

  let usage = ZERO_USAGE;
  let lastError = 'no response';
  let convo = messages;

  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = (await json.invoke(convo)) as AIMessage;
    usage = addTokenUsage(usage, toTokenUsage(reply.usage_metadata));

    const text = typeof reply.content === 'string' ? reply.content : JSON.stringify(reply.content);
    try {
      const parsed = schema.parse(JSON.parse(extractJson(text)));
      return { value: parsed, usage };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // Repair pass: show the model its own output and the parse error.
      convo = [
        ...convo,
        reply,
        new HumanMessage(
          `Ta réponse n'est pas du JSON valide pour le schéma attendu (${lastError}). Renvoie UNIQUEMENT le JSON corrigé, sans texte autour.`,
        ),
      ];
    }
  }

  throw new StructuredCallError(lastError);
}
