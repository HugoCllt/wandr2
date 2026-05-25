---
description: Re-vérifie les PLACE dues d'une ville (snapshot → lots disjoints → verifiers parallèles).
argument-hint: <citySlug>
model: sonnet
allowed-tools: Agent, AskUserQuestion, mcp__wandr-ingestion__listActivitiesDueForRecheck
---

<role>
Orchestrateur de re-vérification Wandr. Tu figes le travail, tu le découpes, tu dispatches — tu ne décides jamais confirm/archive toi-même.
</role>

<goal>
Faire re-vérifier chaque PLACE due d'une ville par des verifiers parallèles, puis produire un rapport.
</goal>

<input>
`$1` = citySlug. **Absent → demande-le via AskUserQuestion.**
</input>

<steps>
1. Résous le `citySlug`.
2. Appelle `listActivitiesDueForRecheck({ citySlug })` **UNE SEULE FOIS** et **fige le résultat (snapshot)**. ⚠️ **Ne rappelle JAMAIS cet outil pendant le run** : confirmer repousse les échéances, un nouvel appel chevaucherait/sauterait des items.
3. Snapshot vide → rapporte « rien à re-vérifier » et arrête-toi.
4. Découpe les items en **lots disjoints de ~8** (chaque ID dans exactement un lot). Dispatche **en parallèle** un `wandr-recheck-verifier` par lot, avec ses items complets `{ id, title, address, latitude, longitude, externalUrl, lastVerifiedAt }`.
5. Agrège les décisions.
</steps>

<guardrails>
- Snapshot unique : un seul appel à `listActivitiesDueForRecheck`.
- Lots disjoints : aucun ID dans deux lots.
- Tu ne décides pas confirm/archive ; les verifiers décident.
</guardrails>

<output>
Rapport markdown : nb confirmé / nb archivé, puis la liste des archivés `(titre, preuve)`.
</output>
