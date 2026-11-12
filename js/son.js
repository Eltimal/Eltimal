/* La Permanence — ambiance sonore, refonte du 12 novembre 2026. Les lieux sonnent avec de vrais enregistrements
   (BigSoundBank et Kenney, CC0 : sons/CREDITS.md), fabriqués par dev/tools/fabriquer-sons.js et chargés à la demande
   depuis js/sons/<nom>.js. Chaque lieu est un mélange de couches : un fond enregistré joué par fragments tirés au hasard
   et fondus entre eux (jamais la même boucle), la pluie filtrée selon qu'on est dehors ou derrière une vitre, des
   bruits ponctuels tirés parmi plusieurs prises (hauteur, volume, position et intervalle variables), une réverbération
   à la taille de la pièce. Les quelques bruits sans enregistrement restent fabriqués par le navigateur (Web Audio).
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
        // limiteur de crêtes seulement : il ne touche pas au niveau courant (l'ancien compresseur pompait le souffle)
        const lim = c.createDynamicsCompressor();
        lim.threshold.value = -4; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.004; lim.release.value = 0.25;
        lim.connect(c.destination);
        SON.master = c.createGain(); SON.master.connect(lim);
        SON.fx = c.createGain(); SON.fx.gain.value = 0.9; SON.fx.connect(SON.master);
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
    SON.ambBus.gain.setTargetAtTime(p.ambiance ? 1 : 0, t, 0.2);
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

  // ------------------------------------------------------------ enregistrements : chargement à la demande
  const DOSSIER = "js/sons/";
  const tampons = {};
  function decoder(b64) {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Promise((ok, ko) => { const r = SON.ctx.decodeAudioData(u.buffer, ok, ko); if (r && r.then) r.then(ok, ko); });
  }
  SON.charger = (nom) => {
    if (tampons[nom]) return tampons[nom];
    const p = new Promise((ok, ko) => {
      const pret = () => { const v = window.CR.SONS_DATA && window.CR.SONS_DATA[nom]; if (!v) return ko(new Error("son absent : " + nom)); Promise.all(v.map(decoder)).then((b) => { delete window.CR.SONS_DATA[nom]; ok(b); }, ko); };
      if (window.CR.SONS_DATA && window.CR.SONS_DATA[nom]) return pret();
      const sc = document.createElement("script"); sc.src = DOSSIER + nom + ".js"; sc.async = true;
      sc.onload = pret; sc.onerror = () => ko(new Error("chargement impossible : " + nom));
      document.head.appendChild(sc);
    });
    tampons[nom] = p; p.catch(() => { delete tampons[nom]; });
    return p;
  };
  const choisir = (() => { const der = {}; return (nom, liste) => { if (liste.length < 2) return liste[0]; let i; do { i = Math.floor(Math.random() * liste.length); } while (i === der[nom]); der[nom] = i; return liste[i]; }; })();
  const v = (x) => (Array.isArray(x) ? rnd(x[0], x[1]) : x == null ? 1 : x);
  // une chaîne de filtres : passe-haut, passe-bas, position stéréo
  function chaine(c, o, dest) {
    let tete = dest;
    if (o.pan != null && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, v(o.pan))); p.connect(tete); tete = p; }
    if (o.lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = v(o.lp); f.Q.value = 0.5; f.connect(tete); tete = f; }
    if (o.hp) { const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = v(o.hp); f.Q.value = 0.5; f.connect(tete); tete = f; }
    return tete;
  }
  // un enregistrement bref, une prise tirée au hasard ; o : g, pitch, pan, lp, hp, rev (envoi), at, duree (coupe en fondu)
  function prise(nom, o, dest, rev) {
    const c = SON.ctx; if (!c) return;
    SON.charger(nom).then((bufs) => {
      const b = choisir(nom, bufs), t = c.currentTime + (o.at || 0) + 0.01;
      const src = c.createBufferSource(), g = c.createGain();
      src.buffer = b; src.playbackRate.value = v(o.pitch);
      const niv = v(o.g); g.gain.setValueAtTime(niv, t);
      if (o.duree && o.duree < b.duration) { g.gain.setValueAtTime(niv, t + o.duree - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + o.duree); }
      src.connect(g); g.connect(chaine(c, o, dest));
      if (rev && o.rev) { const s = c.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(rev); }
      src.start(t, o.debut ? Math.min(o.debut, b.duration - 0.1) : 0); src.stop(t + (o.duree || b.duration / src.playbackRate.value) + 0.05);
    }).catch(() => { /* pas encore chargé ou absent : on se tait */ });
  }
  SON.prise = (nom, o) => { if (!SON.pret || !P().son || !ouvrir()) return; prise(nom, o || {}, SON.fx, null); };

  // ------------------------------------------------------------ bruits brefs
  // bruits fabriqués (repli quand aucun enregistrement ne convient)
  const SYNTH = {
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

  // bruits brefs du jeu : un enregistrement quand il existe, sinon le bruit fabriqué
  const E = (nom, o) => (z) => prise(nom, o || {}, z, null);
  const FX = Object.assign({}, SYNTH, {
    clic: E("ui_clic", { g: 0.22, pitch: [0.96, 1.05] }),
    onglet: E("ui_onglet", { g: 0.22, pitch: [0.97, 1.03] }),
    page: E("papier", { g: 0.45, pitch: [0.92, 1.08] }),
    note: E("ui_note", { g: 0.25 }),
    surligne: E("ui_surligne", { g: 0.22 }),
    mail: E("ui_mail", { g: 0.3 }),
    alerte: E("ui_alerte", { g: 0.3 }),
    erreur: E("ui_erreur", { g: 0.3 }),
    bien: E("ui_bien", { g: 0.3 }),
    dring: E("sonnerie", { g: 0.42 }),
    chaises: (z) => { for (let i = 0; i < 3; i++) prise("chaise", { g: [0.25, 0.4], pitch: [0.9, 1.1], pan: [-0.6, 0.6], at: rnd(0, 1.2) }, z, null); },
    porte: E("porte", { g: 0.6, pitch: [0.62, 0.72] }),
    cles: E("cles", { g: 0.45, pitch: [0.95, 1.05] }),
    metro: E("metro_arrivee", { g: 0.7, duree: 6 }),
    taxi: (z) => prise("voiture", { g: 0.7, duree: 6, debut: rnd(0, 90) }, z, null),
    pas: E("talons", { g: 0.35 }),
    clavier: E("clavier", { g: 0.3 }),
    papier: E("papier", { g: 0.35 }),
    sirene: E("sirene", { g: 0.12, lp: 1400 }),
  });
  ["clic", "onglet", "note", "surligne", "mail", "alerte", "erreur", "bien", "dring", "papier"].forEach((n) => { FX[n].precharge = true; });
  const dernier = {};
  SON.jouer = (nom) => {
    SON.log.push(nom); if (SON.log.length > 200) SON.log.splice(0, 100);
    if (!FX[nom] || !P().son || !SON.pret) return;
    const now = Date.now(); if (dernier[nom] && now - dernier[nom] < 90) return; dernier[nom] = now;
    if (!ouvrir()) return;
    try { FX[nom](SON.fx); } catch (e) { /* un bruit raté ne doit jamais gêner la partie */ }
  };

  // ------------------------------------------------------------ fonds sonores
  // réverbération fabriquée : un bruit qui s'éteint, à la taille de la pièce
  function reverb(c, duree) {
    const n = Math.floor(c.sampleRate * duree), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    const cv = c.createConvolver(); cv.buffer = b; return cv;
  }
  function fond(c, o) {
    const g = c.createGain(); g.gain.value = 0; g.connect(SON.ambBus);
    let rev = null;
    if (o && o.salle) { rev = reverb(c, o.salle); const rg = c.createGain(); rg.gain.value = 0.55; rev.connect(rg); rg.connect(g); }
    const nodes = [], timers = new Set(); let vivant = true;
    const plus_tard = (s, fn) => { const id = setTimeout(() => { timers.delete(id); if (vivant) fn(); }, Math.max(0, s * 1000)); timers.add(id); };
    return {
      g,
      // un fond enregistré, joué par fragments de longueur variable pris au hasard et fondus entre eux
      nappe(nom, o) {
        const fondu = o.fondu || 4;
        SON.charger(nom).then((bufs) => {
          if (!vivant) return;
          const sortie = chaine(c, o, g);
          if (o.boucle) { const src = c.createBufferSource(), gg = c.createGain(); src.buffer = bufs[0]; src.loop = true; gg.gain.value = v(o.g); src.connect(gg); gg.connect(sortie); src.start(0, Math.random() * bufs[0].duration); nodes.push(src); return; }
          const suivant = (quand) => {
            if (!vivant) return;
            const b = choisir(nom, bufs), dur = b.duration;
            const long = Math.min(dur - 0.5, rnd(o.seg ? o.seg[0] : 22, o.seg ? o.seg[1] : 48));
            const debut = rnd(0, Math.max(0, dur - long - 0.2));
            const src = c.createBufferSource(), gg = c.createGain(), niv = v(o.g);
            src.buffer = b; src.connect(gg); gg.connect(sortie);
            if (rev && o.rev) { const s = c.createGain(); s.gain.value = o.rev; gg.connect(s); s.connect(rev); }
            gg.gain.setValueAtTime(0.0001, quand); gg.gain.linearRampToValueAtTime(niv, quand + fondu);
            gg.gain.setValueAtTime(niv, quand + long - fondu); gg.gain.linearRampToValueAtTime(0.0001, quand + long);
            src.start(quand, debut); src.stop(quand + long + 0.1); nodes.push(src);
            if (nodes.length > 12) nodes.splice(0, nodes.length - 12);
            const prochain = quand + long - fondu;
            plus_tard(prochain - c.currentTime - 1.5, () => suivant(prochain));
          };
          suivant(c.currentTime + 0.05);
        }).catch(() => { /* fond indisponible : silence */ });
      },
      // un bruit ponctuel à intervalles variables, jamais deux fois la même prise de suite
      parfois(a, b, nom, o) {
        const tour = () => plus_tard(rnd(a, b), () => { if (P().son && P().ambiance && !document.hidden) { try { if (typeof nom === "function") nom(g); else prise(nom, o || {}, g, rev); } catch (e) { /* muet */ } } tour(); });
        tour();
      },
      entrer() { const t = c.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1, t + 2.5); },
      sortir() { vivant = false; timers.forEach((id) => clearTimeout(id)); timers.clear(); const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + 1.6); setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch (e) { /* déjà arrêté */ } }); try { g.disconnect(); } catch (e) { /* déjà débranché */ } }, 1900); },
    };
  }
  // la pluie : derrière une vitre (étouffée), ou dehors (gouttes et chaussée mouillée)
  const pluieDedans = (A, niv) => { A.nappe("pluie_toit", { g: 0.3 * (niv || 1), lp: 1500, hp: 120 }); };
  const pluieDehors = (A) => { A.nappe("pluie_rue", { g: 0.55 }); A.nappe("pluie_toit", { g: 0.22, hp: 700, lp: 7000, pan: 0 }); };
  const lointaine = (A) => A.parfois(70, 200, "sirene", { g: [0.04, 0.09], lp: 1100, pan: [-0.8, 0.8] });
  const salle = { salle: 1.9, palais: 3.2, huis: 0.7, commissariat: 1.1, prison: 2.4 };
  const AMB = {
    // le cabinet : la ville derrière la fenêtre fermée, l'horloge, un papier qu'on déplace
    cabinet: (A, o) => {
      if (o.nuit) A.nappe("nuit", { g: 0.34, lp: 900 }); else A.nappe("cabinet", { g: 0.42, lp: 6500 });
      A.nappe("horloge", { g: 0.07, boucle: true, lp: 5500, pan: 0.35 });
      A.parfois(35, 95, "papier", { g: [0.12, 0.22], pan: [-0.3, 0.3], pitch: [0.9, 1.1] });
      if (o.nuit) lointaine(A);
      if (o.pluie) pluieDedans(A);
    },
    domicile: (A, o) => {
      if (o.nuit) A.nappe("nuit", { g: 0.24, lp: 650 }); else A.nappe("appart", { g: 0.3, lp: 2600 });
      lointaine(A);
      if (o.pluie) pluieDedans(A, 0.9);
    },
    rue: (A, o) => {
      if (o.nuit) A.nappe("nuit", { g: 0.6 }); else A.nappe("rue", { g: 0.62 });
      A.parfois(o.nuit ? 14 : 5, o.nuit ? 35 : 14, "talons", { g: [0.1, 0.22], pan: [-0.9, 0.9], pitch: [0.92, 1.08] });
      lointaine(A);
      if (o.pluie) pluieDehors(A);
    },
    // le palais : la salle des pas perdus, les voix sous la voûte, des talons, une porte au loin
    palais: (A) => {
      A.nappe("hall", { g: 0.26, lp: 3200, rev: 0.6 });
      A.parfois(3, 9, "talons", { g: [0.1, 0.22], pan: [-0.9, 0.9], rev: 0.7, pitch: [0.9, 1.08] });
      A.parfois(20, 55, "porte", { g: [0.08, 0.15], lp: 1600, rev: 0.9, pitch: [0.55, 0.7], pan: [-0.7, 0.7] });
    },
    // la salle d'audience : le public qui chuchote, une chaise, des feuilles
    salle: (A) => {
      A.nappe("public", { g: 0.14, lp: 1300, rev: 0.5 });
      A.parfois(14, 40, "chaise", { g: [0.08, 0.16], pan: [-0.8, 0.8], rev: 0.6, pitch: [0.9, 1.1] });
      A.parfois(9, 24, "papier", { g: [0.06, 0.13], pan: [-0.5, 0.5], rev: 0.3 });
    },
    // un cabinet de juge, la chambre du conseil : presque le silence, le clavier du greffier
    huis: (A) => {
      A.nappe("couloir", { g: 0.13, lp: 500 });
      A.parfois(5, 15, "clavier", { g: [0.1, 0.18], pan: [0.3, 0.6], rev: 0.2 });
      A.parfois(18, 45, "papier", { g: [0.07, 0.13], pan: [-0.3, 0.3] });
    },
    // le commissariat : le couloir, des voix derrière une cloison, la radio, les claviers, une porte
    commissariat: (A) => {
      A.nappe("couloir", { g: 0.3, lp: 4500, rev: 0.25 });
      A.nappe("hall", { g: 0.08, lp: 800 });
      A.parfois(4, 11, "clavier", { g: [0.1, 0.2], pan: [-0.6, 0.6], rev: 0.2 });
      A.parfois(9, 24, (z) => SYNTH.radio(z));
      A.parfois(25, 65, "porte", { g: [0.1, 0.2], rev: 0.5, pitch: [0.6, 0.75], pan: [-0.7, 0.7] });
    },
    prison: (A) => {
      A.nappe("couloir", { g: 0.22, lp: 2600, rev: 0.8 });
      A.parfois(12, 32, "cles", { g: [0.1, 0.2], rev: 0.8, pan: [-0.7, 0.7], pitch: [0.9, 1.05] });
      A.parfois(16, 45, "porte", { g: [0.14, 0.24], rev: 1, pitch: [0.5, 0.6], lp: 2500, pan: [-0.6, 0.6] });
      A.parfois(8, 22, "talons", { g: [0.08, 0.16], rev: 0.8, pitch: [0.85, 0.95], pan: [-0.8, 0.8] });
    },
    // l'écran titre : le cabinet la nuit, la ville derrière la vitre, l'horloge
    titre: (A) => { A.nappe("nuit", { g: 0.3, lp: 900 }); A.nappe("horloge", { g: 0.06, boucle: true, lp: 5000, pan: 0.35 }); lointaine(A); },
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
    const A = fond(c, { salle: salle[nom] });
    try { AMB[nom](A, o || {}); A.entrer(); SON.amb = A; } catch (e) { SON.amb = null; }
  };

  // la sonnerie dure tant que le téléphone sonne
  let sonne = null;
  SON.sonner = (oui) => {
    if (oui && !sonne) { SON.jouer("dring"); sonne = setInterval(() => SON.jouer("dring"), 3800); }
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
    const eveil = () => { if (SON.pret) return; SON.pret = true; if (ouvrir()) { Object.keys(FX).forEach((n) => { if (FX[n].precharge) { const m = { clic: "ui_clic", onglet: "ui_onglet", note: "ui_note", surligne: "ui_surligne", mail: "ui_mail", alerte: "ui_alerte", erreur: "ui_erreur", bien: "ui_bien", dring: "sonnerie", papier: "papier" }[n]; if (m) SON.charger(m).catch(() => {}); } }); if (SON.voulu) { const vv = SON.voulu; SON.ambNom = null; SON.ambiance(vv.nom, vv.o); } } };
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
