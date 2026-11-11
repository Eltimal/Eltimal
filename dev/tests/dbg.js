const U = require("./util");
(async () => {
  const env = await U.career("a05_placement");
  const { CR, s } = env;
  await U.untilLead(env, "a05_placement");
  const cs = s.cases.a05_placement;
  const api = CR.api(s, cs);
  console.log("ps", cs.vars.plainteSimpleDay, cs.vars.plainteSimpleCopie, "3m", CR.addMonths(cs.vars.plainteSimpleDay, 3), "day", s.day);
  for (const d of [s.day, CR.addMonths(cs.vars.plainteSimpleDay, 3) + 2]) console.log(d, JSON.stringify(CR.PROC.controle(api, "pcpc", { day: d })));
  process.exit(0);
})();
