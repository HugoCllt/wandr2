import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Logger } from 'pino';

export type ToolLogLine = {
  level: 'info' | 'warn';
  fields: Record<string, unknown>;
};

/**
 * Shared tool body (spec plan-2 §4.1). Runs the handler, then:
 *  - success → one structured log line on stderr + JSON-serialized result;
 *  - throw   → `isError` tool result carrying the message (the agent learns its
 *              CALL was wrong). Handlers that need "bad data" semantics return a
 *              REJECTED result instead of throwing.
 */
export async function runTool<R>(
  logger: Logger,
  toolName: string,
  handle: () => Promise<R>,
  logLine: (result: R) => ToolLogLine,
): Promise<CallToolResult> {
  try {
    const result = await handle();
    const { level, fields } = logLine(result);
    const payload = { tool: toolName, ...fields };
    if (level === 'warn') {
      logger.warn(payload);
    } else {
      logger.info(payload);
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ tool: toolName, error: message });
    return { content: [{ type: 'text' as const, text: message }], isError: true };
  }
}
