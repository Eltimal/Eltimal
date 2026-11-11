// Collecte des dialogues d'une affaire générée (entretiens, appels, parloir, garde à vue, audiences), tels que le joueur les lit,
// avec la personne qui parle (A auteur, V victime, P proche, F famille, C client ; null : la permanence, le greffe, un officier).
const segText = (x) => (typeof x === "string" ? x : x && typeof x.t === "string" ? x.t : "");
function who(P) { if (!P) return "-"; return `${P.prenom} ${P.nom} (${P.g}${P.age ? ", " + P.age + " ans" : ""}${P.metier ? ", " + P.metier : ""})`; }
// Qui parle dans un appel : la permanence (personne de l'affaire), la famille, l'auteur au dépôt ou au parloir, sinon le client
function speakerOf(def, key, call, t) {
  if (/Permanence/.test(call.label || "")) return null;
  // phase 3 : la famille, le journaliste, le substitut qui négocie
  if (key === "vie_famille") return "F";
  if (key === "vie_presse" || key === "vie_parquet") return null;
  if (key === "depot" || key === "parloir") return "A";
  if (key === "intake" && def.famille && call.who) return "F";
  return t.client || "A";
}
function collect(CR, s, cs, p, def0) {
  const def = def0 || CR.caseDef(cs);
  const t = p.t;
  const api = CR.api(s, cs);
  const v = CR.caseVars(s, cs);
  const fmt = (x) => CR.fmt(x, v);
  const calls = [];
  for (const key of Object.keys(def.calls || {})) {
    let c = def.calls[key];
    if (typeof c === "function") { try { c = c(api); } catch (e) { calls.push({ key, error: String(e.stack || e), lines: ["ERREUR " + e], topics: [], speaker: null }); continue; } }
    if (!c) continue;
    const lines = [];
    const topics = [];
    const speaker = speakerOf(def, key, c, t);
    const op = (c.opening || []).map(segText).map(fmt);
    lines.push("OUVERTURE : " + op.join(" "));
    for (const tp of c.topics || []) {
      const a = typeof tp.a === "function" ? tp.a(api) : tp.a || [];
      const segs = a.map((x) => ({ t: fmt(segText(x)), f: typeof x === "object" && x ? x.f || null : null }));
      topics.push({ id: tp.id, q: fmt(tp.q), segs, tag: tp.tag || null, cat: tp.cat || null });
      lines.push(`  ▸ ${fmt(tp.q)}`);
      lines.push(`    « ${segs.map((g) => g.t + (g.f ? ` [${g.f}]` : "")).join(" ")} »`);
    }
    if (c.close) lines.push("CLÔTURE : " + fmt(c.close));
    for (const k of ["impatient", "hangup"]) if (c[k]) lines.push(k.toUpperCase() + " : " + fmt(c[k]));
    calls.push({ key, label: c.label, speaker, lines, topics, opening: op, close: c.close ? fmt(c.close) : "", extra: [c.impatient, c.hangup].filter(Boolean).map(fmt) });
  }
  // garde à vue ou audition libre
  if (def.gav) {
    try {
      const g = def.gav(api);
      const lines = [];
      const topics = [];
      for (const k of ["arrivee", "droits"]) for (const x of g[k] || []) lines.push(k + " : " + segText(x));
      if (g.entretien) {
        lines.push("ENTRETIEN : " + (g.entretien.opening || []).map(segText).join(" "));
        for (const tp of g.entretien.topics || []) { const a = typeof tp.a === "function" ? tp.a(api) : tp.a || []; const segs = a.map((x) => ({ t: fmt(segText(x)), f: x && x.f })); topics.push({ id: tp.id, q: tp.q, segs }); lines.push(`  ▸ ${tp.q}`); lines.push(`    « ${segs.map((z) => z.t).join(" ")} »`); }
      }
      const aud = typeof g.audition === "function" ? g.audition(api, { conseil: "expliquer" }) : g.audition || [];
      for (const a of aud) { lines.push("  OPJ : " + a.q); for (const k of Object.keys(a.a || {})) { lines.push(`    (${k}) ${a.a[k]}`); topics.push({ id: "aud", q: a.q, segs: [{ t: String(a.a[k]) }] }); } }
      for (const q of g.questions || []) if (q) lines.push(`  AVOCAT : ${q.q} — ${q.a}`);
      calls.push({ key: "gav", label: "garde à vue / audition", speaker: "A", lines, topics, opening: (g.entretien && g.entretien.opening || []).map(segText), close: "", extra: (g.arrivee || []).concat(g.droits || [], (g.questions || []).filter(Boolean).flatMap((q) => [q.q, q.a])).map(segText) });
    } catch (e) { calls.push({ key: "gav", error: String(e.stack || e), lines: ["ERREUR " + e], topics: [], speaker: null }); }
  }
  // répliques d'audience (toutes les branches) : { who, t }
  const audience = [];
  const seen = new Set();
  const walk = (o, d) => {
    if (!o || d > 10 || typeof o !== "object" || seen.has(o)) return;
    seen.add(o);
    if (Array.isArray(o)) { for (const x of o) walk(x, d + 1); return; }
    for (const k of ["t", "a", "say", "reply", "prompt", "label"]) if (typeof o[k] === "string") audience.push({ who: k === "t" || k === "a" ? o.who || null : null, t: fmt(o[k]) });
    for (const k of Object.keys(o)) if (o[k] && typeof o[k] === "object") walk(o[k], d + 1);
  };
  for (const k of Object.keys(def.audiences || {})) {
    try { const a = def.audiences[k](api); walk(a && a.steps, 0); } catch (e) { audience.push({ who: null, t: "ERREUR audience " + k + " : " + e }); }
  }
  return { calls, audience };
}
module.exports = { collect, who, segText, speakerOf };
