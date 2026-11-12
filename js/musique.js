/* La Permanence — musique (CR.MUS), refonte. Fabriquée par le navigateur comme le reste du son : aucun fichier.
   Une partition lente et clairsemée, tirée au fil de l'eau dans une gamme et une suite d'accords propres à chaque
   climat : titre, cabinet, nuit (permanence, commissariat, garde à vue), audience, domicile. Dehors et au
   téléphone, la musique se tait. Trois voix : un piano feutré, une nappe, une basse ; un battement sourd quand la
   tension monte. Passe par CR.SON (même contexte audio, même volume) ; réglage « musique » de l'appareil.
   MUS.climat(nom) choisit le climat ; MUS.sync(s, scene) le déduit de la partie (appelé par SON.sync). */
(function () {
  const CR = window.CR, SON = CR.SON;
  const MUS = (CR.MUS = { nom: null, voulu: null, log: [] });
  if (!SON) return;
  const P = () => CR.prefs || { son: true, musique: true };
  const MIN = [0, 2, 3, 5, 7, 8, 10], DOR = [0, 2, 3, 5, 7, 9, 10], PHR = [0, 1, 3, 5, 7, 8, 10], MAJ = [0, 2, 4, 5, 7, 9, 11];
  const CLIMATS = {
    titre: { bpm: 66, root: 50, sc: MIN, prog: [[0, 2, 4], [5, 7, 9], [3, 5, 7], [4, 6, 8]], dens: 0.34, nappe: 0.5, vol: 1 },
    cabinet: { bpm: 72, root: 53, sc: DOR, prog: [[0, 2, 4, 6], [3, 5, 7], [0, 2, 4, 6], [4, 6, 8]], dens: 0.2, nappe: 0.32, vol: 0.75 },
    nuit: { bpm: 54, root: 45, sc: PHR, prog: [[0, 2, 4], [0, 2, 4], [1, 3, 5], [0, 2, 4]], dens: 0.13, nappe: 0.62, pouls: 1, vol: 0.9 },
    audience: { bpm: 60, root: 48, sc: MIN, prog: [[0, 2, 4], [5, 7, 9], [0, 2, 4], [4, 6, 8]], dens: 0.1, nappe: 0.7, pouls: 0.6, vol: 0.7 },
    domicile: { bpm: 63, root: 55, sc: MAJ, prog: [[0, 2, 4, 6], [3, 5, 7, 9], [5, 7, 9, 11], [4, 6, 8]], dens: 0.24, nappe: 0.42, vol: 0.8 },
  };
  MUS.CLIMATS = CLIMATS;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const deg = (c, d) => c.root + c.sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  let bus = null, echo = null, timer = 0, next = 0, pas = 0, mesure = 0, dernier = 9, cur = null;

  function ouvrir() {
    const c = SON.ctx;
    if (!c || !SON.master) return null;
    if (!bus) {
      bus = c.createGain(); bus.gain.value = 0; bus.connect(SON.master);
      // un peu d'espace : deux retards croisés, adoucis
      echo = c.createGain(); echo.gain.value = 0.32;
      const d1 = c.createDelay(1), d2 = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter();
      d1.delayTime.value = 0.31; d2.delayTime.value = 0.47; fb.gain.value = 0.42; lp.type = "lowpass"; lp.frequency.value = 1700;
      echo.connect(d1); d1.connect(d2); d2.connect(lp); lp.connect(fb); fb.connect(d1); d1.connect(bus); lp.connect(bus);
    }
    return c;
  }
  function note(c, quand, midi, dur, g, type) {
    const o = c.createOscillator(), o2 = c.createOscillator(), a = c.createGain(), f = c.createBiquadFilter(), fq = hz(midi);
    f.type = "lowpass";
    if (type === "nappe") {
      o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = fq; o2.frequency.value = fq * 1.004; f.frequency.value = 520;
      a.gain.setValueAtTime(0.0001, quand); a.gain.linearRampToValueAtTime(g, quand + dur * 0.4); a.gain.linearRampToValueAtTime(0.0001, quand + dur * 1.15);
    } else if (type === "basse") {
      o.type = "sine"; o2.type = "triangle"; o.frequency.value = fq; o2.frequency.value = fq; f.frequency.value = 300;
      a.gain.setValueAtTime(0.0001, quand); a.gain.linearRampToValueAtTime(g, quand + 0.08); a.gain.exponentialRampToValueAtTime(0.0001, quand + dur);
    } else {
      o.type = "triangle"; o2.type = "sine"; o.frequency.value = fq; o2.frequency.value = fq * 2; f.frequency.setValueAtTime(2400, quand); f.frequency.exponentialRampToValueAtTime(500, quand + dur);
      a.gain.setValueAtTime(0.0001, quand); a.gain.linearRampToValueAtTime(g, quand + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, quand + dur);
    }
    o.connect(f); o2.connect(f); f.connect(a); a.connect(bus); if (type !== "basse") a.connect(echo);
    const fin = quand + dur * (type === "nappe" ? 1.2 : 1) + 0.05;
    o.start(quand); o2.start(quand); o.stop(fin); o2.stop(fin);
  }
  function battement(c, quand, g) {
    const o = c.createOscillator(), a = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(70, quand); o.frequency.exponentialRampToValueAtTime(38, quand + 0.22);
    a.gain.setValueAtTime(0.0001, quand); a.gain.linearRampToValueAtTime(g, quand + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, quand + 0.34);
    o.connect(a); a.connect(bus); o.start(quand); o.stop(quand + 0.4);
  }
  function tourner() {
    const c = SON.ctx;
    if (!c || !cur) return;
    const k = CLIMATS[cur], d8 = 30 / k.bpm;
    if (next < c.currentTime) next = c.currentTime + 0.08;
    while (next < c.currentTime + 1.2) {
      const acc = k.prog[mesure % k.prog.length];
      if (pas === 0) {
        if (k.nappe) acc.forEach((d, i) => note(c, next, deg(k, d) + 12, d8 * 8, 0.022 * k.nappe * (i ? 0.8 : 1), "nappe"));
        note(c, next, deg(k, acc[0]) - 12, d8 * 7, 0.11, "basse");
      }
      if (k.pouls && (pas === 0 || pas === 3)) battement(c, next, 0.12 * k.pouls * (pas ? 0.6 : 1));
      if (Math.random() < k.dens * (pas === 0 || pas === 4 ? 1.7 : pas % 2 ? 0.6 : 1)) {
        let d = Math.random() < 0.72 ? acc[Math.floor(Math.random() * acc.length)] : dernier + (Math.random() < 0.5 ? 1 : -1);
        while (d - dernier > 4) d -= 7; while (dernier - d > 4) d += 7;
        d = Math.max(5, Math.min(16, d)); dernier = d;
        note(c, next, deg(k, d) + 12, d8 * (3 + Math.random() * 5), 0.085 + Math.random() * 0.04, "piano");
        if (Math.random() < 0.18) note(c, next + d8 * 0.5, deg(k, d + 2) + 12, d8 * 4, 0.05, "piano");
      }
      next += d8; pas = (pas + 1) % 8; if (pas === 0) mesure++;
    }
  }
  MUS.regler = () => { if (!bus || !SON.ctx) return; const p = P(), on = p.son && p.musique !== false && cur; bus.gain.setTargetAtTime(on ? 0.55 * CLIMATS[cur].vol : 0, SON.ctx.currentTime, 0.9); };
  MUS.climat = (nom) => {
    if (!CLIMATS[nom]) nom = null;
    MUS.voulu = nom;
    if (!SON.pret || !ouvrir()) return;
    if (nom === MUS.nom) { MUS.regler(); return; }
    MUS.nom = nom; MUS.log.push(nom || "silence"); if (MUS.log.length > 40) MUS.log.shift();
    if (!nom) { bus.gain.setTargetAtTime(0, SON.ctx.currentTime, 0.7); clearInterval(timer); timer = 0; cur = null; return; }
    cur = nom; pas = 0; mesure = 0; dernier = 9; next = SON.ctx.currentTime + 0.6;
    MUS.regler();
    if (!timer) timer = setInterval(() => { try { if (P().son && P().musique !== false) tourner(); } catch (e) { /* muette */ } }, 400);
  };
  MUS.sync = (s, scene) => {
    let nom = null;
    if (!s) nom = "titre";
    else {
      const type = scene ? scene.type : null, pl = CR.placeOf ? CR.placeOf(s, s.at) : null, t = pl && pl.type;
      const nuit = CR.mapPhase ? CR.mapPhase(s.min) === "nuit" : false;
      if (type === "court") nom = "audience";
      else if (type === "gav") nom = "nuit";
      else if (type === "call") nom = null;
      else if (s.at === "domicile") nom = "domicile";
      else if (t === "commissariat" || t === "prison") nom = "nuit";
      else if (t === "cabinet") nom = nuit || s.night ? "nuit" : "cabinet";
      else if (t === "palais") nom = "audience";
    }
    MUS.climat(nom);
  };
  MUS.sortie = () => bus;
  // au premier geste (le son s'éveille), lancer le climat voulu sans attendre le prochain rendu
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, () => setTimeout(() => { try { if (MUS.nom !== MUS.voulu || !timer) MUS.climat(MUS.voulu); } catch (e) { /* muette */ } }, 60), { passive: true }));
  // branchement : la musique suit le son (SON.sync à chaque rendu, SON.regler à chaque réglage)
  const sync0 = SON.sync, regler0 = SON.regler;
  SON.sync = function (s, scene) { const r = sync0.apply(this, arguments); try { MUS.sync(s, scene); } catch (e) { /* muette */ } return r; };
  SON.regler = function () { const r = regler0.apply(this, arguments); try { MUS.regler(); } catch (e) { /* muette */ } return r; };
})();
