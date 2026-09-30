import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // A interface nativa disponibiliza saída e exportação no aplicativo Android.
 await page.addInitScript(()=>{window.ParadiseNative={exitGame(){},fullscreen(){},exportSave(){}};});
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>!!window.paradise);
 assert(await page.locator('html').evaluate(el=>el.classList.contains('is-touch')));
 for(const button of await page.locator('.title-menu button').all()){
  const r=await button.boundingBox();assert(r.y>=0&&r.y+r.height<=390,`Botão fora da tela: ${await button.innerText()}`);
 }
 await page.screenshot({path:'tests/artifacts/mobile-menu.png'});
 await page.getByRole('button',{name:'Nova jornada'}).tap();await page.getByRole('button',{name:'Começar',exact:true}).last().tap();
 let dialogs=0;while(await page.locator('.dialogue-next').count()){await page.locator('.dialogue-next').tap();assert(++dialogs<40);}
 await page.waitForFunction(()=>window.paradise.view==='playing');await page.waitForTimeout(100);
 const cdp=await page.context().newCDPSession(page);
 const joy=await page.locator('.touch-joystick').boundingBox(), attack=await page.locator('[data-touch="attack"]').boundingBox();
 const p1={x:joy.x+joy.width*.8,y:joy.y+joy.height*.5,id:1},p2={x:attack.x+attack.width*.5,y:attack.y+attack.height*.5,id:2};
 const before=await page.evaluate(()=>window.paradise.state.player.x);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});await page.waitForTimeout(500);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert((await page.evaluate(()=>window.paradise.state.player.x))>before+20,'Movimento e ataque simultâneos');
 const stop=await page.evaluate(()=>window.paradise.state.player.x);await page.waitForTimeout(200);
 assert(Math.abs(await page.evaluate(()=>window.paradise.state.player.x)-stop)<3,'Soltar o direcional interrompe o movimento');
 const strong=await page.locator('[data-touch="strong"]').boundingBox();
 const p3={x:strong.x+strong.width*.5,y:strong.y+strong.height*.5,id:3};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p3]});await page.waitForTimeout(300);
 assert((await page.evaluate(()=>window.paradise.state.player.charge))>.1,'Segurar Carregar prepara o golpe');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>window.paradise.state.player.charge),0,'Soltar Carregar executa o golpe');
 await page.screenshot({path:'tests/artifacts/mobile-jogo.png'});
 await page.evaluate(()=>dispatchEvent(new Event('paradise-pause')));assert.equal(await page.evaluate(()=>window.paradise.view),'pause');
 const time=await page.evaluate(()=>window.paradise.state.worldTime);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.paradise.state.worldTime),time);
 assert(await page.evaluate(()=>!!localStorage.getItem('paradise.campanha.v1')),'Salvar ao ir para segundo plano');
 await page.getByRole('button',{name:'Continuar jornada',exact:true}).tap();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
 assert(await page.locator('#rotate-notice').isVisible());assert.equal(await page.evaluate(()=>window.paradise.view),'pause');
 await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'Continuar jornada',exact:true}).tap();
 await page.locator('#import-save').setInputFiles('tests/artifacts/campanha-final.json');await page.waitForFunction(()=>window.paradise.view==='ending');
 let scenes=0;while(await page.locator('.ending-screen button').count()){await page.locator('.ending-screen button').tap();assert(++scenes<30);}
 assert.equal(await page.locator('.ending-screen p').innerText(),'SEJA BEM-VINDO AO PARAÍSO!');assert.equal(errors.length,0,errors.join('\n'));
 console.log(`Celular: menu nativo, ${dialogs} falas, multitoque, pausa, salvamento, rotação e ${scenes} cenas finais passaram.`);
} finally {await browser.close();}
