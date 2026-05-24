import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';

import { runTool } from './runTool';

function fakeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
}

describe('runTool', () => {
  it('serializes the result to JSON text content on success', async () => {
    const logger = fakeLogger();

    const res = await runTool(logger, 'demo', async () => ({ ok: true }), () => ({
      level: 'info',
      fields: {},
    }));

    expect(res.isError).toBeUndefined();
    expect(res.content).toEqual([{ type: 'text', text: '{"ok":true}' }]);
    expect(logger.info).toHaveBeenCalledWith({ tool: 'demo' });
  });

  it('logs at warn level and merges fields when logLine says so', async () => {
    const logger = fakeLogger();

    await runTool(logger, 'demo', async () => 1, () => ({
      level: 'warn',
      fields: { outcome: 'REJECTED' },
    }));

    expect(logger.warn).toHaveBeenCalledWith({ tool: 'demo', outcome: 'REJECTED' });
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('maps a thrown error to an isError tool result carrying the message', async () => {
    const logger = fakeLogger();

    const res = await runTool(
      logger,
      'demo',
      async () => {
        throw new Error('boom');
      },
      () => ({ level: 'info', fields: {} }),
    );

    expect(res.isError).toBe(true);
    expect(res.content).toEqual([{ type: 'text', text: 'boom' }]);
    expect(logger.error).toHaveBeenCalledWith({ tool: 'demo', error: 'boom' });
  });
});
