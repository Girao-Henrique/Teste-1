import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const browser=await chromium.launch({headless:true,...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');const sheets=await page.evaluate(async()=>{const {Renderer}=await import('/src/render/renderer.js');return new Renderer(document.createElement('canvas')).exportSheets();});for(const [path,data] of Object.entries(sheets)){if(!path.startsWith('assets/')||path.includes('..'))throw Error('Destino fora dos recursos.');await mkdir(dirname(path),{recursive:true});await writeFile(path,Buffer.from(data.split(',')[1],'base64'));}console.log(`${Object.keys(sheets).length} folhas de arte originais exportadas para assets/.`);}finally{await browser.close();}
