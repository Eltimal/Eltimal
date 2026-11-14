/* La Permanence — chantier anti-répétition, lot 1, n° 7 : le directeur de partie.
   En carrière, GEN2.params tire plusieurs affaires candidates (toutes cohérentes, toutes d'un type jamais joué) au lieu de
   prendre la première ; le directeur choisit parmi elles :
   - pas la même infraction dans la même scène qu'une affaire récente, pas trop vite la même infraction, pas la même famille
     trois fois de suite ;
   - une prime aux infractions jamais vues ou oubliées depuis longtemps, et au moins une telle affaire par semaine ;
   - une difficulté qui suit la carrière (ancienneté, réputation) et qui alterne : pas trois affaires de même niveau d'affilée ;
   - à score égal, la candidate tirée la première, pour garder les fréquences réalistes du catalogue.
   Il diversifie aussi le genre des nouveaux clients (GEN2.leadKind). Le choix reste porté par le code d'affaire (sa graine) :
   une affaire choisie se rejoue à l'identique par son code. Hors carrière (affaire jouée par son code), rien ne change. */
(function () {
  const CR = window.CR;
  const GEN2 = CR.GEN2;
  const CAT = CR.CAT;
  const DIR = (GEN2.DIR = {});
  DIR.K = 16; // candidates examinées
  DIR.RECENT = 30; // affaires gardées en mémoire
  DIR.off = false; // pour les tests (mesure sans directeur)

  const cle = (t) => `${t.inf}/${(t.f && (t.f.sc || t.f.ctx)) || t.sc || "-"}`;
  const famDe = (t) => (CAT.INF[t.inf] || {}).fam || "?";
  DIR.etat = function (s) {
    if (!s.dir) {
      s.dir = { recent: [], vus: {}, n: 0, nouv: null };
      // ancienne sauvegarde : reconstruire la mémoire à partir des affaires déjà générées
      for (const p of (s.generated || []).slice(-DIR.RECENT)) if (p && p.t && p.t.inf) DIR.noter(s, p.t, p.kind, true);
    }
    return s.dir;
  };
  DIR.noter = function (s, t, kind, silencieux) {
    const D = silencieux ? s.dir : DIR.etat(s);
    let diff = 2;
    try { diff = GEN2.difficulte(t); } catch (e) { /* ancien tirage */ }
    const age = D.vus[t.inf] != null ? D.n - D.vus[t.inf] : Infinity;
    const nouveau = age > 25;
    D.recent.unshift({ k: cle(t), inf: t.inf, fam: famDe(t), g: kind || t.genre, d: diff, day: s.day });
    if (D.recent.length > DIR.RECENT) D.recent.length = DIR.RECENT;
    D.vus[t.inf] = D.n;
    D.n++;
    if (nouveau && !silencieux) D.nouv = s.day;
  };
  // Difficulté visée, de 1 à 3 : l'ancienneté (un mois de carrière = +0,1) et la réputation moyenne
  DIR.cible = function (s) {
    const r = s.reps ? (Object.values(s.reps).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(s.reps).length)) : 20;
    const v = 1.3 + Math.min(1.1, (s.day || 0) / 300) + CR.clamp((r - 22) / 60, -0.3, 0.5);
    return CR.clamp(v, 1, 3);
  };
  DIR.score = function (s, t, rang, kind) {
    const D = DIR.etat(s);
    const k = cle(t), f = famDe(t);
    let sc = -rang * 0.8;
    let j = 0; // rang parmi les affaires du même genre (une permanence de comparution immédiate se compare aux précédentes)
    D.recent.forEach((r, i) => {
      if (r.k === k && i < 12) sc -= 60 * (1 - i / 14);
      if (r.inf === t.inf && i < 6) sc -= 25 * (1 - i / 8);
      if (r.fam === f && i < 2) sc -= 6;
      if (r.g === kind) { if (r.k === k && j < 6) sc -= 50 * (1 - j / 8); if (r.inf === t.inf && j < 3) sc -= 15; j++; }
    });
    const age = D.vus[t.inf] != null ? D.n - D.vus[t.inf] : Infinity;
    const neuf = age === Infinity, oublie = age > 25;
    if (neuf) sc += 14; else if (oublie) sc += 7;
    // au moins une affaire nouvelle ou oubliée par semaine
    if ((neuf || oublie) && (D.nouv == null || (s.day || 0) - D.nouv >= 7)) sc += 30;
    let d = 2;
    try { d = GEN2.difficulte(t); } catch (e) { /* rien */ }
    sc -= Math.abs(d - DIR.cible(s)) * 5;
    if (D.recent.length >= 2 && D.recent[0].d === d && D.recent[1].d === d) sc -= 8;
    return sc;
  };
  // cands : [{ t, c, ts }] dans l'ordre du tirage ; rend la candidate retenue
  DIR.choisir = function (s, kind, cands) {
    if (DIR.off || !cands.length || s.mode !== "carriere") return cands[0];
    let best = cands[0], bs = -Infinity;
    cands.forEach((x, i) => { const v = DIR.score(s, x.t, i, kind); if (v > bs) { bs = v; best = x; } });
    return best;
  };
  // Genre des nouveaux clients : moins de chances pour un genre vu parmi les trois derniers clients
  DIR.poidsGenres = function (s, w) {
    if (DIR.off || !s || s.mode !== "carriere") return w;
    const D = DIR.etat(s);
    const out = Object.assign({}, w);
    D.recent.filter((r) => out[r.g] != null).slice(0, 3).forEach((r) => { out[r.g] *= 0.55; });
    return out;
  };
})();
