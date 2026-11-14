// La Permanence — refonte du gameplay, lot 4a : le tribunal qui raisonne (CR.TRIB)
// Le délibéré n'additionne plus des poids : il examine chaque élément de l'infraction — l'acte, son imputation au
// prévenu, l'intention —, cherche pour chacun la preuve qui le porte parmi les pièces qui restent au dossier (une pièce
// annulée en sort), et la confronte aux moyens que la défense a effectivement soutenus. Puis il examine les causes
// d'irresponsabilité. Le jugement écrit est la trace de ce raisonnement : le joueur lit pourquoi il a gagné ou perdu.
// Périmètre : les délits des affaires générées (le tirage porte ses preuves et ses doutes). Le reste garde l'ancien calcul.
(function () {
  "use strict";
  const CR = window.CR;
  const T = (CR.TRIB = {});

  // ------------------------------------------------------------------ Ce que chaque preuve prouve (D-08)
  // part de la force d'une preuve (B.FORCE, la même échelle qu'avant) portée par chaque élément
  T.PORTEE = {
    constat: { acte: 0.6, auteur: 0.9 }, plainte: { acte: 1, auteur: 0.6 }, certificat: { acte: 1.2, auteur: 0 },
    temoin: { acte: 1, auteur: 0.8 }, video: { acte: 1, auteur: 0.45 }, telephonie: { acte: 0.3, auteur: 1 },
    adn: { acte: 0.3, auteur: 1.1 }, expertise: { acte: 1, auteur: 0.2 }, saisie: { acte: 0.8, auteur: 0.9 },
    labo: { acte: 1, auteur: 0.4 }, ecrits: { acte: 0.9, auteur: 0.8 }, releve: { acte: 0.9, auteur: 0.7 },
    ethylo: { acte: 1, auteur: 0.9 }, fichier: { acte: 1, auteur: 0.6 }, autopsie: { acte: 1, auteur: 0 },
    aveux: { acte: 1, auteur: 1, intention: 1.2 },
  };
  // ce que chaque moyen de la défense attaque (doutes du tirage) ; ld = cause d'irresponsabilité
  T.ATTAQUE = { doute_ident: "auteur", alibi_tel: "auteur", temoin_contra: "acte", d_video: "acte", notif_permis: "intention", legitime_defense: "ld", d_deleg: "auteur" };
  // lot 7 : les moyens des affaires criminelles (enjeux du catalogue dont l'effet est l'acquittement)
  Object.assign(T.ATTAQUE, { identification: "auteur", consentement: "intention", connaissance: "intention", geste_medical: "acte", ld: "ld", contrainte: "ld", force_legitime: "ld" });
  T.ELEMENTS = [["acte", "L'élément matériel"], ["auteur", "L'imputation des faits au prévenu"], ["intention", "L'élément moral"]];
  // seuils (calés contre l'ancien calcul, D-10) ; la sévérité du magistrat les déplace un peu
  T.SEUIL = { acte: 0.27, auteur: 0.265, intention: 0.2 };

  const genT = (s, cs) => { const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) : null; return p && p.t ? p.t : null; };
  T.MOLLES = ["victime", "temoin", "video", "constat", "interro", "plainte", "medical", "expertise"];
  T.DOUTE_FORT = 0.5;
  T.crimes = true; // lot 7 : l'information judiciaire et les crimes (calibré contre l'ancien calcul, D-59)
  T.actif = (s, cs, spec) => { const t = genT(s, cs); if (!(t && spec && spec.pieces)) return false; const info = t.info || t.genre === "info" || (CR.CAT && CR.CAT.INF[t.inf] && CR.CAT.INF[t.inf].info); return !info || !!T.crimes; };

  // ------------------------------------------------------------------ Les motifs, en français de jugement
  const LIB = { constat: "les constatations des fonctionnaires interpellateurs", plainte: "les déclarations constantes de la partie civile", certificat: "les constatations médicales", temoin: "le témoignage recueilli au cours de l'enquête", video: "l'exploitation des images de vidéoprotection", telephonie: "l'exploitation des données téléphoniques", adn: "la comparaison génétique", expertise: "les conclusions de l'expertise", saisie: "la saisie opérée", labo: "l'analyse du laboratoire", ecrits: "les messages versés au dossier", releve: "les relevés bancaires", ethylo: "la mesure de l'imprégnation alcoolique", fichier: "les mentions du fichier national des permis de conduire", autopsie: "les constatations médico-légales", aveux: "les déclarations du prévenu lui-même" };
  const MOY = { doute_ident: "que l'identification du prévenu comme auteur des faits n'est pas établie avec certitude", alibi_tel: "que les données de son téléphone le situent ailleurs au moment des faits", temoin_contra: "que le témoin ne confirme pas la version de l'accusation", video: "que les images ne montrent pas le geste reproché", notif_permis: "que le prévenu ignorait la mesure dont la violation lui est reprochée", legitime_defense: "que le prévenu a agi en état de légitime défense", deleg: "que le prévenu avait valablement délégué ses pouvoirs" };
  Object.assign(MOY, { identification: "que l'identification de l'accusé comme auteur n'est pas établie avec certitude", consentement: "que l'absence de consentement n'est pas établie à son égard", connaissance: "qu'il ignorait ce que contenait le chargement", geste_medical: "qu'il s'agissait d'un geste médical", ld: "la légitime défense", contrainte: "la contrainte qu'il a subie", force_legitime: "que l'usage de la force était nécessaire et proportionné" });
  const liste = (a) => (a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " et " + a[a.length - 1]);
  // la cote d'une preuve, si la pièce est au dossier (moteur de documents)
  T.COTE_KEYS = { constat: ["pv_interpellation", "constat"], plainte: ["pv_victime", "plainte"], certificat: ["certificat_umj", "certificat", "umj"], temoin: ["pv_temoin", "temoin"], video: ["pv_video", "video"], telephonie: ["pv_telephonie"], adn: ["rapport_adn"], saisie: ["pv_saisie", "saisie", "pv_perquisition"], labo: ["rapport_labo"], ecrits: ["captures"], releve: ["releve"], ethylo: ["pv_alcoolemie"], fichier: ["fichier_permis"], aveux: ["pv_audition"], expertise: ["expertise"], autopsie: ["autopsie"] };
  T.LIB = LIB;
  T.cote = function (s, cs, k) {
    for (const key of T.COTE_KEYS[k] || []) {
      const d = cs.docs.find((x) => x.key === key);
      if (!d) continue;
      try { const r = CR.renderDoc(s, cs, d); if (r && r.cote) return r.cote; } catch (e) { /* pièce ancienne */ }
    }
    return null;
  };
  // ------------------------------------------------------------------ Le raisonnement
  // rend { coupable, elements: [{ id, porte, attaque, etabli, preuves:[{k, label, part}], moyens:[{k, label, soutenu}] }], ld, ... }
  T.raisonner = function (api, spec, ctx) {
    const { s, cs } = api;
    const t = genT(s, cs);
    const juge = ctx.juge || { severite: 0.5 };
    const played = new Set(ctx.played || []);
    const annules = (cs.proc && cs.proc.annules) || [];
    const E = {};
    for (const [id, label] of T.ELEMENTS) E[id] = { id, label, porte: 0, attaque: 0, preuves: [], moyens: [], ecartees: [] };
    E.ld = { id: "ld", label: "La légitime défense", porte: 0, attaque: 0, preuves: [], moyens: [], ecartees: [] };
    for (const [k, pc] of Object.entries(spec.pieces || {})) {
      if (pc.sens === "charge") {
        const por = T.PORTEE[k] || { acte: 1, auteur: 0.5 };
        if (annules.includes(k)) { for (const e of Object.keys(por)) if (E[e] && por[e]) E[e].ecartees.push({ k, label: pc.label }); continue; }
        for (const [e, part] of Object.entries(por)) if (E[e] && part) { E[e].porte += pc.force * part; E[e].preuves.push({ k, label: pc.label, part: pc.force * part }); }
      } else {
        const id = k.replace(/^d_/, ""), cible = T.ATTAQUE[id] || T.ATTAQUE[k] || "acte";
        const soutenu = !pc.need || [].concat(pc.need).some((n) => played.has(n) || (pc.noteSuffit && CR.hasFact(cs, n)));
        E[cible].moyens.push({ k, label: pc.label, soutenu, force: pc.force });
        if (soutenu) E[cible].attaque += pc.force * ({ ld: 1, acte: 1.9, intention: 0.8 }[cible] || 1.25);
      }
    }
    // lot 7 : un moyen fort et soutenu fait douter des preuves qu'il discute (témoins, victime, images, constatations,
    // déclarations), non des preuves matérielles (ADN, aveux, téléphonie, saisie) : l'élément perd une part de ce que ces
    // preuves « molles » lui apportaient. Affaires criminelles seulement (calibré contre l'ancien calcul, D-59).
    if (t && (t.info || t.genre === "info")) for (const [id] of T.ELEMENTS) {
      const e = E[id];
      if (!e.moyens.some((m) => m.soutenu && m.force >= 0.3)) continue;
      const molles = e.preuves.filter((p) => T.MOLLES.includes(p.k));
      const retire = molles.reduce((a, p) => a + p.part, 0) * T.DOUTE_FORT;
      e.porte -= retire; e.doutees = molles.map((p) => p.k);
    }
    // l'intention se déduit de l'acte établi, sauf moyen contraire
    E.intention.porte += Math.min(E.acte.porte, 0.45) * 0.6;
    // les arguments de culpabilité plaidés (anciennes fiches) : ils pèsent sur l'élément le plus discuté
    for (const [aid, a] of Object.entries(spec.arguments || {})) {
      if (a.type && a.type !== "culpabilite") continue;
      if (![].concat(a.cards || []).some((c) => played.has(c))) continue;
      const pert = a.pertinent ? a.pertinent(api, ctx) : true;
      E.auteur.attaque += pert ? a.poids : -0.04;
    }
    const sev = ((juge.severite || 0.5) - 0.5) * 0.1;
    const bruit = (CR.seeded(cs.id + "delib" + s.seed)() - 0.5) * 0.06;
    for (const [id] of T.ELEMENTS) {
      const e = E[id];
      e.net = e.porte - e.attaque + sev + bruit;
      e.etabli = e.net >= T.SEUIL[id];
      e.preuves.sort((x, y) => y.part - x.part);
    }
    // la légitime défense : admise si le moyen est soutenu et que l'accusation n'établit pas la riposte disproportionnée
    if (E.ld.moyens.length && !E.ld.moyens.some((m) => /legitime_defense|^d_ld$/.test(m.k))) E.ld.label = "La cause d'irresponsabilité invoquée";
    const ldMoyen = E.ld.moyens.find((m) => m.soutenu);
    E.ld.admise = !!ldMoyen && E.ld.attaque - (E.acte.porte - 0.35) * 0.5 + bruit > 0.06;
    const manque = T.ELEMENTS.map(([id]) => E[id]).find((e) => !e.etabli) || null;
    const coupable = !manque && !E.ld.admise;
    // le débrief, en corrigé d'examen : ce qui a établi chaque élément, ce que le dossier permettait et qui n'a pas été plaidé
    const calc = [];
    const nomPc = (k) => { const c = T.cote(s, cs, k); const lb = spec.pieces[k] && spec.pieces[k].label; return (LIB[k] || (lb ? lb.charAt(0).toLowerCase() + lb.slice(1) : k)) + (c ? ` (${c})` : ""); };
    for (const [id] of T.ELEMENTS) {
      const e = E[id];
      const par = e.preuves.slice(0, 2).map((p) => nomPc(p.k));
      calc.push({ k: e.etabli ? "charge" : "decharge", t: `${e.label} : ${e.etabli ? (par.length ? "établi par " + liste(par) : "établi par les circonstances") : "non établi" + (e.moyens.some((m) => m.soutenu) ? " : le moyen soutenu a fait naître le doute" : "")}.` });
      for (const m of e.moyens) if (!m.soutenu) calc.push({ k: "oubli", t: `Le dossier permettait de soutenir ${MOY[m.k.replace(/^d_/, "")] || "un doute"} : ce moyen n'a pas été plaidé.` });
      for (const p of e.ecartees) calc.push({ k: "annulee", t: `${CR.cap(LIB[p.k] || p.label)} : annulé${/^les /.test(LIB[p.k] || "") ? "s" : ""}, écarté${/^les /.test(LIB[p.k] || "") ? "s" : ""} du dossier.` });
      if (!e.etabli) break;
    }
    if (ldMoyen) calc.push({ k: E.ld.admise ? "decharge" : "charge", t: `Légitime défense : ${E.ld.admise ? "admise" : "écartée, la riposte n'apparaissant pas proportionnée"}.` });
    const R = { labels: Object.fromEntries(Object.entries(spec.pieces || {}).map(([k, pc]) => [k, pc.label])), coupable, manque: manque && manque.id, ld: E.ld.admise ? "admise" : ldMoyen ? "ecartee" : null, elements: T.ELEMENTS.map(([id]) => { const e = E[id]; return { id, etabli: e.etabli, preuves: e.preuves.slice(0, 3).map((p) => p.k), ecartees: e.ecartees.map((p) => p.k), moyens: e.moyens.map((m) => ({ k: m.k, soutenu: m.soutenu })) }; }), inf: t && t.inf };
    // score continu : la marge de l'élément le plus faible (positive = culpabilité établie), comme l'ancien score
    const score = Math.min(...T.ELEMENTS.map(([id]) => E[id].net - T.SEUIL[id])) - (E.ld.admise ? 1 : 0);
    // devant une cour criminelle, l'accusé (et non le prévenu)
    const jur = (cs.vars && (cs.vars.jurProces || "")) || (t && t.jur) || "";
    if (/assises|ccd/.test(jur)) { R.accuse = true; for (const c of calc) c.t = c.t.replace(/\bau prévenu\b/g, "à l'accusé").replace(/\bdu prévenu\b/g, "de l'accusé").replace(/\ble prévenu\b/g, "l'accusé").replace(/\bprévenu(e?)\b/g, "accusé$1"); }
    return { coupable, score, calc, questions: [], raisonnement: R };
  };

  const fr = (x) => x.replace(/\bde les\b/g, "des").replace(/\bde le\b/g, "du").replace(/\bà les\b/g, "aux").replace(/\bà le\b/g, "au");
  T.motifs = function (s, cs, R, nom) {
    const acc = (x) => (R && R.accuse ? x.replace(/\bau prévenu\b/g, "à l'accusé").replace(/\bdu prévenu\b/g, "de l'accusé").replace(/\ble prévenu\b/g, "l'accusé").replace(/\bprévenu\b/g, "accusé") : x);
    return T.motifs0(s, cs, R, nom).map((m) => Object.assign({}, m, { titre: acc(fr(m.titre || "")), t: acc(fr(m.t || "")) }));
  };
  T.motifs0 = function (s, cs, R, nom) {
    const out = [];
    const cite = (k) => { const c = T.cote(s, cs, k); const lb = R.labels && R.labels[k]; return (LIB[k] || (lb ? lb.charAt(0).toLowerCase() + lb.slice(1) : k)) + (c ? ` (${c})` : ""); };
    for (const el of R.elements) {
      const titre = { acte: "Sur la matérialité des faits", auteur: "Sur l'imputation des faits", intention: "Sur l'élément intentionnel" }[el.id];
      const moyens = el.moyens.filter((m) => m.soutenu).map((m) => MOY[m.k.replace(/^d_/, "")] || "que les faits ne sont pas établis");
      let txt = "";
      if (el.ecartees.length) txt += `Les actes annulés, ${liste(el.ecartees.map((k) => LIB[k] || k))}, sont retirés du dossier et ne peuvent fonder la décision. `;
      if (moyens.length) txt += `La défense soutient ${liste(moyens)}. `;
      if (el.etabli) txt += el.preuves.length ? `Il résulte${moyens.length ? " toutefois" : ""} ${el.id === "intention" ? "des circonstances mêmes de l'action et " : ""}${liste(el.preuves.map((k) => "de " + cite(k)))}, ${moyens.length ? "que cet argument ne suffit pas à faire naître un doute" : "que cet élément est établi"}${el.id === "auteur" ? ` à l'égard de ${nom}` : ""}.` : "Cet élément résulte des circonstances de l'action.";
      else txt += el.preuves.length ? `Or ${liste(el.preuves.map(cite))} ne ${el.preuves.length > 1 ? "suffisent" : "suffit"} pas, à ${el.preuves.length > 1 ? "eux" : "lui"} seul${el.preuves.length > 1 ? "s" : ""}, à l'établir avec la certitude qu'exige la loi pénale ; le doute doit profiter au prévenu.` : "Aucune pièce régulière du dossier ne permet de l'établir ; le doute doit profiter au prévenu.";
      out.push({ titre, t: txt.trim(), etabli: el.etabli });
      if (!el.etabli) break; // le tribunal s'arrête au premier élément manquant
    }
    if (R.ld && !out.some((x) => !x.etabli)) out.push({ titre: "Sur la légitime défense", t: "La défense soutient que le prévenu a agi en état de légitime défense. " + (R.ld === "admise" ? "Il ressort des débats que le prévenu a riposté à une atteinte injustifiée, dans le même temps et par un geste proportionné. Les conditions de l'article 122-5 du code pénal sont réunies : il n'est pas pénalement responsable." : "La riposte alléguée n'apparaît ni nécessaire ni proportionnée à l'atteinte invoquée ; les conditions de l'article 122-5 du code pénal ne sont pas réunies."), etabli: R.ld !== "admise" });
    return out;
  };

  // ------------------------------------------------------------------ Branchement : délibéré et jugement
  if (CR.PROC && CR.PROC.deliberer && !CR.PROC.deliberer.trib) {
    const ancien = CR.PROC.deliberer;
    CR.PROC.deliberer = function (api, spec, ctx) {
      if (T.off || !T.actif(api.s, api.cs, spec)) return ancien(api, spec, ctx);
      const d = T.raisonner(api, spec, ctx);
      const played = new Set(ctx.played || []);
      if (d.coupable && spec.qualif) d.qualif = spec.qualif(api, Object.assign({}, ctx, { played }));
      if (d.coupable && spec.peine) d.peine = spec.peine(api, Object.assign({}, ctx, { played, qualif: d.qualif }));
      if (spec.civil && api.cs.proc.pcConstituee !== false) d.civil = spec.civil(api, Object.assign({}, ctx, { played, coupable: d.coupable, qualif: d.qualif }));
      api.cs.vars.raisonnement = d.raisonnement;
      return d;
    };
    CR.PROC.deliberer.trib = true;
    CR.PROC.deliberer.ancien = ancien;
  }
  // le jugement : les motifs de culpabilité deviennent le raisonnement ; la décision écrite suit par le greffe (D-11)
  T.brancherJuger = function () {
    const PEN = CR.PEN;
    if (!PEN || !PEN.juger || PEN.juger.trib) return;
    const ancien = PEN.juger;
    PEN.juger = function (api, o) {
      const { s, cs } = api;
      delete cs.vars.raisonnement;
      const dec = ancien(api, o);
      const R = cs.vars.raisonnement;
      if (!R || !dec) return dec;
      const q = dec.questions.find((x) => x.q === "Sur la culpabilité");
      const M = T.motifs(s, cs, R, o.prevenuNom || "le prévenu");
      // les motifs propres à la qualification (concours, requalification, récidive) suivent le raisonnement sur les éléments
      const generique = /^Les éléments de la procédure, débattus contradictoirement|^Les éléments à charge qui subsistent/;
      if (q) q.motif = M.map((m) => `${m.titre}. ${m.t}`).join(" ") + (q.motif && !generique.test(q.motif) ? " " + q.motif : "");
      T.notifier(api, o, dec, M);
      return dec;
    };
    PEN.juger.trib = true;
  };
  T.brancherJuger();

  // ------------------------------------------------------------------ Le jugement écrit (trame : dev/ref/trames-pieces.md)
  const MAJ = (x) => String(x || "").toUpperCase();
  // « art. 221-1 et 221-4 CP » → « les articles 221-1 et 221-4 du code pénal »
  const CODES_NOM = { CP: "du code pénal", CPP: "du code de procédure pénale", "C. route": "du code de la route", CR: "du code de la route", CSP: "du code de la santé publique", CJPM: "du code de la justice pénale des mineurs", "C. com.": "du code de commerce", CGI: "du code général des impôts", CSI: "du code de la sécurité intérieure" };
  T.visa = function (court) {
    const x = String(court || "").trim();
    // « art. 221-1 et 221-4 CP et 132-8 CP » : un seul code ; « art. 224-1, al. 3 CP »
    const m = /^art\.\s+(.+?)\s+(CP|CPP|C\. route|CSP|CJPM|C\. com\.|CGI|CSI)((?:\s+et\s+[\d-]+(?:,\s*al\.\s*\d+)?\s+\2)*)$/.exec(x);
    if (!m) return x;
    const nums = (m[1] + (m[3] ? m[3].split(new RegExp("\\s+" + m[2].replace(/\./g, "\\.") + "(?=\\s|$)")).join("") : "")).replace(/\s+/g, " ").trim();
    const items = nums.split(/\s+et\s+/).map((n) => n.replace(/,\s*al\.\s*(\d+)/, ", alinéa $1"));
    const liste0 = items.length > 1 ? items.slice(0, -1).join(", ") + " et " + items[items.length - 1] : items[0];
    return `${items.length > 1 ? "les articles" : "l'article"} ${liste0} ${CODES_NOM[m[2]]}`;
  };
  const de = (x) => (/^[aeiouyéèêàâîôûœ]/i.test(x) || /^h(?!arc|ar|ai|on|au)/i.test(x) ? "d'" : "de ") + x;
  T.presidence = (nom) => (nom ? `${nom}, ${/^Mme\b/.test(nom) ? "présidente" : "président"}` : null);
  // la victime n'est partie civile que constituée
  T.pcConstituee = (J) => !!J.pc && !((J.dec && J.dec.questions) || []).some((q) => /civile/.test(q.q) && /Aucune constitution/.test(q.r || ""));
  T.notifier = function (api, o, dec, M) {
    const { s, cs } = api;
    const t = genT(s, cs);
    const jour = CR.addBusinessDays(s.day, 1 + (CR.hash(cs.id + ":notif") % 3));
    cs.vars.jugementEcrit = { day: s.day, min: s.min, titre: o.titre || "Jugement correctionnel", juridiction: o.juridiction || "tc", motifs: M, dec, prevenu: o.prevenuNom || "", pc: o.pcNom || "", qualif: dec.qualif ? { label: dec.qualif.label, court: dec.qualif.court || dec.qualif.art || "", aggs: dec.qualif.aggs || [] } : null, prevention: (cs.proc && cs.proc.prevention) || (t && CR.CAT && CR.CAT.INF[t.inf] ? CR.CAT.INF[t.inf].nom : ""), coupable: dec.coupable, notifie: jour, jurLabel: o.jurLabel || null, enAppel: !!o.enAppel, mineur: !!o.mineur, detenu: !!o.detenu, pcF: !!o.pcF, president: (CR.acteur(cs.actors && cs.actors.president) || {}).nom || "", parquet: (CR.acteur(cs.actors && cs.actors.parquet) || {}).nom || "", inf: t && t.inf };
    CR.schedule(s, { day: jour, min: 10 * 60 + (CR.hash(cs.id) % 300), type: "fn", key: "jugementEcrit", data: { caseId: cs.id } });
  };
  CR.GLOBAL_FN = CR.GLOBAL_FN || {};
  CR.GLOBAL_FN.jugementEcrit = function (s, d) {
    const cs = s.cases[d.caseId];
    if (!cs || !cs.vars.jugementEcrit || CR.hasDoc(cs, "_jugement")) return;
    const J = cs.vars.jugementEcrit;
    CR.fileDoc(s, cs, { key: "_jugement", title: `${J.titre} du ${CR.fmtDate(J.day, "long")}`, dir: "in" });
    CR.mail(s, { from: "Greffe correctionnel", subject: `Copie du jugement — ${J.prevenu}`, kind: "greffe", caseId: cs.id, body: [[`Maître, vous trouverez au dossier la copie du jugement rendu le ${CR.fmtDate(J.day, "long")}. Le délai d'appel court depuis son prononcé, la décision étant contradictoire (art. 498 du code de procédure pénale).`]] });
  };
  CR.SHARED_DOCS = CR.SHARED_DOCS || {};
  // Arrêts criminels (relus sur le texte intégral) : cour d'assises (art. 240, 243, 248 : président et deux assesseurs ;
  // art. 296 : six jurés en premier ressort, neuf en appel), spécialement composée (698-6 : quatre assesseurs, six en
  // appel, sans jury), cour criminelle départementale (380-17 : président et quatre assesseurs ; 380-19 : sans jury,
  // décisions à la majorité), cour d'assises des mineurs (CJPM L231-10, L531-2-1 ; publicité restreinte L513-2).
  // Réponses aux questions (349, 359 : sept voix au moins, huit en appel), peine (362), feuille de motivation (365-1),
  // lecture des textes (366), action civile sans le jury (371), voies de recours (380-1, 380-2, 380-9, 380-14, 380-21, 568).
  T.CRIMINELLES = ["assises", "assises_appel", "assises_spe", "assises_mineurs", "ccd"];
  T.compositionCrim = function (J) {
    const type = J.juridiction, appel = !!J.enAppel || type === "assises_appel";
    const pres = T.presidence(J.president) || "son président";
    if (type === "assises_spe") return { label: J.jurLabel || "Cour d'assises spécialement composée", jury: 0, cour: `${pres}, et de ${appel ? "six" : "quatre"} assesseurs (art. 698-6), sans jury`, maj: "à la majorité" };
    if (type === "ccd" && !appel) return { label: J.jurLabel || "Cour criminelle départementale", jury: 0, cour: `${pres}, et de quatre assesseurs (art. 380-17), sans jury (art. 380-19)`, maj: "à la majorité", ccd: true };
    const mineurs = type === "assises_mineurs";
    const label = appel && type === "ccd" ? "Cour d'assises statuant en appel d'une décision de la cour criminelle départementale" : J.jurLabel || (mineurs ? "Cour d'assises des mineurs" : "Cour d'assises");
    return { label, jury: appel ? 9 : 6, cour: `${pres}, et de deux assesseurs${mineurs ? ", juges des enfants (art. L. 231-10 du code de la justice pénale des mineurs)" : " (art. 243 et 248)"}, et du jury de jugement de ${appel ? "neuf" : "six"} jurés (art. 296)`, maj: `à la majorité de ${appel ? "huit" : "sept"} voix au moins`, mineurs };
  };
  T.arretCriminel = function (x, J) {
    const C = T.compositionCrim(J), appel = !!J.enAppel || J.juridiction === "assises_appel";
    const fem = /^Mme|Madame/.test(J.prevenu) || !!J.accuseeF, e = fem ? "e" : "";
    const pc = T.pcConstituee(J) ? J.pc : null;
    const pr = /^Mme\b/.test(J.president || "") ? "la présidente" : "le président", Pr = pr.charAt(0).toUpperCase() + pr.slice(1);
    const P = [];
    const p = (t) => P.push([t]);
    const questions = (J.dec && J.dec.questions) || [];
    const dispositif = (J.dec && J.dec.dispositif) || "";
    const peine = (J.dec && J.dec.peine) || {};
    p(`À l'audience publique du ${MAJ(CR.fmtDate(J.day, "long"))}, la ${C.label.replace(/^Cour/, "cour")}, statuant ${appel ? "en appel" : "en premier ressort"}, composée de ${C.cour}, en présence de ${J.parquet ? J.parquet + ", avocat général" : "l'avocat général"}, assistée du greffier, a rendu l'arrêt suivant.`);
    p("ENTRE : le ministère public, poursuivant" + (pc ? ` ; ${pc}, partie civile` : "") + ".");
    p(`ET : ${J.prevenu}, accusé${e}, ${J.detenu ? "détenu" + e + ", " : ""}comparant${e}, assisté${e} de son avocat.`);
    if (J.prevention) p(`Accusé${e} d'avoir commis : ${MAJ(J.prevention)}${J.qualif && J.qualif.court ? `, faits prévus et réprimés par ${T.visa(J.qualif.court)}` : ""}.`);
    if (C.mineurs) p("Les débats ont eu lieu en présence des seules personnes admises par l'article L. 513-2 du code de la justice pénale des mineurs ; l'arrêt est rendu en audience publique, en présence de l'accusé" + e + ".");
    p(`DÉBATS. ${Pr} a procédé à l'interrogatoire de l'accusé${e} ; les témoins et les experts ont été entendus ; ${pc ? "l'avocat de la partie civile a été entendu ; " : ""}l'avocat général a pris ses réquisitions ; la défense a plaidé, l'accusé${e} ayant eu la parole en dernier. ${Pr} a déclaré les débats terminés (art. 347) ; ${C.jury ? "la cour et le jury se sont retirés" : "la cour s'est retirée"} pour délibérer.`);
    p("RÉPONSES AUX QUESTIONS");
    const cul = questions.find((q) => q.q === "Sur la culpabilité");
    // une question sur le fait principal, une par circonstance aggravante (art. 349) ; la récidive n'est pas soumise au vote
    const AGG = (CR.CAT && CR.CAT.AGG) || {};
    const aggs = ((J.qualif && J.qualif.aggs) || []).filter((a) => AGG[a]);
    let base = J.qualif && J.qualif.label ? J.qualif.label : (J.prevention || "les faits").toLowerCase();
    for (const a of aggs) base = base.replace(", " + AGG[a].label, "");
    base = base.replace(/, en état de récidive légale/, "");
    const oui = J.coupable ? `Oui, ${C.maj}.` : "Non.";
    p(`Question n° 1 : l'accusé${e} est-${fem ? "elle" : "il"} coupable ${de(base)} ? — ${oui}`);
    aggs.forEach((a, i) => {
      const prev = AGG[a].prev || "";
      const q = /^avec cette circonstance que les faits ont été commis /.test(prev) ? `les faits ont-ils été commis ${prev.replace(/^avec cette circonstance que les faits ont été commis /, "")} ?` : /^avec cette circonstance qu/.test(prev) ? `les faits ont-ils été commis avec cette circonstance ${prev.replace(/^avec cette circonstance /, "")} ?` : `les faits ont-ils été commis avec cette circonstance : ${AGG[a].label} ?`;
      p(`Question n° ${i + 2} : ${q} — ${J.coupable ? `Oui, ${C.maj}.` : "Sans objet."}`);
    });
    for (const q of questions.filter((q) => /nullité|recevabilité|prescription/i.test(q.q))) p(`${q.q}. ${q.motif || ""} ${q.r}`.trim());
    if (J.coupable) p(`Sur la peine, ${C.jury ? "la cour et le jury ont" : "la cour a"} délibéré ; le vote a eu lieu au scrutin secret ; la décision est prise à la majorité absolue des votants${peine.perpetuite ? `, le maximum de la peine encourue l'ayant été ${C.maj}` : ""} (art. 362).`);
    p(C.jury ? `La feuille de questions a été signée par ${pr} et par le premier juré désigné par le sort (art. 364).` : `La feuille de questions a été signée par ${pr} (art. 364).`);
    p("FEUILLE DE MOTIVATION (art. 365-1)");
    p(J.coupable ? "Sur la culpabilité, les principaux éléments à charge qui ont convaincu la cour, exposés au cours de la délibération :" : "Les principaux éléments qui ont conduit la cour à ne pas retenir la culpabilité :");
    for (const m of J.motifs || []) p(`— ${m.titre}. ${m.t}`);
    if (cul && cul.r) p(cul.r + (J.qualif && J.coupable ? ` Les faits sont retenus sous la qualification de ${J.qualif.label}.` : ""));
    const pq = questions.find((q) => /peine/i.test(q.q));
    if (J.coupable && pq) p(`Sur la peine, les principaux éléments qui ont convaincu la cour. ${pq.motif ? pq.motif + " " : ""}${pq.r || ""}`.trim());
    const civ = questions.filter((q) => /civil|dommages|préjudice/i.test(q.q));
    if (civ.length) { p("SUR L'ACTION CIVILE — la cour statuant sans l'assistance du jury (art. 371)"); for (const q of civ) p(`${q.motif ? q.motif + " " : ""}${q.r}`); }
    for (const q of questions.filter((q) => q !== cul && q !== pq && !civ.includes(q) && !/nullité|recevabilité|prescription/i.test(q.q))) p(`${q.q.toUpperCase()}. ${q.motif ? q.motif + " " : ""}${q.r}`);
    p("PAR CES MOTIFS");
    p(`La cour, après lecture faite à l'audience par ${pr} des textes de loi dont il est fait application (art. 366), statuant publiquement ${appel ? "en appel" : "en premier ressort"} et contradictoirement :`);
    p(dispositif);
    if (J.coupable) p(`${Pr} a donné à l'accusé${e}` + " l'avertissement prévu par la loi. La présente décision est assujettie au droit fixe de procédure prévu par l'article 1018 A du code général des impôts.");
    p(appel ? "Voies de recours : pourvoi en cassation dans les dix jours francs qui suivent le prononcé (art. 568 du code de procédure pénale)."
      : J.coupable ? `Voies de recours : appel dans le délai de dix jours à compter du prononcé (art. 380-9), par déclaration au greffe de la cour qui a rendu la décision (art. 380-12) ; l'appel est examiné par ${C.ccd ? "la cour d'assises (art. 380-21)" : "une autre cour d'assises, ou la même autrement composée,"} désignée par le premier président de la cour d'appel (art. 380-1 et 380-14).`
        : `Voies de recours : le procureur général peut faire appel de l'arrêt d'acquittement dans les dix jours du prononcé ; la partie civile, quant à ses seuls intérêts civils (art. 380-2 et 380-9).`);
    p(`Et le présent arrêt a été signé par ${pr} et le greffier.`);
    return { title: `${J.titre} — ${CR.fmtDate(J.day, "long")}`, kind: "greffe", entete: [C.label, `Arrêt du ${CR.fmtDate(J.day, "long")}`, appel ? "Statuant en appel" : "Statuant en premier ressort", "Copie délivrée à l'avocat"], paras: P };
  };
  CR.SHARED_DOCS._jugement = function (x) {
    const J = x.cs.vars.jugementEcrit;
    if (!J) return { title: "Jugement", paras: [["(décision indisponible)"]] };
    if (T.CRIMINELLES.includes(J.juridiction) || (J.enAppel && J.juridiction !== "tpe" && J.juridiction !== "tc")) return T.arretCriminel(x, J);
    const tpe = J.juridiction === "tpe";
    const pr = /^Mme\b/.test(J.president || "") ? "la présidente" : "le président", Pr = pr.charAt(0).toUpperCase() + pr.slice(1);
    const jur = J.jurLabel || (CR.PROC.JURIDICTIONS[J.juridiction] || {}).label || (tpe ? "Tribunal pour enfants" : "Tribunal correctionnel");
    const P = [];
    const p = (t) => P.push([t]);
    p(`À l'audience publique du ${MAJ(CR.fmtDate(J.day, "long"))}, le ${jur.replace(/^Tribunal/, "tribunal")}, composé de ${J.president ? (tpe ? `${J.president}, juge des enfants, ${/^Mme\b/.test(J.president) ? "présidente" : "président"}, et de deux assesseurs (art. L. 231-4 du code de la justice pénale des mineurs)` : T.presidence(J.president)) : "son président"}, assisté du greffier, en présence de ${J.parquet ? J.parquet + ", substitut du procureur de la République" : "du ministère public"}, a rendu le jugement suivant.`);
    p("ENTRE : Monsieur le procureur de la République près ce tribunal, demandeur et poursuivant" + (T.pcConstituee(J) ? ` ; ${J.pc}, partie civile` : "") + ".");
    p(`ET : ${J.prevenu}, prévenu${/^Mme|Madame/.test(J.prevenu) ? "e" : ""}, comparant, assisté de son avocat.`);
    if (J.prevention) p(`Prévenu${/^Mme|Madame/.test(J.prevenu) ? "e" : ""} du chef de : ${MAJ(J.prevention)}${J.qualif && J.qualif.court ? `, faits prévus et réprimés par ${T.visa(J.qualif.court)}` : ""}.`);
    if (tpe) p("Les débats ont eu lieu en présence des seules personnes admises par l'article L. 513-2 du code de la justice pénale des mineurs ; le jugement est rendu en audience publique, en présence du mineur.");
    p(`DÉBATS. ${Pr} a constaté l'identité du prévenu, donné connaissance de l'acte qui a saisi le tribunal et informé le prévenu de son droit, au cours des débats, de faire des déclarations, de répondre aux questions ou de se taire. Il a été procédé à l'instruction de l'affaire et à l'interrogatoire du prévenu. Le ministère public a été entendu en ses réquisitions, l'avocat du prévenu en sa plaidoirie ; le prévenu a eu la parole en dernier. Le greffier a tenu note du déroulement des débats.`);
    p("Le tribunal, après en avoir délibéré, a statué en ces termes :");
    p("MOTIFS — SUR L'ACTION PUBLIQUE");
    J.questions = (J.dec && J.dec.questions) || J.questions || []; J.dispositif = (J.dec && J.dec.dispositif) || J.dispositif || "";
    const exc = J.questions.filter((q) => /nullité|recevabilité|prescription/i.test(q.q));
    for (const q of exc) p(`${q.q}. ${q.motif || ""} ${q.r}`.trim());
    for (const m of J.motifs || []) p(`${m.titre}. ${m.t}`);
    const cul = J.questions.find((q) => q.q === "Sur la culpabilité");
    if (cul) p(cul.r + (J.qualif && J.coupable ? ` Les faits sont retenus sous la qualification de ${J.qualif.label}.` : ""));
    for (const q of J.questions.filter((q) => !/nullité|recevabilité|prescription|culpabilité/i.test(q.q))) p(`${q.q.toUpperCase()}. ${q.motif ? q.motif + " " : ""}${q.r}`);
    p("PAR CES MOTIFS");
    p(`Le tribunal, statuant publiquement, en premier ressort et contradictoirement à l'égard de ${J.prevenu} :`);
    p(J.dispositif);
    if (J.coupable) p(`${Pr} a donné au condamné l'avertissement prévu par la loi. La présente décision est assujettie au droit fixe de procédure prévu par l'article 1018 A du code général des impôts, diminué de 20 % s'il est payé dans le délai d'un mois.`);
    p(`Voies de recours : appel dans le délai de dix jours à compter du prononcé, par déclaration au greffe de la juridiction (art. 498 et 502 du code de procédure pénale)${tpe ? ", devant la chambre spéciale des mineurs de la cour d'appel (art. L. 531-1 du code de la justice pénale des mineurs)" : ""}.`);
    p(`Et le présent jugement a été signé par ${pr} et le greffier.`);
    return { title: `${J.titre} — ${CR.fmtDate(J.day, "long")}`, kind: "greffe", entete: [jur, `Jugement du ${CR.fmtDate(J.day, "long")}`, "Copie délivrée à l'avocat"], paras: P };
  };
})();
