# Plan — Brancher Gemma (Ollama / OpenRouter) sur la page chat via LangGraph, gating premium + tracking de tokens

## Context

La page `/chat` existe déjà (`src/app/chat/page.tsx` → `src/modules/chat/web/ChatPage.tsx`) mais
tout le module chat actuel est du **placeholder** : `MockChatProvider` renvoie 3 réponses canned
aléatoires, `MockChatRepository`/`IChatRepository`/`ChatThread`/`GetChatStateUseCase` sont du
squelette inutilisé, et le handler injecte 2 cartes d'activités hardcodées. L'utilisateur a confirmé
**champ libre pour tout réécrire** dans `src/modules/chat`.

On veut, pour cette **v1** :
1. Parler à un vrai modèle **Gemma** servi en **local via Ollama** (et optionnellement via l'API
   **OpenRouter**), sélectionnable par variable d'env, Ollama par défaut.
2. Un **vrai chatbot multi-tours** orchestré par **LangGraph** (`StateGraph` minimal : nœud
   modèle + system prompt), pensé comme **base** pour brancher plus tard des nœuds tools
   (web-search, lecture DB très contrôlée) avec tool-calling natif. **Aucune connexion DB côté
   contenu** pour l'instant : pas de suggestions d'activités réelles, on retire les cartes
   hardcodées. La mémoire de conversation reste **portée par le client** dans la session (l'historique
   est renvoyé à chaque tour).
3. La page accessible **uniquement aux membres premium** : un user non-premium voit la page
   **verrouillée avec la `PremiumModal` ouverte par-dessus**. Le passage premium se fait
   **manuellement en DB/seed** (pas de bouton qui flippe le booléen).
4. **Suivi des tokens par utilisateur par mois**, persisté en DB, avec **plafond mensuel** : au-delà
   du quota, l'envoi est refusé (429 + message).

Décisions verrouillées avec l'utilisateur (Q&A) : bloquer+popup (fermable, page verrouillée dessous)
/ premium manuel DB / chatbot pur non relié à la DB / tracker + plafonner (défaut 100k tokens/mois) /
**orchestration LangGraph** avec le modèle LangChain injecté depuis l'infra (chemin idiomatique,
tool-calling natif futur) → on **retire le port `IChatProvider`** et tout le cluster mock.

### Dépendances à ajouter
`@langchain/langgraph`, `@langchain/core`, `@langchain/openai` (Ollama et OpenRouter exposent tous
deux une API **OpenAI-compatible**, donc un seul binding `ChatOpenAI` couvre les deux providers via
`baseURL`). `pnpm add` ces trois paquets.

---

## Changements

### 1. Schéma DB + migration + seed
Fichier : `prisma/schema.prisma`
- `model User` : ajouter `isPremium Boolean @default(false)` et la relation inverse
  `chatTokenUsage ChatTokenUsage[]`.
- Nouveau modèle :
  ```prisma
  model ChatTokenUsage {
    id               String   @id @default(cuid())
    userId           String
    month            String   // bucket "YYYY-MM"
    promptTokens     Int      @default(0)
    completionTokens Int      @default(0)
    totalTokens      Int      @default(0)
    createdAt        DateTime @default(now())
    updatedAt        DateTime @updatedAt
    user             User     @relation(fields: [userId], references: [id])

    @@unique([userId, month])
    @@index([userId])
  }
  ```
- `prisma migrate dev --name chat_premium_token_usage` puis `prisma generate`.
- `prisma/seed.ts` : passer l'utilisateur seed (`SEED_USER_*`) en `isPremium: true` pour pouvoir
  tester la page (réglage manuel demandé).

### 2. Config / env
Fichier : `src/shared/config/env.ts` (schéma zod existant) — ajouter, toutes server-only avec
defaults pour ne pas casser le boot :
- `CHAT_LLM_PROVIDER: z.enum(['ollama', 'openrouter']).default('ollama')`
- `OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434')`
- `OLLAMA_MODEL: z.string().default('gemma3:12b')` — **tag configurable** ; mettre ici le tag Gemma
  réellement `ollama pull`é (ex. la 12B Gemma disponible). Pas de tag « magique » codé en dur.
- `OPENROUTER_API_KEY: z.string().default('')`
- `OPENROUTER_MODEL: z.string().default('google/gemma-3-12b-it')`
- `CHAT_MONTHLY_TOKEN_CAP: z.coerce.number().int().positive().default(100000)`
- Mettre à jour `.env.example` avec ces clés (commentées comme les autres).

### 3. Domaine chat (`src/modules/chat/domain/`)
Le domaine reste **framework-free** : il ne contient plus de port modèle (le modèle est un objet
LangChain injecté, framework → ne peut pas vivre en domain). On garde uniquement le port d'usage et
les erreurs/types.
- **Supprimer** : `IChatProvider.ts`, `IChatRepository.ts`, `ChatThread.ts`, `ChatMessage.ts`
  (placeholder ; le DTO d'échange reste `shared/contracts/ChatMessageDTO`).
- **Nouveau** `TokenUsage.ts` (type pur) :
  ```ts
  export type TokenUsage = { promptTokens: number; completionTokens: number; totalTokens: number };
  ```
- **Nouveau port** `IChatUsageRepository.ts` :
  ```ts
  export interface IChatUsageRepository {
    getMonthlyTotal(userId: string, month: string): Promise<number>;
    addUsage(userId: string, month: string, usage: TokenUsage): Promise<void>;
  }
  ```
- **Nouvelles erreurs domaine** (mêmes conventions que `ActivityNotFoundError`) :
  - `PremiumRequiredError.ts` → mappée 403.
  - `MonthlyTokenLimitError.ts` → mappée 429.

### 4. Application (`src/modules/chat/application/`)
L'application peut dépendre de `@langchain/core` et `@langchain/langgraph` (frameworks autorisés hors
domain). **Supprimer** `GetChatStateUseCase.ts` (placeholder).
- **Nouveau** `chatSystemPrompt.ts` : `export const CHAT_SYSTEM_PROMPT = '…'` — assistant orienté
  découverte d'activités à Montréal qui **pose des questions de clarification**. Point d'extension
  central pour les guardrails futurs.
- **Nouveau** `chatGraph.ts` — le `StateGraph` minimal, base extensible :
  ```ts
  import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
  import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

  export function buildChatGraph(model: BaseChatModel) {
    return new StateGraph(MessagesAnnotation)
      .addNode('model', async (state) => ({ messages: [await model.invoke(state.messages)] }))
      .addEdge('__start__', 'model')
      .addEdge('model', '__end__')
      .compile();
  }
  ```
  (Un seul nœud aujourd'hui ; demain on ajoute un nœud `tools` + une edge conditionnelle
  `model → tools → model` avec `model.bindTools(...)`.)
- **Réécrire** `SendChatMessageUseCase.ts` :
  - deps (constructeur) : `{ model: BaseChatModel, usage: IChatUsageRepository, monthlyTokenCap: number }`.
  - input `execute({ userId, month, text, history: ChatTurn[] })` où
    `ChatTurn = { role: 'user' | 'assistant'; content: string }` (type local appli) :
    1. `total = usage.getMonthlyTotal(userId, month)` ; si `total >= monthlyTokenCap` →
       `throw new MonthlyTokenLimitError()`.
    2. construire les messages LangChain : `new SystemMessage(CHAT_SYSTEM_PROMPT)`, puis `history`
       mappé en `HumanMessage`/`AIMessage`, puis `new HumanMessage(text)`.
    3. `const graph = buildChatGraph(model)` ; `const result = await graph.invoke({ messages })`.
    4. extraire le dernier `AIMessage` : `text = String(last.content)` ; `usage` depuis
       `last.usage_metadata` (`input_tokens` / `output_tokens` / `total_tokens`), avec fallback `0`
       si le provider ne renvoie rien (cf. tbd : comptage Ollama variable).
    5. `await usage.addUsage(userId, month, usage)`.
    6. retourner `{ text, usage }`.
- **Test** `SendChatMessageUseCase.test.ts` (pattern fake comme `ToggleFavoriteUseCase.test.ts`) :
  **fake `BaseChatModel`** (un `FakeListChatModel` de `@langchain/core/utils/testing`, ou un stub
  minimal exposant `invoke`) + fake usage repo. Vérifie : le `SystemMessage` est en tête des messages
  vus par le modèle, l'usage est enregistré, et `MonthlyTokenLimitError` est levée au plafond
  (sans appeler le modèle).

### 5. Infra (`src/modules/chat/infra/`)
- **Supprimer** `MockChatProvider.ts` et `MockChatRepository.ts`.
- **Nouveau** `createChatModel.ts` : factory qui lit `env.CHAT_LLM_PROVIDER` et renvoie un
  `ChatOpenAI` (`@langchain/openai`) configuré — seul endroit infra qui touche `env` :
  ```ts
  import { ChatOpenAI } from '@langchain/openai';
  // ollama   → baseURL `${OLLAMA_BASE_URL}/v1`, apiKey 'ollama' (factice), model OLLAMA_MODEL
  // openrouter → baseURL 'https://openrouter.ai/api/v1', apiKey OPENROUTER_API_KEY, model OPENROUTER_MODEL
  ```
  `streamUsage: true` / `temperature` réglés ici. Un seul binding, deux `baseURL`.
- **Nouveau** `PrismaChatUsageRepository.ts` (implémente `IChatUsageRepository`, prend `PrismaClient`
  au constructeur comme `PrismaProfileRepository`) : `getMonthlyTotal` via `findUnique` (somme du
  `totalTokens`, `0` si absent) ; `addUsage` via `upsert` + `increment` sur le `@@unique([userId, month])`.

### 6. Web — handler + route + DTO
Fichier : `src/modules/chat/web/chatMessagesRoute.ts`
- Body schema : `{ text: z.string().trim().min(1), history: z.array(z.object({ role: z.enum(['user','assistant']), text: z.string() })).max(50).default([]) }`.
- `const user = await getCurrentUser()` (étendu, voir §8) ; **garde premium en défense-en-profondeur** :
  `if (!user.isPremium) throw new PremiumRequiredError()`.
- Calcul du bucket mois `YYYY-MM` (helper local, `new Date()` — couche web, autorisée au temps).
- Wiring : `createChatModel()`, `new PrismaChatUsageRepository(prisma)`,
  `new SendChatMessageUseCase({ model, usage: usageRepo, monthlyTokenCap: env.CHAT_MONTHLY_TOKEN_CAP })`.
  (Même pattern « web instancie infra » que le handler actuel.)
- Convertir `history` (DTO `{role,text}`) en `ChatTurn[] {role,content}`, appeler `execute`,
  renvoyer `userMessage` + `assistantMessage` en `ChatMessageDTO` avec `suggestedActivities: []`.
- Retirer `HARDCODED_SUGGESTIONS`.
- `src/app/api/chat/messages/route.ts` reste `export const POST = withRoute(chatMessagesPostHandler)`.

### 7. Client chat (`src/modules/chat/web/ChatPage.tsx`)
- Dans `send()`, joindre l'historique : `history: thread.map(m => ({ role: m.role, text: m.text }))`
  dans le body. Le reste (append user+assistant depuis la réponse) ne change pas → vrai multi-tours
  dans la session.

### 8. Gating premium (UI)
- `src/shared/auth/current-user.ts` : ajouter `isPremium` au `select` et au type `CurrentUser`
  (`isPremium: boolean`). Changement additif, sûr.
- `src/shared/ui/Premium.tsx` : **exporter** `PremiumModal` (passer `function` → `export function`).
  Le bouton « Passer à Premium » reste inerte (décision : premium manuel).
- `src/app/chat/page.tsx` (server) : après `requireSession()`, `const user = await getCurrentUser()`.
  Passer `locked={!user.isPremium}` à un nouveau wrapper client.
- Nouveau `src/modules/chat/web/ChatGate.tsx` (client, DTO-free, consommateur unique → vit dans
  chat/web ; importe `PremiumModal` depuis `shared/ui`, edge web→shared/ui autorisé) : si `locked`,
  rend `<ChatPage/>` dans un conteneur **flouté / non-interactif** + `<PremiumModal>` ouverte
  par-dessus (fermeture → la page reste verrouillée avec un CTA pour rouvrir). Sinon rend `<ChatPage/>`
  normalement.

### 9. Mapping d'erreurs
Fichier : `src/app/api/_lib/error-handler.ts` — ajouter deux branches :
- `PremiumRequiredError` → 403.
- `MonthlyTokenLimitError` → 429.
(Une entrée chacune, comme la doc du fichier le prévoit.)

### 10. tbd.md
Ajouter sous les bonnes sections : persistance des messages chat différée (client owns thread) ;
historique envoyé par le client (non vérifié serveur) ; graphe LangGraph mono-nœud → nœud `tools` +
edge conditionnelle + `bindTools` à ajouter quand les tools (web-search / lecture DB feed) existeront ;
suggestions d'activités réelles différées ; bouton « Passer à Premium » inerte (pas de paiement) ;
`OLLAMA_MODEL` / `OPENROUTER_MODEL` à fixer sur le vrai tag Gemma ; **comptage de tokens via Ollama
peu fiable** (`usage_metadata` parfois absent selon la version/endpoint OpenAI-compat) → fallback `0`,
à revisiter.

---

## Vérification

0. `pnpm add @langchain/langgraph @langchain/core @langchain/openai`.
1. `pnpm type-check && pnpm dep:check && pnpm test && pnpm lint` puis `pnpm build` (dep:check doit
   rester vert : application→`@langchain/*` est une dépendance externe, pas une edge de couche).
2. DB : appliquer la migration + `prisma generate` ; seed (user premium).
3. **Ollama** : `ollama pull <tag-gemma-12b>` (renseigner `OLLAMA_MODEL`), `ollama serve`,
   `CHAT_LLM_PROVIDER=ollama`.
4. Manuel premium :
   - User **premium** → `/chat` interactif ; envoyer un message → réponse réelle de Gemma ;
     conversation multi-tours cohérente.
   - Vérifier une ligne `ChatTokenUsage` (userId, month) qui **s'incrémente** à chaque message.
   - Mettre `CHAT_MONTHLY_TOKEN_CAP` très bas → après dépassement, l'API renvoie **429** et l'UI
     affiche l'erreur.
   - User **non-premium** (autre compte ou `isPremium=false`) → `/chat` **verrouillé + popup
     Premium** ; appel direct `POST /api/chat/messages` → **403**.
5. (Optionnel) Basculer `CHAT_LLM_PROVIDER=openrouter` + `OPENROUTER_API_KEY` et revérifier une
   réponse + l'incrément de tokens.
