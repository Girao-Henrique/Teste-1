import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {GameEngine} from '../src/game/engine.js';
import {BIOMES} from '../src/data/content.js';

const {chromium}=createRequire(import.meta.url)('playwright');
const artifactRoot=resolve('tests/artifacts/layout');
await mkdir(artifactRoot,{recursive:true});
const baseURL=process.env.PARADISE_TEST_URL||'http://127.0.0.1:5173';
const cases=[
  {name:'celular-pequeno-retrato',width:320,height:568,touch:true,native:'android'},
  {name:'celular-retrato',width:390,height:844,touch:true,native:'android'},
  {name:'celular-pequeno-paisagem',width:640,height:320,touch:true,native:'android'},
  {name:'celular-paisagem',width:844,height:390,touch:true,native:'android'},
  {name:'tablet-retrato',width:768,height:1024,touch:true},
  {name:'tablet-quadrado',width:720,height:720,touch:true},
  {name:'pc-pequeno',width:800,height:600,native:'desktop'},
  {name:'pc-quadrado',width:900,height:900},
  {name:'pc-retrato',width:720,height:1280,native:'desktop'},
  {name:'pc-amplo',width:1366,height:768,native:'desktop'},
  {name:'pc-ultrawide',width:2560,height:1080,native:'desktop'},
  {name:'touch-ultrawide',width:2560,height:1080,touch:true},
];
const requested=process.env.PARADISE_LAYOUT_CASE;
const matrix=requested?cases.filter(c=>c.name===requested):cases;
if(!matrix.length)throw Error(`Resolução desconhecida: ${requested}`);
const report={url:baseURL,started:new Date().toISOString(),cases:[],failures:[]};
const browser=await chromium.launch({headless:true,...(existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});

// Os fixtures servem apenas para exercitar áreas da interface. Não são uma campanha
// vencida: a campanha continua coberta pelos testes próprios de sistemas/progressão.
function visualFixture(kind){
  const engine=new GameEngine();engine.start('normal');
  engine.state.tutorial={opening:true,guide:true};
  engine.state.inventory={...engine.state.inventory,acid:1,heal:3,camp:2};
  if(kind==='support'){
    engine.state.inventory={...engine.state.inventory,wood:40,stone:40,fiber:40,ore:20,crystal:20,essence:10};
    engine.state.supports=Array.from({length:10},(_,id)=>id);engine.state.visited=[...engine.state.supports];
    Object.assign(engine.state.player,engine.world.support);
    engine.state.storage[engine.world.support.id]={wood:15,stone:20,fiber:10,ore:10};
    engine.act('craft','sword');
  }else if(kind==='boss'){
    engine.state.defeated=Array.from({length:19},(_,id)=>id);
    engine.state.ingredients=BIOMES.slice(0,9).map(b=>b.ingredient);
    engine.state.visited=Array.from({length:10},(_,id)=>id);
    engine.state.supports=[...engine.state.visited];
    engine.enterWorld(9,false);
    const marker=engine.world.bosses.find(b=>b.id===19);
    Object.assign(engine.state.player,{x:marker.x,y:marker.y+105});
  }else{
    engine.state.defeated=Array.from({length:20},(_,id)=>id);
    engine.state.electricUnlocked=true;engine.state.player.electric=true;
    engine.state.phase='rift';engine.enterWorld(9,false);
  }
  return engine.serialize();
}

function check(result,condition,message,details){
  if(condition)return;
  const failure={case:result.name,stage:result.stage,message,...(details?{details}:{})};
  result.failures.push(failure);report.failures.push(failure);
}

async function settle(page){
  await page.waitForTimeout(380);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function geometry(page,selectors,{overlap=true,buttons=false,canvas=false}={}){
  return page.evaluate(({selectors,overlap,buttons,canvas})=>{
    const issue=[],rects=[],elements=[],viewport={width:innerWidth,height:innerHeight};
    const tolerance=1.5;
    const visible=el=>{
      for(let at=el;at;at=at.parentElement){const css=getComputedStyle(at);if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0||at.hidden)return false;}
      const r=el.getBoundingClientRect();return r.width>0&&r.height>0;
    };
    const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const scrollParent=el=>{
      for(let at=el.parentElement;at&&at!==document.body;at=at.parentElement){
        const css=getComputedStyle(at);if(/auto|scroll/.test(css.overflowY)&&at.scrollHeight>at.clientHeight+1)return at;
      }
      return null;
    };
    for(const selector of selectors)for(const [index,el] of [...document.querySelectorAll(selector)].entries()){
      if(!visible(el))continue;
      const r=rect(el),key=`${selector}${index?`[${index}]`:''}`,label=el.getAttribute('aria-label')||el.textContent.trim().replace(/\s+/g,' ').slice(0,100);
      rects.push({key,label,...r});
      elements.push(el);
      if(r.x<-tolerance||r.right>viewport.width+tolerance)issue.push({type:'fora-horizontal',key,label,rect:r});
      if(r.y<-tolerance||r.bottom>viewport.height+tolerance){
        const parent=scrollParent(el),p=parent&&rect(parent);
        if(!p||p.y<-tolerance||p.bottom>viewport.height+tolerance)issue.push({type:'fora-vertical-sem-rolagem',key,label,rect:r});
      }
      if(buttons&&el.matches('button,input,select,textarea,[role="button"],.touch-joystick')&&r.x>=0&&r.right<=viewport.width&&r.y>=0&&r.bottom<=viewport.height){
        const clip=scrollParent(el),p=clip&&rect(clip);
        const clipped=p&&(r.y<p.y||r.bottom>p.bottom);
        if(!clipped){
          const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          if(top&&!el.contains(top)&&top!==el)issue.push({type:'controle-encoberto',key,label,cover:top.id||top.className});
        }
      }
    }
    if(overlap)for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
      const a=rects[i],b=rects[j];
      if(elements[i].contains(elements[j])||elements[j].contains(elements[i]))continue;
      const dx=Math.min(a.right,b.right)-Math.max(a.x,b.x),dy=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y);
      if(dx>tolerance&&dy>tolerance)issue.push({type:'sobreposicao',a:a.key,b:b.key,area:Math.round(dx*dy)});
    }
    if(canvas){
      const el=document.getElementById('world'),r=el.getBoundingClientRect(),expected=el.width/el.height,actual=r.width/r.height;
      if(Math.abs(expected-actual)>.01)issue.push({type:'canvas-esticado',expected,actual,logical:{width:el.width,height:el.height},css:{width:r.width,height:r.height}});
      if(r.width<viewport.width-2||r.height<viewport.height-2)issue.push({type:'canvas-nao-ocupa-tela',logical:{width:el.width,height:el.height},css:{width:r.width,height:r.height},viewport});
    }
    return{issue,rects,viewport,scroll:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}};
  },{selectors,overlap,buttons,canvas});
}

async function capture(page,result,stage,selectors,options={}){
  result.stage=stage;await settle(page);
  const diagnosis=await geometry(page,selectors,options);
  result.stages.push({name:stage,...diagnosis});
  for(const error of diagnosis.issue)check(result,false,`${stage}: ${error.type}`,error);
  check(result,diagnosis.scroll.width<=result.width+2,`${stage}: rolagem horizontal na página`,diagnosis.scroll);
  const path=resolve(artifactRoot,`${result.name}-${stage}.png`);
  await page.screenshot({path});
}

async function tap(page,locator,touch){if(touch)await locator.tap();else await locator.click();}
async function pressAction(page,action,touch,scope=''){
  const locator=page.locator(`${scope?`${scope} `:''}[data-action="${action}"]`).filter({visible:true}).first();
  await tap(page,locator,touch);
}
async function inspectPanel(page,result,stage){
  await capture(page,result,stage,['.panel'],{overlap:false});
  const layout=await geometry(page,['.panel-head','.panel-body','.panel-foot'],{overlap:true});
  for(const error of layout.issue)check(result,false,`${stage}: ${error.type}`,error);
  const controls=await geometry(page,['.panel button','.panel input'],{buttons:true});
  for(const error of controls.issue)check(result,false,`${stage}: ${error.type}`,error);
  result.stages.at(-1).controls=controls;
}
async function assertPaused(page,result){
  const before=await page.evaluate(()=>window.paradise.state.worldTime);await page.waitForTimeout(90);
  const after=await page.evaluate(()=>window.paradise.state.worldTime);
  check(result,after===before,`${result.stage}: painel precisa pausar a simulação`,{before,after});
}
async function touchMove(page,result){
  const joy=await page.locator('.touch-joystick').boundingBox();
  if(!joy){check(result,false,'Direcional visível durante o jogo');return;}
  const attack=await page.locator('[data-touch="attack"]').boundingBox();
  const cdp=await page.context().newCDPSession(page);
  const p1={x:joy.x+joy.width*.85,y:joy.y+joy.height*.5,id:1};
  const p2=attack&&{x:attack.x+attack.width*.5,y:attack.y+attack.height*.5,id:2};
  const before=await page.evaluate(()=>({x:window.paradise.state.player.x,y:window.paradise.state.player.y}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
  if(p2)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});
  await page.waitForTimeout(350);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const after=await page.evaluate(()=>({x:window.paradise.state.player.x,y:window.paradise.state.player.y}));
  check(result,Math.hypot(after.x-before.x,after.y-before.y)>8,'Direcional e ataque multitoque movem o jogador',{before,after});
  await page.waitForTimeout(120);
  const stopped=await page.evaluate(()=>({x:window.paradise.state.player.x,y:window.paradise.state.player.y}));
  check(result,Math.hypot(stopped.x-after.x,stopped.y-after.y)<4,'Soltar o toque interrompe o movimento',{after,stopped});
  await cdp.detach();
}

const hudSelectors=['.vitals','.place','.corner','.hud-actions button','#boss-hud','.weapon-info','.journal-shortcut','.quickbar','.quickbar button','.touch-joystick','[data-touch="attack"]','[data-touch="dodge"]','[data-touch="interact"]','[data-touch="strong"]','[data-touch="sprint"]','[data-touch="cycleTarget"]','[data-touch="potion"]','[data-touch="electric"]','.toasts','#interact-hint'];
try{
  for(const config of matrix){
    const result={...config,started:new Date().toISOString(),stage:'carregar',stages:[],failures:[],javascriptErrors:[],externalRequests:[]};report.cases.push(result);
    const context=await browser.newContext({viewport:{width:config.width,height:config.height},isMobile:!!config.touch,hasTouch:!!config.touch});
    const page=await context.newPage();
    page.on('pageerror',error=>result.javascriptErrors.push(error.message));
    page.on('request',request=>{const address=request.url();if(/^https?:/.test(address)&&new URL(address).origin!==new URL(baseURL).origin)result.externalRequests.push(address);});
    await page.addInitScript(({native})=>{
      window.__layoutCalls={fullscreen:0,exit:0};
      if(native==='android')window.ParadiseNative={exitGame(){window.__layoutCalls.exit++;},fullscreen(){window.__layoutCalls.fullscreen++;},exportSave(){}};
      if(native==='desktop')window.ParadiseDesktop={platform:'win32',toggleFullscreen:async()=>{window.__layoutCalls.fullscreen++;return window.__layoutCalls.fullscreen%2===1;},exitGame(){window.__layoutCalls.exit++;},exportSave:async()=>({ok:true})};
    },{native:config.native});
    try{
      await page.goto(baseURL);await page.waitForFunction(()=>!!window.paradise);
      await capture(page,result,'titulo',['.title-menu button'],{buttons:true,canvas:true});
      if(config.native){
        check(result,await page.locator('.title-menu [data-action="quit"]').count()===1,'Aplicativo nativo oferece Sair no título');
        await pressAction(page,'quit',config.touch,'.title-menu');
        check(result,(await page.evaluate(()=>window.__layoutCalls.exit))===1,'Sair chama a integração nativa');
      }
      await pressAction(page,'new',config.touch);
      await inspectPanel(page,result,'nova-jornada');
      await tap(page,page.locator('[data-action="start"][data-value="normal"]'),config.touch);
      let dialogues=0;
      while(await page.locator('.dialogue-next').count()){
        if(dialogues===0)await capture(page,result,'dialogo',['.dialogue','.dialogue-next'],{overlap:false,canvas:true});
        await tap(page,page.locator('.dialogue-next'),config.touch);
        if(++dialogues>40)throw Error('A introdução não terminou.');
      }
      result.dialogues=dialogues;
      await page.waitForFunction(()=>window.paradise.view==='playing');
      await capture(page,result,'jogo',hudSelectors,{buttons:true,canvas:true});
      if(config.touch){
        check(result,await page.locator('#touch-controls').isVisible(),'Controles disponíveis em retrato e paisagem');
        check(result,!(await page.locator('#rotate-notice').isVisible()),'Retrato jogável sem bloqueio por rotação');
        await touchMove(page,result);
      }else{
        const x=await page.evaluate(()=>window.paradise.state.player.x);
        await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');
        check(result,(await page.evaluate(()=>window.paradise.state.player.x))>x+8,'Movimento por teclado continua disponível');
      }
      await pressAction(page,'inventory',config.touch,'#hud');
      await inspectPanel(page,result,'mochila');await assertPaused(page,result);
      await tap(page,page.getByRole('button',{name:'Fabricação',exact:true}),config.touch);
      await inspectPanel(page,result,'fabricacao');await assertPaused(page,result);
      await pressAction(page,'close',config.touch,'.panel');
      await pressAction(page,'map',config.touch,'#hud');
      await inspectPanel(page,result,'mapa');await assertPaused(page,result);
      await pressAction(page,'journal',config.touch,'.panel');
      await inspectPanel(page,result,'diario');await assertPaused(page,result);
      await pressAction(page,'close',config.touch,'.panel');
      await pressAction(page,'pause',config.touch,'#hud');
      await inspectPanel(page,result,'pausa');await assertPaused(page,result);
      await pressAction(page,'settings',config.touch,'.panel');
      await inspectPanel(page,result,'configuracoes');await assertPaused(page,result);
      if(config.native){
        await pressAction(page,'fullscreen',config.touch,'.panel');
        check(result,(await page.evaluate(()=>window.__layoutCalls.fullscreen))>0,`Tela cheia chama a integração ${config.native==='android'?'Android':'PC'}`);
      }else{
        await pressAction(page,'fullscreen',config.touch,'.panel');await settle(page);
        check(result,await page.evaluate(()=>document.fullscreenElement?.id==='game'),'Tela cheia do navegador ocupa o jogo');
        await capture(page,result,'tela-cheia',['.panel'],{overlap:false,canvas:true});
        if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
      }
      await pressAction(page,'controls',config.touch,'.panel');
      await inspectPanel(page,result,'controles');
      // Muda a orientação durante a sessão. O novo contrato mantém o jogo utilizável.
      await page.setViewportSize({width:config.height,height:config.width});
      await inspectPanel(page,{...result,width:config.height,height:config.width,stages:result.stages,failures:result.failures},'rotacao-controles');
      await page.setViewportSize({width:config.width,height:config.height});
      await page.locator('#import-save').setInputFiles({name:'teste-layout-apoio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(visualFixture('support')))});
      await page.waitForFunction(()=>window.paradise.view==='playing');
      if(config.touch){
        await page.locator('[data-touch="interact"]').waitFor({state:'visible'});
        await page.locator('[data-touch="interact"]').tap();
      }else await page.keyboard.press('e');
      await page.waitForFunction(()=>window.paradise.view==='support');
      await inspectPanel(page,result,'apoio-servicos');await assertPaused(page,result);
      for(const [tab,stage] of [['craft','apoio-fabricacao'],['storage','apoio-bau'],['travel','apoio-viagem']]){
        await tap(page,page.locator(`.panel [data-action="tab"][data-value="${tab}"]`),config.touch);
        await inspectPanel(page,result,stage);await assertPaused(page,result);
      }
      await page.locator('#import-save').setInputFiles({name:'teste-layout-chefe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(visualFixture('boss')))});
      await page.waitForFunction(()=>window.paradise.state.boss?.id===19);
      await capture(page,result,'chefe-pocao',hudSelectors,{buttons:true,canvas:true});
      if(config.touch)check(result,await page.locator('[data-touch="potion"]').isVisible(),'Poção ácida acessível no chefe final');
      await page.locator('#import-save').setInputFiles({name:'teste-layout-fenda.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(visualFixture('electric')))});
      await page.waitForFunction(()=>window.paradise.state.electricUnlocked&&window.paradise.view==='playing');
      await capture(page,result,'campo-eletrico',hudSelectors,{buttons:true,canvas:true});
      if(config.touch)check(result,await page.locator('[data-touch="electric"]').isVisible(),'Campo elétrico acessível na fenda');
      check(result,result.javascriptErrors.length===0,'Ausência de erros JavaScript',result.javascriptErrors);
      check(result,result.externalRequests.length===0,'Recursos visuais e interface disponíveis localmente',result.externalRequests);
    }catch(error){check(result,false,`Interação interrompida: ${error.message}`);await page.screenshot({path:resolve(artifactRoot,`${result.name}-erro.png`)}).catch(()=>{});}
    finally{await context.close();result.finished=new Date().toISOString();}
    console.log(`${result.failures.length?'FALHOU':'PASSOU'}: ${result.name} ${config.width}×${config.height}, ${result.stages.length} telas, ${result.failures.length} problemas.`);
    await writeFile(resolve(artifactRoot,'diagnostico.json'),JSON.stringify(report,null,2));
  }
}finally{
  await browser.close();report.finished=new Date().toISOString();
  await writeFile(resolve(artifactRoot,'diagnostico.json'),JSON.stringify(report,null,2));
}
if(report.failures.length){
  console.error(`${report.failures.length} problemas de interface. Diagnóstico: tests/artifacts/layout/diagnostico.json`);
  process.exitCode=1;
}else console.log(`Layout: ${report.cases.length} resoluções, retrato/paisagem, menus, HUD, multitoque, especiais e tela cheia passaram.`);
