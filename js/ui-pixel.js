/* La Permanence — l'interface en pixel : icônes dessinées sur une grille de 8 × 8, bureau cliquable.
   Les icônes sont affichées à un multiple entier de 8 pixels (16 par défaut), contours nets (crispEdges).
   Le bandeau du cabinet devient une scène : l'ordinateur ouvre la messagerie, le téléphone répond ou ouvre le
   journal d'appels, la pile de dossiers ouvre les dossiers, la bibliothèque, l'horloge (agenda), la fenêtre (carte).
   Le style des cadres, boutons, titres et étiquettes est dans index.html (section « Interface en pixel »). */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html } = UI;

  // ---------------------------------------------------------------- icônes 8 × 8
  const ART = {
    desk: ["..##....", "..#.....", ".###....", "########", ".#....#.", ".#....#.", ".#....#.", "........"],
    inbox: ["........", "########", "##....##", "#.#..#.#", "#..##..#", "#......#", "########", "........"],
    phone: ["..#####.", "..#...#.", "..#...#.", "..#...#.", "..#...#.", "..#####.", "..##.##.", "..#####."],
    cases: ["........", "###.....", "#..####.", "#......#", "#.####.#", "#......#", "########", "........"],
    calendar: [".#...#..", "########", "#......#", "########", "#.#.#.##", "#......#", "#.#.#..#", "########"],
    library: ["........", "#.#.##..", "#.#.##.#", "#.#.##.#", "#.#.##.#", "#.#.##.#", "########", "........"],
    firm: ["...##...", ".######.", "########", ".#.#.#.#", ".#.#.#.#", ".#.#.#.#", "########", "........"],
    journal: [".######.", ".#....#.", ".#.##.#.", ".#....#.", ".#.##.#.", ".#....#.", ".######.", "........"],
    menu: ["........", "########", "........", "########", "........", "########", "........", "........"],
    bolt: ["....##..", "...##...", "..##....", ".#####..", "...##...", "..##....", ".##.....", "........"],
    close: ["#......#", ".#....#.", "..#..#..", "...##...", "...##...", "..#..#..", ".#....#.", "#......#"],
    back: ["....##..", "...##...", "..##....", ".##.....", "..##....", "...##...", "....##..", "........"],
    plus: ["........", "...##...", "...##...", ".######.", ".######.", "...##...", "...##...", "........"],
    flag: ["#####...", "#.####..", "#.###...", "#####...", "#.......", "#.......", "#.......", "........"],
    pen: ["......##", ".....#.#", "....#.#.", "...#.#..", "..#.#...", ".##.....", "###.....", "........"],
    clock: ["..####..", ".#....#.", "#...#..#", "#...#..#", "#....#.#", "#......#", ".#....#.", "..####.."],
    gavel: [".##.....", "####....", ".####...", "..##.#..", ".....#..", "......#.", ".......#", "........"],
    skip: ["#...#...", "##..##..", "###.###.", "########", "###.###.", "##..##..", "#...#...", "........"],
    moon: ["...###..", "..##....", ".##.....", ".##.....", ".##.....", "..##....", "...###..", "........"],
    check: ["........", ".......#", "......##", "#....##.", "##..##..", ".####...", "..##....", "........"],
    warn: ["...##...", "...##...", "..#..#..", "..####..", ".#.##.#.", ".#....#.", "#..##..#", "########"],
    user: ["..###...", ".#####..", ".#####..", "..###...", "........", ".#####..", "#######.", "#######."],
    coin: ["..####..", ".#....#.", "#.####.#", "#.#....#", "#.####.#", "#....#.#", ".#.##.#.", "..####.."],
    scale: ["...#....", "#######.", "#..#..#.", "##.#.##.", "##.#.##.", "...#....", "..###...", ".#####.."],
    map: ["........", "###.###.", "#.###.##", "#.#.#.#.", "#.#.#.#.", "##.###.#", ".###.###", "........"],
    pin: ["..####..", ".#....#.", ".#.##.#.", ".#.##.#.", ".#....#.", "..#..#..", "...##...", "...#...."],
    binder: [".######.", ".#.#...#", ".#.#.###", ".#.#...#", ".#.#.###", ".#.#...#", ".######.", "........"],
    walk: ["...##...", "...##...", "..###...", ".#.##...", "...##.#.", "..#..#..", ".#...#..", "#.....#."],
  };
  // chaque icône devient un chemin SVG : un rectangle par série de pixels sur une ligne
  const PATHS = {};
  for (const [k, rows] of Object.entries(ART)) {
    let d = "";
    rows.forEach((row, y) => { for (let x = 0; x < 8; x++) { if (row[x] !== "#") continue; let w = 1; while (row[x + w] === "#") w++; d += `M${x} ${y}h${w}v1h-${w}z`; x += w - 1; } });
    PATHS[k] = d;
  }
  UI.ICON_ART = ART;
  UI.Icon = ({ n, size = 16 }) => {
    const s = Math.max(8, Math.round(size / 8) * 8);
    return html`<svg className="ico ico-px" width=${s} height=${s} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true"><path d=${PATHS[n] || PATHS.desk} fill="currentColor" /></svg>`;
  };

  // ---------------------------------------------------------------- papier : décisions du greffe, actes de l'avocat
  // Chargé avant ui-desk, ui-scenes, ui-gav et ui-court, qui lisent UI.Paper et UI.Icon au chargement.
  const cx = UI.cx;
  CR.sceauOf = (entete) => /assises/i.test(entete || "") ? ["COUR D'ASSISES", "DE PARIS"] : /appel|instruction/i.test(entete || "") ? ["COUR D'APPEL", "DE PARIS"] : /criminelle/i.test(entete || "") ? ["COUR CRIMINELLE", "DE PARIS"] : ["TRIBUNAL JUDICIAIRE", "DE PARIS"];
  const sceauOf = CR.sceauOf;
  // Les pièces : en-tête et sceau pour les décisions du greffe, cachet de l'avocat sur ses actes
  const renderDoc0 = CR.renderDoc;
  CR.renderDoc = function (s, cs, doc) {
    const r = renderDoc0.apply(this, arguments);
    if (!r || typeof r !== "object") return r;
    return Object.assign({}, r, { _dir: doc.dir, _key: doc.key, _day: doc.day });
  };
  const DECISION = /jugement|ordonnance|arrêt|décision|réquisitoire/i;
  const toque = (s) => { const h = CR.hash((s.player.prenom || "") + (s.player.nom || "")); return "ABCDEGKLPRT"[h % 11] + String(100 + (h >>> 4) % 1900).padStart(4, "0"); };
  const Paper0 = UI.Paper;
  UI.Paper = (props) => {
    const doc = props.doc;
    if (!doc) return html`<${Paper0} ...${props} />`;
    const k = doc.kind || props.kind, s = CR.store && CR.store.s;
    const decision = k === "greffe" && DECISION.test(doc.title || "");
    const acte = doc._key === "_drafted" || (doc._dir === "out" && k !== "note");
    if (!decision && !acte) return html`<${Paper0} ...${props} />`;
    const d2 = Object.assign({}, doc);
    if (decision) { d2.entete = ["République française", "Au nom du peuple français"].concat(doc.entete || []); d2.tampon = sceauOf((doc.entete || []).join(" ") + " " + (doc.title || "")).join("\n") + "\nGREFFE"; }
    if (acte && s && s.player) d2.tampon = `Me ${s.player.prenom} ${(s.player.nom || "").toUpperCase()}\nAvocat au barreau de Paris\nToque ${toque(s)}`;
    return html`<div className=${cx("paper-host", decision && "has-rf", acte && "has-cachet")}><${Paper0} ...${props} doc=${d2} /></div>`;
  };

})();
