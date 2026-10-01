import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
await mkdir('tests/artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
try {
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.waitForFunction(()=>!!window.paradise);
await page.screenshot({path:'tests/artifacts/01-menu.png'});
await page.getByRole('button',{name:'Nova jornada'}).click();
await page.getByRole('button',{name:'Começar',exact:true}).last().click();
let dialogs=0;
while(await page.locator('.dialogue-next').count()){await page.locator('.dialogue-next').click();if(++dialogs>40)throw Error('Diálogo não termina');}
await page.waitForTimeout(180);
assert.equal(await page.evaluate(()=>window.paradise.view),'playing');
const start=await page.evaluate(()=>({x:window.paradise.state.player.x,y:window.paradise.state.player.y,time:window.paradise.state.worldTime}));
await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');
const moved=await page.evaluate(()=>window.paradise.state.player.x);assert(moved>start.x+20,'Movimento por teclado');
await page.keyboard.down('s');await page.waitForTimeout(330);await page.keyboard.up('s');
await page.keyboard.press('e');await page.waitForTimeout(100);
async function moveTo(point){
  for(const axis of ['y','x'])for(let tries=0;tries<35;tries++){
    const current=await page.evaluate(a=>window.paradise.state.player[a],axis),diff=point[axis]-current;
    if(Math.abs(diff)<3)break;
    const key=axis==='x'?(diff>0?'d':'a'):(diff>0?'s':'w');
    await page.keyboard.down(key);await page.waitForTimeout(Math.max(35,Math.min(250,Math.abs(diff)*10)));await page.keyboard.up(key);
  }
}
await moveTo({x:225,y:623});await page.keyboard.press('e');
await moveTo({x:262,y:623});await page.keyboard.press('e');await page.waitForTimeout(120);
await page.keyboard.press('i');
assert.equal(await page.evaluate(()=>window.paradise.view),'inventory');
const paused=await page.evaluate(()=>window.paradise.state.worldTime);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.paradise.state.worldTime),paused,'Mochila pausa o tempo');
await page.getByRole('button',{name:'Fabricação',exact:true}).click();
const craftSword=page.locator('[data-action="craft"][data-value="sword"]');
assert(await craftSword.isEnabled(),'Materiais coletados permitem fabricar espada');await craftSword.click();assert.equal(await page.evaluate(()=>window.paradise.state.player.weapon),'sword');
await page.screenshot({path:'tests/artifacts/02-fabricacao.png'});
await page.keyboard.press('Escape');
await page.keyboard.press('m');await page.screenshot({path:'tests/artifacts/03-mapa.png'});await page.keyboard.press('Escape');
await page.screenshot({path:'tests/artifacts/04-jardins.png'});
await page.keyboard.press('Escape');await page.getByRole('button',{name:'Configurações',exact:true}).click();
await page.locator('#setting-volume').fill('30');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('paradise.configuracoes.v1')).volume),.3);
await page.keyboard.press('Escape');await page.keyboard.press('Escape');
// A real saved state is loaded through the same UI import path, including late-game states.
const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('paradise.campanha.v1')));assert.equal(snapshot.version,1);
await page.reload();await page.getByRole('button',{name:'Continuar jornada'}).click();
while(await page.locator('.dialogue-next').count())await page.locator('.dialogue-next').click();
await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.paradise.view),'playing');
// Exercise the browser's standard gamepad API, including menu confirmation.
await page.evaluate(()=>{window.testPad={axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),connected:true,index:0,id:'Controle de teste'};navigator.getGamepads=()=>[window.testPad];});
const beforePad=await page.evaluate(()=>window.paradise.state.player.x);
await page.evaluate(()=>window.testPad.axes[0]=.8);await page.waitForTimeout(320);await page.evaluate(()=>window.testPad.axes[0]=0);
assert((await page.evaluate(()=>window.paradise.state.player.x))>beforePad+10,'Analógico move o jogador');
async function padPress(index){await page.evaluate(i=>window.testPad.buttons[i].pressed=true,index);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.evaluate(i=>window.testPad.buttons[i].pressed=false,index);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
await padPress(9);assert.equal(await page.evaluate(()=>window.paradise.view),'pause');await padPress(0);assert.equal(await page.evaluate(()=>window.paradise.view),'playing');
// Import the ending produced by the real, complete simulated campaign.
assert(existsSync('tests/artifacts/campanha-final.json'),'Gere o fixture com EXPORT_CAMPAIGN=1 npm test');
await page.locator('#import-save').setInputFiles('tests/artifacts/campanha-final.json');
await page.waitForFunction(()=>window.paradise.view==='ending');
const lines=[];
while(await page.locator('.ending-screen button').count()){
  lines.push(await page.locator('.ending-screen p').innerText());
  await page.locator('.ending-screen button').click();
  if(lines.length>30)throw Error('O encerramento não termina.');
}
assert.match(lines[0],/Parabéns/);assert.match(lines[1],/Obrigado/);
assert.equal(await page.locator('.ending-screen p').innerText(),'SEJA BEM-VINDO AO PARAÍSO!');
assert.equal(await page.evaluate(()=>window.paradise.state.phase),'finished');
assert.equal(await page.locator('.ending-screen button').count(),0);assert.equal(await page.locator('.toast').count(),0,'Última cena não mostra notificações');
await page.screenshot({path:'tests/artifacts/05-encerramento.png'});
assert.equal(errors.length,0,errors.join('\n'));
console.log(`Navegador: ${dialogs} falas, início, movimento, coleta, pausa, fabricação, mapa, configurações, retomada, gamepad e 25 cenas finais passaram; sem erros de JavaScript.`);
} finally { await browser.close(); }
