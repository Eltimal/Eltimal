// Dialogues des affaires générées : 1 000 affaires (garde à vue, comparution immédiate, audition libre, ordonnance pénale,
// convocation, victime, information judiciaire), chaque entretien, appel, dépôt, parloir, audition et réplique d'audience parcourus.
// Vérifie :
//  1. rien de technique à l'écran : ni « ${ », ni « undefined », ni « [object », ni NaN, ni null, ni accolade de variable ;
//  2. les accords : chaque pronom, civilité et participe accordé à une personne l'est selon le genre et le nombre de cette
//     personne (traçage : les accords portent la marque ⟦A⟧, ⟦V⟧… de la personne) ; le sujet et son participe désignent la même
//     personne ; la personne qui parle s'accorde à la première personne (« je suis convoquée ») ; civilité et nom concordent ;
//     les pronoms laissés en dur sont comptés et affichés ;
//  3. les questions suivent l'infraction : pas de « qui a vu la scène » pour un abus de confiance, pas d'accès aux comptes pour
//     des violences, pas de « ce soir » hors de la garde à vue, la famille parle de la personne à la troisième personne ;
//  4. les fiches internes ne sont pas recopiées (« Sommes détournées : … ») ;
//  5. le même tirage redonne les mêmes phrases, y compris après passage par la sauvegarde (JSON).
// Usage : node tests/tdialogues.js [affaires par graine, défaut 200]   EXEMPLES=1 affiche deux entretiens complets.
const { boot, sleep } = require("./harness");
const D = require("./dial");
let fails = 0;
const shown = new Map();
const ok = (c, m, k) => { if (c) return; fails++; const key = k || m; const n = (shown.get(key) || 0) + 1; shown.set(key, n); if (n <= 3) console.log("ÉCHEC", m); };

const PART = ["convoqué", "reconnu", "entendu", "condamné", "poursuivi", "relaxé", "placé", "arrêté", "interpellé", "déféré", "blessé", "tombé", "resté", "parti", "venu", "sorti", "rentré", "né", "seul", "sûr", "perdu", "choqué", "traumatisé", "fatigué", "inquiet", "désolé", "prêt", "assis", "allé", "arrivé", "hospitalisé", "opéré", "soigné", "forcé", "obligé", "harcelé", "menacé", "frappé", "insulté", "agressé", "trompé", "escroqué", "humilié", "appelé", "réveillé", "étonné", "surpris", "heureux", "marié", "séparé", "divorcé", "certain", "persuadé", "innocent", "énervé", "saoul", "défoncé", "bourré", "embarqué", "plaqué", "menotté", "attaché", "enfermé", "libéré", "incarcéré", "détenu", "abandonné", "mis", "pris", "suivi", "consolidé", "accusé", "paniqué", "terrifié", "mort", "habitué", "convaincu", "attendu", "assuré", "licencié", "viré", "embauché", "hébergé", "logé", "inscrit", "fier", "jaloux", "fou", "sérieux", "perdu", "épuisé", "tranquillisé", "rassuré", "retrouvé", "coincé", "bloqué", "poussé", "touché", "attrapé", "giflé", "bousculé", "traité", "regardé", "vu", "prévenu"];
const FEM = (w) => ({ inquiet: "inquiète", heureux: "heureuse", jaloux: "jalouse", sérieux: "sérieuse", fou: "folle", fier: "fière" }[w] || w + "e");
const MASC = new Set(PART);
const FEMS = new Map(PART.map((w) => [FEM(w), w]));
const COD = new Set(["appelé", "frappé", "poussé", "attrapé", "insulté", "menacé", "suivi", "coincé", "réveillé", "prévenu", "convoqué", "accusé", "traité", "bousculé", "agressé", "embrassé", "vu", "regardé", "reconnu", "entendu", "giflé", "plaqué", "arrêté", "interpellé", "forcé", "obligé", "harcelé", "trompé", "escroqué", "humilié", "retrouvé", "blessé", "attaché", "enfermé", "embarqué", "menotté", "relâché", "libéré", "placé"]);
// Formes des pronoms et civilités : [genre, nombre]
const FORMES = { il: ["m", 1], Il: ["m", 1], elle: ["f", 1], Elle: ["f", 1], ils: ["m", 2], Ils: ["m", 2], elles: ["f", 2], Elles: ["f", 2], celui: ["m", 1], Celui: ["m", 1], celle: ["f", 1], Celle: ["f", 1], ceux: ["m", 2], Ceux: ["m", 2], celles: ["f", 2], Celles: ["f", 2], le: ["m", 1], Le: ["m", 1], la: ["f", 1], La: ["f", 1], "M.": ["m", 1], Mme: ["f", 1], "MM.": ["m", 2], Mmes: ["f", 2], Monsieur: ["m", 1], Madame: ["f", 1], Messieurs: ["m", 2], Mesdames: ["f", 2], un: ["m", 1], une: ["f", 1], Un: ["m", 1], Une: ["f", 1], cette: ["f", 1], Cette: ["f", 1], ce: ["m", 1], Ce: ["m", 1], mon: ["m", 1], ma: ["f", 1], Mon: ["m", 1], Ma: ["f", 1], client: ["m", 1], cliente: ["f", 1], clients: ["m", 2], clientes: ["f", 2], "l'accusé": ["m", 1], "l'accusée": ["f", 1], prévenu: ["m", 1], prévenue: ["f", 1], prévenus: ["m", 2], prévenues: ["f", 2] };
const NEUTRES = new Set(["lui", "leur", "les", "Les", "des", "aux", "du", "au", "de la", "à la", "son", "sa", "leurs", "mes"]);
const IMPERSONNEL = /^(n'est (?:pas )?(?:trop )?tard|va se passer|vous reste|nous reste|me reste|te reste|leur reste|me manque|nous manque|manque|a fallu|n'est résulté|est résulté|était plus de|est plus de|est (?:pas )?(?:trop )?tard|y|faut|fallait|faudra|faudrait|paraît|paraissait|semble|semblait|s'agit|s'agissait|reste|restait|suffit|suffisait|vaut|valait|pleut|pleuvait|neige|n'y|arrive que|se passe|se passait|s'est passé|se peut|en va|manque|est (?:temps|tard|trop tard|possible|impossible|probable|clair|vrai|normal|interdit|difficile|urgent|important|\d)|était (?:temps|tard|une fois|\d|tard))/;

// Noms qui peuvent précéder un pronom écrit en dur sans désigner une personne de l'affaire (objets, tiers, noms d'un genre fixe)
const ANT_M = /\b(appartement|logement|profils?|gars|type|mec|parquet|point|compagnon|copain|ami|cousin|fils|père|frère|mari|oncle|cousin|grand-père|papa|patron|médecin|docteur|policier|officier|gardien|juge|procureur|président|avocat|chef de quart|téléphone|portable|compte|dossier|couteau|coup|sac|appareil|scooter|vélo|véhicule|camion|papier|message|chien|feu|tribunal|procès|courrier|procès-verbal|témoin|caméraman|légiste|expert|enquêteur|directeur|commissaire|gérant|serrurier|garagiste|monsieur|homme qui|compagnon de cellule|codétenu|bébé|nourrisson|petit)\b/i;
const ANT_F = /\b(ligne|question|compagne|copine|amie|mère|sœur|fille|tante|grand-mère|cousine|maman|voiture|porte|lettre|police|banque|ordonnance|caméra|carte|convocation|plainte|préméditation|intention|lame|arme|balle|chambre|cuisine|maison|victime|personne|famille|association|société|entreprise|boîte|fenêtre|vidéo|image|adresse|affaire|audience|procédure|rue|nuit|soirée|fête|dispute|somme|dette|amende|peine|détention|juge|présidente|procureure|avocate|psychologue|experte|légiste|infirmière|directrice|gérante|dame|femme qui|patronne|voisine du dessus|assistante|enquêtrice|commissaire|brigade|patrouille|ambulance|alarme|clé|serrure|fumée)\b/i;
const METF = {};
function fixes(t, def) {
  const CAT = global.__CAT;
  const I = CAT.INF[t.inf];
  const fx = {};
  if (I.info) {
    const pers = (I.ctxs[t.f.ctx] && I.ctxs[t.f.ctx].pers) || {};
    if (pers.A && pers.A.g) fx.A = t.A.g;
    if (pers.V && (pers.V.g || pers.V.rel === "conjoint" || pers.V.agent)) fx.V = t.V.g;
    if (pers.V && pers.V.rel === "conjoint") fx.A = t.A.g;
  } else {
    if (I.sexes || I.conjugal || (t.f.agg || []).some((a) => a === "conjoint" || a === "ex_conjoint")) { fx.A = t.A.g; if (t.V) fx.V = t.V.g; }
    if (t.V && t.V.agent) fx.V = t.V.g;
  }
  if (t.C2) fx.C2 = t.C2.g;
  if (t.PM) fx.PM = "f";
  if (def && def.famille) fx.F = def.famille.g;
  return fx;
}
function variante(p, G, fx) {
  const p2 = JSON.parse(JSON.stringify(p));
  const t = p2.t;
  const METM = Object.fromEntries(Object.entries(METF).map(([m, f]) => [f, m]));
  for (const k of ["A", "V", "T", "T2", "P", "R"]) {
    const P = t[k];
    if (!P || fx[k]) continue;
    P.g = G;
    if (P.metier) P.metier = G === "f" ? METF[P.metier] || P.metier : METM[P.metier] || P.metier;
  }
  const P = t.P, V = t.V;
  if (P && V && P.rel) {
    const pg = P.g;
    if (/^(sa|son) /.test(P.lien || "")) P.lien = { enfant: pg === "f" ? "sa fille" : "son fils", parent: pg === "f" ? "sa mère" : "son père", conjoint: pg === "f" ? "son épouse" : "son mari", fratrie: pg === "f" ? "sa sœur" : "son frère" }[P.rel];
    else if (P.lien) P.lien = { enfant: pg === "f" ? "fille" : "fils", parent: pg === "f" ? "mère" : "père", conjoint: pg === "f" ? "épouse" : "mari", fratrie: pg === "f" ? "sœur" : "frère" }[P.rel];
    if (P.dit) P.dit = { enfant: V.g === "f" ? "ma mère" : "mon père", parent: V.g === "f" ? "ma fille" : "mon fils", conjoint: V.g === "f" ? "ma femme" : "mon mari", fratrie: V.g === "f" ? "ma sœur" : "mon frère" }[P.rel];
  }
  return p2;
}

(async () => {
  const env = boot();
  const { CR, errors } = env;
  await sleep(150);
  const PR = CR.GEN2.PR;
  global.__CAT = CR.CAT;
  Object.assign(METF, CR.MONDE.METIERS_F);
  const PAR = +(process.argv[2] || 200);
  const SEEDS = [13, 29, 31, 47, 53];
  const GENRES = ["gav", "ci", "al", "op", "copj", "pc", "info", "pc", "copj", "info"];
  const st = { n: 0, genre: {}, hum: {}, reg: {}, cat: {}, appels: 0, repliques: 0, durs: new Map(), durN: 0, exemples: {} };
  const textes = (d) => {
    const out = [];
    for (const c of d.calls) {
      for (const o of c.opening || []) out.push({ t: o, sp: null, k: c.key + ":ouv" });
      for (const tp of c.topics || []) { out.push({ t: tp.q, sp: null, k: c.key + ":q" }); let ctx = tp.q; for (const g of tp.segs) { out.push({ t: g.t, sp: c.speaker, k: c.key + ":" + tp.id, f: g.f, ctx }); ctx += " " + g.t; } }
      if (c.close) out.push({ t: c.close, sp: c.speaker, k: c.key + ":clo" });
      for (const x of c.extra || []) out.push({ t: x, sp: c.key === "gav" ? null : c.speaker, k: c.key + ":x" });
    }
    for (const a of d.audience) out.push({ t: a.t, sp: a.who === "prevenu" ? "A" : null, k: "aud:" + (a.who || "-"), who: a.who });
    return out;
  };
  const BAD = /\$\{|undefined|\[object|NaN|\bnull\b|« «|» »|\{[a-zA-Z_.]+\}|⟦|⟧| [.,](?!\d)|,,|  /;
  for (const seed of SEEDS) {
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
    s.settings.saisie = "liste";
    for (let i = 0; i < PAR; i++) {
      const kind = GENRES[i % GENRES.length];
      s.day = 20 + i; s.min = 9 * 60 + (i % 9) * 50;
      let cs, p;
      try { cs = CR.GEN.open(s, kind, { min: s.min, night: kind === "gav" && i % 4 === 0 }); p = s.generated.find((x) => x.id === cs.id); }
      catch (e) { ok(false, `graine ${seed} n° ${i} (${kind}) : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "tirage"); continue; }
      st.n++; st.genre[kind] = (st.genre[kind] || 0) + 1;
      const t = p.t;
      const id = `${cs.id} (${kind}, ${t.inf}${t.f.sc ? "/" + t.f.sc : t.f.ctx ? "/" + t.f.ctx : ""})`;
      // 1. le texte affiché
      let d1;
      try { d1 = D.collect(CR, s, cs, p); } catch (e) { ok(false, `${id} : dialogues illisibles ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "collect"); continue; }
      const T1 = textes(d1);
      st.appels += d1.calls.length; st.repliques += T1.length;
      for (const c of d1.calls) ok(!c.error, `${id} : ${c.key} ${c.error}`, "err:" + c.key);
      for (const x of T1) ok(typeof x.t === "string" && !BAD.test(x.t), `${id} [${x.k}] texte technique ou mal assemblé : « ${x.t} »`, "bad:" + (BAD.exec(x.t || "") || ["?"])[0]);
      // 4. pas de fiche interne recopiée
      for (const x of T1) if (x.sp) ok(!/(^|\. )(Sommes|Préjudice|Déficit|Frais|Pertes?|Réparations?|Valeur|Biens volés|Loyers|Dépréciation|Dommages|Provision)\b[^.]{0,70} : \d/.test(x.t), `${id} [${x.k}] fiche interne recopiée : « ${x.t} »`, "fiche");
      // 5. déterminisme et sauvegarde
      try {
        const p2 = JSON.parse(JSON.stringify(p));
        const d2 = D.collect(CR, s, cs, p2, CR.GEN2.def(p2));
        ok(JSON.stringify(textes(d2).map((x) => x.t)) === JSON.stringify(T1.map((x) => x.t)), `${id} : dialogues différents après la sauvegarde`, "det");
      } catch (e) { ok(false, `${id} : relecture ${e}`, "det2"); }
      // 3. les questions suivent l'infraction
      const N = CR.GEN2.recit(t, p.niveau);
      const cat = PR.categorie(t, N);
      const med = PR.trier(N.plainte || []).med.length > 0;
      const victime = kind === "pc" || (kind === "info" && t.camp === "pc");
      for (const c of d1.calls) {
        for (const tp of c.topics) {
          const q = tp.q;
          if (victime && c.key === "intake") {
            if (/vu la scène|du monde autour|assisté à ça|vu faire|entendu ces menaces/.test(q)) ok(cat === "scene", `${id} : question de scène pour ${PR.CATEGORIES[cat]} : « ${q} »`, "sujet:scene");
            if (/accès aux comptes|accès au compte|accès à l'argent/.test(q)) ok(t.inf === "abus_confiance", `${id} : question d'accès aux comptes hors abus de confiance : « ${q} »`, "sujet:comptes");
            if (/de l'accident/.test(q)) ok(cat === "route", `${id} : question d'accident hors route : « ${q} »`, "sujet:route");
            if (/messages/.test(q)) ok(["msg", "num", "fin"].includes(cat) || (N.qV || []).some((z) => z.q === q), `${id} : question de messages pour ${PR.CATEGORIES[cat]} : « ${q} »`, "sujet:msg");
            if (/codes/.test(q)) ok(t.inf === "acces_frauduleux", `${id} : question de codes : « ${q} »`, "sujet:codes");
            if (/Vous avez été blessé/.test(q)) ok(med, `${id} : question de blessure sans blessure : « ${q} »`, "sujet:blesse");
            if (kind === "pc") st.cat[cat] = (st.cat[cat] || 0) + (tp.id === "v_temoin" ? 1 : 0);
          }
          if (!["gav", "ci"].includes(kind) && c.key !== "gav" && c.key !== "depot") ok(!/ce soir/.test(q), `${id} : « ce soir » hors garde à vue : « ${q} »`, "sujet:soir");
          if (kind === "copj" && /garde à vue/.test(q)) ok(t.mesure === "gav", `${id} : garde à vue évoquée sans garde à vue`, "sujet:gav");
          if (c.speaker === "F") for (const g of tp.segs) if (["G_heberg", "G_emploi"].includes(g.f)) ok(!/^(J'habite|Je suis|Je cherche|Je vais|Je n'ai)/.test(g.t), `${id} : la famille parle à la première personne à la place du client : « ${g.t} »`, "sujet:famille");
        }
      }
      // 2. les accords, en traçage
      PR.trace(true);
      let d3, def3;
      try { def3 = CR.GEN2.def(p); d3 = D.collect(CR, s, cs, p, def3); } catch (e) { PR.trace(false); ok(false, `${id} : traçage ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "trace"); continue; }
      PR.trace(false);
      const accords = (t, def3, d3, monde) => {
        const pers = { A: t.A, V: t.V, T: t.T, T2: t.T2, P: t.P, C2: t.C2, R: t.R, PM: t.PM, F: def3.famille };
        const T3 = textes(d3);
      const grp = t.co ? (t.A.g === "f" && (!t.C2 || t.C2.g === "f") ? "f" : "m") : null;
      for (const x of T3) {
        const txt = x.t;
        // a. formes marquées
        for (const m of txt.matchAll(/(\S+?)⟦(\w+)⟧/g)) {
          const w = m[1].replace(/^[«(“"’]+/, "").replace(/^.*\b(l'accusée?)$/, "$1");
          const P = pers[m[2]];
          if (!P) { ok(false, `${id}${monde} [${x.k}] marque inconnue ${m[2]}`, "mk:inconnu"); continue; }
          if (NEUTRES.has(w)) continue;
          const F = FORMES[w];
          const okG = (g, n) => (n === 2 ? m[2] === "A" && grp && g === grp : g === P.g);
          if (F) ok(okG(F[0], F[1]), `${id}${monde} [${x.k}] « ${w} » pour ${m[2]} (${P.prenom} ${P.nom}, ${P.g}${m[2] === "A" && t.co ? ", avec coauteurs" : ""}) : « ${PR.sansMarques(txt)} »`, "accord:" + w);
          else {
            const pl = /s$/.test(w) && m[2] === "A" && grp;
            const g = pl ? grp : P.g;
            const fem = /(e|es|euse|euses|ète|ètes)$/.test(w);
            const masc = !/(ée|ées|ue|ues|ie|ies|euse|euses|ète|ètes|ise|ises|ite|ites|ste|stes)$/.test(w);
            ok(g === "f" ? fem : masc, `${id}${monde} [${x.k}] accord « ${w} » pour ${m[2]} (${P.g}) : « ${PR.sansMarques(txt)} »`, "participe");
          }
        }
        // b. le sujet et son participe désignent la même personne
        for (const m of txt.matchAll(/\b(?:Il|Elle|Ils|Elles|il|elle|ils|elles)⟦(\w+)⟧ (?:ne |n')?(?:est|sont|était|étaient|sera|seront|s'est|se sont|a été|ont été|avait été)(?: pas| jamais| plus| déjà| bien| toujours)? (?:\S+?)⟦(\w+)⟧/g)) ok(m[1] === m[2], `${id}${monde} [${x.k}] sujet ${m[1]} et participe accordé à ${m[2]} : « ${PR.sansMarques(txt)} »`, "sujet-participe");
        // c. la personne qui parle
        const sp = x.sp && pers[x.sp];
        if (sp) {
          const dire = txt.replace(/«[^«»]*»/g, " ").replace(/\([^()]*\)/g, " ");
          const chk = (w0, re) => {
            const mk = /⟦(\w+)⟧/.exec(w0);
            const w = w0.replace(/⟦\w+⟧/g, "").replace(/[.,;:!?…»)]+$/, "").toLowerCase();
            if (mk) { ok(mk[1] === x.sp, `${id}${monde} [${x.k}] « ${w} » accordé à ${mk[1]} dans la bouche de ${x.sp} : « ${PR.sansMarques(txt)} »`, "locuteur:marque"); return; }
            if (sp.g === "f" && MASC.has(w) && (!re || COD.has(w))) ok(false, `${id}${monde} [${x.k}] « ${w} » au masculin dans la bouche de ${sp.prenom} ${sp.nom} (f) : « ${PR.sansMarques(txt)} »`, "locuteur:m");
            const base = FEMS.get(w);
            if (sp.g === "m" && base && (!re || COD.has(base))) ok(false, `${id}${monde} [${x.k}] « ${w} » au féminin dans la bouche de ${sp.prenom} ${sp.nom} (m) : « ${PR.sansMarques(txt)} »`, "locuteur:f");
          };
          for (const m of dire.matchAll(/\b(?:je suis|j'étais|je serai|j'ai été|je me suis|je me sens|je reste|je me retrouve|suis resté|suis restée|j'habite|je vis|je vivais|j'habitais|je dors|je rentre|je rentrais)\s+(?:pas |plus |jamais |tout |toute |très |trop |encore |vraiment |bien |déjà |si |)(\S+)/gi)) chk(m[1], false);
          for (const m of dire.matchAll(/\bm'(?:a|ont|avait|avaient|aurait)\s+(?:pas |jamais |même |encore |)(\S+)/gi)) chk(m[1], true);
        }
        // d. civilité et nom
        for (const m of PR.sansMarques(txt).matchAll(/\b(M\.|Mme|Monsieur|Madame) (?:([A-ZÀ-Ý][\wà-ÿ'-]+) )?([A-ZÀ-Ý][\wà-ÿ'-]+(?: [A-ZÀ-Ý][\wà-ÿ'-]+)?)/g)) {
          const g = /^(M\.|Monsieur)$/.test(m[1]) ? "m" : "f";
          const full = m[2] ? `${m[2]} ${m[3]}` : null;
          const cand = Object.entries(pers).filter(([, P]) => P && (full ? `${P.prenom} ${P.nom}` === full : P.nom === m[3] || `${P.prenom} ${P.nom}` === m[3]));
          if (cand.length === 1) ok(cand[0][1].g === g, `${id}${monde} [${x.k}] ${m[0]} pour ${cand[0][0]} (${cand[0][1].g}) : « ${PR.sansMarques(txt)} »`, "civilite");
        }
      }
      };
      accords(t, def3, d3, "");
      // f. mondes d'un seul genre : chaque personne dont le genre n'est pas fixé par le récit devient femme, puis homme ;
      //    un pronom écrit en dur de l'autre genre doit alors renvoyer à une personne fixée, ou à un nom de ce genre qui le précède
      const fx = fixes(t, def3);
      for (const G of ["f", "m"]) {
        const pv = variante(p, G, fx);
        PR.trace(true);
        let dv, defv;
        try { defv = CR.GEN2.def(pv); dv = D.collect(CR, s, cs, pv, defv); } catch (e) { PR.trace(false); ok(false, `${id} : monde ${G} ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "monde"); continue; }
        PR.trace(false);
        accords(pv.t, defv, dv, ` monde « ${G} »`);
        const autre = G === "f" ? "m" : "f";
        const fixeAutre = Object.values(fx).includes(autre);
        for (const x of textes(dv)) {
          for (const m of x.t.matchAll(/(^|[\s«(])(Il|il|Elle|elle|celui|celle|Celui|Celle)(?![⟦\wà-ÿ'-])\s*(.{0,30})/g)) {
            const g = /^(Il|il|celui|Celui)$/.test(m[2]) ? "m" : "f";
            if (g === G || fixeAutre) continue;
            if (g === "m" && IMPERSONNEL.test(m[3])) continue;
            const avant = PR.sansMarques((x.ctx ? x.ctx + " " : "") + x.t.slice(0, m.index + m[1].length));
            if ((g === "m" ? ANT_M : ANT_F).test(avant)) continue;
            st.durN++;
            ok(false, `${id} [${x.k}] monde « ${G} » : « ${m[2]} » écrit en dur : « ${PR.sansMarques(x.t)} »`, "dur:" + PR.sansMarques(m[2] + " " + m[3]).slice(0, 20));
          }
        }
      }
      // voix
      const pers0 = { A: t.A, V: t.V, T: t.T, T2: t.T2, P: t.P, C2: t.C2, R: t.R, PM: t.PM, F: def3.famille };
      for (const c of d1.calls) if (c.speaker) { const P = pers0[c.speaker]; if (P) { const V = PR.voix(t, P, "x"); st.reg[V.reg] = (st.reg[V.reg] || 0) + 1; } }
      if (process.env.EXEMPLES) {
        if (!st.exemples.v && kind === "pc" && /abus|escroq/.test(t.inf)) st.exemples.v = { id, d: d1 };
        if (!st.exemples.p && kind === "copj" && t.stance !== "reconnait") st.exemples.p = { id, d: d1 };
      }
    }
  }
  console.log(`affaires : ${st.n} (${Object.entries(st.genre).map(([k, v]) => k + " " + v).join(", ")}) | appels et entretiens : ${st.appels} | répliques lues : ${st.repliques}`);
  console.log(`registres des clients : ${Object.entries(st.reg).map(([k, v]) => k + " " + v).join(", ")} | questions adaptées (victimes) : ${Object.entries(st.cat).map(([k, v]) => k + " " + v).join(", ")}`);
  console.log(`pronoms écrits en dur qui ne suivent pas le genre d'une personne (mondes d'un seul genre) : ${st.durN}`);
  if (process.env.EXEMPLES) for (const k of ["v", "p"]) { const e = st.exemples[k]; if (!e) continue; console.log("\n=====", e.id); for (const c of e.d.calls) if (c.key === "intake") for (const l of c.lines) console.log(l); }
  console.log(`\néchecs: ${fails}`);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
