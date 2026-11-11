/* La Permanence — utilitaires : hasard, calendrier français (jours fériés, art. 801 CPP), formats, store */
(function () {
  const CR = (window.CR = window.CR || {});

  // ---------------------------------------------------------------- Hasard (graine stockée dans la partie)
  CR.hash = function (str) {
    let h = 2166136261 >>> 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  };
  CR.R = {
    next(s) {
      let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(s, a, b) { return a + Math.floor(CR.R.next(s) * (b - a + 1)); },
    range(s, a, b) { return a + CR.R.next(s) * (b - a); },
    chance(s, p) { return CR.R.next(s) < p; },
    pick(s, arr) { return arr[Math.floor(CR.R.next(s) * arr.length)]; },
    shuffle(s, arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(CR.R.next(s) * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
  CR.seeded = function (seed) {
    let a = CR.hash(seed) || 1;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---------------------------------------------------------------- Calendrier
  // Jour 0 = lundi 2 novembre 2026, premier jour au cabinet
  const DAY_MS = 86400000;
  CR.START_UTC = Date.UTC(2026, 10, 2);
  CR.dateOf = (day) => new Date(CR.START_UTC + day * DAY_MS);
  CR.dayOf = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - CR.START_UTC) / DAY_MS);
  CR.dow = (day) => CR.dateOf(day).getUTCDay();
  CR.isWeekend = (day) => { const w = CR.dow(day); return w === 0 || w === 6; };

  // Dimanche de Pâques (algorithme de Meeus/Jones/Butcher)
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(y, month - 1, day);
  }
  const holidayCache = {};
  // Jours fériés légaux (art. L. 3133-1 du code du travail)
  function holidaysFor(y) {
    if (holidayCache[y]) return holidayCache[y];
    const p = easter(y);
    const list = [
      [Date.UTC(y, 0, 1), "Jour de l'an"],
      [p + DAY_MS, "Lundi de Pâques"],
      [Date.UTC(y, 4, 1), "Fête du Travail"],
      [Date.UTC(y, 4, 8), "Victoire 1945"],
      [p + 39 * DAY_MS, "Ascension"],
      [p + 50 * DAY_MS, "Lundi de Pentecôte"],
      [Date.UTC(y, 6, 14), "Fête nationale"],
      [Date.UTC(y, 7, 15), "Assomption"],
      [Date.UTC(y, 10, 1), "Toussaint"],
      [Date.UTC(y, 10, 11), "Armistice"],
      [Date.UTC(y, 11, 25), "Noël"],
    ];
    const map = {};
    for (const [ms, name] of list) map[Math.round((ms - CR.START_UTC) / DAY_MS)] = name;
    holidayCache[y] = map;
    return map;
  }
  CR.holidayName = (day) => {
    const y = CR.dateOf(day).getUTCFullYear();
    return holidaysFor(y)[day] || null;
  };
  CR.isBusinessDay = (day) => !CR.isWeekend(day) && !CR.holidayName(day);
  // Jours ouvrables : tous les jours sauf le dimanche et les jours fériés (art. 145 CPP : « quatre jours ouvrables »)
  CR.isOuvrable = (day) => CR.dow(day) !== 0 && !CR.holidayName(day);
  CR.addOuvrables = (day, n) => { let d = day, k = 0; while (k < n) { d++; if (CR.isOuvrable(d)) k++; } return d; };
  // Art. 801 CPP : le délai qui expirerait un samedi, un dimanche ou un jour férié est prorogé au premier jour ouvrable suivant
  CR.rollForward = (day) => { let d = day; while (!CR.isBusinessDay(d)) d++; return d; };
  CR.addBusinessDays = (day, n) => { let d = day; let k = 0; while (k < n) { d++; if (CR.isBusinessDay(d)) k++; } return d; };
  CR.nextBusinessDay = (day) => CR.rollForward(day + 1);
  CR.addMonths = (day, n) => {
    const d = CR.dateOf(day);
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, q = d.getUTCDate();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return Math.round((Date.UTC(y, m, Math.min(q, last)) - CR.START_UTC) / DAY_MS);
  };
  CR.addYears = (day, n) => CR.addMonths(day, 12 * n);

  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const MOIS_C = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  CR.MONTHS = MOIS;
  CR.DOW = JOURS;
  CR.ymd = (day) => { const d = CR.dateOf(day); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: d.getUTCDay() }; };
  const premier = (d) => (d === 1 ? "1er" : String(d));
  CR.fmtDate = function (day, style) {
    const { y, m, d, w } = CR.ymd(day);
    switch (style) {
      case "long": return `${premier(d)} ${MOIS[m - 1]} ${y}`;
      case "dow": return `${JOURS[w]} ${premier(d)} ${MOIS[m - 1]} ${y}`;
      case "dowshort": return `${JOURS[w]} ${premier(d)} ${MOIS[m - 1]}`;
      case "short": return `${premier(d)} ${MOIS_C[m - 1]}`;
      case "num": return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
      case "iso": return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      case "month": return `${MOIS[m - 1]} ${y}`;
      default: return `${JOURS[w].slice(0, 3)}. ${premier(d)} ${MOIS_C[m - 1]} ${y}`;
    }
  };
  CR.parseISO = (str) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
    return m ? CR.dayOf(+m[1], +m[2], +m[3]) : null;
  };
  CR.fmtTime = function (min) {
    min = Math.round(min);
    const h = Math.floor(min / 60) % 24;
    const mm = String(((min % 60) + 60) % 60).padStart(2, "0");
    return `${h} h ${mm}`;
  };
  CR.fmtDuration = (min) => {
    min = Math.round(min);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60), r = min % 60;
    return r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`;
  };
  CR.daysBetween = (a, b) => b - a;
  CR.monthIndex = (day) => { const { y, m } = CR.ymd(day); return y * 12 + (m - 1); };

  // ---------------------------------------------------------------- Formats
  const nf = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  CR.money = (n) => {
    const neg = n < 0;
    const v = Math.round(Math.abs(n));
    return (neg ? "−" : "") + nf(v) + " €";
  };
  CR.num = (n) => nf(Math.round(n));
  CR.pct = (x, digits = 0) => `${(x * 100).toFixed(digits).replace(".", ",")} %`;
  CR.fmt = function (str, vars) {
    if (typeof str === "function") return str(vars);
    return String(str).replace(/\{([a-zA-Z0-9_.]+)\}/g, (m, k) => {
      const v = k.split(".").reduce((o, p) => (o == null ? o : o[p]), vars);
      return v == null ? m : v;
    });
  };
  let uidN = 0;
  CR.uid = (p = "id") => `${p}${Date.now().toString(36).slice(-4)}${(uidN++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  CR.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  CR.lerp = (a, b, t) => a + (b - a) * t;
  CR.sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);
  CR.plural = (n, w, pl) => `${n} ${n > 1 ? pl || w + "s" : w}`;
  CR.deepClone = (o) => JSON.parse(JSON.stringify(o));
  CR.cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
  // Durées de peine en mois → texte
  CR.fmtMois = (m) => {
    if (m == null) return "";
    if (m < 1) return `${Math.round(m * 30)} jours`;
    if (m % 12 === 0) return CR.plural(m / 12, "an");
    if (m > 12) return `${Math.floor(m / 12)} an${m >= 24 ? "s" : ""} et ${m % 12} mois`;
    return `${m} mois`;
  };

  // ---------------------------------------------------------------- Store
  CR.store = {
    s: null,
    v: 0,
    subs: new Set(),
    get() { return this.v; },
    sub(f) { this.subs.add(f); return () => this.subs.delete(f); },
    bump() { this.v++; this.subs.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); },
  };
  CR.bus = {
    h: {},
    on(t, f) { (this.h[t] = this.h[t] || new Set()).add(f); return () => this.h[t].delete(f); },
    emit(t, d) { (this.h[t] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } }); },
  };
})();
