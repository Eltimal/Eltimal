// Sortie 1.0 — automate « joueur moyen » : une carrière simulée sur le vrai moteur (horloge, énergie, charges du mois,
// permanences, arrivée des clients, réputation, faillite), sans jouer les scènes.
//   node tools/carriere-auto.js [graines, défaut 20] [mois, défaut 12] [profil : moyen | assidu | passif | collab]
// Ce que l'automate fait vraiment : il s'inscrit aux permanences, attend les appels que le moteur tire, y répond, reçoit les
// clients que le générateur envoie, laisse le moteur prélever les charges et verser l'aide juridictionnelle.
// Ce qu'il remplace par des hypothèses (à relire si l'économie change) :
//  - une mission n'est pas jouée : elle coûte un temps forfaitaire (garde à vue 3 h trajet compris, comparution immédiate
//    4 h, tribunal 3 h) et rapporte le tarif du jeu (CR.AJ) ; les suites d'une garde à vue suivent l'orientation tirée (t.voie) ;
//  - un client payant accepte 90 % du prix juste (CR.fairForfait), paie la moitié à la signature et le solde deux mois plus
//    tard 85 fois sur 100 ; son dossier demande les heures prévues par l'affaire, une heure par jour ;
//  - un dossier mené au bout rapporte un peu de réputation (+1 clients), comme une issue correcte en jeu.
// Résultat par graine : trésorerie à la fin, point bas, épuisements, missions par mois, heures par jour ouvré.
const { boot, sleep } = require("../tests/harness");
const PROFILS = {
  // jours de la semaine (1 = lundi) où l'on s'inscrit ; plafond de dossiers payants suivis de front
  moyen: { gav_jour: [1, 2, 4], gav_nuit: [3], ci: [5], plafond: 5, prend: 0.75 },
  assidu: { gav_jour: [1, 2, 3, 4, 5], gav_nuit: [2, 4], ci: [], plafond: 7, prend: 0.9 },
  passif: { gav_jour: [], gav_nuit: [], ci: [], plafond: 0, prend: 0 },
  collab: { gav_jour: [2, 4], gav_nuit: [], ci: [5], plafond: 3, prend: 0.6, collab: true },
};
function carriere(CR, seed, mois, nomProfil) {
  const P = PROFILS[nomProfil] || PROFILS.moyen;
  const r = CR.seeded("automate:" + seed);
  const s = CR.newGame({ prenom: "Auto", nom: "Mate", mode: "carriere", seed }); s.settings.coach = false; s.settings.saisie = "liste";
  if (P.collab) CR.CAR.demarrerCollab(s);
  const st = { laisses: 0, missions: 0, payants: 0, refus: 0, epuisements: 0, bas: s.cash, heures: 0, joursOuvres: 0, suites: [], travaux: [], vus: new Set() };
  const fin = CR.addMonths(0, mois);
  const tirage = (cs) => { const p = (s.generated || []).find((x) => x.id === cs.id); return p ? p.t : {}; };
  const mission = (cs, cle, minutes, kind) => { CR.spend(s, minutes, kind, { caseId: cs && cs.id }); CR.ajMission(s, cs, cle, "automate"); st.missions++; };
  const clore = (cs, issue) => { if (cs.status !== "closed") { try { CR.closeCase(s, cs, issue); } catch (e) { cs.status = "closed"; cs.outcome = issue; } } };
  // un joueur moyen se ménage : sans vingt points de marge sur le coût de la mission, il ne la prend pas (l'appel est perdu, la
  // permanence désigne un confrère), en dessous de 30 il rentre
  const fatigue = (cout) => s.energy < (cout || 30) + 20; // une garde à vue coûte environ 30 points, une audience 40
  const permanence = (cs, nuit) => {
    const def = CR.caseDef(cs), t = tirage(cs);
    if (fatigue(t.genre === "ci" || def.genre === "ci" ? 42 : 30)) { st.laisses++; clore(cs, { type: "lost-lead", detail: "automate : trop fatigué" }); CR.rep(s, "confreres", -1, "permanence manquée"); return; }
    if (t.genre === "ci" || def.genre === "ci") { mission(cs, "ci", 240, "court"); clore(cs, { type: "done", detail: "automate" }); return; }
    CR.spend(s, 30, "travel"); mission(cs, "gav", 150, "gav"); if (s.stats) s.stats.gav++;
    // les suites de la garde à vue : comparution immédiate le lendemain ; convocation ou CRPC gardée une fois sur deux
    if (t.voie === "ci") st.suites.push({ day: CR.nextBusinessDay(s.day), cle: "ci", minutes: 240, id: cs.id });
    else if (["copj", "crpc", "op"].includes(t.voie) && r() < 0.5) st.suites.push({ day: s.day + 30 + Math.floor(r() * 60), cle: t.voie === "crpc" ? "crpc" : "tc", minutes: 180, id: cs.id });
    else clore(cs, { type: "done", detail: "automate" });
  };
  const client = (cs) => {
    const def = CR.caseDef(cs);
    if (def.honoraires && def.honoraires.aj) { permanence(cs); return; }
    const suivis = st.travaux.length;
    if (suivis >= P.plafond || r() > P.prend || fatigue()) { st.refus++; clore(cs, { type: "declined", detail: "automate" }); return; }
    CR.spend(s, 60, "meet", { caseId: cs.id });
    const prix = Math.round(CR.fairForfait(s, def) * 0.9 / 50) * 50;
    CR.payIn(s, Math.round(prix / 2), "Provision — automate", cs.id); s.stats.honoraires += Math.round(prix / 2);
    cs.status = "active"; cs.engaged = s.day; st.payants++;
    st.travaux.push({ id: cs.id, reste: ((def.honoraires && def.honoraires.heures) || 10) * 60, solde: prix - Math.round(prix / 2) });
  };
  while (s.day < fin && !s.gameOver) {
    if (s.night) { if (s.ring) { const cs = s.cases[s.ring.caseId]; s.ring = null; if (cs && !st.vus.has(cs.id)) { st.vus.add(cs.id); permanence(cs, true); } } CR.backToBed(s); }
    const ouvre = CR.isBusinessDay(s.day);
    if (ouvre && !s.burnout && !(CR.suspendu && CR.suspendu(s))) {
      st.joursOuvres++;
      const m0 = s.workedToday;
      // inscriptions : chaque lundi, pour la semaine suivante
      if (CR.dow(s.day) === 1) for (let d = s.day + 7; d < s.day + 14; d++) for (const k of ["gav_jour", "gav_nuit", "ci"]) if (P[k].includes(CR.dow(d)) && CR.peutSinscrire(s, d, k).ok) CR.signDuty(s, d, k);
      // les suites du jour (audiences des dossiers de permanence gardés)
      for (const x of st.suites.filter((x) => x.day <= s.day)) { const cs = s.cases[x.id]; if (cs) { mission(cs, x.cle, x.minutes, "court"); clore(cs, { type: "done", detail: "automate" }); } } // une audience ne se manque pas, même fatigué
      st.suites = st.suites.filter((x) => x.day > s.day);
      // les clients arrivés (message, courrier) : reçus le matin
      for (const id of s.order.slice()) { const cs = s.cases[id]; if (cs && cs.status === "lead" && !st.vus.has(id) && s.min < 17 * 60) { st.vus.add(id); if (s.ring && s.ring.caseId === id) s.ring = null; client(cs); } }
      // une heure par dossier payant suivi
      for (const w of st.travaux.slice()) { if (s.min >= 18 * 60 || s.energy < 30) break; const cs = s.cases[w.id]; CR.spend(s, 60, "desk", { caseId: w.id }); w.reste -= 60; if (w.reste <= 0) { st.travaux = st.travaux.filter((x) => x !== w); if (cs) clore(cs, { type: "done", detail: "automate" }); if (r() < 0.85) CR.schedule(s, { day: s.day + 60, type: "fn", key: "automateSolde", data: { amount: w.solde, caseId: w.id } }); CR.rep(s, "clients", 1); } }
      // le reste de la journée : une demi-heure de paperasse, puis on attend le téléphone (permanence) par tranches de dix
      // minutes ; un appel tombé pendant une mission est sur la messagerie : on rappelle aussitôt
      CR.spend(s, 30, "admin");
      for (const g of s.disc.open.filter((x) => !x.response)) CR.answerGrievance(s, g.id, "candide");
      while (s.min < 18 * 60 && !s.burnout && s.energy >= 30) {
        if (s.ring) { const cs = s.cases[s.ring.caseId]; s.ring = null; if (cs && !st.vus.has(cs.id)) { st.vus.add(cs.id); client(cs); } continue; }
        const rate = s.order.map((id) => s.cases[id]).find((c) => c && c.status === "lead" && !st.vus.has(c.id));
        if (rate) { st.vus.add(rate.id); client(rate); continue; }
        CR.spend(s, 10, "idle");
      }
      st.heures += (s.workedToday - m0) / 60;
    }
    CR.endDay(s);
    st.bas = Math.min(st.bas, s.cash - s.decouvert.used);
  }
  return { seed, profil: nomProfil, fin: s.gameOver ? s.gameOver.reason + " j" + s.gameOver.day : "en activité", jour: s.day, tresorerie: Math.round(s.cash - s.decouvert.used), bas: Math.round(st.bas), epuisements: s.log.filter((l) => /Malaise d'épuisement/.test(l.text)).length + (st.epuisementsAvant || 0), discipline: s.disc.record.map((x) => x.sanction).join(", ") || "aucune", missionsParMois: +(st.missions / mois).toFixed(1), payantsParMois: +(st.payants / mois).toFixed(1), refus: st.refus, appelsLaisses: st.laisses, heuresParJour: +(st.heures / Math.max(1, st.joursOuvres)).toFixed(1), clients: Math.round(s.reps.clients), aj: Math.round(s.stats.aj), honoraires: Math.round(s.stats.honoraires), dossiers: s.order.length, poidsKo: Math.round(CR.serialize(s).length / 1024), s };
}
function installer(CR) { CR.GLOBAL_FN.automateSolde = (s, d) => { CR.payIn(s, d.amount, "Solde d'honoraires — automate", d.caseId); s.stats.honoraires += d.amount; }; }
module.exports = { carriere, installer, PROFILS };
if (require.main === module) (async () => {
  const { CR } = boot(); await sleep(150); installer(CR);
  const n = +(process.argv[2] || 20), mois = +(process.argv[3] || 12), profil = process.argv[4] || "moyen";
  const res = []; for (let seed = 1; seed <= n; seed++) { const x = carriere(CR, seed, mois, profil); delete x.s; res.push(x); console.log(JSON.stringify(x)); }
  const ok = res.filter((x) => x.fin === "en activité" && x.tresorerie >= 0).length, med = (k) => res.map((x) => x[k]).sort((a, b) => a - b)[Math.floor(res.length / 2)];
  console.log(`\n${profil}, ${mois} mois, ${n} graines : ${ok} solvables (${Math.round(ok * 100 / n)} %) · médianes : trésorerie ${med("tresorerie")} €, point bas ${med("bas")} €, ${med("missionsParMois")} missions et ${med("payantsParMois")} clients payants par mois, ${med("heuresParJour")} h par jour ouvré, épuisements ${med("epuisements")}`);
  process.exit(0);
})();
