// Portraits 64 px : toutes les expressions, les fiches des personnages récurrents, compatibilité des looks enregistrés
const { boot, sleep } = require("./harness");
(async () => {
  const { CR, errors } = boot();
  await sleep(100);
  const PX = CR.px, EX = ["neutral", "talk", "talk2", "smile", "worried", "angry", "cry", "soulage", "defi", "honte"];
  let n = 0, bad = 0;
  const looks = [];
  for (let i = 0; i < 40; i++) looks.push(PX.lookFrom("t19-" + i, { age: 18 + i * 2 }));
  for (const h of ["short", "buzz", "side", "bald", "receding", "curly", "afro", "long", "bun", "bob", "ponytail", "braids", "hijab"]) for (const o of ["shirt", "robe", "uniform", "suit", "hoodie", "scrubs"]) looks.push(PX.lookFrom("h" + h + o, { hair: h, outfit: o }));
  const hand = CR.ACTEURS.map((a) => PX.acteurLook(a)).concat([Object.assign({}, PX.lookFrom("mentor", CR.MENTOR.look), CR.MENTOR.look)]);
  for (const L of looks.concat(hand)) for (const e of EX) for (const bl of [false, true]) { const c = PX.portrait(L, e, bl, !bl); n++; if (!c || c.width !== 64) bad++; }
  const sansFiche = CR.ACTEURS.filter((a) => ["president", "ji", "jld", "parquet", "opj"].includes(a.role) && !PX.HAND[a.id]).map((a) => a.id);
  console.log("portraits:", n, "défauts:", bad, "fiches à la main:", Object.keys(PX.HAND).length, "récurrents sans fiche:", sansFiche.length ? sansFiche.join(" ") : "aucun");
  // un look enregistré dans une ancienne sauvegarde (sans champ nouveau) se dessine et reste le même visage
  const vieux = { g: "f", age: 34, skin: 2, hc: "dkbrown", hair: "bob", glasses: 1, beard: 0, shirt: "#2f4b6e", outfit: "shirt", earring: true, bg: null };
  console.log("ancien look:", !!PX.portrait(vieux, "neutral"), "même graine, même look:", JSON.stringify(PX.lookFrom("Camille Durand")) === JSON.stringify(PX.lookFrom("Camille Durand")), "fiche mentor:", CR.MENTOR.look.hand);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})();
