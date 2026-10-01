import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, writeFile, stat, copyFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// Testa o APK incorporado, sem servidor HTTP e sem modificar a campanha por JS.
// O emulador precisa estar iniciado: node tests/android-native.mjs status|install|flow
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'tests/artifacts/android-native');
const sdk=process.env.ANDROID_SDK_ROOT||path.join(root,'.cache/android-sdk');
const serial=process.env.PARADISE_ANDROID_SERIAL||'emulator-5554';
const environment={...process.env,TMPDIR:path.join(root,'.cache/tmp'),ANDROID_SDK_ROOT:sdk,
  ANDROID_USER_HOME:path.join(root,'.cache/android-user'),ANDROID_EMULATOR_HOME:path.join(root,'.cache/android-user'),
  ANDROID_PREFS_ROOT:path.join(root,'.cache/android-user'),ANDROID_AVD_HOME:path.join(root,'.cache/android-user/avd')};
const run=promisify(execFile);
await mkdir(output,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function adb(args,{binary=false,timeout=45000}={}){
  const result=await run(path.join(sdk,'platform-tools/adb'),['-s',serial,...args],
    {cwd:root,env:environment,timeout,maxBuffer:12*1024*1024,encoding:binary?null:'utf8'});
  return binary?result.stdout:result.stdout.trim();
}
function decode(text='') { return text.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); }
function nodes(xml){
  return [...xml.matchAll(/<node\b[^>]*>/g)].map(match=>{
    const data={};for(const attr of match[0].matchAll(/([\w:-]+)="([^"]*)"/g))data[attr[1]]=decode(attr[2]);
    const b=(data.bounds||'').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if(b)data.rect={x:+b[1],y:+b[2],right:+b[3],bottom:+b[4]};
    return data;
  });
}
async function dump(name){
  await adb(['shell','uiautomator','dump','--compressed','/data/local/tmp/paradise-qa.xml']);
  const xml=await adb(['exec-out','cat','/data/local/tmp/paradise-qa.xml']);
  assert(xml.includes('<hierarchy'),'O Android ainda não disponibilizou a árvore de acessibilidade.');
  if(name)await writeFile(path.join(output,`${name}.xml`),xml);
  return nodes(xml);
}
async function screenshot(name){
  await writeFile(path.join(output,`${name}.png`),await adb(['exec-out','screencap','-p'],{binary:true}));
}
function findNode(items,label){
  const matches=items.filter(n=>n.rect&&[(n.text||''),(n['content-desc']||'')].some(v=>v===label||v.startsWith(`${label} `)));
  return matches.find(n=>n.clickable==='true')||matches[0];
}
async function tapNamed(label,items){
  const node=findNode(items||await dump(),label);assert(node,`Elemento Android ausente: ${label}`);
  const r=node.rect;assert(r.right>r.x&&r.bottom>r.y,`Elemento Android sem área: ${label}`);
  await adb(['shell','input','tap',String(Math.round((r.x+r.right)/2)),String(Math.round((r.y+r.bottom)/2))]);
  await pause(1000);
}
async function rotate(orientation){
  await adb(['shell','settings','put','system','accelerometer_rotation','1']);
  await adb(['emu','sensor','set','acceleration',orientation==='portrait'?'0:9.8:0':'9.8:0:0']);
  await pause(4000);
}
async function waitForMenu(){
  const deadline=Date.now()+180000;
  while(Date.now()<deadline){
    try{const items=await dump();if(findNode(items,'Nova jornada'))return items;}
    catch(error){console.log(`Aguardando WebView: ${error.message.split('\n')[0]}`);}
    await pause(3000);
  }
  await screenshot('abertura-incompleta');throw new Error('O menu não apareceu no WebView em 3 minutos. Consulte os registros e a captura.');
}
function validateButtons(items){
  const web=items.find(n=>n.class==='android.webkit.WebView'&&n.rect);assert(web,'WebView nativo ausente');
  const r=web.rect;
  const buttons=items.filter(n=>n.class==='android.widget.Button'&&n.rect&&n.rect.right>n.rect.x&&n.rect.bottom>n.rect.y);
  for(const button of buttons){
    const b=button.rect;assert(b.x>=r.x&&b.y>=r.y&&b.right<=r.right&&b.bottom<=r.bottom,
      `Botão fora da tela: ${button.text||button['content-desc']}`);
  }
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
    const a=buttons[i].rect,b=buttons[j].rect;
    const overlapX=Math.min(a.right,b.right)-Math.max(a.x,b.x),overlapY=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y);
    assert(overlapX<2||overlapY<2,`Botões sobrepostos: ${buttons[i].text||buttons[i]['content-desc']} / ${buttons[j].text||buttons[j]['content-desc']}`);
  }
  return r;
}

const action=process.argv[2]||'status';
if(action==='status'){
  try{
    console.log(JSON.stringify({serial,available:true,bootCompleted:await adb(['shell','getprop','sys.boot_completed']),
      bootAnimation:await adb(['shell','getprop','init.svc.bootanim']),android:await adb(['shell','getprop','ro.build.version.release'])}));
  }catch(error){console.log(JSON.stringify({serial,available:false,error:String(error.stderr||error.message).trim()}));process.exitCode=1;}
}else if(action==='install'){
  assert.equal(await adb(['shell','getprop','sys.boot_completed']),'1','Aguarde o Android concluir o boot.');
  const apk=path.resolve(root,process.argv[3]||'builds/android/Paradise-Android.apk');await stat(apk);
  const snapshot=path.join(output,'Paradise-test.apk');await copyFile(apk,snapshot);
  await writeFile(path.join(output,'installation.json'),JSON.stringify({source:path.relative(root,apk),
    sha256:createHash('sha256').update(await readFile(snapshot)).digest('hex'),installedAt:new Date().toISOString()},null,2)+'\n');
  const installation=await adb(['install','--no-incremental','-r',snapshot],{timeout:180000});
  assert(installation.includes('Success'),installation);await writeFile(path.join(output,'installation.txt'),installation+'\n');
  await adb(['shell','wm','density','320']);
  await adb(['shell','settings','put','global','airplane_mode_on','1']);
  await adb(['shell','svc','wifi','disable']);
  try {await adb(['shell','svc','data','disable']);}
  catch(error){
    // Algumas imagens de teste não oferecem serviço de telefonia. Sem esse
    // serviço e com Wi-Fi desligado, não há transporte móvel para habilitar.
    if(!String(error.stderr).includes("Can't find service: phone"))throw error;
    await writeFile(path.join(output,'network.txt'),'Wi-Fi desligado; serviço de telefonia ausente no AVD.\n');
  }
  await adb(['shell','logcat','-c']);
  console.log(await adb(['shell','am','start','-W','-n','br.paradise.game/.ParadiseActivity'],{timeout:90000}));
  await waitForMenu();await screenshot('01-menu-retrato');
  const title=await dump('01-menu-retrato');validateButtons(title);assert(findNode(title,'Nova jornada'),'Menu do jogo não abriu no WebView offline.');
  console.log('APK instalado e menu incorporado aberto em modo offline.');
}else if(action==='flow'){
  assert.equal(await adb(['shell','getprop','sys.boot_completed']),'1','Aguarde o Android concluir o boot.');
  const results={serial,android:await adb(['shell','getprop','ro.build.version.release']),
    apk:JSON.parse(await readFile(path.join(output,'installation.json'),'utf8')),startedAt:new Date().toISOString(),checks:[]};
  await rotate('landscape');await screenshot('02-menu-paisagem');const title=await dump('02-menu-paisagem');validateButtons(title);
  await tapNamed('Nova jornada',title);await tapNamed('Começar');
  let dialogues=0;
  for(let i=0;i<30;i++){
    const screen=await dump();const label=findNode(screen,'Continuar')?'Continuar':findNode(screen,'Seguir caminho')?'Seguir caminho':null;
    if(!label)break;
    await tapNamed(label,screen);dialogues++;
  }
  assert(dialogues>0&&dialogues<30,`Sequência de abertura inesperada: ${dialogues} falas.`);
  await screenshot('03-jogo-paisagem');const landscape=await dump('03-jogo-paisagem');validateButtons(landscape);
  const joystick=findNode(landscape,'Direcional virtual');assert(joystick,'Direcional virtual ausente no aplicativo.');
  const j=joystick.rect;
  await adb(['shell','input','swipe',String(Math.round((j.x+j.right)/2)),String(Math.round((j.y+j.bottom)/2)),
    String(Math.round(j.x+(j.right-j.x)*.85)),String(Math.round((j.y+j.bottom)/2)),'900']);
  await tapNamed('Atacar');await screenshot('03b-toque-movimento-ataque');
  await tapNamed('Abrir inventário');const inventory=await dump('03c-inventario-paisagem');validateButtons(inventory);await screenshot('03c-inventario-paisagem');await tapNamed('Fechar',inventory);
  await tapNamed('Abrir mapa');const map=await dump('03d-mapa-paisagem');validateButtons(map);await screenshot('03d-mapa-paisagem');await tapNamed('Fechar',map);
  await adb(['shell','input','keyevent','4']);await pause(1500);const paused=await dump('04-pausa-paisagem');
  assert(findNode(paused,'Continuar jornada'),'Botão Voltar nativo não abriu a pausa.');validateButtons(paused);await screenshot('04-pausa-paisagem');
  await tapNamed('Continuar jornada',paused);
  await rotate('portrait');await screenshot('05-jogo-retrato');const portrait=await dump('05-jogo-retrato');validateButtons(portrait);
  await tapNamed('Abrir inventário',portrait);const portraitInventory=await dump('05b-inventario-retrato');validateButtons(portraitInventory);await screenshot('05b-inventario-retrato');await tapNamed('Fechar',portraitInventory);
  await adb(['shell','input','keyevent','4']);await pause(1000);const portraitPause=await dump('06-pausa-retrato');
  assert(findNode(portraitPause,'Continuar jornada'),'A pausa não abriu depois da rotação.');validateButtons(portraitPause);await screenshot('06-pausa-retrato');
  await tapNamed('Continuar jornada',portraitPause);await rotate('landscape');
  await adb(['shell','input','keyevent','3']);await pause(1000);
  await adb(['shell','am','start','-W','-n','br.paradise.game/.ParadiseActivity'],{timeout:90000});await pause(1500);
  const resumed=await dump('07-retomada');assert(findNode(resumed,'Continuar jornada'),'Voltar do segundo plano não manteve a pausa.');
  await screenshot('07-retomada');
  const log=await adb(['shell','logcat','-d','-v','brief']);await writeFile(path.join(output,'logcat.txt'),log);
  const pid=await adb(['shell','pidof','br.paradise.game']);assert(pid,'O processo do jogo foi encerrado durante o teste.');
  const appLog=await adb(['shell','logcat','-d','-v','brief',`--pid=${pid}`]);await writeFile(path.join(output,'app-logcat.txt'),appLog);
  const fatal=appLog.split('\n').filter(line=>/FATAL EXCEPTION|Fatal signal|Uncaught (?:TypeError|SyntaxError|ReferenceError)/.test(line));
  assert.equal(fatal.length,0,fatal.join('\n'));
  results.checks=['APK real offline','menu em paisagem','abertura por toque','direcional e ataque por toque','inventário e mapa em paisagem','pausa pelo botão Voltar','rotação para retrato','inventário e pausa em retrato','retomada do segundo plano','sem exceções fatais no processo do jogo'];
  results.dialogues=dialogues;results.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}else throw new Error('Use status, install ou flow.');
