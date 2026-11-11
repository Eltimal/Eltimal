/* La Permanence — le dossier à fouiller (feuille de route, n° 2).
   - Surlignage : le joueur surligne un passage d'une pièce ; rien n'est signalé par le jeu.
   - Relevé d'une irrégularité : passage surligné, qualifié (heure, mention manquante, signature absente,
     incohérence entre deux pièces), envoyé au bloc-notes ; c'est la seule source des moyens de nullité.
     Un passage porte en secret le drapeau de l'anomalie de l'affaire (seg.flag) ; une incohérence se joue
     à deux passages (seg.paire : il faut relier les deux).
   - Indices (mode assisté, facultatif) : après un temps de lecture sur une pièce.
   - Enquête de la défense : témoin, vidéo avant effacement, contre-expertise ; coût en temps ou en argent.
   Le droit des affaires ne change pas : les pièces obtenues portent des faits que l'affaire connaît déjà. */
(function () {
  const CR = window.CR;

  // ------------------------------------------------------------------ Bloc-notes : catégorie « Irrégularité »
  if (!CR.NOTE_CATS.some((c) => c[0] === "irreg")) CR.NOTE_CATS.unshift(["irreg", "Irrégularité"]);

  CR.IRREG_TYPES = [["heure", "Heure ou délai"], ["mention", "Mention manquante"], ["signature", "Signature absente"], ["incoherence", "Incohérence entre deux pièces"], ["autre", "Autre"]];
  CR.irregTypeLabel = (k) => (CR.IRREG_TYPES.find((x) => x[0] === k) || [null, "Irrégularité"])[1];
  CR.segText = (seg) => (typeof seg === "string" ? seg : (seg && seg.t) || "").trim();

  // ------------------------------------------------------------------ Surlignage
  // cs.surl : [{ id, t, ref:{doc,key,titre}, flag, paire, day }]
  CR.isSurl = (cs, t) => !!cs && (cs.surl || []).some((h) => h.t === t);
  CR.surligner = function (s, cs, seg, ref) {
    const t = CR.segText(seg);
    if (!t || !cs) return null;
    cs.surl = cs.surl || [];
    const old = cs.surl.find((h) => h.t === t);
    if (old) return old;
    const o = typeof seg === "object" ? seg : {};
    const h = { id: CR.uid("h"), t, ref: ref || null, flag: o.flag || null, paire: o.paire || null, day: s.day };
    cs.surl.push(h);
    return h;
  };
  CR.desurligner = (cs, t) => { cs.surl = (cs.surl || []).filter((h) => h.t !== t); };

  // ------------------------------------------------------------------ Relever une irrégularité
  // o : { seg, ref, type, avec (id d'un autre passage surligné), comment }
  CR.releverIrreg = function (s, cs, o) {
    const t = CR.segText(o.seg);
    if (!t) return null;
    const seg = typeof o.seg === "object" ? o.seg : {};
    const h = CR.surligner(s, cs, o.seg, o.ref);
    const h2 = o.avec ? (cs.surl || []).find((x) => x.id === o.avec && x.t !== t) : null;
    let flag = seg.flag || (h && h.flag) || (h2 && h2.flag) || null;
    const p1 = seg.paire || (h && h.paire);
    if (!flag && p1 && h2 && (h2.paire === p1 || h2.flag === p1)) flag = p1;
    const deja = cs.issues.find((i) => i.text === t);
    if (deja) return deja;
    const type = o.type || "autre";
    const comment = String(o.comment || "").trim() || null;
    const issue = CR.addIssue(s, cs, { text: t, flag, type, avec: h2 ? h2.t : null, ref: o.ref || null, comment });
    if (!issue) return null;
    const where = o.ref && o.ref.titre ? ` (${o.ref.titre})` : "";
    const txt = `« ${t} »${where} — ${CR.irregTypeLabel(type)}${h2 ? ` : à comparer avec « ${h2.t} »${h2.ref && h2.ref.titre ? ` (${h2.ref.titre})` : ""}` : ""}${comment ? `. ${comment}` : ""}`;
    const n = CR.addOwnNote(s, cs, { text: txt, cat: "irreg", link: o.ref && o.ref.doc ? { k: "doc", id: o.ref.doc } : null });
    if (n) { n.src = "doc"; n.issueId = issue.id; issue.noteId = n.id; }
    return issue;
  };
  CR.retirerIrreg = function (cs, id) {
    const i = cs.issues.find((x) => x.id === id);
    cs.issues = cs.issues.filter((x) => x.id !== id);
    if (i && i.noteId) cs.notes = cs.notes.filter((n) => n.id !== i.noteId);
  };
  // Effacer la note d'une irrégularité la retire aussi de la liste des moyens possibles
  const removeNote0 = CR.removeNote;
  CR.removeNote = function (cs, id) {
    const n = cs.notes.find((x) => x.id === id);
    removeNote0(cs, id);
    if (n && n.issueId && !cs.notes.some((x) => x.id === id)) cs.issues = cs.issues.filter((i) => i.id !== n.issueId);
  };

  // ------------------------------------------------------------------ Indices (mode assisté, facultatif)
  CR.INDICE_T1 = 45; // secondes de lecture avant l'indice de méthode
  CR.INDICE_T2 = 100; // avant l'indice propre à la pièce
  CR.INDICE_METHODE = "Méthode : relevez chaque heure et calculez les écarts ; cherchez les mentions que la loi exige ; regardez qui a signé ; comparez avec les autres pièces.";
  CR.INDICES = {
    gav_notif_tardive: "Comparez l'heure à laquelle la mesure a pris effet et l'heure à laquelle les droits ont été notifiés. Que dit la loi du moment de la notification ?",
    interprete_absent: "La personne comprend-elle vraiment le français ? Une autre pièce le dit peut-être. Cherchez qui a traduit, et qui a signé.",
    ethylometre_verif: "Un éthylomètre n'est fiable que s'il a été vérifié. Le procès-verbal dit-il quand ?",
    perquisition_nuit: "À quelle heure les enquêteurs sont-ils entrés ? Quelles heures la loi permet-elle, et le juge a-t-il autorisé autre chose ?",
    al_droit_quitter: "Reprenez la liste des droits notifiés avant l'audition libre, un par un. En manque-t-il un ?",
  };
  CR.segsOf = (doc) => [].concat(...((doc && doc.paras) || []).map((p) => p), (doc && doc.sigs) || []);
  CR.indicesPiece = function (cs, doc) {
    const def = CR.caseDef(cs);
    const out = [];
    const seen = new Set();
    for (const sg of CR.segsOf(doc)) {
      if (!sg || typeof sg !== "object") continue;
      const fl = sg.flag || sg.paire;
      if (!fl || seen.has(fl)) continue;
      seen.add(fl);
      if (cs.issues.some((i) => i.flag === fl)) continue;
      const an = def.anomalies && def.anomalies[fl];
      const txt = an && CR.INDICES[an.irreg];
      if (txt) out.push(txt);
    }
    return out;
  };
  CR.indicesOn = (s) => !!(s && s.settings && s.settings.indices);
  CR.lecture = (cs, k, sec) => { cs.lu = cs.lu || {}; cs.lu[k] = (cs.lu[k] || 0) + sec; return cs.lu[k]; };

  // ------------------------------------------------------------------ Enquête de la défense
  // def.enquete : liste (ou fonction de l'api) de démarches :
  // { id, type: "temoin"|"video"|"expertise", camp?, titre, desc, piste: [faits ou pièces] | fn(api),
  //   limite?: fn(api) → dernier jour où les images existent,
  //   modes: [{ id, label, sub, temps?, argent?, frais?, delai, saisie?, quand?: fn(api), pourquoi? }],
  //   doc, titrePiece, envoi: fn(api, st) → { from, subject, body }, perdu?: fn(api, st, lim) → { from, subject, body } }
  CR.ENQ_TYPES = { temoin: "Témoin", video: "Vidéo", expertise: "Contre-expertise" };
  CR.enqueteDefs = function (s, cs) {
    const def = CR.caseDef(cs);
    if (!def || !def.enquete) return [];
    const L = typeof def.enquete === "function" ? def.enquete(CR.api(s, cs)) : def.enquete;
    return (L || []).filter((e) => !e.camp || e.camp === cs.camp);
  };
  CR.enquetePiste = function (s, cs, e) {
    if (!e.piste) return true;
    if (typeof e.piste === "function") return !!e.piste(CR.api(s, cs));
    return e.piste.some((f) => CR.hasFact(cs, f) || CR.hasDoc(cs, f));
  };
  CR.enqueteVisibles = (s, cs) => CR.enqueteDefs(s, cs).filter((e) => (cs.enq && cs.enq[e.id]) || CR.enquetePiste(s, cs, e));
  CR.enqueteEtat = (cs, id) => (cs.enq || {})[id] || null;
  CR.enqueteModeOk = function (s, cs, m) {
    if (cs.status !== "active") return { ok: false, why: "Le dossier n'est pas ouvert." };
    if (m.quand && !m.quand(CR.api(s, cs))) return { ok: false, why: m.pourquoi || "Plus possible à ce stade de la procédure." };
    if (m.temps && (s.night || CR.tooLate(s) || s.min + m.temps > CR.HARD_STOP)) return { ok: false, why: "Trop tard aujourd'hui." };
    return { ok: true };
  };
  CR.enqueteLancer = function (s, cs, id, modeId) {
    const e = CR.enqueteDefs(s, cs).find((x) => x.id === id);
    const m = e && e.modes.find((x) => x.id === modeId);
    if (!e || !m || CR.enqueteEtat(cs, id) || !CR.enqueteModeOk(s, cs, m).ok) return null;
    const api = CR.api(s, cs);
    if (m.argent) api.cost(m.argent, m.frais || e.titre);
    if (m.temps) CR.spend(s, m.temps, m.kind || "desk", { caseId: cs.id });
    const st = { mode: m.id, day: s.day, due: s.day + (m.delai || 1), statut: "attente" };
    cs.enq = cs.enq || {};
    cs.enq[id] = st;
    api.at(st.due, "_enqRes", { id });
    api.tl(`Enquête de la défense — ${e.titre} : ${m.label.toLowerCase()}.`);
    return st;
  };
  CR.FLOW_HOOKS._enqRes = function (api, d) {
    const { s, cs } = api;
    const e = CR.enqueteDefs(s, cs).find((x) => x.id === d.id);
    const st = CR.enqueteEtat(cs, d.id);
    if (!e || !st || st.statut !== "attente") return;
    const m = e.modes.find((x) => x.id === st.mode) || {};
    const lim = e.limite ? e.limite(api) : null;
    if (lim != null && st.day + (m.saisie || 0) > lim) {
      st.statut = "perdu";
      st.fin = s.day;
      const p = e.perdu ? e.perdu(api, st, lim) : { from: "—", subject: "Images effacées", body: [["Les images ont été écrasées avant que la demande ne soit traitée."]] };
      api.mail(Object.assign({ kind: "courrier", important: true }, p));
      api.log(`${e.titre} : trop tard, les images ont été effacées le ${CR.fmtDate(lim + 1, "long")}.`, "bad");
      return;
    }
    st.statut = "obtenu";
    st.fin = s.day;
    const env = e.envoi ? e.envoi(api, st) : { from: "—", subject: e.titrePiece || e.titre };
    api.mail(Object.assign({ kind: "courrier", important: true, doc: e.doc, title: e.titrePiece || e.titre, vars: { mode: st.mode } }, env));
    api.log(`${e.titre} : pièce reçue et versée au dossier.`, "good");
  };
})();
