/* La Permanence — la mémoire des magistrats et des confrères (version 1.0).
   Les présidents, juges d'instruction, juges des libertés, procureurs et confrères du jeu sont des personnages récurrents
   (CR.ACTEURS). Ils retiennent maintenant ce que vous avez fait devant eux :
     s.memo[id] = { n: rencontres, estime: de −10 à +10, dernier: jour, faits: [{ day, d, r }] }   (r : « vous avez… »)
   - MEM.apresAudience(s, cs, h, res) : à la sortie d'une audience, le juge et le parquet notent la tenue du dossier,
     une plaidoirie à l'envers, un argument maintenu contre le dossier, un arrêt dépassé, des interruptions.
   - une audience manquée se retient (CR.EV.courtCheck) ; les choix face au confrère adverse aussi (fx.memo, ui-court.js).
   - MEM.ouverture(s, cs, h) : à l'audience suivante devant la même personne, elle vous le fait sentir : une phrase,
     et un crédit de départ de −3 à +3. Rien pour une première rencontre.
   - UI.MemoList : « Ceux qui vous connaissent », dans Cabinet › Réputation. */
(function () {
  const CR = window.CR, UI = CR.UI;
  const MEM = (CR.MEM = {});
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  MEM.de = function (s, id) { s.memo = s.memo || {}; return (s.memo[id] = s.memo[id] || { n: 0, estime: 0, dernier: null, faits: [] }); };
  MEM.lire = (s, id) => (s && s.memo && s.memo[id]) || null;
  MEM.noter = function (s, id, d, r) {
    if (!s || !id || s.mode === "tutoriel") return;
    const m = MEM.de(s, id);
    m.estime = borne(m.estime + (d || 0), -10, 10);
    if (r) { m.faits.unshift({ day: s.day, d: d || 0, r }); if (m.faits.length > 6) m.faits.length = 6; }
  };
  MEM.humeur = (m) => (!m || !m.n ? null : m.estime >= 5 ? ["Vous estime", "ok"] : m.estime >= 2 ? ["Bien disposé", "ok"] : m.estime <= -5 ? ["Hostile", "bad"] : m.estime <= -2 ? ["Agacé", "warn"] : ["Sans avis", null]);

  // Qui siège à cette audience ? D'après son intitulé : cabinet d'instruction, juge des libertés, sinon la formation de jugement.
  MEM.presents = function (cs, h) {
    const A = cs.actors || {}, t = ((h && h.title) || "") + " " + ((h && h.script) || "");
    const juge = /interrogatoire|confrontation|juge d'instruction|audition de partie civile|\bji\b/i.test(t) ? A.ji : /libert|d[ée]tention|\bjld\b|prolongation/i.test(t) ? A.jld || A.president : A.president;
    const parquet = /interrogatoire|confrontation|audition de partie civile/i.test(t) ? null : A.parquet;
    return { juge: juge || null, parquet: parquet || null };
  };
  const advDe = (s, cs) => { const p = (s.generated || []).find((x) => x.id === cs.id); const v = p && p.t && p.t.vie; return v && v.adv && cs.vars && cs.vars.vieAdverse != null ? v.adv.id : null; };

  MEM.apresAudience = function (s, cs, h, res) {
    if (!s || s.mode === "tutoriel" || !res) return;
    const P = MEM.presents(cs, h), pl = res.plaidoirie || null, cred = res.cred || 0;
    if (P.juge) {
      const m = MEM.de(s, P.juge);
      m.n++; m.dernier = s.day;
      if (res.flags && res.flags.jpDepassee) MEM.noter(s, P.juge, -2, "vous avez cité un arrêt abandonné depuis longtemps");
      if (pl && pl.ordre === "inverse") MEM.noter(s, P.juge, -1, "vous avez plaidé dans le désordre, la peine avant la culpabilité");
      if (pl && pl.replique === "maintien") MEM.noter(s, P.juge, -1, "vous avez maintenu un argument que le dossier contredisait");
      if (res.interjects && res.interjects.miss >= 2) MEM.noter(s, P.juge, -2, "vous avez coupé la parole plus d'une fois");
      if (cred >= 6) MEM.noter(s, P.juge, 2, "votre dossier était tenu et votre plaidoirie utile");
      else if (cred >= 3) MEM.noter(s, P.juge, 1, "vous avez plaidé juste");
      else if (cred <= -5) MEM.noter(s, P.juge, -2, "votre plaidoirie n'avait pas grand rapport avec le dossier");
      else if (cred <= -2) MEM.noter(s, P.juge, -1, "vos arguments n'ont pas porté");
      if ((res.limine || []).length && cred > 0) MEM.noter(s, P.juge, 1, "vous avez soulevé une nullité au bon moment");
    }
    if (P.parquet) {
      const m = MEM.de(s, P.parquet);
      m.n++; m.dernier = s.day;
      if (pl && pl.ton === "offensif" && pl.hors > 0) MEM.noter(s, P.parquet, -2, "vous avez attaqué l'enquête sans rien pour l'étayer");
      else if (pl && pl.ton === "offensif" && pl.bons >= 2) MEM.noter(s, P.parquet, 1, "vous avez démonté un procès-verbal, pièces en main");
      if (pl && pl.replique === "abandon") MEM.noter(s, P.parquet, 1, "vous avez su lâcher un argument faible");
      if (pl && pl.replique === "maintien") MEM.noter(s, P.parquet, -1, "vous avez soutenu contre l'évidence");
      if (cred >= 6 && !(pl && pl.replique)) MEM.noter(s, P.parquet, 1, "votre dossier était solide");
    }
    const adv = advDe(s, cs);
    if (adv) { const m = MEM.de(s, adv); m.n++; m.dernier = s.day; }
  };

  // L'ouverture de l'audience suivante : des étapes de script (une phrase, un crédit de départ)
  const nomCourt = (a) => (a ? a.nom : "");
  MEM.ouverture = function (s, cs, h) {
    if (!s || s.mode === "tutoriel" || !h) return [];
    const P = MEM.presents(cs, h), out = [], moi = `Maître ${s.player.nom}`;
    const mj = MEM.lire(s, P.juge), aj = P.juge && CR.acteur(P.juge);
    if (mj && mj.n >= 1 && aj) {
      const who = /^ji_/.test(P.juge) ? "ji" : /^jld_/.test(P.juge) ? "jld" : "president";
      const bonus = borne(Math.round(mj.estime / 3), -3, 3);
      const pire = (fs) => fs.filter((f) => f.d < 0).sort((x, y) => x.d - y.d)[0] || null;
      const neg = pire(mj.faits), pos = mj.faits.find((f) => f.d > 0);
      if (mj.estime <= -2 && neg) out.push({ who, t: `${moi}. La dernière fois, ${neg.r}. ${who === "president" ? "Le tribunal" : "Je"} ne l'${who === "president" ? "a" : "ai"} pas oublié.` });
      else if (mj.estime >= 4 && pos) out.push({ who, t: `${moi}. ${who === "president" ? "Le tribunal vous écoutera" : "Je vous écouterai"} avec attention : la dernière fois, ${pos.r}.` });
      else if (mj.n >= 2) out.push({ who: "sys", t: `(${nomCourt(aj)} vous reconnaît : c'est votre ${mj.n + 1}e audience devant ${aj.look && aj.look.g === "f" ? "elle" : "lui"}.)` });
      if (bonus) out.push({ fx: { cred: bonus } });
    }
    const mp = MEM.lire(s, P.parquet), ap = P.parquet && CR.acteur(P.parquet);
    if (mp && mp.n >= 1 && ap) {
      const neg = mp.faits.find((f) => f.d < 0);
      if (mp.estime <= -3 && neg) out.push({ who: "sys", t: `(Au banc du ministère public, ${nomCourt(ap)} ne vous salue pas : la dernière fois, ${neg.r}.)` }, { fx: { cred: -1 } });
      else if (mp.estime >= 3) out.push({ who: "sys", t: `(${nomCourt(ap)}, au banc du ministère public, vous salue d'un signe de tête.)` });
    }
    const adv = advDe(s, cs), ma = MEM.lire(s, adv), aa = adv && CR.acteur(adv);
    if (ma && ma.n >= 1 && aa) { const f = ma.faits[0]; out.push({ who: "sys", t: `(En face, ${nomCourt(aa)} : vous vous êtes déjà croisés${f ? ". La dernière fois, " + f.r : ""}.)` }); }
    return out;
  };

  // Une audience manquée : le juge s'en souvient
  if (CR.EV && CR.EV.courtCheck) {
    const cc = CR.EV.courtCheck;
    CR.EV.courtCheck = function (s, e) {
      const cs = s.cases[e.caseId], h = cs && CR.hearingById(cs, e.data.hid), avant = h && h.missed;
      const r = cc.apply(this, arguments);
      try { if (h && h.missed && !avant) { const P = MEM.presents(cs, h); if (P.juge) { MEM.de(s, P.juge).n++; MEM.noter(s, P.juge, -3, "vous n'êtes pas venu, sans prévenir personne"); } } } catch (err) { console.error(err); }
      return r;
    };
  }

  if (!UI) return;
  const { html, Tag, Portrait } = UI;
  const ROLE = { president: "Siège", ji: "Juge d'instruction", jld: "Juge des libertés et de la détention", parquet: "Parquet", adverse: "Confrère", confrere: "Confrère", avocat: "Confrère" };
  UI.MemoList = function MemoList({ s }) {
    const rows = Object.entries(s.memo || {}).map(([id, m]) => ({ id, m, a: CR.acteur(id) })).filter((x) => x.a && x.m.n > 0).sort((x, y) => (y.m.dernier || 0) - (x.m.dernier || 0));
    return html`<${UI.Section} title="Ceux qui vous connaissent">
      ${rows.length === 0 ? html`<p className="empty">Personne encore. Magistrats et confrères retiennent ce que vous faites devant eux, et vous le font sentir à l'audience suivante.</p>` : html`<ul className="memo-list">${rows.map(({ id, m, a }) => { const hm = MEM.humeur(m); return html`<li key=${id}>
        ${a.look && Portrait ? html`<${Portrait} look=${a.look} size=${44} blink=${false} />` : null}
        <div className="memo-txt"><strong>${a.nom}</strong><span className="small muted">${ROLE[a.role] || ""}${a.lieu ? " · " + a.lieu : ""} · ${m.n} audience${m.n > 1 ? "s" : ""}, la dernière le ${CR.fmtDate(m.dernier, "short")}</span>${m.faits[0] ? html`<span className="small">Retient que ${m.faits[0].r}.</span>` : null}</div>
        ${hm && html`<${Tag} tone=${hm[1]}>${hm[0]}</${Tag}>`}
      </li>`; })}</ul>`}
    </${UI.Section}>`;
  };
})();
