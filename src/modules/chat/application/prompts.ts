import { ActivityCategories } from '../../activities/domain/ActivityCategorySet';
import type { SearchAxis } from '../domain/SearchAxis';
import type { UserRecommendationContext } from '../domain/UserRecommendationContext';
import type { WebSearchResult } from '../domain/WebSearchResult';

const CATEGORIES = ActivityCategories.join(' | ');

/**
 * Router: classify the latest turn. Low threshold on purpose — an envie or a
 * category *plus* a rough moment is enough to go straight to recommendations;
 * the user's profile fills in the rest. Otherwise ask one clarifying question.
 */
export const ROUTER_PROMPT = `Tu orientes une conversation où une personne cherche une activité à Montréal.
Décide entre deux actions :
- "recommend" : la personne a donné une envie OU une catégorie ET un moment (ce soir, ce weekend, demain…). Le reste (quartier, budget, compagnie) sera comblé par son profil.
- "clarify" : il manque l'envie/catégorie OU le moment. Dans ce cas une seule question de clarification suivra.

Seuil bas : au moindre signal d'envie + moment, choisis "recommend".

Réponds UNIQUEMENT par du JSON de la forme : {"action": "recommend"} ou {"action": "clarify"}.`;

/**
 * Strategy: turn the conversation + profile into three *distinct* research
 * angles. The profile orients the angles (tastes, history) but the latest
 * request leads. Each axis must use a different category when possible.
 */
export function strategyPrompt(ctx: UserRecommendationContext): string {
  return `Tu prépares la recherche d'activités à Montréal pour cette personne.

Profil :
${formatContext(ctx)}

À partir de la conversation et du profil, propose EXACTEMENT 3 axes de recherche DISTINCTS (3 angles différents, idéalement 3 catégories différentes). Chaque axe :
- "label" : titre court de l'angle (français)
- "rationale" : pourquoi cet angle colle à la personne (1 phrase, tutoiement)
- "query" : la requête de recherche web (en incluant "Montréal", concrète, orientée lieux/événements réels)
- "category" : une parmi ${CATEGORIES}

Réponds UNIQUEMENT par du JSON : {"axes": [{"label": "...", "rationale": "...", "query": "...", "category": "..."}, ...]} avec 3 entrées.`;
}

/**
 * Synthesis: one card per axis, in order. Compress each axis's web results into
 * a real, concrete activity + a personal reason. Drop an axis that yielded
 * nothing usable — never invent a place.
 */
export function synthesisPrompt(
  axes: SearchAxis[],
  resultsByAxis: WebSearchResult[][],
): { system: string; user: string } {
  const system = `Tu composes des cartes d'activités à Montréal à partir de résultats de recherche web réels.
Pour chaque axe, choisis le meilleur résultat et compose une carte :
- "axisIndex" : l'indice de l'axe (0, 1 ou 2)
- "title" : nom concret de l'activité ou du lieu
- "description" : 1 phrase factuelle (ce que c'est, où), ancrée à Montréal
- "reason" : "pourquoi ça pourrait te plaire", tutoiement, 2 phrases personnelles qui parlent de la personne (son envie, son moment, ses goûts) — SANS redire ce que dit "description"
- "sourceUrl" : l'URL du résultat choisi (copie-la telle quelle)

Règles : n'invente JAMAIS de lieu — si un axe n'a aucun résultat exploitable, n'émets simplement pas de carte pour cet axe. Au plus une carte par axe, dans l'ordre des axes.

Réponds UNIQUEMENT par du JSON : {"cards": [{"axisIndex": 0, "title": "...", "description": "...", "reason": "...", "sourceUrl": "..."}, ...]}.`;

  const user = axes
    .map((axis, i) => {
      const hits = (resultsByAxis[i] ?? [])
        .map((r) => `  - ${r.title} | ${r.url}\n    ${r.content}`)
        .join('\n');
      return `Axe ${i} — ${axis.label} (catégorie ${axis.category})\n${hits || '  (aucun résultat)'}`;
    })
    .join('\n\n');

  return { system, user };
}

/**
 * Present: a short, warm French intro streamed before the cards. With cards it
 * stays high-level (the cards speak for themselves); with none it's honest and
 * invites a reformulation. Never enumerate the cards in prose.
 */
export function presentPrompt(count: number): string {
  if (count === 0) {
    return `Tu n'as trouvé aucune activité fiable pour cette demande. Écris un court message honnête en français (tutoiement) : dis que tu n'as rien trouvé de concluant et invite la personne à reformuler ou préciser son envie. Pas de carte inventée.`;
  }
  const note =
    count < 3
      ? ` Tu n'as trouvé que ${count} idée(s) solide(s) — mentionne-le honnêtement.`
      : '';
  return `Tu présentes ${count} idée(s) d'activité à Montréal qui s'affichent sous ton message sous forme de cartes détaillées. Écris UNE seule phrase d'intro chaleureuse en français (tutoiement). Interdit : énumérer, nommer ou décrire les cartes — chacune a déjà son propre texte personnalisé en dessous.${note}`;
}

function formatContext(ctx: UserRecommendationContext): string {
  const lines = [
    `- Bio : ${ctx.bio?.trim() || '(non renseignée)'}`,
    `- Catégories préférées : ${ctx.topCategories.length ? ctx.topCategories.join(', ') : '(inconnues)'}`,
    `- Favoris récents : ${ctx.recentFavorites.length ? ctx.recentFavorites.join(', ') : '(aucun)'}`,
    `- Sorties récentes : ${ctx.recentHistory.length ? ctx.recentHistory.join(', ') : '(aucune)'}`,
  ];
  return lines.join('\n');
}
