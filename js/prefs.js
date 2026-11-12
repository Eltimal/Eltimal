/* La Permanence — version du jeu et réglages de l'appareil (taille du texte, son).
   Ces réglages suivent l'appareil, pas la partie : ils valent dès l'écran titre et pour toutes les sauvegardes. */
(function () {
  const CR = (window.CR = window.CR || {});
  CR.JEU = { version: "1.0", date: "novembre 2026" };
  const KEY = "la-permanence-reglages-v1";
  const DEF = { taille: 1, son: true, volume: 0.6, ambiance: true, musique: true };
  CR.TAILLES = [[0.9, "Petit"], [1, "Normal"], [1.12, "Grand"], [1.25, "Très grand"]];
  const P = Object.assign({}, DEF);
  try { const raw = window.localStorage.getItem(KEY); if (raw) Object.assign(P, JSON.parse(raw)); } catch (e) { /* stockage refusé : réglages par défaut */ }
  if (!CR.TAILLES.some(([v]) => v === P.taille)) P.taille = 1;
  P.volume = Math.max(0, Math.min(1, +P.volume || 0));
  CR.prefs = P;
  CR.prefsApply = () => {
    try { document.documentElement.style.setProperty("--tz", String(P.taille)); } catch (e) { /* pas de document */ }
    if (CR.SON) CR.SON.regler();
  };
  CR.prefsSet = (k, v) => {
    P[k] = v;
    try { window.localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* le réglage vaut pour cette séance */ }
    CR.prefsApply();
  };
  CR.prefsApply();
})();
