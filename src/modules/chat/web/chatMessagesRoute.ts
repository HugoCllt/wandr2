import { NextResponse } from 'next/server';

import { getCurrentUser } from '../../../shared/auth/current-user';
import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import type { ChatMessageDTO } from '../../../shared/contracts/ChatMessageDTO';
import { SendChatMessageUseCase } from '../application/SendChatMessageUseCase';
import { MockChatProvider } from '../infra/MockChatProvider';
import { MockChatRepository } from '../infra/MockChatRepository';

const HARDCODED_SUGGESTIONS: ActivityDTO[] = [
  {
    id: 'mock-suggestion-rooftop',
    slug: 'mock-suggestion-rooftop',
    title: 'Terrasse Nelligan',
    description:
      'Eight floors up in Old Montréal, a low-lit DJ set rolls from house to disco and the Old Port glitters underneath you.',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    kind: 'PLACE',
    categories: { primary: 'NIGHTLIFE', secondary: [] },
    address: '106 Saint-Paul St W, Montréal, QC',
    neighborhood: 'Old Montreal',
    latitude: 45.5017,
    longitude: -73.5546,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 2500,
    priceMaxCents: null,
    externalUrl: null,
    indoor: true,
    outdoor: true,
    isFeatured: true,
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-suggestion-spa',
    slug: 'mock-suggestion-spa',
    title: 'Bota Bota Floating Spa',
    description: 'Steam, river views, and an evening of stillness on a converted ferry boat.',
    imageUrl:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
    kind: 'PLACE',
    categories: { primary: 'ROMANTIC', secondary: [] },
    address: 'McGill Pier, Old Port, Montréal',
    neighborhood: 'Old Port',
    latitude: 45.5,
    longitude: -73.55,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 4500,
    priceMaxCents: null,
    externalUrl: null,
    indoor: true,
    outdoor: true,
    isFeatured: true,
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function chatMessagesPostHandler(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { text?: string };
  const text = (body.text ?? '').trim();
  if (text.length === 0) {
    return NextResponse.json({ error: 'Message text required.' }, { status: 400 });
  }

  const user = await getCurrentUser();
  const repo = new MockChatRepository();
  const provider = new MockChatProvider();
  const useCase = new SendChatMessageUseCase(repo, provider);
  const thread = await repo.getThreadForUser(user.id);
  const result = await useCase.execute({ userId: user.id, threadId: thread.id, text });

  const userDto: ChatMessageDTO = {
    id: result.userMessage.id,
    role: result.userMessage.role,
    text: result.userMessage.text,
    suggestedActivities: [],
    createdAt: result.userMessage.createdAt.toISOString(),
  };

  const assistantDto: ChatMessageDTO = {
    id: result.assistantMessage.id,
    role: result.assistantMessage.role,
    text: result.assistantMessage.text,
    suggestedActivities: HARDCODED_SUGGESTIONS,
    createdAt: result.assistantMessage.createdAt.toISOString(),
  };

  return NextResponse.json({ userMessage: userDto, assistantMessage: assistantDto });
}
