/* La Permanence — coquille : écran titre, sauvegardes, routage des scènes, menu, fin de carrière */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Icon, Portrait, Btn, Tag, Empty, cx } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const bump = () => CR.store.bump();

  // =================================================================== Réglages de l'appareil : taille du texte, son (CR.prefs, prefs.js)
  UI.Reglages = function Reglages() {
    const [, redraw] = useState(0);
    const P = CR.prefs;
    const set = (k, v) => { CR.prefsSet(k, v); redraw((n) => n + 1); if (k === "son" || k === "volume") CR.SON && CR.SON.jouer("mail"); };
    return html`<div className="reglages">
      <label htmlFor="rg-taille" className="small">Taille du texte</label>
      <div className="rg-tailles" id="rg-taille" role="group" aria-label="Taille du texte">${CR.TAILLES.map(([v, l]) => html`<button type="button" key=${v} className=${cx("rg-t", P.taille === v && "on")} aria-pressed=${P.taille === v} onClick=${() => set("taille", v)}><span style=${{ fontSize: Math.round(15 * v) + "px" }}>Aa</span>${l}</button>`)}</div>
      <label className="check"><input type="checkbox" id="rg-son" checked=${!!P.son} onChange=${(e) => set("son", e.target.checked)} /> Son</label>
      <label htmlFor="rg-vol" className="small">Volume</label>
      <input type="range" id="rg-vol" min="0" max="1" step="0.05" value=${P.volume} disabled=${!P.son} onChange=${(e) => set("volume", +e.target.value)} />
      <label className="check"><input type="checkbox" id="rg-amb" checked=${!!P.ambiance} disabled=${!P.son} onChange=${(e) => set("ambiance", e.target.checked)} /> Ambiance des lieux (cabinet, palais, commissariat, salle d'audience)</label>
      ${CR.SON && !CR.SON.ok && html`<p className="small muted">Ce navigateur ne sait pas produire de son.</p>`}
      <p className="small muted">Tous les sons sont fabriqués par le jeu : rien n'est téléchargé. Ces réglages valent pour cet appareil.</p>
    </div>`;
  };

  // =================================================================== Sauvegardes : compte (par joueur) → navigateur → aucune
  const CHUNK = 180000;
  const Saves = (CR.Saves = {
    backend: "none", db: null, uid: null, downloads: null,
    async init() {
      const local = (() => { try { localStorage.setItem("lp-probe", "1"); localStorage.removeItem("lp-probe"); return true; } catch (e) { return false; } })();
      this.backend = local ? "local" : "none";
      try {
        if (window.claude && window.claude.use) {
          const [db, user, dl] = await Promise.all([window.claude.use("db").catch(() => null), window.claude.use("user").catch(() => null), window.claude.use("downloads").catch(() => null)]);
          this.downloads = dl;
          if (db && user) {
            const uid = await user.id();
            if (uid) { this.db = db; this.uid = uid; this.backend = "cloud"; this.histLoad(); }
          }
        }
      } catch (e) { console.warn("Sauvegardes", e); }
      bump();
    },
    col() { return this.db.collection("data/users/" + this.uid); },
    // Phase 3 : l'historique des signatures d'affaires, commun à toutes les parties (navigateur et compte)
    _histT: null,
    histPush(list) {
      if (this.backend !== "cloud") return;
      clearTimeout(this._histT);
      this._histT = setTimeout(() => { try { this.col().doc("historique").set({ h: list.slice(-6000).join(",") }).catch(() => {}); } catch (e) { /* hors ligne */ } }, 1500);
    },
    async histLoad() {
      if (this.backend !== "cloud" || !CR.GEN2 || !CR.GEN2.histAjouter) return;
      try { const d = await this.col().doc("historique").get(); const x = d && d.exists !== false && d.data ? d.data() : null; if (x && x.h) CR.GEN2.histAjouter(String(x.h).split(",").filter(Boolean)); } catch (e) { console.warn("Historique des affaires", e); }
    },
    localAll() { try { return JSON.parse(localStorage.getItem(CR.SAVE_KEY) || "{}"); } catch (e) { return {}; } },
    async list() {
      const out = [];
      if (this.backend === "cloud") {
        try {
          const snap = await this.col().get();
          snap.docs.forEach((d) => { const x = d.data(); if (/^partie-[a-z0-9]+$/.test(d.id) && x && x.meta) out.push({ slot: d.id.slice(7), meta: x.meta, where: "cloud" }); });
        } catch (e) { console.warn(e); }
      }
      const loc = this.localAll();
      for (const [slot, x] of Object.entries(loc)) if (!out.some((o) => o.slot === slot)) out.push({ slot, meta: x.meta, where: "local" });
      return out.sort((a, b) => (b.meta.savedAt || 0) - (a.meta.savedAt || 0));
    },
    async save(slot, s) {
      const json = CR.serialize(s);
      const meta = CR.saveMeta(s);
      let ok = false;
      if (this.backend === "cloud") {
        try {
          const n = Math.ceil(json.length / CHUNK);
          for (let i = 0; i < n; i++) await this.col().doc(`partie-${slot}-c${i}`).set({ part: json.slice(i * CHUNK, (i + 1) * CHUNK) });
          await this.col().doc("partie-" + slot).set({ meta, chunks: n });
          ok = true;
        } catch (e) { console.warn("Sauvegarde sur le compte impossible", e); }
      }
      try { const all = this.localAll(); all[slot] = { meta, json }; localStorage.setItem(CR.SAVE_KEY, JSON.stringify(all)); ok = true; } catch (e) { /* stockage indisponible */ }
      return ok;
    },
    async load(slot) {
      if (this.backend === "cloud") {
        try {
          const d = await this.col().doc("partie-" + slot).get();
          if (d.exists) {
            const { chunks } = d.data();
            let json = "";
            for (let i = 0; i < chunks; i++) { const c = await this.col().doc(`partie-${slot}-c${i}`).get(); if (!c.exists) throw new Error("morceau manquant"); json += c.data().part; }
            return CR.deserialize(json);
          }
        } catch (e) { console.warn(e); }
      }
      const all = this.localAll();
      return all[slot] ? CR.deserialize(all[slot].json) : null;
    },
    async exportFile(s) {
      if (!this.downloads) return "indisponible";
      try {
        const nom = `${s.player.prenom}-${s.player.nom}`.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "-").toLowerCase();
        await this.downloads.save({ filename: `la-permanence-${nom}-jour${s.day}.json`, data: CR.serialize(s) });
        return "ok";
      } catch (e) { return (e && e.code) || "erreur"; }
    },
  });
  // une affaire jouée par son code a son propre emplacement : la carrière en cours n'est pas touchée
  CR.autosave = () => { const s = CR.store.s; if (s && !s.gameOver && !s.pilote) Saves.save(s.mode === "affaire" ? "affaire" : "auto", s); };

  // =================================================================== Application
  const MODAL_SCENES = ["decide", "conflict", "withdraw", "mentor", "grievance", "library", "permanences"];
  function App() {
    const s = UI.useGame();
    const [ui, setUi] = useState({ panel: "bureau", caseId: null, mail: null, firmSub: null });
    const [scene, setSceneRaw] = useState(null);
    // La scène ouverte désigne le dossier sur lequel le temps est imputé (facturation au temps passé)
    const setScene = (sc) => { const st = CR.store.s; if (st) st.workCase = (sc && sc.caseId) || null; setSceneRaw(sc); };
    const [modal, setModal] = useState(null);
    const [toasts, setToasts] = useState([]);
    useEffect(() => {
      if (!s || !s.toasts.length) return;
      const fresh = s.toasts.splice(0);
      setToasts((t) => t.concat(fresh));
      fresh.forEach((x) => setTimeout(() => setToasts((t) => t.filter((y) => y.id !== x.id)), 4600));
    });
    useEffect(() => { window.scrollTo && window.scrollTo(0, 0); }, [scene && scene.type, ui.panel]);
    UI._setScene = setScene;
    if (CR.SON) CR.SON.sync(s, scene);
    if (!s) return html`<${TitleScreen} />`;
    if (s.gameOver) return html`<${CareerEnd} s=${s} />`;

    const doRun = (cs, t) => {
      const pl = CR.placeOf(s, s.at);
      if (t.where && pl && pl.horaires && t.kind !== "court" && !CR.isOpen(pl, s.day, s.min)) {
        const nx = CR.nextOpening(pl, s.day, s.min);
        if (nx) { setModal({ type: "wait", pl, until: nx.min, cs, t }); return; }
        CR.toast(s, `${pl.nom} est fermé à ${CR.fmtTime(s.min)}. Horaires : ${CR.HORAIRES[pl.horaires].label}.`, "warn");
        bump();
        return;
      }
      if (t.kind === "court") {
        const h = CR.hearingToday(s, cs);
        if (h) {
          if (s.min < h.min) CR.spend(s, h.min - s.min, "idle", { fixed: true, busy: true });
          else if (s.min > h.min + 60 && (h.finDeRole || h.substitue) && !h.lateNoted) { h.lateNoted = true; CR.toast(s, h.substitue ? `${h.substitue} a fait retenir l'affaire : vous plaidez en fin de rôle, sans reproche.` : "Comme convenu avec le greffe, l'affaire a été retenue en fin de rôle.", "info"); }
          else if (s.min > h.min + 60 && !h.lateNoted) { h.lateNoted = true; CR.rep(s, "siege", -3, "en retard à l'audience"); CR.toast(s, `Vous arrivez avec ${CR.fmtDuration(s.min - h.min)} de retard. L'affaire a été retenue en fin de rôle ; le président vous le fait remarquer.`, "bad"); }
        }
      }
      const prevWork = s.workCase;
      s.workCase = cs.id;
      const r = t.run && t.run();
      if (r && r.scene) go.scene(Object.assign({ type: r.scene, caseId: cs.id }, r));
      else s.workCase = prevWork;
      bump();
    };
    const go = {
      nav: (panel, sub) => setUi(Object.assign({}, ui, { panel, firmSub: sub || null, caseId: panel === "dossiers" ? ui.caseId : null })),
      openCase: (id) => setUi(Object.assign({}, ui, { panel: "dossiers", caseId: id })),
      scene: (sc) => { if (s.ring && sc && !MODAL_SCENES.includes(sc.type)) CR.missRing(s); setScene(sc); },
      agenda: (init) => setModal({ type: "agenda", init: init || {} }),
      runTask: (cs, t) => {
        if (!t.enabled) return;
        if (s.burnout) { CR.toast(s, "Vous êtes en arrêt de travail. Reposez-vous.", "warn"); bump(); return; }
        if (CR.tooLate(s) && !s.night) { CR.toast(s, "Il est trop tard pour ça ce soir.", "warn"); bump(); return; }
        if (t.where && t.where !== s.at) { setModal({ type: "travel", to: t.where, then: t.label, cs, t }); return; }
        doRun(cs, t);
      },
      callCase: (id, vm) => {
        const cs = s.cases[id];
        if (!cs) return;
        if (vm) vm.heard = true;
        if (cs.status === "lead") return setScene({ type: "call", caseId: id, call: "intake" });
        if (cs.status === "prospect") {
          if (cs.flags.calledBackDay === s.day) { CR.toast(s, "Vous avez déjà appelé aujourd'hui.", "warn"); bump(); return; }
          cs.flags.calledBackDay = s.day;
          CR.trust(s, cs, -3);
          if (CR.R.chance(s, 0.3)) {
            CR.spend(s, 3, "call");
            CR.toast(s, `${CR.clientName(cs)} ne décroche pas. Vous laissez un message.`, "info");
            CR.schedule(s, { day: CR.nextBusinessDay(s.day), min: CR.R.int(s, 10 * 60, 15 * 60), type: "ringcase", caseId: id, data: { kind: "client", call: "followup" } });
            bump();
            return;
          }
          return setScene({ type: "call", caseId: id, call: "followup" });
        }
        if (cs.status === "active") return setScene({ type: "call", caseId: id, call: (vm && vm.data && vm.data.call) || "update" });
      },
      travel: (to, mode) => { CR.travel(s, to, mode); bump(); },
      permanences: () => setScene({ type: "permanences" }),
      endDay: () => {
        if (!s.night && s.min < 15 * 60 && CR.isBusinessDay(s.day) && !modal) { setModal({ type: "confirmEnd" }); return; }
        go.rentrer();
      },
      // la journée se finit chez soi : le soir à l'appartement, puis le réveil
      rentrer: () => setModal({ type: "soir" }),
      dormir: () => { CR.endDay(s); CR.autosave(); setScene(null); bump(); setUi(Object.assign({}, ui, { panel: "bureau", caseId: null })); setModal(s.night || s.gameOver ? null : { type: "matin" }); },
      endDayNow: () => { CR.endDay(s); CR.autosave(); setModal(null); setScene(null); bump(); setUi(Object.assign({}, ui, { panel: "bureau", caseId: null })); },
      backToBed: () => { const got = CR.backToBed(s); CR.toast(s, `Vous vous recouchez. Vous récupérez ${Math.round(got || 0)} points d'énergie avant le réveil.`, "info"); CR.autosave(); bump(); },
      skip: () => { const n = CR.skipAhead(s); CR.autosave(); CR.toast(s, n > 1 ? `${n} jours ont passé.` : "Une journée a passé.", "info"); bump(); setUi(Object.assign({}, ui, { panel: "bureau", caseId: null })); },
    };
    const answer = (yes) => {
      const r = s.ring;
      if (!r) return;
      s.ring = null;
      if (!yes) { CR.voicemail(s, r); bump(); return; }
      const cs = r.caseId ? s.cases[r.caseId] : null;
      if (r.onAnswer && cs) { const res = CR.runHook(s, cs, r.onAnswer, r.data || {}); if (res && res.scene) setScene(Object.assign({ caseId: cs.id, type: res.scene }, res)); bump(); return; }
      if (r.kind === "greffe" && cs && r.data && r.data.hid) {
        const h = CR.hearingById(cs, r.data.hid);
        CR.spend(s, 2, "call");
        if (h && !h.attended && h.day === s.day) { CR.toast(s, "« Maître, on vous attend. Le président retient l'affaire en fin de rôle. »", "warn"); go.runTask(cs, { id: "court", kind: "court", enabled: true, where: h.lieu || "palais", label: h.title, run: () => ({ scene: "court", hid: h.id }) }); }
        bump();
        return;
      }
      if (r.kind === "lead" && cs) setScene({ type: "call", caseId: cs.id, call: (r.data && r.data.call) || "intake" });
      else if (cs) setScene({ type: "call", caseId: cs.id, call: (r.data && r.data.call) || (cs.status === "prospect" ? "followup" : cs.status === "lead" ? "intake" : "update") });
      bump();
    };
    const endScene = () => { setScene(null); CR.autosave(); bump(); };

    const pendingDeb = !scene && s.pendingDebrief && s.pendingDebrief.length ? s.cases[s.pendingDebrief[0]] : null;

    let sceneEl = null;
    if (scene) {
      const cs = scene.caseId ? s.cases[scene.caseId] : null;
      const P = { s, cs, onDone: endScene };
      const needCase = !["mentor", "grievance", "library", "permanences"].includes(scene.type);
      if (needCase && !cs) sceneEl = null;
      else switch (scene.type) {
        case "call": sceneEl = html`<${UI.CallScene} key=${cs.id + scene.call} ...${P} callKey=${scene.call} />`; break;
        case "neg": sceneEl = html`<${UI.NegScene} ...${P} />`; break;
        case "draft": sceneEl = html`<${UI.DraftScene} key=${cs.id + scene.tpl} ...${P} tplKey=${scene.tpl} />`; break;
        case "decide": sceneEl = html`<${UI.DecideScene} ...${P} hookKey=${scene.key} onScene=${(sc) => setScene(sc)} />`; break;
        case "conflict": sceneEl = html`<${UI.ConflictScene} ...${P} />`; break;
        case "withdraw": sceneEl = html`<${UI.WithdrawScene} ...${P} />`; break;
        case "mentor": sceneEl = html`<${UI.MentorScene} ...${P} />`; break;
        case "grievance": sceneEl = html`<${UI.GrievanceScene} ...${P} gid=${scene.gid} />`; break;
        case "court": sceneEl = html`<${UI.HearingScene} key=${scene.hid} ...${P} hid=${scene.hid} />`; break;
        case "cassation": sceneEl = UI.CassationScene ? html`<${UI.CassationScene} key=${cs.id + "cass"} ...${P} />` : null; break;
        case "gav": sceneEl = html`<${UI.GavScene} key=${cs.id + "gav"} ...${P} />`; break;
        case "library": sceneEl = html`<${UI.Modal} title="Bibliothèque" onClose=${endScene} wide><${UI.LibraryPanel} s=${s} go=${go} area=${scene.area} caseId=${scene.caseId} focus=${scene.focus} /></${UI.Modal}>`; break;
        case "permanences": sceneEl = html`<${UI.Modal} title="Permanences pénales — Ordre des avocats de Paris" onClose=${endScene} wide><${UI.PermanencesBody} s=${s} /></${UI.Modal}>`; break;
        default: sceneEl = null;
      }
    }
    const isModalScene = scene && MODAL_SCENES.includes(scene.type);
    const fullScene = scene && !isModalScene && sceneEl;
    const tutoFin = s.mode === "tutoriel" && s.flags.tutoFini && !s.flags.tutoFiniVu && !scene && !pendingDeb;
    const affFin = CR.GEN2.VIE && CR.GEN2.VIE.affaireFinie(s) && !s.flags.affaireFinieVu && !scene && !pendingDeb;
    // refonte : hors scène, le lieu où l'on est remplit l'écran ; au cabinet, les objets du bureau mènent aux rubriques,
    // et les autres rubriques s'ouvrent en feuille par-dessus (.hub-sheet)
    const back = UI.planOk && UI.planOk("cabinet") && !(fullScene && ["gav", "court"].includes(scene.type));
    const hub = back && !fullScene;
    const hubHot = (id) => { if (id === "telephone" && s.ring) { answer(true); return; } go.nav(id); };
    return html`<div className=${cx("game", fullScene && "in-scene", s.night && "is-night", back && "hub-plan", back && (fullScene || ui.panel !== "bureau") && "hub-sheet")}>
      ${back && html`<${UI.Backdrop} s=${s} onHot=${hub && ui.panel === "bureau" ? hubHot : null} />`}
      <${UI.HUD} s=${s} onMenu=${() => setModal({ type: "menu" })} onNav=${go.nav} />
      ${!fullScene && !hub && html`<${UI.Stage} s=${s} onNav=${go.nav} onAnswer=${answer} />`}
      ${!fullScene && html`<${UI.RingBar} s=${s} onAnswer=${answer} />`}
      ${fullScene ? html`<main className="scene-host">
          <div className="scene-top"><span className="pix">${scene.caseId && s.cases[scene.caseId] ? CR.caseTitle(s, s.cases[scene.caseId]) : ""}</span></div>
          ${sceneEl}
        </main>` : html`<div className="main">
        <${UI.Rail} s=${s} panel=${ui.panel} onNav=${go.nav} />
        <section className="panel-host">
          ${ui.panel === "bureau" && html`<${UI.TodayPanel} s=${s} go=${go} />`}
          ${ui.panel === "messagerie" && html`<${UI.InboxPanel} s=${s} go=${go} sel=${ui.mail} setSel=${(id) => setUi(Object.assign({}, ui, { mail: id }))} />`}
          ${ui.panel === "telephone" && html`<${UI.PhonePanel} s=${s} go=${go} />`}
          ${ui.panel === "dossiers" && html`<${UI.CasesPanel} s=${s} go=${go} caseId=${ui.caseId} setCase=${(id) => setUi(Object.assign({}, ui, { caseId: id }))} />`}
          ${ui.panel === "agenda" && html`<${UI.CalendarPanel} s=${s} go=${go} />`}
          ${ui.panel === "carte" && html`<${UI.MapPanel} s=${s} go=${go} />`}
          ${ui.panel === "bibliotheque" && html`<${UI.LibraryPanel} s=${s} go=${go} />`}
          ${ui.panel === "cabinet" && html`<${UI.FirmPanel} s=${s} go=${go} sub=${ui.firmSub} />`}
          ${ui.panel === "classeur" && html`<${UI.ClasseurPanel} s=${s} go=${go} />`}
          ${ui.panel === "journal" && html`<${UI.JournalPanel} s=${s} go=${go} />`}
        </section>
      </div>`}
      ${isModalScene && sceneEl}
      <${UI.TravelFX} s=${s} />
      ${modal && modal.type === "agenda" && html`<${UI.AgendaDialog} s=${s} init=${modal.init} onClose=${() => setModal(null)} />`}
      ${modal && modal.type === "travel" && html`<${UI.TravelDialog} s=${s} to=${modal.to} then=${modal.then} onClose=${() => setModal(null)} onGo=${(mode) => { const m = modal; setModal(null); const prevWork = s.workCase; if (m.cs) s.workCase = m.cs.id; CR.travel(s, m.to, mode); s.workCase = prevWork; if (m.cs && m.t) doRun(m.cs, m.t); bump(); }} />`}
      ${modal && modal.type === "menu" && html`<${MenuModal} s=${s} onClose=${() => setModal(null)} />`}
      ${modal && modal.type === "wait" && html`<${UI.Modal} title=${`${modal.pl.nom} : fermé`} onClose=${() => setModal(null)} footer=${html`<${Btn} onClick=${() => setModal(null)}>Faire autre chose</${Btn}><${Btn} kind="primary" onClick=${() => { const m = modal; setModal(null); CR.spend(s, m.until - s.min, "idle", { fixed: true }); doRun(m.cs, m.t); bump(); }}>Attendre jusqu'à ${CR.fmtTime(modal.until)}</${Btn}>`}><p>Il est ${CR.fmtTime(s.min)}. ${CR.HORAIRES[modal.pl.horaires].label}.</p><p className="small muted">Attendre sur un banc du hall coûte peu d'énergie, mais le temps passe pour tous vos dossiers.</p></${UI.Modal}>`}
      ${modal && modal.type === "confirmEnd" && html`<${UI.Modal} title="Rentrer si tôt ?" onClose=${() => setModal(null)} footer=${html`<${Btn} onClick=${() => setModal(null)}>Rester</${Btn}><${Btn} kind="primary" onClick=${go.rentrer}>Rentrer</${Btn}>`}><p>Il n'est que ${CR.fmtTime(s.min)} un jour ouvré. Les appels de l'après-midi iront sur la messagerie vocale. Un après-midi tranquille aide à récupérer.</p></${UI.Modal}>`}
      ${modal && modal.type === "soir" && html`<${UI.Modal} wide className="chez-soi" title="Chez vous" onClose=${() => setModal(null)} footer=${html`<${Btn} onClick=${() => setModal(null)}>Finalement, rester</${Btn}><${Btn} kind="primary" icon="moon" onClick=${go.dormir}>Dormir</${Btn}>`}>
        <div className="chez-soi-art"><${UI.Panorama} name="domicile" opts=${Object.assign(CR.dec.stageOpts(s), { unread: 0, ringing: false })} /></div>
        <p>Il est ${CR.fmtTime(s.min)}. Vous posez la robe et le cartable. Une nuit à cette heure-ci vous rendra environ ${Math.round(CR.recoveryFor(s))} points d'énergie.</p>
        ${s.ring && html`<p className="small muted">Le téléphone sonne encore : si vous dormez, l'appel ira sur la messagerie vocale.</p>`}
      </${UI.Modal}>`}
      ${modal && modal.type === "matin" && html`<${UI.Modal} wide className="chez-soi" title=${CR.fmtDate(s.day, "long")} onClose=${() => setModal(null)} footer=${html`<${Btn} kind="primary" onClick=${() => setModal(null)}>Partir au cabinet</${Btn}>`}>
        <div className="chez-soi-art"><${UI.Panorama} name="domicile" opts=${Object.assign(CR.dec.stageOpts(s), { min: CR.DAY_START - 50, unread: 0, ringing: false })} /></div>
        <p>Vous avez dormi${s.lastDayStats ? html` et récupéré ${Math.round(s.lastDayStats.rec)} points d'énergie` : ""}. Le café est chaud, il est temps d'y aller.</p>
      </${UI.Modal}>`}
      ${pendingDeb && !modal && html`<${UI.DebriefModal} s=${s} cs=${pendingDeb} onClose=${() => { pendingDeb.debrief.seen = true; s.pendingDebrief.shift(); CR.autosave(); bump(); }} />`}
      ${tutoFin && !modal && html`<${TutoFin} s=${s} />`}
      ${affFin && !modal && html`<${AffaireFin} s=${s} />`}
      <div className="toasts" aria-live="polite">${toasts.map((t) => html`<div key=${t.id} className=${cx("toast", "t-" + t.kind)}>${t.text}</div>`)}</div>
    </div>`;
  }

  // =================================================================== Fin d'une affaire jouée par son code
  function AffaireFin({ s }) {
    const close = () => { s.flags.affaireFinieVu = true; bump(); };
    const rejouer = () => { const p = s.player; const r = CR.newAffaire({ code: s.affaire.code, camp: s.affaire.camp, prenom: p.prenom, nom: p.nom, cabinet: p.cabinet, look: p.look }); if (r.ok) { CR.store.s = r.s; CR.autosave(); bump(); } };
    const titre = () => { CR.autosave(); CR.store.s = null; bump(); };
    return html`<${UI.Modal} title="Affaire terminée" onClose=${close} footer=${html`<${Btn} onClick=${close}>Rester</${Btn}><${Btn} onClick=${rejouer}>Rejouer ce code</${Btn}><${Btn} kind="primary" onClick=${titre}>Écran titre</${Btn}>`}>
      <p>L'affaire est close ; sa fiche de révision est dans le classeur. Vous pouvez la rejouer à l'identique, ou partager son code.</p>
      <p><${UI.CodeAffaire} code=${s.affaire && s.affaire.code} /></p>
    </${UI.Modal}>`;
  }

  // =================================================================== Fin du tutoriel
  function TutoFin({ s }) {
    const close = () => { s.flags.tutoFiniVu = true; bump(); };
    const carriere = () => {
      const p = s.player;
      CR.store.s = CR.newGame({ prenom: p.prenom, nom: p.nom, cabinet: p.cabinet, look: p.look, mode: "carriere" });
      CR.autosave();
      bump();
    };
    return html`<${UI.Modal} title="Tutoriel terminé" onClose=${close} footer=${html`<${Btn} onClick=${close}>Rester dans le tutoriel</${Btn}><${Btn} kind="primary" onClick=${carriere}>Ouvrir son cabinet</${Btn}>`}>
      <p>Vous avez vu la même bagarre des deux côtés de la barre : la victime qui demande réparation, le prévenu qui se défend. Les fiches de révision des deux chapitres sont dans votre classeur.</p>
      <p>La carrière commence le lundi 2 novembre 2026, avec un prêt, un bureau en sous-location dans le 17e et un téléphone qui va sonner. Personne ne vous rappellera aucun délai.</p>
    </${UI.Modal}>`;
  }

  // =================================================================== Menu
  function MenuModal({ s, onClose }) {
    const [saves, setSaves] = useState(null);
    const [msg, setMsg] = useState("");
    const [confirmQuit, setConfirmQuit] = useState(false);
    const [confirmRetire, setConfirmRetire] = useState(false);
    useEffect(() => { Saves.list().then(setSaves); }, []);
    const doSave = async (slot) => { const ok = await Saves.save(slot, s); setMsg(ok ? `Partie enregistrée dans l'emplacement ${slot}.` : "Ce navigateur ne peut pas enregistrer. Exportez un fichier."); setSaves(await Saves.list()); };
    return html`<${UI.Modal} title="Menu" onClose=${onClose} wide>
      <div className="menu-grid">
        <div>
          <h3>Enregistrer</h3>
          <p className="small muted">${Saves.backend === "cloud" ? "Vos parties sont enregistrées avec votre compte et vous suivent d'un appareil à l'autre." : Saves.backend === "local" ? "Vos parties sont enregistrées dans ce navigateur seulement. Exportez un fichier pour en garder une copie." : "Ce navigateur ne peut pas enregistrer. Exportez un fichier."}</p>
          <div className="save-slots">${["1", "2", "3"].map((k) => html`<${Btn} key=${k} onClick=${() => doSave(k)}>Emplacement ${k}</${Btn}>`)}</div>
          ${Saves.downloads && html`<${Btn} onClick=${async () => { const r = await Saves.exportFile(s); setMsg(r === "ok" ? "Fichier exporté." : r === "declined" ? "Export annulé." : "L'export n'est pas disponible ici."); }}>Exporter un fichier de sauvegarde</${Btn}>`}
          ${msg && html`<p className="small">${msg}</p>`}
          <h3>Réglages</h3>
          <${UI.Reglages} />
          <label htmlFor="ts" className="small">Vitesse du texte</label>
          <select id="ts" value=${s.settings.textSpeed} onChange=${(e) => { s.settings.textSpeed = +e.target.value; bump(); }}>
            <option value="0.7">Lente</option><option value="1">Normale</option><option value="1.4">Rapide</option><option value="2">Très rapide</option>
          </select>
          <p className="small muted">La fatigue accélère encore le texte. C'est voulu.</p>
          <label htmlFor="saisie" className="small">Saisie des articles</label>
          <select id="saisie" value=${CR.saisieMode(s)} onChange=${(e) => { s.settings.saisie = e.target.value; bump(); }}>
            ${CR.SAISIE_MODES.map(([k, l, d]) => html`<option key=${k} value=${k}>${l} — ${d}</option>`)}
          </select>
          <p className="small muted">Dans les actes et à l'audience, vous tapez le numéro de l'article au lieu de le choisir. Les articles ratés reviennent dans le classeur.</p>
          <label className="check"><input type="checkbox" id="indices" checked=${!!s.settings.indices} onChange=${(e) => { s.settings.indices = e.target.checked; bump(); }} /> Mode assisté : un indice après un moment passé sur une pièce</label>
          <p className="small muted">Sans ce réglage, rien ne vous signale une irrégularité : à vous de lire les heures, les mentions et les signatures.</p>
          <label className="check"><input type="checkbox" id="coach" checked=${!!s.settings.coach} onChange=${(e) => { s.settings.coach = e.target.checked; bump(); }} /> Conseils de Me Varenne à la première rencontre</label>
          ${s.settings.coach && Object.keys(s.seen || {}).length > 0 && html`<button className="link small" onClick=${() => { s.seen = {}; bump(); }}>Revoir tous les conseils</button>`}
        </div>
        <div>
          <h3>Charger</h3>
          ${saves == null ? html`<p className="muted small">Chargement…</p>` : saves.length === 0 ? html`<${Empty}>Aucune partie enregistrée.</${Empty}>` : html`<ul className="save-list">${saves.map((x) => html`<li key=${x.slot}><div><strong>${x.slot === "auto" ? "Sauvegarde automatique" : "Emplacement " + x.slot}</strong><span className="small muted">${x.meta.nom} · ${x.meta.date} · ${CR.money(x.meta.cash)}${x.meta.mode === "tutoriel" ? " · tutoriel" : ""}</span></div><${Btn} small onClick=${async () => { const st = await Saves.load(x.slot); if (st) { CR.store.s = st; bump(); onClose(); } }}>Charger</${Btn}></li>`)}</ul>`}
          <h3>Carrière</h3>
          ${s.mode === "carriere" && (!confirmRetire ? html`<${Btn} onClick=${() => setConfirmRetire(true)}>Quitter la profession</${Btn}>` : html`<${Btn} kind="danger" onClick=${() => { CR.endGame(s, "retraite", "Vous avez rendu votre robe, à votre heure."); bump(); onClose(); }}>Confirmer : rendre la robe</${Btn}>`)}
          ${!confirmQuit ? html`<${Btn} kind="ghost" onClick=${() => setConfirmQuit(true)}>Retour à l'écran titre</${Btn}>` : html`<${Btn} kind="danger" onClick=${() => { CR.autosave(); CR.store.s = null; bump(); }}>Quitter (partie enregistrée)</${Btn}>`}
          <p className="small muted">La Permanence, version ${CR.JEU.version} (${CR.JEU.date}).</p>
          <p className="small muted">Le droit du jeu est à jour de novembre 2026 : les réformes récentes, les peines et les délais sensibles ont été vérifiés en ligne. Les textes sont des résumés rédigés pour le jeu : à relire sur Légifrance avant tout usage réel. Les magistrats, policiers, confrères et clients sont fictifs ; les lieux sont réels.</p>
        </div>
      </div>
    </${UI.Modal}>`;
  }

  // =================================================================== Jouer une affaire par son code
  function CodeBox({ onBack, player }) {
    const G = CR.GEN2;
    const [code, setCode] = useState("");
    const [camp, setCamp] = useState(null);
    const [crit, setCrit] = useState({ fam: "", nature: "", camp: "", irr: "", niveau: "" });
    const [essai, setEssai] = useState(0);
    const [msg, setMsg] = useState("");
    const A = useMemo(() => (code.trim().length >= 3 ? G.VIE.apercu(code) : null), [code]);
    const camps = A && A.ok ? A.camps : [];
    const campChoisi = camp && camps.includes(camp) ? camp : camps[0];
    const jouer = () => { const r = CR.newAffaire(Object.assign({ code, camp: campChoisi }, player)); if (!r.ok) { setMsg(r.msg); return; } CR.store.s = r.s; CR.autosave(); bump(); };
    const chercher = () => {
      const c0 = {};
      for (const k of Object.keys(crit)) if (crit[k] !== "") c0[k] = k === "irr" ? crit[k] === "oui" : k === "niveau" ? +crit[k] : crit[k];
      const r = G.codeParCriteres(c0, { essai });
      setEssai(essai + 1);
      if (!r.ok) { setMsg(r.msg); return; }
      setMsg("");
      setCode(r.code);
      if (c0.camp) setCamp(c0.camp);
    };
    const sel = (k, label, opts) => html`<div><label htmlFor=${"cr-" + k}>${label}</label><select id=${"cr-" + k} value=${crit[k]} onChange=${(e) => setCrit(Object.assign({}, crit, { [k]: e.target.value }))}><option value="">Indifférent</option>${opts.map(([v, t]) => html`<option key=${v} value=${v}>${t}</option>`)}</select></div>`;
    return html`<div className="ts-box code-box">
      <p className="ts-box-title">Jouer une affaire par son code</p>
      <p className="small">Chaque affaire générée a un code (dans le dossier et sur la fiche de révision). Il la rejoue à l'identique, hors carrière : la partie en cours n'est pas touchée.</p>
      <label htmlFor="code-in">Code d'affaire</label>
      <input id="code-in" type="text" value=${code} placeholder="COP-7K4Q-9XFB" autoComplete="off" spellCheck=${false} onChange=${(e) => { setCode(e.target.value); setMsg(""); }} />
      ${A && !A.ok && html`<p className="warn-txt small" role="alert">${A.msg}</p>`}
      ${A && A.ok && html`<div className="code-apercu small">
        <p><strong>${A.c.code}</strong> · ${A.genreLib} · ${A.infraction}</p>
        <p>${A.lieu} · ${A.tribunal} · difficulté ${["", "facile", "moyenne", "difficile"][A.difficulte]}</p>
        ${A.avert && html`<p className="muted">${A.avert}</p>`}
        ${camps.length > 1 && html`<div className="code-camps" role="radiogroup" aria-label="Votre camp">${camps.map((k) => html`<label key=${k}><input type="radio" name="code-camp" checked=${campChoisi === k} onChange=${() => setCamp(k)} /> ${k === "pc" ? "Partie civile (la victime)" : "Défense"}</label>`)}</div>`}
        ${camps.length > 1 && html`<p className="muted">Mêmes faits, mêmes personnes, de l'autre côté de la barre${A.c.genre === "info" ? " ; le cours de l'instruction est celui que vit ce camp" : ""}.</p>`}
      </div>`}
      <button type="button" className="ts-btn ts-primary" disabled=${!(A && A.ok)} onClick=${jouer}>Jouer cette affaire</button>
      ${msg && html`<p className="warn-txt small" role="alert">${msg}</p>`}
      <details className="code-crit">
        <summary>Construire un code à partir de critères</summary>
        <div className="form form-grid">
          ${sel("fam", "Famille d'infraction", Object.entries(CR.CAT.FAMILLES))}
          ${sel("nature", "Délit ou crime", [["delit", "Délit"], ["crime", "Crime"]])}
          ${sel("camp", "Camp", [["defense", "Défense"], ["pc", "Partie civile"]])}
          ${sel("irr", "Irrégularité de procédure", [["oui", "Avec"], ["non", "Sans"]])}
          ${sel("niveau", "Difficulté", [["1", "Facile"], ["2", "Moyenne"], ["3", "Difficile"]])}
        </div>
        <button type="button" className="ts-btn ts-btn-sm" onClick=${chercher}>${essai ? "Une autre affaire" : "Trouver une affaire"}</button>
      </details>
      <button type="button" className="ts-btn ts-btn-sm" onClick=${onBack}>Retour</button>
    </div>`;
  }

  // =================================================================== Écran titre
  function TitleScreen() {
    const [mode, setMode] = useState("menu");
    const [prenom, setPrenom] = useState("");
    const [nom, setNom] = useState("");
    const [cabinet, setCabinet] = useState("");
    const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
    const [saves, setSaves] = useState(null);
    const fileRef = useRef(null);
    useEffect(() => { Saves.list().then(setSaves); }, [Saves.backend]);
    const auto = saves && saves.find((x) => x.slot === "auto");
    const look = useMemo(() => CR.px.lookFrom("joueur" + seed, { outfit: "robe", age: 28 }), [seed]);
    // Tranche pilote de la refonte : une garde à vue de nuit, sans sauvegarde (s.pilote coupe CR.autosave)
    const pilote = () => {
      const st = CR.newGame({ prenom: prenom.trim() || "Camille", nom: nom.trim() || "Durand", look, mode: "carriere" });
      st.pilote = true; st.settings.coach = false; st.min = 2 * 60 + 15; st.at = "commissariat";
      const cs = CR.openCase(st, "a02_sac");
      CR.store.s = st; bump();
      setTimeout(() => { if (UI._setScene && CR.store.s === st) UI._setScene({ type: "gav", caseId: cs.id }); }, 80);
    };
    const start = (m, debut) => {
      const p = prenom.trim() || "Camille";
      const n = nom.trim() || "Durand";
      CR.store.s = CR.newGame({ prenom: p, nom: n, cabinet: cabinet.trim() || `Cabinet ${n}`, look, mode: m });
      if (debut === "collab" && CR.CAR) CR.CAR.demarrerCollab(CR.store.s);
      CR.autosave();
      bump();
    };
    const importFile = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try { CR.store.s = CR.deserialize(rd.result); bump(); } catch (err) { console.warn(err); alertMsg("Ce fichier n'est pas une sauvegarde de La Permanence."); } };
      rd.readAsText(f);
    };
    const [err, alertMsg] = useState("");
    const [clock, setClock] = useState(() => new Date());
    useEffect(() => { const id = setInterval(() => setClock(new Date()), 10000); return () => clearInterval(id); }, []);
    const hh = clock.getHours(), mm = String(clock.getMinutes()).padStart(2, "0");
    const nuit = hh >= 21 || hh < 7;
    const others = saves ? saves.filter((x) => x.slot !== "auto") : [];
    return html`<div className="ts">
      <${UI.TitleArt} />
      <div className="ts-ui">
        <div className="ts-panel">
          <header className="ts-head">
            <${UI.PixelBalance} size=${4} />
            <p className="ts-eyebrow">Barreau de Paris · Nuit de permanence</p>
            <h1 className="ts-title"><span>La</span>Permanence</h1>
            <p className="ts-clock">Il est ${hh}<span className="ts-colon"> h </span>${mm}. ${nuit ? "Le téléphone peut sonner à tout moment." : "Le téléphone sonnera cette nuit."}</p>
          </header>
          ${mode === "menu" && html`<div className="ts-menu-wrap">
            <p className="ts-sub">Vous venez de prêter serment. Un prêt, un bureau en sous-location dans le 17e, et un téléphone qui sonnera à deux heures du matin. Chaque délai est réel ; personne ne vous en rappellera aucun.</p>
            <nav className="ts-menu" aria-label="Menu principal">
              ${auto && html`<button type="button" className="ts-btn ts-primary" onClick=${async () => { const st = await Saves.load("auto"); if (st) { CR.store.s = st; bump(); } }}>Reprendre<small>${auto.meta.nom} · ${auto.meta.date}${auto.meta.mode === "tutoriel" ? " · tutoriel" : ""}</small></button>`}
              <button type="button" className=${cx("ts-btn", !auto && "ts-primary")} onClick=${() => setMode("new")}>Nouvelle partie</button>
              <button type="button" className="ts-btn" onClick=${() => setMode("code")}>Jouer une affaire par son code</button>
              ${UI.planOk && UI.planOk("entretien") && html`<button type="button" className="ts-btn" onClick=${pilote}>Tranche pilote<small>Refonte : l'entretien de garde à vue · rien n'est enregistré</small></button>`}
              ${others.length > 0 && html`<button type="button" className="ts-btn" onClick=${() => setMode("load")}>Charger une partie</button>`}
              <button type="button" className="ts-btn" onClick=${() => fileRef.current && fileRef.current.click()}>Importer une sauvegarde</button>
              <button type="button" className="ts-btn" onClick=${() => setMode("reglages")}>Réglages</button>
              <input type="file" accept=".json,application/json" ref=${fileRef} hidden onChange=${importFile} />
            </nav>
            ${err && html`<p className="warn-txt small">${err}</p>`}
          </div>`}
          ${mode === "code" && html`<${CodeBox} onBack=${() => setMode("menu")} player=${{ prenom: prenom.trim() || "Camille", nom: nom.trim() || "Durand", cabinet: cabinet.trim(), look }} />`}
          ${mode === "reglages" && html`<div className="ts-box">
            <p className="ts-box-title">Réglages</p>
            <${UI.Reglages} />
            <button type="button" className="ts-btn ts-btn-sm" onClick=${() => setMode("menu")}>Retour</button>
          </div>`}
          ${mode === "load" && html`<div className="ts-box">
            <p className="ts-box-title">Charger une partie</p>
            <ul className="save-list">${others.map((x) => html`<li key=${x.slot}><div><strong>Emplacement ${x.slot}</strong><span className="small muted">${x.meta.nom} · ${x.meta.date}</span></div><${Btn} small onClick=${async () => { const st = await Saves.load(x.slot); if (st) { CR.store.s = st; bump(); } }}>Charger</${Btn}></li>`)}</ul>
            <button type="button" className="ts-btn ts-btn-sm" onClick=${() => setMode("menu")}>Retour</button>
          </div>`}
          ${mode === "new" && html`<div className="ts-box">
            <p className="ts-box-title">Prestation de serment</p>
            <div className="new-career">
              <div className="nc-portrait"><${Portrait} look=${look} size=${96} /><button type="button" className="ts-btn ts-btn-sm" onClick=${() => setSeed(Math.floor(Math.random() * 1e6))}>Un autre visage</button></div>
              <div className="form">
                <div className="form-row">
                  <div><label htmlFor="nc-prenom">Prénom</label><input id="nc-prenom" type="text" value=${prenom} placeholder="Camille" onChange=${(e) => setPrenom(e.target.value)} /></div>
                  <div><label htmlFor="nc-nom">Nom</label><input id="nc-nom" type="text" value=${nom} placeholder="Durand" onChange=${(e) => setNom(e.target.value)} /></div>
                </div>
                <label htmlFor="nc-cab">Nom du cabinet</label>
                <input id="nc-cab" type="text" value=${cabinet} placeholder=${`Cabinet ${nom.trim() || "Durand"}`} onChange=${(e) => setCabinet(e.target.value)} />
              </div>
            </div>
            <div className="mode-pick">
              <button className="decide-opt" onClick=${() => start("tutoriel")}><strong>Tutoriel : la bagarre devant le bar</strong><span className="small muted">Une même affaire jouée deux fois : d'abord pour la victime, Lucas, puis pour l'auteur, Thomas. Me Varenne explique l'interface et chaque étape, jamais la réponse. Environ une heure.</span></button>
              <button className="decide-opt" onClick=${() => start("carriere")}><strong>Carrière — à votre compte</strong><span className="small muted">Lundi 2 novembre 2026. 6 200 € sur le compte professionnel, un prêt d'installation de 15 000 €, un découvert de 5 000 €. Les permanences de l'Ordre, les commissions d'office, puis vos propres clients.</span></button>
              <button className="decide-opt" onClick=${() => start("carriere", "collab")}><strong>Carrière — collaborateur dans un cabinet</strong><span className="small muted">Même date. Ni prêt ni loyer : une rétrocession d'honoraires de 3 700 € par mois, le minimum de l'Ordre. En échange, les dossiers du cabinet prennent vos matinées, et il vous reste moins d'énergie pour vos clients personnels. Un début plus calme ; vous pourrez vous installer ou vous associer.</span></button>
            </div>
            <button type="button" className="ts-btn ts-btn-sm" onClick=${() => setMode("menu")}>Retour</button>
          </div>`}
          <p className="ts-note">${Saves.backend === "cloud" ? "Progression enregistrée avec votre compte." : Saves.backend === "local" ? "Progression enregistrée dans ce navigateur." : "Ce navigateur ne peut pas enregistrer : exportez un fichier depuis le menu."} Personnages fictifs, lieux réels. Droit à jour de novembre 2026 ; textes résumés pour le jeu.</p>
          <p className="ts-version">Version ${CR.JEU.version} · ${CR.JEU.date} · fonctionne sans réseau</p>
        </div>
      </div>
    </div>`;
  }

  // =================================================================== Fin de carrière
  function CareerEnd({ s }) {
    const ans = (s.day / 365).toFixed(1).replace(".", ",");
    const reason = { radie: "Radiation", faillite: "Le cabinet a fermé", retraite: "Robe rendue" }[s.gameOver.reason] || "Fin de carrière";
    return html`<div className="title-screen career-end">
      <div className="title-art"><${UI.Panorama} name="cite" opts=${{ min: 20 * 60, season: CR.dec.seasonOf(s) }} /></div>
      <div className="title-card">
        <p className="pix eyebrow">${reason} · ${CR.fmtDate(s.day, "long")}</p>
        <h1>Me ${s.player.prenom} ${s.player.nom}</h1>
        <p className="title-sub">${s.gameOver.text}</p>
        <div className="kpis">
          ${CR.CAR && s.car && html`<div className="kpi"><span className="pix">Grade</span><strong>${CR.CAR.titre(s)}</strong></div>`}
          <div className="kpi"><span className="pix">Années d'exercice</span><strong>${ans}</strong></div>
          <div className="kpi"><span className="pix">Honoraires</span><strong>${CR.money(s.stats.honoraires)}</strong></div>
          <div className="kpi"><span className="pix">Aide juridictionnelle</span><strong>${CR.money(s.stats.aj)}</strong></div>
          <div className="kpi"><span className="pix">Relaxes</span><strong>${s.stats.relaxes}</strong></div>
          <div className="kpi"><span className="pix">Nullités obtenues</span><strong>${s.stats.nullites}</strong></div>
          <div className="kpi"><span className="pix">Discipline</span><strong>${s.disc.record.length ? s.disc.record.map((r) => r.sanction).join(", ") : "Aucune"}</strong></div>
        </div>
        <h3>La promotion</h3>
        <ul className="log-list">${s.cohort.map((c) => html`<li key=${c.id}><strong>${c.name}</strong> — ${c.status}</li>`)}</ul>
        <h3>Les personnes que vous avez assistées</h3>
        <ul className="log-list">${s.order.map((id) => s.cases[id]).filter((c) => c && c.debrief && c.debrief.epilogue).slice(0, 14).map((c) => html`<li key=${c.id}><strong>${CR.clientName(c)}</strong> — ${c.debrief.epilogue}</li>`)}</ul>
        <div className="title-btns"><${Btn} kind="primary" onClick=${() => { CR.store.s = null; bump(); }}>Recommencer</${Btn}></div>
      </div>
    </div>`;
  }

  // =================================================================== Démarrage
  function boot() {
    const root = ReactDOM.createRoot(document.getElementById("app"));
    Saves.init();
    const hot = window.claude && window.claude.hot;
    const start = (data) => {
      if (data && data.state) { try { CR.store.s = CR.deserialize(data.state); } catch (e) {} }
      root.render(html`<${App} />`);
    };
    if (hot && hot.snapshot) { try { hot.snapshot(() => ({ state: CR.store.s ? CR.serialize(CR.store.s) : null })); } catch (e) {} }
    if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
  }
  CR.boot = boot;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
