# Wandr Mobile — Revamp UI (retours terrain 2026-08-25)

Retours utilisateur sur le layout de l'app Expo, transcrits en changements exécutables.
Chaque item porte : le symptôme observé, la cause identifiée, le changement attendu, les fichiers touchés.

---

## R1 — Les filtres ne s'ouvrent pas

**Symptôme.** Sur Accueil et sur une page catégorie, appuyer sur le bouton flottant « Filtres » ne produit rien.

**Cause.** Toutes les feuilles de l'app passent par `@gorhom/bottom-sheet@5.2.14`. Dans cette version,
`BottomSheetModalProvider` rend `<BottomSheetHostingContainer>` **avant** `{children}`, avec un simple
`StyleSheet.absoluteFill` et **aucun `zIndex` / `elevation`**
(`node_modules/@gorhom/bottom-sheet/src/components/bottomSheetModalProvider/BottomSheetModalProvider.tsx`).
Comme `children` est le `<Stack>` d'expo-router (react-native-screens, écrans opaques plein écran),
l'hôte du portail est peint **sous** la navigation : la feuille est bien montée, mais invisible et non cliquable.

C'est le même mécanisme qui casse R7 (le signet d'un `PLACE` ouvre `AddToCalendarSheet`) et qui rendrait
`ReviewSheet` inopérante.

**Changement.** Abandonner `@gorhom/bottom-sheet` et adopter **un seul mécanisme de feuille pour toute l'app** :
les *form sheets* natifs de `react-native-screens` 4.26 exposés par expo-router
(`presentation: 'formSheet'` + `sheetAllowedDetents`, `sheetGrabberVisible`, `sheetCornerRadius`,
`sheetInitialDetentIndex`, `unstable_sheetFooter`). Natifs, glissables, dismissibles, et déjà installés.

Les filtres deviennent une route `app/filters.tsx` présentée en form sheet. L'état filtre transite par un
petit store partagé (`src/lib/filtersStore.ts`) porté par la clé d'écran (`home` | `CategoryKey`), pas par
des params d'URL.

**Fichiers.** `app/_layout.tsx`, nouveau `app/filters.tsx`, nouveau `src/lib/filtersStore.ts`,
`src/components/FilterSheet.tsx` (devient le corps de la route), `app/(tabs)/index.tsx`,
`app/(tabs)/explore/[category].tsx`.

---

## R2 — La fiche activité doit être une feuille glissable

**Symptôme.** Appuyer sur une activité pousse un écran modal plein écran. Attendu : une feuille qui monte
du bas, occupe ~60 %, se glisse vers le haut jusqu'à 100 % et vers le bas pour se fermer.

Dans cette fiche, en plus :

- les libellés des boutons dépassent ou sont plus gros que le bouton lui-même ;
- le cœur et le signet doivent se remplir **entièrement** d'une couleur — cœur **rouge**, signet **orange** —
  pour que l'état soit lisible d'un coup d'œil.

**Changement.**

- `app/activity/[slug]` passe en `presentation: 'formSheet'`, `sheetAllowedDetents: [0.6, 1]`,
  `sheetInitialDetentIndex: 0`, `sheetGrabberVisible: true`, `sheetCornerRadius: theme.radius.sheet`.
  Le bouton « Fermer » flottant disparaît (le grabber + le glissé vers le bas font le travail).
- La barre d'actions passe en `unstable_sheetFooter` pour rester ancrée quel que soit le detent.
- Reprise du dimensionnement : boutons `minHeight: 48`, texte contraint (`numberOfLines={1}`,
  `flexShrink`), libellés raccourcis (« Plans » / « Site »), la rangée d'actions ne doit jamais déborder
  à 360 dp de large.
- Icônes pleines : `heart-fill` et `bookmark-fill` dans `src/ui/Icon.tsx`, rendues en aplat
  (`fill={color}`, `stroke="none"`) dès que l'état est actif.

**Fichiers.** `app/_layout.tsx`, `app/activity/[slug].tsx`, `src/ui/Icon.tsx`, `src/components/CardActions.tsx`,
`src/theme/tokens.ts`.

---

## R3 — Hero défilant sur toutes les pages

**Symptôme.** Le hero pleine largeur n'existe que sur Accueil, et il ne défile pas tout seul.

**Changement.**

- `HeroCarousel` est monté aussi en tête des pages catégorie (`explore/[category]`), alimenté par les
  activités de la catégorie (`/api/feed?preset=<key>`, top 3 avec image) plutôt que par le pool `featured`
  global.
- Défilement automatique **toutes les 3 secondes**, en boucle, suspendu pendant que l'utilisateur
  fait défiler à la main puis repris, désactivé s'il n'y a qu'une seule image ou si
  `AccessibilityInfo.isReduceMotionEnabled()` est vrai.

**Fichiers.** `src/components/HeroCarousel.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/explore/[category].tsx`.

---

## R4 — Carte « coup de cœur » format TikTok au milieu du feed

**Symptôme.** Le web injecte une carte `SpotlightActivityCard` (« Coup de cœur ») entre la bande « Pour toi »
et la suite du feed (`src/app/(with-sidebar)/page.tsx`). Le mobile n'a pas d'équivalent.

**Changement.** Une carte plein écran intercalée dans le feed : quand le premier bloc se termine, l'activité
mise en avant occupe **exactement** la hauteur visible du téléphone (fenêtre moins la zone sûre haute et la
barre d'onglets), image en `contentFit="cover"`, titre + méta + CTA en surimpression. On continue à défiler
vers le bas et le feed reprend normalement dessous.

Sélection : première activité du pool avec image, `isFeatured` en priorité, insérée après le 12ᵉ item
(aligné sur `TOP_LIMIT = 12` côté web) — pas de nouvel appel réseau.

**Fichiers.** nouveau `src/components/SpotlightScreenCard.tsx`, `src/components/FeedList.tsx`.

---

## R5 — Onglet fantôme « carré avec une croix »

**Symptôme.** En ouvrant une catégorie (ex. Sport), un cinquième onglet apparaît en bas avec une icône
placeholder (carré barré).

**Cause.** `app/(tabs)/explore/` contient `index.tsx` et `[category].tsx` mais **pas de `_layout.tsx`**.
Expo Router enregistre donc `explore/index` **et** `explore/[category]` comme deux écrans du navigateur
`Tabs`. `explore/[category]` n'étant pas déclaré via `<Tabs.Screen>`, il reçoit le titre et l'icône par défaut.

**Changement.** Ajouter `app/(tabs)/explore/_layout.tsx` (un `Stack` sans header). `explore` redevient un
onglet unique et `[category]` est empilé à l'intérieur.

**Fichiers.** nouveau `app/(tabs)/explore/_layout.tsx`, `app/(tabs)/_layout.tsx`.

---

## R6 — Barre de navigation « liquid glass »

**Symptôme.** La barre d'onglets actuelle est un aplat `ink` opaque, sans caractère.

**Changement.** Barre d'onglets personnalisée, flottante, en verre liquide façon Apple :

- **Vraie lib** : `expo-glass-effect` (`GlassView`, `isLiquidGlassAvailable()`) — Liquid Glass natif iOS 26 ;
  repli `expo-blur` (`BlurView`, `intensity` / `tint`) sur Android et iOS < 26.
- **Liseré orange** sur les bords : dégradé `brass` (#C68A3A) en bordure + halo, via `expo-linear-gradient`.
- **Disposition** : `Explorer` · `Calendrier` · **`Accueil` au centre** · *slot dynamique* · `Profil` à droite.
- Le **chat sort de la barre** : bulle flottante persistante au-dessus du contenu, toujours visible.
- Le **slot dynamique** affiche la route courante quand elle ne fait partie d'aucun des quatre onglets
  (page catégorie, favoris, fiche…) : icône + libellé de la page en cours, appui = retour à cette page.

**Fichiers.** `app/(tabs)/_layout.tsx`, nouveaux `src/components/GlassTabBar.tsx` et
`src/components/ChatFab.tsx`, `src/ui/Icon.tsx`, `apps/mobile/package.json` (`expo-glass-effect`, `expo-blur`),
`app.json` (plugins).

---

## R7 — Signet inopérant, cœur de la mauvaise couleur

**Symptôme.**

1. Sur une activité, le signet ne fait rien. Pour un `EVENT` daté, l'appel part bien ; pour un `PLACE`
   (ou un `EVENT` sans `dateStart`), `CardActions` ouvre `AddToCalendarSheet` — donc rien de visible (voir R1).
2. Le cœur actif s'affiche en `brass` (orange) : il doit être **rouge**.

**Changement.**

- Le choix de date/heure d'un `PLACE` devient une route form sheet (`app/calendar-add.tsx`), même mécanisme
  que R1/R2. `ReviewSheet` suit le même chemin.
- États actifs en aplat : cœur `#D8453F` (`theme.colors.live`), signet `#C68A3A` (`theme.colors.brass`),
  sur carte comme en fiche, avec icônes pleines (voir R2).

**Fichiers.** `src/components/CardActions.tsx`, `src/components/AddToCalendarSheet.tsx`,
`src/components/ReviewSheet.tsx`, nouvelles routes `app/calendar-add.tsx` / `app/review.tsx`,
`src/ui/Icon.tsx`, `src/theme/tokens.ts`.

---

## Décisions transverses

- **Un seul mécanisme de feuille** : les *form sheets* natifs de react-native-screens via expo-router.
  `@gorhom/bottom-sheet` est retiré des dépendances une fois les quatre feuilles migrées.
- **Le verre liquide vient d'une lib dédiée** (`expo-glass-effect`), pas d'une imitation en overlay maison.
  Le repli `expo-blur` est explicite.
- **`newArchEnabled: true`** est déjà actif dans `app.json` : prérequis des form sheets Android et de
  `expo-glass-effect`.
- Toute constante réglée « au feeling » (3 s d'autoplay, detents `[0.6, 1]`, index d'insertion `12`)
  est reportée dans `tbd.md` § Hardcoded.
