# Plan — Agent multi-étapes de recommandation d'activités dans le chat (LangGraph + Tavily)

## Context

Le module chat (`src/modules/chat`) est aujourd'hui un backbone LangGraph **mono-nœud** : `chatGraph.ts`
expose `buildChatGraph(model)` = un seul nœud `model` (`START→model→END`, `MessagesAnnotation`), et
`SendChatMessageUseCase.executeStream` streame `status`→`token`*→`done` en NDJSON vers `ChatPage.tsx`.
Le modèle est **Gemma 12B servi en local via Ollama** (OpenAI-compat, `createChatModel.ts`). La mémoire
conversationnelle est **portée par le client** (l'historique est renvoyé à chaque tour). Le commentaire
de `chatGraph.ts` annonce explicitement cette étape : « demain on ajoute un nœud `tools` … une fois que
les tools web-search / lecture DB existent ».

On veut faire évoluer ce backbone en un **système multi-agents déterministe** qui :
1. **Discute** pour cerner le besoin (1 question de clarification à la fois) ;
2. **Réfléchit seul** en lisant le profil DB (bio, affinités, favoris, historique calendrier) ;
3. établit **3 axes de recherche** distincts ;
4. **cherche sur le web** via Tavily ;
5. **synthétise** les résultats façon scout (extraction compacte, contexte isolé par axe) ;
6. renvoie **3 cartes d'activité classiques** + un court texte personnalisé « pourquoi ça pourrait te
   plaire » par carte.

### Contrainte centrale
Le modèle est un **Gemma 12B local**. L'architecture est donc un **graphe déterministe** (nœuds + edges
explicites), avec des sorties structurées en **JSON-mode + parse Zod + 1 retry de réparation** — **pas**
de tool-calling / `withStructuredOutput` (le function-calling de Gemma est peu fiable). C'est le pattern
« plan-execute / deep-research » LangGraph 2026 adapté à un petit modèle local, avec **isolation de
contexte par axe** (cf. `open_deep_research` : chaque chercheur compresse ses trouvailles avant la
synthèse).

### Recherche LangGraph 2026 — principes appliqués
- **State minimal et typé, reducers avec parcimonie** : `Annotation.Root` custom ; seul `messages`
  accumule (`MessagesAnnotation.spec`), les autres canaux s'écrasent (reducer par défaut), sauf `usage`
  (reducer additif). (>60 % des incidents prod cités par LangChain 2026 = mauvaise gestion du state.)
- **Mémoire** : court terme = replay client (conservé) ; long terme = la **DB** (bio, affinités,
  favoris, calendrier). Pas de checkpointer/store LangGraph ajouté (hors scope POC mono-utilisateur).
- **Streaming multi-nœud** : `streamMode: ['messages','custom','values']` ; `config.writer()` pour les
  phases / données ; tokens filtrés par `metadata.langgraph_node`.

### Décisions verrouillées avec l'utilisateur (Q&A)
| Sujet | Décision |
|---|---|
| Web search | Port `IWebSearchProvider` (domain) + adapter `TavilyWebSearchProvider` (infra) via **REST `fetch`** (`TAVILY_API_KEY`), `include_images:true`. Pas de MCP distant, pas de SDK ⇒ **zéro nouvelle dépendance**. |
| Persistance | **Éphémère** : les recos ne sont pas écrites en DB ⇒ `ActivityDTO` synthétique (coords/id factices). |
| Cartes | **Réutiliser les cartes classiques** (`CoverActivityCard`, fallback `ImagelessActivityCard` de `activities/web`) + `reason` sous la carte. |
| Déclencheur | **Routeur auto** (nœud `router`), pas de bouton UI. |
| Seuil routeur | **Bas** : envie/catégorie **+** moment ⇒ `recommend` ; sinon 1 question de clarif. Le reste est comblé par le profil DB. |
| Axes → cartes | **1 axe = 1 carte** (3 angles distincts), pas de pool/ranking. |
| Images | **Tavily `include_images`** ; 1ʳᵉ image valide, sinon `ImagelessActivityCard`. |
| Mode dégradé | Afficher les 1–2 cartes trouvées + message honnête ; 0 ⇒ message + invite à reformuler. **Jamais fabriquer.** |
| Transparence | **Phases seulement** (raisonnement caché). |
| Synthèse | **1 seul appel LLM** pour les 3 cartes (axes distincts conservés, « 1 carte/axe dans l'ordre ») — choix POC, ~3× plus rapide en local. Schéma tableau permissif + 1 retry. Repli vers 1 appel/axe si la fiabilité déçoit. |

### Dépendances
**Aucune nouvelle dépendance.** LangGraph 1.3.7 / `@langchain/core` 1.1.48 / `@langchain/openai`
1.4.7 sont déjà installés ; Tavily est appelé en REST via `fetch`.

---

## Architecture cible

### Graphe (`src/modules/chat/application/chatGraph.ts`, réécrit)
```
START → router ─(clarify)→  converse (LLM, streame) → END
               ─(recommend)→ profile (DB, sans LLM)
                               → strategy   (LLM → 3 SearchAxis)
                               → search     (Tavily ×3, Promise.all)
                               → synthesize (LLM ×1 → 0..3 reco)
                               → present    (LLM, streame l'intro + émet recommendations) → END
```

### State — `Annotation.Root` (`src/modules/chat/application/chatState.ts`, nouveau)
| Canal | Type | Reducer |
|---|---|---|
| `messages` | `BaseMessage[]` | `MessagesAnnotation.spec` (accumulation) |
| `userId`, `cityId` | `string` | défaut (écrase) |
| `route` | `'clarify' \| 'recommend'` | défaut |
| `userContext` | `UserRecommendationContext` | défaut |
| `axes` | `SearchAxis[]` | défaut |
| `searchResults` | `WebSearchResult[][]` (par axe) | défaut |
| `recommendations` | `ChatRecommendationDTO[]` | défaut |
| `usage` | `TokenUsage` | **additif** (somme des appels) |

---

## Changements

### 1. Config / env
Fichier : `src/shared/config/env.ts` (schéma zod existant), `.env.example`.
- Ajouter `TAVILY_API_KEY: z.string().default('')` (server-only, default vide pour ne pas casser le
  boot ; pipeline dégrade proprement si absent).

### 2. Contrats (`src/shared/contracts/`)
- `ChatStreamEvent.ts` : étendre `ChatStreamPhase` avec `'reflecting' | 'searching' | 'synthesizing'`
  (le commentaire du fichier annonce déjà la phase `'searching'`) ; ajouter l'event
  `{ type: 'recommendations'; items: ChatRecommendationDTO[] }`.
- **Nouveau** `ChatRecommendationDTO.ts` :
  ```ts
  import type { ActivityDTO } from './ActivityDTO';
  export type ChatRecommendationDTO = {
    activity: ActivityDTO;      // synthétique (éphémère) : id/slug/coords factices
    reason: string;             // « pourquoi ça pourrait te plaire », FR tutoiement, 1–2 phrases
    sourceUrl: string | null;   // lien Tavily de provenance
  };
  ```

### 3. Domaine chat (`src/modules/chat/domain/`)
Reste **framework-free** (ports + value types purs).
- **Port** `IRecommendationContextRepository.ts` : `load(userId, cityId): Promise<UserRecommendationContext>`.
- **Port** `IWebSearchProvider.ts` : `search(query: string): Promise<WebSearchResult[]>`.
- **Types** : `SearchAxis` (`{ label, rationale, query, category }`), `UserRecommendationContext`
  (`{ bio, topCategories, recentFavorites, recentHistory }` — formes compactes string/listes),
  `WebSearchResult` (`{ title, url, content, imageUrl }`).

### 4. Application (`src/modules/chat/application/`)
- **Nouveau** `chatState.ts` : l'`Annotation.Root` ci-dessus.
- **Réécrire** `chatGraph.ts` : `buildChatGraph(deps)` construit le `StateGraph(ChatState)` avec les
  7 nœuds + edge conditionnelle `router → {converse | profile}`. `deps` = `{ model, contextRepo,
  webSearch }`.
- **Nouveau** `nodes/` :
  - `router.ts` — appel structuré JSON → `{ action: 'clarify'|'recommend', clarifyingQuestion? }`,
    seuil bas (envie/catégorie + moment). `config.writer({kind:'phase',phase:'thinking'})`.
  - `converse.ts` — le nœud `model` actuel (réponse / question de clarif), streamé.
  - `profile.ts` — **sans LLM** : `contextRepo.load(...)` → `userContext`. Phase `reflecting`.
  - `strategy.ts` — LLM structuré → `SearchAxis[3]`, 3 angles distincts orientés par `userContext` +
    conversation. Phase `reflecting`. Échec → axes par défaut depuis `topCategories`.
  - `search.ts` — `Promise.all(axes.map(a => webSearch.search(a.query)))`. Phase `searching`.
  - `synthesize.ts` — **1 appel structuré** prenant les résultats des 3 axes (étiquetés) → tableau de
    0–3 `ChatRecommendationDTO` (« 1 carte/axe dans l'ordre »). Schéma Zod permissif : on garde les
    entrées valides (succès partiel). Phase `synthesizing`.
  - `present.ts` — streame une courte intro FR puis `config.writer({kind:'recommendations', items})`.
    Phase `writing`. `< 3` ⇒ intro honnête sur le nombre ; `0` ⇒ message + invite à reformuler.
  - Chaque nœud LLM renvoie `{ usage }` (lu de `usage_metadata`) ; le reducer additif somme.
- **Prompts** : `routerPrompt.ts`, `strategyPrompt.ts`, `synthesisPrompt.ts` (FR, tutoiement, schéma
  JSON décrit inline pour le JSON-mode). `chatSystemPrompt.ts` existant réutilisé pour `converse`.
- **Réécrire** `SendChatMessageUseCase.ts` :
  - deps `+ { contextRepo: IRecommendationContextRepository, webSearch: IWebSearchProvider }` ;
    input `+ cityId`.
  - `graph.stream(initialState, { streamMode: ['messages','custom','values'] })` ; mapper chaque
    `[mode, payload]` :
    - `custom` `{kind:'phase'}` → `{type:'status'}` ; `{kind:'recommendations'}` → event homonyme.
    - `messages` → `{type:'token'}` **seulement si** `meta.langgraph_node ∈ {converse, present}`.
    - `values` → garder le dernier (contient `usage` total).
  - Cap mensuelle vérifiée en amont (inchangé) ; `usage.addUsage(total)` puis `{type:'done'}`.
  - *(Repli si `['messages','custom']` fragile en LangGraph 1.3 JS : orchestrer
    profile/strategy/search/synthesize en `await` direct dans le use case et `yield` les events
    manuellement, en ne gardant le token-streaming graphe que pour converse/present.)*

### 5. Infra (`src/modules/chat/infra/`)
- **Nouveau** `structuredCall.ts` : helper au-dessus de `BaseChatModel` — `model.invoke` en JSON-mode
  (`response_format:{type:'json_object'}` via `.bind`/modelKwargs), parse Zod, **1 retry** de
  réparation (renvoie l'erreur de parse au modèle), renvoie `{ value, usage }`.
- **Nouveau** `PrismaRecommendationContextRepository.ts` : **un seul** adapter Prisma lisant
  bio (`user.bio`) + affinités (`userCategoryAffinity`) + favoris récents (`favorite` → `activity`) +
  historique (`calendarEntry` → `activity`), assemblés en `UserRecommendationContext` compact. (Plus
  propre que d'importer 4 modules voisins ; même style que `PrismaProfileRepository`.)
- **Nouveau** `TavilyWebSearchProvider.ts` : `POST https://api.tavily.com/search` via `fetch`
  (`api_key`, `query`, `include_images:true`, `max_results`), mappe la réponse en `WebSearchResult[]`.
  Lève une erreur claire si `TAVILY_API_KEY` vide.

### 6. Web — route + UI (`src/modules/chat/web/`)
- `chatMessagesRoute.ts` : injecter `user.cityId`, `new PrismaRecommendationContextRepository(prisma)`,
  `new TavilyWebSearchProvider(env.TAVILY_API_KEY)` dans le use case. Le reste (premium guard, NDJSON,
  priming du générateur) inchangé.
- `ChatPage.tsx` : dans la boucle NDJSON, gérer `event.type === 'recommendations'` → attacher les
  `items` au message assistant ; au rendu, remplacer le markup `chat-card` inline par
  `CoverActivityCard` (fallback `ImagelessActivityCard` si `imageUrl` null) + `reason` sous la carte.
  (`chat/web → activities/web` autorisé.) `ChatMessageDTO` gagne un champ `recommendations`.
- `ChatStatusIndicator.tsx` : ajouter les libellés `reflecting` (« Wandr réfléchit à toi… »),
  `searching` (« Wandr cherche sur le web… »), `synthesizing` (« Wandr compose tes idées… »).

### 7. tbd.md
Sous les bonnes sections : recos **éphémères** (non persistées) → coords/id `ActivityDTO` factices
(`synthesize.ts`) ; `FlameRow value={3}` hardcodé dans les cartes chat ; mémoire long terme = DB
seulement (pas de checkpointer/store LangGraph) ; nombre d'axes figé à 3 ; **synthèse en 1 appel** —
repli 1 appel/axe si la fiabilité déçoit ; usage des appels structurés sommé via le canal `usage`
(comptage Ollama parfois absent → fallback 0, déjà noté).

---

## Vérification

1. `pnpm type-check && pnpm dep:check && pnpm test && pnpm lint` puis `pnpm build`. (`dep:check`
   reste vert : `chat → activities`, `chat/web → activities/web`, `application → @langchain/*` sont
   autorisés ; les ports vivent en domain, les adapters en infra.)
2. **Unit (vitest, fakes)** : `router` (clarify vs recommend au seuil bas) ; `strategy` (3 axes +
   retry sur JSON cassé) ; `synthesize` (3 reco valides / un axe vide → carte omise / parse-fail →
   entrées valides gardées ou 0) ; `SendChatMessageUseCase` (les deux chemins : séquence d'events,
   event `recommendations`, somme `usage`) avec `FakeStreamingChatModel` + `FakeUsageRepository` +
   `FakeWebSearchProvider` + `FakeRecommendationContextRepository`.
3. **Manuel** : Ollama Gemma up + `TAVILY_API_KEY` set → `/chat` (compte premium).
   - Tour vague (« je m'ennuie ») → **1 question de clarif** (chemin `clarify`).
   - Tour au seuil bas (« un truc culturel ce weekend ») → phases
     `reflecting`→`searching`→`synthesizing` → **3 cartes classiques** + texte perso par carte.
   - Vérifier qu'un profil avec bio/affinités/favoris **oriente** les 3 axes.
   - **Mode dégradé** : couper `TAVILY_API_KEY` → message honnête, pas de carte fabriquée.
   - Vérifier l'incrément `ChatTokenUsage` (somme des appels du pipeline) et le refus au plafond.
