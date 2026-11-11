const { boot } = require("./harness");
const { CR } = boot();
for (let d = 30; d <= 120; d++) process.stdout.write(d + ":" + CR.fmtDate(d, "dowshort") + (CR.isBusinessDay(d) ? "" : "*") + "  ");
console.log();
