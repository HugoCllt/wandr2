import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseBody } from '../../../shared/api/parse';
import { getCurrentUser } from '../../../shared/auth/current-user';
import { env } from '../../../shared/config/env';
import type { ChatMessageDTO } from '../../../shared/contracts/ChatMessageDTO';
import { prisma } from '../../../shared/db/prisma';
import { SendChatMessageUseCase, type ChatTurn } from '../application/SendChatMessageUseCase';
import { PremiumRequiredError } from '../domain/PremiumRequiredError';
import { createChatModel } from '../infra/createChatModel';
import { PrismaChatUsageRepository } from '../infra/PrismaChatUsageRepository';

const ChatMessageBodySchema = z.object({
  text: z.string().trim().min(1, 'Message text required.'),
  // Conversation memory is client-owned: the thread is replayed each turn.
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string() }))
    .max(50)
    .default([]),
});

/** `YYYY-MM` token-usage bucket for the current month (web may read the clock). */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function chatMessagesPostHandler(request: Request): Promise<NextResponse> {
  const { text, history } = await parseBody(ChatMessageBodySchema, request);

  const user = await getCurrentUser();
  // Defence in depth: the page is gated in the UI, the API enforces it too.
  if (!user.isPremium) throw new PremiumRequiredError();

  const useCase = new SendChatMessageUseCase({
    model: createChatModel(),
    usage: new PrismaChatUsageRepository(prisma),
    monthlyTokenCap: env.CHAT_MONTHLY_TOKEN_CAP,
  });

  const turns: ChatTurn[] = history.map((m) => ({ role: m.role, content: m.text }));
  const result = await useCase.execute({
    userId: user.id,
    month: currentMonth(),
    text,
    history: turns,
  });

  const nowIso = new Date().toISOString();
  const userMessage: ChatMessageDTO = {
    id: newId(),
    role: 'user',
    text,
    suggestedActivities: [],
    createdAt: nowIso,
  };
  const assistantMessage: ChatMessageDTO = {
    id: newId(),
    role: 'assistant',
    text: result.text,
    suggestedActivities: [],
    createdAt: nowIso,
  };

  return NextResponse.json({ userMessage, assistantMessage });
}
