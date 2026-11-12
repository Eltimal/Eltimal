// La Permanence — enveloppe Electron : une fenêtre qui charge le jeu local. Le jeu lui-même n'a aucun accès réseau ;
// seule l'enveloppe interroge, au lancement, la liste des publications du dépôt pour se mettre à jour (electron/maj.js).
const { app, BrowserWindow, Menu, session, shell, dialog } = require("electron");
const path = require("path");
const MAJ = require("./maj");

// Le son peut démarrer sans attendre un premier clic.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
// Les tests utilisent un dossier de données à part pour ne pas toucher aux vraies sauvegardes.
if (process.env.LP_USER_DATA) app.setPath("userData", process.env.LP_USER_DATA);

const APP_DIR = path.join(__dirname, "..");
let JEU = null; // { numero, dossier, source } : version du jeu chargée, choisie au démarrage
let MAJ_ETAT = null; // dernier résultat de la recherche de mise à jour
const bloquees = []; // requêtes réseau refusées (doit rester vide) — lu par electron/test-app.js
global.lpBloquees = bloquees;

function fenetre() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 640,
    title: "La Permanence", backgroundColor: "#0b0f1a", show: false,
    fullscreenable: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  win.once("ready-to-show", () => win.show());
  // Aucune fenêtre secondaire, aucune navigation hors du jeu.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  // Réveille le son dès le chargement (le jeu l'ouvre d'ordinaire au premier geste).
  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript("window.dispatchEvent(new Event('keydown'))", true).catch(() => {});
  });
  win.loadFile(path.join(JEU.dossier, "index.html"));
  return win;
}

function menu() {
  const mac = process.platform === "darwin";
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(mac ? [{ label: "La Permanence", submenu: [{ role: "about", label: "À propos de La Permanence" }, { type: "separator" }, { role: "hide", label: "Masquer" }, { role: "hideOthers", label: "Masquer les autres" }, { type: "separator" }, { role: "quit", label: "Quitter La Permanence" }] }] : []),
    { label: "Édition", submenu: [{ role: "undo", label: "Annuler" }, { role: "redo", label: "Rétablir" }, { type: "separator" }, { role: "cut", label: "Couper" }, { role: "copy", label: "Copier" }, { role: "paste", label: "Coller" }, { role: "selectAll", label: "Tout sélectionner" }] },
    { label: "Affichage", submenu: [
      { role: "togglefullscreen", label: "Plein écran", accelerator: mac ? "Ctrl+Cmd+F" : "F11" },
      { type: "separator" },
      { role: "resetZoom", label: "Taille réelle" }, { role: "zoomIn", label: "Agrandir" }, { role: "zoomOut", label: "Réduire" },
      { type: "separator" },
      { role: "reload", label: "Recharger le jeu" },
      { label: "Ouvrir le dossier des sauvegardes", click: () => shell.openPath(app.getPath("userData")) },
    ] },
    { label: "Mise à jour", submenu: [
      { label: "Rechercher une mise à jour", click: () => rechercher(true) },
      { label: "Version du jeu : n° " + JEU.numero + (JEU.source === "telechargee" ? " (téléchargée)" : " (livrée avec l'app)"), enabled: false },
    ] },
    ...(mac ? [] : [{ label: "Fichier", submenu: [{ role: "quit", label: "Quitter" }] }]),
  ]));
}

// Cherche une mise à jour ; « demande » = lancée depuis le menu (on répond même quand il n'y a rien)
async function rechercher(demande) {
  const win = BrowserWindow.getAllWindows()[0];
  const r = await MAJ.verifier({ cle: MAJ.lireCle(__dirname), userData: app.getPath("userData"), numeroActuel: JEU.numero, api: process.env.LP_MAJ_API, depot: process.env.LP_MAJ_DEPOT });
  MAJ_ETAT = r;
  global.lpMaj = r;
  if (!win || win.isDestroyed()) return r;
  if (r.etat === "pret") {
    const { response } = await dialog.showMessageBox(win, {
      type: "info", buttons: ["Plus tard", "Relancer maintenant"], defaultId: 0, cancelId: 0,
      message: "Une nouvelle version de La Permanence est prête (n° " + r.numero + ").",
      detail: "Elle sera utilisée au prochain lancement. Si vous relancez maintenant, vous reprendrez à la dernière sauvegarde automatique.",
    });
    if (response === 1) {
      await win.webContents.executeJavaScript("window.CR && CR.autosave && CR.autosave(); true", true).catch(() => {});
      setTimeout(() => { app.relaunch(); app.exit(0); }, 600);
    }
  } else if (r.etat === "enveloppe") {
    dialog.showMessageBox(win, { type: "info", buttons: ["OK"], message: "Une nouvelle version demande de réinstaller l'app.", detail: "Téléchargez la dernière app depuis la page des publications du dépôt, puis remplacez celle-ci." });
  } else if (demande) {
    const msg = r.etat === "a-jour" ? "Le jeu est à jour (n° " + JEU.numero + ")." : r.etat === "prive" ? "Les mises à jour ne sont pas accessibles : le dépôt du jeu est privé." : "La recherche a échoué : " + (r.detail || "erreur inconnue") + ".";
    dialog.showMessageBox(win, { type: r.etat === "erreur" ? "warning" : "info", buttons: ["OK"], message: msg });
  }
  return r;
}

app.whenReady().then(() => {
  JEU = MAJ.jeuACharger(APP_DIR, app.getPath("userData"));
  global.lpJeu = JEU;
  // Hors ligne strict : seuls les fichiers locaux (et les données en mémoire) passent.
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => {
    const ok = /^(file|data|blob|devtools|chrome-extension):/.test(d.url);
    if (!ok) bloquees.push(d.url);
    cb({ cancel: !ok });
  });
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false));
  menu();
  fenetre();
  // Recherche silencieuse quelques secondes après le lancement (désactivée par LP_MAJ_OFF, utilisé par test-app.js)
  if (!process.env.LP_MAJ_OFF) setTimeout(() => { rechercher(false).catch(() => {}); }, 4000);
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) fenetre(); });
});

// Sur Mac comme ailleurs : fermer la fenêtre quitte le jeu (les sauvegardes sont déjà sur le disque).
app.on("window-all-closed", () => app.quit());
