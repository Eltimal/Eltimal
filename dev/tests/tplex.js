// Refonte, B1 bis : la copie du dossier par e-Barreau et e-Partage (PLEX). node tests/tplex.js   « échecs: 0 » attendu.
// Demande de copie au cabinet d'instruction de la juridiction = enregistrée ; à une autre structure = réponse, rien
// d'enregistré ; hors liste = erreur ; la copie arrive dans e-Partage avec un lien qui expire ; téléchargée à temps, les
// pièces entrent au dossier ; expirée, la copie est à redemander.
const { boot, sleep } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot(); await sleep(50);
  const EB = CR.EB;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 6 }); s.settings.saisie = "assiste"; s.settings.coach = false; CR.store.s = s;
  s.min = 10 * 60; while (!CR.isOuvrable(s.day)) s.day++;
  const dossier = () => { const cs = CR.GEN.open(s, "ci", {}); cs.status = "active"; cs.proc.copieDemandee = null; cs.proc.copieDelivree = null; return cs; };
  const adr = (cs, code) => EB.annuaire("Tribunal judiciaire", EB.tjDe(s, cs).ville).find((x) => x.code === code).adresse;
  const msg = (cs, a, o = {}) => Object.assign({ a: [a], objet: "Demande de copie du dossier", client: { statut: "Mis en examen", nom: "X", prenom: "Y" }, proc: { ident: "N° d'instruction", numero: EB.tjDe(s, cs).proc || "" }, pj: [], confirme: true, caseId: cs.id }, o);
  // 1. bonne structure : demande enregistrée, copie mise à disposition dans e-Partage
  const cs = dossier();
  ok(EB.envoyer(s, msg(cs, adr(cs, "INSTRUCTION01"))).ok, "la demande de copie ne part pas");
  ok(cs.proc.copieDemandee === s.day, "la demande de copie au cabinet d'instruction n'est pas enregistrée");
  for (let k = 0; k < 20 && !cs.proc.copieDelivree; k++) CR.endDay(s);
  ok(cs.proc.copieDelivree, "la copie n'est jamais délivrée");
  const P = EB.etat(s).partages.find((x) => x.caseId === cs.id);
  ok(P && P.expire > P.day && P.expire - P.day <= 30, "pas de partage, ou lien sans échéance valable", JSON.stringify(P));
  ok(EB.etat(s).recus.some((m) => m.caseId === cs.id && /e-Partage/.test(m.objet) && /expire le/.test(m.corps.join(" "))), "pas d'avis de mise à disposition dans les reçus");
  const avant = cs.docs.length;
  const r = EB.telecharger(s, P);
  ok(r.ok && P.telecharge && cs.docs.length >= avant, "le téléchargement à temps échoue", JSON.stringify(r));
  // 2. mauvaise structure : rien d'enregistré, réponse du service
  const c2 = dossier();
  EB.envoyer(s, msg(c2, adr(c2, "BO")));
  ok(c2.proc.copieDemandee == null, "une demande au bureau d'ordre est enregistrée comme demande de copie");
  for (let k = 0; k < 2; k++) CR.endDay(s);
  ok(EB.etat(s).recus.some((m) => m.caseId === c2.id && /ne relève pas de notre service/.test(m.corps.join(" "))), "le service ne répond pas à la demande mal adressée");
  // 3. hors liste : erreur au débrief
  const c3 = dossier();
  EB.envoyer(s, msg(c3, "greffe.instruction@gmail.com"));
  ok(c3.proc.copieDemandee == null && c3.erreurs.some((e) => e.id === "copie_hors"), "la demande hors liste ne compte pas comme erreur");
  // 4. lien expiré : copie à redemander
  s.min = 10 * 60; while (!CR.isOuvrable(s.day)) s.day++;
  const c4 = dossier();
  EB.envoyer(s, msg(c4, adr(c4, "INSTRUCTION02")));
  for (let k = 0; k < 20 && !c4.proc.copieDelivree; k++) CR.endDay(s);
  const P4 = EB.etat(s).partages.find((x) => x.caseId === c4.id);
  ok(P4, "pas de partage pour le second dossier");
  if (P4) { s.day = P4.expire + 1; const r4 = EB.telecharger(s, P4); ok(!r4.ok && /expiré/.test(r4.msg) && c4.proc.copieDemandee == null, "le lien expiré se télécharge encore, ou la copie n'est pas à redemander", JSON.stringify(r4)); }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
