export type ChatProviderResponse = {
  text: string;
  suggestedActivityIds: string[];
};

export interface IChatProvider {
  reply(input: { userMessage: string; userId: string }): Promise<ChatProviderResponse>;
}
