# Next steps — post wandr_design refactor

The full visual refactor (HTML/CSS imported from `wandr_design/` and ported into the Next.js app)
is in. This document tracks deliberately deferred work that the design surfaced but the data layer
or business logic does not yet support.

## 1. Chat backend — Provider OpenAI + conversation à phases

- Replace `MockChatProvider` with `OpenAIChatProvider` (port `IChatProvider` unchanged).
- Conversation à 2 phases :
  - **Refinement loop** : bot pose 2-3 questions clarificatrices (budget, vibe, party size,
    time of day) avant de proposer.
  - **Recommendation** : appel cross-module `chat → feed` (`GetFeedUseCase` avec filtres dérivés
    du dialogue) → renvoie 3-5 ActivityDTOs comme cards dans la réponse.
- **Guardrails** : system prompt strict + classifier d'input pour rejeter requêtes hors-scope
  (météo, code, conversation libre, sujets sensibles).
- **Streaming SSE** : `GET /api/chat/messages/stream` (replace POST classique).
- **Persistance** : `PrismaChatRepository`, models `ChatThread` + `ChatMessage`
  (jsonb pour `suggestedActivityIds`).
- **Suggested cards opening** : aujourd'hui les chat reply cards sont visuelles uniquement.
  L'`ActivityProvider` est déjà au root layout, donc les rendre cliquables vers le modal est
  trivial — à brancher dès que le provider renvoie de vrais `ActivityDTO`.

## 2. Profile backend — Auth réelle + agrégations

- NextAuth (Google OAuth Montréal-friendly) → `User` Prisma model.
- `PrismaProfileRepository` : `getProfile`, `getStats` (counts depuis `Favorite` +
  `CalendarEntry`), `getBreakdown` (réutilise `affinity` module), `getHistory`
  (`CalendarEntry` passées + `Favorite` + `Activity` join).
- `QUICK_ACTIONS` est aujourd'hui hardcodé dans `ProfilePage.tsx` — câbler les hrefs réels
  (Favorites → `/favorites`, History → `/calendar`, etc.).

## 3. Schema gaps

- Sport `Activity.subKind` ou `isClass` : pour réintroduire le tab "Classes" sur Sport.
- `Activity.streamUrl` / `ticketUrl` : pour deep links "Watch Live".
- `Activity.gallery: string[]` : modal montre une galerie mais on n'a qu'`imageUrl`.
- `Activity.hostName` / `hostRole` / `hostAvatarUrl` : section "Hosted by" du modal.
- `Activity.tags: string[]` : section "Vibe" du modal.
- `Activity.duration` / `Activity.groupSize` / `Activity.level` : section "Good to know" du modal.
- `Activity.priceUnit: string?` ("/ ticket", "cover", "+ menu") : footer du modal.
- **Reviews** : nouveau module `reviews/` (entity, port, use cases) pour la section
  "What people say".

## 4. Catégories enum

- Ajouter `MUSIC` (actuellement regroupé sous Culture) si du contenu music distinct existe.
- Ajouter `WELLNESS` si on veut une page dédiée (yoga, spa, etc.). Sinon retirer `Wellness`
  du mental model.

## 5. Sidebar / Filtres

- Restyler les composants individuels (`KindToggle`, `NeighborhoodFilter`, etc.) pour utiliser
  les classes globales `cat-chip`, `chip` au lieu des `filterStyles` inline. La structure
  `FilterAccordionSection` est déjà en place ; reste à remplacer les `style={filterStyles.*}`
  par des `className="..."`.
- Persister l'état accordéon par filtre dans localStorage si UX-research montre que les
  utilisateurs réorganisent.
- Saved Shortcuts (idée future) : entité `UserShortcut` (label + URL avec query params encodés).

## 6. Hero

- Champ `editorialEyebrow` (ou dérivation algo trending) pour remplacer le hardcoded
  "FEATURED THIS WEEK".
- Score de tendance réel pour `flames` (via velocity de `Favorite` + `CalendarEntry` créés
  sur 7j).

## 7. Map

- Replace SVG static par Mapbox/MapLibre quand budget le permet.
- Compute pin positions depuis `latitude`/`longitude`.
- "Distance from me" via `navigator.geolocation`.

## 8. Search bar (navbar)

- Le search bar dans `Nav.tsx` est aujourd'hui purement visuel.
- Ajouter `searchText: string` à `FilterValueDTO`.
- Implémenter full-text search côté Prisma (`pg_trgm` + index trigram OU Postgres `tsvector`).
- UI : sur Enter, `router.push('/?q=' + encodedQuery)`. Variante plus tard : autocomplete
  dropdown.

## 9. Calendar

- Vues Week + List (boutons no-op aujourd'hui dans la toolbar).
- Drag-and-drop d'événements pour rescheduler.
- Notification (push web) avant un event booké.
- "Today" button revient au mois courant ; un click sur cellule devrait pouvoir afficher les
  events de ce jour dans un side panel (aujourd'hui le selected day n'est plus passé en query
  param).

## 10. Activity Modal — Save vs Add to Calendar

- Le modal expose aujourd'hui `Book this` (lien externe) uniquement. Ajouter dans le footer :
  - `Save` (FavoriteButton wired) — toggle wishlist.
  - `Add to Calendar` (AddToCalendarButton wired) — engagement avec date.
- Possible amélioration : "Quick book" (un clic depuis modal pour ajouter à aujourd'hui sans
  dialog).

## 11. Restyle FilterBar primitives

Comme noté en §5, les composants filters (`KindToggle`, `DateFilter`, `PriceFilter`, etc.) ont
gardé leurs `filterStyles` inline. Le wrapper `FilterAccordionSection` les enferme proprement
mais le rendu visuel à l'intérieur est encore "tech-demo". Refondre chacun pour utiliser les
classes du design system (`chip`, `cat-chip`, etc.).
