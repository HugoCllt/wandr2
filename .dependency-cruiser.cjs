/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Cycles are forbidden anywhere.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-no-upward',
      severity: 'error',
      comment: 'domain must not depend on application, infra, or web.',
      from: { path: '^src/modules/[^/]+/domain' },
      to: {
        path: [
          '^src/modules/[^/]+/application',
          '^src/modules/[^/]+/infra',
          '^src/modules/[^/]+/web',
          '^src/app',
        ],
      },
    },
    {
      name: 'application-no-infra-or-web',
      severity: 'error',
      comment: 'application must not depend on infra or web.',
      from: { path: '^src/modules/[^/]+/application' },
      to: {
        path: ['^src/modules/[^/]+/infra', '^src/modules/[^/]+/web', '^src/app'],
      },
    },
    {
      name: 'infra-no-application-or-web',
      severity: 'error',
      comment: 'infra adapters must not depend on application or web.',
      from: { path: '^src/modules/[^/]+/infra' },
      to: {
        path: ['^src/modules/[^/]+/application', '^src/modules/[^/]+/web', '^src/app'],
      },
    },
    {
      name: 'web-no-infra-direct',
      severity: 'error',
      comment: 'web (Next.js app) must not import infra adapters directly; go through application.',
      from: { path: '^src/app' },
      to: { path: '^src/modules/[^/]+/infra' },
    },
    {
      name: 'modules-no-app',
      severity: 'error',
      comment: 'modules must never import from app/.',
      from: { path: '^src/modules' },
      to: { path: '^src/app' },
    },
    {
      name: 'feed-no-chat-dep',
      severity: 'error',
      comment: 'feed must not depend on chat (chat consumes feed, never the inverse).',
      from: { path: '^src/modules/feed' },
      to: { path: '^src/modules/chat' },
    },
    {
      name: 'shared-no-upward',
      severity: 'error',
      comment: 'shared/* must not depend on modules or app.',
      from: { path: '^src/shared' },
      to: { path: ['^src/modules', '^src/app'] },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(?:js|cjs|mjs|ts|tsx)$',
          '\\.d\\.ts$',
          '^src/app/',
          '\\.test\\.(?:ts|tsx)$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['main', 'types'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
