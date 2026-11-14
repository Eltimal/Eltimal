// Refonte, lot 4b suite : la personnalité à l'audience et la peine motivée par le parquet. node tests/tdebats.js
// « échecs: 0 » attendu. Le président lit le casier, l'enquête sociale rapide, les pièces versées par la défense (ou relève
// qu'aucune ne justifie l'hébergement ou l'emploi dit) ; le parquet motive l'emprisonnement ferme (art. 132-19 CP), se
// prononce sur l'aménagement d'une partie ferme de six mois au plus (132-25) et, en comparution immédiate, sur le maintien
// en détention (art. 397-4 CPP).
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 400) : "")); } };
  const { CR, errors } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 33 }); CR.store.s = s; s.settings.saisie = "libre"; s.settings.parole = "libre";
  const D = CR.DEB;
  const vus = { avecPieces: 0, sansPieces: 0, ferme: 0, amenag: 0, depot: 0, esr: 0 };
  for (let i = 0; i < 800 && (vus.avecPieces < 5 || vus.sansPieces < 5 || vus.ferme < 8 || vus.depot < 2); i++) {
    let cs; try { cs = CR.GEN.open(s, ["ci", "copj"][i % 2], {}); } catch (e) { continue; }
    if (cs.camp === "pc") continue;
    if (i % 2 === 0 && !cs.proc.voie) cs.proc.voie = "ci"; // fixée au déferrement, en jeu
    const api = CR.api(s, cs), x = D.ctx(api); if (!x || !D.actif(api)) continue;
    const A = x.A;
    const def0 = CR.caseDef(cs); if (def0.docs && def0.docs.esr && !CR.hasDoc(cs, "esr")) CR.fileDoc(s, cs, { key: "esr", title: "Enquête sociale rapide" });
    const avec = i % 3 === 0;
    if (avec && A.heberg) CR.addNote(s, cs, { text: "Attestation d'hébergement.", fact: "K_attest", src: "client" });
    const T = D.interrogatoire(api, x).map((l) => l.t || "").join("\n");
    ok(/personnalité|le tribunal doit vous connaître/.test(T) && /casier judiciaire/.test(T), `${cs.id} : pas de phase de personnalité`, T.slice(-500));
    if ((cs.docs || []).some((d) => d.key === "esr")) { vus.esr++; ok(/enquête sociale rapide|enquêtrice sociale/.test(T), `${cs.id} : enquête sociale rapide non lue`); }
    if (avec && A.heberg) { vus.avecPieces++; ok(/La défense a versé une attestation d'hébergement/.test(T), `${cs.id} : la pièce versée n'est pas lue`); }
    else if (!avec && ((A.heberg && !CR.hasDoc(cs, "esr")) || (A.emploi && !A.heberg)) && !CR.hasFact(cs, "K_attest") && !CR.hasFact(cs, "K_promesse") && !CR.hasFact(cs, "G_attest_emploi")) { vus.sansPieces++; ok(/rien au dossier ne le justifie/.test(T), `${cs.id} : l'absence de pièce n'est pas relevée`); }
    if (A.heberg && CR.hasDoc(cs, "esr")) ok(!/rien au dossier ne le justifie/.test(T), `${cs.id} : hébergement vérifié par l'enquête sociale mais dit injustifié`);
    // le réquisitoire
    const def = CR.caseDef(cs), aud = def.audiences && (def.audiences[cs.hearings[0] && cs.hearings[0].script] || Object.values(def.audiences)[0]);
    let steps; try { steps = aud ? aud(api, cs.hearings[0]).steps : null; } catch (e) { steps = null; }
    // les réquisitions peuvent être dans une branche (le prévenu accepte d'être jugé tout de suite) : recherche dans l'arbre
    const chercher = (L) => { for (const st of L || []) { if (!st || typeof st !== "object") continue; if (st.requisitions) return st; for (const k of ["then", "else"]) { const f = Array.isArray(st[k]) && chercher(st[k]); if (f) return f; } if (Array.isArray(st.choose)) for (const c of st.choose) { const f = chercher(c.then); if (f) return f; } } return null; };
    const rq = chercher(steps);
    if (!rq) continue;
    const R = rq.requisitions(api).map((l) => l.t || "").join("\n"), q = cs.vars.requis || {};
    if (q.ferme > 0 && !q.reclusion) {
      vus.ferme++;
      ok(/article 132-19 du code pénal/.test(R), `${cs.id} : emprisonnement ferme requis sans motivation (art. 132-19)`, R.slice(-400));
      if (q.ferme <= 6 && !q.mandatDepot) {
        vus.amenag++; ok(/article 132-25/.test(R), `${cs.id} : partie ferme de six mois au plus sans position sur l'aménagement`);
        const just = CR.hasFact(cs, "K_attest") || CR.hasFact(cs, "K_promesse") || CR.hasFact(cs, "G_attest_emploi") || (A.heberg && CR.hasDoc(cs, "esr"));
        ok(/ne s'oppose pas|ne m'oppose pas/.test(R) === !!just, `${cs.id} : le parquet accepte un aménagement sans garantie justifiée, ou le refuse malgré elle`);
      }
      if (q.mandatDepot && cs.proc.voie === "ci") { vus.depot++; ok(/article 397-4/.test(R), `${cs.id} : maintien en détention requis sans motivation (art. 397-4)`); }
    }
  }
  ok(vus.avecPieces >= 3 && vus.sansPieces >= 3 && vus.ferme >= 5, "trop peu d'audiences", JSON.stringify(vus));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("débats :", JSON.stringify(vus));
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
