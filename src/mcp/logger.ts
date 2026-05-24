import pino from 'pino';

// stdio transport: stdout carries JSON-RPC ONLY. Every log line must go to
// stderr (fd 2), so we do NOT reuse src/shared/obs/logger.ts (which writes to
// stdout and would corrupt the protocol stream). spec plan-2 §6 / Q9.
export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' }, pino.destination(2));
