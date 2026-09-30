import {spawnSync} from 'node:child_process';
import {readdir} from 'node:fs/promises';
async function walk(path){let all=[];for(const e of await readdir(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())all.push(...await walk(p));else if(/\.(js|mjs)$/.test(e.name))all.push(p);}return all;}
let failed=false;for(const file of [...await walk('src'),...await walk('scripts')]){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status){failed=true;console.error(result.stderr);}}if(failed)process.exit(1);console.log('Sintaxe dos módulos validada.');
