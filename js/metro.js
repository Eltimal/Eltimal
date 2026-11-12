/* La Permanence — le réseau réel : métro de Paris (lignes 1 à 14, 3 bis, 7 bis), et ce qu'il faut de RER et de
   Transilien pour rejoindre les lieux de banlieue (CR.METRO).
   État du réseau : novembre 2026 (ligne 14 de Saint-Denis–Pleyel à l'aéroport d'Orly, ligne 11 à Rosny–Bois-Perrier,
   ligne 12 à Mairie d'Aubervilliers, ligne 4 à Bagneux ; la ligne 15 n'est pas en service). Ordre des stations
   écrit de mémoire, lignes 7, 10, 11, 13 et 14 recoupées en ligne le 11 novembre 2026.
   Chaque ligne est une ou plusieurs suites de stations (« Nom@longitude,latitude » pour les stations repères ;
   les autres sont placées par interpolation le long de la ligne, ce qui suffit à l'échelle de la carte).
   Itinéraire : plus court chemin en minutes (marche jusqu'à la station, attente, 1,7 min par interstation de métro,
   correspondances, marche ou bus à l'arrivée). CR.METRO.itin(s, de, vers) → { min, legs } ; CR.travelTime s'en sert. */
(function () {
  const CR = (window.CR = window.CR || {});
  const L = (id, c, kind, seqs, mins) => ({ id, c, kind, seqs, mins: mins || null });
  const LINES = [
    L("1", "#ffcd00", "M", ["La Défense@2.2385,48.8920|Esplanade de La Défense@2.2500,48.8880|Pont de Neuilly@2.2585,48.8855|Les Sablons@2.2720,48.8813|Porte Maillot@2.2826,48.8779|Argentine|Charles de Gaulle–Étoile@2.2950,48.8738|George V|Franklin D. Roosevelt@2.3095,48.8690|Champs-Élysées–Clemenceau@2.3140,48.8677|Concorde@2.3212,48.8656|Tuileries|Palais Royal–Musée du Louvre@2.3365,48.8625|Louvre–Rivoli|Châtelet@2.3470,48.8583|Hôtel de Ville@2.3515,48.8573|Saint-Paul@2.3610,48.8552|Bastille@2.3694,48.8532|Gare de Lyon@2.3733,48.8447|Reuilly–Diderot@2.3868,48.8472|Nation@2.3958,48.8484|Porte de Vincennes@2.4105,48.8470|Saint-Mandé|Bérault|Château de Vincennes@2.4405,48.8443"]),
    L("2", "#003ca6", "M", ["Porte Dauphine@2.2776,48.8714|Victor Hugo|Charles de Gaulle–Étoile|Ternes@2.2985,48.8782|Courcelles|Monceau|Villiers@2.3155,48.8813|Rome@2.3214,48.8823|Place de Clichy@2.3275,48.8836|Blanche|Pigalle@2.3372,48.8822|Anvers|Barbès–Rochechouart@2.3497,48.8838|La Chapelle@2.3605,48.8844|Stalingrad@2.3658,48.8842|Jaurès@2.3705,48.8825|Colonel Fabien@2.3705,48.8775|Belleville@2.3767,48.8722|Couronnes|Ménilmontant|Père Lachaise@2.3875,48.8625|Philippe Auguste|Alexandre Dumas|Avron|Nation"]),
    L("3", "#837902", "M", ["Pont de Levallois–Bécon@2.2805,48.8972|Anatole France|Louise Michel|Porte de Champerret@2.2927,48.8856|Pereire@2.2977,48.8847|Wagram|Malesherbes|Villiers|Europe|Saint-Lazare@2.3256,48.8754|Havre–Caumartin@2.3280,48.8735|Opéra@2.3318,48.8707|Quatre-Septembre|Bourse|Sentier|Réaumur–Sébastopol@2.3522,48.8662|Arts et Métiers@2.3565,48.8655|Temple|République@2.3636,48.8675|Parmentier|Rue Saint-Maur|Père Lachaise|Gambetta@2.3985,48.8650|Porte de Bagnolet|Gallieni@2.4160,48.8645"]),
    L("3 bis", "#6ec4e8", "M", ["Gambetta|Pelleport|Saint-Fargeau|Porte des Lilas@2.4065,48.8770"]),
    L("4", "#cf009e", "M", ["Porte de Clignancourt@2.3445,48.8975|Simplon|Marcadet–Poissonniers@2.3497,48.8913|Château Rouge|Barbès–Rochechouart|Gare du Nord@2.3553,48.8800|Gare de l'Est@2.3581,48.8762|Château d'Eau|Strasbourg–Saint-Denis@2.3542,48.8696|Réaumur–Sébastopol|Étienne Marcel|Les Halles@2.3460,48.8625|Châtelet|Cité@2.3472,48.8550|Saint-Michel@2.3438,48.8534|Odéon@2.3390,48.8521|Saint-Germain-des-Prés@2.3339,48.8539|Saint-Sulpice|Saint-Placide|Montparnasse–Bienvenüe@2.3238,48.8433|Vavin|Raspail@2.3305,48.8390|Denfert-Rochereau@2.3323,48.8336|Mouton-Duvernet|Alésia|Porte d'Orléans@2.3254,48.8230|Mairie de Montrouge|Barbara|Bagneux–Lucie Aubrac@2.3170,48.8035"]),
    L("5", "#ff7e2e", "M", ["Bobigny–Pablo Picasso@2.4490,48.9065|Bobigny–Pantin–Raymond Queneau@2.4257,48.8955|Église de Pantin@2.4130,48.8932|Hoche|Porte de Pantin@2.3920,48.8885|Ourcq|Laumière|Jaurès|Stalingrad|Gare du Nord|Gare de l'Est|Jacques Bonsergent|République|Oberkampf@2.3685,48.8648|Richard-Lenoir|Bréguet–Sabin|Bastille|Quai de la Rapée@2.3660,48.8465|Gare d'Austerlitz@2.3650,48.8425|Saint-Marcel|Campo-Formio|Place d'Italie@2.3557,48.8310"]),
    L("6", "#6eca97", "M", ["Charles de Gaulle–Étoile|Kléber|Boissière|Trocadéro@2.2876,48.8634|Passy|Bir-Hakeim@2.2894,48.8540|Dupleix|La Motte-Picquet–Grenelle@2.2985,48.8490|Cambronne|Sèvres–Lecourbe|Pasteur@2.3127,48.8425|Montparnasse–Bienvenüe|Edgar Quinet|Raspail|Denfert-Rochereau|Saint-Jacques|Glacière|Corvisart|Place d'Italie|Nationale|Chevaleret|Quai de la Gare@2.3727,48.8370|Bercy@2.3797,48.8400|Dugommier|Daumesnil@2.3960,48.8395|Bel-Air|Picpus|Nation"]),
    L("7", "#fa9aba", "M", ["La Courneuve–8 Mai 1945@2.4105,48.9205|Fort d'Aubervilliers|Aubervilliers–Pantin–Quatre Chemins|Porte de la Villette@2.3860,48.8975|Corentin Cariou|Crimée|Riquet|Stalingrad|Louis Blanc@2.3645,48.8812|Château-Landon|Gare de l'Est|Poissonnière|Cadet|Le Peletier|Chaussée d'Antin–La Fayette@2.3335,48.8730|Opéra|Pyramides@2.3345,48.8660|Palais Royal–Musée du Louvre|Pont Neuf@2.3420,48.8585|Châtelet|Pont Marie|Sully–Morland|Jussieu@2.3550,48.8460|Place Monge|Censier–Daubenton|Les Gobelins|Place d'Italie|Tolbiac|Maison Blanche@2.3585,48.8221|Porte d'Italie|Porte de Choisy|Porte d'Ivry|Pierre et Marie Curie|Mairie d'Ivry@2.3835,48.8110", "Maison Blanche|Le Kremlin-Bicêtre|Villejuif–Léo Lagrange|Villejuif–Paul Vaillant-Couturier|Villejuif–Louis Aragon@2.3680,48.7875"]),
    L("7 bis", "#6eca97", "M", ["Louis Blanc|Jaurès|Bolivar|Buttes Chaumont|Botzaris|Place des Fêtes@2.3930,48.8768|Pré-Saint-Gervais@2.3985,48.8800"]),
    L("8", "#e19bdf", "M", ["Balard@2.2785,48.8365|Lourmel|Boucicaut|Félix Faure|Commerce|La Motte-Picquet–Grenelle|École Militaire|La Tour-Maubourg|Invalides@2.3146,48.8610|Concorde|Madeleine@2.3250,48.8700|Opéra|Richelieu–Drouot@2.3385,48.8720|Grands Boulevards|Bonne Nouvelle|Strasbourg–Saint-Denis|République|Filles du Calvaire|Saint-Sébastien–Froissart|Chemin Vert|Bastille|Ledru-Rollin|Faidherbe–Chaligny|Reuilly–Diderot|Montgallet|Daumesnil|Michel Bizot|Porte Dorée|Porte de Charenton@2.4020,48.8335|Liberté|Charenton–Écoles|École Vétérinaire de Maisons-Alfort@2.4225,48.8148|Maisons-Alfort–Stade|Maisons-Alfort–Les Juilliottes|Créteil–L'Échat|Créteil–Université|Créteil–Préfecture@2.4595,48.7797|Pointe du Lac@2.4640,48.7685"]),
    L("9", "#b6bd00", "M", ["Pont de Sèvres@2.2305,48.8297|Billancourt|Marcel Sembat|Porte de Saint-Cloud@2.2570,48.8380|Exelmans|Michel-Ange–Molitor@2.2615,48.8450|Michel-Ange–Auteuil|Jasmin|Ranelagh|La Muette@2.2740,48.8580|Rue de la Pompe|Trocadéro|Iéna|Alma–Marceau@2.3010,48.8645|Franklin D. Roosevelt|Saint-Philippe-du-Roule|Miromesnil@2.3160,48.8735|Saint-Augustin|Havre–Caumartin|Chaussée d'Antin–La Fayette|Richelieu–Drouot|Grands Boulevards|Bonne Nouvelle|Strasbourg–Saint-Denis|République|Oberkampf|Saint-Ambroise|Voltaire|Charonne|Rue des Boulets|Nation|Buzenval|Maraîchers|Porte de Montreuil@2.4107,48.8535|Robespierre|Croix de Chavaux|Mairie de Montreuil@2.4415,48.8622"]),
    L("10", "#c9910d", "M", ["Boulogne–Pont de Saint-Cloud@2.2285,48.8407|Boulogne–Jean Jaurès|Michel-Ange–Molitor|Chardon-Lagache|Mirabeau|Javel–André Citroën@2.2780,48.8462|Charles Michels|Avenue Émile Zola|La Motte-Picquet–Grenelle|Ségur|Duroc@2.3165,48.8470|Vaneau|Sèvres–Babylone@2.3265,48.8515|Mabillon|Odéon|Cluny–La Sorbonne|Maubert–Mutualité|Cardinal Lemoine|Jussieu|Gare d'Austerlitz"]),
    L("11", "#704b1c", "M", ["Châtelet|Hôtel de Ville|Rambuteau|Arts et Métiers|République|Goncourt|Belleville|Pyrénées|Jourdain|Place des Fêtes|Télégraphe|Porte des Lilas|Mairie des Lilas@2.4165,48.8797|Serge Gainsbourg|Romainville–Carnot|Montreuil–Hôpital|La Dhuys|Coteaux Beauclair|Rosny–Bois-Perrier@2.4810,48.8830"]),
    L("12", "#007852", "M", ["Mairie d'Aubervilliers@2.3805,48.9140|Aimé Césaire|Front Populaire@2.3655,48.9068|Porte de la Chapelle@2.3595,48.8975|Marx Dormoy|Marcadet–Poissonniers|Jules Joffrin|Lamarck–Caulaincourt|Abbesses@2.3385,48.8845|Pigalle|Saint-Georges|Notre-Dame-de-Lorette|Trinité–d'Estienne d'Orves|Saint-Lazare|Madeleine|Concorde|Assemblée Nationale|Solférino|Rue du Bac|Sèvres–Babylone|Rennes|Notre-Dame-des-Champs|Montparnasse–Bienvenüe|Falguière|Pasteur|Volontaires|Vaugirard|Convention|Porte de Versailles@2.2877,48.8325|Corentin Celton|Mairie d'Issy@2.2735,48.8240"]),
    L("13", "#6ec4e8", "M", ["Saint-Denis–Université@2.3645,48.9460|Basilique de Saint-Denis|Saint-Denis–Porte de Paris|Carrefour Pleyel|Mairie de Saint-Ouen@2.3340,48.9120|Garibaldi|Porte de Saint-Ouen|Guy Môquet|La Fourche@2.3257,48.8875|Place de Clichy|Liège|Saint-Lazare|Miromesnil|Champs-Élysées–Clemenceau|Invalides|Varenne|Saint-François-Xavier|Duroc|Montparnasse–Bienvenüe|Gaîté|Pernety|Plaisance|Porte de Vanves@2.3054,48.8276|Malakoff–Plateau de Vanves|Malakoff–Rue Étienne Dolet|Châtillon–Montrouge@2.3011,48.8106", "Les Courtilles@2.2845,48.9305|Les Agnettes|Gabriel Péri|Mairie de Clichy|Porte de Clichy@2.3134,48.8946|Brochant@2.3200,48.8905|La Fourche"]),
    L("14", "#62259d", "M", ["Saint-Denis–Pleyel@2.3460,48.9187|Mairie de Saint-Ouen|Saint-Ouen@2.3215,48.9050|Porte de Clichy|Pont Cardinet@2.3150,48.8880|Saint-Lazare|Madeleine|Pyramides|Châtelet|Gare de Lyon|Bercy|Cour Saint-Émilion@2.3866,48.8333|Bibliothèque François Mitterrand@2.3765,48.8299|Olympiades@2.3670,48.8270|Maison Blanche|Hôpital Bicêtre|Villejuif–Gustave Roussy@2.3490,48.7940|L'Haÿ-les-Roses|Chevilly-Larue|Thiais–Orly|Aéroport d'Orly@2.3650,48.7285"]),
    // RER et Transilien : seulement les gares utiles, avec les minutes entre deux gares
    L("A", "#e3051c", "RER", ["Poissy@2.0410,48.9330|Sartrouville@2.1580,48.9375|Nanterre-Préfecture@2.2235,48.8955|La Défense|Charles de Gaulle–Étoile|Auber@2.3295,48.8725|Châtelet–Les Halles@2.3465,48.8610|Gare de Lyon|Nation", "Nanterre-Ville@2.1960,48.8950|Nanterre-Préfecture"], [[9, 8, 3, 4, 3, 3, 3, 3], [4]]),
    L("B", "#5291ce", "RER", ["Villepinte@2.5120,48.9630|Aulnay-sous-Bois@2.4950,48.9320|Gare du Nord|Châtelet–Les Halles|Saint-Michel–Notre-Dame@2.3440,48.8535|Denfert-Rochereau|Bourg-la-Reine@2.3125,48.7805|La Croix de Berny@2.3040,48.7625|Antony@2.3005,48.7545"], [[5, 14, 3, 2, 5, 9, 4, 2]]),
    L("C", "#d9b800", "RER", ["Saint-Michel–Notre-Dame|Gare d'Austerlitz|Bibliothèque François Mitterrand|Juvisy@2.3835,48.6890|Saint-Michel-sur-Orge@2.3070,48.6360"], [[3, 3, 15, 9]]),
    L("D", "#00a88f", "RER", ["Gare du Nord|Châtelet–Les Halles|Gare de Lyon|Juvisy"], [[3, 3, 19]]),
    L("R", "#f3a4ba", "T", ["Gare de Lyon|Melun@2.6555,48.5275"], [[28]]),
    L("L", "#ceadd2", "T", ["Saint-Lazare|La Défense|Versailles-Rive-Droite@2.1350,48.8098"], [[9, 22]]),
  ];
  // Correspondances à pied entre stations de noms différents
  const LIENS = [["Châtelet", "Les Halles", "Châtelet–Les Halles"], ["Opéra", "Auber", "Havre–Caumartin"], ["Saint-Michel", "Saint-Michel–Notre-Dame", "Cluny–La Sorbonne"], ["Saint-Lazare", "Saint-Augustin"], ["Gare du Nord", "La Chapelle"]];
  // Lieux du jeu hors de la carte : coordonnées réelles
  const LOIN = { poissy: [2.0370, 48.9290], fresnes: [2.3222, 48.7570], fleury: [2.3660, 48.6320], melun: [2.6600, 48.5390], gendarmerie: [2.2720, 48.6400] };

  // ------------------------------------------------------------------ stations : position de chacune
  const ST = {};
  for (const ln of LINES) { ln.S = ln.seqs.map((q) => q.split("|").map((t) => { const [name, g] = t.split("@"); const st = (ST[name] = ST[name] || { name, lon: null, lat: null, lines: [] }); if (g) { const [a, b] = g.split(",").map(Number); st.lon = a; st.lat = b; } if (!st.lines.includes(ln.id)) st.lines.push(ln.id); return st; })); }
  for (let pass = 0; pass < 3; pass++) for (const ln of LINES) for (const seq of ln.S) { let last = -1; for (let i = 0; i < seq.length; i++) { if (seq[i].lon == null) continue; if (last >= 0 && i - last > 1) for (let k = last + 1; k < i; k++) { const u = (k - last) / (i - last); seq[k].lon = seq[last].lon + (seq[i].lon - seq[last].lon) * u; seq[k].lat = seq[last].lat + (seq[i].lat - seq[last].lat) * u; seq[k].approx = true; } last = i; } }
  const km = (a, b, c, d) => Math.hypot((a - c) * 73.2, (b - d) * 111.2);

  // ------------------------------------------------------------------ graphe : un nœud par (station, ligne)
  const nodes = [], idx = {};
  const node = (st, ln) => { const k = st.name + "|" + ln.id; if (idx[k] == null) { idx[k] = nodes.length; nodes.push({ st, ln, e: [] }); } return idx[k]; };
  for (const ln of LINES) ln.S.forEach((seq, si) => { for (let i = 0; i < seq.length; i++) { const a = node(seq[i], ln); if (i) { const b = node(seq[i - 1], ln), m = ln.mins ? ln.mins[si][i - 1] : 1.7; nodes[a].e.push([b, m, 0]); nodes[b].e.push([a, m, 0]); } } });
  const group = {}; LIENS.forEach((g, i) => g.forEach((n) => { group[n] = i; }));
  for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) { const A = nodes[a], B = nodes[b]; if (A.ln === B.ln) continue; const same = A.st === B.st, lien = !same && group[A.st.name] != null && group[A.st.name] === group[B.st.name]; if (!same && !lien) continue; const m = (same ? 4 : 7) + (A.ln.kind !== "M" || B.ln.kind !== "M" ? 2 : 0); A.e.push([b, m, 1]); B.e.push([a, m, 1]); }

  const M = (CR.METRO = { LINES, ST, LOIN });
  // Position réelle d'un lieu : ses coordonnées, sinon celles de sa balise sur la carte
  M.geoOf = function (s, id) {
    const pl = CR.placeOf ? CR.placeOf(s, id) : null;
    if (pl && pl.geo) return pl.geo;
    if (LOIN[id]) return LOIN[id];
    if (CR.mapXY && pl) { try { const xy = CR.mapXY(id, pl); if (xy && isFinite(xy[0])) return [2.338 + (xy[0] - 240) / 1610, 48.8605 - (xy[1] - 168) / 2446]; } catch (e) { /* pas de carte */ } }
    return null;
  };
  const acces = (g) => {
    const out = [];
    for (const k in ST) { const st = ST[k]; if (st.lon == null) continue; const d = km(g[0], g[1], st.lon, st.lat); out.push([d, st]); }
    out.sort((a, b) => a[0] - b[0]);
    const pres = out.filter((x) => x[0] <= 0.9).slice(0, 5);
    if (pres.length) return pres.map(([d, st]) => ({ st, min: Math.max(2, Math.round(d * 13 + 1)), bus: false }));
    return out.slice(0, 2).map(([d, st]) => (d <= 1.6 ? { st, min: Math.round(d * 13 + 1), bus: false } : { st, min: Math.round(8 + d * 4), bus: true }));
  };
  // stations de métro les plus proches d'un point (lieu des faits) : [{ nom, lignes, km }]
  M.proches = function (g, n) {
    const out = [];
    for (const k in ST) { const st = ST[k]; if (st.lon == null) continue; const met = st.lines.filter((id) => (LINES.find((l) => l.id === id) || {}).kind === "M"); if (!met.length) continue; out.push({ nom: st.name, lignes: met, km: km(g[0], g[1], st.lon, st.lat) }); }
    return out.sort((a, b) => a.km - b.km).slice(0, n || 3);
  };
  const cache = new Map();
  M.route = function (g0, g1) {
    const key = g0.join(",") + ">" + g1.join(",");
    if (cache.has(key)) return cache.get(key);
    const A = acces(g0), B = acces(g1), N = nodes.length, dist = new Float64Array(N).fill(1e9), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N), start = new Array(N);
    for (const a of A) for (const id of a.st.lines) { const n = idx[a.st.name + "|" + id], c = a.min + (LINES.find((l) => l.id === id).kind === "M" ? 2 : 5); if (c < dist[n]) { dist[n] = c; start[n] = a; } }
    const fin = {}; for (const b of B) for (const id of b.st.lines) fin[idx[b.st.name + "|" + id]] = b;
    let best = -1, bestC = 1e9;
    for (let it = 0; it < N; it++) { let u = -1, du = 1e9; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < du) { du = dist[i]; u = i; } if (u < 0) break; done[u] = 1; if (fin[u] && du + fin[u].min < bestC) { bestC = du + fin[u].min; best = u; } for (const [v, m] of nodes[u].e) if (dist[u] + m < dist[v]) { dist[v] = dist[u] + m; prev[v] = u; } }
    const direct = km(g0[0], g0[1], g1[0], g1[1]), aPied = Math.round(direct * 13 + 1);
    let res;
    if (best < 0 || aPied <= bestC) res = { min: Math.max(3, aPied), legs: [{ type: "walk", min: Math.max(3, aPied), pts: [g0, g1], fin: true }], pied: true };
    else {
      const path = []; for (let u = best; u >= 0; u = prev[u]) path.unshift(u);
      const a = start[path[0]], b = fin[best], legs = [{ type: a.bus ? "bus" : "walk", min: a.min, to: a.st.name, pts: [g0, [a.st.lon, a.st.lat]] }];
      let i = 0;
      while (i < path.length) { let j = i; while (j + 1 < path.length && nodes[path[j + 1]].ln === nodes[path[i]].ln) j++; const ln = nodes[path[i]].ln; if (j > i) { const pts = []; for (let k = i; k <= j; k++) pts.push([nodes[path[k]].st.lon, nodes[path[k]].st.lat]); const seq = ln.S.find((q) => q.includes(nodes[path[j]].st) && q.includes(nodes[path[j - 1]].st)), fwd = seq.indexOf(nodes[path[j]].st) > seq.indexOf(nodes[path[j - 1]].st); legs.push({ type: "ride", line: ln.id, kind: ln.kind, c: ln.c, from: nodes[path[i]].st.name, to: nodes[path[j]].st.name, n: j - i, dir: (fwd ? seq[seq.length - 1] : seq[0]).name, min: Math.round(dist[path[j]] - dist[path[i]]), pts }); } i = j + 1; }
      legs.push({ type: b.bus ? "bus" : "walk", min: b.min, from: b.st.name, pts: [[b.st.lon, b.st.lat], g1], fin: true });
      res = { min: Math.round(bestC), legs, changes: legs.filter((l) => l.type === "ride").length - 1 };
    }
    cache.set(key, res);
    return res;
  };
  M.itin = function (s, from, to) { if (from === to) return null; const a = M.geoOf(s, from), b = M.geoOf(s, to); return a && b ? M.route(a, b) : null; };
  const nomLigne = (l) => (l.kind === "RER" ? "RER " + l.line : l.kind === "T" ? "Transilien " + l.line : "Ligne " + l.line);
  // L'itinéraire en phrases courtes, pour le panneau de la carte
  M.etapes = function (it) {
    if (!it) return [];
    const clair = (c) => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) > 140; };
    return it.legs.map((l) => (l.type === "ride" ? { c: l.c, fg: clair(l.c) ? "#10131c" : "#ffffff", ligne: l.line, kind: l.kind, t: l.kind === "M" ? `${nomLigne(l)}, direction ${l.dir}` : nomLigne(l), d: l.kind === "M" ? `${l.from} → ${l.to} · ${l.n} station${l.n > 1 ? "s" : ""}` : `${l.from} → ${l.to}`, min: l.min }
      : { c: null, t: l.type === "bus" ? (l.fin ? "Bus depuis " + l.from : "Bus jusqu'à " + l.to) : it.pied ? "À pied" : l.fin ? "À pied depuis " + l.from : "À pied jusqu'à " + l.to, d: "", min: l.min }));
  };
  M.polylines = () => LINES.map((ln) => ({ id: ln.id, c: ln.c, kind: ln.kind, seqs: ln.S.map((q) => q.map((st) => [st.lon, st.lat, st.lines.length > 1 || q[0] === st || q[q.length - 1] === st ? 1 : 0])) }));
})();
