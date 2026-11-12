// La Permanence — refonte du gameplay, lot 1 : la simulation de l'affaire (CR.SIM)
// Une affaire est d'abord simulée en entier ; pièces, paroles, images, délibéré et débrief n'en sont que des vues.
// SIM.simuler(t) part du tirage du moteur génératif (t) et rend S : lieu, personnes, faits minute par minute,
// enquête acte par acte, ce que chacun sait, ignore, croit ou cache, irrégularités de structure.
// Tout se recalcule depuis t.sig : rien à sauvegarder. Périmètre du lot 1 : violences volontaires en flagrance.
(function () {
  "use strict";
  const CR = window.CR;
  const SIM = (CR.SIM = {});
  SIM.VERSION = 1;

  // ------------------------------------------------------------------ Hasard : un fil par sujet
  // Ajouter un tirage dans un sujet ne déplace pas les autres.
  const fil = (graine) => {
    const f = CR.seeded(graine);
    const r = {
      next: f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      ch: (p) => f() < p,
      pk: (a) => a[Math.floor(f() * a.length)],
      sh: (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
    };
    return r;
  };
  SIM.fil = fil;

  // ------------------------------------------------------------------ Heures
  // Une minute m se compte depuis minuit du jour des faits (S.j0, jour de partie) ; elle peut dépasser 1 440.
  SIM.jour = (S, m) => S.j0 + Math.floor(m / 1440);
  SIM.hm = (m) => { const x = ((Math.floor(m) % 1440) + 1440) % 1440; return [Math.floor(x / 60), x % 60]; };
  const deux = (n) => String(n).padStart(2, "0");
  // styles : pv « 23 heures 41 minutes », h « 23 h 41 », n « 23:41 », hh « 23h41 »
  SIM.heure = function (m, style) {
    const [h, mn] = SIM.hm(m);
    if (style === "n") return `${deux(h)}:${deux(mn)}`;
    if (style === "hh") return `${h}h${deux(mn)}`;
    if (style === "h") return `${h} h ${deux(mn)}`;
    return mn ? `${h} heure${h > 1 ? "s" : ""} ${mn} minute${mn > 1 ? "s" : ""}` : `${h} heure${h > 1 ? "s" : ""}`;
  };
  SIM.date = (S, m, style) => CR.fmtDate(SIM.jour(S, m), style || "long");
  SIM.duree = (mn) => { const h = Math.floor(mn / 60), m = Math.round(mn % 60); return h ? `${h} heure${h > 1 ? "s" : ""}${m ? ` ${m} minute${m > 1 ? "s" : ""}` : ""}` : `${m} minute${m > 1 ? "s" : ""}`; };

  // ------------------------------------------------------------------ Périmètre
  const SCENES = ["bar", "rue", "transport", "voisinage", "circulation", "travail", "file", "sport"];
  const IRR_OK = ["gav_notif", "avis_parquet", "heures", "sans_avocat", "controle_identite", "interprete", "prolongation"];
  SIM.supporte = function (t) {
    if (!t || t.inf !== "violences" || !t.flagrance || t.mesure !== "gav") return false;
    if (!["gav", "ci"].includes(t.genre) || t.client !== "A" || t.PM || t.conc) return false;
    if (!t.f || !SCENES.includes(t.f.sc) || !t.V || !t.d || t.d.debut == null) return false;
    return (t.irr || []).every((i) => IRR_OK.includes(i));
  };

  // ------------------------------------------------------------------ Tables
  const BARS = ["Le Balto", "Le Ramey", "Chez Paulette", "Le Saint-Pierre", "Le Royal", "Le Marcadet", "La Mascotte", "Le Zinc", "L'Olympic", "Le Diplomate", "Le Relais", "Au Petit Chez Soi"];
  const STATIONS = { 1: "Châtelet", 2: "Bourse", 3: "Arts et Métiers", 4: "Saint-Paul", 5: "Place Monge", 6: "Odéon", 7: "École Militaire", 8: "Miromesnil", 9: "Pigalle", 10: "Château d'Eau", 11: "Oberkampf", 12: "Reuilly-Diderot", 13: "Tolbiac", 14: "Alésia", 15: "Convention", 16: "Ranelagh", 17: "Brochant", 18: "Marcadet-Poissonniers", 19: "Laumière", 20: "Gambetta" };
  const HOPITAUX = { 1: "Hôtel-Dieu", 2: "Hôtel-Dieu", 3: "Hôtel-Dieu", 4: "Hôtel-Dieu", 5: "Cochin", 6: "Cochin", 7: "Georges-Pompidou", 8: "Bichat", 9: "Lariboisière", 10: "Lariboisière", 11: "Saint-Antoine", 12: "Saint-Antoine", 13: "la Pitié-Salpêtrière", 14: "Cochin", 15: "Georges-Pompidou", 16: "Ambroise-Paré", 17: "Bichat", 18: "Bichat", 19: "Lariboisière", 20: "Tenon" };
  const HOP_DEP = { 93: "Avicenne, à Bobigny", 94: "Henri-Mondor, à Créteil", 92: "Beaujon, à Clichy" };
  const UMJ = { 75: "unité médico-judiciaire de l'Hôtel-Dieu, à Paris 4e", 93: "unité médico-judiciaire de l'hôpital Jean-Verdier, à Bondy", 94: "unité médico-judiciaire du centre hospitalier intercommunal de Créteil", 92: "unité médico-judiciaire de l'hôpital Raymond-Poincaré, à Garches" };
  const MEDECINS = ["Claire Aubry", "Mehdi Slimani", "Antoine Vasseur", "Hélène Marchetti", "Olivier Deschamps", "Samia Khelifi", "Bertrand Lemaire", "Julie Nguyen", "François Carlier", "Nora Benhamou"];
  const AGENTS = ["Nadia Ferhat", "Thomas Vasseur", "Inès Bouchard", "Mickaël Tessier", "Karim Ouali", "Léa Perret", "Yann Kervella", "Sophie Marin"];
  const AVOCATS = ["Me Caroline Besnard", "Me Idriss Hamdi", "Me Paul Etcheverry", "Me Sonia Guerrier", "Me Vincent Laroque", "Me Fatou Diallo"];
  const HAUTS = [["une doudoune", "noire", "#1c1d22"], ["une doudoune", "bleu marine", "#1f2a44"], ["un sweat à capuche", "gris", "#77797e"], ["un sweat à capuche", "noir", "#1b1b1e"], ["une veste en jean", "bleue", "#4f6a8c"], ["un blouson", "kaki", "#5a5f3c"], ["un manteau", "beige", "#b9a888"], ["une parka", "bordeaux", "#6b2630"], ["un blouson en cuir", "marron", "#4a3323"], ["une veste de survêtement", "blanche", "#d8d8d4"], ["un pull", "vert foncé", "#2f4a39"], ["un manteau", "noir", "#18181b"]];
  const BAS = [["un jean", "bleu", "#3b4e6b"], ["un jean", "noir", "#1e1f24"], ["un pantalon de survêtement", "gris", "#6d6f73"], ["un pantalon de survêtement", "noir", "#1c1c20"], ["un pantalon", "beige", "#a89878"], ["un pantalon", "noir", "#19191c"]];
  const CHAUSS = ["des baskets blanches", "des baskets noires", "des chaussures de ville", "des bottines", "des baskets rouges"];
  const CHEVEUX = ["bruns courts", "noirs courts", "châtains mi-longs", "rasés", "noirs frisés", "blonds courts", "bruns attachés", "gris courts"];
  const CORP = ["mince", "moyenne", "athlétique", "forte"];

  // Ce qui a mis le feu : une clé par scène et par f.mobile (mêmes sujets que la fiche d'infraction, détaillés)
  // [ce qui s'est passé, vu par A, vu par V]
  // jetons : {il} {Il} {lui} {le} = l'autre ; {e} = accord de celui qui parle ; {oe} = accord de l'autre
  const MOBILES = {
    bar: [["un verre de bière renversé", "{il} m'a renversé sa bière dessus et {il} a rigolé", "j'ai fait tomber mon verre sans le vouloir, je me suis excusé{e}"], ["un regard jugé insistant", "{il} n'arrêtait pas de regarder la personne qui était avec moi", "je ne regardais personne, je cherchais un ami des yeux"], ["une cigarette refusée", "je lui ai demandé une cigarette, {il} m'a mal répondu", "{il} m'a réclamé une cigarette, j'ai dit non, c'est tout"], ["l'addition", "{il} ne voulait pas payer sa part", "{il} prétendait que je lui devais une tournée"], ["un mot de trop sur le trottoir", "{il} a fait une réflexion quand je suis sorti{e} fumer", "{il} a mal pris une plaisanterie"], ["une bousculade en sortant", "{il} m'est rentré{oe} dedans à la porte, exprès", "on s'est heurtés à la porte, il y avait du monde"]],
    rue: [["un regard", "{il} me fixait depuis le trottoir d'en face", "je ne {le} regardais même pas"], ["une trottinette mal garée", "sa trottinette barrait tout le trottoir", "{il} a donné un coup de pied dans ma trottinette"], ["un téléphone que l'un accusait l'autre d'avoir pris", "je cherchais mon téléphone, {il} était juste à côté quand il a disparu", "{il} m'a accusé{e} d'avoir volé son téléphone, n'importe quoi"], ["une dette de deux cents euros", "{il} me doit deux cents euros depuis l'été", "je lui ai déjà rendu son argent"], ["un chien sans laisse", "son chien m'a sauté dessus", "{il} a voulu donner un coup de pied à mon chien"], ["une cigarette jetée", "{il} m'a fait la morale pour un mégot", "{il} a jeté son mégot à mes pieds"]],
    transport: [["une place assise", "{il} s'est assis{oe} sur la place que je gardais", "la place était libre, il n'y avait personne"], ["une bousculade à la fermeture des portes", "{il} m'a poussé{e} pour sortir", "{il} bloquait les portes"], ["une musique trop forte", "{il} m'a demandé de couper ma musique, mal", "sa musique hurlait dans toute la rame"], ["une remarque", "{il} a fait une réflexion sur moi à voix haute", "je parlais au téléphone, {il} a cru que c'était pour {lui}"], ["un sac posé sur un siège", "j'avais posé mon sac, {il} l'a jeté par terre", "son sac prenait un siège, je l'ai déplacé"], ["un regard insistant", "{il} me dévisageait depuis trois stations", "je regardais le plan de la ligne"]],
    voisinage: [["le bruit, la nuit", "ça tape au-dessus toutes les nuits jusqu'à deux heures", "{il} est monté{oe} cogner à ma porte pour rien"], ["une fuite d'eau", "son plafond me coule dessus depuis un mois", "{il} m'accuse d'une fuite qui vient de la colonne"], ["des poubelles sur le palier", "{il} laisse ses sacs devant ma porte", "ce ne sont pas mes sacs"], ["une place dans la cour", "{il} s'est encore garé{oe} sur ma place", "la place n'est à personne"], ["un chien qui aboie", "son chien aboie toute la journée", "{il} a menacé mon chien"], ["des travaux le dimanche", "{il} perce le dimanche matin", "j'ai posé une étagère, dix minutes"]],
    circulation: [["un refus de priorité", "{il} m'a grillé la priorité", "c'est {lui} qui a forcé le passage"], ["un coup de klaxon", "{il} m'a klaxonné{e} sans arrêt", "{il} a pilé devant moi sans raison"], ["un rétroviseur arraché", "{il} a arraché mon rétroviseur en doublant", "son rétroviseur dépassait sur ma file"], ["une place de livraison", "{il} m'a pris la place alors que je manœuvrais", "{il} n'avait pas mis son clignotant"], ["un dépassement par la droite", "{il} m'a doublé{e} par la droite", "{il} roulait à vingt à l'heure au milieu"], ["un piéton frôlé", "{il} a failli me rouler dessus sur le passage", "{il} a traversé au rouge en regardant son téléphone"]],
    travail: [["un planning modifié", "{il} a changé mes horaires sans me prévenir", "le planning est le même pour tout le monde"], ["des pourboires", "{il} m'a accusé{e} devant tout le monde de voler les pourboires", "il manquait de l'argent dans la boîte, j'ai posé la question"], ["des retards", "{il} me reproche trois minutes de retard", "{il} arrive en retard tous les jours"], ["un reproche devant les clients", "{il} m'a humilié{e} devant les clients", "je lui ai fait une remarque, calmement"], ["une prime", "{il} m'a fait sauter ma prime", "la prime ne dépend pas de moi"], ["une histoire de vestiaire", "on avait fouillé dans mon casier", "{il} m'accuse d'avoir ouvert son casier"]],
    file: [["quelqu'un passé devant", "{il} m'est passé{oe} devant comme si je n'existais pas", "j'étais là avant {lui}"], ["une poussette", "sa poussette bloquait tout", "{il} a cogné dans la poussette"], ["un mot sur un accent", "{il} a imité mon accent", "{il} a mal compris ce que je disais à la vendeuse"], ["la monnaie", "{il} prétendait que la monnaie était à {lui}", "{il} a ramassé mon billet sur le comptoir"], ["un coup de coude", "{il} m'a mis un coup de coude", "{il} me collait dans le dos"], ["le téléphone", "{il} hurlait dans son téléphone", "{il} m'a dit de raccrocher"]],
    sport: [["un tacle par derrière", "{il} m'a taclé{e} par derrière, les deux pieds", "j'ai joué le ballon"], ["un but contesté", "le but n'y était pas, tout le monde l'a vu", "le ballon avait franchi la ligne"], ["une insulte sur le terrain", "{il} m'a insulté{e} pendant tout le match", "c'est {lui} qui a commencé à chambrer"], ["une équipe qui refusait de sortir", "leur heure était finie, ils ne voulaient pas sortir", "on avait le terrain jusqu'à la demie"], ["un ballon envoyé sur le banc", "{il} a tiré exprès sur nos affaires", "le ballon est parti tout seul"], ["un carton imaginaire", "{il} se prenait pour l'arbitre", "{il} a fait une faute, je l'ai dit"]],
  };
  // Les coups : [libellé d'enquête, dit par celui qui le reçoit, zone]
  const COUPS = {
    gifle: ["une gifle", "une gifle", "visage"], poing: ["un coup de poing au visage", "un coup de poing en pleine figure", "visage"], tete: ["un coup de tête", "un coup de tête", "visage"],
    poussee: ["une poussée des deux mains", "une grosse poussée", "thorax"], pied: ["un coup de pied alors que la victime était au sol", "un coup de pied quand j'étais par terre", "thorax"], arme: ["un coup porté avec", "un coup avec", "visage"],
  };
  const LES = {
    leger: { visage: ["une rougeur de la pommette gauche, de trois centimètres", "une érosion cutanée de la lèvre supérieure", "une ecchymose débutante de la pommette droite"], thorax: ["une dermabrasion du coude droit, de deux centimètres sur un", "une ecchymose de l'avant-bras gauche"] },
    moyen: { visage: ["une plaie de l'arcade sourcilière droite, de deux centimètres, suturée par trois points", "une contusion de la pyramide nasale avec épistaxis, sans déformation", "un hématome péri-orbitaire gauche", "une plaie de la lèvre inférieure, suturée par deux points"], thorax: ["une contusion basithoracique gauche, sans lésion osseuse à la radiographie", "une dermabrasion de la paume droite et du genou droit", "une entorse bénigne du poignet droit"] },
    lourd: { visage: ["une fracture des os propres du nez, déplacée", "une fracture de l'os malaire gauche", "une plaie du cuir chevelu de quatre centimètres, suturée par cinq points"], thorax: ["une fracture de la neuvième côte gauche", "une fracture du poignet droit, immobilisée par une attelle", "une luxation de l'épaule gauche, réduite aux urgences"] },
  };

  // ------------------------------------------------------------------ Personnes
  const personne = (id, role, P, plus) => Object.assign({ id, role }, P, plus || {});
  const nomDe = (txt) => { const p = String(txt).split(" "); return { prenom: p[0], nom: p.slice(1).join(" ") }; };
  function signalement(r, P, exclu) {
    let h; do { h = r.pk(HAUTS); } while (exclu && exclu.includes(h[1]));
    const b = r.pk(BAS);
    const f = P.g === "f";
    return {
      taille: (f ? 158 : 168) + r.int(0, 20), corp: r.pk(CORP), cheveux: r.pk(CHEVEUX),
      haut: h[0], hautCoul: h[1], hautHex: h[2], capuche: /capuche|doudoune|parka/.test(h[0]) && r.ch(0.45),
      bas: b[0], basCoul: b[1], basHex: b[2], chauss: r.pk(CHAUSS),
    };
  }
  SIM.tenue = (P) => `${P.sig.haut} ${accorde(P.sig.haut, P.sig.hautCoul)}${P.sig.capuche ? ", capuche relevée" : ""}, ${P.sig.bas} ${accorde(P.sig.bas, P.sig.basCoul)} et ${P.sig.chauss}`;
  // les couleurs de la table sont au féminin quand le vêtement l'est ; on remet le masculin au besoin
  SIM.accorde = (nom, coul) => accorde(nom, coul);
  function accorde(nom, coul) {
    const fem = /^une /.test(nom);
    if (fem) return coul;
    return coul.replace(/noire$/, "noir").replace(/bleue$/, "bleu").replace(/blanche$/, "blanc").replace(/grise$/, "gris").replace(/verte? foncé$/, "vert foncé");
  }
  SIM.tailleMots = (cm) => { const c = Math.round(cm / 5) * 5; return "un mètre " + ({ 150: "cinquante", 155: "cinquante-cinq", 160: "soixante", 165: "soixante-cinq", 170: "soixante-dix", 175: "soixante-quinze", 180: "quatre-vingts", 185: "quatre-vingt-cinq", 190: "quatre-vingt-dix", 195: "quatre-vingt-quinze" }[CR.clamp(c, 150, 195)]); };
  SIM.registre = (P) => (P.age < 30 || P.casier > 0 || /sans emploi|livreur|manutention|intérim|serveu|vendeu|ouvri|étudiant|lycéen/.test(P.metier || "") ? "familier" : P.age > 55 || /cadre|professeur|médecin|ingénieur|avocat|comptable/.test(P.metier || "") ? "soutenu" : "courant");

  // ------------------------------------------------------------------ Le lieu
  function lieuDe(t, r) {
    const F = CR.MONDE.lieuxDe(t).F, TJ = CR.MONDE.lieuxDe(t).TJ;
    const sc = t.f.sc, rue = t.rue, no = r.int(2, 96);
    const arr = F.paris ? +F.id.slice(1) : 0;
    const art = /^(boulevard|quai|passage|cours|chemin|square|faubourg|pont)/i.test(rue) ? "le " : /^[aeiouhéèAEIOUH]/.test(rue) ? "l'" : "la ";
    const laRue = art + rue, deLaRue = (art === "le " ? "du " : art === "l'" ? "de l'" : "de la ") + rue;
    const L = { sc, rue, laRue, deLaRue, no, secteur: F.id, ville: F.ville, nomSecteur: F.nom, cp: F.cp, comm: F.comm, commCourt: F.commCourt, dep: F.dep, tj: TJ, paris: F.paris };
    L.hopital = F.paris ? `hôpital ${HOPITAUX[arr] || "Lariboisière"}` : `hôpital ${HOP_DEP[F.dep] || "de secteur"}`;
    L.umj = UMJ[F.dep] || UMJ[75];
    const adr = `${no}, ${rue}, ${F.paris ? `Paris ${F.arr}` : F.nom}`;
    const D = {
      bar: () => { const n = r.pk(BARS); return { nom: `bar « ${n} »`, enseigne: n, ou: `devant le bar « ${n} », ${adr}`, court: `devant le bar « ${n} »`, zone: `les abords du bar « ${n} »`, kind: "trottoir", cam: { src: "le système de vidéoprotection de l'établissement", det: `le gérant du bar « ${n} »`, label: "CAM 02 TERRASSE", tiers: "prive" }, temoinOu: "en terrasse" }; },
      rue: () => ({ nom: "voie publique", ou: `sur la voie publique, à hauteur du ${adr}`, court: `${rue}, à hauteur du numéro ${no}`, zone: `${laRue} à hauteur du numéro ${no}`, kind: "trottoir", cam: { src: F.paris ? "le plan de vidéoprotection de la préfecture de police" : "le centre de supervision urbain de la commune", det: F.paris ? "la salle d'information et de commandement" : "le centre de supervision urbain", label: `VP ${F.cp.slice(-3)}-${deux(r.int(3, 88))}`, tiers: "public" }, temoinOu: "sur le trottoir d'en face" }),
      transport: () => { const st = F.paris ? STATIONS[arr] : `Mairie de ${F.nom}`; return { nom: F.paris ? `station de métro ${st}` : `arrêt d'autobus « ${st} »`, ou: F.paris ? `sur le quai de la station de métro ${st}` : `à l'arrêt d'autobus « ${st} », ${rue}`, court: F.paris ? `sur le quai de la station ${st}` : `à l'arrêt « ${st} »`, zone: F.paris ? `le quai de la station ${st}` : `l'arrêt d'autobus « ${st} »`, kind: F.paris ? "quai" : "trottoir", cam: { src: "le système de vidéoprotection de la RATP", det: "le service de sûreté de la RATP", label: `QUAI ${r.int(1, 2)} ${st.slice(0, 8).toUpperCase()}`, tiers: "public" }, temoinOu: F.paris ? "sur le quai" : "à l'arrêt" }; },
      voisinage: () => ({ nom: "hall d'immeuble", ou: `dans le hall de l'immeuble sis ${adr}`, court: `dans le hall de l'immeuble du ${no}, ${rue}`, zone: `le hall de l'immeuble du ${no}, ${rue}`, kind: "hall", cam: { src: "la caméra du hall de l'immeuble", det: "le syndic de la copropriété", label: "HALL ENTREE", tiers: "prive" }, temoinOu: "dans l'escalier" }),
      circulation: () => ({ nom: "carrefour", ou: `à l'angle ${deLaRue} et de la rue voisine, à hauteur du ${adr}`, court: `au carrefour ${deLaRue}`, zone: `le carrefour ${deLaRue}`, kind: "trottoir", cam: { src: F.paris ? "le plan de vidéoprotection de la préfecture de police" : "le centre de supervision urbain de la commune", det: F.paris ? "la salle d'information et de commandement" : "le centre de supervision urbain", label: `VP ${F.cp.slice(-3)}-${deux(r.int(3, 88))}`, tiers: "public" }, temoinOu: "à l'arrêt, au feu" }),
      travail: () => ({ nom: "réserve d'un commerce", ou: `dans la réserve du magasin sis ${adr}`, court: `dans la réserve du magasin du ${no}, ${rue}`, zone: `la réserve du magasin du ${no}, ${rue}`, kind: "hall", cam: { src: "le système de vidéoprotection du magasin", det: "le responsable du magasin", label: "CAM 04 RESERVE", tiers: "prive" }, temoinOu: "dans la réserve" }),
      file: () => ({ nom: "boulangerie", ou: `devant la boulangerie sise ${adr}, dans la file d'attente`, court: `dans la file d'attente de la boulangerie du ${no}, ${rue}`, zone: `l'entrée de la boulangerie du ${no}, ${rue}`, kind: "trottoir", cam: { src: "le système de vidéoprotection du commerce", det: "la gérante de la boulangerie", label: "CAM 01 ENTREE", tiers: "prive" }, temoinOu: "dans la file" }),
      sport: () => ({ nom: "terrain de sport", ou: `sur le terrain de sport municipal attenant au ${adr}`, court: `sur le terrain de sport ${deLaRue}`, zone: `le terrain de sport ${deLaRue}`, kind: "terrain", cam: { src: "la caméra municipale du terrain", det: F.paris ? "la direction de la prévention, de la sécurité et de la protection de la Ville" : "le centre de supervision urbain", label: "TERRAIN 1", tiers: "public" }, temoinOu: "au bord du terrain" }),
    }[sc]();
    return Object.assign(L, D, { adr });
  }

  // ------------------------------------------------------------------ La simulation
  const cache = {};
  SIM.simuler = function (t) {
    if (!SIM.supporte(t)) return null;
    if (cache[t.sig] && cache[t.sig].t === t) return cache[t.sig];
    const R = (k) => fil(t.sig + ":sim" + SIM.VERSION + ":" + k);
    const f = t.f, has = (p) => t.preuves.includes(p), irr = (i) => (t.irr || []).includes(i), doute = (d) => (t.doutes || []).includes(d);
    const S = { t, sig: t.sig, j0: t.d.faits, genre: t.genre, voie: t.voie, P: {}, faits: [], actes: [], irr: [], notes: {} };
    S.lieu = lieuDe(t, R("lieu"));
    const nuit = (m) => { const [h] = SIM.hm(m); return h >= 18 || h < 7; }; // novembre : il fait nuit tôt

    // --- personnes
    const rp = R("pers");
    const A = (S.P.A = personne("A", "mis en cause", t.A)), V = (S.P.V = personne("V", "victime", t.V));
    A.sig = signalement(rp, A); V.sig = signalement(rp, V, [A.sig.hautCoul]);
    A.sig.capuche = A.sig.capuche || f.agg.includes("dissimulation");
    const T = (S.P.T = personne("T", "témoin", t.T || Object.assign({ g: "f", age: 44, metier: "employée", adresse: S.lieu.adr }, nomDe("Marie Lefort"))));
    T.sig = signalement(rp, T);
    const g = t.gpx || ["Julien Moreau", "Aurélie Dumont"];
    S.P.G1 = personne("G1", "chef de bord", nomDe(g[0]), { grade: "brigadier", qual: "agent de police judiciaire", mat: rp.int(410000, 489999) });
    S.P.G2 = personne("G2", "équipier", nomDe(g[1] || "Kévin Lopes"), { grade: "gardien de la paix", qual: "agent de police judiciaire", mat: rp.int(410000, 489999) });
    const act = CR.acteur(CR.GEN2.acteurBase(t.opj)) || { nom: "Lieutenant Damien Rocher", profil: "opj_formaliste" };
    const mo = /^(\S+)\s+(.*)$/.exec(act.nom);
    const OPJ = (S.P.OPJ = personne("OPJ", "officier de police judiciaire", nomDe(mo[2]), { grade: mo[1].toLowerCase(), qual: "officier de police judiciaire", mat: rp.int(380000, 409999), profil: act.profil, acteur: act.id }));
    const autre = rp.sh(AGENTS.filter((n) => !g.includes(n)));
    S.P.B1 = personne("B1", "enquêteur", nomDe(autre[0]), { grade: rp.pk(["brigadier-chef", "brigadier", "gardien de la paix"]), qual: "agent de police judiciaire", mat: rp.int(410000, 489999) });
    const pq = CR.acteur(CR.GEN2.acteurBase(t.parquet)) || { nom: "Mme Yasmine Haddou" };
    S.P.PQ = personne("PQ", "magistrat du parquet", Object.assign(nomDe(pq.nom.replace(/^(M\.|Mme)\s+/, "")), { civ: /^Mme/.test(pq.nom) ? "Mme" : "M.", g: /^Mme/.test(pq.nom) ? "f" : "m" }), { qual: "substitut du procureur de la République", acteur: pq.id });
    const med = rp.sh(MEDECINS);
    S.P.MED = personne("MED", "médecin requis", nomDe(med[0]), { qual: "docteur en médecine" });
    S.P.URG = personne("URG", "urgentiste", nomDe(med[1]), { qual: "praticien hospitalier, service d'accueil des urgences" });
    S.P.LEG = personne("LEG", "médecin légiste", nomDe(med[2]), { qual: "médecin légiste" });
    S.P.AV = personne("AV", "avocat", { nom: t.genre === "gav" ? "(vous)" : rp.pk(AVOCATS) }, { joueur: t.genre === "gav" });
    // style de l'auteur des procès-verbaux
    OPJ.style = { bavard: act.profil === "opj_bavard", formaliste: act.profil === "opj_formaliste", pressant: act.profil === "opj_pressant", coquilles: act.profil === "opj_formaliste" ? 0.01 : rp.pk([0.03, 0.05, 0.08]) };
    for (const k of ["G1", "G2", "B1"]) S.P[k].style = { coquilles: rp.pk([0.02, 0.04, 0.06]) };
    S.proc = t.proc || `2026/${rp.int(1, 20)}/${rp.int(1000, 9999)}`;
    S.codeUnite = deux(rp.int(10, 98)) + String(rp.int(100, 999));

    // --- la vérité des faits
    const rf = R("faits");
    const reunion = f.agg.includes("reunion"), ivresse = f.agg.includes("ivresse");
    const V0 = {};
    V0.innocent = doute("doute_ident") && t.stance === "nie" && rf.ch(0.5); // A n'a porté aucun coup
    V0.insulte = doute("legitime_defense") ? "V" : rf.ch(0.45) ? "V" : "A";
    V0.premier = doute("legitime_defense") ? "V" : rf.ch(0.2) ? "V" : "S"; // premier contact physique : V, ou celui qui frappe
    const grav = f.itt === 0 ? "leger" : f.itt <= 8 ? "moyen" : "lourd";
    const types = f.arme ? ["arme"] : [rf.pk(grav === "leger" ? ["gifle", "poussee", "gifle"] : ["poing", "poing", "tete", "poussee"])];
    const nb = grav === "leger" ? 1 : grav === "moyen" ? rf.int(1, 2) : rf.int(2, 4);
    while (types.length < nb) types.push(rf.pk(grav === "lourd" && types.length >= 1 ? ["poing", "pied", "pied"] : ["poing", "gifle"]));
    V0.coups = types;
    V0.chute = types.includes("poussee") || types.includes("pied") || (f.itt > 0 ? rf.ch(0.7) : rf.ch(0.15));
    // ce que le témoin et la victime disent de travers quand un doute l'exige
    if (doute("temoin_contra") && V0.insulte !== "V" && V0.premier !== "V" && nb > 2) V0.insulte = "V";
    V0.vExagere = doute("temoin_contra");
    V0.mobile = (MOBILES[f.sc] || MOBILES.rue)[f.mobile % 6];
    V0.connus = ["voisinage", "travail"].includes(f.sc) || (f.sc === "sport" && rf.ch(0.4));
    V0.verres = ivresse ? rf.int(5, 9) : f.sc === "bar" ? rf.int(1, 3) : 0;
    V0.taux = ivresse ? (rf.int(42, 96) / 100) : 0; // mg par litre d'air expiré
    // lésions : une par zone touchée, plus celle de la chute
    const lr = R("lesions"), les = [];
    const zones = [...new Set(types.map((c) => COUPS[c][2]))];
    for (const z of zones) { const l = lr.pk(LES[grav][z]); if (!les.includes(l)) les.push(l); }
    if (V0.chute && grav !== "leger" && les.length < 2) { const l = lr.pk(LES[grav === "lourd" ? "moyen" : "leger"].thorax); if (!les.includes(l)) les.push(l); }
    V0.lesions = les; V0.itt = f.itt;
    V0.ittUmj = t.quoi === "itt" && t.f2 ? t.f2.itt : f.itt; // l'unité médico-judiciaire peut retenir moins que les urgences
    S.verite = V0;
    // le second : complice (réunion), ou l'inconnu qui a frappé à la place de A
    const tiers = reunion || V0.innocent;
    if (tiers) {
      const C = (S.P.C = personne("C", reunion ? "second mis en cause" : "auteur réel, non identifié", { g: A.g, age: A.age + rp.int(-4, 6), prenom: "X", nom: "", inconnu: true }));
      C.sig = signalement(rp, C, [V.sig.hautCoul]);
      if (V0.innocent && !reunion) { C.sig.hautCoul = A.sig.hautCoul; C.sig.hautHex = A.sig.hautHex; C.sig.taille = A.sig.taille + rp.int(-4, 9); C.sig.haut = rp.pk(HAUTS.filter((h) => h[1] === A.sig.hautCoul))[0]; C.sig.capuche = true; }
    }
    V0.frappeur = V0.innocent ? "C" : "A";
    V0.role2 = reunion ? (V0.innocent ? "frappe" : "tient") : null; // ce que fait le second
    V0.roleA = V0.innocent ? "present" : "frappe";

    // --- chronologie des faits (minutes depuis minuit du jour des faits)
    const T0 = t.d.h, ecart = (((t.d.debut - t.d.h) % 1440) + 1440) % 1440 || 12, TI = T0 + ecart;
    S.T0 = T0; S.TI = TI; S.nuit = nuit(T0);
    const fait = (m, id, qui, quoi, plus) => S.faits.push(Object.assign({ m, id, qui, quoi }, plus || {}));
    const avant = f.sc === "bar" ? rf.int(50, 110) : rf.int(4, 25);
    fait(T0 - avant, "arrivee_A", "A", f.sc === "bar" ? `arrive au bar${reunion ? " avec un ami" : ""}` : "arrive sur les lieux");
    fait(T0 - Math.max(3, avant - rf.int(1, 30)), "arrivee_V", "V", "arrive sur les lieux");
    if (f.agg.includes("premeditation")) fait(T0 - rf.int(8, 15), "attente", "A", "attend la victime sur place");
    fait(T0 - 3, "mobile", "A,V", V0.mobile[0]);
    fait(T0 - 2, "insulte", V0.insulte, "insulte l'autre le premier");
    if (V0.premier === "V") fait(T0 - 1, "contact_V", "V", doute("legitime_defense") ? "attrape l'autre par le col et lève le poing" : "repousse l'autre de la main");
    if (V0.role2 === "tient") fait(T0, "tient", "C", "ceinture la victime par derrière");
    types.forEach((c, i) => fait(T0 + i * 0.1, "coup" + (i + 1), V0.frappeur, COUPS[c][0] + (c === "arme" ? " " + f.arme : ""), { coup: c }));
    if (V0.chute) fait(T0 + 0.3, "chute", "V", "tombe au sol");
    const dirs = [["le boulevard", "du boulevard"], ["la bouche de métro", "de la bouche de métro"], ["la rue voisine", "de la rue voisine"], ["le square", "du square"]];
    [V0.fuite, V0.fuiteDe] = rf.pk(dirs); V0.dist = rf.int(60, 240); V0.main = rf.ch(0.85) ? "droite" : "gauche";
    fait(T0 + 1, "depart", V0.frappeur, `quitte les lieux à pied vers ${V0.fuite}`);
    if (V0.innocent) fait(T0 + 1, "reste_A", "A", "s'éloigne dans la même direction, sans courir");
    const appelant = has("temoin") ? "T" : "REQ";
    S.P.REQ = personne("REQ", "requérant", { nom: "", prenom: "", inconnu: true }, { anonyme: true });
    fait(T0 + 1, "appel17", appelant, "appelle police-secours");
    const TAR = Math.max(T0 + 3, TI - rf.int(2, 4));
    fait(TAR, "arrivee_police", "G1,G2", "arrive sur place");
    if (f.itt > 0 || V0.chute) fait(Math.min(TAR + rf.int(2, 9), TI + 6), "pompiers", "V", "est prise en charge par les sapeurs-pompiers");
    fait(TI, "interpellation", "A", `est interpellé${A.g === "f" ? "e" : ""} à ${V0.dist} mètres`);
    S.faits.sort((a, b) => a.m - b.m);

    // --- le témoin : d'où il regarde, ce qu'il perçoit
    const rt = R("temoin");
    T.dist = rt.int(4, 22); T.vu = { cris: true, premier: T.dist < 14, coups: true, visage: T.dist < 9 && !A.sig.capuche && !S.nuit };
    const nbc = V0.coups.filter((c) => c !== "pied").length; T.nbVu = nbc > 2 && T.dist > 12 ? nbc - 1 : nbc;
    // description du frappeur : exacte s'il s'agit du tiers ; fausse sur un point si A a frappé mais que l'identification doit rester discutable
    const Fr = S.P[V0.frappeur];
    T.decrit = { haut: Fr.sig.haut, coul: Fr.sig.hautCoul, capuche: Fr.sig.capuche, taille: Fr.sig.taille };
    if (doute("doute_ident") && !V0.innocent) { const autreH = rt.pk(HAUTS.filter((h) => h[1] !== A.sig.hautCoul && h[1] !== V.sig.hautCoul)); T.decrit = { haut: autreH[0], coul: autreH[1], capuche: false, taille: A.sig.taille + rt.pk([-12, 11]), erreur: true }; }

    // --- la caméra : ce qu'elle cadre, ce qu'elle permet
    if (has("video")) {
      const rc = R("camera");
      const C = (S.cam = Object.assign({}, S.lieu.cam));
      C.dist = rc.int(6, 24); C.nuit = S.nuit; C.ir = S.nuit && rc.ch(0.6);
      C.horsChamp = rc.ch(0.3) ? "debut" : null; // l'échange qui précède se passe hors champ
      C.visage = !Fr.sig.capuche && C.dist < 11 && !C.nuit; // l'image permet-elle de reconnaître un visage
      if (doute("doute_ident")) C.visage = false;
      C.affirme = !C.visage && rc.ch(doute("doute_ident") ? 0.75 : 0.25); // le procès-verbal affirme pourtant reconnaître le mis en cause
      C.duree = rc.int(38, 95); C.fichier = `${C.label.replace(/\W+/g, "_")}_${CR.fmtDate(SIM.jour(S, T0), "iso").replace(/-/g, "")}_${SIM.heure(T0 - 2, "n").replace(":", "")}.mp4`;
      C.sec = rc.int(4, 55); // seconde de l'instant figé
    }

    // --- l'enquête, acte par acte
    const re = R("enquete");
    const acte = (m, id, par, quoi, plus) => { const a = Object.assign({ m: Math.round(m), id, par, quoi }, plus || {}); S.actes.push(a); return a; };
    const A1 = {};
    A1.appel = acte(T0 + 1, "appel17", appelant, "appel à police-secours", { fond: null });
    A1.arrivee = acte(TAR, "arrivee", "G1", "arrivée de l'équipage sur les lieux");
    const ctrl = irr("controle_identite");
    A1.designation = ctrl ? null : acte(TAR + 1, "designation", "V", "la victime désigne un individu qui s'éloigne");
    A1.interp = acte(TI, "interpellation", "G1", ctrl ? "contrôle d'identité puis interpellation" : "interpellation", { fond: ctrl ? "78-2" : "53, 73", controle: ctrl });
    const TC = TI + re.int(7, 16);
    A1.arrPoste = acte(TC, "arrivee_poste", "G1", "arrivée au service et présentation à l'officier de police judiciaire");
    if (ivresse) A1.ethylo = acte(TC + 2, "ethylo", "G2", "dépistage puis mesure de l'imprégnation alcoolique", { taux: V0.taux });
    // placement et notification : un seul procès-verbal ; tardif sans raison écrite si l'irrégularité est tirée
    const TN = irr("gav_notif") ? TI + re.int(82, 135) : TC + re.int(4, 14);
    A1.notif = acte(TN, "notification", "OPJ", "placement en garde à vue et notification des droits", { fond: "62-2, 63, 63-1", effet: TI, interprete: irr("interprete") ? false : null });
    const TAP = irr("avis_parquet") ? Math.max(TN + 50, TI + re.int(105, 190)) : TN + re.int(2, 9);
    A1.avis = acte(TAP, "avis_parquet", "OPJ", "avis au procureur de la République", { fond: "63" });
    const D = (S.droits = { avocat: true, commis: true, proche: re.ch(0.55), employeur: A.emploi && re.ch(0.12), medecin: ivresse || re.ch(0.45), silence: false });
    A1.avisAvocat = acte(TN + re.int(4, 11), "avis_avocat", "OPJ", "appel à la permanence pénale du barreau", { fond: "63-3-1" });
    if (D.proche) A1.avisProche = acte(TN + re.int(12, 40), "avis_proche", "OPJ", `avis à ${A.proche || "un proche"}`, { fond: "63-2" });
    A1.fouille = acte(TN + re.int(6, 13), "fouille", "G2", "inventaire des effets personnels", { argent: re.int(0, 14) * 5 + re.int(0, 4), tel: true });
    if (has("saisie")) A1.scelle = acte(A1.fouille.m + 3, "scelle", "OPJ", f.arme ? `saisie et placement sous scellé de ${f.arme}` : `saisie et placement sous scellé de ${A.sig.haut}`, { objet: f.arme || `${A.sig.haut} ${accorde(A.sig.haut, A.sig.hautCoul)}`, no: "UN" });
    if (D.medecin) { A1.reqMed = acte(TN + re.int(7, 16), "req_medecin", "OPJ", "réquisition à médecin", { fond: "63-3" }); }
    // la victime : urgences d'abord si elle est blessée, puis plainte
    const blesse = f.itt > 0 || V0.chute;
    if (blesse) A1.urgences = acte(TAR + re.int(35, 80), "urgences", "URG", `examen aux urgences de l'${S.lieu.hopital}`, { itt: f.itt });
    else A1.urgences = acte(TAR + re.int(70, 160), "urgences", "URG", `examen aux urgences de l'${S.lieu.hopital}`, { itt: 0 });
    const TPV = has("plainte") ? (blesse ? A1.urgences.m + re.int(55, 120) : TI + re.int(22, 60)) : null;
    if (TPV != null) A1.plainte = acte(TPV, "plainte", "B1", "plainte de la victime", { fin: TPV + re.int(28, 44) });
    // le témoin est entendu par le même enquêteur, après ou avant la plainte selon la place libre
    if (has("temoin")) { let m = TI + re.int(40, 95); if (A1.plainte && m > A1.plainte.m - 30 && m < A1.plainte.fin + 5) m = A1.plainte.fin + re.int(6, 20); A1.temoin = acte(m, "aud_temoin", "B1", "audition du témoin", { fin: m + re.int(18, 30) }); }
    if (S.cam) { A1.reqVideo = acte(TN + re.int(18, 50), "req_video", "OPJ", "réquisition aux fins de remise des images", { fond: "60-1" }); A1.video = acte(A1.reqVideo.m + re.int(55, 170), "exploitation_video", "OPJ", "exploitation des images", { fin: 0 }); A1.video.fin = A1.video.m + re.int(18, 30); }
    // l'avocat, puis l'audition
    const TE = A1.avisAvocat.m + re.int(38, 85);
    const sansAv = irr("sans_avocat");
    let TAU;
    if (sansAv) { TAU = A1.avisAvocat.m + re.int(22, 45); A1.entretien = acte(TAU + re.int(35, 70), "entretien", "AV", "entretien confidentiel avec l'avocat", { fin: 0 }); A1.entretien.fin = A1.entretien.m + re.int(15, 30); }
    else { A1.entretien = acte(TE, "entretien", "AV", "entretien confidentiel avec l'avocat", { fin: TE + (t.genre === "gav" ? 30 : re.int(18, 30)) }); TAU = A1.entretien.fin + re.int(4, 16); }
    const dureeAud = re.int(32, 58);
    A1.audition = acte(TAU, "audition", "OPJ", "audition de la personne gardée à vue", { fin: TAU + dureeAud, avocat: !sansAv });
    // le même officier ne regarde pas les images pendant qu'il entend : l'exploitation glisse après l'audition
    if (A1.video && A1.video.m < A1.audition.fin + 3 && TAU < A1.video.fin + 3) { const d = A1.video.fin - A1.video.m; A1.video.m = A1.audition.fin + re.int(6, 20); A1.video.fin = A1.video.m + d; }
    // l'examen médical : hors de l'audition, sauf si les heures doivent se contredire
    if (A1.reqMed) {
      let m = A1.reqMed.m + re.int(40, 110);
      const dur = re.int(10, 16);
      if (m + dur > TAU - 2 && m < A1.audition.fin + 2) m = A1.audition.fin + re.int(8, 25);
      if (A1.entretien.fin && m + dur > A1.entretien.m - 2 && m < A1.entretien.fin + 2) m = A1.entretien.fin + (TAU - A1.entretien.fin > dur + 4 ? 1 : dureeAud + re.int(20, 40));
      A1.examen = acte(m, "examen", "MED", "examen médical de compatibilité", { fin: m + dur, compatible: true });
    }
    const hv = irr("heures") ? (A1.examen ? re.pk(["examen", "cloture"]) : "cloture") : null;
    if (hv === "examen") { A1.examen.ecrit = TAU + re.int(8, dureeAud - 16); } // le certificat date l'examen en pleine audition
    if (hv === "cloture") { A1.audition.finEcrite = TAU - re.int(5, 25); }      // le procès-verbal se clôt avant d'avoir commencé
    const libre = Math.max(A1.audition.fin, A1.video ? A1.video.fin : 0, A1.examen ? A1.examen.fin : 0, A1.plainte ? A1.plainte.fin : 0, A1.temoin ? A1.temoin.fin : 0, A1.entretien.fin || 0);
    A1.casier = acte(libre + re.int(3, 12), "casier", "OPJ", "demande du bulletin n° 1 et consultation des fichiers");
    const TCR = A1.casier.m + re.int(10, 35);
    A1.compteRendu = acte(TCR, "compte_rendu", "OPJ", "compte rendu téléphonique au magistrat de permanence", { instructions: S.voie });
    // fin de la mesure : déférée au matin (comparution immédiate), sinon remise en liberté après les instructions
    let TF = S.voie === "ci" ? Math.max(1440 + re.int(8 * 60 + 20, 10 * 60 + 10), TCR + 40) : TCR + re.int(25, 70);
    if (S.voie === "ci" && TF - TI > 46 * 60) TF = TI + 46 * 60;
    // prolongation : avant la vingt-quatrième heure, ou après si l'irrégularité est tirée
    if (TF - TI > 24 * 60 || irr("prolongation")) {
      if (TF - TI <= 24 * 60) TF = TI + 24 * 60 + re.int(120, 400);
      const tard = irr("prolongation");
      A1.prolong = acte(TI + 24 * 60 + (tard ? re.int(18, 85) : -re.int(35, 170)), "prolongation", "PQ", "autorisation de prolongation de la garde à vue", { fond: "63 II", tard, visio: re.ch(0.6) });
      if (TF < A1.prolong.m + 45) TF = A1.prolong.m + re.int(60, 180);
    }
    if (TF < TCR + 20) TF = TCR + re.int(22, 40);
    if (blesse && (S.voie === "ci" || V0.ittUmj !== V0.itt || f.itt > 8)) A1.umj = acte(1440 + re.int(9 * 60, 11 * 60 + 30), "umj", "LEG", "examen de la victime sur réquisition", { itt: V0.ittUmj });
    if (A1.umj && A1.umj.m > TF - 30 && S.voie === "ci") A1.umj.m = TF - re.int(40, 90);
    A1.synthese = acte(Math.max(TCR + 3, TF - re.int(12, 30)), "synthese", "OPJ", "procès-verbal de synthèse");
    A1.fin = acte(TF, "fin_gav", "OPJ", S.voie === "ci" ? "fin de garde à vue et défèrement" : "fin de garde à vue et remise en liberté", { duree: TF - TI });
    if (S.voie === "ci") A1.comparution = acte(TF + re.int(70, 150), "comparution", "PQ", "présentation au procureur de la République", { fond: "393, 395" });
    if (S.voie === "copj") { let j = SIM.jour(S, TF) + re.int(28, 75); j = CR.rollForward(j); A1.copj = acte(TF - 4, "copj", "OPJ", "remise d'une convocation en justice", { fond: "390-1", jour: j, heure: re.pk([9 * 60, 13 * 60 + 30]) }); }
    S.actes.sort((a, b) => a.m - b.m);
    S.a = A1;
    // repas et repos, pour le procès-verbal de déroulement
    S.repas = [];
    for (let m = Math.ceil(TI / 60) * 60; m < TF; m += 60) { const [h] = SIM.hm(m); if ([8, 12, 19].includes(h)) { const mm = m + re.int(0, 40); if (mm > TN && mm < TF && !(mm > TAU - 5 && mm < A1.audition.fin + 5)) S.repas.push({ m: mm, pris: re.ch(0.75) }); } }

    // --- irrégularités : jamais une phrase marquée, toujours un fait de structure que deux heures ou une absence révèlent
    const note = (id, regime, nature, pieces, quoi) => S.irr.push({ id, regime, nature, pieces, quoi });
    if (irr("gav_notif")) note("gav_notif", "gav_notif_tardive", "tardif", ["interpellation", "notification"], `droits notifiés ${TN - TI} minutes après l'interpellation, sans circonstance insurmontable décrite`);
    if (irr("avis_parquet")) note("avis_parquet", "gav_avis_parquet_tardif", "tardif", ["notification", "avis_parquet"], `parquet avisé ${TAP - TI} minutes après le début de la mesure`);
    if (irr("controle_identite")) note("controle_identite", "controle_identite_irregulier", "manquant", ["interpellation"], "contrôle d'identité sans désignation ni motif de l'article 78-2");
    if (irr("interprete")) note("interprete", "interprete_absent", "manquant", ["notification", "audition"], "droits notifiés et audition menée sans interprète à une personne qui comprend mal le français");
    if (irr("sans_avocat")) note("sans_avocat", "gav_audition_sans_avocat", "manquant", ["avis_avocat", "audition"], "audition commencée hors la présence de l'avocat demandé, sans décision écrite du procureur");
    if (irr("prolongation")) note("prolongation", "gav_prolongation_tardive", "tardif", ["notification", "prolongation"], "prolongation autorisée après la vingt-quatrième heure");
    if (hv) note("heures", "pv_heure_incoherente", "contradiction", hv === "examen" ? ["audition", "certificat_gav"] : ["audition"], hv === "examen" ? "examen médical daté en pleine audition" : "audition close avant l'heure de son début");
    S.langue = irr("interprete") ? { parle: fil(t.sig + ":langue").pk(["l'arabe", "le portugais", "le roumain", "le bambara", "le tamoul"]), francais: "imparfaitement" } : null;

    // --- menus faits que les pièces rapportent (tirés ici pour qu'aucune pièce n'invente rien)
    const rx = R("extra");
    const blesseV = f.itt > 0 || V0.chute;
    S.x = {
      indicatif: `TV ${S.lieu.cp.slice(-2)} ${rx.pk(["Alpha", "Bravo", "Charlie", "Delta"])}`,
      refusSigne: t.stance === "nie" && rx.ch(0.2),
      spontane: { nie: "J'ai rien fait, vous vous trompez de personne.", minimise: `${CR.GEN2.PR.gram(V).Il} m'a cherché${A.g === "f" ? "e" : ""}, je me suis défendu${A.g === "f" ? "e" : ""}, c'est tout.`, reconnait: "C'est bon, c'est moi. J'ai fait n'importe quoi." }[t.stance],
      calme: !ivresse && rx.ch(0.7),
      pvSaisine: A1.arrPoste.m + rx.int(12, 38),
      // ce que le médecin relève sur le gardé à vue : des mains qui ont frappé, un cou qu'on a empoigné
      mainA: !V0.innocent && V0.coups.includes("poing") && rx.ch(0.65) ? "un œdème modéré en regard des articulations métacarpo-phalangiennes de la main droite" : null,
      couA: doute("legitime_defense") ? "des érosions linéaires récentes de la face latérale gauche du cou, de deux à trois centimètres" : null,
      pouls: rx.int(64, 96), ta: `${rx.int(11, 14)}/${rx.int(7, 9)}`,
      douleur: blesseV ? rx.int(3, 7) : rx.int(1, 3), radio: f.itt > 3,
      esr: { logement: rx.ch(0.7), emploi: A.emploi ? rx.ch(0.5) : null, assoc: rx.pk(["l'association de politique criminelle appliquée et de réinsertion sociale", "le service pénitentiaire d'insertion et de probation", "l'association d'enquête et de médiation"]) },
      nSerie: `${rx.int(10, 99)}${rx.pk(["A", "D", "K"])}${rx.int(1000, 9999)}`, verifEthylo: rx.int(40, 300),
      audCI: rx.pk([13 * 60 + 30, 13 * 60 + 30, 14 * 60]),
      materiel: rx.pk([null, null, "Mes lunettes sont cassées.", "L'écran de mon téléphone est fendu, il est tombé avec moi.", "Ma veste est déchirée à l'épaule."]),
      allait: rx.pk(["Je rentrais chez moi.", "J'allais prendre le métro.", "J'allais chez un ami, à deux rues."]),
      objets: rx.sh(["un trousseau de trois clés", "un paquet de cigarettes entamé", "un briquet", "une carte de transport", "une carte bancaire à son nom", "un portefeuille en cuir noir", "une paire d'écouteurs", "un chargeur de téléphone"]).slice(0, rx.int(2, 4)),
    };
    // le bulletin n° 1, tel que le casier le délivre
    const Dj = (j) => CR.fmtDate(j, "long"), an = t.ant;
    S.casier = [];
    if (an) S.casier.push(`${an.juridiction}, jugement ${an.mineur ? "" : "contradictoire "}du ${Dj(an.jug)} : ${an.label} (${an.art}). ${an.peine ? [an.peine.ferme ? `${an.peine.ferme} mois d'emprisonnement` : "", an.peine.sursis ? `${an.peine.sursis} mois d'emprisonnement avec sursis` : "", an.peine.amende ? `${CR.num(an.peine.amende)} euros d'amende` : ""].filter(Boolean).join(", ") || "peine alternative" : "peine non précisée"}.${an.mineur || an.def == null ? "" : ` Décision définitive le ${Dj(an.def)}.`}${an.fin != null && an.peine && an.peine.ferme ? ` Peine exécutée le ${Dj(an.fin)}.` : ""}`);
    else if (A.casier) { const n = CR.MONDE.ansCasier(A, rx.int(7, 12)); S.casier.push(t.rec ? `Tribunal correctionnel de ${S.lieu.tj.ville}, jugement du ${Dj(S.j0 - rx.int(480, 600))} : violences volontaires, quatre mois d'emprisonnement avec sursis.` : CR.MONDE.casierMineur(A) ? `Tribunal pour enfants de ${S.lieu.tj.ville}, jugement du ${Dj(S.j0 - rx.int(330, 700))} : vol, avertissement judiciaire.` : `Tribunal correctionnel de ${S.lieu.tj.ville}, jugement du ${Dj(S.j0 - n * 365 - rx.int(0, 200))} : ${rx.pk(["vol", "usage de stupéfiants", "conduite sans permis"])}, amende de 300 euros.`); }
    S.langue = S.langue && Object.assign(S.langue, { nat: { "l'arabe": "algérienne", "le portugais": "portugaise", "le roumain": "roumaine", "le bambara": "malienne", "le tamoul": "sri-lankaise" }[S.langue.parle] });
    // toutes les heures que la simulation connaît : une pièce n'en écrit aucune autre
    S.heures = new Set();
    for (const x of S.actes) for (const k of ["m", "fin", "ecrit", "finEcrite", "effet"]) if (x[k] != null && x[k] !== 0) S.heures.add(Math.round(x[k]));
    for (const x of S.faits) S.heures.add(Math.floor(x.m));
    for (const x of S.repas) S.heures.add(x.m);
    S.heures.add(S.x.pvSaisine); S.heures.add(S.x.audCI);
    if (A1.copj) S.heures.add(A1.copj.heure);

    // --- ce que chacun sait et dit
    S.dires = dires(S);
    cache[t.sig] = S;
    return S;
  };

  // ------------------------------------------------------------------ Savoir et dire
  // Pour chaque personne et chaque sujet : état (sait, ignore, se_trompe, ment, cache) et ce qu'elle déclare.
  function dires(S) {
    const { t, verite: V0 } = S, { A, V, T } = S.P, f = t.f;
    const gA = CR.GEN2.PR.gram(A), gV = CR.GEN2.PR.gram(V), gF = CR.GEN2.PR.gram(S.P[V0.frappeur]);
    const fam = (P) => SIM.registre(P) === "familier";
    // registre familier : la négation perd son « ne »
    const ne = (P, s) => (fam(P) ? s.replace(/\b([Jj])e n'/g, "$1'").replace(/\b(je|il|elle|on|ça|ils|elles) n(e |')/gi, "$1 ") : s);
    const nb = V0.coups.filter((c) => c !== "pied").length, c0 = V0.coups[0];
    const tok = (txt, moi, autre) => { const a = CR.GEN2.PR.gram(autre), m = CR.GEN2.PR.gram(moi); return CR.cap(txt.replace(/\{il\}/g, a.il).replace(/\{Il\}/g, a.Il).replace(/\{lui\}/g, a.soi).replace(/\{le\}/g, a.le).replace(/\{oe\}/g, a.e).replace(/\{e\}/g, m.e)); };
    const mot = (n) => ["aucun", "un", "deux", "trois", "quatre", "cinq", "six"][n] || String(n);
    const D = { A: {}, V: {}, T: {} };
    const dit = (qui, sujet, etat, texte) => { D[qui][sujet] = { etat, texte: ne(S.P[qui], texte) }; };
    const arme = f.arme, lesCoups = (n, c) => (c === "arme" ? `${mot(n)} coup${n > 1 ? "s" : ""} avec ${arme}` : c === "poussee" ? "une grosse poussée" : c === "gifle" ? (n > 1 ? `${mot(n)} gifles` : "une gifle") : c === "tete" ? "un coup de tête" : `${mot(n)} coup${n > 1 ? "s" : ""} de poing`);

    // la victime
    dit("V", "mobile", "sait", `${tok(V0.mobile[2], V, A)}.`);
    dit("V", "insulte", V0.insulte === "V" ? (V0.vExagere ? "ment" : "cache") : "sait", V0.insulte === "V" ? (V0.vExagere ? `Je ne l'ai pas insulté${gA.e}, je n'ai rien dit de déplacé.` : "Le ton est monté des deux côtés, je ne sais plus qui a dit quoi.") : `C'est ${gA.soi} qui a commencé à m'insulter.`);
    dit("V", "premier", V0.premier === "V" ? "ment" : "sait", V0.premier === "V" ? `Je ne l'ai pas touché${gA.e}. J'ai peut-être levé la main pour me protéger, rien d'autre.` : `Je ne l'ai pas touché${gA.e}, à aucun moment.`);
    const nbV = V0.vExagere ? nb + 2 : nb;
    dit("V", "coups", V0.vExagere ? "ment" : "sait", `${gF.Il} m'a mis ${lesCoups(nbV, c0)}${nbV > 1 && c0 !== "poing" && c0 !== "arme" ? ", puis des coups de poing" : ""}${V0.coups.includes("pied") ? ", et des coups de pied quand j'étais par terre" : ""}.${V0.role2 === "tient" ? " L'autre me tenait par derrière, je ne pouvais rien faire." : ""}`);
    dit("V", "chute", "sait", V0.chute ? `Je suis tombé${gV.e} par terre${V0.coups.includes("poussee") ? " en arrière" : ""}.` : `Je ne suis pas tombé${gV.e}, je me suis retenu${gV.e}.`);
    dit("V", "auteur", V0.innocent ? "se_trompe" : "sait", V0.connus ? `C'est ${A.prenom} ${A.nom}, je ${gA.le} connais${f.sc === "voisinage" ? ", on habite le même immeuble" : f.sc === "travail" ? ", on travaille ensemble" : " de vue"}.` : `Je ne ${gA.le} connais pas. C'est la personne que les policiers ont arrêtée, j'en suis sûr${gV.e}${V0.innocent ? ", enfin c'était la même veste" : ""}.`);
    dit("V", "lesions", "sait", `J'ai ${V0.lesions.map((l) => l.replace(/,.*$/, "")).join(" et ")}.`);
    dit("V", "alcool", f.sc === "bar" ? "cache" : "sait", f.sc === "bar" ? "J'avais bu un verre ou deux, pas plus." : "Je n'avais rien bu.");
    dit("V", "suite", "sait", `Je dépose plainte. Je veux qu'${gA.il} réponde de ce qu'${gA.il} a fait.`);

    // le témoin
    dit("T", "cris", "sait", `J'étais ${S.lieu.temoinOu}, à ${T.dist} mètres à peu près. J'ai d'abord entendu des éclats de voix${T.dist < 10 ? ", des insultes des deux côtés" : ", sans comprendre les mots"}.`);
    dit("T", "premier", T.vu.premier ? "sait" : "ignore", !T.vu.premier ? "Je n'ai pas vu comment ça a commencé, j'ai tourné la tête en entendant crier." : V0.premier === "V" ? `Celui qui a reçu les coups a d'abord ${t.doutes.includes("legitime_defense") ? "attrapé l'autre au col, le poing levé" : "repoussé l'autre de la main"}. C'est après que c'est parti.` : "Ils étaient face à face, très près. Le premier geste, c'est celui qui a frappé qui l'a fait.");
    dit("T", "coups", T.nbVu === nb ? "sait" : "se_trompe", `J'ai vu ${lesCoups(T.nbVu, c0)}${V0.coups.includes("pied") && T.nbVu > 1 ? ", et un coup de pied une fois l'autre à terre" : ""}. ${T.nbVu === 1 ? "Un seul geste, très rapide." : "Ça a duré quelques secondes."}${V0.role2 === "tient" ? " Un deuxième tenait la victime par derrière." : ""}`);
    dit("T", "description", T.decrit.erreur ? "se_trompe" : "sait", `${gF.Celui} qui a frappé portait ${T.decrit.haut} ${accorde(T.decrit.haut, T.decrit.coul)}${T.decrit.capuche ? ", la capuche sur la tête" : ""}. ${gF.Il} mesurait dans les ${SIM.tailleMots(T.decrit.taille)}.`);
    dit("T", "visage", T.vu.visage ? "sait" : "ignore", T.vu.visage ? "J'ai vu son visage, je pense que je le reconnaîtrais." : `Je n'ai pas vu son visage${T.decrit.capuche ? ", à cause de la capuche" : S.nuit ? ", il faisait sombre" : ", j'étais trop loin"}. Je ne pourrais pas le reconnaître.`);
    dit("T", "connait", "sait", "Je ne connais aucune de ces personnes.");

    // le mis en cause, selon sa position
    const st = t.stance;
    dit("A", "mobile", "sait", `${tok(V0.mobile[1], A, V)}.`);
    dit("A", "insulte", V0.insulte === "A" ? "ment" : "sait", V0.insulte === "A" ? `C'est ${gV.soi} qui m'a mal parlé, moi j'ai répondu, c'est tout.` : `${gV.Il} m'a insulté${gA.e} devant tout le monde, ma mère, tout.`);
    dit("A", "premier", "sait", V0.premier === "V" ? `C'est ${gV.soi} qui m'a touché${gA.e} en premier. ${gV.Il} m'a ${t.doutes.includes("legitime_defense") ? "attrapé au col, le poing levé" : "repoussé de la main"}.` : `On était très près, ${gV.il} gesticulait.`);
    const aveu = { nie: V0.innocent ? ["sait", `Je ne l'ai pas touché${gV.e}. Il y avait un autre type à côté, c'est lui qui a frappé, pas moi.`] : ["ment", `Je ne l'ai jamais frappé${gV.e}. Je l'ai repoussé${gV.e}, ${gV.il} est tombé${gV.e} tout${gV.f ? "e" : ""} seul${gV.e}.`], minimise: [nb > 1 || c0 !== "gifle" ? "ment" : "sait", `J'ai mis une gifle, une seule. Je ne voulais pas lui faire mal.`], reconnait: ["sait", `Oui, j'ai frappé. ${lesCoups(nb, c0).replace(/^./, (x) => x.toUpperCase())}. ${V0.verres > 3 ? "J'avais bu, j'ai perdu le contrôle." : "J'ai perdu mon sang-froid."} Je regrette.`] }[st];
    dit("A", "coups", aveu[0], aveu[1]);
    dit("A", "arme", arme ? (st === "reconnait" ? "sait" : "ment") : "sait", arme ? (st === "reconnait" ? `Oui, j'avais ${arme} dans la main. Je ne l'avais pas pris${gA.e} pour ça.` : `Je n'avais rien dans les mains. ${CR.cap(arme)}, je ne sais pas d'où ça sort.`) : "Je n'avais rien dans les mains.");
    dit("A", "alcool", V0.verres > 3 ? "ment" : "sait", V0.verres > 3 ? (st === "reconnait" ? `J'avais bu ${mot(Math.min(6, V0.verres - 1))} ou ${mot(Math.min(6, V0.verres))} verres.` : "Deux ou trois verres, pas plus.") : V0.verres ? "Un verre ou deux." : "Je n'avais rien bu.");
    dit("A", "second", V0.role2 ? "cache" : "sait", V0.role2 ? "J'étais avec quelqu'un que je connais à peine. Je ne donnerai pas son nom." : "J'étais seul" + gA.e + ".");
    dit("A", "depart", "sait", V0.innocent ? `Je suis parti${gA.e} parce que ça dégénérait, je ne voulais pas d'histoires. Je marchais, je ne courais pas.` : `Je suis parti${gA.e} pour que ça s'arrête. Je ne me suis pas enfui${gA.e}, je marchais.`);
    dit("A", "connait", "sait", V0.connus ? `Je ${gV.le} connais${f.sc === "voisinage" ? ", c'est un voisin" : f.sc === "travail" ? ", on travaille au même endroit" : " de vue"}.` : `Je ne ${gV.le} connais pas, je ne l'avais jamais vu${gV.e}.`);
    return D;
  }
  SIM.dit = (S, qui, sujet) => (S.dires[qui] && S.dires[qui][sujet]) || { etat: "ignore", texte: "" };

  // ------------------------------------------------------------------ Contrôle de cohérence (tests et mise au point)
  SIM.verifier = function (S) {
    const pb = [], a = S.a, TI = S.TI;
    const ord = (x, y, quoi) => { if (x && y && !(x.m <= y.m)) pb.push("ordre : " + quoi); };
    ord(a.appel, a.arrivee, "appel avant l'arrivée"); ord(a.arrivee, a.interp, "arrivée avant l'interpellation"); ord(a.interp, a.arrPoste, "interpellation avant le poste");
    ord(a.arrPoste, a.notif, "poste avant notification"); ord(a.notif, a.avis, "notification avant avis au parquet"); ord(a.notif, a.avisAvocat, "notification avant appel à l'avocat");
    ord(a.avisAvocat, a.audition, "avocat avisé avant l'audition"); ord(a.audition, a.compteRendu, "audition avant compte rendu"); ord(a.compteRendu, a.fin, "compte rendu avant la fin"); ord(a.synthese, a.fin, "synthèse avant la fin");
    if (a.urgences && a.plainte && (S.t.f.itt > 0 || S.verite.chute)) ord(a.urgences, a.plainte, "urgences avant la plainte");
    if (a.reqVideo) ord(a.reqVideo, a.video, "réquisition avant exploitation");
    if (a.reqMed) ord(a.reqMed, a.examen, "réquisition avant examen");
    const has = (i) => S.irr.some((x) => x.id === i);
    if (!has("gav_notif") && a.notif.m - TI > 45) pb.push("notification tardive sans irrégularité tirée");
    if (has("gav_notif") && a.notif.m - TI < 75) pb.push("notification pas assez tardive");
    if (!has("avis_parquet") && a.avis.m - a.notif.m > 15) pb.push("avis au parquet tardif sans irrégularité tirée");
    if (!has("sans_avocat") && !(a.entretien.fin <= a.audition.m)) pb.push("audition avant la fin de l'entretien");
    if (has("sans_avocat") && !(a.audition.m < a.entretien.m)) pb.push("audition sans avocat mal placée");
    if (a.fin.m - TI > 48 * 60) pb.push("garde à vue de plus de quarante-huit heures");
    if (a.fin.m - TI > 24 * 60 && !a.prolong) pb.push("plus de vingt-quatre heures sans prolongation");
    if (a.prolong && !a.prolong.tard && a.prolong.m > TI + 24 * 60) pb.push("prolongation tardive sans irrégularité tirée");
    // personne ne fait deux choses à la fois (sauf contradiction voulue, qui n'existe que sur le papier)
    const occ = S.actes.filter((x) => x.fin).map((x) => ({ par: x.par, d: x.m, f: x.fin, id: x.id }));
    for (let i = 0; i < occ.length; i++) for (let j = i + 1; j < occ.length; j++) if (occ[i].par === occ[j].par && occ[i].d < occ[j].f && occ[j].d < occ[i].f) pb.push(`chevauchement ${occ[i].id} / ${occ[j].id}`);
    if (a.examen && a.examen.m < a.audition.fin && a.audition.m < a.examen.fin) pb.push("examen médical pendant l'audition");
    for (const x of S.actes) if (!["comparution", "fin_gav"].concat(S.voie === "ci" ? [] : ["umj"]).includes(x.id) && (x.fin || x.m) > a.fin.m) pb.push("acte après la fin de la mesure : " + x.id);
    for (const x of S.actes) if (!["comparution", "fin_gav", "synthese", "copj", "umj", "prolongation"].includes(x.id) && (x.fin || x.m) > a.synthese.m) pb.push("acte après la synthèse : " + x.id);
    if (S.verite.innocent && S.t.stance !== "nie") pb.push("innocent qui reconnaît");
    if (!S.verite.lesions.length) pb.push("aucune lésion");
    return pb;
  };
})();
