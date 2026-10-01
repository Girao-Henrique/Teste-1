const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ParadiseDesktop',{platform:process.platform,toggleFullscreen:()=>ipcRenderer.invoke('app:fullscreen'),exitGame:()=>ipcRenderer.invoke('app:quit'),exportSave:json=>ipcRenderer.invoke('save:export',json)});
