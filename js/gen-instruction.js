/* La Permanence — moteur génératif, phase 2 : les crimes et l'information judiciaire (genre « info »).
   Tirage (GEN2.tirerInfo) et contrôle (GEN2.verifierInfo) d'une affaire criminelle, à partir du même catalogue (CR.CAT) ;
   puis la définition de l'affaire (B.info) : réquisitoire introductif, juge d'instruction, interrogatoire de première comparution
   (mise en examen ou témoin assisté), débat devant le juge des libertés et de la détention, détention provisoire et ses délais,
   demandes de mise en liberté, appel devant la chambre de l'instruction, expertises et contre-expertises, interrogatoires,
   confrontations, demandes d'actes, requête en nullité, avis de fin d'information, règlement (non-lieu, irresponsabilité pénale,
   mise en accusation, requalification en délit et renvoi), réunion préparatoire, procès devant la cour criminelle
   départementale, la cour d'assises (avec jury), la cour d'assises spécialement composée, le tribunal pour enfants ou la cour
   d'assises des mineurs, huis clos, partie civile, appel. Le joueur défend le mis en examen, ou assiste la victime.
   Chaque date de l'information est fixée au tirage (t.plan) : les délais se vérifient (tests/tgen.js). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const CAT = CR.CAT;
  const GEN2 = CR.GEN2;
  const M = CR.MONDE;
  const B = GEN2.B;
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const ch = (r, p) => r() < p;
  const D = (d) => CR.fmtDate(d, "long");
  const hm = (m) => CR.fmtTime(((Math.round(m) % 1440) + 1440) % 1440);

  // ------------------------------------------------------------------ Acteurs propres à l'information et aux cours criminelles
  const NOUVEAUX = [
    { id: "ji_kessler", nom: "Mme Judith Kessler", role: "ji", profil: "severe", lieu: "Juge d'instruction, pôle criminel", look: { g: "f", skin: 0, hair: "bob", hc: "auburn", glasses: 1, age: 51 }, blurb: "Vingt ans d'instruction criminelle. Rejette les demandes d'actes qu'elle juge dilatoires." },
    { id: "ji_mineurs", nom: "M. Samuel Ortega", role: "ji", profil: "conciliant", lieu: "Juge d'instruction chargé des affaires de mineurs", look: { g: "m", skin: 2, hair: "short", hc: "black", glasses: 0, age: 42 }, blurb: "Instruit les dossiers de mineurs ; attentif aux rapports éducatifs." },
    { id: "ji_jirs", nom: "Mme Corinne Lefranc", role: "ji", profil: "formaliste", lieu: "Juge d'instruction, juridiction interrégionale spécialisée", look: { g: "f", skin: 1, hair: "long", hc: "gray", glasses: 1, age: 55 }, blurb: "Criminalité organisée. Des dossiers de quarante tomes, lus en entier." },
    { id: "je_morin", nom: "Mme Valérie Morin", role: "president", profil: "conciliant", lieu: "Tribunal pour enfants", look: { g: "f", skin: 0, hair: "short", hc: "brown", glasses: 1, age: 49 }, blurb: "Juge des enfants. Parle au mineur avant de parler au dossier." },
    { id: "pr_cam", nom: "M. François Delaunay", role: "president", profil: "curieux", lieu: "Cour d'assises des mineurs", look: { g: "m", skin: 0, hair: "receding", hc: "gray", glasses: 1, age: 58 }, blurb: "Préside la cour d'assises des mineurs, entouré de deux juges des enfants." },
    { id: "pr_assises_spe", nom: "Mme Hélène Vasseur", role: "president", profil: "formaliste", lieu: "Cour d'assises spécialement composée", look: { g: "f", skin: 0, hair: "bun", hc: "gray", glasses: 1, age: 60 }, blurb: "Sept magistrats, pas de jurés : chaque écoute est discutée." },
    { id: "pr_assises_appel", nom: "M. Bertrand Lacombe", role: "president", profil: "severe", lieu: "Cour d'assises statuant en appel", look: { g: "m", skin: 1, hair: "side", hc: "white", glasses: 0, age: 63 }, blurb: "Préside les sessions d'appel. Neuf jurés, et une mémoire de tous les dossiers." },
    { id: "pq_criminel", nom: "Mme Sophie Daguerre", role: "parquet", profil: "severe_pq", lieu: "Substitut, section criminelle", look: { g: "f", skin: 1, hair: "long", hc: "dkbrown", glasses: 0, age: 40 }, blurb: "Suit les informations criminelles du parquet de Paris." },
  ];
  for (const a of NOUVEAUX) if (!CR.acteur(a.id)) CR.ACTEURS.push(a);
  // Les juridictions de jugement et d'appel (procedure.js en connaît déjà une partie)
  Object.assign(CR.PROC.JURIDICTIONS, {
    assises_mineurs: { label: "Cour d'assises des mineurs de Paris", lieu: "cite" },
    assises_spe: { label: "Cour d'assises de Paris spécialement composée", lieu: "cite" },
    assises_appel: { label: "Cour d'assises statuant en appel", lieu: "cite" },
    tpe: { label: "Tribunal pour enfants de Paris", lieu: "palais" },
    chmin: { label: "Chambre spéciale des mineurs, cour d'appel de Paris", lieu: "cite" },
  });
  const PRES = { ccd: "pr_ccd", assises: "pr_assises", assises_spe: "pr_assises_spe", assises_mineurs: "pr_cam", tpe: "je_morin", tc: "pr_dessaint" };
  const JUR_TITRE = { ccd: "Cour criminelle départementale de Paris", assises: "Cour d'assises de Paris", assises_spe: "Cour d'assises de Paris spécialement composée", assises_mineurs: "Cour d'assises des mineurs de Paris", tpe: "Tribunal pour enfants de Paris", tc: "Tribunal correctionnel de Paris, 16e chambre" };
  const JUR_APPEL = { ccd: "assises_appel", assises: "assises_appel", assises_spe: "assises_appel", assises_mineurs: "assises_appel", tpe: "chmin", tc: "chapp" };
  GEN2.PRES_INFO = PRES;

  // ------------------------------------------------------------------ Le genre « info » dans le moteur
  GEN2.GENRES.info = { camp: "mixte", fam: { crim_personnes: 38, crim_sexuel: 24, crim_biens: 28, crim_stups: 10 } };
  Object.assign(GEN2.FREQ, { meurtre: 3, assassinat: 1.4, tentative_meurtre: 3, vmsi: 2.4, viol: 4, agression_sexuelle: 2.2, vol_arme: 3, sequestration: 2.2, incendie_criminel: 2.2, trafic_bo: 1 });
  // Forces des preuves au délibéré (affaires criminelles)
  GEN2.FORCE_CRIM = { medical: 0.12, constat: 0.15, victime: 0.22, temoin: 0.2, video: 0.28, telephonie: 0.22, adn: 0.34, saisie: 0.22, balistique: 0.15, toxico: 0.15, expertise: 0.12, ecrits: 0.24, releve: 0.12, aveux: 0.3, interro: 0.12 };
  GEN2.LABEL_CRIM = { medical: "Les constatations médico-légales", constat: "Les constatations des enquêteurs", victime: "Les déclarations de la victime", temoin: "Les témoignages", video: "Les images", telephonie: "La téléphonie", adn: "L'expertise génétique", saisie: "Les saisies", balistique: "L'expertise balistique", toxico: "L'analyse toxicologique", expertise: "L'expertise technique", ecrits: "Les messages", releve: "Les flux financiers", aveux: "Les déclarations en garde à vue", interro: "Les déclarations devant le juge d'instruction" };
  const PIECE_PREUVE = { temoin: "temoin", telephonie: "telephonie", adn: "adn", video: "video", expertise: "expertise", ecrits: "ecrits", toxico: "toxico" };

  // Âge figé sur la personne tirée (naissance réécrite)
  const fixAge = (P, age) => { P.age = age; P.naissance = P.naissance.replace(/\d{4}/, String(2026 - age)); return P; };
  const fem = (P, m) => (P.g === "f" && M.METIERS_F[m]) || m;
  const metierAge = (r, age) => (age < 3 ? "nourrisson" : age < 11 ? "écolier" : age < 15 ? pk(r, ["collégien", "collégienne"]).replace(/ne$/, "") : pk(r, ["lycéen", "apprenti", "lycéen en CAP"]));

  // ------------------------------------------------------------------ Tirage d'une affaire criminelle
  GEN2.tirerInfo = function (r, day, o) {
    const G = GEN2.GENRES.info;
    const parFam = {};
    for (const id of CAT.ORDRE) {
      const I = CAT.INF[id];
      if (!I.info || !G.fam[I.fam]) continue;
      if (o && o.inf && o.inf !== id) continue;
      (parFam[I.fam] = parFam[I.fam] || {})[id] = GEN2.FREQ[id] || 1;
    }
    const fam = CAT.poids(r, Object.fromEntries(Object.keys(parFam).map((x) => [x, G.fam[x]])));
    if (!fam) return null;
    const inf = CAT.poids(r, parFam[fam]);
    const I = CAT.INF[inf];
    if (o && o.ctx && !I.ctxs[o.ctx]) return null;
    let f = I.tirer(r);
    if (o && o.ctx && f.ctx !== o.ctx) return null;
    const cx = I.ctxs[f.ctx];
    let q = CAT.qualifier(inf, f);
    if (!q) return null;
    // phase 3 : lieu des faits, domiciles et milieux, sur un fil de hasard à part (un mineur ou un trafic en bande organisée
    // restent à Paris : juridictions spécialisées)
    const r3 = CR.seeded(((o && o._graine) || "graine") + ":p3");
    const LX = M.tirerLieux(r3, { genre: "info", fam: I.fam, permanence: f.ageA != null || I.fam === "crim_stups" });
    // personnes
    const pers = cx.pers || {};
    const pa = pers.A || {};
    const A = M.personne(r, { g: pa.g, pf: pa.g ? undefined : 0.15, minAge: pa.min || 19, maxAge: Math.max(pa.min || 19, pa.max || 50), metier: pa.metier, lieu: LX.A.id, milieu: LX.milA });
    if (f.ageA != null) { fixAge(A, f.ageA); A.metier = fem(A, metierAge(r, f.ageA)); A.emploi = /apprenti/.test(A.metier); A.enfants = 0; A.casier = Math.min(A.casier, 1); A.heberg = ch(r, 0.92); A.proche = pk(r, ["sa mère", "son père", "sa grand-mère", "sa tante"]); }
    else if (A.age < 18) fixAge(A, 18);
    let V = null;
    if (pers.V) {
      const pv = pers.V;
      if (pv.agent) V = M.agent(r, false, LX.V.id);
      else {
        const vO = { minAge: pv.min || 19, maxAge: Math.max(pv.min || 19, pv.max || 60), metier: pv.metier, casier: 0, lieu: (["conjoint", "enfant", "ascendant"].includes(pv.rel) ? LX.A : LX.V).id, milieu: ["conjoint", "enfant", "ascendant"].includes(pv.rel) ? LX.milA : LX.milV };
        if (pv.rel === "conjoint") { vO.g = pv.g || (A.g === "f" ? "m" : "f"); vO.minAge = Math.max(18, A.age - 8); vO.maxAge = A.age + 6; }
        else if (pv.g) vO.g = pv.g;
        if (pv.rel === "ascendant") { vO.minAge = Math.max(A.age + 18, pv.min || 60); vO.maxAge = Math.max(vO.minAge, Math.min(98, A.age + 45)); }
        V = M.personne(r, vO);
        if (f.ageV != null) { fixAge(V, f.ageV); V.metier = fem(V, metierAge(r, f.ageV)); V.emploi = false; V.enfants = 0; }
        if (V.age >= 70 && !pv.metier) { V.metier = V.g === "f" ? "retraitée" : "retraité"; V.emploi = false; }
        if (pv.rel === "ascendant") V.nom = A.nom;
        if (pv.rel === "enfant") { V.nom = A.nom; }
      }
      if (V.nom === A.nom && !["ascendant", "enfant"].includes(pv.rel)) V.nom = pk(r, M.NOMS.filter((x) => x !== A.nom));
    }
    if (V && V.prenom === A.prenom) V.prenom = pk(r, (V.g === "f" ? M.PF : M.PM).filter((z) => z !== A.prenom));
    // le proche (partie civile en cas de décès, représentant légal d'un mineur victime)
    let P = null;
    const decede = !!(V && (cx.deces != null ? (typeof cx.deces === "function" ? cx.deces(null, f) : cx.deces) : I.deces));
    if (V && (pers.P || decede || V.age < 18)) {
      const rel = V.age < 18 ? "parent" : pers.P || "parent";
      const pg = rel === "conjoint" ? (V.g === "f" ? "m" : "f") : ch(r, 0.55) ? "f" : "m";
      const ages = { enfant: [Math.max(20, V.age - 38), Math.max(20, V.age - 20)], parent: [Math.max(V.age + 18, 24), Math.min(88, Math.max(V.age + 18, 24) + 20)], conjoint: [Math.max(19, V.age - 6), V.age + 6], fratrie: [Math.max(18, V.age - 8), V.age + 8] }[rel] || [30, 60];
      P = Object.assign(M.personne(r, { g: pg, minAge: ages[0], maxAge: Math.max(ages[0], ages[1]), casier: 0, lieu: V.sect, milieu: V.mil }), { nom: rel === "conjoint" ? pk(r, M.NOMS) : V.nom, rel });
      if (pers.V && pers.V.rel === "enfant" && rel === "parent") P.nom = A.nom;
      P.lien = { enfant: pg === "f" ? "fille" : "fils", parent: pg === "f" ? "mère" : "père", conjoint: pg === "f" ? "épouse" : "mari", fratrie: pg === "f" ? "sœur" : "frère" }[rel];
      if (P.prenom === A.prenom) P.prenom = pk(r, (pg === "f" ? M.PF : M.PM).filter((x) => x !== A.prenom));
    }
    // la famille que raconte le récit se retrouve sur les fiches : l'enfant partie civile est l'enfant de la victime
    // (et du couple, quand l'auteur est son conjoint) ; un récit qui parle des enfants du couple leur en donne
    const parent = (Q, n) => { if (Q && Q.age >= 18 && !(Q.enfants > 0)) Q.enfants = n || 1; };
    if (V && P && P.rel === "enfant") { parent(V); if (pers.V && pers.V.rel === "conjoint") parent(A); }
    if (V && pers.enfants) { parent(V, 2); parent(A, 2); }
    if (V && P && P.rel === "parent" && V.age < 18 && pers.V && pers.V.rel === "enfant") parent(A);
    const T0 = M.personne(r, { pf: 0.45, minAge: 20, maxAge: 75, casier: 0, lieu: LX.T.id, milieu: LX.milT });
    const T20 = M.personne(r, { pf: 0.5, minAge: 20, maxAge: 70, casier: 0, lieu: LX.F.id, milieu: LX.milT });
    for (const Tx of [T0, T20]) if ([A, V, P].some((y) => y && y.prenom === Tx.prenom)) Tx.prenom = pk(r, (Tx.g === "f" ? M.PF : M.PM).filter((z) => ![A, V, P].some((y) => y && y.prenom === z)));
    const T = { prenom: T0.prenom, nom: T0.nom, g: T0.g, age: T0.age, metier: T0.metier, adresse: T0.adresse };
    const T2 = { prenom: T20.prenom, nom: T20.nom === T0.nom ? pk(r, M.NOMS) : T20.nom, g: T20.g, age: T20.age, metier: T20.metier, adresse: T20.adresse };
    const C2 = pers.C2 ? M.personne(r, { g: "m", minAge: Math.max(16, A.age - 5), maxAge: A.age + 8, lieu: LX.A.id, milieu: LX.milA }) : null;
    const ageFaits = A.age;
    const mineur = ageFaits < 18;
    // récidive légale (criminelle : art. 132-8) ; jamais pour un mineur
    const rec = !mineur && A.casier === 2 && q.recidivable && ch(r, 0.5);
    if (rec) q = CAT.avecRecidive(q);
    // camp du joueur, entrée dans le dossier
    const pcPossible = !!V && I.victime !== "aucune" && !(V.agent);
    let camp = pcPossible && ch(r, 0.32) ? "pc" : "defense";
    // le même dossier, joué de l'autre côté (code d'affaire)
    if (o && o.camp && (o.camp === "defense" || pcPossible)) camp = o.camp;
    const client = camp === "pc" ? (P && (decede || V.age < 18) ? "P" : "V") : "A";
    const crime = q.nature === "crime";
    let entree = camp === "pc" ? "pc" : CAT.poids(r, crime ? { deferement: 0.3, detenu: 0.3, libre: 0.2, convoc: 0.2 } : { deferement: 0.2, detenu: 0.15, libre: 0.35, convoc: 0.3 });
    // la permanence des défèrements ne couvre que Paris : hors de Paris, le client arrive déjà mis en examen
    if (entree === "deferement" && !LX.F.paris) entree = crime ? "detenu" : "libre";
    const bo = !!(f.bo || (f.agg || []).includes("bande_organisee"));
    // dates (jours de partie)
    const d = {};
    d.h = CAT.heure(r, cx.heures || [[8 * 60, 23 * 60]]);
    const gavDuree = bo ? 4 : 2;
    let flagrance = entree === "deferement" ? ch(r, 0.75) : ch(r, 0.55);
    if (entree === "deferement") { d.mex = day; d.ri = day; d.gav = day - gavDuree; }
    else if (entree === "detenu" || entree === "libre") { d.mex = day - int(r, 25, crime ? 300 : 180); d.ri = d.mex; d.gav = d.mex - gavDuree; }
    else if (entree === "convoc") { d.ri = day - int(r, 30, 240); d.gav = d.ri - int(r, 2, 8); d.ipc = CR.rollForward(day + int(r, 10, 25)); d.mex = d.ipc; flagrance = false; }
    else { d.ri = day - int(r, 8, 160); d.mex = d.ri; d.gav = d.ri - gavDuree; }
    d.faits = flagrance ? d.gav : d.gav - int(r, 15, 400);
    if (!flagrance && d.faits > d.gav - 15) d.faits = d.gav - 15;
    d.gavMin = flagrance ? (d.h + int(r, 40, 180)) % 1440 : pk(r, [6 * 60 + 5, 6 * 60 + 30, 7 * 60]);
    // détention : qui est détenu, depuis quand, jusqu'où peut-elle aller
    const dpm = CAT.dpMax(q, ageFaits, bo);
    const pDp = mineur ? 0.45 : crime ? 0.8 : 0.4;
    // une détention trop courte pour une information (délit d'un mineur) : pas de détention provisoire
    const dpPossible = dpm.max >= 240;
    const dpRequise = entree === "deferement" && dpPossible ? ch(r, pDp) : false;
    let detenu = entree === "detenu" ? true : entree === "pc" && dpPossible ? ch(r, crime ? 0.65 : 0.3) : false;
    if (entree === "detenu" && !dpPossible) { entree = "libre"; detenu = false; }
    if (detenu && day - d.mex > dpm.max - 130) { d.mex = day - Math.max(20, Math.floor((dpm.max - 130) * 0.6)); d.ri = d.mex; d.gav = d.mex - gavDuree; d.faits = flagrance ? d.gav : d.gav - int(r, 15, 200); }
    if (detenu) d.dp = d.mex;
    // plan de l'information (jours de partie)
    const plan = GEN2.planInfo(r, { day, d, q, crime, detenu: detenu || dpRequise, dpm, entree, mineur, pcV: !!V && V.age > 0 && !decede, camp });
    // preuves
    const preuves = [];
    for (const [k, p] of Object.entries(cx.preuves || {})) if (ch(r, p)) preuves.push(k);
    for (const e of f.enjeux) { const pc = (cx.et && cx.et[e] ? null : null) || CAT.ENJEUX[e].piece; const k = PIECE_PREUVE[pc]; if (k && !preuves.includes(k)) preuves.push(k); }
    for (const k of ["telephonie", "temoin"]) if (preuves.filter((x) => !["medical"].includes(x)).length < 2 && (cx.preuves || {})[k] && !preuves.includes(k)) preuves.push(k);
    if (!preuves.includes("medical") && V && !(I.victime === "aucune")) preuves.unshift("medical");
    // posture de l'auteur
    const forts = ["adn", "video", "saisie", "ecrits", "telephonie"].filter((k) => preuves.includes(k)).length;
    let stance = CAT.poids(r, forts >= 3 ? { nie: 0.25, minimise: 0.45, reconnait: 0.3 } : { nie: 0.45, minimise: 0.35, reconnait: 0.2 });
    if (f.psy === "aboli" && stance === "nie") stance = "minimise";
    preuves.push("aveux");
    // étranger qui comprend mal le français (irrégularité possible)
    if (!mineur && ch(r, 0.1)) A.etranger = pk(r, M.LANGUES);
    // irrégularités
    const tq = { A, q, bo, flagrance, preuves, camp, entree };
    const irr = [];
    if (camp === "defense" || ch(r, 0.3)) {
      const cands = Object.entries(GEN2.IRR_CRIM).filter(([id, x]) => !x.cond || x.cond(tq));
      const nb = ch(r, 0.55) ? (ch(r, 0.25) ? 2 : 1) : 0;
      for (let i = 0; i < nb && cands.length; i++) {
        const tot = cands.reduce((a, [, x]) => a + x.p, 0);
        let x = r() * tot, idx = 0;
        for (; idx < cands.length; idx++) { x -= cands[idx][1].p; if (x < 0) break; }
        const [id] = cands.splice(Math.min(idx, cands.length - 1), 1)[0];
        if (id === "interprete" && irr.includes("gav_notif")) continue;
        if (id === "gav_notif" && irr.includes("interprete")) continue;
        irr.push(id);
      }
    }
    // requalification possible (une qualification moins grave, établie si l'enjeu est gagné)
    let rq = I.requalif ? I.requalif(r, f) : null;
    let q2 = null;
    if (rq) { q2 = CAT.qualifier(rq.inf2 || inf, rq.f2); if (rec && q2) q2 = CAT.avecRecidive(q2); }
    if (q2 && !(q2.prison < q.prison || (q2.prison === q.prison && q2.amende < q.amende) || q2.nature !== q.nature || (q.perpetuite && !q2.perpetuite))) { q2 = null; rq = null; }
    const jur = CAT.juridictionCrime(q, ageFaits);
    const t = {
      v: 2, genre: "info", inf, day, min: o.min != null ? o.min : null, f, q, q2, f2: rq ? rq.f2 : null, inf2: rq ? rq.inf2 || null : null, quoi: rq ? rq.quoi : null,
      rec, A, V, T, T2, P, C2, client, camp, entree, co: !!C2, bo, mineur, ageFaits,
      flagrance, enq: flagrance ? "flagrance" : "preliminaire", mesure: "gav", preuves, stance, irr, doutes: [], enjeux: f.enjeux.slice(),
      dpRequise, detenu, jur, pres: PRES[jur], ji: mineur ? "ji_mineurs" : CAT.INF[inf].fam === "crim_stups" ? "ji_jirs" : pk(r, ["ji_vauclair", "ji_ferraud", "ji_kessler"]), jld: pk(r, ["jld_pimentel", "jld_cherkaoui"]),
      d, plan, rue: pk(r, LX.F.rues), sc: f.ctx,
      opj: pk(r, ["opj_marchetti", "opj_rocher", "opj_benali"]), parquet: pk(r, ["pq_criminel", "pq_riboulet", "pq_delahaye"]),
      erreurPV: ch(r, 0.4), proc: `2026/${pk(r, ["BC", "BRB", "BPM", "OFAST", "BPF"])}/${int(r, 100, 999)}`, ninfo: `${String(int(r, 1, 999)).padStart(5, "0")}/26`, gpx: [M.gpx(r), M.gpx(r)],
    };
    GEN2.finP3(r3, t, LX);
    return t;
  };

  // ------------------------------------------------------------------ Le plan de l'information : chaque date fixée au tirage
  // ri, mex (première comparution), dp ; expertises ; interrogatoires et confrontation ; débats de prolongation ;
  // avis de fin d'information (art. 175) ; règlement ; réunion préparatoire et procès.
  GEN2.planInfo = function (r, o) {
    const { day, d, crime, detenu, dpm, entree } = o;
    const P = {};
    const debut = Math.max(day, d.ipc != null ? d.ipc : day);
    // durée restante de l'information (plusieurs mois de jeu), bornée par la détention
    let avis = Math.max(debut + int(r, 75, crime ? 260 : 170), d.mex + int(r, crime ? 150 : 90, crime ? 420 : 260));
    if (detenu) avis = Math.min(avis, d.mex + dpm.max - 80);
    avis = Math.max(avis, debut + 60);
    P.avis175 = CR.rollForward(avis);
    // art. 175 : un mois (détenu) ou trois mois (libre) pour les observations des parties, puis le réquisitoire et l'ordonnance
    P.reglement = CR.rollForward(P.avis175 + (detenu ? int(r, 38, 50) : int(r, 98, 120)));
    if (detenu && P.reglement > d.mex + dpm.max - 25) P.reglement = CR.rollForward(d.mex + dpm.max - 30);
    if (P.reglement - P.avis175 < (detenu ? 32 : 92)) { let a0 = P.reglement - (detenu ? 34 : 94); while (!CR.isBusinessDay(a0)) a0--; P.avis175 = a0; }
    P.obsLimite = P.avis175 + (detenu ? 30 : 90);
    // expertises : psychiatrique (toujours), autres selon le dossier
    P.psy = d.mex + int(r, 45, 120);
    P.ml = d.mex + int(r, 20, 90);
    // interrogatoires au fond et confrontation, entre l'entrée du joueur et l'avis de fin d'information
    const i1 = CR.rollForward(Math.max(debut + int(r, 18, 40), d.mex + 20));
    P.interros = [i1];
    if (P.avis175 - i1 > 80) P.interros.push(CR.rollForward(i1 + int(r, 40, Math.max(41, P.avis175 - i1 - 25))));
    P.interros = P.interros.filter((x) => x < P.avis175 - 7);
    if (!P.interros.length) P.interros = [CR.rollForward(Math.max(debut + 10, P.avis175 - 20))];
    P.confront = o.pcV && P.avis175 - i1 > 45 ? CR.rollForward(i1 + int(r, 14, Math.max(15, Math.min(60, P.avis175 - i1 - 12)))) : null;
    if (P.confront && P.confront >= P.avis175 - 5) P.confront = null;
    // détention : un débat de prolongation avant chaque échéance qui tombe avant le règlement
    P.prolong = [];
    if (detenu) {
      let ech = d.mex + dpm.initial;
      while (ech <= P.reglement + 2 && P.prolong.length < 8) { P.prolong.push(CR.rollForward(ech - 6) > ech ? ech - 8 : CR.rollForward(ech - 6)); ech += dpm.pas; }
    }
    // procès : un lundi, dans l'année de l'ordonnance pour un accusé détenu (art. 181)
    let pr = P.reglement + int(r, 55, crime ? 160 : 90);
    pr = CR.rollForward(pr);
    while (CR.dow(pr) !== 1 || !CR.isBusinessDay(pr)) pr++;
    P.proces = pr;
    P.reunion = CR.rollForward(P.proces - int(r, 20, 30));
    if (P.reunion <= P.reglement + 12) P.reunion = null;
    return P;
  };

  // ------------------------------------------------------------------ Contrôle de cohérence d'une affaire criminelle
  GEN2.verifierInfo = function (t) {
    const pb = [];
    const I = CAT.INF[t.inf];
    if (!I || !I.info) return ["infraction hors du catalogue des informations : " + t.inf];
    const q0 = CAT.qualifier(t.inf, t.f);
    const q = t.rec ? CAT.avecRecidive(q0) : q0;
    const sans = (x) => { const o = Object.assign({}, x); delete o.source; return JSON.stringify(o); };
    if (sans(q) !== sans(t.q)) pb.push("qualification différente de celle des faits");
    if (!I.ctxs[t.f.ctx]) pb.push("contexte inconnu " + t.f.ctx);
    for (const a of t.f.agg || []) if (!CAT.AGG[a]) pb.push("circonstance inconnue " + a);
    // 1. nature, peine, prescription
    if (q.nature === "crime" && !(q.prison >= 180)) pb.push("crime puni de moins de quinze ans");
    if (q.nature === "crime" && q.perpetuite && q.prison !== CAT.PERPETUITE) pb.push("perpétuité mal formée");
    if (q.nature === "delit" && !(q.prison > 0 && q.prison <= 120 + (q.recidive ? 120 : 0))) pb.push("délit instruit mal formé");
    const prescAttendue = q.prescMajorite ? (q.nature === "crime" ? 30 : [10, 20].includes(q.prescAns) ? q.prescAns : -1) : I.fam === "crim_stups" ? (q.nature === "crime" ? 30 : 20) : q.nature === "crime" ? 20 : 6;
    if (q.prescAns !== prescAttendue) pb.push(`prescription ${q.prescAns} ans au lieu de ${prescAttendue}`);
    // les circonstances aggravantes ne font jamais baisser la peine
    if ((t.f.agg || []).length) { const qs = CAT.qualifier(t.inf, Object.assign({}, t.f, { agg: [] })); if (qs && qs.prison > q0.prison) pb.push("circonstances qui allègent la peine"); }
    // 2. juridiction et président
    const jur = CAT.juridictionCrime(q, t.ageFaits);
    if (jur !== t.jur) pb.push(`juridiction ${t.jur} au lieu de ${jur}`);
    if (t.mineur !== (t.ageFaits < 18)) pb.push("minorité incohérente");
    if (t.mineur && q.nature === "crime" && !["tpe", "assises_mineurs"].includes(t.jur)) pb.push("mineur jugé par une cour de majeurs");
    if (t.mineur && t.ageFaits < 16 && q.nature === "crime" && t.jur !== "tpe") pb.push("crime d'un mineur de moins de seize ans hors du tribunal pour enfants");
    if (t.jur === "ccd" && (q.perpetuite || ![180, 240].includes(q.prison) || t.mineur || (CAT.CCD_HORS_RECIDIVE && q.recidive))) pb.push("cour criminelle départementale hors de sa compétence");
    if (q.nature === "crime" && !t.mineur && I.fam !== "crim_stups" && (q.perpetuite || q.prison > 240) && t.jur !== "assises") pb.push("crime puni de plus de vingt ans hors de la cour d'assises");
    if (GEN2.acteurBase(t.pres) !== PRES[t.jur]) pb.push("président incohérent");
    if (t.mineur && t.ji !== "ji_mineurs") pb.push("mineur sans juge d'instruction des mineurs");
    // 3. dates de l'enquête et de l'information
    const d = t.d, P = t.plan;
    if (!(d.faits <= d.gav && d.gav < d.ri && d.ri <= d.mex)) pb.push("chronologie faits, garde à vue, réquisitoire, mise en examen");
    if (d.ri - d.gav > (t.bo ? 4 : 2) + (t.entree === "convoc" ? 8 : 0)) pb.push("garde à vue trop longue avant le réquisitoire");
    if (t.entree === "convoc" && !(d.ipc - t.day >= 10 && d.ipc - t.day <= 61)) pb.push("convocation de l'article 80-2 hors délai");
    if (t.entree === "deferement" && d.mex !== t.day) pb.push("défèrement : la comparution n'a pas lieu le jour de l'appel");
    const departPresc = q.prescMajorite && t.V ? Math.max(d.faits, d.faits + (18 - t.V.age) * 365) : d.faits;
    if (d.ri > CR.addYears(departPresc, q.prescAns)) pb.push("réquisitoire après la prescription");
    // 4. détention provisoire
    const dpm = CAT.dpMax(q, t.ageFaits, t.bo);
    if (t.detenu) {
      if (d.dp == null || d.dp > t.day) pb.push("détention sans date de placement");
      if (P.reglement - d.dp > dpm.max) pb.push(`détention provisoire au-delà du plafond (${P.reglement - d.dp} jours pour ${dpm.max})`);
      let ech = d.dp + dpm.initial, k = 0;
      while (ech <= P.reglement) { const deb = P.prolong[k]; if (deb == null || deb > ech || deb < ech - 20) { pb.push("débat de prolongation manquant ou hors délai"); break; } ech += dpm.pas; k++; }
      if (P.proces - P.reglement > 365) pb.push("accusé détenu jugé plus d'un an après l'ordonnance (art. 181)");
    }
    if (!t.detenu && P.prolong.length && !t.dpRequise) pb.push("débats de prolongation sans détention");
    // 5. l'information elle-même
    if (!(P.interros.every((x) => x > Math.max(t.day, d.mex) && x < P.avis175))) pb.push("interrogatoire hors de l'information");
    if (P.confront != null && !(P.confront > t.day && P.confront < P.avis175)) pb.push("confrontation hors de l'information");
    if (P.reglement - P.avis175 < (t.detenu || t.dpRequise ? 30 : 90)) pb.push("règlement avant l'expiration des délais de l'article 175");
    if (!(P.avis175 - t.day >= 55)) pb.push("information trop courte pour le joueur");
    if (!(P.proces > P.reglement + 40)) pb.push("procès trop proche du règlement");
    if (P.reunion != null && !(P.reunion > P.reglement && P.reunion < P.proces)) pb.push("réunion préparatoire mal placée");
    if (CR.dow(P.proces) !== 1) pb.push("procès hors d'un lundi");
    // 6. enjeux, preuves, irrégularités, requalification
    if (!t.enjeux.length) pb.push("aucun enjeu de défense");
    for (const e of t.enjeux) if (!CAT.ENJEUX[e]) pb.push("enjeu inconnu " + e);
    for (const id of t.irr) { const x = GEN2.IRR_CRIM[id]; if (!x || !CR.IRREG[x.regime]) pb.push("irrégularité sans régime " + id); else if (x.cond && !x.cond(t)) pb.push("irrégularité hors de son cas " + id); }
    if (t.q2 && !(t.q2.prison < t.q.prison || t.q2.nature !== t.q.nature || (t.q.perpetuite && !t.q2.perpetuite) || t.q2.amende < t.q.amende)) pb.push("requalification qui n'allège pas");
    if (t.camp === "pc" && !t[t.client]) pb.push("partie civile sans client");
    if (t.camp === "pc" && t.V && t.V.age < 18 && t.client !== "P") pb.push("mineur victime client en personne");
    return pb;
  };

  // ------------------------------------------------------------------ Réquisitions et peines criminelles
  // Base des réquisitions de l'avocat général, en mois (ou la perpétuité), selon le crime, ses suites et la personne
  GEN2.requisCrime = function (q, t, o = {}) {
    const r = CR.seeded(t.sig + ":requis");
    const max = q.perpetuite ? 360 : q.prison;
    let base;
    if (q.nature !== "crime") base = Math.round(max * (0.3 + r() * 0.2));
    else if (q.perpetuite) base = t.inf === "assassinat" && ["contrat", "reglement_stups", "couple_premedite"].includes(t.f.ctx) ? 360 : Math.round(260 + r() * 100);
    else base = Math.round(max * (0.45 + r() * 0.2));
    if (t.A.casier) base = Math.round(base * 1.1);
    if (t.stance === "reconnait") base = Math.round(base * 0.9);
    if (o.altere) base = Math.round(base * 0.75);
    if (t.mineur) base = Math.round(base * 0.5);
    const cap = t.mineur ? CAT.encourueMineur(q) : max;
    base = Math.min(base, cap);
    const perpetuite = !!(q.perpetuite && !t.mineur && !o.altere && base >= 355);
    const comp = [];
    if (/sexuel/.test(CAT.INF[t.inf].fam)) comp.push("suivi socio-judiciaire de sept ans avec injonction de soins", "inscription au fichier des auteurs d'infractions sexuelles");
    if (t.f.arme || ["couteau", "arme_feu"].includes(t.f.mech)) comp.push("interdiction de détenir ou de porter une arme pendant dix ans");
    if (t.A.etranger && !t.mineur && q.nature === "crime") comp.push("interdiction du territoire français pendant dix ans");
    if (q.nature !== "crime" && base <= 24) return { ferme: Math.max(0, Math.round(base * 0.4)), sursis: Math.round(base * 0.6), complementaires: comp, max: cap };
    return { ferme: perpetuite ? 360 : base, sursis: 0, complementaires: comp, perpetuite, mandatDepot: true, reclusion: q.nature === "crime", max: perpetuite ? 360 : cap };
  };
  // Le texte d'une peine criminelle : réclusion au-delà de dix ans, période de sûreté de plein droit (art. 132-23)
  // période de sûreté de plein droit (art. 132-23, al. 1) : seulement pour « les infractions spécialement prévues par la
  // loi » — les articles du code pénal qui y renvoient (relevés sur codes.droit.org le 13 novembre 2026, version du 26 août
  // 2026). Ni le meurtre simple (221-1), ni le viol (222-23, 222-24) n'en sont : la sûreté y est facultative (al. 3).
  GEN2.SURETE_PLEIN_DROIT = new Set(["211-1", "212-1", "212-2", "212-3", "214-3", "214-4", "221-2", "221-3", "221-4", "221-5", "221-12", "222-1", "222-2", "222-3", "222-4", "222-5", "222-6", "222-8", "222-10", "222-12", "222-14", "222-14-1", "222-14-5", "222-15", "222-25", "222-26", "222-34", "222-35", "222-36", "222-37", "222-38", "222-39", "224-1", "224-2", "224-3", "224-4", "224-5", "224-5-2", "224-6", "225-7", "225-8", "225-9", "225-10", "311-6", "311-7", "311-8", "311-9", "311-10", "312-3", "312-4", "312-5", "312-6", "312-7", "322-8", "322-9", "322-10", "411-2", "412-1", "421-7", "442-1", "442-2", "462-2"]);
  GEN2.sureteDePleinDroit = (q) => !!q && q.nature === "crime" && (String(q.court || "").match(/\d{3}-\d+(?:-\d+)?/g) || []).some((a) => GEN2.SURETE_PLEIN_DROIT.has(a));
  GEN2.peineCrimeTexte = function (pn, o = {}) {
    if (!pn) return "";
    const parts = [];
    if (pn.perpetuite) parts.push("Réclusion criminelle à perpétuité" + (o.mineur || !o.surete ? "" : ", période de sûreté de dix-huit ans (art. 132-23)"));
    else if (pn.ferme >= 120 && o.crime) parts.push(`${CR.fmtMois(pn.ferme)} de réclusion criminelle` + (o.mineur || !o.surete ? "" : `, période de sûreté de plein droit de la moitié de la peine (art. 132-23)`));
    else if (pn.ferme > 0 && o.crime && !pn.sursis) parts.push(`${CR.fmtMois(pn.ferme)} d'emprisonnement (art. 132-18)` + (o.detenu ? ", maintien en détention" : ", mandat de dépôt"));
    else if (o.crime && pn.sursis) parts.push(`${CR.fmtMois(pn.ferme + pn.sursis)} d'emprisonnement (art. 132-18)` + (pn.ferme ? `, dont ${CR.fmtMois(pn.sursis)} avec sursis${pn.sursisType === "probatoire" ? " probatoire" : ""}` : ` avec sursis${pn.sursisType === "probatoire" ? " probatoire" : ""}`) + (pn.ferme ? (o.detenu ? ", maintien en détention" : ", mandat de dépôt") : ""));
    else if (pn.ferme || pn.sursis) parts.push(CR.PROC.peineTexte(Object.assign({}, pn, { complementaires: [] })).replace(/\.$/, ""));
    for (const c of pn.complementaires || []) parts.push(c);
    return parts.join(", ");
  };

  // =================================================================== La définition d'une affaire criminelle
  B.info = function (p) {
    const t = p.t;
    const I = CAT.INF[t.inf];
    const cx = I.ctxs[t.f.ctx];
    const N = GEN2.recit(t, p.niveau);
    const PZ = GEN2.piecesCrim(t, N);
    const A = t.A, V = t.V, P = t.P;
    const C = t[t.client] || A;
    const D0 = t.camp === "defense";
    const q = t.q;
    const crime = q.nature === "crime";
    const e = (x) => GEN2.PR.e(x);
    const nom = (x) => (x ? `${x.prenom} ${x.nom}` : "");
    const civ = (x) => GEN2.PR.civ(x);
    const Mme = (x) => GEN2.PR.Civ(x);
    const nomA = nom(A);
    const proc = N.procedural;
    const nomV = V ? (proc ? `${V.g === "f" ? "la mineure" : "le mineur"} ${V.prenom[0]}. ${V.nom[0]}.` : nom(V)) : "";
    const r = CR.seeded(t.sig + ":def");
    const plan = t.plan;
    const ji = CR.acteur(t.ji) || { nom: "le juge d'instruction" };
    const jiNom = ji.nom;
    const jld = CR.acteur(t.jld) || { nom: "le juge des libertés et de la détention" };
    // fort : le dossier soutient l'enjeu (t.f.forts). Le catalogue porte aussi des phrases « fort » et « faible » : elles
    // écrasaient ce booléen (tout enjeu passait pour fort) ; la phrase que porte la pièce du dossier va dans txtFort / faible
    const enjeux = t.enjeux.map((id) => {
      const E = CAT.enjeu(id, A, V) || {}, fort = (t.f.forts || []).includes(id), ne = (N.enjeux || {})[id];
      return Object.assign({}, E, { id, fort, txtFort: ne && fort ? ne.t : E.fort, faible: ne && !fort ? ne.t : E.faible });
    });
    const requalifEnjeu = t.q2 ? t.quoi : null;
    const decede = !!(V && PZ.docs.medical && N.medical.kind === "autopsie");
    const x = { t, N, PZ, I, A, V, C, e, nom, civ, q, r, vt: V ? "personne" : "aucune", prevention: (qq) => `${N.prevention}${(t.f.agg || []).map(CAT.aggPrev).filter(Boolean).map((s) => ", " + s).join("")}${t.rec ? ", en état de récidive légale" : ""}` };
    const sexuel = I.fam === "crim_sexuel";
    // phase 3 : le tribunal du lieu des faits (Paris, Bobigny, Créteil, Nanterre) et sa cour d'appel
    const TJ = CR.MONDE.lieuxDe(t).TJ;
    const titreJur = (j) => (TJ.paris ? JUR_TITRE[j] : { ccd: TJ.ccd, assises: TJ.assises, assises_spe: JUR_TITRE.assises_spe, assises_mineurs: `Cour d'assises des mineurs ${TJ.depLong}`, tpe: TJ.tpe, tc: TJ.tc }[j]) || CR.PROC.JURIDICTIONS[j].label;
    const jurDe = (j) => (["tc", "tpe"].includes(j) ? `${CAT.JUR_LABEL[j]} de ${TJ.ville}` : j === "assises_spe" ? `${CAT.JUR_LABEL[j]} de Paris` : `${CAT.JUR_LABEL[j]} ${TJ.depLong}`);
    const presDe = (j) => GEN2.acteurTJ(PRES[j], TJ.id);
    // faits propres à l'information
    const facts = Object.assign({}, PZ.facts, {
      K_juge: { label: `Le juge d'instruction : ${jiNom}` },
      K_avis175: { label: "L'avis de fin d'information", key: true, why: "Les parties ont un mois si la personne est détenue, trois mois sinon, pour présenter observations et demandes (art. 175)." },
      K_reglement: { label: "L'ordonnance de règlement", key: true, why: "Non-lieu, mise en accusation ou renvoi devant le tribunal correctionnel : l'appel se forme dans les dix jours (art. 186 et 186-3)." },
      K_verdict: { label: "La décision de la juridiction de jugement", key: true, why: "Appel dans les dix jours du prononcé (art. 380-9 pour les arrêts criminels, art. 498 pour les jugements correctionnels)." },
      K_attest: { label: "Une attestation d'hébergement écrite", key: true },
      K_promesse: { label: "Une promesse d'embauche", key: true },
      K_designe: { label: "La désignation de l'avocat par le client (art. 115)" },
      K_prep: { label: "Le client préparé à son interrogatoire" },
    });
    const notesPerso = ["G_heberg", "G_emploi", "K_attest", "K_promesse"];
    // ------------------------------------------------------------ Les pièces de la suite de l'information (créées par le déroulé)
    // lot 7 : les questions de l'avocat jouées à chaque interrogatoire, reprises au procès-verbal
    const interroJoue = (xx) => {
      const out = [];
      for (const I0 of xx.cs.vars.interroQA || []) {
        out.push([`${I0.jour != null ? `Le ${D(I0.jour)}, q` : "Q"}uestions posées par Me ${xx.s.player.prenom} ${xx.s.player.nom} (art. 120 du code de procédure pénale) :`]);
        if (!I0.qa.length) out.push(["L'avocat indique ne pas avoir de question."]);
        for (const x of I0.qa) out.push(x.refus ? [`Question : ${x.q} — Le juge d'instruction s'oppose à la question, déjà posée.`] : [`Question : ${x.q} — Réponse : `].concat(x.a.map((l) => (l.f ? { t: l.t + " ", f: l.f } : l.t + " ")), (x.juge || []).map((j) => ` Le juge d'instruction observe : « ${j} »`)));
      }
      return out;
    };
    const flowDocs = {
      ordo_dp_live: (xx) => ({ title: xx.cs.vars.jldDecision === "dp" ? "Ordonnance de placement en détention provisoire" : "Ordonnance de placement sous contrôle judiciaire", kind: "greffe", entete: [`${jld.nom}, juge des libertés et de la détention`, `Information n° ${t.ninfo}`], paras: [[xx.cs.vars.jldDecision === "dp" ? `Ordonnons le placement en détention provisoire de ${nomA} (art. 144 et 145) ; la détention ne pourra excéder ${t.mineur ? "six mois" : crime ? "un an" : "quatre mois"}, sauf prolongation.` : `Disons n'y avoir lieu à détention provisoire ; plaçons ${nomA} sous ${xx.cs.vars.jldDecision === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"} : obligation de résider ${A.adresse}, interdiction d'entrer en contact avec ${V ? "la victime et les témoins" : "les autres mis en examen"}, pointage hebdomadaire au commissariat.`]] }),
      pv_ipc_live: (xx) => ({ title: "Procès-verbal d'interrogatoire de première comparution", kind: "pv", entete: [`Cabinet de ${jiNom}, juge d'instruction`, `Information n° ${t.ninfo}`], paras: [[`Le ${D(t.d.mex)}, comparaît ${nomA}, assisté${e(A)} de Me ${xx.s.player.prenom} ${xx.s.player.nom}.`], [`Faits notifiés : ${q.label}. Droit de se taire rappelé.`], [{ t: xx.cs.vars.ipcChoix === "silence" ? "La personne déclare : « Je ne souhaite pas m'exprimer aujourd'hui. »" : `La personne déclare : « ${N.version[t.stance]} »`, f: "X_ipc" }], [xx.cs.vars.statut === "ta" ? `Disons que ${nomA} sera entendu${e(A)} en qualité de témoin assisté (art. 113-1).` : `Mettons ${nomA} en examen du chef de ${q.label} (art. 80-1).`]] }),
      pv_interro: (xx) => ({ title: "Procès-verbal d'interrogatoire", kind: "pv", entete: [`Cabinet de ${jiNom}, juge d'instruction`, `Information n° ${t.ninfo}`], paras: [[`Interrogatoire de ${nomA}${D0 ? `, assisté${e(A)} de Me ${xx.s.player.nom}` : ""}.`], ...(N.interro.length ? N.interro : [{ q: "Maintenez-vous vos déclarations ?", a: { nie: "Oui. Je n'ai rien fait.", minimise: "Oui, pour l'essentiel.", reconnait: "Oui. Je reconnais les faits." } }]).map((qq) => [`Question : ${qq.q} — Réponse : ${qq.a[t.stance]}`]), ...CR.CONF ? interroJoue(xx) : []] }),
      pv_confront: (xx) => CR.CONF.pv(xx.cs, { jiNom, ninfo: t.ninfo, nomA, eA: e(A), avocat: `${xx.s.player.prenom} ${xx.s.player.nom}`, nomT: nom(t.T), premiere: (CR.CRIMD && CR.CRIMD.temoin(t, N) || {}).premiere, version: N.version[t.stance] }),
      contre_expertise: (xx) => ({ title: "Rapport de contre-expertise", kind: "courrier", entete: ["Collège d'experts désigné par le juge d'instruction", `Information n° ${t.ninfo}`], paras: [[`Mission : ${xx.cs.vars.contreObjet || "examen des conclusions de la première expertise"}.`], [{ t: xx.cs.vars.contreResultat || "Les contre-experts confirment les conclusions initiales.", f: "K_contre" }]] }),
      reconstitution: () => ({ title: "Procès-verbal de reconstitution", kind: "pv", entete: [`Cabinet de ${jiNom}, juge d'instruction`, `Information n° ${t.ninfo}`], paras: [[`Transport sur les lieux ${N.lieu}, en présence des parties et de leurs avocats.`], [{ t: enjeux[0] && enjeux[0].fort ? `La reconstitution rend plausible la version de la défense sur un point essentiel : ${enjeux[0].label.toLowerCase()}.` : "La reconstitution ne remet pas en cause les constatations initiales.", f: "K_reconst" }]] }),
      avis175: () => ({ title: "Avis de fin d'information (art. 175)", kind: "greffe", entete: [`Cabinet de ${jiNom}, juge d'instruction`, `Information n° ${t.ninfo}`], paras: [["L'information paraissant terminée, avis en est donné aux parties et à leurs avocats."], [{ t: `Délai pour présenter des observations, des demandes d'actes ou des requêtes en nullité : ${t.detenu || t.dpRequise ? "un mois" : "trois mois"} (art. 175).`, f: "K_avis175" }]] }),
      ordo_reglement: (xx) => {
        const R0 = xx.cs.vars.reglement || {};
        const lib = { nonlieu: "Ordonnance de non-lieu", irresp: "Ordonnance d'irresponsabilité pénale pour cause de trouble mental", oma: "Ordonnance de mise en accusation", ortc: t.mineur ? "Ordonnance de renvoi devant le tribunal pour enfants" : "Ordonnance de requalification et de renvoi devant le tribunal correctionnel" }[R0.type] || "Ordonnance de règlement";
        const qq = R0.qual === "q2" && t.q2 ? t.q2 : q;
        return { title: lib, kind: "greffe", entete: [`Cabinet de ${jiNom}, juge d'instruction`, `Information n° ${t.ninfo}`], paras: [
          ["Vu le réquisitoire définitif du procureur de la République et les observations des parties (art. 175) ;"],
          R0.type === "nonlieu" ? [{ t: `Attendu qu'il ne résulte pas de l'information de charges suffisantes contre ${nomA} d'avoir commis les faits ; disons n'y avoir lieu à suivre (art. 177).`, f: "K_reglement" }]
            : R0.type === "irresp" ? [{ t: `Attendu qu'il résulte des expertises que ${nomA} était atteint${e(A)}, au moment des faits, d'un trouble psychique ayant aboli son discernement ; déclarons ${nomA} pénalement irresponsable (art. 122-1 et 706-120) ; ordonnons son admission en soins psychiatriques sans consentement et lui interdisons d'entrer en contact avec ${V ? "les proches de la victime" : "les parties"}.`, f: "K_reglement" }]
              : [{ t: `Attendu qu'il résulte de l'information des charges suffisantes contre ${nomA} d'avoir commis ${qq.label} (${qq.court}) ; ${R0.type === "oma" ? `ordonnons sa mise en accusation devant ${jurDe(R0.jur)} (art. 181)` : `ordonnons son renvoi devant ${jurDe(R0.jur)} (art. 179)`}${R0.qual === "q2" ? ", les faits étant requalifiés" : ""}.`, f: "K_reglement" }],
          (xx.cs.proc.detention.statut === "dp" && ["oma", "ortc"].includes(R0.type)) ? ["Disons que la détention provisoire se poursuivra jusqu'à la comparution (art. 181 et 179)."] : null,
          ["Appel possible dans les dix jours de la notification (art. 186 et 186-3)."],
        ].filter(Boolean) };
      },
      arret_chins: (xx) => ({ title: "Arrêt de la chambre de l'instruction", kind: "greffe", entete: [`${TJ.ca} · chambre de l'instruction`, `Information n° ${t.ninfo}`], paras: (xx.cs.vars.arretChins || ["La chambre de l'instruction confirme l'ordonnance entreprise."]).map((l) => [l]) }),
      ordo_prolong: (xx) => ({ title: "Ordonnance sur la prolongation de la détention provisoire", kind: "greffe", entete: [`${jld.nom}, juge des libertés et de la détention`, `Information n° ${t.ninfo}`], paras: [[xx.cs.vars.prolongDecision === "dp" ? `Prolongeons la détention provisoire de ${nomA} pour une durée de ${CAT.dpMax(q, t.ageFaits, t.bo).pas >= 180 ? "six mois" : "quatre mois"} (art. 145-2${t.mineur ? " et dispositions du CJPM" : ""}).` : `Disons n'y avoir lieu à prolongation ; ordonnons la mise en liberté de ${nomA} sous ${xx.cs.vars.prolongDecision === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"}.`]] }),
      verdict: (xx) => ({ title: xx.cs.vars.verdictTitre || "Décision", kind: "greffe", entete: [titreJur(xx.cs.vars.jurProces || t.jur), "Décision rendue en premier ressort"], paras: [[{ t: xx.cs.vars.verdictTexte || "Décision rendue.", f: "K_verdict" }], ["Appel possible dans les dix jours du prononcé."]] }),
    };
    const flowTitles = { ordo_dp_live: "Ordonnance du juge des libertés", pv_ipc_live: "Interrogatoire de première comparution", pv_interro: "Interrogatoire au fond", pv_confront: "Confrontation", contre_expertise: "Contre-expertise", reconstitution: "Reconstitution", avis175: "Avis de fin d'information", ordo_reglement: "Ordonnance de règlement", arret_chins: "Arrêt de la chambre de l'instruction", ordo_prolong: "Ordonnance sur la prolongation", verdict: "La décision" };
    const docs = Object.assign({}, PZ.docs, flowDocs);
    const docTitles = Object.assign({}, PZ.titres, flowTitles);
    facts.K_contre = { label: "Les conclusions de la contre-expertise", key: true };
    if (CR.CONF) { Object.assign(facts, CR.CONF.CONCESSIONS, CR.CONF.FAITS_CLIENT(enjeux)); facts.G_conf_certain = CR.CONF.CERTAIN; }
    facts.K_reconst = { label: "La reconstitution" };
    // ------------------------------------------------------------ Arguments : enjeux, personnalité, peine
    const argEnjeu = (en, role) => ({ id: en.id, label: en.label, say: role === "pc" ? `La défense invoquera : « ${en.label.toLowerCase()} ». Le dossier y répond.` : en.arg, cards: ["E_" + en.id].concat((en.textes || []).filter((k) => CR.TEXTES[k]).slice(0, 2)), pertinent: () => en.fort || en.effet === "peine" });
    const argsDefense = (apiS) => enjeux.map((en) => argEnjeu(en, "defense")).concat([
      { id: "personnalite", label: "La personnalité : un hébergement, un travail, des attaches", say: `${CR.cap(nomA)} a ${A.heberg ? "un toit" : "des proches prêts à l'héberger"}${A.emploi ? ", un emploi" : ""} ; la peine doit permettre la sortie.`, cards: notesPerso },
      t.mineur ? { id: "minorite", label: "La minorité : l'atténuation de la peine", say: `${A.ageFaits || t.ageFaits} ans au moment des faits : la peine ne peut dépasser la moitié de la peine encourue (art. L. 121-5 CJPM).`, cards: ["CJPM_L121-5"] } : null,
      t.stance === "reconnait" ? { id: "aveu", label: `${GEN2.PR.Il(A)} a reconnu, dès le début`, say: `${GEN2.PR.Il(A)} a reconnu, ${GEN2.PR.il(A)} n'a jamais fui sa responsabilité : c'est le début de la réparation.`, cards: ["X_aveux"] } : null,
      { id: "sans_dossier", label: "L'émotion, sans le dossier", say: "Regardez-le : est-ce un criminel ?", pertinent: () => false },
    ].filter(Boolean));
    const postes = (N.prejudice || []).map((po) => ({ id: po.id, label: po.label, demande: po.demande, base: po.base != null ? po.base : po.demande, needs: po.piece ? ["P_" + po.id] : null, justif: po.piece ? ["P_" + po.id] : null, sansJustif: 0.5 }));
    for (const po of N.prejudice || []) if (po.piece) facts["P_" + po.id] = { label: `${po.label} : ${CR.money(po.demande)}`, key: true };
    const argsPC = () => [
      { id: "faits", label: "Les faits, établis par l'information", say: `L'information l'établit : ${N.resume.replace(/\.$/, "")}.`, cards: ["X_victime", "X_temoin", "X_mort", "X_adn", "X_tel", "X_video"] },
      { id: "qualif", label: `La qualification : ${q.label}`, say: `Les faits constituent ${q.label}, prévu par ${CAT.courtLong(q.court)}.`, cards: q.textes.slice(0, 1).concat(["G_qualif"]) },
    ].concat(enjeux.filter((en) => en.effet !== "peine").map((en) => ({ id: "contre_" + en.id, label: `Répondre : ${en.label.toLowerCase()}`, say: en.fort ? "La défense a un point, je ne le nie pas ; mais il ne suffit pas à effacer le reste du dossier." : `Le dossier répond : ${en.faible.replace(/^« |»$/g, "").slice(0, 160)}`, cards: ["E_" + en.id], pertinent: () => !en.fort }))).concat([
      { id: "prejudice", label: "Le préjudice, pièces à l'appui", say: `Le préjudice est établi : ${(N.prejudice || []).map((po) => po.label.toLowerCase()).join(", ")}.`, cards: postes.flatMap((po) => po.justif || []) },
      { id: "peine", label: "Demander une peine exemplaire", say: "Je demande à la cour une peine exemplaire.", pertinent: () => false },
      { id: "art475", label: "Les frais d'avocat (art. 475-1 ou 375)", say: "Je sollicite une somme au titre des frais exposés.", cards: ["CPP_475-1"] },
    ]);
    // ------------------------------------------------------------ Décisions
    function chargesSpec(api, o = {}) {
      const { cs } = api;
      const pieces = {};
      for (const k of t.preuves) {
        if (GEN2.FORCE_CRIM[k] == null) continue;
        pieces[k] = { label: GEN2.LABEL_CRIM[k], sens: "charge", force: GEN2.FORCE_CRIM[k] * (k === "aveux" ? { reconnait: 1.1, minimise: 0.6, nie: 0.15 }[t.stance] : 1) };
      }
      if (V && !decede && N.victime) pieces.victime = { label: GEN2.LABEL_CRIM.victime, sens: "charge", force: GEN2.FORCE_CRIM.victime };
      if (t.entree !== "deferement" || cs.vars.ipcChoix === "declarer") pieces.interro = { label: GEN2.LABEL_CRIM.interro, sens: "charge", force: t.stance === "reconnait" ? 0.2 : 0.06 };
      for (const en of enjeux) {
        if (en.effet !== "acquit") continue;
        const renfort = cs.vars.renfort && cs.vars.renfort[en.id] ? 0.12 : 0;
        // lot 7 : les pièces ajoutées au dossier (crim-dossier.js) appuient aussi les moyens qu'elles concernent
        const appuis = en.id === "identification" ? ["G_temoin_hesite", "G_temoin_nuit", "G_heures_voisins", "G_temoin_varie", "G_aucune_trace", "G_conf_heure", "G_conf_nuit", "G_conf_loin", "G_conf_reco"] : en.id === "ld" ? ["G_heures_voisins"] : [];
        appuis.push("C_" + en.id); // lot 7 : l'explication du client devant le juge, confirmée par le dossier
        pieces["d_" + en.id] = { label: en.label, sens: "decharge", force: (en.fort ? 0.34 : 0.07) + renfort, need: ["arg:" + en.id, "E_" + en.id].concat(appuis), noteSuffit: !!o.instruction };
      }
      // lot 7 : le témoin qui s'est dit certain à la confrontation raffermit l'accusation
      if (cs.vars.confront && cs.vars.confront.certain) pieces.confront = { label: "La confrontation", sens: "charge", force: 0.1 };
      // une explication que le dossier contredit, donnée devant le juge sur la question de son avocat, pèse contre lui
      const contredit = (cs.vars.interroQA || []).reduce((n, x) => n + (x.contredit || 0), 0);
      if (contredit && pieces.interro) pieces.interro.force += Math.min(0.12, 0.05 * contredit);
      return { seuil: o.seuil || 0.48, pieces };
    }
    function requalifObtenue(api, played) {
      if (!t.q2 || !requalifEnjeu) return false;
      const en = enjeux.find((z) => z.id === requalifEnjeu);
      const joue = played.has("arg:" + requalifEnjeu) || played.has("E_" + requalifEnjeu) || (api.cs.vars.obs175 && api.cs.vars.obs175.points.includes(requalifEnjeu));
      const renfort = api.cs.vars.renfort && api.cs.vars.renfort[requalifEnjeu];
      if (!joue) return false;
      return en && (en.fort || renfort) ? R.chance(api.s, 0.82) : R.chance(api.s, 0.18);
    }
    // ------------------------------------------------------------ La définition
    const H = Math.round((crime ? 6000 : 3500) + (I.gravite || 0.6) * 6000 / 500) * 1;
    const forfait = Math.round(((crime ? 6000 : 3000) + (I.gravite || 0.6) * (crime ? 7000 : 2500)) / 500) * 500;
    const callerNom = t.camp === "pc" ? nom(C) : t.entree === "detenu" ? `${A.proche.replace(/^s(a|on) /, (m0, g) => (g === "a" ? "La " : "Le "))} de ${A.prenom} ${A.nom}`.replace(/^La /, "").replace(/^Le /, "") : nomA;
    const famille = t.entree === "detenu" || (t.mineur && D0) ? M.personne(CR.seeded(t.sig + ":famille"), { g: /mère|sœur|tante|grand-mère|compagne/.test(A.proche) ? "f" : "m", minAge: t.mineur ? 35 : 30, maxAge: 70, casier: 0 }) : null;
    if (famille) { famille.nom = /compagn/.test(A.proche) ? famille.nom : A.nom; GEN2.PR.id(famille, "F"); }
    const appelant = famille ? `${famille.prenom} ${famille.nom}, ${A.proche.replace(/^s(a|on) /, "")} de ${A.prenom}` : callerNom;
    const def = {
      id: p.id, camp: t.camp, domaine: crime ? "criminel" : "instruction", domaineLib: "pp_instruction", generated: true, gen2: true, genre: "info",
      title: `${C.nom} — ${N.titre}`,
      client: Object.assign(B.clientDef(x, C), { trust: 50 }),
      caller: t.entree === "deferement" ? "Permanence pénale de l'Ordre — défèrements" : appelant,
      leadKind: t.entree === "deferement" ? "permanence" : "lead",
      silent: t.entree === "deferement",
      leadTask: t.entree === "deferement" ? null : PEN.rdvTask(famille ? `Recevoir ${civ(famille)} ${famille.nom} au cabinet` : `Recevoir ${civ(C)} ${C.nom} au cabinet`), leadPatience: 5,
      profile: { wealth: t.entree === "deferement" ? 0 : crime ? 4 : 3, sens: 0.6, urgency: 0.8, temper: pk(r, ["anxieux", "anxieux", "mefiant", "presse"]) },
      honoraires: t.entree === "deferement" ? { aj: true } : { forfait, heures: crime ? 60 : 30, types: ["forfait", "temps"], resultat: D0 ? "non-lieu, acquittement ou requalification" : "indemnisation", intro: famille ? `${famille.prenom} a réuni l'argent avec la famille.` : "" },
      mission: D0 ? `Défense de ${nomA} dans l'information judiciaire ouverte du chef de ${q.label}, devant le juge d'instruction, le juge des libertés et de la détention et la chambre de l'instruction, puis devant ${CAT.JUR_LABEL[t.jur]} jusqu'à la décision de premier ressort.` : `Assistance de ${nom(C)}${t.client === "P" ? (V.age < 18 ? `, représentant légal de ${nomV}` : `, ${P.lien} de la victime`) : ", victime"}, partie civile dans l'information ouverte contre ${nomA}, jusqu'à la décision de premier ressort.`,
      actors: { ji: t.ji, jld: t.jld, parquet: t.parquet, president: t.pres, opj: t.opj },
      proc: { stade: t.entree === "convoc" ? "enquete" : "information", nature: q.nature, faits: t.d.faits - p.day, infractions: q.textes.filter((k) => CR.TEXTES[k]).slice(0, 3), mex: t.entree === "detenu" || t.entree === "libre" ? t.d.mex - p.day : null, detention: t.entree === "detenu" ? "dp" : t.entree === "libre" ? "cj" : t.camp === "pc" && t.detenu ? "dp" : "libre", detentionSince: t.d.dp != null ? t.d.dp - p.day : t.entree === "libre" ? t.d.mex - p.day : null, etab: ((e0) => (TJ.paris || t.mineur || A.g === "f" ? e0 : TJ.ma))(t.mineur ? "fleury" : A.g === "f" ? "fleury" : pk(r, ["sante", "fresnes", "fleury"])), pcConstituee: false },
      init(api, cs) {
        cs.proc.faitsDay = t.d.faits;
        cs.proc.prescStart = t.d.ri;
        cs.vars.gravite = crime ? 0.85 : 0.6;
        cs.vars.criteres144 = crime ? 2 : 1;
        cs.vars.statut = t.entree === "detenu" || t.entree === "libre" ? "mex" : t.camp === "pc" ? "pc" : null;
        if (t.camp === "pc") cs.vars.permisDemande = "pc";
        if (t.entree === "detenu") cs.vars.permisDemande = "designation";
        cs.vars.base = p.day;
      },
      vars: () => ({ juge: jiNom }),
      facts, docs, docTitles, anomalies: PZ.anomalies,
      calls: {},
      advice: [],
      famille,
      tpls: {},
      penal: {
        no: ["nullite", "copie"].concat(D0 ? [] : ["requete", "dml"]),
        actes: GEN2.actesOptions(t, N, D0),
        dml: { garanties: [
          { id: "heberg", t: `Une attestation d'hébergement ${A.heberg ? `à ${A.adresse}` : "chez un proche"}, avec justificatif de domicile.`, needs: ["K_attest", "G_heberg"] },
          { id: "travail", t: A.emploi ? `Un emploi de ${A.metier} qui l'attend, attestation de l'employeur à l'appui.` : "Une promesse d'embauche écrite.", needs: ["K_promesse", "G_emploi"] },
          { id: "cj", t: "Un contrôle judiciaire strict (interdiction de contact, pointage, obligation de résider) répond à chacun des objectifs de l'article 144.", needs: null },
          { id: "duree", t: "La durée de la détention au regard de l'avancement de l'information.", needs: ["X_dp"] },
        ] },
        copie: PZ.listes.copie,
        joursPieces: PZ.jours || {}, // lot 7 : une pièce datée n'entre dans la copie qu'une fois faite
        chiffrage: { postes, art475: decede ? 3000 : 1800 },
      },
      flow: { tasks: PEN.tasks },
      on: {},
      audiences: {},
    };
    // ------------------------------------------------------------ Les appels et entretiens
    const ipcAdvice = [
      { id: "i_silence", t: "Devant le juge, demain ou tout à l'heure, vous pourrez garder le silence : on parlera quand on aura lu le dossier." },
      { id: "i_tout", t: "Racontez tout au juge, ça montrera votre bonne foi." },
    ];
    const topicsPerso = (pfx) => [
      { id: pfx + "_vie", q: "Parlez-moi de vous : où vivez-vous, avec qui, que faites-vous ?", a: [{ t: A.heberg ? `J'habite ${A.adresse}, ${t.mineur ? `chez ${A.proche.replace(/^s(on|a) /, "m$1 ")}` : `avec ${A.proche.replace(/^s(on|a) /, "m$1 ")}`}.` : "Je n'ai pas d'adresse fixe en ce moment.", f: "G_heberg" }, GEN2.PR.activite(GEN2.PR.voix(t, A, "prevenu"), A, pfx + "_em", { court: true })], cost: 3, tag: "good" },
      { id: pfx + "_casier", q: "Avez-vous déjà été condamné ?", a: [{ t: A.casier === 0 ? "Jamais." : t.rec ? "Oui. Une peine de prison, il y a quelques années." : `Une fois, ${M.casierAncien(A) || "il y a longtemps"}.`, f: "G_casier" }], cost: 2 },
    ];
    if (t.entree === "deferement") {
      def.calls.intake = Object.assign({
        label: "Permanence des défèrements",
        start: ["p_info", "p_oui", "p_non"], patience: 50, advice: false,
        onEnd: (api) => {
          const { s, cs } = api;
          if (cs.flags.accepte) {
            cs.status = "active"; cs.aj = true; cs.engaged = s.day; cs.lastUpdate = s.day;
            CR.unschedule(s, (ev) => ev.caseId === cs.id && ev.key === "_permanenceExpire");
            api.run("engaged", {});
            api.log(`Commission d'office : défèrement de ${nomA} devant le juge d'instruction.`);
          } else { CR.unschedule(s, (ev) => ev.caseId === cs.id); CR.closeCase(s, cs, { type: "declined", note: "Permanence refusée ; un confrère a pris le dossier." }); if (GEN2.VIE) GEN2.VIE.refusCommission(api); }
        },
      }, GEN2.PR.permanence(x, { mode: "defer", jiNom }));
      def.calls.depot = Object.assign({
        scene: "parloir", kind: "meet", label: "Entretien au dépôt", baseCost: 25,
        start: null, patience: 70, advice: false,
        onEnd: (api) => { api.cs.flags.depotVu = api.s.day; },
      }, GEN2.PR.infoDepot(x, { hm, notif: PZ.C.notif }));
      def.calls.depot.start = def.calls.depot.topics.map((z) => z.id);
      facts.G_notif = { label: "Ses droits lus longtemps après le début de la mesure", key: true };
      facts.G_camera_gav = { label: "« Il n'y avait pas de caméra »", key: true, why: "En matière criminelle, l'audition du gardé à vue est enregistrée (art. 64-1)." };
      facts.G_avocat_absent = { label: "L'avocat n'est arrivé que le troisième jour", key: true };
    } else if (D0) {
      def.calls.intake = Object.assign({ scene: "conference", kind: "meet", label: "Rendez-vous au cabinet", start: null, patience: 90 }, GEN2.PR.infoDefense(x, { famille, day: p.day, etab: def.proc.etab, jiNom }));
      if (famille) def.calls.intake.who = { nom: `${famille.prenom} ${famille.nom}`, look: CR.px && CR.px.clientLook ? CR.px.clientLook(famille) : undefined };
      else delete def.calls.intake.who;
      def.calls.intake.start = def.calls.intake.topics.map((z) => z.id);
      def.advice = [
        { id: "c_designation", t: t.entree === "convoc" ? "Je serai à vos côtés à l'interrogatoire de première comparution ; on prépare ensemble ce que vous direz." : "Il doit me désigner par une déclaration au greffe (art. 115) ; ensuite je demande la copie du dossier." },
        { id: "c_attest", t: "Réunissez une attestation d'hébergement et une promesse d'embauche : ce sont les garanties qui comptent devant le juge des libertés." },
        { id: "c_promesse", t: "Je vous promets qu'il sortira très vite." },
      ];
    } else {
      def.calls.intake = Object.assign({ scene: "conference", kind: "meet", label: "Rendez-vous au cabinet", start: null, patience: 100 }, GEN2.PR.infoVictime(x, { proc, decede, jiNom, day: p.day }));
      def.calls.intake.start = def.calls.intake.topics.map((z) => z.id);
      def.advice = [
        { id: "v_constitution", t: "Je vous constitue partie civile par une lettre au juge d'instruction : vous aurez accès au dossier et pourrez demander des actes (art. 87)." },
        { id: "v_pieces", t: "Gardez toutes les factures et faites établir un certificat par votre médecin : le préjudice se prouve." },
        { id: "v_presse", t: "Parlez à la presse, ça fera pression sur le juge." },
      ];
    }
    // Parloir (client détenu) et préparation
    def.calls.parloir = (api) => Object.assign({
      scene: "parloir", kind: "meet", label: `Parloir avocat · ${CR.PLACES[def.proc.etab] ? CR.PLACES[def.proc.etab].nom : "maison d'arrêt"}`, baseCost: 45,
      start: ["j_dossier", "j_prep", "j_cond", "j_attest", "j_promesse"], patience: 100, advice: false,
      onEnd: (a) => { const y = a.s.detenus.find((dd) => dd.caseId === a.cs.id); if (y) y.humeur = CR.clamp(y.humeur + 10, 0, 100); a.cs.vars.parloirs = (a.cs.vars.parloirs || 0) + 1; CR.updatedClient(a.s, a.cs, 1); },
    }, CAT.typoDeep(GEN2.PR.parloir(x, { n: api && api.cs ? api.cs.vars.parloirs || 0 : 0 })));
    // ------------------------------------------------------------ Actes rédigés propres à l'information
    const obsOptions = D0
      ? [{ t: "La défense sollicite un non-lieu : les charges ne sont pas suffisantes (art. 177).", ok: true, v: "nonlieu" }].concat(t.q2 ? [{ t: `La défense sollicite la requalification des faits en ${t.q2.label} (${t.q2.court})${t.q2.nature !== q.nature ? " et le renvoi devant le tribunal correctionnel (art. 179)" : ""}.`, ok: true, v: "requalif" }] : []).concat(t.f.psy === "aboli" ? [{ t: "La défense sollicite une ordonnance d'irresponsabilité pénale pour cause de trouble mental (art. 122-1 et 706-120).", ok: true, v: "irresp" }] : []).concat([{ t: "La défense s'en rapporte.", ok: false, v: "rapport", defect: "obs:rapport" }])
      : [{ t: `La partie civile demande la mise en accusation du chef de ${q.label} (${q.court}) et s'oppose à toute correctionnalisation.`, ok: true, v: "crime" }, { t: "La partie civile s'en rapporte sur la qualification.", ok: true, v: "rapport" }];
    def.tpls.observations_175 = (api) => ({
      title: "Observations après l'avis de fin d'information (art. 175)", kind: "courrier", time: 90, dirLabel: "Déposées",
      to: `${jiNom}, juge d'instruction`,
      slots: { qualif: CR.choiceSlot("Ce que vous demandez", obsOptions) },
      checks: [{ id: "points", label: "À l'appui", heading: D0 ? "La défense relève :" : "La partie civile relève :", options: enjeux.map((en) => ({ id: en.id, t: D0 ? en.label + "." : `Contre l'argument « ${en.label.toLowerCase()} », le dossier répond.`, ok: null, needs: "E_" + en.id })).concat(api.cs.proc.annules.length ? [{ id: "annul", t: "Les actes annulés par la chambre de l'instruction ne peuvent plus fonder les charges.", ok: null }] : []) }],
      body: [[`Monsieur le juge, en réponse à votre avis de fin d'information, ${D0 ? `la défense de ${nomA}` : `la partie civile, ${nom(C)},`} a l'honneur de présenter les observations suivantes. `, { s: "qualif" }]],
    });
    def.tpls.constitution_ji = () => ({
      title: "Constitution de partie civile devant le juge d'instruction", kind: "courrier", time: 30, dirLabel: "Envoyée",
      to: `${jiNom}, juge d'instruction, tribunal judiciaire de Paris`,
      slots: { voie: CR.choiceSlot("La voie", [
        { t: `L'information étant ouverte, ${nom(C)}${t.client === "P" && V.age < 18 ? `, agissant en qualité de représentant légal de ${nomV},` : ""} déclare se constituer partie civile par la présente lettre (art. 87).`, ok: true },
        { t: `${nom(C)} dépose plainte avec constitution de partie civile entre les mains du doyen des juges d'instruction (art. 85).`, ok: false, defect: "voie:doyen" },
      ]) },
      body: [["Monsieur le juge,"], [`J'assiste ${nom(C)}${t.client === "P" ? `, ${V.age < 18 ? "représentant légal" : P.lien} de ${nomV}` : ""}. `, { s: "voie" }]],
    });
    // lot 7 : le mémoire devant la chambre de l'instruction (art. 198, D. 592 ; dev/ref/actes-canaux.md) : en matière de
    // détention, jusqu'au jour de l'audience ; sinon, parvenu trois jours avant ; le dernier mémoire récapitule tous les moyens
    def.tpls.memoire_chins = (api) => {
      const ap = api.cs.vars.appelForme || {};
      const dp = ap.type === "dp";
      return {
        title: "Mémoire devant la chambre de l'instruction", kind: "acte", time: 60, dirLabel: "Rédigé",
        depot: TJ.caLieu, depotLabel: `Greffe de la chambre de l'instruction, ${TJ.ca} (dépôt visé, art. 198)`, depotTime: 20,
        slots: { recap: CR.choiceSlot("Les moyens", [
          { t: "Le présent mémoire récapitule l'ensemble des moyens soutenus au soutien de l'appel, y compris ceux de la déclaration d'appel.", ok: true },
          { t: "Le présent mémoire complète la déclaration d'appel : les moyens qui y sont développés sont maintenus et ne sont pas repris ici.", ok: false, defect: "recap:absent" },
        ]) },
        checks: [{ id: "points", label: "Les moyens", heading: D0 ? "La défense soutient :" : "La partie civile soutient :", options: dp
          ? [{ id: "garanties", t: "Les garanties de représentation produites (domicile, emploi, attaches) permettent un contrôle judiciaire." }, { id: "144", t: "Aucun des objectifs de l'article 144 n'impose la détention." }]
          : enjeux.filter((en) => en.effet !== "peine").map((en) => ({ id: en.id, t: D0 ? en.label + "." : `Contre l'argument « ${en.label.toLowerCase()} », le dossier répond.` })) }],
        body: [[`Pour ${D0 ? nomA : nom(C)}, appelant${D0 ? "" : "e"}, sur l'appel de l'ordonnance du juge d'instruction. `, { s: "recap" }]],
      };
    };
    def.tpls.appel_ordo = (api) => {
      const typ = api.cs.vars.appelOrdoType || "dp";
      const lib = { dp: "l'ordonnance de placement en détention provisoire", oma: "l'ordonnance de mise en accusation", ortc: "l'ordonnance de requalification et de renvoi", nonlieu: "l'ordonnance de non-lieu", irresp: "l'ordonnance d'irresponsabilité pénale", refus_actes: "l'ordonnance de refus d'actes" }[typ];
      return {
        title: `Déclaration d'appel de ${lib}`, kind: "acte", time: 20, dirLabel: "Rédigée",
        depot: TJ.lieu, depotLabel: "Greffe du juge d'instruction (déclaration d'appel, art. 502)", depotTime: 15,
        slots: { motif: CR.choiceSlot("Le motif", D0 ? [
          { t: typ === "dp" ? "Les objectifs de l'article 144 peuvent être atteints par un contrôle judiciaire ; la détention n'est ni nécessaire ni proportionnée." : "Les charges ne sont pas suffisantes et la qualification retenue ne correspond pas aux faits établis par l'information.", ok: true },
          { t: "Le juge a manqué d'impartialité.", ok: false, defect: "motif:vague" },
        ] : [
          { t: typ === "nonlieu" ? "L'information établit des charges suffisantes ; des actes restaient à accomplir." : "Les faits constituent un crime ; la correctionnalisation prive la victime de la cour d'assises.", ok: true },
          { t: "La partie civile demande une peine plus lourde.", ok: false, defect: "motif:peine" },
        ]) },
        body: [["Je soussigné, ", `Me ${api.s.player.nom}`, `, déclare interjeter appel, au nom de ${nom(C)}, de ${lib}. `, { s: "motif" }]],
      };
    };
    // ------------------------------------------------------------ Tâches propres au dossier
    def.tasks = function (api, T) {
      const { s, cs } = api;
      const pr = cs.proc;
      const V0 = cs.vars;
      const enInfo = ["information", "reglement", "enquete"].includes(pr.stade);
      if (t.entree === "deferement" && V0.ipcFait == null && cs.status === "active") {
        if (!cs.flags.dossierLu) T({ id: "lire", label: "Lire le dossier au cabinet du juge", sub: "Les procès-verbaux de la garde à vue, l'autopsie ou les certificats, le réquisitoire.", kind: "admin", time: 40, where: TJ.lieu, urgent: true, run: () => { CR.spend(s, 40, "admin"); cs.flags.dossierLu = s.day; for (const k of PZ.listes.ipc) if (!CR.hasDoc(cs, k)) api.doc(k, docTitles[k]); return null; } });
        if (!cs.flags.depotVu) T({ id: "depot", label: `S'entretenir avec ${A.prenom} au dépôt`, sub: "Avant l'interrogatoire de première comparution.", kind: "meet", time: 0, where: TJ.lieu, urgent: true, run: () => ({ scene: "call", call: "depot" }) });
      }
      // désignation (client détenu ou libre qui change d'avocat)
      if (D0 && ["detenu", "libre"].includes(t.entree) && !cs.flags.designe && !V0.lettreDesignation) T({ id: "designation", label: t.entree === "detenu" ? `Écrire à ${A.prenom} pour qu'il vous désigne (art. 115)` : `Faire désigner l'avocat par ${A.prenom} (art. 115)`, sub: "Sans désignation : ni permis de communiquer, ni copie du dossier.", kind: "admin", time: 15, urgent: true, run: () => { CR.spend(s, 15, "desk"); V0.lettreDesignation = s.day; api.schedule(t.entree === "detenu" ? R.int(s, 4, 7) : 1, "_designe"); api.tl("Déclaration de désignation transmise."); return null; } });
      // constitution de partie civile
      if (!D0 && !pr.pcConstituee && !V0.constitutionEnvoyee && enInfo) T({ id: "constitution_ji", label: `Constituer ${C.prenom} partie civile`, sub: "Une information est ouverte : par lettre au juge d'instruction.", kind: "draft", time: 30, urgent: true, run: () => ({ scene: "draft", tpl: "constitution_ji" }) });
      // copie du dossier
      const peutCopie = D0 ? (t.entree === "deferement" || t.entree === "convoc" ? V0.statut === "mex" || V0.statut === "ta" : cs.flags.designe) : pr.pcConstituee;
      if (peutCopie && pr.copieDemandee == null && enInfo) T({ id: "copie", label: "Demander la copie du dossier", sub: "Article 114. Pour le mis en examen, la date compte pour le délai des nullités.", kind: "admin", time: 10, run: () => { if (CR.EB && CR.libre && CR.libre(s)) return { scene: "ebarreau", objet: "Demande de copie du dossier" }; PEN.demanderCopie(api); return null; } });
      // préparation des interrogatoires
      const prochain = cs.hearings.find((h) => !h.attended && !h.missed && !h.canceled && h.day >= s.day && ["interro", "ipc_convoc"].includes(h.script));
      if (D0 && prochain && cs.flags.prepInterro == null && pr.detention.statut !== "dp") T({ id: "prep_interro", label: `Préparer ${A.prenom} à son interrogatoire`, sub: "Au cabinet : ce que dit le dossier, ce qu'il faut expliquer, ce qu'il vaut mieux taire.", kind: "meet", time: 60, run: () => { CR.spend(s, 60, "meet"); cs.flags.prepInterro = s.day; CR.updatedClient(s, cs, 1.5); api.tl(`${A.prenom} préparé${e(A)} à son interrogatoire.`); return null; } });
      // pièces de personnalité (garanties)
      if (D0 && enInfo) PEN.persoTasks(api, T, [
        { id: "attest", label: "Obtenir une attestation d'hébergement", sub: "Avec un justificatif de domicile.", fact: "K_attest", text: `Attestation d'hébergement de ${A.proche}, ${A.adresse}, justificatif de domicile joint.`, time: 20, cond: () => CR.hasFact(cs, "G_heberg") },
        { id: "promesse", label: "Chercher une promesse d'embauche", sub: "Par la famille, une entreprise du quartier.", fact: "K_promesse", text: "Promesse d'embauche écrite d'une entreprise de logistique, prise d'effet à la sortie.", time: 30, cond: () => !t.mineur },
      ]);
      // observations de l'article 175
      if (V0.avis175Day != null && !V0.reglement && !CR.drafted(cs, "observations_175") && (D0 ? V0.statut === "mex" : pr.pcConstituee)) T({ id: "obs175", label: "Rédiger les observations de l'article 175", sub: `Avant le ${CR.fmtDate(plan.obsLimite, "dowshort")}. Ce que vous demandez au juge, et pourquoi.`, kind: "draft", time: 90, urgent: s.day >= plan.obsLimite - 7, run: () => ({ scene: "draft", tpl: "observations_175" }) });
      // appels d'ordonnances
      const ap = V0.appelOuvert;
      if (ap && !CR.drafted(cs, "appel_ordo") && s.day <= ap.jusque + 3) T({ id: "appel_ordo", label: `Faire appel : ${ap.label}`, sub: "Déclaration au greffe, dans les dix jours. Comptez vous-même.", kind: "draft", time: 20, run: () => { V0.appelOrdoType = ap.type; return { scene: "draft", tpl: "appel_ordo" }; } });
      if (ap && ap.accepter && !V0.appelRenonce && !CR.drafted(cs, "appel_ordo")) T({ id: "accepter_ordo", label: `Ne pas faire appel (${ap.labelCourt})`, sub: ap.accepter, kind: "admin", time: 5, run: () => { V0.appelRenonce = s.day; api.tl(`Pas d'appel : ${ap.label}.`); api.run("_ordoDefinitive", { type: ap.type }); return null; } });
      // le mémoire pour la chambre de l'instruction, tant que l'audience n'a pas eu lieu
      const hChins = cs.hearings.find((h) => h.script === "chins" && !h.attended && !h.missed && !h.canceled && h.day >= s.day);
      if (hChins && !CR.drafted(cs, "memoire_chins")) T({ id: "memoire_chins", label: "Rédiger un mémoire pour la chambre de l'instruction", sub: `Audience le ${CR.fmtDate(hChins.day, "long")}. Article 198 : comptez vous-même le délai de dépôt.`, kind: "draft", time: 60, run: () => ({ scene: "draft", tpl: "memoire_chins" }) });
      // préparer le client au procès
      const a = pr.audience;
      if (a && a.day >= s.day && !cs.flags.prepClient) T({ id: "prep_proces", label: `Préparer ${C.prenom} au procès`, sub: D0 ? "La cour l'interrogera sur les faits et sur sa vie ; le dernier mot." : "Ce que la cour demandera, la déposition, le face-à-face.", kind: "meet", time: 0, where: pr.detention.statut === "dp" && D0 ? pr.detention.etab : "cabinet", run: () => { CR.spend(s, 90, "meet"); cs.flags.prepClient = s.day; CR.updatedClient(s, cs, 1.5); api.tl("Client préparé au procès."); return null; } });
      // chiffrage de la partie civile devant la cour
      if (!D0 && a && a.day >= s.day && !CR.drafted(cs, "constitution_pc") && pr.pcConstituee) T({ id: "chiffrage", label: "Rédiger les demandes de la partie civile et le chiffrage", sub: "Postes de préjudice, pièces, frais d'avocat.", kind: "draft", time: 90, run: () => ({ scene: "draft", tpl: "constitution_pc" }) });
    };
    // ------------------------------------------------------------ Le déroulé
    const O = def.on;
    O.arrive = function (api) {
      const { s, cs } = api;
      if (t.entree === "deferement") {
        CR.ringNow(s, { from: def.caller, caseId: cs.id, kind: "permanence", data: { call: "intake" }, vmText: "Maître, la permanence pénale. Un défèrement criminel au pôle de l'instruction, cet après-midi. Rappelez-nous vite." }, false);
        api.schedule(0, "_permanenceExpire", {}, Math.min(23 * 60 + 25, s.min + 50));
        return;
      }
      cs.status = "lead";
      const C0 = famille ? `${famille.prenom} ${famille.nom}` : nom(C);
      api.mail({ from: C0, subject: D0 ? (t.entree === "detenu" ? `${A.prenom} est en détention` : t.entree === "convoc" ? "Convocation chez le juge d'instruction" : "Changement d'avocat") : decede ? `La mort de ${nom(V)}` : "Besoin d'un avocat pour la partie civile", kind: "email", important: true, body: [[D0 ? (t.entree === "detenu" ? `Maître, ${A.prenom} est détenu${e(A)} depuis le ${D(t.d.dp)} pour ${CAT.INF[t.inf].nom.toLowerCase()}. Son avocat ne vient plus le voir. Pouvez-vous nous recevoir ?` : t.entree === "convoc" ? `Maître, je suis convoqué${e(A)} le ${D(t.d.ipc)} par ${jiNom}, juge d'instruction, « en vue d'une mise en examen » (art. 80-2). J'ai besoin d'un avocat.` : `Maître, je suis mis${e(A)} en examen pour ${CAT.INF[t.inf].nom.toLowerCase()} et je voudrais changer d'avocat.`) : `Maître, ${decede ? `${nom(V)} est mort${e(V)} le ${D(t.d.faits)}` : proc ? "mon enfant a été victime de faits graves" : `j'ai été victime de ${CAT.INF[t.inf].nom.toLowerCase()}`}. Un juge d'instruction est saisi. Pouvez-vous m'assister ?`]] });
      api.schedule(def.leadPatience, "_leadExpire");
    };
    O._permanenceExpire = function (api) {
      const { s, cs } = api;
      if (cs.status !== "lead") return;
      CR.rep(s, "confreres", -1, "permanence sans réponse");
      CR.closeCase(s, cs, { type: "lost-lead", note: "La permanence n'a pas pu vous joindre et a désigné un confrère." });
      s.voicemails = s.voicemails.filter((v) => v.caseId !== cs.id);
    };
    O.engaged = function (api) {
      const { s, cs } = api;
      if (cs.vars.engagedOnce) return;
      cs.vars.engagedOnce = s.day;
      const day = s.day;
      if (t.entree === "deferement") {
        const mIpc = Math.max(s.min + 120, 15 * 60);
        const jIpc = mIpc > 20 * 60 ? day + 1 : day;
        api.hearing({ day: jIpc, min: mIpc > 20 * 60 ? 10 * 60 : mIpc, title: `Interrogatoire de première comparution — ${jiNom}`, where: "Cabinet du juge d'instruction, tribunal judiciaire", lieu: TJ.lieu, script: "ipc", done: "apresIPC", onMiss: "_ipcSansVous", duree: 60 });
        CR.PROC.stade(api, "information", `Réquisitoire introductif ; information ouverte, ${jiNom} désigné${/^Mme/.test(jiNom) ? "e" : ""} (art. 80).`);
      } else if (t.entree === "convoc") {
        api.hearing({ day: t.d.ipc, min: 14 * 60, title: `Interrogatoire de première comparution — ${jiNom}`, where: "Cabinet du juge d'instruction, tribunal judiciaire", lieu: TJ.lieu, script: "ipc_convoc", done: "apresIPC", onMiss: "_ipcSansVous", duree: 60 });
        api.mail({ from: famille ? nom(famille) : nomA, subject: "La convocation du juge", kind: "email", body: [[`Voici la lettre du juge, maître : convocation le ${D(t.d.ipc)} à 14 heures, en vue d'une mise en examen (art. 80-2).`]] });
      } else if (t.entree === "pc") {
        for (const k of PZ.listes.client) api.doc(k, docTitles[k]);
      }
      if (t.entree === "detenu" || t.entree === "libre") { api.doc("ordo_dp", docTitles.ordo_dp); if (docs.pv_ipc) api.doc("pv_ipc", docTitles.pv_ipc); }
      api.run("_planifier", {});
      if (cs.advice.includes("c_promesse") || cs.advice.includes("i_tout")) CR.erreur(s, cs, { id: "promesse", texte: cs.advice.includes("c_promesse") ? "Vous avez promis une sortie rapide." : "Vous avez conseillé de tout dire au juge sans avoir lu le dossier.", sanction: "La confiance et la défense en pâtiront.", regul: "Ne jamais promettre ; lire le dossier avant de conseiller." });
      if (cs.advice.includes("v_presse")) CR.erreur(s, cs, { id: "presse", texte: "Vous avez conseillé à la partie civile de parler à la presse pendant l'information.", sanction: "Le secret de l'instruction et la sérénité des débats en souffrent ; cela peut se retourner contre la victime.", regul: "Réserver la parole au dossier." });
    };
    // Toutes les échéances de l'information, depuis le plan tiré
    O._planifier = function (api) {
      const { s, cs } = api;
      const day = s.day;
      const after = (d0) => d0 > day;
      if (after(plan.psy)) api.at(plan.psy, "_expertise", { k: "psy" }, 11 * 60);
      else if (cs.vars.statut === "mex" || t.camp === "pc") api.doc("expertise_psy", docTitles.expertise_psy);
      if (after(plan.ml)) api.at(plan.ml, "_expertise", { k: "tech" }, 11 * 60);
      plan.interros.forEach((d0, i) => { if (after(d0)) api.at(Math.max(day + 1, d0 - 8), "_convocInterro", { i, jour: d0 }, 9 * 60); });
      if (plan.confront != null && after(plan.confront)) api.at(Math.max(day + 1, plan.confront - 8), "_convocConfront", { jour: plan.confront }, 9 * 60);
      if (t.entree === "detenu" || (t.camp === "pc" && t.detenu)) for (const d0 of plan.prolong) if (after(d0)) api.at(Math.max(day + 1, d0 - 12), "_convocProlong", { jour: d0 }, 9 * 60);
      api.at(plan.avis175, "_avis175", {}, 10 * 60);
      // la personnalité
      if (after(t.d.mex + 40)) api.at(t.d.mex + 40, "_expertise", { k: "perso" }, 11 * 60); else if (cs.vars.statut === "mex") api.doc("personnalite", docTitles.personnalite);
    };
    O._designe = function (api) {
      const { s, cs } = api;
      cs.flags.designe = s.day;
      cs.vars.permisDemande = null;
      CR.PROC.event(api, "Désignation de l'avocat par la personne mise en examen (art. 115).");
      api.mail({ from: `Cabinet de ${jiNom}`, subject: "Désignation enregistrée", kind: "greffe", body: [[`La déclaration de ${nomA} vous désignant a été reçue (art. 115). Vous pouvez demander la copie du dossier${t.entree === "detenu" ? " et un permis de communiquer" : ""}.`]] });
    };
    // L'interrogatoire de première comparution manqué : un avocat de permanence y assiste ; la mise en examen et la détention suivent
    O._ipcSansVous = function (api) {
      const { s, cs } = api;
      if (cs.vars.ipcFait != null) return;
      CR.erreur(s, cs, { id: "ipc_absent", texte: "Vous n'étiez pas à l'interrogatoire de première comparution.", sanction: "Un avocat de permanence l'a assisté sans connaître le dossier ; vos observations sur la mise en examen n'ont pas été présentées.", regul: "Aucune pour cet acte." });
      cs.vars.ipcChoix = "silence";
      api.run("ipcDecider", { played: new Set() });
      api.run("apresIPC", {});
    };
    O.ipcDecider = function (api, { played }) {
      const { s, cs } = api;
      const charge = t.preuves.filter((k) => ["adn", "video", "saisie", "ecrits", "telephonie", "temoin"].includes(k)).length + (t.stance === "reconnait" ? 2 : 0);
      const argTA = played && played.has("arg:ta");
      const ta = argTA && charge <= 2 && R.chance(s, 0.65) || (!argTA && charge <= 0 && R.chance(s, 0.3));
      cs.vars.ipcFait = s.day;
      cs.vars.statut = ta ? "ta" : "mex";
      if (!ta) cs.proc.mex = s.day;
      api.doc("pv_ipc_live", flowTitles.pv_ipc_live);
      CR.PROC.event(api, ta ? "Interrogatoire de première comparution : témoin assisté (art. 113-1)." : `Interrogatoire de première comparution : mise en examen du chef de ${q.label} (art. 80-1).`);
      return [{ who: "ji", t: ta ? `Je considère que les indices ne sont pas, à ce stade, graves ou concordants : vous serez entendu${e(A)} en qualité de témoin assisté (art. 113-1). Vous ressortez libre de ce cabinet.` : `J'estime qu'il existe des indices graves ou concordants : je vous mets en examen du chef de ${q.label}.` }].concat(!ta && t.dpRequise ? [{ who: "ji", t: "Je saisis le juge des libertés et de la détention, comme le requiert le parquet. Le débat aura lieu dans l'heure." }] : !ta ? [{ who: "ji", t: "Je vous place sous contrôle judiciaire : obligation de résider à votre domicile, pointage hebdomadaire, interdiction de tout contact avec les parties." }] : []);
    };
    O.apresIPC = function (api) {
      const { s, cs } = api;
      CR.updatedClient(s, cs, 1);
      if (cs.vars.statut === "ta") { cs.vars.taDepuis = s.day; return; }
      if (t.dpRequise) {
        const h = Math.min(21 * 60, s.min + 60);
        api.hearing({ day: s.day, min: h, title: `Débat devant le juge des libertés et de la détention — ${jld.nom}`, where: "Tribunal judiciaire, cabinet du JLD", lieu: TJ.lieu, script: "jld", done: "apresJLD", onMiss: "_jldSansVous", duree: 40, noCall: true });
      } else if (cs.proc.detention.statut !== "cj") CR.PROC.detention(api, "cj", {});
      if (cs.vars.ipcFait && cs.vars.statut === "mex") api.doc("personnalite", docTitles.personnalite);
    };
    O._jldSansVous = function (api) { api.run("jldDecider", { played: new Set() }); api.run("apresJLD", {}); };
    O.jldDecider = function (api, { played }) {
      const { s, cs } = api;
      const g = ["K_attest", "K_promesse", "G_heberg", "G_emploi"].filter((f0) => CR.hasFact(cs, f0) || (played && played.has(f0))).length * 0.6 + (played && played.has("arg:garanties") ? 0.6 : 0) + (played && played.has("arg:cj") ? 0.4 : 0);
      const res = CR.ACT.jld(api, { garanties: g, criteres: crime ? 2 : 1, gravite: crime ? 0.8 + (I.gravite || 0.7) * 0.15 : 0.55, argument144: played && played.has("arg:144") });
      const dec = t.mineur && res.decision === "dp" && R.chance(s, 0.35) ? "cj" : res.decision;
      cs.vars.jldDecision = dec;
      cs.vars.jldDay = s.day;
      api.doc("ordo_dp_live", flowTitles.ordo_dp_live);
      api.aj("jld", "Débat devant le JLD");
      if (dec === "dp") {
        CR.PROC.detention(api, "dp", { etab: def.proc.etab });
        cs.vars.dpDepuis = s.day;
        cs.vars.appelOuvert = { type: "dp", label: "l'ordonnance de placement en détention", labelCourt: "détention", jusque: CR.rollForward(s.day + 10), accepter: null };
        api.at(CR.rollForward(s.day + 11), "_finAppelOrdo", { type: "dp" }, 18 * 60);
        // le plan de l'information suit la détention : des débats de prolongation avant chaque échéance
        const dpm = CAT.dpMax(q, t.ageFaits, t.bo);
        let ech = s.day + dpm.initial;
        while (ech <= plan.reglement + 2) { api.at(Math.max(s.day + 1, ech - 18), "_convocProlong", { jour: CR.rollForward(ech - 6) > ech ? ech - 8 : CR.rollForward(ech - 6) }, 9 * 60); ech += dpm.pas; }
        return [{ who: "jld", t: `Je vous place en détention provisoire : c'est l'unique moyen ${pk(r, ["d'empêcher une pression sur les témoins", "d'éviter une concertation frauduleuse avec les coauteurs", "de garantir votre maintien à la disposition de la justice", "de mettre fin au trouble exceptionnel causé à l'ordre public"])} (art. 144).` }, { who: "sys", t: `(${A.prenom} baisse la tête. Les gendarmes de l'escorte s'approchent.)` }];
      }
      CR.PROC.detention(api, dec, {});
      return [{ who: "jld", t: `Je ne vous place pas en détention. Vous serez sous ${dec === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"}, avec interdiction d'entrer en contact avec ${V ? "la victime et les témoins" : "les autres mis en cause"}.` }, { who: "sys", t: `(${A.prenom} ferme les yeux. Il respire, enfin.)` }];
    };
    O.apresJLD = function (api) { CR.updatedClient(api.s, api.cs, 1); };
    // Expertises déposées
    O._expertise = function (api, { k }) {
      const { s, cs } = api;
      if (k === "psy") { api.doc("expertise_psy", docTitles.expertise_psy); api.mail({ from: `Cabinet de ${jiNom}`, subject: "Dépôt du rapport d'expertise psychiatrique", kind: "greffe", body: [["Le rapport d'expertise psychiatrique a été déposé. Les parties disposent d'un délai pour présenter des observations ou demander une contre-expertise (art. 167)."]] }); }
      else if (k === "perso") { if (!CR.hasDoc(cs, "personnalite")) api.doc("personnalite", docTitles.personnalite); }
      else { for (const kk of ["balistique", "toxico", "expertise_tech", "rapport_adn"]) if (docs[kk] && !CR.hasDoc(cs, kk) && PZ.listes.instruction.includes(kk)) api.doc(kk, docTitles[kk]); }
    };
    // Interrogatoires au fond (convocation de l'avocat cinq jours ouvrables avant, art. 114)
    O._convocInterro = function (api, { i, jour }) {
      const { cs } = api;
      if (cs.vars.statut === "ta" && R.chance(api.s, 0.5)) return;
      const qui = D0 ? nomA : nom(C);
      api.hearing({ day: jour, min: 14 * 60, title: D0 ? `Interrogatoire de ${nomA} — ${jiNom}` : `Audition de la partie civile — ${jiNom}`, where: "Cabinet du juge d'instruction", lieu: TJ.lieu, script: "interro", done: "apresInterro", duree: 80, idx: i });
      api.mail({ from: `Cabinet de ${jiNom}`, subject: "Convocation de l'avocat (art. 114)", kind: "greffe", body: [[`Vous êtes convoqué pour ${D0 ? "l'interrogatoire" : "l'audition"} de ${qui}, le ${CR.fmtDate(jour, "dow")} à 14 heures. Le dossier est à votre disposition au cabinet quatre jours ouvrables avant.`]] });
    };
    O.apresInterro = function (api) { const { s, cs } = api; cs.vars.interros = (cs.vars.interros || 0) + 1; if (D0) api.doc("pv_interro", flowTitles.pv_interro); CR.updatedClient(s, cs, 1); };
    O._convocConfront = function (api, { jour }) {
      api.hearing({ day: jour, min: 10 * 60, title: `Confrontation — ${jiNom}`, where: "Cabinet du juge d'instruction", lieu: TJ.lieu, script: "confront", done: "apresConfront", duree: 90 });
      api.mail({ from: `Cabinet de ${jiNom}`, subject: "Confrontation", kind: "greffe", body: [[`Confrontation entre ${nomA} et ${V && !decede ? nomV : nom(t.T)} le ${CR.fmtDate(jour, "dow")} à 10 heures.`]] });
    };
    O.apresConfront = function (api) {
      const { s, cs } = api;
      CR.updatedClient(s, cs, 1);
      // lot 7 : la confrontation jouée a son procès-verbal ; deux concessions du témoin renforcent le moyen d'identification
      const V = cs.vars.confront;
      if (V && V.joue) {
        api.doc("pv_confront", flowTitles.pv_confront);
        if ((V.concessions || []).length >= 2 && enjeux.some((en) => en.id === "identification")) (cs.vars.renfort = cs.vars.renfort || {}).identification = true;
      }
    };
    // Détention : débats de prolongation
    O._convocProlong = function (api, { jour }) {
      const { cs } = api;
      if (cs.proc.detention.statut !== "dp" || cs.vars.reglement) return;
      if (cs.hearings.some((h) => h.script === "prolong" && h.day === jour)) return;
      api.hearing({ day: jour, min: 14 * 60 + 30, title: `Débat de prolongation de la détention — ${jld.nom}`, where: "Tribunal judiciaire, cabinet du JLD", lieu: TJ.lieu, script: "prolong", done: "apresProlong", onMiss: "_prolongSansVous", duree: 45 });
      if (D0) api.mail({ from: `Cabinet de ${jiNom}`, subject: "Débat sur la prolongation de la détention", kind: "greffe", body: [[`La détention de ${nomA} arrive à son terme. Le juge des libertés et de la détention est saisi aux fins de prolongation ; débat le ${CR.fmtDate(jour, "dow")} à 14 h 30 (art. ${crime ? "145-2" : "145-1"}).`]] });
    };
    O._prolongSansVous = function (api) { api.run("prolongDecider", { played: new Set() }); };
    O.prolongDecider = function (api, { played }) {
      const { s, cs } = api;
      const dur = s.day - (cs.proc.detention.since != null ? cs.proc.detention.since : s.day);
      const g = ["K_attest", "K_promesse", "G_heberg", "G_emploi"].filter((f0) => CR.hasFact(cs, f0) || (played && played.has(f0))).length * 0.6 + (played && played.has("arg:duree") ? 0.5 + dur / 900 : 0) + (played && played.has("arg:garanties") ? 0.4 : 0);
      const res = CR.ACT.jld(api, { garanties: D0 ? g : 0, criteres: crime ? 2 : 1, gravite: crime ? 0.85 : 0.6, argument144: played && played.has("arg:144") });
      cs.vars.prolongDecision = res.decision;
      api.doc("ordo_prolong", flowTitles.ordo_prolong);
      if (res.decision === "dp") return [{ who: "jld", t: "Je prolonge la détention : les objectifs de l'article 144 ne peuvent être atteints autrement à ce stade." }];
      CR.PROC.detention(api, res.decision, {});
      if (D0) api.mail({ from: famille ? nom(famille) : nomA, subject: "Il est sorti", kind: "sms", body: [[`${A.prenom} est sorti${e(A)} ce soir. Merci, maître.`]] });
      return [{ who: "jld", t: `Je ne prolonge pas : ${nomA} sera remis${e(A)} en liberté sous ${res.decision === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"}.` }];
    };
    O.apresProlong = function (api) { CR.updatedClient(api.s, api.cs, 1); };
    // Demande de mise en liberté (gabarit commun) : décision du JLD, puis
    O.libere = function (api) { if (D0) api.mail({ from: famille ? nom(famille) : nomA, subject: "Libéré", kind: "sms", body: [[`${A.prenom} est rentré${e(A)}. Merci, maître.`]] }); };
    // Demande d'actes
    O.reponseActes = function (api, dd) {
      const { s, cs } = api;
      const picks = dd.picks || [];
      const prof = api.profil("ji") || CR.PROFILS.formaliste;
      const acc = [], ref = [];
      for (const id of picks) {
        const opt = def.penal.actes.find((o0) => o0.id === id);
        if (!opt) continue;
        if (opt.ok === false) { ref.push(opt.refus || "un acte que la partie n'a pas qualité à demander"); continue; }
        const p0 = (dd.motive ? 0.75 : 0.35) + (prof === CR.PROFILS.curieux ? 0.1 : prof === CR.PROFILS.severe ? -0.2 : 0);
        if (R.chance(s, p0)) acc.push(opt); else ref.push(opt.t.replace(/\.$/, "").toLowerCase());
      }
      cs.vars.actesOrdonnes = (cs.vars.actesOrdonnes || []).concat(acc.map((o0) => o0.id));
      for (const o0 of acc) if (o0.effet) api.run("_effetActe", { id: o0.id });
      api.mail({ from: `Cabinet de ${jiNom}`, subject: "Ordonnance sur demande d'actes", kind: "greffe", important: true, body: [[acc.length ? `Faisant droit à la demande, ordonnons : ${acc.map((o0) => o0.t.replace(/\.$/, "").replace(/^(Une|Un|La|Le|L')\s?/, (m0) => m0.toLowerCase())).join(" ; ")}.` : "Rejetons la demande d'actes."], ref.length ? [`Rejetons le surplus (${ref.join(" ; ")}) : ${dd.motive ? "ces actes ne sont pas utiles à la manifestation de la vérité" : "la demande n'est pas motivée"}. Appel possible devant la chambre de l'instruction (art. 186-1).`] : [""]] });
    };
    O._effetActe = function (api, { id }) {
      const { s, cs } = api;
      const opt = def.penal.actes.find((o0) => o0.id === id);
      if (!opt || !opt.effet) return;
      const en = opt.effet.enjeu && enjeux.find((z) => z.id === opt.effet.enjeu);
      if (opt.effet.doc === "contre_expertise") {
        const gagne = en ? (en.fort ? R.chance(s, 0.75) : R.chance(s, 0.2)) : R.chance(s, 0.25);
        cs.vars.renfort = cs.vars.renfort || {};
        if (gagne && en) cs.vars.renfort[en.id] = true;
        cs.vars.contreObjet = opt.t.replace(/\.$/, "");
        cs.vars.contreResultat = gagne ? `Les contre-experts rejoignent la défense sur un point décisif : ${en ? en.label.toLowerCase() : "les conclusions initiales sont nuancées"}.` : "Les contre-experts confirment les conclusions de la première expertise.";
        if (opt.effet.enjeu === "aboli" || opt.effet.enjeu === "altere") cs.vars.contreResultat = gagne ? (t.f.psy === "aboli" ? "Le collège confirme l'abolition du discernement au moment des faits." : "Le collège retient une altération du discernement au moment des faits (art. 122-1, al. 2).") : "Le collège ne retient ni abolition ni altération du discernement.";
        api.at(CR.rollForward(s.day + R.int(s, 45, 80)), "_depotContre", {}, 11 * 60);
      } else if (opt.effet.doc === "reconstitution") api.at(CR.rollForward(s.day + R.int(s, 30, 60)), "_docFlow", { k: "reconstitution" }, 10 * 60);
      else if (opt.effet.hearing === "confront" && !cs.hearings.some((h) => h.script === "confront" && !h.attended && !h.missed)) { const j = CR.rollForward(s.day + R.int(s, 15, 30)); if (j < plan.avis175 - 3) api.run("_convocConfront", { jour: j }); }
    };
    O._depotContre = function (api) { api.doc("contre_expertise", flowTitles.contre_expertise); api.mail({ from: `Cabinet de ${jiNom}`, subject: "Dépôt du rapport de contre-expertise", kind: "greffe", body: [["Le rapport de contre-expertise est déposé au dossier (art. 167)."]] }); };
    O._docFlow = function (api, { k }) { api.doc(k, flowTitles[k]); };
    // Requête en nullité devant la chambre de l'instruction (gabarit commun)
    O.apresRequete = function (api) { api.schedule(R.int(api.s, 30, 55), "_arretNullites"); CR.PROC.event(api, "Requête en nullité transmise à la chambre de l'instruction (art. 173)."); };
    O._arretNullites = function (api) {
      const { s, cs } = api;
      const res = CR.PROC.statuerNullites(api, CR.PROFILS.formaliste);
      const lignes = res.map((m) => { const an = CR.PROC.anomalie(cs, m.flag); const ir = an ? CR.IRREG[an.irreg] : null; return m.decision === "annule" ? `Annule : ${ir ? ir.label.toLowerCase() : "l'acte visé"} ; ${ir ? ir.effet.toLowerCase() : ""}.` : m.decision === "irrecevable" ? `Déclare irrecevable le moyen : ${m.motif}.` : `Rejette le moyen tiré de ${ir ? ir.label.toLowerCase() : "l'irrégularité invoquée"}.`; });
      cs.vars.arretChins = ["La chambre de l'instruction, statuant sur la requête en nullité :"].concat(lignes);
      api.doc("arret_chins", flowTitles.arret_chins);
      api.mail({ from: "Greffe de la chambre de l'instruction", subject: "Arrêt sur la requête en nullité", kind: "greffe", important: true, body: cs.vars.arretChins.map((l) => [l]) });
    };
    // Fin d'information, règlement
    O._avis175 = function (api) {
      const { s, cs } = api;
      if (cs.vars.avis175Day != null) return;
      cs.vars.avis175Day = s.day;
      CR.PROC.stade(api, "reglement", "Avis de fin d'information (art. 175).");
      api.doc("avis175", flowTitles.avis175);
      api.mail({ from: `Cabinet de ${jiNom}`, subject: "Avis de fin d'information (art. 175)", kind: "greffe", important: true, body: [[`L'information me paraît terminée. Délai pour vos observations et demandes : ${t.detenu || t.dpRequise ? "un mois" : "trois mois"}.`]] });
      api.oblig({ id: "obs175", label: "Observations de l'article 175", due: plan.obsLimite, silent: true, onMiss: "_noop" });
      api.at(Math.max(s.day + 31, plan.reglement), "_reglement", {}, 11 * 60);
    };
    O.filed_observations_175 = function (api, { res }) { const { cs } = api; cs.vars.obs175 = { v: res.filled.qualif, points: res.picks.points || [], defects: res.defects, day: api.s.day }; api.satisfy("obs175"); };
    O._reglement = function (api) {
      const { s, cs } = api;
      if (cs.vars.reglement) return;
      const obs = cs.vars.obs175 && cs.vars.obs175.day <= plan.obsLimite ? cs.vars.obs175 : { v: null, points: [] };
      const spec = chargesSpec(api, { instruction: true });
      let charge = 0;
      for (const [k, pc] of Object.entries(spec.pieces)) if (pc.sens === "charge" && !CR.PROC.annule(cs, k)) charge += pc.force;
      let decharge = 0;
      for (const en of enjeux) if (en.effet === "acquit" && (obs.points.includes(en.id) || (en.fort && R.chance(s, 0.25)))) decharge += en.fort || (cs.vars.renfort && cs.vars.renfort[en.id]) ? 0.32 : 0.06;
      let type, qual = "q", jur = t.jur;
      const irresp = t.f.psy === "aboli" || (cs.vars.renfort && cs.vars.renfort.aboli);
      if (irresp && (D0 ? true : R.chance(s, 0.8))) type = "irresp";
      else if (charge - decharge < 0.32 + (obs.v === "nonlieu" ? 0.06 : 0)) type = "nonlieu";
      else {
        type = "oma";
        if (t.q2) {
          const en = enjeux.find((z) => z.id === requalifEnjeu);
          const pousse = D0 ? obs.v === "requalif" || obs.points.includes(requalifEnjeu) : obs.v === "crime" ? -1 : 0;
          const p0 = (en && (en.fort || (cs.vars.renfort && cs.vars.renfort[en.id])) ? 0.55 : 0.12) + (pousse > 0 ? 0.25 : pousse < 0 ? -0.2 : 0) + (q.nature === "crime" && t.q2.nature !== "crime" ? 0.1 : 0);
          if (R.chance(s, CR.clamp(p0, 0.03, 0.9))) qual = "q2";
        }
        const qq = qual === "q2" ? t.q2 : q;
        jur = CAT.juridictionCrime(qq, t.ageFaits);
        if (qq.nature !== "crime") type = "ortc";
      }
      cs.vars.reglement = { type, qual, jur, day: s.day };
      cs.vars.dpAuReglement = cs.proc.detention.statut === "dp";
      CR.PROC.stade(api, "reglement", { irresp: "Ordonnance d'irresponsabilité pénale pour cause de trouble mental.", nonlieu: "Ordonnance de non-lieu.", oma: `Ordonnance de mise en accusation devant ${CAT.JUR_LABEL[jur]}.`, ortc: `Ordonnance de renvoi devant ${CAT.JUR_LABEL[jur]}.` }[type]);
      api.doc("ordo_reglement", flowTitles.ordo_reglement);
      api.mail({ from: `Cabinet de ${jiNom}`, subject: { irresp: "Ordonnance d'irresponsabilité pénale", nonlieu: "Ordonnance de non-lieu", oma: "Ordonnance de mise en accusation", ortc: "Ordonnance de renvoi" }[type], kind: "greffe", important: true, doc: "ordo_reglement", title: flowTitles.ordo_reglement });
      // l'appel possible, selon le camp : défense (mise en accusation, renvoi), partie civile (non-lieu, irresponsabilité, renvoi)
      const ouvert = D0 ? ["oma", "ortc"].includes(type) : ["nonlieu", "irresp", "ortc"].includes(type);
      if (ouvert) {
        cs.vars.appelOuvert = { type, label: { oma: "l'ordonnance de mise en accusation", ortc: "l'ordonnance de renvoi", nonlieu: "l'ordonnance de non-lieu", irresp: "l'ordonnance d'irresponsabilité" }[type], labelCourt: type, jusque: CR.rollForward(s.day + 10), accepter: type === "ortc" ? (D0 ? "Le tribunal correctionnel ; une peine encourue bien moindre. Le tribunal ne pourra plus se déclarer incompétent (art. 469)." : "Un procès plus rapide devant le tribunal correctionnel, mais sans la cour d'assises.") : type === "oma" ? "Le procès aura lieu devant la cour ; l'ordonnance purge les nullités." : "L'information est close ; seule une charge nouvelle pourrait la rouvrir." };
      }
      // le parquet peut aussi faire appel d'un non-lieu ou d'une correctionnalisation
      const pqAppel = D0 && ["nonlieu", "ortc"].includes(type) && R.chance(s, type === "nonlieu" ? 0.35 : 0.15);
      cs.vars.appelParquetReglement = pqAppel;
      api.at(CR.rollForward(s.day + 11), "_finAppelOrdo", { type }, 18 * 60);
    };
    O.filed_constitution_ji = function (api, { res }) {
      const { s, cs } = api;
      cs.vars.constitutionEnvoyee = s.day;
      if (res.defects.includes("voie:doyen")) { CR.erreur(s, cs, { id: "constitution_doyen", texte: "Plainte avec constitution adressée au doyen alors qu'une information était ouverte.", sanction: "Dix jours perdus, et une consignation inutile.", regul: "Une lettre au juge d'instruction suffisait (art. 87)." }); api.schedule(10, "_constituee"); return; }
      api.run("_constituee", {});
    };
    O._constituee = function (api) {
      const { cs } = api;
      cs.proc.pcConstituee = true;
      CR.PROC.event(api, `Constitution de partie civile de ${nom(C)} (art. 87).`);
      api.mail({ from: `Cabinet de ${jiNom}`, subject: "Constitution de partie civile", kind: "greffe", body: [[`Nous avons reçu la constitution de partie civile de ${nom(C)}${proc ? `, au nom de ${nomV}` : ""}. ${proc ? "Un administrateur ad hoc a été désigné pour l'enfant (art. 706-50) ; il vous sera associé." : "Elle sera entendue prochainement ; vous serez convoqué."}`]] });
    };
    O.filed_appel_ordo = function (api, { depot }) {
      const { s, cs } = api;
      if (!depot) return;
      const ap = cs.vars.appelOuvert;
      if (!ap) return;
      if (s.day > ap.jusque) { CR.erreur(s, cs, { id: "appel_ordo_tardif", texte: `Appel de ${ap.label} formé après le délai de dix jours.`, sanction: "Irrecevable.", regul: "Aucune." }); return; }
      cs.vars.appelForme = { type: ap.type, day: s.day, motif: !CR.hasDefect(cs, "appel_ordo", "motif:") };
      cs.vars.appelOuvert = null;
      api.cancel("_finAppelOrdo");
      CR.PROC.event(api, `Appel de ${ap.label} devant la chambre de l'instruction (art. 186).`);
      api.hearing({ day: CR.rollForward(s.day + (ap.type === "dp" ? 8 : R.int(s, 25, 40))), min: 14 * 60, title: "Chambre de l'instruction — audience", where: `${TJ.ca}, ${TJ.caSub}`, lieu: TJ.caLieu, script: "chins", done: "apresChins", onMiss: "_chinsSansVous", duree: 45 });
    };
    O.filed_memoire_chins = function (api, { res, depot }) {
      const { s, cs } = api;
      if (depot === false) return;
      const d = CR.drafted(cs, "memoire_chins");
      const h = cs.hearings.find((x) => x.script === "chins" && !x.attended && !x.canceled);
      const ap = cs.vars.appelForme || {};
      const jour = (d && d.deposeDay) != null ? d.deposeDay : s.day;
      const limite = h ? (ap.type === "dp" ? h.day : h.day - 3) : null;
      const recap = !(res && (res.defects || []).includes("recap:absent")) && !CR.hasDefect(cs, "memoire_chins", "recap:");
      const points = ((res && res.picks && res.picks.points) || (d && d.picks && d.picks.points) || []).slice();
      if (limite != null && jour > limite) {
        cs.vars.memoire = { recevable: false };
        CR.erreur(s, cs, { id: "memoire_tardif", texte: `Mémoire déposé le ${CR.fmtDate(jour, "long")}, pour une audience le ${CR.fmtDate(h.day, "long")}.`, sanction: ap.type === "dp" ? "Hors délai : en matière de détention, le mémoire doit être déposé au plus tard le jour de l'audience (art. 198)." : "Hors délai : le mémoire doit parvenir au greffe trois jours au moins avant l'audience (art. 198) ; la chambre n'en tient pas compte.", regul: "Plaider à l'audience." });
        return;
      }
      cs.vars.memoire = { recevable: true, recap, points, day: jour };
      if (!recap && cs.vars.appelForme) { cs.vars.appelForme.motif = false; CR.erreur(s, cs, { id: "memoire_recap", texte: "Le mémoire ne récapitule pas les moyens de la déclaration d'appel.", sanction: "Les moyens non repris dans le dernier mémoire sont réputés abandonnés (art. 198).", regul: "Déposer, dans le délai, un mémoire récapitulatif." }); }
      CR.PROC.event(api, "Mémoire déposé devant la chambre de l'instruction (art. 198).");
    };
    O._chinsSansVous = function (api) { api.run("chinsDecider", { played: new Set() }); api.run("apresChins", {}); };
    O.chinsDecider = function (api, { played }) {
      const { s, cs } = api;
      const ap = cs.vars.appelForme || {};
      const pl = played || new Set();
      let lignes = [];
      if (ap.type === "dp") {
        const M = cs.vars.memoire && cs.vars.memoire.recevable ? cs.vars.memoire : null; // le mémoire plaide même sans l'avocat
        const g = ["K_attest", "K_promesse", "G_heberg", "G_emploi"].filter((f0) => CR.hasFact(cs, f0) || pl.has(f0)).length * 0.6 + (pl.has("arg:garanties") || (M && M.points.includes("garanties")) ? 0.5 : 0);
        const res = CR.ACT.jld(api, { garanties: g, criteres: crime ? 2 : 1, gravite: crime ? 0.85 : 0.6, argument144: pl.has("arg:144") || !!(M && M.points.includes("144")) });
        if (res.decision === "dp") lignes = ["La chambre de l'instruction confirme l'ordonnance de placement en détention provisoire."];
        else { CR.PROC.detention(api, res.decision, {}); lignes = [`La chambre de l'instruction infirme l'ordonnance et place ${nomA} sous ${res.decision === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"}.`]; }
      } else {
        const R0 = cs.vars.reglement;
        const en = enjeux.find((z) => z.id === requalifEnjeu);
        const Mm = cs.vars.memoire && cs.vars.memoire.recevable ? cs.vars.memoire : null;
        const fortPlaide = enjeux.some((z) => (pl.has("arg:" + z.id) || pl.has("E_" + z.id) || (Mm && Mm.points.includes(z.id))) && (z.fort || (cs.vars.renfort && cs.vars.renfort[z.id])));
        const infirme = R.chance(s, CR.clamp(0.18 + (fortPlaide ? 0.25 : 0) + (ap.motif ? 0 : -0.1), 0.05, 0.6));
        if (!infirme) lignes = ["La chambre de l'instruction confirme l'ordonnance entreprise."];
        else if (D0 && R0.type === "oma" && t.q2) { R0.qual = "q2"; R0.jur = CAT.juridictionCrime(t.q2, t.ageFaits); R0.type = t.q2.nature === "crime" ? "oma" : "ortc"; lignes = [`La chambre de l'instruction infirme : les faits sont requalifiés en ${t.q2.label} et ${nomA} est renvoyé${e(A)} devant ${CAT.JUR_LABEL[R0.jur]}.`]; }
        else if (D0 && R0.type === "oma") { R0.type = "nonlieu"; lignes = ["La chambre de l'instruction infirme : il n'existe pas de charges suffisantes ; non-lieu."]; }
        else if (D0 && R0.type === "ortc") { lignes = ["La chambre de l'instruction confirme le renvoi devant le tribunal correctionnel."]; }
        else if (!D0 && ["nonlieu", "irresp"].includes(R0.type)) { R0.type = "oma"; R0.qual = "q"; R0.jur = t.jur; lignes = [`La chambre de l'instruction infirme et ordonne la mise en accusation de ${nomA} devant ${CAT.JUR_LABEL[t.jur]}.`]; }
        else if (!D0 && R0.type === "ortc") { R0.type = "oma"; R0.qual = "q"; R0.jur = t.jur; lignes = [`La chambre de l'instruction infirme l'ordonnance de requalification : ${nomA} est mis${e(A)} en accusation du chef de ${q.label} devant ${CAT.JUR_LABEL[t.jur]}.`]; }
        if (en && infirme) cs.vars.renfort = Object.assign(cs.vars.renfort || {}, {});
      }
      cs.vars.arretChins = lignes;
      api.doc("arret_chins", flowTitles.arret_chins);
      return lignes.map((l) => ({ who: "president", t: l }));
    };
    O.apresChins = function (api) {
      const { cs } = api;
      const ap = cs.vars.appelForme || {};
      cs.vars.appelForme = null;
      if (ap.type && ap.type !== "dp") api.run("_ordoDefinitive", { type: cs.vars.reglement.type });
    };
    // Le délai d'appel expire : l'ordonnance devient définitive
    O._finAppelOrdo = function (api, { type }) {
      const { s, cs } = api;
      const ap = cs.vars.appelOuvert;
      if (ap && ap.type === type) cs.vars.appelOuvert = null;
      if (type === "dp") return;
      if (cs.vars.appelForme) return;
      if (cs.vars.appelParquetReglement) {
        cs.vars.appelParquetReglement = false;
        cs.vars.appelForme = { type, day: s.day, motif: true, parquet: true };
        api.mail({ from: "Parquet général", subject: "Appel du ministère public", kind: "greffe", important: true, body: [[`Le procureur de la République interjette appel de l'ordonnance de ${type === "nonlieu" ? "non-lieu" : "renvoi"} (art. 185).`]] });
        api.hearing({ day: CR.rollForward(s.day + R.int(s, 25, 40)), min: 14 * 60, title: "Chambre de l'instruction — appel du parquet", where: `${TJ.ca}, ${TJ.caSub}`, lieu: TJ.caLieu, script: "chins", done: "apresChins", onMiss: "_chinsSansVous", duree: 45 });
        return;
      }
      if (!cs.vars.appelRenonce) api.run("_ordoDefinitive", { type: cs.vars.reglement.type });
    };
    O._ordoDefinitive = function (api) {
      const { s, cs } = api;
      if (cs.vars.ordoDefinitive) return;
      cs.vars.ordoDefinitive = s.day;
      const R0 = cs.vars.reglement;
      if (R0.type === "nonlieu" || R0.type === "irresp") {
        if (cs.proc.detention.statut === "dp" || cs.proc.detention.statut === "cj" || cs.proc.detention.statut === "arse") CR.PROC.detention(api, "libre", {});
        if (cs.aj) api.aj(crime ? "instruction_crim" : "instruction");
        CR.closeCase(s, cs, D0 ? { type: "non_lieu", detail: R0.type === "irresp" ? "irresponsabilité pénale pour cause de trouble mental" : "charges insuffisantes" } : { type: "deboute", detail: R0.type === "irresp" ? "irresponsabilité pénale de l'auteur" : "non-lieu" });
        return;
      }
      api.run("_fixerProces", {});
    };
    O._fixerProces = function (api) {
      const { s, cs } = api;
      if (cs.proc.audience) return;
      const R0 = cs.vars.reglement;
      const jur = R0.jur;
      cs.vars.jurProces = jur;
      let day = Math.max(plan.proces, CR.rollForward(s.day + 45));
      if (["tc", "tpe"].includes(jur)) { day = CR.rollForward(s.day + R.int(s, 40, 75)); while (CR.dow(day) !== 3 || !CR.isBusinessDay(day)) day++; }
      else while (CR.dow(day) !== 1 || !CR.isBusinessDay(day)) day++;
      if (cs.proc.detention.statut === "dp" && day > R0.day + 360) day = CR.rollForward(R0.day + 330);
      api.setActor("president", presDe(jur) || t.pres);
      if (!["tc", "tpe"].includes(jur)) api.setActor("parquet", "pq_ag");
      const mode = R0.type === "oma" ? "oma" : "ordonnance";
      CR.PROC.fixAudience(api, { day, min: ["tc", "tpe"].includes(jur) ? 13 * 60 + 30 : 9 * 60 + 30, juridiction: jur, mode, convocDay: s.day, president: presDe(jur), where: titreJur(jur), script: "proces", done: "apresProces", onMiss: "_procesSansVous", title: `${titreJur(jur)} — procès de ${nomA}`, duree: ["tc", "tpe"].includes(jur) ? 120 : jur === "ccd" || jur === "assises_spe" ? 360 : 420, lieu: TJ.paris || jur === "assises_appel" ? CR.PROC.JURIDICTIONS[jur].lieu : TJ.lieu });
      CR.PROC.stade(api, "jugement", `${R0.type === "oma" ? "Mise en accusation" : "Renvoi"} devant ${CAT.JUR_LABEL[jur]} : audience le ${D(day)}.`);
      api.mail({ from: "Greffe", subject: `Audience — ${titreJur(jur)}`, kind: "greffe", important: true, body: [[`L'affaire ${nomA} est inscrite au rôle : ${CR.fmtDate(day, "dow")}, ${titreJur(jur)}.`]].concat(jur === "assises" || jur === "assises_mineurs" ? [["Le jury sera tiré au sort à l'ouverture des débats. La défense dispose de quatre récusations, le ministère public de trois (art. 298)."]] : []) });
      if (["ccd", "assises", "assises_spe", "assises_mineurs"].includes(jur)) {
        const reu = CR.rollForward(Math.max(s.day + 5, day - R.int(s, 18, 30)));
        if (reu < day - 3) api.hearing({ day: reu, min: 10 * 60, title: "Réunion préparatoire criminelle", where: `${titreJur(jur)}, cabinet du président`, lieu: TJ.paris ? "cite" : TJ.lieu, script: "reunion", done: "apresReunion", onMiss: "_reunionSansVous", duree: 40 });
      }
    };
    O._reunionSansVous = function (api) { const { cs } = api; cs.vars.liste = ["enqueteur", "legiste"]; CR.erreur(api.s, cs, { id: "reunion_absent", texte: "Vous n'étiez pas à la réunion préparatoire criminelle.", sanction: "La liste des témoins et experts a été arrêtée sans vous.", regul: "Aucune." }); };
    O.apresReunion = function (api) { const { cs } = api; const l = ["enqueteur"]; for (const k of ["legiste", "psy", "temoin", "temoin2", "proche", "perso"]) if (cs.flags["liste_" + k]) l.push(k); cs.vars.liste = l; api.tl(`Liste des témoins et experts arrêtée : ${l.length} personnes.`); };
    O._procesSansVous = function (api) {
      const { s, cs } = api;
      CR.erreur(s, cs, { id: "proces_absent", texte: "Vous n'étiez pas au procès.", sanction: D0 ? "Un avocat commis d'office a plaidé sans connaître le dossier." : "Les demandes de la partie civile n'ont pas été soutenues.", regul: "L'appel, dans les dix jours." });
      const dec = api.run("decider", { st: { played: new Set(), dernierMot: null } });
      api.run("apresProces", { decision: dec });
    };
    // ------------------------------------------------------------ Le délibéré
    O.decider = function (api, { st }) {
      const { s, cs } = api;
      const played = st && st.played instanceof Set ? st.played : new Set((st && st.played) || []);
      const jur = cs.vars.jurProces || t.jur;
      const R0 = cs.vars.reglement || { qual: "q" };
      const enAppel = !!cs.vars.enAppel;
      const qBase = R0.qual === "q2" && t.q2 ? t.q2 : q;
      const spec = chargesSpec(api, {});
      if (cs.vars.jures && cs.vars.jures.length) { const lean = cs.vars.jures.reduce((a0, j) => a0 + j.lean, 0) / cs.vars.jures.length; spec.seuil += lean * 0.25; }
      const altere = t.f.psy === "altere" || (cs.vars.renfort && cs.vars.renfort.altere);
      const obtient = R0.qual !== "q2" && requalifObtenue(api, played);
      const qq = obtient ? t.q2 : qBase;
      const encourue = t.mineur ? CAT.encourueMineur(qq) : qq.perpetuite ? CAT.PERPETUITE : qq.prison;
      const encAlt = altere && qq.nature === "crime" ? (qq.perpetuite ? 360 : Math.round(encourue * 2 / 3)) : encourue;
      const req = GEN2.requisCrime(qq, t, { altere });
      const requis = Object.assign({}, cs.vars.requis && cs.vars.requis.ferme ? cs.vars.requis : req, { complementaires: req.complementaires });
      const perso = ["K_attest", "K_promesse", "G_heberg", "G_emploi"].filter((f0) => CR.hasFact(cs, f0) || played.has(f0)).length * 0.6 + (st && st.dernierMot === "regrets" ? 1 : 0) + (t.stance === "reconnait" ? 1 : 0) + (played.has("arg:personnalite") ? 0.5 : 0);
      const dec = PEN.juger(api, {
        st: { played, angle: st && st.angle, dernierMot: st && st.dernierMot }, juridiction: jur,
        titre: { tc: "Jugement correctionnel", tpe: "Jugement du tribunal pour enfants" }[jur] || (enAppel ? "Arrêt de la cour d'assises statuant en appel" : `Arrêt — ${titreJur(jur)}`),
        prevenuNom: nomA, pcNom: t.camp === "pc" ? nom(C) : P ? nom(P) : V ? nomV : "", pcF: (t.camp === "pc" ? C : P || V || {}).g === "f",
        spec, qualif: () => ({ id: qq.id, label: qq.label, court: qq.court, encourue: { prison: encAlt, amende: qq.amende || 0 }, favorable: obtient, requis: Object.assign({}, requis, { ferme: Math.min(requis.ferme || 0, encAlt) }), motif: obtient ? `La cour requalifie : ${qq.label} (${qq.court}). ${CAT.ENJEUX[requalifEnjeu] ? CAT.ENJEUX[requalifEnjeu].label + "." : ""}` : altere && qq.nature === "crime" ? "Le discernement de l'accusé était altéré au moment des faits : la peine encourue est réduite du tiers (art. 122-1, al. 2)." : "Les débats ont établi les faits et l'intention." }),
        personnalite: Math.round(perso), detenu: cs.proc.detention.statut === "dp",
        civil: t.camp === "pc" ? { postes: postes.filter((po) => ((cs.vars.chiffrage && cs.vars.chiffrage.postes) || postes.map((z) => z.id)).includes(po.id)), art475: decede ? 3000 : 1800 } : (V ? { postes: postes.map((po) => Object.assign({}, po, { justif: null })), art475: 1500 } : null),
      });
      // la peine criminelle : réclusion, perpétuité, période de sûreté ; l'atténuation des mineurs
      if (dec.peine) {
        const pn = dec.peine;
        if (!pn.choisie && requis.perpetuite && pn.ferme >= Math.round(requis.ferme * 0.97) && !altere && !t.mineur && qq.perpetuite) { pn.perpetuite = true; pn.ferme = 360; }
        if (!pn.perpetuite && pn.ferme > 360) pn.ferme = 360;
        // l'ancien calcul excluait le sursis en matière criminelle ; la peine choisie (peines.js) l'applique selon la loi
        if (qq.nature === "crime" && pn.ferme > 0 && !pn.choisie) { pn.sursis = 0; pn.amenagement = pn.ferme > 24 ? null : pn.amenagement; pn.mandatDepot = pn.ferme > 12 || pn.mandatDepot; }
        const old = pn.texte;
        pn.texte = GEN2.peineCrimeTexte(pn, { crime: qq.nature === "crime", mineur: t.mineur, surete: GEN2.sureteDePleinDroit(qq), detenu: cs.proc.detention.statut === "dp" }) || old;
        for (const qx of dec.questions) { if (qx.q === "Sur la peine") qx.r = pn.texte + "."; if (t.mineur && qx.q === "Sur la peine") qx.motif = (qx.motif ? qx.motif + " " : "") + "La juridiction applique l'atténuation de la peine due à la minorité (art. L. 121-5 CJPM)."; }
        dec.dispositif = dec.dispositif.replace(old.replace(/^./, (c) => c.toLowerCase()), pn.texte.replace(/^./, (c) => c.toLowerCase()));
        cs.vars.peine = pn;
      }
      cs.vars.verdictTitre = dec.titre;
      cs.vars.verdictTexte = dec.dispositif;
      return dec;
    };
    O.apresProces = function (api, res) {
      const { s, cs } = api;
      const dec = (res && res.decision) || {};
      cs.vars.verdict = { coupable: !!dec.coupable, peine: dec.peine ? dec.peine.texte : null, ferme: dec.peine ? dec.peine.ferme : 0, day: s.day, civil: dec.civil ? dec.civil.total : 0, requalifie: !!(dec.qualif && dec.qualif.favorable) };
      api.doc("verdict", flowTitles.verdict);
      const pn = dec.peine;
      if (dec.coupable && pn && pn.ferme > 0 && (pn.mandatDepot || cs.proc.detention.statut === "dp")) CR.PROC.detention(api, "dp", { etab: def.proc.etab });
      else if (!dec.coupable && cs.proc.detention.statut === "dp") CR.PROC.detention(api, "libre", {});
      if (cs.aj) { api.aj(crime ? "instruction_crim" : "instruction"); api.aj(["tc", "tpe"].includes(cs.vars.jurProces) ? "tc" : "criminel"); }
      if (cs.vars.enAppel) { api.run("_clore", {}); return; }
      // l'appel : dix jours ; le ministère public fait appel d'un acquittement ou d'une peine très en deçà de ses réquisitions
      const reqF = (cs.vars.requis && cs.vars.requis.ferme) || 0;
      const pr = api.profil("parquet") || CR.PROFILS.deborde;
      const pAppel = !dec.coupable ? 0.55 : pn && reqF && pn.ferme < reqF * 0.55 ? 0.35 : (pr.appel || 0.2) * 0.4;
      cs.vars.appelParquetVerdict = R.chance(s, pAppel);
      api.at(CR.rollForward(s.day + 10), "_appelVerdict", {}, 17 * 60);
      CR.PROC.stade(api, "jugement", dec.coupable ? "Condamnation en premier ressort." : "Acquittement en premier ressort.");
    };
    // appel du joueur (gabarit commun « appel ») : défense sur tout, partie civile sur ses intérêts civils seulement (art. 380-2)
    O.apresAppel = function (api, { ctrl, etendue }) {
      const { s, cs } = api;
      if (!ctrl.ok) { CR.erreur(s, cs, { id: "appel_tardif", texte: ctrl.motif, sanction: "Appel irrecevable.", regul: ctrl.regul }); return; }
      if (!D0 && etendue !== "civil") CR.erreur(s, cs, { id: "appel_pc_penal", texte: "La partie civile a fait appel des dispositions pénales.", sanction: "La partie civile ne peut faire appel que de ses intérêts civils (art. 380-2 et 497) : cette partie de l'appel est irrecevable.", regul: "Limiter l'appel aux dispositions civiles ; le parquet seul peut faire appel de la peine." });
      cs.vars.appelJoueur = { day: s.day, civil: !D0 };
    };
    O._appelVerdict = function (api) {
      const { s, cs } = api;
      const joueur = cs.vars.appelJoueur;
      const parquet = cs.vars.appelParquetVerdict;
      if (!joueur && !parquet) { api.run("_clore", {}); return; }
      if (joueur && joueur.civil && !parquet) {
        // appel limité aux intérêts civils : la cour d'appel statue sur pièces
        const v = cs.vars.verdict;
        const nv = Math.round((v.civil || 0) * (1 + (R.next(s) - 0.35) * 0.3) / 10) * 10;
        api.mail({ from: "Greffe de la cour d'appel", subject: "Arrêt sur les intérêts civils", kind: "greffe", body: [[`La cour, statuant sur le seul appel civil, fixe l'indemnisation à ${CR.money(nv)}.`]] });
        cs.vars.verdict.civil = nv;
        api.run("_clore", {});
        return;
      }
      if (parquet) api.mail({ from: "Parquet général", subject: "Appel du ministère public", kind: "greffe", important: true, body: [[`Le procureur général interjette appel de la décision rendue le ${D(cs.vars.verdict.day)} (art. ${["tc", "tpe"].includes(cs.vars.jurProces) ? "497" : "380-2"}).`]] });
      cs.vars.enAppel = true;
      const jurA = JUR_APPEL[cs.vars.jurProces] || "assises_appel";
      let day = CR.rollForward(s.day + R.int(s, 150, 280));
      while (CR.dow(day) !== 1 || !CR.isBusinessDay(day)) day++;
      cs.proc.audience = null;
      api.setActor("president", jurA === "assises_appel" ? "pr_assises_appel" : jurA === "chmin" ? "je_morin" : "pr_cour");
      api.setActor("parquet", "pq_ag");
      cs.vars.jurAppel = jurA;
      CR.PROC.fixAudience(api, { day, min: 9 * 60 + 30, juridiction: jurA === "chmin" ? "chmin" : jurA === "chapp" ? "chapp" : "assises_appel", mode: "appel", convocDay: s.day, president: cs.actors.president, script: "proces", done: "apresProces", onMiss: "_procesSansVous", title: `${CR.PROC.JURIDICTIONS[jurA === "chmin" ? "chmin" : jurA === "chapp" ? "chapp" : "assises_appel"].label} — ${nomA}`, duree: 420, lieu: "cite" });
      CR.PROC.stade(api, "appel", `Appel : audience le ${D(day)}.`);
    };
    O._clore = function (api) {
      const { s, cs } = api;
      const v = cs.vars.verdict || {};
      const pn = cs.vars.peine;
      if (v.coupable && pn && pn.ferme > 0 && cs.proc.detention.statut === "dp") CR.condamneDetenu(s, cs, pn.perpetuite ? 360 : pn.ferme, def.proc.etab === "fleury" ? "fleury" : "fresnes", cs.proc.detention.since != null ? cs.proc.detention.since : s.day);
      CR.PROC.stade(api, "definitif", "Décision définitive.");
      if (t.camp === "pc") { CR.closeCase(s, cs, !v.coupable ? { type: "deboute", detail: "acquittement de l'accusé" } : v.civil ? { type: "indemnise", detail: CR.money(v.civil), indemnisation: v.civil } : { type: "done", detail: "culpabilité reconnue" }); return; }
      CR.closeCase(s, cs, !v.coupable ? { type: ["tc", "tpe"].includes(cs.vars.jurProces) ? "relaxe" : "acquittement" } : v.requalifie ? { type: "requalification_favorable", detail: v.peine || "" } : { type: "condamnation", detail: v.peine || "" });
    };
    // ------------------------------------------------------------ Les audiences
    const AU = def.audiences;
    const choixIPC = [
      { t: `« ${GEN2.PR.gram(A).Client} gardera le silence aujourd'hui. »`, reply: "C'est son droit.", replyWho: "ji", fx: { vars: { ipcChoix: "silence" } }, then: [{ who: "client", t: "Je ne souhaite pas m'exprimer aujourd'hui." }] },
      { t: `« ${GEN2.PR.gram(A).Client} souhaite faire une déclaration. »`, reply: "Je vous écoute.", replyWho: "ji", fx: { vars: { ipcChoix: "declarer" } }, then: [{ if: () => true, then: [{ who: "client", t: N.version[t.stance] }] }] },
    ];
    AU.ipc = AU.ipc_convoc = function (api) {
      const { cs } = api;
      return {
        title: "Interrogatoire de première comparution", sub: `Cabinet de ${jiNom}`, decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(ji) },
        steps: [
          { who: "sys", t: t.entree === "deferement" ? `(${nomA} arrive du dépôt, menotté${e(A)}, entre deux policiers. On lui retire les menottes. Le greffier tape.)` : `(${nomA} s'assoit à côté de vous, sa convocation pliée dans la main.)` },
          { who: "ji", t: `${Mme(A)} ${A.nom}, je suis saisi${/^Mme/.test(jiNom) ? "e" : ""} par un réquisitoire du procureur de la République. Je vous fais connaître les faits : ${N.resume} Ils sont qualifiés de ${q.label}.` },
          { who: "ji", t: "Vous avez le droit de faire des déclarations, de répondre aux questions qui vous sont posées ou de vous taire. Maître, votre client a-t-il fait son choix ?" },
          { choose: choixIPC },
          { who: "ji", t: "Maître, avez-vous des observations sur une éventuelle mise en examen ? (art. 116)" },
          { plaidoirie: { role: "ji", max: 2, args: [
            { id: "ta", label: "Le statut de témoin assisté : pas d'indices graves ou concordants", say: `Rien, à ce stade, ne constitue des indices graves ou concordants contre ${A.prenom} : le statut de témoin assisté s'impose (art. 80-1 et 113-1).`, cards: ["CPP_80-1", "CPP_113-1"].concat(enjeux.filter((z) => z.effet === "acquit").map((z) => "E_" + z.id)) },
            { id: "garanties", label: "Les garanties de représentation", say: `${A.prenom} a une adresse, des proches, ${A.emploi ? "un emploi" : "une vie stable"} : rien ne justifie une mesure de sûreté.`, cards: notesPerso },
            { id: "emotion", label: "Dire que c'est une erreur judiciaire", say: "C'est une erreur judiciaire, monsieur le juge.", pertinent: () => false },
          ] } },
          { do: (a, st) => a.run("ipcDecider", { played: st.played }) },
        ],
      };
    };
    AU.jld = function (api) {
      const { cs } = api;
      return {
        title: "Juge des libertés et de la détention", sub: "Débat contradictoire sur la détention (art. 145)", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(jld) },
        steps: [
          { who: "jld", t: `Je suis saisi${/^Mme/.test(jld.nom) ? "e" : ""} par le juge d'instruction aux fins de placement en détention provisoire de ${nomA}. Je vous rappelle votre droit de vous taire. Monsieur le procureur ?` },
          { who: "parquet", t: `La gravité des faits, ${q.label}, ${t.co ? "des coauteurs en fuite, " : ""}${V && !decede ? "le risque de pression sur la victime" : "le risque de concertation"} : seule la détention répond aux objectifs de l'article 144.` },
          { who: "jld", t: "Maître ?" },
          { choose: [
            { t: "« Je plaide maintenant. »", reply: "Je vous écoute.", replyWho: "jld" },
            { t: "« Je demande un débat différé pour réunir les garanties (art. 145, al. 7). »", reply: "Le débat est renvoyé à quatre jours ouvrables ; votre client sera incarcéré provisoirement jusque-là.", replyWho: "jld", fx: { vars: { debatDiffere: true } }, then: [{ do: (a) => { a.cs.vars.debatDiffere = a.s.day; CR.PROC.detention(a, "dp", { etab: def.proc.etab }); a.hearing({ day: CR.addOuvrables(a.s.day, 4), min: 14 * 60, title: `Débat différé devant le juge des libertés — ${jld.nom}`, where: "Tribunal judiciaire, cabinet du JLD", lieu: TJ.lieu, script: "jld", done: "apresJLD", onMiss: "_jldSansVous", duree: 40 }); return [{ who: "sys", t: `(${A.prenom} est reconduit${e(A)} au dépôt. Quatre jours pour trouver une attestation d'hébergement.)` }]; } }, { end: true }] },
          ] },
          { plaidoirie: { role: "jld", max: 3, args: [
            { id: "garanties", label: "Un hébergement, un emploi : des garanties écrites", say: `${A.prenom} peut être hébergé${e(A)} ${A.heberg ? `à ${A.adresse}` : "chez un proche"} ; les pièces sont au dossier.`, cards: notesPerso },
            { id: "cj", label: "Un contrôle judiciaire strict suffit", say: "Interdiction de contact, obligation de résider, pointage : chacun des objectifs de l'article 144 est atteint sans détention.", cards: ["CPP_137", "CPP_144"] },
            { id: "144", label: "Aucun des objectifs de l'article 144 n'exige la détention", say: "Le parquet invoque des formules ; il ne dit pas en quoi la détention est l'unique moyen.", cards: ["CPP_144"] },
            { id: "innocent", label: `${GEN2.PR.gram(A).Il} est innocent${GEN2.PR.gram(A).e}`, say: `${GEN2.PR.gram(A).Client} est innocent${GEN2.PR.gram(A).e}.`, pertinent: () => false },
          ] } },
          { do: (a, st) => a.run("jldDecider", { played: st.played }) },
        ],
      };
    };
    const qAvocatOptions = () => enjeux.slice(0, 3).map((en) => ({ id: "q_" + en.id, t: en.q, a: en.fort ? en.txtFort.replace(/^« |»$/g, "") : en.faible.replace(/^« |»$/g, ""), f: "E_" + en.id, signal: en.fort ? "bon" : "mauvais" }));
    AU.interro = function (api, h) {
      const { cs } = api;
      const prep = cs.flags.prepInterro != null; // le jour 0 est un jour
      const steps = D0 ? [
        { who: "sys", t: cs.proc.detention.statut === "dp" ? `(${nomA} arrive de détention, escorté${e(A)}. Le greffier a déjà ouvert le dossier.)` : `(${nomA} s'assoit à côté de vous. ${prep ? `${GEN2.PR.Il(A)} a relu ses notes dans le couloir.` : `${GEN2.PR.Il(A)} tripote sa veste.`})` },
        { who: "ji", t: `Nous reprenons. ${N.mobile ? `Les enquêteurs retiennent ce contexte : ${(N.mobile.replace(/\.$/, "")[0].toLowerCase() + N.mobile.replace(/\.$/, "").slice(1))}.` : ""} Qu'avez-vous à dire ?` },
        { if: () => prep, then: [{ who: "client", t: N.version[t.stance], signal: "bon", fx: { csFlags: { interroBon: true } } }], else: [{ who: "client", t: `${N.version[t.stance]} Je sais pas, je sais plus.`, fx: { cred: -2 }, signal: "mauvais" }] },
      ].concat((N.interro || []).slice(0, 2).map((qq) => [{ who: "ji", t: qq.q }, { who: "client", t: qq.a[t.stance] }]).flat(), [
        // lot 7 : en mode libre, les questions de l'avocat à son client se composent (confrontation.js, K.repondreClient)
        CR.CONF && CR.libre(api.s)
          ? { parole: { M: CR.CONF.modeleClient(api.s, cs, t, N, enjeux, { idx: (h && h.idx) || 0, prep, detenu: cs.proc.detention.statut === "dp" }), repondre: CR.CONF.repondreClient, max: CR.CONF.MAX, who: "client", juge: "ji", prompt: "Vos questions à votre client (art. 120)" } }
          : { questions: { prompt: "Vos questions (art. 120)", to: "client", who: "client", max: 2, options: enjeux.slice(0, 3).map((en) => ({ id: "c_" + en.id, t: en.q, a: t.stance === "nie" ? "Je l'ai déjà dit, je n'y suis pour rien." : "Je l'ai dit aux policiers, ils n'ont pas écrit.", signal: "neutre" })).concat([{ id: "c_vie", t: "Que faites-vous depuis votre mise en examen ?", a: cs.proc.detention.statut === "dp" ? "Je travaille aux ateliers. Je suis une formation." : "Je travaille. Je respecte toutes mes obligations.", signal: "bon" }]) } },
        { who: "ji", t: "Je vous remercie. L'interrogatoire est terminé." },
      ]) : [
        { who: "sys", t: `(${nom(C)} s'assoit. ${proc ? "L'administrateur ad hoc est présent à ses côtés." : "Ses mains tremblent."})` },
        { who: "ji", t: proc ? "Je vous entends en qualité de représentant légal de l'enfant, partie civile. Les déclarations de votre enfant ont été enregistrées ; je ne vous demanderai pas de les répéter." : "Vous êtes entendu en qualité de partie civile. Racontez-moi." },
        { who: "client", t: proc ? `Je veux seulement qu'${GEN2.PR.il(V)} soit protégé${e(V)}. Et qu'on ${GEN2.PR.gram(V).le} croie.` : GEN2.PR.audience.victime(x, decede) },
        { questions: { prompt: "Vos questions", to: "client", who: "client", max: 2, options: [{ id: "v_suite", t: "Comment allez-vous aujourd'hui ?", a: proc ? `${GEN2.PR.Il(V)} a un suivi chez une psychologue, une fois par semaine. ${GEN2.PR.Il(V)} dort mal.` : `Je suis suivi${e(C)}. Je ne sors plus le soir. Je ne travaille plus.`, signal: "bon" }, { id: "v_detail", t: "Y a-t-il un détail que vous n'avez pas dit aux policiers ?", a: "Je ne sais pas. J'ai tout dit.", signal: "neutre" }] } },
        { who: "ji", t: "Je vous remercie." },
      ];
      return { title: D0 ? "Interrogatoire" : "Audition de la partie civile", sub: `Cabinet de ${jiNom}`, decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(ji) }, steps };
    };
    AU.confront = function (api) {
      // lot 7 : en mode libre, la défense interroge le témoin principal au compositeur (confrontation.js)
      const Wt = D0 && CR.CONF && CR.CRIMD && CR.libre(api.s) ? CR.CRIMD.temoin(t, N) : null;
      if (Wt) {
        const M = CR.CONF.modele(api.s, api.cs, t, N, Wt);
        api.cs.vars.confront.joue = true;
        const nT = nom(t.T);
        return {
          title: "Confrontation", sub: `Cabinet de ${jiNom}`, decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(ji) },
          steps: [
            { who: "sys", t: `(${nomA} et ${nT} sont assis à deux mètres l'un de l'autre. Ils ne se regardent pas. Le greffier tape.)` },
            { who: "ji", t: `${Mme(t.T)} ${t.T.nom}, vous avez été entendu${e(t.T)} deux fois par les enquêteurs. Maintenez-vous vos déclarations ?` },
            { who: "temoin", name: nT, t: Wt.premiere ? `Oui. ${Wt.premiere}` : "Oui, je maintiens." },
            { who: "ji", t: `${Mme(A)} ${A.nom}, qu'avez-vous à répondre ?` },
            { who: "client", t: N.version[t.stance] },
            { who: "ji", t: "Maître, vous avez des questions ?" },
            { parole: { M, max: CR.CONF.MAX, nom: nT, who: "temoin", juge: "ji", prompt: `Vos questions à ${nT} (art. 120)` } },
            { who: "ji", t: "La confrontation est terminée. Le procès-verbal vous sera relu." },
          ],
        };
      }
      const W = V && !decede && !proc ? { nom: nomV, role: "victime" } : { nom: nom(t.T), role: "témoin" };
      return {
        title: "Confrontation", sub: `Cabinet de ${jiNom}`, decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(ji) },
        steps: [
          { who: "sys", t: `(${nomA} et ${W.nom} sont assis à deux mètres l'un de l'autre. Ils ne se regardent pas.)` },
          { who: "ji", t: `${W.nom}, maintenez-vous vos déclarations ?` },
          { who: D0 ? "temoin" : W.role === "victime" ? "client" : "temoin", name: D0 || W.role !== "victime" ? W.nom : undefined, t: W.role === "victime" ? (N.victime || [N.resume])[0] : (N.temoins[0] ? N.temoins[0].lines[0] : "Oui, je maintiens.") },
          { who: "ji", t: `${Mme(A)} ${A.nom} ?` },
          { who: D0 ? "client" : "temoin", name: D0 ? undefined : nomA, t: N.version[t.stance] },
          { questions: { prompt: D0 ? `Vos questions à ${W.nom} (art. 120)` : `Vos questions à ${nomA}`, who: "temoin", name: D0 ? W.nom : nomA, max: 2, options: qAvocatOptions().concat([{ id: "q_attaque", t: D0 ? "Pourquoi mentez-vous ?" : "Avouez !", a: "Je ne mens pas !", fx: { cred: -2 }, signal: "mauvais" }]) } },
          { who: "ji", t: "La confrontation est terminée." },
        ],
      };
    };
    AU.prolong = function (api) {
      const { cs } = api;
      const depuis = cs.proc.detention.since;
      return {
        title: "Juge des libertés et de la détention", sub: "Débat de prolongation", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(jld) },
        steps: [
          { who: "sys", t: `(${nomA} arrive de détention, escorté${e(A)}. ${GEN2.PR.Il(A)} s'assoit à côté de vous.)` },
          { who: "jld", t: `Je suis saisi${/^Mme/.test(jld.nom) ? "e" : ""} aux fins de prolongation de la détention de ${nomA}, détenu${e(A)} depuis le ${depuis != null ? D(depuis) : "son placement"}. Monsieur le procureur ?` },
          { who: "parquet", t: "Les objectifs de l'article 144 demeurent : je requiers la prolongation." },
          { who: "jld", t: "Maître ?" },
          { plaidoirie: { role: "jld", max: 3, args: D0 ? [
            { id: "garanties", label: "Des garanties écrites : hébergement, emploi", say: "Une attestation d'hébergement, une promesse d'embauche : la sortie est préparée.", cards: notesPerso },
            { id: "duree", label: "La durée de la détention n'est plus raisonnable", say: "L'information touche à sa fin : la détention a cessé d'être nécessaire, et sa durée d'être raisonnable.", cards: ["X_dp", crime ? "CPP_145-2" : "CPP_145-1"] },
            { id: "144", label: "Un contrôle judiciaire répond à l'article 144", say: "Une assignation à résidence avec surveillance électronique, une interdiction de contact : chaque objectif est atteint.", cards: ["CPP_144"] },
          ] : [{ id: "peur", label: "La crainte de la victime", say: "La victime craint pour sa sécurité ; la partie civile s'associe aux réquisitions.", cards: ["X_victime"] }] } },
          { do: (a, st) => a.run("prolongDecider", { played: st.played }) },
        ],
      };
    };
    AU.chins = function (api) {
      const { cs } = api;
      const ap = cs.vars.appelForme || {};
      return {
        title: "Chambre de l'instruction", sub: `${TJ.ca} · chambre du conseil`, decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur("pr_chins")) },
        steps: [
          { who: "president", t: `La chambre examine l'appel ${ap.parquet ? "du ministère public" : "formé par " + (D0 ? "la défense" : "la partie civile")} contre ${ap.type === "dp" ? "l'ordonnance de placement en détention provisoire" : "l'ordonnance de règlement"}. Monsieur l'avocat général ?` },
          { who: "parquet", t: ap.type === "dp" ? "Je requiers la confirmation." : ap.parquet ? "Je demande à la chambre d'infirmer l'ordonnance." : "Je requiers la confirmation de l'ordonnance." },
          { who: "president", t: "Maître ?" },
          { plaidoirie: { role: "jld", max: 3, args: ap.type === "dp" ? [
            { id: "garanties", label: "Les garanties de représentation", say: "Les pièces sont au dossier : hébergement, emploi, attaches.", cards: notesPerso },
            { id: "144", label: "L'ordonnance ne caractérise pas l'article 144", say: "L'ordonnance reprend des formules ; elle ne dit pas pourquoi le contrôle judiciaire serait insuffisant.", cards: ["CPP_144"] },
          ] : enjeux.map((en) => ({ id: en.id, label: en.label, say: D0 ? en.arg : "L'information établit des charges suffisantes ; cet argument ne résiste pas au dossier.", cards: ["E_" + en.id] })).concat([{ id: "qualif", label: "La qualification juste", say: D0 && t.q2 ? `Les faits relèvent de ${t.q2.label}.` : `Les faits relèvent de ${q.label}.`, cards: ["G_qualif"] }]) } },
          { do: (a, st) => a.run("chinsDecider", { played: st.played }) },
        ],
      };
    };
    AU.reunion = function (api) {
      return {
        title: "Réunion préparatoire criminelle", sub: `${titreJur(api.cs.vars.jurProces || t.jur)} · cabinet du président`, decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur(presDe(api.cs.vars.jurProces || t.jur)) || ji) },
        steps: [
          { who: "president", t: "Maîtres, monsieur l'avocat général : nous arrêtons la liste des témoins et des experts, et la durée des débats. Ce que nous fixons aujourd'hui ne changera plus qu'exceptionnellement." },
          { who: "parquet", t: "Le ministère public fera entendre le directeur d'enquête." },
          { who: "president", t: D0 ? "Maître, pour la défense ?" : "Maître, pour la partie civile ?" },
          { questions: { prompt: "Témoins et experts que vous faites citer", who: "president", max: 3, options: [
            N.medical && N.medical.kind !== "aucun" ? { id: "l_legiste", t: "Le médecin légiste.", a: "Retenu.", fx: { csFlags: { liste_legiste: true } } } : null,
            { id: "l_psy", t: "L'expert psychiatre.", a: "Retenu.", fx: { csFlags: { liste_psy: true } } },
            N.temoins[0] ? { id: "l_temoin", t: `${nom(t.T)}, témoin.`, a: "Retenu.", fx: { csFlags: { liste_temoin: true } } } : null,
            N.temoins[1] ? { id: "l_temoin2", t: `${nom(t.T2)}, témoin.`, a: "Retenu.", fx: { csFlags: { liste_temoin2: true } } } : null,
            D0 ? { id: "l_perso", t: `${CR.cap(A.proche.replace(/^s(on|a) /, ""))} de l'accusé${e(A)}, témoin de personnalité.`, a: "Retenu.", fx: { csFlags: { liste_perso: true } } } : P ? { id: "l_proche", t: `${nom(P)}, ${P.lien} de la victime.`, a: "Retenu.", fx: { csFlags: { liste_proche: true } } } : null,
          ].filter(Boolean) } },
          { who: "president", t: "La liste est arrêtée." },
        ],
      };
    };
    AU.proces = function (api) {
      const { s, cs } = api;
      const jur = cs.vars.enAppel ? cs.vars.jurAppel || "assises_appel" : cs.vars.jurProces || t.jur;
      const R0 = cs.vars.reglement || { qual: "q" };
      const qq = R0.qual === "q2" && t.q2 ? t.q2 : q;
      const cour = !["tc", "tpe", "chapp", "chmin"].includes(jur);
      const jury = (jur === "assises" || jur === "assises_mineurs" || jur === "assises_appel") && !(jur === "assises_appel" && I.fam === "crim_stups");
      const huisClosPossible = sexuel && V && !proc && qq.nature === "crime";
      const liste = cs.vars.liste || ["enqueteur", "legiste", "psy", "temoin"];
      const detenu = cs.proc.detention.statut === "dp";
      const ouvreur = cour ? "La cour !" : "Le tribunal !";
      const steps = [
        { who: "huissier", t: ouvreur },
        { who: "sys", t: { ccd: "(Cinq magistrats professionnels, sans jurés.)", assises: "(La présidente, deux assesseurs, et les jurés qui viennent de prêter serment.)", assises_appel: jury ? "(Trois magistrats et neuf jurés. Une autre cour, d'autres regards.)" : "(Sept magistrats professionnels, aucun juré : la cour d'assises spécialement composée siège aussi en appel.)", assises_spe: "(Cinq magistrats professionnels, aucun juré : la cour spécialement composée.)", assises_mineurs: "(Le président, deux juges des enfants, les jurés. Publicité restreinte : la salle est presque vide.)", tpe: "(La juge des enfants et ses deux assesseurs. Publicité restreinte : les parents, les éducateurs, les avocats.)", tc: "(Trois juges. La salle d'audience de la 16e chambre.)", chapp: "(La chambre des appels correctionnels.)", chmin: "(La chambre spéciale des mineurs, en publicité restreinte.)" }[jur] || "" },
      ];
      if (t.mineur) steps.push({ who: "president", t: "L'accusé était mineur au moment des faits : les débats ont lieu en publicité restreinte (art. L. 513-2 du code de la justice pénale des mineurs)." });
      if (huisClosPossible) steps.push(t.camp === "pc"
        ? { choose: [
          { t: "« Ma cliente demande le huis clos (art. 306). »", reply: "Le huis clos est de droit à la demande de la partie civile. La cour ordonne le huis clos.", fx: { vars: { huisClos: true } } },
          { t: "« Ma cliente souhaite des débats publics. »", reply: "La publicité est maintenue, conformément au souhait de la partie civile.", fx: { vars: { huisClos: false } } },
        ] }
        : { who: "adverse", t: "La partie civile demande le huis clos.", then: [] }, t.camp === "pc" ? { who: "sys", t: "(La salle se vide, ou reste pleine : c'est la victime qui a choisi.)" } : { who: "president", t: "Le huis clos est de droit à la demande de la victime partie civile (art. 306). La salle est évacuée." });
      steps.push(
        { who: "greffier", t: `Lecture de la décision de renvoi : ${R0.type === "oma" ? "ordonnance de mise en accusation" : "ordonnance de renvoi"} de ${nomA} du chef de ${qq.label}.` },
        { who: "president", t: `${Mme(A)} ${A.nom}, levez-vous. Vous avez le droit, au cours des débats, de faire des déclarations, de répondre aux questions ou de vous taire.` },
        { who: "president", t: "Nous commençons par votre personnalité. Parlez-nous de votre parcours." },
        { who: D0 ? "client" : "prevenu", name: D0 ? undefined : nomA, t: N.personnalite[0] ? `${A.age} ans. ${(() => { const x = GEN2.PR.activite({ pk: (k, a) => a[0] }, A, "aud", { court: true }); return typeof x === "string" ? x : x.t; })()} ${A.casier ? `J'ai déjà été condamné${A.g === "f" ? "e" : ""}.` : `Je n'ai jamais été condamné${A.g === "f" ? "e" : ""}.`}` : "…" },
      );
      // Version 1.0 — témoins et experts à la barre : chacun prête serment, dépose, puis répond à une question au plus.
      // Chaque enjeu du dossier ne peut être éprouvé qu'auprès de celui qui en sait quelque chose : si vous ne l'avez pas
      // fait citer à la réunion préparatoire, la question ne se pose pas.
      const SERMENT_T = "(Le témoin prête serment de parler sans haine et sans crainte, de dire toute la vérité, rien que la vérité : art. 331.)";
      const SERMENT_E = "(L'expert prête serment d'apporter son concours à la justice en son honneur et en sa conscience : art. 168.)";
      const QUI_SAIT = { aboli: "psy", altere: "psy", penetration: "legiste", causalite: "legiste", consentement: "temoin", identification: "temoin", ld: "temoin", arme: "temoin" };
      const entendus = { enqueteur: liste.includes("enqueteur"), legiste: liste.includes("legiste") && !!PZ.docs.medical, psy: liste.includes("psy"), temoin: liste.includes("temoin") && !!N.temoins[0], temoin2: liste.includes("temoin2") && !!N.temoins[1] };
      const pourQui = (en) => { const r = QUI_SAIT[en.id] || "enqueteur"; return entendus[r] ? r : r === "temoin" && entendus.temoin2 ? "temoin2" : r === "temoin" && entendus.enqueteur ? "enqueteur" : r; };
      const qEnjeux = (role) => qAvocatOptions().filter((o, i) => pourQui(enjeux[i]) === role);
      const bien = (v) => (D0 ? v : -v);
      const sig = (v) => (bien(v) > 0 ? "bon" : bien(v) < 0 ? "mauvais" : "neutre");
      const compat = t.stance === "reconnait" ? 1 : enjeux.some((en) => en.fort && ["ld", "intention", "causalite", "desistement"].includes(en.id)) ? 1 : -2;
      const PIEGES = {
        enqueteur: [{ id: "q_hors", t: "Vous êtes certain de tout ce que vous dites ?", a: "Oui.", fx: { cred: -1 }, signal: "neutre" },
          { id: "q_enq_decharge", t: "Quelles vérifications avez-vous faites à décharge ?", a: t.stance === "nie" && enjeux.some((en) => en.fort) ? "Nous n'avons pas pu tout vérifier." : "Tout ce qui a été demandé a été vérifié, et figure au dossier.", fx: { cred: bien(t.stance === "nie" && enjeux.some((en) => en.fort) ? 1 : -1) }, signal: sig(t.stance === "nie" && enjeux.some((en) => en.fort) ? 1 : -1) }],
        legiste: [{ id: "q_leg_qui", t: "Docteur, qui a porté ces coups ?", a: "Ce n'est pas ma mission, maître : je décris des lésions, pas leur auteur.", fx: { cred: -1 }, signal: "mauvais" },
          { id: "q_leg_compat", t: "Docteur, vos constatations sont-elles compatibles avec ce que dit l'accusé ?", a: compat > 0 ? "Je ne peux pas l'exclure." : "Difficilement, au vu des lésions.", fx: { cred: bien(compat) }, signal: sig(compat) }],
        psy: [{ id: "q_psy_coupable", t: "Docteur, à votre avis, est-ce bien lui ?", a: "(Le président vous arrête : « Maître, l'expert n'a pas à se prononcer sur la culpabilité. »)", fx: { cred: -2 }, signal: "mauvais" },
          { id: "q_psy_danger", t: "Docteur, existe-t-il un risque de réitération ?", a: A.casier ? "Je ne peux pas l'écarter, compte tenu des antécédents." : "Rien, dans mon examen, ne l'indique.", fx: { cred: bien(A.casier ? -2 : 1) }, signal: sig(A.casier ? -2 : 1) }],
        temoin: [{ id: "q_tem_pression", t: "Vous mentez, n'est-ce pas ?", a: "(Le président : « Maître, posez une question. On ne prend pas un témoin à partie. »)", fx: { cred: -2 }, signal: "mauvais" }],
      };
      const barre = (role, name, texte, expert, i) => {
        if (!entendus[role]) return;
        const base = role === "temoin2" ? "temoin" : role;
        const opts = qEnjeux(role).concat(PIEGES[base].map((o) => Object.assign({}, o, role === "temoin2" ? { id: o.id + "2" } : {})));
        if (base === "temoin" && N.temoins[i] && N.temoins[i].lines[1]) opts.splice(opts.length - 1, 0, { id: "q_tem_voir" + (i || ""), t: "D'où vous étiez, que pouviez-vous voir exactement ?", a: N.temoins[i].lines[1], signal: "neutre" });
        steps.push({ who: "sys", t: expert ? SERMENT_E : SERMENT_T }, { who: "temoin", name, t: texte },
          { questions: { prompt: `Une question à ${name.replace(/^L/, "l")} ?`, who: "temoin", name, max: 1, options: opts } });
      };
      barre("enqueteur", "Le directeur d'enquête", `${N.resume} ${t.preuves.includes("adn") ? "L'ADN, " : ""}${t.preuves.includes("telephonie") ? "la téléphonie, " : ""}${t.preuves.includes("video") ? "les images, " : ""}les auditions : le faisceau est cohérent.`, false);
      barre("legiste", "Le médecin légiste", (N.medical && N.medical.cause) || `Lésions constatées : ${((N.medical && N.medical.lesions) || []).join(" ; ") || "voir le rapport"}.`, true);
      barre("psy", "L'expert psychiatre", N.psy[N.psy.length - 1], true);
      barre("temoin", N.temoins[0] ? nom(t.T) : "", N.temoins[0] ? N.temoins[0].lines[0] : "", false, 0);
      barre("temoin2", N.temoins[1] ? nom(t.T2) : "", N.temoins[1] ? N.temoins[1].lines[0] : "", false, 1);
      {
        // un enjeu dont personne, à la barre, ne peut parler : la question ne sera pas posée
        const perdus = enjeux.slice(0, 3).filter((en) => !entendus[pourQui(en)]);
        if (perdus.length) steps.push({ who: "sys", t: `(Personne, parmi les témoins et experts cités, ne peut répondre sur ce point : ${perdus.map((en) => en.label.replace(/^./, (c) => c.toLowerCase())).join(" ; ")}. La liste a été arrêtée à la réunion préparatoire.)`, signal: "mauvais" });
      }
      steps.push({ who: "president", t: `${Mme(A)} ${A.nom}, sur les faits ?` });
      steps.push({ if: () => !!cs.flags.prepClient || !D0, then: [{ who: D0 ? "client" : "prevenu", name: D0 ? undefined : nomA, t: N.version[t.stance], signal: D0 ? "bon" : undefined }], else: [{ who: "client", t: `${N.version[t.stance]} Et de toute façon, personne ne me croit.`, fx: { cred: -2 }, signal: "mauvais" }] });
      if (liste.includes("perso") && D0) steps.push({ who: "sys", t: /m[èe]re|p[èe]re|fr[èe]re|s[œo]eur|fils|fille|grand/.test(A.proche) ? "(Proche parent de l'accusé : entendu sans prestation de serment, à titre de simple renseignement — art. 335.)" : SERMENT_T }, { who: "temoin", name: `${CR.cap(A.proche.replace(/^s(on|a) /, ""))} de l'accusé${e(A)}`, t: `${A.prenom}, ce n'est pas ce qu'on dit de ${GEN2.PR.gram(A).soi}. ${GEN2.PR.Il(A)} a toujours aidé à la maison.` });
      if (liste.includes("proche") && P) steps.push({ who: "temoin", name: nom(P), t: (N.proche || [`${V ? V.prenom : "Elle"} nous manque chaque jour.`])[0] });
      // partie civile
      if (t.camp === "pc") {
        if (!cs.proc.pcConstituee) steps.push({ constitution: true });
        steps.push({ if: () => !!cs.proc.pcConstituee, then: [{ who: "president", t: "La parole est à la partie civile." }, { plaidoirie: { role: "pc", max: 4, args: argsPC() } }], else: [{ who: "president", t: "Maître, votre client ne s'est pas constitué partie civile.", signal: "mauvais" }] });
      } else if (V || P) steps.push({ who: "president", t: "La parole est à la partie civile." }, { who: "adverse", t: decede ? `${V.prenom} avait ${V.age} ans. Sa famille demande que la cour dise ce qui s'est passé, et répare ce qui peut l'être.` : proc ? `L'enfant attend que la cour ${GEN2.PR.gram(V).le} croie. L'administrateur ad hoc demande réparation en son nom.` : `${nomV} est là, au premier rang. ${GEN2.PR.Il(V)} demande à être reconnu${e(V)} comme victime, et réparation.` });
      const req = GEN2.requisCrime(qq, t, { altere: t.f.psy === "altere" });
      steps.push(AUD.requisitions(req, { avant: [cour ? `${qq.label.charAt(0).toUpperCase() + qq.label.slice(1)} : ${CAT.encourueTexte(qq)}${t.mineur ? ", la moitié pour un mineur" : ""}.` : "Les faits sont établis."] }));
      if (D0) {
        steps.push({ who: "president", t: cour ? "La parole est à la défense. L'accusé aura la parole en dernier." : "La parole est à la défense." }, { plaidoirie: { role: "defense", max: 4, angles: [{ id: "peine", t: "La peine", sub: "Ne pas contester l'essentiel ; une peine qui permet un avenir." }, { id: "relaxe", t: cour ? "L'acquittement" : "La relaxe", sub: "Le doute, les enjeux du dossier." }].concat(t.q2 && R0.qual !== "q2" ? [{ id: "requalif", t: "La requalification", sub: t.q2.label }] : []), args: argsDefense(api) } });
        steps.push({ dernierMot: { prepare: [{ id: "regrets", label: "Des regrets sobres", t: V ? "Je demande pardon à la famille. Je ne demande rien pour moi." : "Je regrette. Je n'ai rien d'autre à dire." }, { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." }], spontane: { id: "spontane", t: "Je… je veux juste rentrer chez moi." } } });
      } else steps.push({ who: "president", t: "La parole est à la défense." }, { who: "adverse", t: enjeux[0] ? `${enjeux[0].arg} Vous ne pourrez pas condamner sur ce dossier.` : "Le doute doit profiter à l'accusé." }, { who: "president", t: `${Mme(A)} ${A.nom}, vous avez la parole en dernier.` }, { who: "prevenu", name: nomA, t: t.stance === "reconnait" ? "Je demande pardon." : "Je n'ai rien fait de ce qu'on me reproche." });
      steps.push({ delibere: { texte: cour ? (jury ? "La cour et le jury se retirent pour délibérer. Les débats sont clos ; le président emporte le dossier. Plusieurs heures plus tard : « La cour ! »" : "La cour se retire pour délibérer. Trois heures plus tard : « La cour ! »") : "Le tribunal se retire pour délibérer." } });
      return { title: cs.vars.enAppel ? CR.PROC.JURIDICTIONS[jur].label : titreJur(jur), sub: TJ.paris ? (cour ? "Île de la Cité" : "Tribunal judiciaire de Paris") : TJ.sub, decor: { scene: cour ? "assises" : "salle", box: detenu && D0, juges: { ccd: 5, assises_spe: 5, tpe: 3, tc: 3 }[jur] || (jur === "assises_appel" && !jury ? 7 : 3) }, jury, juryDefense: D0, juryN: jur === "assises_appel" ? 9 : 6, juryTitre: (cs.vars.enAppel ? CR.PROC.JURIDICTIONS[jur].label : titreJur(jur)).replace(/^Cour/, "cour"), steps };
    };
    // ------------------------------------------------------------ Débrief, épilogue, fiche, corrigé
    def.debrief = function (api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: `${CR.cap(q.label)} : ${CAT.encourueTexte(q)} (${q.court})${q.nature === "crime" ? `, jugé par ${CAT.JUR_LABEL[t.jur]}` : ""}. Prescription : ${q.prescAns} ans${q.prescMajorite ? " à compter de la majorité de la victime" : ""}.` }];
      if (t.mineur) items.push({ kind: "rule", text: `Mineur de ${t.ageFaits} ans au moment des faits : juge d'instruction des mineurs, ${t.ageFaits < 16 ? "tribunal pour enfants" : "cour d'assises des mineurs"}, atténuation de la peine (art. L. 121-5 CJPM), publicité restreinte.` });
      for (const en of enjeux) {
        const vu = CR.hasFact(cs, "E_" + en.id) || (cs.vars.obs175 && cs.vars.obs175.points.includes(en.id));
        items.push(vu ? { kind: en.fort ? "good" : "info", text: `Enjeu repéré : ${en.label.toLowerCase()}${en.fort ? " — le dossier le soutenait." : " — le dossier le démentait en partie."}` } : { kind: en.fort ? "surprise" : "info", text: `Enjeu non relevé : ${en.label.toLowerCase()}.` });
      }
      for (const id of t.irr) { const an = PZ.anomalies[id]; if (!an) continue; const ir = CR.IRREG[an.irreg]; const vu = cs.proc.moyens.some((m) => m.flag === id) || cs.issues.some((i) => i.flag === id); items.push(vu ? { kind: "good", text: `Vous avez relevé : ${ir.label.toLowerCase()}.` } : { kind: "surprise", text: `Personne n'a relevé ce que contenait ${(PZ.titres[an.piece] || "une pièce").replace(/ \(D\d+\)$/, "").toLowerCase()} : ${ir.label.toLowerCase()}.` }); }
      if (cs.vars.reglement) items.push({ kind: "info", text: `Règlement : ${{ nonlieu: "non-lieu", irresp: "irresponsabilité pénale", oma: "mise en accusation", ortc: "renvoi devant le tribunal correctionnel" }[cs.vars.reglement.type]}${cs.vars.reglement.qual === "q2" ? ", après requalification" : ""}.` });
      if (cs.vars.avis175Day != null && !cs.vars.obs175) items.push({ kind: "bad", text: "Vous n'avez pas déposé d'observations après l'avis de fin d'information (art. 175)." });
      if (!D0 && !cs.proc.pcConstituee) items.push({ kind: "bad", text: "La victime n'a jamais été constituée partie civile." });
      if (cs.flags.promesse || cs.flags.promesseSortie) items.push({ kind: "bad", text: "Vous avez promis un résultat." });
      return items.concat(cs.vars.debriefJugement || []);
    };
    def.epilogue = function (api, o) {
      const pn = api.cs.vars.peine;
      if (o.type === "non_lieu") return o.detail && /irresponsabilité/.test(o.detail) ? `${nomA} a été déclaré${e(A)} pénalement irresponsable ; ${A.g === "f" ? "elle" : "il"} est hospitalisé${e(A)} sous contrainte.` : `Non-lieu : ${nomA} est sorti${e(A)} de l'information sans procès.`;
      if (o.type === "acquittement" || o.type === "relaxe") return `${nomA} a été ${o.type === "acquittement" ? "acquitté" : "relaxé"}${e(A)}. ${pk(CR.seeded(t.sig + ":epi"), ["Il a pris le premier train pour chez sa mère.", "La famille de la victime a quitté la salle en silence.", "Le parquet a longtemps hésité à faire appel."])}`;
      if (t.camp === "pc") return o.type === "indemnise" ? `${nom(C)} a obtenu ${o.detail}. « Ce n'est pas l'argent. C'est qu'on a dit ce qui s'est passé. »` : `${nom(C)} est reparti${e(C)} sans ce qu'${C.g === "f" ? "elle" : "il"} attendait.`;
      return pn ? `${pn.texte}. ${pn.ferme > 120 ? `${A.prenom} sera transféré${e(A)} en centre de détention.` : `${A.prenom} espère un aménagement en cours de peine.`}` : "Dossier terminé.";
    };
    def.fiche = function (api, o) {
      return {
        phrase: `${CR.cap(q.label)}, information judiciaire${t.mineur ? " (mineur)" : ""}, ${D0 ? `avocat de ${nomA}` : `avocat de ${nom(C)}, partie civile`}.`,
        notions: [
          { titre: I.nom, regle: `${I.elements.materiel} ${I.elements.moral}`, art: q.court, prog: "dps" },
          { titre: "L'information judiciaire", regle: "Obligatoire en matière criminelle (art. 79) ; mise en examen sur indices graves ou concordants (art. 80-1), sinon témoin assisté ; détention criminelle d'un an, prolongations de six mois (art. 145-2) ; avis de fin d'information et délais d'un ou trois mois (art. 175) ; non-lieu, mise en accusation ou renvoi.", art: "art. 79, 80-1, 145-2, 175 à 181 CPP", prog: "pp_instruction" },
          { titre: "La juridiction de jugement", regle: "Cour criminelle départementale : crimes punis de quinze ou vingt ans, commis par un majeur, " + CR.ccdRegle() + " ; cour d'assises avec jury pour les autres ; magistrats seuls pour le trafic de stupéfiants ; tribunal pour enfants ou cour d'assises des mineurs pour les mineurs ; appel dans les dix jours devant une cour d'assises d'appel (neuf jurés).", art: "art. 380-16, 380-1, 380-9 CPP ; art. L. 231-9 CJPM", prog: "pp_jugement" },
        ],
        piege: enjeux.length ? `Repérer l'enjeu dans les pièces (${enjeux.map((z) => z.label.toLowerCase()).join(" ; ")}), et le porter au bon moment : demande d'actes, observations de l'article 175, plaidoirie.` : "Lire chaque pièce de la garde à vue et de l'information.",
        devenir: def.epilogue(api, o),
      };
    };
    def.corrige = function () {
      const out = [{ probleme: "Quelle qualification, quelle juridiction ?", regle: `${CR.cap(q.label)} : ${CAT.encourueTexte(q)} (${q.court}).${t.mineur ? " Atténuation de minorité : la moitié de la peine encourue." : ""}`, application: `${N.resume} Juridiction : ${CAT.JUR_LABEL[t.jur]}.` }];
      if (t.q2) out.push({ probleme: "Une autre qualification ?", regle: `${CR.cap(t.q2.label)} (${t.q2.court}) : ${CAT.encourueTexte(t.q2)}.`, application: CAT.ENJEUX[requalifEnjeu] ? `${CAT.enjeu(requalifEnjeu, A, V).label} : ${CAT.enjeu(requalifEnjeu, A, V).arg}` : "" });
      for (const en of enjeux) out.push({ probleme: en.label, regle: (en.textes || []).filter((k) => CR.TEXTES[k]).map((k) => CR.TEXTES[k].cite).join(" ; ") || "—", application: en.fort ? en.txtFort.replace(/^« |»$/g, "") : `Le dossier le dément : ${en.faible.replace(/^« |»$/g, "")}` });
      for (const id of t.irr) { const an = PZ.anomalies[id]; if (an) { const ir = CR.IRREG[an.irreg]; out.push({ probleme: ir.label, regle: ir.regle, application: `${PZ.titres[an.piece] || "Pièce"} : ${ir.effet}.` }); } }
      return out;
    };
    return def;
  };

  // ------------------------------------------------------------------ Demandes d'actes possibles, selon le dossier et le camp
  GEN2.actesOptions = function (t, N, D0) {
    const en = t.enjeux;
    const o = [];
    if (D0) {
      o.push({ id: "contre_psy", t: "Une contre-expertise psychiatrique, par un collège de deux experts.", ok: null, effet: { doc: "contre_expertise", enjeu: t.f.psy !== "intact" ? (t.f.psy === "aboli" ? "aboli" : "altere") : null } });
      if (en.includes("intention") || en.includes("causalite")) o.push({ id: "contre_ml", t: "Une contre-expertise médico-légale sur le mécanisme des lésions et la cause du décès.", ok: null, effet: { doc: "contre_expertise", enjeu: en.includes("causalite") ? "causalite" : "intention" } });
      if (en.includes("identification")) o.push({ id: "contre_adn", t: "Une contre-expertise génétique et la recherche d'autres profils.", ok: null, effet: { doc: "contre_expertise", enjeu: "identification" } });
      if (en.includes("ld") || en.includes("desistement") || en.includes("premeditation")) o.push({ id: "reconstitution", t: "Une reconstitution des faits sur les lieux.", ok: null, effet: { doc: "reconstitution" } });
      if (en.includes("consentement") || en.includes("ld") || en.includes("identification")) o.push({ id: "confrontation", t: "Une confrontation avec la partie civile ou le témoin principal.", ok: null, effet: { hearing: "confront" } });
      if (en.includes("contrainte") || en.includes("connaissance") || en.includes("role")) o.push({ id: "telephonie", t: "L'exploitation complète de la téléphonie et des messageries, à décharge.", ok: null, effet: { doc: "contre_expertise", enjeu: en.find((z) => ["contrainte", "connaissance", "role"].includes(z)) } });
      o.push({ id: "nonlieu", t: "Le prononcé d'un non-lieu immédiat.", ok: false, defect: "actes:nonlieu", refus: "un non-lieu, qui ne se demande pas par une demande d'actes" });
    } else {
      o.push({ id: "expertise_victime", t: "Une expertise médicale de la victime en vue de la consolidation de ses séquelles.", ok: null });
      if (en.includes("intention") || en.includes("premeditation")) o.push({ id: "contre_ml", t: "Une expertise médico-légale complémentaire sur la violence et la direction des coups.", ok: null });
      o.push({ id: "audition_proches", t: "L'audition des proches de la victime sur le contexte des faits.", ok: null });
      o.push({ id: "detention", t: "Le placement de la personne mise en examen en détention provisoire.", ok: false, defect: "actes:detention", refus: "la détention provisoire, que la partie civile n'a pas qualité à demander" });
    }
    for (const a of N.actes || []) o.splice(o.length - 1, 0, Object.assign({ ok: null }, a));
    return o;
  };

  // ------------------------------------------------------------------ Les affaires criminelles arrivent : cinq à quinze par année de carrière
  // Un intervalle tiré de 24 à 70 jours entre deux affaires (jamais deux grosses affaires la même semaine).
  GEN2.infoDue = function (s, d) {
    if (s.mode !== "carriere") return false;
    if (!s.genInfo) s.genInfo = { next: d + R.int(s, 10, 45), n: 0 };
    if (d < s.genInfo.next) return false;
    if (!CR.isBusinessDay(d)) return false;
    s.genInfo.next = d + R.int(s, 24, 70);
    s.genInfo.n++;
    return true;
  };
})();
