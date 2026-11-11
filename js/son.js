/* La Permanence — ambiance sonore. Tout est fabriqué par le navigateur (Web Audio) : aucun fichier, rien à télécharger.
   CR.SON.jouer(nom) : un bruit bref. CR.SON.ambiance(nom) : le fond sonore d'un lieu, fondu avec le précédent.
   CR.SON.sync(s, scene) : appelé à chaque rendu, choisit l'ambiance d'après le lieu, l'heure, la pluie et la scène.
   Sans Web Audio (tests jsdom, vieux navigateur), tout reste muet mais CR.SON.log garde la trace des appels. */
(function () {
  const CR = (window.CR = window.CR || {});
  const AC = window.AudioContext || window.webkitAudioContext;
  const SON = (CR.SON = { ok: !!AC, ctx: null, amb: null, ambNom: null, voulu: null, log: [], pret: false });
  const P = () => CR.prefs || { son: true, volume: 0.6, ambiance: true };
  let blanc = null, brun = null;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function ouvrir() {
    if (!SON.ok) return null;
    if (!SON.ctx) {
      try {
        const c = (SON.ctx = new AC());
        const comp = c.createDynamicsCompressor();
        comp.connect(c.destination);
        SON.master = c.createGain(); SON.master.connect(comp);
        SON.fx = c.createGain(); SON.fx.gain.value = 1.8; SON.fx.connect(SON.master);
        SON.ambBus = c.createGain(); SON.ambBus.connect(SON.master);
        const mk = (b) => { const n = c.sampleRate * 2, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (b) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return buf; };
        blanc = mk(false); brun = mk(true);
        SON.regler();
      } catch (e) { SON.ok = false; SON.ctx = null; return null; }
    }
    if (SON.ctx.state === "suspended" && SON.ctx.resume) { const r = SON.ctx.resume(); if (r && r.catch) r.catch(() => {}); }
    return SON.ctx;
  }
  SON.regler = () => {
    if (!SON.ctx) return;
    const t = SON.ctx.currentTime, p = P();
    SON.master.gain.setTargetAtTime(p.son ? p.volume : 0, t, 0.05);
    SON.ambBus.gain.setTargetAtTime(p.ambiance ? 1.6 : 0, t, 0.2);
  };

  // ------------------------------------------------------------ briques : une note, un souffle
  function ton(f, o = {}) {
    const c = SON.ctx, t = c.currentTime + (o.at || 0), d = o.d || 0.2;
    const os = c.createOscillator(), g = c.createGain();
    os.type = o.type || "sine"; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g || 0.1, t + (o.a || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    os.connect(g); g.connect(o.dest || SON.fx); os.start(t); os.stop(t + d + 0.05);
  }
  function souffle(o = {}) {
    const c = SON.ctx, t = c.currentTime + (o.at || 0), d = o.d || 0.1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = o.brun ? brun : blanc;
    f.type = o.type || "bandpass"; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.Q || 1;
    if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g || 0.1, t + (o.a || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f); f.connect(g); g.connect(o.dest || SON.fx); src.start(t, Math.random()); src.stop(t + d + 0.05);
  }

  // ------------------------------------------------------------ bruits brefs
  const FX = {
    clic: (z) => souffle({ f: 3200, Q: 2, d: 0.03, g: 0.05, dest: z }),
    onglet: (z) => { souffle({ f: 1800, Q: 1.5, d: 0.05, g: 0.05, dest: z }); },
    page: (z) => { souffle({ f: 1400, fto: 4200, Q: 0.8, d: 0.22, g: 0.09, a: 0.04, dest: z }); souffle({ f: 5200, Q: 1, d: 0.06, g: 0.04, at: 0.2, dest: z }); },
    note: (z) => { souffle({ f: 4200, Q: 3, d: 0.07, g: 0.06, dest: z }); souffle({ f: 3600, Q: 3, d: 0.09, g: 0.05, at: 0.09, dest: z }); },
    surligne: (z) => souffle({ f: 2600, fto: 3400, Q: 2, d: 0.18, g: 0.05, a: 0.03, dest: z }),
    mail: (z) => { ton(880, { d: 0.18, g: 0.07, dest: z }); ton(1320, { d: 0.3, g: 0.06, at: 0.11, dest: z }); },
    alerte: (z) => { ton(520, { d: 0.14, g: 0.07, type: "triangle", dest: z }); ton(520, { d: 0.18, g: 0.06, type: "triangle", at: 0.2, dest: z }); },
    erreur: (z) => { ton(196, { d: 0.22, g: 0.1, type: "triangle", to: 150, dest: z }); },
    bien: (z) => { ton(660, { d: 0.14, g: 0.06, dest: z }); ton(990, { d: 0.24, g: 0.05, at: 0.1, dest: z }); },
    // le téléphone du cabinet : deux notes qui alternent vite, comme un vieux combiné
    dring: (z) => { for (let i = 0; i < 16; i++) ton(i % 2 ? 1480 : 1180, { d: 0.05, g: 0.07, type: "triangle", at: i * 0.052, dest: z }); },
    decroche: (z) => { souffle({ f: 900, Q: 1, d: 0.05, g: 0.1, dest: z }); ton(120, { d: 0.09, g: 0.1, at: 0.02, dest: z }); },
    raccroche: (z) => { ton(140, { d: 0.08, g: 0.1, dest: z }); souffle({ f: 1200, Q: 1, d: 0.05, g: 0.08, at: 0.03, dest: z }); },
    // la sonnette qui annonce l'entrée du tribunal (il n'y a pas de marteau dans une salle d'audience française)
    cloche: (z) => { [[1320, 0.09, 1.6], [2650, 0.04, 1.0], [3980, 0.02, 0.6], [660, 0.03, 1.2]].forEach(([f, g, d]) => ton(f, { d, g, dest: z })); },
    chaises: (z) => { for (let i = 0; i < 7; i++) souffle({ brun: true, type: "lowpass", f: rnd(250, 600), d: rnd(0.12, 0.3), g: rnd(0.08, 0.16), at: rnd(0, 0.9), a: 0.03, dest: z }); },
    porte: (z) => { souffle({ brun: true, type: "lowpass", f: 320, d: 0.5, g: 0.5, dest: z }); ton(540, { d: 0.5, g: 0.04, type: "square", at: 0.02, dest: z }); ton(812, { d: 0.35, g: 0.025, type: "square", at: 0.02, dest: z }); },
    cles: (z) => { for (let i = 0; i < 6; i++) ton(rnd(2800, 5200), { d: rnd(0.04, 0.09), g: 0.025, at: i * rnd(0.05, 0.09), dest: z }); },
    tampon: (z) => { ton(95, { d: 0.14, g: 0.3, to: 55, dest: z }); souffle({ brun: true, type: "lowpass", f: 500, d: 0.08, g: 0.3, dest: z }); },
    metro: (z) => { souffle({ brun: true, type: "lowpass", f: 420, d: 2.6, g: 0.5, a: 0.9, dest: z }); for (let i = 0; i < 9; i++) souffle({ brun: true, type: "bandpass", f: 900, Q: 2, d: 0.05, g: 0.12, at: 0.5 + i * 0.21, dest: z }); ton(1020, { d: 0.5, g: 0.035, at: 2.1, dest: z }); },
    taxi: (z) => { souffle({ brun: true, type: "lowpass", f: 260, d: 2.2, g: 0.5, a: 0.5, dest: z }); ton(72, { d: 2, g: 0.08, type: "sawtooth", to: 96, a: 0.4, dest: z }); },
    verdict_bon: (z) => { [392, 494, 587].forEach((f, i) => ton(f, { d: 1.2, g: 0.035, at: i * 0.16, a: 0.03, dest: z })); },
    verdict_mauvais: (z) => { [220, 207.6].forEach((f, i) => ton(f, { d: 1.4, g: 0.08, at: i * 0.32, a: 0.04, type: "triangle", dest: z })); ton(110, { d: 1.8, g: 0.07, at: 0.1, a: 0.1, dest: z }); },
    verdict_neutre: (z) => { ton(330, { d: 1, g: 0.06, a: 0.03, dest: z }); ton(440, { d: 1, g: 0.05, at: 0.2, a: 0.03, dest: z }); },
    jour: (z) => { ton(523, { d: 0.5, g: 0.04, a: 0.05, dest: z }); ton(784, { d: 0.8, g: 0.035, at: 0.25, a: 0.05, dest: z }); },
    toux: (z) => { souffle({ f: 700, Q: 1.2, d: 0.09, g: 0.07, dest: z }); souffle({ f: 620, Q: 1.2, d: 0.12, g: 0.06, at: 0.16, dest: z }); },
    pas: (z) => { for (let i = 0; i < 4; i++) souffle({ brun: true, type: "bandpass", f: 520, Q: 1.5, d: 0.07, g: 0.2, at: i * 0.46, dest: z }); },
    radio: (z) => { ton(1650, { d: 0.05, g: 0.02, type: "square", dest: z }); souffle({ f: 1900, Q: 4, d: rnd(0.4, 1.1), g: 0.05, at: 0.06, a: 0.02, dest: z }); },
    clavier: (z) => { const n = 4 + Math.floor(Math.random() * 9); for (let i = 0; i < n; i++) souffle({ f: rnd(2200, 3400), Q: 3, d: 0.025, g: 0.035, at: i * rnd(0.09, 0.16), dest: z }); },
    voiture: (z) => { souffle({ brun: true, type: "bandpass", f: 300, fto: 700, Q: 0.7, d: 2.4, g: 0.28, a: 1.1, dest: z }); },
    sirene: (z) => { for (let i = 0; i < 4; i++) { ton(435, { d: 0.55, g: 0.012, at: i * 1.1, a: 0.05, dest: z }); ton(580, { d: 0.55, g: 0.012, at: i * 1.1 + 0.55, a: 0.05, dest: z }); } },
    horloge: (z) => souffle({ f: 2400, Q: 6, d: 0.02, g: 0.02, dest: z }),
    papier: (z) => souffle({ f: 3000, fto: 1800, Q: 0.8, d: 0.3, g: 0.03, a: 0.08, dest: z }),
    lointain: (z) => { souffle({ brun: true, type: "lowpass", f: 200, d: 0.7, g: 0.35, a: 0.01, dest: z }); ton(410, { d: 0.6, g: 0.012, type: "square", dest: z }); },
  };
  const dernier = {};
  SON.jouer = (nom) => {
    SON.log.push(nom); if (SON.log.length > 200) SON.log.splice(0, 100);
    if (!FX[nom] || !P().son || !SON.pret) return;
    const now = Date.now(); if (dernier[nom] && now - dernier[nom] < 90) return; dernier[nom] = now;
    if (!ouvrir()) return;
    try { FX[nom](SON.fx); } catch (e) { /* un bruit raté ne doit jamais gêner la partie */ }
  };

  // ------------------------------------------------------------ fonds sonores
  function fond(c) {
    const g = c.createGain(); g.gain.value = 0; g.connect(SON.ambBus);
    const nodes = [], timers = new Set(); let vivant = true;
    return {
      g,
      nappe(o) {
        const src = c.createBufferSource(), f = c.createBiquadFilter(), gg = c.createGain();
        src.buffer = o.blanc ? blanc : brun; src.loop = true;
        f.type = o.type || "lowpass"; f.frequency.value = o.f || 400; f.Q.value = o.Q || 0.7; gg.gain.value = o.g || 0.05;
        src.connect(f); f.connect(gg); gg.connect(g); src.start(0, Math.random() * 1.5); nodes.push(src);
        if (o.lfo) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.lfo; lg.gain.value = (o.g || 0.05) * (o.prof || 0.5); l.connect(lg); lg.connect(gg.gain); l.start(); nodes.push(l); }
      },
      bourdon(f, gain, type) { const os = c.createOscillator(), gg = c.createGain(); os.type = type || "sine"; os.frequency.value = f; gg.gain.value = gain; os.connect(gg); gg.connect(g); os.start(); nodes.push(os); },
      parfois(a, b, fn) { const tour = () => { if (!vivant) return; const id = setTimeout(() => { timers.delete(id); if (!vivant) return; if (P().son && P().ambiance && !document.hidden) { try { fn(g); } catch (e) { /* muet */ } } tour(); }, rnd(a, b) * 1000); timers.add(id); }; tour(); },
      entrer() { const t = c.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1, t + 1.2); },
      sortir() { vivant = false; timers.forEach((id) => clearTimeout(id)); timers.clear(); const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + 0.9); setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch (e) { /* déjà arrêté */ } }); try { g.disconnect(); } catch (e) { /* déjà débranché */ } }, 1100); },
    };
  }
  const pluie = (A) => { A.nappe({ blanc: true, type: "highpass", f: 1800, g: 0.035 }); A.nappe({ blanc: true, type: "bandpass", f: 700, Q: 0.5, g: 0.02, lfo: 0.13, prof: 0.6 }); };
  const AMB = {
    // le cabinet : une pièce calme, l'horloge, la rue derrière la fenêtre
    cabinet: (A, o) => { A.nappe({ f: 160, g: 0.06 }); A.nappe({ type: "bandpass", f: 320, Q: 0.6, g: o.nuit ? 0.008 : 0.022, lfo: 0.07, prof: 0.7 }); A.parfois(1, 1, FX.horloge); if (!o.nuit) A.parfois(9, 26, FX.voiture); A.parfois(25, 70, o.nuit ? FX.sirene : FX.papier); if (o.pluie) pluie(A); },
    domicile: (A, o) => { A.nappe({ f: 120, g: 0.05 }); A.bourdon(50, 0.012); A.parfois(40, 110, FX.sirene); if (o.pluie) pluie(A); },
    rue: (A, o) => { A.nappe({ f: 480, g: o.nuit ? 0.06 : 0.13, lfo: 0.09, prof: 0.5 }); A.parfois(o.nuit ? 9 : 3, o.nuit ? 22 : 9, FX.voiture); A.parfois(30, 80, FX.sirene); A.parfois(5, 14, FX.pas); if (o.pluie) pluie(A); },
    // le palais : la salle des pas perdus, des pas, une rumeur
    palais: (A) => { A.nappe({ type: "bandpass", f: 380, Q: 0.6, g: 0.07, lfo: 0.11, prof: 0.6 }); A.nappe({ f: 140, g: 0.05 }); A.parfois(3, 9, FX.pas); A.parfois(12, 30, FX.lointain); A.parfois(10, 25, FX.toux); },
    // la salle d'audience : la rumeur du public, une toux, des feuilles
    salle: (A) => { A.nappe({ type: "bandpass", f: 420, Q: 0.7, g: 0.05, lfo: 0.17, prof: 0.7 }); A.nappe({ f: 130, g: 0.045 }); A.parfois(7, 20, FX.toux); A.parfois(6, 16, FX.papier); A.parfois(20, 50, FX.chaises); },
    // un cabinet de juge, la chambre du conseil : le silence, le clavier du greffier
    huis: (A) => { A.nappe({ f: 150, g: 0.05 }); A.parfois(4, 12, FX.clavier); A.parfois(15, 40, FX.papier); },
    // le commissariat : les néons, la radio, un clavier
    commissariat: (A) => { A.bourdon(100, 0.02); A.bourdon(200, 0.006); A.nappe({ f: 260, g: 0.06 }); A.parfois(6, 18, FX.radio); A.parfois(4, 11, FX.clavier); A.parfois(22, 60, FX.lointain); },
    prison: (A) => { A.bourdon(60, 0.02); A.nappe({ f: 220, g: 0.07, lfo: 0.05, prof: 0.4 }); A.parfois(10, 28, FX.lointain); A.parfois(14, 40, FX.cles); A.parfois(8, 20, FX.pas); },
    titre: (A) => { A.nappe({ f: 300, g: 0.07, lfo: 0.06, prof: 0.6 }); pluie(A); A.parfois(18, 45, FX.sirene); A.parfois(10, 24, FX.voiture); },
  };
  SON.ambiance = (nom, o) => {
    const cle = nom ? nom + (o && o.nuit ? ":n" : "") + (o && o.pluie ? ":p" : "") : null;
    SON.voulu = { nom, o: o || {}, cle };
    if (SON.ambNom === cle) return;
    if (!SON.pret || !P().son || !P().ambiance) { if (!SON.pret) SON.ambNom = null; return; }
    const c = ouvrir(); if (!c) return;
    if (SON.amb) SON.amb.sortir();
    SON.amb = null; SON.ambNom = cle;
    if (!nom || !AMB[nom]) return;
    const A = fond(c);
    try { AMB[nom](A, o || {}); A.entrer(); SON.amb = A; } catch (e) { SON.amb = null; }
  };

  // la sonnerie dure tant que le téléphone sonne
  let sonne = null;
  SON.sonner = (oui) => {
    if (oui && !sonne) { SON.jouer("dring"); sonne = setInterval(() => SON.jouer("dring"), 2600); }
    else if (!oui && sonne) { clearInterval(sonne); sonne = null; }
  };

  // ------------------------------------------------------------ l'ambiance suit la partie
  const HUIS = /juge d'instruction|JLD|libertés|chambre de l'instruction|chambre du conseil|interrogatoire|confrontation|homologation|réunion préparatoire|parquet|délégué/i;
  let vu = { scene: null, at: null, jour: null };
  SON.sync = (s, scene) => {
    if (!s) { SON.sonner(false); SON.ambiance("titre"); vu = { scene: null, at: null, jour: null }; return; }
    SON.sonner(!!s.ring && !(scene && scene.type === "call"));
    const type = scene ? scene.type : null;
    const nuit = CR.mapPhase ? CR.mapPhase(s.min) === "nuit" : false;
    const o = { nuit, pluie: !!(CR.dec && CR.dec.rainy && CR.dec.rainy(s)) };
    let nom;
    if (type === "court") {
      let titre = "";
      try { const cs = s.cases[scene.caseId]; const h = cs && (cs.hearings || []).find((x) => x.id === scene.hid); titre = (h && h.title) || ""; } catch (e) { titre = ""; }
      nom = HUIS.test(titre) ? "huis" : "salle";
    } else if (type === "gav") nom = "commissariat";
    else {
      const pl = CR.placeOf ? CR.placeOf(s, s.at) : null;
      const t = pl && pl.type;
      nom = s.at === "domicile" ? "domicile" : t === "cabinet" ? "cabinet" : t === "palais" ? "palais" : t === "commissariat" ? "commissariat" : t === "prison" ? "prison" : t === "ordre" ? "palais" : "rue";
    }
    if (type !== vu.scene) {
      if (type === "court") { SON.jouer(nom === "salle" ? "cloche" : "porte"); if (nom === "salle") setTimeout(() => SON.jouer("chaises"), 500); }
      else if (type === "gav") SON.jouer("porte");
      else if (type === "call") SON.jouer("decroche");
      else if (vu.scene === "call") SON.jouer("raccroche");
      else if (type === "draft") SON.jouer("papier");
    }
    if (vu.jour != null && s.day !== vu.jour && !type) SON.jouer("jour");
    vu = { scene: type, at: s.at, jour: s.day };
    SON.ambiance(nom, nom === "salle" || nom === "huis" || nom === "commissariat" || nom === "prison" || nom === "palais" ? {} : o);
  };

  // ------------------------------------------------------------ branchements sur le jeu, sans toucher aux mécaniques
  const envelopper = (nom, avant) => { const f = CR[nom]; if (typeof f !== "function") return; CR[nom] = function () { try { avant.apply(null, arguments); } catch (e) { /* muet */ } return f.apply(this, arguments); }; };
  envelopper("mail", (s) => { if (s && s.day != null && SON.pret) SON.jouer("mail"); });
  envelopper("toast", (s, texte, kind) => { if (kind === "bad") SON.jouer("erreur"); else if (kind === "warn") SON.jouer("alerte"); else if (kind === "good") SON.jouer("bien"); });
  envelopper("travel", (s, to, mode) => { if (s && s.at !== to) SON.jouer(mode === "taxi" ? "taxi" : "metro"); });
  envelopper("closeCase", (s, cs, outcome) => { const t = (outcome && outcome.type) || ""; SON.jouer(/relaxe|acquittement|requalification_favorable|non_lieu|classement|indemnise|alternative|crpc/.test(t) ? "verdict_bon" : /condamnation|deboute|irrecevable|prescrit|lost|fired|incompetence/.test(t) ? "verdict_mauvais" : "verdict_neutre"); });
  envelopper("releverIrreg", () => SON.jouer("note"));
  envelopper("surligner", () => SON.jouer("surligne"));
  envelopper("addNote", () => SON.jouer("note"));
  envelopper("pinText", () => SON.jouer("tampon"));

  try {
    // Le navigateur n'autorise le son qu'après un premier geste : on ouvre à ce moment-là.
    const eveil = () => { if (SON.pret) return; SON.pret = true; if (ouvrir() && SON.voulu) { const v = SON.voulu; SON.ambNom = null; SON.ambiance(v.nom, v.o); } };
    ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, eveil, { passive: true }));
    document.addEventListener("click", (e) => {
      const el = e.target && e.target.closest ? e.target : null; if (!el) return;
      if (el.closest(".lv-coin, .lv-fleche, .lv-page, .doc-list button, .lv-volume")) SON.jouer("page");
      else if (el.closest(".rail-btn, .tab, .tabs button, .chip, .nchip")) SON.jouer("onglet");
      else if (el.closest("button, .task, .case-card, .mail, .decide-opt, label.check")) SON.jouer("clic");
    }, true);
    document.addEventListener("visibilitychange", () => { if (!SON.ctx) return; try { if (document.hidden) SON.ctx.suspend(); else if (P().son) SON.ctx.resume(); } catch (e) { /* rien */ } });
  } catch (e) { /* pas de document */ }
})();
