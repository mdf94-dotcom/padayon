'use strict';
/* Runs every check. `node tests/run_all.js` (from the repo root). Each script can also run alone. */
const { spawnSync } = require('child_process'), path = require('path');
let bad = 0; for (const f of ['05_content', '03_grading', '04_audio', '06_sync', '07_pwa', '08_perf', '02_sim', '01_ui', '10_journey', '11_newq', '12_games']) { console.log('--- ' + f); const r = spawnSync('node', [path.join(__dirname, f + '.js')], { stdio: 'inherit', timeout: 900000 }); if (r.status !== 0) { bad++; console.log('^^^ ' + f + ' failed'); } }
console.log(bad ? bad + ' script(s) failed' : 'All checks passed'); process.exit(bad ? 1 : 0);
