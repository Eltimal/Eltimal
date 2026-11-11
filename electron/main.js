// La Permanence — enveloppe Electron minimale : une fenêtre qui charge le jeu local, sans aucun accès réseau.
const { app, BrowserWindow, Menu, session, shell } = require("electron");
const path = require("path");

// Le son peut démarrer sans attendre un premier clic.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
// Les tests utilisent un dossier de données à part pour ne pas toucher aux vraies sauvegardes.
if (process.env.LP_USER_DATA) app.setPath("userData", process.env.LP_USER_DATA);

const INDEX = path.join(__dirname, "..", "index.html");
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
  win.loadFile(INDEX);
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
    ...(mac ? [] : [{ label: "Fichier", submenu: [{ role: "quit", label: "Quitter" }] }]),
  ]));
}

app.whenReady().then(() => {
  // Hors ligne strict : seuls les fichiers locaux (et les données en mémoire) passent.
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => {
    const ok = /^(file|data|blob|devtools|chrome-extension):/.test(d.url);
    if (!ok) bloquees.push(d.url);
    cb({ cancel: !ok });
  });
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false));
  menu();
  fenetre();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) fenetre(); });
});

// Sur Mac comme ailleurs : fermer la fenêtre quitte le jeu (les sauvegardes sont déjà sur le disque).
app.on("window-all-closed", () => app.quit());
