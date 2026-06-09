import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

import { env } from '../../../shared/config/env';

/**
 * Builds the chat model from env — the only infra spot that reads chat config.
 * Ollama and OpenRouter both expose an OpenAI-compatible API, so a single
 * `ChatOpenAI` binding covers both, differing only by `baseURL` (and key).
 */
export function createChatModel(): BaseChatModel {
  if (env.CHAT_LLM_PROVIDER === 'openrouter') {
    return new ChatOpenAI({
      model: env.OPENROUTER_MODEL,
      apiKey: env.OPENROUTER_API_KEY,
      temperature: 0.7,
      streamUsage: true,
      configuration: { baseURL: 'https://openrouter.ai/api/v1' },
    });
  }

  // Ollama's OpenAI-compatible endpoint lives at `${baseURL}/v1`; the API key
  // is unused by Ollama but the OpenAI client requires a non-empty value.
  return new ChatOpenAI({
    model: env.OLLAMA_MODEL,
    apiKey: 'ollama',
    temperature: 0.7,
    streamUsage: true,
    configuration: { baseURL: `${env.OLLAMA_BASE_URL}/v1` },
  });
}
