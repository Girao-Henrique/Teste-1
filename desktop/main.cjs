const {app,BrowserWindow,protocol,net,ipcMain,dialog}=require('electron');
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
  window=new BrowserWindow({width:1280,height:760,minWidth:720,minHeight:405,title:'Paradise?',backgroundColor:'#142f2c',autoHideMenuBar:true,show:false,icon:path.join(__dirname,'icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false,offscreen:!!process.env.PARADISE_SMOKE_TEST}});
  window.removeMenu();
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('paradise://game/'))event.preventDefault();});
  window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  window.on('ready-to-show',()=>{if(!process.env.PARADISE_SMOKE_TEST)window.show();});
  window.webContents.on('before-input-event',(event,input)=>{if(input.key==='F11'&&input.type==='keyDown'){window.setFullScreen(!window.isFullScreen());event.preventDefault();}});
  window.on('close',()=>{window.webContents.executeJavaScript("window.dispatchEvent(new Event('paradise-pause'))").catch(()=>{});});
  ipcMain.handle('app:quit',()=>app.quit());
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
        await new Promise(resolve=>setTimeout(resolve,1500));
        const result=await window.webContents.executeJavaScript(`({title:document.title,url:location.href,view:window.paradise?.view,biome:window.paradise?.state.biome,canvas:!!document.querySelector('#world'),nodeExposed:typeof require!=='undefined'})`);
        await fs.mkdir(target,{recursive:true});await fs.writeFile(path.join(target,'desktop-smoke.json'),JSON.stringify(result,null,2));
        const image=await window.webContents.capturePage();await fs.writeFile(path.join(target,'desktop.png'),image.toPNG());
        app.exit(result.view==='title'&&!result.nodeExposed?0:1);
      }catch(error){console.error(error.message);app.exit(1);}
    });
  }
  await window.loadURL('paradise://game/index.html');
});
app.on('window-all-closed',()=>app.quit());
