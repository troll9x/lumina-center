import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
function run(file,args,options={}){const r=spawnSync(file,args,{cwd:root,stdio:'inherit',...options});if(r.status!==0)process.exit(r.status||1);}
run(process.execPath,['scripts/run-framework.mjs','build']);
mkdirSync(resolve(root,'.sites-runtime'),{recursive:true});
const config=JSON.parse(readFileSync(resolve(root,'dist/server/wrangler.json'),'utf8'));
const migrationConfig={name:config.name,compatibility_date:config.compatibility_date,d1_databases:config.d1_databases.map(d=>({...d,migrations_dir:resolve(root,'drizzle')}))};
const configPath=resolve(root,'.sites-runtime/local-migrations.json');writeFileSync(configPath,JSON.stringify(migrationConfig));
// Adopt the exact starter baseline if it was initially applied manually.
// New installations still use Wrangler's ordinary migration tracking.
const d1args=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config',configPath,'--persist-to',resolve(root,'.wrangler/state')];
const probe=spawnSync(process.execPath,[...d1args,'--command',"SELECT name FROM sqlite_master WHERE type='table' AND name='center_state'",'--json'],{cwd:root,encoding:'utf8'});
if(probe.status!==0){console.error(probe.stderr||probe.stdout);process.exit(1);}
const found=JSON.parse(probe.stdout)[0]?.results?.length>0;
if(found){run(process.execPath,[...d1args,'--command',"CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0000_overconfident_deathbird.sql')"]);}
run(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config',configPath,'--persist-to',resolve(root,'.wrangler/state')],{env:{...process.env,CI:'true'}});
run(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--inspector-port','0','--port','5173']);
