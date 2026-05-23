# Design — Schéma BDD & ingestion des activités (par ville, avec fraîcheur)

- **Date :** 2026-05-23
- **Statut :** Validé (design), prêt pour plan d'implémentation
- **Périmètre :** Schéma de base de données + stratégie de péremption/fraîcheur supportant le flux *recherche web → stockage → affichage par ville*. **Hors périmètre :** câblage des agents par thème, intégration MCP Tavily, MCP de re-vérification (conçus ici en *contrat* seulement).

---

## 1. Objectif

L'application récupère des activités sur le web, les stocke en base, puis les affiche à l'utilisateur selon **sa ville** (dev = Montréal uniquement). Deux flux :

- **Flux recherche** : un MCP reçoit `(ville, date du jour)` ; des agents par thème recherchent via Tavily des activités **futures ou intemporelles**, puis les stockent.
- **Flux affichage** : le feed affiche les activités de la ville de l'utilisateur connecté, en masquant les activités passées et obsolètes.

Ce design définit **les tables, les champs, et la mécanique de péremption**. Il part du schéma Prisma existant et n'ajoute que le strict nécessaire.

---

## 2. Décisions (et pourquoi)

| # | Décision | Choix retenu | Raison |
|---|----------|--------------|--------|
| 1 | Péremption | `expiresAt` + `lastSeenAt` + `recheckAfter` | Filtrage propre au feed + gestion de l'obsolescence des lieux |
| 2 | Ingestion | Table de **staging** `RawActivityCandidate` séparée | Audit, rejouabilité, feed non pollué par le bruit web |
| 3 | Déduplication | **Clé naturelle normalisée** (`dedupeKey`) | Déterministe, sans coût LLM |
| 4 | Ville | **Entité `City`** complète (exception YAGNI assumée) | bbox pour borner Tavily, fuseau pour « activité passée », extensibilité |
| 5 | Thèmes | `category` dominante **+ `tags[]`** secondaires | 1 agent = 1 category, mais multi-feed possible |
| 6 | Re-vérification | Pilotée par **échéance absolue** ; issue = rafraîchir ou **toujours `ARCHIVED`** | Robuste aux interruptions ; aucune suppression physique |

---

## 3. Pipeline (DAG des données)

```
Agent (thème) ──Tavily──▶ RawActivityCandidate (staging, brut, jetable)
                                   │  PROMOTION = validation + fingerprint + dédup
                                   ▼
                              Activity (propre) ──────────▶ Feed (filtre city + fraîcheur)
                                   ▲
                    MCP re-vérification (orchestration, plus tard)
                    sélectionne recheckAfter <= now → rafraîchit ou archive
```

Trois zones : **staging** (brut), **`Activity`** (source de vérité du feed), **re-vérification** (entretien, déclenché par l'orchestrateur, pas par une horloge). Le feed ne lit jamais le staging.

---

## 4. Schéma Prisma

### 4.1 Nouvelle entité `City`

```prisma
model City {
  id         String     @id @default(cuid())
  slug       String     @unique   // "montreal" — l'argument du MCP
  name       String                // "Montréal"
  country    String                // "CA"
  timezone   String                // "America/Toronto" — réf. pour "activité passée"
  centerLat  Float
  centerLng  Float
  bboxMinLat Float                  // borne les recherches Tavily + valide les coords
  bboxMinLng Float
  bboxMaxLat Float
  bboxMaxLng Float
  activities Activity[]
  users      User[]
}
```

- `timezone` : « passé » se calcule dans le fuseau de la ville, pas en UTC.
- bbox : filtre les résultats Tavily hors-zone et valide les `latitude`/`longitude`.

### 4.2 `Activity` — champs ajoutés

Au modèle existant, on ajoute :

```prisma
  cityId         String      // remplace l'implicite Montréal
  city           City        @relation(fields: [cityId], references: [id])
  tags           String[]    @default([])  // thèmes secondaires (ex. FOOD + CULTURE)
  dedupeKey      String      // fingerprint normalisée (voir §5)
  expiresAt      DateTime?   // = dateEnd pour EVENT ; null pour PLACE
  lastSeenAt     DateTime    // MAJ à chaque fois qu'une recherche la retrouve
  lastVerifiedAt DateTime?   // dernière confirmation explicite d'existence
  recheckAfter   DateTime?   // échéance absolue de re-vérification (voir §6)

  @@unique([cityId, dedupeKey])           // dédup scopée par ville
  @@index([cityId, status, expiresAt])    // requête principale du feed
```

`category` reste la **catégorie dominante** (1 agent = 1 category) ; `tags` porte les thèmes secondaires. Le reste du modèle existant est inchangé (`kind`, `dateStart/dateEnd`, prix, lat/long, `neighborhood`, `indoor/outdoor`, `isFeatured`, `status`, `source`, `externalId`).

### 4.3 Staging `RawActivityCandidate`

```prisma
enum CandidateStatus {
  PENDING
  PROMOTED
  REJECTED
  DUPLICATE
}

model RawActivityCandidate {
  id                 String          @id @default(cuid())
  cityId             String
  category           ActivityCategory // thème de l'agent qui l'a trouvée
  agentName          String           // provenance / debug
  searchQuery        String           // requête Tavily exacte (rejouabilité)
  sourceUrl          String
  rawExcerpt         String           // extrait Tavily brut
  extractedPayload   Json             // l'Activity candidate extraite par l'agent
  dedupeKey          String           // fingerprint calculée à l'extraction
  status             CandidateStatus  @default(PENDING)
  promotedActivityId String?          // lien si promu
  rejectionReason    String?
  createdAt          DateTime         @default(now())

  @@index([status, cityId, createdAt])
  @@index([dedupeKey])
}
```

C'est ici que vit le bruit web. La promotion ne lit jamais directement le feed.

---

## 5. Déduplication (`dedupeKey`)

Chaîne **déterministe** : lowercased, sans accents, trimmée, espaces normalisés.

- **EVENT** : `slugify(title) + "|" + dateStartJour(YYYY-MM-DD) + "|" + round(lat,3) + "," + round(lng,3)`
- **PLACE** : `slugify(title) + "|" + round(lat,3) + "," + round(lng,3)` (≈ 100 m de tolérance)

Unicité garantie par `@@unique([cityId, dedupeKey])`. Réserve : si trop de doublons résiduels (variations d'orthographe), on ajoutera un match flou à la promotion — non implémenté pour le POC.

### Promotion (staging → Activity)

```
1. Valider extractedPayload (schéma, coords dans la bbox de la ville)
2. Calculer dedupeKey
3. Chercher Activity existante (cityId, dedupeKey)
   - absente → créer Activity (status PUBLISHED), set lastSeenAt = lastVerifiedAt = now,
               recheckAfter selon §6 ; candidat → PROMOTED
   - présente → MAJ lastSeenAt = lastVerifiedAt = now, recalcul recheckAfter ;
               candidat → DUPLICATE
   - invalide → candidat → REJECTED (+ rejectionReason)
```

---

## 6. Fraîcheur & péremption

**Requête du feed (toujours) :**

```sql
status = 'PUBLISHED'
AND cityId = :city
AND (expiresAt IS NULL OR expiresAt > now())
```

**EVENT** : `expiresAt = dateEnd`. Filtré à la lecture → disparaît automatiquement une fois passé, **aucun job nécessaire**. `recheckAfter` peut être null (ou = `dateEnd` si l'orchestrateur doit purger les events passés ; purge = `ARCHIVED`).

**PLACE** : `expiresAt = null` (jamais périmé par date). `recheckAfter = lastSeenAt + 90 jours`, **recalculé à chaque fois qu'on le revoit/vérifie**.

**Pas d'archivage automatique par horloge.** L'archivage est une **conséquence d'une re-vérification**, pas du temps écoulé. Quand l'orchestrateur tourne, son MCP de re-vérification :

```
SELECT activities WHERE status = 'PUBLISHED' AND recheckAfter <= now()
  → re-recherche Tavily
      existe encore ?  oui → lastSeenAt = lastVerifiedAt = now(), recheckAfter = now() + 90j
                       non → status = ARCHIVED   (JAMAIS de suppression physique)
```

**Robustesse aux interruptions** : `recheckAfter` est une **date d'échéance absolue** stockée en base, pas un calcul d'« elapsed ». Une longue coupure (app non déployée) ne produit jamais d'archivage en masse — elle crée seulement un **backlog** d'éléments à re-vérifier, traité à la reprise de l'orchestrateur.

**Suppression** : aucune. La re-vérification ne fait que `PUBLISHED → ARCHIVED`. L'historique est conservé, les `Favorite`/`CalendarEntry` restent valides.

---

## 7. Contrat du MCP de re-vérification (conçu, non implémenté)

- **Entrée** : `cityId` (ou slug), `now` (date du jour).
- **Sélection** : `status = PUBLISHED AND recheckAfter <= now`.
- **Pour chaque** : relance une recherche ciblée (Tavily) sur l'activité.
- **Sortie** : rafraîchit (`lastSeenAt`/`lastVerifiedAt`/`recheckAfter`) **ou** `ARCHIVED`.

L'intervalle (90 j) est une constante côté code, matérialisée dans `recheckAfter` à l'écriture.

---

## 8. Impacts sur l'existant (à traiter au plan d'implémentation)

- **Migration Prisma** :
  - Créer `City`, insérer Montréal (slug `montreal`, tz `America/Toronto`, bbox à renseigner).
  - `Activity.cityId` requis → **backfill** = Montréal pour toutes les lignes existantes.
  - `Activity.lastSeenAt` requis → backfill = `createdAt` (ou `now`).
  - `Activity.dedupeKey` requis + unique → **backfill calculé** depuis les données existantes ; gérer d'éventuelles collisions avant d'ajouter la contrainte unique.
  - `Activity.expiresAt` : backfill = `dateEnd` pour les EVENT, `null` pour les PLACE.
- **Domaine** (`Activity.ts`) : `validateActivity` doit exiger `cityId`, `dedupeKey`, `lastSeenAt` ; cohérence `expiresAt` vs `kind`.
- **DTO** (`ActivityDTO` / `toActivityDTO`) : exposer ce dont l'UI a besoin (`city`, `tags`). Les champs de fraîcheur internes (`lastSeenAt`, `lastVerifiedAt`, `recheckAfter`, `dedupeKey`) **restent côté serveur**, hors DTO (frontière §6 du CLAUDE.md).
- **Repository** (`IActivityRepository` / `PrismaActivityRepository`) : filtre feed par `cityId` + fraîcheur ; opération de promotion ; opération de re-vérification.
- **User** : ajout `cityId` (la ville de l'utilisateur connecté pilote le feed).

---

## 9. Hors périmètre (YAGNI assumé pour le POC)

- Match flou de déduplication (réserve si doublons résiduels).
- Géocodage des résultats Tavily (l'agent fournit lat/long ; sinon `REJECTED`).
- Multi-locale / i18n des descriptions (single locale).
- Implémentation effective des agents et du MCP de re-vérification (contrats seulement).
