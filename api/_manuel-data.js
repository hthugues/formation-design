// Contenu du manuel du participant : résumé du cours, module par module.
// « atelier » insère les réponses du participant à cet endroit du manuel.
export const MANUEL = [
  { module: "Introduction", titre: "Votre marque, en vrai et en ligne", points: [
    "La formation se partage en deux moitiés : construire sa marque (identité visuelle), puis la faire vivre en ligne (marketing digital).",
    "Publier sans identité, c'est parler fort sans qu'on sache qui parle. Avoir une belle identité sans la diffuser, c'est une vitrine dans une rue vide."
  ], atelier: "P" },

  { module: "Module 1 - Les fondations de la marque", titre: "Logo, identité, marque", points: [
    "Le logo est la signature : la petite partie visible.",
    "L'identité visuelle est la tenue complète : couleurs, polices, images et ton.",
    "La marque est la réputation : ce que les gens disent de vous quand vous n'êtes pas là. En ligne, ce sont les commentaires, les avis et les partages.",
    "Une identité est comme un visage : unique, elle montre une personnalité et devient votre signature."
  ] },
  { titre: "Les 3 piliers de la marque", points: [
    "Cible : pour qui je travaille ? Plus elle est précise, plus le message touche. « Tout le monde », c'est personne.",
    "Valeurs : en quoi je crois ?",
    "Positionnement : pourquoi me choisir plutôt qu'un autre ?"
  ] },
  { titre: "La phrase de positionnement", points: [
    "Formule : Pour [cible] qui [besoin], [marque] est [catégorie] qui [bénéfice unique], grâce à [preuve].",
    "Sans preuve, c'est un slogan. Avec une preuve vérifiable, c'est une promesse.",
    "Cette phrase devient la bio de vos pages en ligne."
  ], atelier: "A" },

  { module: "Module 2 - Les éléments visuels", titre: "Une police change le message", points: [
    "Le même texte écrit en script rétro, en police de conte, avec ou sans empattements ne raconte pas la même histoire.",
    "Choisissez votre police pour ce qu'elle dit de votre marque, pas seulement parce qu'elle est jolie."
  ] },
  { titre: "Décoder une marque", points: [
    "Trois questions : que voyez-vous ? que ressentez-vous ? à qui ça parle ?",
    "Le WWF : panda noir et blanc, formes simples. Nature, protection, sérieux, universel.",
    "Coca-Cola : rouge vif et écriture manuscrite presque inchangée depuis la fin du XIXe siècle. Énergie, plaisir, tradition.",
    "Le visuel parle avant le texte : des personnes différentes y lisent souvent les mêmes mots."
  ] },
  { titre: "Un logo qui marche aussi en icône", points: [
    "En ligne, le logo vit surtout dans un petit rond : photo de profil Facebook, WhatsApp, Google Maps.",
    "Cinq critères : simple, mémorable, lisible en petit, beau en noir et blanc, pertinent.",
    "Prévoyez une version carrée simplifiée. Pour une petite structure, préférez un logo combiné : symbole + nom."
  ] },
  { titre: "Les couleurs", points: [
    "Nommez vos couleurs avec leur code HEX (par exemple #0F4C5C) : c'est la seule façon de retrouver la même couleur sur tous les supports.",
    "Sur le cercle chromatique, des couleurs voisines donnent une harmonie douce ; des couleurs opposées créent du contraste et de l'énergie.",
    "Règle 60-30-10 : 60 % de neutre, 30 % de couleur principale, 10 % d'accent pour l'essentiel.",
    "Le contraste sert à faire sortir l'essentiel : texte foncé sur fond clair. Le sens des couleurs dépend aussi de la culture."
  ] },
  { titre: "Polices et fontes", points: [
    "Serif : avec empattements (les petits pieds au bout des traits), une impression de tradition et d'élégance. Sans serif : plus moderne et plus lisible à l'écran.",
    "Une police est une famille ; une fonte est un membre de la famille (Light, Regular, Bold).",
    "Deux familles maximum : une pour les titres, une pour le texte. Variez les graisses. Évitez le Comic Sans."
  ] },
  { titre: "Composer : laisser respirer", points: [
    "Cinq règles : gommez le superflu, alignez, égalisez les espaces, laissez des marges, faites sortir l'essentiel.",
    "Le vide n'est pas du gaspillage : il guide l'œil.",
    "Une charte ne sert que si elle est répétée : c'est la répétition qui vous rend identifiable."
  ], atelier: "B" },

  { module: "Module 3 - Stratégie digitale et canaux", titre: "Le parcours de votre client en ligne", points: [
    "Découvrir, s'intéresser, contacter, acheter, recommander.",
    "Repérez l'étape où vous perdez le plus de clients : elle oriente toute votre stratégie."
  ] },
  { titre: "Possédé, gagné, payé", points: [
    "Possédé : votre page, votre WhatsApp, votre site. Gratuit et sous votre contrôle : commencez par là.",
    "Gagné : avis, partages, bouche-à-oreille. Il faut le demander.",
    "Payé : la publicité, qui amplifie ce qui marche déjà. Payer pour une page vide, c'est payer pour rien."
  ] },
  { titre: "Choisir ses canaux", points: [
    "Deux canaux bien tenus valent mieux que six abandonnés.",
    "Recommandation par défaut : WhatsApp Business pour la conversation et la vente, une fiche Google Business Profile pour être trouvé sur Maps, puis un réseau principal selon votre cible."
  ] },
  { titre: "Un profil cohérent en 6 points", points: [
    "Photo de profil = logo carré ; bannière aux couleurs de la charte ; même nom partout ; bio = phrase de positionnement ; coordonnées et horaires à jour ; bouton d'action.",
    "WhatsApp Business offre gratuitement un message d'accueil, un catalogue et des réponses rapides."
  ], atelier: "C" },

  { module: "Module 4 - Contenus et storytelling", titre: "Quoi publier ?", points: [
    "Quatre piliers de contenu : montrer, apprendre, les coulisses, les preuves.",
    "Règle 80/20 : 80 % de contenus utiles, inspirants ou divertissants, 20 % maximum pour vendre.",
    "Formats qui marchent : vidéo courte verticale (15 à 30 secondes), carrousel, story, avant/après. Tout se joue dans les 3 premières secondes.",
    "Raconter en 3 temps : avant (le problème), le déclic (votre solution), après (la transformation)."
  ] },
  { titre: "Gagner du temps", points: [
    "Trois modèles Canva aux couleurs de votre charte, un calendrier sur deux semaines, une programmation à l'avance avec Meta Business Suite.",
    "Avec une connexion limitée : préparez hors ligne, programmez en une seule session.",
    "La régularité avant la quantité : deux publications par semaine pendant trois mois valent mieux qu'une par jour pendant deux semaines."
  ], atelier: "D" },

  { module: "Module 5 - Publicité et mesure", titre: "La publicité à petit budget", points: [
    "On ne booste qu'une publication qui a déjà bien marché gratuitement.",
    "Objectif « messages », ciblage par zone, âge et centres d'intérêt, budget fixé d'avance sur 3 à 5 jours.",
    "Évitez de cibler tout Madagascar pour une activité locale."
  ] },
  { titre: "Trois chiffres à suivre chaque mois", points: [
    "La portée (combien m'ont vu), l'engagement (combien ont réagi) et surtout les contacts (combien m'ont écrit).",
    "Demandez un avis Google à chaque client satisfait : c'est la preuve la plus visible pour un touriste."
  ] },

  { module: "Synthèse", titre: "Ce qu'on retient", points: [
    "Le positionnement d'abord.",
    "Moins, c'est plus : trois couleurs, deux polices.",
    "Deux canaux bien tenus.",
    "La régularité avant la quantité.",
    "Mesurer, puis amplifier."
  ], atelier: "QUIZ" }
];
