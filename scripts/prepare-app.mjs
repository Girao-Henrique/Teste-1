import {cp,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'www');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const entry of ['index.html','styles.css','src','assets'])await cp(resolve(root,entry),resolve(out,entry),{recursive:true,filter:source=>!source.endsWith('.md')&&!source.endsWith('catalogo.json')});
const html=await readFile(resolve(out,'index.html'),'utf8');
await writeFile(resolve(out,'index.html'),html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' blob:; connect-src \'self\'; object-src \'none\'; base-uri \'self\'; frame-src \'none\'">'));
console.log('Conteúdo offline preparado em www/; documentos, testes e chaves excluídos.');
