// Relecture automatique des textes générés (dev/tools/relecture-scan.js) : les défauts ponctuels corrigés en 1.0.1 ne
// doivent plus revenir. node tests/trelecture.js [affaires par genre, défaut 25] [graine]
process.argv[2] = process.argv[2] || "25";
require("../tools/relecture-scan.js");
