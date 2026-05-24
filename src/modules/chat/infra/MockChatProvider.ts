import type { ChatProviderResponse, IChatProvider } from '../domain/IChatProvider';

const CANNED_RESPONSES = [
  "Here's a curated short-list — warm, intimate spots that match your vibe tonight.",
  'These three keep coming up — Old Montréal classics with a younger energy.',
  "I'd point you here — close to you, and trending this week.",
];

export class MockChatProvider implements IChatProvider {
  async reply(_input: { userMessage: string; userId: string }): Promise<ChatProviderResponse> {
    const text = CANNED_RESPONSES[Math.floor(Math.random() * CANNED_RESPONSES.length)];
    return {
      text,
      suggestedActivityIds: [],
    };
  }
}
