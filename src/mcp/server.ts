import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { prisma } from './db';
import { createDeps } from './deps';
import { logger } from './logger';
import { registerArchiveActivity } from './tools/archiveActivity';
import { registerConfirmActivity } from './tools/confirmActivity';
import { registerIngestActivity } from './tools/ingestActivity';
import { registerListActivities } from './tools/listActivities';
import { registerListActivitiesDueForRecheck } from './tools/listActivitiesDueForRecheck';
import { registerUpdateActivityImage } from './tools/updateActivityImage';

async function main(): Promise<void> {
  // Fail fast with a clear stderr message if the DB is unreachable — an
  // ingestion server with no database is non-functional.
  try {
    await prisma.$connect();
    logger.info({ msg: 'database connected' });
  } catch (error) {
    logger.error({
      msg: 'database unreachable — aborting startup',
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const deps = createDeps(prisma);
  const server = new McpServer({ name: 'wandr-ingestion', version: '0.1.0' });

  registerIngestActivity(server, deps.ingest, logger);
  registerListActivitiesDueForRecheck(server, deps.list, logger);
  registerConfirmActivity(server, deps.confirm, logger);
  registerArchiveActivity(server, deps.archive, logger);
  registerListActivities(server, deps.listActivities, logger);
  registerUpdateActivityImage(server, deps.updateImage, logger);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info({ msg: 'wandr-ingestion MCP server ready (stdio)' });
}

main().catch((error) => {
  logger.error({ msg: 'fatal', error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
