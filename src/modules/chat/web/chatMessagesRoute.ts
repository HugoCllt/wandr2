import { z } from 'zod';

import { parseBody } from '../../../shared/api/parse';
import { getCurrentUser } from '../../../shared/auth/current-user';
import { env } from '../../../shared/config/env';
import type { ChatStreamEvent } from '../../../shared/contracts/ChatStreamEvent';
import { prisma } from '../../../shared/db/prisma';
import { SendChatMessageUseCase, type ChatTurn } from '../application/SendChatMessageUseCase';
import { PremiumRequiredError } from '../domain/PremiumRequiredError';
import { createChatModel } from '../infra/createChatModel';
import { PrismaChatUsageRepository } from '../infra/PrismaChatUsageRepository';
import { PrismaRecommendationContextRepository } from '../infra/PrismaRecommendationContextRepository';
import { TavilyWebSearchProvider } from '../infra/TavilyWebSearchProvider';

const ChatMessageBodySchema = z.object({
  text: z.string().trim().min(1, 'Message text required.'),
  // Conversation memory is client-owned: the thread is replayed each turn.
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string() }))
    .max(50)
    .default([]),
  // Optional context from the input toggles (near me / tonight / solo), folded
  // into the agent's turn without appearing in the user's message bubble.
  context: z.string().trim().max(500).optional(),
});

/** `YYYY-MM` token-usage bucket for the current month (web may read the clock). */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Serialise one event as a single NDJSON line. */
function encodeEvent(event: ChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

/** Module-level singleton: every dep is stateless (model client, Prisma repos),
 * so the use case — and the graph it compiles in its constructor — is built
 * once per process instead of once per request. */
let useCaseSingleton: SendChatMessageUseCase | null = null;
function getUseCase(): SendChatMessageUseCase {
  useCaseSingleton ??= new SendChatMessageUseCase({
    model: createChatModel(),
    usage: new PrismaChatUsageRepository(prisma),
    contextRepo: new PrismaRecommendationContextRepository(prisma),
    webSearch: new TavilyWebSearchProvider(env.TAVILY_API_KEY),
    monthlyTokenCap: env.CHAT_MONTHLY_TOKEN_CAP,
  });
  return useCaseSingleton;
}

export async function chatMessagesPostHandler(request: Request): Promise<Response> {
  const { text, history, context } = await parseBody(ChatMessageBodySchema, request);

  const user = await getCurrentUser();
  // Defence in depth: the page is gated in the UI, the API enforces it too.
  if (!user.isPremium) throw new PremiumRequiredError();

  const turns: ChatTurn[] = history.map((m) => ({ role: m.role, content: m.text }));
  const events = getUseCase().executeStream({
    userId: user.id,
    cityId: user.cityId,
    month: currentMonth(),
    text,
    context,
    history: turns,
    // Aborts the graph (LLM + search calls) when the client disconnects.
    signal: request.signal,
  });

  // Prime the generator so guard errors (cap reached / premium) surface as a
  // normal HTTP status via handleApiError *before* the streamed body opens.
  const iterator = events[Symbol.asyncIterator]();
  const first = await iterator.next();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encodeEvent(first.value));
        for (;;) {
          const { value, done } = await iterator.next();
          if (done) break;
          controller.enqueue(encodeEvent(value));
        }
      } catch (err) {
        // The body is already open — status can't change. Tell the client.
        const message = err instanceof Error ? err.message : 'Stream failed.';
        controller.enqueue(encodeEvent({ type: 'error', message }));
      } finally {
        controller.close();
      }
    },
    // Reader cancelled (client gone) — release the generator; the abort signal
    // above stops the in-flight LLM/search work.
    async cancel() {
      await iterator.return?.(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
