---
name: update-image
description: Procédure pour trouver une image valide pour une activité et la persister via updateActivityImage. Chargé par wandr-activity-update.
---

<role>
Tu trouves une image **du sujet réel** d'une activité, puis tu la persistes via l'outil MCP `updateActivityImage`.
</role>

<principle>
Le but est une photo **de cette activité précise**, pas une vignette générique de sa catégorie. Pour « Grand Prix de Montréal » on veut le Circuit Gilles-Villeneuve, **pas** une F1 quelconque. Une image stock générique (Unsplash) n'est qu'un **dernier recours**, pas un raccourci — ne t'y arrête que si aucune image spécifique n'existe.
</principle>

<input>
Une activité avec ses champs : `id`, `title`, `kind`, `address`, `externalUrl`, `imageUrl`.
</input>

<procedure>
**Étape 0 — Identifie le sujet concret.** Le titre peut être un événement dont le lieu réel est plus iconographique : « Grand Prix du Canada » → *Circuit Gilles-Villeneuve, Montréal* ; « Festival de jazz » → *Place des Arts*. Note ce **sujet concret + sa ville** ; c'est lui que tu cherches dans les paliers suivants, pas la catégorie.

Puis cherche dans cet ordre — **du plus spécifique au plus générique** — et passe au palier suivant seulement si le courant n'aboutit pas :

**P1 — `og:image` de la source officielle** : si `externalUrl` est non-null, `WebFetch(externalUrl)` et extrais la méta `og:image` (ou `twitter:image`). C'est presque toujours une vraie photo du sujet.

**P2 — Wikipédia / Wikimedia du sujet** : si le sujet concret est un lieu/monument/événement nommé, trouve sa page (`WebSearch "<sujet concret> wikipedia"`, puis `WebFetch` la page) et prends l'image principale — une URL directe `https://upload.wikimedia.org/…` (idéale : libre et hotlinkable) ou son `og:image`.

**P3 — WebSearch image du sujet réel** : `WebSearch` ciblée sur le **sujet concret + ville** (ex. « Circuit Gilles-Villeneuve Montréal photo »), **jamais** la seule catégorie. Extrais une URL d'image directe d'un bon résultat (office de tourisme, presse, page officielle) ; au besoin `WebFetch` un résultat et prends son `og:image`.

**P4 — image de contenu de la page source** : première vraie image de contenu (pas un logo/icône) de la page fetched en P1.

**P5 — Unsplash thématique (DERNIER RECOURS, générique)** : seulement si P1–P4 n'ont rien donné de spécifique. Requête générique de catégorie (`f1-racing`, `jazz-music`, `art-museum`…). `WebFetch("https://unsplash.com/s/photos/<requête>?orientation=landscape")` → première URL `https://images.unsplash.com/photo-` (attribut `src`/`srcset`/`data-src`), params remplacés par `?auto=format&fit=crop&w=1920&q=80`. **Marque cette image comme générique** dans ton compte rendu.

**Aucune image trouvée** : laisse l'activité sans image, note la raison.
</procedure>

<validation>
N'accepte qu'une **URL d'image directe et valide** (`http(s)://…`, idéalement `.jpg/.jpeg/.png/.webp`).
Ne réutilise jamais la même URL pour deux activités du run.
Ne descends à un palier plus générique que si les paliers spécifiques au-dessus ont vraiment échoué.
</validation>

<action>
Une fois l'URL validée, appelle `updateActivityImage({ activityId: id, imageUrl: url })`.
Note le résultat **et le palier utilisé** (spécifique P1–P4, ou fallback générique P5) pour le compte rendu.
</action>
