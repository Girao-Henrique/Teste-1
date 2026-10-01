const {app,BrowserWindow,protocol,net,ipcMain,dialog,screen}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
app.setName('Paradise');
if(process.env.PARADISE_DATA_DIR)app.setPath('userData',path.resolve(process.env.PARADISE_DATA_DIR));
protocol.registerSchemesAsPrivileged([{scheme:'paradise',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
let window;
app.whenReady().then(async()=>{
  const content=path.resolve(app.getAppPath(),'www');
  protocol.handle('paradise',request=>{
    const url=new URL(request.url);
    if(url.hostname!=='game')return new Response('Não encontrado',{status:404});
    const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
    const file=path.resolve(content,'.'+relative);
    if(!file.startsWith(content+path.sep))return new Response('Acesso negado',{status:403});
    return net.fetch(pathToFileURL(file).toString());
  });
  const available=screen.getPrimaryDisplay().workAreaSize;
  window=new BrowserWindow({width:Math.min(1280,available.width),height:Math.min(800,available.height),minWidth:320,minHeight:280,title:'Paradise?',backgroundColor:'#142f2c',autoHideMenuBar:true,show:false,icon:path.join(__dirname,'icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false,offscreen:!!process.env.PARADISE_SMOKE_TEST}});
  window.removeMenu();
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('paradise://game/'))event.preventDefault();});
  window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  window.on('ready-to-show',()=>{if(!process.env.PARADISE_SMOKE_TEST)window.show();});
  window.webContents.on('before-input-event',(event,input)=>{if(input.key==='F11'&&input.type==='keyDown'){window.setFullScreen(!window.isFullScreen());event.preventDefault();}});
  window.on('close',()=>{window.webContents.executeJavaScript("window.dispatchEvent(new Event('paradise-pause'))").catch(()=>{});});
  ipcMain.handle('app:quit',()=>app.quit());
  ipcMain.handle('app:fullscreen',async()=>{
    const next=!window.isFullScreen();window.setFullScreen(next);
    await new Promise(resolve=>{const timer=setTimeout(resolve,400);window.once(next?'enter-full-screen':'leave-full-screen',()=>{clearTimeout(timer);resolve();});});
    return window.isFullScreen();
  });
  ipcMain.handle('save:export',async(_event,json)=>{
    if(typeof json!=='string'||json.length>8*1024*1024)return {ok:false};
    try{if(JSON.parse(json).version!==1)return {ok:false};}catch{return {ok:false};}
    const result=await dialog.showSaveDialog(window,{title:'Exportar jornada',defaultPath:'Paradise-jornada.json',filters:[{name:'Salvamento do Paradise?',extensions:['json']}]});
    if(result.canceled)return {cancelled:true};
    try{await fs.writeFile(result.filePath,json,'utf8');return {ok:true};}catch{return {ok:false};}
  });
  if(process.env.PARADISE_SMOKE_TEST){
    window.webContents.on('did-finish-load',async()=>{
      const target=path.resolve(process.env.PARADISE_SMOKE_TEST);
      try{
        window.show();window.webContents.focus();window.webContents.startPainting();
        await new Promise(resolve=>setTimeout(resolve,1500));
        const result=await window.webContents.executeJavaScript(`(async()=>{
          const initialView=window.paradise?.view;
          const mark=document.querySelector('.wordmark');
          const brandLoaded=!!mark?.complete&&mark.naturalWidth>0;
          document.querySelector('[data-action="new"]')?.click();
          document.querySelector('[data-action="start"][data-value="normal"]')?.click();
          let dialogues=0;
          while(document.querySelector('[data-action="next"]')&&dialogues<40){document.querySelector('[data-action="next"]').click();dialogues++;}
          await new Promise(resolve=>setTimeout(resolve,200));
          const startX=window.paradise.state.player.x;
          document.body.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,code:'KeyD',key:'d'}));
          await new Promise(resolve=>setTimeout(resolve,350));
          document.body.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,code:'KeyD',key:'d'}));
          const movement=window.paradise.state.player.x-startX;
          document.querySelector('.hud [data-action="pause"]')?.click();
          const paused=window.paradise.state.worldTime;
          const full=await window.ParadiseDesktop.toggleFullscreen();
          await new Promise(resolve=>setTimeout(resolve,220));
          const windowed=await window.ParadiseDesktop.toggleFullscreen();
          return {title:document.title,url:location.href,initialView,view:window.paradise.view,biome:window.paradise.state.biome,
            canvas:!!document.querySelector('#world'),nodeExposed:typeof require!=='undefined',brandLoaded,
            fontLoaded:document.fonts.check('16px Paradise'),dialogues,movement,paused:paused===window.paradise.state.worldTime,
            fullscreen:full===true&&windowed===false};
        })()`);
        result.headless=process.platform==='linux'&&process.argv.includes('--ozone-platform=headless');
        await fs.mkdir(target,{recursive:true});await fs.writeFile(path.join(target,'desktop-smoke.json'),JSON.stringify(result,null,2));
        const image=await window.webContents.capturePage();await fs.writeFile(path.join(target,'desktop.png'),image.toPNG());
        app.exit(result.initialView==='title'&&result.view==='pause'&&!result.nodeExposed&&result.brandLoaded&&result.fontLoaded&&result.dialogues===19&&result.movement>10&&result.paused&&(result.fullscreen||result.headless)?0:1);
      }catch(error){console.error(error.message);app.exit(1);}
    });
  }
  await window.loadURL('paradise://game/index.html');
});
app.on('window-all-closed',()=>app.quit());
