/* La Permanence — la bibliothèque en livres (9 novembre 2026).
   Chaque code est un volume relié qu'on prend sur l'étagère et qu'on feuillette : page de titre, avertissement,
   sommaire paginé (plan officiel), corps (intitulés, articles, plan des notes, notes en deux colonnes), index.
   Un second volume, le Bulletin des arrêts, classe la jurisprudence par date. Édition propre au jeu, sur les usages
   communs des codes annotés français ; ce n'est la maquette d'aucun éditeur.
   La mise en pages est calculée une fois par volume, à partir d'une estimation des hauteurs (page logique de
   500 × 720 px) : les numéros de page sont stables d'un écran à l'autre. Un texte non lu est imprimé flou, à la même
   place, et se lit d'un clic (temps de jeu ; un trait discret dans la marge marque ensuite les textes lus). Le mode liste (ui-biblio.js) reste accessible.
   Chargé après ui-biblio.js : UI.LibraryPanel devient l'aiguillage livre / liste. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Btn, Tag, cx } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const bump = () => CR.store.bump();
  const ListPanel = UI.LibraryPanel;
  CR.COACH = CR.COACH || {};
  CR.COACH.bibliotheque = "Les codes sont sur l'étagère, reliés comme ceux du palais : sommaire au début, index à la fin, articles à leur place et, sous chaque article, les arrêts qui l'appliquent, numérotés par thème. Tournez les pages (coin de la page, flèches du clavier, glisser du doigt) ou tapez un numéro dans « Aller à l'art. ». Un texte imprimé flou n'est pas encore lu : le lire prend du temps et l'enregistre dans le dossier ouvert, qui reçoit un marque-page. Le Bulletin des arrêts classe la jurisprudence par date ; le mode liste reste là quand vous êtes pressé.";

  // =================================================================== Page logique et estimation des hauteurs
  // Contenu utile d'une page : 426 × 636 px (voir .lv-page dans index.html). CAP garde une marge de sécurité.
  const L = (CR.LIVRE_METRIQUES = {
    CAP: 622,
    art: { cpl: 70, lh: 19, rub: 16, mb: 12 },
    note: { cpl: 40, lh: 16, mb: 6 },
    plein: { cpl: 80, lh: 16 },
    som: { cpl: 64, lh: 17 },
    ar: { cpl: 74 },
  });
  const lignes = (t, cpl) => String(t || "").split("\n").reduce((n, p) => n + Math.max(1, Math.ceil(p.length / cpl)), 0);

  const ABR = { CP: "C. pén.", CPP: "C. pr. pén.", CR: "C. route", CJPM: "CJPM", CSP: "CSP", CCOM: "C. com.", CGI: "CGI", LPF: "LPF", CSI: "CSI" };
  const COULEURS = { CP: "#1f3478", CPP: "#24503f", CR: "#7a5520", CJPM: "#4d3a78", CSP: "#5a2f4a", CCOM: "#3d4d5c", CGI: "#5c4a2e", LPF: "#5c4a2e", CSI: "#3b3b40", HORS: "#55565c", BULL: "#5f5a52" };
  const numOf = (id) => String(id).slice(String(id).indexOf("_") + 1);
  const preOf = (id) => String(id).split("_")[0];
  const ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  // Une note : mot-clé (dernier terme du titrage), solution, référence, renvois
  CR.noteLivre = function (artId, row) {
    const j = CR.JP[row.jp];
    const mot = j.titrage[j.titrage.length - 1];
    const ref = `${CR.jpCite(row.jp, true)}${j.num ? `, n° ${j.num}` : ""}${j.form ? `, ${j.form}` : ""}`;
    const renvois = j.articles.filter((a) => a !== artId && CR.lib(a)).map((a) => ({ art: a, n: CR.noteNum(a, row.jp) }));
    return { mot, ref, renvois, sommaire: j.sommaire || "" };
  };
  const hauteurNote = (artId, row) => {
    const x = CR.noteLivre(artId, row);
    const t = `${row.n}. ${x.mot}. ${x.sommaire} — ${x.ref}.` + x.renvois.map((r) => ` — V. aussi art. ${numOf(r.art)}, n° ${r.n}.`).join("");
    return lignes(t, L.note.cpl) * L.note.lh + L.note.mb;
  };
  // Deux colonnes équilibrées, une note jamais coupée : la meilleure coupure entre les deux colonnes
  const hauteurColonnes = (hs) => {
    if (!hs.length) return 0;
    const tot = hs.reduce((a, b) => a + b, 0);
    let best = tot, acc = 0;
    for (const h of hs) { acc += h; best = Math.min(best, Math.max(acc, tot - acc)); }
    return best + 10;
  };
  // Texte intégral (lot 9) : le texte officiel, alinéa par alinéa ; la rubrique (intitulé du jeu) n'existe que pour les fiches
  // Un article long coule sur plusieurs pages : il est découpé en morceaux (un alinéa, ou un fragment d'alinéa trop long
  // pour une page, coupé entre deux mots) ; cont : suite du même alinéa, sans alinéa rentré.
  const MORC = {};
  const morceaux = (id) => {
    if (MORC[id]) return MORC[id];
    const max = Math.floor((L.CAP - 60) / L.art.lh) * L.art.cpl;
    const out = [];
    CR.article(id).alineas.forEach((x, i) => {
      let r = x, first = true;
      while (r.length > max) { let cut = r.lastIndexOf(" ", max); if (cut < max * 0.6) cut = max; out.push({ i, t: r.slice(0, cut), cont: !first }); r = r.slice(cut).trimStart(); first = false; }
      out.push({ i, t: r, cont: !first });
    });
    return (MORC[id] = out);
  };
  // hauteur d'un morceau d'article : rubrique et numéro en tête du premier, marge sous le dernier
  const hauteurMorceaux = (id, ps, tete, fin) => (tete && CR.lib(id) ? L.art.rub : 0) + lignes((tete ? `Art. ${numOf(id)} ` : "") + ps.map((p) => p.t).join("\n"), L.art.cpl) * L.art.lh + (fin ? L.art.mb : 0);
  const hauteurArticle = (id) => hauteurMorceaux(id, morceaux(id), true, true);
  const nTous = (n) => (n.nTous != null ? n.nTous : n.nTextes);
  const tousDe = (n) => n.tous || n.arts;
  const niveau = (n) => (/^(Livre|Titre préliminaire|Troisième partie|Première partie)/.test(n.t) || n.code === "HORS" ? 1 : /^(Titre|Sous-titre)/.test(n.t) ? 2 : /^Chapitre/.test(n.t) ? 3 : 4);
  const hauteurTitre = (n) => { const lv = niveau(n); const r = CR.planRange(n); if (lv === 1) return 100 + lignes(n.h, 38) * 22 + (r ? 16 : 0); if (lv === 2) return 40 + lignes(`${n.t} ${n.h}`, 46) * 20 + (r ? 16 : 0); return lv === 3 ? 24 + lignes(`${n.t} ${n.h} ${r}`, 50) * 18 : 16 + lignes(`${n.t} ${n.h} ${r}`, 70) * 17; };

  // =================================================================== Volumes
  // Un volume par grand code ; les codes dont le jeu n'a que quelques articles sont reliés ensemble en « Textes annexes »
  const PROPRES = ["CP", "CPP", "CR", "CJPM"];
  CR.volumes = function () {
    const avec = CR.CODES_PLAN.filter((c) => nTous(c) > 0);
    const v = avec.filter((c) => PROPRES.includes(c.id)).map((c) => ({ id: c.id, nom: c.nom, codes: [c], couleur: COULEURS[c.id] || "#4a4a50" }));
    const ann = avec.filter((c) => !PROPRES.includes(c.id));
    if (ann.length) v.push({ id: "ANNEXES", nom: "Textes annexes", codes: ann, couleur: COULEURS.HORS, annexes: true });
    v.push({ id: "BULL", nom: "Bulletin des arrêts", couleur: COULEURS.BULL, bulletin: true });
    return v;
  };
  CR.volumeDe = (codeId) => (CR.volumes().find((v) => v.codes && v.codes.some((c) => c.id === codeId)) || {}).id || null;
  const CACHE = {};
  // Metteur en pages : une page courante, un compteur de hauteur, des pages neuves à la demande
  function metteur(out) {
    const M = {
      cur: null, u: 0,
      neuve(kind) { M.cur = { n: out.pages.length + 1, kind, blocks: [], arts: [], jps: [], div: M.cur ? M.cur.div : null }; out.pages.push(M.cur); M.u = 0; },
      poser(b, h, kind) { if (!M.cur || (M.u + h > L.CAP && M.cur.blocks.length)) M.neuve(kind || (M.cur && M.cur.kind) || "corps"); M.cur.blocks.push(b); M.u += h; },
      reste: () => L.CAP - M.u,
    };
    return M;
  }
  // Composition d'un volume : { vol, pages: [{ n, kind, blocks, arts, jps, div }], artPage, nodePage, jpPage, notePage }
  CR.composerVolume = function (volId) {
    if (CACHE[volId]) return CACHE[volId];
    const vol = CR.volumes().find((v) => v.id === volId);
    if (!vol) return null;
    const out = { vol, pages: [], artPage: {}, nodePage: {}, jpPage: {}, notePage: {} };
    const M = metteur(out);
    M.neuve("titre"); M.cur.blocks.push({ t: "titre-vol" });
    M.neuve("avert"); M.cur.blocks.push({ t: "avert" });
    if (vol.bulletin) composerBulletin(out, M); else composerCode(out, M);
    CACHE[volId] = out;
    return out;
  };
  CR.viderLivres = () => { for (const k of Object.keys(CACHE)) delete CACHE[k]; };

  function composerCode(out, M) {
    const codes = out.vol.codes;
    const plusieurs = codes.length > 1;
    // Sommaire : les divisions jusqu'aux chapitres (et les sections qui portent des textes) ; pages renseignées après le corps
    const som = [];
    for (const code of codes) {
      const d0 = plusieurs ? 1 : 0;
      if (plusieurs) som.push({ label: code.nom, depth: 0, code: code.id });
      for (const p of code.parties) {
        if (code.parties.length > 1 && p.nom) som.push({ label: p.nom, depth: d0, partie: p.key });
        // texte intégral : le sommaire s'arrête aux chapitres (les sections sont dans le corps) ; sinon, les sections qui portent des fiches
        const w = (arr, d) => arr.forEach((n) => { if (niveau(n) <= 3 || (!code.integral && n.nTextes)) som.push({ label: `${n.t ? n.t + " : " : ""}${n.h}`, depth: d + 1, key: n.key, vide: !nTous(n) }); if (niveau(n) < 3 || (!code.integral && n.nTextes)) w(n.c, d + 1); });
        w(p.noeuds, d0);
      }
    }
    M.neuve("som");
    M.poser({ t: "som-h" }, 40);
    for (const e of som) M.poser({ t: "som", e }, lignes(e.label, L.som.cpl - e.depth * 3) * L.som.lh + 3);
    // Un article, puis ses notes groupées par thème (plan I., II.) en deux colonnes ; un bloc de notes se coupe entre deux notes
    const article = (id) => {
      const rows = CR.notesOf(id).filter((r) => CR.lib(r.jp));
      const h = hauteurArticle(id);
      const h1 = rows.length ? Math.min(24 + hauteurNote(id, rows[0]), 90) : 0;
      const ps = morceaux(id);
      // un article qui tient sur une page n'est jamais coupé ; un plus long commence où il peut (trois lignes au moins)
      if (h + h1 > M.reste() && M.cur.blocks.length && (h <= L.CAP || M.reste() < (CR.lib(id) ? L.art.rub : 0) + 3 * L.art.lh)) M.neuve("corps");
      for (let k = 0; k < ps.length;) {
        const room = M.reste();
        let j = k;
        while (j < ps.length && hauteurMorceaux(id, ps.slice(k, j + 1), k === 0, j + 1 === ps.length) <= room) j++;
        if (j === k) { if (M.cur.blocks.length) { M.neuve("corps"); continue; } j = k + 1; }
        M.poser({ t: "art", id, de: k, a: j, suite: k > 0 }, hauteurMorceaux(id, ps.slice(k, j), k === 0, j === ps.length));
        if (k === 0) out.artPage[id] = M.cur.n;
        if (!M.cur.arts.includes(id)) M.cur.arts.push(id);
        k = j;
        if (k < ps.length) M.neuve("corps");
      }
      let th = null, bloc = null, hs = [], base = 0;
      for (const r of rows) {
        const hn = hauteurNote(id, r);
        if (r.theme !== th) {
          th = r.theme; bloc = null;
          if (24 + hn > M.reste()) M.neuve("corps");
          M.poser({ t: "plan", roman: ROM[r.ti] || r.ti + 1, theme: th }, 24);
        }
        if (!bloc) { bloc = { t: "notes", art: id, items: [] }; hs = []; base = M.u; M.cur.blocks.push(bloc); }
        if (base + hauteurColonnes(hs.concat(hn)) > L.CAP && bloc.items.length) {
          M.neuve("corps"); bloc = { t: "notes", art: id, items: [], suite: true }; hs = []; base = 0; M.cur.blocks.push(bloc);
        }
        bloc.items.push(r); hs.push(hn);
        M.u = base + hauteurColonnes(hs);
        out.notePage[id + "|" + r.jp] = M.cur.n;
        if (!out.jpPage[r.jp]) out.jpPage[r.jp] = M.cur.n;
        M.cur.jps.push(r.jp);
      }
    };
    for (const code of codes) for (const [ip, p] of code.parties.entries()) {
      if (!nTous(p)) continue;
      M.neuve("corps");
      if (plusieurs && ip === 0) { out.nodePage[code.id] = M.cur.n; M.cur.div = code.nom; M.poser({ t: "partie", nom: code.nom }, 60); }
      if (code.parties.length > 1 && p.nom) { out.nodePage[p.key] = M.cur.n; M.poser({ t: "partie", nom: p.nom, sous: plusieurs }, 60); }
      for (const id of tousDe(p)) article(id);
      const w = (arr) => arr.forEach((n) => {
        if (!nTous(n)) return;
        const lv = niveau(n);
        // une grande division (livre) commence sur une page neuve, sauf si la page ne porte encore que l'intitulé de la partie
        if (lv === 1 && M.cur.blocks.length && !M.cur.blocks.every((b) => b.t === "partie")) M.neuve("corps");
        const h = hauteurTitre(n);
        if (h + 70 > M.reste() && M.cur.blocks.length) M.neuve("corps");
        if (lv <= 2) M.cur.div = n.h;
        M.poser({ t: "h", lv, node: n.key }, h);
        out.nodePage[n.key] = M.cur.n;
        for (const id of tousDe(n)) article(id);
        w(n.c);
      });
      w(p.noeuds);
    }
    // Index alphabétique
    const ids = new Set(Object.keys(out.artPage));
    const idx = CR.indexAnalytique().map((x) => ({ mot: x.mot, lettre: x.lettre, refs: x.refs.map((r) => r.cible).filter((c) => ids.has(c.art)) })).filter((x) => x.refs.length);
    M.neuve("index");
    M.cur.div = null;
    M.poser({ t: "idx-h" }, 40);
    let lettre = null;
    for (const x of idx) {
      if (x.lettre !== lettre) { lettre = x.lettre; if (26 + 32 > M.reste()) M.neuve("index"); M.poser({ t: "idx-l", lettre }, 26); }
      const t = x.mot + " " + x.refs.map((r) => `art. ${numOf(r.art)}${r.note ? ", n° " + r.note : ""}`).join(" ; ");
      M.poser({ t: "idx", x }, lignes(t, L.plein.cpl) * L.plein.lh + 3);
    }
    for (const e of som) e.page = out.nodePage[e.key || e.partie || e.code] || null;
  }

  function composerBulletin(out, M) {
    const arrets = Object.values(CR.JP).filter((j) => CR.lib(j.id)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    M.neuve("corps");
    M.cur.div = "Jurisprudence";
    let annee = null;
    for (const j of arrets) {
      const y = j.date.slice(0, 4);
      const h = 2 * 17 + lignes(j.titrage.join(" — "), L.plein.cpl) * 15 + lignes(j.sommaire, L.ar.cpl) * 18 + (j.portee ? lignes("Portée. " + j.portee, L.plein.cpl) * 16 : 0) + 18 + 22;
      if (y !== annee) { annee = y; if (34 + h > M.reste()) M.neuve("corps"); M.poser({ t: "annee", y }, 34); }
      if (h > M.reste() && M.cur.blocks.length) M.neuve("corps");
      M.poser({ t: "arret", jp: j.id }, h);
      out.jpPage[j.id] = M.cur.n; M.cur.jps.push(j.id);
    }
    M.neuve("index");
    M.poser({ t: "tbl-h" }, 40);
    for (const j of arrets.slice().sort((a, b) => String(a.num || "~").localeCompare(String(b.num || "~")))) M.poser({ t: "tbl", jp: j.id }, 19);
  }

  // =================================================================== Interface
  const PAGE_W = 500, PAGE_H = 720;
  const largeur = () => (typeof window !== "undefined" ? window.innerWidth || 1200 : 1200);

  function Etagere({ s, ouvrir, setMode }) {
    const vols = CR.volumes();
    return html`<div className="lv-etagere">
      <div className="lv-planche">${vols.map((v) => html`<button key=${v.id} type="button" className="lv-volume" style=${{ "--cuir": v.couleur }} onClick=${() => ouvrir(v.id)} aria-label=${"Ouvrir " + v.nom}>
        <span className="lv-v-nom">${v.nom}</span>
        <span className="lv-v-ed">${v.bulletin ? "Jurisprudence" : "Annoté"} · Édition 2027</span>
        <span className="lv-v-maison">Éditions de la Permanence</span>
      </button>`)}</div>
      <div className="lv-etagere-pied">
        <${Btn} small onClick=${() => setMode("liste")}>Mode liste (recherche rapide, fiches du jeu)</${Btn}>
      </div>
    </div>`;
  }

  // Texte non lu : imprimé flou, à sa place ; un clic le lit
  function Flou({ lu, children, onLire, temps, label }) {
    if (lu) return children;
    return html`<span className="lv-flou-wrap"><span className="lv-flou" aria-hidden="true">${children}</span><button type="button" className="lv-lire" onClick=${onLire}>${label || "Lire"} · ${CR.fmtDuration(temps)}</button></span>`;
  }

  function Page({ p, side, ctx }) {
    const { s, vol, here, read, goPage, goArt, annoter, hl, livre } = ctx;
    if (!p) return html`<div className=${cx("lv-page", "lv-garde", side)}></div>`;
    // Article du titre courant : le premier (page de gauche) ou le dernier (page de droite) dont le texte ou les notes figurent sur la page
    const artsVus = p.blocks.map((b) => (b.t === "art" ? b.id : b.t === "notes" ? b.art : null)).filter(Boolean);
    const firstArt = artsVus[0], lastArt = artsVus[artsVus.length - 1];
    const headArt = side === "gauche" ? firstArt : lastArt;
    const headLbl = p.kind === "som" ? "Sommaire" : p.kind === "index" ? (vol.bulletin ? "Table des arrêts" : "Index alphabétique") : p.kind === "corps" ? (vol.bulletin ? "Jurisprudence" : p.div || vol.nom) : "";
    const pinned = here ? new Set(here.cards) : new Set();
    const rubans = p.arts.filter((a) => pinned.has(a)).map((a) => ({ id: a, k: "art" })).concat([...new Set(p.jps)].filter((j) => pinned.has(j)).map((j) => ({ id: j, k: "jp" }))).slice(0, 4);
    const tete = p.kind === "titre" ? null : side === "gauche"
      ? html`<div className="lv-head"><span className="lv-folio">${p.n}</span>${headArt ? html`<span className="lv-head-art">Art. ${numOf(headArt)}</span>` : null}<span className="lv-head-r">${vol.bulletin ? "Bulletin des arrêts" : vol.annexes ? (CR.planOf(headArt || "") || {}).code ? CR.planOf(headArt).code.nom : vol.nom : vol.nom}</span></div>`
      : html`<div className="lv-head"><span className="lv-head-l">${headLbl}</span>${headArt ? html`<span className="lv-head-art">Art. ${numOf(headArt)}</span>` : null}<span className="lv-folio">${p.n}</span></div>`;
    return html`<div className=${cx("lv-page", side, "lv-k-" + p.kind)} lang="fr" data-page=${p.n}>
      ${rubans.map((r, i) => html`<button key=${r.id} type="button" className=${cx("lv-ruban", "lv-ruban-" + r.k)} style=${{ top: 70 + i * 54 + "px" }} title=${(r.k === "jp" ? CR.jpCite(r.id) : CR.article(r.id).cite) + " — enregistré dans le dossier"} onClick=${() => (r.k === "art" ? goArt(r.id) : null)}></button>`)}
      ${tete}
      <div className="lv-body">${p.blocks.map((b, i) => html`<${Bloc} key=${i} b=${b} ctx=${ctx} p=${p} />`)}</div>
    </div>`;
  }

  function Bloc({ b, ctx, p }) {
    const { s, vol, read, goPage, goArt, annoter, hl, livre, here } = ctx;
    const lu = (id) => s.researched.includes(id);
    switch (b.t) {
      case "titre-vol": return html`<div className="lv-titre-vol">
        <div className="lv-tv-maison">Éditions de la Permanence</div>
        <div className="lv-tv-nom">${vol.nom.toUpperCase()}</div>
        <div className="lv-tv-sous">${vol.bulletin ? "Arrêts annotés dans la bibliothèque du jeu" : "annoté"}</div>
        <div className="lv-tv-filet"></div>
        <div className="lv-tv-ed">Édition 2027</div>
        <div className="lv-tv-ajour">${(() => { const I = !vol.bulletin && vol.codes.length === 1 && CR.integralDe(vol.codes[0].id); return I ? `Texte en vigueur au ${CR.dateCode(I.maj)}` : "Texte à jour au 9 novembre 2026"; })()}</div>
      </div>`;
      case "avert": return html`<div className="lv-avert">
        <h4>Avertissement</h4>
        ${vol.bulletin ? html`<p>Les arrêts sont classés par date. Chacun renvoie aux articles sous lesquels il est annoté dans les codes. La mention de publication (F-B, FS-B, P+B+R+I) n'est donnée que lorsqu'elle a été vérifiée.</p>` : html`<p>${CR.PLAN_SOURCE}</p><p>${vol.codes.some((c) => c.integral) ? "Le volume reproduit tous les articles en vigueur, dans l'ordre et sous les intitulés officiels du code. Les articles qui servent dans les affaires du jeu portent en tête une rubrique en italique, imprimée flou tant qu'ils n'ont pas été lus. " : "Les articles reproduisent le texte en vigueur tel qu'il a été relevé hors ligne. "}À revérifier sur Légifrance avant tout usage réel. Les notes de jurisprudence sont rédigées pour le jeu ; chaque arrêt indique dans le Bulletin la source et la date de sa vérification.</p>`}
        <p><b>Abréviations.</b> Ass. plén. : assemblée plénière de la Cour de cassation. — Crim. : chambre criminelle. — Cons. const. : Conseil constitutionnel. — F-B, FS-B : arrêt publié au Bulletin (formation restreinte, de section). — V. : voir. — Rappr. : rapprocher. — n° : numéro de note sous l'article.</p>
        <p><b>Lecture.</b> Un texte imprimé flou n'a pas encore été lu : un clic le lit, ce qui prend du temps, et l'enregistre dans le dossier ouvert. Les marque-pages sur la tranche signalent les textes enregistrés dans ce dossier.</p>
      </div>`;
      case "som-h": return html`<h3 className="lv-som-h">Sommaire</h3>`;
      case "som": return html`<div className=${cx("lv-som", b.e.vide && "lv-som-vide")} style=${{ paddingLeft: b.e.depth * 12 + "px" }}>${b.e.page ? html`<button type="button" className="lv-som-l" onClick=${() => goPage(b.e.page)}><span>${b.e.label}</span><span className="lv-dots"></span><span className="lv-som-p">${b.e.page}</span></button>` : html`<span className="lv-som-l"><span>${b.e.label}</span><span className="lv-dots"></span><span className="lv-som-p">—</span></span>`}</div>`;
      case "partie": return html`<div className=${cx("lv-partie", b.sous && "lv-partie-sous")}>${b.nom}</div>`;
      case "h": {
        const n = CR.planNode(b.node);
        const r = CR.planRange(n);
        return html`<div className=${"lv-h lv-h" + b.lv}>${n.t ? html`<span className="lv-h-t">${n.t}</span> ` : null}<span className="lv-h-h">${b.lv <= 3 ? n.h.toUpperCase() : n.h}</span>${r && b.lv <= 3 ? html`<span className="lv-h-r">(${r})</span>` : null}</div>`;
      }
      case "art": {
        const a = CR.article(b.id);
        const e = a.lib;
        const suite = !!b.suite;
        const posts = suite ? [] : ((s.annots || {})[b.id] || []);
        // le texte : alinéa par alinéa ; le premier suit le numéro de l'article ; un article long continue sur la page suivante
        const ps = morceaux(b.id).slice(b.de || 0, b.a == null ? undefined : b.a);
        const corps = ps.map((x, i) => html`<span key=${i} className=${i === 0 && !suite ? "lv-al0" : x.cont ? "lv-alc" : "lv-al"}>${x.t}</span>`);
        const crayon = html`<button type="button" className="lv-crayon" title="Annoter au crayon" aria-label="Annoter l'article" onClick=${() => annoter(b.id)}>✎</button>`;
        return html`<div className=${cx("lv-art", e && lu(b.id) && "lv-lu", !e && "lv-integ", hl === b.id && "lv-hl", suite && "lv-suite")} id=${suite ? undefined : "lv-" + b.id}>
          ${e && !suite ? html`<div className="lv-rub">${e.titre}${crayon}</div>` : null}
          <div className="lv-art-t">${suite ? null : html`<b className="lv-art-n">Art. ${numOf(b.id)}</b>`}${e || suite ? null : crayon}${suite ? null : " "}${!e ? corps : lu(b.id) ? html`<span className="lv-stabilo">${corps}</span>` : html`<${Flou} lu=${false} onLire=${() => read(e)} temps=${e.temps} label="Lire et extraire">${corps}</${Flou}>`}</div>
          ${posts.map((x, i) => html`<div key=${i} className="lv-postit" style=${{ transform: `rotate(${i % 2 ? 2 : -2.5}deg)` }} title=${x.c ? "Dossier " + x.c : ""}>${x.t}</div>`)}
        </div>`;
      }
      case "plan": return html`<div className="lv-plan">${b.roman}. ${b.theme.toUpperCase()}</div>`;
      case "notes": return html`<div className="lv-cols">${b.items.map((r) => {
        const x = CR.noteLivre(b.art, r);
        const j = CR.JP[r.jp];
        const l = CR.lib(r.jp);
        return html`<p key=${r.jp} className=${cx("lv-note", lu(r.jp) && "lv-lu", hl === r.jp && "lv-hl")} id=${"lv-n-" + b.art + "-" + r.jp}>
          <b><i>${r.n}. ${x.mot}.</i></b> ${lu(r.jp) ? html`<span className="lv-stabilo">${x.sommaire}</span>` : html`<${Flou} lu=${false} onLire=${() => read(l)} temps=${l.temps}>${x.sommaire}</${Flou}>`} — ${x.ref}.${x.renvois.map((v) => html` — <i>V. aussi</i> <button type="button" className="lv-renvoi" onClick=${() => goArt(v.art, r.jp)}>${preOf(v.art) !== preOf(b.art) ? ABR[preOf(v.art)] + ", " : ""}art. ${numOf(v.art)}, n° ${v.n}</button>.`)}
          ${CR.jpDepasseConnu(s, r.jp) && lu(r.jp) ? html`<span className="lv-crayonne">revirement → ${j.depasse.par ? CR.jpCite(j.depasse.par, true) : j.depasse.loi}</span>` : null}
        </p>`;
      })}</div>`;
      case "idx-h": return html`<h3 className="lv-som-h">${vol.bulletin ? "Table des arrêts" : "Index alphabétique"}</h3>`;
      case "idx-l": return html`<div className="lv-idx-l">${b.lettre}</div>`;
      case "idx": return html`<div className="lv-idx"><b>${b.x.mot}</b> ${b.x.refs.map((r, i) => html`${i ? " ; " : ""}<button type="button" className="lv-renvoi" onClick=${() => goArt(r.art, r.jp)}>art. ${numOf(r.art)}${r.note ? `, n° ${r.note}` : ""}</button>`)}</div>`;
      case "annee": return html`<div className="lv-h lv-h2"><span className="lv-h-h">${b.y}</span></div>`;
      case "arret": {
        const j = CR.JP[b.jp], l = CR.lib(b.jp);
        const ou = j.articles.filter((a) => CR.lib(a));
        return html`<div className=${cx("lv-arret", lu(b.jp) && "lv-lu", hl === b.jp && "lv-hl")} id=${"lv-" + b.jp}>
          <div className="lv-ar-h"><b>${CR.jpCite(b.jp)}</b>${j.form ? `, ${j.form}` : ""}${j.solution ? html` — <i>${j.solution}</i>` : ""}</div>
          <div className="lv-ar-tit">${j.titrage.join(" — ")}</div>
          <p className="lv-ar-som">${lu(b.jp) ? html`<span className="lv-stabilo">${j.sommaire}</span>` : html`<${Flou} lu=${false} onLire=${() => read(l)} temps=${l.temps} label="Lire l'arrêt">${j.sommaire}</${Flou}>`}</p>
          ${j.portee ? html`<p className="lv-ar-port"><i>Portée.</i> ${j.portee}</p>` : null}
          ${CR.jpDepasseConnu(s, b.jp) && lu(b.jp) ? html`<span className="lv-crayonne">revirement → ${j.depasse.par ? CR.jpCite(j.depasse.par, true) : j.depasse.loi}</span>` : null}
          <p className="lv-ar-sous">Annoté sous ${ou.map((a, i) => html`${i ? ", " : ""}<button type="button" className="lv-renvoi" onClick=${() => goArt(a, b.jp)}>${ABR[preOf(a)] || ""} art. ${numOf(a)}${CR.noteNum(a, b.jp) ? `, n° ${CR.noteNum(a, b.jp)}` : ""}</button>`)}. <span className="lv-verif">${CR.VERIF_LABEL[j.verif.niveau]} le ${j.verif.le}.</span></p>
        </div>`;
      }
      case "tbl-h": return html`<h3 className="lv-som-h">Table des arrêts par numéro</h3>`;
      case "tbl": { const j = CR.JP[b.jp]; const pg = livre.jpPage[b.jp]; return html`<div className="lv-som"><button type="button" className="lv-som-l" onClick=${() => goPage(pg, b.jp)}><span>${j.num ? "n° " + j.num : "(n° à vérifier)"} — ${CR.jpCite(b.jp, true)}</span><span className="lv-dots"></span><span className="lv-som-p">${pg}</span></button></div>`; }
      default: return null;
    }
  }

  const ongletPartie = (nom) => (/Arrêtés/i.test(nom) ? "Arrêtés" : /Décrets simples/i.test(nom) ? "P. régl. (D)" : /réglementaire/i.test(nom) ? "P. régl." : /législative/i.test(nom) ? "P. lég." : nom.replace("Partie ", "P. "));
  // Recherche dans un volume : numéro, rubrique des fiches (leur texte une fois lu) et texte des autres articles.
  // Le texte d'une fiche non lue reste hors recherche : la trouver par ses mots dirait où chercher sans la lire.
  const plat = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function chercher(livre, qf, s) {
    if (!livre.plat) livre.plat = {};
    const q = plat(qf);
    const out = [];
    for (const a of Object.keys(livre.artPage)) {
      if (livre.plat[a] == null) { const x = CR.article(a); livre.plat[a] = plat(`art. ${numOf(a)} ${x.lib ? x.lib.titre : x.alineas.join(" ")}`); }
      const x = CR.lib(a);
      if (livre.plat[a].includes(q) || (x && s.researched.includes(a) && plat(CR.article(a).alineas.join(" ")).includes(q))) out.push(a);
      if (out.length >= 12) break;
    }
    return out;
  }
  const extrait = (t, qf) => { const i = plat(t).indexOf(plat(qf)); if (i < 0) return t.slice(0, 70) + (t.length > 70 ? "…" : ""); const d = Math.max(0, i - 30); return (d ? "…" : "") + t.slice(d, i + qf.length + 40) + "…"; };

  // Tourner : une feuille animée au-dessus des pages, puis on fixe la nouvelle page
  function Livre({ s, volId, here, read, fermer, setMode, focusArt, focusPage }) {
    const livre = useMemo(() => CR.composerVolume(volId), [volId]);
    const vol = livre.vol;
    const [w, setW] = useState(largeur());
    const double = w >= 980;
    const startPage = focusPage || (focusArt && livre.artPage[focusArt]) || 1;
    const [page, setPage] = useState(startPage);
    const [anim, setAnim] = useState(null);
    const [hl, setHl] = useState(focusArt || null);
    const [aller, setAller] = useState("");
    const [msg, setMsg] = useState(null);
    const [q, setQ] = useState("");
    const [annot, setAnnot] = useState(null);
    const zoneRef = useRef(null);
    const [zw, setZw] = useState(0);
    useEffect(() => {
      const on = () => { setW(largeur()); if (zoneRef.current) setZw(zoneRef.current.clientWidth); };
      on();
      window.addEventListener("resize", on);
      return () => window.removeEventListener("resize", on);
    }, []);
    const total = livre.pages.length;
    const spread = (n) => (double ? (n % 2 === 0 ? [n, n + 1] : [n - 1, n]) : [n]);
    const cur = spread(page);
    const reduit = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tourner = (to, dir, el) => {
      if (anim || to < 1 || to > total) return;
      setHl(el || null);
      if (reduit || Math.abs(spread(to)[0] - cur[0]) > (double ? 2 : 1)) { setPage(to); return; }
      setAnim({ dir, from: page, to, go: false });
    };
    useEffect(() => {
      if (!anim || anim.go) return undefined;
      const t1 = setTimeout(() => setAnim((a) => (a ? Object.assign({}, a, { go: true }) : a)), 20);
      const t2 = setTimeout(() => { setPage(anim.to); setAnim(null); }, 560);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [anim && anim.to, anim && anim.dir]);
    const suivante = () => tourner(double ? cur[cur.length - 1] + 1 : page + 1, 1);
    const precedente = () => tourner(double ? cur[0] - 1 : page - 1, -1);
    const goPage = (n, el) => { if (!n) return; setMsg(null); if (spread(n)[0] === cur[0]) { setHl(el || null); return; } tourner(n, n > page ? 1 : -1, el); };
    const goArt = (id, jp) => {
      if (livre.artPage[id]) { const n = (jp && livre.notePage[id + "|" + jp]) || livre.artPage[id]; goPage(n, jp || id); return; }
      // l'article est dans un autre volume : on change de livre
      const autre = CR.volumes().find((v) => !v.bulletin && CR.composerVolume(v.id).artPage[id]);
      if (autre) fermer(autre.id, id, jp);
    };
    useEffect(() => {
      const on = (e) => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === "ArrowRight") suivante(); if (e.key === "ArrowLeft") precedente(); };
      window.addEventListener("keydown", on);
      return () => window.removeEventListener("keydown", on);
    });
    useEffect(() => { if (hl && !anim) { const el = document.getElementById("lv-" + hl) || document.querySelector(`[id$="-${hl}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" }); } }, [hl, page, anim]);
    const touch = useRef(null);
    const allerA = () => {
      const t = aller.trim().replace(/^art(icle)?\.?\s*/i, "").replace(/\s+/g, "");
      if (!t) return;
      const ids = Object.keys(livre.artPage);
      const id = ids.find((k) => numOf(k).toLowerCase() === t.toLowerCase()) || ids.find((k) => numOf(k).toLowerCase().replace(/^[lr]/, "") === t.toLowerCase());
      if (id) { setAller(""); goArt(id); return; }
      const autre = CR.LIB.find((e) => !CR.estJP(e.id) && numOf(e.id).toLowerCase() === t.toLowerCase());
      if (autre) { setAller(""); goArt(autre.id); return; }
      if (!vol.bulletin && vol.codes.some((c) => c.integral)) { setMsg(`L'article ${t} n'est pas en vigueur dans ce code, ou ce numéro n'existe pas.`); return; }
      setMsg(`L'article ${t} n'est pas dans la bibliothèque du jeu.`);
    };
    const qf = q.trim().toLowerCase();
    const resultats = qf.length >= 2 ? (vol.bulletin
      ? Object.keys(livre.jpPage).filter((j) => `${CR.jpCite(j)} ${CR.JP[j].titre} ${CR.JP[j].titrage.join(" ")}`.toLowerCase().includes(qf)).map((j) => ({ id: j, label: CR.jpCite(j), sous: CR.JP[j].titre, page: livre.jpPage[j] }))
      : chercher(livre, qf, s).map((a) => { const x = CR.article(a); return { id: a, label: "Art. " + numOf(a), sous: x.lib ? x.lib.titre : extrait(x.alineas.join(" "), qf), page: livre.artPage[a] }; })).slice(0, 12) : null;
    const pinned = here ? here.cards.filter((id) => livre.artPage[id] || livre.jpPage[id]) : [];
    const annoter = (id) => setAnnot({ id, t: "" });
    const sauverAnnot = () => {
      if (!annot || !annot.t.trim()) { setAnnot(null); return; }
      s.annots = s.annots || {};
      (s.annots[annot.id] = s.annots[annot.id] || []).push({ t: annot.t.trim().slice(0, 140), c: here ? CR.caseTitle(s, here) : null, day: s.day });
      setAnnot(null); bump();
    };
    // Onglets de la tranche : sommaire, grandes divisions, index
    const onglets = vol.bulletin ? [{ l: "Avertissement", p: 2 }, { l: "Arrêts", p: 3 }] : [{ l: "Sommaire", p: 3 }];
    if (vol.annexes) for (const c of vol.codes) onglets.push({ l: ABR[c.id] || c.nom.replace("Textes hors codes", "Hors codes"), p: livre.nodePage[c.id] });
    else if (!vol.bulletin) for (const p of vol.codes[0].parties) { if (vol.codes[0].parties.length > 1 && nTous(p) && livre.nodePage[p.key]) onglets.push({ l: ongletPartie(p.nom), p: livre.nodePage[p.key] }); if (!vol.codes[0].integral || p === vol.codes[0].parties[0]) for (const n of p.noeuds) if (nTous(n) && livre.nodePage[n.key]) onglets.push({ l: (n.t || n.h).replace("Titre préliminaire", "Tit. prél."), p: livre.nodePage[n.key] }); }
    onglets.push({ l: vol.bulletin ? "Table" : "Index", p: livre.pages.find((x) => x.kind === "index").n });
    const ctx = { s, vol, here, read, goPage, goArt, annoter, hl, livre };
    const P = (n, side) => html`<${Page} p=${livre.pages[n - 1]} side=${side} ctx=${ctx} />`;
    // Zoom : la page logique (500 × 720) suit la largeur disponible
    const besoin = double ? 2 * PAGE_W + 8 : PAGE_W;
    const [loupe, setLoupe] = useState(false);
    const zoomAjuste = zw ? Math.min(1.25, (zw - 4) / besoin) : 1;
    const zoom = loupe ? Math.max(zoomAjuste, 0.92) : zoomAjuste;
    let scene;
    if (!anim) {
      scene = double ? html`<div className="lv-spread">${P(cur[0], "gauche")}${P(cur[1], "droite")}</div>` : html`<div className="lv-spread lv-seule">${P(cur[0], cur[0] % 2 ? "droite" : "gauche")}</div>`;
    } else {
      const to = spread(anim.to);
      if (double && anim.dir > 0) scene = html`<div className="lv-spread">${P(cur[0], "gauche")}${P(to[1], "droite")}<div className=${cx("lv-feuille lv-f-droite", anim.go && "lv-go")}><div className="lv-face">${P(cur[1], "droite")}</div><div className="lv-dos">${P(to[0], "gauche")}</div></div></div>`;
      else if (double) scene = html`<div className="lv-spread">${P(to[0], "gauche")}${P(cur[1], "droite")}<div className=${cx("lv-feuille lv-f-gauche", anim.go && "lv-go")}><div className="lv-face">${P(cur[0], "gauche")}</div><div className="lv-dos">${P(to[1], "droite")}</div></div></div>`;
      else if (anim.dir > 0) scene = html`<div className="lv-spread lv-seule">${P(to[0], to[0] % 2 ? "droite" : "gauche")}<div className=${cx("lv-feuille lv-f-seule", anim.go && "lv-go")}><div className="lv-face">${P(cur[0], cur[0] % 2 ? "droite" : "gauche")}</div></div></div>`;
      else scene = html`<div className="lv-spread lv-seule">${P(cur[0], cur[0] % 2 ? "droite" : "gauche")}<div className=${cx("lv-feuille lv-f-seule lv-revient", anim.go && "lv-go")}><div className="lv-face">${P(to[0], to[0] % 2 ? "droite" : "gauche")}</div></div></div>`;
    }
    return html`<div className="lv-livre" style=${{ "--cuir": vol.couleur }}>
      <div className="lv-barre">
        <${Btn} small icon="back" onClick=${() => fermer(null)}>Étagère</${Btn}>
        <strong className="lv-barre-t">${vol.nom}</strong>
        <form className="lv-aller" onSubmit=${(e) => { e.preventDefault(); allerA(); }}>
          <input type="text" aria-label="Aller à l'article" placeholder="Aller à l'art. 63-1" value=${aller} onChange=${(e) => { setAller(e.target.value); setMsg(null); }} />
        </form>
        <input type="search" className="lv-cherche" aria-label="Chercher dans le volume" placeholder="Chercher dans le volume" value=${q} onChange=${(e) => setQ(e.target.value)} />
        ${pinned.length > 0 && html`<select aria-label="Marque-pages" value="" onChange=${(e) => { const id = e.target.value; if (!id) return; if (CR.estJP(id)) goPage(livre.jpPage[id], id); else goArt(id); }}><option value="">Marque-pages (${pinned.length})</option>${pinned.map((id) => html`<option key=${id} value=${id}>${CR.estJP(id) ? CR.jpCite(id, true) : CR.article(id).cite} — p. ${livre.artPage[id] || livre.jpPage[id]}</option>`)}</select>`}
        ${zoomAjuste < 0.85 && html`<button type="button" className="link small" aria-pressed=${loupe} onClick=${() => setLoupe(!loupe)}>${loupe ? "Page entière" : "Loupe"}</button>`}
        <button type="button" className="link small" onClick=${() => setMode("liste")}>Mode liste</button>
      </div>
      ${msg && html`<p className="small warn-txt">${msg}</p>`}
      ${resultats && html`<ul className="lv-resultats">${resultats.length === 0 ? html`<li className="small muted">Rien dans ce volume.</li>` : resultats.map((r) => html`<li key=${r.id}><button type="button" className="lv-res" onClick=${() => { setQ(""); CR.estJP(r.id) ? goPage(r.page, r.id) : goArt(r.id); }}><strong>${r.label}</strong> ${r.sous}<span className="lv-res-p">p. ${r.page}</span></button></li>`)}</ul>`}
      ${annot && html`<div className="lv-annot"><label className="small">Annotation au crayon sous ${CR.article(annot.id).cite}${here ? ` (dossier ${CR.caseTitle(s, here)})` : ""}</label><div className="lv-annot-row"><input type="text" maxLength=${140} value=${annot.t} onChange=${(e) => setAnnot({ id: annot.id, t: e.target.value })} onKeyDown=${(e) => { if (e.key === "Enter") sauverAnnot(); }} placeholder="à soulever in limine" /><${Btn} small kind="primary" onClick=${sauverAnnot}>Écrire</${Btn}><${Btn} small kind="ghost" onClick=${() => setAnnot(null)}>Annuler</${Btn}></div></div>`}
      <div className=${cx("lv-zone", loupe && "lv-loupe")} ref=${zoneRef} onTouchStart=${(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd=${(e) => { if (touch.current == null || loupe) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (dx < -45) suivante(); else if (dx > 45) precedente(); }}>
        <div className="lv-zoom" style=${{ zoom }}>
          ${scene}
          <button type="button" className="lv-coin lv-coin-g" aria-label="Page précédente" onClick=${precedente}></button>
          <button type="button" className="lv-coin lv-coin-d" aria-label="Page suivante" onClick=${suivante}></button>
        </div>
      </div>
      <div className="lv-tranche">${onglets.map((o) => html`<button key=${o.l + o.p} type="button" className=${cx("lv-onglet", o.p <= cur[cur.length - 1] && (onglets.find((x) => x.p > cur[cur.length - 1]) || {}).p !== o.p && onglets.filter((x) => x.p <= cur[cur.length - 1]).pop() === o && "on")} onClick=${() => goPage(o.p)}>${o.l}</button>`)}</div>
      <div className="lv-nav">
        <${Btn} small onClick=${precedente} disabled=${cur[0] <= 1}>‹ ${Math.max(1, cur[0] - 1)}</${Btn}>
        <span className="small muted">${cur.filter((n) => n <= total).join("–")} / ${total}</span>
        <${Btn} small onClick=${suivante} disabled=${cur[cur.length - 1] >= total}>${Math.min(total, cur[cur.length - 1] + 1)} ›</${Btn}>
      </div>
    </div>`;
  }

  UI.LivrePage = Page; // pour les outils de mesure (dev/tools/livremesure.js)

  UI.LivrePanel = ({ s, go, caseId, focus, setMode }) => {
    const here = caseId && s.cases[caseId] ? s.cases[caseId] : null;
    const init = (() => {
      const n = focus && CR.planNode(focus);
      if (!n) return { vol: null };
      const vid = CR.volumeDe(n.code);
      const v = vid && CR.composerVolume(vid);
      return v ? { vol: vid, page: v.nodePage[n.key] || 3 } : { vol: null };
    })();
    const [vol, setVol] = useState(init.vol);
    const [cible, setCible] = useState({ page: init.page, art: null, n: 0 });
    const read = (e) => {
      CR.spend(s, e.temps, "research");
      if (!s.researched.includes(e.id)) s.researched.push(e.id);
      if (here) CR.pinText(s, here, e.id);
      bump();
    };
    const ouvrir = (id, art, jp) => { setVol(id); setCible({ page: null, art: art || null, jp: jp || null, n: cible.n + 1 }); };
    return html`<div className="panel library lv">
      <${UI.Coach} k="bibliotheque" s=${s} />
      ${here && html`<p className="small muted">Dossier ouvert : ${CR.caseTitle(s, here)}. Ce que vous lisez s'y enregistre.</p>`}
      ${vol ? html`<${Livre} key=${vol + ":" + cible.n} s=${s} volId=${vol} here=${here} read=${read} setMode=${setMode} focusPage=${cible.page} focusArt=${cible.art} fermer=${(autre, art, jp) => (autre ? ouvrir(autre, art, jp) : setVol(null))} />` : html`<${Etagere} s=${s} ouvrir=${ouvrir} setMode=${setMode} />`}
    </div>`;
  };

  // Aiguillage : le livre par défaut, la liste (ui-biblio.js) en mode rapide
  UI.LibraryPanel = (props) => {
    const s = props.s;
    const mode = (s.settings && s.settings.bibliMode) || "livre";
    const setMode = (m) => { s.settings = s.settings || {}; s.settings.bibliMode = m; bump(); };
    if (mode === "liste") return html`<div><div className="lv-mode"><button type="button" className="link small" onClick=${() => setMode("livre")}>← Revenir aux codes reliés</button></div><${ListPanel} ...${props} /></div>`;
    return html`<${UI.LivrePanel} ...${props} setMode=${setMode} />`;
  };
})();
