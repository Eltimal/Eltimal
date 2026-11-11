/* La Permanence — saisie des articles (feuille de route, n° 11).
   Le joueur tape le numéro d'un article au lieu de le choisir dans une liste. Ce fichier lit la saisie avec tolérance,
   dit ce qu'il a compris, note la réponse (erreurs graduées) et repère les citations à masquer dans les actes et au procès.
   Les numéros attendus doivent exister dans la base des textes (texts.js) : voir CR.citeBaseCheck et tests/tcite.js. */
(function () {
  const CR = (window.CR = window.CR || {});

  // =================================================================== Codes et textes citables
  // id = préfixe des identifiants de la base (CPP_63-1, CP_R625-1, CR_L234-2, L85_3…)
  CR.CODES = [
    { id: "CPP", court: "CPP", label: "code de procédure pénale", de: "du code de procédure pénale", re: /\b(?:cpp|c\.?\s*p\.?\s*p\b\.?|c\.?\s*pr\.?\s*pen\b\.?|code\s+de\s+procedure\s+penale|procedure\s+penale)/ },
    { id: "CP", court: "CP", label: "code pénal", de: "du code pénal", re: /\b(?:cp\b|c\.?\s*pen\b\.?|code\s+penal)/ },
    { id: "CR", court: "C. route", label: "code de la route", de: "du code de la route", re: /\b(?:c\.?\s*route|code\s+de\s+la\s+route)/ },
    { id: "L85", court: "Loi 1985", label: "loi du 5 juillet 1985", de: "de la loi du 5 juillet 1985", re: /\b(?:loi\s+(?:n\s*[°o]?\s*)?85-677(?:\s+du\s+5\s+juillet\s+1985)?|loi\s+(?:du\s+)?5\s+juillet\s+1985|loi\s+badinter)/ },
    { id: "L71", court: "Loi 1971", label: "loi du 31 décembre 1971", de: "de la loi du 31 décembre 1971", re: /\b(?:loi\s+(?:n\s*[°o]?\s*)?71-1130(?:\s+du\s+31\s+decembre\s+1971)?|loi\s+(?:du\s+)?31\s+decembre\s+1971)/ },
    { id: "D91", court: "Décret 1991", label: "décret du 27 novembre 1991", de: "du décret du 27 novembre 1991", re: /\b(?:decret\s+(?:n\s*[°o]?\s*)?91-1197(?:\s+du\s+27\s+novembre\s+1991)?|decret\s+(?:du\s+)?27\s+novembre\s+1991)/ },
    { id: "RIN", court: "RIN", label: "règlement intérieur national", de: "du règlement intérieur national", re: /\b(?:rin\b|reglement\s+interieur(?:\s+national)?(?:\s+de\s+la\s+profession\s+d'avocats?)?)/ },
    // ajoutés avec le moteur génératif (stupéfiants, affaires)
    { id: "CSP", court: "CSP", label: "code de la santé publique", de: "du code de la santé publique", re: /\b(?:csp\b|c\.?\s*sante\s+pub(?:l\.?|lique)?\b|code\s+de\s+la\s+sante\s+publique|sante\s+publique)/ },
    { id: "CCOM", court: "C. com.", label: "code de commerce", de: "du code de commerce", re: /\b(?:c\.?\s*com\b\.?|code\s+de\s+commerce)/ },
    { id: "CGI", court: "CGI", label: "code général des impôts", de: "du code général des impôts", re: /\b(?:cgi\b|code\s+general\s+des\s+impots)/ },
    // ajouté avec la phase 2 (mineurs)
    { id: "CJPM", court: "CJPM", label: "code de la justice pénale des mineurs", de: "du code de la justice pénale des mineurs", re: /\b(?:cjpm\b|code\s+de\s+la\s+justice\s+penale\s+des\s+mineurs|justice\s+penale\s+des\s+mineurs)/ },
    // ajoutés avec le n° 12 (pénal des affaires, armes)
    { id: "LPF", court: "LPF", label: "livre des procédures fiscales", de: "du livre des procédures fiscales", re: /\b(?:lpf\b|livre\s+des\s+procedures\s+fiscales|procedures\s+fiscales)/ },
    { id: "CSI", court: "CSI", label: "code de la sécurité intérieure", de: "du code de la sécurité intérieure", re: /\b(?:csi\b|c\.?\s*sec\.?\s*int\b\.?|code\s+de\s+la\s+securite\s+interieure|securite\s+interieure)/ },
  ];
  CR.codeOf = (id) => CR.CODES.find((c) => c.id === id) || null;

  // Modes de saisie : la liste d'autrefois, ou la saisie libre, assistée, d'examen
  CR.SAISIE_MODES = [
    ["assiste", "Assisté", "Un indice après une erreur, puis la réponse."],
    ["libre", "Libre", "Sans aide : on vous dit seulement si c'est juste, trois essais."],
    ["examen", "Examen", "Sans seconde chance : la note tombe à l'acte ou à l'audience."],
    ["liste", "Liste", "Pas de saisie : les articles sont écrits dans les choix, comme avant."],
  ];
  CR.saisieMode = (s) => { const m = s && s.settings && s.settings.saisie; return CR.SAISIE_MODES.some((x) => x[0] === m) ? m : "assiste"; };
  CR.saisieOn = (s) => CR.saisieMode(s) !== "liste";

  // =================================================================== Lecture tolérante
  const SUFFIX = "bis|ter|quater|quinquies|sexies|septies|octies";
  const fold = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[‐-―−_]/g, "-").replace(/[  ]/g, " ").replace(/[’`]/g, "'");
  CR.foldCite = fold;
  // « r. 625-1 », « L234-2 », « 63 - 1 », « 434-15 bis » → « R625-1 », « L234-2 », « 63-1 », « 434-15 bis »
  CR.normNum = function (raw) {
    const t = fold(raw).replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").trim();
    const m = t.match(new RegExp(`^([lrda])?\\.?\\s*(\\d+(?:-\\d+)*)(?:\\s*-?\\s*(${SUFFIX}))?$`));
    if (!m) return null;
    return (m[1] ? m[1].toUpperCase() : "") + m[2].replace(/^0+(\d)/, "$1") + (m[3] ? " " + m[3] : "");
  };
  CR.refKey = (r) => (r ? `${r.code}_${r.num}` : "");
  CR.refOfId = function (id) {
    const m = /^(CPP|CP|CR|L85|L71|D91|RIN|CSP|CCOM|CGI|CJPM|LPF|CSI)_(.+)$/.exec(id || "");
    if (!m) return null;
    const num = CR.normNum(m[2]);
    return num ? { code: m[1], num } : null;
  };
  CR.sameRef = (a, b) => !!(a && b && a.code === b.code && a.num === b.num);
  const numShow = (num) => num.replace(/^([LRDA])(\d)/, "$1. $2");
  CR.numLabel = (r) => (r ? numShow(r.num) : "");
  // « article 63-1 du code de procédure pénale » — sans le titre de l'article
  CR.citeLabel = (r, court) => {
    if (!r) return "";
    const c = CR.codeOf(r.code);
    return court ? `art. ${numShow(r.num)} ${c ? c.court : r.code}` : `article ${numShow(r.num)} ${c ? c.de : ""}`.trim();
  };

  // Lit une saisie libre. Le code tapé l'emporte sur le code choisi dans le menu.
  CR.parseCite = function (input, defCode) {
    let t = fold(input);
    if (!t.trim()) return { vide: true };
    let code = null;
    for (const c of CR.CODES) { if (c.re.test(t)) { code = c.id; t = t.replace(c.re, " "); break; } }
    t = t.replace(/,\s*\d+\s*°/g, " ").replace(/\b\d+\s*°/g, " ");
    let al = null;
    const am = t.match(/(?:^|[\s,])(?:al(?:inea)?\.?|§)\s*(\d+|premier|1er)\b/);
    if (am) { al = /^\d+$/.test(am[1]) ? +am[1] : 1; t = t.replace(am[0], " "); }
    t = t.replace(/\b(?:articles?|arts?)\.?\s*/g, " ").replace(/\b(?:du|de la|de|des)\b|\bd'/g, " ")
      .replace(/[,;:()«»"'[\]]/g, " ").replace(/\s+/g, " ").replace(/\.\s*$/, "").trim();
    const num = CR.normNum(t);
    if (!num) return { illisible: true };
    return { code: code || defCode || "CPP", num, al, codeTape: !!code };
  };

  // =================================================================== Base de contrôle
  // Un article absent de la base du jeu est traité comme une faute de frappe : il faut corriger, sans pénalité.
  // Renumérotations connues (ancien numéro → nouveau) : une réponse attendue ne doit jamais y figurer (tests/tcite.js).
  CR.RENUM = {};
  let KNOWN = null;
  CR.scanCitations = function (text) {
    const out = [];
    const re = /\b(?:art\.|articles?)\s+((?:[LRD]\.\s?)?\d+(?:-\d+)*(?:\s(?:bis|ter|quater))?(?:(?:,\s*|\s+et\s+)(?:[LRD]\.\s?)?\d+(?:-\d+)*(?:\s(?:bis|ter|quater))?)*)\s+(?:du|de la)\s+(code de procédure pénale|code pénal|code de la route|code de la santé publique|code de commerce|code général des impôts|code de la justice pénale des mineurs|livre des procédures fiscales|code de la sécurité intérieure)/g;
    let m;
    while ((m = re.exec(String(text || "")))) {
      const code = { "code de procédure pénale": "CPP", "code pénal": "CP", "code de la route": "CR", "code de la santé publique": "CSP", "code de commerce": "CCOM", "code général des impôts": "CGI", "code de la justice pénale des mineurs": "CJPM", "livre des procédures fiscales": "LPF", "code de la sécurité intérieure": "CSI" }[m[2]];
      for (const n of m[1].split(/,\s*|\s+et\s+/)) { const num = CR.normNum(n); if (num) out.push({ code, num }); }
    }
    return out;
  };
  CR.knownArticles = function () {
    if (KNOWN) return KNOWN;
    KNOWN = new Set();
    for (const id of Object.keys(CR.TEXTES || {})) { const r = CR.refOfId(id); if (r) KNOWN.add(CR.refKey(r)); }
    const scan = (v) => { if (typeof v === "string") CR.scanCitations(v).forEach((r) => KNOWN.add(CR.refKey(r))); else if (v && typeof v === "object") Object.values(v).forEach(scan); };
    scan(CR.ACTES); scan(CR.IRREG); scan(CR.GLOSSAIRE); scan(CR.SOURCES);
    for (const t of Object.values(CR.TEXTES || {})) scan(t.texte);
    return KNOWN;
  };
  // Un numéro hors des bornes de son code n'existe pas : faute de frappe. La base embarquée ne contient pas tout le code,
  // d'où ces bornes larges (CP : 111-1 à 727-3 et R. 610-1 à R. 655-1 ; C. route : L./R. 110 à 450…).
  const BORNES = {
    CPP: { "": [1, 1000], R: [1, 400], D: [1, 600], A: [1, 60] },
    CP: { "": [111, 727, true], R: [610, 655, true] },
    CR: { L: [110, 450, true], R: [110, 450, true], D: [110, 450, true], A: [110, 450, true] },
    L85: { "": [1, 50] }, L71: { "": [1, 80] }, D91: { "": [1, 320] }, RIN: { "": [1, 21] },
    CSP: { L: [1110, 6500, true], R: [1110, 6500, true] }, CCOM: { L: [110, 960, true], R: [110, 960, true] }, CGI: { "": [1, 2000] },
    CJPM: { L: [11, 900, true], R: [11, 900, true], D: [11, 900, true] },
    LPF: { L: [1, 300], R: [1, 300], A: [1, 300] }, CSI: { L: [111, 900, true], R: [111, 900, true], D: [111, 900, true] },
  };
  CR.articlePlausible = function (r) {
    if (!r || !r.num) return false;
    const b = (BORNES[r.code] || {})[parts(r.num).pre];
    if (!b) return false;
    const P = parts(r.num);
    if (P.n.length > 4 || P.n.some((x) => !(x >= 0))) return false;
    if (b[2] && P.n.length < 2) return false;
    return P.n[0] >= b[0] && P.n[0] <= b[1];
  };
  CR.articleConnu = (r) => !!r && (CR.knownArticles().has(CR.refKey(r)) || CR.articlePlausible(r));
  CR.texteOf = (r) => (r ? (CR.TEXTES || {})[CR.refKey(r)] || null : null);

  // =================================================================== Notation graduée
  const parts = (num) => { const m = /^([LRDA]?)(\d+(?:-\d+)*)/.exec(num) || []; return { pre: m[1] || "", n: (m[2] || "").split("-").map(Number), suf: num.split(" ")[1] || "" }; };
  // Voisin : parent et enfant (63-4 et 63-4-1, 475 et 475-1), ou même rang à deux près (222-11 et 222-12, 385 et 386)
  CR.voisin = function (a, b) {
    const A = parts(a), B = parts(b);
    if (A.pre !== B.pre || a === b) return false;
    const [s, l] = A.n.length <= B.n.length ? [A.n, B.n] : [B.n, A.n];
    if (l.length - s.length === 1 && s.every((x, i) => x === l[i])) return true;
    if (A.n.length !== B.n.length) return false;
    const k = A.n.length - 1;
    return A.n.slice(0, k).every((x, i) => x === B.n[i]) && Math.abs(A.n[k] - B.n[k]) <= 2 && (A.suf === B.suf || A.n[k] === B.n[k]);
  };
  // g : ok | code (bon numéro, mauvais code) | voisin | faux | absent ; « aide » est donné par la saisie assistée
  CR.gradeCite = function (ref, expect) {
    const ex = (expect || []).filter(Boolean);
    if (!ref || !ref.num) return { g: "absent", attendu: ex[0] || null };
    if (ex.some((e) => CR.sameRef(e, ref))) return { g: "ok", attendu: ex.find((e) => CR.sameRef(e, ref)) };
    const c = ex.find((e) => e.num === ref.num);
    if (c) return { g: "code", attendu: c };
    const v = ex.find((e) => e.code === ref.code && CR.voisin(e.num, ref.num));
    if (v) return { g: "voisin", attendu: v };
    return { g: "faux", attendu: ex[0] || null };
  };
  // Poids de l'erreur : 0 rien, 1 erreur normale
  CR.CITE_POIDS = { ok: 0, code: 0.25, aide: 0.25, voisin: 0.5, faux: 1, absent: 1 };
  CR.CITE_LABEL = { ok: "Juste", code: "Bon article, mauvais code", aide: "Réponse donnée", voisin: "Article voisin", faux: "Article faux", absent: "Aucun article" };
  // Indice de la saisie assistée : le sujet du texte, puis le début du numéro
  CR.citeIndice = function (r) {
    if (!r) return "";
    const l = CR.lib(CR.refKey(r));
    const c = CR.codeOf(r.code);
    if (l && l.titre) return `Indice : le texte attendu porte sur « ${l.titre} » (${c ? c.label : r.code}).`;
    return `Indice : ${c ? c.label : r.code}, le numéro commence par ${numShow(r.num).slice(0, Math.max(1, Math.ceil(r.num.length / 3)))}…`;
  };

  // Articles ratés : ils reviennent dans la fiche de révision et dans le classeur
  CR.citeMiss = function (s, cs, e) {
    if (!e || !e.attendu || e.g === "ok") return;
    const row = { day: s.day, caseId: cs ? cs.id : null, attendu: CR.refKey(e.attendu), tape: e.tape ? CR.refKey(e.tape) : null, g: e.g, ctx: e.ctx || "" };
    s.revision = s.revision || [];
    s.revision.unshift(row);
    if (s.revision.length > 300) s.revision.length = 300;
    if (cs) { cs.citeLog = cs.citeLog || []; cs.citeLog.push(row); }
  };
  CR.keyLabel = (k) => { const r = CR.refOfId(k); return r ? CR.citeLabel(r) : k; };

  // =================================================================== Repérage des citations dans un texte d'acte ou d'argument
  // Masque le premier groupe de citations reconnues : « (art. 113-2-1 du code pénal) » → « (art. … du code pénal) ».
  // Un numéro sans code n'est retenu que s'il correspond à l'un des textes de `hintIds` (needs d'une option, cartes d'un argument).
  // Seuls les articles présents dans la base des textes sont attendus.
  const GRP = /\b(art\.|articles?)\s+((?:[LRD]\.\s?)?\d+(?:-\d+)*(?:\s(?:bis|ter|quater))?(?:(?:,\s*|\s+et\s+)(?:[LRD]\.\s?)?\d+(?:-\d+)*(?:\s(?:bis|ter|quater))?)*)(\s+(du code de procédure pénale|du code pénal|du code de la route|du code de la santé publique|du code de commerce|du code général des impôts|du livre des procédures fiscales|du code de la sécurité intérieure|de la loi n° 85-677 du 5 juillet 1985|de la loi du 5 juillet 1985))?/g;
  const PHRASE = { "du code de procédure pénale": "CPP", "du code pénal": "CP", "du code de la route": "CR", "du code de la santé publique": "CSP", "du code de commerce": "CCOM", "du code général des impôts": "CGI", "du livre des procédures fiscales": "LPF", "du code de la sécurité intérieure": "CSI", "de la loi n° 85-677 du 5 juillet 1985": "L85", "de la loi du 5 juillet 1985": "L85" };
  CR.citeSpec = function (text, hintIds) {
    if (typeof text !== "string" || !text) return null;
    const hints = [].concat(hintIds || []).map(CR.refOfId).filter(Boolean);
    GRP.lastIndex = 0;
    let m;
    while ((m = GRP.exec(text))) {
      const before = text.slice(Math.max(0, m.index - 30), m.index);
      const code = m[4] ? PHRASE[m[4]] : /1985,\s*$/.test(before) ? "L85" : null;
      const refs = [];
      for (const n of m[2].split(/,\s*|\s+et\s+/)) {
        const num = CR.normNum(n);
        if (!num) continue;
        if (code) { if ((CR.TEXTES || {})[`${code}_${num}`]) refs.push({ code, num }); }
        else { const h = hints.find((x) => x.num === num); if (h) refs.push(h); }
      }
      if (!refs.length) continue;
      return { before: text.slice(0, m.index), after: text.slice(m.index + m[0].length), mot: m[1], phrase: m[4] || "", code: code || refs[0].code, expect: refs, raw: m[0] };
    }
    return null;
  };
  // Un argument sans citation dans son libellé mais appuyé sur des textes : on demande le fondement
  CR.citeSpecIds = function (ids) {
    const refs = [].concat(ids || []).filter((id) => (CR.TEXTES || {})[id] && CR.refOfId(id)).map(CR.refOfId);
    return refs.length ? { before: "", after: "", mot: "art.", phrase: "", code: refs[0].code, expect: refs, raw: "", fondement: true } : null;
  };
  CR.citeMasked = (spec) => (spec ? `${spec.before}${spec.raw ? `${spec.mot} …${spec.phrase ? " " + spec.phrase : ""}` : ""}${spec.after}` : "");
  // Le texte tel que le joueur l'a écrit : son numéro (et son code s'il diffère) à la place de l'original
  CR.citeWritten = function (spec, ref) {
    if (!spec) return "";
    if (!spec.raw) return spec.before + spec.after;
    if (!ref) return `${spec.before}${spec.mot} [blanc]${spec.phrase ? " " + spec.phrase : ""}${spec.after}`;
    const c = CR.codeOf(ref.code);
    const phrase = ref.code === spec.code && spec.phrase ? spec.phrase : ref.code === spec.code ? "" : c ? c.de : "";
    return `${spec.before}${spec.mot} ${numShow(ref.num)}${phrase ? " " + phrase : ""}${spec.after}`;
  };
  // Libellé d'une carte de texte : sans son numéro quand la saisie est active
  CR.libLabel = (s, l, hide) => (hide && CR.saisieOn(s) ? `${l.titre}` : `${l.cite} — ${l.titre}`);

  // =================================================================== Contrôle de la base (test automatique)
  // Chaque réponse attendue existe dans la base des textes et n'a pas été renumérotée.
  CR.citeBaseCheck = function (expectKeys) {
    const bad = [];
    for (const k of expectKeys) {
      if (!(CR.TEXTES || {})[k]) bad.push({ k, why: "absent de la base des textes" });
      else if (CR.RENUM[k]) bad.push({ k, why: `renuméroté en ${CR.RENUM[k]}` });
      else if (!CR.refOfId(k)) bad.push({ k, why: "identifiant illisible" });
    }
    return bad;
  };
})();
