/* La Permanence — la parole des personnes dans les affaires générées : accords (genre, nombre, personne morale, auteur inconnu),
   manière de parler (âge, milieu, métier, humeur, camp) et entretiens écrits pour l'oral (rendez-vous, permanence, garde à vue,
   dépôt, parloir). Les faits restent ceux du tirage : la même information, racontée par une vraie personne.
   Tout est tiré d'une graine propre à l'affaire et à la réplique (t.sig) : une sauvegarde rejoue les mêmes phrases. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const GEN2 = CR.GEN2;
  const PR = (GEN2.PR = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  // ------------------------------------------------------------------ Accords
  // Traçage (tests) : chaque pronom et chaque accord porte la marque de la personne dont il dépend, ⟦A⟧, ⟦V⟧…
  const TR = { on: false };
  PR.trace = (on) => { TR.on = !!on; };
  PR.traceOn = () => TR.on;
  const MARK = /⟦[^⟧]*⟧/g;
  PR.sansMarques = (s) => (typeof s === "string" ? s.replace(MARK, "") : s);
  const mk = (P) => (TR.on && P && P.__id ? `⟦${P.__id}⟧` : "");
  PR.marquer = function (t) {
    for (const k of ["A", "V", "T", "T2", "P", "C2", "R", "PM"]) if (t[k] && typeof t[k] === "object") Object.defineProperty(t[k], "__id", { value: k, enumerable: false, configurable: true, writable: true });
  };
  PR.id = (P, id) => { if (P && typeof P === "object") Object.defineProperty(P, "__id", { value: id, enumerable: false, configurable: true, writable: true }); return P; };
  // Une personne, un groupe (pl), une personne morale (morale : le nom de la société, g selon le nom), un auteur inconnu (inconnu)
  PR.gram = function (P) {
    const Q = P || { g: "m", inconnu: true };
    const f = Q.g === "f";
    const pl = !!Q.pl;
    const m = mk(Q);
    const w = (sm, sf, pm, pf) => { const x = pl ? (f ? pf : pm) : f ? sf : sm; const i = x.indexOf(" "); return i > 0 && m ? x.slice(0, i) + m + x.slice(i) : x + m; };
    const nom = Q.morale ? Q.nom : Q.inconnu ? (f ? "l'autrice" : "l'auteur") : Q.prenom ? `${Q.prenom} ${Q.nom}` : Q.nom || "";
    return {
      P: Q, f, pl, m, nom,
      il: w("il", "elle", "ils", "elles"), Il: w("Il", "Elle", "Ils", "Elles"),
      le: w("le", "la", "les", "les"), Le: w("Le", "La", "Les", "Les"),
      lui: (pl ? "leur" : "lui") + m, soi: w("lui", "elle", "eux", "elles"), Soi: w("Lui", "Elle", "Eux", "Elles"),
      e: w("", "e", "s", "es"), x: w("x", "se", "x", "ses"), eur: w("eur", "euse", "eurs", "euses"),
      celui: w("celui", "celle", "ceux", "celles"), Celui: w("Celui", "Celle", "Ceux", "Celles"),
      un: w("un", "une", "des", "des"), du: w("du", "de la", "des", "des"), au: w("au", "à la", "aux", "aux"),
      ce: w("ce", "cette", "ces", "ces"), son: w("son", "sa", "leurs", "leurs"), mon: w("mon", "ma", "mes", "mes"),
      civ: w("M.", "Mme", "MM.", "Mmes"), Civ: w("Monsieur", "Madame", "Messieurs", "Mesdames"),
      prevenu: w("le prévenu", "la prévenue", "les prévenus", "les prévenues"), client: w("mon client", "ma cliente", "mes clients", "mes clientes"), Client: w("Mon client", "Ma cliente", "Mes clients", "Mes clientes"),
      accuse: w("l'accusé", "l'accusée", "les accusés", "les accusées"),
      est: pl ? "sont" : "est", a: pl ? "ont" : "a", etait: pl ? "étaient" : "était", sera: pl ? "seront" : "sera", va: pl ? "vont" : "va", avait: pl ? "avaient" : "avait",
      v: (sg, plur) => (pl ? plur : sg),
      w: (sm, sf, pm, pf) => w(sm, sf, pm != null ? pm : sm + "s", pf != null ? pf : sf + "s"),
    };
  };
  PR.e = (P) => PR.gram(P).e;
  PR.civ = (P) => PR.gram(P).civ;
  PR.Civ = (P) => PR.gram(P).Civ;
  PR.il = (P) => PR.gram(P).il;
  PR.Il = (P) => PR.gram(P).Il;
  // L'auteur vu par les autres : un groupe quand il y a des coauteurs
  PR.auteur = function (t) {
    const A = t.A;
    if (!t.co) return A;
    const G = Object.assign({}, A, { pl: true, g: A.g === "f" && (!t.C2 || t.C2.g === "f") ? "f" : "m" });
    if (A.__id) PR.id(G, A.__id);
    return G;
  };
  // Le président, la présidente : la formule de l'audience
  PR.presidence = (id) => { const a = CR.acteur && CR.acteur(id); const f = a && a.look && a.look.g === "f"; return f ? "madame la présidente" : "monsieur le président"; };
  // Les participes qui suivent une personne (accord d'un groupe ou d'une personne morale)
  PR.metier = (P) => (P ? (P.g === "f" && CR.MONDE.METIERS_F[P.metier] ? CR.MONDE.METIERS_F[P.metier] : P.metier) : "");
  // Ce que la personne dit de son activité, selon sa fiche : à la première personne, ou à la troisième (la famille)
  PR.activite = function (V, P, k, o = {}) {
    const met = PR.metier(P);
    const M = CR.MONDE;
    const jeune = P.age < 24;
    switch (M.situ(P)) {
      case "salarie": return { t: V.pk(k, [`Je suis ${met}.`, `Je travaille, je suis ${met}.`, jeune ? `${cap(met)}. Depuis un an.` : `${cap(met)}, depuis quelques années.`]), f: "G_emploi" };
      case "independant": return { t: V.pk(k, [`Je suis ${met}. À mon compte.`, `${cap(met)}. Je travaille à mon compte.`, `Je suis ${met}, je suis à mon compte.`]), f: "G_emploi" };
      case "etudiant": return V.pk(k, [`Je suis ${met}.`, `Je fais des études. Je suis ${met}.`]);
      case "scolaire": return V.pk(k, /^coll/.test(met) ? ["Je suis au collège.", "Je vais au collège. Enfin, j'y allais."] : ["Je vais au lycée. Enfin, j'y allais.", "Je suis au lycée."]);
      case "retraite": return V.pk(k, [`Je suis ${met}.`, P.age >= 64 ? `${cap(met)}, depuis quelques années.` : `${cap(met)}, depuis peu.`]);
      case "rsa": return V.pk(k, ["Je touche le RSA. Je cherche du travail.", "Je suis au RSA, en ce moment. Je cherche."]);
      default: return V.pk(k, o.court ? ["Je cherche du travail."] : ["Je cherche du travail.", "En ce moment, je cherche. J'ai fait de l'intérim.", "Rien, en ce moment. Je cherche."]);
    }
  };
  PR.activite3 = function (P, Ga, passe) {
    const met = PR.metier(P);
    const est = passe ? "était" : "est";
    switch (CR.MONDE.situ(P)) {
      case "salarie": return { t: `${Ga.Il} ${est} ${met}.`, f: "G_emploi" };
      case "independant": return { t: `${Ga.Il} ${est} ${met}, à son compte.`, f: "G_emploi" };
      case "etudiant": return `${Ga.Il} ${est} ${met}.`;
      case "scolaire": return /^coll/.test(met) ? `${Ga.Il} allait au collège. Enfin, quand ${Ga.il} y allait.` : `${Ga.Il} allait au lycée. Enfin, quand ${Ga.il} y allait.`;
      case "retraite": return `${Ga.Il} ${est} ${met}.`;
      case "rsa": return `${Ga.Il} touch${passe ? "ait" : "e"} le RSA. ${Ga.Il} cherch${passe ? "ait" : "e"} du travail.`;
      default: return `${Ga.Il} cherch${passe ? "ait" : "e"} du travail.`;
    }
  };
  // « Vous travaillez ? » : l'employeur peut attester, l'indépendant montre ses factures
  PR.travaillez = function (V, P, k) {
    const met = PR.metier(P);
    switch (CR.MONDE.situ(P)) {
      case "salarie": return { t: V.pk(k, [`Oui, ${met}. Mon patron peut faire une attestation.`, `Je suis ${met}. Mon patron me connaît, il fera une attestation.`]), f: "G_emploi" };
      case "independant": return { t: V.pk(k, [`Oui, ${met}, à mon compte. J'ai mes factures, mes déclarations.`, `Je suis ${met}. À mon compte : je peux montrer mes factures.`]), f: "G_emploi" };
      case "etudiant": case "retraite": return V.pk(k, [`Non, je suis ${met}.`]);
      case "scolaire": return V.pk(k, /^coll/.test(met) ? ["Non, je suis au collège."] : ["Non, je vais au lycée."]);
      case "rsa": return V.pk(k, ["Non. Je touche le RSA.", "Pas en ce moment. Je suis au RSA."]);
      default: return V.pk(k, ["Non. Je cherche.", "Pas en ce moment. Je cherche."]);
    }
  };
  // Une ancienne condamnation : « il y a longtemps » seulement si la personne a l'âge pour que ce soit vrai
  PR.casierUneFois = function (V, P, k, variantes) {
    const ilya = CR.MONDE.casierAncien(P);
    if (!ilya) return V.pk(k, variantes);
    return V.pk(k, [`Une fois, ${ilya}. Une amende.`, `${cap(ilya)}, une fois. Une amende, c'est tout.`]);
  };

  // ------------------------------------------------------------------ Dire l'heure, la date, l'argent, la durée
  const NOMBRES = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];
  PR.heure = function (m) {
    let h = Math.round((((m % 1440) + 1440) % 1440) / 60) % 24;
    if (h === 0) return "vers minuit";
    if (h === 12) return "vers midi";
    if (h < 5) return `vers ${NOMBRES[h]} heure${h > 1 ? "s" : ""} du matin`;
    if (h < 12) return `vers ${NOMBRES[h]} heures du matin`;
    if (h < 18) return `vers ${NOMBRES[h - 12]} heure${h - 12 > 1 ? "s" : ""} de l'après-midi`;
    return `vers ${NOMBRES[h - 12]} heures du soir`;
  };
  // « le samedi 7 septembre 2026 » ; l'année tombe si c'est celle du rendez-vous (sauf demande)
  PR.date = function (d, ref, annee) {
    const s = CR.fmtDate(d, "dowshort");
    const y = CR.ymd(d).y;
    return `le ${s}${annee || ref == null || CR.ymd(ref).y !== y ? " " + y : ""}`;
  };
  PR.euros = (n) => CR.money(n).replace(/\s*€/, " euros");
  PR.ilya = function (j) {
    if (j <= 1) return "hier";
    if (j < 7) return `il y a ${NOMBRES[j] === "une" ? "un" : NOMBRES[j]} jours`;
    if (j < 11) return "la semaine dernière";
    if (j < 25) return `il y a ${Math.round(j / 7) === 2 ? "deux" : "trois"} semaines`;
    if (j < 45) return "il y a un mois";
    if (j < 75) return "il y a un mois et demi";
    if (j < 330) return `il y a ${["", "", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"][Math.min(10, Math.round(j / 30))]} mois`;
    return "il y a plus d'un an";
  };
  PR.etab = function (id) {
    const n = (CR.PLACES[id] || {}).nom || "Maison d'arrêt";
    const low = n[0].toLowerCase() + n.slice(1);
    return { nom: low, a: /^Centre/.test(n) ? "au " + low : "à la " + low };
  };
  // « sa mère » → « ma mère » ; « un cousin » reste « un cousin » ; genre du proche
  PR.proche = (A) => {
    const s = (A && A.proche) || "un cousin";
    return { ma: s.replace(/^s(on|a) /, "m$1 ").replace(/^un /, "mon ").replace(/^une /, "ma "), g: /^(sa|une) /.test(s) ? "f" : "m", nu: s.replace(/^(son|sa|un|une) /, "") };
  };
  PR.enfants = (n) => (n > 1 ? `mes ${NOMBRES[n] === "une" ? "un" : NOMBRES[n] || n} enfants` : n === 1 ? "mon enfant" : "");

  // ------------------------------------------------------------------ La manière de parler
  const SOUTENU = /comptable|professeur|développeu|infirmi|consultant|gérant|commerçant|kinésithérapeute|médecin|notaire|directeur|directrice|cadre|ingénieu|propriétaire|entrepreneu|pharmacien|avocat|architecte|enseignant|retraité/;
  const FAMILIER = /livreu|sans emploi|étudiant|lycéen|collégien|apprenti|intérimaire|chauffeur VTC|agent de sécurité|RSA|préparat|magasini|maçon|serveu|plongeu|vendeu|caissi/;
  const HUMEURS = {
    victime: { abattu: 3, colere: 3, anxieux: 2, bavard: 1.5, mefiant: 0.4, calme: 1.5 },
    proche: { abattu: 5, colere: 2.5, bavard: 1, calme: 1, anxieux: 1 },
    prevenu: { anxieux: 3, mefiant: 2, bavard: 2, colere: 1.5, calme: 2, abattu: 1 },
    garde: { mefiant: 3, anxieux: 3, abattu: 2, colere: 2, bavard: 1, calme: 0.6 },
    detenu: { abattu: 3, mefiant: 2, colere: 2, anxieux: 2, calme: 1.5, bavard: 0.8 },
    famille: { anxieux: 4, bavard: 2, colere: 1, abattu: 2, calme: 1 },
    permanence: { calme: 1 },
  };
  const tirerPoids = (r, w) => { const e = Object.entries(w); let v = r() * e.reduce((a, [, p]) => a + p, 0); for (const [k, p] of e) { v -= p; if (v < 0) return k; } return e[0][0]; };
  const MK = "(?:⟦[^⟧]*⟧)?";
  const SUJ = "(je|tu|il|elle|on|ils|elles|ça|nous|vous|Je|Tu|Il|Elle|On|Ils|Elles|Ça|Nous|Vous)";
  const reNe1 = new RegExp(`\\b([Jj])e${MK} n'(?=[a-zéèêàâîôûh])`, "g");
  const reNe2 = new RegExp(`\\b${SUJ}(${MK}) ne (?=\\S)`, "g");
  const reNe3 = new RegExp(`\\b${SUJ}(${MK}) n'`, "g");
  // L'oral : sans « ne », « ça » pour « cela » (hors des paroles rapportées entre guillemets)
  PR.oral = function (s, reg) {
    if (typeof s !== "string") return s;
    s = s.replace(/(\d)\s?€/g, "$1 euros");
    s = s.split(/(«[^»]*»)/).map((part, i) => (i % 2 ? part : part.replace(/\b(1[0-2]|[1-9]) (mois|semaines?|ans?|jours?|fois|heures?)\b/g, (m0, n, u) => `${["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"][+n]}${+n === 1 && /^(semaine|heure|fois)/.test(u) ? "e" : ""} ${+n === 1 ? u.replace(/s$/, "") : u}`))).join("");
    if (reg === "sout") return s;
    return s.split(/(«[^»]*»)/).map((part, i) => (i % 2 ? part : part
      .replace(reNe1, "$1'")
      .replace(/\b([Cc])e n'(est|était|étaient)\b/g, "$1'$2")
      .replace(reNe2, "$1$2 ")
      .replace(reNe3, "$1$2 ")
      .replace(/\bcela\b/g, "ça").replace(/\bCela\b/g, "Ça"))).join("");
  };
  // Une voix : la personne qui parle, son registre, son humeur ; r(k) donne le hasard d'une réplique
  PR.voix = function (t, P, role, o = {}) {
    const r0 = CR.seeded(t.sig + ":voix:" + role + ":" + (P ? P.prenom + P.nom : ""));
    const age = (P && P.age) || 40;
    const met = (P && P.metier) || "";
    let sc = (SOUTENU.test(met) ? 1.2 : 0) + (age >= 60 ? 0.6 : 0) - (FAMILIER.test(met) ? 1 : 0) - (age < 26 ? 0.9 : age < 32 ? 0.4 : 0) - (P && P.casier ? 0.4 : 0) + (r0() - 0.5) * 1.2;
    if (role === "permanence") sc = 2;
    const reg = sc > 0.75 ? "sout" : sc < -0.6 ? "fam" : "cour";
    const hum = o.humeur || tirerPoids(r0, HUMEURS[role] || HUMEURS.prevenu);
    const G = PR.gram(P);
    const V = { t, P, G, role, reg, hum, age, e: G.e, jeune: age < 28, vieux: age >= 65 };
    V.r = (k) => CR.seeded(t.sig + ":parole:" + role + ":" + k);
    V.pk = (k, a) => pk(V.r(k), a);
    // Dit à l'oral : la phrase de la personne, au registre de la personne
    V.oral = (s) => {
      if (reg === "fam") return PR.oral(s, reg);
      if (reg === "cour") return V.r("ne:" + String(s).slice(0, 24))() < 0.4 ? PR.oral(s, "fam") : PR.oral(s, "cour");
      return PR.oral(s, "sout");
    };
    V.seg = (x) => (typeof x === "string" ? V.oral(x) : x && typeof x === "object" ? Object.assign({}, x, { t: V.oral(x.t) }) : x);
    // Les entrées en matière et les réactions, selon l'humeur et le registre
    V.intro = (k, kind) => {
      const r = V.r("intro:" + k);
      const p = ({ colere: 0.45, abattu: 0.5, anxieux: 0.45, mefiant: kind === "sensible" ? 0.6 : 0.25, bavard: 0.5, calme: 0.15 }[hum] || 0.2) * (kind === "neutre" ? 0.5 : 1);
      if (r() > p) return null;
      const Il = G.Il;
      if (kind === "neutre") return pk(r, { colere: ["Écoutez…", "Bon."], abattu: ["(Un temps.)", "…"], mefiant: ["Bon.", "(Un temps.)"], bavard: ["Alors…", "Oui, alors…", "Ah, ça…"], anxieux: ["Euh…", "Attendez que je me rappelle…", "Oui, oui."], calme: ["Oui.", "Alors."] }[hum] || ["Alors."]);
      const bank = {
        colere: ["Écoutez…", "Je vais vous dire une chose, maître.", "Franchement ?", "Ah, ça…", "Vous voulez vraiment savoir ?"],
        abattu: ["(Un long silence.)", "Pardon… Laissez-moi une seconde.", `(${Il} fixe ses mains.)`, "…", `(${Il} cherche ses mots.)`],
        anxieux: ["Euh… attendez.", `Pardon, je suis un peu perdu${G.e}.`, "Oui, oui. Alors…", "Je ne sais pas si je vais bien l'expliquer.", "Attendez que je me rappelle…"],
        mefiant: kind === "sensible" ? ["Pourquoi vous me demandez ça ?", "Ça reste entre nous, hein ?", "Je l'ai déjà dit aux policiers.", "(Un temps.) Bon."] : ["Bon.", "(Un temps.)", "Si vous voulez."],
        bavard: ["Alors ça, c'est toute une histoire.", "Je vais tout vous raconter, depuis le début.", "Oh, vous savez…", "Bon, alors, attendez."],
        calme: ["Oui.", "Alors.", `Je vais essayer d'être précis${G.e}.`, "Bien sûr."],
      }[hum] || ["Alors."];
      const extra = reg === "fam" ? ["Ben…", "Franchement,", "Bah…"] : reg === "sout" ? ["Voyez-vous,", "Pour être tout à fait honnête,"] : [];
      return pk(r, r() < 0.3 && extra.length ? extra : bank);
    };
    V.reac = (k, bank) => {
      const r = V.r("reac:" + k);
      const p = { colere: 0.4, abattu: 0.4, anxieux: 0.35, mefiant: 0.3, bavard: 0.5, calme: 0.1 }[hum] || 0.2;
      if (r() > p) return null;
      const b = (bank && bank[hum]) || null;
      if (b && b.length) return pk(r, b);
      if (hum === "bavard") return pk(r, DIGRESSIONS(V));
      return null;
    };
    // Une réponse : entrée en matière, les faits à l'oral, une réaction ; o.aCote : une phrase à côté avant de répondre
    V.rep = (k, faits, o = {}) => {
      const out = [];
      const i = o.intro === false ? null : V.intro(k, o.kind);
      if (i) out.push(i);
      if (o.aCote && V.r("acote:" + k)() < (hum === "bavard" ? 0.55 : hum === "anxieux" ? 0.3 : 0.15)) out.push(V.oral(V.pk("acote2:" + k, [].concat(o.aCote))));
      for (const x of faits) {
        if (!x) continue;
        let y = V.seg(x);
        if (out.length && /,$/.test(out[out.length - 1])) {
          const low = (s) => (/^(M\.|Mme|[A-ZÀ-Ý][a-zà-ÿ'-]+ [A-ZÀ-Ý])/.test(s) ? s : s[0].toLowerCase() + s.slice(1));
          y = typeof y === "string" ? low(y) : Object.assign({}, y, { t: low(y.t) });
        }
        out.push(y);
      }
      const re = o.reac === false ? null : V.reac(k, o.reac);
      if (re) out.push(V.oral(re));
      return out;
    };
    return V;
  };
  const DIGRESSIONS = (V) => [
    "Excusez-moi, je parle trop. On me le dit souvent.",
    "J'ai mis une heure pour venir, le métro était bloqué à Barbès.",
    `Je n'ai pas dormi de la nuit, je savais que je venais vous voir.`,
    "Mon médecin dit que je devrais en parler, alors j'en parle.",
    "Vous avez de la chance, c'est calme ici. Chez moi, les voisins font des travaux depuis des semaines.",
    V.vieux ? "De mon temps, on ne voyait pas des choses pareilles." : "Ma mère me dit de ne pas trop y penser. Facile à dire.",
  ];

  // ------------------------------------------------------------------ Le récit des victimes : trier les phrases de la plainte
  const MED = /^(J'ai eu |J'ai une |J'ai des |Le médecin|Aux urgences|Les urgences)/;
  const EMO = /(J'ai honte|J'ai peur|peur de |Je ne dors|Je dors |Je change d'horaires|J'ai fermé mes comptes|Je ne sors plus|ne veut plus dormir|Je le crois capable|Je la crois capable|Je les crois capables|Je ne laisse plus|cauchemars|Je dépose plainte|anxiolytiques|Je ne pourrai pas reprendre|Je suis en arrêt|nous manque|Je n'ose|Je veux que ça s'arrête)/;
  const TEMOIN_L = /(a tout vu|ont entendu|n'a vu|devant témoin|criait)/;
  const PV = /^(Je dépose plainte|Nous déposons plainte)\.?$/;
  PR.trier = function (lines) {
    const out = { faits: [], med: [], emo: [], vu: [] };
    for (const l of lines || []) {
      if (!l) continue;
      const parts = String(l).split(/(?<=[.!?»])\s+(?=[A-ZÀÉÈÊÇÔ«])/);
      let cur = [];
      const flush = (k) => { if (cur.length) { out[k].push(cur.join(" ")); cur = []; } };
      let kind = null;
      for (const p of parts) {
        if (PV.test(p.trim())) continue;
        // une phrase qui commence par un pronom continue la précédente (« Mon médecin… Il a fixé l'ITT »)
        const k = kind && /^(Il|Elle|Ils|Elles)\b/.test(p) ? kind : MED.test(p) ? "med" : EMO.test(p) ? "emo" : TEMOIN_L.test(p) ? "vu" : "faits";
        if (kind && k !== kind) flush(kind);
        kind = k;
        cur.push(p);
      }
      flush(kind || "faits");
    }
    return out;
  };

  // ------------------------------------------------------------------ Relations entre l'auteur et la victime
  const REL = {
    violences_conj: (f) => (f.sc === "ex" ? ["mon ex", "mon ex"] : ["mon compagnon", "ma compagne"]),
    harcelement_moral: (f) => ({ couple: ["mon ex", "mon ex"], travail: ["mon responsable", "ma responsable"], voisinage: ["mon voisin", "ma voisine"] }[f.sc]),
    harcelement_sexuel: (f) => ({ travail: ["mon chef d'équipe", "ma cheffe d'équipe"], bailleur: ["mon propriétaire", "ma propriétaire"] }[f.sc]),
    menaces: (f) => ({ voisin: ["mon voisin", "ma voisine"], couple: ["mon ex", "mon ex"], travail: ["quelqu'un du travail", "quelqu'un du travail"] }[f.sc]),
    abus_confiance: (f) => ({ association: ["l'ancien trésorier de l'association", "l'ancienne trésorière de l'association"], acompte: ["l'artisan qui devait faire ma cuisine", "l'artisane qui devait faire ma cuisine"], voiture: ["un ami", "une amie"], tutelle: ["quelqu'un de la famille", "quelqu'un de la famille"] }[f.sc]),
    violation_domicile: (f) => ({ voisin: ["mon voisin", "ma voisine"], ex: ["mon ex", "mon ex"] }[f.sc]),
    usurpation_identite: (f) => ({ faux_profil: ["mon ex", "mon ex"] }[f.sc]),
    cyberharcelement: (f) => ({ ex: ["mon ex", "mon ex"] }[f.sc]),
    acces_frauduleux: (f) => ({ conjoint: ["mon compagnon", "ma compagne"], ex_salarie: ["un ancien salarié", "une ancienne salariée"] }[f.sc]),
    vol: (f) => ({ vulnerable: ["celui qui montait mes courses", "celle qui montait mes courses"] }[f.sc]),
    appels_malveillants: (f) => ({ voisin: ["mon voisin", "ma voisine"], couple: ["mon ex", "mon ex"], client: ["un client", "une cliente"] }[f.sc]),
    violences: (f) => ({ travail: ["un collègue", "une collègue"], voisinage: ["mon voisin", "ma voisine"] }[f.sc]),
    faux_usage: (f) => ({ bulletins: ["le locataire", "la locataire"] }[f.sc]),
    escroquerie: (f) => ({ location: ["le soi-disant propriétaire", "la soi-disant propriétaire"] }[f.sc]),
    extorsion: (f) => ({ dette: ["un type du quartier", "une fille du quartier"] }[f.sc]),
  };
  PR.relation = function (t) {
    const fn = REL[t.inf];
    const rel = fn ? fn(t.f || {}) : null;
    if (!rel) return null;
    return rel[t.A.g === "f" ? 1 : 0];
  };

  // ------------------------------------------------------------------ Catégories d'infractions : ce qu'on demande à la victime
  PR.categorie = function (t, N) {
    const inf = t.inf;
    const IV = CAT.ficheDe(CAT.INF[inf], t.f);
    if (IV && IV.categorie) return typeof IV.categorie === "function" ? IV.categorie(t.f) : IV.categorie;
    if (inf === "violences_conj") return "conj";
    if (["delit_fuite", "blessures_routieres", "homicide_routier"].includes(inf)) return "route";
    if (inf === "cambriolage") return "cambr";
    if (inf === "recel") return "recel";
    if (inf === "menaces") return t.f.forme === "ecrite" ? "msg" : "scene";
    if (["harcelement_moral", "harcelement_sexuel", "cyberharcelement", "appels_malveillants"].includes(inf)) return "msg";
    if (["usurpation_identite", "acces_frauduleux"].includes(inf)) return "num";
    if (["abus_confiance", "escroquerie", "faux_usage", "abs", "fraude_fiscale", "blanchiment", "corruption"].includes(inf)) return "fin";
    return "scene";
  };
  PR.CATEGORIES = { scene: "une scène brève", conj: "le couple", route: "un accident", cambr: "un cambriolage", recel: "un recel", msg: "des messages ou des appels", num: "une usurpation ou une intrusion", fin: "de l'argent détourné ou escroqué" };
  // Questions sur la scène (« qui a vu ») : seulement là où il y a une scène
  PR.SCENE = /vu la scène|assisté à ça|du monde autour de vous/;

  const tem = (t, T, f) => {
    // Comment la victime présente le témoin, selon le lieu
    const G = PR.gram(T);
    const lieu = { bar: G.w("un client du bar", "une cliente du bar"), travail: G.w("un collègue", "une collègue"), voisinage: G.w("un voisin", "une voisine"), voisin: G.w("un voisin", "une voisine"), sport: G.w("un joueur de l'autre équipe", "une joueuse de l'autre équipe"), transport: G.w("un passager", "une passagère"), file: G.w("un client qui faisait la queue", "une cliente qui faisait la queue"), domicile: G.w("le voisin du dessous", "la voisine du dessous") }[f.sc];
    return lieu || G.w("quelqu'un qui passait", "une dame qui passait");
  };

  // ------------------------------------------------------------------ Préjudice, dit par la victime
  PR.prejudiceOral = function (V, N, o = {}) {
    const out = [];
    const G = V.G;
    for (const po of N.prejudice || []) {
      const premier = !out.length;
      const lab = po.label || "";
      const par = (/\(([^)]*)\)/.exec(lab) || [])[1] || "";
      const k = "pj:" + po.id + lab.length;
      const just = !po.piece ? "" : po.piece === "releve" ? V.pk(k + "j", ["J'ai les relevés de la banque.", "Tout est sur mes relevés de compte."]) : po.piece === "devis" ? "J'ai le devis avec moi." : /attestation/.test(po.piece) ? "" : po.piece === "facture_soins" ? "J'ai gardé les factures." : V.pk(k + "j", ["J'ai le justificatif, je vous l'ai apporté.", "J'ai gardé tous les papiers.", "J'ai la facture, quelque part dans la pochette."]);
      let s;
      if (/^Sommes (détournées|escroquées|extorquées)/.test(lab)) s = V.pk(k, [`L'argent, d'abord : ${PR.euros(po.demande)}, en tout. La banque m'a sorti les relevés.`, `${cap(PR.euros(po.demande))}. Vous vous rendez compte ? C'est sur les relevés de la banque.`, o.tiers ? `Il manque ${PR.euros(po.demande)}, en tout.` : `Il me manque ${PR.euros(po.demande)}. J'ai les relevés de compte avec moi.`]);
      else if (/^(Réparation|Réparations)/.test(lab)) s = V.pk(k, [`Les réparations : ${PR.euros(po.demande)}, d'après le devis.`, `Le devis, c'est ${PR.euros(po.demande)}. Je n'ai pas encore fait réparer, je n'ai pas l'argent.`]);
      else if (/^Valeur d'/.test(lab)) { const obj = lab.replace(/^Valeur d'/, "").replace(/\s*\(.*\)$/, ""); s = V.pk(k, [`${cap(obj)} : ${PR.euros(po.demande)}, d'après la facture.`, `Ce qu'on m'a pris, ${obj}, valait ${PR.euros(po.demande)}. J'ai la facture.`]); }
      else if (/^Biens volés/.test(lab)) s = `Ce qu'ils ont pris, pour ${PR.euros(po.demande)}. J'ai retrouvé les factures.`;
      else if (/^Loyers/.test(lab)) s = `Les loyers impayés : ${PR.euros(po.demande)} à ce jour.`;
      else if (/^Dépréciation/.test(lab)) s = V.pk(k, ["On me l'a rendu, mais pas dans l'état où je l'avais. Ça a perdu de la valeur.", "La police me l'a rendu. Abîmé. Ça ne vaut plus la même chose."]);
      else if (/^Dommages matériels/.test(lab)) s = `Les dégâts : ${PR.euros(po.demande)}. Un expert est passé, il a fait un rapport.`;
      else if (/^Coût de restauration/.test(lab)) s = `Il a fallu payer un prestataire pour tout restaurer : ${PR.euros(po.demande)}.`;
      else if (/obsèques/.test(lab)) s = V.pk(k, [`Les obsèques : ${PR.euros(po.demande)}. J'ai la facture des pompes funèbres.`, `Il a fallu payer l'enterrement, ${PR.euros(po.demande)}.`]);
      else if (/^(Pertes? de (gains|salaire))/.test(lab)) s = V.pk(k, [`Mon salaire, aussi : je n'ai pas pu travailler. Ça fait ${PR.euros(po.demande)} en moins.`, `Sur le travail, j'ai perdu ${PR.euros(po.demande)}. Mon employeur peut l'attester.`]);
      else if (/^Provision/.test(lab)) s = "Les médecins disent qu'il faudra une expertise pour tout chiffrer. Je ne suis pas consolidé" + G.e + ".";
      else if (/^(Déficit|Souffrances)/.test(lab) && N.medical && (N.medical.kind === "aucun" || !(N.medical.lesions || []).length) && !par) s = V.pk(k, ["Les semaines d'après, je ne pouvais plus rien faire. Je ne sortais plus de chez moi.", "Après, pendant des semaines, j'étais incapable de quoi que ce soit."]);
      else if (/^(Déficit|Souffrances)/.test(lab)) s = par ? `Physiquement : ${par}. J'ai eu mal pendant des semaines.` : V.pk(k, ["La douleur, les semaines où je ne pouvais rien faire seul" + G.e + ".", "Physiquement, j'ai eu mal. Longtemps. Je ne pouvais plus rien faire."]);
      else if (/^Frais de suivi/.test(lab)) s = `Je vois une psychologue toutes les semaines. Ça coûte : ${PR.euros(po.demande)} pour l'instant.`;
      else if (/d'affection/.test(lab)) s = V.pk(k, ["Et puis… le manque. Rien ne le répare, ça.", "Le reste, je ne sais pas le chiffrer. Il n'y a pas de chiffre pour ça."]);
      else if (/économique/.test(lab)) s = "On vivait aussi sur son salaire. Maintenant, je ne sais pas comment on va faire.";
      else if (/^Préjudice moral/.test(lab)) {
        s = par ? V.pk(k, [premier ? `${cap(par)}. Ça, ça ne se rembourse pas.` : `Et le reste… ${cap(par)}. Ça, ça ne se rembourse pas.`, `Le plus dur, ce n'est pas l'argent. C'est ${/^(la|le|l'|les|des)\b/.test(par) ? par : "ça"}.`]) : V.pk(k, [`${premier ? "Le moral" : "Et puis le moral"}. Je ne suis plus ${G.w("le même", "la même")}.`, "Le moral, surtout. Ça, ça ne se voit pas sur un papier."]);
      } else if (/^Frais médicaux/.test(lab)) s = `Les frais médicaux, et mes vêtements, fichus : ${PR.euros(po.demande)} en tout.`;
      else s = `${cap(lab.replace(/\s*\(.*\)$/, "").toLowerCase())}, ça fait ${PR.euros(po.demande)}.`;
      out.push(just && !/facture|relevés|devis|rapport|attester|papiers/.test(s) ? s + " " + just : s);
    }
    if (!out.length) out.push("Je ne sais pas. Je n'ai pas fait le compte.");
    return out;
  };

  // ------------------------------------------------------------------ Les questions du catalogue (qA, qV) : à l'oral, et hors du contexte de la garde à vue
  PR.qx = function (V, list, pfx, cost, o = {}) {
    return (list || []).map((qq, i) => {
      let q = qq.q;
      if (o.differe) q = q.replace(/Où pouvez-vous aller ce soir, si on vous interdit le domicile \?/, "Si le juge vous interdit le domicile, où irez-vous ?").replace(/ ce soir/, " en ce moment");
      return { id: pfx + i, q, a: V.rep(pfx + i, [].concat(qq.a || []), { reac: o.reac }), cost: cost || 2 };
    });
  };

  // ================================================================== LA VICTIME (partie civile devant le tribunal)
  PR.victime = function (x, o) {
    const { t, N, V: Vic } = x;
    const P = t.client === "P" ? t.P : Vic;
    const deces = !!t.P;
    const classe = o.classe;
    const AU = PR.auteur(t);
    const Ga = PR.gram(AU);
    const Gp = PR.gram(P);
    const V = PR.voix(t, P, deces ? "proche" : "victime");
    const ref = o.day;
    const cat = PR.categorie(t, N);
    const tri = PR.trier(N.plainte || [N.resume]);
    const rel = PR.relation(t);
    const connu = !!rel || ["violences_conj", "harcelement_moral", "harcelement_sexuel", "abus_confiance"].includes(t.inf) && t.f.sc !== "transport";
    const nomA = Ga.nom;
    // ouverture
    const opening = deces
      ? V.pk("ouv", [
        `${PR.gram(P).nom} serre un sac contre ${Gp.soi}. « ${t.V.prenom} est mort${PR.e(t.V)}. Et ${Ga.celui} qui l'a tué${PR.e(t.V)} rentre chez ${Ga.soi} tous les soirs. »`,
        `${PR.gram(P).nom} s'assoit sans enlever son manteau. « Je viens pour ${P.dit || t.V.prenom}. On m'a dit qu'il y aurait un procès. »`,
        `${PR.gram(P).nom} pose une photo sur le bureau, face à vous. « C'est ${t.V.prenom}. Je voulais que vous ${PR.gram(t.V).le} voyiez. »`,
      ])
      : V.hum === "colere" ? `${Gp.nom} pose une pochette sur le bureau, un peu trop fort. « Je vous préviens, maître, je suis à bout. Je veux que la justice reconnaisse ce qu'${Ga.il} m'${Ga.a === "ont" ? "ont" : "a"} fait. »`
        : V.hum === "abattu" ? `${Gp.nom} s'assoit lentement, un mouchoir roulé dans la main. « Pardon. Je ne sais pas par où commencer. »`
          : V.hum === "anxieux" ? `${Gp.nom} reste debout un instant, puis s'assoit au bord de la chaise. « On m'a dit de venir vous voir. Je ne sais pas si j'ai bien fait. »`
            : V.hum === "bavard" ? `${Gp.nom} s'installe, une chemise cartonnée pleine de papiers sur les genoux. « Bonjour, maître. J'ai tout apporté, tout ! Vous allez voir. »`
              : `${Gp.nom} s'assoit, une chemise cartonnée sur les genoux. « Je veux que la justice reconnaisse ce qu'${Ga.il} m'${Ga.a === "ont" ? "ont" : "a"} fait. »`;
    // que s'est-il passé
    const hh = t.d.h != null && ["scene", "route", "conj", "cambr"].includes(cat) && t.f.sc !== "vulnerable" ? ", " + PR.heure(t.d.h) : "";
    const dateSeg = { t: V.pk("date", [`C'était ${PR.date(t.d.faits, ref, true)}${hh}.`, `${cap(PR.date(t.d.faits, ref, true))}${hh}. Je n'oublierai jamais la date.`, `Ça s'est passé ${PR.date(t.d.faits, ref, true)}${hh}.`]), f: "V_date" };
    const faitsTxt = (deces ? (tri.faits.length ? tri.faits : [N.resume]) : tri.faits.length ? tri.faits : [N.resume]).slice(0, 2).join(" ");
    const faitsSeg = { t: faitsTxt, f: "V_faits" };
    const autSeg = { t: connu
      ? V.pk("aut", [`${Ga.Il} s'appelle${Ga.pl ? "nt" : ""} ${nomA}${rel ? `. C'est ${rel}` : ""}.`, `${nomA}${rel ? `, ${rel}` : ""}. Je ne pensais pas qu'${Ga.il} ferait une chose pareille.`, `C'est ${nomA}${rel ? `, ${rel}` : ""}.`])
      : V.pk("aut", [`Je ne ${Ga.le} connaissais pas. D'après les papiers de la police, ${Ga.il} s'appelle${Ga.pl ? "nt" : ""} ${nomA}.`, `Son nom, je l'ai appris par la police : ${nomA}.`, `${Ga.Il} s'appelle${Ga.pl ? "nt" : ""} ${nomA}, d'après la convocation. Avant, je ne savais même pas qui c'était.`]), f: "V_auteur" };
    const quoi = V.rep("quoi", [dateSeg, faitsSeg].concat(tri.faits.slice(2, 3), [autSeg]), { reac: { colere: [`Et ${Ga.il} ${Ga.v("vit sa vie", "vivent leur vie")}, comme si de rien n'était.`, "Ça me rend malade.", "Excusez-moi, je m'énerve."], abattu: ["Je n'arrive toujours pas à y croire.", "(Sa voix se casse.)", "Pardon. Ça remonte."], anxieux: ["Vous pensez qu'on peut faire quelque chose ?", "J'ai peur que ça recommence."] } });
    // la procédure
    const suite = classe
      ? V.rep("suite", [
        { t: V.pk("suite", [`J'ai porté plainte le lendemain, au ${CR.MONDE.lieuxDe(t).F.commCourt}. Et puis ${PR.ilya(o.day - t.d.classement)}, une lettre du procureur : classement sans suite.`, `Plainte le lendemain. Ensuite, plus rien pendant des mois. Et ${PR.ilya(o.day - t.d.classement)}, le procureur m'écrit : classement sans suite.`]), f: "G_classement" },
        V.pk("suite2", ["On m'a dit qu'on pouvait encore faire quelque chose. C'est vrai ?", "Classement sans suite… Ça veut dire quoi, que je mens ?", "Alors c'est fini ? On ne peut plus rien faire ?"]),
      ], { kind: "neutre" })
      : V.rep("suite", [{ t: V.pk("suite", [`${Ga.Il} ${Ga.est} convoqué${Ga.e} au tribunal ${PR.date(t.d.audience, ref)}. J'ai reçu un avis.`, `Le procès, c'est ${PR.date(t.d.audience, ref)}. J'ai reçu un papier du tribunal.`, `On m'a envoyé un avis : ${Ga.il} ${Ga.est} jugé${Ga.e} ${PR.date(t.d.audience, ref)}.`]), f: "G_audience" }], { reac: { anxieux: [`Je dois venir, moi aussi ? Je vais devoir ${Ga.le} voir ?`] } });
    // la question adaptée à l'infraction
    const T = t.T;
    const Gt = PR.gram(T);
    const aT = t.preuves.includes("temoin");
    const vid = t.preuves.includes("video");
    const qvMsg = (N.qV || []).some((qq) => /messages/.test(qq.q));
    const qvMed = (N.qV || []).some((qq) => /médecin/.test(qq.q));
    let qAdapt;
    if (cat === "scene") {
      qAdapt = { q: t.inf === "violation_domicile" ? "Quelqu'un d'autre était là ? Un voisin a vu ou entendu quelque chose ?" : t.inf === "menaces" ? "Quelqu'un d'autre a entendu ces menaces ?" : ["degradations", "incendie"].includes(t.inf) ? "Quelqu'un a vu faire ?" : V.pk("qs", ["Quelqu'un a vu la scène ?", "Il y avait du monde autour de vous, à ce moment-là ?", "Des gens ont assisté à ça ?"]), a: aT
        ? [V.pk("as", [`Oui. ${Gt.civ} ${T.nom}, ${tem(t, T, t.f)}. ${Gt.Il} a tout vu. La police l'a entendu${Gt.e}, je crois.`, `${cap(tem(t, T, t.f))}, oui : ${Gt.civ} ${T.nom}. ${Gt.Il} s'est arrêté${Gt.e}, ${Gt.il} a attendu la police avec moi. Les policiers ont pris son nom.`])]
        : vid ? [V.pk("as", ["Personne ne s'est arrêté. Mais il y a des caméras, là-bas. La police a récupéré les images, il paraît.", "Des gens, oui, mais personne n'a rien voulu dire. Par contre, il y a une caméra juste au-dessus."])]
          : [V.pk("as", ["Non. Enfin, il y avait des gens, mais personne ne s'est arrêté.", "Personne. C'est ça le pire : c'est sa parole contre la mienne.", "Non, personne. Il n'y avait que nous."])] };
    } else if (cat === "conj") {
      qAdapt = { q: "Est-ce que quelqu'un a vu ou entendu quelque chose ? Les voisins, les enfants ?", a: tri.vu.length ? tri.vu.slice(0, 1) : aT ? [`${Gt.civ} ${T.nom}, ${tem(t, T, { sc: "domicile" })}. ${Gt.Il} a entendu les cris, ${Gt.il} est monté${Gt.e}.`] : [`Personne. ${Ga.Il} fait toujours attention à ça.`] };
    } else if (cat === "route") {
      qAdapt = { q: t.inf === "homicide_routier" ? "Qu'est-ce qu'on vous a dit de l'accident ? Il y a des témoins ?" : "Il y a des témoins de l'accident ?", a: aT
        ? [`Oui, ${Gt.civ} ${T.nom}. ${Gt.Il} a tout vu, ${Gt.il} a été entendu${Gt.e} par la police.`].concat(vid ? ["Et il y a des images d'une caméra, d'après les policiers."] : [])
        : vid ? ["Pas de témoin. Mais une caméra a filmé, d'après les policiers."] : ["Personne. Il était tard, la rue était vide."] };
    } else if (cat === "cambr") {
      qAdapt = { q: "Les voisins ont vu ou entendu quelque chose ?", a: aT ? [`${Gt.civ} ${T.nom}, ${Gt.w("le voisin d'en face", "la voisine d'en face")}, a vu quelqu'un sortir avec des sacs. ${Gt.Il} a été entendu${Gt.e} par la police.`] : t.preuves.includes("telephonie") ? ["Rien vu, rien entendu. La police m'a parlé de téléphones qui bornaient dans le quartier."] : ["Rien. Personne n'a rien entendu. En plein jour, vous vous rendez compte ?"] };
    } else if (cat === "recel") {
      qAdapt = { q: "On vous a rendu ce qui vous avait été volé ? Comment l'avez-vous appris ?", a: ["C'est la police qui m'a appelé" + Gp.e + ". Ils l'avaient retrouvé chez quelqu'un. On me l'a rendu, mais abîmé."] };
    } else if (cat === "msg") {
      const ecrits = t.preuves.includes("ecrits");
      qAdapt = qvMsg
        ? { q: "Quelqu'un d'autre a été témoin de ce que vous subissez ?", a: aT ? [`Oui, ${Gt.civ} ${T.nom}. ${Gt.Il} a tout vu, ${Gt.il} a fait une attestation et la police l'a entendu${Gt.e}.`] : [`Non. ${Ga.Il} s'arrange${Ga.pl ? "nt" : ""} toujours pour que personne ne voie.`] }
        : t.inf === "appels_malveillants"
          ? { q: "Comment a-t-on su que c'était bien cette personne ?", a: [t.preuves.includes("telephonie") ? "C'est la police. Ils ont demandé à l'opérateur d'où venaient les appels." : "Je l'ai reconnu" + Ga.e + " à la voix, sur un message."].concat(ecrits ? ["Et j'ai tout noté, avec les dates et les heures."] : []) }
          : { q: "Vous avez gardé les messages ? Quelqu'un d'autre en a été témoin ?", a: [ecrits ? "J'ai tout gardé. Des captures d'écran, avec les dates." : "Pas tout, j'en ai effacé au début. J'avais honte."].concat(aT ? [`${Gt.civ} ${T.nom} était là une fois. ${Gt.Il} a été entendu${Gt.e}.`] : []) };
    } else if (cat === "num") {
      qAdapt = t.inf === "acces_frauduleux"
        ? { q: "Qui d'autre connaissait vos codes ? Qui s'en est aperçu ?", a: [rel ? `Personne d'autre que moi. Enfin… ${rel}, peut-être. Je ne faisais pas attention.` : "Personne, je ne les ai jamais donnés.", "C'est une alerte de sécurité qui m'a prévenu" + Gp.e + " des connexions."] }
        : { q: "Comment vous en êtes-vous rendu compte ?", a: [tri.faits[0] || "Par hasard.", t.preuves.includes("telephonie") ? "La police a retrouvé d'où ça venait, avec l'opérateur." : "J'ai porté plainte tout de suite."] };
    } else {
      // l'argent : accès aux comptes, contact, documents
      const sc = t.f.sc;
      if (t.inf === "abus_confiance") {
        qAdapt = sc === "association" ? { q: "Qui d'autre avait accès aux comptes de l'association ? Qui s'en est aperçu ?", a: [`Personne. ${Ga.Il} avait la carte et les codes, ${Ga.il} faisait tout seul${Ga.e}.`, "C'est le nouveau bureau qui s'en est aperçu, en reprenant les comptes. Les relevés de la banque ne collaient pas."] }
          : sc === "tutelle" ? { q: "Qui d'autre avait accès au compte de votre grand-mère ? Qui s'en est aperçu ?", a: [`Personne d'autre. ${Ga.Il} avait la procuration, c'était pour payer ses factures.`, "C'est moi qui ai vu les relevés, un jour, en l'aidant à ranger ses papiers. Elle ne se rendait compte de rien."] }
            : sc === "acompte" ? { q: "Vous avez un devis, un contrat signé ? Comment avez-vous payé ?", a: ["Le devis, oui, signé. J'ai payé par virement, c'est sur mon relevé.", t.preuves.includes("ecrits") ? "Et j'ai tous ses messages : « la commande est passée », « ça arrive la semaine prochaine »… Des mensonges." : "Ensuite, plus de réponse au téléphone."] }
              : sc === "voiture" ? { q: "Vous avez une trace du prêt ? Un message, quelque chose ?", a: [t.preuves.includes("ecrits") ? `Oui, ses messages. Au début ${Ga.il} disait « je te la rends dimanche ». Après, plus rien.` : "Rien d'écrit. Entre amis, on ne fait pas de papier.", "Et les avis de contravention arrivent chez moi, avec les dates et les lieux."] }
                : { q: "Qui d'autre avait accès à l'argent ? Qui s'en est aperçu ?", a: [`${Ga.Il} était seul${Ga.e} à y toucher.`] };
      } else if (t.inf === "escroquerie") {
        qAdapt = { q: "Comment êtes-vous entré" + Gp.e + " en contact avec cette personne ? Il vous reste des traces des échanges ?", a: [(tri.faits[0] || "").split(/(?<=\.)\s/)[0] || "Par une annonce.", t.preuves.includes("ecrits") ? "J'ai gardé les messages, tous." : "Je n'ai presque rien gardé.", t.preuves.includes("releve") ? "Et le virement est sur mon relevé de banque." : ""].filter(Boolean) };
      } else if (t.inf === "faux_usage") {
        qAdapt = { q: "Comment vous êtes-vous aperçu" + Gp.e + " que les documents étaient faux ?", a: [t.preuves.includes("expertise") ? "On a fait vérifier. L'expert est formel : ce sont des faux." : "On a appelé l'organisme qui les aurait délivrés. Aucune trace.", "Sur le moment, rien ne clochait. C'était bien fait."] };
      } else qAdapt = { q: "Qui s'est aperçu des faits, et comment ?", a: ["C'est en reprenant les comptes. Tout est sur les relevés."] };
    }
    // une fiche peut poser sa propre question (pension impayée, week-ends refusés, accusation à tort…)
    { const IVq = CAT.ficheDe(CAT.INF[t.inf], t.f); const o = IVq && IVq.qVictime ? IVq.qVictime(t, N, { aT, Gt, Ga, Gp }) : null; if (o) qAdapt = o; }
    const topics = [
      { id: "v_quoi", q: V.pk("q1", ["Que s'est-il passé ?", "Racontez-moi ce qui s'est passé.", "Dites-moi ce qui vous est arrivé."]), a: quoi, cost: 5, tag: "good" },
      { id: "v_suite", q: "Où en est la procédure ?", a: suite, cost: 3, tag: "good" },
      { id: "v_prejudice", q: V.pk("q3", ["Qu'avez-vous perdu, concrètement ?", "Parlons de ce que vous avez perdu, concrètement.", "Qu'est-ce que tout ça vous a coûté ?"]), a: V.rep("prej", PR.prejudiceOral(V, N, { tiers: t.inf === "abus_confiance" && ["association", "tutelle"].includes(t.f.sc) }), { intro: false, reac: false }), cost: 3 },
      { id: "v_temoin", q: qAdapt.q, a: V.rep("tem", qAdapt.a, { kind: "neutre", reac: false }), cost: 2, cat },
    ];
    if (tri.med.length && !qvMed) topics.push({ id: "v_blesse", q: `Vous avez été blessé${Gp.e} ?`, a: V.rep("med", tri.med, { reac: { abattu: ["J'ai encore la cicatrice."], colere: ["Pour rien ! Pour rien du tout."] } }), cost: 2 });
    topics.push(...PR.qx(V, N.qV, "v_x", 2, { differe: true }).map((tp) => {
      if (tri.med.length && /médecin/.test(tp.q)) tp.a = tp.a.concat(V.rep("medx", [tri.med[0].split(/(?<=\.)\s/)[0]], { intro: false, reac: false }));
      return tp;
    }));
    topics.push({ id: "v_depuis", q: V.pk("q6", ["Et vous, comment allez-vous, depuis ?", "Comment ça va, depuis ?"]), a: V.rep("dep", (tri.emo.length && tri.emo.join(" ").length > 60 ? tri.emo : tri.emo.concat([{ fin: "Je m'en veux d'avoir fait confiance. Je me sens bête.", msg: "Je regarde mon téléphone cent fois par jour. Je sursaute quand il vibre.", num: "Je change mes codes toutes les semaines. Je ne fais plus confiance à rien.", route: "Je ne monte plus dans une voiture sans avoir peur.", cambr: "Je vérifie la porte trois fois avant de me coucher.", recel: "Ça va. C'est surtout le principe.", conj: "J'ai peur. Tout le temps.", scene: t.inf === "violation_domicile" ? "Je ferme tout à clé, maintenant, même le balcon. Je dors mal." : t.inf === "degradations" || t.inf === "incendie" ? "Je descends voir dix fois par jour. Je ne suis plus tranquille chez moi." : "Je sursaute dès que quelqu'un s'approche de moi dans la rue." }[cat]])).slice(0, 2), { intro: false }), cost: 2, tag: "good", fx: { trust: 2 } });
    topics.push({ id: "v_promesse", q: `Ne vous inquiétez pas, ${Ga.il} ira en prison.`.replace(" ira ", ` ${Ga.v("ira", "iront")} `), a: V.rep("prom", [V.pk("prom", [`En prison ? Je… je voulais surtout être reconnu${Gp.e}.`, "Ce n'est pas ce que je demande. Je veux qu'on dise que c'est arrivé.", `La prison… Je ne sais pas. Je veux juste être reconnu${Gp.e} comme victime.`])], { intro: false, reac: false }), cost: 1, tag: "bad", fx: { flags: { promesse: true } } });
    const close = classe ? V.pk("clo", ["Combien de temps il nous reste, maître ?", "On a encore le temps de faire quelque chose ?", "Il n'est pas trop tard, hein ?"]) : V.pk("clo", ["Je dois venir au tribunal, moi aussi ?", "Et maintenant, qu'est-ce qu'on fait ?", "Vous serez là, le jour du procès ?"]);
    return { opening: [opening], topics, close: V.oral(close), impatient: PR.impatient(V), hangup: PR.hangup(V) };
  };
  PR.impatient = (V) => V.oral(V.pk("imp", [
    V.P && V.P.enfants && V.age < 50 ? "…Pardon, ça va être encore long ? Je dois aller chercher les enfants." : "…Pardon, ça va être encore long ? J'ai laissé mon téléphone sonner trois fois.",
    V.P && V.P.emploi ? "Excusez-moi, je reprends le travail tout à l'heure. On en a encore pour longtemps ?" : "Excusez-moi… je suis fatigué" + V.e + ". On en a encore pour longtemps ?",
  ]));
  PR.hangup = (V) => V.oral(V.pk("hang", ["Écoutez, excusez-moi, je dois vraiment y aller. On se rappelle ?", "Je n'en peux plus, maître. On reprendra une autre fois.", "Je suis désolé" + V.e + ", il faut que je parte."]));

  // ================================================================== LE PRÉVENU CONVOQUÉ (COPJ, CPPV, citation), L'AUDITION LIBRE, L'ORDONNANCE PÉNALE
  // « Il y a un an et demi » : le temps écoulé depuis un jugement, dit à l'oral
  PR.depuis = function (j) {
    if (j < 45) return PR.ilya(j);
    if (j < 330) return `il y a ${NOMBRES[Math.min(10, Math.round(j / 30))] === "une" ? "un" : NOMBRES[Math.min(10, Math.round(j / 30))]} mois`;
    if (j < 540) return "il y a un an";
    if (j < 800) return "il y a un an et demi";
    const a = Math.round(j / 365);
    return `il y a ${["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"][Math.min(10, a)]} ans`;
  };
  // Une condamnation récente, telle que le bulletin n° 1 la décrit (n° 12) : quand, pour quoi, quelle peine, l'appel
  PR.casierRecent = function (V, t, k, ref) {
    const an = t.ant;
    const j = (ref != null ? ref : t.day) - an.jug;
    const quand = PR.depuis(j);
    const meme = an.inf === t.inf;
    const quoi = meme ? V.pk(k + "q", ["pour la même chose", "pour le même genre de chose"]) : `pour ${an.label}`;
    const peine = an.peine.mesure ? "Un avertissement, au tribunal pour enfants." : an.peine.ferme ? `J'ai fait ${CR.fmtMois(an.peine.ferme)} de prison.` : an.peine.sursis ? V.pk(k + "p", ["J'avais eu du sursis.", `Du sursis. ${CR.fmtMois(an.peine.sursis)}.`]) : "Une amende.";
    const appel = an.appel ? " J'avais fait appel. La cour a confirmé." : "";
    return V.pk(k, [`Oui. ${quand.replace(/^./, (c) => c.toUpperCase())}, ${quoi}. ${peine}${appel}`, `Une fois, ${quand}, ${quoi}. ${peine}${appel}`]);
  };
  const casierOral = (V, A, rec, k, t) => (A.casier === 0
    ? V.pk(k, ["Jamais.", "Non, jamais. Jamais de ma vie.", "Rien. Casier vierge.", "Non. C'est la première fois que je mets les pieds là-dedans."])
    : t && t.ant && A.casier === 2 ? PR.casierRecent(V, t, k)
    : rec ? V.pk(k, ["Oui… il y a un an et demi. Pour la même chose.", "Une fois, il y a un an et demi. Le même genre d'histoire. J'avais eu du sursis.", "Oui. Un an et demi. Pareil. Je sais, ça fait mauvais genre."])
      : PR.casierUneFois(V, A, k, ["Une fois, il y a longtemps.", "Il y a longtemps, oui. Une bêtise de jeunesse, une amende.", "Une fois. Ça remonte à des années."]));
  const vieOral = (V, A, k) => {
    const out = [];
    const G = V.G;
    out.push(PR.activite(V, A, k + "e"));
    out.push({ t: V.pk(k + "h", [`J'habite ${A.adresse}${A.enfants ? `, avec ${PR.enfants(A.enfants)}` : ""}.`, `${A.adresse}${A.enfants ? `. Avec ${PR.enfants(A.enfants)}` : ""}. ${A.age < 26 ? "J'y suis depuis deux ans." : "Ça fait des années que je suis là-bas."}`]), f: "G_heberg" });
    return out;
  };
  PR.prevenu = function (x, o) {
    const { t, N, A } = x;
    const V = PR.voix(t, A, "prevenu");
    const G = V.G;
    const nom = G.nom;
    const ref = o.day;
    const k = o.mode;
    const topics = [];
    let opening, close;
    const version = { t: N.version[t.stance], f: "G_version" };
    const vReac = { anxieux: ["Je vais aller en prison ?", "Je n'arrive plus à dormir depuis."], colere: ["Ils ont tout gonflé.", "C'est n'importe quoi, ce dossier."], mefiant: ["C'est ce que j'ai dit, c'est tout.", "Vous me croyez, vous ?"], abattu: ["Je ne sais plus quoi penser."] };
    const ouvHum = {
      colere: `${nom} jette ${k === "op" ? "une lettre recommandée" : "une convocation"} sur le bureau. « Regardez-moi ça. ${k === "al" ? "La police veut m'entendre" : k === "op" ? "Une condamnation, sans même m'avoir vu" + G.e : "Un procès"} ! Pour ça ! »`,
      anxieux: `${nom} ${k === "op" ? "tient une enveloppe" : "tient une convocation pliée en quatre"}, qu'${G.il} n'arrête pas de plier et de déplier. « ${k === "al" ? "Je suis convoqué" + G.e + " au commissariat" : k === "op" ? "J'ai reçu ça. Une condamnation" : "J'ai un procès"}. Je ne sais pas ce qui va m'arriver. »`,
      mefiant: `${nom} s'assoit sans quitter la porte des yeux. « On m'a donné votre nom. Vous faites du pénal, c'est ça ? »`,
      abattu: `${nom} s'assoit, les épaules basses. « Je n'en dors plus, maître. ${k === "al" ? "La police veut m'entendre." : k === "op" ? "On m'a condamné" + G.e + " par courrier." : "Un procès…"} »`,
      bavard: `« Bonjour, maître ! On m'a donné votre nom, un ami à moi… enfin, peu importe. ${k === "al" ? "La police veut m'entendre" : k === "op" ? "J'ai reçu une ordonnance pénale" : "J'ai un procès"}, voilà. »`,
    }[V.hum];
    if (k === "copj") {
      opening = ouvHum && V.r("ouvh")() < 0.6 ? ouvHum : V.pk("ouv", [
        `${nom} tient une convocation pliée en quatre. « J'ai un procès. ${o.tp ? "Au tribunal de police." : "Au tribunal correctionnel."} Je ne sais pas ce qui va m'arriver. »`,
        `${nom} pose une convocation froissée sur votre bureau. « C'est ça. ${o.tp ? "Le tribunal de police" : "Le tribunal correctionnel"}. Je n'ai jamais eu de procès de ma vie. »`.replace(" Je n'ai jamais eu de procès de ma vie.", A.casier ? " Encore." : " Je n'ai jamais eu de procès de ma vie."),
        `${nom} s'assoit, la convocation à la main. « Bon. On m'a dit qu'il me fallait un avocat. Je ne sais même pas ce qu'on me reproche exactement. »`,
      ]);
      topics.push({ id: "c_convoc", q: V.pk("q0", ["Montrez-moi la convocation. Quand l'avez-vous reçue ?", "La convocation : on vous l'a remise quand ?"]), a: V.rep("c_convoc", [
        { t: V.pk("conv", [`On me l'a donnée ${PR.date(t.d.convoc, ref, true)}, ${t.mesure === "gav" ? "à la sortie de la garde à vue" : "au commissariat"}.`, `${cap(PR.date(t.d.convoc, ref, true))}. ${t.mesure === "gav" ? "En sortant de garde à vue" : "Au commissariat"}, on me l'a mise dans la main.`]), f: "C_convoc" },
        { t: V.pk("aud", [`L'audience, c'est ${PR.date(t.d.audience, ref)}.`, `Et le procès est ${PR.date(t.d.audience, ref)}, c'est marqué là.`]), f: "C_audience" },
      ], { kind: "neutre", reac: false }), cost: 3, tag: "good" });
      topics.push({ id: "c_faits", q: V.pk("q1", ["Que s'est-il passé ?", "Racontez-moi, avec vos mots.", "Qu'est-ce qui s'est passé, ce jour-là ?"]), a: V.rep("c_faits", [version], { kind: "sensible", reac: vReac }), cost: 5 });
      const gav = t.mesure === "gav";
      topics.push({ id: "c_mesure", q: gav ? "Comment s'est passée la garde à vue ?" : "Comment s'est passée l'audition ?", a: V.rep("c_mesure", gav
        ? [t.irr.includes("sans_avocat") ? V.pk("m1", ["On m'a dit que l'avocat venait. Il n'est jamais venu, ils ont commencé sans lui.", "Ils ont dit « l'avocat arrive ». Ils ont commencé sans lui. Il n'est jamais venu."]) : V.pk("m1", ["C'était long. J'ai vu l'avocat de permanence trente minutes.", "Une nuit entière. L'avocat de permanence est venu, une demi-heure."]), t.stance === "reconnait" ? V.pk("m2", ["J'ai tout dit. Je voulais que ça s'arrête.", "J'ai tout reconnu. Je voulais sortir."]) : V.pk("m2", ["J'ai donné ma version.", "J'ai dit ce que je vous dis."])]
        : [t.irr.includes("al_quitter") ? V.pk("m1", ["Ils m'ont lu des droits. Je ne savais pas que je pouvais partir.", "On m'a lu un papier, des droits. Personne ne m'a dit que je pouvais m'en aller."]) : V.pk("m1", ["Une heure dans un bureau. On m'a dit que je pouvais partir quand je voulais.", "Ça a duré une heure. Le policier m'a dit que j'étais libre de partir."])], { kind: "neutre", reac: false }), cost: 3 });
      topics.push({ id: "c_casier", q: V.pk("q3", ["Avez-vous déjà été condamné" + G.e + " ?", "Vous avez déjà eu affaire à la justice ?"]), a: V.rep("c_casier", [{ t: casierOral(V, A, t.rec, "cas", t), f: "G_casier" }], { kind: "sensible", aCote: [A.emploi && A.age >= 26 ? "Moi ? Vous savez, j'ai toujours travaillé." : "Pourquoi, ça se voit ?"], reac: false }), cost: 2 });
      topics.push({ id: "c_vie", q: V.pk("q4", ["Parlez-moi de vous : travail, logement, famille.", "Parlez-moi un peu de vous. Votre travail, où vous vivez, votre famille ?"]), a: V.rep("c_vie", vieOral(V, A, "vie"), { kind: "neutre", reac: false }), cost: 3, tag: "good" });
      topics.push(...PR.qx(V, N.qA, "c_x", 2, { differe: true }));
      close = V.pk("clo", ["Alors, qu'est-ce qu'on fait ?", "Vous pensez que je risque quoi ?", "Bon. Et maintenant ?"]);
    } else if (k === "al") {
      opening = ouvHum && V.r("ouvh")() < 0.6 ? ouvHum : V.pk("ouv", [
        `${nom} s'assoit sans enlever son manteau. « La police veut m'entendre. Une audition libre. Je dois y aller seul${G.e} ? »`,
        `${nom} vous tend une convocation. « Le commissariat. Une audition "libre", c'est écrit. Ça veut dire quoi, libre ? »`,
        `${nom} pose son téléphone sur le bureau, l'écran retourné. « Ils m'ont appelé${G.e} pour une audition. J'ai pas dormi depuis. »`,
      ]);
      topics.push({ id: "k_quand", q: V.pk("q0", ["Quand êtes-vous convoqué" + G.e + ", et pour quoi ?", "La convocation, c'est pour quand ? Et pour quels faits ?"]), a: V.rep("k_quand", [
        { t: V.pk("k1", [`${cap(CR.fmtDate(o.jour, "dowshort"))}, à 14 heures, au ${CR.MONDE.lieuxDe(t).F.commCourt}.`, `${cap(CR.fmtDate(o.jour, "dowshort"))} à 14 heures. Le ${CR.MONDE.lieuxDe(t).F.commCourt}.`]), f: "K_convoc" },
        V.pk("k2", [`Pour ${o.infNom}, d'après le papier.`, `On me parle de ${o.infNom}. Je ne comprends pas.`, `C'est écrit « ${o.infNom} ».`]),
      ], { kind: "neutre", reac: false }), cost: 3, tag: "good" });
      topics.push({ id: "k_faits", q: V.pk("q1", ["Que s'est-il passé, selon vous ?", "Racontez-moi ce qui s'est passé, de votre point de vue."]), a: V.rep("k_faits", [version], { kind: "sensible", reac: vReac }), cost: 5 });
      topics.push({ id: "k_casier", q: "Avez-vous déjà eu affaire à la justice ?", a: V.rep("k_casier", [{ t: A.casier === 0 ? casierOral(V, A, false, "cas") : t.ant && A.casier === 2 ? PR.casierRecent(V, t, "cas") : PR.casierUneFois(V, A, "cas", ["Une fois, il y a longtemps.", "Une fois. Ça remonte à des années."]), f: "G_casier" }], { kind: "sensible", reac: false }), cost: 2 });
      topics.push({ id: "k_vie", q: "Votre travail, votre famille ?", a: V.rep("k_vie", vieOral(V, A, "vie"), { kind: "neutre", reac: false }), cost: 2 });
      topics.push(...PR.qx(V, N.qA, "k_x", 2, { differe: true }));
      close = V.pk("clo", ["Vous viendrez avec moi ?", `Vous serez là, hein ? Je n'y vais pas ${G.w("tout seul", "toute seule")}.`, "Il faut que je leur dise quoi ?"]);
    } else {
      opening = ouvHum && V.r("ouvh")() < 0.6 ? ouvHum : V.pk("ouv", [
        `${nom} pose une enveloppe sur votre bureau. « J'ai reçu ça. Je ne comprends rien. »`,
        `${nom} sort une lettre recommandée de sa poche. « Une ordonnance pénale. On me condamne sans m'avoir vu${G.e}. C'est normal, ça ? »`,
        `${nom} pose la lettre à plat et la lisse du plat de la main. « Je voudrais savoir si je peux contester. »`,
      ]);
      topics.push({ id: "o_quoi", q: "Qu'avez-vous reçu, et quand ?", a: V.rep("o_quoi", [
        { t: V.pk("o1", ["Une ordonnance pénale, en recommandé. J'ai signé l'avis le {notifDate}.", "Le facteur me l'a donnée le {notifDate}. Un recommandé, j'ai signé l'avis."]), f: "O_notif" },
        { t: V.pk("o2", [`Ils me condamnent à ${o.opTexte}.`, `${cap(o.opTexte)}, voilà ce qu'ils me mettent.`]), f: "O_peine" },
      ], { kind: "neutre", reac: false }), cost: 3, tag: "good" });
      topics.push({ id: "o_faits", q: "Que s'était-il passé ?", a: V.rep("o_faits", [V.pk("of", [`D'après la lettre, j'aurais commis ${o.qLabel}.`, `Ils parlent de ${o.qLabel}.`]), N.version[t.stance]], { kind: "sensible", reac: vReac }), cost: 4 });
      topics.push({ id: "o_enjeu", q: V.pk("q2", ["Qu'est-ce qui vous inquiète le plus ?", "Qu'est-ce qui vous fait le plus peur, dans tout ça ?"]), a: V.rep("o_enjeu", [{ t: V.pk("oe", (o.route ? CR.MONDE.enjeuPermis(A) : CR.MONDE.enjeuCasier(A)).dit), f: "O_enjeu" }], { kind: "neutre" }), cost: 2 });
      topics.push({ id: "o_proc", q: "Avez-vous des papiers de la procédure ?", a: V.rep("o_proc", [V.pk("op", ["Rien. Juste cette lettre.", "Non, rien d'autre. On ne m'a rien donné.", "Seulement l'enveloppe et la lettre."])], { intro: false, reac: false }), cost: 1 });
      topics.push(...PR.qx(V, N.qA, "o_x", 2, { differe: true }));
      close = V.pk("clo", ["Alors, je fais quoi ?", "Je paie, ou je conteste ?", "Vous me conseillez quoi ?"]);
    }
    return { opening: [opening], topics, close: V.oral(close), impatient: PR.impatient(V), hangup: PR.hangup(V) };
  };

  // ================================================================== N° 12 : LA SOCIÉTÉ CLIENTE (son représentant, muni d'un pouvoir)
  // La personne qui parle est le représentant (t.R : première personne) ; la société (t.PM, « elle ») et le dirigeant (t.A) sont
  // à la troisième personne. o : { day, cjip }
  PR.prevenuPM = function (x, o) {
    const { t, N, A } = x;
    const R = t.R, PM = t.PM;
    const V = PR.voix(t, R, "prevenu", { humeur: pk(CR.seeded(t.sig + ":pmhum"), ["calme", "anxieux", "mefiant"]) });
    const G = V.G;
    const GS = PR.gram(PM);
    const GA = PR.gram(A);
    const ref = o.day;
    const soc = `la ${PM.nom}`;
    const topics = [];
    const opening = V.pk("ouv", [
      `${G.nom} pose sur votre bureau un dossier épais et une lettre de pouvoir. « Je viens pour ${soc}. Je suis ${PR.metier(R)}. ${o.cjip ? "Le parquet nous propose une convention judiciaire d'intérêt public." : `${GS.Il} est convoqué${GS.e} devant le tribunal correctionnel.`} »`,
      `${G.nom} s'assoit, une serviette de cuir sur les genoux. « ${PR.metier(R).replace(/^./, (c) => c.toUpperCase())} de ${soc}. ${o.cjip ? "Nous avons reçu une proposition du parquet ; il faut répondre vite." : "La société est poursuivie. Je suis mandaté" + G.e + " pour la représenter."} »`,
    ]);
    topics.push(o.cjip
      ? { id: "m_cjip", q: "Que vous propose le parquet, exactement ?", a: V.rep("m_cjip", [{ t: `Une convention judiciaire d'intérêt public : ${PR.euros(t.cjip.amende)} d'amende${t.cjip.programme ? `, et un programme de conformité de ${t.cjip.mois} mois sous le contrôle de l'Agence française anticorruption` : ""}.`, f: "G_cjip" }, `Il faut répondre sous ${t.cjip.delaiReponse} jours.`], { kind: "neutre", reac: false }), cost: 3, tag: "good" }
      : { id: "m_convoc", q: "La convocation : quand l'avez-vous reçue, et pour quand ?", a: V.rep("m_convoc", [{ t: `Elle a été remise ${PR.date(t.d.convoc, ref, true)}.`, f: "C_convoc" }, { t: `L'audience est ${PR.date(t.d.audience, ref)}.`, f: "C_audience" }], { kind: "neutre", reac: false }), cost: 3, tag: "good" });
    topics.push({ id: "m_faits", q: "Que reproche-t-on à la société ?", a: V.rep("m_faits", [N.resume, t.dirigeantPoursuivi === false ? `${GA.nom} n'est pas poursuivi${GA.e} personnellement. Seule la société l'est.` : `${GA.nom}, ${GA.f ? "notre présidente" : "notre président"}, est poursuivi${GA.e} aussi, à titre personnel. ${GA.Il} a son propre avocat.`], { kind: "sensible", reac: false }), cost: 4 });
    topics.push({ id: "m_societe", q: "Parlez-moi de la société : activité, effectif, chiffre d'affaires.", a: V.rep("m_societe", [{ t: `${PM.effectif} salariés. ${PR.euros(PM.ca)} de chiffre d'affaires l'an dernier.`, f: "G_pm" }, "Nous n'avons jamais été condamnés."], { kind: "neutre", reac: false }), cost: 2 });
    if (t.deleg) topics.push({ id: "m_deleg", q: "Qui était chargé de la sécurité ?", a: V.rep("m_deleg", [t.deleg.existe ? { t: `Une délégation de pouvoirs avait été signée au profit de ${t.deleg.qui.prenom} ${t.deleg.qui.nom}, ${t.deleg.qui.poste}. Je vous l'ai apportée.`, f: "G_deleg" } : `Personne en particulier. ${GA.f ? "La présidente" : "Le président"} suivait les chantiers ${GA.soi}-même, quand ${GA.il} le pouvait.`], { kind: "neutre", reac: false }), cost: 3, tag: "good" });
    topics.push({ id: "m_pouvoir", q: "Qui vous a donné pouvoir de représenter la société ?", a: V.rep("m_pouvoir", [t.dirigeantPoursuivi === false ? `${GA.nom}, ${GA.f ? "notre présidente" : "notre président"}. J'ai la lettre.` : `${GA.f ? "La présidente" : "Le président"} étant poursuivi${GA.e} ${GA.soi} aussi, le conseil m'a désigné${G.e}. On m'a parlé d'un mandataire de justice, si besoin.`], { kind: "neutre", reac: false }), cost: 1 });
    const close = V.pk("clo", ["Que risque la société, concrètement ?", "Qu'est-ce que vous nous conseillez ?", "Nous avons besoin d'une stratégie, maître."]);
    return { opening: [V.oral(opening)], topics, close: V.oral(close), impatient: PR.impatient(V), hangup: PR.hangup(V) };
  };

  // ================================================================== LA PERMANENCE (garde à vue, comparution immédiate, défèrement)
  PR.permanence = function (x, o) {
    const { t, A, q } = x;
    const V = PR.voix(t, null, "permanence");
    const G = PR.gram(A);
    const nom = G.nom;
    const infNom = CAT.ficheDe(CAT.INF[t.inf], t.f).nom.toLowerCase();
    const salut = o.nuit ? "Maître, pardon de vous appeler à cette heure-ci. " : "";
    let opening;
    if (o.mode === "ci") opening = V.pk("ouv", [
      `Maître, ici la permanence des comparutions immédiates. Un dossier pour vous à la 23e chambre cet après-midi : ${nom}, ${A.age} ans, déféré${G.e} pour ${q.label}. Le dossier est au bureau des avocats, la personne au dépôt.`,
      `Permanence des comparutions immédiates, bonjour maître. Vous avez un dossier cet après-midi à la 23e : ${G.civ} ${nom}, ${A.age} ans, ${q.label}. ${G.Il} est au dépôt ; le dossier vous attend au bureau des avocats.`,
    ]);
    else if (o.mode === "defer") opening = V.pk("ouv", [
      `Maître, ici la permanence pénale de l'Ordre. Un défèrement au pôle de l'instruction : ${nom}, ${A.age} ans, sort de ${t.bo ? "quatre-vingt-seize" : "quarante-huit"} heures de garde à vue pour ${q.label}. Interrogatoire de première comparution cet après-midi devant ${o.jiNom}${t.dpRequise ? " ; le parquet requiert la détention provisoire" : ""}. Vous ${G.le} prenez ?`,
      `Permanence pénale, bonjour maître. J'ai un défèrement au pôle de l'instruction : ${G.civ} ${nom}, ${A.age} ans, ${t.bo ? "quatre-vingt-seize" : "quarante-huit"} heures de garde à vue derrière ${G.soi}, ${q.label}. ${o.jiNom} ${G.le} reçoit cet après-midi pour la première comparution${t.dpRequise ? ", et le parquet demande la détention" : ""}. Je vous ${G.le} donne ?`,
    ]);
    else opening = V.pk("ouv", [
      `${salut}Maître, ici la permanence pénale de l'Ordre. Garde à vue au ${CR.MONDE.lieuxDe(t).F.comm.replace(/^Commissariat/, "commissariat")} : ${nom}, ${A.age} ans, pour ${infNom}. ${G.Il} a demandé un avocat commis d'office. Vous y allez ?`,
      `${salut}Permanence pénale, maître. Le ${CR.MONDE.lieuxDe(t).F.comm.replace(/^Commissariat/, "commissariat")} nous signale une garde à vue : ${G.civ} ${nom}, ${A.age} ans, ${infNom}. ${G.Il} demande un avocat. Je vous l'attribue ?`,
    ]);
    const resume = x.N.resume;
    // après deux-points : minuscule, sauf un nom propre (« Prénom Nom ») en tête
    const bas = (s) => (/^[A-ZÀ-Ý][a-zà-ÿ'-]+ [A-ZÀ-Ý]/.test(s) || /^[A-ZÀ-Ý][a-zà-ÿ-]+,/.test(s) ? s : s[0].toLowerCase() + s.slice(1));
    const topics = [
      { id: "p_info", q: "Que savez-vous de l'affaire ?", a: [V.pk("inf", [`D'après la fiche que j'ai sous les yeux : ${bas(resume)}`, `${o.mode === "gav" ? "Ce que le commissariat m'a dit" : "D'après le dossier du parquet"} : ${bas(resume)}`, `${resume} C'est tout ce que j'ai, maître.`])], cost: 2, tag: "good" },
      { id: "p_oui", q: o.mode === "ci" ? "Je prends le dossier." : o.mode === "defer" ? "Je le prends." : "J'y vais.", a: [o.mode === "ci" ? V.pk("oui", ["Merci, maître. L'audience commence à 14 heures ; votre dossier passera dans l'après-midi.", "Parfait. Audience à 14 heures, vous passerez dans l'après-midi."]) : o.mode === "defer" ? V.pk("oui", ["Merci, maître. Le dossier est au cabinet du juge, la personne au dépôt.", "Je vous inscris. Le dossier est au cabinet du juge ; la personne attend au dépôt."]) : V.pk("oui", ["Merci, maître. Je préviens le commissariat.", "Très bien, j'appelle l'officier de quart pour lui dire que vous arrivez."])], cost: 1, tag: "good", ends: true, fx: { flags: { accepte: true } } },
      // phase 3 : une commission d'office ne se refuse pas sans motif d'excuse ou d'empêchement (art. 9 de la loi du 31 décembre 1971)
      { id: "p_non", q: o.mode === "defer" ? "Je ne peux pas." : "Je ne peux pas prendre ce dossier.", a: [V.pk("non", ["Pour quel motif, maître ? Vous êtes inscrit à la permanence : je dois le noter.", "Maître, vous êtes de permanence. Quel est votre empêchement ?"])], cost: 1, tag: "neutral", unlock: ["p_m_audience", "p_m_conflit", "p_m_malade", "p_m_charge"] },
      { id: "p_m_audience", q: "Je suis déjà retenu : une audience, ou une autre garde à vue en cours.", a: [V.pk("m1", ["Entendu, c'est un empêchement. J'appelle le confrère suivant.", "D'accord, je le note. Je passe au suivant."])], cost: 1, tag: "neutral", ends: true, fx: { flags: { refuse: true, refusMotif: "empechement" } } },
      { id: "p_m_conflit", q: "Conflit d'intérêts : je connais une autre personne mise en cause dans cette affaire.", a: ["Bien sûr. Je note le conflit et j'attribue le dossier à un confrère."], cost: 1, tag: "good", ends: true, fx: { flags: { refuse: true, refusMotif: "conflit" } } },
      { id: "p_m_malade", q: "Je suis souffrant ; je ne suis pas en état d'y aller.", a: ["Soignez-vous, maître. Je préviens le confrère suivant."], cost: 1, tag: "neutral", ends: true, fx: { flags: { refuse: true, refusMotif: "maladie" } } },
      { id: "p_m_charge", q: "J'ai trop de dossiers, et celui-là ne m'intéresse pas.", a: [V.pk("m4", ["Ce n'est pas un motif, maître. Je dois le signaler au bâtonnier.", "Maître… Vous vous êtes inscrit. Je suis obligée d'en référer à l'Ordre.".replace("obligée", "obligé")])], cost: 1, tag: "bad", ends: true, fx: { flags: { refuse: true, refusMotif: "aucun" } } },
    ];
    return { opening: [opening], topics, close: o.mode === "ci" ? "Bonne audience, maître." : o.mode === "defer" ? "Bon courage, maître." : "Bonne garde à vue, maître." };
  };

  // ================================================================== LA GARDE À VUE (entretien de trente minutes) et LE DÉPÔT
  PR.gav = function (x, o) {
    const { t, N, A } = x;
    const V = PR.voix(t, A, "garde");
    const G = V.G;
    const nom = G.nom;
    const hm = o.hm;
    const opening = t.irr.includes("interprete")
      ? V.pk("ouv", [`${nom} vous regarde, ${G.w("inquiet", "inquiète")}. « Pardon… je parle pas bien français. »`, `${nom} se lève quand vous entrez, hésite. « Avocat ? Pardon… le français, un peu seulement. »`])
      : ({
        mefiant: `${nom} est assis${G.e} au bout du banc, les bras croisés. « Vous êtes qui, vous ? L'avocat ? »`,
        anxieux: `${nom} se lève d'un bond quand vous entrez. « C'est vous, l'avocat ? Qu'est-ce qui va m'arriver ? »`,
        abattu: `${nom} est assis${G.e} sur le banc de la cellule, la tête entre les mains. « Ils m'ont dit que vous étiez l'avocat. »`,
        colere: `${nom} tape du plat de la main sur le banc. « Enfin quelqu'un ! On me traite comme un chien, ici. »`,
        bavard: `${nom} vous serre la main un peu trop longtemps. « Ah, maître ! Asseyez-vous… enfin, si on peut appeler ça s'asseoir. »`,
        calme: `${nom} est assis${G.e} sur le banc de la cellule. « Ils m'ont dit que vous étiez l'avocat. »`,
      })[V.hum];
    const prox = PR.proche(A);
    const Gpx = PR.gram({ g: prox.g });
    const topics = [
      { id: "g_faits", q: V.pk("q1", ["Racontez-moi ce qui s'est passé.", "Dites-moi ce qui s'est passé, avec vos mots.", "Qu'est-ce qui s'est passé ?"]), a: V.rep("g_faits", [{ t: N.version[t.stance], f: "G_version" }], { kind: "sensible", reac: { anxieux: ["Je vais dormir ici ?", "Ma famille sait que je suis là ?"], colere: ["Ils m'ont embarqué" + G.e + " comme un voleur.", "Ils ont rien voulu entendre."], mefiant: ["Voilà. C'est tout."], abattu: ["Je suis fatigué" + G.e + "."] } }), cost: 5 },
      { id: "g_heure", q: V.pk("q2", ["À quelle heure vous a-t-on notifié vos droits ?", "Quand est-ce qu'on vous a lu vos droits ? Vous avez une idée de l'heure ?"]), a: V.rep("g_heure", t.irr.includes("gav_notif")
        ? [V.pk("h1", ["Longtemps après. Ils m'ont laissé dans le couloir, les photos, les empreintes…", "Pas tout de suite, ça c'est sûr. D'abord les photos, les empreintes, et j'ai attendu dans le couloir."]), { t: V.pk("h2", [`C'était vers ${hm(o.notif)}, j'ai vu l'horloge.`, `Il était ${hm(o.notif)} quand ils m'ont lu le papier. Il y a une horloge au-dessus du bureau.`]), f: "G_notif" }]
        : t.irr.includes("interprete") ? [{ t: V.pk("h1", ["Un papier en français. J'ai signé. J'ai pas tout compris.", "Ils m'ont donné un papier, en français. J'ai signé. Comprendre… non, pas tout."]), f: "G_langue" }]
          : t.irr.includes("heures") ? [{ t: V.pk("h1", [`Ils m'ont attrapé${G.e} vers ${hm(o.interp)}.`, `On m'a arrêté${G.e} à ${hm(o.interp)}, à peu près.`]), f: "G_interp_client" }, V.pk("h2", ["Après, la voiture, l'attente au poste.", "Ensuite la voiture, et des heures sur un banc avant qu'on me dise quoi que ce soit."])]
            : [V.pk("h1", ["Tout de suite, au début. Un papier à signer.", "Dès que je suis arrivé" + G.e + ". Ils m'ont lu un papier et j'ai signé."])], { kind: "neutre", reac: false }), cost: 3, tag: "good" },
      { id: "g_logement", q: V.pk("q3", ["Où habitez-vous ? Avec qui ?", "Vous habitez où ? Avec qui ?"]), a: V.rep("g_logement", [{ t: A.heberg ? V.pk("l1", [`${cap(A.rue)}, chez ${prox.ma}. On peut le confirmer.`, `Chez ${prox.ma}, ${A.rue}. ${Gpx.Il} peut confirmer, ${Gpx.il} a le téléphone.`]) : V.pk("l1", ["Un peu chez des potes. J'ai pas d'adresse fixe en ce moment.", "Je dors à droite à gauche. Pas d'adresse fixe, en ce moment."]), f: "G_heberg" }], { kind: "neutre", reac: false }), cost: 3, tag: "good" },
      { id: "g_travail", q: "Vous travaillez ?", a: V.rep("g_travail", [PR.travaillez(V, A, "t1")], { kind: "neutre", reac: false }), cost: 2 },
      { id: "g_casier", q: "Avez-vous déjà été condamné" + G.e + " ?", a: V.rep("g_casier", [{ t: A.casier === 0 ? casierOral(V, A, false, "cas") : t.ant && A.casier === 2 ? PR.casierRecent(V, t, "cas") : t.rec ? V.pk("cas", ["Oui, il y a un an et demi. Le même genre de chose. Du sursis.", "Un an et demi. Pareil. J'ai eu du sursis."]) : PR.casierUneFois(V, A, "cas", ["Une fois, il y a longtemps. Une amende.", "Il y a longtemps. Une amende, c'est tout."]), f: "G_casier" }], { kind: "sensible", reac: false }), cost: 2 },
    ].concat(PR.qx(V, N.qA, "g_x", 3));
    const depot = {
      opening: V.pk("dep", [`Le dépôt du tribunal, sous la salle d'audience. ${nom} a passé la nuit en garde à vue. « Il va se passer quoi ? »`, `Le dépôt, sous la 23e chambre. ${nom} a les yeux rouges de fatigue. « On passe quand ? Il va se passer quoi ? »`]),
      renvoi: { id: "g_renvoi", q: "Je vous explique : vous pouvez être jugé" + G.e + " aujourd'hui, ou demander un délai.", a: V.rep("g_renvoi", [V.pk("r1", ["Si je demande un délai, je reste en prison ?", "Un délai ? Et pendant ce temps-là, je suis où, moi ?"]), V.pk("r2", ["D'accord. On fait ce que vous pensez.", "Bon. Vous savez mieux que moi."])], { intro: false, reac: false }), cost: 4, tag: "good", fx: { trust: 4 } },
      close: V.oral(V.pk("dclo", ["« À tout à l'heure, maître. »", "« Vous serez là, hein ? »"])),
    };
    return { opening: [opening], topics, depot };
  };

  // ================================================================== L'INFORMATION JUDICIAIRE : défense (le client ou sa famille), dépôt, victime, parloir
  PR.infoDefense = function (x, o) {
    const { t, N, A, q } = x;
    const fam = o.famille;
    const Ga = PR.gram(A);
    const V = fam ? PR.voix(t, fam, "famille") : PR.voix(t, A, "prevenu");
    const Gf = fam ? PR.gram(fam) : null;
    const ref = o.day;
    const etab = o.etab ? PR.etab(o.etab) : null;
    const prox = PR.proche(A);
    let opening;
    if (fam) opening = V.pk("ouv", [
      `${Gf.nom} pose un dossier sur votre bureau. « ${A.prenom} est ${t.entree === "detenu" ? `${etab.a} depuis ${PR.date(t.d.dp, ref)}` : `${Ga.w("mis", "mise", "mis", "mises")} en examen`}. Son avocat ne répond plus. Il faut que quelqu'un s'en occupe. »`,
      `${Gf.nom} s'assoit, son sac sur les genoux. « C'est pour ${A.prenom}. ${t.entree === "detenu" ? `${Ga.Il} est ${etab.a}` : `${Ga.Il} est ${Ga.w("mis", "mise", "mis", "mises")} en examen`}, et on n'a plus de nouvelles de son avocat. »`,
    ]);
    else opening = t.entree === "convoc"
      ? V.pk("ouv", [`${Ga.nom} s'assoit, une convocation du juge d'instruction à la main. « Je suis convoqué${Ga.e} ${PR.date(t.d.ipc, ref)}, en vue d'une mise en examen. »`, `${Ga.nom} déplie une convocation à en-tête du tribunal. « Un juge d'instruction. ${cap(PR.date(t.d.ipc, ref))}. "En vue d'une mise en examen", c'est écrit. »`])
      : V.pk("ouv", [`${Ga.nom} s'assoit, une ordonnance du juge d'instruction à la main. « Je suis ${Ga.w("mis", "mise")} en examen. Je veux changer d'avocat. »`, `${Ga.nom} pose son dossier sur la table. « Mon avocat ne me rappelle jamais. Je suis ${Ga.w("mis", "mise")} en examen, et je ne sais même pas où on en est. »`]);
    const lui = fam ? Ga : null;
    const topics = [];
    topics.push({ id: "c_faits", q: fam ? `Que lui reproche-t-on ?` : "Que vous reproche-t-on ?", a: V.rep("c_faits", [fam ? V.pk("cf", [`Le juge dit qu'${Ga.il} aurait commis ${q.label}. Moi, je n'y crois pas.`, `D'après ce qu'on nous a dit, c'est grave.`]) : V.pk("cf", ["C'est grave, d'après le juge.", "Je ne comprends pas tout ce qui est écrit."]), { t: V.pk("cq", [`La qualification, c'est ${q.label}.`, `Sur le papier, c'est marqué : ${q.label}.`]), f: "G_qualif" }], { kind: "neutre", reac: false }), cost: 4, tag: "good" });
    topics.push({ id: "c_version", q: fam ? `Que vous a-t-${Ga.il} dit, ${Ga.soi} ?` : "Que s'est-il passé, selon vous ?", a: V.rep("c_version", [{ t: fam ? V.pk("cv", [`${Ga.Il} m'a dit : « ${N.version[t.stance]} »`, `Au parloir, ${Ga.il} m'a juré : « ${N.version[t.stance]} »`].map((s) => (t.entree === "detenu" ? s : s.replace("Au parloir, ", "")))) : N.version[t.stance], f: "G_version" }], { kind: "sensible", reac: fam ? { anxieux: [`${Ga.Il} ne mange plus. Au téléphone, ${Ga.il} a une toute petite voix.`], colere: [`On ${Ga.le} traite comme un criminel.`] } : { anxieux: ["Je vais finir aux assises ?"], mefiant: ["C'est ce que j'ai dit au juge."] } }), cost: 5 });
    if (t.entree === "detenu") topics.push({ id: "c_det", q: `Depuis quand est-${Ga.il} détenu${Ga.e}, et où ?`, a: V.rep("c_det", [{ t: V.pk("cd", [`Depuis ${PR.date(t.d.dp, ref, true)}, ${etab.a}.`, `${cap(PR.date(t.d.dp, ref, true))}. Il est ${etab.a}.`.replace("Il est", `${Ga.Il} est`)]), f: "X_dp" }], { intro: false, reac: false }), cost: 2, tag: "good" });
    else topics.push({ id: "c_cj", q: fam ? `Est-${Ga.il} sous contrôle judiciaire ?` : "Êtes-vous sous contrôle judiciaire ?", a: V.rep("c_cj", [t.entree === "libre" ? (fam ? `Oui. ${Ga.Il} pointe le lundi au commissariat, ${Ga.il} n'a pas le droit de contacter les témoins.` : "Oui. Je pointe le lundi au commissariat, je n'ai pas le droit de contacter les témoins.") : "Non. Rien pour l'instant."], { intro: false, reac: false }), cost: 2 });
    topics.push({ id: "c_juge", q: "Qui est le juge ?", a: V.rep("c_juge", [{ t: V.pk("cj", [`${o.jiNom}.`, `C'est ${o.jiNom}, au tribunal de ${CR.MONDE.lieuxDe(t).TJ.ville}.`]), f: "K_juge" }], { intro: false, reac: false }), cost: 1 });
    // la personnalité : à la troisième personne quand c'est la famille qui parle
    const hebT = A.heberg
      ? fam ? `${Ga.Il} habit${t.entree === "detenu" ? "ait" : "e"} ${A.adresse}, ${t.mineur ? "à la maison, avec moi" : "avec moi"}.` : `J'habite ${A.adresse}, ${t.mineur ? `chez ${prox.ma}` : `avec ${prox.ma}`}.`
      : fam ? `${Ga.Il} n'avait pas d'adresse fixe, ces derniers temps.` : "Je n'ai pas d'adresse fixe en ce moment.";
    const emT = fam ? PR.activite3(A, Ga, t.entree === "detenu") : PR.activite(V, A, "cvem", { court: true });
    topics.push({ id: "c_vie", q: fam ? `Parlez-moi de ${Ga.soi} : où vit-${Ga.il}, avec qui, que fait-${Ga.il} ?` : "Parlez-moi de vous : où vivez-vous, avec qui, que faites-vous ?", a: V.rep("c_vie", [{ t: hebT, f: "G_heberg" }, emT], { kind: "neutre", reac: false }), cost: 3, tag: "good" });
    topics.push({ id: "c_casier", q: fam ? `A-t-${Ga.il} déjà été condamné${Ga.e} ?` : "Avez-vous déjà été condamné" + Ga.e + " ?", a: V.rep("c_casier", [{ t: fam ? (A.casier === 0 ? `Jamais. ${Ga.Il} n'a jamais eu affaire à la police.` : t.rec ? `Oui… une peine de prison, il y a quelques années.` : `Une fois, ${CR.MONDE.casierAncien(A) || "il y a longtemps"}.`) : A.casier === 0 ? "Jamais." : t.rec ? "Oui. Une peine de prison, il y a quelques années." : `Une fois, ${CR.MONDE.casierAncien(A) || "il y a longtemps"}.`, f: "G_casier" }], { kind: "sensible", reac: false }), cost: 2 });
    if (!fam) topics.push(...PR.qx(V, N.qA, "c_x", 3, { differe: true }));
    const close = fam ? V.pk("clo", [`Vous allez ${Ga.le} sortir de là ?`, `Dites-moi qu'il y a quelque chose à faire pour ${Ga.soi}.`]) : V.pk("clo", ["Vous allez me sortir de là ?", "On fait quoi, maintenant ?"]);
    return { opening: [opening], topics, close: V.oral(close), impatient: PR.impatient(V), hangup: PR.hangup(V), who: fam ? { nom: `${fam.prenom} ${fam.nom}` } : null };
  };
  PR.infoDepot = function (x, o) {
    const { t, N, A } = x;
    const V = PR.voix(t, A, "garde");
    const G = V.G;
    const hm = o.hm;
    const opening = V.pk("ouv", [`Le dépôt du tribunal. ${G.nom} n'a presque pas dormi depuis ${t.bo ? "quatre" : "deux"} jours. « Il va se passer quoi, maintenant ? »`, `Le dépôt, sous le tribunal. ${G.nom} se lève, les traits tirés par ${t.bo ? "quatre" : "deux"} jours de garde à vue. « C'est vous, mon avocat ? Il se passe quoi, maintenant ? »`]);
    const topics = [
      { id: "d_faits", q: "Racontez-moi, avec vos mots.", a: V.rep("d_faits", [{ t: N.version[t.stance], f: "G_version" }], { kind: "sensible", reac: { anxieux: ["Je vais aller en prison ?"], abattu: ["Je n'en peux plus."], colere: ["Ils ne m'écoutent pas."] } }), cost: 6 },
      { id: "d_gav", q: "Comment s'est passée la garde à vue ? Quand vous a-t-on lu vos droits ?", a: V.rep("d_gav", t.irr.includes("gav_notif") ? [V.pk("g1", ["Ils m'ont laissé des heures dans un couloir avant de me lire un papier.", "Des heures dans un couloir, avant qu'on me lise quoi que ce soit."]), { t: V.pk("g2", [`Il était plus de ${hm(o.notif - 20)}, je l'ai vu à l'horloge.`, `Quand ils m'ont lu mes droits, il était plus de ${hm(o.notif - 20)}. Il y avait une horloge.`]), f: "G_notif" }]
        : t.irr.includes("gav_enreg") ? [{ t: V.pk("g1", ["Il n'y avait pas de caméra dans le bureau. Le policier a dit que c'était pas la peine.", "Pas de caméra pendant les auditions. Le policier a dit que c'était pas la peine."]), f: "G_camera_gav" }]
          : t.irr.includes("avocat_differe") ? [{ t: V.pk("g1", ["L'avocat est arrivé le troisième jour. Avant, on m'a interrogé" + G.e + " seul" + G.e + ".", "Pas d'avocat avant le troisième jour. Ils m'ont interrogé" + G.e + " seul" + G.e + "."]), f: "G_avocat_absent" }]
            : [V.pk("g1", ["Longue. Ils m'ont posé les mêmes questions dix fois.", "Interminable. Les mêmes questions, encore et encore."])], { kind: "neutre", reac: false }), cost: 4, tag: "good" },
      { id: "d_vie", q: "Parlez-moi de vous : où vivez-vous, avec qui, que faites-vous ?", a: V.rep("d_vie", [{ t: A.heberg ? `J'habite ${A.adresse}, ${t.mineur ? "chez" : "avec"} ${PR.proche(A).ma}.` : "Je n'ai pas d'adresse fixe en ce moment.", f: "G_heberg" }, PR.activite(V, A, "dvem", { court: true })], { kind: "neutre", reac: false }), cost: 3, tag: "good" },
      { id: "d_casier", q: "Avez-vous déjà été condamné" + G.e + " ?", a: V.rep("d_casier", [{ t: A.casier === 0 ? "Jamais." : t.rec ? "Oui. Une peine de prison, il y a quelques années." : `Une fois, ${CR.MONDE.casierAncien(A) || "il y a longtemps"}.`, f: "G_casier" }], { kind: "sensible", reac: false }), cost: 2 },
      { id: "d_juge", q: "Je vous explique : le juge va vous notifier les faits ; vous pouvez vous taire, faire des déclarations, ou être interrogé" + G.e + ".", a: V.rep("d_juge", [V.pk("j", ["Qu'est-ce que vous me conseillez ?", "Et vous, vous feriez quoi ?", "Je dis quoi, alors ?"])], { intro: false, reac: false }), cost: 3, tag: "good", fx: { trust: 3 } },
    ].concat(PR.qx(V, N.qA, "d_x", 3));
    return { opening: [opening], topics, close: V.oral(V.pk("clo", ["« Vous restez avec moi, maître ? »", "« Vous serez là, devant le juge ? »"])) };
  };
  PR.infoVictime = function (x, o) {
    const { t, N, V: Vic, A } = x;
    const C = t[t.client] || Vic;
    const proc = o.proc;
    const decede = o.decede;
    const Gc = PR.gram(C);
    const AU = PR.auteur(t);
    const Ga = PR.gram(AU);
    const V = PR.voix(t, C, decede ? "proche" : "victime");
    const Gv = PR.gram(Vic);
    const opening = decede
      ? V.pk("ouv", [`${Gc.nom} serre un sac contre ${Gc.soi}. « ${Vic.prenom} est mort${Gv.e}. On me dit qu'il y a un juge, une instruction. Je ne comprends rien. »`, `${Gc.nom} s'assoit, le regard fixe. « ${C.dit ? cap(C.dit) : Vic.prenom}… On m'a dit que je pouvais être partie civile. Je ne sais même pas ce que ça veut dire. »`])
      : proc ? V.pk("ouv", [`${Gc.nom} parle à voix basse. « C'est pour mon enfant. On m'a dit qu'il fallait un avocat pour ${Gv.soi}. »`, `${Gc.nom} jette un œil vers la porte avant de s'asseoir. « C'est pour mon enfant. Je ne veux pas qu'${Gv.il} ait à tout raconter encore une fois. »`])
        : V.pk("ouv", [`${Gc.nom} s'assoit. « On m'a dit que je pouvais me constituer partie civile. Je veux comprendre ce qui va se passer. »`, `${Gc.nom} garde son manteau fermé jusqu'au cou. « On m'a parlé d'un juge d'instruction. Je veux savoir ce que je peux faire. »`]);
    const lignes = proc ? [] : (N.victime || N.proche || []).slice();
    let quoi;
    if (proc) quoi = [V.pk("p", ["Je préfère ne pas raconter. Tout est dans la plainte. Les policiers l'ont entendu" + Gv.e + ", filmé" + Gv.e + ".", "Je ne veux pas le redire. Les policiers ont tout filmé, quand ils l'ont entendu" + Gv.e + "."])];
    else if (lignes.length) quoi = lignes.slice(0, 2);
    else if (decede) quoi = [`${cap(C.dit || Vic.prenom)}… ${Gv.Il} est mort${Gv.e} ${PR.date(t.d.faits, o.day)}. On m'a appelé${Gc.e} dans la nuit.`, `D'après la police, c'est ${Ga.nom} qui ${Ga.v("l'a", "l'ont")} tué${Gv.e}.`];
    else quoi = [`C'est arrivé ${PR.date(t.d.faits, o.day)}. Je ne veux pas tout redire, c'est dans ma plainte.`];
    const topics = [
      { id: "v_quoi", q: V.pk("q1", ["Que s'est-il passé ?", "Racontez-moi, si vous le pouvez."]), a: V.rep("v_quoi", quoi, { reac: { abattu: ["(Un long silence.)", "Je n'arrive pas à en parler sans pleurer. Pardon."], colere: ["Et on me demande d'attendre."] } }), cost: 5, tag: "good" },
      { id: "v_proc", q: "Où en est la procédure ?", a: V.rep("v_proc", [V.pk("pr", [`Un juge d'instruction est saisi, ${o.jiNom}. ${Ga.nom} ${Ga.est} ${Ga.w("mis", "mise", "mis", "mises")} en examen${t.detenu ? ` et détenu${Ga.e}` : ""}.`, `C'est ${o.jiNom}, le juge d'instruction. ${Ga.Il} ${Ga.est} ${Ga.w("mis", "mise", "mis", "mises")} en examen${t.detenu ? `, ${Ga.il} ${Ga.est} en prison` : `, ${Ga.il} ${Ga.est} dehors`}.`]), { t: V.pk("pr2", ["Personne ne m'a demandé si je voulais être partie civile.", "Personne ne m'a rien proposé. On ne m'a même pas expliqué ce qu'était une partie civile."]), f: "K_juge" }], { kind: "neutre", reac: false }), cost: 3, tag: "good" },
      { id: "v_prejudice", q: "Qu'avez-vous perdu, concrètement ?", a: V.rep("v_prej", PR.prejudiceOral(V, N), { intro: false, reac: false }), cost: 3 },
      { id: "v_peur", q: `Avez-vous peur qu'${Ga.il} ${Ga.v("sorte", "sortent")} ?`, a: V.rep("v_peur", [t.detenu ? V.pk("pe", [`Oui. S'${Ga.il} ${Ga.v("sort", "sortent")}, je déménage.`, `Tous les jours. Je regarde derrière moi en sortant du métro, alors qu'${Ga.il} ${Ga.est} en prison.`]) : V.pk("pe", [`${Ga.Il} ${Ga.est} dehors. Je ${Ga.le} croise parfois. Je ne dors plus.`, `${Ga.Il} ${Ga.est} déjà dehors. Je change de trottoir quand je vois quelqu'un qui ${Ga.lui} ressemble.`])], { intro: false }), cost: 2 },
      { id: "v_promesse", q: `Ne vous inquiétez pas, ${Ga.il} ${Ga.v("prendra", "prendront")} le maximum.`, a: V.rep("v_prom", [V.pk("pm", ["Je ne demande pas ça. Je veux qu'on reconnaisse ce qui s'est passé.", "Le maximum… Ça ne me rendra rien. Je veux qu'on dise la vérité."])], { intro: false, reac: false }), cost: 1, tag: "bad", fx: { flags: { promesse: true } } },
    ].concat(PR.qx(V, N.qV, "v_x", 2, { differe: true }));
    if (!proc && lignes.length > 2) topics.splice(1, 0, { id: "v_detail", q: "Il y a autre chose que vous voulez que je sache ?", a: V.rep("v_det", lignes.slice(2, 4), { intro: false }), cost: 2 });
    return { opening: [opening], topics, close: V.oral(V.pk("clo", ["Qu'est-ce qu'on fait, maître ?", "Et maintenant, il se passe quoi ?"])), impatient: PR.impatient(V), hangup: PR.hangup(V) };
  };
  PR.parloir = function (x, o) {
    const { t, N, A } = x;
    const V = PR.voix(t, A, "detenu");
    const G = V.G;
    const r = CR.seeded(t.sig + ":parloir:" + (o.n || 0));
    const prox = PR.proche(A);
    const opening = `${G.nom} s'assoit en face de vous. « ${pk(r, ["Enfin.", "Vous avez lu le dossier ?", `${cap(prox.ma)} vous a donné les papiers ?`, "Ça fait trois semaines que j'attends."])} »`;
    const topics = [
      { id: "j_dossier", q: "Je vous explique ce qu'il y a dans le dossier.", a: [`(${G.Il} écoute sans rien dire, puis secoue la tête.)`].concat(V.rep("j_dos", [N.version[t.stance]], { intro: false, reac: { colere: ["Ils ont tout écrit de travers."], abattu: ["Je ne sais plus quoi dire."] } })), cost: 10, tag: "good", fx: { trust: 4 } },
      { id: "j_prep", q: "Préparons l'interrogatoire : ce que dit le dossier, ce que vous devez expliquer.", a: V.rep("j_prep", [pk(r, ["D'accord. Je ferai comme vous dites.", "D'accord. Vous me dites quoi répondre, et je réponds.", "OK. On reprend tout depuis le début, alors."])], { intro: false, reac: false }), cost: 15, tag: "good", fx: { flags: { prepInterro: true }, trust: 3 } },
      { id: "j_cond", q: "Comment se passe la détention ?", a: V.rep("j_cond", [pk(r, ["Cellule à trois, des cafards, des cris toute la nuit.", "Je travaille aux cuisines. Ça passe le temps.", "On m'appelle par ce que j'ai fait. Je ne sors plus en promenade.", "Je dors mal. Je pense à ma famille tout le temps."])], { intro: false }), cost: 4, fx: { trust: 2 } },
      { id: "j_attest", q: "Qui peut vous héberger si vous sortez ?", a: V.rep("j_att", [{ t: A.heberg ? pk(r, [`${cap(prox.ma)}, ${A.adresse}.`, `Chez ${prox.ma}. ${A.adresse}.`]) : "Ma cousine, peut-être. Il faut lui demander.", f: "G_heberg" }], { intro: false, reac: false }), cost: 3, tag: "good" },
      { id: "j_promesse", q: "Je vous sortirai d'ici avant la fin du mois.", a: V.rep("j_prom", [pk(r, ["Vous êtes sûr ?", "Vous me le promettez ?", "Vous dites ça à tout le monde, non ?"])], { intro: false, reac: false }), cost: 1, tag: "bad", fx: { flags: { promesseSortie: true } } },
    ];
    return { opening: [opening], topics, close: V.oral(pk(r, ["« Revenez vite, maître. »", "« Vous revenez quand ? »", "« Dites à ma famille que ça va. »"])) };
  };

  // ================================================================== PHASE 3 : LES PERSONNAGES AUTONOMES
  // Tout ce que disent le client qui ment, la famille, le journaliste, le substitut qui négocie, le confrère d'en face,
  // le témoin cité au dernier moment. Les accords suivent la personne qui parle (V.G) et celles dont on parle.
  const VIE = (PR.vie = {});
  const PIECE = { video: "les images de vidéoprotection", temoin: "le témoignage recueilli", telephonie: "le bornage de votre téléphone", adn: "la trace ADN", ethylo: "la mesure de l'éthylomètre", labo: "l'analyse du laboratoire", releve: "les relevés bancaires", ecrits: "vos messages", saisie: "le procès-verbal de perquisition", casier: "le bulletin n° 1 du casier judiciaire", certificat: "le certificat médical", fichier: "le fichier des permis" };
  VIE.PIECE = PIECE;
  // Le client (ou son représentant) : sa voix de rendez-vous
  const voixClient = (t, role) => { const C = t[t.client] || t.A; return PR.voix(t, C, role || (t.client === "A" ? "prevenu" : t.P && t.client === "P" ? "proche" : "victime")); };
  // 1. La version mensongère, dite au premier entretien
  VIE.mensonge = function (t, m) {
    const V = voixClient(t);
    const G = V.G;
    const Gv = PR.gram(t.V);
    const L = {
      absent: [`Moi ? Je n'étais même pas là. J'étais chez moi, ce soir-là. Demandez à ${PR.proche(t.A).ma}.`, "Je n'y étais pas. Je vous le jure : je n'étais pas dans le quartier.", "Ce n'est pas moi. Ils se trompent de personne, je n'étais pas là."],
      volant: ["Ce n'est pas moi qui conduisais. C'était un ami, il avait ma voiture.", "Je n'étais pas au volant. J'avais prêté la voiture, ce jour-là."],
      pas_bu: [t.inf === "stups_volant" ? "Je n'avais rien pris. Rien. Peut-être la veille, et encore." : "J'avais bu un verre. Un seul, au repas.", t.inf === "stups_volant" ? "Rien fumé, rien pris. Leur test ne vaut rien." : "Un verre de vin, c'est tout. Je n'étais pas ivre."],
      jamais_touche: ["Cet argent, je n'y ai jamais touché. Je ne sais même pas de quoi ils parlent.", "Je n'ai rien fait avec ce compte. On a dû utiliser mon nom.", "Ce n'est pas moi. Je n'ai jamais rien eu entre les mains."],
      pas_frappe: [`Je ne ${Gv.le} ai pas touché${Gv.e}. Pas une fois. On s'est disputés, c'est tout.`, `Je ne ${Gv.le} ai jamais frappé${Gv.e}. ${Gv.Il} est tombé${Gv.e} tout${Gv.e} seul${Gv.e}.`],
      pas_casier: ["Je n'ai jamais eu affaire à la justice. Jamais.", "Rien. Casier vierge, je vous assure."],
      provocation: [`Je n'ai rien fait, rien dit. ${PR.gram(PR.auteur(t)).Il} s'est jeté${PR.gram(PR.auteur(t)).e} sur moi sans raison.`, "Je passais, c'est tout. Je n'ai rien dit, rien provoqué."],
      prejudice: ["Et l'argent… j'ai perdu au moins le double de ce qu'ils disent. Peut-être plus.", "Ce qu'on m'a pris, ça vaut bien plus que ce qui est écrit. J'ai tout perdu."],
    }[m.k] || ["Ce n'est pas ce qui s'est passé."];
    return V.oral(V.pk("ment:" + m.k, L));
  };
  // Des aveux faits en garde à vue, puis contestés
  VIE.retractation = function (t) {
    const V = voixClient(t, "prevenu");
    return V.oral(V.pk("retract", ["Ce que j'ai dit en garde à vue, c'était pour sortir. Je n'ai rien fait.", "J'ai signé ce qu'ils voulaient. J'étais épuisé" + V.e + ". Ce n'est pas vrai.", "Les aveux ? On m'a dit que si je reconnaissais, je rentrais chez moi. Alors j'ai dit oui."]));
  };
  // 2. La confrontation à la pièce qui contredit la version
  VIE.confrontation = function (t, m, o = {}) {
    const C = t[t.client] || t.A;
    const V = voixClient(t);
    const G = V.G;
    const piece = PIECE[m.preuve] || "cette pièce";
    const issue = m.issue;
    const aveu = {
      absent: "Bon… J'étais là. J'avais peur. Je ne voulais pas que ma famille l'apprenne.", volant: "C'était moi qui conduisais. Je pensais qu'on ne pourrait pas le prouver.", pas_bu: "D'accord. J'avais bu plus que ça. Je ne voulais pas le dire devant vous.",
      jamais_touche: "Oui. J'ai utilisé cet argent. Je comptais le rendre.", pas_frappe: "Je l'ai poussé" + PR.gram(t.V).e + ". Fort. Je ne voulais pas que vous pensiez que je suis violent" + G.e + ".", pas_casier: `J'ai été condamné${G.e}, oui. Une fois. J'avais honte de vous le dire.`,
      provocation: "C'est vrai, j'ai crié la première. Je l'ai insulté. Mais ça ne lui donnait pas le droit.", prejudice: "Je me suis emporté" + G.e + ". Le vrai montant est sur les relevés de la banque.",
    }[m.k] || "Bon. Ce n'est pas tout à fait ce que je vous ai dit.";
    const tient = { absent: "La vidéo est floue. Ça peut être n'importe qui.", volant: "Un ami me ressemble. Ils ont pu confondre.", pas_bu: "Leur appareil, il est mal réglé. Tout le monde le dit.", jamais_touche: "Quelqu'un a pu se servir de mes codes.", pas_frappe: "Le médecin écrit ce qu'on lui dit.", pas_casier: C.age >= 26 ? "C'était il y a longtemps. Ça ne compte plus, non ?" : "C'était trois fois rien. Ça ne compte pas, non ?", provocation: "Le témoin ment. Il ne m'aime pas.", prejudice: "La banque n'a pas tout. J'avais du liquide." }[m.k] || "Je maintiens ce que je vous ai dit.";
    const opening = V.oral(V.pk("conf:ouv", [`${G.nom} s'assoit en face de vous. Vous posez ${piece} sur le bureau, sans un mot.`, `${G.nom} regarde la pièce que vous venez de sortir du dossier : ${piece}.`]));
    const topics = [
      { id: "vc_montrer", q: `Expliquez-moi ${piece} : cette pièce ne dit pas la même chose que vous.`, a: V.rep("vc1", [issue === "aveu" ? { t: aveu, f: "G_vie_aveu" } : { t: tient, f: "G_vie_maintient" }], { kind: "sensible", reac: { colere: ["Vous êtes de quel côté, vous ?"], abattu: ["(Un long silence.)"], anxieux: ["Ça change quoi, pour moi ?"] } }), cost: 6, tag: "good", fx: { flags: { vieConfronte: true } } },
      { id: "vc_regle", q: "Je ne plaiderai pas une version que le dossier contredit. Je peux plaider le doute, pas un mensonge.", a: V.rep("vc2", [issue === "aveu" ? "D'accord. On dit la vérité, alors. Ce sera mieux devant le juge." : V.pk("vc2b", ["Alors plaidez le doute. Moi, je maintiens.", "Je comprends. Mais je ne changerai pas ce que j'ai dit."])], { intro: false, reac: false }), cost: 3, tag: "good", fx: { trust: issue === "aveu" ? 3 : -2, flags: { vieRegle: true } } },
      { id: "vc_couvrir", q: "On garde votre version, je trouverai quelque chose pour la pièce.", a: V.rep("vc3", [V.pk("vc3b", ["Merci, maître. Je savais que je pouvais compter sur vous.", "Voilà. Vous, vous me croyez."])], { intro: false, reac: false }), cost: 1, tag: "bad", fx: { flags: { vieCouvre: true } } },
    ];
    return { label: `Entretien — ${piece}`, kind: "meet", scene: "conference", opening: [opening], topics, close: V.oral(issue === "aveu" ? "Et maintenant, qu'est-ce qui va se passer ?" : "On fait comme ça, alors ?"), impatient: PR.impatient(V), hangup: PR.hangup(V), start: topics.map((x) => x.id) };
  };
  // À l'audience : le président oppose la pièce au prévenu qui n'a pas été préparé
  VIE.presidentConfronte = (t, m, presId) => { const G = PR.gram(t[t.client] || t.A); return `${G.Civ} ${(t[t.client] || t.A).nom}, vous nous dites une chose ; ${PIECE[m.preuve] || "le dossier"} en dit une autre. Qui faut-il croire ?`; };
  VIE.reponseAudience = function (t, m, presId) { const V = voixClient(t); return V.oral(V.pk("aud:ment", ["Je… je ne sais pas. Je maintiens.", `Ce n'est pas comme ça que ça s'est passé, ${PR.presidence(presId)}.`, "(Silence.) Je ne sais plus."])); };
  VIE.aveuAudience = function (t, m) { const V = voixClient(t); return V.oral(V.pk("aud:aveu", ["Je veux dire quelque chose. Au début, j'ai menti. Je m'en excuse.", "Je dois la vérité au tribunal : je n'ai pas tout dit au départ."])); };
  // 3. Absences, silences, impayés, menaces de partir, second avocat
  VIE.absentRdv = function (t) { const V = voixClient(t); return V.oral(V.pk("absrdv", [`Maître, c'est ${V.P.prenom} ${V.P.nom}. Pardon pour le rendez-vous, je n'ai pas pu venir. Un problème au travail. On peut refaire demain ?`, `Bonjour, ${V.P.prenom} ${V.P.nom}. Je suis désolé${V.e}, j'ai complètement oublié le rendez-vous. Rappelez-moi, s'il vous plaît.`, `C'est ${V.P.prenom}. Je n'ai pas osé venir. Je vous rappelle.`])); };
  VIE.absentAudience = function (t) { const V = voixClient(t); return V.oral(V.pk("absaud", ["Maître, je ne pourrai pas venir demain. Je suis malade, j'ai un certificat. Vous pouvez faire sans moi ?", "Maître, pour demain… je ne viendrai pas. Je n'y arrive pas. Pardon."])); };
  VIE.injoignable = function (t) { const C = t[t.client] || t.A; return `Le numéro de ${C.prenom} ${C.nom} sonne dans le vide ; la messagerie est pleine.`; };
  VIE.retourSilence = function (t) { const V = voixClient(t); return V.oral(V.pk("retour", ["Maître ? Pardon, j'avais changé de téléphone. Il y a du nouveau ?", "C'est moi. J'ai eu une période difficile, je ne répondais à personne. On en est où ?", "Désolé" + V.e + ", j'étais chez de la famille, sans réseau. Vous m'avez appelé ?"])); };
  VIE.impaye = function (t) { const V = voixClient(t); return V.oral(V.pk("impaye", ["Pour l'argent, maître… je ne peux pas en ce moment. Je vous paierai plus tard, promis.", "Le chèque ? Je vais voir avec la banque. Il y a sûrement une erreur.", "Je n'ai pas encore été payé" + V.e + ". Le mois prochain, sans faute."])); };
  VIE.menace = function (t) {
    const V = voixClient(t);
    const opening = V.oral(V.pk("men", ["Maître, je vais être franc. Un ami m'a parlé d'un autre avocat. Il dit que vous ne faites rien.", "Je n'ai pas de nouvelles. Je me demande si je ne vais pas prendre quelqu'un d'autre.", "Mon cousin connaît un avocat qui gagne tout. Je me pose des questions."]));
    const topics = [
      { id: "vm_point", q: "Je vous explique ce que j'ai fait et ce qui vient ensuite.", a: V.rep("vm1", [V.pk("vm1b", ["D'accord. Je ne savais pas tout ça.", "Bon. Si vous m'expliquez, ça va.", "Ah. Je ne pensais pas qu'il y avait autant de travail."])], { intro: false, reac: false }), cost: 8, tag: "good", fx: { trust: 10, flags: { vieRassure: true } } },
      { id: "vm_libre", q: "Vous êtes libre de choisir votre avocat. Si vous changez, je transmettrai le dossier à mon confrère.", a: V.rep("vm2", [V.pk("vm2b", ["Non, non… je voulais juste être rassuré" + V.e + ".", "Je vais réfléchir."])], { intro: false, reac: false }), cost: 3, tag: "neutral", fx: { trust: 2 } },
      { id: "vm_promesse", q: "Ne vous inquiétez pas : avec moi, c'est gagné.", a: V.rep("vm3", ["Vous me le promettez ?"], { intro: false, reac: false }), cost: 1, tag: "bad", fx: { trust: 4, flags: { promesse: true } } },
    ];
    return { label: "Le client hésite à changer d'avocat", kind: "call", opening: [opening], topics, close: V.oral("Bon. On continue, alors."), impatient: PR.impatient(V), hangup: PR.hangup(V), start: topics.map((x) => x.id) };
  };
  VIE.second = function (t, nomConfrere, gConfrere) { const C = t[t.client] || t.A; const G = PR.gram(C); return [`Mon cher confrère, je vous informe que ${G.civ} ${C.prenom} ${C.nom} m'a consulté${gConfrere === "f" ? "e" : ""} hier et m'a demandé d'intervenir à ses côtés dans le dossier que vous suivez.`, `${G.Il} m'indique ne pas vous en avoir parlé. Je vous propose que nous fassions le point, dans l'intérêt de notre client commun. Bien confraternellement, ${nomConfrere}.`]; };
  VIE.secondClient = function (t) {
    const V = voixClient(t);
    const topics = [
      { id: "vs_deux", q: "Vous avez consulté un autre avocat sans me prévenir. Que voulez-vous ?", a: V.rep("vs1", [V.pk("vs1b", ["Je voulais un deuxième avis. Je ne savais pas que ça se faisait pas.", "C'est ma famille qui a insisté. Moi, je veux rester avec vous."])], { kind: "sensible" }), cost: 5, tag: "good", fx: { flags: { vieSecondExplique: true } } },
      { id: "vs_choix", q: "Deux avocats peuvent travailler ensemble, si vous le voulez et si c'est clair. Sinon, choisissez.", a: V.rep("vs2", [V.pk("vs2b", ["Je reste avec vous. Je lui dirai.", "On peut garder les deux ? Ma mère paie l'autre."])], { intro: false, reac: false }), cost: 4, tag: "good", fx: { trust: 4, flags: { vieSecondRegle: true } } },
      { id: "vs_partir", q: "Puisque c'est comme ça, je me retire.", a: V.rep("vs3", ["Ah… bon. Comme vous voulez."], { intro: false, reac: false }), cost: 1, tag: "bad", fx: { flags: { vieSecondRupture: true } } },
    ];
    return { label: "Le client a pris un second avocat", kind: "call", opening: [V.oral(V.pk("vs0", ["Allô, maître ? On m'a dit que vous vouliez me parler.", "Oui, maître ? C'est au sujet de l'autre avocat, c'est ça ?"]))], topics, close: V.oral("D'accord. Merci, maître."), start: topics.map((x) => x.id) };
  };
  // 4. La famille : elle paie, veut savoir, pousse une stratégie
  VIE.famille = function (t, fam, o = {}) {
    const C = t[t.client] || t.A;
    const Gc = PR.gram(C);
    const F = Object.assign({ metier: "", age: fam.age }, fam);
    const V = PR.voix(t, F, "famille");
    const G = V.G;
    const qui = `${G.civ} ${fam.prenom} ${fam.nom}, ${fam.rel === "épouse" || fam.rel === "mari" ? `${fam.rel === "épouse" ? "l'épouse" : "le mari"} de ${C.prenom}` : `${/^(mère|sœur|tante)$/.test(fam.rel) ? "la" : "le"} ${fam.rel} de ${C.prenom}`}`;
    const pousse = {
      nier: `Il faut qu'${Gc.il} nie tout. Tout. Sinon ${Gc.il} est fini${Gc.e}.`, avouer: `Qu'${Gc.il} reconnaisse tout. Qu'on en finisse, la famille n'en peut plus.`,
      complice: `Ce n'est pas ${Gc.soi}, c'est son copain. ${Gc.Il} doit le dire, qu'${Gc.il} le dénonce !`, renvoi: "Demandez un renvoi, gagnez du temps. On a besoin de temps pour réunir l'argent.",
      vengeance: `Je veux qu'${PR.gram(PR.auteur(t)).il} prenne le maximum. Le maximum, vous m'entendez ?`, presse: "J'ai appelé un journaliste. Il faut que tout le monde sache ce qui est arrivé.", argent: "Combien on peut obtenir ? Il faut demander beaucoup, ils ont de l'argent.",
    }[fam.pousse] || "Il faut faire quelque chose.";
    const opening = V.oral(V.pk("fam:ouv", [`${qui}. « Maître, je suis ${fam.paie ? `${G.celui} qui vous paie` : "de la famille"}. J'ai le droit de savoir ce qui se passe. »`, `${qui}. « Bonjour, maître. ${fam.paie ? "C'est moi qui règle vos honoraires. " : ""}Qu'est-ce qu'${Gc.il} vous a dit ? »`]));
    const topics = [
      { id: "vf_secret", q: `Ce que ${C.prenom} me dit est couvert par le secret professionnel. Je ne peux rien vous en dire sans son accord.`, a: V.rep("vf1", [fam.paie ? V.pk("vf1b", ["Mais c'est moi qui paie !", "Je paie et je n'ai le droit de rien savoir ?"]) : V.pk("vf1c", ["Même pas à sa famille ?", "Ah. Je ne savais pas."])].concat(fam.paie ? [V.pk("vf1d", ["On verra si je continue à payer, alors.", "Bon. Je vais réfléchir."])] : []), { kind: "sensible", reac: false }), cost: 3, tag: "good", fx: { flags: { vieSecretTenu: true } } },
      { id: "vf_general", q: "Je peux vous expliquer comment se passe la procédure, en général : les étapes, les délais.", a: V.rep("vf2", [V.pk("vf2b", ["D'accord. Expliquez-moi, au moins ça.", "Merci. On ne comprend rien, nous."])], { intro: false, reac: false }), cost: 5, tag: "good", fx: { flags: { vieFamilleGeneral: true } } },
      { id: "vf_pousse", q: "Qu'attendez-vous de moi ?", a: V.rep("vf3", [pousse], { kind: "sensible" }), cost: 3, fx: { flags: { vieFamillePousse: true } } },
      { id: "vf_decide", q: `C'est ${C.prenom} qui décide de sa défense, avec moi. Personne d'autre.`, a: V.rep("vf4", [V.pk("vf4b", ["On verra bien.", "Je vous préviens, je ne lâcherai pas.", "Bon. Si c'est la loi…"])], { intro: false, reac: false }), cost: 2, tag: "good", fx: { flags: { vieStrategieTenue: true } } },
      { id: "vf_confie", q: `Entre nous : ${C.prenom} m'a dit des choses que le dossier ne contient pas.`, a: V.rep("vf5", [V.pk("vf5b", ["Quoi ? Dites-moi tout.", "Je le savais. Racontez-moi."])], { intro: false, reac: false }), cost: 2, tag: "bad", fx: { flags: { vieSecretViole: true } } },
    ];
    return { label: `Appel de ${G.civ} ${fam.prenom} ${fam.nom}`, kind: "call", who: { nom: `${fam.prenom} ${fam.nom}` }, opening: [opening], topics, close: V.oral(V.pk("fam:clo", ["Tenez-moi au courant, au moins.", "Bon. Au revoir, maître."])), impatient: PR.impatient(V), hangup: PR.hangup(V), start: topics.map((x) => x.id) };
  };
  // 5. La presse
  VIE.presse = function (t, o) {
    const C = t[t.client] || t.A;
    const J = { prenom: o.prenom, nom: o.nom, g: o.g, age: 36, metier: "journaliste" };
    const V = PR.voix(t, J, "bavard", { humeur: "bavard" });
    const G = V.G;
    const opening = `${G.civ} ${J.prenom} ${J.nom}, ${o.journal}. « Maître, bonjour. J'écris un papier sur l'affaire ${C.nom}. Vous avez deux minutes ? »`;
    const topics = [
      { id: "vp_rien", q: "Pas de commentaire. Je réserve mes explications au tribunal.", a: [`« Dommage. J'écrirai sans votre version, alors. »`], cost: 1, tag: "good", ends: true, fx: { flags: { viePresse: "rien" } } },
      { id: "vp_mesure", q: `${PR.gram(C).Client} conteste les faits qui lui sont reprochés et est présumé${PR.gram(C).e} innocent${PR.gram(C).e}. Je n'en dirai pas plus.`.replace("conteste les faits qui lui sont reprochés et est présumé" + PR.gram(C).e + " innocent" + PR.gram(C).e, t.client === "A" || t.client === "R" ? "conteste les faits qui lui sont reprochés et est présumé" + PR.gram(C).e + " innocent" + PR.gram(C).e : "attend que la justice reconnaisse ce qu'" + PR.gram(C).il + " a subi"), a: [`« C'est noté. Merci, maître. »`], cost: 2, tag: "good", ends: true, fx: { flags: { viePresse: "mesure" } } },
      { id: "vp_details", q: "Je vais vous dire ce qu'il y a vraiment dans le dossier.", a: [`« Je vous écoute. Je ne citerai pas mes sources. »`], cost: 4, tag: "bad", ends: true, fx: { flags: { viePresse: "details" } } },
    ];
    return { label: `Appel de ${o.journal}`, kind: "call", who: { nom: `${J.prenom} ${J.nom} (${o.journal})` }, opening: [opening], topics, close: "« Au revoir, maître. »", start: topics.map((x) => x.id) };
  };
  VIE.article = function (t, o) {
    const C = t[t.client] || t.A;
    const lieu = CR.MONDE.lieuxDe(t).F.nom;
    const titre = { rien: `${lieu} : l'affaire ${C.nom} devant la justice`, mesure: `Affaire ${C.nom} : la défense appelle à la prudence`, details: `Affaire ${C.nom} : ce que contient le dossier`, aucun: `${lieu} : une affaire qui fait parler` }[o.choix || "aucun"];
    const corps = { rien: "L'avocat n'a pas souhaité s'exprimer. Selon nos informations, l'enquête s'appuie sur plusieurs éléments matériels.", mesure: "Son avocat rappelle la présomption d'innocence et réserve ses explications au tribunal.", details: "Selon une source proche du dossier, plusieurs pièces de la procédure seraient accablantes ; nous avons pu en connaître le détail.", aucun: "Le quartier est sous le choc. Les voisins décrivent une personne discrète." }[o.choix || "aucun"];
    return { titre, corps: `${corps} L'audience est attendue dans les prochaines semaines.` };
  };
  // 6. Le parquet qui négocie : CRPC, composition pénale
  VIE.parquet = function (t, o) {
    const pq = CR.acteur(t.parquet) || { nom: "Le substitut", look: { g: "f" } };
    const P = { prenom: pq.nom.split(" ")[1] || "", nom: pq.nom.split(" ").slice(2).join(" "), g: pq.look && pq.look.g === "f" ? "f" : "m", age: 42, metier: "magistrat" };
    const V = PR.voix(t, P, "permanence");
    const C = t[t.client] || t.A;
    const Gc = PR.gram(C);
    const opening = `${pq.nom}, ${o.compo ? "délégation du procureur" : "parquet"}. « Maître, vous avez reçu ma proposition. Je vous écoute. »`;
    const topics = [
      { id: "vq_garanties", q: `${Gc.Client} travaille, a un domicile stable : une peine plus légère suffit.`, a: [V.pk("vq1", ["Je peux faire un effort sur la durée. Envoyez-moi les justificatifs.", "D'accord, si c'est justifié. Je regarde."])], cost: 4, tag: "good", fx: { vars: { vieNegoArg: 1 } } },
      { id: "vq_casier", q: `Le casier ${C.casier ? "est ancien et sans rapport" : "est vierge"} : c'est un premier faux pas.`, a: [C.casier && t.rec ? "Le casier dit le contraire, maître. Je ne bougerai pas." : V.pk("vq2", ["C'est un argument. Je le retiens.", "Je l'ai vu, oui."])], cost: 3, tag: C.casier && t.rec ? "bad" : "good", fx: { vars: { vieNegoArg: C.casier && t.rec ? 0 : 1 } } },
      { id: "vq_indemn", q: `${Gc.Client} est prêt${Gc.e} à indemniser la victime.`, a: [t.V && !t.V.agent ? "Ça compte. Mettez-le par écrit." : "Il n'y a pas de victime à indemniser dans ce dossier, maître."], cost: 3, tag: t.V && !t.V.agent ? "good" : "neutral", fx: { vars: { vieNegoArg: t.V && !t.V.agent ? 1 : 0 } } },
      { id: "vq_menace", q: "Si vous ne baissez pas, je plaiderai la relaxe et vous perdrez.", a: ["Plaidez, maître. Ma proposition tient jusqu'à la fin de la semaine, pas au-delà."], cost: 1, tag: "bad", fx: { vars: { vieNegoArg: -1 } } },
    ];
    return { label: `Négociation avec ${pq.nom}`, kind: "call", who: { nom: pq.nom }, opening: [opening], topics, close: "« Je vous fais connaître ma position. »", start: topics.map((x) => x.id) };
  };
  // 7. Le témoin cité au dernier moment, à l'audience
  VIE.temoin = function (t) {
    const T = t.T;
    const V = PR.voix(t, T, "victime", { humeur: "calme" });
    const Ga = PR.gram(PR.auteur(t));
    return V.oral(V.pk("tem", [`J'étais là. J'ai vu ${t.client === "V" || t.client === "P" ? Ga.le + " frapper" : "une partie de la scène"}. Il faisait sombre, mais j'ai bien vu.`, "Je passais. J'ai entendu des cris, je me suis retourné" + V.e + ". Je ne suis pas sûr" + V.e + " de tout.", "Je connais un peu les deux. J'ai vu le début, pas la fin."]));
  };
  VIE.temoinReponse = function (t) { const V = PR.voix(t, t.T, "victime", { humeur: "calme" }); return V.oral(V.pk("temr", ["À une vingtaine de mètres. Il faisait nuit, c'est vrai.", "De loin. Et j'avais mon casque sur les oreilles, au début.", "Pas très près, non. Je n'ai pas tout vu."])); };
  // 8. Le confrère d'en face
  VIE.adverse = function (t, adv, quand) {
    const a = CR.acteur(adv.id) || { nom: "Le confrère" };
    const C = t[t.client] || t.A;
    const L = {
      conciliant: { mail: [`Mon cher confrère, dans l'intérêt de nos clients, je vous propose de rechercher un accord sur l'indemnisation avant l'audience. Bien confraternellement, ${a.nom}.`], audience: "Je m'en rapporte à la sagesse du tribunal sur la peine ; je me contenterai de l'indemnisation." },
      agressif: { mail: [`Mon cher confrère, votre client devra répondre de ses actes. Je n'accepterai aucune manœuvre dilatoire. ${a.nom}.`], audience: `Le tribunal ne sera pas dupe des larmes de ${C.prenom} ${C.nom} ! Ce dossier est accablant, et la défense le sait.` },
      procedurier: { mail: [`Mon cher confrère, je vous communique ce jour mes conclusions, que je déposerai à l'audience. Bien confraternellement, ${a.nom}.`], audience: "Je dépose ce matin des conclusions et onze pièces nouvelles, que je communique à mon confrère à l'instant." },
      absent: { mail: [`Mon cher confrère, je suis retenu par une autre audience le jour fixé. Je solliciterai un renvoi ; m'y suis-je opposé lors de vos propres demandes ? ${a.nom}.`], audience: "(Le banc de l'avocat adverse est vide. La greffière fait savoir qu'il a demandé un renvoi par courriel ce matin.)" },
    }[adv.style];
    return L ? L[quand] : null;
  };
  // 9. La personne qui revient : « Vous vous souvenez de moi ? »
  // kind : « recidive » (l'ancien client revient), « v2a » (l'ancienne victime est poursuivie), « a2v » (l'ancien prévenu est victime)
  VIE.revenant = function (t, kind) {
    const P = kind === "a2v" ? t.V : t.A;
    const V = PR.voix(t, P, kind === "a2v" ? "victime" : "prevenu");
    const L = {
      recidive: ["Vous vous souvenez de moi ? Vous m'aviez défendu" + V.e + ". Je suis encore dans les ennuis.", "C'est encore moi, maître. Je sais. Je n'aurais pas dû.", "Bonjour, maître. On s'est déjà vus… Je vous avais promis qu'on ne me reverrait pas."],
      v2a: ["La dernière fois, j'étais de l'autre côté. Victime. Et là, c'est moi qu'on accuse.", "Vous ne me reconnaissez pas ? J'étais partie civile, il y a quelques mois. Aujourd'hui, c'est moi qu'on poursuit.".replace("partie civile", "la victime")],
      a2v: ["Vous vous souvenez de moi ? La dernière fois, c'est moi qui étais au tribunal. Cette fois, c'est moi la victime.", "On s'est déjà vus, maître. Les choses ont changé : cette fois, c'est moi qui porte plainte."],
    }[kind] || ["On s'est déjà vus, maître."];
    return V.oral(V.pk("rev:" + kind, L));
  };
  // 10. La lettre de refus, la transmission à un confrère, la permanence refusée : ce que répondent les autres
  VIE.refus = function (t) { const V = voixClient(t); return V.oral(V.pk("refus", ["Ah. Bon. Je vais chercher quelqu'un d'autre, alors.", "Vous ne pouvez pas ? Tant pis. Vous connaissez quelqu'un ?", "D'accord. Merci de m'avoir répondu vite, au moins."])); };
  VIE.transmis = function (t, nom) { const V = voixClient(t); return V.oral(V.pk("transmis", [`${nom} ? D'accord. Je l'appelle aujourd'hui. Merci, maître.`, `Merci de m'avoir orienté${V.e}. J'appelle ${nom} tout de suite.`])); };

  // Les répliques d'audience qui dépendent des personnes
  PR.audience = {
    menteur: (x, presId) => { const Ga = PR.gram(PR.auteur(x.t)); return `${Ga.v(Ga.f ? "Cette femme est une menteuse" : "Cet homme est un menteur", Ga.f ? "Ces femmes sont des menteuses" : "Ces hommes sont des menteurs")}, ${PR.presidence(presId)}, depuis le début ${Ga.il}…`; },
    victime: (x, decede) => {
      const { t, N } = x;
      const l = (N.victime || N.proche || [])[0];
      if (l) return l;
      const C = t[t.client] || t.V;
      const Gv = PR.gram(t.V);
      return decede ? `${cap(C.dit || t.V.prenom)}… ${Gv.Il} avait ${t.V.age} ans. Je voudrais que la cour sache qui ${Gv.il} était.` : "Je veux juste qu'on reconnaisse ce qui m'est arrivé.";
    },
    tuee: (x) => { const Ga = PR.gram(PR.auteur(x.t)); const Gv = PR.gram(x.t.V); return `Je voudrais juste qu'${Ga.il} ${Ga.v("sache", "sachent")} qui était ${Gv.w("l'homme", "la femme")} qu'${Ga.il} ${Ga.a} tué${Gv.e}.`; },
  };
})();
