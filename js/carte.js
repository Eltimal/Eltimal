/* La Permanence — la carte de Paris en pixel art animé.
   Projection géographique réelle à 22 pixels par kilomètre : périphérique, Seine et îles, bois, parcs et cimetières,
   grands boulevards plantés d'arbres, autoroutes, cinq lignes de métro, monuments.
   Le tissu urbain est un pavage de Voronoï en relief : chaque îlot a son toit éclairé au nord-ouest, son ombre au
   sud-est et sa cour. Trois ambiances selon l'heure du jeu (jour, crépuscule, nuit). Animé : la Seine scintille,
   les bateaux-mouches passent, le périphérique roule, les rames de métro circulent, les nuages et leurs ombres
   glissent, un avion traverse ; la nuit, les fenêtres s'allument, le phare de la tour Eiffel balaie la ville et la
   tour scintille les cinq premières minutes de chaque heure. Les lieux du jeu sont des balises en pixels. */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html } = UI;
  const { useEffect, useRef } = React;

  const W = 480, H = 336;
  const LON0 = 2.338, LAT0 = 48.8605, KX = 1610, KY = 2446, CX = 240, CY = 168;
  const proj = (lon, lat) => [CX + (lon - LON0) * KX, CY - (lat - LAT0) * KY];
  const P2 = (pts) => pts.map(([a, b]) => proj(a, b));
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

  // =================================================================== Géographie
  const PERIPH = P2([[2.2826, 48.8781], [2.2990, 48.8870], [2.3133, 48.8946], [2.3299, 48.8978], [2.3445, 48.8995], [2.3600, 48.8986], [2.3700, 48.8990], [2.3860, 48.8975], [2.3925, 48.8885], [2.4000, 48.8830], [2.4065, 48.8770], [2.4095, 48.8640], [2.4110, 48.8470], [2.4140, 48.8400], [2.4060, 48.8350], [2.3990, 48.8270], [2.3890, 48.8260], [2.3690, 48.8210], [2.3590, 48.8190], [2.3420, 48.8185], [2.3250, 48.8230], [2.3060, 48.8270], [2.2880, 48.8320], [2.2700, 48.8340], [2.2570, 48.8380], [2.2560, 48.8480], [2.2610, 48.8550], [2.2700, 48.8610], [2.2770, 48.8710]]);
  const BOULOGNE = P2([[2.2530, 48.8800], [2.2690, 48.8790], [2.2770, 48.8710], [2.2700, 48.8610], [2.2600, 48.8530], [2.2560, 48.8460], [2.2470, 48.8440], [2.2400, 48.8500], [2.2370, 48.8600], [2.2420, 48.8720]]);
  const VINCENNES = P2([[2.4140, 48.8460], [2.4400, 48.8480], [2.4650, 48.8470], [2.4720, 48.8380], [2.4680, 48.8290], [2.4450, 48.8240], [2.4250, 48.8260], [2.4140, 48.8330]]);
  const SEINE = P2([[2.4600, 48.8030], [2.4300, 48.8150], [2.4100, 48.8220], [2.3960, 48.8270], [2.3830, 48.8340], [2.3720, 48.8420], [2.3640, 48.8480], [2.3570, 48.8505], [2.3500, 48.8520], [2.3440, 48.8550], [2.3380, 48.8580], [2.3300, 48.8610], [2.3200, 48.8630], [2.3100, 48.8640], [2.3000, 48.8620], [2.2930, 48.8570], [2.2850, 48.8520], [2.2780, 48.8460], [2.2720, 48.8400], [2.2620, 48.8330], [2.2500, 48.8270], [2.2330, 48.8260], [2.2210, 48.8360], [2.2180, 48.8480], [2.2230, 48.8650], [2.2380, 48.8810], [2.2570, 48.8880], [2.2750, 48.8990], [2.3000, 48.9080], [2.3250, 48.9130], [2.3450, 48.9200], [2.3600, 48.9310], [2.3700, 48.9500]]);
  const CITE = P2([[2.3390, 48.8576], [2.3445, 48.8564], [2.3510, 48.8536], [2.3538, 48.8521], [2.3500, 48.8515], [2.3440, 48.8537], [2.3385, 48.8566]]);
  const STLOUIS = P2([[2.3545, 48.8530], [2.3605, 48.8510], [2.3612, 48.8498], [2.3560, 48.8500], [2.3535, 48.8515]]);
  const CANAL = P2([[2.3690, 48.8530], [2.3670, 48.8620], [2.3660, 48.8700], [2.3680, 48.8790], [2.3720, 48.8850], [2.3850, 48.8900], [2.4100, 48.8960]]);
  const PARKS = [
    { pts: [[2.3305, 48.8480], [2.3400, 48.8480], [2.3410, 48.8440], [2.3320, 48.8435]], k: "park" },               // Luxembourg
    { pts: [[2.3220, 48.8650], [2.3340, 48.8618], [2.3330, 48.8605], [2.3215, 48.8638]], k: "park" },               // Tuileries
    { pts: [[2.2905, 48.8590], [2.2965, 48.8600], [2.3045, 48.8520], [2.2995, 48.8505]], k: "park" },               // Champ-de-Mars
    { pts: [[2.3780, 48.8830], [2.3860, 48.8825], [2.3865, 48.8780], [2.3790, 48.8775]], k: "park" },               // Buttes-Chaumont
    { pts: [[2.3060, 48.8810], [2.3110, 48.8810], [2.3110, 48.8780], [2.3065, 48.8775]], k: "park" },               // Monceau
    { pts: [[2.3330, 48.8235], [2.3410, 48.8235], [2.3400, 48.8195], [2.3335, 48.8200]], k: "park" },               // Montsouris
    { pts: [[2.3880, 48.8650], [2.4010, 48.8640], [2.4000, 48.8575], [2.3895, 48.8580]], k: "cem" },                // Père-Lachaise
    { pts: [[2.3540, 48.8460], [2.3640, 48.8440], [2.3620, 48.8400], [2.3550, 48.8415]], k: "park" },               // Jardin des Plantes
    { pts: [[2.3860, 48.8960], [2.3950, 48.8960], [2.3960, 48.8900], [2.3870, 48.8895]], k: "park" },               // la Villette
    { pts: [[2.3230, 48.8410], [2.3300, 48.8400], [2.3285, 48.8360], [2.3220, 48.8370]], k: "cem" },                // Montparnasse
    { pts: [[2.3270, 48.8890], [2.3340, 48.8890], [2.3335, 48.8855], [2.3270, 48.8858]], k: "cem" },                // Montmartre
    { pts: [[2.3780, 48.8385], [2.3880, 48.8335], [2.3860, 48.8320], [2.3770, 48.8365]], k: "park" },               // Bercy
    { pts: [[2.2860, 48.8640], [2.2930, 48.8630], [2.2915, 48.8605], [2.2850, 48.8615]], k: "park" },               // Trocadéro
    { pts: [[2.3080, 48.8610], [2.3160, 48.8610], [2.3160, 48.8565], [2.3085, 48.8565]], k: "park" },               // esplanade des Invalides
    { pts: [[2.3090, 48.8950], [2.3150, 48.8950], [2.3150, 48.8915], [2.3095, 48.8915]], k: "park" },               // Martin-Luther-King, Batignolles
    { pts: [[2.3990, 48.8360], [2.4060, 48.8340], [2.4040, 48.8300], [2.3985, 48.8320]], k: "park" },               // Charenton, bois
    { pts: [[2.2700, 48.8270], [2.2780, 48.8270], [2.2790, 48.8235], [2.2700, 48.8235]], k: "park" },               // Issy, parc
  ].map((p) => ({ pts: P2(p.pts), k: p.k }));
  const LAKES = [P2([[2.2580, 48.8690], [2.2615, 48.8670], [2.2560, 48.8615], [2.2528, 48.8640]]), P2([[2.4120, 48.8338], [2.4180, 48.8338], [2.4172, 48.8306], [2.4122, 48.8310]]), P2([[2.4395, 48.8440], [2.4440, 48.8445], [2.4440, 48.8420], [2.4395, 48.8420]])];
  const BLVD = [
    // Champs-Élysées, Grande Armée, Neuilly
    { w: 2, pts: [[2.2383, 48.8919], [2.2600, 48.8850], [2.2826, 48.8781], [2.2950, 48.8738], [2.3212, 48.8656]] },
    // Rivoli, Saint-Antoine
    { w: 2, pts: [[2.3212, 48.8656], [2.3340, 48.8615], [2.3510, 48.8570], [2.3610, 48.8550], [2.3694, 48.8532], [2.3820, 48.8505], [2.3958, 48.8484], [2.4110, 48.8470]] },
    // Grands Boulevards
    { w: 2, pts: [[2.3245, 48.8700], [2.3316, 48.8712], [2.3390, 48.8720], [2.3490, 48.8710], [2.3542, 48.8696], [2.3637, 48.8674], [2.3694, 48.8532]] },
    // Saint-Germain
    { w: 2, pts: [[2.3610, 48.8495], [2.3500, 48.8510], [2.3430, 48.8530], [2.3330, 48.8535], [2.3260, 48.8565], [2.3180, 48.8612]] },
    // Sébastopol, Saint-Michel, Denfert
    { w: 2, pts: [[2.3590, 48.8762], [2.3520, 48.8660], [2.3470, 48.8583], [2.3438, 48.8534], [2.3400, 48.8450], [2.3323, 48.8336], [2.3254, 48.8230]] },
    // Haussmann, Opéra
    { w: 1, pts: [[2.3020, 48.8760], [2.3180, 48.8750], [2.3280, 48.8735], [2.3360, 48.8730]] },
    { w: 1, pts: [[2.3316, 48.8712], [2.3360, 48.8640]] },
    // Magenta, Barbès
    { w: 1, pts: [[2.3637, 48.8674], [2.3570, 48.8760], [2.3497, 48.8838]] },
    // ancien mur des Fermiers généraux, rive droite
    { w: 1, pts: [[2.2950, 48.8738], [2.3030, 48.8790], [2.3150, 48.8810], [2.3275, 48.8838], [2.3370, 48.8822], [2.3497, 48.8838], [2.3600, 48.8840], [2.3690, 48.8840], [2.3760, 48.8720], [2.3830, 48.8660], [2.3880, 48.8620], [2.3958, 48.8484]] },
    // rive gauche
    { w: 1, pts: [[2.3958, 48.8484], [2.3800, 48.8400], [2.3700, 48.8350], [2.3557, 48.8310], [2.3433, 48.8310], [2.3323, 48.8336], [2.3127, 48.8425], [2.3030, 48.8473], [2.2894, 48.8540]] },
    // Montparnasse, Port-Royal
    { w: 1, pts: [[2.3125, 48.8560], [2.3165, 48.8470], [2.3238, 48.8433], [2.3370, 48.8400], [2.3520, 48.8350], [2.3557, 48.8310]] },
    { w: 1, pts: [[2.3290, 48.8580], [2.3270, 48.8470], [2.3300, 48.8380]] },
    // Clichy, Batignolles
    { w: 1, pts: [[2.3275, 48.8838], [2.3200, 48.8900], [2.3133, 48.8946]] },
    { w: 1, pts: [[2.3256, 48.8754], [2.3256, 48.8873], [2.3299, 48.8978]] },
    // Italie, Gobelins
    { w: 1, pts: [[2.3500, 48.8460], [2.3520, 48.8350], [2.3557, 48.8310], [2.3590, 48.8190]] },
    // République – Nation, Voltaire
    { w: 1, pts: [[2.3637, 48.8674], [2.3800, 48.8600], [2.3958, 48.8484]] },
    // Kléber, Iéna, Foch
    { w: 1, pts: [[2.2950, 48.8738], [2.2930, 48.8660], [2.2876, 48.8634]] },
    { w: 1, pts: [[2.2950, 48.8738], [2.2830, 48.8720], [2.2740, 48.8700]] },
  ].map((b) => ({ w: b.w, pts: P2(b.pts) }));
  const ETOILE = proj(2.2950, 48.8738);
  const HIGHWAYS = [
    { id: "A1", pts: P2([[2.3600, 48.8986], [2.3620, 48.9150], [2.3650, 48.9400], [2.3700, 48.9600]]) },
    { id: "A3", pts: P2([[2.4095, 48.8640], [2.4350, 48.8720], [2.4700, 48.8850], [2.5200, 48.9000]]) },
    { id: "A4", pts: P2([[2.4060, 48.8350], [2.4300, 48.8280], [2.4600, 48.8220], [2.5200, 48.8100], [2.6000, 48.8000]]) },
    { id: "A6", pts: P2([[2.3590, 48.8190], [2.3540, 48.8000], [2.3450, 48.7800], [2.3350, 48.7600], [2.3300, 48.7300]]) },
    { id: "A13", pts: P2([[2.2570, 48.8380], [2.2400, 48.8420], [2.2150, 48.8450], [2.1800, 48.8520], [2.1300, 48.8600]]) },
    { id: "N13", pts: P2([[2.2383, 48.8919], [2.2100, 48.8970], [2.1500, 48.9050]]) },
  ];
  // Le réseau réel (metro.js) : chaque ligne dans sa couleur ; les points sont les correspondances et les terminus
  const METRO = CR.METRO ? CR.METRO.polylines().map((l) => ({ id: l.id, c: l.c, kind: l.kind, seqs: l.seqs.map((q) => q.map(([a, b, k]) => [...proj(a, b), k])) })) : [];
  const ARR = [[1, 2.336, 48.862], [2, 2.342, 48.868], [3, 2.360, 48.863], [4, 2.357, 48.855], [5, 2.350, 48.845], [6, 2.333, 48.849], [7, 2.312, 48.856], [8, 2.312, 48.873], [9, 2.338, 48.877], [10, 2.361, 48.876], [11, 2.380, 48.859], [12, 2.392, 48.840], [13, 2.362, 48.828], [14, 2.327, 48.829], [15, 2.299, 48.840], [16, 2.272, 48.860], [17, 2.307, 48.887], [18, 2.348, 48.892], [19, 2.385, 48.887], [20, 2.401, 48.864]].map(([n, a, b]) => [n, ...proj(a, b)]);
  const TOWNS = [["LA DÉFENSE", 2.2290, 48.8850], ["NEUILLY", 2.2640, 48.8890], ["LEVALLOIS", 2.2880, 48.8990], ["CLICHY", 2.3080, 48.9070], ["SAINT-OUEN", 2.3370, 48.9100], ["PANTIN", 2.4070, 48.8960], ["MONTREUIL", 2.4460, 48.8630], ["CHARENTON", 2.4190, 48.8195], ["IVRY", 2.3880, 48.8110], ["MONTROUGE", 2.3150, 48.8135], ["ISSY", 2.2620, 48.8220], ["BOULOGNE", 2.2390, 48.8370]].map(([n, a, b]) => [n, ...proj(a, b)]);

  // Les lieux du jeu : coordonnées réelles
  const GEO = {
    domicile: [2.3333, 48.8790], cabinet: [2.3215, 48.8810], palais: [2.3135, 48.8936], cite: [2.3455, 48.8556], ordre: [2.3420, 48.8566],
    commissariat: [2.3477, 48.8919], umj: [2.3488, 48.8540], spip: [2.3555, 48.8306], cj: [2.3100, 48.8750], sante: [2.3402, 48.8337],
  };
  // Hors champ : une balise au bord de la carte, avec le panneau de l'axe qui y mène
  const FAR = {
    poissy: { route: "A13", km: 24, edge: [16, 120] },
    gendarmerie: { route: "N20", km: 26, edge: [140, 316] },
    fresnes: { route: "A6", km: 12, edge: [214, 316] },
    fleury: { route: "A6", km: 25, edge: [288, 316] },
    melun: { route: "A5", km: 45, edge: [400, 316] },
  };
  const CITE_XY = proj(2.3455, 48.8556);
  // Position d'un lieu sur la carte (pixels de la carte)
  CR.mapXY = function (id, pl) {
    if (pl && pl.geo) return proj(pl.geo[0], pl.geo[1]);
    if (GEO[id]) return proj(GEO[id][0], GEO[id][1]);
    if (FAR[id]) return FAR[id].edge.slice();
    if (pl && pl.x != null) return [CITE_XY[0] + (pl.x - 0.535) * 268, CITE_XY[1] + (pl.y - 0.505) * 320];
    return [CX, CY];
  };
  CR.mapFar = (id) => FAR[id] || null;

  // =================================================================== Palettes
  const PAL = {
    jour: {
      land: "#4a554c", land2: "#454f47", sub: ["#767b88", "#717683", "#7b808d"], subHi: "#858a98", subLo: "#686d7a", subSt: "#5d6270",
      block: ["#bcb199", "#b4a991", "#c3b8a0"], hi: "#d3c8ae", lo: "#9b907a", court: "#857b6b", street: "#757168", lamp: null,
      blvd: "#3f4452", tree: "#5f8f50", tree2: "#7aa863", periph: "#f2c14e", periphEdge: "#9a7a2c", hwy: "#e8a33d",
      park: "#5d8c54", park2: "#4f7c47", park3: "#6f9e5f", cem: "#5f7563", cem2: "#53685a", tomb: "#9aa59a", wood: "#46703f", wood2: "#3a6136", wood3: "#57824c",
      water: "#3f74ad", water2: "#6a9fd6", waterDk: "#2f5a88", quai: "#c9c0a8",
      arr: "rgba(40,44,58,0.5)", town: "rgba(232,236,226,0.7)", eau: "rgba(196,222,255,0.85)", bois: "rgba(220,240,210,0.7)",
      lit: 0, metroA: 0.75, vign: "rgba(10,14,22,0.28)", tint: null,
    },
    soir: {
      land: "#2b2a40", land2: "#27263a", sub: ["#4a4560", "#45405a", "#4f4a66"], subHi: "#575070", subLo: "#3a3650", subSt: "#353048",
      block: ["#6a6280", "#645c7a", "#6f6686"], hi: "#7f7698", lo: "#544c6a", court: "#463f5a", street: "#433c58", lamp: "#b8834a",
      blvd: "#3a3048", tree: "#e9a95e", tree2: "#ffd08a", periph: "#f0b56c", periphEdge: "#7a5030", hwy: "#c9935a",
      park: "#3e5a48", park2: "#344e3e", park3: "#4a6a54", cem: "#3c4c46", cem2: "#34433e", tomb: "#6c7470", wood: "#344d3d", wood2: "#2b4233", wood3: "#3e5a47",
      water: "#3a4f88", water2: "#e09a7e", waterDk: "#2c3d6c", quai: "#7f7287",
      arr: "rgba(250,226,200,0.42)", town: "rgba(250,226,200,0.6)", eau: "rgba(255,200,170,0.7)", bois: "rgba(200,230,200,0.55)",
      lit: 0.03, metroA: 0.8, vign: "rgba(12,8,24,0.32)", tint: "rgba(255,120,80,0.07)",
    },
    nuit: {
      land: "#0b0e17", land2: "#090c14", sub: ["#151a27", "#131825", "#181e2c"], subHi: "#1d2333", subLo: "#0e121b", subSt: "#1f1a14",
      block: ["#1b2133", "#181d2e", "#20273a"], hi: "#283049", lo: "#10141f", court: "#0c0f19", street: "#3b2f20", lamp: "#9a6d33",
      blvd: "#5a4122", tree: "#e8a54a", tree2: "#ffd88a", periph: "#e09a45", periphEdge: "#5a3a18", hwy: "#a87530",
      park: "#12221a", park2: "#0e1b14", park3: "#17291f", cem: "#121a17", cem2: "#0e1512", tomb: "#2a322e", wood: "#0f1c14", wood2: "#0b160f", wood3: "#142419",
      water: "#11234a", water2: "#5a80bd", waterDk: "#0a1530", quai: "#3a3428", quaiLamp: "#e0a050",
      arr: "rgba(170,180,215,0.32)", town: "rgba(170,180,215,0.45)", eau: "rgba(120,160,230,0.6)", bois: "rgba(130,190,150,0.45)",
      lit: 0.08, metroA: 0.95, vign: "rgba(0,0,6,0.45)", tint: null,
    },
  };
  CR.mapPhase = (min) => (min >= 21 * 60 || min < 6 * 60 ? "nuit" : (min >= 18 * 60 || min < 7 * 60 + 30) ? "soir" : "jour");

  // =================================================================== Petite police 3×5, avec accents
  const F = {
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111",
    "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001110", "-": "000000111000000", ".": "000000000000010", "'": "010010000000000", " ": "000000000000000",
  };
  function text(ctx, str, x, y, c) {
    ctx.fillStyle = c;
    let cx = Math.round(x);
    const yy = Math.round(y);
    for (const raw of String(str).toUpperCase()) {
      const accent = "ÉÈÊ".includes(raw);
      const ch = accent ? "E" : raw === "À" ? "A" : raw === "Ç" ? "C" : raw;
      const g = F[ch] || F[" "];
      for (let i = 0; i < 15; i++) if (g[i] === "1") ctx.fillRect(cx + (i % 3), yy + Math.floor(i / 3), 1, 1);
      if (accent) ctx.fillRect(cx + (raw === "È" ? 0 : raw === "Ê" ? 1 : 2), yy - 2, 1, 1);
      cx += 4;
    }
  }
  const textW = (str) => String(str).length * 4 - 1;
  // texte avec un liseré sombre, pour qu'il se lise sur tous les fonds
  function textOutlined(ctx, str, x, y, c, o) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) text(ctx, str, x + dx, y + dy, o);
    text(ctx, str, x, y, c);
  }

  // =================================================================== Outils de tracé
  function rasterMask(draw) {
    const c = mk(W, H), x = c.getContext("2d");
    x.fillStyle = "#fff"; x.strokeStyle = "#fff"; x.lineJoin = "round"; x.lineCap = "round";
    draw(x);
    const out = new Uint8Array(W * H);
    try { const d = x.getImageData(0, 0, W, H).data; for (let i = 0; i < W * H; i++) out[i] = d[i * 4 + 3] > 110 ? 1 : 0; } catch (e) { /* pas de rendu disponible */ }
    return out;
  }
  const poly = (x, pts) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  const path = (x, pts, w) => { x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); };
  // échantillonne une polyligne pixel par pixel, avec la normale
  function sample(pts, closed) {
    const out = [];
    const seq = closed ? pts.concat([pts[0]]) : pts;
    for (let i = 0; i < seq.length - 1; i++) {
      const [x0, y0] = seq[i], [x1, y1] = seq[i + 1];
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L));
      const nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
      for (let k = 0; k < n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, nx, ny]);
    }
    if (!closed) { const l = out[out.length - 1] || [0, 0, 0, 0]; out.push([seq[seq.length - 1][0], seq[seq.length - 1][1], l[2], l[3]]); }
    return out;
  }
  function line(ctx, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    ctx.fillStyle = c;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 3000; i++) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  const polyline = (ctx, pts, c, w) => { for (let i = 0; i < pts.length - 1; i++) { line(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c); if (w > 1) { line(ctx, pts[i][0] + 1, pts[i][1], pts[i + 1][0] + 1, pts[i + 1][1], c); line(ctx, pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, c); } } };

  // Masques et pavage (calculés une seule fois)
  let MASKS = null;
  function masks() {
    if (MASKS) return MASKS;
    const inner = PERIPH.map(([x, y]) => [256 + (x - 256) * 0.94, 172 + (y - 172) * 0.94]);
    MASKS = {
      paris: rasterMask((x) => poly(x, PERIPH)),
      bois: rasterMask((x) => { poly(x, BOULOGNE); poly(x, VINCENNES); }),
      parks: rasterMask((x) => { for (const p of PARKS) if (p.k === "park") poly(x, p.pts); }),
      cem: rasterMask((x) => { for (const p of PARKS) if (p.k === "cem") poly(x, p.pts); }),
      water: rasterMask((x) => { path(x, SEINE, 5); path(x, P2([[2.3640, 48.8495], [2.3530, 48.8530], [2.3375, 48.8582]]), 12); path(x, CANAL, 2); for (const l of LAKES) poly(x, l); }),
      island: rasterMask((x) => { poly(x, CITE); poly(x, STLOUIS); }),
      inner,
      seine: sample(SEINE, false),
      periph: sample(PERIPH, true),
      blvd: BLVD.map((b) => ({ w: b.w, s: sample(b.pts, false) })),
      hwys: HIGHWAYS.map((h) => sample(h.pts, false)),
      metro: METRO.filter((m) => m.kind === "M").flatMap((m) => m.seqs.map((q) => ({ c: m.c, id: m.id, s: sample(q, false) }))),
    };
    // pavage de Voronoï : îlots de Paris (serrés), communes de banlieue (plus lâches)
    const seeds = (sp, inParis) => {
      const out = [];
      for (let gy = -sp; gy < H + sp; gy += sp) for (let gx = -sp; gx < W + sp; gx += sp) {
        const x = gx + 0.15 * sp + hash(gx + 99, gy, sp) * sp * 0.7, y = gy + 0.15 * sp + hash(gy + 7, gx, sp + 7) * sp * 0.7;
        const xi = Math.max(0, Math.min(W - 1, Math.round(x))), yi = Math.max(0, Math.min(H - 1, Math.round(y)));
        if (!!MASKS.paris[yi * W + xi] === inParis) out.push([x, y]);
      }
      return out;
    };
    const cellOf = (pts, sp) => {
      // grille de recherche : chaque case connaît ses germes (tri par comptage)
      const gw = Math.ceil(W / sp) + 4, gh = Math.ceil(H / sp) + 4, cell = (x, y) => (Math.floor(y / sp) + 2) * gw + Math.floor(x / sp) + 2;
      const count = new Int32Array(gw * gh + 1);
      const cOf = pts.map(([x, y]) => { const c = Math.max(0, Math.min(gw * gh - 1, cell(x, y))); count[c + 1]++; return c; });
      for (let i = 1; i <= gw * gh; i++) count[i] += count[i - 1];
      const start = count.slice(), list = new Int32Array(pts.length), fill = count.slice();
      cOf.forEach((c, i) => { list[fill[c]++] = i; });
      const px = new Float64Array(pts.length), py = new Float64Array(pts.length);
      pts.forEach(([x, y], i) => { px[i] = x; py[i] = y; });
      const id = new Int32Array(W * H).fill(-1), edge = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) {
        const gy = Math.floor(y / sp) + 2;
        for (let x = 0; x < W; x++) {
          const gx = Math.floor(x / sp) + 2;
          let b1 = Infinity, b2 = Infinity, bi = -1;
          for (let j = gy - 2; j <= gy + 2; j++) {
            if (j < 0 || j >= gh) continue;
            for (let i = gx - 2; i <= gx + 2; i++) {
              if (i < 0 || i >= gw) continue;
              const c = j * gw + i;
              for (let q = start[c]; q < start[c + 1]; q++) {
                const k = list[q], dx = px[k] - x, dy = py[k] - y, d = dx * dx + dy * dy;
                if (d < b1) { b2 = b1; b1 = d; bi = k; } else if (d < b2) b2 = d;
              }
            }
          }
          const o = y * W + x;
          id[o] = bi; edge[o] = Math.sqrt(b2) - Math.sqrt(b1) < 0.85 ? 1 : 0;
        }
      }
      return { id, edge };
    };
    MASKS.pSeeds = seeds(6, true); MASKS.pCells = cellOf(MASKS.pSeeds, 6);
    MASKS.bSeeds = seeds(9, false); MASKS.bCells = cellOf(MASKS.bSeeds, 9);
    return MASKS;
  }

  // =================================================================== Fond de carte (une fois par ambiance)
  const BASES = {};
  function base(phase) {
    if (BASES[phase]) return BASES[phase];
    const M = masks(), pal = PAL[phase];
    const c = mk(W, H), ctx = c.getContext("2d");
    const img = ctx.createImageData(W, H), d = img.data;
    const C = {};
    for (const k of Object.keys(pal)) { const v = pal[k]; if (typeof v === "string" && v[0] === "#") C[k] = hex(v); else if (Array.isArray(v)) C[k] = v.map(hex); }
    const amber = hex("#f2c46a"), amber2 = hex("#d9a24c"), white = hex("#fff1cc");
    const lit = [];
    const PE = M.pCells.edge, BE = M.bCells.edge;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let col;
      const dith = BAYER[y & 3][x & 3];
      if (M.water[i] && !M.island[i]) {
        const shore = !M.water[i - 1] || !M.water[i + 1] || !M.water[i - W] || !M.water[i + W] || M.island[i - 1] || M.island[i + 1] || M.island[i - W] || M.island[i + W];
        col = shore ? C.waterDk : (hash(x, y, 3) < 0.05 ? C.water2 : C.water);
      } else if (M.cem[i]) col = (x % 3 === 0 && y % 2 === 0) ? C.tomb : (dith < 8 ? C.cem : C.cem2);
      else if (M.parks[i]) { const h = hash(x >> 1, y >> 1, 5); col = h < 0.28 ? C.park2 : h > 0.86 ? C.park3 : C.park; }
      else if (M.bois[i]) { const h = hash(x >> 1, y >> 1, 9); col = h < 0.38 ? C.wood2 : h > 0.84 ? C.wood3 : C.wood; }
      else if (M.paris[i] || M.island[i]) {
        const cid = M.pCells.id[i];
        if (PE[i]) {
          col = C.street;
          if (pal.lamp && hash(x, y, 41) < 0.05) col = hex(pal.lamp);
        } else {
          const s = M.pSeeds[cid] || [x, y];
          const hv = hash(cid, 11, 1);
          col = C.block[hv < 0.33 ? 0 : hv < 0.66 ? 1 : 2];
          if (PE[i - W] || PE[i - 1]) col = C.hi;
          else if (PE[i + W] || PE[i + 1]) col = C.lo;
          if (Math.round(s[0]) === x && Math.round(s[1]) === y && !(PE[i - W] || PE[i - 1] || PE[i + W] || PE[i + 1])) col = C.court;
          else if (pal.lit && (PE[i + W] || PE[i + 1] || PE[i - 1]) && hash(x, y, 21) < pal.lit * 1.6) { col = hash(x, y, 4) < 0.5 ? amber : hash(x, y, 6) < 0.8 ? amber2 : white; lit.push([x, y, col]); }
        }
      } else {
        const cid = M.bCells.id[i];
        const s = M.bSeeds[cid] || [x, y];
        const dist = Math.hypot(s[0] - 256, (s[1] - 172) * 1.3);
        const built = hash(cid, 3, 2) < Math.max(0.14, 0.98 - dist / 300);
        if (BE[i]) col = built ? C.subSt : C.land2;
        else if (built) {
          col = C.sub[hash(cid, 5, 2) < 0.5 ? 0 : hash(cid, 6, 2) < 0.5 ? 1 : 2];
          if (BE[i - W] || BE[i - 1]) col = C.subHi;
          else if (BE[i + W] || BE[i + 1]) col = C.subLo;
          else if (pal.lit && hash(x, y, 31) < pal.lit * 0.6) { col = amber2; lit.push([x, y, col]); }
        } else col = dith < 2 ? C.land2 : C.land;
      }
      d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // quais de la Seine : un liseré de pierre
    for (const [x, y, nx, ny] of M.seine) for (const sgn of [-1, 1]) {
      const qx = Math.round(x + nx * 3.3 * sgn), qy = Math.round(y + ny * 3.3 * sgn), qi = qy * W + qx;
      if (qx > 0 && qy > 0 && qx < W && qy < H && !M.water[qi] && hash(qx, qy, 2) < 0.75) { ctx.fillStyle = pal.quaiLamp && hash(qx, qy, 17) < 0.3 ? pal.quaiLamp : pal.quai; ctx.fillRect(qx, qy, 1, 1); }
    }
    // boulevards des Maréchaux
    polyline(ctx, M.inner.concat([M.inner[0]]), pal.street, 1);
    // grands boulevards plantés : la chaussée, et une rangée d'arbres (ou de réverbères) de chaque côté
    for (const b of M.blvd) {
      for (const [x, y] of b.s) { ctx.fillStyle = pal.blvd; ctx.fillRect(Math.round(x), Math.round(y), b.w, b.w); }
      b.s.forEach(([x, y, nx, ny], k) => {
        if (k % (b.w > 1 ? 2 : 3)) return;
        for (const sgn of [-1, 1]) {
          const tx = Math.round(x + nx * (b.w > 1 ? 2.2 : 1.6) * sgn + (b.w > 1 ? 0.5 : 0)), ty = Math.round(y + ny * (b.w > 1 ? 2.2 : 1.6) * sgn + (b.w > 1 ? 0.5 : 0));
          if (tx < 0 || ty < 0 || tx >= W || ty >= H || M.water[ty * W + tx]) continue;
          ctx.fillStyle = hash(tx, ty, 13) < 0.3 ? pal.tree2 : pal.tree; ctx.fillRect(tx, ty, 1, 1);
        }
      });
    }
    // place de l'Étoile et ses douze avenues
    for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2 + 0.2; line(ctx, ETOILE[0], ETOILE[1], ETOILE[0] + Math.cos(t) * 13, ETOILE[1] + Math.sin(t) * 11, pal.blvd); }
    ctx.fillStyle = pal.blvd; ctx.fillRect(ETOILE[0] - 3, ETOILE[1] - 3, 7, 7);
    // autoroutes, périphérique
    for (const h of HIGHWAYS) polyline(ctx, h.pts, pal.hwy, 2);
    for (const [x, y, nx, ny] of M.periph) { ctx.fillStyle = pal.periphEdge; ctx.fillRect(Math.round(x + nx * 1.6), Math.round(y + ny * 1.6), 1, 1); ctx.fillRect(Math.round(x - nx * 1.6), Math.round(y - ny * 1.6), 1, 1); }
    polyline(ctx, PERIPH.concat([PERIPH[0]]), pal.periph, 2);
    // métro : les lignes en filigrane, les stations en points blancs
    ctx.globalAlpha = pal.metroA;
    for (const m of METRO) { ctx.globalAlpha = pal.metroA * (m.kind === "M" ? 1 : 0.5); for (const q of m.seqs) polyline(ctx, q, m.c, 1); }
    ctx.globalAlpha = 1;
    for (const m of METRO) if (m.kind === "M") for (const q of m.seqs) for (const [x, y, k] of q) { if (!k) continue; ctx.fillStyle = "rgba(8,10,18,0.55)"; ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1); ctx.fillStyle = phase === "nuit" ? "#e9e6f5" : "#ffffff"; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    // monuments, détourés d'un liseré sombre pour se détacher du tissu urbain
    {
      const mc = mk(W, H), mx = mc.getContext("2d");
      monuments(mx, phase, pal);
      try {
        const id = mx.getImageData(0, 0, W, H), dd = id.data, op = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) op[i] = dd[i * 4 + 3] > 200 ? 1 : 0;
        const ol = phase === "jour" ? [22, 22, 30, 215] : [0, 0, 4, 230];
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (op[i] || !(op[i - 1] || op[i + 1] || op[i - W] || op[i + W])) continue;
          dd[i * 4] = ol[0]; dd[i * 4 + 1] = ol[1]; dd[i * 4 + 2] = ol[2]; dd[i * 4 + 3] = ol[3];
        }
        mx.putImageData(id, 0, 0);
      } catch (e) { /* sans détourage */ }
      ctx.drawImage(mc, 0, 0);
    }
    // vignette tramée : la banlieue s'efface vers les bords
    ctx.fillStyle = pal.vign;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const e = Math.hypot((x - 256) / 250, (y - 172) / 175);
      if (e > 0.85 && BAYER[y & 3][x & 3] < (e - 0.85) * 40) ctx.fillRect(x, y, 1, 1);
    }
    // halo de la ville la nuit
    if (phase !== "jour") {
      try {
        const g = ctx.createRadialGradient(256, 170, 10, 256, 170, 170);
        if (g && g.addColorStop) { g.addColorStop(0, phase === "nuit" ? "rgba(255,170,80,0.10)" : "rgba(255,150,110,0.08)"); g.addColorStop(1, "rgba(255,170,80,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      } catch (e) { /* sans dégradé */ }
    }
    if (pal.tint) { ctx.fillStyle = pal.tint; ctx.fillRect(0, 0, W, H); }
    // noms : arrondissements, communes, Seine, bois
    for (const [n, x, y] of ARR) text(ctx, String(n), x - textW(String(n)) / 2, y - 2, pal.arr);
    const ink = phase === "jour" ? "rgba(16,20,30,0.55)" : "rgba(0,0,0,0.6)";
    for (const [n, x, y] of TOWNS) textOutlined(ctx, n, x - textW(n) / 2, y - 2, pal.town, ink);
    const eau = (s, a, b) => { const [x, y] = proj(a, b); textOutlined(ctx, s, x - textW(s) / 2, y, pal.eau, phase === "jour" ? "rgba(30,60,100,0.6)" : "rgba(0,0,10,0.6)"); };
    eau("SEINE", 2.3890, 48.8240); eau("SEINE", 2.2070, 48.8590);
    const bois = (s, a, b) => { const [x, y] = proj(a, b); textOutlined(ctx, s, x - textW(s) / 2, y, pal.bois, phase === "jour" ? "rgba(20,40,20,0.55)" : "rgba(0,0,0,0.6)"); };
    bois("BOIS DE", 2.2510, 48.8590); bois("BOULOGNE", 2.2510, 48.8565);
    bois("BOIS DE", 2.4440, 48.8380); bois("VINCENNES", 2.4440, 48.8355);
    // rose des vents, échelle
    compass(ctx, W - 20, 24, phase);
    ctx.fillStyle = "rgba(6,8,16,0.6)"; ctx.fillRect(8, H - 22, 56, 14);
    ctx.fillStyle = "#e9e3d1"; ctx.fillRect(12, H - 12, 11, 2); ctx.fillStyle = "#3a3f50"; ctx.fillRect(23, H - 12, 11, 2); ctx.fillStyle = "#e9e3d1"; ctx.fillRect(12, H - 14, 1, 4); ctx.fillRect(34, H - 14, 1, 4);
    text(ctx, "1 KM", 39, H - 15, "#e9e3d1");
    // cadre
    ctx.fillStyle = "#05070e"; ctx.fillRect(0, 0, W, 2); ctx.fillRect(0, H - 2, W, 2); ctx.fillRect(0, 0, 2, H); ctx.fillRect(W - 2, 0, 2, H);
    BASES[phase] = { c, lit };
    return BASES[phase];
  }

  function compass(ctx, x, y, phase) {
    ctx.fillStyle = "rgba(6,8,16,0.6)"; ctx.fillRect(x - 8, y - 16, 17, 30);
    const a = phase === "jour" ? "#f3e7c4" : "#e2c171", b = phase === "jour" ? "#8a7a55" : "#7a6a40";
    for (let i = 0; i < 7; i++) { ctx.fillStyle = a; const w = Math.floor(i / 2); ctx.fillRect(x - w, y - 8 + i, 1 + w * 2, 1); }
    for (let i = 0; i < 7; i++) { ctx.fillStyle = b; const w = Math.floor((6 - i) / 2); ctx.fillRect(x - w, y + i, 1 + w * 2, 1); }
    ctx.fillStyle = b; ctx.fillRect(x - 5, y - 1, 11, 1);
    text(ctx, "N", x - 1, y - 14, a);
  }

  // Les monuments, en petits volumes vus de haut, avec leur ombre au sud-est
  const EIFFEL = proj(2.2945, 48.8584).map(Math.round);
  function monuments(ctx, phase, pal) {
    const night = phase !== "jour", deep = phase === "nuit";
    const sh = deep ? "rgba(0,0,0,0.5)" : "rgba(14,16,28,0.38)";
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const at = (a, b) => proj(a, b).map(Math.round);
    const stone = deep ? "#a39a80" : night ? "#b7a991" : "#e8dcc0", stoneHi = deep ? "#c4bb9f" : night ? "#d2c4aa" : "#fbf2dc", stoneLo = deep ? "#6c6656" : night ? "#7f7466" : "#b3a687";
    // tour Eiffel
    { const [x, y] = EIFFEL; const col = night ? "#d7983e" : "#7a5537", hi = night ? "#ffd27a" : "#a3784f";
      if (night) { ctx.fillStyle = deep ? "rgba(255,190,100,0.13)" : "rgba(255,190,100,0.08)"; ctx.fillRect(x - 7, y - 19, 15, 21); ctx.fillRect(x - 5, y - 21, 11, 25); }
      R(x - 2, y + 1, 12, 2, sh);
      line(ctx, x - 5, y, x - 1, y - 9, col); line(ctx, x - 4, y, x - 1, y - 7, col); line(ctx, x + 5, y, x + 1, y - 9, col); line(ctx, x + 4, y, x + 1, y - 7, col);
      line(ctx, x - 4, y - 1, x - 1, y - 8, hi);
      R(x - 3, y - 4, 7, 1, hi); R(x - 1, y - 9, 3, 2, col); R(x - 1, y - 9, 3, 1, hi); R(x, y - 16, 1, 7, col); R(x, y - 17, 1, 1, hi); }
    // Arc de Triomphe
    { const [x, y] = ETOILE.map(Math.round); R(x - 2, y + 2, 7, 2, sh); R(x - 3, y - 2, 6, 4, stone); R(x - 3, y - 2, 6, 1, stoneHi); R(x - 1, y, 2, 2, deep ? "#1b2133" : "#5d5644"); }
    // Sacré-Cœur sur la butte Montmartre
    { const [x, y] = at(2.3431, 48.8867);
      ctx.fillStyle = deep ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.1)"; for (let r = 11; r > 2; r -= 3) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      const w = deep ? "#e7ebf6" : "#fbf8f0", w2 = deep ? "#b9bfd2" : "#d9d3c4";
      R(x - 3, y + 1, 9, 2, sh); R(x - 4, y - 2, 9, 4, w2); R(x - 4, y - 2, 9, 1, w); R(x - 1, y - 5, 3, 3, w); R(x, y - 7, 1, 2, w); R(x - 4, y - 4, 1, 2, w); R(x + 4, y - 4, 1, 2, w);
      if (deep) { ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(x - 6, y - 8, 13, 12); } }
    // Notre-Dame, sa flèche reconstruite
    { const [x, y] = at(2.3499, 48.8530); R(x - 3, y + 2, 11, 2, sh); R(x - 5, y - 1, 10, 3, stoneLo); R(x - 5, y - 1, 10, 1, stone); R(x - 5, y - 3, 2, 2, stoneHi); R(x - 5, y + 1, 2, 2, stoneHi); R(x + 1, y - 4, 1, 4, deep ? "#d6c89a" : "#6a6250"); R(x + 4, y - 2, 2, 5, stoneLo);
      if (deep) { ctx.fillStyle = "rgba(255,226,170,0.16)"; ctx.fillRect(x - 7, y - 5, 15, 10); } }
    // Palais de la Cité, Sainte-Chapelle
    { const [x, y] = at(2.3448, 48.8558); R(x - 3, y + 2, 9, 2, sh); R(x - 5, y - 1, 9, 4, deep ? "#6f7590" : "#b5b4b0"); R(x - 5, y - 1, 9, 1, deep ? "#8a90aa" : "#d4d3cf"); R(x - 2, y - 5, 1, 4, deep ? "#e2c171" : "#4b4f60"); R(x - 3, y - 2, 3, 1, deep ? "#e2c171" : "#4b4f60"); }
    // le Louvre et la pyramide
    { const [x, y] = at(2.3376, 48.8610); R(x - 8, y - 3, 16, 3, stone); R(x - 8, y - 3, 16, 1, stoneHi); R(x - 8, y, 3, 5, stone); R(x + 5, y, 3, 5, stone); R(x - 7, y + 5, 16, 2, sh);
      R(x - 1, y + 1, 3, 1, deep ? "#f8e2a8" : "#cfe3f2"); R(x, y, 1, 1, deep ? "#f8e2a8" : "#cfe3f2"); R(x - 2, y + 2, 5, 1, deep ? "#d9b56a" : "#9fbfd8"); }
    // les Invalides, le dôme doré
    { const [x, y] = at(2.3125, 48.8550); R(x - 1, y + 2, 6, 2, sh); R(x - 4, y + 1, 8, 2, stone); R(x - 2, y - 2, 5, 4, deep ? "#f2c46a" : "#d9b04c"); R(x - 1, y - 3, 3, 1, deep ? "#fff0b8" : "#f3d27a"); R(x, y - 5, 1, 2, deep ? "#fff0b8" : "#f3d27a"); }
    // le Panthéon
    { const [x, y] = at(2.3462, 48.8462); R(x - 1, y + 2, 6, 2, sh); R(x - 3, y - 1, 6, 3, stone); R(x - 2, y - 3, 4, 2, stoneHi); R(x - 1, y - 4, 2, 1, stoneHi); }
    // la tour Montparnasse
    { const [x, y] = at(2.3220, 48.8421); R(x + 1, y - 1, 7, 3, sh); R(x - 1, y - 12, 4, 13, deep ? "#141826" : "#2d3242"); R(x + 2, y - 12, 1, 13, deep ? "#2a3150" : "#4d5367");
      if (night) { for (let k = 0; k < 6; k++) if (hash(k, 3, 9) < 0.6) R(x + (k % 2), y - 11 + k * 2, 1, 1, "#f0d88a"); R(x, y - 13, 1, 1, "#ff4636"); } }
    // le Tribunal de Paris : trois étages de verre empilés aux Batignolles
    { const [x, y] = at(2.3135, 48.8936).map((v, i) => v + (i ? 0 : 7)); const g1 = deep ? "#2b3a5c" : "#a9c3dc", g2 = deep ? "#324368" : "#bcd2e6", g3 = deep ? "#3a4c74" : "#d4e4f2";
      R(x + 1, y, 9, 3, sh); R(x - 4, y - 5, 9, 6, g1); R(x - 3, y - 10, 7, 5, g2); R(x - 2, y - 14, 5, 4, g3); R(x - 4, y - 5, 9, 1, g3); R(x - 3, y - 10, 7, 1, deep ? "#4a5e8a" : "#e6f0f8");
      if (night) { for (const [a, b] of [[-3, -3], [0, -3], [3, -2], [-2, -8], [1, -7], [0, -12]]) R(x + a, y + b, 1, 1, "#f0d88a"); } }
    // l'Opéra Garnier
    { const [x, y] = at(2.3316, 48.8719); R(x - 1, y + 2, 6, 2, sh); R(x - 3, y - 1, 6, 4, stone); R(x - 2, y - 3, 4, 2, deep ? "#5f8a72" : "#6aa384"); R(x - 1, y - 4, 2, 1, deep ? "#e2c171" : "#e9cf7a"); }
    // gare de Lyon et son beffroi
    { const [x, y] = at(2.3733, 48.8445); R(x - 3, y - 1, 7, 3, stoneLo); R(x - 3, y - 1, 7, 1, stone); R(x + 3, y - 6, 2, 5, stone); R(x + 3, y - 5, 2, 1, deep ? "#ffe7a0" : "#3a3f50"); }
    // Bibliothèque nationale : quatre tours en livres ouverts
    { const [x, y] = at(2.3760, 48.8336); for (const [a, b] of [[-4, -4], [2, -4], [-4, 2], [2, 2]]) { R(x + a + 1, y + b + 1, 3, 3, sh); R(x + a, y + b, 3, 3, deep ? "#6c7aa0" : "#c8d7e6"); R(x + a + 1, y + b + 1, 1, 1, deep ? "#f0d88a" : "#9eb2c8"); } }
    // la Défense : tours et Grande Arche
    { const [x, y] = at(2.2420, 48.8905); const g = deep ? "#22304e" : night ? "#4a5a80" : "#8aa3bf", g2 = deep ? "#2f4066" : night ? "#5f709a" : "#a7bed6";
      for (const [a, b, h] of [[-7, -2, 9], [-3, 3, 12], [1, -4, 15], [5, 1, 10], [9, -3, 13], [12, 3, 8], [-10, 4, 7]]) { R(x + a + 1, y + b + 1, 4, 2, sh); R(x + a, y + b - h + 2, 3, h, g); R(x + a + 2, y + b - h + 2, 1, h, g2); if (night) for (let k = 0; k < h - 2; k += 3) if (hash(a, k, 1) < 0.6) R(x + a + 1, y + b - h + 3 + k, 1, 1, "#f0d88a"); }
      const [ax, ay] = at(2.2361, 48.8925); R(ax - 3, ay - 3, 6, 6, deep ? "#d8dcea" : "#ffffff"); R(ax - 2, ay - 2, 4, 4, deep ? "#0b0e17" : "#3c4354"); R(ax - 2, ay + 3, 7, 1, sh); }
    // la Santé : l'enceinte
    { const [x, y] = at(2.3402, 48.8337); const wl = deep ? "#5b6178" : "#d3cfc4"; R(x - 5, y - 4, 11, 1, wl); R(x - 5, y + 4, 11, 1, wl); R(x - 5, y - 4, 1, 9, wl); R(x + 5, y - 4, 1, 9, wl); R(x - 3, y - 2, 7, 5, deep ? "#2a2f42" : "#8f8a80"); R(x - 1, y - 3, 1, 7, deep ? "#3a3f55" : "#a8a397"); R(x - 4, y, 9, 1, deep ? "#3a3f55" : "#a8a397"); }
    // la Grande Mosquée, son minaret ; la tour Saint-Jacques
    { const [x, y] = at(2.3553, 48.8420); R(x - 2, y - 1, 5, 3, stone); R(x + 2, y - 4, 1, 3, stoneHi); }
    { const [x, y] = at(2.3489, 48.8580); R(x, y - 3, 1, 3, stone); R(x + 1, y, 2, 1, sh); }
  }

  // =================================================================== Balises des lieux
  const GLYPH = {
    palais: [".#####.", "#######", ".#.#.#.", ".#.#.#.", ".#.#.#.", "#######"],
    cabinet: ["..###..", "#######", "#.....#", "###.###", "#.....#", "#######"],
    ordre: ["...#...", "#######", "#..#..#", "##.#.##", "...#...", "..###.."],
    commissariat: ["...#...", "..###..", "#######", ".#####.", ".##.##.", "#.....#"],
    prison: ["#######", "#.#.#.#", "#.#.#.#", "#.#.#.#", "#.#.#.#", "#######"],
    faits: ["...#...", "...#...", "...#...", "...#...", ".......", "...#..."],
    umj: ["..###..", "..###..", "#######", "#######", "..###..", "..###.."],
    doc: [".#####.", ".#...#.", ".#####.", ".#...#.", ".#####.", "......."],
    home: ["...#...", "..###..", ".#####.", "#######", ".##.##.", ".##.##."],
  };
  const PIN_COL = { cabinet: "#e2a43b", palais: "#4f7fd6", ordre: "#a46bc9", commissariat: "#2fa3c4", prison: "#c9493b", faits: "#e8c84a", autre: "#7d8699", home: "#e2a43b" };
  const shade = (h, k) => { const [r, g, b] = hex(h); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const SPR = {};
  function pinSprite(type, glyph, sel) {
    const key = type + "/" + glyph + (sel ? 1 : 0);
    if (SPR[key]) return SPR[key];
    const c = mk(13, 17), x = c.getContext("2d");
    const col = PIN_COL[type] || PIN_COL.autre;
    const R = (a, b, w, h, cc) => { x.fillStyle = cc; x.fillRect(a, b, w, h); };
    const ol = sel ? "#fff3c4" : "#090b12";
    R(1, 0, 11, 1, ol); R(0, 1, 13, 9, ol); R(1, 10, 11, 1, ol); R(4, 11, 5, 1, ol); R(5, 12, 3, 1, ol); R(6, 13, 1, 1, ol);
    R(1, 1, 11, 9, col); R(1, 1, 11, 1, shade(col, 1.35)); R(1, 1, 1, 8, shade(col, 1.15)); R(1, 9, 11, 1, shade(col, 0.7)); R(11, 2, 1, 7, shade(col, 0.82)); R(5, 10, 3, 1, col); R(6, 11, 1, 1, shade(col, 0.7));
    const g = GLYPH[glyph] || GLYPH.doc;
    const gc = type === "faits" ? "#2a2208" : "#ffffff";
    g.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "#") R(3 + i, 3 + j, 1, 1, gc); }));
    SPR[key] = c;
    return c;
  }
  function glyphFor(id, pl) {
    if (id === "domicile") return "home";
    if (id === "umj") return "umj";
    if (pl.type === "autre") return "doc";
    return pl.type || "doc";
  }
  // Déconfliction : au Palais de la Cité, l'Ordre, le Palais et l'Hôtel-Dieu sont à quelques dizaines de mètres
  function layoutPins(list) {
    const out = [];
    for (const it of list) {
      const [x, y] = it.xy;
      let dx = 0, dy = 0;
      for (let k = 0; k < 16; k++) {
        const hit = out.find((o) => Math.abs(o.x + o.dx - (x + dx)) < 13 && Math.abs(o.y + o.dy - (y + dy)) < 15);
        if (!hit) break;
        const a = k * 2.4 + 0.6, r = 10 + k * 2;
        dx = Math.round(Math.cos(a) * r); dy = Math.round(Math.sin(a) * r * 0.8);
      }
      out.push(Object.assign({}, it, { x, y, dx, dy }));
    }
    return out;
  }
  CR.mapLayout = layoutPins;
  // le fond de carte se prépare pendant que le joueur lit l'écran titre
  const warm = () => { try { base(CR.store && CR.store.s ? CR.mapPhase(CR.store.s.min) : "jour"); } catch (e) { /* plus tard */ } };
  if (typeof window !== "undefined" && !window.__noMapWarm) (window.requestIdleCallback || ((f) => setTimeout(f, 1200)))(warm, { timeout: 4000 });

  // Nuages : des cumulus en pixels, construits une fois
  const CLOUD = {};
  function cloudSprite(k, phase) {
    const key = k + phase;
    if (CLOUD[key]) return CLOUD[key];
    const blobs = [];
    const n = 4 + (k % 3);
    let cx = 6;
    for (let i = 0; i < n; i++) { const r = 4 + Math.round(hash(k, i, 3) * 4) + (i > 0 && i < n - 1 ? 2 : 0); blobs.push([cx, 12 - r * 0.55, r]); cx += r * 1.1 + 1; }
    const w = Math.ceil(cx + 8), h = 16;
    const c = mk(w, h), x = c.getContext("2d");
    const top = phase === "jour" ? "#ffffff" : "#ffd9c4", mid = phase === "jour" ? "#eef1f8" : "#f0b8a8", low = phase === "jour" ? "#c9d1e2" : "#b98aa0";
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      if (yy > 13) continue;
      let inside = false, best = 0;
      for (const [bx, by, r] of blobs) { const dd = Math.hypot(xx - bx, (yy - by) * 1.15); if (dd < r) { inside = true; best = Math.max(best, (r - dd) / r); } }
      if (!inside) continue;
      x.fillStyle = yy >= 12 ? low : yy >= 10 ? mid : best > 0.5 && yy < 8 ? top : mid;
      if (yy < 10 && best < 0.18) x.fillStyle = mid;
      x.fillRect(xx, yy, 1, 1);
    }
    // ombre portée : la même silhouette, aplatie
    const s = mk(w, h), sx = s.getContext("2d");
    sx.drawImage(c, 0, 0);
    sx.globalCompositeOperation = "source-in"; sx.fillStyle = "rgba(8,12,26,0.2)"; sx.fillRect(0, 0, w, h);
    CLOUD[key] = { c, s, w, h };
    return CLOUD[key];
  }

  // =================================================================== Une image
  function frame(ctx, st, t) {
    const phase = st.phase, pal = PAL[phase], B = base(phase), M = masks();
    const night = phase !== "jour";
    ctx.drawImage(B.c, 0, 0);
    // la Seine scintille
    const S = M.seine;
    for (let k = 0; k < 110; k++) {
      const idx = (k * 53 + Math.floor(t * 9 + k * 3)) % S.length;
      const [x, y, nx, ny] = S[idx];
      if (hash(k, Math.floor(t * 2.5), 1) < 0.45) continue;
      const off = ((k % 5) - 2) * 0.8;
      ctx.fillStyle = phase === "nuit" ? (k % 3 ? "rgba(120,160,230,0.7)" : "rgba(242,196,106,0.75)") : phase === "soir" ? "rgba(255,190,150,0.75)" : "rgba(225,240,255,0.8)";
      ctx.fillRect(Math.round(x + nx * off), Math.round(y + ny * off), k % 4 ? 1 : 2, 1);
    }
    // bateaux-mouches et péniches, dans le Paris de la Seine
    const ns = S.length;
    for (let b = 0; b < 4; b++) {
      const dir = b % 2 ? 1 : -1, span = Math.floor(ns * 0.62), start = Math.floor(ns * 0.12);
      let u = (t * (1.6 + b * 0.3) + b * 97) % span; if (dir < 0) u = span - u;
      const i = Math.floor(start + u), [x, y, nx, ny] = S[i];
      const tx = -ny, ty = nx;
      const lane = dir > 0 ? 1 : -1;
      const bx = x + nx * lane, by = y + ny * lane;
      for (let q = -2; q <= 2; q++) { ctx.fillStyle = b === 3 ? (night ? "#3a3026" : "#5a4a3a") : night ? "#1d2338" : "#f6f3ea"; ctx.fillRect(Math.round(bx + tx * q), Math.round(by + ty * q), 1, 1); }
      ctx.fillStyle = night ? "#ffd98a" : b === 3 ? "#2c2a28" : "#3d4558"; ctx.fillRect(Math.round(bx), Math.round(by), 1, 1);
      ctx.fillStyle = night ? "rgba(255,217,138,0.35)" : "rgba(235,245,255,0.6)"; ctx.fillRect(Math.round(bx - tx * 4 * dir), Math.round(by - ty * 4 * dir), 1, 1);
    }
    // le périphérique roule, les autoroutes aussi
    const PR = M.periph, pn = PR.length;
    for (let k = 0; k < 70; k++) {
      const dir = k % 2 ? 1 : -1;
      const idx = Math.floor((((k * pn) / 70 + t * (8 + (k % 5)) * dir) % pn + pn) % pn);
      const [x, y, nx, ny] = PR[idx];
      ctx.fillStyle = !night ? (k % 5 ? "#3c4152" : k % 2 ? "#b84a3a" : "#e9edf4") : dir > 0 ? "#fff6d8" : "#ff4a3a";
      ctx.fillRect(Math.round(x + nx * (dir > 0 ? 0.6 : -0.4)), Math.round(y + ny * (dir > 0 ? 0.6 : -0.4)), 1, 1);
    }
    for (const h of M.hwys) for (let k = 0; k < 6; k++) { const n = h.length, dir = k % 2 ? 1 : -1; const idx = Math.floor((((k * n) / 6 + t * 7 * dir) % n + n) % n); const [x, y] = h[idx]; ctx.fillStyle = !night ? "#3c4152" : dir > 0 ? "#fff6d8" : "#ff4a3a"; ctx.fillRect(Math.round(x) + (dir > 0 ? 1 : 0), Math.round(y), 1, 1); }
    // les rames de métro
    M.metro.forEach((m, li) => {
      const n = m.s.length;
      for (let r = 0; r < 3; r++) {
        const u = (Math.sin(t * 0.07 + li * 1.7 + r * 2.1) + 1) / 2;
        const i = Math.floor(u * (n - 1)), back = Math.cos(t * 0.07 + li * 1.7 + r * 2.1) > 0 ? -1 : 1;
        for (let k = 0; k < 5; k++) { const j = Math.max(0, Math.min(n - 1, i + k * back)); const [x, y] = m.s[j]; ctx.fillStyle = k === 0 ? "#ffffff" : m.c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
      }
    });
    // la nuit, des fenêtres s'éteignent et se rallument
    if (B.lit.length) for (let k = 0; k < B.lit.length; k += 5) { if (Math.sin(t * 0.37 + k * 1.3) > 0.9) { const [x, y] = B.lit[k]; ctx.fillStyle = pal.block[0]; ctx.fillRect(x, y, 1, 1); } }
    // la tour Eiffel : le phare, et le scintillement des cinq premières minutes de chaque heure
    if (night) {
      const [ex, ey] = [EIFFEL[0], EIFFEL[1] - 17];
      const a = t * 0.9;
      const L = phase === "nuit" ? 90 : 70, A0 = phase === "nuit" ? 0.5 : 0.36;
      for (const off of [0, Math.PI]) {
        const ca = Math.cos(a + off), sa = Math.sin(a + off);
        for (let r = 2; r < L; r++) {
          const spread = r / 16;
          for (let q = -Math.ceil(spread); q <= Math.ceil(spread); q++) {
            const x = Math.round(ex + ca * r - sa * q), y = Math.round(ey + (sa * r + ca * q) * 0.75);
            const f = (1 - r / L) * (1 - Math.abs(q) / (spread + 1));
            if (x < 0 || y < 0 || x >= W || y >= H || BAYER[y & 3][x & 3] > f * 22) continue;
            ctx.fillStyle = `rgba(255,236,170,${(A0 * f + 0.08).toFixed(3)})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = "#fff6d0"; ctx.fillRect(ex, ey, 1, 1);
      if (st.sparkle) for (let k = 0; k < 14; k++) { if (hash(k, Math.floor(t * 12), 5) < 0.5) continue; const yy = Math.floor(hash(k, 1, Math.floor(t * 12)) * 16), half = Math.max(0, Math.round((16 - yy) / 4)); ctx.fillStyle = "#ffffff"; ctx.fillRect(EIFFEL[0] + Math.round((hash(k, 2, Math.floor(t * 12)) * 2 - 1) * half), EIFFEL[1] - yy, 1, 1); }
    }
    // nuages et leurs ombres
    if (phase !== "nuit") {
      for (let k = 0; k < 3; k++) {
        const cl = cloudSprite(k, phase);
        const span = W + cl.w + 60;
        const x = Math.round(((t * (2.4 + k * 0.7) + k * 190) % span) - cl.w - 30), y = 40 + ((k * 97) % (H - 120));
        ctx.drawImage(cl.s, x + 18, y + 16);
        ctx.globalAlpha = phase === "jour" ? 0.9 : 0.75; ctx.drawImage(cl.c, x, y); ctx.globalAlpha = 1;
      }
    }
    // un avion en approche
    {
      const per = 46, u = (t % per) / per;
      if (u < 0.6) {
        const v = u / 0.6, x = Math.round(-12 + v * (W + 24)), y = Math.round(H * 0.82 - v * H * 0.62);
        if (!night) { ctx.fillStyle = "rgba(8,12,26,0.22)"; ctx.fillRect(x + 10, y + 14, 5, 1); ctx.fillRect(x + 12, y + 13, 1, 3); }
        const body = night ? "#9aa3bd" : "#f4f6fb";
        ctx.fillStyle = body; ctx.fillRect(x - 2, y + 1, 5, 1); ctx.fillRect(x, y - 1, 1, 5); ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x + 2, y, 1, 1);
        if (night) { const bl = Math.floor(t * 3) % 2; ctx.fillStyle = bl ? "#ff4a3a" : "#ffffff"; ctx.fillRect(x, y - 1, 1, 1); ctx.fillStyle = "#3aff7a"; ctx.fillRect(x, y + 3, 1, 1); }
      }
    }
    // trajet vers la destination
    if (st.itin && st.route) {
      // l'itinéraire en métro : marche en pointillé, chaque ligne dans sa couleur, un carré blanc à chaque changement
      const dot = (x, y, c) => { ctx.fillStyle = "#0a0c14"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
      let step = 0;
      const legs = st.itin.legs, n = legs.length;
      legs.forEach((l, li) => {
        const pts = l.pts.map(([a, b]) => proj(a, b));
        if (l.type !== "ride") { pts[l.fin ? pts.length - 1 : 0] = l.fin ? st.route[1] : st.route[0]; if (st.itin.pied) { pts[0] = st.route[0]; pts[1] = st.route[1]; } }
        for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
          for (let k = 0; k <= len; k++, step++) { const x = x0 + (x1 - x0) * k / len, y = y0 + (y1 - y0) * k / len;
            if (l.type === "ride") { ctx.fillStyle = "#0a0c14"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
            else if (step % 3 === 0) dot(x, y, "#f6c96d"); } }
      });
      step = 0;
      legs.forEach((l) => { if (l.type !== "ride") return; const pts = l.pts.map(([a, b]) => proj(a, b));
        for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
          for (let k = 0; k <= len; k++, step++) { const x = x0 + (x1 - x0) * k / len, y = y0 + (y1 - y0) * k / len; ctx.fillStyle = (((step - Math.floor(t * 14)) % 9) + 9) % 9 < 2 ? "#ffffff" : l.c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } }
      });
      legs.forEach((l) => { if (l.type !== "ride") return; for (const g of [l.pts[0], l.pts[l.pts.length - 1]]) { const [x, y] = proj(g[0], g[1]).map(Math.round); ctx.fillStyle = "#0a0c14"; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = l.c; ctx.fillRect(x, y, 1, 1); } });
    } else if (st.route) {
      const [a, b] = st.route;
      const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.18;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(8, Math.ceil(len * 1.3));
      for (let i = 2; i <= n - 2; i++) {
        const u = i / n, x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1];
        if ((((i - Math.floor(t * 12)) % 6) + 6) % 6 > 3) continue;
        ctx.fillStyle = "#0a0c14"; ctx.fillRect(Math.round(x), Math.round(y) + 1, 2, 1); ctx.fillRect(Math.round(x) + 2, Math.round(y), 1, 1);
        ctx.fillStyle = "#f6c96d"; ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
      }
    }
    // lieux hors champ : un panneau d'autoroute au bord
    for (const p of st.pins) if (p.far) {
      const label = `${p.far.route} ${p.far.km} KM`;
      const w = textW(label) + 6, x = Math.round(Math.max(3, Math.min(W - w - 3, p.x + p.dx - w / 2))), y = Math.round(Math.max(3, Math.min(H - 12, p.y + p.dy + 4)));
      const blue = p.far.route[0] === "A" ? "#1f4d8a" : "#b8322a";
      ctx.fillStyle = "#0b0d14"; ctx.fillRect(x - 1, y - 1, w + 2, 10); ctx.fillStyle = blue; ctx.fillRect(x, y, w, 8); ctx.fillStyle = "#e9eef8"; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + 7, w, 1);
      text(ctx, label, x + 3, y + 2, "#ffffff");
    }
    // vous êtes ici : un anneau qui pulse
    if (st.here) {
      const [x, y] = st.here;
      for (const ph of [0, 0.5]) {
        const r = 3 + (((t * 0.9 + ph) % 1) * 11);
        ctx.fillStyle = `rgba(246,201,109,${Math.max(0, 0.85 - r / 15).toFixed(2)})`;
        for (let a = 0; a < 360; a += 10) { const tt = (a * Math.PI) / 180; ctx.fillRect(Math.round(x + Math.cos(tt) * r), Math.round(y + Math.sin(tt) * r * 0.6), 1, 1); }
      }
    }
    // balises
    const ordered = st.pins.slice().sort((a, b) => (a.sel ? 1 : 0) - (b.sel ? 1 : 0) || a.y + a.dy - (b.y + b.dy));
    for (const p of ordered) {
      const px = Math.round(p.x + p.dx), py = Math.round(p.y + p.dy);
      if (p.dx || p.dy) { line(ctx, p.x, p.y, px, py, phase === "jour" ? "#1a1e2a" : "#c9cfe6"); ctx.fillStyle = phase === "jour" ? "#1a1e2a" : "#ffffff"; ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3); ctx.fillStyle = PIN_COL[p.type] || PIN_COL.autre; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
      const lift = p.sel ? Math.round(1 + Math.abs(Math.sin(t * 3.2)) * 3) : 0;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(px - 3 + (lift > 2 ? 1 : 0), py, 7 - (lift > 2 ? 2 : 0), 2);
      ctx.drawImage(pinSprite(p.type, p.glyph, p.sel), px - 6, py - 14 - lift);
      if (p.urgent && Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = "#0b0d14"; ctx.fillRect(px + 4, py - 21 - lift, 5, 8); ctx.fillStyle = "#ec7363"; ctx.fillRect(px + 5, py - 20 - lift, 3, 6); ctx.fillStyle = "#fff"; ctx.fillRect(px + 6, py - 19 - lift, 1, 3); ctx.fillRect(px + 6, py - 15 - lift, 1, 1); }
      if (p.n) { ctx.fillStyle = "#0b0d14"; ctx.fillRect(px - 10, py - 17 - lift, 7, 9); ctx.fillStyle = "#ec7363"; ctx.fillRect(px - 9, py - 16 - lift, 5, 7); text(ctx, String(Math.min(9, p.n)), px - 8, py - 15 - lift, "#ffffff"); }
      if (p.here) drawAvatar(ctx, px + 8, py + 1, t);
    }
  }
  function drawAvatar(ctx, x, y, t) {
    const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
    const bob = Math.floor(t * 2) % 2;
    R(x - 1, y, 6, 1, "rgba(0,0,0,0.45)");
    R(x, y - 3, 1, 3, "#0b0c12"); R(x + 2, y - 3, 1, 3, "#0b0c12");
    R(x - 1, y - 9 + bob, 5, 6 - bob, "#0b0c12"); R(x, y - 8 + bob, 3, 5 - bob, "#2c3044"); R(x + 1, y - 8 + bob, 1, 2, "#f2efe6");
    R(x, y - 11 + bob, 3, 3, "#d4996a"); R(x, y - 12 + bob, 3, 1, "#2a1d16");
    R(x + 3, y - 5, 3, 3, "#0b0c12"); R(x + 4, y - 4, 1, 1, "#6a4426");
  }

  // =================================================================== Modèle : ce que la carte montre
  CR.mapModel = function (s, sel, urgent) {
    const ids = Object.keys(CR.PLACES).filter((id) => !CR.PLACES[id].cache || id === s.at).concat(Object.keys(s.tempPlaces || {}));
    const list = ids.map((id) => {
      const pl = CR.placeOf(s, id);
      return { id, nom: pl.nom, type: id === "domicile" ? "home" : pl.type || "autre", glyph: glyphFor(id, pl), xy: CR.mapXY(id, pl), far: FAR[id] || null,
        sel: id === sel, here: id === s.at, urgent: urgent ? urgent.has(id) : false, n: (s.detenus || []).filter((d) => d.etab === id).length };
    });
    const pins = layoutPins(list);
    const at = (id) => { const p = pins.find((q) => q.id === id); return p ? [p.x + p.dx, p.y + p.dy] : null; };
    const here = at(s.at);
    const dest = sel && sel !== s.at ? at(sel) : null;
    const phase = CR.mapPhase(s.min);
    return { phase, pins, here, route: here && dest ? [here, dest] : null, itin: here && dest && CR.METRO ? CR.METRO.itin(s, s.at, sel) : null, sparkle: phase !== "jour" && s.min % 60 < 5 && s.min >= 17 * 60 };
  };

  // =================================================================== Composant
  // Le dessin se fait à la résolution de la carte (480 × 336), puis il est agrandi d'un facteur entier sans lissage ;
  // l'ajustement final est laissé au navigateur : les pixels restent nets et réguliers à toutes les tailles.
  UI.MapCanvas = ({ model }) => {
    const ref = useRef(null), mref = useRef(model), paintRef = useRef(null);
    mref.current = model;
    useEffect(() => {
      const c = ref.current;
      if (!c) return;
      const low = mk(W, H), lctx = low.getContext("2d"), ctx = c.getContext("2d");
      let k = 0;
      const fit = () => {
        const w = c.clientWidth || W;
        const nk = Math.max(1, Math.min(4, Math.ceil((w * (window.devicePixelRatio || 1)) / W)));
        if (nk !== k) { k = nk; c.width = W * k; c.height = H * k; }
      };
      const paint = (t) => { fit(); frame(lctx, mref.current, t); ctx.imageSmoothingEnabled = false; ctx.drawImage(low, 0, 0, W * k, H * k); const ph = (mref.current && mref.current.phase) || "jour"; if (CR.lum && CR.lum.halo && ph !== "jour") CR.lum.halo(low, ctx, W * k, H * k, ph === "nuit" ? 1.5 : 1, ph === "nuit" ? 120 : 150); };
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let raf = 0, alive = true, last = 0;
      const t0 = performance.now() - 40000;
      const loop = (now) => {
        if (!alive) return;
        if (now - last > 38) { last = now; try { paint((now - t0) / 1000); } catch (e) { console.error(e); alive = false; return; } }
        raf = requestAnimationFrame(loop);
      };
      try { paint(40); } catch (e) { console.error(e); return; }
      paintRef.current = () => paint(40);
      if (!reduce) raf = requestAnimationFrame(loop);
      return () => { alive = false; cancelAnimationFrame(raf); paintRef.current = null; };
    }, []);
    // mouvement réduit : une image fixe, redessinée quand l'état change
    useEffect(() => { if (paintRef.current && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) try { paintRef.current(); } catch (e) { /* rien */ } }, [model]);
    return html`<canvas ref=${ref} width=${W} height=${H} className="map-canvas" role="img" aria-label="Plan de Paris et de la petite couronne : la Seine, le périphérique, les lignes de métro, les juridictions, les commissariats et les prisons"></canvas>`;
  };
  CR.MAP_W = W; CR.MAP_H = H;
  // icône de légende : la même balise qu'en carte
  UI.PinIcon = ({ type, glyph }) => {
    const ref = useRef(null);
    useEffect(() => { const c = ref.current; if (!c) return; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 26, 34); x.drawImage(pinSprite(type, glyph || type, false), 0, 0, 26, 34); }, [type, glyph]);
    return html`<canvas ref=${ref} width="26" height="34" className="lg-pin" aria-hidden="true"></canvas>`;
  };
  CR.mapGlyph = glyphFor;
})();
