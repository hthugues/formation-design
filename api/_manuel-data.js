// Contenu du manuel du participant.
// Chaque module : une page d'ouverture, puis des sections avec explications, illustration, « À retenir », exemple et astuce.
// « atelier » insère, à la fin du module, les réponses du participant.
export const MODULES = [
  {
    num: "00", titre: "Votre marque, en vrai et en ligne",
    intro: "Une marque forte se construit en deux temps : on décide d'abord qui l'on est et à quoi l'on ressemble, puis on le montre, régulièrement, là où se trouvent ses clients.",
    sections: [
      { titre: "Pourquoi cette formation ?",
        texte: ["Publier sans identité, c'est parler fort sans qu'on sache qui parle : vos publications passent, mais personne ne retient qui les a faites. À l'inverse, une belle identité que l'on ne diffuse pas, c'est une vitrine dans une rue vide.",
                "Cette formation réunit les deux : la première moitié construit votre identité visuelle, la seconde la fait vivre en ligne avec des outils gratuits, adaptés à un petit budget et à une connexion parfois limitée."],
        illus: "deuxMoities",
        retenir: ["Identité visuelle : ce que vous montrez.", "Marketing digital : comment, où et quand vous le montrez.", "Les deux ne fonctionnent qu'ensemble."] }
    ],
    atelier: "P"
  },
  {
    num: "01", titre: "Les fondations de la marque",
    intro: "Avant de choisir une couleur ou un logo, il faut savoir ce que l'on veut dire, et à qui.",
    sections: [
      { titre: "Logo, identité, marque : trois notions distinctes",
        texte: ["Le logo est la signature : la petite partie visible, celle que l'on reconnaît d'un coup d'œil. L'identité visuelle est la tenue complète : vos couleurs, vos polices, vos photos, votre ton. La marque, enfin, est votre réputation : ce que les gens disent de vous quand vous n'êtes pas là.",
                "En ligne, cette réputation devient visible : commentaires, avis Google, partages. Votre identité visuelle est comme un visage : unique, elle montre une personnalité et devient votre signature."],
        illus: "iceberg",
        retenir: ["Le logo n'est que la pointe de l'iceberg.", "L'identité visuelle, c'est tout ce qui se voit.", "La marque, c'est ce qui se dit de vous."] },
      { titre: "Les 3 piliers de la marque",
        texte: ["Toute identité tient sur trois piliers. La cible : pour qui je travaille ? Les valeurs : en quoi je crois ? Le positionnement : pourquoi me choisir plutôt qu'un autre ?",
                "Deux établissements de Nosy Be peuvent partager la même plage : un écolodge pour couples en quête de calme et un bar de plage pour les jeunes du week-end n'auront ni les mêmes couleurs, ni les mêmes photos, ni le même ton."],
        illus: "temple",
        exemple: "« Tout le monde » n'est pas une cible. « Les voyageurs européens de 30 à 50 ans qui cherchent une expérience authentique » en est une.",
        retenir: ["Plus la cible est précise, plus le message touche.", "Les valeurs guident le ton.", "Le positionnement répond à : pourquoi moi ?"] },
      { titre: "La phrase de positionnement",
        texte: ["La phrase de positionnement résume votre marque en une ligne. Elle suit une formule simple, que vous pouvez remplir pour n'importe quel projet.",
                "Le mot le plus important est la preuve : sans elle, votre phrase est un slogan que tout le monde peut copier. Avec elle, c'est une promesse crédible. Cette phrase deviendra la bio de vos pages en ligne."],
        illus: "formule",
        exemple: "Pour les voyageurs qui veulent rapporter un vrai goût de Madagascar, Épices du Nord est l'épicerie artisanale qui garantit l'origine de chaque produit, grâce à des achats directs aux producteurs.",
        astuce: "Pour trouver votre bénéfice, demandez-vous ce que vos clients vous disent quand ils sont contents.",
        retenir: ["Cible, besoin, catégorie, bénéfice, preuve.", "Sans preuve, c'est un slogan.", "Votre phrase doit pouvoir être répétée par quelqu'un d'autre."] }
    ],
    atelier: "A"
  },
  {
    num: "02", titre: "Les éléments visuels",
    intro: "Logo, couleurs, polices, images et mise en page : chaque choix envoie un message, avant même qu'on lise un mot.",
    sections: [
      { titre: "Une police change le message",
        texte: ["Écrivez le même nom avec une écriture rétro, une police de conte, une police à empattements ou une police d'affiche : le texte est identique, mais le message ne l'est plus. L'écriture rétro évoque la tradition, la police de conte l'enfance et la magie, l'empattement le sérieux et le haut de gamme.",
                "Choisissez votre police pour ce qu'elle dit de votre marque, pas seulement parce qu'elle est jolie."],
        illus: "polices",
        retenir: ["Avec empattements (serif) : tradition, élégance.", "Sans empattements : modernité, lisibilité à l'écran.", "Deux familles maximum : une pour les titres, une pour le texte."] },
      { titre: "Décoder une marque",
        texte: ["Pour analyser un logo, posez trois questions : que voyez-vous ? que ressentez-vous ? à qui ça parle ?",
                "Le WWF utilise un panda noir et blanc aux formes très simples : on y lit la nature, la protection et le sérieux, et il se reproduit partout, même au crayon. Coca-Cola mise sur un rouge vif et une écriture manuscrite presque inchangée depuis la fin du XIXe siècle : énergie, plaisir, tradition. Des personnes différentes y lisent souvent les mêmes mots : le visuel parle avant le texte."],
        illus: "decode",
        retenir: ["Formes, couleurs et lettres racontent une histoire.", "Un bon logo se reconnaît sans le lire."] },
      { titre: "Un logo qui marche aussi en icône",
        texte: ["En ligne, votre logo vit surtout dans un petit rond : la photo de profil Facebook, WhatsApp ou Google Maps. S'il n'est plus lisible à cette taille, il est trop compliqué.",
                "Un bon logo répond à cinq critères : simple, mémorable, lisible en petit, beau en noir et blanc, pertinent pour votre cible. Pour une petite structure, préférez un logo combiné (un symbole et votre nom) et prévoyez une version carrée simplifiée."],
        illus: "logoTailles",
        retenir: ["Testez votre logo en 40 pixels.", "Prévoyez une version carrée.", "Il doit rester beau en noir et blanc."] },
      { titre: "Les couleurs : nommer, associer, doser",
        texte: ["Une couleur se nomme avec un code : le code HEX, comme #0F4C5C. Dire « mon bleu » ne suffit pas : sans code, la couleur change d'un support à l'autre.",
                "Sur le cercle chromatique, des couleurs voisines donnent une harmonie douce et calme ; des couleurs opposées créent du contraste et de l'énergie, parfait pour l'accent. Dosez-les avec la règle 60-30-10."],
        illus: "couleurs",
        astuce: "Coolors.co ou Adobe Color génèrent gratuitement des palettes harmonieuses à partir d'une couleur.",
        retenir: ["Notez toujours le code HEX de vos couleurs.", "60 % de neutre, 30 % de principale, 10 % d'accent.", "Texte foncé sur fond clair : le contraste sert la lisibilité."] },
      { titre: "Composer : laisser respirer",
        texte: ["Une affiche où tout crie n'est plus lisible. Cinq règles suffisent pour la transformer : gommez le superflu, alignez, égalisez les espaces, laissez des marges et faites sortir l'essentiel.",
                "Le vide n'est pas du gaspillage : il guide l'œil vers l'information qui compte. Et une fois votre charte définie, répétez-la partout : c'est la répétition qui vous rend identifiable."],
        illus: "composer",
        retenir: ["Une seule information en couleur d'accent.", "Un seul axe d'alignement.", "La répétition crée la reconnaissance."] }
    ],
    atelier: "B"
  },
  {
    num: "03", titre: "Stratégie digitale et canaux",
    intro: "Être partout n'est pas une stratégie. Il s'agit de choisir les bons canaux, de les soigner et de guider le client jusqu'au contact.",
    sections: [
      { titre: "Le parcours de votre client en ligne",
        texte: ["Un client passe par cinq étapes : il découvre votre marque, s'y intéresse, vous contacte, achète, puis vous recommande. Un touriste voit une vidéo de coucher de soleil, visite votre page, vous écrit sur WhatsApp, réserve et laisse un avis Google.",
                "Repérez l'étape où vous perdez le plus de clients : c'est là qu'il faut agir en priorité."],
        illus: "parcours",
        retenir: ["Découvrir, s'intéresser, contacter, acheter, recommander.", "Chaque étape a son outil."] },
      { titre: "Possédé, gagné, payé",
        texte: ["Le possédé regroupe vos propres canaux : votre page, votre WhatsApp, votre site. C'est gratuit et sous votre contrôle : commencez par là. Le gagné, ce sont les avis, les partages et le bouche-à-oreille : il faut les demander. Le payé, c'est la publicité : elle amplifie ce qui marche déjà.",
                "Payer pour une page vide, c'est payer pour rien."],
        illus: "venn",
        retenir: ["D'abord le possédé.", "Demandez des avis.", "Le payé amplifie, il ne remplace pas."] },
      { titre: "Choisir ses canaux",
        texte: ["Deux canaux bien tenus valent mieux que six abandonnés. Choisissez-les selon votre cible, pas selon la mode.",
                "Pour une petite structure à Madagascar, la combinaison par défaut est WhatsApp Business pour la conversation et la vente, et une fiche Google Business Profile, gratuite, pour être trouvé sur Maps. Ajoutez ensuite un réseau principal."],
        illus: "canaux",
        retenir: ["WhatsApp Business + fiche Google, puis un réseau.", "La régularité compte plus que le nombre de canaux."] },
      { titre: "Un profil cohérent en 6 points",
        texte: ["Votre profil est votre vitrine en ligne. Six zones suffisent : la photo (votre logo carré), la bannière aux couleurs de la charte, le même nom partout, la bio (votre phrase de positionnement), des coordonnées et horaires à jour, et un bouton d'action clair.",
                "Le test des 5 secondes : en cachant le nom, comprend-on de quoi parle la page ?"],
        illus: "profil",
        astuce: "WhatsApp Business offre gratuitement un message d'accueil automatique, un catalogue et des réponses rapides.",
        retenir: ["Photo, bannière, nom, bio, coordonnées, bouton.", "La bio reprend votre phrase de positionnement."] }
    ],
    atelier: "C"
  },
  {
    num: "04", titre: "Contenus et storytelling",
    intro: "Savoir quoi publier, sous quelle forme et à quel rythme, sans y passer ses journées.",
    sections: [
      { titre: "Quatre piliers de contenu",
        texte: ["Avec quatre piliers, on ne manque jamais d'idées. Montrer : vos produits, vos lieux. Apprendre : un conseil, une astuce. Les coulisses : l'équipe, la fabrication. Les preuves : les avis, les clients satisfaits.",
                "Pour une épicerie : la vanille en gros plan, comment conserver une gousse, la récolte avec le producteur, un client avec son colis."],
        illus: "piliers" },
      { titre: "La règle 80/20",
        texte: ["80 % de vos publications doivent être utiles, inspirantes ou divertissantes ; 20 % au maximum disent « achetez ». Une page qui ne fait que vendre ressemble à un vendeur qui vous suit dans la rue : on finit par l'éviter."],
        illus: "regle8020",
        retenir: ["Donnez avant de demander.", "Une offre sur cinq publications, pas plus."] },
      { titre: "Formats et récit",
        texte: ["Le format le plus mis en avant aujourd'hui est la vidéo courte et verticale, de 15 à 30 secondes. Un téléphone suffit : lumière du jour, téléphone stable et sous-titres, car beaucoup regardent sans le son. Tout se joue dans les 3 premières secondes : c'est l'accroche.",
                "Même en 30 secondes, racontez en trois temps : avant (le problème), le déclic (votre solution), après (la transformation). Les pêcheurs de Sakatia vendaient au prix le plus bas ; en coopérative, ils ont créé leur marque ; aujourd'hui, les hôtels les appellent directement."],
        illus: "recit",
        retenir: ["Vidéo courte, verticale, sous-titrée.", "Accroche dans les 3 premières secondes.", "Avant, déclic, après."] },
      { titre: "Gagner du temps",
        texte: ["Préparez trois modèles Canva aux couleurs de votre charte, planifiez sur deux semaines et programmez à l'avance avec Meta Business Suite, gratuit. Avec une connexion limitée, préparez tout hors ligne puis programmez en une seule session.",
                "Deux publications par semaine pendant trois mois valent mieux qu'une par jour pendant deux semaines."],
        illus: "calendrier",
        retenir: ["La régularité avant la quantité.", "3 modèles, 1 calendrier, 1 session de programmation."] }
    ],
    atelier: "D"
  },
  {
    num: "05", titre: "Publicité et mesure",
    intro: "Amplifier ce qui marche, avec un petit budget, et suivre les bons chiffres.",
    sections: [
      { titre: "La publicité à petit budget",
        texte: ["Règle d'or : on ne booste qu'une publication qui a déjà bien marché gratuitement. Choisissez l'objectif « messages » pour recevoir des contacts sur WhatsApp ou Messenger, plutôt que des « j'aime ». Ciblez une zone, un âge et des centres d'intérêt, fixez votre budget à l'avance et testez sur 3 à 5 jours avant de comparer.",
                "Évitez de cibler tout Madagascar pour une activité locale : vous paieriez pour des personnes qui ne viendront jamais."],
        illus: "pub",
        retenir: ["Booster ce qui marche déjà.", "Objectif : messages.", "Zone précise, budget fixé, 3 à 5 jours."] },
      { titre: "Trois indicateurs à suivre chaque mois",
        texte: ["La portée indique combien de personnes vous ont vu, l'engagement combien ont réagi, et les contacts combien vous ont écrit. Le plus important pour une petite structure, ce sont les contacts : ce sont eux qui mènent à la vente.",
                "Ces chiffres sont gratuits dans les statistiques de vos pages ou dans Meta Business Suite. Et demandez un avis Google à chaque client satisfait : c'est la preuve la plus visible pour un touriste."],
        illus: "chiffres",
        retenir: ["Portée, engagement, contacts.", "Les contacts sont le chiffre qui compte."] }
    ]
  },
  {
    num: "06", titre: "La boîte à outils",
    intro: "Des outils gratuits ou presque, utilisables depuis un téléphone, pour appliquer tout ce que vous avez appris.",
    sections: [
      { titre: "Les outils pratiques, étape par étape",
        texte: ["Inutile de tout installer : commencez par un outil par étape. Pour votre charte, une palette sur Color Hunt ou Coolors et deux polices sur Google Fonts. Pour vos visuels, Canva avec vos couleurs et vos polices. Pour vos vidéos, CapCut ou VN. Pour être trouvé, WhatsApp Business et votre fiche Google. Pour tenir le rythme, Meta Business Suite.",
                "La mention « Gratuit + Pro » signifie que la version gratuite suffit pour démarrer, et que certaines options sont payantes. Les offres changent régulièrement : vérifiez sur le site avant de payer quoi que ce soit."],
        illus: "outils",
        astuce: "Retrouvez la liste avec les liens cliquables sur formation-design.vercel.app/outils.",
        retenir: ["Un outil par étape, pas plus au début.", "Notez vos codes HEX et vos polices : ils se retrouvent dans tous les outils.", "La version gratuite suffit pour démarrer."] }
    ]
  },
  {
    num: "07", titre: "Synthèse",
    intro: "Cinq idées à garder en tête, et votre quiz corrigé.",
    sections: [
      { titre: "Ce qu'on retient", texte: [], illus: "synthese" }
    ],
    atelier: "QUIZ"
  }
];

export const ERREURS = ["Trop de couleurs ou de polices", "Un logo illisible en photo de profil", "Un nom ou une bio différents selon les canaux", "Être partout et publier nulle part", "Ne publier que des offres", "Payer de la publicité pour une page vide", "Ne jamais regarder ses statistiques"];
